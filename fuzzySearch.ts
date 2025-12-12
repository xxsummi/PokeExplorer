/**
 * Fast Fuzzy Search using 3-Gram Inverted Index + Levenshtein Distance
 * Handles exact matches, normalization, and minor mispronunciations
 * Time Complexity: O(q) for trigram lookup + O(k log k) for ranking
 * Space Complexity: O(n*m) where n = entries, m = avg trigrams
 */

interface SearchEntry {
  id: number;
  name: string;
  normalized: string;
  phonetic: string;
  types: string[];
  data: any;
}

interface SearchResult {
  entry: SearchEntry;
  score: number;
  distance: number;
}

export class FuzzySearchIndex {
  private trigramIndex: Map<string, Set<number>> = new Map();
  private entries: Map<number, SearchEntry> = new Map();
  private normalizedMap: Map<string, number> = new Map();

  // Normalize: lowercase, remove spaces/dashes/accents
  private normalize(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\s\-_'.]/g, '');
  }

  // Simple phonetic encoding (Soundex-like)
  private phonetic(str: string): string {
    let s = str.toLowerCase();
    // Remove silent letters and normalize similar sounds
    s = s.replace(/[aeiouyhw]/g, '0');
    s = s.replace(/[bfpv]/g, '1');
    s = s.replace(/[cgjkqsxz]/g, '2');
    s = s.replace(/[dt]/g, '3');
    s = s.replace(/[l]/g, '4');
    s = s.replace(/[mn]/g, '5');
    s = s.replace(/[r]/g, '6');
    // Remove consecutive duplicates
    s = s.replace(/(.)\1+/g, '$1');
    return s;
  }

  // Generate 3-grams from normalized string
  private generateTrigrams(str: string): string[] {
    if (str.length < 3) return [str];
    const trigrams: string[] = [];
    for (let i = 0; i <= str.length - 3; i++) {
      trigrams.push(str.substring(i, i + 3));
    }
    return trigrams;
  }

  // Levenshtein distance
  private levenshtein(a: string, b: string): number {
    if (a === b) return 0;
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    
    const matrix: number[][] = Array(b.length + 1)
      .fill(null)
      .map(() => Array(a.length + 1).fill(0));
    
    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let i = 0; i <= b.length; i++) matrix[i][0] = i;
    
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        const cost = a[j - 1] === b[i - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    
    return matrix[b.length][a.length];
  }

  // Build phase: Index all entries
  build(entries: Array<{id: number; name: string; types?: string[]; data: any}>): void {
    this.trigramIndex.clear();
    this.entries.clear();
    this.normalizedMap.clear();
    
    for (const entry of entries) {
      const normalized = this.normalize(entry.name);
      const phonetic = this.phonetic(normalized);
      const types = entry.types || [];
      const searchEntry: SearchEntry = {
        id: entry.id,
        name: entry.name,
        normalized,
        phonetic,
        types,
        data: entry.data
      };
      
      this.entries.set(entry.id, searchEntry);
      this.normalizedMap.set(normalized, entry.id);
      
      // Index name trigrams
      const trigrams = this.generateTrigrams(normalized);
      for (const trigram of trigrams) {
        if (!this.trigramIndex.has(trigram)) {
          this.trigramIndex.set(trigram, new Set());
        }
        this.trigramIndex.get(trigram)!.add(entry.id);
      }
      
      // Index type trigrams
      for (const type of types) {
        const typeNormalized = this.normalize(type);
        const typeTrigrams = this.generateTrigrams(typeNormalized);
        for (const trigram of typeTrigrams) {
          if (!this.trigramIndex.has(trigram)) {
            this.trigramIndex.set(trigram, new Set());
          }
          this.trigramIndex.get(trigram)!.add(entry.id);
        }
      }
    }
  }

