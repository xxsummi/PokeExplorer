# Google Maps Implementation Guide for React Native

## Prerequisites
- React Native 0.82.1
- Android Studio installed
- Google Cloud Console account
- Physical Android device (emulators often fail with Maps)

## Step 1: Install Compatible react-native-maps

```bash
npm install react-native-maps@0.31.1 --save
```

## Step 2: Android Configuration

### 2.1 Update android/build.gradle
Add Google Maven repository:

```gradle
allprojects {
    repositories {
        google()
        mavenCentral()
        maven { url 'https://www.jitpack.io' }
    }
}
```

### 2.2 Update android/app/build.gradle
Add these dependencies:

```gradle
dependencies {
    implementation project(':react-native-maps')
    implementation 'com.google.android.gms:play-services-maps:18.0.2'
    implementation 'com.google.android.gms:play-services-location:21.0.1'
}
```

### 2.3 Update android/settings.gradle
Add:

```gradle
include ':react-native-maps'
project(':react-native-maps').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-maps/lib/android')
```

### 2.4 Update AndroidManifest.xml
Already done - your API key is configured:

```xml
<meta-data
  android:name="com.google.android.geo.API_KEY"
  android:value="AIzaSyC5d8pM66hr6ztH9sPTqWIQGrt6IZQoxjs" />
```

## Step 3: Link Native Modules

### For React Native 0.82.1 (New Architecture):

```bash
# Clean everything
cd android
./gradlew clean
cd ..

# Remove build folders
rm -rf android/app/build
rm -rf android/build

# Reinstall
rm -rf node_modules
npm install

# Rebuild
cd android
./gradlew assembleDebug
cd ..
```

## Step 4: Enable Google Maps API

1. Go to: https://console.cloud.google.com/
2. Select your project
3. Navigate to: APIs & Services → Library
4. Enable these APIs:
   - **Maps SDK for Android**
   - **Maps SDK for iOS** (if using iOS)
   - **Geolocation API**
   - **Places API** (optional)

5. Go to: APIs & Services → Credentials
6. Click on your API key
7. Under "Application restrictions":
   - Select "Android apps"
   - Add package name: `com.pokeexplorer`
   - Add SHA-1 certificate fingerprint

### Get SHA-1 fingerprint:
```bash
cd android
./gradlew signingReport
```

Copy the SHA-1 from the debug variant and add it to your API key restrictions.

## Step 5: Update MainApplication (if needed)

File: `android/app/src/main/java/com/pokeexplorer/MainApplication.java`

Add import:
```java
import com.airbnb.android.react.maps.MapsPackage;
```

Add to packages list:
```java
packages.add(new MapsPackage());
```

## Step 6: Verify Google Play Services

Ensure your device has Google Play Services:
```bash
adb shell pm list packages | grep google
```

Should show: `package:com.google.android.gms`

## Step 7: Test Implementation

Create a simple test component:

```typescript
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';

<MapView
  provider={PROVIDER_GOOGLE}
  style={{ flex: 1 }}
  initialRegion={{
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  }}
/>
```

## Step 8: Common Issues & Solutions

### Issue 1: "Cannot read property 'getViewManagerConfig' of null"
**Solution:** Native module not linked properly
```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

### Issue 2: Blank map or crashes
**Solution:** 
- Verify API key is enabled for Maps SDK for Android
- Check SHA-1 fingerprint is added
- Ensure Google Play Services is installed on device

### Issue 3: "AUTHORIZATION_FAILURE"
**Solution:**
- API key restrictions too strict
- Remove restrictions temporarily for testing
- Add correct package name and SHA-1

### Issue 4: Map shows but no tiles
**Solution:**
- Enable billing on Google Cloud Console
- Maps SDK requires billing enabled (free tier available)

## Step 9: Run on Physical Device

```bash
# Connect device via USB
adb devices

# Install and run
npx react-native run-android
```

## Step 10: Verify Installation

Check if maps module is loaded:
```bash
adb logcat | grep -i maps
```

Should see: "Google Maps Android API loaded successfully"

## Troubleshooting Commands

```bash
# Clear cache
npx react-native start --reset-cache

# Reinstall app
adb uninstall com.pokeexplorer
npx react-native run-android

# Check logs
adb logcat *:E

# Check Google Play Services version
adb shell dumpsys package com.google.android.gms | grep versionName
```

## Final Notes

- **Always test on physical device** - emulators often fail
- **Enable billing** on Google Cloud Console (free tier available)
- **Add SHA-1 fingerprint** to API key restrictions
- **Use PROVIDER_GOOGLE** explicitly in MapView
- **Check Google Play Services** is up to date on device

## Your Current Setup Status

✅ API Key configured in AndroidManifest.xml
✅ react-native-maps installed (need to verify version)
✅ Location permissions configured
❌ Native linking needs verification
❌ Google Play Services needs verification
❌ API restrictions need configuration

## Next Steps

1. Run: `cd android && ./gradlew clean && cd ..`
2. Run: `npm install`
3. Get SHA-1: `cd android && ./gradlew signingReport`
4. Add SHA-1 to Google Cloud Console API key
5. Enable Maps SDK for Android in Google Cloud Console
6. Run: `npx react-native run-android` on physical device
7. Grant location permissions when prompted

If maps still don't work, the issue is likely:
- Google Play Services not installed/updated on device
- API key restrictions blocking requests
- Billing not enabled on Google Cloud Console