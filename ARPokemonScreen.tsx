import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { ViroARSceneNavigator } from '@viro-community/react-viro';
import ARImageTracker from './ARImageTracker';

interface ARPokemonScreenProps {
  pokemon?: {
    name: string;
    sprites: {
      other: {
        'official-artwork': {
          front_default: string;
        };
      };
      front_default: string;
    };
  };
  onBack: () => void;
}

const ARPokemonScreen: React.FC<ARPokemonScreenProps> = ({ pokemon, onBack }) => {
  const [arInitialized, setArInitialized] = useState(false);

  const arSceneNavigator = () => {
    const pokemonImageUri = pokemon?.sprites.other['official-artwork'].front_default || 
                           pokemon?.sprites.front_default || 
                           'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png';

    return (
      <ARImageTracker pokemonImageUri={pokemonImageUri} />
    );
  };

  const onInitialized = (state: any, reason: any) => {
    if (state === 'ViroARTrackingNormal') {
      setArInitialized(true);
    } else if (state === 'ViroARTrackingUnavailable') {
      Alert.alert('AR Error', 'AR tracking is unavailable on this device');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>AR Pokemon</Text>
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          {!arInitialized 
            ? 'Initializing AR...' 
            : 'Point camera at Pokemon marker to place ' + (pokemon?.name || 'Pokemon') + ' in AR!'
          }
        </Text>
      </View>

      <ViroARSceneNavigator
        autofocus={true}
        initialScene={{
          scene: arSceneNavigator,
        }}
        style={styles.arView}
        onTrackingUpdated={onInitialized}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 1,
  },
  backButton: {
    marginRight: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  instructions: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 15,
    borderRadius: 10,
    zIndex: 1,
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  arView: {
    flex: 1,
  },
});

export default ARPokemonScreen;