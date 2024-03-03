# Jelly Lamp - Espruino ESP32
This project is an attempt to create an RGB LED (WS2812) jellyfish lamp that responds dynamically to the current weather.

Every hour, the jelly uses a WiFi connection to fetch forecast data from the National Weather Service API, and generates an animation based on the current weather conditions (temperature, wind speed, precipitation, etc.)

The core components of this project include the weather API client, the LED animation manager, and a time-based event system to update the jelly's animation every hour.

The Jelly Lamp uses the [Espruino](https://www.espruino.com/) interpreter to run JavaScript code on an [ESP32](https://www.espruino.com/ESP32).

This project was my introduction to the Espruino interpreter. Unfortunately, the project failed due to the extreme memory limitations of the ESP32 and slow execution speed of Espruino code. The project is succeeded by a FreeRTOS C implementation using the ESP32 native ESP-IDF toolchain.

## Post Mortem
Espruino is a very interesting project, with the potential to make microprocessor programming much more accessible to those with limited coding experience. Unfortunately, the overhead of running an entire JavaScript interpreter was too great for the limited memory and processing capabilities of the ESP32 to make this project viable. It's important to keep in mind that Espruino was not created to run specifically on the ESP32. The open-source JavaScript interpreter is designed for the Espruino boards, a series of open-source microcontrollers manufactured and sold by the Espruino team. Espruino's ESP32 support is not "officially supported" by the project and is maintained through community contributions.

While working on the Jelly Lamp, I ran into several issues due to the limited memory and processing power of the ESP32, and tried to work around those issues as best I could.

### HTTPS
The standard Espruino-ESP32 firmware simply did not have enough heap memory to estabilsh an HTTPS connection to the NWS API. I was able to custom-compile the Espruino firmware with fewer modules and custom configurations to give it _just_ enough heap memory to make the HTTPS connection reliably. See [Custom firmware](#custom-firmware) for details.

I also built a simple `fetch` API to provide a promise-based interface to the Espruino HTTP client.

### LED Animation
I built a simple scene management system for creating and driving animations for a WS2812 addressable RGB LED strip. Its main features include animation playback management, LED organization via display "views" that simplify modification of a specific section of the LED strip, and a system for creating multiple "variations" of the same animation for e.g. different brightness settings.

I quickly discovered that simply iterating over a buffer and setting color values directly was way too slow for any realtime playback. The most basic test case, assigning a constant value for each pixel, takes 2-3 seconds per frame on a 20-pixel long strip. A good lower bound framerate for smooth LED animation is 30 frames per second, so any kind of realtime animation was immediately ruled out.

The ESP32 is just fast enough to update an index into a frame buffer 30 times a second and have some extra processing time to do some background rendering. If the frame data is already in a buffer, ready to be displayed, outputting that data to a GPIO pin in WS2812 line format is not a problem because Espruino is able to leverage hardware functionality. This means that we can play animations at full speed, as long as all the animations for the lamp needed are pre-rendered in the background to an off-screen buffer, and then swapped with the current animation. 

However, Espruino lacks any kind of task prioritization you would get from using a traditional RTOS on a microcontroller, so naively rendering the animations completely blocks the active animation from playing.

The solution is to use the JavaScript event loop to introduce regular interruptions to the pre-rendering code, so the active animation can be updated as needed, every 1/30th of a second. These interruptions come in the form of chained `setTimeout()` calls with a 0 millisecond timeout duration. If you are unfamiliar with the [JavaScript event loop](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop), a simple explanation is that JavaScript execution is triggered by incoming messages, called events. In a web browser, many of these events come from user input. When you click on a button, the browser creates an "click" event and adds it to the end of the event queue. After the JavaScript interpreter has handled all the events from earlier in the queue, it will encounter the "click" event and execute the callback function associated with the button that triggered the event.

Espruino doesn't have user input events like clicks, but many other types of asynchronous events are handled by the event loop too. When you make an HTTP request to a server, the server's response is added to the message queue so other code can run in the meantime. Or if you want to delay the execution of some code, say, to create a countdown timer, you can use the `setTimeout()` function, which adds your callback to the event queue after the timeout has expired. If you call `setTimeout()` with a delay of 0, the callback is immediately appended the queue. This lets the interpreter "interrupt" the current execution context to handle the code from other events before it returns to execute your callback.

This lets us keep the active animation updating at 30 FPS while rendering the next animation in the background, as long as we regularly interrupt our background rendering code at least 30 times a second. To ensure the smoothest possible update rate for the current animation, the Jelly creates a separate background rendering "event" callback for _every pixel of every frame_. The rendering code to fill every frame with red looks like this:

```javascript
scene.compute((pixelIndex, frameIndex, pixelCount, frameCount) => {
    return {
        r: 255,
        g: 0,
        b: 0,
    };
});
```

Behind the scenes, the `compute` function calls our rendering callback within a `setTimeout()` invocation with a 0 millisecond delay, and chains together these timeouts until all the pixels of all the frames in the scene have been rendered. As long as the amount of work we do within the render callback remains small, the active animation runs perfectly smoothly.

There are some significant drawbacks to this system however. All these callbacks add a non-trivial amount of overhead to our already limited processing power, so rendering an animation takes even longer than it did before--taking several minutes to render one or two seconds of animation. Designing and programming an animation this way is more complicated to reason about as well, and for more complex animations may require figuring out how to distribute calculations for advanced processes across individual pixel-rendering callbacks to prevent an animation stutter during initialization.

The biggest problem, and the final nail in the coffin for the Espruino Jelly Lamp, was memory. We're already pushing the memory limits of the ESP32 with a TLS handshake; there simply is not enough spare memory to store two separate display buffers that contain more than a hundred frames or so of animation data. You just can't have the smooth, gentle pulsing of a bioluminescent jellyfish when you're limited to one or two seconds of animation.

### Conclusion
The motivation to use Espruino for the Jelly Lamp was to make programming and tweaking RGB LED animations more accessible to those without extensive programming knowledge. Unfortunately, the hardware constraints surfaced by running an entire JavaScript interpreter on an ESP32 proved to be too great. Even with extensive workarounds, Espruino just doesn't use memory efficiently enough to make the project a reality for any sufficiently interesting animation. The workarounds themselves made writing the animation code complex and convoluted enough that the project failed from the programming accessibility perspective as well, so it failed on all accounts.

It was interesting to try out Espruino, and I think it could be incredibly useful for simpler I/O and smarthome projects that don't involve realtime constraints (like generating and driving animations). However, for my RGB LED animation projects, I will return to using [native C with FreeRTOS](https://github.com/elliothatch/esp32-leds), where I can drive dynamic animations in realtime, with spare memory to store thousands of frames of animation data, without worrying if the JavaScript interpreter will fail to efficiently garbage collect and crash my program.

Below you will find instructions on how to use Espruino on the ESP32, and documentation on how to build and install the Jelly Espruino code.

## Espruino on ESP32

You can find info on how to flash Espruino onto the ESP32, and other useful information at <https://www.espruino.com/ESP32>.

NOTE: There is an issue in the current ESP32 builds that does not allocate enough heap space to support HTTPS. See [Custom firmware](#custom-firmware) below for instruction on building custom firmware with more heap space.

### Setup
1. Plug the ESP32 into USB port.
2. Ensure USB serial interface has read/write access:
```
sudo chmod a+rw /dev/ttyUSB0
```

NOTE: The tty device may change number if the ESP32 is unplugged. You can see what the device name is with the command `ls /dev | grep ttyUSB`.

#### Configure Espruino Web IDE
You must use Google Chrome to open the [Espruino Web IDE](https://www.espruino.com/ide).

Click on the gear in the top right, and change the following settings:
1. Communications > Baud Rate > 115200

#### Connect the Web IDE to the ESP32
Plug in the Esp32 USB connection.  
On Linux, give the USB connection read-write permissions.
```
sudo chmod a+rw /dev/ttyUSB0
```

1. Click the connect button in the top-left corner of the IDE.
2. Select "Web Serial".
3. Scroll to the bottom and select "CP2102N USB to UART Bridge Controller (ttyUSB0) - Paired"

There is a known issue where the Espruino Web IDE will sometimes not be able connect to the board the first time you try. The workaround is to use another tool, like minicom, to connect initially.

```
minicom --baudrate 115200 --device /dev/ttyUSB0
```

After minicom connects, exit without reset by pressing `CTRL-A Q`. Now you can try connecting again with the Espruino Web IDE.

## Upload Code
First, upload the Javascript modules.
1. In the Espruino Web IDE, click the "Storage button" (third down, icon is a tower of disks).
2. Click "Upload files"
3. Select all the files in the `modules` directory.
4. Click "Ok" to upload each file

Next, upload the `main.js` file in "Flash" mode.

1. Copy and paste the contents of `main.js` into the text editor.
2. Set the upload mode to "Flash" by clicking the dropdown on the fourth button in the middle of the IDE (icon is an integrated circuit).
3. Click the button to flash your code.
4. Run `E.reboot()` in the console to reboot the board and execute the newly flashed code, or press the physical reset button on the board.

## Programming
While editing the code, I prefer to use the "Flash" upload mode rather than RAM. You can hard reset the board after upload by pressing the physical reset button, and the Espruino state will be reset to a known initial state, which is more predictable than the "soft reboot" that occurs on code upload, which leaves some modules initialized (Wifi, bluetooth).

You don't need to use the `init` event to run code on boot. Saving to flash means that code will always be executed on boot.

If the Espruino is in the middle of some long-running task, you can interrupt it without re-running the boot code by typing in the REPL `reset()`.

### Modules
Much of the Jelly code is split into JavaScript modules. This helps you organize your code and also reduces the amount of time you spend waiting for code to upload. Switch the upload mode from "Flash" to "Storage" to upload the contents of a JavaScript module into a file. Create the file on the Espruino using the source's exact filename, without the extension (e.g. use `Fetch` instead of `Fetch.js`).

#### Error "Module ... not found"
On code upload, the Espruino IDE tries to automatically download JavaScript modules from their online module library when it sees a `require()` statement. When uploading code using our own custom modules you will these errors, they are safe to ignore.

Note: By saving the modules with their full filename including the `.js` extension, we prevent name collisions with the Espruino library modules. You must `require()` these modules using the `.js` extension.


## Notes
ESP-WROOM-32E:
 - 520KB SRAM
 - 2MB PSRAM
 - 4MB SPI flash

Espruino HTTP needs about 47KB free heap to run HTTPS.
With wifi module disabled, we only get 32664 bytes of free heap memory.

PSRAM and SPI RAM also fail to initialize and cannot be used currently.

TODO: build firmware from source with dynamic var allocation disabled and reduced jsvars count.
esp32 ram peripherals may be supported in future as ESP32 implementation is being actively improved. memory availability may also increase with more flexible dynamic module loading.

https://github.com/espruino/Espruino/issues/1613
https://github.com/espruino/Espruino/issues/1777#issuecomment-618197976


## Custom firmware
To allocate sufficient heap space on the ESP32 for HTTPS, we must build Espruino from source and make some changes to the build options.

1. Download the Espruino source code:
```
git clone https://github.com/espruino/Espruino.git
```

2. in `boards/ESP32.py` set `'variables': 4095` and delete `BLUETOOTH` from `build.libraries`.
Instead of removing the BLUETOOTH module from the build, you can call `ESP32.enableBLE(false)` to disable bluetooth at runtime, which resets the ESP32. This seems to still result in less free memory than removing the module from the firmware at build-time.


### Build
```
source scripts/provision.sh ESP32
make clean && BOARD=ESP32 make
```

To flash the firmware, navigate to the `bin/[ESPRUINO_VERSION]` directory (e.g. `bin/espruino_2v17.26_esp32`) and run the flash command:
```
python $ESP_IDF_PATH/components/esptool_py/esptool/esptool.py    \
        --chip esp32                                \
        --port /dev/ttyUSB0                         \
        --baud 921600                               \
        --after hard_reset write_flash              \
        -z                                          \
        --flash_mode dio                            \
        --flash_freq 40m                            \
        --flash_size detect                         \
        0x1000 bootloader.bin                       \
        0x8000 partitions_espruino.bin              \
        0x10000 espruino_esp32.bin
```

Note that the variable `$ESP_IDF_PATH` is set by the command `source scripts/provision.sh ESP32` that we had to run earlier to set up the build environment.

### Erase flash
If you get the ESP32 into some bad state where you can no longer connect to it or access the JS interpreter prompt, you can completely wipe the flash memory with the following command:

```
python $ESP_IDF_PATH/components/esptool_py/esptool/esptool.py    \
        --chip esp32                                \
        --port /dev/ttyUSB0                         \
        --baud 921600                               \
        erase_flash
```
