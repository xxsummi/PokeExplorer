import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { RootState, setCurrentLocation } from './store';
import { PokemonEncounter, Location } from './types';
import { locationService } from './locationService';
import { GOOGLE_MAPS_API_KEY } from '@env';

interface MapScreenProps {
  pokemonEncounters?: PokemonEncounter[];
  onPokemonPress?: (encounter: PokemonEncounter) => void;
  showUserLocation?: boolean;
  followUser?: boolean;
  mapType?: 'standard' | 'satellite' | 'hybrid' | 'terrain';
  initialRegion?: Region;
}

export const MapScreen: React.FC<MapScreenProps> = ({
  pokemonEncounters = [],
  onPokemonPress,
  showUserLocation = true,
  followUser = false,
  mapType = 'standard',
  initialRegion,
}) => {
  const [loading, setLoading] = useState(true);
  const [currentMapType, setCurrentMapType] = useState(mapType);
  const mapRef = useRef<MapView>(null);
  const { currentLocation } = useSelector((state: RootState) => state.app);
  const dispatch = useDispatch();

  useEffect(() => {
    initializeMap();
  }, []);

  const initializeMap = async () => {
    try {
      if (!currentLocation) {
        const hasPermission = await locationService.requestLocationPermission();
        if (hasPermission) {
          const location = await locationService.getCurrentLocation();
          if (location) {
            dispatch(setCurrentLocation(location));
          }
        }
      }
    } catch (error) {
      console.log('Map initialization error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitialRegion = (): Region => {
    if (initialRegion) return initialRegion;
    
    if (currentLocation) {
      return {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }
    
    // Default to a general location if no user location
    return {
      latitude: 37.7749,
      longitude: -122.4194,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    };
  };

  const centerOnUser = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  const toggleMapType = () => {
    const types: Array<'standard' | 'satellite' | 'hybrid' | 'terrain'> = 
      ['standard', 'satellite', 'hybrid', 'terrain'];
    const currentIndex = types.indexOf(currentMapType);
    const nextIndex = (currentIndex + 1) % types.length;
    setCurrentMapType(types[nextIndex]);
  };

  const getBiomeMarkerColor = (biome?: string): string => {
    const colors = {
      water: '#3498db',
      grass: '#27ae60',
      urban: '#95a5a6',
      mountain: '#8b4513',
      desert: '#f39c12',
      normal: '#e74c3c',
    };
    return colors[biome as keyof typeof colors] || colors.normal;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2c5aa0" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={getInitialRegion()}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={false}
        followsUserLocation={followUser}
        showsCompass={true}
        showsScale={true}
        mapType={currentMapType}
        onMapReady={() => {
          console.log('Map is ready');
        }}
      >
        {pokemonEncounters.map((encounter, index) => {
          const distance = currentLocation ? locationService.calculateDistance(
            currentLocation.latitude,
            currentLocation.longitude,
            encounter.location.latitude,
            encounter.location.longitude
          ) : 0;
          
          return (
            <Marker
              key={`${encounter.pokemon.id}-${encounter.timestamp}-${index}`}
              coordinate={encounter.location}
              title={encounter.pokemon.name}
              description={`${Math.round(distance)}m away • ${encounter.biome || 'unknown'} biome`}
              onPress={() => onPokemonPress?.(encounter)}
            >
              <View style={[
                styles.markerContainer,
                { borderColor: getBiomeMarkerColor(encounter.biome) }
              ]}>
                <Image
                  source={{ uri: encounter.pokemon.sprites.front_default }}
                  style={styles.markerImage}
                  resizeMode="contain"
                />
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Map Controls */}
      <View style={styles.mapControls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={centerOnUser}
        >
          <Text style={styles.controlButtonText}>📍</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.controlButton}
          onPress={toggleMapType}
        >
          <Text style={styles.controlButtonText}>🗺️</Text>
        </TouchableOpacity>
      </View>

      {/* Map Type Indicator */}
      <View style={styles.mapTypeIndicator}>
        <Text style={styles.mapTypeText}>{currentMapType}</Text>
      </View>

      {/* Pokemon Count */}
      {pokemonEncounters.length > 0 && (
        <View style={styles.pokemonCounter}>
          <Text style={styles.pokemonCountText}>
            {pokemonEncounters.length} Pokemon nearby
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 25,
    borderWidth: 3,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  markerImage: {
    width: 40,
    height: 40,
  },
  mapControls: {
    position: 'absolute',
    top: 50,
    right: 16,
    flexDirection: 'column',
  },
  controlButton: {
    backgroundColor: 'white',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  controlButtonText: {
    fontSize: 20,
  },
  mapTypeIndicator: {
    position: 'absolute',
    top: 50,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  mapTypeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  pokemonCounter: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(44, 90, 160, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  pokemonCountText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default MapScreen;