  // Query phase: Fast fuzzy search
  search(query: string, maxResults: number = 5, maxDistance: number = 3): SearchResult[] {
    const queryNormalized = this.normalize(query);
    const queryPhonetic = this.phonetic(queryNormalized);
    
    // Exact match check
    const exactId = this.normalizedMap.get(queryNormalized);
    if (exactId !== undefined) {
      const entry = this.entries.get(exactId)!;
      return [{ entry, score: 10000, distance: 0 }];
    }
    
    // Type exact match check - return ALL matches for type searches
    const typeMatches: SearchResult[] = [];
    for (const entry of this.entries.values()) {
      for (const type of entry.types) {
        const typeNormalized = this.normalize(type);
        if (typeNormalized === queryNormalized) {
          typeMatches.push({
            entry,
            score: 9000 - entry.id, // Sort by Pokedex number
            distance: 0
          });
          break;
        }
      }
    }
    
    if (typeMatches.length > 0) {
      typeMatches.sort((a, b) => b.score - a.score);
      return typeMatches; // Return all type matches, no limit
    }
    
    // Substring match check (name and types)
    const substringMatches: SearchResult[] = [];
    for (const entry of this.entries.values()) {
      // Check name
      if (entry.normalized.includes(queryNormalized) || queryNormalized.includes(entry.normalized)) {
        const distance = this.levenshtein(queryNormalized, entry.normalized);
        substringMatches.push({
          entry,
          score: 5000 - distance * 10 - Math.abs(entry.normalized.length - queryNormalized.length),
          distance
        });
      }
      // Check types
      else {
        for (const type of entry.types) {
          const typeNormalized = this.normalize(type);
          if (typeNormalized.includes(queryNormalized) || queryNormalized.includes(typeNormalized)) {
            const distance = this.levenshtein(queryNormalized, typeNormalized);
            substringMatches.push({
              entry,
              score: 4500 - distance * 10 - Math.abs(typeNormalized.length - queryNormalized.length),
              distance
            });
            break;
          }
        }
      }
    }
    
    if (substringMatches.length > 0) {
      substringMatches.sort((a, b) => b.score - a.score);
      return substringMatches.slice(0, maxResults);
    }
    
    // Phonetic match check
    const phoneticMatches: SearchResult[] = [];
    for (const entry of this.entries.values()) {
      const phoneticDist = this.levenshtein(queryPhonetic, entry.phonetic);
      if (phoneticDist <= 2) {
        const distance = this.levenshtein(queryNormalized, entry.normalized);
        phoneticMatches.push({
          entry,
          score: 3000 - phoneticDist * 50 - distance * 10,
          distance
        });
      }
    }
    
    if (phoneticMatches.length > 0) {
      phoneticMatches.sort((a, b) => b.score - a.score);
      return phoneticMatches.slice(0, maxResults);
    }
    
    // Trigram-based fuzzy search
    const queryTrigrams = this.generateTrigrams(queryNormalized);
    const candidateScores = new Map<number, number>();
    
    for (const trigram of queryTrigrams) {
      const matchingIds = this.trigramIndex.get(trigram);
      if (matchingIds) {
        for (const id of matchingIds) {
          candidateScores.set(id, (candidateScores.get(id) || 0) + 1);
        }
      }
    }
    
    const results: SearchResult[] = [];
    for (const [id, trigramScore] of candidateScores.entries()) {
      const entry = this.entries.get(id)!;
      const distance = this.levenshtein(queryNormalized, entry.normalized);
      
      if (distance <= maxDistance || trigramScore >= queryTrigrams.length * 0.5) {
        const lengthDiff = Math.abs(entry.normalized.length - queryNormalized.length);
        results.push({
          entry,
          score: trigramScore * 100 - distance * 15 - lengthDiff * 5,
          distance
        });
      }
    }
    
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, maxResults);
  }

  // Get suggestions with more lenient matching
  suggest(query: string, maxResults: number = 10): SearchResult[] {
    return this.search(query, maxResults, 5);
  }
}

// Singleton instance
let pokemonSearchIndex: FuzzySearchIndex | null = null;
let indexProgress = 0;

export async function initializePokemonSearch(pokeAPI: any): Promise<void> {
  if (pokemonSearchIndex) return;
  
  pokemonSearchIndex = new FuzzySearchIndex();
  const allEntries: Array<{id: number; name: string; types: string[]; data: any}> = [];
  
  // Load first 500 Pokemon quickly (priority batch)
  for (let i = 1; i <= 500; i++) {
    try {
      const pokemon = await pokeAPI.getPokemon(i);
      allEntries.push({
        id: pokemon.id,
        name: pokemon.name,
        types: pokemon.types.map((t: any) => t.type.name),
        data: pokemon
      });
      
      // Build index every 50 Pokemon for progressive search
      if (i % 50 === 0 || i === 500) {
        pokemonSearchIndex.build([...allEntries]);
        indexProgress = i;
      }
    } catch (e) {
      // Skip missing Pokemon
    }
  }
  
  // Load remaining Pokemon (501-1025) in background
  for (let i = 501; i <= 1025; i++) {
    try {
      const pokemon = await pokeAPI.getPokemon(i);
      allEntries.push({
        id: pokemon.id,
        name: pokemon.name,
        types: pokemon.types.map((t: any) => t.type.name),
        data: pokemon
      });
      
      // Rebuild index every 100 Pokemon
      if (i % 100 === 0 || i === 1025) {
        pokemonSearchIndex.build([...allEntries]);
        indexProgress = i;
      }
    } catch (e) {
      // Skip missing Pokemon
    }
  }
}

export function searchPokemon(query: string, maxResults: number = 5): SearchResult[] {
  if (!pokemonSearchIndex) {
    throw new Error('Pokemon search index not initialized');
  }
  return pokemonSearchIndex.search(query, maxResults, 3);
}

export function suggestPokemon(query: string, maxResults: number = 10): SearchResult[] {
  if (!pokemonSearchIndex) {
    throw new Error('Pokemon search index not initialized');
  }
  return pokemonSearchIndex.search(query, maxResults, 5);
}

export function isIndexReady(): boolean {
  return pokemonSearchIndex !== null;
}

export function getIndexSize(): number {
  return indexProgress;
}

export function canSearch(): boolean {
  return getIndexSize() > 0;
}
