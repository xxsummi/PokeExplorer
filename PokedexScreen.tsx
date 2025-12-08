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
import { initializePokemonSearch, searchPokemon, suggestPokemon, isIndexReady, canSearch, getIndexSize } from './fuzzySearch';

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
  const [suggestions, setSuggestions] = useState<Pokemon[]>([]);
  const [indexReady, setIndexReady] = useState(false);
  const [buildingIndex, setBuildingIndex] = useState(false);
  const [indexSize, setIndexSize] = useState(0);
  const dispatch = useDispatch();

  useEffect(() => {
    loadPage(currentPage);
    initializeSearchIndex();
  }, [currentPage]);

  const initializeSearchIndex = async () => {
    if (!isIndexReady() && !buildingIndex) {
      setBuildingIndex(true);
      try {
        await initializePokemonSearch(pokeAPI);
        setIndexReady(true);
      } catch (e) {
        console.log('Failed to build index:', e);
      } finally {
        setBuildingIndex(false);
      }
    }
  };

  useEffect(() => {
    if (searchQuery) {
      performSearch();
    } else {
      setSearchResults([]);
      setSuggestions([]);
    }
  }, [searchQuery, indexReady]);

  // Poll index size and smart refresh results
  useEffect(() => {
    if (!indexReady && searchQuery) {
      let lastResultCount = searchResults.length + suggestions.length;
      const interval = setInterval(() => {
        const currentSize = getIndexSize();
        setIndexSize(currentSize);
        
        // Only re-search if we have a query and index has grown
        if (canSearch()) {
          const results = searchPokemon(searchQuery.toLowerCase().replace(/\s+/g, ''), 5);
          const allSuggestions = suggestPokemon(searchQuery.toLowerCase().replace(/\s+/g, ''), 15);
          const newResultCount = results.length + allSuggestions.length;
          
          // Only update if we found new matches
          if (newResultCount > lastResultCount) {
            setSearchResults(results.slice(0, 1).map(r => r.entry.data));
            const remainingResults = results.slice(1);
            const additionalSuggestions = allSuggestions
              .filter(s => !results.some(r => r.entry.id === s.entry.id));
            setSuggestions([
              ...remainingResults.map(r => r.entry.data),
              ...additionalSuggestions.map(s => s.entry.data)
            ].slice(0, 10));
            lastResultCount = newResultCount;
          }
        }
        
        if (currentSize >= 1025) {
          setIndexReady(true);
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [indexReady, searchQuery]);

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

  const performSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    const query = searchQuery.toLowerCase().replace(/\s+/g, '');
    
    try {
      // Try direct ID match
      if (!isNaN(Number(query))) {
        const poke = await pokeAPI.getPokemon(Number(query));
        setSearchResults([poke]);
        setSuggestions([]);
        setIsSearching(false);
        return;
      }
      
      // Try direct name match first
      try {
        const poke = await pokeAPI.getPokemonByName(query);
        setSearchResults([poke]);
        setSuggestions([]);
        setIsSearching(false);
        return;
      } catch {}
      
      // Use fuzzy search with whatever is loaded
      if (!canSearch()) {
        // No Pokemon loaded yet - keep searching
        return;
      }
      
      // Search with partial or full index
      const results = searchPokemon(query, 5);
      const allSuggestions = suggestPokemon(query, 15);
      
      // Show top result as main result
      setSearchResults(results.slice(0, 1).map(r => r.entry.data));
      
      // Show remaining results + additional suggestions as "Did you mean?"
      const remainingResults = results.slice(1);
      const additionalSuggestions = allSuggestions
        .filter(s => !results.some(r => r.entry.id === s.entry.id));
      
      setSuggestions([
        ...remainingResults.map(r => r.entry.data),
        ...additionalSuggestions.map(s => s.entry.data)
      ].slice(0, 10));
      
      setIsSearching(false);
    } catch (error) {
      console.log('Search error:', error);
      setSearchResults([]);
      setSuggestions([]);
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
          onPress={() => {
            setSuggestions([]);
            setShowVoiceSearch(true);
          }}
        >
          <Text style={styles.voiceIcon}>🎤</Text>
        </TouchableOpacity>
      </View>

      {!indexReady && getIndexSize() > 0 && (
        <View style={styles.progressBanner}>
          <Text style={styles.progressText}>
            Loading Pokemon database... {getIndexSize()}/1025
          </Text>
        </View>
      )}

      {isSearching || loadingPage ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2c5aa0" />
          <Text>
            {loadingPage ? 'Loading page...' : 
             !indexReady ? `Loading Pokemon... (${getIndexSize()}/1025)` : 
             'Searching...'}
          </Text>
        </View>
      ) : (
        <>
          {suggestions.length > 0 && (
            <View style={styles.suggestionsSection}>
              <Text style={styles.suggestionsTitle}>Did you mean?</Text>
              <ScrollView 
                style={styles.suggestionsScroll}
                contentContainerStyle={styles.suggestionsContent}
              >
                {suggestions.map((pokemon, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionButton}
                    onPress={() => setSearchQuery(pokemon.name)}
                  >
                    <Image 
                      source={{ uri: pokemon.sprites.front_default }} 
                      style={styles.suggestionImage}
                    />
                    <Text style={styles.suggestionText}>
                      {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          <FlatList
            data={displayData}
            renderItem={renderPokemonItem}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              searchQuery && !isSearching ? 
                <Text style={styles.emptyText}>No Pokemon found</Text> : 
                null
            }
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
          onClose={() => {
            setShowVoiceSearch(false);
            setSuggestions([]);
          }}
          onSearchQuery={(query) => {
            setSearchQuery(query);
            setShowVoiceSearch(false);
          }}
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
  suggestionsSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxHeight: 250,
  },
  suggestionsTitle: {
    fontSize: 14,
    color: '#666',
    padding: 12,
    paddingBottom: 8,
    fontWeight: '600',
  },
  suggestionsScroll: {
    maxHeight: 200,
  },
  suggestionsContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  suggestionButton: {
    backgroundColor: '#e3f2fd',
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionImage: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  suggestionText: {
    color: '#2c5aa0',
    fontSize: 16,
    fontWeight: '600',
  },
  progressBanner: {
    backgroundColor: '#fff3cd',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  progressText: {
    color: '#856404',
    fontSize: 13,
    fontWeight: '500',
  },
});