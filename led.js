var Neopixel = require('neopixel');
var Color = require('color');
/** 
* Espruino is very slow so we must always precalculate animations before sending them to the LED strip.
* To prevent hanging the current animation we also need to calculate the animations asynchronously.
* Never copy between buffers because it is slow. Instead, allocate a new buffer and Neopixel.write that buffer directly.
*/

/** Display sends buffer pixel data to its target pin for single frames and animations
*/
class Display {
	constructor(pin) {
		this.pin = pin;

		this.activeBuffer = null;
		this.animationInterval = null;
		this.currentFrame = 0;

		pin.mode('output');
	}

	/** Send buffer data to the Display's LED-out PIN. if the buffer has more than one frame, play the animation with the given options
	* @param buffer - frame/animation buffer: {
	*    data: Uint8ClampedArray(3*pixelCount*frameCount),
	*    pixelCount: number,
	*    frameCount: number
	* }
	* @param options - {frame: number, framerate: number, playAnimation: boolean, loop: animation}.
	* - frame: frame number to draw/start the animation on. Default: 0
	* - framerate: fps for animation playback. Default: 30
	* - playAnimation: if true and the buffer has more than one frame, plays the animation. if false, just draws the specified frame and exits. Default: true
	*   - loop: loops the animation if true. Default: true
	*/
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

	/** Output to the LED pin with the current frame of data from the active buffer. Set active buffer with enableBuffer */
	draw() {
		const view = new Uint8ClampedArray(
			this.activeBuffer.data.buffer,
			this.currentFrame*(this.activeBuffer.pixelCount*3),
			this.pixelCount*3);

		Neopixel.write(this.pin, view);
	}
}

/** StripView makes it easier to get and set color values in a subsection of a strip. */
class StripView {
	/** @param count - number of pixels in the view 
	* @param  offset - number of pixels offset from beginning of the display
	* @param name - can be used to identify the view in console output
	*/
	constructor(length, offset, name) {
		this.length = length;
		this.offset = offset;
		this.name = name;
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

/** A Scene manages a group of buffers and provides the `compute()` function to asynchronously update values in the buffers to prevent hanging.
* Variations may be created in a scene, to automatically prerender "modified" versions of the scene e.g. to generate multiple brightness levels.
* Note that we can only send an entire strip's worth of data to the output pin (via Display), so a scene must encompass the entire strip. You cannot create a scene just for part of a view, or have a different number of animation frames for a section of the scene.. However, you can provide `compute()` with a view to only update a slice of the buffer.
*/
class Scene {
	/** @param pixelCount - number of pixels in the scene.
	* @param frameCount - number of animation frames in the scene
	* @param options - {name: string, defaultVariationName: string, computeDelay: number}
* - name: name of the scene. used to identify the scene in console output. Default: 'unnamed-scene'
*   - defaultVariationName - when creating a scene, it always creates the first buffer--the 'default' variation with the identity function as the modifier. Set this variable to give the default variation a custom name. Default: 'default'
*   computeDelay: number of milliseconds to wait between computeFunc() calls. Can be increased to give other processes in the program more time so compute() doesn't hog all the resources. Usually best to keep this at 0, and instead reduce the amount of time spent in computeFunc(), by,  precalculating values before calling `compute()`
	*/
	constructor(pixelCount, frameCount, options) {
		this.pixelCount = pixelCount;
		this.frameCount = frameCount;
		this.options = Object.assign({
			name: 'unnamed-scene',
			defaultVariationName: 'default',
			computeDelay: 0
			}, options);

		this.variations = {};

		this.addVariation(this.options.defaultVariationName, (r, g, b) => {
			return {r, g, b};
		});
	}

	/** create a variation of the scene. Each variation allocates a new buffer for the size of the entire scene (3*pixelCount*frameCount).
	* @param name - name of the scene variation. must be unique within the scene.
	* @param modifier - (r: number, g: number, b: number) => {r: number, g: number: b: number}, with integer values in the range [0,255]. A function to modify the input color. Anytime `compute()` is used, the return value of the computeFunc is first passed through `modifier()` before the final result is applied to the buffer.
* @returns the variation, an object of the form {name: string, buffer: Buffer, modifier: (r,g,b) =>{r,g,b}}
	*/
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

	/** Use `compute()` to asynchronously update the pixel values in the scene's animation.
* @param computeFunc - a function that is called once for every pixel in every frame in the scene. it must return a color object {r, g, b}, where r, g, and b are integers in the range [0,255]. The return value is fed into each variation's `modifier()` function, and the final result is applied to each variation's buffer.
* Uses a 0ms `setTimeout()` between each `computeFunc()` call so it doesn't hang the program.
* Signature: (pixelIndex: number, frameIndex: number, pixelCount: number, frameCount: number) => {r: number, g: number, b: number}
* @param view - StripView (optional). If provided, `computeFunc()` will only be called for the buffer pixels accessible by the StripView.
	*/
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
							console.log(`${this.options.name}${view.name? '/' + view.name: ''}: Computed frame ${frameIndex}/${this.frameCount}`);
							return resolve();
						}
							console.log(`${this.options.name}${view.name? '/' + view.name: ''}: Computed frame ${frameIndex}/${this.frameCount}`);
					}
				}
				setTimeout(computePixel, this.options.computeDelay);
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
