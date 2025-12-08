import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
let gyroscope: any = null;
let setUpdateIntervalForType: any = null;
let SensorTypes: any = null;

try {
  const sensors = require('react-native-sensors');
  gyroscope = sensors.gyroscope;
  setUpdateIntervalForType = sensors.setUpdateIntervalForType;
  SensorTypes = sensors.SensorTypes;
} catch (e) {
  console.log('Sensors module not available');
}
import { pokeAPI } from './api';

const { width, height } = Dimensions.get('window');

interface Habitat {
  name: string;
  panoramaUrl: string;
  pokemonTypes: string[];
  description: string;
}

const HABITATS: Habitat[] = [
  {
    name: 'Forest',
    panoramaUrl: 'https://images.unsplash.com/photo-1511497584788-876760111969?w=1200',
    pokemonTypes: ['grass', 'bug', 'normal'],
    description: 'Dense forests where grass and bug Pokemon thrive',
  },
  {
    name: 'Ocean',
    panoramaUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200',
    pokemonTypes: ['water', 'ice'],
    description: 'Deep waters home to water and ice Pokemon',
  },
  {
    name: 'Mountain',
    panoramaUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200',
    pokemonTypes: ['rock', 'ground', 'flying'],
    description: 'Rocky peaks where rock and flying Pokemon dwell',
  },
  {
    name: 'Volcano',
    panoramaUrl: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=1200',
    pokemonTypes: ['fire', 'dragon'],
    description: 'Fiery landscape inhabited by fire Pokemon',
  },
];

export const VRLiteHabitatScreen: React.FC = () => {
  const [currentHabitat, setCurrentHabitat] = useState(0);
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const [gyroEnabled, setGyroEnabled] = useState(false);
  const [pokemon, setPokemon] = useState<any>(null);

  useEffect(() => {
    loadRandomPokemon();
  }, [currentHabitat]);

  useEffect(() => {
    if (!gyroEnabled || !gyroscope) return;

    if (setUpdateIntervalForType && SensorTypes) {
      setUpdateIntervalForType(SensorTypes.gyroscope, 100);
    }

    const subscription = gyroscope.subscribe(
      ({ x, y, z }) => {
        setRotation((prev) => ({
          x: prev.x + x * 2,
          y: prev.y + y * 2,
          z: prev.z + z * 2,
        }));
      },
      (error) => {
        console.log('Gyroscope error:', error);
        Alert.alert('Sensor Error', 'Gyroscope not available on this device');
      }
    );

    return () => subscription.unsubscribe();
  }, [gyroEnabled]);

  const loadRandomPokemon = async () => {
    try {
      const randomPokemon = await pokeAPI.getRandomPokemon();
      setPokemon(randomPokemon);
    } catch (error) {
      console.log('Failed to load Pokemon:', error);
    }
  };

  const toggleGyro = () => {
    if (!gyroscope) {
      Alert.alert('Not Available', 'Gyroscope sensor not available on this device');
      return;
    }
    setGyroEnabled(!gyroEnabled);
    if (!gyroEnabled) {
      Alert.alert(
        'VR Mode',
        'Move your device to look around the habitat. Tilt left/right to rotate the view.',
        [{ text: 'OK' }]
      );
    }
  };

  const nextHabitat = () => {
    setCurrentHabitat((prev) => (prev + 1) % HABITATS.length);
    setRotation({ x: 0, y: 0, z: 0 });
  };

  const prevHabitat = () => {
    setCurrentHabitat((prev) => (prev - 1 + HABITATS.length) % HABITATS.length);
    setRotation({ x: 0, y: 0, z: 0 });
  };

  const habitat = HABITATS[currentHabitat];

  return (
    <View style={styles.container}>
      <View style={styles.panoramaContainer}>
        <Image
          source={{ uri: habitat.panoramaUrl }}
          style={[
            styles.panorama,
            {
              transform: [
                { translateX: rotation.y * 0.5 },
                { scale: 1.5 },
              ],
            },
          ]}
          resizeMode="cover"
        />
        
        {pokemon && (
          <View style={[
            styles.pokemonOverlay,
            {
              transform: [
                { translateX: -rotation.y * 0.3 },
                { translateY: rotation.x * 0.2 },
              ],
            },
          ]}>
            <Image
              source={{ uri: pokemon.sprites.front_default }}
              style={styles.pokemonImage}
            />
            <Text style={styles.pokemonName}>{pokemon.name.toUpperCase()}</Text>
          </View>
        )}
      </View>

      <View style={styles.overlay}>
        <View style={styles.header}>
          <Text style={styles.title}>{habitat.name} Habitat</Text>
          <Text style={styles.description}>{habitat.description}</Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.navButton} onPress={prevHabitat}>
            <Text style={styles.navButtonText}>← Prev</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gyroButton, gyroEnabled && styles.gyroButtonActive]}
            onPress={toggleGyro}
          >
            <Text style={styles.gyroButtonText}>
              {gyroEnabled ? '🥽 VR ON' : '🥽 VR OFF'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navButton} onPress={nextHabitat}>
            <Text style={styles.navButtonText}>Next →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.typesList}>
          <Text style={styles.typesLabel}>Pokemon Types:</Text>
          <View style={styles.typesContainer}>
            {habitat.pokemonTypes.map((type, index) => (
              <View
                key={index}
                style={[
                  styles.typeTag,
                  { backgroundColor: pokeAPI.getTypeColor(type) },
                ]}
              >
                <Text style={styles.typeText}>{type}</Text>
              </View>
            ))}
          </View>
        </View>

        {gyroEnabled && (
          <View style={styles.gyroInfo}>
            <Text style={styles.gyroInfoText}>
              📱 Move your device to explore
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  panoramaContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  panorama: {
    width: width * 2,
    height: height,
    position: 'absolute',
  },
  pokemonOverlay: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    marginLeft: -60,
    alignItems: 'center',
  },
  pokemonImage: {
    width: 120,
    height: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  pokemonName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  header: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#ddd',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  navButton: {
    backgroundColor: 'rgba(44, 90, 160, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  gyroButton: {
    backgroundColor: 'rgba(40, 167, 69, 0.9)',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#fff',
  },
  gyroButtonActive: {
    backgroundColor: 'rgba(220, 53, 69, 0.9)',
  },
  gyroButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  typesList: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 20,
    paddingBottom: 30,
  },
  typesLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  typesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  typeTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  typeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  gyroInfo: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  gyroInfoText: {
    fontSize: 16,
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
});
