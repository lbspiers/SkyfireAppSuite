/**
 * Equipment API Access Test
 * Verifies CORS is working for all equipment endpoints
 */
import axios from '../config/axios';

export const testEquipmentAPIs = async () => {
  const endpoints = [
    { name: 'Equipment Types', url: '/equipment/types' },
    { name: 'Solar Panel Manufacturers', url: '/equipment/manufacturers?type=solar_panel' },
    { name: 'Inverter Manufacturers', url: '/equipment/manufacturers?type=inverter' },
    { name: 'Battery Manufacturers', url: '/equipment/manufacturers?type=battery' },
    { name: 'All Manufacturers', url: '/equipment/manufacturers' },
    { name: 'Solar Panel Models', url: '/equipment/models?type=solar_panel' },
    { name: 'Inverter Models', url: '/equipment/models?type=inverter' },
    { name: 'Battery Models', url: '/equipment/models?type=battery' },
  ];

  console.group('🔧 Equipment API Access Test');
  console.log('Testing CORS configuration...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(endpoint.url);
      console.log(`✅ ${endpoint.name}: OK (${response.status})`);
      successCount++;
    } catch (error) {
      errorCount++;
      if (error.response) {
        console.error(`❌ ${endpoint.name}: ${error.response.status} - ${error.response.statusText}`);
      } else if (error.message.includes('CORS') || error.message.includes('Network')) {
        console.error(`❌ ${endpoint.name}: CORS/Network Error - ${error.message}`);
      } else {
        console.error(`❌ ${endpoint.name}: ${error.message}`);
      }
    }
  }

  console.log(`\n📊 Results: ${successCount} passed, ${errorCount} failed`);
  console.groupEnd();

  return {
    total: endpoints.length,
    passed: successCount,
    failed: errorCount,
  };
};

// Can be called from browser console: window.testEquipmentAPIs()
if (process.env.NODE_ENV === 'development') {
  window.testEquipmentAPIs = testEquipmentAPIs;
}

/**
 * Test a single equipment API endpoint
 */
export const testEndpoint = async (url) => {
  console.log(`Testing: ${url}`);
  try {
    const response = await axios.get(url);
    console.log(`✅ Success: ${response.status}`, response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed:`, error);
    throw error;
  }
};

// Expose single endpoint tester too
if (process.env.NODE_ENV === 'development') {
  window.testEndpoint = testEndpoint;
}
