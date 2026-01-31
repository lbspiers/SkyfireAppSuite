// src/components/Modals/MapScreen.tsx

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  StatusBar,
  Platform,
  Dimensions,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  Region,
  LatLng,
} from "react-native-maps";
import axios from "axios";

const { width, height } = Dimensions.get("window");

// Cross-platform API key - works for both iOS production and Android
const API_KEY = "AIzaSyBTIEUeUnP1QWoLBzmdWE1x0R_N4UlN4dQ";

type MapType = "satellite" | "hybrid" | "standard";

interface MapScreenProps {
  address: string;
  city: string;
  state: string;
  latitude?: number;
  longitude?: number;
  onClose: () => void;
}

interface MapTypeInfo {
  name: string;
  icon: string;
  value: MapType;
}

interface GeocodeResponse {
  data: {
    results: Array<{
      geometry: {
        location: {
          lat: number;
          lng: number;
        };
      };
      formatted_address: string;
    }>;
    status: string;
    error_message?: string;
  };
  status: number;
  headers: any;
}

const MapScreen: React.FC<MapScreenProps> = ({
  address,
  city,
  state,
  latitude,
  longitude,
  onClose,
}) => {
  const [coordinates, setCoordinates] = useState<LatLng | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [mapType, setMapType] = useState<MapType>("satellite");
  const [region, setRegion] = useState<Region | null>(null);
  const [mapReady, setMapReady] = useState<boolean>(false);
  const [showCallout, setShowCallout] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [mapInitError, setMapInitError] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(16); // Track zoom level for display
  const [markerPosition, setMarkerPosition] = useState<{x: number, y: number} | null>(null);
  const mapRef = useRef<MapView>(null);

  const hasAddress = Boolean(address?.trim() || city?.trim() || state?.trim());
  const hasCoordinates = Boolean(latitude && longitude);

  // Cross-platform API key with fallback - ensures both iOS and Android work
  const apiKey = API_KEY || "AIzaSyBTIEUeUnP1QWoLBzmdWE1x0R_N4UlN4dQ";

  const mapTypeOptions: MapTypeInfo[] = [
    { name: "Satellite", icon: "🛰️", value: "satellite" },
    { name: "Hybrid", icon: "🌍", value: "hybrid" },
    { name: "Map", icon: "🗺️", value: "standard" },
  ];

  // Get formatted address for display
  const getFormattedAddress = useCallback((): string => {
    return [address, city, state].filter(Boolean).join(", ");
  }, [address, city, state]);

  // Geocoding function
  const fetchCoordinates = useCallback(async (): Promise<void> => {
    if (!hasAddress) {
      setError("No address provided");
      setLoading(false);
      return;
    }

    if (!apiKey) {
      setError("Google Maps API key not configured");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fullAddress = [address, city, state].filter(Boolean).join(", ");
      console.log(`[MapScreen] Geocoding address: ${fullAddress}`);
      console.log(`[MapScreen] Using API key: ${apiKey.substring(0, 10)}...`);

      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        fullAddress
      )}&key=${apiKey}`;

      const response: GeocodeResponse = await axios.get(geocodeUrl, {
        timeout: 15000,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      console.log(`[MapScreen] Response status:`, response.status);
      console.log(`[MapScreen] Response data status:`, response.data?.status);

      // Check for API errors
      if (response.data.status && response.data.status !== "OK") {
        console.error(`[MapScreen] Geocoding API error:`, response.data.status);

        switch (response.data.status) {
          case "ZERO_RESULTS":
            setError(
              "Address not found. Please verify the address is correct."
            );
            break;
          case "OVER_QUERY_LIMIT":
            setError("Too many requests. Please try again later.");
            break;
          case "REQUEST_DENIED":
            setError(
              "Geocoding access denied. Check API key or enable billing."
            );
            break;
          case "INVALID_REQUEST":
            setError("Invalid address format. Please check the address.");
            break;
          default:
            setError(`Geocoding error: ${response.data.status}`);
        }
        return;
      }

      if (response.data.results?.length > 0) {
        const result = response.data.results[0];
        const location = result.geometry.location;

        const newCoordinates: LatLng = {
          latitude: location.lat,
          longitude: location.lng,
        };

        setCoordinates(newCoordinates);

        const newRegion: Region = {
          latitude: location.lat,
          longitude: location.lng,
          latitudeDelta: 0.002, // Closer zoom - property level detail
          longitudeDelta: 0.002,
        };

        setRegion(newRegion);
        console.log(
          `[MapScreen] ✅ Successfully geocoded to: ${location.lat}, ${location.lng}`
        );
      } else {
        setError("Address not found. Please verify the address is correct.");
      }
    } catch (error: any) {
      console.error("[MapScreen] Geocoding error:", error);

      if (error.code === "ECONNABORTED") {
        setError("Request timeout. Please check your internet connection.");
      } else if (error.response?.status === 403) {
        setError("Maps API access denied. Please check API key permissions.");
      } else if (error.response?.data?.error_message) {
        setError(`API Error: ${error.response.data.error_message}`);
      } else if (!error.response) {
        setError("Network error. Please check your internet connection.");
      } else {
        setError(
          `Failed to geocode address: ${error.message || "Unknown error"}`
        );
      }
    } finally {
      setLoading(false);
    }
  }, [address, city, state, hasAddress, apiKey]);

  // Initialize coordinates - use provided coordinates or geocode
  useEffect(() => {
    if (hasCoordinates) {
      // Use provided coordinates directly
      console.log(
        `[MapScreen] Using provided coordinates: ${latitude}, ${longitude}`
      );

      const directCoordinates: LatLng = {
        latitude: latitude!,
        longitude: longitude!,
      };

      setCoordinates(directCoordinates);

      const directRegion: Region = {
        latitude: latitude!,
        longitude: longitude!,
        latitudeDelta: 0.002, // Closer zoom - property level detail
        longitudeDelta: 0.002,
      };

      setRegion(directRegion);
      setLoading(false);
    } else {
      // Geocode the address
      console.log("[MapScreen] No coordinates provided, geocoding address");
      fetchCoordinates();
    }
  }, [hasCoordinates, latitude, longitude, fetchCoordinates]);

  // Map type cycling
  const cycleMapType = useCallback((): void => {
    const currentIndex = mapTypeOptions.findIndex(
      (option) => option.value === mapType
    );
    const nextIndex = (currentIndex + 1) % mapTypeOptions.length;
    setMapType(mapTypeOptions[nextIndex].value);
  }, [mapType, mapTypeOptions]);

  // Get current map type info
  const getCurrentMapTypeInfo = useCallback((): MapTypeInfo => {
    return (
      mapTypeOptions.find((option) => option.value === mapType) ||
      mapTypeOptions[0]
    );
  }, [mapType, mapTypeOptions]);

  // Center on property with smooth animation
  const centerOnProperty = useCallback((): void => {
    if (mapRef.current && coordinates) {
      mapRef.current.animateToRegion(
        {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          latitudeDelta: 0.002, // Zoom close to property when centering
          longitudeDelta: 0.002,
        },
        1000
      );
    }
  }, [coordinates]);

  // Handle map ready - works for both iOS and Android
  const handleMapReady = useCallback((): void => {
    setMapReady(true);
    setMapInitError(false);
    console.log("[MapScreen] Map is ready");

    // Initialize custom marker position
    if (coordinates && mapRef.current) {
      setTimeout(() => {
        mapRef.current?.pointForCoordinate(coordinates).then((point) => {
          setMarkerPosition(point);
        }).catch(() => {
          // Silently handle errors
        });
      }, 500); // Small delay to ensure map is fully rendered
    }

    // Auto-show callout after map loads
    setTimeout(() => {
      setShowCallout(true);
    }, 1500);
  }, [coordinates]);

  // Handle map load error - cross-platform error detection
  const handleMapError = useCallback((error: any): void => {
    console.error("[MapScreen] Map failed to load:", error);
    setMapInitError(true);
    setMapReady(false);
  }, []);

  // Handle marker press
  const handleMarkerPress = useCallback((): void => {
    setShowCallout(true);
  }, []);

  // Handle map press (hide callout)
  const handleMapPress = useCallback((): void => {
    setShowCallout(false);
  }, []);

  // Calculate zoom level from region for display
  const calculateZoomLevel = useCallback((delta: number): number => {
    return Math.round(Math.log2(360 / delta));
  }, []);

  // Handle region change complete
  const handleRegionChangeComplete = useCallback(
    (newRegion: Region): void => {
      // Only update if significantly different to avoid performance issues
      if (
        !region ||
        Math.abs(newRegion.latitude - region.latitude) > 0.001 ||
        Math.abs(newRegion.longitude - region.longitude) > 0.001
      ) {
        setRegion(newRegion);
        // Update zoom level display
        const newZoomLevel = calculateZoomLevel(newRegion.latitudeDelta);
        setZoomLevel(newZoomLevel);

        // Update custom marker position when map region changes
        if (coordinates && mapRef.current) {
          mapRef.current.pointForCoordinate(coordinates).then((point) => {
            setMarkerPosition(point);
          }).catch(() => {
            // Silently handle errors - marker just won't show
          });
        }
      }
    },
    [region, calculateZoomLevel, coordinates]
  );

  // Zoom control functions
  const zoomIn = useCallback((): void => {
    if (mapRef.current && region) {
      const newDelta = Math.max(region.latitudeDelta * 0.5, 0.001); // Prevent over-zooming
      mapRef.current.animateToRegion(
        {
          ...region,
          latitudeDelta: newDelta,
          longitudeDelta: newDelta,
        },
        500
      );
    }
  }, [region]);

  const zoomOut = useCallback((): void => {
    if (mapRef.current && region) {
      const newDelta = Math.min(region.latitudeDelta * 2, 0.5); // Prevent over-zooming out
      mapRef.current.animateToRegion(
        {
          ...region,
          latitudeDelta: newDelta,
          longitudeDelta: newDelta,
        },
        500
      );
    }
  }, [region]);

  // Retry function for error states
  const handleRetry = useCallback((): void => {
    fetchCoordinates();
  }, [fetchCoordinates]);

  // Error state with retry option
  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />
        <LinearGradient
          colors={["#2E4161", "#0C1F3F"]}
          style={styles.errorContainer}
        >
          <View style={styles.errorContent}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Unable to Load Map</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.errorAddress}>
              Address: {getFormattedAddress()}
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetry}
              accessible={true}
              accessibilityLabel="Retry loading map"
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.errorCloseButton}
            onPress={onClose}
            accessible={true}
            accessibilityLabel="Close map"
          >
            <LinearGradient
              colors={["#FD7332", "#EF3826"]}
              style={styles.closeButtonGradient}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  // No address/coordinates available state
  if (!hasAddress && !hasCoordinates) {
    return (
      <View style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />
        <LinearGradient
          colors={["#2E4161", "#0C1F3F"]}
          style={styles.errorContainer}
        >
          <View style={styles.errorContent}>
            <Text style={styles.errorIcon}>📍</Text>
            <Text style={styles.errorTitle}>No Address</Text>
            <Text style={styles.errorText}>
              Please provide an address to view the property location.
            </Text>
          </View>
          <TouchableOpacity style={styles.errorCloseButton} onPress={onClose}>
            <LinearGradient
              colors={["#FD7332", "#EF3826"]}
              style={styles.closeButtonGradient}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  const currentMapInfo = getCurrentMapTypeInfo();

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Full Screen Interactive Map */}
      {coordinates && region ? (
        <MapView
          ref={mapRef}
          provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
          style={styles.fullScreenMap}
          mapType={mapType}
          region={region}
          onMapReady={handleMapReady}
          onError={handleMapError}
          onPress={handleMapPress}
          onRegionChangeComplete={handleRegionChangeComplete}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={true}
          showsScale={Platform.OS === "ios"}
          showsBuildings={true}
          showsTraffic={false}
          showsIndoors={true}
          rotateEnabled={true}
          scrollEnabled={true}
          zoomEnabled={true}
          pitchEnabled={true}
          toolbarEnabled={false}
          // Cross-platform performance optimizations
          cacheEnabled={true}
          loadingEnabled={true}
          loadingIndicatorColor="#FF6B6B"
          loadingBackgroundColor="#1a1a1a"
          moveOnMarkerPress={false}
          // Enhanced map padding for controls
          mapPadding={{
            top: Platform.OS === "ios" ? 120 : 100,
            right: 20,
            bottom: 140,
            left: 20,
          }}
        >
          {/* Remove native Marker to avoid getNativeComponent error */}
        </MapView>
      ) : (
        // Enhanced Loading State
        <LinearGradient
          colors={["#2E4161", "#0C1F3F"]}
          style={styles.loadingContainer}
        >
          <View style={styles.loadingContent}>
            <View style={styles.loadingSpinner}>
              <ActivityIndicator size="large" color="#FF6B6B" />
            </View>
            <Text style={styles.loadingText}>Loading Property Location</Text>
            <Text style={styles.loadingSubtext}>{getFormattedAddress()}</Text>
          </View>
        </LinearGradient>
      )}

      {/* Floating Control Panel - Top */}
      <SafeAreaView style={styles.topControlsContainer}>
        <View style={styles.topControls}>
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessible={true}
            accessibilityLabel="Close map"
          >
            <LinearGradient
              colors={["rgba(0,0,0,0.8)", "rgba(0,0,0,0.6)"]}
              style={styles.controlButtonGradient}
            >
              <Text style={styles.closeButtonIcon}>✕</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Map Type Selector */}
          <TouchableOpacity
            style={styles.mapTypeSelector}
            onPress={cycleMapType}
            accessible={true}
            accessibilityLabel={`Change map type. Current: ${currentMapInfo.name}`}
          >
            <LinearGradient
              colors={["rgba(46,65,97,0.9)", "rgba(12,31,63,0.8)"]}
              style={styles.mapTypeSelectorGradient}
            >
              <Text style={styles.mapTypeIcon}>{currentMapInfo.icon}</Text>
              <Text style={styles.mapTypeText}>{currentMapInfo.name}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Zoom Level Indicator - Simple reference */}
      <View style={styles.zoomLevelIndicator}>
        <LinearGradient
          colors={["rgba(0,0,0,0.8)", "rgba(0,0,0,0.6)"]}
          style={styles.zoomLevelGradient}
        >
          <Text style={styles.zoomLevelText}>Zoom: {zoomLevel}</Text>
        </LinearGradient>
      </View>

      {/* Floating Control Panel - Bottom */}
      <View style={styles.bottomControls}>
        <LinearGradient
          colors={["rgba(46,65,97,0.95)", "rgba(12,31,63,0.9)"]}
          style={styles.controlsContainer}
        >
          {/* Property Info Row */}
          <View style={styles.propertyInfoRow}>
            <View style={styles.propertyInfo}>
              <Text style={styles.propertyTitle}>📍 Property Location</Text>
              <Text style={styles.propertyAddress} numberOfLines={1}>
                {getFormattedAddress()}
              </Text>
              {coordinates && (
                <Text style={styles.coordinatesText}>
                  {coordinates.latitude.toFixed(4)},{" "}
                  {coordinates.longitude.toFixed(4)}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.centerButton}
              onPress={centerOnProperty}
              accessible={true}
              accessibilityLabel="Center map on property"
            >
              <View style={styles.centerButtonInner}>
                <Text style={styles.centerIcon}>🎯</Text>
                <Text style={styles.centerText}>Center</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Close Button */}
          <TouchableOpacity
            style={styles.bottomCloseButton}
            onPress={onClose}
            accessible={true}
            accessibilityLabel="Close map and return"
          >
            <LinearGradient
              colors={["#FD7332", "#EF3826"]}
              style={styles.closeButtonGradient}
            >
              <Text style={styles.closeButtonText}>Close Map</Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* Map Ready Indicator */}
      {mapReady && coordinates && (
        <View style={styles.readyIndicator}>
          <Text style={styles.readyText}>Interactive Map Ready</Text>
        </View>
      )}

      {/* Custom Marker Overlay - positioned over map coordinates */}
      {markerPosition && coordinates && (
        <View
          style={[
            styles.customMarkerOverlay,
            {
              left: markerPosition.x - 6, // Center the 12px pin
              top: markerPosition.y - 20,  // Position pin point at coordinate
            },
          ]}
          pointerEvents="none"
        >
          <View style={styles.pinContainer}>
            {/* Small pin point */}
            <View style={styles.pinHead} />
            <View style={styles.pinStem} />
          </View>
        </View>
      )}

      {/* Cross-platform map initialization error */}
      {mapInitError && (
        <View style={styles.mapErrorOverlay}>
          <View style={styles.mapErrorContent}>
            <Text style={styles.mapErrorIcon}>⚠️</Text>
            <Text style={styles.mapErrorTitle}>Map Loading Failed</Text>
            <Text style={styles.mapErrorText}>
              Unable to initialize map. This may be due to API key configuration or network issues.
            </Text>
            <TouchableOpacity
              style={styles.mapErrorRetry}
              onPress={() => {
                setMapInitError(false);
                setMapReady(false);
              }}
            >
              <Text style={styles.mapErrorRetryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0C1F3F",
  },
  fullScreenMap: {
    ...StyleSheet.absoluteFillObject,
  },

  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContent: {
    alignItems: "center",
    paddingHorizontal: 40,
  },
  loadingSpinner: {
    marginBottom: 20,
  },
  loadingText: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  loadingSubtext: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },

  // Error States
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  errorContent: {
    alignItems: "center",
    marginBottom: 40,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  errorTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  errorText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 22,
  },
  errorAddress: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    fontStyle: "italic",
  },
  retryButton: {
    backgroundColor: "rgba(255,107,107,0.3)",
    borderWidth: 2,
    borderColor: "#FF6B6B",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: "#FF6B6B",
    fontSize: 16,
    fontWeight: "700",
  },
  errorCloseButton: {
    width: "100%",
    maxWidth: 300,
  },

  // Custom Pin Marker (small and precise)
  customMarkerOverlay: {
    position: "absolute",
    zIndex: 100,
    pointerEvents: "none",
  },
  pinContainer: {
    alignItems: "center",
    justifyContent: "flex-start",
  },
  pinHead: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FF6B6B",
    borderWidth: 2,
    borderColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 6,
  },
  pinStem: {
    width: 2,
    height: 8,
    backgroundColor: "#FF6B6B",
    marginTop: -1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 1,
    elevation: 3,
  },

  // Premium Callout
  callout: {
    width: 280,
  },
  calloutContainer: {
    alignItems: "center",
  },
  calloutContent: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  calloutGradient: {
    padding: 20,
    minWidth: 260,
  },
  calloutTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    textAlign: "center",
    marginBottom: 8,
  },
  calloutDivider: {
    height: 2,
    backgroundColor: "#e9ecef",
    marginBottom: 12,
  },
  calloutAddress: {
    fontSize: 16,
    color: "#495057",
    textAlign: "center",
    fontWeight: "600",
    marginBottom: 4,
  },
  calloutCity: {
    fontSize: 14,
    color: "#6c757d",
    textAlign: "center",
    marginBottom: 12,
  },
  calloutCoords: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  calloutCoordsText: {
    fontSize: 12,
    color: "#6c757d",
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  calloutActions: {
    alignItems: "center",
  },
  calloutButton: {
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  calloutButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  calloutArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderTopWidth: 12,
    borderStyle: "solid",
    backgroundColor: "transparent",
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#f8f9fa",
    marginTop: -1,
  },

  // Top Controls
  topControlsContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 8 : 16,
  },
  closeButton: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  controlButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonIcon: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  mapTypeSelector: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  mapTypeSelectorGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
  },
  mapTypeIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  mapTypeText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },

  // Bottom Controls
  bottomControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
  controlsContainer: {
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  propertyInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  propertyInfo: {
    flex: 1,
    marginRight: 16,
  },
  propertyTitle: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  propertyAddress: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  coordinatesText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  centerButton: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    padding: 12,
  },
  centerButtonInner: {
    alignItems: "center",
  },
  centerIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  centerText: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
  },
  bottomCloseButton: {
    marginTop: 8,
  },
  closeButtonGradient: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },

  // Ready Indicator
  readyIndicator: {
    position: "absolute",
    top: Platform.OS === "ios" ? 70 : 80,
    alignSelf: "center",
    backgroundColor: "rgba(34, 197, 94, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 5,
  },
  readyText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },

  // Cross-platform map error overlay
  mapErrorOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  mapErrorContent: {
    backgroundColor: "#1A2940",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: "#2E4161",
  },
  mapErrorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  mapErrorTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  mapErrorText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  mapErrorRetry: {
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  mapErrorRetryText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },

  // Zoom Level Indicator
  zoomLevelIndicator: {
    position: "absolute",
    top: Platform.OS === "ios" ? 120 : 130,
    right: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 5,
  },
  zoomLevelGradient: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  zoomLevelText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
});

export default MapScreen;
