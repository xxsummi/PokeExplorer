import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Platform,
  Linking,
} from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, addDiscoveredPokemon } from './store';
import { pokeAPI } from './api';

export const CameraScreen: React.FC = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [overlayPokemon, setOverlayPokemon] = useState<any>(null);
  const camera = useRef<Camera>(null);
  const device = useCameraDevice('back');
  const dispatch = useDispatch();

  React.useEffect(() => {
    // Delay permission request to ensure Activity is ready
    const timer = setTimeout(() => {
      requestCameraPermission();
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    if (hasPermission) {
      setIsActive(true);
      console.log('Camera permission granted, activating camera');
      console.log('Camera device:', device ? 'Found' : 'Not found');
    }
  }, [hasPermission, device]);

  const requestCameraPermission = async () => {
    if (isRequesting) return; // Prevent multiple simultaneous requests
    
    setIsRequesting(true);
    try {
      // Wait for Activity to be ready on Android
      if (Platform.OS === 'android') {
        // Use setTimeout instead of deprecated InteractionManager
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      const permission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.CAMERA
        : PERMISSIONS.ANDROID.CAMERA;
      
      console.log('Requesting camera permission...');
      const result = await request(permission);
      console.log('Permission result:', result);
      
      setHasPermission(result === RESULTS.GRANTED);
      
      if (result === RESULTS.DENIED) {
        Alert.alert(
          'Permission Denied',
          'Camera permission was denied. Please grant permission to use the camera.',
          [{ text: 'OK' }]
        );
      } else if (result === RESULTS.BLOCKED) {
        Alert.alert(
          'Permission Blocked',
          'Camera permission is blocked. Please enable it in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => {
              Linking.openSettings();
            }},
          ]
        );
      }
    } catch (error) {
      console.error('Camera permission error:', error);
      Alert.alert('Error', `Failed to request camera permission: ${error}`);
    } finally {
      setIsRequesting(false);
    }
  };

  const spawnRandomPokemon = async () => {
    try {
      const pokemon = await pokeAPI.getRandomPokemon();
      console.log('Spawned Pokemon:', pokemon.name, pokemon.sprites?.front_default);
      setOverlayPokemon(pokemon);
      
      // Auto-hide after 8 seconds
      setTimeout(() => {
        console.log('Hiding Pokemon overlay');
        setOverlayPokemon(null);
      }, 8000);
    } catch (error) {
      console.log('Pokemon spawn error:', error);
      Alert.alert('Error', 'Failed to spawn Pokemon');
    }
  };

  const capturePhoto = async () => {
    if (!camera.current) return;
    
    try {
      const photo = await camera.current.takePhoto({
        quality: 0.8,
        enableAutoRedEyeReduction: true,
      });
      
      setCapturedPhoto(`file://${photo.path}`);
      
      if (overlayPokemon) {
        dispatch(addDiscoveredPokemon(overlayPokemon));
        Alert.alert(
          'Pokemon Captured!',
          `You captured ${overlayPokemon.name} in a photo! It has been added to your Pokedex.`
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    setIsActive(true);
  };

  if (!hasPermission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Camera permission is required</Text>
        <TouchableOpacity 
          style={[styles.button, isRequesting && styles.buttonDisabled]} 
          onPress={requestCameraPermission}
          disabled={isRequesting}
        >
          <Text style={styles.buttonText}>
            {isRequesting ? 'Requesting...' : 'Grant Permission'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device && hasPermission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>No camera device found</Text>
        <Text style={styles.permissionSubtext}>
          Camera permission is granted but no camera device was detected.{'\n'}
          Make sure your device has a camera and try restarting the app.
        </Text>
        <TouchableOpacity style={styles.button} onPress={() => {
          console.log('Retrying camera device detection...');
          // Force re-render by toggling isActive
          setIsActive(false);
          setTimeout(() => setIsActive(true), 100);
        }}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (capturedPhoto) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: capturedPhoto }} style={styles.capturedImage} />
        <View style={styles.captureControls}>
          <TouchableOpacity style={styles.button} onPress={retakePhoto}>
            <Text style={styles.buttonText}>Retake</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Debug logging
  React.useEffect(() => {
    console.log('Camera state:', {
      hasPermission,
      isActive,
      device: device ? device.id : 'null',
      deviceName: device?.name,
    });
  }, [hasPermission, isActive, device]);

  if (!device) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Loading camera...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={camera}
        style={styles.camera}
        device={device}
        isActive={isActive}
        photo={true}
        enableZoomGesture={true}
      />
      
      {overlayPokemon && (
        <View style={styles.pokemonOverlay}>
          {overlayPokemon.sprites?.front_default ? (
            <Image 
              source={{ uri: overlayPokemon.sprites.front_default }}
              style={styles.overlayImage}
              onError={() => console.log('Pokemon image failed to load')}
              onLoad={() => console.log('Pokemon image loaded successfully')}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>🔴</Text>
            </View>
          )}
          <Text style={styles.overlayText}>
            A wild {overlayPokemon.name} appeared!
          </Text>
        </View>
      )}
      
      <View style={styles.controls}>
        <TouchableOpacity 
          style={styles.spawnButton}
          onPress={spawnRandomPokemon}
        >
          <Text style={styles.buttonText}>Spawn Pokemon</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.captureButton}
          onPress={capturePhoto}
        >
          <Text style={styles.captureButtonText}>📷</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    padding: 20,
  },
  permissionText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  permissionSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  camera: {
    flex: 1,
  },
  pokemonOverlay: {
    position: 'absolute',
    top: '30%',
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 20,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: '#2c5aa0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  overlayImage: {
    width: 120,
    height: 120,
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  placeholderImage: {
    width: 120,
    height: 120,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 60,
  },
  placeholderText: {
    fontSize: 40,
  },
  overlayText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c5aa0',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  controls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  spawnButton: {
    backgroundColor: '#2c5aa0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#2c5aa0',
  },
  captureButtonText: {
    fontSize: 24,
  },
  button: {
    backgroundColor: '#2c5aa0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonDisabled: {
    backgroundColor: '#999',
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  capturedImage: {
    flex: 1,
    width: '100%',
  },
  captureControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});