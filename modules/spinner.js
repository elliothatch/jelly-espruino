const Color = require('color.js');
// hardcoded rainbow spinner animation
function computeSpinner(pixelIndex, frameIndex, pixelCount, frameCount) {
	const hue = frameIndex/frameCount + pixelIndex/pixelCount;
	return Color.HSVtoRGB(hue, 1 ,1);
}
// data = new Led.Scene(21, 30).compute(computeSpinner).variations['default'].buffer;

const data = new Uint8ClampedArray([0,255,0,127,255,0,255,255,0,255,127,0,255,0,0,255,0,127,255,0,255,127,0,255,0,0,255,0,127,255,0,255,255,0,255,127,0,255,0,191,255,0,255,127,0,255,0,63,255,0,255,63,0,255,0,127,255,0,255,191,0,255,0,50,255,0,178,255,0,255,204,0,255,76,0,255,0,50,255,0,178,203,0,255,76,0,255,0,50,255,0,178,255,0,255,203,0,255,76,50,255,0,242,255,0,255,76,0,255,0,114,203,0,255,12,0,255,0,178,255,0,255,140,50,255,0,102,255,0,229,255,0,255,153,0,255,25,0,255,0,101,255,0,229,153,0,255,25,0,255,0,101,255,0,229,255,0,255,152,0,255,25,102,255,0,255,216,0,255,25,0,255,0,165,153,0,255,0,38,255,0,229,255,0,255,89,102,255,0,153,255,0,255,229,0,255,101,0,255,0,25,255,0,153,229,0,255,102,0,255,0,25,255,0,152,255,0,255,229,0,255,102,25,255,0,153,255,0,255,165,0,255,0,25,255,0,216,102,0,255,0,89,255,0,255,229,0,255,38,153,255,0,204,255,0,255,178,0,255,51,0,255,0,76,255,0,203,178,0,255,51,0,255,0,76,255,0,203,255,0,255,178,0,255,51,76,255,0,204,255,0,255,114,0,255,0,76,242,0,255,51,0,255,0,140,255,0,255,178,12,255,0,204,255,0,255,255,0,255,127,0,255,0,0,255,0,127,255,0,255,127,0,255,0,0,255,0,127,255,0,255,255,0,255,127,0,255,0,127,255,0,255,255,0,255,63,0,255,0,127,191,0,255,0,0,255,0,191,255,0,255,127,63,255,0,255,255,0,255,203,0,255,76,0,255,0,51,255,0,178,203,0,255,76,0,255,0,50,255,0,178,255,0,255,203,0,255,76,51,255,0,178,255,0,255,203,0,255,12,0,255,0,178,140,0,255,0,50,255,0,242,255,0,255,76,114,255,0,255,203,0,255,153,0,255,25,0,255,0,102,255,0,229,153,0,255,25,0,255,0,102,255,0,229,255,0,255,153,0,255,25,102,255,0,229,255,0,255,153,0,255,0,38,255,0,229,89,0,255,0,102,255,0,255,216,0,255,25,165,255,0,255,153,0,255,101,0,255,0,25,255,0,153,229,0,255,102,0,255,0,25,255,0,152,255,0,255,229,0,255,102,25,255,0,153,255,0,255,229,0,255,101,0,255,0,89,229,0,255,38,0,255,0,152,255,0,255,165,25,255,0,216,255,0,255,101,0,255,51,0,255,0,76,255,0,203,178,0,255,51,0,255,0,76,255,0,204,255,0,255,178,0,255,51,76,255,0,203,255,0,255,178,0,255,51,0,255,0,140,178,0,255,0,12,255,0,204,255,0,255,114,76,255,0,255,242,0,255,51,0,255,0,0,255,0,127,255,0,255,127,0,255,0,0,255,0,127,255,0,255,255,0,255,127,0,255,0,127,255,0,255,255,0,255,127,0,255,0,0,255,0,191,127,0,255,0,63,255,0,255,255,0,255,63,127,255,0,255,191,0,255,0,0,255,0,50,255,0,178,203,0,255,76,0,255,0,50,255,0,178,255,0,255,203,0,255,76,50,255,0,178,255,0,255,204,0,255,76,0,255,0,50,255,0,242,76,0,255,0,114,255,0,255,203,0,255,12,178,255,0,255,140,0,255,0,50,255,0,102,255,0,229,153,0,255,25,0,255,0,102,255,0,229,255,0,255,152,0,255,25,102,255,0,229,255,0,255,152,0,255,25,0,255,0,102,216,0,255,25,0,255,0,165,255,0,255,152,38,255,0,229,255,0,255,89,0,255,0,102,255,0,153,229,0,255,102,0,255,0,25,255,0,152,255,0,255,229,0,255,102,25,255,0,153,255,0,255,229,0,255,102,0,255,0,25,255,0,153,165,0,255,0,25,255,0,216,255,0,255,102,89,255,0,255,229,0,255,38,0,255,0,153,255,0,203,178,0,255,51,0,255,0,76,255,0,204,255,0,255,178,0,255,51,76,255,0,203,255,0,255,178,0,255,50,0,255,0,76,255,0,203,114,0,255,0,76,255,0,255,242,0,255,51,140,255,0,255,178,0,255,0,12,255,0,203,255,0,255,127,0,255,0,0,255,0,127,255,0,255,255,0,255,127,0,255,0,127,255,0,254,255,0,255,127,0,255,0,0,255,0,127,255,0,255,63,0,255,0,127,255,0,255,191,0,255,0,191,255,0,255,127,0,255,0,63,255,0,255,203,0,255,76,0,255,0,50,255,0,178,255,0,255,203,0,255,76,50,255,0,178,255,0,255,204,0,255,76,0,255,0,50,255,0,178,203,0,255,12,0,255,0,178,255,0,255,140,50,255,0,242,255,0,255,76,0,255,0,114,203,0,255,153,0,255,25,0,255,0,101,255,0,229,255,0,255,153,0,255,25,102,255,0,229,255,0,255,152,0,255,25,0,255,0,101,255,0,229,153,0,255,0,38,255,0,229,255,0,255,89,102,255,0,255,216,0,255,25,0,255,0,165,153,0,255,102,0,255,0,25,255,0,152,255,0,255,229,0,255,102,25,255,0,153,255,0,255,229,0,255,102,0,255,0,25,255,0,152,229,0,255,102,0,255,0,89,255,0,255,229,0,255,38,153,255,0,255,165,0,255,0,25,255,0,216,102,0,255,51,0,255,0,76,255,0,203,255,0,255,178,0,255,51,76,255,0,203,255,0,255,178,0,255,51,0,255,0,76,255,0,204,178,0,255,51,0,255,0,140,255,0,255,178,12,255,0,203,255,0,255,114,0,255,0,76,242,0,255,51,0,255,0,0,255,0,127,255,0,255,255,0,255,127,0,255,0,127,255,0,254,255,0,255,127,0,255,0,0,255,0,127,255,0,255,127,0,255,0,0,255,0,191,255,0,255,127,63,255,0,254,255,0,255,63,0,255,0,127,191,0,255,0,0,255,0,50,255,0,178,255,0,255,204,0,255,76,50,255,0,178,255,0,255,204,0,255,76,0,255,0,50,255,0,178,204,0,255,76,0,255,0,50,255,0,242,255,0,255,76,114,255,0,255,204,0,255,12,0,255,0,178,140,0,255,0,50,255,0,101,255,0,229,255,0,255,153,0,255,25,102,255,0,229,255,0,255,152,0,255,25,0,255,0,101,255,0,229,152,0,255,25,0,255,0,101,255,0,255,216,0,255,25,165,255,0,255,152,0,255,0,38,255,0,229,89,0,255,0,101,255,0,153,255,0,255,229,0,255,102,25,255,0,153,255,0,255,229,0,255,102,0,255,0,25,255,0,152,229,0,255,101,0,255,0,25,255,0,153,255,0,255,165,25,255,0,216,255,0,255,102,0,255,0,89,229,0,255,38,0,255,0,153,255,0,204,255,0,255,178,0,255,51,76,255,0,203,255,0,255,178,0,255,50,0,255,0,76,255,0,204,178,0,255,50,0,255,0,76,255,0,204,255,0,255,114,76,255,0,255,242,0,255,50,0,255,0,140,178,0,255,0,12,255,0,204,255,0,255,255,0,255,127,0,255,0,127,255,0,255,255,0,255,127,0,255,0,0,255,0,127,255,0,255,127,0,255,0,0,255,0,127,255,0,255,255,0,255,63,127,255,0,255,191,0,255,0,0,255,0,191,127,0,255,0,63,255,0,255,255,0,255,203,0,255,76,51,255,0,178,255,0,255,204,0,255,76,0,255,0,50,255,0,178,204,0,255,76,0,255,0,51,255,0,178,255,0,255,203,0,255,12,178,255,0,255,140,0,255,0,50,255,0,242,76,0,255,0,114,255,0,255,203,0,255,152,0,255,25,102,255,0,229,255,0,255,152,0,255,25,0,255,0,101,255,0,229,152,0,255,25,0,255,0,102,255,0,229,255,0,255,152,38,255,0,229,255,0,255,89,0,255,0,101,216,0,255,25,0,255,0,165,255,0,255,152,0,255,102,25,255,0,153,255,0,255,229,0,255,102,0,255,0,25,255,0,152,229,0,255,101,0,255,0,25,255,0,152,255,0,255,229,0,255,102,89,255,0,255,229,0,255,38,0,255,0,152,165,0,255,0,25,255,0,216,255,0,255,102,0,255,51,76,255,0,203,255,0,255,178,0,255,50,0,255,0,76,255,0,204,178,0,255,50,0,255,0,76,255,0,204,255,0,255,178,0,255,51,140,255,0,255,178,0,255,0,12,255,0,204,114,0,255,0,76,255,0,255,242,0,255,51]);

const buffer = {
	data: data,
	pixelCount: 21,
	frameCount: 30,
};

exports = {
	data,
	buffer
};