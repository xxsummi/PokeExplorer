# Fix Android Emulator DNS Issues

If you're getting "Unable to resolve host" errors, try these solutions:

## Solution 1: Restart Emulator (Recommended)
1. Close the emulator completely
2. In Android Studio: Tools → Device Manager
3. Click the dropdown arrow next to your emulator
4. Select "Cold Boot Now"
5. Wait for emulator to fully start
6. Try the app again

## Solution 2: Check Emulator Network Settings
1. Open Extended Controls (three dots) in emulator
2. Go to Settings → Proxy
3. Make sure "No proxy" is selected
4. Go to Settings → Network
5. Ensure "Cellular" or "Wi-Fi" shows as connected

## Solution 3: Restart Network Services
Run these commands in terminal:
```bash
adb shell svc wifi disable
adb shell svc wifi enable
```

## Solution 4: Use Different Emulator
If DNS issues persist, try creating a new emulator with:
- API Level 33 or higher
- Google Play system image (not AOSP)

The emulator should automatically use your Mac's DNS settings.
