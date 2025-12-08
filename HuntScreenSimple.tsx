import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { RootState, setCurrentLocation, addEncounter, addDiscoveredPokemon } from './store';
import { Pokemon, PokemonEncounter, Location } from './types';
import { pokeAPI } from './api';

export const HuntScreen: React.FC = () => {
  const [hunting, setHunting] = useState(false);
  const [nearbyPokemon, setNearbyPokemon] = useState<PokemonEncounter[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentLocation, encounters } = useSelector((state: RootState) => state.app);
  const dispatch = useDispatch();

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const permission = PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
      const result = await request(permission);
      
      if (result === RESULTS.GRANTED) {
        // Simulate location for emulator
        const mockLocation = {
          latitude: 37.7749 + (Math.random() - 0.5) * 0.01,
          longitude: -122.4194 + (Math.random() - 0.5) * 0.01,
        };
        dispatch(setCurrentLocation(mockLocation));
      }
    } catch (error) {
      console.log('Permission error:', error);
    }
  };

  const generateNearbyPokemon = async () => {
    if (!currentLocation) return;
    
    setLoading(true);
    try {
      const pokemon: PokemonEncounter[] = [];
      const count = Math.floor(Math.random() * 3) + 3;
      
      for (let i = 0; i < count; i++) {
        const randomPokemon = await pokeAPI.getRandomPokemon();
        const offsetLat = (Math.random() - 0.5) * 0.01;
        const offsetLng = (Math.random() - 0.5) * 0.01;
        
        const encounter: PokemonEncounter = {
          pokemon: randomPokemon,
          location: {
            latitude: currentLocation.latitude + offsetLat,
            longitude: currentLocation.longitude + offsetLng,
          },
          timestamp: Date.now(),
          biome: 'normal',
        };
        
        pokemon.push(encounter);
      }
      
      setNearbyPokemon(pokemon);
    } catch (error) {
      console.log('Error generating Pokemon:', error);
    } finally {
      setLoading(false);
    }
  };

  const startHunt = () => {
    if (!currentLocation) {
      Alert.alert('Error', 'Location not available');
      return;
    }
    
    setHunting(true);
    generateNearbyPokemon();
  };

  const stopHunt = () => {
    setHunting(false);
    setNearbyPokemon([]);
  };

  const catchPokemon = (encounter: PokemonEncounter) => {
    Alert.alert(
      'Pokemon Found!',
      `You found a ${encounter.pokemon.name}!`,
      [
        { text: 'Run Away', style: 'cancel' },
        {
          text: 'Catch!',
          onPress: () => {
            dispatch(addEncounter(encounter));
            dispatch(addDiscoveredPokemon(encounter.pokemon));
            setNearbyPokemon(prev => prev.filter(p => p !== encounter));
            Alert.alert('Success!', `${encounter.pokemon.name} has been added to your Pokedex!`);
          },
        },
      ]
    );
  };

  if (!currentLocation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2c5aa0" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pokemon Hunt</Text>
        <Text style={styles.locationText}>
          📍 {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
        </Text>
      </View>
      
      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2c5aa0" />
            <Text>Searching for Pokemon...</Text>
          </View>
        ) : (
          nearbyPokemon.map((encounter, index) => (
            <TouchableOpacity 
              key={`${encounter.pokemon.id}-${index}`}
              style={styles.pokemonItem}
              onPress={() => catchPokemon(encounter)}
            >
              <Image
                source={{ uri: encounter.pokemon.sprites.front_default }}
                style={styles.pokemonImage}
              />
              <View style={styles.pokemonInfo}>
                <Text style={styles.pokemonName}>{encounter.pokemon.name}</Text>
                <Text style={styles.pokemonDistance}>~{Math.floor(Math.random() * 500 + 50)}m away</Text>
                <Text style={styles.pokemonBiome}>Tap to catch!</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c5aa0',
    textAlign: 'center',
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  pokemonItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pokemonImage: {
    width: 60,
    height: 60,
    marginRight: 16,
  },
  pokemonInfo: {
    flex: 1,
  },
  pokemonName: {
    fontSize: 18,
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
    color: '#27ae60',
    marginTop: 2,
    fontWeight: 'bold',
  },
  controls: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
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
});