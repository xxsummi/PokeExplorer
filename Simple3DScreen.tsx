import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  Dimensions,
  Image,
  PanResponder,
} from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { useDispatch } from 'react-redux';
import { addDiscoveredPokemon } from './store';
import { pokeAPI } from './api';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const { width, height } = Dimensions.get('window');

interface Pokemon3D {
  id: number;
  name: string;
  sprite: string;
  baseX: number;
  baseY: number;
  translateX: Animated.Value;
  translateY: Animated.Value;
  scale: Animated.Value;
  rotation: Animated.Value;
}

const getTypeColor = (type: string): string => {
  const colors: { [key: string]: string } = {
    fire: '#FF6B6B', water: '#4ECDC4', grass: '#45B7D1',
    electric: '#FFA07A', psychic: '#DDA0DD', ice: '#87CEEB',
    dragon: '#9370DB', dark: '#696969', fairy: '#FFB6C1',
    fighting: '#CD5C5C', poison: '#BA55D3', ground: '#F4A460',
    flying: '#87CEFA', bug: '#9ACD32', rock: '#A0522D',
    ghost: '#8A2BE2', steel: '#B0C4DE', normal: '#D3D3D3',
  };
  return colors[type] || '#D3D3D3';
};

const Pokemon3DComponent: React.FC<{ pokemon: Pokemon3D; onCatch: () => void }> = ({ pokemon, onCatch }) => {
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pokemon.scale, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pokemon.scale, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(pokemon.rotation, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = pokemon.rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.pokemon3D,
        {
          transform: [
            { translateX: pokemon.translateX },
            { translateY: pokemon.translateY },
            { scale: pokemon.scale },
            { rotateY: spin },
            { perspective: 1000 },
          ],
        },
      ]}
    >
      <TouchableOpacity onPress={onCatch} style={styles.pokemonTouchable}>
        <Image 
          source={{ uri: pokemon.sprite }}
          style={styles.pokemonSprite}
        />
        <Text style={styles.pokemonName}>{pokemon.name.toUpperCase()}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const Simple3DScreen: React.FC = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [pokemon, setPokemon] = useState<Pokemon3D[]>([]);
  const [cameraOffset, setCameraOffset] = useState({ x: 0, y: 0 });
  const device = useCameraDevice('back');
  const dispatch = useDispatch();

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (evt, gestureState) => {
      const newOffset = {
        x: gestureState.dx * 0.5,
        y: gestureState.dy * 0.5,
      };
      setCameraOffset(newOffset);
      
      // Update Pokemon positions to simulate 3D space
      pokemon.forEach((poke) => {
        Animated.timing(poke.translateX, {
          toValue: poke.baseX - newOffset.x,
          duration: 50,
          useNativeDriver: true,
        }).start();
        
        Animated.timing(poke.translateY, {
          toValue: poke.baseY - newOffset.y,
          duration: 50,
          useNativeDriver: true,
        }).start();
      });
    },
    onPanResponderRelease: () => {
      // Gradually return to center
      setCameraOffset({ x: 0, y: 0 });
      pokemon.forEach((poke) => {
        Animated.timing(poke.translateX, {
          toValue: poke.baseX,
          duration: 500,
          useNativeDriver: true,
        }).start();
        
        Animated.timing(poke.translateY, {
          toValue: poke.baseY,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
    },
  });

  const requestCameraPermission = async () => {
    const result = await request(PERMISSIONS.ANDROID.CAMERA);
    setHasPermission(result === RESULTS.GRANTED);
  };

  const spawnPokemon = async () => {
    try {
      const pokemonData = await pokeAPI.getRandomPokemon();
      
      const baseX = Math.random() * (width - 100);
      const baseY = Math.random() * (height - 200) + 100;
      
      const newPokemon: Pokemon3D = {
        id: Date.now(),
        name: pokemonData.name,
        sprite: pokemonData.sprites.front_default,
        baseX,
        baseY,
        translateX: new Animated.Value(baseX),
        translateY: new Animated.Value(baseY),
        scale: new Animated.Value(1),
        rotation: new Animated.Value(0),
      };
      
      setPokemon(prev => [...prev, newPokemon]);
      console.log('Spawned 3D Pokemon:', newPokemon.name);
      
      setTimeout(() => {
        setPokemon(prev => prev.filter(p => p.id !== newPokemon.id));
      }, 10000);
      
    } catch (error) {
      console.log('Failed to spawn Pokemon:', error);
    }
  };

  const catchPokemon = async (pokemonToCatch: Pokemon3D) => {
    try {
      const pokemonData = await pokeAPI.getRandomPokemon();
      dispatch(addDiscoveredPokemon(pokemonData));
      
      setPokemon(prev => prev.filter(p => p.id !== pokemonToCatch.id));
      
      Alert.alert(
        'Pokemon Caught!',
        `You caught ${pokemonToCatch.name}! Added to your Pokedex.`
      );
    } catch (error) {
      console.log('Failed to catch Pokemon:', error);
    }
  };

  if (!hasPermission || !device) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>3D Pokemon Camera</Text>
        <Text style={styles.description}>Camera permission required for 3D Pokemon experience</Text>
        <TouchableOpacity style={styles.startButton} onPress={requestCameraPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.arContainer} {...panResponder.panHandlers}>
      <Camera style={styles.camera} device={device} isActive={true} />
      
      {pokemon.map((poke) => (
        <Pokemon3DComponent
          key={poke.id}
          pokemon={poke}
          onCatch={() => catchPokemon(poke)}
        />
      ))}
      
      <View style={styles.controls}>
        <TouchableOpacity style={styles.spawnButton} onPress={spawnPokemon}>
          <Text style={styles.buttonText}>Spawn 3D Pokemon</Text>
        </TouchableOpacity>
        <Text style={styles.instructionText}>Drag to look around</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c5aa0',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 32,
  },
  startButton: {
    backgroundColor: '#2c5aa0',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
  },
  arContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  pokemon3D: {
    position: 'absolute',
    alignItems: 'center',
  },
  pokemonTouchable: {
    alignItems: 'center',
  },
  pokemonSprite: {
    width: 100,
    height: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  pokemonName: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  controls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  spawnButton: {
    backgroundColor: '#2c5aa0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  instructionText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
});