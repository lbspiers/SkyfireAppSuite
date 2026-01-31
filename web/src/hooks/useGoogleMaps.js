import { useState, useEffect } from 'react';
import { GOOGLE_API_KEY, GOOGLE_MAPS_LIBRARIES, GOOGLE_MAPS_CONFIG } from '../config/google';

/**
 * Hook to load Google Maps JavaScript API
 * Prevents duplicate script loading and handles initialization
 */
const useGoogleMaps = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => setIsLoaded(true));
      existingScript.addEventListener('error', () => setLoadError(new Error('Failed to load Google Maps')));
      return;
    }

    // Create and load script
    const script = document.createElement('script');
    const libraries = GOOGLE_MAPS_LIBRARIES.join(',');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=${libraries}&v=${GOOGLE_MAPS_CONFIG.version}&region=${GOOGLE_MAPS_CONFIG.region}&language=${GOOGLE_MAPS_CONFIG.language}`;
    script.async = true;
    script.defer = true;

    script.addEventListener('load', () => {
      setIsLoaded(true);
    });

    script.addEventListener('error', () => {
      setLoadError(new Error('Failed to load Google Maps script'));
    });

    document.head.appendChild(script);

    return () => {
      // Cleanup if component unmounts before script loads
      if (!isLoaded) {
        script.removeEventListener('load', () => setIsLoaded(true));
        script.removeEventListener('error', () => setLoadError(new Error('Failed to load Google Maps')));
      }
    };
  }, []);

  return { isLoaded, loadError };
};

export default useGoogleMaps;
