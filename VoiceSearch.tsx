import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
import { Pokemon } from './types';
import { pokeAPI } from './api';
import { PermissionManager } from './permissions';

interface VoiceSearchProps {
  onPokemonFound: (pokemon: Pokemon) => void;
  onClose: () => void;
}

export const VoiceSearch: React.FC<VoiceSearchProps> = ({ onPokemonFound, onClose }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isVoiceAvailable, setIsVoiceAvailable] = useState(false);
  const [voiceChecked, setVoiceChecked] = useState(false);

  const searchPokemon = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      const results = await pokeAPI.searchPokemon(trimmed);
      if (results.length > 0) {
        onPokemonFound(results[0]);
      } else {
        Alert.alert('Not Found', `No Pokemon found for "${trimmed}"`);
      }
    } catch (error) {
      console.log('Search error:', error);
      Alert.alert('Error', 'Failed to search Pokemon');
    } finally {
      setLoading(false);
    }
  }, [onPokemonFound]);

  const handleSpeechStart = useCallback(() => {
    setIsListening(true);
  }, []);

  const handleSpeechEnd = useCallback(() => {
    setIsListening(false);
  }, []);

  const handleSpeechResults = useCallback((event: SpeechResultsEvent) => {
    const spokenText = event.value?.[0];
    if (spokenText) {
      setRecognizedText(spokenText);
      searchPokemon(spokenText);
    }
  }, [searchPokemon]);

  const handleSpeechError = useCallback((event: SpeechErrorEvent) => {
    console.log('Voice error:', event);
    setIsListening(false);
    Alert.alert('Error', 'Voice recognition failed. Please try again.');
  }, []);

  const ensureMicrophonePermission = useCallback(async () => {
    if (Platform.OS !== 'android') {
      return true;
    }
    const granted = await PermissionManager.requestMicrophonePermission();
    if (!granted) {
      Alert.alert('Permission Needed', 'Please enable microphone access to use voice search.');
    }
    return granted;
  }, []);

  const stopListening = useCallback(async () => {
    try {
      await Voice.stop();
      await Voice.cancel();
    } catch (error) {
      console.log('Stop listening error:', error);
    }
  }, []);

  const startListening = useCallback(async () => {
    if (!isVoiceAvailable) {
      Alert.alert('Not Available', 'Voice recognition is not available on this device.');
      return;
    }

    const hasPermission = await ensureMicrophonePermission();
    if (!hasPermission) {
      return;
    }

    try {
      await stopListening();
      setRecognizedText('');
      await Voice.start('en-US', {
        EXTRA_PARTIAL_RESULTS: true,
      });
    } catch (error) {
      console.log('Start listening error:', error);
      Alert.alert('Error', 'Failed to start voice recognition');
    }
  }, [ensureMicrophonePermission, isVoiceAvailable, stopListening]);

  useEffect(() => {
    let isMounted = true;

    const initVoice = async () => {
      try {
        const available = await Voice.isAvailable();
        if (isMounted) {
          setIsVoiceAvailable(available);
          setVoiceChecked(true);
        }
      } catch (error) {
        console.log('Voice availability error:', error);
        if (isMounted) {
          setIsVoiceAvailable(false);
          setVoiceChecked(true);
        }
      }
    };

    initVoice();
    Voice.onSpeechStart = handleSpeechStart;
    Voice.onSpeechEnd = handleSpeechEnd;
    Voice.onSpeechResults = handleSpeechResults;
    Voice.onSpeechError = handleSpeechError;

    return () => {
      isMounted = false;
      stopListening();
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, [handleSpeechStart, handleSpeechEnd, handleSpeechResults, handleSpeechError, stopListening]);

  const handleClose = useCallback(() => {
    stopListening();
    onClose();
  }, [onClose, stopListening]);

  return (
    <View style={styles.container}>
      <View style={styles.modal}>
        <Text style={styles.title}>Search Pokemon</Text>
        
        {!voiceChecked ? (
          <View style={styles.initializingContainer}>
            <ActivityIndicator size="large" color="#2c5aa0" />
            <Text style={styles.statusText}>Preparing voice search...</Text>
          </View>
        ) : isVoiceAvailable ? (
          <>
            <View style={styles.micContainer}>
              <TouchableOpacity 
                style={[styles.micButton, isListening && styles.micButtonActive]}
                onPress={isListening ? stopListening : startListening}
                disabled={loading}
              >
                <Text style={styles.micIcon}>{isListening ? '🔴' : '🎤'}</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.statusText}>
              {loading ? 'Searching...' : isListening ? 'Listening...' : 'Tap microphone to speak'}
            </Text>
            
            {recognizedText ? (
              <Text style={styles.recognizedText}>"{recognizedText}"</Text>
            ) : null}
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Type Pokemon name..."
              value={recognizedText}
              onChangeText={setRecognizedText}
              onSubmitEditing={() => searchPokemon(recognizedText)}
            />
            <TouchableOpacity 
              style={styles.searchButton}
              onPress={() => searchPokemon(recognizedText)}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Search</Text>
            </TouchableOpacity>
          </>
        )}
        
        {loading && <ActivityIndicator size="large" color="#2c5aa0" style={styles.loader} />}
        
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
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
  },
  modal: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 300,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c5aa0',
    marginBottom: 30,
  },
  micContainer: {
    marginBottom: 20,
  },
  micButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2c5aa0',
    justifyContent: 'center',
    alignItems: 'center',
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
  loader: {
    marginVertical: 15,
  },
  initializingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    marginBottom: 15,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#2c5aa0',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  closeButtonText: {
    color: '#666',
    fontSize: 16,
  },
});