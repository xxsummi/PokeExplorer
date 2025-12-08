# Google Maps Troubleshooting Guide

## Error: "Cannot read property 'getViewManagerConfig' of null"

This error occurs when react-native-maps native modules aren't properly linked with React Native's new architecture.

### Quick Fix (Recommended)

Run the automated fix script:
```bash
fix-maps.bat
```

Then start the app:
```bash
# Terminal 1
npx react-native start --reset-cache

# Terminal 2
npx react-native run-android
```

### What the Fix Does

1. **Disables New Architecture**: Changes `newArchEnabled=true` to `false` in `android/gradle.properties`
   - React Native 0.82.1's new architecture (Fabric/TurboModules) isn't fully compatible with react-native-maps 0.31.1
   - Disabling it allows maps to work with the legacy bridge

2. **Cleans All Caches**:
   - Android build cache
   - Gradle cache
   - Metro bundler cache

3. **Rebuilds the App**: Fresh build with correct configuration

### Manual Fix Steps

If the automated script doesn't work:

1. **Edit gradle.properties**:
   ```
   File: android/gradle.properties
   Change: newArchEnabled=true
   To: newArchEnabled=false
   ```

2. **Clean everything**:
   ```bash
   cd android
   gradlew clean
   cd ..
   ```

3. **Remove build folders**:
   ```bash
   rmdir /s /q android\app\build
   rmdir /s /q android\build
   rmdir /s /q android\.gradle
   ```

4. **Clear Metro cache**:
   ```bash
   npx react-native start --reset-cache
   ```
   (Then stop it with Ctrl+C)

5. **Rebuild**:
   ```bash
   cd android
   gradlew assembleDebug
   cd ..
   ```

6. **Run the app**:
   ```bash
   npx react-native run-android
   ```

### Verify Google Cloud Console Setup

Ensure you've completed these steps:

1. **Enable APIs**:
   - Maps SDK for Android
   - Maps SDK for iOS (if using iOS)

2. **API Key Configuration**:
   - Add SHA-1 fingerprint to API key restrictions
   - Get SHA-1: `cd android && gradlew signingReport`
   - Add to Google Cloud Console → Credentials → Your API Key → Application restrictions

3. **Billing**:
   - Enable billing (free tier available with $200 credit)
   - Maps won't work without billing enabled

4. **API Key in AndroidManifest.xml**:
   ```xml
   <meta-data
     android:name="com.google.android.geo.API_KEY"
     android:value="YOUR_API_KEY_HERE" />
   ```

### Alternative: Use List View

If maps still don't work, the app has a fallback list view:

1. Open the Hunt tab
2. The app will automatically detect if maps are unavailable
3. Use the "List" view toggle to see nearby Pokémon without the map

### Common Issues

**Issue**: Map shows but is blank/gray
- **Solution**: Check API key and billing in Google Cloud Console

**Issue**: "Google Play Services not available"
- **Solution**: Update Google Play Services on your device/emulator

**Issue**: Still getting the error after fix
- **Solution**: 
  1. Uninstall the app from device: `adb uninstall com.pokeexplorer`
  2. Run fix-maps.bat again
  3. Reinstall: `npx react-native run-android`

**Issue**: Build fails with "Duplicate class" error
- **Solution**: Check that you don't have conflicting Google Play Services versions

### Testing Maps

After fixing:

1. Open the app
2. Navigate to the "Hunt" tab (🗺️)
3. Grant location permissions when prompted
4. You should see:
   - A Google Map centered on your location
   - Your location marker (blue dot)
   - Nearby Pokémon markers

### Future: Re-enabling New Architecture

When react-native-maps adds full support for the new architecture:

1. Update react-native-maps: `npm install react-native-maps@latest`
2. Change `newArchEnabled=false` back to `true` in gradle.properties
3. Clean and rebuild

### Need Help?

If you're still having issues:

1. Check the error logs in Metro bundler
2. Check Android logcat: `adb logcat | grep -i maps`
3. Verify your Google Cloud Console setup
4. Try the list view as a temporary workaround
