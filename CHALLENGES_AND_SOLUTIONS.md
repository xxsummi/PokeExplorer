# Challenges and Solutions

This document details the key challenges encountered during development and their solutions.

## 🔧 Technical Challenges

### 1. Android Emulator DNS Resolution Issues

**Challenge:**
- API calls to `pokeapi.co` were failing with "Unable to resolve host" errors
- Emulator had internet connectivity (ping to 8.8.8.8 worked) but couldn't resolve domain names
- This is a common Android emulator issue

**Solution:**
- Implemented DNS fallback mechanism in `pokeAPI.ts`
- Added retry logic with exponential backoff (3 attempts)
- Created dual request system: XMLHttpRequest first, then fetch fallback
- Added IP address fallback (though limited by HTTPS SNI requirements)
- Provided clear error messages guiding users to fix DNS settings
- Documented multiple solutions: cold boot, DNS configuration, network security config

**Code Location:** `src/services/pokeAPI.ts`

---

### 2. Permission Request Timing Issues

**Challenge:**
- Permission requests were failing with "Activity not attached" errors on Android
- Requests were being made before the Activity was ready

**Solution:**
- Added `setTimeout(200)` delay before permission requests on Android
- Replaced deprecated `InteractionManager` with `setTimeout`
- Added loading states to prevent duplicate requests
- Improved error handling with "Open Settings" option for blocked permissions

**Code Location:** 
- `src/services/permissionsService.ts`
- `src/services/locationService.ts`
- `src/screens/CameraScreen.tsx`
- `src/screens/AR3DScreen.tsx`

---

### 3. Camera Black Screen Issue

**Challenge:**
- Camera screen was showing black screen
- `react-native-vision-camera` was not installed

**Solution:**
- Installed `react-native-vision-camera` package
- Replaced placeholder `View` with actual `Camera` component
- Added proper permission handling and loading states
- Implemented camera device selection and activation logic

**Code Location:** `src/screens/CameraScreen.tsx`, `src/screens/AR3DScreen.tsx`

---

### 4. NDK Version Compatibility

**Challenge:**
- Build was failing due to NDK version mismatch
- Project required NDK 27.1.12297006 but only 26.1.10909125 was installed
- Changing NDK version could break other team members' setups

**Solution:**
- Kept original NDK version requirement (27.1.12297006)
- Provided clear instructions for installing correct NDK via Android Studio SDK Manager
- Documented the requirement in README

**Code Location:** `android/build.gradle`

---

### 5. Deprecated Gradle Repositories

**Challenge:**
- `jcenter()` repository was deprecated and causing build failures
- Multiple node_modules packages were using deprecated repositories

**Solution:**
- Replaced all `jcenter()` with `mavenCentral()` in:
  - `node_modules/react-native-push-notification/android/build.gradle`
  - `node_modules/@react-native-voice/voice/android/build.gradle`
- Updated SDK versions where needed

**Code Location:** Various `node_modules` build.gradle files

---

### 6. TypeScript Type Safety Issues

**Challenge:**
- Type errors when indexing objects with string keys
- `setTimeout` Promise type mismatches

**Solution:**
- Added type assertions: `configs[biome as keyof typeof configs]`
- Fixed Promise types: `new Promise<void>(resolve => setTimeout(() => resolve(), delay))`
- Used `as const` for better type inference

**Code Location:** 
- `src/services/locationService.ts`
- `src/services/pokeAPI.ts`

---

### 7. Code Organization and Maintainability

**Challenge:**
- All files were in root directory, making it hard to navigate
- No clear separation between screens, services, and utilities
- Difficult to understand project structure

**Solution:**
- Created organized folder structure:
  - `src/screens/` - Screen components
  - `src/services/` - Business logic and API services
  - `src/components/` - Reusable components
  - `src/store/` - Redux state management
  - `src/types/` - TypeScript definitions
  - `src/utils/` - Utility functions
  - `src/config/` - Configuration files
  - `docs/` - Documentation
- Created index files for easier imports
- Added comprehensive code comments
- Created `PROJECT_STRUCTURE.md` documentation

---

### 8. Environment Variable Management

**Challenge:**
- Firebase credentials were hardcoded in `google-services.json`
- No template for environment variables
- Security concerns with committed secrets

**Solution:**
- Created `.env.example` template file
- Migrated Firebase config to use environment variables
- Updated `firebase.config.js` to read from `.env`
- Added `.env` to `.gitignore` (if not already)
- Documented required environment variables

**Code Location:** 
- `.env.example`
- `src/config/firebase.ts`

---

### 9. API Call Optimization

**Challenge:**
- Multiple API calls could cause performance issues
- No caching mechanism
- Network failures could crash the app

**Solution:**
- Implemented AsyncStorage caching for Pokemon data
- Added retry logic with exponential backoff
- Implemented request timeouts (15-20 seconds)
- Added graceful error handling - app continues even if some Pokemon fail to load
- Batch loading with `Promise.allSettled` for parallel requests

**Code Location:** `src/services/pokeAPI.ts`

---

### 10. Search Functionality

**Challenge:**
- Needed fast search by name, ID, and type
- Fuzzy search for typos and mispronunciations
- Type filtering combined with text search

**Solution:**
- Implemented 3-gram inverted index for fast fuzzy search
- Added direct ID and name matching for exact queries
- Created type-based filtering using PokeAPI type endpoint
- Combined search query with type filter
- Progressive index building for better UX

**Code Location:**
- `src/utils/fuzzySearch.ts`
- `src/screens/PokedexScreen.tsx`
- `src/services/pokeAPI.ts` (getPokemonByType method)

---

## 📊 Performance Optimizations

### Image Caching
- React Native automatically caches images from URIs
- Sprites are loaded from PokeAPI CDN

### API Caching
- Pokemon data cached in AsyncStorage
- Cache size limited to 400 entries
- Automatic cache cleanup when limit exceeded

### State Management
- Redux for predictable state updates
- Immutable state prevents unnecessary re-renders
- Selective subscriptions to minimize updates

### Code Splitting
- Modular structure allows for future code splitting
- Services loaded on demand

---

## 🎯 Best Practices Implemented

1. **Error Handling**: Comprehensive try-catch blocks with user-friendly messages
2. **Type Safety**: Full TypeScript coverage with proper types
3. **Code Comments**: Key logic explained with JSDoc comments
4. **Modular Design**: Clear separation of concerns
5. **Environment Config**: Secure handling of secrets
6. **Documentation**: Comprehensive README and structure docs
7. **Testing**: Test files organized in `__tests__/`
8. **Git Organization**: Clear commit messages and structure

---

## 🔮 Future Improvements

1. **Error Tracking**: Integrate Sentry or similar for production error tracking
2. **Analytics**: Add analytics for user behavior
3. **Offline Mode**: Enhanced offline functionality
4. **Image Optimization**: Implement image compression and lazy loading
5. **Code Splitting**: Implement dynamic imports for screens
6. **Testing**: Expand test coverage
7. **CI/CD**: Set up automated testing and deployment

