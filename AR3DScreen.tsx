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
import { useDispatch, useSelector } from 'react-redux';
import { addDiscoveredPokemon, catchPokemon, addSpawn, clearAllSpawns, addAchievement } from './store';
import { RootState } from './store';
import { locationService } from './locationService';
import { PokemonSpawn, Achievement } from './types';
import { pokeAPI } from './api';

const { width, height } = Dimensions.get('window');

interface Pokemon3D {
  id: string;
  spawnId: string;
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

interface AR3DScreenProps {
  catchMode?: boolean;
  targetSpawn?: any;
  onExitCatch?: () => void;
}

export const AR3DScreen: React.FC<AR3DScreenProps> = ({ 
  catchMode = false, 
  targetSpawn = null, 
  onExitCatch 
}) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [arPokemon, setArPokemon] = useState<Pokemon3D[]>([]);
  const { spawns, currentLocation, caughtPokemon } = useSelector((state: RootState) => state.app);
  const [pokeballs, setPokeballs] = useState<Pokeball[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [catchingMode, setCatchingMode] = useState(catchMode);
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
      const permission = await Camera.requestCameraPermission();
      setHasPermission(permission === 'granted');
      if (permission === 'granted') {
        setIsActive(true);
      }
    } catch (error) {
      console.log('Camera permission error:', error);
    }
  };

  // Convert spawns to AR Pokemon - either target spawn or nearby spawns
  React.useEffect(() => {
    if (catchMode && targetSpawn) {
      // Catch mode: show only target spawn
      const targetAR: Pokemon3D = {
        id: targetSpawn.id,
        spawnId: targetSpawn.id,
        name: targetSpawn.pokemon.name,
        sprite: targetSpawn.pokemon.sprites.front_default,
        baseX: width / 2 - 75,
        baseY: height / 3,
        translateX: new Animated.Value(width / 2 - 75),
        translateY: new Animated.Value(height / 3),
        scale: new Animated.Value(1),
        rotation: new Animated.Value(0),
      };
      setArPokemon([targetAR]);
      setTargetPokemon(targetAR);
      setCatchingMode(true);
      startPokemonMovement(targetAR);
    } else {
      // Normal AR mode: show nearby spawns
      const activeSpawns = spawns.filter(spawn => 
        !spawn.caught && spawn.expiresAt > Date.now()
      );
      
      const nearbySpawns = activeSpawns.filter(spawn => {
        if (!currentLocation) return false;
        const distance = locationService.calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          spawn.location.latitude,
          spawn.location.longitude
        );
        return distance <= 100;
      });
      
      const newArPokemon = nearbySpawns.slice(0, 5).map(spawn => {
        const baseX = Math.random() * (width - 100);
        const baseY = Math.random() * (height - 200) + 100;
        
        return {
          id: spawn.id,
          spawnId: spawn.id,
          name: spawn.pokemon.name,
          sprite: spawn.pokemon.sprites.front_default,
          baseX,
          baseY,
          translateX: new Animated.Value(baseX),
          translateY: new Animated.Value(baseY),
          scale: new Animated.Value(1),
          rotation: new Animated.Value(0),
        };
      });
      
      setArPokemon(newArPokemon);
    }
  }, [spawns, currentLocation, catchMode, targetSpawn]);

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
          duration: 3000 + Math.random() * 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pokemon.translateY, {
          toValue: newY,
          duration: 3000 + Math.random() * 2000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (isMoving.current) {
          pokemon.baseX = newX;
          pokemon.baseY = newY;
          setTimeout(moveRandomly, 2000 + Math.random() * 3000);
        }
      });
    };
    
    moveRandomly();
  };
  
  const exitCatchingMode = () => {
    setCatchingMode(false);
    setTargetPokemon(null);
    isMoving.current = false;
    if (onExitCatch) {
      onExitCatch();
    }
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
  
  const spawnPokemon = async () => {
    if (!currentLocation) return;
    
    // Check spawn limit
    const activeSpawns = spawns.filter(spawn => 
      !spawn.caught && spawn.expiresAt > Date.now()
    );
    if (activeSpawns.length >= 15) {
      Alert.alert('Spawn Limit', 'Maximum 15 Pokemon can be active at once!');
      return;
    }
    
    try {
      const randomId = Math.floor(Math.random() * 386) + 1;
      const pokemon = await pokeAPI.getPokemon(randomId);
      
      const distance = Math.random() * 0.001; // Close spawn
      const angle = Math.random() * 2 * Math.PI;
      const latVariance = distance * Math.cos(angle);
      const lngVariance = distance * Math.sin(angle);
      
      const spawn: PokemonSpawn = {
        id: `ar-spawn-${Date.now()}-${Math.random()}`,
        pokemon,
        location: {
          latitude: currentLocation.latitude + latVariance,
          longitude: currentLocation.longitude + lngVariance,
        },
        timestamp: Date.now(),
        expiresAt: Date.now() + 180000, // 3 minutes
        caught: false,
      };
      
      dispatch(addSpawn(spawn));
    } catch (error) {
      console.log('Failed to spawn Pokemon:', error);
    }
  };

  const attemptCatch = async (pokemonToCatch: Pokemon3D) => {
    const catchRate = Math.random();
    
    if (catchRate > 0.5) {
      const spawn = spawns.find(s => s.id === pokemonToCatch.spawnId);
      if (spawn) {
        dispatch(catchPokemon(pokemonToCatch.spawnId));
        checkForAchievements(spawn.pokemon);
        Alert.alert(
          'Pokemon Caught!',
          `You caught ${pokemonToCatch.name}! Added to your Pokedex.`,
          [{ text: 'Great!', onPress: exitCatchingMode }]
        );
      }
    } else {
      Alert.alert(
        'Pokemon Escaped!',
        `${pokemonToCatch.name} broke free! Try again.`
      );
    }
  };

  const checkForAchievements = (pokemon: any) => {
    const pokemonType = pokemon.types[0].type.name;
    const typeCount = caughtPokemon.filter(p => 
      p.types.some(t => t.type.name === pokemonType)
    ).length + 1;

    const tierThresholds = [5, 15, 30];
    const tierNames = ['I', 'II', 'III'];
    
    tierThresholds.forEach((threshold, index) => {
      if (typeCount === threshold) {
        const achievement = {
          id: `${pokemonType}-${tierNames[index]}`,
          title: `${pokemonType.charAt(0).toUpperCase() + pokemonType.slice(1)} ${getTierTitle(pokemonType)} ${tierNames[index]}`,
          description: `Caught ${threshold} ${pokemonType}-type Pokémon`,
          unlockedAt: Date.now(),
          type: pokemonType,
          tier: index + 1,
        };
        
        dispatch(addAchievement(achievement));
        
        Alert.alert(
          'Achievement Unlocked! 🏆',
          `${achievement.title}\n${achievement.description}`,
          [{ text: 'Awesome!', style: 'default' }]
        );
      }
    });
  };

  const getTierTitle = (type: string): string => {
    const titles: { [key: string]: string } = {
      bug: 'Bug Catcher',
      dragon: 'Dragon Tamer',
      fire: 'Fire Master',
      water: 'Water Expert',
      grass: 'Nature Lover',
      electric: 'Thunder Trainer',
      psychic: 'Mind Reader',
      ghost: 'Spirit Walker',
      dark: 'Shadow Master',
      steel: 'Metal Collector',
      fairy: 'Fairy Friend',
      fighting: 'Martial Artist',
      poison: 'Toxin Handler',
      ground: 'Earth Shaker',
      flying: 'Sky Rider',
      rock: 'Rock Crusher',
      ice: 'Frost Guardian',
      normal: 'Generalist',
    };
    return titles[type] || 'Type Specialist';
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
      
      {arPokemon.map((poke) => (
        <Pokemon3DComponent
          key={poke.id}
          pokemon={poke}
          onCatch={() => enterCatchingMode(poke)}
        />
      ))}
      
      {!catchMode && (
        <View style={styles.controls}>
          <TouchableOpacity style={styles.spawnButton} onPress={spawnPokemon}>
            <Text style={styles.buttonText}>Spawn Pokemon</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.clearButton} onPress={() => dispatch(clearAllSpawns())}>
            <Text style={styles.buttonText}>Clear Area</Text>
          </TouchableOpacity>
          <Text style={styles.instructionText}>
            {arPokemon.length}/5 Pokemon in AR (nearby only)
          </Text>
          <Text style={styles.instructionText}>
            Tap Pokemon to enter catching mode
          </Text>
        </View>
      )}
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
    marginBottom: 10,
  },
  clearButton: {
    backgroundColor: '#e74c3c',
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