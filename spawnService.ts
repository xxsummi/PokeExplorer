import { store } from './store';
import { addSpawn, cleanupExpiredSpawns, removeExpiredSpawns } from './store';
import { pokeAPI } from './api';
import { PokemonSpawn } from './types';
import { notificationService } from './notifications';
import { locationService } from './locationService';

class SpawnService {
  private static instance: SpawnService;
  private spawnInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  static getInstance(): SpawnService {
    if (!SpawnService.instance) {
      SpawnService.instance = new SpawnService();
    }
    return SpawnService.instance;
  }

  startSpawning() {
    if (this.isRunning) return;
    this.isRunning = true;

    const spawnWithLogarithmicRate = () => {
      if (!this.isRunning) return;
      
      this.generateSpawn();
      this.cleanupExpiredSpawns();
      
      // Calculate next spawn delay based on current spawn count
      const state = store.getState();
      const activeSpawns = state.app.spawns.filter(spawn => 
        !spawn.caught && spawn.expiresAt > Date.now()
      ).length;
      
      // Moderate spawn rate increase
      const baseDelay = 3000; // 3 seconds minimum (was 5)
      let delay;
      if (activeSpawns >= 8) {
        delay = 60000 + (activeSpawns - 8) * 30000; // 1 minute at 8+ (was 1:55)
      } else {
        const logFactor = Math.pow(activeSpawns, 2) * 3000; // Reduced scaling (was 5000)
        delay = baseDelay + logFactor;
      }
      
      this.spawnInterval = setTimeout(spawnWithLogarithmicRate, delay);
    };
    
    spawnWithLogarithmicRate();
  }

  stopSpawning() {
    this.isRunning = false;
    if (this.spawnInterval) {
      clearTimeout(this.spawnInterval);
      this.spawnInterval = null;
    }
  }

  private async generateSpawn() {
    const state = store.getState();
    const { currentLocation, spawns } = state.app;

    if (!currentLocation) return;

    // Cap active spawns at 15
    const activeSpawns = spawns.filter(spawn => 
      !spawn.caught && spawn.expiresAt > Date.now()
    );
    if (activeSpawns.length >= 15) return;

    try {
      // Generate random Pokémon (Gen 1-3 for variety)
      const randomId = Math.floor(Math.random() * 386) + 1;
      const pokemon = await pokeAPI.getPokemon(randomId);

      // Weighted location variance - 70% within 100m, 30% farther
      const distance = Math.random() < 0.7 ? Math.random() * 0.001 : Math.random() * 0.01; // 70% within 100m, 30% far
      const angle = Math.random() * 2 * Math.PI;
      const latVariance = distance * Math.cos(angle);
      const lngVariance = distance * Math.sin(angle);

      // Distance-based expiration: close = 60s, far = 30s
      const isClose = distance <= 0.001;
      const expireTime = isClose ? 60000 : 30000; // 60s close, 30s far

      const spawn: PokemonSpawn = {
        id: `spawn-${Date.now()}-${Math.random()}`,
        pokemon,
        location: {
          latitude: currentLocation.latitude + latVariance,
          longitude: currentLocation.longitude + lngVariance,
        },
        timestamp: Date.now(),
        expiresAt: Date.now() + expireTime,
        caught: false,
      };

      store.dispatch(addSpawn(spawn));

      // Calculate distance and send notification for nearby Pokemon
      const distanceInMeters = locationService.calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        spawn.location.latitude,
        spawn.location.longitude
      );
      
      console.log(`Pokemon ${pokemon.name} spawned at ${Math.round(distanceInMeters)}m away`);
      
      // Only notify for Pokemon within 200m
      if (distanceInMeters <= 200) {
        console.log(`Sending notification for nearby ${pokemon.name}`);
        notificationService.showPokemonNearbyNotification(
          pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1),
          Math.round(distanceInMeters)
        );
      } else {
        console.log(`Pokemon ${pokemon.name} too far (${Math.round(distanceInMeters)}m) - no notification`);
      }

    } catch (error) {
      console.log('Spawn generation error:', error);
    }
  }

  // Clean up expired spawns
  private cleanupExpiredSpawns() {
    store.dispatch(removeExpiredSpawns());
  }

  // Force cleanup all expired spawns
  forceCleanup() {
    store.dispatch(removeExpiredSpawns());
  }
}

export const spawnService = SpawnService.getInstance();