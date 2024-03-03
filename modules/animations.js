const Color = require('color.js');
function unknown(weather, options) {
	const minTemp = -30;
	const maxTemp = 130;
	const temperatureColorHsv = Color.lerpGradientHsv([
		{h: 0.555, s: 1, v: 1, t: 0},
		{h: 0.166, s: 1, v: 1, t: 0.25},
		{h: 0, s: 1, v: 1, t: 1},
	], (weather.temperature - minTemp) / (maxTemp - minTemp));

	const temperatureColor = Color.HSVtoRGB(temperatureColorHsv.h, temperatureColorHsv.s, temperatureColorHsv.v);

	const minWindSpeed = 0;
	const maxWindSpeed = 50;
	const windSpeed = parseInt(weather.windSpeed);
	// pulses per second
	const pulseRate = Color.lerp(1/15, 1/2, (windSpeed - minWindSpeed) / (maxWindSpeed - minWindSpeed));

	// the animation is the length of one pulse cycle
	const scene = options.jelly.createScene('unknown', Math.floor(options.framerate/pulseRate));
	// const scene = options.jelly.createScene('unknown', 10);

	console.log('color:', temperatureColor);
	console.log('pulse rate:', pulseRate);

	const minBrightness = 0.5;

	// t is a number between 0 and 1 that starts at the bottom peak of a sin wave, rises to the top peak, and then returns to the bottom
	return scene.compute((pixelIndex, frameIndex, pixelCount, frameCount) => {
		const t = (Math.sin(2*Math.PI*(frameIndex/frameCount)-Math.PI/2)+1)/2;
		return {
			r: Math.floor(temperatureColor.r*(t*(1-minBrightness) + minBrightness)),
			g: Math.floor(temperatureColor.g*(t*(1-minBrightness) + minBrightness)),
			b: Math.floor(temperatureColor.b*(t*(1-minBrightness) + minBrightness)),
		};
	});
}

exports = {
	unknown: unknown
};
