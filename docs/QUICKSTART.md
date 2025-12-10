# PokeExplorer - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js 20+ installed
- React Native development environment set up
- Xcode (for iOS) or Android Studio (for Android)
- Firebase project created

---

## Step 1: Install Dependencies

```bash
cd PokeExplorer
npm install
```

---

## Step 2: Platform Setup

### For iOS:
```bash
cd ios
bundle install
bundle exec pod install
cd ..
```

### For Android:
Ensure `google-services.json` is in `android/app/` directory

---

## Step 3: Firebase Configuration

Your Firebase is already configured in `.env`:
- Project: pokeexplorer-it5103n
- Authentication: ✅ Enabled
- Realtime Database: ✅ Ready

**No additional setup needed!**

---

## Step 4: Run the App

### Start Metro Bundler:
```bash
npm start
```

### Run on iOS:
```bash
npm run ios
```

### Run on Android:
```bash
npm run android
```

---

## 🎮 First Time Usage

### 1. Sign Up
- Launch app
- Tap "Need an account? Sign Up"
- Enter email and password
- Tap "Sign Up"

### 2. Explore Pokedex
- Browse Pokemon in grid view
- Tap search icon to search by name/ID
- Tap microphone for voice search
- Tap any Pokemon for details

### 3. Start Hunting
- Navigate to "Hunt" tab
- Grant location permission
- Tap "Start Hunt"
- Tap Pokemon markers to catch them

### 4. Try AR Mode
- Navigate to "AR" tab
- Grant camera permission
- Tap "Spawn Pokemon"
- Drag to look around
- Tap Pokemon to catch

### 5. Check Profile
- Navigate to "Profile" tab
- View your statistics
- See earned badges
- Check recent discoveries

---

## 📱 Features Overview

| Feature | Tab | Description |
|---------|-----|-------------|
| **Pokedex** | 📚 | Browse and search Pokemon |
| **Hunt** | 🗺️ | Find Pokemon near you |
| **AR** | 🥽 | AR Pokemon experience |
| **Profile** | 👤 | Stats and achievements |

---

## 🔑 Key Features

### Voice Search 🎤
1. Tap microphone icon in Pokedex
2. Say Pokemon name (e.g., "Pikachu")
3. Automatic search and display

### AR Camera 📷
1. Go to AR tab
2. Spawn Pokemon
3. Take photos with Pokemon overlay
4. Pokemon added to Pokedex

### Geolocation Hunt 🗺️
1. Enable location services
2. Start hunt mode
3. Find Pokemon on map
4. Catch nearby Pokemon

### Social Sharing 📤
1. View Pokemon details
2. Tap "Share" button
3. Choose platform (Twitter, WhatsApp, etc.)
4. Share your discovery

---

## ⚙️ Permissions

The app will request:
- **Location** - For Pokemon hunting
- **Camera** - For AR features
- **Microphone** - For voice search

Grant all permissions for full experience.

---

## 🐛 Common Issues

### "Cannot connect to Pokemon API"
- Check internet connection
- Restart Metro bundler
- Clear cache: `npx react-native start --reset-cache`

### "Location not available"
- Enable location services in device settings
- Grant location permission to app
- Restart app

### "Camera not working"
- Grant camera permission
- Check device camera functionality
- Restart app

### iOS Build Fails
```bash
cd ios
pod deintegrate
pod install
cd ..
```

### Android Build Fails
```bash
cd android
./gradlew clean
cd ..
```

---

## 📊 App Statistics

- **150+ Pokemon** available (Gen 1)
- **Multiple habitats** to explore
- **Badge system** with 5+ achievements
- **Offline support** with caching
- **Real-time** location tracking

---

## 🎯 Tips for Best Experience

1. **Enable all permissions** for full functionality
2. **Use on physical device** for AR/GPS features
3. **Good internet connection** for first load
4. **Outdoor hunting** for better GPS accuracy
5. **Good lighting** for AR camera features

---

## 📞 Support

For issues or questions:
1. Check IMPLEMENTATION_GUIDE.md
2. Review README.md
3. Check Firebase console for auth issues
4. Verify all dependencies installed

---

## 🎉 You're Ready!

Start catching Pokemon and building your Pokedex!

**Happy Hunting! ⚡🔴**
