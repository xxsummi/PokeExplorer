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
  ScrollView,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, addPokemon, setLoading } from './store';
import { pokeAPI } from './api';
import { Pokemon } from './types';
import { VoiceSearch } from './VoiceSearch';

interface PokedexScreenProps {
  onPokemonSelect: (pokemon: Pokemon) => void;
}

const POKEMON_PER_PAGE = 20;
const TOTAL_POKEMON = 151;

export const PokedexScreen: React.FC<PokedexScreenProps> = ({ onPokemonSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Pokemon[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showVoiceSearch, setShowVoiceSearch] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageData, setPageData] = useState<Pokemon[]>([]);
  const [loadingPage, setLoadingPage] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    loadPage(currentPage);
  }, [currentPage]);

  useEffect(() => {
    if (searchQuery) {
      searchPokemon();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadPage = async (page: number) => {
    setLoadingPage(true);
    try {
      const start = (page - 1) * POKEMON_PER_PAGE + 1;
      const end = Math.min(start + POKEMON_PER_PAGE - 1, TOTAL_POKEMON);
      const pokemon: Pokemon[] = [];
      
      for (let i = start; i <= end; i++) {
        const poke = await pokeAPI.getPokemon(i);
        pokemon.push(poke);
      }
      setPageData(pokemon);
    } catch (error) {
      console.log('Error loading page:', error);
    } finally {
      setLoadingPage(false);
    }
  };

  const totalPages = Math.ceil(TOTAL_POKEMON / POKEMON_PER_PAGE);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const searchPokemon = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const query = searchQuery.toLowerCase();
      
      // Try direct API fetch first (highest priority)
      if (!isNaN(Number(query))) {
        const poke = await pokeAPI.getPokemon(Number(query));
        setSearchResults([poke]);
      } else {
        const poke = await pokeAPI.getPokemonByName(query);
        setSearchResults([poke]);
      }
    } catch (error) {
      // Fallback to loaded Pokemon
      const filtered = pokemon.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.types.some(t => t.type.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setSearchResults(filtered);
    } finally {
      setIsSearching(false);
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

  const displayData = searchQuery ? searchResults : pageData;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pokedex</Text>
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, ID, or type..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity 
          style={styles.voiceButton}
          onPress={() => setShowVoiceSearch(true)}
        >
          <Text style={styles.voiceIcon}>🎤</Text>
        </TouchableOpacity>
      </View>

      {isSearching || loadingPage ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2c5aa0" />
          <Text>{isSearching ? 'Searching...' : 'Loading page...'}</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={displayData}
            renderItem={renderPokemonItem}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={<Text style={styles.emptyText}>No Pokemon found</Text>}
          />
          
          {!searchQuery && (
            <View style={styles.pagination}>
              <TouchableOpacity 
                style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
                onPress={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <Text style={styles.pageButtonText}>← Prev</Text>
              </TouchableOpacity>
              
              <Text style={styles.pageInfo}>Page {currentPage} of {totalPages}</Text>
              
              <TouchableOpacity 
                style={[styles.pageButton, currentPage === totalPages && styles.pageButtonDisabled]}
                onPress={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <Text style={styles.pageButtonText}>Next →</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
      
      {showVoiceSearch && (
        <VoiceSearch 
          onPokemonFound={(poke) => {
            setShowVoiceSearch(false);
            onPokemonSelect(poke);
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
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    fontSize: 16,
    marginRight: 10,
  },
  voiceButton: {
    backgroundColor: '#28a745',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceIcon: {
    fontSize: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    color: '#666',
    fontSize: 16,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  pageButton: {
    backgroundColor: '#2c5aa0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  pageButtonDisabled: {
    backgroundColor: '#ccc',
  },
  pageButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  pageInfo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c5aa0',
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