// before flashing, disable bluetooth in console to save memory
// ESP32.enableBLE(false)

var userAgent = 'Espruino (ESP32, jelly lamp)';
var ssid = '';
var password = '';

var weatherForecastOffice = '';
var weatherGridX = 0;
var weatherGridY = 0;

const Wifi = require('Wifi');

const Color = require('color');
const Led = require('led');
const Time = require('time');
const Weather = new (require('weather'))(userAgent);

const Spinner = require('spinner');

// initialize display
D18.mode('output');

const pixelCount = 21;
const display = new Led.Display(D18);
const outerRing = new Led.StripView(12, 0, 'outerRing');
const innerRing = new Led.StripView(8, 12, 'innerRing');
const centerPixel = new Led.StripView(1, 20, 'centerPixel');

// indicates error status
// White: uninitialized
// blue: wifi connection error
// Red: unhandled error
const statusScene = new Led.Scene(pixelCount, 1);
statusScene.variations['default'].buffer.data.fill(255);

display.enableBuffer(Spinner.buffer);

const setup = new Promise((resolve, reject) => {
	// software reset leaves wifi in a connected state, check if we are already connected
	if(Wifi.getDetails().status === 'connected') {
		return resolve();
	}

	const wifiTimeout = setTimeout(() => {
		// Wifi.connect fails to notify us with an error when the wifi connection fails (post event to user fail!)
		// assume failure after the timeout expires.
		const wifiError = new Error('Wifi.connect timed out');
		wifiError.color = {r: 0, g: 0, b: 255};
		reject(wifiError);
	}, 8000);

	Wifi.connect(ssid, {password: password}, (err) => {
		clearTimeout(wifiTimeout);
		if(err) {
			err.color = {r: 0, g: 0, b: 255};
			return reject(err);
		}
		return resolve();
	});
}).then(() => {
	console.log(`Connected to wifi. IP address is: ${Wifi.getIP().ip}`);

	// Mountain Time
	return Time.setLocalTime(-7, 'America', 'Denver').catch((err) => {
		console.log(`Error: setLocalTime: HTTP ${err.errorType} error ${err.code}: ${err.message}`);
		throw err;
	});
}).then(function() {
	console.log(`Time set to ${new Date()}`);
}).catch((err) => {
	console.log(`Unhandled error: ${err.message}`);
	console.log(err);
	console.log(err.stack);
	statusScene.compute(() => {
		return err.color || {r: 255, g: 0, b: 0};
	}).then(() => {
		display.enableBuffer(statusScene.variations['default'].buffer);
		throw err;
	});
});

setup.then(() => {
	Weather.getWeatherForecastCurrentHour(weatherForecastOffice, weatherGridX, weatherGridY).then((data) => {
		console.log(data);
	}).catch((err) => {
		console.log(`HTTP ${err.errorType} error ${err.code}: ${err.message}`);
		throw err;
	});
});

// end main

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
