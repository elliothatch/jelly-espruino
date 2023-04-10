var fetch = require('Fetch');

class Weather {

	constructor(userAgent) {
		if(userAgent == undefined) {
			userAgent = 'Espruino';
		}
		this.userAgent = userAgent;
	}

	/** get the NWS gridpoint X,Y for given coordinates. you should run this once with your coordinates and then hard code the results for future
	* @param latitude - string
	* @param longitude - string
	* @returns - a promise that resolves with fetch result with body parsed as json, or rejects with {code, message}
	* */
	getWeatherGridpoint(latitude, longitude) {
		var path = `/points/${latitude},${longitude}`;
		console.log(`GET https://api.weather.gov${path}`);
		return fetch({
			host: 'api.weather.gov',
			path: path,
			method: 'GET',
			protocol: 'https:',
			headers: {
				'User-Agent': this.userAgent,
				'Accept': 'application/geo+json'
			}
		}).then(function(response) {
			response.body = JSON.parse(response.body);
			return response;
		});
	}

	getWeatherStation(wfo, gridX, gridY) {
		var path = `/gridpoints/${wfo}/${gridX},${gridY}/stations`;
		console.log(`GET https://api.weather.gov${path}`);
		return fetch({
			host: 'api.weather.gov',
			path: path,
			method: 'GET',
			protocol: 'https:',
			headers: {
				'User-Agent': this.userAgent,
				'Accept': 'application/ld+json'
			}
		}).then(function(response) {
			response.body = JSON.parse(response.body);
			return response;
		});
	}

	/**
	* @param wfo - weather forecast office (e.g. SLC)
	*/
	getWeatherForecastHourly(wfo, gridX, gridY) {
		var path = `/gridpoints/${wfo}/${gridX},${gridY}/forecast/hourly`;
		console.log(`GET https://api.weather.gov${path}`);
		return fetch({
			host: 'api.weather.gov',
			path: path,
			method: 'GET',
			protocol: 'https:',
			headers: {
				'User-Agent': this.userAgent,
				'Accept': 'application/ld+json'
			}
		}).then(function(response) {
			response.body = JSON.parse(response.body);
			return response;
		});
	}

	/** get hourly forecast, but end the response as soon as we have received the current hour, to save memory.
	* simply ends the response after the data ingested exceeds a certain length. then tries to clean up the JSON.
	*/
	getWeatherForecastCurrentHour(wfo, gridX, gridY) {
		// string length
		var cutoffLength = 3000;
		var path = `/gridpoints/${wfo}/${gridX},${gridY}/forecast/hourly`;
		var options = {
			host: 'api.weather.gov',
			path: path,
			method: 'GET',
			protocol: 'https:',
			headers: {
				'User-Agent': this.userAgent,
				'Accept': 'application/ld+json'
			}
		};
		console.log(`GET https://api.weather.gov${path}`);

		return new Promise((resolve, reject) => {
			var body = '';

			var req = require("http").request(options, function(res) {
				res.on('data', function(data) {
					if(body.length < cutoffLength) {
						body += data;
					}

				});
				res.on('close', function(hadError) {
					// console.log(hadError);
					// if(hadError) {
						// reject({
							// code: res.statusCode,
							// headers: res.headers,
							// body: body
						// });
						// return;
					// }

					// trim back the body until we find the line "number": 2
					var period2Index = body.indexOf('"number": 2,');
					if(period2Index === -1) {
						return reject({
							code: res.statusCode,
							headers: res.headers,
							body: body,
							message: 'Could not find trimming landmark \'"number": 2,\'. Try increasing cutoffLength'
						});
					}

					body = body.substring(0, period2Index);
					var period1EndIndex = body.lastIndexOf('}');
					if(period1EndIndex === -1) {
						return reject({
							code: res.statusCode,
							headers: res.headers,
							body: body,
							message: 'End of period 1 not found'
						});
					}

					body = JSON.parse(body.substring(0, period1EndIndex + 1) + ']\n}\n');

					resolve(body.periods[0]);
				});

				res.on('error', function(err) {
					err.errorType = 'response';
					reject(err);
				});
			});

			req.on('error', function(err) {
				if(err.code === -30848) {
					// mystery error... ignore
					console.log('ignoring http request error -30848...');
					return;
				}

				err.errorType = 'request';
				reject(err);
			});

			req.end();
		});
	}

	calculateDayLength(date, latitude) {
		var jan1 = new Date(date.getFullYear(), 0, 0);
		// msOfYear / msInDay
		var dayOfYear = Math.floor((date - jan1)/(1000*60*60*24));
		var declination = -23.45 * Math.cos(2*Math.PI/365 * (dayOfYear + 10));
		
		var solarHourAngle = 180/Math.PI * Math.acos(-Math.tan(latitude * Math.PI/180) * Math.tan(declination * Math.PI/180));
		// solarHourAngle is the angle between high noon and sunrise. the sun rotates 15 degrees per hour
		return 2 * solarHourAngle/15;
	}

	/** @returns percent of day length between the shortest and longest days. returns 0 on winter solstice (Dec 21) and 1 on summer solstice (Jun 21) */
	calculateDayLengthPercent(date, latitude) {
		var longestDayLength = calculateDayLength(new Date(date.getFullYear(), 5, 21), latitude);
		var shortestDayLength = calculateDayLength(new Date(date.getFullYear(), 11, 21), latitude);
		return Math.max(0, Math.min(1, (calculateDayLength(date, latitude) - shortestDayLength)/(longestDayLength - shortestDayLength)));
	}

	/** calculate the phase of the moon based on a simple appoximation using the mean lunar month duration and the date of the first new moon in 2023
	* @ returns number between [0-1) representing the phase on the moon. 0=new, 0.25=first quarter, 0.5=full, 0.75=third quarter */
	calculateMoonPhase(date) {
		return ((date - Weather.FirstNewMoon)/(Weather.LunationDuration*1000*60*60*24)) % 1;
	}
}

Weather.LunationDuration = 29.53058770576;
Weather.FirstNewMoon = new Date('2023-01-21T20:55:00Z');

exports = Weather;
