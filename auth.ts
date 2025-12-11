import './firebase';
import auth from '@react-native-firebase/auth';
import { User } from './types';

class AuthService {

  async signInWithEmail(email: string, password: string): Promise<User> {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      const firebaseUser = userCredential.user;
      
      return {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        discoveredPokemon: [],
        capturedPhotos: [],
      };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  async signUpWithEmail(email: string, password: string): Promise<User> {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const firebaseUser = userCredential.user;
      
      return {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        discoveredPokemon: [],
        capturedPhotos: [],
      };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  async signOut(): Promise<void> {
    try {
      await auth().signOut();
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  getCurrentUser(): User | null {
    const firebaseUser = auth().currentUser;
    if (!firebaseUser) return null;
    
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      discoveredPokemon: [],
      capturedPhotos: [],
    };
  }

  onAuthStateChanged(callback: (user: User | null) => void) {
    return auth().onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        const user: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          discoveredPokemon: [],
          capturedPhotos: [],
        };
        callback(user);
      } else {
        callback(null);
      }
    });
  }
}

export const authService = new AuthService();