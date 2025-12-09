# PokeExplorer 🔍⚡

An interactive, augmented reality-enhanced Pokédex built with React Native. Discover, catalog, and share Pokémon in real-world contexts using geolocation, AR overlays, and device sensors.

## 🎯 Features

### Core Features
- **User Authentication**: Firebase-based login/signup system
- **Interactive Pokédex**: Browse and search Pokémon with PokeAPI integration
- **Geolocation Hunt Mode**: Find Pokémon based on your real-world location
- **AR Camera**: Overlay Pokémon on camera feed and capture photos
- **Voice Search**: Search Pokémon using voice commands
- **Social Sharing**: Share discoveries on social media
- **Offline Support**: Cached Pokémon data for offline viewing

### Technical Features
- Cross-platform (iOS/Android) compatibility
- Redux state management
- Real-time location tracking
- Push notifications for nearby Pokémon
- Secure API key management
- Comprehensive permission handling

## 🚀 Getting Started

### Prerequisites

1. **React Native Development Environment**
   - Follow the [React Native Environment Setup](https://reactnative.dev/docs/set-up-your-environment) guide
   - Ensure you have Node.js 20+ installed

2. **Firebase Project Setup**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication and Realtime Database
   - Download configuration files:
     - `google-services.json` for Android (place in `android/app/`)
     - `GoogleService-Info.plist` for iOS (add to Xcode project)

3. **API Keys**
   - No PokeAPI key required (free tier)
   - Optional: Google Maps API key for enhanced location features

### Installation

1. **Clone and Install Dependencies**
   ```bash
   git clone <your-repo-url>
   cd PokeExplorer
   npm install
   ```

2. **iOS Setup**

   **Prerequisites:**
   - Install Xcode from the Mac App Store (latest version recommended)
   - Install Xcode Command Line Tools:
     ```bash
     xcode-select --install
     ```
   - Install rbenv (Ruby version manager) - Ruby 3.4+ has compatibility issues with CocoaPods:
     ```bash
     brew install rbenv ruby-build
     ```
   - Install Ruby 3.3 (compatible version):
     ```bash
     rbenv install 3.3.6
     rbenv global 3.3.6
     # Add to your ~/.zshrc or ~/.bash_profile:
     echo 'eval "$(rbenv init - zsh)"' >> ~/.zshrc
     source ~/.zshrc
     ```
   - Verify Ruby version:
     ```bash
     ruby --version  # Should show 3.3.x
     ```

   **Install iOS Dependencies:**
   ```bash
   cd ios
   bundle install
   export LANG=en_US.UTF-8
   bundle exec pod install
   cd ..
   ```

   **Xcode Configuration:**
   1. Open `ios/PokeExplorer.xcworkspace` (NOT .xcodeproj) in Xcode
   2. Add `GoogleService-Info.plist`:
      - Download from Firebase Console
      - Drag and drop into Xcode project (ensure "Copy items if needed" is checked)
      - Place in `ios/PokeExplorer/` directory
   3. Configure Signing:
      - Select the project in Xcode
      - Go to "Signing & Capabilities" tab
      - Select your development team
      - Xcode will automatically manage provisioning profiles

3. **Environment Configuration**
   - Ensure `.env` file exists (copy from `.env.example` if needed)
   - Required environment variables:
     ```env
     POKE_API_BASE_URL=https://pokeapi.co/api/v2
     FIREBASE_API_KEY=your_firebase_api_key
     FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
     FIREBASE_PROJECT_ID=your_project_id
     FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
     FIREBASE_MESSAGING_SENDER_ID=your_sender_id
     FIREBASE_APP_ID=your_app_id
     FIREBASE_MEASUREMENT_ID=your_measurement_id
     GOOGLE_MAPS_API_KEY=your_google_maps_api_key  # Optional
     ```
   - Get Firebase values from your Firebase project settings or `GoogleService-Info.plist`

4. **Platform-Specific Setup**

   **Android:**
   - Place `google-services.json` in `android/app/`
   - Ensure Android SDK and emulator are set up

   **iOS:**
   - All setup is done above. Ensure `GoogleService-Info.plist` is added to Xcode project.

### Running the App

1. **Start Metro**
   ```bash
   npm start
   ```

2. **Run on Android**
   ```bash
   npm run android
   ```

3. **Run on iOS**

   **Option A: Run on iOS Simulator**
   ```bash
   # List available simulators
   xcrun simctl list devices available
   
   # Run on default simulator
   npm run ios
   
   # Or specify a device
   npm run ios -- --simulator="iPhone 15 Pro"
   ```

   **Option B: Run on Physical iPhone**
   1. Connect your iPhone via USB
   2. Trust the computer on your iPhone if prompted
   3. In Xcode, select your device from the device dropdown
   4. Run:
     ```bash
     npm run ios -- --device
     ```
   5. On your iPhone: Settings → General → VPN & Device Management → Trust your developer certificate

## 📱 App Structure

```
PokeExplorer/
├── App.tsx                 # Main app component with navigation
├── store.ts               # Redux store configuration
├── types.ts               # TypeScript type definitions
├── api.ts                 # PokeAPI service with caching
├── auth.ts                # Firebase authentication service
├── permissions.ts         # Device permissions manager
├── notifications.ts       # Push notification service
├── LoginScreen.tsx        # User authentication screen
├── PokedexScreen.tsx      # Main Pokémon browsing screen
├── PokemonDetailScreen.tsx # Detailed Pokémon information
├── HuntScreen.tsx         # Geolocation-based hunting
├── CameraScreen.tsx       # AR camera functionality
├── ProfileScreen.tsx      # User profile and statistics
└── VoiceSearch.tsx        # Voice search component
```

## 🔧 Configuration

### Environment Variables (.env)
```env
# Firebase Configuration
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
FIREBASE_PROJECT_ID=your_project_id

# Optional: Google Maps API Key
GOOGLE_MAPS_API_KEY=your_maps_api_key
```

### Required Permissions
- **Location**: For Pokémon hunting and map features
- **Camera**: For AR Pokémon overlay and photo capture
- **Microphone**: For voice search functionality
- **Storage**: For caching Pokémon data and photos

## 🎮 How to Use

1. **Sign Up/Login**: Create an account or sign in with existing credentials
2. **Browse Pokédex**: Search and explore Pokémon by name, type, or ID
3. **Hunt Mode**: Enable location services and find Pokémon near you
4. **AR Camera**: Use camera to overlay Pokémon in real world and capture photos
5. **Voice Search**: Tap microphone icon and speak Pokémon names
6. **Share**: Share your discoveries on social media
7. **Profile**: Track your progress and earned badges

## 🏗️ Architecture

- **State Management**: Redux Toolkit for predictable state updates
- **Navigation**: Custom tab-based navigation system
- **API Integration**: Axios with AsyncStorage caching
- **Authentication**: Firebase Auth with email/password
- **Real-time Features**: Firebase Realtime Database
- **Permissions**: react-native-permissions for cross-platform handling

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage
```

## 📦 Dependencies

### Core
- React Native 0.82.1
- Redux Toolkit
- React Navigation
- Firebase SDK

### Features
- react-native-maps (Geolocation)
- react-native-vision-camera (AR/Camera)
- @react-native-voice/voice (Voice search)
- react-native-share (Social sharing)
- react-native-push-notification (Notifications)

### Development
- TypeScript
- ESLint
- Prettier
- Jest (Testing)

## 🚨 Troubleshooting

### Common Issues

1. **Metro bundler issues**
   ```bash
   npx react-native start --reset-cache
   ```

2. **iOS build failures**
   ```bash
   cd ios
   pod deintegrate
   export LANG=en_US.UTF-8
   bundle exec pod install
   cd ..
   ```

3. **Ruby/CocoaPods "kconv" error**
   - This occurs with Ruby 3.4+. Use Ruby 3.3.x instead:
     ```bash
     # Install rbenv if not installed
     brew install rbenv ruby-build
     
     # Install Ruby 3.3.6
     rbenv install 3.3.6
     rbenv local 3.3.6  # In project directory
     
     # Reinstall gems
     cd ios
     bundle install
     bundle exec pod install
     ```

4. **iOS pod install encoding errors**
   ```bash
   export LANG=en_US.UTF-8
   cd ios && bundle exec pod install
   ```

5. **Android build issues**
   ```bash
   cd android && ./gradlew clean
   ```

6. **Permission denied errors**
   - Ensure all required permissions are granted in device settings
   - Check Firebase configuration files are properly placed

### Performance Tips
- Enable Hermes for better performance
- Use release builds for testing on physical devices
- Monitor memory usage with large Pokémon datasets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [PokéAPI](https://pokeapi.co/) for comprehensive Pokémon data
- [Firebase](https://firebase.google.com/) for backend services
- React Native community for excellent libraries
- Pokémon Company for the amazing franchise

---

**Happy Pokémon Hunting! 🎯⚡**