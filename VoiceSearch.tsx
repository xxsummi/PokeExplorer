import React, { useState, useEffect } from 'react';

const POKEMON_PHONETIC_MAP: Record<string, string> = {
  'combi': 'combee',
  'combo': 'combee',
  'alola mola': 'alomomola',
  'alola': 'alomomola',
  'mola': 'alomomola',
  'char is hard': 'charizard',
  'char lizard': 'charizard',
  'pika chew': 'pikachu',
  'peekachu': 'pikachu',
  'squirtle': 'squirtle',
  'squirrel': 'squirtle',
  'bulba sore': 'bulbasaur',
  'bulb sore': 'bulbasaur',
  'mewtwo': 'mewtwo',
  'mew two': 'mewtwo',
  'gengar': 'gengar',
  'gang gar': 'gengar',
  'dragonite': 'dragonite',
  'dragon knight': 'dragonite',
  'snorlax': 'snorlax',
  'snore lacks': 'snorlax',
  'gyarados': 'gyarados',
  'gary dos': 'gyarados',
  'lapras': 'lapras',
  'lap ross': 'lapras',
  'eevee': 'eevee',
  'evie': 'eevee',
  'vaporeon': 'vaporeon',
  'vapor on': 'vaporeon',
  'jolteon': 'jolteon',
  'jolt on': 'jolteon',
  'flareon': 'flareon',
  'flare on': 'flareon',
};

function correctPokemonName(input: string): string {
  const lower = input.toLowerCase().trim();
  
  // Check exact match in phonetic map
  if (POKEMON_PHONETIC_MAP[lower]) {
    return POKEMON_PHONETIC_MAP[lower];
  }
  
  // Check partial matches
  for (const [key, value] of Object.entries(POKEMON_PHONETIC_MAP)) {
    if (lower.includes(key) || key.includes(lower)) {
      return value;
    }
  }
  
  // Remove spaces for compound names
  return lower.replace(/\s+/g, '');
}
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  NativeModules,
  NativeEventEmitter,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { Pokemon } from './types';
import { pokeAPI } from './api';

const { VoiceRecognition } = NativeModules;
const voiceEmitter = new NativeEventEmitter(VoiceRecognition);

interface VoiceSearchProps {
  onPokemonFound: (pokemon: Pokemon) => void;
  onClose: () => void;
  onSearchQuery?: (query: string) => void;
}

export const VoiceSearch: React.FC<VoiceSearchProps> = ({ onPokemonFound, onClose, onSearchQuery }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const startListener = voiceEmitter.addListener('onSpeechStart', () => {
      setIsListening(true);
    });

    const endListener = voiceEmitter.addListener('onSpeechEnd', () => {
      setIsListening(false);
    });

    const resultsListener = voiceEmitter.addListener('onSpeechResults', (text: string) => {
      setRecognizedText(text);
      if (onSearchQuery) {
        const corrected = correctPokemonName(text);
        onSearchQuery(corrected);
      }
      onClose();
    });

    const errorListener = voiceEmitter.addListener('onSpeechError', () => {
      setIsListening(false);
      Alert.alert('Error', 'Voice recognition failed');
    });

    return () => {
      startListener.remove();
      endListener.remove();
      resultsListener.remove();
      errorListener.remove();
      VoiceRecognition?.destroy();
    };
  }, []);

  const searchPokemon = async (query: string) => {
    onClose();
    // Navigate back to Pokedex with search query
    // The parent component will handle the search
  };

  const startListening = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Microphone permission required');
          return;
        }
      }
      setRecognizedText('');
      await VoiceRecognition.startListening();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to start voice recognition');
    }
  };

  const stopListening = async () => {
    try {
      await VoiceRecognition.stopListening();
    } catch (error) {
      console.log('Stop error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.modal}>
        <Text style={styles.title}>🎤 Voice Search</Text>
        
        <TouchableOpacity 
          style={[styles.micButton, isListening && styles.micButtonActive]}
          onPress={isListening ? stopListening : startListening}
          disabled={loading}
        >
          <Text style={styles.micIcon}>{isListening ? '🔴' : '🎤'}</Text>
        </TouchableOpacity>
        
        <Text style={styles.statusText}>
          {loading ? 'Searching...' : isListening ? 'Listening... Speak now!' : 'Tap to speak'}
        </Text>
        
        {recognizedText ? (
          <Text style={styles.recognizedText}>"{recognizedText}"</Text>
        ) : null}
        
        {loading && <ActivityIndicator size="large" color="#2c5aa0" />}
        
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  modal: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 300,
    zIndex: 10000,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c5aa0',
    marginBottom: 30,
  },
  micButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2c5aa0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  micButtonActive: {
    backgroundColor: '#dc3545',
  },
  micIcon: {
    fontSize: 40,
  },
  statusText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  recognizedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c5aa0',
    marginBottom: 15,
    textAlign: 'center',
  },
  closeButton: {
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  closeButtonText: {
    color: '#666',
    fontSize: 16,
  },
});
