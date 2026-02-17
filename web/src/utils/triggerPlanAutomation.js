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

// ============================================================
// Design Automation API (Cloud Pipeline) — NEW PRIMARY PATH
// ============================================================

const DA_API_BASE = 'https://api.skyfireapp.io/api/da';

/**
 * Fetch the DA API token from the backend.
 * Falls back to env variable if endpoint unavailable.
 */
async function getDAToken() {
  try {
    const response = await axios.get('/server-endpoints/da-token');
    return response.data.data.token;
  } catch {
    // Fallback: use env variable (for dev/demo)
    const envToken = process.env.REACT_APP_DA_API_TOKEN;
    if (envToken) return envToken;
    throw new Error('DA API token not available');
  }
}

/**
 * Trigger plan generation via the Design Automation cloud pipeline.
 * Only needs project_uuid — the server fetches everything else from DB.
 *
 * @param {string} projectUuid - Project UUID
 * @returns {Promise<{status: string, project_uuid: string, mode: string}>}
 */
export async function triggerDAProcess(projectUuid) {
  if (!projectUuid) throw new Error('projectUuid is required');

  logger.log('DA', `Triggering cloud pipeline for project: ${projectUuid}`);

  const token = await getDAToken();

  const response = await axiosExternal.post(
    `${DA_API_BASE}/process`,
    { project_uuid: projectUuid },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  );

  logger.success('DA', 'Pipeline submitted:', response.data);
  return response.data;
}

/**
 * Poll DA API for run completion.
 * Resolves when status is 'completed' or 'failed'.
 *
 * @param {string} projectUuid - Project UUID to check
 * @param {Object} options
 * @param {number} options.intervalMs - Poll interval (default 3000ms)
 * @param {number} options.timeoutMs - Max wait time (default 120000ms = 2 min)
 * @param {function} options.onProgress - Callback with status updates
 * @returns {Promise<Object>} The completed run record
 */
export async function pollDAStatus(projectUuid, options = {}) {
  const {
    intervalMs = 3000,
    timeoutMs = 180000,
    onProgress = null,
    lastRunId = 0,
  } = options;

  const token = await getDAToken();
  const startTime = Date.now();

  logger.log('DA', `Polling status for ${projectUuid}...`);

  while (Date.now() - startTime < timeoutMs) {
    try {
      const response = await axiosExternal.get(
        `${DA_API_BASE}/runs`,
        {
          params: { project_uuid: projectUuid },
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }
      );

      const runs = response.data.runs || [];
      const validRuns = lastRunId
        ? runs.filter(r => r.id > lastRunId)
        : runs;

      if (validRuns.length > 0) {
        const latest = validRuns[0]; // Most recent run (sorted desc)

        if (onProgress) {
          onProgress({
            status: latest.status,
            elapsed: Date.now() - startTime,
            totalSeconds: latest.total_seconds,
          });
        }

        if (latest.status === 'completed') {
          logger.success('DA', `Completed in ${latest.total_seconds}s`);
          return latest;
        }

        if (latest.status === 'failed') {
          throw new Error(latest.error_message || 'Pipeline failed');
        }
      }
    } catch (pollError) {
      // If it's our own thrown error (failed status), re-throw
      if (pollError.message === 'Pipeline failed' || pollError.message?.includes('Pipeline failed')) {
        throw pollError;
      }
      // Otherwise log and continue polling
      logger.warn('DA', 'Poll request failed, retrying...', pollError.message);
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new Error(`Pipeline timed out after ${timeoutMs / 1000}s`);
}

/**
 * Full flow: trigger DA process and poll until completion.
 * This is the main function SubmitForm should call.
 *
 * Falls back to ngrok/laptop trigger if DA API is unavailable.
 *
 * @param {string} projectUuid
 * @param {Object} options
 * @param {function} options.onProgress - Status callback
 * @param {string} options.secretToken - Ngrok secret (for fallback)
 * @param {Object} options.automationOptions - Ngrok options (for fallback)
 * @returns {Promise<Object>} The completed run record
 */
export async function generatePlanSet(projectUuid, options = {}) {
  const { onProgress, secretToken, automationOptions } = options;

  try {
    // PRIMARY: Try DA API (cloud pipeline)
    logger.log('DA', 'Using cloud pipeline (primary)');

    if (onProgress) onProgress({ status: 'submitting', message: 'Submitting to cloud pipeline...' });

    // Get current latest run ID before triggering
    let lastRunId = 0;
    try {
      const token = await getDAToken();
      const pre = await axiosExternal.get(`${DA_API_BASE}/runs`, {
        params: { project_uuid: projectUuid },
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      });
      const existingRuns = pre.data.runs || [];
      if (existingRuns.length > 0) {
        lastRunId = existingRuns[0].id;
      }
    } catch (e) {
      logger.warn('DA', 'Could not fetch pre-trigger runs, using timestamp fallback');
    }

    await triggerDAProcess(projectUuid);

    if (onProgress) onProgress({ status: 'processing', message: 'Processing in cloud...' });

    const result = await pollDAStatus(projectUuid, {
      lastRunId,
      onProgress: (p) => {
        if (onProgress) {
          onProgress({
            status: 'processing',
            message: `Processing... ${p.totalSeconds ? `(${p.totalSeconds}s)` : ''}`,
            ...p,
          });
        }
      },
      timeoutMs: 180000,
    });

    if (onProgress) onProgress({ status: 'completed', message: `Done in ${result.total_seconds}s` });

    return { source: 'da_api', ...result };

  } catch (daError) {
    logger.warn('DA', 'Cloud pipeline failed, falling back to legacy trigger:', daError.message);

    // FALLBACK: Use ngrok/laptop trigger
    if (secretToken) {
      if (onProgress) onProgress({ status: 'fallback', message: 'Falling back to local processing...' });

      await triggerPlanAutomation(
        projectUuid,
        secretToken,
        'GenerateProjects_Mobile',
        automationOptions || {}
      );

      return { source: 'legacy_ngrok', status: 'triggered' };
    }

    // No fallback available
    throw daError;
  }
}
