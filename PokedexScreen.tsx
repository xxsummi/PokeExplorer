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

const getSoftenedTypeColor = (typeName: string): string => {
  const typeColors: { [key: string]: string } = {
    normal: '#E8E0D4', fire: '#EFD3BA', water: '#BEDBDD', electric: '#F0E8A8',
    grass: '#C4E4D5', ice: '#BCD9D7', fighting: '#E8C5C5', poison: '#D8C5E8',
    ground: '#E8D4B8', flying: '#D4E0E8', psychic: '#E8C5D8', bug: '#D0E8C5',
    rock: '#D8C8B0', ghost: '#D0D0E0', dragon: '#C5D0E8', dark: '#B8B8B8',
    steel: '#D0D8E0', fairy: '#E8D0E0'
  };
  return typeColors[typeName] || '#E8E8E8';
};

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
          const results = searchPokemon(searchQuery.toLowerCase().replace(/\s+/g, ''), 200);
          const allSuggestions = suggestPokemon(searchQuery.toLowerCase().replace(/\s+/g, ''), 15);
          const newResultCount = results.length + allSuggestions.length;
          
          // Only update if we found new matches
          if (newResultCount > lastResultCount) {
            if (results.length > 5) {
              setSearchResults(results.map(r => r.entry.data));
              const additionalSuggestions = allSuggestions
                .filter(s => !results.some(r => r.entry.id === s.entry.id));
              setSuggestions(additionalSuggestions.map(s => s.entry.data).slice(0, 10));
            } else if (results.length > 0) {
              setSearchResults(results.slice(0, 1).map(r => r.entry.data));
              const remainingResults = results.slice(1);
              const additionalSuggestions = allSuggestions
                .filter(s => !results.some(r => r.entry.id === s.entry.id));
              setSuggestions([
                ...remainingResults.map(r => r.entry.data),
                ...additionalSuggestions.map(s => s.entry.data)
              ].slice(0, 10));
            } else {
              setSearchResults([]);
              setSuggestions(allSuggestions.map(s => s.entry.data).slice(0, 10));
            }
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
      const results = searchPokemon(query, 200); // Increased limit for type searches
      const allSuggestions = suggestPokemon(query, 15);
      
      // If we have many results (likely a type search), show all
      if (results.length > 5) {
        setSearchResults(results.map(r => r.entry.data));
        // Still show suggestions if available
        const additionalSuggestions = allSuggestions
          .filter(s => !results.some(r => r.entry.id === s.entry.id));
        setSuggestions(additionalSuggestions.map(s => s.entry.data).slice(0, 10));
      } else if (results.length > 0) {
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
      } else {
        // No results, show only suggestions
        setSearchResults([]);
        setSuggestions(allSuggestions.map(s => s.entry.data).slice(0, 10));
      }
      
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
      style={[styles.pokemonCard, { backgroundColor: getSoftenedTypeColor(item.types[0].type.name) }]}
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
    backgroundColor: '#F3FCFB',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'left',
    color: '#2D3748',
    marginBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#2D3748',
  },
  voiceButton: {
    backgroundColor: '#667EEA',
    width: 44,
    height: 44,
    borderRadius: 12,
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 6,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  pageButton: {
    backgroundColor: '#667EEA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  pageButtonDisabled: {
    backgroundColor: '#E2E8F0',
  },
  pageButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  pageInfo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    marginHorizontal: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  pokemonCard: {
    flex: 1,
    margin: 6,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    minHeight: 180,
  },
  pokemonImage: {
    width: 90,
    height: 90,
    marginBottom: 12,
  },
  pokemonInfo: {
    alignItems: 'center',
    width: '100%',
  },
  pokemonName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
    textAlign: 'center',
  },
  typesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
  },
  typeTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  suggestionsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
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
    backgroundColor: '#F7FAFC',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
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
    backgroundColor: '#F7FAFC',
    padding: 4,
    paddingTop: 0,
    paddingBottom: 0,
    borderRadius: 4,
    marginBottom: 4,
    alignItems: 'center',
  },
  progressText: {
    color: '#A0AEC0',
    fontSize: 10,
    fontWeight: '400',
  },
});