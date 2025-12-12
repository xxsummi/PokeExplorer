import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  Image,
  ScrollView,
  ToastAndroid,
  InteractionManager,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, setCurrentLocation, addEncounter, addDiscoveredPokemon, catchPokemon } from './store';
import { Pokemon, PokemonEncounter, Location } from './types';
import { locationService } from './locationService';
import PushNotification from 'react-native-push-notification';

// Import MapView - will use list view if not available
let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;

try {
  const RNMaps = require('react-native-maps');
  MapView = RNMaps.default || RNMaps;
  Marker = RNMaps.Marker;
  PROVIDER_GOOGLE = RNMaps.PROVIDER_GOOGLE;
} catch (e) {
  console.log('Maps not available, using list view');
}

interface HuntScreenProps {
  onCatchMode: (spawn: any) => void;
}

export const HuntScreen: React.FC<HuntScreenProps> = ({ onCatchMode }) => {
  const [hunting, setHunting] = useState(false);
  // Using shared spawns from Redux store
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [watchId, setWatchId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<any>(null);

  const { currentLocation, encounters, spawns, caughtPokemon } = useSelector((state: RootState) => state.app);
  const dispatch = useDispatch();

  useEffect(() => {
    const init = async () => {
      await initializeHunt();
      if (currentLocation && currentLocation.latitude !== 0) {
        setHunting(true);
      }
    };
    init();
  }, []);



  const initializeHunt = async () => {
    try {
      dispatch(setCurrentLocation({ latitude: 0, longitude: 0 }));
    } catch (error) {
      console.log('Hunt init error:', error);
      setError('Location services unavailable');
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await locationService.getCurrentLocation();
      if (location) {
        dispatch(setCurrentLocation(location));
        
        // Location updated
        
        // Center map on user location
        if (MapView && mapRef.current) {
          try {
            mapRef.current.animateToRegion({
              ...location,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }, 1000);
          } catch (mapError) {
            console.error('Map animation error:', mapError);
          }
        }
      }
    } catch (error) {
      console.error('Location error:', error);
      // Set a default location to prevent crash
      dispatch(setCurrentLocation({
        latitude: 37.7749,
        longitude: -122.4194,
      }));
    }
  };

  const startLocationTracking = async () => {
    try {
      const id = await locationService.watchLocation((location) => {
        dispatch(setCurrentLocation(location));
      });
      setWatchId(id);
    } catch (error) {
      console.error('Location tracking error:', error);
      // Continue without tracking
    }
  };

  const stopLocationTracking = () => {
    locationService.stopWatching();
    setWatchId(null);
  };





  const stopHunt = () => {
    setHunting(false);
    stopLocationTracking();
  };

  const handleCatch = useCallback((spawn: any) => {
    const distance = locationService.calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      spawn.location.latitude,
      spawn.location.longitude
    );
    
    if (distance > 100) {
      Alert.alert('Too Far!', `${spawn.pokemon.name} is too far away`);
      return;
    }
    
    onCatchMode(spawn);
  }, [currentLocation, onCatchMode]);

  useEffect(() => {
    return () => {
      stopLocationTracking();
    };
  }, []);

  useEffect(() => {
    if (viewMode === 'map' && MapView && mapRef.current && currentLocation && currentLocation.latitude !== 0) {
      setTimeout(() => {
        mapRef.current?.animateToRegion({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 500);
      }, 100);
    }
  }, [viewMode]);

  const handleMapPress = () => {
    setViewMode('map');
    if (mapRef.current && currentLocation && currentLocation.latitude !== 0) {
      setTimeout(() => {
        mapRef.current?.animateToRegion({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 600);
      }, 200);
    }
  };

  if (!currentLocation || typeof currentLocation.latitude !== 'number' || typeof currentLocation.longitude !== 'number') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2c5aa0" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  const visibleSpawns = spawns.filter(spawn => 
    !spawn.caught && spawn.expiresAt > Date.now()
  );


  const renderMapView = () => {
    if (!MapView || !currentLocation) {
      return (
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPlaceholderText}>📍 Map View Unavailable</Text>
          <Text style={styles.mapPlaceholderSubtext}>Using List View</Text>
        </View>
      );
    }
    
    try {
      return (
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: currentLocation.latitude !== 0 ? currentLocation.latitude : 37.7749,
            longitude: currentLocation.longitude !== 0 ? currentLocation.longitude : -122.4194,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation={true}
          showsMyLocationButton={true}
          followsUserLocation={hunting}
          showsCompass={true}
          showsScale={true}
          mapType="standard"
          onMapReady={() => {
            if (mapRef.current && currentLocation.latitude !== 0) {
              setTimeout(() => {
                mapRef.current?.animateToRegion({
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }, 1000);
              }, 500);
            }
          }}
          onUserLocationChange={(event) => {
            if (event.nativeEvent.coordinate) {
              const { latitude, longitude } = event.nativeEvent.coordinate;
              if (currentLocation.latitude === 0 && currentLocation.longitude === 0) {
                dispatch(setCurrentLocation({ latitude, longitude }));
                setTimeout(() => {
                  mapRef.current?.animateToRegion({
                    latitude,
                    longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }, 1000);
                }, 300);
              }
            }
          }}
        >
        {visibleSpawns.map((spawn, index) => {
          const distance = currentLocation ? locationService.calculateDistance(
            currentLocation.latitude,
            currentLocation.longitude,
            spawn.location.latitude,
            spawn.location.longitude
          ) : 0;
          
          return (
            <Marker
              key={spawn.id}
              coordinate={spawn.location}
              title={spawn.pokemon.name}
              description={`Tap here to catch • ${Math.round(distance)}m away`}
              image={{ uri: spawn.pokemon.sprites.front_default }}
              onPress={() => handleCatch(spawn)}
              onCalloutPress={() => handleCatch(spawn)}
            />
          );
        })}
        </MapView>
      );
    } catch (error) {
      console.log('Map render error:', error);
      return (
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPlaceholderText}>📍 Map Error</Text>
          <Text style={styles.mapPlaceholderSubtext}>Using List View</Text>
        </View>
      );
    }
  };

  const renderListView = () => {
    return (
      <ScrollView style={styles.listContainer}>
        <Text style={styles.listTitle}>Nearby Pokemon</Text>
        <Text style={styles.locationText}>
          Location: {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
        </Text>
        
        {visibleSpawns.length === 0 && (
          <Text style={styles.noPokemonText}>No Pokemon nearby. Check the Feed for spawns!</Text>
        )}
        
        {visibleSpawns.map((spawn, index) => {
          const distance = currentLocation ? locationService.calculateDistance(
            currentLocation.latitude,
            currentLocation.longitude,
            spawn.location.latitude,
            spawn.location.longitude
          ) : 0;
          
          return (
            <TouchableOpacity 
              key={spawn.id}
              style={styles.pokemonItem}
              onPress={() => handleCatch(spawn)}
            >
              <Image
                source={{ uri: spawn.pokemon.sprites.front_default }}
                style={styles.pokemonListImage}
              />
              <View style={styles.pokemonInfo}>
                <Text style={styles.pokemonName}>{spawn.pokemon.name}</Text>
                <Text style={styles.pokemonDistance}>{Math.round(distance)}m away</Text>
                <Text style={styles.pokemonCoords}>📍 {spawn.location.latitude.toFixed(4)}, {spawn.location.longitude.toFixed(4)}</Text>
                <Text style={styles.pokemonTime}>Expires in {Math.ceil((spawn.expiresAt - Date.now()) / 60000)}m</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pokemon Hunt</Text>
        {MapView && (
          <View style={styles.viewToggle}>
            <TouchableOpacity 
              style={[styles.toggleButton, viewMode === 'map' && styles.activeToggle]}
              onPress={handleMapPress}
            >
              <Text style={[styles.toggleText, viewMode === 'map' && styles.activeToggleText]}>Map</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleButton, viewMode === 'list' && styles.activeToggle]}
              onPress={() => setViewMode('list')}
            >
              <Text style={[styles.toggleText, viewMode === 'list' && styles.activeToggleText]}>List</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      <View style={styles.mapContainer}>
        {viewMode === 'map' && MapView ? renderMapView() : renderListView()}
      </View>

      <View style={styles.controls}>
        <Text style={styles.infoText}>
          Pokémon spawn automatically in the background
        </Text>
        
        <Text style={styles.infoText}>
          {visibleSpawns.length} Pokemon nearby
        </Text>
        
        <Text style={styles.infoText}>
          Total caught: {caughtPokemon.length}
        </Text>
        
        <Text style={styles.huntingStatus}>
          🎯 Hunting active - Move around to find Pokemon!
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8ff',
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c5aa0',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
    padding: 2,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
  },
  activeToggle: {
    backgroundColor: '#2c5aa0',
  },
  toggleText: {
    fontSize: 14,
    color: '#666',
  },
  activeToggleText: {
    color: '#fff',
  },
  mapContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  mapPlaceholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  mapPlaceholderSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  listContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  locationText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 16,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerImage: {
    width: 40,
    height: 40,
  },
  controls: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  rescanButton: {
    backgroundColor: '#27ae60',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  rescanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  huntButton: {
    backgroundColor: '#2c5aa0',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  huntingButton: {
    backgroundColor: '#e74c3c',
  },
  huntButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  huntingStatus: {
    textAlign: 'center',
    fontSize: 14,
    color: '#27ae60',
    fontWeight: 'bold',
    marginTop: 8,
  },
  catchMessage: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c5aa0',
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  pokemonItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pokemonListImage: {
    width: 50,
    height: 50,
    marginRight: 12,
  },
  pokemonInfo: {
    flex: 1,
  },
  pokemonName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c5aa0',
    textTransform: 'capitalize',
  },
  pokemonDistance: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  pokemonCoords: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  pokemonBiome: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  pokemonTime: {
    fontSize: 12,
    color: '#E53E3E',
    marginTop: 2,
    fontWeight: '500',
  },
  noPokemonText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
    marginTop: 32,
    paddingHorizontal: 32,
  },
});
