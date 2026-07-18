# Debugging an Android device over Wi-Fi (ADB)

1. Connect the device via USB and make sure debugging is working.
2. `adb tcpip 5555` — makes the device start listening for connections on port 5555.
3. Look up the device IP address:
   - `adb shell netcfg`, or
   - `adb shell ifconfig` (Android 6.0+), or
   - `adb shell ip -f inet addr show` (Android 10+)
4. You can disconnect the USB now.
5. `adb connect <DEVICE_IP_ADDRESS>:5555` — connects to the server set up on the device in step 2.
6. Now you have a device over the network with which you can debug as usual.
