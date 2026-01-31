// Web version of mobile app's triggerPlanAutomation
import axios, { axiosExternal } from '../config/axios';
import logger from '../services/devLogger';

// Cache for ngrok URL (1 minute TTL)
let cachedNgrokUrl = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60000; // 1 minute

/**
 * Fetch active ngrok URL from the server-endpoints API
 * @param {string} computerName - Optional computer name filter (e.g., "ServerComputer2")
 * @returns {Promise<string>} The active ngrok URL
 */
export async function fetchActiveNgrokUrl(computerName) {
  const now = Date.now();

  // Return cached URL if still valid
  if (cachedNgrokUrl && now - cachedAt < CACHE_TTL_MS) {
    logger.debug('Automation', 'Using cached ngrok URL:', cachedNgrokUrl);
    return cachedNgrokUrl;
  }

  logger.debug('Automation', 'Fetching active ngrok URL from API...');

  const params = computerName ? { computer_name: computerName } : undefined;
  const response = await axios.get('/server-endpoints/active', { params });

  const ngrokUrl = response.data.data.ngrok_url;

  // Cache the URL
  cachedNgrokUrl = ngrokUrl;
  cachedAt = now;

  logger.success('Automation', 'Active ngrok URL resolved:', ngrokUrl);
  return ngrokUrl;
}

/**
 * Fetch the trigger secret token from the database
 * @returns {Promise<string>} The secret token
 */
export async function fetchTriggerSecret() {
  logger.debug('Automation', 'Fetching trigger secret from API...');

  // TODO: Replace with actual API endpoint when available
  // For now, you'll need to create an endpoint like:
  // GET /server-endpoints/trigger-secret
  // Returns: { data: { secret: "your-secret-token" } }

  const response = await axios.get('/server-endpoints/trigger-secret');
  const secret = response.data.data.secret;

  logger.success('Automation', 'Trigger secret fetched');
  return secret;
}

/**
 * Validate project is ready for generation
 * @param {Object} projectData - Full project data object
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateForGeneration(projectData) {
  const errors = [];

  // Check required project fields
  if (!projectData?.uuid) {
    errors.push('Project ID missing');
  }

  // Check site information
  const site = projectData?.site;
  if (!site?.address || site.address.trim() === '') {
    errors.push('Address is required');
  }
  if (!site?.city || site.city.trim() === '') {
    errors.push('City is required');
  }
  if (!site?.state || site.state.trim() === '') {
    errors.push('State is required');
  }
  if (!site?.zip || site.zip.trim() === '') {
    errors.push('ZIP code is required');
  }

  // Check customer information
  const details = projectData?.details;
  if (!details?.customer_first_name || details.customer_first_name.trim() === '') {
    errors.push('Customer first name is required');
  }
  if (!details?.customer_last_name || details.customer_last_name.trim() === '') {
    errors.push('Customer last name is required');
  }

  // Check for at least one system configured
  const systemDetails = projectData?.systemDetails;
  if (systemDetails) {
    const hasSystem = ['sys1', 'sys2', 'sys3', 'sys4'].some((prefix) => {
      const selectedSystem = systemDetails[`${prefix}_selectedsystem`];
      return selectedSystem && selectedSystem !== '' && selectedSystem !== 'none';
    });

    if (!hasSystem) {
      errors.push('At least one solar system must be configured');
    }
  } else {
    errors.push('No system configuration found');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Trigger a plan automation (NewProject, AHJLookup, GenerateProjects_Mobile, etc.)
 * @param {string} projectUuid - Project UUID
 * @param {string} secretToken - Secret token for authorization
 * @param {string} processName - Process name (e.g., "NewProject", "AHJLookup", "GenerateProjects_Mobile", "generate_plan_set", "generate_survey_report")
 * @param {Object} options - Optional context data
 * @param {string} options.companyUuid - Company UUID
 * @param {string} options.userUuid - User UUID
 * @param {string} options.computerName - Target computer name (default: "ServerComputer2")
 * @param {string} options.overrideUrl - Override ngrok URL (for testing)
 * @returns {Promise<any>} Response from the trigger endpoint
 */
