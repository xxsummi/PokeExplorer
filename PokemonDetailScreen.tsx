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
  onPokemonSelect: (pokemon: Pokemon) => void;
}

export const PokemonDetailScreen: React.FC<PokemonDetailScreenProps> = ({ 
  pokemon, 
  onBack,
  onPokemonSelect 
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
      const types = pokemon.types.map(t => t.type.name).join('/');
      const abilities = pokemon.abilities.map(a => a.ability.name.replace('-', ' ')).join(', ');
      const totalStats = pokemon.stats.reduce((sum, stat) => sum + stat.base_stat, 0);
      const evolutionChain = evolutions.map(e => e.name.charAt(0).toUpperCase() + e.name.slice(1)).join(' → ');
      
      const message = `🔍 ${pokemon.name.toUpperCase()} #${pokemon.id}\n\n` +
        `📊 Type: ${types}\n` +
        `📏 Height: ${pokemon.height / 10}m | Weight: ${pokemon.weight / 10}kg\n\n` +
        `⚡ BASE STATS (Total: ${totalStats}):\n` +
        pokemon.stats.map(s => `  ${s.stat.name.toUpperCase()}: ${s.base_stat}`).join('\n') +
        `\n\n🎯 Abilities: ${abilities}` +
        (evolutions.length > 1 ? `\n\n🔄 Evolution: ${evolutionChain}` : '') +
        `\n\n#Pokemon #Pokedex`;
      
      await Share.share({
        message,
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
          <Text style={styles.backButtonText}>←</Text>
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
                <TouchableOpacity 
                  style={styles.evolutionItem}
                  onPress={async () => {
                    try {
                      const evolutionPokemon = await pokeAPI.getPokemon(parseInt(evo.id));
                      onPokemonSelect(evolutionPokemon);
                    } catch (error) {
                      console.log('Error loading evolution:', error);
                    }
                  }}
                >
                  <Image 
                    source={{ uri: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${evo.id}.png` }}
                    style={styles.evolutionImage}
                  />
                  <Text style={styles.evolutionName}>
                    {evo.name.charAt(0).toUpperCase() + evo.name.slice(1)}
                  </Text>
                </TouchableOpacity>
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
    backgroundColor: '#F3FCFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
  },
  backButtonText: {
    color: '#2D3748',
    fontSize: 32,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  shareButton: {
    backgroundColor: '#667EEA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  shareButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
  },
  pokemonHeader: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  pokemonImage: {
    width: 140,
    height: 140,
    marginBottom: 16,
  },
  pokemonName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 6,
    textAlign: 'center',
  },
  pokemonId: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 12,
  },
  typesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  typeTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 6,
  },
  typeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  physicalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 4,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statName: {
    width: 80,
    fontSize: 12,
    fontWeight: '500',
    color: '#718096',
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
    backgroundColor: '#667EEA',
    borderRadius: 4,
  },
  statNumber: {
    width: 40,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
  },
  abilityItem: {
    backgroundColor: '#F7FAFC',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  abilityName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D3748',
    textTransform: 'capitalize',
  },
  evolutionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  evolutionItem: {
    backgroundColor: '#F7FAFC',
    padding: 8,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 8,
    alignItems: 'center',
    minWidth: 60,
  },
  evolutionImage: {
    width: 30,
    height: 30,
    marginBottom: 4,
  },
  evolutionName: {
    fontSize: 11,
    fontWeight: '500',
    color: '#667EEA',
    textTransform: 'capitalize',
    textAlign: 'center',
  },
  evolutionArrow: {
    fontSize: 18,
    color: '#667EEA',
    marginRight: 8,
  },
  noEvolution: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});