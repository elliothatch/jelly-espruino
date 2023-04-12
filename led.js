var Neopixel = require('neopixel');
var Color = require('color');
/** 
* Espruino is very slow so we must always precalculate animations before sending them to the LED strip.
* To prevent hanging the current animation we also need to calculate the animations asynchronously.
* Never copy between buffers because it is slow. Instead, allocate a new buffer and Neopixel.write that buffer directly.
*/

/** Display buffers the entire LED strip and sends data over the GPIO pin.
* Use Display to allocate framebuffers and control animations and state changes.
* All animations run at the same fixed framerate and must have the same number of frames per cycle.
* @property buffers: {string: {name: string, data: Uint8ClampedArray, frameCount: number, framerate: number}}
*/
class Display {
	constructor(pin) {
		this.pin = pin;

		this.activeBuffer = null;
		this.animationInterval = null;
		this.currentFrame = 0;
	}

	enableBuffer(buffer, options) {
		options = Object.assign({
			frame: 0,
			framerate: 30,
			playAnimation: true,
			loop: true,
		}, options);

		if(this.animationInterval != undefined) {
			clearInterval(this.animationInterval);
			this.animationInterval = null;
		}

		this.activeBuffer = buffer;
		this.currentFrame = options.frame;

		this.draw();

		if(this.activeBuffer.frameCount > 1 && options.playAnimation) {
			this.animationInterval = setInterval(() => {
				if(!options.loop && this.currentFrame === this.activeBuffer.frameCount - 1) {
					clearInterval(this.animationInterval);
					this.animationInterval = null;
					return;
				}
				this.currentFrame = (this.currentFrame+1) % this.activeBuffer.frameCount;
				this.draw();
				var time = getTime();
			}, 1000/options.framerate);
		}
	}

	draw() {
		const view = new Uint8ClampedArray(
			this.activeBuffer.data.buffer,
			this.currentFrame*(this.activeBuffer.pixelCount*3),
			this.pixelCount*3);

		Neopixel.write(this.pin, view);
	}
}

class StripView {
	/** @param count - number of pixels in the view 
	* @param  offset - number of pixels offset from beginning of the display
	*/
	constructor(length, offset, name) {
		this.length = length;
		this.offset = offset;
		this.name = name || 'unnamed';
	}

	/** @param index - pixel index in the strip
	* @param frame - frame index, defaults to 0
	* @return {r: number, g: number, b: number} with integers [0,255]
	*/
	getRgb(buffer, index, frame) {
		const bufferOffset = 3*((frame || 0) * buffer.pixelCount) + 3*(this.offset + index);
		return {
			g: buffer.data[bufferOffset],
			r: buffer.data[bufferOffset + 1],
			b: buffer.data[bufferOffset + 2]
		};
	}

	/** @param r, g, b - integer [0,255]
	* @param index - pixel index in the strip
	* @param frame - frame index, defaults to 0
	*/
	setRgb(buffer, r, g, b, index, frame) {
		const bufferOffset = 3*((frame || 0) * buffer.pixelCount) + 3*(this.offset + index);
		buffer.data[bufferOffset] = g;
		buffer.data[bufferOffset + 1] = r;
		buffer.data[bufferOffset + 2] = b;
	}

	/** @param h, s, v - number between [0,1]
	* @param index - pixel index in the strip
	* @param frame - frame index, defaults to 0
	*/
	setHsv(buffer, h, s, v, index, frame) {
		const c = Color.HSVtoRGB(h, s, v);
		this.setRgb(buffer, c.r, c.g, c.v, index, frame);
	}
}

class Scene {
	constructor(pixelCount, frameCount, defaultVariationName) {
		this.pixelCount = pixelCount;
		this.frameCount = frameCount;
		this.computeDelay = 0;

		this.variations = {};

		this.addVariation(defaultVariationName || 'default', (r, g, b) => {
			return {r, g, b};
		});
	}

	addVariation(name, modifier) {
		if(this.variations[name] != undefined) {
			throw new Error(`Scene.addVariation: There is already a variation with the name '${name}'`);
		}

		const variation = {
			name: name,
			buffer: {
				data: new Uint8ClampedArray(this.pixelCount * 3 * this.frameCount),
				pixelCount: this.pixelCount,
				frameCount: this.frameCount,
			},
			modifier: modifier,
		};

		this.variations[name] = variation;
		return variation;
	}

	compute(computeFunc, view) {
		if(!view) {
			view = new StripView(this.pixelCount, 0);
		 }
		return new Promise((resolve, reject) => {
			const variations = Object.values(this.variations);

			let pixelIndex = 0;
			let frameIndex = 0;
			let variationIndex = 0;

			const computePixel = () => {
				const color = computeFunc(pixelIndex, frameIndex, view.length, this.frameCount);
				const c = variations[variationIndex].modifier(color.r, color.g, color.b);
				view.setRgb(variations[variationIndex].buffer, c.r, c.g, c.b, pixelIndex, frameIndex);

				variationIndex++;
				if(variationIndex >= variations.length) {
					variationIndex = 0;
					pixelIndex++;
					if(pixelIndex >= view.length) {
						pixelIndex = 0;
						frameIndex++;
						if(frameIndex >= this.frameCount) {
							console.log(`${view.name}: Computed frame ${frameIndex}/${this.frameCount}`);
							return resolve();
						}
						console.log(`${view.name}: Computed frame ${frameIndex}/${this.frameCount}`);
					}
				}
				setTimeout(computePixel, this.computeDelay);
			};

			setTimeout(computePixel, 0);
		});
	}
}

exports = {
	Display: Display,
	StripView: StripView,
	Scene: Scene,
};
