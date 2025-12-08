import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Share,
  ActivityIndicator,
} from 'react-native';
import { Pokemon } from './types';
import { pokeAPI } from './api';

interface PokemonDetailScreenProps {
  pokemon: Pokemon;
  onBack: () => void;
}

export const PokemonDetailScreen: React.FC<PokemonDetailScreenProps> = ({ 
  pokemon, 
  onBack 
}) => {
  const [evolutions, setEvolutions] = useState<any[]>([]);
  const [loadingEvolutions, setLoadingEvolutions] = useState(true);

  useEffect(() => {
    loadEvolutions();
  }, [pokemon.id]);

  const loadEvolutions = async () => {
    try {
      const speciesResponse = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemon.id}`);
      const speciesData = await speciesResponse.json();
      const chainResponse = await fetch(speciesData.evolution_chain.url);
      const chainData = await chainResponse.json();
      
      const evolutionList: any[] = [];
      let current = chainData.chain;
      
      while (current) {
        const id = current.species.url.split('/').filter(Boolean).pop();
        evolutionList.push({ name: current.species.name, id });
        current = current.evolves_to[0];
      }
      
      setEvolutions(evolutionList);
    } catch (error) {
      console.log('Evolution error:', error);
    } finally {
      setLoadingEvolutions(false);
    }
  };
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${pokemon.name}! #${pokemon.id} - A ${pokemon.types.map(t => t.type.name).join('/')} type Pokemon!`,
        title: `Pokemon: ${pokemon.name}`,
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareButtonText}>Share</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.pokemonHeader}>
        <Image 
          source={{ 
            uri: pokemon.sprites.other['official-artwork'].front_default || 
                 pokemon.sprites.front_default 
          }} 
          style={styles.pokemonImage}
        />
        <Text style={styles.pokemonName}>
          {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
        </Text>
        <Text style={styles.pokemonId}>#{pokemon.id}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Types</Text>
        <View style={styles.typesContainer}>
          {pokemon.types.map((type, index) => (
            <View 
              key={index}
              style={[
                styles.typeTag,
                { backgroundColor: pokeAPI.getTypeColor(type.type.name) }
              ]}
            >
              <Text style={styles.typeText}>{type.type.name}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Physical Stats</Text>
        <View style={styles.physicalStats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Height</Text>
            <Text style={styles.statValue}>{pokemon.height / 10} m</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Weight</Text>
            <Text style={styles.statValue}>{pokemon.weight / 10} kg</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Base Stats</Text>
        {pokemon.stats.map((stat, index) => (
          <View key={index} style={styles.statRow}>
            <Text style={styles.statName}>
              {stat.stat.name.replace('-', ' ').toUpperCase()}
            </Text>
            <View style={styles.statBarContainer}>
              <View 
                style={[
                  styles.statBar,
                  { width: `${(stat.base_stat / 255) * 100}%` }
                ]}
              />
            </View>
            <Text style={styles.statNumber}>{stat.base_stat}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Abilities</Text>
        {pokemon.abilities.map((ability, index) => (
          <View key={index} style={styles.abilityItem}>
            <Text style={styles.abilityName}>
              {ability.ability.name.replace('-', ' ').toUpperCase()}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Evolution Chain</Text>
        {loadingEvolutions ? (
          <ActivityIndicator size="small" color="#2c5aa0" />
        ) : evolutions.length > 1 ? (
          <View style={styles.evolutionContainer}>
            {evolutions.map((evo, index) => (
              <React.Fragment key={evo.id}>
                <View style={styles.evolutionItem}>
                  <Text style={styles.evolutionName}>
                    #{evo.id} {evo.name.toUpperCase()}
                  </Text>
                </View>
                {index < evolutions.length - 1 && (
                  <Text style={styles.evolutionArrow}>→</Text>
                )}
              </React.Fragment>
            ))}
          </View>
        ) : (
          <Text style={styles.noEvolution}>No evolutions</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8ff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#2c5aa0',
    fontSize: 16,
    fontWeight: 'bold',
  },
  shareButton: {
    backgroundColor: '#2c5aa0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  shareButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  pokemonHeader: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pokemonImage: {
    width: 150,
    height: 150,
    marginBottom: 16,
  },
  pokemonName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  pokemonId: {
    fontSize: 18,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c5aa0',
    marginBottom: 12,
  },
  typesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  typeTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  typeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  physicalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statName: {
    width: 80,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  statBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginHorizontal: 12,
  },
  statBar: {
    height: '100%',
    backgroundColor: '#2c5aa0',
    borderRadius: 4,
  },
  statNumber: {
    width: 40,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  abilityItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  abilityName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  evolutionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  evolutionItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  evolutionName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c5aa0',
    textTransform: 'capitalize',
  },
  evolutionArrow: {
    fontSize: 20,
    color: '#2c5aa0',
    marginRight: 8,
  },
  noEvolution: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});