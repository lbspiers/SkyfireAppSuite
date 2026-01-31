// src/types/streetViewAnalytics.ts

export interface StreetViewAnalyticsRequest {
  projectId: string;
  companyId: string;
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface GeocodeAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

export interface GeocodeGeometry {
  location: {
    lat: number;
    lng: number;
  };
  location_type: 'ROOFTOP' | 'RANGE_INTERPOLATED' | 'GEOMETRIC_CENTER' | 'APPROXIMATE';
  viewport: {
    northeast: { lat: number; lng: number };
    southwest: { lat: number; lng: number };
  };
  bounds?: {
    northeast: { lat: number; lng: number };
    southwest: { lat: number; lng: number };
  };
}

export interface GeocodeResult {
  address_components: GeocodeAddressComponent[];
  formatted_address: string;
  geometry: GeocodeGeometry;
  place_id: string;
  plus_code?: {
    compound_code: string;
    global_code: string;
  };
  types: string[];
}

export interface GeocodeResponse {
  results: GeocodeResult[];
  status: 'OK' | 'ZERO_RESULTS' | 'OVER_DAILY_LIMIT' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'INVALID_REQUEST' | 'UNKNOWN_ERROR';
  error_message?: string;
}

export interface StreetViewMetadata {
  status: 'OK' | 'ZERO_RESULTS' | 'NOT_FOUND' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'UNKNOWN_ERROR';
  pano_id?: string;
  location?: {
    lat: number;
    lng: number;
  };
  date?: string;
  copyright?: string;
  error_message?: string;
}

export interface StreetViewImageParams {
  location: string;
  size: string;
  heading: number;
  fov: number;
  pitch: number;
}

export interface S3UploadResult {
  bucket: string;
  key: string;
  url: string;
  signedUrl?: string;
}

export interface StreetViewAnalyticsData {
  // Project/Company linking
  project_id: string;
  company_id: string;
  installer_project_id?: string;

  // Address components
  street_number?: string;
  route?: string;
  locality?: string;
  administrative_area_level_1?: string;
  administrative_area_level_2?: string;
  postal_code?: string;
  country?: string;
  formatted_address: string;

  // Geocoding data
  house_latitude: number;
  house_longitude: number;
  location_type: string;
  bounds_ne_lat?: number;
  bounds_ne_lng?: number;
  bounds_sw_lat?: number;
  bounds_sw_lng?: number;
  viewport_ne_lat: number;
  viewport_ne_lng: number;
  viewport_sw_lat: number;
  viewport_sw_lng: number;
  place_id: string;
  plus_code_compound?: string;
  plus_code_global?: string;

  // Street View metadata
  pano_id?: string;
  streetview_date?: string;
  camera_latitude?: number;
  camera_longitude?: number;
  streetview_copyright?: string;
  streetview_available: boolean;

  // Image storage
  s3_image_url?: string;
  s3_bucket?: string;
  s3_key?: string;
  s3_signed_url?: string;

  // Analytics fields
  region?: string;
  market_type?: 'residential' | 'commercial' | 'mixed' | 'rural' | 'urban' | 'suburban';
  optimal_heading: number;
  street_orientation?: 'north-south' | 'east-west' | 'diagonal' | 'unknown';
  data_quality_score: number;

  // Performance metrics
  geocoding_response_time_ms?: number;
  streetview_response_time_ms?: number;
  image_upload_time_ms?: number;
  total_processing_time_ms?: number;

  // Raw API responses (for future analysis)
  geocoding_raw_response?: any;
  streetview_metadata_raw?: any;

  // Error tracking
  errors?: string[];
  warnings?: string[];

  // Timestamps
  created_at?: string;
  updated_at?: string;
}

export interface MarketSummary {
  total_projects: number;
  by_market_type: Record<string, number>;
  by_region: Record<string, number>;
  avg_data_quality_score: number;
  streetview_availability_rate: number;
  geocoding_accuracy_distribution: Record<string, number>;
}

export interface StreetViewCaptureProgress {
  stage: 'geocoding' | 'streetview_metadata' | 'image_generation' | 's3_upload' | 'database_save' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  startTime: number;
  errors?: string[];
  warnings?: string[];
}

// Updated interfaces to match actual backend response
export interface BackendGeocodingData {
  formattedAddress: string;
  location: {
    lat: number;
    lng: number;
  };
  locationType: string;
  bounds?: {
    northeast: { lat: number; lng: number };
    southwest: { lat: number; lng: number };
  };
  components: Record<string, string>;
  rawResponse?: any;
}

export interface BackendStreetViewData {
  status: string;
  pano_id?: string;
  date?: string;
  location?: {
    lat: number;
    lng: number;
  };
  copyright?: string;
}

export interface BackendAnalyticsData {
  optimalHeading: number;
  calculatedBearing: number;
  dataQualityScore: number;
  headingConfidence: string;
  streetViewAvailable: boolean;
}

export interface StreetViewAnalyticsResponse {
  success: boolean;
  data?: {
    geocoding: BackendGeocodingData;
    streetView: BackendStreetViewData;
    analytics: BackendAnalyticsData;
    message?: string;
  };
  error?: string;
  details?: string;
}

export interface StreetViewCaptureResult {
  success: boolean;
  data?: {
    geocoding: BackendGeocodingData;
    streetView: BackendStreetViewData;
    analytics: BackendAnalyticsData;
  };
  error?: string;
  warnings?: string[];
  processingTimeMs: number;
}

export interface BatchCaptureRequest {
  projects: Array<{
    projectId: string;
    companyId: string;
    address: string;
    city?: string;
    state?: string;
    zipCode?: string;
  }>;
  concurrency?: number;
  retryFailures?: boolean;
}

export interface BatchCaptureResult {
  totalProjects: number;
  successful: number;
  failed: number;
  results: Array<{
    projectId: string;
    success: boolean;
    data?: StreetViewAnalyticsData;
    error?: string;
  }>;
  totalProcessingTimeMs: number;
}

// Data quality scoring criteria
export enum DataQualityLevel {
  PERFECT = 10,    // ROOFTOP coordinates, Street View available, recent imagery
  EXCELLENT = 9,   // ROOFTOP coordinates, Street View available, good imagery
  GOOD = 8,        // ROOFTOP coordinates, Street View available, older imagery
  FAIR = 6,        // RANGE_INTERPOLATED coordinates, Street View available
  POOR = 4,        // RANGE_INTERPOLATED coordinates, no Street View
  MINIMAL = 2      // Geocoding only, significant limitations
}

// Regional classification
export interface RegionClassification {
  region: string;
  marketType: 'residential' | 'commercial' | 'mixed' | 'rural' | 'urban' | 'suburban';
  confidence: number; // 0-1
  indicators: string[];
}