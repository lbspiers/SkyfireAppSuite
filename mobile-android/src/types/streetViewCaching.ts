// src/types/streetViewCaching.ts

export interface AddressComponents {
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface CacheMetadata {
  exists: boolean;
  lastUpdated: string; // ISO date string
  dataHash: string;
  addressComponents: AddressComponents;
  qualityScore: number;
  streetViewAvailable: boolean;
  streetViewDate?: string; // e.g., "2025-02"
  geocodingAccuracy?: string; // "ROOFTOP", "RANGE_INTERPOLATED", etc.
}

export interface CacheStatus {
  exists: boolean;
  isFresh: boolean;
  lastUpdated: Date;
  addressChanged: boolean;
  recommendRefresh: boolean;
  reason?: 'address_changed' | 'data_stale' | 'imagery_updated' | 'first_capture' | 'low_quality' | 'force_refresh';
  daysSinceUpdate?: number;
  cachedData?: CacheMetadata;
}

export interface ConditionalCaptureRequest {
  projectId: string;
  companyId: string;
  address: string;
  forceRefresh?: boolean;
  currentAddressComponents: AddressComponents;
}

// Backend cache check response (matches backend specification)
export interface CacheCheckResponse {
  exists: boolean;
  lastUpdated?: string;
  addressHash?: string;
  dataQualityScore?: number;
  shouldRefresh: boolean;
  reason?: "address_changed" | "data_stale" | "first_capture" | "manual_refresh" | "error_fallback";
  streetViewAvailable?: boolean;
  optimalHeading?: number;
  errorDetails?: {
    message: string;
    code?: string;
    details?: any;
  };
}

export interface ConditionalCaptureResponse {
  success: boolean;
  cached: boolean; // Indicates if data was from cache or fresh API call
  dataAge: string; // ISO date string
  source: 'fresh_api' | 'cached' | 'updated';
  data?: {
    geocoding: any;
    streetView: any;
    analytics: any;
  };
  cacheStatus?: CacheStatus;
  error?: string;
  details?: string;
  message?: string;
}

export interface DataFreshnessIndicator {
  status: 'fresh' | 'stale' | 'missing' | 'checking';
  lastUpdated?: Date;
  streetViewDate?: string; // "2025-02"
  dataQuality?: number; // 1-10 score
  addressChanged?: boolean;
  recommendsRefresh?: boolean;
  message?: string;
}

export interface SmartCachingConfig {
  maxDataAge: number; // days
  staleDataThreshold: number; // days
  minQualityScore: number; // threshold for recommending refresh
  backgroundRefreshEnabled: boolean;
  cacheChecksEnabled: boolean;
}

export interface CachePerformanceMetrics {
  cacheHits: number;
  cacheMisses: number;
  apiCallsSaved: number;
  totalChecks: number;
  averageCheckTime: number; // milliseconds
  lastResetDate: Date;
}

// Backend cache statistics response
export interface BackendCacheStats {
  totalProjects: number;
  cachedProjects: number;
  cacheHitRate: number; // 0-1 decimal
  avgDataAge: number; // days
  oldestCacheEntry?: string; // ISO date
  newestCacheEntry?: string; // ISO date
  totalApiCallsSaved: number;
  estimatedCostSavings?: number; // USD
}

export interface AddressChangeAnalysis {
  hasChanged: boolean;
  changedComponents: string[];
  severity: 'minor' | 'major' | 'complete';
  requiresRefresh: boolean;
  confidence: number; // 0-1
}

export interface RefreshRecommendation {
  shouldRefresh: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  reasons: string[];
  estimatedBenefit: 'none' | 'low' | 'medium' | 'high';
  costJustified: boolean;
}

// Default smart caching configuration
export const DEFAULT_CACHING_CONFIG: SmartCachingConfig = {
  maxDataAge: 30, // 30 days
  staleDataThreshold: 7, // 7 days
  minQualityScore: 5, // scores below 5 suggest retry
  backgroundRefreshEnabled: true,
  cacheChecksEnabled: true,
};

// Cache invalidation reasons with priorities
export const CACHE_INVALIDATION_REASONS = {
  ADDRESS_CHANGED: {
    priority: 'high' as const,
    description: 'Address components have changed',
    autoRefresh: true,
  },
  DATA_STALE: {
    priority: 'medium' as const,
    description: 'Data is older than configured threshold',
    autoRefresh: false,
  },
  IMAGERY_UPDATED: {
    priority: 'medium' as const,
    description: 'Street View imagery may have been updated',
    autoRefresh: false,
  },
  FIRST_CAPTURE: {
    priority: 'critical' as const,
    description: 'No previous data exists',
    autoRefresh: true,
  },
  LOW_QUALITY: {
    priority: 'low' as const,
    description: 'Previous capture had low quality score',
    autoRefresh: false,
  },
  FORCE_REFRESH: {
    priority: 'critical' as const,
    description: 'User explicitly requested refresh',
    autoRefresh: true,
  },
} as const;

// Address component importance for change detection
export const ADDRESS_COMPONENT_WEIGHTS = {
  address: 1.0, // Street address changes require immediate refresh
  city: 0.8, // City changes are significant
  state: 0.6, // State changes are important
  zipCode: 0.9, // ZIP code changes are very important
} as const;