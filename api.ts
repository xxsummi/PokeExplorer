import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pokemon } from './types';

const BASE_URL = 'https://pokeapi.co/api/v2';

class PokeAPI {
  private cache = new Map<string, any>();

  private xhrRequest(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.timeout = 10000;
      
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
      
      xhr.onerror = () => reject(new Error('Network request failed'));
      xhr.ontimeout = () => reject(new Error('Request timeout'));
      
      xhr.send();
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing connection with simple fetch');
      const response = await fetch('https://pokeapi.co/api/v2/pokemon/1');
      console.log('Response received:', response.status);
      return response.ok;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  async getPokemon(id: number): Promise<Pokemon> {
    const cacheKey = `pokemon_${id}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const response = await fetch(`${BASE_URL}/pokemon/${id}`);
    const pokemon = await response.json();
    
    // Limit cache to 50 items
    if (this.cache.size >= 50) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(cacheKey, pokemon);
    return pokemon;
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

  async getPokemonByName(name: string): Promise<Pokemon> {
    const cacheKey = `pokemon_name_${name}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const response = await fetch(`${BASE_URL}/pokemon/${name}`);
    if (!response.ok) throw new Error(`Pokemon ${name} not found`);
    const pokemon = await response.json();
    this.cache.set(cacheKey, pokemon);
    return pokemon;
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