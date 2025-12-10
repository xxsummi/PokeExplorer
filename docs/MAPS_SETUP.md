# Google Maps Setup Guide

## Issue
The app is currently showing a Maps error because `react-native-maps` requires proper native configuration.

## Quick Fix (Current)
The app now falls back to **List View** when Maps is unavailable. You can still use all hunt features without the map.

## Full Maps Setup (Optional)

### 1. Get a New Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Click **Create Credentials** > **API Key**
4. **Restrict your API key:**
   - Application restrictions: Android apps / iOS apps
   - API restrictions: Maps SDK for Android / Maps SDK for iOS

### 2. Android Configuration

1. Add your new API key to `android/app/src/main/AndroidManifest.xml`:

```xml
<application>
  <!-- Add this inside <application> tag -->
  <meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="YOUR_NEW_GOOGLE_MAPS_API_KEY"/>
</application>
```

2. Update your `.env` file:
```
GOOGLE_MAPS_API_KEY=YOUR_NEW_GOOGLE_MAPS_API_KEY
```

3. Rebuild the app:
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### 3. iOS Configuration

1. Add your API key to `ios/PokeExplorer/AppDelegate.mm`:

```objc
#import <GoogleMaps/GoogleMaps.h>

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [GMSServices provideAPIKey:@"YOUR_NEW_GOOGLE_MAPS_API_KEY"];
  // ... rest of the code
}
```

2. Install pods:
```bash
cd ios
pod install
cd ..
npm run ios
```

## Security Best Practices

1. **Never commit API keys to Git**
   - The `.env` file is now in `.gitignore`
   - Use `.env.example` as a template

2. **Restrict your API key:**
   - Add package name restrictions (Android)
   - Add bundle ID restrictions (iOS)
   - Limit to only Maps APIs you need

3. **Monitor usage:**
   - Set up billing alerts in Google Cloud
   - Review API usage regularly

## Alternative: Use List View Only

If you don't need the map feature, the app works perfectly with List View:
- Shows all nearby Pokemon
- Displays distances
- Full catch functionality
- No API key required

## Troubleshooting

### "Cannot read property 'getViewManagerConfig' of null"
- This means Maps native module isn't linked
- The app now automatically falls back to List View
- Follow the setup steps above to enable Maps

### Maps shows blank screen
- Check API key is correct
- Verify API key restrictions allow your app
- Ensure billing is enabled in Google Cloud

### Build errors after adding Maps
```bash
# Android
cd android && ./gradlew clean && cd ..

# iOS
cd ios && pod deintegrate && pod install && cd ..
```

## Current Status

✅ App works without Maps (List View)
✅ Location tracking functional
✅ Pokemon hunting functional
⚠️ Map View requires setup (optional)
