# Reinstall App on Physical Device

## Quick Steps

1. **Clean dependencies:**
```bash
npm uninstall @react-native-firebase/database @react-native/new-app-screen @react-navigation/native @react-navigation/stack @viro-community/react-viro axios firebase react-native-dotenv react-native-safe-area-context react-native-share
npm install
```

2. **Clean Android build:**
```bash
cd android
gradlew clean
cd ..
```

3. **Uninstall old app:**
```bash
adb uninstall com.pokeexplorer
```

4. **Install on device:**
```bash
npx react-native run-android --device
```

## Or use the script:
```bash
reinstall-device.bat
```

## Verify device connection:
```bash
adb devices
```
