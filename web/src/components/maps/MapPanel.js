import React, { useState, useEffect } from 'react';
import StreetViewMap from './StreetViewMap';
import AerialViewMap from './AerialViewMap';
import AzimuthFinder from './AzimuthFinder';
import useGoogleMaps from '../../hooks/useGoogleMaps';
import LoadingSpinner from '../ui/LoadingSpinner';
import styles from './MapPanel.module.css';

// Icon components
const CompassIcon = ({ className }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88" fill="currentColor" />
  </svg>
);

/**
 * MapPanel - Google Maps integration with Street View, Aerial View, and Azimuth Finder
 * Uses subtab navigation pattern like Equipment form
 */
const MapPanel = ({
  address,
  city,
  state,
  zip,
  lat,
  lng,
  projectUuid,
  azimuthMeasurements,
  onAzimuthChange,
}) => {
  const { isLoaded, loadError } = useGoogleMaps();
  const [coordinates, setCoordinates] = useState({ lat, lng });
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState(null);
  const [activeView, setActiveView] = useState('street');

  const viewTabs = [
    { key: 'street', label: 'Street View' },
    { key: 'aerial', label: 'Aerial View' },
    { key: 'azimuth', label: 'Azimuth Finder', icon: CompassIcon },
  ];

  // Geocode address if coordinates not provided
  useEffect(() => {
    if ((lat && lng) || !address || !isLoaded) {
      return;
    }

    setGeocoding(true);
    setGeocodeError(null);

    const fullAddress = [address, city, state, zip].filter(Boolean).join(', ');
    const geocoder = new window.google.maps.Geocoder();

    geocoder.geocode({ address: fullAddress }, (results, status) => {
      setGeocoding(false);

      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location;
        setCoordinates({
          lat: location.lat(),
          lng: location.lng(),
        });
      } else {
        setGeocodeError('Unable to locate address on map');
      }
    });
  }, [address, city, state, zip, lat, lng, isLoaded]);

  // No address provided
  if (!address) {
    return (
      <div className={styles.messageContainer}>
        <div className={styles.messageIcon}>📍</div>
        <h3 className={styles.messageHeading}>No Address Available</h3>
        <p className={styles.messageText}>
          No address data is available for this project. Please add an address in the Project Information section.
        </p>
      </div>
    );
  }

  // Loading Google Maps script
  if (!isLoaded) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner />
        <p className={styles.loadingText}>Loading Google Maps...</p>
      </div>
    );
  }

  // Google Maps script load error
  if (loadError) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>⚠️</div>
        <h3 className={styles.errorHeading}>Failed to Load Maps</h3>
        <p className={styles.errorText}>
          Unable to load Google Maps. Please check your internet connection and try again.
        </p>
      </div>
    );
  }

  // Geocoding in progress
  if (geocoding) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner />
        <p className={styles.loadingText}>Locating address...</p>
      </div>
    );
  }

  // Geocoding failed
  if (geocodeError) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>📍</div>
        <h3 className={styles.errorHeading}>Location Not Found</h3>
        <p className={styles.errorText}>
          {geocodeError}. Please verify the address in the Project Information section.
        </p>
        <p className={styles.addressDisplay}>
          {[address, city, state, zip].filter(Boolean).join(', ')}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Subtab Navigation */}
      <div className={styles.subtabContainer}>
        {viewTabs.map((view, index) => (
          <button
            key={view.key}
            type="button"
            onClick={() => setActiveView(view.key)}
            className={`${styles.subtabLink} ${activeView === view.key ? styles.subtabLinkActive : ''} ${index === 0 ? styles.subtabLinkFirst : ''}`}
          >
            {view.icon && <view.icon className={styles.subtabIcon} />}
            {view.label}
            {activeView === view.key && (
              <span className={`${styles.subtabIndicator} ${index === 0 ? styles.subtabIndicatorFirst : styles.subtabIndicatorCenter}`} />
            )}
          </button>
        ))}
      </div>

      {/* Map Content */}
      <div className={styles.mapContent}>
        {activeView === 'street' && (
          <StreetViewMap
            lat={coordinates.lat}
            lng={coordinates.lng}
            address={address}
          />
        )}
        {activeView === 'aerial' && (
          <AerialViewMap
            lat={coordinates.lat}
            lng={coordinates.lng}
            address={address}
          />
        )}
        {activeView === 'azimuth' && (
          <AzimuthFinder
            lat={coordinates.lat}
            lng={coordinates.lng}
            address={[address, city, state, zip].filter(Boolean).join(', ')}
            projectUuid={projectUuid}
            initialMeasurements={azimuthMeasurements}
            onMeasurementsChange={onAzimuthChange}
          />
        )}
      </div>
    </div>
  );
};

export default MapPanel;
