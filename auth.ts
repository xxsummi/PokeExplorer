import auth, { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from '@react-native-firebase/auth';
import { User } from './types';

class AuthService {

  async signInWithEmail(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(getAuth(), email, password);
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
      const userCredential = await createUserWithEmailAndPassword(getAuth(), email, password);
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
      await signOut(getAuth());
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  getCurrentUser(): User | null {
    const firebaseUser = getAuth().currentUser;
    if (!firebaseUser) return null;
    
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      discoveredPokemon: [],
      capturedPhotos: [],
    };
  }

  onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(getAuth(), (firebaseUser) => {
      if (firebaseUser) {
        callback({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          discoveredPokemon: [],
          capturedPhotos: [],
        });
      } else {
        callback(null);
      }
    });
  }
}

export const authService = new AuthService();