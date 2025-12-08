import auth from '@react-native-firebase/auth';
import { User } from './types';

class AuthService {
  async signInWithEmailAndPassword(email: string, password: string): Promise<User> {
    const userCredential = await auth().signInWithEmailAndPassword(email, password);
    const firebaseUser = userCredential.user;
    
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '',
    };
  }

  async createUserWithEmailAndPassword(email: string, password: string): Promise<User> {
    const userCredential = await auth().createUserWithEmailAndPassword(email, password);
    const firebaseUser = userCredential.user;
    
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '',
    };
  }

  async signOut(): Promise<void> {
    await auth().signOut();
  }

  getCurrentUser(): User | null {
    const firebaseUser = auth().currentUser;
    if (!firebaseUser) return null;
    
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '',
    };
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return auth().onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        const user: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '',
        };
        callback(user);
      } else {
        callback(null);
      }
    });
  }
}

export const authService = new AuthService();