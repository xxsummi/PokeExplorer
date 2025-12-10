# Project Structure

This document outlines the organized folder structure of PokeExplorer.

## 📁 Directory Structure

```
PokeExplorer/
├── src/                          # Main source code
│   ├── screens/                 # Screen components (one per screen)
│   │   ├── LoginScreen.tsx
│   │   ├── PokedexScreen.tsx
│   │   ├── PokemonDetailScreen.tsx
│   │   ├── HuntScreen.tsx
│   │   ├── CameraScreen.tsx
│   │   ├── AR3DScreen.tsx
│   │   └── ProfileScreen.tsx
│   │
│   ├── components/               # Reusable UI components
│   │   └── VoiceSearch.tsx
│   │
│   ├── services/                 # Business logic and API services
│   │   ├── index.ts             # Centralized service exports
│   │   ├── pokeAPI.ts           # PokeAPI integration with caching
│   │   ├── authService.ts       # Firebase authentication
│   │   ├── locationService.ts   # Geolocation and biome detection
│   │   ├── notificationService.ts # Push notifications
│   │   └── permissionsService.ts # Permission management
│   │
│   ├── store/                   # Redux state management
│   │   └── index.ts            # Store configuration and slices
│   │
│   ├── types/                   # TypeScript type definitions
│   │   ├── index.ts             # Domain models (Pokemon, User, etc.)
│   │   └── env.d.ts            # Environment variable types
│   │
│   ├── utils/                   # Utility functions
│   │   └── fuzzySearch.ts      # Fast fuzzy search implementation
│   │
│   └── config/                  # Configuration files
│       └── firebase.ts          # Firebase configuration
│
├── android/                     # Android native code
├── ios/                         # iOS native code
├── __tests__/                   # Test files
├── docs/                        # Documentation
│   ├── README.md               # Main documentation
│   ├── QUICKSTART.md           # Quick start guide
│   └── ...                     # Other documentation files
│
├── App.tsx                      # Root component
├── index.js                    # Entry point
├── package.json                # Dependencies
├── tsconfig.json              # TypeScript configuration
├── .env.example               # Environment variables template
└── README.md                   # Project overview
```

## 🏗️ Architecture Principles

### 1. **Separation of Concerns**
- **Screens**: UI components that represent full pages
- **Components**: Reusable UI elements
- **Services**: Business logic, API calls, and external integrations
- **Store**: Global state management
- **Types**: Type definitions for type safety

### 2. **Modular Design**
- Each service is self-contained with clear responsibilities
- Services export through `index.ts` for cleaner imports
- Types are centralized for consistency

### 3. **Code Organization**
- Related functionality grouped together
- Clear naming conventions
- Index files for easier imports

## 📝 Import Patterns

### Recommended Import Style

```typescript
// ✅ Good - Use relative paths from src/
import { Pokemon } from '../types';
import { pokeAPI } from '../services/pokeAPI';
import { store } from '../store';

// ✅ Good - Use service index for multiple imports
import { pokeAPI, authService, locationService } from '../services';

// ❌ Bad - Don't use absolute paths without alias
import { Pokemon } from './types';
```

## 🔧 Key Files Explained

### Services

- **pokeAPI.ts**: Handles all PokeAPI interactions with:
  - Automatic retry logic
  - DNS fallback for Android emulator
  - Offline caching with AsyncStorage
  - Type-based filtering

- **authService.ts**: Firebase authentication wrapper

- **locationService.ts**: Geolocation services and biome detection

- **permissionsService.ts**: Cross-platform permission handling

### Store

- **store/index.ts**: Redux store configuration
  - Manages user state
  - Pokemon cache
  - Location tracking
  - Encounter history

### Types

- **types/index.ts**: All TypeScript interfaces
  - Pokemon, User, Location models
  - Ensures type safety across the app

## 🚀 Benefits of This Structure

1. **Maintainability**: Easy to find and modify code
2. **Scalability**: Simple to add new features
3. **Testability**: Services can be easily mocked
4. **Type Safety**: Centralized types prevent errors
5. **Code Reuse**: Components and services are reusable
6. **Clear Dependencies**: Import paths show relationships

## 📚 Next Steps

When adding new features:

1. **New Screen**: Add to `src/screens/`
2. **New Component**: Add to `src/components/`
3. **New Service**: Add to `src/services/` and export in `index.ts`
4. **New Type**: Add to `src/types/index.ts`
5. **New Utility**: Add to `src/utils/`

