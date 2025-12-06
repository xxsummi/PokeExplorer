import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Provider } from 'react-redux';

import { store } from './store';
import { LoginScreen } from './LoginScreen';
import { PokedexScreen } from './PokedexScreen';
import { PokemonDetailScreen } from './PokemonDetailScreen';
import { HuntScreen } from './HuntScreen';
import { CameraScreen } from './CameraScreen';
import { AR3DScreen } from './AR3DScreen';
import { ProfileScreen } from './ProfileScreen';
import { VRLiteHabitatScreen } from './VRLiteHabitatScreen';
import { Pokemon } from './types';
import { authService } from './auth';

type Screen = 'login' | 'pokedex' | 'detail' | 'hunt' | 'ar' | 'vr' | 'profile';

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Skip Firebase auth for now
    setIsAuthenticated(true);
    setCurrentScreen('pokedex');
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    setCurrentScreen('pokedex');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentScreen('login');
  };

  const handlePokemonSelect = (pokemon: Pokemon) => {
    setSelectedPokemon(pokemon);
    setCurrentScreen('detail');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'login':
        return <LoginScreen onLogin={handleLogin} />;
      case 'pokedex':
        return <PokedexScreen onPokemonSelect={handlePokemonSelect} />;
      case 'detail':
        return selectedPokemon ? (
          <PokemonDetailScreen 
            pokemon={selectedPokemon} 
            onBack={() => setCurrentScreen('pokedex')} 
          />
        ) : null;
      case 'hunt':
        return <HuntScreen />;
      case 'ar':
        return <AR3DScreen />;
      case 'vr':
        return <VRLiteHabitatScreen />;
      case 'profile':
        return <ProfileScreen onLogout={handleLogout} />;
      default:
        return <PokedexScreen onPokemonSelect={handlePokemonSelect} />;
    }
  };

  const renderBottomNav = () => {
    if (!isAuthenticated || currentScreen === 'login' || currentScreen === 'detail') {
      return null;
    }

    return (
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={[styles.navButton, currentScreen === 'pokedex' && styles.activeNavButton]}
          onPress={() => setCurrentScreen('pokedex')}
        >
          <Text style={[styles.navText, currentScreen === 'pokedex' && styles.activeNavText]}>📚 Pokedex</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navButton, currentScreen === 'hunt' && styles.activeNavButton]}
          onPress={() => setCurrentScreen('hunt')}
        >
          <Text style={[styles.navText, currentScreen === 'hunt' && styles.activeNavText]}>🗺️ Hunt</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navButton, currentScreen === 'ar' && styles.activeNavButton]}
          onPress={() => setCurrentScreen('ar')}
        >
          <Text style={[styles.navText, currentScreen === 'ar' && styles.activeNavText]}>📷 AR</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navButton, currentScreen === 'vr' && styles.activeNavButton]}
          onPress={() => setCurrentScreen('vr')}
        >
          <Text style={[styles.navText, currentScreen === 'vr' && styles.activeNavText]}>🥽 VR</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navButton, currentScreen === 'profile' && styles.activeNavButton]}
          onPress={() => setCurrentScreen('profile')}
        >
          <Text style={[styles.navText, currentScreen === 'profile' && styles.activeNavText]}>👤</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0f8ff" />
      <View style={styles.content}>
        {renderScreen()}
      </View>
      {renderBottomNav()}
    </SafeAreaView>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8ff',
  },
  content: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  activeNavButton: {
    backgroundColor: '#e3f2fd',
  },
  navText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  activeNavText: {
    color: '#2c5aa0',
    fontWeight: 'bold',
  },
});

export default App;
