import React, { useEffect, useRef, useState } from 'react';
import styles from './MapPanel.module.css';

/**
 * StreetViewMap - Google Street View implementation
 * Displays interactive Street View panorama for the given coordinates
 */
const StreetViewMap = ({ lat, lng, address }) => {
  const streetViewRef = useRef(null);
  const panoramaRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!lat || !lng || !window.google) {
      return;
    }

    const position = { lat, lng };

    // Create Street View service to check availability
    const streetViewService = new window.google.maps.StreetViewService();

    // Check if Street View is available at this location
    streetViewService.getPanorama(
      {
        location: position,
        radius: 50, // Search within 50 meters
      },
      (data, status) => {
        if (status === 'OK') {
          // Street View available - create panorama
          const panorama = new window.google.maps.StreetViewPanorama(
            streetViewRef.current,
            {
              position: position,
              pov: {
                heading: 0,
                pitch: 0,
              },
              zoom: 1,
              addressControl: false,
              showRoadLabels: true,
              motionTracking: false,
              motionTrackingControl: false,
            }
          );

          panoramaRef.current = panorama;
          setError(null);
        } else {
          // Street View not available
          setError('Street View not available for this location');
        }
      }
    );

    // Cleanup
    return () => {
      if (panoramaRef.current) {
        // Google Maps doesn't have a destroy method for panorama
        panoramaRef.current = null;
      }
    };
  }, [lat, lng]);

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>📍</div>
        <h3 className={styles.errorHeading}>{error}</h3>
        <p className={styles.errorText}>
          Street View imagery is not available at this location. Try the Aerial View tab instead.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.mapContainer}>
      <div ref={streetViewRef} className={styles.map} />
    </div>
  );
};

export default StreetViewMap;
