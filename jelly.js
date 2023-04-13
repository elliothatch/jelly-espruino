const Wifi = require('Wifi');

// custom modules, flashed to Espruino "Storage". Names must not collide with module at http://www.espruino.com/modules/
const Led = require('led');
const Time = require('time');
const Spinner = require('spinner');

/** @returns a date set to the next upcoming trigger. see Jelly.setUpdateTimes() */
function calculateNextUpdateTime(hours, minutes, startDate) {
	// calculate when the next trigger occurs
	let nextHour = null;
	let nextMinute = null;
	let nextDay = false;
	for(var i = 0; i < hours.length; i++) {
		if(hours[i] == startDate.getHours()) {
			// current hour, trigger on next minute
			nextHour = hours[i];
			for(var j = 0; j < minutes.length; j++) {
				if(minutes[j] > startDate.getMinutes()) {
					nextMinute = minutes[j];
					break;
				}
			}
			if(nextMinute == null) {
				// did not find a minute trigger later in the hour
				// use the first minute trigger at the next hour
				nextMinute = minutes[0];
				if(i < hours.length - 1) {
					nextHour = hours[i+1];
				}
				else {
					// there is no next hour, so use the first hour on the next day
					nextHour = hours[0];
					nextDay = true;
				}
			}
			break;
		}
		else if(hours[i] > startDate.getHours()) {
			// later hour. trigger on first minute of the hour
			nextHour = hours[i];
			nextMinute = minutes[0];
			break;
		}
	}

	if(!nextHour) {
		// we are later than any of the trigger hours. trigger at the first time on the next day
		nextHour = hours[0];
		nextMinute = minutes[0];
		nextDay = true;
	}

	const nextTime = new Date(startDate.getTime());
	nextTime.setHours(nextHour);
	nextTime.setMinutes(nextMinute);
	if(nextDay) {
		nextTime.setDate(startDate.getDate() + 1);
	}

	nextTime.setSeconds(0);
	nextTime.setMilliseconds(0);

	return nextTime;
}

class Jelly {
	constructor(pin, config) {
		this.pin = pin;
		this.config = config;

		this.pixelCount = 21;
		this.display = new Led.Display(this.pin);
		this.outerRing = new Led.StripView(12, 0, 'outerRing');
		this.innerRing = new Led.StripView(8, 12, 'innerRing');
		this.centerPixel = new Led.StripView(1, 20, 'centerPixel');

		// indicates error status
		// White: uninitialized status
		// blue: wifi connection error
		// Red: unhandled error
		// Yellow: weather data error (e.g. failed to reach NWS).
		this.statusScene = new Led.Scene(this.pixelCount, 1);
		this.statusScene.variations['default'].buffer.data.fill(255);

		// used when brightness === 0
		this.blankScene = new Led.Scene(this.pixelCount, 1);
		this.blankScene.variations['default'].buffer.data.fill(0); // not strictly necessary

		// initialize main scenes
		// array of two scenes. one scene is rendered to as the offscreen buffer while the other one is being displayed
		this.mainScenes = [
			new Led.Scene(this.pixelCount, this.config.scene.frameCount, {
				name: 'main-0',
				defaultVariationName: '100',
			}),
			new Led.Scene(this.pixelCount, this.config.scene.frameCount, {
				name: 'main-1',
				defaultVariationName: '100',
			})
		];

		this.mainScenes.forEach((scene) => {
			this.config.scene.brightnessLevels.forEach((brightness) => {
				scene.addVariation('' + brightness, (r, g, b) => {
					return {
						r: Math.floor(r * brightness/100),
						g: Math.floor(g * brightness/100),
						b: Math.floor(b * brightness/100),
					};
				});
			});
		});

		this.brightnessLevels = [100].concat(this.config.scene.brightnessLevels).concat(0);
		this.brightnessIndex = 0;

		// 0, 1, or null. indicates which this.mainScenes index is being displayed
		this.activeSceneIndex = null;

		this.updateTimeout = null;
		this.onUpdate = null;
	}

