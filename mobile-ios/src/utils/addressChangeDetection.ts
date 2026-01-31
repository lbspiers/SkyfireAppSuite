// src/utils/addressChangeDetection.ts

import {
  AddressComponents,
  AddressChangeAnalysis,
  RefreshRecommendation,
  CacheStatus,
  CacheMetadata,
  SmartCachingConfig,
  DEFAULT_CACHING_CONFIG,
  ADDRESS_COMPONENT_WEIGHTS,
  CACHE_INVALIDATION_REASONS,
} from '../types/streetViewCaching';

/**
 * Normalize address component for comparison
 * Handles common variations in address formatting
 */
export const normalizeAddressComponent = (component: string): string => {
  if (!component) return '';

  return component
    .toLowerCase()
    .trim()
    // Normalize common abbreviations
    .replace(/\bstreet\b/g, 'st')
    .replace(/\bavenue\b/g, 'ave')
    .replace(/\bdrive\b/g, 'dr')
    .replace(/\broads?\b/g, 'rd')
    .replace(/\blane\b/g, 'ln')
    .replace(/\bcourt\b/g, 'ct')
    .replace(/\bnorth\b/g, 'n')
    .replace(/\bsouth\b/g, 's')
    .replace(/\beast\b/g, 'e')
    .replace(/\bwest\b/g, 'w')
    // Remove extra spaces and punctuation
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Generate a hash for address components to detect changes
 */
export const generateAddressHash = (components: AddressComponents): string => {
  const normalized = {
    address: normalizeAddressComponent(components.address),
    city: normalizeAddressComponent(components.city),
    state: normalizeAddressComponent(components.state),
    zipCode: components.zipCode?.replace(/\D/g, ''), // Keep only digits
  };

  const hashString = `${normalized.address}|${normalized.city}|${normalized.state}|${normalized.zipCode}`;

  // Simple hash function (in production, consider using a proper hash library)
  let hash = 0;
  for (let i = 0; i < hashString.length; i++) {
    const char = hashString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return hash.toString(16);
};

/**
 * Analyze address changes between current and stored components
 */
export const analyzeAddressChange = (
  current: AddressComponents,
  stored: AddressComponents
): AddressChangeAnalysis => {
  const changedComponents: string[] = [];
  let totalWeight = 0;
  let changedWeight = 0;

  // Check each component for changes
  Object.entries(ADDRESS_COMPONENT_WEIGHTS).forEach(([key, weight]) => {
    const currentValue = normalizeAddressComponent(current[key as keyof AddressComponents]);
    const storedValue = normalizeAddressComponent(stored[key as keyof AddressComponents]);

    totalWeight += weight;

    if (currentValue !== storedValue) {
      changedComponents.push(key);
      changedWeight += weight;
    }
  });

  const hasChanged = changedComponents.length > 0;
  const changeRatio = hasChanged ? changedWeight / totalWeight : 0;

  // Determine severity based on changed components and weights
  let severity: 'minor' | 'major' | 'complete';
  if (changeRatio >= 0.8) {
    severity = 'complete';
  } else if (changeRatio >= 0.5 || changedComponents.includes('address')) {
    severity = 'major';
  } else {
    severity = 'minor';
  }

  // Determine if refresh is required
  const requiresRefresh = hasChanged && (
    severity === 'complete' ||
    severity === 'major' ||
    changedComponents.includes('address') ||
    changedComponents.includes('zipCode')
  );

  return {
    hasChanged,
    changedComponents,
    severity,
    requiresRefresh,
    confidence: hasChanged ? Math.min(changeRatio * 2, 1) : 1,
  };
};

/**
 * Check if Street View imagery should be refreshed based on date
 */
export const shouldRefreshStreetView = (lastCaptured: Date, streetViewDate?: string): boolean => {
  if (!streetViewDate) return false;

  try {
    // Parse Street View date (format: "2025-02")
    const [year, month] = streetViewDate.split('-').map(Number);
    const streetViewDateTime = new Date(year, month - 1, 1); // First day of the month

    // If Street View imagery is newer than our capture, we should refresh
    return streetViewDateTime > lastCaptured;
  } catch (error) {
    console.warn('Error parsing Street View date:', streetViewDate);
    return false;
  }
};

/**
 * Calculate data age in days
 */
export const calculateDataAge = (lastUpdated: Date): number => {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - lastUpdated.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Determine if data is stale based on configuration
 */
export const isDataStale = (
  lastUpdated: Date,
  config: SmartCachingConfig = DEFAULT_CACHING_CONFIG
): { isStale: boolean; daysSinceUpdate: number } => {
  const daysSinceUpdate = calculateDataAge(lastUpdated);
  const isStale = daysSinceUpdate >= config.staleDataThreshold;

  return { isStale, daysSinceUpdate };
};

/**
 * Determine if data is too old and needs refresh
 */
export const isDataExpired = (
  lastUpdated: Date,
  config: SmartCachingConfig = DEFAULT_CACHING_CONFIG
): boolean => {
  const daysSinceUpdate = calculateDataAge(lastUpdated);
  return daysSinceUpdate >= config.maxDataAge;
};

/**
 * Generate refresh recommendation based on multiple factors
 */
export const generateRefreshRecommendation = (
  cacheStatus: CacheStatus,
  config: SmartCachingConfig = DEFAULT_CACHING_CONFIG
): RefreshRecommendation => {
  const reasons: string[] = [];
  let priority: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let estimatedBenefit: 'none' | 'low' | 'medium' | 'high' = 'none';

  // No data exists
  if (!cacheStatus.exists) {
    reasons.push('No previous analytics data exists');
    priority = 'critical';
    estimatedBenefit = 'high';
  }

  // Address changed
  if (cacheStatus.addressChanged) {
    reasons.push('Address components have changed');
    priority = 'high';
    estimatedBenefit = 'high';
  }

  // Data expired
  if (cacheStatus.daysSinceUpdate && cacheStatus.daysSinceUpdate >= config.maxDataAge) {
    reasons.push(`Data is ${cacheStatus.daysSinceUpdate} days old (max: ${config.maxDataAge})`);
    priority = priority === 'low' ? 'medium' : priority;
    estimatedBenefit = estimatedBenefit === 'none' ? 'medium' : estimatedBenefit;
  }

  // Data stale
  if (cacheStatus.daysSinceUpdate && cacheStatus.daysSinceUpdate >= config.staleDataThreshold) {
    reasons.push(`Data is stale (${cacheStatus.daysSinceUpdate} days since update)`);
    priority = priority === 'low' ? 'medium' : priority;
    estimatedBenefit = estimatedBenefit === 'none' ? 'low' : estimatedBenefit;
  }

  // Low quality score
  if (cacheStatus.cachedData?.qualityScore && cacheStatus.cachedData.qualityScore < config.minQualityScore) {
    reasons.push(`Low quality score: ${cacheStatus.cachedData.qualityScore}/${10}`);
    priority = priority === 'low' ? 'medium' : priority;
    estimatedBenefit = estimatedBenefit === 'none' ? 'medium' : estimatedBenefit;
  }

  // Street View might have updated
  if (cacheStatus.reason === 'imagery_updated') {
    reasons.push('Street View imagery may have been updated');
    priority = priority === 'low' ? 'medium' : priority;
    estimatedBenefit = estimatedBenefit === 'none' ? 'medium' : estimatedBenefit;
  }

  const shouldRefresh = priority !== 'low' || reasons.length > 0;

  // Cost justification based on estimated benefit and current data age
  const costJustified =
    priority === 'critical' ||
    priority === 'high' ||
    (priority === 'medium' && estimatedBenefit !== 'none') ||
    (cacheStatus.daysSinceUpdate && cacheStatus.daysSinceUpdate >= config.maxDataAge);

  return {
    shouldRefresh,
    priority,
    reasons,
    estimatedBenefit,
    costJustified,
  };
};

/**
 * Create comprehensive cache status from metadata and current address
 */
export const createCacheStatus = (
  currentAddress: AddressComponents,
  cachedMetadata: CacheMetadata | null,
  config: SmartCachingConfig = DEFAULT_CACHING_CONFIG
): CacheStatus => {
  // No cached data
  if (!cachedMetadata) {
    return {
      exists: false,
      isFresh: false,
      lastUpdated: new Date(),
      addressChanged: false,
      recommendRefresh: true,
      reason: 'first_capture',
      daysSinceUpdate: 0,
    };
  }

  const lastUpdated = new Date(cachedMetadata.lastUpdated);
  const { isStale, daysSinceUpdate } = isDataStale(lastUpdated, config);
  const isExpired = isDataExpired(lastUpdated, config);

  // Check for address changes
  const addressChange = analyzeAddressChange(currentAddress, cachedMetadata.addressComponents);

  // Check if Street View imagery might have updated
  const streetViewUpdated = shouldRefreshStreetView(lastUpdated, cachedMetadata.streetViewDate);

  // Determine primary reason for refresh recommendation
  let reason: CacheStatus['reason'];
  let recommendRefresh = false;

  if (addressChange.requiresRefresh) {
    reason = 'address_changed';
    recommendRefresh = true;
  } else if (isExpired) {
    reason = 'data_stale';
    recommendRefresh = true;
  } else if (streetViewUpdated) {
    reason = 'imagery_updated';
    recommendRefresh = true;
  } else if (cachedMetadata.qualityScore < config.minQualityScore) {
    reason = 'low_quality';
    recommendRefresh = false; // Optional refresh for low quality
  }

  return {
    exists: true,
    isFresh: !isStale && !isExpired && !addressChange.hasChanged,
    lastUpdated,
    addressChanged: addressChange.hasChanged,
    recommendRefresh,
    reason,
    daysSinceUpdate,
    cachedData: cachedMetadata,
  };
};

/**
 * Format cache status for user display
 */
export const formatCacheStatusMessage = (status: CacheStatus): string => {
  if (!status.exists) {
    return 'No Street View data captured yet';
  }

  if (status.isFresh) {
    return `Data current as of ${status.lastUpdated.toLocaleDateString()}`;
  }

  if (status.addressChanged) {
    return 'Address changed - refresh recommended';
  }

  if (status.daysSinceUpdate) {
    if (status.daysSinceUpdate === 1) {
      return 'Data from yesterday';
    } else if (status.daysSinceUpdate < 7) {
      return `Data from ${status.daysSinceUpdate} days ago`;
    } else if (status.daysSinceUpdate < 30) {
      return `Data from ${Math.floor(status.daysSinceUpdate / 7)} weeks ago`;
    } else {
      return `Data from ${Math.floor(status.daysSinceUpdate / 30)} months ago`;
    }
  }

  return 'Cache status unknown';
};