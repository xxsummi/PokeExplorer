import { Platform, Alert, Linking } from 'react-native';
import { request, check, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';

export class PermissionManager {
  static async requestLocationPermission(): Promise<boolean> {
    try {
      const permission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
        : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
      
      const result = await request(permission);
      
      if (result === RESULTS.GRANTED) {
        return true;
      } else if (result === RESULTS.DENIED) {
        Alert.alert(
          'Location Permission Required',
          'PokeExplorer needs location access to find Pokemon near you.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Retry', onPress: () => this.requestLocationPermission() },
          ]
        );
      } else if (result === RESULTS.BLOCKED) {
        Alert.alert(
          'Location Permission Blocked',
          'Please enable location permission in Settings to use Pokemon hunting features.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: openSettings },
          ]
        );
      }
      
      return false;
    } catch (error) {
      console.log('Location permission error:', error);
      return false;
    }
  }

  static async requestCameraPermission(): Promise<boolean> {
    try {
      const permission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.CAMERA
        : PERMISSIONS.ANDROID.CAMERA;
      
      const result = await request(permission);
      
      if (result === RESULTS.GRANTED) {
        return true;
      } else if (result === RESULTS.DENIED) {
        Alert.alert(
          'Camera Permission Required',
          'PokeExplorer needs camera access for AR Pokemon features.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Retry', onPress: () => this.requestCameraPermission() },
          ]
        );
      } else if (result === RESULTS.BLOCKED) {
        Alert.alert(
          'Camera Permission Blocked',
          'Please enable camera permission in Settings to use AR features.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: openSettings },
          ]
        );
      }
      
      return false;
    } catch (error) {
      console.log('Camera permission error:', error);
      return false;
    }
  }

  static async requestMicrophonePermission(): Promise<boolean> {
    try {
      const permission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.MICROPHONE
        : PERMISSIONS.ANDROID.RECORD_AUDIO;
      
      const result = await request(permission);
      
      if (result === RESULTS.GRANTED) {
        return true;
      } else if (result === RESULTS.DENIED) {
        Alert.alert(
          'Microphone Permission Required',
          'PokeExplorer needs microphone access for voice search.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Retry', onPress: () => this.requestMicrophonePermission() },
          ]
        );
      } else if (result === RESULTS.BLOCKED) {
        Alert.alert(
          'Microphone Permission Blocked',
          'Please enable microphone permission in Settings to use voice search.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: openSettings },
          ]
        );
      }
      
      return false;
    } catch (error) {
      console.log('Microphone permission error:', error);
      return false;
    }
  }

  static async checkLocationPermission(): Promise<boolean> {
    try {
      const permission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
        : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
      
      const result = await check(permission);
      return result === RESULTS.GRANTED;
    } catch (error) {
      console.log('Check location permission error:', error);
      return false;
    }
  }

  static async checkCameraPermission(): Promise<boolean> {
    try {
      const permission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.CAMERA
        : PERMISSIONS.ANDROID.CAMERA;
      
      const result = await check(permission);
      return result === RESULTS.GRANTED;
    } catch (error) {
      console.log('Check camera permission error:', error);
      return false;
    }
  }
}