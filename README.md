# Espruino on ESP32

You can find info on how to flash Espruino onto the ESP32, and other useful information at https://www.espruino.com/ESP32.

NOTE: There is an issue in the current ESP32 builds that does not allocate enough heap space to support HTTPS. See [Custom firmware](#custom-firmware) below for instruction on building custom firmware with mroe heap space.

# Setup
1. Plug the ESP32 into USB port.
2. Ensure USB serial interface has read/write access:
```
sudo chmod a+rw /dev/ttyUSB0
```

NOTE: The tty device may change number if the ESP32 is unplugged. You can see what the device name is with the command `ls /dev | grep ttyUSB`.

## Configure Espruino Web IDE
You must use Google Chrome to open the [Espruino Web IDE](https://www.espruino.com/ide).

Click on the gear in the top right, and change the following settings:
1. Communications > Baud Rate > 115200

## Connect the Web IDE to the ESP32
1. Click the connect button in the top-left corner of the IDE.
2. Select "Web Serial".
3. Scroll to the bottom and select "CP2102N USB to UART Bridge Controller (ttyUSB0) - Paired"

There is a known issue where the Espruino Web IDE will sometimes not be able connect to the board the first time you try. The workaround is to use another tool, like minicom, to connect initially.

```
minicom --baudrate 115200 --device /dev/ttyUSB0
```

After minicom connects, exit without reset by pressing `CTRL-A Q`. Now you can try connecting again with the Espruino Web IDE.

# Coding
Although not required, I recommend the following process to write and upload code to the ESP32.

1. Set the upload mode to "Flash" by clicking the dropdown on the fourth button in the middle of the IDE.
2. Click the button to flash your code.
3. Run `E.reboot()` in the console to reboot the board and execute the newly flashed code.

You don't need to use the `init` event to run code on boot. Saving to flash means that code will always be executed on boot.

# Notes
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


# Custom firmware
To allocate sufficient heap space on the ESP32 for HTTPS, we must build Espruino from source and make some changes to the build options.

1. Download the Espruino source code:
```
git clone https://github.com/espruino/Espruino.git
```

2. in `boards/ESP32.py` set `'variables': 4095` and delete `BLUETOOTH` from `build.libraries`.

## Build
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
