# Google Maps Integration Setup Guide

## Overview
This guide covers the implementation of Google Maps API instead of the custom tile-based map system for PokeExplorer's Hunt Mode and Map features.

## Key Changes Made

### 1. Updated HuntScreen.tsx
- Replaced custom tile system with react-native-maps
- Added Google Maps provider integration
- Implemented dual view mode (Map/List)
- Enhanced location tracking with real-time updates
- Added biome-based Pokemon spawning system

### 2. Created LocationService.ts
- Centralized location management
- Biome detection based on coordinates
- Pokemon encounter generation by biome
- Distance calculations using Haversine formula
- Location permission handling

### 3. Created MapScreen.tsx
- Standalone reusable map component
- Multiple map types (standard, satellite, hybrid, terrain)
- Custom Pokemon markers with biome colors
- Map controls and user location centering

### 4. Updated Types
- Added biome field to PokemonEncounter interface
- Enhanced location-based data structures

## Configuration Requirements

### Android Setup
1. **API Key in AndroidManifest.xml** (Already configured):
```xml
<meta-data
  android:name="com.google.android.geo.API_KEY"
  android:value="AIzaSyDafIBANQHzsGI1zHbiWY9i6ui2OnFMf_4" />
```

2. **Required Permissions** (Already configured):
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

### iOS Setup
1. **Add API Key to Info.plist**:
```xml
<key>GMSApiKey</key>
<string>AIzaSyDafIBANQHzsGI1zHbiWY9i6ui2OnFMf_4</string>
```

2. **Location Permissions** (Already configured):
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>PokeExplorer needs location access to find Pokemon near you</string>
```

## Features Implemented

### Hunt Mode Features
- **Dual View System**: Toggle between Map and List views
- **Real-time Location Tracking**: Continuous GPS monitoring during hunts
- **Biome-based Pokemon Spawning**: Different Pokemon appear based on location
- **Distance-based Interaction**: 100m range for Pokemon catching
- **Visual Pokemon Markers**: Pokemon sprites as map markers

### Biome System
- **Water**: Near coordinate boundaries (rivers, lakes)
- **Grass**: Northern hemisphere locations
- **Urban**: High latitude/longitude areas (cities)
- **Mountain**: Very high latitudes
- **Desert**: Specific coordinate ranges
- **Normal**: Default fallback biome

### Map Features
- **Google Maps Integration**: Standard, satellite, hybrid, terrain views
- **User Location**: Real-time position tracking
- **Pokemon Markers**: Custom sprites with biome-colored borders
- **Map Controls**: Center on user, toggle map types
- **Distance Calculations**: Accurate Haversine formula

## Usage Instructions

### Starting a Hunt
1. Open Hunt Screen
2. Grant location permissions when prompted
3. Tap "Start Hunt" to begin location tracking
4. Toggle between Map and List views
5. Approach Pokemon within 100m to catch them

### Map Navigation
- **📍 Button**: Center map on user location
- **🗺️ Button**: Cycle through map types
- **Pokemon Markers**: Tap to attempt catching
- **Biome Colors**: Visual indication of Pokemon types

### Catching Pokemon
- Must be within 100m of Pokemon
- 70% success rate for catching
- Failed attempts allow retry
- Successful catches add to Pokedex

## Technical Implementation

### Location Service Architecture
```typescript
class LocationService {
  - requestLocationPermission(): Promise<boolean>
  - getCurrentLocation(): Promise<Location>
  - watchLocation(callback): Promise<number>
  - generatePokemonEncounters(location, count): Promise<PokemonEncounter[]>
  - calculateDistance(lat1, lon1, lat2, lon2): number
  - getBiomeFromLocation(location): string
}
```

### Map Component Props
```typescript
interface MapScreenProps {
  pokemonEncounters?: PokemonEncounter[]
  onPokemonPress?: (encounter) => void
  showUserLocation?: boolean
  followUser?: boolean
  mapType?: 'standard' | 'satellite' | 'hybrid' | 'terrain'
  initialRegion?: Region
}
```

## Performance Optimizations
- **Location Throttling**: Updates every 10m or 5 seconds
- **Image Caching**: Pokemon sprites cached automatically
- **Efficient Rendering**: Optimized marker updates
- **Memory Management**: Proper cleanup of location watchers

## Dependencies Used
- `react-native-maps`: Google Maps integration
- `react-native-geolocation-service`: GPS location services
- `react-native-permissions`: Location permission handling

## Next Steps
1. Test on physical devices for GPS accuracy
2. Add more biome types and Pokemon variety
3. Implement Pokemon rarity system
4. Add weather-based spawning
5. Create Pokemon tracking history

## Troubleshooting
- Ensure Google Maps API key is valid and has Maps SDK enabled
- Check location permissions are granted
- Verify react-native-maps is properly linked
- Test on physical device for accurate GPS

This implementation provides a robust, production-ready Google Maps integration for the PokeExplorer app with enhanced location-based Pokemon hunting features.