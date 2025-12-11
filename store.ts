import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Pokemon, User, PokemonEncounter, PokemonSpawn, Achievement } from './types';

interface AppState {
  user: User | null;
  pokemon: Pokemon[];
  discoveredPokemon: Pokemon[];
  currentLocation: { latitude: number; longitude: number } | null;
  encounters: PokemonEncounter[];
  spawns: PokemonSpawn[];
  caughtPokemon: Pokemon[];
  achievements: Achievement[];
  loading: boolean;
}

const initialState: AppState = {
  user: null,
  pokemon: [],
  discoveredPokemon: [],
  currentLocation: null,
  encounters: [],
  spawns: [],
  caughtPokemon: [],
  achievements: [],
  loading: false,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    setPokemon: (state, action: PayloadAction<Pokemon[]>) => {
      state.pokemon = action.payload;
    },
    addPokemon: (state, action: PayloadAction<Pokemon>) => {
      if (!state.pokemon.find(p => p.id === action.payload.id)) {
        state.pokemon.push(action.payload);
      }
    },
    addDiscoveredPokemon: (state, action: PayloadAction<Pokemon>) => {
      if (!state.discoveredPokemon.find(p => p.id === action.payload.id)) {
        state.discoveredPokemon.push(action.payload);
        if (state.user) {
          state.user.discoveredPokemon.push(action.payload.id);
        }
      }
    },
    setCurrentLocation: (state, action: PayloadAction<{ latitude: number; longitude: number }>) => {
      state.currentLocation = action.payload;
    },
    addEncounter: (state, action: PayloadAction<PokemonEncounter>) => {
      state.encounters.push(action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    addSpawn: (state, action: PayloadAction<PokemonSpawn>) => {
      // Enforce 15 spawn limit
      const activeSpawns = state.spawns.filter(spawn => 
        !spawn.caught && spawn.expiresAt > Date.now()
      );
      if (activeSpawns.length < 15) {
        state.spawns.push(action.payload);
      }
    },
    catchPokemon: (state, action: PayloadAction<string>) => {
      const spawn = state.spawns.find(s => s.id === action.payload);
      if (spawn) {
        spawn.caught = true;
        state.caughtPokemon.push(spawn.pokemon);
        if (!state.discoveredPokemon.find(p => p.id === spawn.pokemon.id)) {
          state.discoveredPokemon.push(spawn.pokemon);
        }
      }
    },
    addAchievement: (state, action: PayloadAction<Achievement>) => {
      if (!state.achievements.find(a => a.id === action.payload.id)) {
        state.achievements.push(action.payload);
      }
    },
    cleanupExpiredSpawns: (state) => {
      const now = Date.now();
      state.spawns = state.spawns.filter(spawn => 
        !spawn.caught && spawn.expiresAt > now
      );
    },
    removeExpiredSpawns: (state) => {
      const now = Date.now();
      state.spawns = state.spawns.filter(spawn => spawn.expiresAt > now);
    },
    clearAllSpawns: (state) => {
      state.spawns = [];
    },
  },
});

export const { setUser, setPokemon, addPokemon, addDiscoveredPokemon, setCurrentLocation, addEncounter, setLoading, addSpawn, catchPokemon, addAchievement, cleanupExpiredSpawns, removeExpiredSpawns, clearAllSpawns } = appSlice.actions;

export const store = configureStore({
  reducer: {
    app: appSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;