// src/utils/geoCalculations.ts

import { GeocodeResult, RegionClassification } from '../types/streetViewAnalytics';

/**
 * Calculate bearing between two geographic points
 * @param lat1 Starting latitude
 * @param lng1 Starting longitude
 * @param lat2 Ending latitude
 * @param lng2 Ending longitude
 * @returns Bearing in degrees (0-360)
 */
export const calculateBearing = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);

  let bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360; // Normalize to 0-360
};

/**
 * Calculate distance between two geographic points using Haversine formula
 * @param lat1 Starting latitude
 * @param lng1 Starting longitude
 * @param lat2 Ending latitude
 * @param lng2 Ending longitude
 * @returns Distance in meters
 */
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371000; // Earth's radius in meters
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const deltaLatRad = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLngRad = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Determine street orientation based on viewport bounds
 * @param bounds Viewport or bounds from geocoding result
 * @returns Street orientation classification
 */
export const determineStreetOrientation = (bounds: {
  northeast: { lat: number; lng: number };
  southwest: { lat: number; lng: number };
}): 'north-south' | 'east-west' | 'diagonal' | 'unknown' => {
  const latRange = bounds.northeast.lat - bounds.southwest.lat;
  const lngRange = bounds.northeast.lng - bounds.southwest.lng;

  // If the ranges are very small, we can't determine orientation
  if (latRange < 0.0001 && lngRange < 0.0001) {
    return 'unknown';
  }

  const ratio = lngRange / latRange;

  // If longitude range is much larger, street runs east-west
  if (ratio > 2) return 'east-west';

  // If latitude range is much larger, street runs north-south
  if (ratio < 0.5) return 'north-south';

  // Otherwise it's diagonal
  return 'diagonal';
};

/**
 * Calculate optimal Street View heading based on camera and house positions
 * @param cameraLat Street View camera latitude
 * @param cameraLng Street View camera longitude
 * @param houseLat House latitude
 * @param houseLng House longitude
 * @returns Optimal heading in degrees (0-360)
 */
export const calculateOptimalHeading = (
  cameraLat: number,
  cameraLng: number,
  houseLat: number,
  houseLng: number
): number => {
  return calculateBearing(cameraLat, cameraLng, houseLat, houseLng);
};

/**
 * Extract address components from geocoding result
 * @param result Geocoding result from Google Maps API
 * @returns Structured address components
 */
export const extractAddressComponents = (result: GeocodeResult) => {
  const components: Record<string, string> = {};

  result.address_components.forEach(component => {
    component.types.forEach(type => {
      components[type] = component.long_name;
    });
  });

  return {
    street_number: components.street_number || '',
    route: components.route || '',
    locality: components.locality || '',
    administrative_area_level_1: components.administrative_area_level_1 || '',
    administrative_area_level_2: components.administrative_area_level_2 || '',
    postal_code: components.postal_code || '',
    country: components.country || '',
  };
};

/**
 * Classify region and market type based on address components and geocoding data
 * @param geocodeResult Geocoding result
 * @returns Region classification
 */
export const classifyRegion = (geocodeResult: GeocodeResult): RegionClassification => {
  const components = extractAddressComponents(geocodeResult);
  const state = components.administrative_area_level_1;
  const locality = components.locality;
  const county = components.administrative_area_level_2;

  // Extract indicators from address types and components
  const indicators: string[] = [];
  const types = geocodeResult.types;

  // Determine market type based on various factors
  let marketType: 'residential' | 'commercial' | 'mixed' | 'rural' | 'urban' | 'suburban' = 'residential';
  let confidence = 0.7; // Default confidence

  // Check for commercial indicators
  if (types.includes('establishment') || types.includes('point_of_interest')) {
    marketType = 'commercial';
    confidence = 0.8;
    indicators.push('commercial_establishment');
  }

  // Check for rural indicators
  if (geocodeResult.geometry.location_type === 'RANGE_INTERPOLATED' &&
      !locality && county) {
    marketType = 'rural';
    confidence = 0.7;
    indicators.push('interpolated_address', 'no_locality');
  }

  // Urban/suburban classification based on precision and density
  if (geocodeResult.geometry.location_type === 'ROOFTOP') {
    if (locality && locality.toLowerCase().includes('city')) {
      marketType = 'urban';
      indicators.push('city_locality', 'rooftop_precision');
    } else {
      marketType = 'suburban';
      indicators.push('suburban_area', 'rooftop_precision');
    }
    confidence = 0.8;
  }

  // Regional classification
  let region = 'unknown';
  if (state) {
    // Major solar markets
    const solarStates = ['CA', 'TX', 'FL', 'AZ', 'NV', 'NJ', 'NY', 'MA', 'HI'];
    if (solarStates.includes(state)) {
      region = `${state}_solar_market`;
      indicators.push('major_solar_market');
      confidence = Math.min(confidence + 0.1, 1.0);
    } else {
      region = `${state}_emerging_market`;
      indicators.push('emerging_solar_market');
    }
  }

  return {
    region,
    marketType,
    confidence,
    indicators
  };
};

