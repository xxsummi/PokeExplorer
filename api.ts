import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pokemon } from './types';

// Base URL - will try domain first, then IP as fallback
const BASE_URL_DOMAIN = 'https://pokeapi.co/api/v2';
const BASE_URL_IP = 'https://172.67.195.193/api/v2'; // Fallback IP (may need updating)
const FETCH_TIMEOUT = 15000; // 15 seconds

// Helper to get base URL - tries domain first
const getBaseUrl = () => BASE_URL_DOMAIN;

// Helper function to add timeout to fetch
const fetchWithTimeout = (url: string, options: RequestInit = {}, timeout = FETCH_TIMEOUT): Promise<Response> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Request timeout'));
    }, timeout);

    fetch(url, options)
      .then(response => {
        clearTimeout(timer);
        resolve(response);
      })
      .catch(error => {
        clearTimeout(timer);
        reject(error);
      });
  });
};

class PokeAPI {
  private cache = new Map<string, any>();
  private cacheLoaded = false;
  private readonly MAX_CACHE_SIZE = 400;

  private xhrRequest(url: string, useIP = false): Promise<any> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.setRequestHeader('User-Agent', 'PokeExplorer/1.0');
      // When using IP address, set Host header for SNI (if possible)
      if (useIP) {
        try {
          // Note: Some browsers/React Native may not allow setting Host header
          // This is a limitation we work around by fixing DNS instead
        } catch (e) {
          // Host header setting may fail, that's okay
        }
      }
      xhr.timeout = 20000; // Increased to 20 seconds
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve({ ok: true, status: xhr.status, json: () => Promise.resolve(data) });
          } catch (e) {
            reject(new Error('Invalid JSON response'));
          }
        } else {
          reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
        }
      };
      
      xhr.onerror = (error) => {
        const errorDetails = {
          readyState: xhr.readyState,
          status: xhr.status,
          statusText: xhr.statusText,
          responseText: xhr.responseText?.substring(0, 200)
        };
        console.error('XHR error details:', errorDetails);
        
        // Check for DNS resolution errors
        const errorText = xhr.responseText || '';
        if (errorText.includes('Unable to resolve host') || 
            errorText.includes('No address associated with hostname') ||
            errorText.includes('getaddrinfo failed') ||
            xhr.status === 0) {
          reject(new Error('DNS_RESOLUTION_FAILED'));
        } else {
          reject(new Error(`Network request failed: ${xhr.statusText || errorText || 'Unknown error'}`));
        }
      };
      
      xhr.ontimeout = () => {
        console.error('XHR timeout for URL:', url);
        reject(new Error('Request timeout'));
      };
      
      try {
        xhr.send();
      } catch (error: any) {
        reject(new Error(`Failed to send request: ${error.message}`));
      }
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing connection with simple fetch');
      const response = await fetchWithTimeout('https://pokeapi.co/api/v2/pokemon/1', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      console.log('Response received:', response.status);
      return response.ok;
    } catch (error: any) {
      console.error('Connection test failed:', error.message);
      return false;
    }
  }

  private async loadCacheFromStorage(): Promise<void> {
    if (this.cacheLoaded) return;
    
    try {
      const keys = await AsyncStorage.getAllKeys();
      const pokemonKeys = keys.filter(k => k.startsWith('pokemon_'));
      
      if (pokemonKeys.length > 0) {
        const items = await AsyncStorage.multiGet(pokemonKeys);
        for (const [key, value] of items) {
          if (value) {
            this.cache.set(key, JSON.parse(value));
          }
        }
      }
    } catch (e) {
      console.log('Failed to load cache from storage:', e);
    }
    
    this.cacheLoaded = true;
  }

  async getPokemon(id: number, retries = 3): Promise<Pokemon> {
    await this.loadCacheFromStorage();
    
    const cacheKey = `pokemon_${id}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`Fetching Pokemon ${id} (attempt ${attempt}/${retries})...`);
        
        // Try XMLHttpRequest first (more reliable on Android emulator)
        let pokemon;
        let lastError: any = null;
        
        // Try domain first
        const urlsToTry = [
          `${BASE_URL_DOMAIN}/pokemon/${id}`,
          `${BASE_URL_IP}/pokemon/${id}` // Fallback to IP if DNS fails
        ];
        
        for (let urlIndex = 0; urlIndex < urlsToTry.length; urlIndex++) {
          const url = urlsToTry[urlIndex];
          const isIP = url.includes('172.67');
          try {
            console.log(`Attempting XHR request to: ${url} (${isIP ? 'IP fallback' : 'domain'})`);
            const xhrResponse = await this.xhrRequest(url, isIP);
            pokemon = await xhrResponse.json();
            console.log(`Successfully fetched Pokemon ${id} via XHR from ${isIP ? 'IP' : 'domain'}`);
            break; // Success, exit loop
          } catch (xhrError: any) {
            console.log(`XHR failed for ${url}: ${xhrError.message}`);
            lastError = xhrError;
            
            // If DNS error and we haven't tried IP yet, continue to next URL
            if (xhrError.message === 'DNS_RESOLUTION_FAILED' || 
                xhrError.message?.includes('Unable to resolve host') || 
                xhrError.message?.includes('DNS resolution failed') ||
                xhrError.message?.includes('No address associated with hostname')) {
              if (urlIndex < urlsToTry.length - 1) {
                console.log('DNS resolution failed, trying IP address fallback...');
                continue; // Try IP address next
              } else {
                // Last URL failed, throw DNS error with helpful message
                throw new Error('DNS resolution failed. The Android emulator cannot resolve "pokeapi.co". Please fix DNS settings:\n1. Open Android Studio > AVD Manager\n2. Click the dropdown next to your emulator > "Cold Boot Now"\n3. Or set DNS to 8.8.8.8 in emulator settings');
              }
            }
            
            // For other errors, try fetch as fallback
            try {
              console.log(`Trying fetch for: ${url}`);
              const response = await fetchWithTimeout(url, {
                method: 'GET',
                headers: {
                  'Accept': 'application/json',
                  'User-Agent': 'PokeExplorer/1.0',
                },
              });
              
              if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
              }
              
              pokemon = await response.json();
              console.log(`Successfully fetched Pokemon ${id} via fetch from ${url.includes('172.67') ? 'IP' : 'domain'}`);
              break; // Success, exit loop
            } catch (fetchError: any) {
              console.log(`Fetch also failed for ${url}: ${fetchError.message}`);
              lastError = fetchError;
              continue; // Try next URL
            }
          }
        }
        
        if (!pokemon) {
          throw new Error(`Failed to fetch Pokemon ${id} after trying all methods: ${lastError?.message || 'Unknown error'}`);
        }
        
        this.cache.set(cacheKey, pokemon);
        
        if (this.cache.size <= this.MAX_CACHE_SIZE) {
          try {
            await AsyncStorage.setItem(cacheKey, JSON.stringify(pokemon));
          } catch (e) {
            await this.clearOldCache();
          }
        }
        
        return pokemon;
      } catch (error: any) {
        console.log(`Attempt ${attempt}/${retries} failed for Pokemon ${id}:`, error.message);
        if (attempt === retries) {
          throw new Error(`Failed to fetch Pokemon ${id} after ${retries} attempts: ${error.message}`);
        }
        // Wait before retrying (exponential backoff)
        await new Promise<void>(resolve => setTimeout(() => resolve(), 1000 * attempt));
      }
    }
    
    throw new Error(`Failed to fetch Pokemon ${id}`);
  }

  async searchPokemon(query: string): Promise<Pokemon[]> {
    const results: Pokemon[] = [];
    console.log('Searching for Pokemon:', query);
    
    // Try to find by ID if query is numeric
    if (!isNaN(Number(query))) {
      try {
        console.log('Searching by ID:', query);
        const pokemon = await this.getPokemon(Number(query));
        results.push(pokemon);
        console.log('Found Pokemon by ID:', pokemon.name);
      } catch (error: any) {
        console.log('Pokemon not found by ID:', error.message);
      }
    }
    
    // Try to find by exact name
    try {
      console.log('Searching by name:', query.toLowerCase());
      const pokemon = await this.getPokemonByName(query.toLowerCase());
      if (!results.find(p => p.id === pokemon.id)) {
        results.push(pokemon);
        console.log('Found Pokemon by name:', pokemon.name);
      }
    } catch (error: any) {
      console.log('Pokemon not found by name:', error.message);
    }

    console.log('Search results count:', results.length);
    return results;
  }

  async getPokemonByName(name: string, retries = 3): Promise<Pokemon> {
    await this.loadCacheFromStorage();
    
    const cacheKey = `pokemon_name_${name}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`Fetching Pokemon ${name} (attempt ${attempt}/${retries})...`);
        
        // Try XMLHttpRequest first (more reliable on Android emulator)
        let pokemon;
        let lastError: any = null;
        
        // Try domain first, then IP as fallback
        const urlsToTry = [
          `${BASE_URL_DOMAIN}/pokemon/${name}`,
          `${BASE_URL_IP}/pokemon/${name}` // Fallback to IP if DNS fails
        ];
        
        for (let urlIndex = 0; urlIndex < urlsToTry.length; urlIndex++) {
          const url = urlsToTry[urlIndex];
          const isIP = url.includes('172.67');
          try {
            console.log(`Attempting XHR request to: ${url} (${isIP ? 'IP fallback' : 'domain'})`);
            const xhrResponse = await this.xhrRequest(url, isIP);
            pokemon = await xhrResponse.json();
            console.log(`Successfully fetched Pokemon ${name} via XHR from ${isIP ? 'IP' : 'domain'}`);
            break; // Success, exit loop
          } catch (xhrError: any) {
            console.log(`XHR failed for ${url}: ${xhrError.message}`);
            lastError = xhrError;
            
            // If DNS error and we haven't tried IP yet, continue to next URL
            if (xhrError.message === 'DNS_RESOLUTION_FAILED' || 
                xhrError.message?.includes('Unable to resolve host') || 
                xhrError.message?.includes('DNS resolution failed') ||
                xhrError.message?.includes('No address associated with hostname')) {
              if (urlIndex < urlsToTry.length - 1) {
                console.log('DNS resolution failed, trying IP address fallback...');
                continue; // Try IP address next
              } else {
                // Last URL failed, throw DNS error with helpful message
                throw new Error('DNS resolution failed. The Android emulator cannot resolve "pokeapi.co". Please fix DNS settings:\n1. Open Android Studio > AVD Manager\n2. Click the dropdown next to your emulator > "Cold Boot Now"\n3. Or set DNS to 8.8.8.8 in emulator settings');
              }
            }
            
            // For other errors, try fetch as fallback
            try {
              console.log(`Trying fetch for: ${url}`);
              const response = await fetchWithTimeout(url, {
                method: 'GET',
                headers: {
                  'Accept': 'application/json',
                  'User-Agent': 'PokeExplorer/1.0',
                },
              });
              
              if (!response.ok) {
                if (response.status === 404) {
                  throw new Error(`Pokemon ${name} not found`);
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
              }
              
              pokemon = await response.json();
              console.log(`Successfully fetched Pokemon ${name} via fetch from ${isIP ? 'IP' : 'domain'}`);
              break; // Success, exit loop
            } catch (fetchError: any) {
              console.log(`Fetch also failed for ${url}: ${fetchError.message}`);
              lastError = fetchError;
              
              // If 404, that's a valid error (Pokemon not found)
              if (fetchError.message.includes('not found') || fetchError.message.includes('404')) {
                throw new Error(`Pokemon ${name} not found`);
              }
              
              if (urlIndex < urlsToTry.length - 1) {
                continue; // Try next URL
              } else {
                // Both URLs failed
                throw new Error(`Failed to fetch Pokemon ${name} after trying all methods: ${lastError?.message || 'Unknown error'}`);
              }
            }
          }
        }
        
        if (!pokemon) {
          throw new Error(`Failed to fetch Pokemon ${name} after trying all methods: ${lastError?.message || 'Unknown error'}`);
        }
        
        this.cache.set(cacheKey, pokemon);
        
        if (this.cache.size <= this.MAX_CACHE_SIZE) {
          try {
            await AsyncStorage.setItem(cacheKey, JSON.stringify(pokemon));
          } catch (e) {
            await this.clearOldCache();
          }
        }
        
        return pokemon;
      } catch (error: any) {
        console.log(`Attempt ${attempt}/${retries} failed for Pokemon ${name}:`, error.message);
        if (attempt === retries) {
          throw error;
        }
        // Wait before retrying (exponential backoff)
        await new Promise<void>(resolve => setTimeout(() => resolve(), 1000 * attempt));
      }
    }
    
    throw new Error(`Failed to fetch Pokemon ${name}`);
  }

  private async clearOldCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const pokemonKeys = keys.filter(k => k.startsWith('pokemon_'));
      if (pokemonKeys.length > this.MAX_CACHE_SIZE) {
        const toRemove = pokemonKeys.slice(0, pokemonKeys.length - this.MAX_CACHE_SIZE);
        await AsyncStorage.multiRemove(toRemove);
      }
    } catch (e) {
      console.log('Cache cleanup failed:', e);
    }
  }

  async clearAllCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const pokemonKeys = keys.filter(k => k.startsWith('pokemon_'));
      await AsyncStorage.multiRemove(pokemonKeys);
      this.cache.clear();
      console.log('Cache cleared successfully');
    } catch (e) {
      console.log('Failed to clear cache:', e);
    }
  }

  async getRandomPokemon(): Promise<Pokemon> {
    const randomId = Math.floor(Math.random() * 150) + 1; // First 150 Pokemon
    return this.getPokemon(randomId);
  }

  getTypeColor(type: string): string {
    const colors: { [key: string]: string } = {
      normal: '#A8A878',
      fire: '#F08030',
      water: '#6890F0',
      electric: '#F8D030',
      grass: '#78C850',
      ice: '#98D8D8',
      fighting: '#C03028',
      poison: '#A040A0',
      ground: '#E0C068',
      flying: '#A890F0',
      psychic: '#F85888',
      bug: '#A8B820',
      rock: '#B8A038',
      ghost: '#705898',
      dragon: '#7038F8',
      dark: '#705848',
      steel: '#B8B8D0',
      fairy: '#EE99AC',
    };
    return colors[type] || '#68A090';
  }
}

export const pokeAPI = new PokeAPI();