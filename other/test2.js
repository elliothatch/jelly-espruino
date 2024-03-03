// const Led = require('led');

// const display = new Led.Display(D18, 21);
// const buffer = display.allocBuffer('default');
// const outerRing = new Led.StripView(12, 0);
// const innerRing = new Led.StripView(8, 12);
// const centerPixel = new Led.StripView(1, 20);

// for(let i = 0; i < outerRing.count; i++) {
// 	outerRing.setRgb(buffer, 255, 0, 0, i);
// }

// for(let i = 0; i < innerRing.count; i++) {
// 	innerRing.setRgb(buffer, 0, 255, 0, i);
// }

// for(let i = 0; i < centerPixel.count; i++) {
// 	centerPixel.setRgb(buffer, 0, 0, 255, i);
// }

// for(let i = 0; i < centerPixel.count; i++) {
// 	centerPixel.setRgb(buffer, 0, 0, 0, i);
// }

// display.enableBuffer('default');

const Led = require('led');
var Color = require('color');

let display = new Led.Display(D18);
let scene = new Led.Scene(21, 30, 'brightness-100');
let outerRing = new Led.StripView(12, 0, 'outerRing');
let innerRing = new Led.StripView(8, 12, 'innerRing');
let centerPixel = new Led.StripView(1, 20, 'centerPixel');

scene.addVariation('brightness-75', (r, g, b) => {
	return {
		r: Math.floor(r*75 / 255),
		g: Math.floor(g*75 / 255),
		b: Math.floor(b*75 / 255),
	};
});
scene.addVariation('brightness-50', (r, g, b) => {
	return {
		r: Math.floor(r*50 / 255),
		g: Math.floor(g*50 / 255),
		b: Math.floor(b*50 / 255),
	};
});
scene.addVariation('brightness-25', (r, g, b) => {
	return {
		r: Math.floor(r*25 / 255),
		g: Math.floor(g*25 / 255),
		b: Math.floor(b*25 / 255),
	};
});

Promise.all([
	scene.compute((pixelIndex, frameIndex, pixelCount, frameCount) => {
		var hue = frameIndex/frameCount + pixelIndex/pixelCount;
		return Color.HSVtoRGB(hue, 1 ,1);
	}, outerRing),
	scene.compute((pixelIndex, frameIndex, pixelCount, frameCount) => {
		var hue = frameIndex/frameCount + pixelIndex/pixelCount;
		return Color.HSVtoRGB(hue, 1 ,1);
	}, innerRing),
	scene.compute((pixelIndex, frameIndex, pixelCount, frameCount) => {
		var hue = frameIndex/frameCount + pixelIndex/pixelCount;
		return Color.HSVtoRGB(hue, 1 ,1);
	}, centerPixel),
]).then(() => {
	console.log('Computation done');
	display.enableBuffer(scene.variations['brightness-100'].buffer);
});

display.enableBuffer(scene.variations['brightness-75'].buffer);
display.enableBuffer(scene.variations['brightness-50'].buffer);
display.enableBuffer(scene.variations['brightness-25'].buffer);

let scene2 = new Led.Scene(21, 5, 'brightness-100');
// scene2.computeDelay = 0;
// scene2.computeDelay = 1000/30;
scene2.addVariation('brightness-75', (r, g, b) => {
	return {
		r: Math.floor(r*75 / 255),
		g: Math.floor(g*75 / 255),
		b: Math.floor(b*75 / 255),
	};
});
scene2.addVariation('brightness-50', (r, g, b) => {
	return {
		r: Math.floor(r*50 / 255),
		g: Math.floor(g*50 / 255),
		b: Math.floor(b*50 / 255),
	};
});
scene2.addVariation('brightness-25', (r, g, b) => {
	return {
		r: Math.floor(r*25 / 255),
		g: Math.floor(g*25 / 255),
		b: Math.floor(b*25 / 255),
	};
});

Promise.all([
	scene2.compute((pixelIndex, frameIndex, pixelCount, frameCount) => {
		return {
			r: Math.floor(255*Math.sin((frameIndex/frameCount)*Math.PI*2)),
			g: 0,
			b: 0
		};
	}, outerRing),
	scene2.compute((pixelIndex, frameIndex, pixelCount, frameCount) => {
		return {
			r: 0,
			g: Math.floor(255*Math.sin((frameIndex/frameCount)*Math.PI*2)),
			b: 0
		};
	}, innerRing),
	scene2.compute((pixelIndex, frameIndex, pixelCount, frameCount) => {
		return {
			r: 0,
			g: 0,
			b: Math.floor(255*Math.sin((frameIndex/frameCount)*Math.PI*2)),
		};
	}, centerPixel),
]).then(() => {
	console.log('Computation done');
	// display.enableBuffer(scene2.variations['brightness-100'].buffer);
});

display.enableBuffer(scene2.variations['brightness-75'].buffer);
display.enableBuffer(scene2.variations['brightness-50'].buffer);
display.enableBuffer(scene2.variations['brightness-25'].buffer);

// scene.compute(outerRing, (pixelIndex, frameIndex, pixelCount, frameCount) => {
// 	var hue = frameIndex/frameCount + pixelIndex/pixelCount;
// 	return Color.HSVtoRGB(hue, 1 ,1);
// });