	setup() {
		this.display.enableBuffer(Spinner.buffer);

		return new Promise((resolve, reject) => {
			// connect to wifi

			// software reset leaves wifi in a connected state, check if we are already connected
			if(Wifi.getDetails().status === 'connected') {
				return resolve();
			}

			const wifiTimeout = setTimeout(() => {
				// Wifi.connect fails to notify us with an error when the wifi connection fails (E: post event to user fail!)
				// assume failure after the timeout expires.
				const wifiError = new Error('Wifi.connect timed out');
				wifiError.color = {r: 0, g: 0, b: 255};
				reject(wifiError);
				}, 8000);

			Wifi.connect(this.config.wifi.ssid, {password: this.config.wifi.password}, (err) => {
				clearTimeout(wifiTimeout);
			if(err) {
					err.color = {r: 0, g: 0, b: 255};
					return reject(err);
				}
				return resolve();
			});
		}).then(() => {
			console.log(`Connected to wifi. IP address is: ${Wifi.getIP().ip}`);

			// initialize clock to Mountain Time
			return Time.setLocalTime(
					this.config.time.timezoneOffset,
					this.config.time.area,
					this.config.time.location,
					this.config.time.dstParameters
			).catch((err) => {
				console.log(`Error: setLocalTime: HTTP ${err.errorType} error ${err.code}: ${err.message}`);
				throw err;
			});
		}).then(function() {
			console.log(`Time set to ${new Date()}`);
		}).catch((err) => {
			return this.onError(err);
		});
	}

	/** display the error status on the LED display, then return Promise.reject(err) */
	onError(err) {
		console.log(`Unhandled error: ${err.message}`);
		console.log(err);
		this.statusScene.compute(() => {
			return err.color || {r: 255, g: 0, b: 0};
			}).then(() => {
				this.display.enableBuffer(this.statusScene.variations['default'].buffer);
				throw err;
		});
	}

	getOffscreenMainScene() {
		return this.activeSceneIndex == null?
			this.mainScenes[0]:
			this.mainScenes[(this.activeSceneIndex + 1) % 2];
	}

	/** change the brightness level and enable the active mainScene using the new brightness
* @param index - optional index to select the brightness level (see Jelly.config). If undefined, select the next brightness level, looping back to the start if there are no more.
* */
	setBrightness(index) {
		if(index != undefined) {
			this.brightnessIndex = index;
		}
		else {
			this.brightnessIndex = (this.brightnessIndex + 1) % this.brightnessLevels.length;
		}

		const brightness = this.brightnessLevels[this.brightnessIndex];

		if(brightness === 0) {
			this.display.enableBuffer(this.blankScene.variations['default'].buffer);
		}
		else {
			this.display.enableBuffer(
				this.mainScenes[this.activeSceneIndex].variations[brightness].buffer,
				Object.assign(this.config.scene.options, {frame: this.display.currentFrame})
			);
		}
		console.log(`Set brightness: ${brightness}`);
	}

	/** swaps the offsceen main scene buffer to the active buffer and displays its animation
* @returns the now inactive main scene
	*/
	swapMainScene() {
		// swaps the active/offscreen main scene being displayed
		if(this.activeSceneIndex == null) {
			// if no scene active, "swap" to the first scene by pretending we were showing the second scene
			this.activeSceneIndex = 1;
		}

		this.activeSceneIndex = (this.activeSceneIndex + 1) % 2;
		this.display.enableBuffer(
			this.mainScenes[this.activeSceneIndex].variations[this.brightnessLevels[this.brightnessIndex]].buffer,
			Object.assign(this.config.scene.options, {frame: this.display.currentFrame})
		);
	}


	/** triggers the provided function at the specified times. clears any previous timeouts set by this function.
	* @param hours - array containing the hours of the day to trigger the update function. values are integers from [0-23]. must be sorted in ascending order
	* @param minutes - array containing the minutes of the hour to trigger the update function. values are integers from [0-59]. must be sorted in ascending order
	* @param onUpdate (nextTime: Date) => void: callback triggered at the specified time. is passed a Date indicating the next time in the future onUpdate will be called.
* @returns the Date the next update will occur
 */
	setUpdateTimes(hours, minutes, onUpdate) {
		if(this.updateTimeout != undefined) {
			clearTimeout(this.updateTimeout);
			this.updateTimeout = null;
		}

		this.onUpdate = onUpdate;


		const onTimeout = (ignoreUpdate) => {
			const now = new Date();
			const nextTime = calculateNextUpdateTime(hours, minutes, now);
			const timeoutDuration = nextTime - now;

			if(!ignoreUpdate) {
				// don't call onUpdate on the first execution
				this.onUpdate(nextTime);
			}

			this.updateTimeout = setTimeout(onTimeout, timeoutDuration);

			return nextTime;
		};

		return onTimeout(true);
	}
}

exports = Jelly;
