/**
 * Services Index
 * 
 * Centralized exports for all service modules
 * This allows cleaner imports: import { pokeAPI, authService } from '@/services'
 */

export { pokeAPI } from './pokeAPI';
export { authService } from './authService';
export { locationService } from './locationService';
export { notificationService } from './notificationService';
export { permissionsService } from './permissionsService';

