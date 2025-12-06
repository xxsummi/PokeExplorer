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
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { RootState, setCurrentLocation, addEncounter, addDiscoveredPokemon } from './store';
import { Pokemon, PokemonEncounter, Location } from './types';
import { locationService } from './locationService';
import { GOOGLE_MAPS_API_KEY } from '@env';

export const HuntScreen: React.FC = () => {
  const [hunting, setHunting] = useState(false);
  const [nearbyPokemon, setNearbyPokemon] = useState<PokemonEncounter[]>([]);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [watchId, setWatchId] = useState<number | null>(null);
  const mapRef = useRef<MapView>(null);
  const { currentLocation, encounters } = useSelector((state: RootState) => state.app);
  const dispatch = useDispatch();

  useEffect(() => {
    initializeHunt();
  }, []);

  const initializeHunt = async () => {
    const hasPermission = await locationService.requestLocationPermission();
    if (hasPermission) {
      getCurrentLocation();
    } else {
      Alert.alert('Permission Denied', 'Location permission is required for Pokemon hunting');
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await locationService.getCurrentLocation();
      if (location) {
        dispatch(setCurrentLocation(location));
        generateNearbyPokemon(location);
        
        // Center map on user location
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            ...location,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }, 1000);
        }
      }
    } catch (error) {
      console.log('Location error:', error);
      Alert.alert(
        'Location Error', 
        'Unable to get current location. Please check your location settings and try again.'
      );
    }
  };

  const startLocationTracking = async () => {
    try {
      const id = await locationService.watchLocation((location) => {
        dispatch(setCurrentLocation(location));
      });
      setWatchId(id);
    } catch (error) {
      console.log('Location tracking error:', error);
    }
  };

  const stopLocationTracking = () => {
    locationService.stopWatching();
    setWatchId(null);
  };

  const generateNearbyPokemon = async (location: Location) => {
    try {
      const count = Math.floor(Math.random() * 3) + 3;
      const encounters = await locationService.generatePokemonEncounters(location, count);
      setNearbyPokemon(encounters);
    } catch (error) {
      console.log('Error in generateNearbyPokemon:', error);
      Alert.alert('Error', 'Unable to generate nearby Pokemon. Please try again.');
    }
  };

  const startHunt = () => {
    if (!currentLocation) {
      Alert.alert('Error', 'Location not available');
      return;
    }
    
    setHunting(true);
    startLocationTracking();
    getCurrentLocation();
  };

  const stopHunt = () => {
    setHunting(false);
    stopLocationTracking();
  };

  const catchPokemon = (encounter: PokemonEncounter) => {
    if (!currentLocation) return;
    
    const distance = locationService.calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      encounter.location.latitude,
      encounter.location.longitude
    );
    
    if (distance > 100) {
      Alert.alert('Too Far!', 'You need to be within 100m to catch this Pokemon!');
      return;
    }
    
    Alert.alert(
      'Pokemon Found!',
      `You found a ${encounter.pokemon.name}! Distance: ${Math.round(distance)}m`,
      [
        { text: 'Run Away', style: 'cancel' },
        {
          text: 'Catch!',
          onPress: () => {
            const catchSuccess = Math.random() > 0.3; // 70% success rate
            if (catchSuccess) {
              dispatch(addEncounter(encounter));
              dispatch(addDiscoveredPokemon(encounter.pokemon));
              setNearbyPokemon(prev => prev.filter(p => p !== encounter));
              Alert.alert('Success!', `${encounter.pokemon.name} has been added to your Pokedex!`);
            } else {
              Alert.alert('Oh no!', `${encounter.pokemon.name} escaped! Try again later.`);
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    return () => {
      stopLocationTracking();
    };
  }, []);

  if (!currentLocation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2c5aa0" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  const renderMapView = () => {
    return (
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
        followsUserLocation={hunting}
        showsCompass={true}
        showsScale={true}
        mapType="standard"
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
              key={`${encounter.pokemon.id}-${index}`}
              coordinate={encounter.location}
              title={encounter.pokemon.name}
              description={`${Math.round(distance)}m away • ${encounter.biome} biome`}
              onPress={() => catchPokemon(encounter)}
            >
              <View style={styles.markerContainer}>
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
    );
  };

  const renderListView = () => {
    return (
      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Nearby Pokemon</Text>
        <Text style={styles.locationText}>
          Location: {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
        </Text>
        
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
              onPress={() => catchPokemon(encounter)}
            >
              <Image
                source={{ uri: encounter.pokemon.sprites.front_default }}
                style={styles.pokemonListImage}
              />
              <View style={styles.pokemonInfo}>
                <Text style={styles.pokemonName}>{encounter.pokemon.name}</Text>
                <Text style={styles.pokemonDistance}>{Math.round(distance)}m away</Text>
                <Text style={styles.pokemonBiome}>{encounter.biome} biome</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pokemon Hunt</Text>
        <View style={styles.viewToggle}>
          <TouchableOpacity 
            style={[styles.toggleButton, viewMode === 'map' && styles.activeToggle]}
            onPress={() => setViewMode('map')}
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
      </View>
      
      <View style={styles.mapContainer}>
        {viewMode === 'map' ? renderMapView() : renderListView()}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.huntButton, hunting && styles.huntingButton]}
          onPress={hunting ? stopHunt : startHunt}
        >
          <Text style={styles.huntButtonText}>
            {hunting ? 'Stop Hunt' : 'Start Hunt'}
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.infoText}>
          {nearbyPokemon.length} Pokemon nearby
        </Text>
        
        <Text style={styles.infoText}>
          Total caught: {encounters.length}
        </Text>
        
        {hunting && (
          <Text style={styles.huntingStatus}>
            🎯 Hunting active - Move around to find Pokemon!
          </Text>
        )}
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
  pokemonBiome: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
    textTransform: 'capitalize',
  },
});