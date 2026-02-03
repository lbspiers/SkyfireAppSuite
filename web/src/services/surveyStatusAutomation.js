/**
 * @fileoverview Survey Status Automation
 * Automatically updates survey tab status based on photo upload activity
 */

import { updateTabStatus } from './projectTabStatusAPI';
import logger from './devLogger';

/**
 * Auto-update survey status to "pending" when photos start uploading
 *
 * This function should be called when:
 * - User uploads photos in bulk (web app)
 * - Mobile app uploads photos during site survey
 *
 * @param {string} projectId - Project UUID
 * @returns {Promise<void>}
 *
 * @example
 * ```js
 * import { autoUpdateSurveyStatusOnPhotoUpload } from './surveyStatusAutomation';
 *
 * // In upload handler
 * await autoUpdateSurveyStatusOnPhotoUpload(projectUuid);
 * ```
 */
export const autoUpdateSurveyStatusOnPhotoUpload = async (projectId) => {
  if (!projectId) {
    logger.warn('surveyStatusAutomation', 'Cannot update survey status: missing projectId');
    return;
  }

  try {
    logger.log('surveyStatusAutomation', `Auto-updating survey status to "pending" for project ${projectId}`);

    await updateTabStatus(projectId, 'survey', {
      status: 'pending',
      statusReason: null,
    });

    logger.log('surveyStatusAutomation', 'Survey status updated successfully');
  } catch (error) {
    // Don't throw - status update failure shouldn't block photo upload
    logger.error('surveyStatusAutomation', 'Failed to auto-update survey status:', error);
  }
};

/**
 * Auto-update survey status to "complete" when marked complete
 * This will be called from mobile app when site survey is marked complete
 *
 * @param {string} projectId - Project UUID
 * @returns {Promise<void>}
 */
export const markSurveyComplete = async (projectId) => {
  if (!projectId) {
    logger.warn('surveyStatusAutomation', 'Cannot mark survey complete: missing projectId');
    return;
  }

  try {
    logger.log('surveyStatusAutomation', `Marking survey complete for project ${projectId}`);

    await updateTabStatus(projectId, 'survey', {
      status: 'complete',
      statusReason: null,
    });

    logger.log('surveyStatusAutomation', 'Survey marked complete successfully');
  } catch (error) {
    logger.error('surveyStatusAutomation', 'Failed to mark survey complete:', error);
    throw error; // Re-throw for mobile app to handle
  }
};
