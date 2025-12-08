export interface Pokemon {
  id: number;
  name: string;
  types: PokemonType[];
  sprites: {
    front_default: string;
    other: {
      'official-artwork': {
        front_default: string;
      };
    };
  };
  stats: PokemonStat[];
  abilities: PokemonAbility[];
  height: number;
  weight: number;
}

export interface PokemonType {
  type: {
    name: string;
  };
}

export interface PokemonStat {
  base_stat: number;
  stat: {
    name: string;
  };
}

export interface PokemonAbility {
  ability: {
    name: string;
  };
}

export interface User {
  id: string;
  email: string;
  discoveredPokemon: number[];
  capturedPhotos: string[];
}

export interface Location {
  latitude: number;
  longitude: number;
}

export interface PokemonEncounter {
  pokemon: Pokemon;
  location: Location;
  timestamp: number;
  biome?: string;
}