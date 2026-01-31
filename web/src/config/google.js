/**
 * Google API Configuration
 * Centralized configuration for all Google services
 */

export const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';

// Verify the key is loaded
if (!GOOGLE_API_KEY && process.env.NODE_ENV === 'development') {
  console.warn('[Google Maps] API key not configured. Set REACT_APP_GOOGLE_MAPS_API_KEY in .env');
}

export const GOOGLE_MAPS_LIBRARIES = ['places', 'geometry', 'marker'];

export const GOOGLE_MAPS_CONFIG = {
  version: 'weekly',
  region: 'US',
  language: 'en',
  mapId: 'skyfire-aerial-map', // Required for AdvancedMarkerElement
  loading: 'async', // Load asynchronously
};