export async function triggerPlanAutomation(
  projectUuid,
  secretToken,
  processName,
  options = {}
) {
  try {
    // Validate required parameters
    if (!projectUuid || typeof projectUuid !== 'string') {
      throw new Error('projectUuid is required and must be a string');
    }
    if (!secretToken || typeof secretToken !== 'string') {
      throw new Error('secretToken is required and must be a string');
    }
    if (!processName || typeof processName !== 'string') {
      throw new Error('processName is required and must be a string');
    }

    logger.log('Automation', `Triggering ${processName} automation for project:`, projectUuid);

    // Generate trace ID for log correlation
    const traceId = `web-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // Step 1: Create process tracking record
    // NOTE: This endpoint is not yet implemented - skipping for now
    let trackingId = null;
    // try {
    //   logger.debug('Automation', 'Creating process tracking record...');
    //   const trackingResponse = await axios.post('/process-tracking/start', {
    //     process_name: processName,
    //     project_uuid: projectUuid,
    //     company_id: options.companyUuid,
    //     user_id: options.userUuid,
    //     metadata: { trace_id: traceId },
    //   });
    //
    //   trackingId = trackingResponse.data.data.id;
    //   logger.success('Automation', 'Process tracking record created:', trackingId);
    // } catch (trackingError) {
    //   // Log error but don't fail - tracking is non-critical
    //   logger.warn('Automation', 'Failed to create tracking record (non-blocking):', trackingError.message);
    // }

    // Encode the secret token (Flask expects base64 of SECRET_TOKEN as Bearer)
    const encodedToken = btoa(secretToken);
    logger.debug('Automation', 'Encoded token:', encodedToken.slice(0, 8) + '...');

    // Resolve ngrok URL
    let ngrokUrl;
    if (options.overrideUrl) {
      ngrokUrl = options.overrideUrl;
      logger.debug('Automation', 'Using override URL:', ngrokUrl);
    } else {
      const computerName = options.computerName || 'ServerComputer2';
      ngrokUrl = await fetchActiveNgrokUrl(computerName);
    }

    // Normalize URL: ensure scheme and exactly one '/trigger'
    let normalizedUrl = String(ngrokUrl).trim();

    // Prepend scheme if missing
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      logger.debug('Automation', 'Prepending https:// (scheme missing)');
      normalizedUrl = 'https://' + normalizedUrl.replace(/^\/+/, '');
    }

    // Ensure exactly one '/trigger'
    normalizedUrl = normalizedUrl.replace(/\/+$/, ''); // trim trailing slashes
    if (!/\/trigger$/i.test(normalizedUrl)) {
      normalizedUrl = normalizedUrl + '/trigger';
      logger.debug('Automation', 'Appended /trigger:', normalizedUrl);
    } else {
      logger.debug('Automation', 'URL already ends with /trigger:', normalizedUrl);
    }

    // Step 2: Build payload with tracking_id
    const payload = {
      process_name: processName,
      data: {
        // Legacy key for compatibility
        project_id: projectUuid,

        // New explicit key
        project_uuid: projectUuid,

        // Optional context
        ...(options.companyUuid ? { company_uuid: options.companyUuid } : {}),
        ...(options.userUuid ? { user_uuid: options.userUuid } : {}),
        client_version: '1.0.0-web',

        // Trace for log correlation
        trace_id: traceId,

        // Include tracking_id so webhook can mark completion
        ...(trackingId ? { tracking_id: trackingId } : {}),

        meta: {
          computerName: options.computerName || 'ServerComputer2',
          platform: 'web',
        },
      },
    };

    logger.debug('Automation', 'Payload prepared:', JSON.stringify(payload, null, 2));

    // Step 3: Trigger automation via ngrok (webhook will use tracking_id to mark completion)
    const response = await axiosExternal.post(normalizedUrl, payload, {
      headers: {
        Authorization: `Bearer ${encodedToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });

    logger.success('Automation', `${processName} trigger complete. Status:`, response.status);
    if (trackingId) {
      logger.debug('Automation', `Tracking ID ${trackingId} included in payload for webhook completion`);
    }
    return response.data;
  } catch (error) {
    if (error.response) {
      logger.error('Automation', `${processName} Response Status:`, error.response.status);
      logger.error('Automation', `${processName} Response Data:`, error.response.data);
    } else if (error.request) {
      logger.error('Automation', `${processName} Request was made but no response received`);
    } else {
      logger.error('Automation', `${processName} Error:`, error.message);
    }
    throw error;
  }
}
