import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Pokemon, User, PokemonEncounter } from './types';

interface AppState {
  user: User | null;
  pokemon: Pokemon[];
  discoveredPokemon: Pokemon[];
  currentLocation: { latitude: number; longitude: number } | null;
  encounters: PokemonEncounter[];
  loading: boolean;
}

const initialState: AppState = {
  user: null,
  pokemon: [],
  discoveredPokemon: [],
  currentLocation: null,
  encounters: [],
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
  },
});

export const { setUser, setPokemon, addPokemon, addDiscoveredPokemon, setCurrentLocation, addEncounter, setLoading } = appSlice.actions;

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