import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { ArViewerView } from 'react-native-ar-viewer';
import { useDispatch } from 'react-redux';
import { addDiscoveredPokemon } from './store';
import { pokeAPI } from './api';

export const RealARScreen: React.FC = () => {
  const [pokemonModel, setPokemonModel] = useState<string | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);
  const dispatch = useDispatch();

  const placePokemon = async () => {
    try {
      const pokemonData = await pokeAPI.getRandomPokemon();
      
      // For demo, we'll use a simple 3D model URL
      // In production, you'd have actual Pokemon 3D models
      const modelUrl = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF/Duck.gltf';
      
      setPokemonModel(modelUrl);
      setIsPlacing(true);
      
      dispatch(addDiscoveredPokemon(pokemonData));
      
      Alert.alert(
        'Pokemon Placed!',
        `${pokemonData.name} has been placed in AR! Tap on the surface to anchor it.`
      );
      
    } catch (error) {
      console.log('Failed to place Pokemon:', error);
      Alert.alert('Error', 'Failed to load Pokemon');
    }
  };

  const onARPlaneDetected = () => {
    console.log('AR plane detected - ready for placement');
  };

  const onARModelPlaced = () => {
    console.log('Pokemon model placed in AR');
    setIsPlacing(false);
  };

  return (
    <View style={styles.container}>
      <ArViewerView
        style={styles.arView}
        model={pokemonModel || ''}
        onDataReturned={() => {}}
        onModelPlaced={onARModelPlaced}
        lightEstimation={true}
        planeOrientation="both"
      />
      
      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.placeButton, isPlacing && styles.placingButton]} 
          onPress={placePokemon}
          disabled={isPlacing}
        >
          <Text style={styles.buttonText}>
            {isPlacing ? 'Tap surface to place' : 'Place Pokemon in AR'}
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.instructionText}>
          {pokemonModel 
            ? 'Move your device to detect surfaces, then tap to place Pokemon'
            : 'Press button to spawn a Pokemon in real AR'
          }
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  arView: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  placeButton: {
    backgroundColor: '#2c5aa0',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 25,
    marginBottom: 16,
  },
  placingButton: {
    backgroundColor: '#ff6b6b',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  instructionText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
});