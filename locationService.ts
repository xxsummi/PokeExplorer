import Geolocation from 'react-native-geolocation-service';
import { request, PERMISSIONS, RESULTS, Permission } from 'react-native-permissions';
import { Platform, Alert } from 'react-native';
import { Location, PokemonEncounter, Pokemon } from './types';
import { pokeAPI } from './api';

export class LocationService {
  private watchId: number | null = null;

  async requestLocationPermission(): Promise<boolean> {
    try {
      const permission: Permission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
        : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
      
      const result = await request(permission);
      return result === RESULTS.GRANTED;
    } catch (error) {
      console.log('Permission error:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<Location | null> {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Location error:', error);
          reject(error);
        },
        { 
          enableHighAccuracy: true, 
          timeout: 15000, 
          maximumAge: 10000 
        }
      );
    });
  }

  watchLocation(callback: (location: Location) => void): Promise<number> {
    return new Promise((resolve, reject) => {
      const watchId = Geolocation.watchPosition(
        (position) => {
          callback({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Location tracking error:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          distanceFilter: 10, // Update every 10 meters
          interval: 5000, // Update every 5 seconds
          fastestInterval: 2000,
        }
      );
      
      this.watchId = watchId;
      resolve(watchId);
    });
  }

  stopWatching(): void {
    if (this.watchId) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  getBiomeFromLocation(location: Location): string {
    const { latitude, longitude } = location;
    
    // Water biome near coordinate boundaries
    if (Math.abs(latitude % 1) < 0.1 || Math.abs(longitude % 1) < 0.1) {
      return 'water';
    }
    
    // Urban areas based on coordinates
    if (Math.abs(latitude) > 40 && Math.abs(longitude) > 70) {
      return 'urban';
    }
    
    // Mountain biome for high latitudes
    if (Math.abs(latitude) > 60) {
      return 'mountain';
    }
    
    // Desert biome for specific coordinate ranges
    if (latitude > 20 && latitude < 40 && longitude > -120 && longitude < -80) {
      return 'desert';
    }
    
    // Grass biome in northern hemisphere
    if (latitude > 0) {
      return 'grass';
    }
    
    return 'normal';
  }

  getPokemonByBiome(biome: string): number[] {
    const biomeMap: { [key: string]: number[] } = {
      water: [7, 8, 9, 54, 55, 72, 73, 90, 91, 98, 99, 116, 117, 118, 119, 120, 121, 129, 130, 131],
      grass: [1, 2, 3, 25, 26, 43, 44, 45, 69, 70, 71, 102, 103, 114, 152, 153, 154],
      urban: [19, 20, 52, 53, 81, 82, 100, 101, 109, 110, 132, 137, 233, 474],
      mountain: [74, 75, 76, 95, 111, 112, 142, 144, 145, 146, 185, 207, 208, 246, 247, 248],
      desert: [27, 28, 50, 51, 104, 105, 140, 141, 328, 329, 330, 331, 332, 443, 444, 445],
      normal: [4, 5, 6, 16, 17, 18, 21, 22, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40],
    };
    
    return biomeMap[biome] || biomeMap.normal;
  }

  async generatePokemonEncounters(location: Location, count: number = 5): Promise<PokemonEncounter[]> {
    const encounters: PokemonEncounter[] = [];
    const biome = this.getBiomeFromLocation(location);
    const biomePokemon = this.getPokemonByBiome(biome);
    
    for (let i = 0; i < count; i++) {
      try {
        // Select Pokemon based on biome
        const pokemonId = biomePokemon[Math.floor(Math.random() * biomePokemon.length)];
        const pokemonData = await pokeAPI.getPokemon(pokemonId);
        
        // Generate random location within 500m radius
        const offsetLat = (Math.random() - 0.5) * 0.01; // ~500m
        const offsetLng = (Math.random() - 0.5) * 0.01;
        
        const encounter: PokemonEncounter = {
          pokemon: pokemonData,
          location: {
            latitude: location.latitude + offsetLat,
            longitude: location.longitude + offsetLng,
          },
          timestamp: Date.now(),
          biome,
        };
        
        encounters.push(encounter);
      } catch (error) {
        console.log('Error generating Pokemon encounter:', error);
        // Continue with other Pokemon even if one fails
      }
    }
    
    return encounters;
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  getBiomeConfig(biome: string) {
    const configs = {
      water: {
        filterColor: 'rgba(30, 144, 255, 0.15)',
        particles: ['💧', '🌊', '💦'],
        description: 'Near water sources',
      },
      grass: {
        filterColor: 'rgba(34, 139, 34, 0.15)',
        particles: ['🌿', '🍃', '🌱'],
        description: 'Grassy areas',
      },
      urban: {
        filterColor: 'rgba(128, 128, 128, 0.15)',
        particles: ['🏢', '🚗', '💡'],
        description: 'City environment',
      },
      mountain: {
        filterColor: 'rgba(139, 69, 19, 0.15)',
        particles: ['⛰️', '🗻', '🪨'],
        description: 'Mountainous terrain',
      },
      desert: {
        filterColor: 'rgba(255, 218, 185, 0.15)',
        particles: ['🌵', '🏜️', '☀️'],
        description: 'Arid regions',
      },
      normal: {
        filterColor: 'rgba(255, 255, 255, 0.05)',
        particles: ['🌸', '🦋', '🌺'],
        description: 'Common areas',
      },
    };
    
    return configs[biome] || configs.normal;
  }
}

export const locationService = new LocationService();