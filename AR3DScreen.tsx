import React, { useState, useEffect, useRef } from 'react';
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
  Platform,
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

interface Pokeball {
  id: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  translateX: Animated.Value;
  translateY: Animated.Value;
  targetPokemon: Pokemon3D;
}

const Pokemon3DComponent: React.FC<{ pokemon: Pokemon3D; onCatch: () => void }> = ({ pokemon, onCatch }) => {
  React.useEffect(() => {
    const scaleAnimation = Animated.loop(
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
    );
    
    const rotationAnimation = Animated.loop(
      Animated.timing(pokemon.rotation, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    );
    
    scaleAnimation.start();
    rotationAnimation.start();
    
    return () => {
      scaleAnimation.stop();
      rotationAnimation.stop();
    };
  }, [pokemon.id]);

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

export const AR3DScreen: React.FC = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [pokemon, setPokemon] = useState<Pokemon3D[]>([]);
  const [pokeballs, setPokeballs] = useState<Pokeball[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [catchingMode, setCatchingMode] = useState(false);
  const [targetPokemon, setTargetPokemon] = useState<Pokemon3D | null>(null);
  const [pokeballPosition] = useState(new Animated.ValueXY({ x: width / 2 - 25, y: height - 150 }));
  const isMoving = useRef(false);
  
  const camera = useRef<Camera>(null);
  const device = useCameraDevice('back');
  const dispatch = useDispatch();

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const pokeballPanResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      pokeballPosition.setOffset({
        x: pokeballPosition.x._value,
        y: pokeballPosition.y._value,
      });
    },
    onPanResponderMove: Animated.event(
      [null, { dx: pokeballPosition.x, dy: pokeballPosition.y }],
      { useNativeDriver: false }
    ),
    onPanResponderRelease: (evt, gestureState) => {
      pokeballPosition.flattenOffset();
      
      const velocity = Math.sqrt(gestureState.vx * gestureState.vx + gestureState.vy * gestureState.vy);
      
      if (velocity > 0.5) {
        const startX = width / 2;
        const startY = height - 150;
        const targetX = startX + gestureState.dx * 2;
        const targetY = startY + gestureState.dy * 2;
        
        throwPokeballToPosition(startX, startY, targetX, targetY);
      }
      
      Animated.spring(pokeballPosition, {
        toValue: { x: width / 2 - 25, y: height - 150 },
        useNativeDriver: false,
      }).start();
    },
  });

  const requestCameraPermission = async () => {
    try {
      const permission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.CAMERA
        : PERMISSIONS.ANDROID.CAMERA;
      
      const result = await request(permission);
      setHasPermission(result === RESULTS.GRANTED);
      if (result === RESULTS.GRANTED) {
        setIsActive(true);
      }
    } catch (error) {
      console.log('Camera permission error:', error);
    }
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
      console.log('Spawned AR Pokemon:', newPokemon.name);
      
      setTimeout(() => {
        setPokemon(prev => prev.filter(p => p.id !== newPokemon.id));
      }, 10000);
      
    } catch (error) {
      console.log('Failed to spawn Pokemon:', error);
    }
  };

  const throwPokeballToPosition = (startX: number, startY: number, targetX: number, targetY: number) => {
    const newPokeball: Pokeball = {
      id: Date.now(),
      startX,
      startY,
      targetX,
      targetY,
      translateX: new Animated.Value(startX),
      translateY: new Animated.Value(startY),
      targetPokemon: null as any,
    };
    
    setPokeballs(prev => [...prev, newPokeball]);
    
    Animated.parallel([
      Animated.timing(newPokeball.translateX, {
        toValue: targetX,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(newPokeball.translateY, {
        toValue: targetY,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setPokeballs(prev => prev.filter(p => p.id !== newPokeball.id));
      checkPokemonHit(targetX, targetY);
    });
  };
  
  const enterCatchingMode = (pokemonToTarget: Pokemon3D) => {
    setTargetPokemon(pokemonToTarget);
    setCatchingMode(true);
    isMoving.current = true;
    startPokemonMovement(pokemonToTarget);
  };
  
  const startPokemonMovement = (pokemon: Pokemon3D) => {
    // Start breathing scale animation
    const scaleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pokemon.scale, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pokemon.scale, {
          toValue: 0.9,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    
    scaleAnimation.start();
    
    const moveRandomly = () => {
      const newX = Math.random() * (width - 150) + 75;
      const newY = Math.random() * (height / 2 - 100) + 100;
      
      Animated.parallel([
        Animated.timing(pokemon.translateX, {
          toValue: newX,
          duration: 1500 + Math.random() * 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pokemon.translateY, {
          toValue: newY,
          duration: 1500 + Math.random() * 1000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (isMoving.current) {
          pokemon.baseX = newX;
          pokemon.baseY = newY;
          setTimeout(moveRandomly, 200 + Math.random() * 800);
        }
      });
    };
    
    moveRandomly();
  };
  
  const exitCatchingMode = () => {
    setCatchingMode(false);
    setTargetPokemon(null);
    isMoving.current = false;
  };
  
  const checkPokemonHit = (ballX: number, ballY: number) => {
    if (catchingMode && targetPokemon) {
      const pokemonX = targetPokemon.translateX._value + 75;
      const pokemonY = targetPokemon.translateY._value + 75;
      const distance = Math.sqrt(
        Math.pow(ballX - pokemonX, 2) + 
        Math.pow(ballY - pokemonY, 2)
      );
      
      if (distance < 500) {
        attemptCatch(targetPokemon);
      }
    }
  };
  
  const attemptCatch = async (pokemonToCatch: Pokemon3D) => {
    const catchRate = Math.random();
    
    if (catchRate > 0.5) {
      try {
        const pokemonData = await pokeAPI.getRandomPokemon();
        dispatch(addDiscoveredPokemon(pokemonData));
        
        setPokemon(prev => prev.filter(p => p.id !== pokemonToCatch.id));
        
        Alert.alert(
          'Pokemon Caught!',
          `You caught ${pokemonToCatch.name}! Added to your Pokedex.`
        );
        exitCatchingMode();
      } catch (error) {
        console.log('Failed to catch Pokemon:', error);
      }
    } else {
      Alert.alert(
        'Pokemon Escaped!',
        `${pokemonToCatch.name} broke free! Try again.`
      );
    }
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>AR Pokemon</Text>
        <Text style={styles.description}>Camera permission required for AR Pokemon experience</Text>
        <TouchableOpacity style={styles.startButton} onPress={requestCameraPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No Camera Found</Text>
        <Text style={styles.description}>Camera device not available</Text>
        <TouchableOpacity style={styles.startButton} onPress={requestCameraPermission}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (catchingMode && targetPokemon) {
    return (
      <View style={styles.arContainer}>
        <Camera
          ref={camera}
          style={styles.camera}
          device={device}
          isActive={isActive}
          photo={true}
        />
        
        <Animated.View
          style={[
            styles.movingPokemon,
            {
              transform: [
                { translateX: targetPokemon.translateX },
                { translateY: targetPokemon.translateY },
                { scale: targetPokemon.scale },
              ],
            },
          ]}
        >
          <Image 
            source={{ uri: targetPokemon.sprite }}
            style={styles.movingPokemonSprite}
          />
          <Text style={styles.movingPokemonName}>{targetPokemon.name.toUpperCase()}</Text>
        </Animated.View>
        
        {pokeballs.map((ball) => (
          <Animated.View
            key={ball.id}
            style={[
              styles.pokeball,
              {
                transform: [
                  { translateX: ball.translateX },
                  { translateY: ball.translateY },
                ],
              },
            ]}
          >
            <Image 
              source={{ uri: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png' }}
              style={styles.pokeballImage}
            />
          </Animated.View>
        ))}
        
        <Animated.View
          style={[
            styles.draggablePokeball,
            {
              transform: [
                { translateX: pokeballPosition.x },
                { translateY: pokeballPosition.y },
              ],
            },
          ]}
          {...pokeballPanResponder.panHandlers}
        >
          <Image 
            source={{ uri: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png' }}
            style={styles.draggablePokeballImage}
          />
        </Animated.View>
        
        <TouchableOpacity style={styles.backButton} onPress={exitCatchingMode}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
        
        <Text style={styles.catchInstructions}>
          Drag pokeball to hit the Pokemon!
        </Text>
      </View>
    );
  }
  
  return (
    <View style={styles.arContainer}>
      <Camera
        ref={camera}
        style={styles.camera}
        device={device}
        isActive={isActive}
        photo={true}
      />
      
      {pokemon.map((poke) => (
        <Pokemon3DComponent
          key={poke.id}
          pokemon={poke}
          onCatch={() => enterCatchingMode(poke)}
        />
      ))}
      
      <View style={styles.controls}>
        <TouchableOpacity style={styles.spawnButton} onPress={spawnPokemon}>
          <Text style={styles.buttonText}>Spawn Pokemon</Text>
        </TouchableOpacity>
        <Text style={styles.instructionText}>
          Tap Pokemon to enter catching mode
        </Text>
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
    backgroundColor: '#000',
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
  pokeball: {
    position: 'absolute',
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pokeballImage: {
    width: 30,
    height: 30,
  },
  draggablePokeball: {
    position: 'absolute',
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  draggablePokeballImage: {
    width: 50,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  movingPokemon: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 15,
  },
  movingPokemonSprite: {
    width: 150,
    height: 150,
  },
  movingPokemonName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 10,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: '#e74c3c',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  catchInstructions: {
    position: 'absolute',
    bottom: 200,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 8,
  },
});