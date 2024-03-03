const Jelly = require('jelly.js');
const Color = require('color.js');
const Led = require('led.js');
const Animations = require('animations.js');
const Weather = require('weather.js');

const jellyConfig = {
	scene: {
		/** array of integers in the range [0,100] for the percent brightness in each brightness step. Do not provide 0 or 100, as they are included by default */
		brightnessLevels: [50, 25],
		// TODO: allow scene to set its own framerate
		options: {
			framerate: 30
		},
	},
	wifi: {
		ssid: '',
		password: '',
	},
	time: {
		timezoneOffset: -7,
		area: 'America',
		location: 'Denver',
		dstParameters: [
			60,    // dstOffset (minutes added during DST)
			-7*60, // timezone (minutes)
			1,     // startDowNumber (1 = second week of the month)
			0,     // startDow (0 = sunday)
			2,     // startMonth (2 = march)
			0,     // startDayOffset
			120,   // startTimeOfDay (minutes, 2:00am)
			0,     // endDowNumber (0 = first week of the month)
			0,     // endDow (0 = sunday)
			10,    // endMonth (10 = november)
			0,     // endDayOffset
			120    // endTimeOfDay (minutes, 2:00am)
		]
	},

};

const weatherConfig = {
	userAgent: 'Espruino (ESP32, jelly lamp)',
	// use Weather.getWeatherStationkto determine your forecast office
	forecastOffice: '',
	// use Weather.getWeatherGridpoint(lat, long) to determine your gridX and gridY
	gridX: 0,
	gridY: 0,
};

// maps shortForecast values to weather animations
const weatherAnimations = {
	unknown: Animations.unknown
	// 'Snow Showers'
};

let jelly = new Jelly(D18, jellyConfig);
jelly.setup().then(() => {
	const weatherClient = new Weather(weatherConfig.userAgent);
	console.log('Setup complete.');

	// configure brightness button
	const brightnessButtonPin = D14;
	pinMode(brightnessButtonPin, 'input_pullup');
	const brightnessButtonWatch = setWatch((e) => {
		jelly.setBrightness();
	}, brightnessButtonPin, {repeat: true, edge: 'falling', debounce: 10});

	let updating = false;
	const nextTime = jelly.setUpdateTimes(
		[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
		[1],
		(nextTime) => {
			console.log('Begin update');
			if(updating) {
				console.log('Warning: previous update still in progress. skipping update...');
				return;
			}

			updating = true;
			console.log('Fetching weather data...');
			weatherClient.getWeatherForecastCurrentHour(weatherConfig.forecastOffice, weatherConfig.gridX, weatherConfig.gridY).then((weatherData) => {
			console.log(weatherData);
			console.log('Updating display...');

			const weatherAnimation = weatherAnimations[weatherData.shortForecast] || weatherAnimations.unknown;
			const options = {
				framerate: jelly.config.scene.options.framerate,
				pixelCount: jelly.pixelCount,
				jelly: jelly
			};

			weatherAnimation(weatherData, options).then((scene) => {
				jelly.displayScene(scene);
				updating = false;
				console.log('Update complete.');
				console.log(`Next update at ${nextTime}`);
			});
		}, (err) => {
			console.log(`HTTP ${err.errorType} error ${err.code}: ${err.message}`);
			err.color = {r: 255, g: 255, b: 0};
			jelly.onError(err);
		}).catch((err) => {
			jelly.onError(err);
		});
	});

	jelly.onUpdate(nextTime);
	/*
	Weather.getWeatherForecastCurrentHour(jelly.config.weather.forecastOffice, jelly.config.weather.gridX, jelly.config.weather.gridY).then((data) => {
		console.log(data);
		jelly.display.enableBuffer(jelly.statusScene.variations['default'].buffer);
	}).catch((err) => {
		console.log(`HTTP ${err.errorType} error ${err.code}: ${err.message}`);
		throw err;
	});
	*/
});
