import React, { useEffect, useRef, useState } from 'react';
import { GOOGLE_MAPS_CONFIG } from '../../config/google';
import styles from './MapPanel.module.css';

/**
 * AerialViewMap - Google Maps Satellite/Hybrid view
 * High-quality aerial imagery with optional 45° tilt
 */
const AerialViewMap = ({ lat, lng, address }) => {
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const markerRef = useRef(null);
  const [viewMode, setViewMode] = useState('hybrid'); // 'hybrid' or 'satellite'
  const initialPosition = useRef({ lat, lng });

  useEffect(() => {
    if (!lat || !lng || !window.google) {
      return;
    }

    const position = { lat, lng };
    initialPosition.current = position;

    // Create map with Map ID (required for AdvancedMarkerElement)
    const map = new window.google.maps.Map(mapRef.current, {
      center: position,
      zoom: 20,
      mapTypeId: viewMode,
      mapId: GOOGLE_MAPS_CONFIG.mapId, // Required for AdvancedMarkerElement
      tilt: 45, // Enable 45° imagery where available
      heading: 0,
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: window.google.maps.ControlPosition.TOP_RIGHT,
        mapTypeIds: ['satellite', 'hybrid', 'terrain'],
      },
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      scaleControl: true,
      rotateControl: true,
    });

    // Add marker at property location using AdvancedMarkerElement
    const marker = new window.google.maps.marker.AdvancedMarkerElement({
      position: position,
      map: map,
      title: address || 'Project Location',
    });

    googleMapRef.current = map;
    markerRef.current = marker;

    // Update map type when viewMode changes
    map.setMapTypeId(viewMode);

    // Cleanup
    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
      googleMapRef.current = null;
    };
  }, [lat, lng, viewMode, address]);

  const handleCenterOnProperty = () => {
    if (googleMapRef.current && initialPosition.current) {
      googleMapRef.current.panTo(initialPosition.current);
      googleMapRef.current.setZoom(20);
    }
  };

  const handleToggleView = () => {
    setViewMode(prev => prev === 'hybrid' ? 'satellite' : 'hybrid');
  };

  return (
    <div className={styles.mapContainer}>
      <div ref={mapRef} className={styles.map} />

      <div className={styles.mapControls}>
        <button
          type="button"
          onClick={handleCenterOnProperty}
          className={styles.controlButton}
          title="Center on property"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span>Center</span>
        </button>

        <button
          type="button"
          onClick={handleToggleView}
          className={styles.controlButton}
          title={`Switch to ${viewMode === 'hybrid' ? 'satellite' : 'hybrid'} view`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          </svg>
          <span>{viewMode === 'hybrid' ? 'Satellite' : 'Hybrid'}</span>
        </button>
      </div>
    </div>
  );
};

export default AerialViewMap;
