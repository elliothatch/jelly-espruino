// before flashing, disable bluetooth in console to save memory
// ESP32.enableBLE(false)
var userAgent = 'Espruino (ESP32, jelly lamp)';
var ssid = '';
var password = '';

var Time = require('time');
var Weather = new (require('weather'))(userAgent);
var Led = require('led');

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

function main() {
	var display = new Led.Display(D18, 21);
	var outerRing = new LedStrip(display, 12, 0);
	var innerRing = new LedStrip(display, 8, 12);
	var centerPixel = new LedStrip(display, 1, 20);

	display.draw();

	var wifi = require('Wifi');
	wifi.connect(ssid, {password: password}, function(err) {
		if(err) {
			console.log(`Failed to connect to wifi: ${err.message}`);
			console.log(err);
			return;
		}

		console.log(`Connected to Wifi. IP address is: ${wifi.getIP().ip}`);

		Time.setLocalTime(-7, 'America', 'Denver').then(function() {
			console.log(`Time set to ${new Date()}`);
		}).catch(function(err) {
			console.log(`Error: setLocalTime: HTTP ${err.errorType} error ${err.code}: ${err.message}`);
		});

		// getWeatherGridpoint('', '').then(function(data) {
		// getWeatherStation('', 0, 0).then(function(data) {
		// getWeatherForecastHourly('', 0, 0).then(function(data) {
		/*
		getWeatherForecastCurrentHour('', 0, 0).then(function(data) {
			console.log(data);
		}).catch(function(err) {
			console.log(`HTTP ${err.errorType} error ${err.code}: ${err.message}`);
			console.log(err.stack);
		});
		*/
	});
}

main();

// D18.mode('output');

var neopixel = require('neopixel');
var Led = require('led');
var display = new Led.Display(D18, 21);
var outerRing = new Led.StripView(display, 12, 0);
var innerRing = new Led.StripView(display, 8, 12);
var centerPixel = new Led.StripView(display, 1, 20);

display.draw();

outerRing.setPixelsSmoothly([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], {r: 255, g: 0, b: 0});
outerRing.setPixelsSmoothly([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], {r: 0, g: 255, b: 0});
outerRing.setPixelsSmoothly([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], {r: 0, g: 0, b: 0});

outerRing.setPixelsSmoothly([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], {r: 255, g: 0, b: 0}, 1000, 60);
outerRing.setPixelsSmoothly([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], {r: 0, g: 255, b: 0}, 1000, 60);

for(var b = 0; b <= 255; b++) {
	for(var i = 0; i < outerRing.count; i++) {
		outerRing.setRgb(i, {r:b,g:0,b:0});
	}
	outerRing.draw();
}
for(var b = 255; b >= 0; b--) {
	for(var i = 0; i < outerRing.count; i++) {
		outerRing.setRgb(i, {r:b,g:b,b:b});
	}
	outerRing.draw();
}

var frames = [];
for(var i = 0; i <= 10; i++) {
	frames.push(Array(21*3));
	frames[i].fill(Math.floor(i/10 * 255));
}

var neopixel = require('neopixel');
var index = 0;
var increasing = true;
var interval = setInterval(() => {
	neopixel.write(D18, frames[index]);
	if(increasing) {
		index++;
		if(index >= frames.length) {
			increasing = false;
			index--;
		}
	}
	else {
		index--;
		if(index < 0) {
			increasing = true;
			index++;
		}
	}
}, 1000/60);

clearInterval(interval);

for(var i = 0; i < frames.length; i++) {
	neopixel.write(D18, frames[i]);
}


var pixels = Array(21*3);
pixels.fill(0);
for(var b = 0; b <= 255; b++) {
	pixels.fill(b);
	neopixel.write(D18, pixels);
}
for(var b = 255; b >= 0; b--) {
	pixels.fill(b);
	neopixel.write(D18, pixels);
}

var pixels = Array(21*3);
pixels.fill(0);
for(var b = 0; b <= 255; b++) {
	for(var i = 0; i < 21; i++) {
		pixels[i*3] = b;
		pixels[i*3 + 1] = b;
		pixels[i*3 + 2] = b;
	}
	neopixel.write(D18, pixels);
}
for(var b = 255; b >= 0; b--) {
	for(var i = 0; i < 21; i++) {
		pixels[i*3] = b;
		pixels[i*3 + 1] = b;
		pixels[i*3 + 2] = b;
	}
	neopixel.write(D18, pixels);
}

var pixels = Array(12*3);
pixels.fill(0);
for(var b = 0; b <= 255; b++) {
	for(var i = 0; i < 12; i++) {
		pixels[i*3] = b;
	}
	neopixel.write(D18, pixels);
}
for(var b = 255; b >= 0; b--) {
	for(var i = 0; i < 21; i++) {
		pixels[i*3] = b;
	}
	neopixel.write(D18, pixels);
}


// pixels = Array(109*3);
// pixels.fill(0);
// pixels[0] = 255;
// pixels[28*3+1] = 255;
// pixels[52*3+2] = 255;
// pixels[72*3] = 255;
// pixels[88*3+1] = 255;
// pixels[100*3+2] = 255;
// pixels[108*3] = 255;

// var offset = 88;
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
