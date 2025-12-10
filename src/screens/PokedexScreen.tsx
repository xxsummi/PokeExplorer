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
  Modal,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, addPokemon, setLoading } from '../store';
import { pokeAPI } from '../services/pokeAPI';
import { Pokemon } from '../types';
import { VoiceSearch } from '../components/VoiceSearch';
import { initializePokemonSearch, searchPokemon, suggestPokemon, isIndexReady, canSearch, getIndexSize } from '../utils/fuzzySearch';

interface PokedexScreenProps {
  onPokemonSelect: (pokemon: Pokemon) => void;
}

const POKEMON_PER_PAGE = 8; // Default pagination: 8 Pokemon per page
const TOTAL_POKEMON = 151;
const TYPE_FILTER_PAGE_SIZE = 6; // Show 6 Pokemon per page when filtered by type

const POKEMON_TYPES = [
  'all', 'normal', 'fire', 'water', 'electric', 'grass', 'ice', 
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
];

const POKEMON_GENERATIONS = [
  { value: 'all', label: 'All Generations' },
  { value: '1', label: 'Generation I (1-151)' },
  { value: '2', label: 'Generation II (152-251)' },
  { value: '3', label: 'Generation III (252-386)' },
  { value: '4', label: 'Generation IV (387-493)' },
  { value: '5', label: 'Generation V (494-649)' },
  { value: '6', label: 'Generation VI (650-721)' },
  { value: '7', label: 'Generation VII (722-809)' },
  { value: '8', label: 'Generation VIII (810-905)' },
  { value: '9', label: 'Generation IX (906-1025)' },
];

// Helper function to get generation from Pokemon ID
const getGenerationFromId = (id: number): string => {
  if (id >= 1 && id <= 151) return '1';
  if (id >= 152 && id <= 251) return '2';
  if (id >= 252 && id <= 386) return '3';
  if (id >= 387 && id <= 493) return '4';
  if (id >= 494 && id <= 649) return '5';
  if (id >= 650 && id <= 721) return '6';
  if (id >= 722 && id <= 809) return '7';
  if (id >= 810 && id <= 905) return '8';
  if (id >= 906 && id <= 1025) return '9';
  return '1'; // Default to Gen 1
};

