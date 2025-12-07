import React, { useState, useEffect, useRef } from 'react';
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
import { RootState, setCurrentLocation, addEncounter, addDiscoveredPokemon } from './store';
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

export const HuntScreen: React.FC = () => {
  const [hunting, setHunting] = useState(false);
  const [nearbyPokemon, setNearbyPokemon] = useState<PokemonEncounter[]>([]);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [watchId, setWatchId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<any>(null);
  const lastCatchTime = useRef<number>(0);
  const { currentLocation, encounters } = useSelector((state: RootState) => state.app);
  const dispatch = useDispatch();

  useEffect(() => {
    initializeHunt();
  }, []);

  useEffect(() => {
    if (currentLocation && currentLocation.latitude !== 0 && nearbyPokemon.length === 0) {
      setHunting(true);
      generateNearbyPokemon(currentLocation).catch(err => {
        console.error('Auto-hunt error:', err);
      });
    }
  }, [currentLocation]);



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
        
        // Generate Pokemon without awaiting to prevent blocking
        generateNearbyPokemon(location).catch(err => {
          console.error('Failed to generate Pokemon:', err);
        });
        
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

  const generateNearbyPokemon = async (location: Location) => {
    try {
      const count = Math.floor(Math.random() * 8) + 8;
      const encounters = await locationService.generatePokemonEncounters(location, count);
      setNearbyPokemon(encounters);
    } catch (error) {
      console.error('Error in generateNearbyPokemon:', error);
      setNearbyPokemon([]);
    }
  };

  const startHunt = async () => {
    if (!currentLocation) {
      Alert.alert('Error', 'Location not available');
      return;
    }
    
    try {
      setHunting(true);
      await generateNearbyPokemon(currentLocation);
    } catch (error) {
      console.error('Start hunt error:', error);
      Alert.alert('Error', 'Failed to start hunt. Please try again.');
      setHunting(false);
    }
  };

  const stopHunt = () => {
    setHunting(false);
    stopLocationTracking();
  };

  const catchPokemon = (encounter: PokemonEncounter) => {
    const now = Date.now();
    if (now - lastCatchTime.current < 500) return;
    lastCatchTime.current = now;

    if (!currentLocation || !encounter || !encounter.pokemon) return;
    
    const distance = locationService.calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      encounter.location.latitude,
      encounter.location.longitude
    );
    
    if (distance > 100) {
      PushNotification.localNotification({
        channelId: 'pokemon-hunt',
        title: 'Too Far! 📏',
        message: `${encounter.pokemon.name} is too far away`,
      });
      return;
    }
    
    const catchSuccess = Math.random() < 0.7;
    if (catchSuccess) {
      PushNotification.localNotification({
        channelId: 'pokemon-hunt',
        title: 'Pokemon Caught! 🎉',
        message: `You caught ${encounter.pokemon.name}!`,
      });
    } else {
      PushNotification.localNotification({
        channelId: 'pokemon-hunt',
        title: 'Pokemon Ran Away! 💨',
        message: `${encounter.pokemon.name} escaped!`,
      });
    }
  };

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
        {nearbyPokemon.map((encounter, index) => {
          const distance = currentLocation ? locationService.calculateDistance(
            currentLocation.latitude,
            currentLocation.longitude,
            encounter.location.latitude,
            encounter.location.longitude
          ) : 0;
          
          return (
            <Marker
              key={`${encounter.pokemon.id}-${encounter.timestamp}`}
              coordinate={encounter.location}
              title={encounter.pokemon.name}
              description={`Tap here to catch • ${Math.round(distance)}m away`}
              image={{ uri: encounter.pokemon.sprites.front_default }}
              onCalloutPress={() => {
                const distance = locationService.calculateDistance(
                  currentLocation.latitude,
                  currentLocation.longitude,
                  encounter.location.latitude,
                  encounter.location.longitude
                );
                
                if (distance > 100) {
                  Alert.alert('Too Far!', `${encounter.pokemon.name} is too far away`);
                  return;
                }
                
                const catchSuccess = Math.random() < 0.7;
                if (catchSuccess) {
                  Alert.alert('Pokemon Caught!', `You caught ${encounter.pokemon.name}!`);
                  dispatch(addEncounter(encounter));
                  dispatch(addDiscoveredPokemon(encounter.pokemon));
                  setNearbyPokemon(prev => prev.filter(p => p.timestamp !== encounter.timestamp));
                } else {
                  Alert.alert('Pokemon Ran Away!', `${encounter.pokemon.name} escaped!`);
                }
              }}
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
        
        {nearbyPokemon.length === 0 && (
          <Text style={styles.noPokemonText}>No Pokemon nearby. Start hunting to find some!</Text>
        )}
        
        {nearbyPokemon.map((encounter, index) => {
          const distance = currentLocation ? locationService.calculateDistance(
            currentLocation.latitude,
            currentLocation.longitude,
            encounter.location.latitude,
            encounter.location.longitude
          ) : 0;
          
          return (
            <TouchableOpacity 
              key={`${encounter.pokemon.id}-${index}`}
              style={styles.pokemonItem}
              onPress={() => {
                const distance = locationService.calculateDistance(
                  currentLocation.latitude,
                  currentLocation.longitude,
                  encounter.location.latitude,
                  encounter.location.longitude
                );
                
                if (distance > 100) {
                  Alert.alert('Too Far!', `${encounter.pokemon.name} is too far away`);
                  return;
                }
                
                const catchSuccess = Math.random() < 0.7;
                if (catchSuccess) {
                  Alert.alert('Pokemon Caught!', `You caught ${encounter.pokemon.name}!`);
                  dispatch(addEncounter(encounter));
                  dispatch(addDiscoveredPokemon(encounter.pokemon));
                  setNearbyPokemon(prev => prev.filter(p => p.timestamp !== encounter.timestamp));
                } else {
                  Alert.alert('Pokemon Ran Away!', `${encounter.pokemon.name} escaped!`);
                }
              }}
            >
              <Image
                source={{ uri: encounter.pokemon.sprites.front_default }}
                style={styles.pokemonListImage}
              />
              <View style={styles.pokemonInfo}>
                <Text style={styles.pokemonName}>{encounter.pokemon.name}</Text>
                <Text style={styles.pokemonDistance}>{Math.round(distance)}m away</Text>
                <Text style={styles.pokemonCoords}>📍 {encounter.location.latitude.toFixed(4)}, {encounter.location.longitude.toFixed(4)}</Text>
                <Text style={styles.pokemonBiome}>{encounter.biome} biome</Text>
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
        <TouchableOpacity 
          style={styles.rescanButton}
          onPress={() => {
            if (currentLocation) {
              generateNearbyPokemon(currentLocation);
            }
          }}
        >
          <Text style={styles.rescanButtonText}>🔄 Rescan Area</Text>
        </TouchableOpacity>
        
        <Text style={styles.infoText}>
          {nearbyPokemon.length} Pokemon nearby
        </Text>
        
        <Text style={styles.infoText}>
          Total caught: {encounters.length}
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
  noPokemonText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
    marginTop: 32,
    paddingHorizontal: 32,
  },
});