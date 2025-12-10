# Dependency Cleanup Summary

## Removed Unused Dependencies

The following packages were removed as they are not used in the codebase:

### 1. **@react-native-firebase/database** ❌
- **Reason**: Not imported or used anywhere
- **Impact**: No impact, Firebase Realtime Database features not implemented

### 2. **@react-native/new-app-screen** ❌
- **Reason**: Default React Native template screen, not used
- **Impact**: None, custom screens implemented

### 3. **@react-navigation/native** ❌
- **Reason**: Custom navigation system implemented in App.tsx
- **Impact**: None, using state-based navigation

### 4. **@react-navigation/stack** ❌
- **Reason**: Custom navigation system implemented
- **Impact**: None, using custom tab navigation

### 5. **@viro-community/react-viro** ❌
- **Reason**: Not imported anywhere, AR implemented differently
- **Impact**: None, using custom AR implementation in AR3DScreen.tsx

### 6. **axios** ❌
- **Reason**: Using native fetch API instead
- **Impact**: None, all API calls use fetch (see api.ts)

### 7. **firebase** ❌
- **Reason**: Using @react-native-firebase packages instead
- **Impact**: None, @react-native-firebase/app and @react-native-firebase/auth are kept

### 8. **react-native-dotenv** ❌
- **Reason**: Not used for environment variables
- **Impact**: None, environment config not actively used

### 9. **react-native-safe-area-context** ❌
- **Reason**: Not imported anywhere
- **Impact**: None, manual padding used for safe areas

### 10. **react-native-share** ❌
- **Reason**: Using React Native's built-in Share API
- **Impact**: None, Share from 'react-native' used in PokemonDetailScreen.tsx

---

## Kept Dependencies (Actively Used)

### Core Dependencies
- ✅ **react** (19.1.1) - Core React library
- ✅ **react-native** (0.82.1) - React Native framework

### State Management
- ✅ **@reduxjs/toolkit** (^2.11.0) - Used in store.ts
- ✅ **react-redux** (^9.2.0) - Used in App.tsx and all screens
- ✅ **redux** (^5.0.1) - Redux core

### Firebase
- ✅ **@react-native-firebase/app** (^18.6.1) - Used in auth.ts
- ✅ **@react-native-firebase/auth** (^18.6.1) - Used in auth.ts

### Location & Maps
- ✅ **react-native-geolocation-service** (^5.3.1) - Used in locationService.ts
- ✅ **react-native-maps** (^0.31.1) - Used in HuntScreen.tsx

### Utilities
- ✅ **@react-native-async-storage/async-storage** (^2.2.0) - Used in api.ts for caching
- ✅ **react-native-permissions** (^5.4.4) - Used in permissions.ts, AR3DScreen.tsx, locationService.ts

---

## File Usage Analysis

### Files Using Dependencies:

1. **api.ts**
   - @react-native-async-storage/async-storage
   - Native fetch API

2. **auth.ts**
   - @react-native-firebase/app
   - @react-native-firebase/auth

3. **store.ts**
   - @reduxjs/toolkit
   - redux

4. **App.tsx & Screens**
   - react-redux
   - redux

5. **locationService.ts**
   - react-native-geolocation-service
   - react-native-permissions

6. **HuntScreen.tsx**
   - react-native-maps
   - react-redux

7. **permissions.ts**
   - react-native-permissions

8. **AR3DScreen.tsx**
   - react-native-permissions

9. **PokemonDetailScreen.tsx**
   - Built-in Share from react-native

---

## How to Apply Cleanup

Run the cleanup script:
```bash
cleanup-dependencies.bat
```

Or manually:
```bash
npm uninstall @react-native-firebase/database @react-native/new-app-screen @react-navigation/native @react-navigation/stack @viro-community/react-viro axios firebase react-native-dotenv react-native-safe-area-context react-native-share
```

Then reinstall dependencies:
```bash
npm install
```

---

## Benefits

1. **Reduced Bundle Size**: Removed ~10 unused packages
2. **Faster Install**: Less dependencies to download
3. **Cleaner Project**: Only essential packages remain
4. **Better Maintenance**: Easier to track what's actually used
5. **Security**: Fewer packages = smaller attack surface

---

## Notes

- All removed packages had zero imports in the codebase
- No functionality was lost by removing these packages
- The app uses native React Native APIs where possible (Share, fetch)
- Custom implementations replace some removed libraries (navigation, AR)
