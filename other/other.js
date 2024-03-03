/* Example getWeatherForecastCurrentHour output
{ "number": 1,
  "name": "",
  "startTime": "2023-04-12T15:00:00-06:00",
  "endTime": "2023-04-12T16:00:00-06:00",
  "isDaytime": true,
  "temperature": 74,
  "temperatureUnit": "F",
  "temperatureTrend": null,
  "probabilityOfPrecipitation": {
    "unitCode": "wmoUnit:percent",
    "value": 5 },
  "dewpoint": {
    "unitCode": "wmoUnit:degC",
    "value": -1.66666666666 },
  "relativeHumidity": {
    "unitCode": "wmoUnit:percent",
    "value": 19 },
  "windSpeed": "16 mph",
  "windDirection": "S",
  "icon": "https://api.weather.gov/icons/land/day/bkn,5?size=small",
  "shortForecast": "Mostly Cloudy",
  "detailedForecast": ""
 }
*/

// let weatherUpdateInterval = null;
// setup.then(() => {
	// weatherUpdateInterval = setInterval(() => {
	// }, 
// });

	// getWeatherGridpoint('', '').then(function(data) {});
	// getWeatherStation('', 0, 0).then(function(data) {});
	// getWeatherForecastHourly('', 0, 0).then(function(data) {});
	// return getWeatherForecastCurrentHour('', 0, 0).then(function(data) {
		// console.log(data);
	// }).catch(function(err) {
		// console.log(`HTTP ${err.errorType} error ${err.code}: ${err.message}`);
		// throw err;
	// });

function computeRainbow(pixelIndex, frameIndex, pixelCount, frameCount) {
	const hue = frameIndex/frameCount + pixelIndex/pixelCount;
	return Color.HSVtoRGB(hue, 1 ,1);
}

/** gives the brightnesses for a circular moon phase display that mimics the illumination of the moon. e.g. at the first quarter, the right half of the display will be lit up and left will be dark.
* assumes LED 0 at right of circle and increases counter-clockwise
* @param phase - value from [0,1] representing the phase of the moon. see calculateMoonPhase
* @param ledCount - number of leds in the ring
* @returns a list of brightnesses [0,1] */
function calculateMoonDisplay(phase, ledCount, attenuationDistance, terminatorOffset) {
	// model the moon as a circle with left edge at -1 and right edge at 1.
	// approximate the semi-ellipse shape of the crecent terminator line as a vertical line sweeping across the moon.
	// points directly on the terminator line have brightness 0.5, and gradually increase/decrease to full/min brightness up to the attenuation distance
	// additionally, the terminator extends past the ends of the moon by the attenuation distance + terminator offset so we have complete full/new moons.
	if(attenuationDistance == undefined) {
		attenuationDistance = 0.2;
	}
	if(terminatorOffset == undefined) {
		terminatorOffset = attenuationDistance/4;
	}

	var ledPositions = [];
	var ledAngle = Math.PI*2/ledCount;
	for(var i = 0; i < ledCount; i++) {
		ledPositions.push({
			x: Math.cos(i*ledAngle),
			y: Math.sin(i*ledAngle)
		});
	}

	var terminatorMax = 1 + terminatorOffset + attenuationDistance;
	var terminatorX = (2*(phase % 0.5))*(2*-terminatorMax) + terminatorMax;

	var brightness = ledPositions.map(function(pos) {
		var delta = pos.x - terminatorX;
		if(delta < -attenuationDistance) {
			return 0;
		}
		else if(delta > attenuationDistance) {
			return 1;
		}
		else {
			// lerp across attenuation distance
			return (delta + attenuationDistance)/(2*attenuationDistance);
		}
	});

	if(phase >= 0.5) {
		// the waning moon is just the waxing moon but with inverted values
		brightness = brightness.map(function(b) {
			return 1 - b;
		});
	}

	return brightness;
}

var offset = 0;
var phase = 0;
var attenuation = 0.3;
var moonInterval = setInterval(function() {
	var brightness = calculateMoonDisplay(phase, 12, attenuation);
	for(var i = 0; i < brightness.length; i++) {
		var b = Math.floor(brightness[i]*255);
		pixels[(offset+i)*3] = b;
		pixels[(offset+i)*3 + 1] = b;
		pixels[(offset+i)*3 + 2] = b;
	}

	neopixel.write(D18, pixels);

	phase = (phase + 0.01) % 1;
}, 1000/30);


neopixel.write(D18, [255, 0, 0]);


var brightness = calculateMoonDisplay(calculateMoonPhase(new Date()), 12, 0.5);
for(var i = 0; i < brightness.length; i++) {
	var b = Math.floor(brightness[i]*255);
	pixels[(88+i)*3] = b;
	pixels[(88+i)*3 + 1] = b;
	pixels[(88+i)*3 + 2] = b;
}

neopixel.write(D18, pixels);
