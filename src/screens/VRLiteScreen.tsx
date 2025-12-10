import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const HABITATS = [
  {
    id: 'forest',
    name: 'Forest',
    image: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1200&h=600',
    pokemon: ['Bulbasaur', 'Caterpie', 'Pidgey']
  },
  {
    id: 'ocean',
    name: 'Ocean', 
    image: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1200&h=600',
    pokemon: ['Squirtle', 'Magikarp', 'Staryu']
  },
  {
    id: 'mountain',
    name: 'Mountain',
    image: 'https://images.unsplash.com/photo-1464822759844-d150baec0494?w=1200&h=600',
    pokemon: ['Geodude', 'Onix', 'Machop']
  },
];

export function VRLiteScreen() {
  const [selectedHabitat, setSelectedHabitat] = useState(HABITATS[0]);
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const [isVRMode, setIsVRMode] = useState(false);

  const handleTouch = (event) => {
    if (!isVRMode) return;
    
    const { locationX, locationY } = event.nativeEvent;
    const centerX = width / 2;
    const centerY = height / 2;
    
    setRotation({
      x: Math.max(-45, Math.min(45, (locationY - centerY) * 0.1)),
      y: ((locationX - centerX) * 0.2) % 360,
      z: 0,
    });
  };

  const toggleVRMode = () => {
    setIsVRMode(!isVRMode);
    if (!isVRMode) {
      setRotation({ x: 0, y: 0, z: 0 });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>VR Lite - Pokémon Habitats</Text>
      
      {!isVRMode && (
        <View style={styles.habitatSelector}>
          {HABITATS.map(habitat => (
            <TouchableOpacity
              key={habitat.id}
              style={[
                styles.habitatButton,
                selectedHabitat.id === habitat.id && styles.selectedHabitat
              ]}
              onPress={() => setSelectedHabitat(habitat)}
            >
              <Text style={styles.habitatText}>{habitat.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View 
        style={styles.vrContainer}
        onTouchMove={handleTouch}
      >
        <View
          style={[
            styles.panoramaContainer,
            isVRMode && {
              transform: [
                { rotateX: `${rotation.x}deg` },
                { rotateY: `${rotation.y}deg` },
              ],
            },
          ]}
        >
          <Image
            source={{ uri: selectedHabitat.image }}
            style={styles.panoramaImage}
            resizeMode="cover"
          />
          
          {isVRMode && (
            <View style={styles.pokemonOverlay}>
              {selectedHabitat.pokemon.map((pokemon, index) => (
                <View
                  key={pokemon}
                  style={[
                    styles.pokemonMarker,
                    {
                      left: `${20 + index * 25}%`,
                      top: `${40 + Math.sin(index) * 20}%`,
                    },
                  ]}
                >
                  <Text style={styles.pokemonText}>{pokemon}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.vrButton, isVRMode && styles.vrButtonActive]}
        onPress={toggleVRMode}
      >
        <Text style={styles.vrButtonText}>
          {isVRMode ? '🥽 Exit VR' : '🥽 Enter VR Mode'}
        </Text>
      </TouchableOpacity>

      {isVRMode && (
        <Text style={styles.instruction}>
          Touch and move to explore the 360° habitat
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    paddingVertical: 20,
  },
  habitatSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  habitatButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 5,
    backgroundColor: '#333',
    borderRadius: 20,
  },
  selectedHabitat: {
    backgroundColor: '#4CAF50',
  },
  habitatText: {
    color: '#fff',
    fontSize: 14,
  },
  vrContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  panoramaContainer: {
    width: width * 2,
    height: height * 1.2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  panoramaImage: {
    width: '300%',
    height: '200%',
    resizeMode: 'cover',
  },
  pokemonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  pokemonMarker: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  pokemonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  vrButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignSelf: 'center',
    marginVertical: 20,
  },
  vrButtonActive: {
    backgroundColor: '#FF5722',
  },
  vrButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  instruction: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 14,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
});