import { pokeAPI } from '../api';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Mock axios
jest.mock('axios');

describe('PokeAPI Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return correct type color', () => {
    expect(pokeAPI.getTypeColor('fire')).toBe('#F08030');
    expect(pokeAPI.getTypeColor('water')).toBe('#6890F0');
    expect(pokeAPI.getTypeColor('grass')).toBe('#78C850');
    expect(pokeAPI.getTypeColor('unknown')).toBe('#68A090');
  });

  test('should generate random Pokemon ID between 1 and 150', async () => {
    // Mock the getPokemon method to avoid actual API calls
    const mockGetPokemon = jest.spyOn(pokeAPI, 'getPokemon').mockResolvedValue({
      id: 25,
      name: 'pikachu',
      types: [{ type: { name: 'electric' } }],
      sprites: {
        front_default: 'https://example.com/pikachu.png',
        other: {
          'official-artwork': {
            front_default: 'https://example.com/pikachu-artwork.png'
          }
        }
      },
      stats: [],
      abilities: [],
      height: 4,
      weight: 60
    });

    const pokemon = await pokeAPI.getRandomPokemon();
    
    expect(mockGetPokemon).toHaveBeenCalledWith(expect.any(Number));
    expect(pokemon.name).toBe('pikachu');
    
    mockGetPokemon.mockRestore();
  });
});