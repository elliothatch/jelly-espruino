var Neopixel = require('neopixel');
var Color = require('color');
/** Display buffers the entire LED strip and sends data over the GPIO pin.
* color updates should be sent to the Display via a "View" (e.g. StripView)
*/
class Display {
	constructor(pin, count) {
		this.pin = pin;
		this.count = count;
		this.buffer = Array(count * 3);
		this.buffer.fill(0);
	}

	draw() {
		Neopixel.write(D18, this.buffer);
	}
}

/** StripView represents a linear segment of the Display.
* a number of modifiers can be added to the strip. when setPixel is called, each modifier is applied to the color before it is finally applied directly to the Display buffer.
*/
class StripView {
	constructor(display, count, offset) {
		this.display = display;
		this.count = count;
		this.offset = offset;

		this.modifiers = [];
	}

	draw() {
		this.display.draw();
	}

	getRgb(index) {
		return {
			r: this.display.buffer[(this.offset + index)*3 + 1],
			g: this.display.buffer[(this.offset + index)*3],
			b: this.display.buffer[(this.offset + index)*3 + 2]
		};
	}

	setPixel(index, color) {
		var outputColor = this.modifiers.reduce((c, modifier) => {
			return modifier(color, {
				index: index,
				view: this
			});
		}, color);

		if(outputColor.h != undefined) {
			this.setHsv(index, outputColor);
		}
		else {
			this.setRgb(index, outputColor);
		}
	}

	setPixelsSmoothly(indexes, color, transitionTime, framerate) {
		if(transitionTime == undefined) {
			transitionTime = 500;
		}
		if(framerate == undefined) {
			framerate = 30;
		}
		if(color.r != undefined) {
			color = Color.RGBtoHSV(color.r, color.g, color.b);
		}

		var startColorsHsv = indexes.map((i) => {
			var rgb = this.getRgb(i);
			return Color.RGBtoHSV(rgb.r, rgb.g, rgb.b);
		});
		var frames = Math.floor(transitionTime / (1000/framerate));

		var animation = new Animation(framerate, (view, frame, a) => {
			if(frame > frames) {
				a.stop();
				return;
			}

			var t = frame / frames;
			startColorsHsv.forEach((hsvStart, i) => {
				var c = Color.lerpHsv(hsvStart.h, hsvStart.s, hsvStart.v, color.h, color.s, color.v, t);
				view.setPixel(indexes[i], c);
			});

			view.draw();
		});
		animation.start(this);
		return animation;
	}

	/** directly modify the underlying buffer */
	setRgb(index, rgb) {
		this.display.buffer[(this.offset + index)*3] = rgb.g;
		this.display.buffer[(this.offset + index)*3 + 1] = rgb.r;
		this.display.buffer[(this.offset + index)*3 + 2] = rgb.b;
	}
	setHsv(index, hsv) {
		this.setRgb(index, Color.HSVtoRGB(hsv.h, hsv.s, hsv.v));
	}
}

/** Modifiers apply transformations to a color immediately when a pixel is set.
* Every modifier MUST be an object with a `modify(color, data)` function. `data` is the object `{index: number, view: StripView}`
* @param pixels - either a single rgb color or an array of rgb colors. if a single color, it is applied to all modified pixels. if an array, each color is used to modify the corresponding pixel in the view
* */

class BlendModifier {
	constructor(blendMode, pixels) {
		this.blendMode = blendMode;
		this.pixels = pixels;
	}

	modify(color, data) {
		if(Array.isArray(this.pixels) && data.index >= this.pixels.length) {
			return color;
		}

		var blendPixel = Array.isArray(this.pixels)?
			this.pixels[data.index]:
			this.pixels;

		switch(this.blendMode) {
			case BlendModifier.BlendMode.ADD:
				return {
					r: Math.min(255, color.r + blendPixel.r),
					g: Math.min(255, color.g + blendPixel.g),
					b: Math.min(255, color.b + blendPixel.b),
				};
			case BlendModifier.BlendMode.SUBTRACT:
				return {
					r: Math.max(0, color.r - blendPixel.r),
					g: Math.max(0, color.g - blendPixel.g),
					b: Math.max(0, color.b - blendPixel.b),
				};
			case BlendModifier.BlendMode.MULTIPLY:
				return {
					r: Math.floor(color.r * blendPixel.r / 255),
					g: Math.floor(color.g * blendPixel.g / 255),
					b: Math.floor(color.b * blendPixel.b / 255),
				};
			default:
				return color;
		}
	}
}

BlendModifier.BlendMode = {
	ADD: 'ADD',
	SUBTRACT: 'SUBTRACT',
	MULTIPLY: 'MULTIPLY',
};

/** an animation sets the pixels in a view at the given framerate. it can be given either a fixed set of frames, or a callback for dynamic animations
* @param frames - Array of rgb[], where each element contains an array of each color in the frame of the animation, or a callback with the signature (view, frameNum, animation)
*/

class Animation {
	constructor(framerate, frames) {
		this.framerate = framerate;
		this.frames = frames;
		this.loop = false;

		this.interval = null;
		this.frame = 0;
	}

	/** start/resume the animation. if this.frames is a callback, the value of `loop` is meaningless */
	start(view, loop) {
		this.loop = loop || false;
		var callback = typeof this.frames == 'function'? this.frames: this.animateFrame;
		this.interval = setInterval(() => {
			callback(view, this.frame, this);
			this.frame++;

			if(Array.isArray(this.frames) && this.frame > this.frames.length) {
				this.frame = 0;
			}
		}, 1000/this.framerate);
	}

	pause() {
		if(this.interval != null) {
			clearInterval(this.interval);
			this.interval = null;
		}
	}

	stop() {
		this.pause();
		this.frame = 0;
	}

	/** animateFrame is used as an unbound callback. do not use `this` inside animateFrame */
	animateFrame(view, frame, animation) {
		var frameColors = animation.frames[frame];
		for(var i = 0; i < frameColors.length; i++) {
			view.setPixel(i, frameColors[i]);
		}
	}
}

exports = {
	Display: Display,
	StripView: StripView,
	Animation: Animation,
	BlendModifier: BlendModifier,
};
