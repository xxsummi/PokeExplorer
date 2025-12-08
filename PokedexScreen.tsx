import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, setPokemon, setLoading } from './store';
import { pokeAPI } from './api';
import { Pokemon } from './types';
import { VoiceSearch } from './VoiceSearch';

interface PokedexScreenProps {
  onPokemonSelect: (pokemon: Pokemon) => void;
}

export const PokedexScreen: React.FC<PokedexScreenProps> = ({ onPokemonSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Pokemon[]>([]);
  const [showVoiceSearch, setShowVoiceSearch] = useState(false);
  const { pokemon, loading } = useSelector((state: RootState) => state.app);
  const dispatch = useDispatch();

  useEffect(() => {
    loadInitialPokemon();
  }, []);

  const loadInitialPokemon = async () => {
    if (pokemon.length > 0) return;
    
    console.log('Loading initial Pokemon...');
    dispatch(setLoading(true));
    
    // Direct test
    fetch("https://pokeapi.co/api/v2/pokemon")
      .then(r => console.log("STATUS:", r.status))
      .catch(e => console.log("ERROR:", e));
    
    // Test connection first
    const connectionOk = await pokeAPI.testConnection();
    if (!connectionOk) {
      Alert.alert('Connection Error', 'Cannot connect to Pokemon API. Please check your internet connection.');
      dispatch(setLoading(false));
      return;
    }
    
    try {
      const pokemonList: Pokemon[] = [];
      for (let i = 1; i <= 5; i++) {
        console.log(`Fetching Pokemon ${i}...`);
        const poke = await pokeAPI.getPokemon(i);
        pokemonList.push(poke);
      }
      console.log(`Loaded ${pokemonList.length} Pokemon`);
      dispatch(setPokemon(pokemonList));
    } catch (error) {
      console.error('Error loading Pokemon:', error);
      Alert.alert('Connection Error', 'Unable to load Pokemon. Please check your internet connection and try again.');
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    console.log('Searching for:', searchQuery);
    dispatch(setLoading(true));
    try {
      const results = await pokeAPI.searchPokemon(searchQuery);
      console.log('Search results:', results);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Pokemon not found');
      setSearchResults([]);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const renderPokemonItem = ({ item }: { item: Pokemon }) => (
    <TouchableOpacity 
      style={styles.pokemonCard}
      onPress={() => onPokemonSelect(item)}
    >
      <Image 
        source={{ uri: item.sprites.front_default }} 
        style={styles.pokemonImage}
      />
      <View style={styles.pokemonInfo}>
        <Text style={styles.pokemonName}>
          #{item.id} {item.name.charAt(0).toUpperCase() + item.name.slice(1)}
        </Text>
        <View style={styles.typesContainer}>
          {item.types.map((type, index) => (
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
    </TouchableOpacity>
  );

  const displayData = searchResults.length > 0 ? searchResults : pokemon;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pokedex</Text>
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search Pokemon by name or ID..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.voiceButton} 
          onPress={() => setShowVoiceSearch(true)}
        >
          <Text style={styles.voiceButtonText}>🔍</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2c5aa0" />
          <Text>Loading Pokemon...</Text>
        </View>
      ) : (
        <FlatList
          data={displayData}
          renderItem={renderPokemonItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
        />
      )}
      
      {showVoiceSearch && (
        <VoiceSearch 
          onPokemonFound={(pokemon) => {
            setShowVoiceSearch(false);
            onPokemonSelect(pokemon);
          }}
          onClose={() => setShowVoiceSearch(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8ff',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2c5aa0',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: '#2c5aa0',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    marginRight: 8,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  voiceButton: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: 48,
  },
  voiceButtonText: {
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
  pokemonCard: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 8,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pokemonImage: {
    width: 80,
    height: 80,
    marginBottom: 8,
  },
  pokemonInfo: {
    alignItems: 'center',
  },
  pokemonName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  typesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    margin: 2,
  },
  typeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});