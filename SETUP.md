# PokeExplorer Setup Guide

## Quick Start Checklist

### 1. Prerequisites ✅
- [ ] Node.js 20+ installed
- [ ] React Native development environment set up
- [ ] Android Studio (for Android development)
- [ ] Xcode (for iOS development, macOS only)
- [ ] Firebase account created

### 2. Project Setup ✅
- [ ] Clone repository
- [ ] Run `npm install`
- [ ] Configure Firebase project
- [ ] Set up environment variables
- [ ] Install iOS dependencies (`cd ios && bundle exec pod install`)

### 3. Firebase Configuration 🔥

#### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Follow the setup wizard
4. Enable Authentication and Realtime Database

#### Download Configuration Files
- **Android**: Download `google-services.json` → Place in `android/app/`
- **iOS**: Download `GoogleService-Info.plist` → Add to Xcode project

#### Update Environment Variables
Copy `.env` file and update with your Firebase config:
```env
FIREBASE_API_KEY=your_actual_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:android:abcdef123456789
```

### 4. Platform-Specific Setup 📱

#### Android Setup
1. Ensure Android SDK is installed
2. Create/start Android emulator or connect physical device
3. Place `google-services.json` in `android/app/` directory
4. Run: `npm run android`

#### iOS Setup (macOS only)
1. Install Xcode from App Store
2. Install CocoaPods: `sudo gem install cocoapods`
3. Run: `cd ios && bundle exec pod install`
4. Add `GoogleService-Info.plist` to Xcode project
5. Configure signing in Xcode
6. Run: `npm run ios`

### 5. Testing the App 🧪

#### Basic Functionality Test
1. **Authentication**: Try signing up with a new email
2. **Pokédex**: Search for "pikachu" or browse the list
3. **Voice Search**: Tap microphone and say "charizard"
4. **Hunt Mode**: Allow location permissions and start hunting
5. **AR Camera**: Allow camera permissions and spawn a Pokémon
6. **Profile**: Check your statistics and badges

#### Permission Testing
- Location permission for hunt mode
- Camera permission for AR features
- Microphone permission for voice search

### 6. Common Issues & Solutions 🔧

#### Metro Bundler Issues
```bash
npx react-native start --reset-cache
```

#### iOS Build Failures
```bash
cd ios
pod deintegrate
pod install
cd ..
```

#### Android Build Issues
```bash
cd android
./gradlew clean
cd ..
```

#### Firebase Authentication Not Working
- Check if `google-services.json` / `GoogleService-Info.plist` are properly placed
- Verify Firebase project configuration
- Ensure Authentication is enabled in Firebase Console

#### Location/Camera Not Working
- Check device permissions in Settings
- Ensure permissions are requested in the app
- Test on physical device (some features don't work in simulator)

### 7. Development Tips 💡

#### Performance
- Use release builds for testing: `npm run android --variant=release`
- Enable Hermes for better performance
- Monitor memory usage with React Native Flipper

#### Debugging
- Use React Native Debugger
- Enable network inspection in Flipper
- Check device logs for permission issues

#### Code Quality
- Run linter: `npm run lint`
- Run tests: `npm test`
- Use TypeScript for better development experience

### 8. Project Structure Overview 📁

```
PokeExplorer/
├── App.tsx                 # Main app with navigation
├── store.ts               # Redux store
├── types.ts               # TypeScript definitions
├── api.ts                 # PokeAPI service
├── auth.ts                # Firebase auth
├── permissions.ts         # Permission manager
├── notifications.ts       # Push notifications
├── LoginScreen.tsx        # Authentication UI
├── PokedexScreen.tsx      # Main Pokémon list
├── PokemonDetailScreen.tsx # Pokémon details
├── HuntScreen.tsx         # Location-based hunting
├── CameraScreen.tsx       # AR camera
├── ProfileScreen.tsx      # User profile
├── VoiceSearch.tsx        # Voice search modal
└── firebase.config.js     # Firebase setup
```

### 9. Next Steps 🚀

After basic setup:
1. Customize the app theme and colors
2. Add more Pokémon data (currently limited to first 150)
3. Implement additional AR features
4. Add social features and community sharing
5. Optimize performance for production

### 10. Support 🆘

If you encounter issues:
1. Check this setup guide first
2. Review the main README.md
3. Check React Native documentation
4. Firebase documentation for auth/database issues
5. Create an issue in the project repository

---

**Ready to catch 'em all! 🎯⚡**