/**
 * Calculate data quality score based on available information
 * @param geocodeResult Geocoding result
 * @param streetViewAvailable Whether Street View is available
 * @param streetViewDate Date of Street View imagery (if available)
 * @returns Data quality score (1-10)
 */
export const calculateDataQualityScore = (
  geocodeResult: GeocodeResult,
  streetViewAvailable: boolean,
  streetViewDate?: string
): number => {
  let score = 0;

  // Base score from geocoding accuracy
  switch (geocodeResult.geometry.location_type) {
    case 'ROOFTOP':
      score += 5;
      break;
    case 'RANGE_INTERPOLATED':
      score += 3;
      break;
    case 'GEOMETRIC_CENTER':
      score += 2;
      break;
    case 'APPROXIMATE':
      score += 1;
      break;
  }

  // Street View availability bonus
  if (streetViewAvailable) {
    score += 3;

    // Recent imagery bonus
    if (streetViewDate) {
      const imageDate = new Date(streetViewDate);
      const now = new Date();
      const yearsDiff = (now.getTime() - imageDate.getTime()) / (1000 * 60 * 60 * 24 * 365);

      if (yearsDiff < 1) {
        score += 2; // Very recent
      } else if (yearsDiff < 3) {
        score += 1; // Recent
      }
      // No bonus for older imagery
    }
  }

  // Address completeness bonus
  const components = extractAddressComponents(geocodeResult);
  const completeness = Object.values(components).filter(v => v.length > 0).length;
  if (completeness >= 6) {
    score += 1;
  }

  return Math.min(score, 10);
};

/**
 * Generate Street View image URL with optimal parameters
 * @param address Address string
 * @param heading Optimal heading in degrees
 * @param apiKey Google Maps API key
 * @param size Image size (default: '600x400')
 * @param fov Field of view (default: 90)
 * @param pitch Pitch angle (default: 0)
 * @returns Street View Static API URL
 */
export const generateStreetViewImageUrl = (
  address: string,
  heading: number,
  apiKey: string,
  size: string = '600x400',
  fov: number = 90,
  pitch: number = 0
): string => {
  const location = encodeURIComponent(address);

  return (
    `https://maps.googleapis.com/maps/api/streetview` +
    `?location=${location}` +
    `&size=${size}` +
    `&heading=${Math.round(heading)}` +
    `&fov=${fov}` +
    `&pitch=${pitch}` +
    `&key=${apiKey}`
  );
};

/**
 * Generate S3 key for Street View image storage
 * @param companyId Company ID
 * @param projectId Project ID
 * @param timestamp Timestamp (optional, defaults to current time)
 * @returns S3 key string
 */
export const generateS3Key = (
  companyId: string,
  projectId: string,
  timestamp?: number
): string => {
  const ts = timestamp || Date.now();
  const date = new Date(ts);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');

  return `streetview/${companyId}/${year}/${month}/${projectId}_${ts}.jpg`;
};

/**
 * Validate coordinates are within reasonable bounds
 * @param lat Latitude
 * @param lng Longitude
 * @returns True if coordinates are valid
 */
export const validateCoordinates = (lat: number, lng: number): boolean => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

/**
 * Calculate processing time metrics
 * @param startTime Start timestamp in milliseconds
 * @returns Processing time in milliseconds
 */
export const calculateProcessingTime = (startTime: number): number => {
  return Date.now() - startTime;
};