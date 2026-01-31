/**
 * Google Maps API Debug Utility
 *
 * This file helps diagnose Google Maps API issues by:
 * 1. Verifying API key configuration
 * 2. Testing API endpoints
 * 3. Providing clear error messages
 */

import { GOOGLE_MAPS_API_KEY } from "@env";
import { logger } from "./logger";

// The correct API key that should be used
const EXPECTED_API_KEY = "AIzaSyBTIEUeUnP1QWoLBzmdWE1x0R_N4UlN4dQ";

// Fallback if environment variable fails
export const FALLBACK_API_KEY = EXPECTED_API_KEY;

/**
 * Get the Google Maps API key with fallback
 */
export function getGoogleMapsApiKey(): string {
  const envKey = GOOGLE_MAPS_API_KEY;
  const apiKey = envKey || FALLBACK_API_KEY;

  // Log key status (only first 10 chars for security)
  logger.debug("[GoogleMaps Debug] Environment key:", envKey ? `${envKey.substring(0, 10)}...` : "NOT LOADED");
  logger.debug("[GoogleMaps Debug] Using key:", apiKey ? `${apiKey.substring(0, 10)}...` : "NONE");

  // Warn if using fallback
  if (!envKey && apiKey === FALLBACK_API_KEY) {
    logger.warn("[GoogleMaps Debug] WARNING: Using fallback API key - environment variable not loaded!");
  }

  // Check if it's the wrong key
  if (apiKey && !apiKey.startsWith("AIzaSyBT")) {
    logger.error("[GoogleMaps Debug] ERROR: API key doesn't match expected format!");
    logger.error("[GoogleMaps Debug] Expected to start with: AIzaSyBT...");
    logger.error("[GoogleMaps Debug] Actually starts with:", apiKey.substring(0, 10));
  }

  return apiKey;
}

/**
 * Test Google Maps Static API
 */
export async function testStaticMapsApi(address: string = "New York, NY"): Promise<void> {
  const apiKey = getGoogleMapsApiKey();

  if (!apiKey) {
    logger.error("[GoogleMaps Test] No API key available!");
    return;
  }

  const url = `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(address)}&zoom=13&size=400x400&key=${apiKey}`;

  logger.debug("[GoogleMaps Test] Testing Static Maps API...");
  logger.debug("[GoogleMaps Test] Address:", address);
  logger.debug("[GoogleMaps Test] URL (key hidden):", url.replace(apiKey, "[KEY]"));

  try {
    const response = await fetch(url);

    if (response.ok) {
      logger.info("[GoogleMaps Test] ✅ Static Maps API working!");
    } else {
      logger.error("[GoogleMaps Test] ❌ Static Maps API failed!");
      logger.error("[GoogleMaps Test] Status:", response.status, response.statusText);

      if (response.status === 403) {
        logger.error("[GoogleMaps Test] Possible issues:");
        logger.error("  1. API key is invalid or restricted");
        logger.error("  2. Maps Static API not enabled in Google Cloud Console");
        logger.error("  3. Billing not enabled on Google Cloud project");
        logger.error("  4. API key restrictions don't match your app");
      }
    }
  } catch (error) {
    logger.error("[GoogleMaps Test] Network error:", error);
  }
}

/**
 * Test Google Places API
 */
export async function testPlacesApi(query: string = "123 Main St"): Promise<void> {
  const apiKey = getGoogleMapsApiKey();

  if (!apiKey) {
    logger.error("[GooglePlaces Test] No API key available!");
    return;
  }

  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=address&components=country:us&key=${apiKey}`;

  logger.debug("[GooglePlaces Test] Testing Places Autocomplete API...");
  logger.debug("[GooglePlaces Test] Query:", query);
  logger.debug("[GooglePlaces Test] URL (key hidden):", url.replace(apiKey, "[KEY]"));

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" || data.status === "ZERO_RESULTS") {
      logger.info("[GooglePlaces Test] ✅ Places API working!");
      logger.info("[GooglePlaces Test] Found", data.predictions?.length || 0, "predictions");
    } else {
      logger.error("[GooglePlaces Test] ❌ Places API failed!");
      logger.error("[GooglePlaces Test] Status:", data.status);
      logger.error("[GooglePlaces Test] Error:", data.error_message);

      if (data.status === "REQUEST_DENIED") {
        logger.error("[GooglePlaces Test] Possible issues:");
        logger.error("  1. Places API not enabled in Google Cloud Console");
        logger.error("  2. API key is invalid");
        logger.error("  3. API key restrictions block this request");
      }
    }
  } catch (error) {
    logger.error("[GooglePlaces Test] Network error:", error);
  }
}

/**
 * Run all debug tests
 */
export async function runGoogleMapsDebugTests(): Promise<void> {
  logger.info("========================================");
  logger.info("Starting Google Maps Debug Tests...");
  logger.info("========================================");

  // Check API key
  const apiKey = getGoogleMapsApiKey();

  if (!apiKey) {
    logger.error("FATAL: No API key available. Cannot continue tests.");
    return;
  }

  // Test Static Maps
  await testStaticMapsApi();

  // Small delay between tests
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test Places API
  await testPlacesApi();

  logger.info("========================================");
  logger.info("Debug Tests Complete");
  logger.info("========================================");
}

/**
 * Log current configuration
 */
export function logGoogleMapsConfig(): void {
  logger.info("========================================");
  logger.info("Google Maps Configuration:");
  logger.info("========================================");
  logger.info("Environment Variable:", GOOGLE_MAPS_API_KEY ? "✅ Loaded" : "❌ Not loaded");
  logger.info("Fallback Key:", FALLBACK_API_KEY ? "✅ Available" : "❌ Not available");
  logger.info("Current Key:", getGoogleMapsApiKey() ? `${getGoogleMapsApiKey().substring(0, 10)}...` : "NONE");
  logger.info("Expected Key Start:", "AIzaSyBT...");
  logger.info("========================================");
}