export const PokedexScreen: React.FC<PokedexScreenProps> = ({ onPokemonSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedGeneration, setSelectedGeneration] = useState<string>('all');
  const [searchResults, setSearchResults] = useState<Pokemon[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showVoiceSearch, setShowVoiceSearch] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showGenerationModal, setShowGenerationModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchPage, setSearchPage] = useState(1); // Pagination for search results
  const [pageData, setPageData] = useState<Pokemon[]>([]);
  const [allSearchResults, setAllSearchResults] = useState<Pokemon[]>([]); // Store all search results
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
    if (searchQuery || selectedType !== 'all' || selectedGeneration !== 'all') {
      setSearchPage(1); // Reset to first page when search/type/generation changes
      performSearch();
    } else {
      setSearchResults([]);
      setAllSearchResults([]);
      setSuggestions([]);
    }
  }, [searchQuery, selectedType, selectedGeneration, indexReady]);

  // Update displayed search results when page changes
  useEffect(() => {
    if (allSearchResults.length > 0) {
      const pageSize = (selectedType !== 'all' || selectedGeneration !== 'all') ? TYPE_FILTER_PAGE_SIZE : 20;
      const start = (searchPage - 1) * pageSize;
      const end = start + pageSize;
      setSearchResults(allSearchResults.slice(start, end));
    }
  }, [searchPage, allSearchResults, selectedType, selectedGeneration]);

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
      const errors: string[] = [];
      
      // Load Pokemon with individual error handling
      for (let i = start; i <= end; i++) {
        try {
          const poke = await pokeAPI.getPokemon(i);
          pokemon.push(poke);
        } catch (error: any) {
          console.log(`Error loading Pokemon ${i}:`, error.message);
          errors.push(`Pokemon ${i}`);
          // Continue loading other Pokemon even if one fails
        }
      }
      
      if (pokemon.length > 0) {
        setPageData(pokemon);
      } else {
        console.log('Failed to load any Pokemon for this page');
        // Show error message if all Pokemon failed to load
        if (errors.length > 0) {
          console.log('Failed Pokemon IDs:', errors.join(', '));
        }
      }
    } catch (error: any) {
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
    setIsSearching(true);
    const query = searchQuery.toLowerCase().trim().replace(/\s+/g, '');
    
    try {
      let results: Pokemon[] = [];
      
      // If type filter is selected, get Pokemon by type first
      if (selectedType !== 'all') {
        try {
          const typeResults = await pokeAPI.getPokemonByType(selectedType);
          results = typeResults;
          
          // Apply generation filter if needed
          if (selectedGeneration !== 'all') {
            results = results.filter(p => getGenerationFromId(p.id) === selectedGeneration);
          }
        } catch (error) {
          console.log('Error fetching by type:', error);
          setSearchResults([]);
          setSuggestions([]);
          setIsSearching(false);
          return;
        }
      } else if (selectedGeneration !== 'all' && !query) {
        // If only generation filter is selected (no type, no query), fetch Pokemon by ID range
        try {
          const genRanges: { [key: string]: { start: number; end: number } } = {
            '1': { start: 1, end: 151 },
            '2': { start: 152, end: 251 },
            '3': { start: 252, end: 386 },
            '4': { start: 387, end: 493 },
            '5': { start: 494, end: 649 },
            '6': { start: 650, end: 721 },
            '7': { start: 722, end: 809 },
            '8': { start: 810, end: 905 },
            '9': { start: 906, end: 1025 },
          };
          
          const range = genRanges[selectedGeneration];
          if (range) {
            // Load first batch of Pokemon from this generation (limit to 50 for performance)
            const pokemonPromises = [];
            const end = Math.min(range.start + 49, range.end);
            for (let i = range.start; i <= end; i++) {
              pokemonPromises.push(pokeAPI.getPokemon(i).catch(() => null));
            }
            const pokemonResults = await Promise.all(pokemonPromises);
            results = pokemonResults.filter((p): p is Pokemon => p !== null);
          }
        } catch (error) {
          console.log('Error fetching by generation:', error);
        }
      }
      
      // If there's a search query, filter results
      if (query) {
        // Try direct ID match first
        if (!isNaN(Number(query))) {
          try {
            const poke = await pokeAPI.getPokemon(Number(query));
            // Check if Pokemon matches type and generation filters
            const matchesType = selectedType === 'all' || poke.types.some((t: { type: { name: string } }) => t.type.name === selectedType);
            const matchesGeneration = selectedGeneration === 'all' || getGenerationFromId(poke.id) === selectedGeneration;
            
            if (matchesType && matchesGeneration) {
              setAllSearchResults([poke]);
              setSearchResults([poke]);
              setSuggestions([]);
              setIsSearching(false);
              return;
            }
          } catch (error) {
            console.log('Pokemon not found by ID:', error);
          }
        }
        
        // Try direct name match
        try {
          const poke = await pokeAPI.getPokemonByName(query);
          // Check if Pokemon matches type and generation filters
          const matchesType = selectedType === 'all' || poke.types.some((t: { type: { name: string } }) => t.type.name === selectedType);
          const matchesGeneration = selectedGeneration === 'all' || getGenerationFromId(poke.id) === selectedGeneration;
          
          if (matchesType && matchesGeneration) {
            setAllSearchResults([poke]);
            setSearchResults([poke]);
            setSuggestions([]);
            setIsSearching(false);
            return;
          }
        } catch (error) {
          // Name not found, continue to fuzzy search
        }
        
        // Filter results by search query (name contains query)
        if (results.length > 0) {
          results = results.filter(p => 
            p.name.toLowerCase().includes(query) || 
            p.id.toString() === query
          );
        } else if (canSearch()) {
          // Use fuzzy search if no type filter
          const fuzzyResults = searchPokemon(query, 100); // Get more results to filter
          results = fuzzyResults.map(r => r.entry.data);
        }
      }
      
      // Apply type filter to fuzzy search results if needed
      if (selectedType !== 'all' && results.length > 0) {
        results = results.filter(p => 
          p.types.some((t: { type: { name: string } }) => t.type.name === selectedType)
        );
      }
      
      // Apply generation filter if needed (applies to all result types)
      if (selectedGeneration !== 'all' && results.length > 0) {
        results = results.filter(p => getGenerationFromId(p.id) === selectedGeneration);
      }
      
      // Store all results and paginate
      setAllSearchResults(results);
      const pageSize = (selectedType !== 'all' || selectedGeneration !== 'all') ? TYPE_FILTER_PAGE_SIZE : 20;
      setSearchResults(results.slice(0, pageSize));
      
      // Generate suggestions if we have a query
      if (query && canSearch()) {
        const allSuggestions = suggestPokemon(query, 15);
        const filteredSuggestions = allSuggestions
          .map(s => s.entry.data)
          .filter(p => {
            const matchesType = selectedType === 'all' || p.types.some((t: { type: { name: string } }) => t.type.name === selectedType);
            const matchesGeneration = selectedGeneration === 'all' || getGenerationFromId(p.id) === selectedGeneration;
            return matchesType && matchesGeneration;
          })
          .filter(p => !results.some(r => r.id === p.id))
          .slice(0, 10);
        setSuggestions(filteredSuggestions);
      } else {
        setSuggestions([]);
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

  const displayData = (searchQuery || selectedType !== 'all' || selectedGeneration !== 'all') ? searchResults : pageData;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pokedex</Text>
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or ID..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity 
          style={[
            styles.typeFilterButton,
            selectedType !== 'all' && styles.typeFilterButtonActive
          ]}
          onPress={() => setShowTypeModal(true)}
        >
          <Text style={styles.typeFilterText}>
            {selectedType === 'all' ? 'Type' : selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.typeFilterButton,
            selectedGeneration !== 'all' && styles.typeFilterButtonActive
          ]}
          onPress={() => setShowGenerationModal(true)}
        >
          <Text style={styles.typeFilterText}>
            {selectedGeneration === 'all' ? 'Gen' : `Gen ${selectedGeneration}`}
          </Text>
        </TouchableOpacity>
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
      
      {(selectedType !== 'all' || selectedGeneration !== 'all') && (
        <TouchableOpacity 
          style={styles.clearFilterButton}
          onPress={() => {
            setSelectedType('all');
            setSelectedGeneration('all');
          }}
        >
          <Text style={styles.clearFilterText}>
            Clear filters{selectedType !== 'all' ? `: ${selectedType}` : ''}{selectedGeneration !== 'all' ? ` Gen ${selectedGeneration}` : ''}
          </Text>
        </TouchableOpacity>
      )}

      {/* Progress banner only shows while loading, hides when done */}
      {!indexReady && getIndexSize() > 0 && getIndexSize() < 1025 && (
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
              (searchQuery || selectedType !== 'all' || selectedGeneration !== 'all') && !isSearching ? 
                <Text style={styles.emptyText}>No Pokemon found</Text> : 
                null
            }
          />
          
          {/* Pagination for regular browsing */}
          {!searchQuery && selectedType === 'all' && (
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

          {/* Pagination for search/type/generation filter results - only show if more than page size */}
          {(searchQuery || selectedType !== 'all' || selectedGeneration !== 'all') && allSearchResults.length > 0 && 
           allSearchResults.length > ((selectedType !== 'all' || selectedGeneration !== 'all') ? TYPE_FILTER_PAGE_SIZE : 20) && (
            <View style={styles.pagination}>
              <TouchableOpacity 
                style={[styles.pageButton, searchPage === 1 && styles.pageButtonDisabled]}
                onPress={() => setSearchPage(prev => Math.max(1, prev - 1))}
                disabled={searchPage === 1}
              >
                <Text style={styles.pageButtonText}>← Prev</Text>
              </TouchableOpacity>
              
              <Text style={styles.pageInfo}>
                Page {searchPage} of {Math.ceil(allSearchResults.length / ((selectedType !== 'all' || selectedGeneration !== 'all') ? TYPE_FILTER_PAGE_SIZE : 20))} 
                {' '}({allSearchResults.length} total)
              </Text>
              
              <TouchableOpacity 
                style={[
                  styles.pageButton, 
                  searchPage >= Math.ceil(allSearchResults.length / ((selectedType !== 'all' || selectedGeneration !== 'all') ? TYPE_FILTER_PAGE_SIZE : 20)) && styles.pageButtonDisabled
                ]}
                onPress={() => {
                  const maxPage = Math.ceil(allSearchResults.length / ((selectedType !== 'all' || selectedGeneration !== 'all') ? TYPE_FILTER_PAGE_SIZE : 20));
                  setSearchPage(prev => Math.min(maxPage, prev + 1));
                }}
                disabled={searchPage >= Math.ceil(allSearchResults.length / ((selectedType !== 'all' || selectedGeneration !== 'all') ? TYPE_FILTER_PAGE_SIZE : 20))}
              >
                <Text style={styles.pageButtonText}>Next →</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
      
      <Modal
        visible={showTypeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Type</Text>
            <ScrollView style={styles.typeList}>
              {POKEMON_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeOption,
                    selectedType === type && styles.typeOptionSelected,
                    type !== 'all' && { backgroundColor: pokeAPI.getTypeColor(type) + '40' }
                  ]}
                  onPress={() => {
                    setSelectedType(type);
                    setShowTypeModal(false);
                  }}
                >
                  <Text style={[
                    styles.typeOptionText,
                    selectedType === type && styles.typeOptionTextSelected
                  ]}>
                    {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowTypeModal(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showGenerationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGenerationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Generation</Text>
            <ScrollView style={styles.typeList}>
              {POKEMON_GENERATIONS.map((gen) => (
                <TouchableOpacity
                  key={gen.value}
                  style={[
                    styles.typeOption,
                    selectedGeneration === gen.value && styles.typeOptionSelected
                  ]}
                  onPress={() => {
                    setSelectedGeneration(gen.value);
                    setShowGenerationModal(false);
                  }}
                >
                  <Text style={[
                    styles.typeOptionText,
                    selectedGeneration === gen.value && styles.typeOptionTextSelected
                  ]}>
                    {gen.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowGenerationModal(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
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
  typeFilterButton: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 10,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeFilterButtonActive: {
    backgroundColor: '#2c5aa0',
  },
  typeFilterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  clearFilterButton: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2c5aa0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearFilterText: {
    color: '#2c5aa0',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c5aa0',
    marginBottom: 16,
    textAlign: 'center',
  },
  typeList: {
    maxHeight: 400,
  },
  typeOption: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeOptionSelected: {
    borderColor: '#2c5aa0',
    backgroundColor: '#e3f2fd',
  },
  typeOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  typeOptionTextSelected: {
    color: '#2c5aa0',
  },
  modalCloseButton: {
    backgroundColor: '#2c5aa0',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});