process.memory()
ESP32.getState()

// rainbow
var neopixel = require('neopixel');
var Color = require('color');
var pixelCount = 21;
var frameCount = 30*2;
var frames = new Uint8ClampedArray(pixelCount*3 * frameCount);

for(var i = 0; i < frameCount; i++) {
	console.log(i + '/' + frameCount);
	for(var j = 0; j < pixelCount; j++) {
		var hue = i/frameCount + j/pixelCount;
		var c = Color.HSVtoRGB(hue, 1 ,1)
		var frameOffset = i*pixelCount*3;
		var pixelOffset = j*3;
		frames[frameOffset + pixelOffset] = c.g;
		frames[frameOffset + pixelOffset + 1] = c.r;
		frames[frameOffset + pixelOffset + 2] = c.b;
	}
}

var frame = 0;
var interval = setInterval(() => {
	var view = new Uint8ClampedArray(frames.buffer, frame*(pixelCount*3), pixelCount*3);
	neopixel.write(D18, view);
	frame = (frame+1) % frameCount;
}, 1000/30);


var frames2 = new Uint8ClampedArray(pixelCount*3 * frameCount);
var processFrame = 0;
var processPixel = 0;
function updatePixel() {
	// var hue = processFrame/frameCount + processPixel/pixelCount;
	// var c = Color.HSVtoRGB(hue, 1 ,1)
	var c = {
		r: Math.floor(processFrame/frameCount*255),
		g: Math.floor(processFrame/frameCount*255),
		b: Math.floor(processFrame/frameCount*255),
	};
	var frameOffset = processFrame*pixelCount*3;
	var pixelOffset = processPixel*3;
	frames2[frameOffset + pixelOffset] = c.g;
	frames2[frameOffset + pixelOffset + 1] = c.r;
	frames2[frameOffset + pixelOffset + 2] = c.b;

	processPixel++;

	if(processPixel > pixelCount) {
		processFrame++;
		if(processFrame > frameCount) {
			return;
		}
		console.log(processFrame + '/' + frameCount);
	}
	setTimeout(updatePixel, 0);
}

setTimeout(updatePixel, 0);

clearInterval(interval);
interval = setInterval(() => {
	var view = new Uint8ClampedArray(frames2.buffer, frame*(pixelCount*3), pixelCount*3);
	neopixel.write(D18, view);
	frame = (frame+1) % frameCount;
}, 1000/30);



var userAgent = 'Espruino (ESP32, jelly lamp)';
var ssid = '';
var password = '';
var wifi = require('Wifi');
wifi.connect(ssid, {password: password}, function(err) {
	if(err) {
		console.log(`Failed to connect to wifi: ${err.message}`);
		console.log(err);
		return;
	}

	console.log(`Connected to Wifi. IP address is: ${wifi.getIP().ip}`);
});

var w = require('weather');
var Weather = new w(userAgent);
Weather.getWeatherForecastCurrentHour('', 0, 0).then(function(data) {
	console.log(data);
}).catch(function(err) {
	console.log(`HTTP ${err.errorType} error ${err.code}: ${err.message}`);
	console.log(err.stack);
});
