import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from './store';
import { catchPokemon, addAchievement } from './store';
import { Pokemon, PokemonSpawn, Achievement } from './types';
import { notificationService } from './notifications';

interface FeedScreenProps {
  onPokemonSelect: (pokemon: Pokemon) => void;
  onCatchMode: (spawn: any) => void;
}

export const FeedScreen: React.FC<FeedScreenProps> = ({ onPokemonSelect, onCatchMode }) => {
  const dispatch = useDispatch();
  const { spawns, caughtPokemon, achievements } = useSelector((state: RootState) => state.app);
  const [lastCatchCount, setLastCatchCount] = useState(0);

  const handleCatchPokemon = (spawn: PokemonSpawn) => {
    onCatchMode(spawn);
  };

  const checkForAchievements = (pokemon: Pokemon) => {
    const pokemonType = pokemon.types[0].type.name;
    const typeCount = caughtPokemon.filter(p => 
      p.types.some(t => t.type.name === pokemonType)
    ).length + 1;

    const tierThresholds = [5, 15, 30];
    const tierNames = ['I', 'II', 'III'];
    
    tierThresholds.forEach((threshold, index) => {
      if (typeCount === threshold) {
        const achievement: Achievement = {
          id: `${pokemonType}-${tierNames[index]}`,
          title: `${pokemonType.charAt(0).toUpperCase() + pokemonType.slice(1)} ${getTierTitle(pokemonType)} ${tierNames[index]}`,
          description: `Caught ${threshold} ${pokemonType}-type Pokémon`,
          unlockedAt: Date.now(),
          type: pokemonType,
          tier: index + 1,
        };
        
        dispatch(addAchievement(achievement));
        
        Alert.alert(
          'Achievement Unlocked! 🏆',
          `${achievement.title}\n${achievement.description}`,
          [{ text: 'Awesome!', style: 'default' }]
        );
      }
    });
  };

  const getTierTitle = (type: string): string => {
    const titles: { [key: string]: string } = {
      bug: 'Bug Catcher',
      dragon: 'Dragon Tamer',
      fire: 'Fire Master',
      water: 'Water Expert',
      grass: 'Nature Lover',
      electric: 'Thunder Trainer',
      psychic: 'Mind Reader',
      ghost: 'Spirit Walker',
      dark: 'Shadow Master',
      steel: 'Metal Collector',
      fairy: 'Fairy Friend',
      fighting: 'Martial Artist',
      poison: 'Toxin Handler',
      ground: 'Earth Shaker',
      flying: 'Sky Rider',
      rock: 'Rock Crusher',
      ice: 'Frost Guardian',
      normal: 'Generalist',
    };
    return titles[type] || 'Type Specialist';
  };

  const activeSpawns = spawns.filter(spawn => 
    !spawn.caught && spawn.expiresAt > Date.now()
  );

  const recentCatches = caughtPokemon.slice(-10).reverse();

  useEffect(() => {
    if (caughtPokemon.length > lastCatchCount && lastCatchCount > 0) {
      const newCatch = caughtPokemon[caughtPokemon.length - 1];
      Alert.alert(
        'Pokemon Caught! 🎉',
        `${newCatch.name.charAt(0).toUpperCase() + newCatch.name.slice(1)} was added to your collection!`,
        [{ text: 'Great!', style: 'default' }]
      );
    }
    setLastCatchCount(caughtPokemon.length);
  }, [caughtPokemon.length]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pokémon Feed 📡</Text>
        <Text style={styles.subtitle}>Live spawns and recent catches</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Active Spawns ({activeSpawns.length})</Text>
        {activeSpawns.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No active spawns nearby</Text>
            <Text style={styles.emptySubtext}>Move around to find Pokémon!</Text>
          </View>
        ) : (
          activeSpawns.map(spawn => (
            <TouchableOpacity
              key={spawn.id}
              style={styles.spawnCard}
              onPress={() => handleCatchPokemon(spawn)}
            >
              <Image
                source={{ uri: spawn.pokemon.sprites.front_default }}
                style={styles.spawnImage}
              />
              <View style={styles.spawnInfo}>
                <Text style={styles.spawnName}>
                  {spawn.pokemon.name.charAt(0).toUpperCase() + spawn.pokemon.name.slice(1)}
                </Text>
                <Text style={styles.spawnType}>
                  {spawn.pokemon.types.map(t => t.type.name).join('/')}
                </Text>
                <Text style={styles.spawnTime}>
                  Expires in {Math.ceil((spawn.expiresAt - Date.now()) / 60000)}m
                </Text>
              </View>
              <TouchableOpacity
                style={styles.catchButton}
                onPress={() => handleCatchPokemon(spawn)}
              >
                <Text style={styles.catchButtonText}>Catch!</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏆 Recent Achievements</Text>
        {achievements.slice(-3).reverse().map(achievement => (
          <View key={achievement.id} style={styles.achievementCard}>
            <Text style={styles.achievementTitle}>{achievement.title}</Text>
            <Text style={styles.achievementDesc}>{achievement.description}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Recent Catches ({caughtPokemon.length})</Text>
        {recentCatches.map((pokemon, index) => (
          <TouchableOpacity
            key={`${pokemon.id}-${index}`}
            style={styles.catchCard}
            onPress={() => onPokemonSelect(pokemon)}
          >
            <Image
              source={{ uri: pokemon.sprites.front_default }}
              style={styles.catchImage}
            />
            <View style={styles.catchInfo}>
              <Text style={styles.catchName}>
                {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
              </Text>
              <Text style={styles.catchType}>
                {pokemon.types.map(t => t.type.name).join('/')}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3FCFB',
  },
  header: {
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#718096',
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#718096',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#A0AEC0',
  },
  spawnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    marginBottom: 8,
  },
  spawnImage: {
    width: 50,
    height: 50,
    marginRight: 12,
  },
  spawnInfo: {
    flex: 1,
  },
  spawnName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
  },
  spawnType: {
    fontSize: 12,
    color: '#718096',
    textTransform: 'capitalize',
  },
  spawnTime: {
    fontSize: 12,
    color: '#E53E3E',
    fontWeight: '500',
  },
  catchButton: {
    backgroundColor: '#48BB78',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  catchButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  achievementCard: {
    padding: 12,
    backgroundColor: '#FFF5B7',
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F6E05E',
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#744210',
  },
  achievementDesc: {
    fontSize: 12,
    color: '#975A16',
  },
  catchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#F7FAFC',
    borderRadius: 6,
    marginBottom: 6,
  },
  catchImage: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  catchInfo: {
    flex: 1,
  },
  catchName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D3748',
  },
  catchType: {
    fontSize: 12,
    color: '#718096',
    textTransform: 'capitalize',
  },
});