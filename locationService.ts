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
          // Resolve with null instead of rejecting to allow callers to handle gracefully
          resolve(null);
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
    
    // Coastal/Ocean areas (near major water bodies)
    if (Math.abs(latitude % 1) < 0.05 || Math.abs(longitude % 1) < 0.05) {
      return Math.random() < 0.5 ? 'ocean' : 'beach';
    }
    
    // Polar/Snow regions
    if (Math.abs(latitude) > 66) {
      return 'snow';
    }
    
    // Mountain regions (high altitude indicators)
    if (Math.abs(latitude) > 45 && Math.abs(latitude) < 66) {
      return Math.random() < 0.3 ? 'mountain' : 'forest';
    }
    
    // Desert belt (subtropical)
    if ((latitude > 15 && latitude < 35) || (latitude < -15 && latitude > -35)) {
      return Math.random() < 0.4 ? 'desert' : 'urban';
    }
    
    // Tropical regions
    if (Math.abs(latitude) < 15) {
      return Math.random() < 0.5 ? 'tropical' : 'river';
    }
    
    // Urban detection (population density heuristic - near major coordinate intersections)
    const coordSum = Math.abs(latitude) + Math.abs(longitude);
    if (coordSum % 10 < 2) {
      return Math.random() < 0.6 ? 'city' : 'residential';
    }
    
    // Default to parks/grass
    return Math.random() < 0.7 ? 'park' : 'forest';
  }

  getPokemonByBiome(biome: string): number[] {
    const biomeMap: { [key: string]: number[] } = {
      park: [1, 2, 3, 10, 11, 12, 13, 14, 15, 16, 17, 18, 25, 26, 35, 36, 39, 40, 43, 44, 45, 152, 153, 154],
      forest: [1, 2, 3, 10, 11, 12, 13, 14, 15, 43, 44, 45, 46, 47, 48, 49, 69, 70, 71, 102, 103, 113, 114],
      mountain: [74, 75, 76, 95, 104, 105, 111, 112, 142, 147, 148, 149, 185, 207, 208, 246, 247, 248],
      beach: [7, 8, 9, 54, 55, 60, 61, 62, 72, 73, 79, 80, 90, 91, 98, 99, 116, 117, 118, 119, 120, 121],
      ocean: [7, 8, 9, 72, 73, 86, 87, 90, 91, 98, 99, 116, 117, 118, 119, 120, 121, 129, 130, 131, 147, 148, 149],
      river: [7, 8, 54, 55, 60, 61, 62, 79, 80, 98, 99, 118, 119, 129, 130, 147, 148],
      desert: [27, 28, 50, 51, 104, 105, 111, 112, 140, 141, 246, 247],
      snow: [86, 87, 91, 124, 131, 144, 215, 220, 221, 225],
      tropical: [1, 2, 3, 43, 44, 45, 69, 70, 71, 102, 103, 114, 147, 148, 149, 152, 153, 154],
      city: [19, 20, 52, 53, 81, 82, 100, 101, 109, 110, 132, 137],
      residential: [16, 17, 18, 19, 20, 35, 36, 39, 40, 52, 53, 63, 64, 65, 96, 97, 113, 122, 132],
    };
    
    return biomeMap[biome] || biomeMap.park;
  }

  async generatePokemonEncounters(location: Location, count: number = 5): Promise<PokemonEncounter[]> {
    const encounters: PokemonEncounter[] = [];
    const biome = this.getBiomeFromLocation(location);
    const biomePokemon = this.getPokemonByBiome(biome);
    
    // Use Promise.allSettled to fetch all Pokemon in parallel without blocking
    const promises = Array.from({ length: count }, async () => {
      try {
        const pokemonId = biomePokemon[Math.floor(Math.random() * biomePokemon.length)];
        const pokemonData = await pokeAPI.getPokemon(pokemonId);
        
        // Spawn Pokemon 10-500 meters away (0.0001-0.005 degrees ≈ 10-500m)
        const distance = 0.0001 + Math.random() * 0.0049;
        const angle = Math.random() * 2 * Math.PI;
        const offsetLat = Math.cos(angle) * distance;
        const offsetLng = Math.sin(angle) * distance;
        
        return {
          pokemon: pokemonData,
          location: {
            latitude: location.latitude + offsetLat,
            longitude: location.longitude + offsetLng,
          },
          timestamp: Date.now(),
          biome,
        };
      } catch (error) {
        console.error('Error generating Pokemon encounter:', error);
        return null;
      }
    });
    
    const results = await Promise.allSettled(promises);
    
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        encounters.push(result.value);
      }
    });
    
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