/**
 * @fileoverview Upload Manager - Centralized upload orchestration service
 *
 * Handles bulk file uploads with smart categorization, concurrency control,
 * and event-driven progress tracking. Singleton service that persists across
 * component unmounts to support background uploads.
 *
 * @module services/uploadManager
 *
 * @example
 * // Enqueue files for upload
 * import { uploadManager } from './services/uploadManager';
 *
 * uploadManager.enqueue(files, projectUuid);
 *
 * // Subscribe to upload events
 * const unsubscribe = uploadManager.subscribe((event, data) => {
 *   if (event === 'file:update') {
 *     console.log('File progress:', data);
 *   }
 * });
 *
 * // Get current status
 * const status = uploadManager.getStatus();
 * // { total: 100, completed: 45, failed: 2, inProgress: 3, queued: 50 }
 */

import { v4 as uuidv4 } from 'uuid';
import surveyService from './surveyService';
import documentService from './documentService';
import { processFileForUpload, isHeicFile } from '../utils/imageProcessor';
import { autoUpdateSurveyStatusOnPhotoUpload } from './surveyStatusAutomation';
import logger from './devLogger';

// File extension categories (from FilesTab.js)
const PHOTO_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'svg'];
const HEIC_EXTENSIONS = ['heic', 'heif'];
const VIDEO_EXTENSIONS = ['mp4', 'mov', 'avi', 'webm', 'mkv', 'm4v', '3gp', 'flv', 'wmv', 'mpg', 'mpeg'];
const DOCUMENT_EXTENSIONS = ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'csv', 'ppt', 'pptx', 'rtf', 'odt', 'ods'];

/**
 * File upload state structure
 * @typedef {Object} FileUploadState
 * @property {string} id - Unique file identifier
 * @property {string} name - Original filename
 * @property {number} size - File size in bytes
 * @property {File} file - Original File object
 * @property {'photo'|'heic'|'video'|'document'} type - File category
 * @property {'queued'|'processing'|'uploading'|'complete'|'error'} status - Upload status
 * @property {'pending'|'converting'|'compressing'|'uploading'|'complete'|'error'} stage - Current processing stage
 * @property {number} percent - Progress percentage (0-100)
 * @property {string|null} error - Error message if failed
 * @property {number} startTime - Upload start timestamp
 * @property {number|null} endTime - Upload completion timestamp
 */

/**
 * UploadManager - Singleton service for centralized upload management
 */
class UploadManager {
  constructor() {
    if (UploadManager.instance) {
      return UploadManager.instance;
    }

    // Core state
    this.files = new Map(); // fileId → FileUploadState
    this.projectUuid = null;

    // Queues by file type
    this.queue = {
      readyImages: [],
      heicImages: [],
      videos: [],
      documents: [],
    };

    // Active uploads by category (for concurrency control)
    this.active = {
      readyImages: new Set(),
      heicImages: new Set(),
      videos: new Set(),
      documents: new Set(),
    };

    // Concurrency limits per category
    this.concurrencyLimits = {
      readyImages: 3,  // Reduced from 5 to prevent rate limiting
      heicImages: 2,   // Server conversion is intensive
      videos: 2,       // Large files, bandwidth-heavy
      documents: 2,    // Reduced from 3 to prevent rate limiting
    };

    // Rate limiting configuration
    this.rateLimitConfig = {
      maxConcurrent: 3,        // Max 3 uploads at once across all categories
      delayBetweenUploads: 200, // 200ms delay between starting uploads
      retryDelay: 5000,        // 5 second delay on 429 before retry
      maxRetries: 3,
    };

    // Rate limiting state
    this.lastUploadTime = null;
    this.globalActiveUploads = 0;

    // Event subscribers
    this.subscribers = new Set();

    // Upload state
    this.isProcessing = false;
    this.isCancelled = false;

    UploadManager.instance = this;
    logger.log('UploadManager', 'Singleton instance created');
  }

  /**
   * Get singleton instance
   * @returns {UploadManager}
   */
  static getInstance() {
    if (!UploadManager.instance) {
      UploadManager.instance = new UploadManager();
    }
    return UploadManager.instance;
  }

  /**
   * Categorize files by type based on extension
   * @private
   * @param {File[]} files - Files to categorize
   * @returns {Object} Categorized file groups
   */
  _categorizeFiles(files) {
    return files.reduce((acc, file) => {
      const ext = file.name.split('.').pop().toLowerCase();

      if (HEIC_EXTENSIONS.includes(ext)) {
        acc.heicImages.push(file);
      } else if (PHOTO_EXTENSIONS.includes(ext)) {
        acc.readyImages.push(file);
      } else if (VIDEO_EXTENSIONS.includes(ext)) {
        acc.videos.push(file);
      } else if (DOCUMENT_EXTENSIONS.includes(ext)) {
        acc.documents.push(file);
      } else {
        acc.unsupported.push(file);
      }

      return acc;
    }, {
      readyImages: [],
      heicImages: [],
      videos: [],
      documents: [],
      unsupported: [],
    });
  }

  /**
   * Get category for a file type
   * @private
   * @param {'photo'|'heic'|'video'|'document'} type - File type
   * @returns {string} Category key
   */
  _getCategoryForType(type) {
    const typeToCategory = {
      'photo': 'readyImages',
      'heic': 'heicImages',
      'video': 'videos',
      'document': 'documents',
    };
    return typeToCategory[type] || 'readyImages';
  }

  /**
   * Create FileUploadState object
   * @private
   * @param {File} file - File object
   * @param {string} type - File type
   * @returns {FileUploadState}
   */
  _createFileState(file, type) {
    return {
      id: uuidv4(),
      name: file.name,
      size: file.size,
      file,
      type,
      status: 'queued',
      stage: 'pending',
      percent: 0,
      error: null,
      startTime: Date.now(),
      endTime: null,
    };
  }

  /**
   * Emit event to all subscribers
   * @private
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  _emit(event, data) {
    logger.log('UploadManager', `Event: ${event}`, data);
    this.subscribers.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        logger.error('UploadManager', 'Subscriber error:', error);
      }
    });
  }

  /**
   * Update file state and emit event
   * @private
   * @param {string} fileId - File ID
   * @param {Partial<FileUploadState>} updates - State updates
   */
  _updateFile(fileId, updates) {
    const file = this.files.get(fileId);
    if (!file) return;

    Object.assign(file, updates);
    this._emit('file:update', { fileId, file });
  }

  /**
   * Check if upload is network error (retryable)
   * @private
   * @param {Error} error - Error object
   * @returns {boolean}
   */
  _isNetworkError(error) {
    const message = error.message.toLowerCase();
    return message.includes('fetch') ||
           message.includes('network') ||
           message.includes('timeout') ||
           message.includes('failed to fetch');
  }

  /**
   * Delay helper for retry backoff
   * @private
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Upload with automatic retry on network errors
   * @private
   * @param {Function} uploadFn - Upload function
   * @param {FileUploadState} fileState - File state
   * @param {number} maxRetries - Max retry attempts
   * @returns {Promise<*>}
   */
  async _uploadWithRetry(uploadFn, fileState, maxRetries = 1) {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await uploadFn();
      } catch (error) {
        lastError = error;

        // Only retry on network errors
        if (this._isNetworkError(error) && attempt < maxRetries) {
          logger.warn('UploadManager', `Retry attempt ${attempt + 1} for ${fileState.name}`);
          await this._delay(1000 * (attempt + 1)); // Exponential backoff
          continue;
        }

        break;
      }
    }

    throw lastError;
  }

  /**
   * Upload a ready image (no processing needed)
   * @private
   * @param {FileUploadState} fileState - File state
   * @returns {Promise<void>}
   */
  async _uploadReadyImage(fileState) {
    logger.log('UploadManager', `Uploading ready image: ${fileState.name}`);

    this._updateFile(fileState.id, {
      status: 'uploading',
      stage: 'uploading',
      percent: 0,
    });

    await this._uploadWithRetry(async () => {
      // Direct upload to S3 via surveyService
      await surveyService.photos.upload(this.projectUuid, fileState.file);

      this._updateFile(fileState.id, {
        status: 'complete',
        stage: 'complete',
        percent: 100,
        endTime: Date.now(),
      });
    }, fileState);
  }

  /**
   * Upload a HEIC image (with conversion)
   * @private
   * @param {FileUploadState} fileState - File state
   * @returns {Promise<void>}
   */
  async _uploadHeicImage(fileState) {
    logger.log('UploadManager', `Uploading HEIC image: ${fileState.name}`);

    this._updateFile(fileState.id, {
      status: 'processing',
      stage: 'converting',
      percent: 0,
    });

    await this._uploadWithRetry(async () => {
      // Process file (client/server conversion + compression)
      const result = await processFileForUpload(
        fileState.file,
        this.projectUuid,
        ({ stage, percent }) => {
          this._updateFile(fileState.id, {
            stage,
            percent: percent * 0.7, // Processing is 0-70%
          });
        }
      );

      // Check if server already converted and uploaded
      if (result.serverConverted) {
        logger.log('UploadManager', `Server-converted ${fileState.name}, registering in database`);

        this._updateFile(fileState.id, {
          stage: 'uploading',
          percent: 90,
        });

        // Just register in database
        await surveyService.photos.registerServerConverted(this.projectUuid, {
          url: result.url,
          fileName: result.fileName,
          fileSize: result.fileSize,
          section: 'general',
        });
      } else {
        // Normal upload flow
        this._updateFile(fileState.id, {
          status: 'uploading',
          stage: 'uploading',
          percent: 70,
        });

        await surveyService.photos.upload(this.projectUuid, result.file);
      }

      this._updateFile(fileState.id, {
        status: 'complete',
        stage: 'complete',
        percent: 100,
        endTime: Date.now(),
      });
    }, fileState);
  }

  /**
   * Upload a video file
   * @private
   * @param {FileUploadState} fileState - File state
   * @returns {Promise<void>}
   */
  async _uploadVideo(fileState) {
    logger.log('UploadManager', `Uploading video: ${fileState.name}`);

    this._updateFile(fileState.id, {
      status: 'uploading',
      stage: 'uploading',
      percent: 0,
    });

    await this._uploadWithRetry(async () => {
      await surveyService.videos.upload(this.projectUuid, fileState.file);

      this._updateFile(fileState.id, {
        status: 'complete',
        stage: 'complete',
        percent: 100,
        endTime: Date.now(),
      });
    }, fileState);
  }

  /**
   * Upload a document file
   * @private
   * @param {FileUploadState} fileState - File state
   * @returns {Promise<void>}
   */
  async _uploadDocument(fileState) {
    logger.log('UploadManager', `Uploading document: ${fileState.name}`);

    this._updateFile(fileState.id, {
      status: 'uploading',
      stage: 'uploading',
      percent: 0,
    });

    await this._uploadWithRetry(async () => {
      await documentService.documents.upload(this.projectUuid, fileState.file);

      this._updateFile(fileState.id, {
        status: 'complete',
        stage: 'complete',
        percent: 100,
        endTime: Date.now(),
      });
    }, fileState);
  }

  /**
   * Upload a file based on its category
   * @private
   * @param {string} category - Category key
   * @param {FileUploadState} fileState - File state
   * @returns {Promise<void>}
   */
  async _uploadFile(category, fileState, retryCount = 0) {
    if (this.isCancelled) return;

    try {
      switch (category) {
        case 'readyImages':
          await this._uploadReadyImage(fileState);
          break;
        case 'heicImages':
          await this._uploadHeicImage(fileState);
          break;
        case 'videos':
          await this._uploadVideo(fileState);
          break;
        case 'documents':
          await this._uploadDocument(fileState);
          break;
        default:
          throw new Error(`Unknown category: ${category}`);
      }
    } catch (error) {
      // Handle rate limiting with retry
      if (error.response?.status === 429 && retryCount < this.rateLimitConfig.maxRetries) {
        logger.warn('UploadManager', `Rate limited, retrying ${fileState.name} (attempt ${retryCount + 1}/${this.rateLimitConfig.maxRetries})`);

        // Wait before retry
        await new Promise(r => setTimeout(r, this.rateLimitConfig.retryDelay));

        // Retry the upload
        return this._uploadFile(category, fileState, retryCount + 1);
      }

      logger.error('UploadManager', `Failed to upload ${fileState.name}:`, error);

      this._updateFile(fileState.id, {
        status: 'error',
        stage: 'error',
        error: error.message || 'Upload failed',
        endTime: Date.now(),
      });
    }
  }

  /**
   * Process upload queue with concurrency control
   * @private
   * @returns {Promise<void>}
   */
  async _processQueue() {
    if (this.isCancelled) return;

    // Check global concurrent limit
    if (this.globalActiveUploads >= this.rateLimitConfig.maxConcurrent) {
      return; // Wait for current uploads to complete
    }

    // Add delay between uploads to prevent rate limiting
    if (this.lastUploadTime) {
      const timeSinceLastUpload = Date.now() - this.lastUploadTime;
      if (timeSinceLastUpload < this.rateLimitConfig.delayBetweenUploads) {
        await new Promise(r => setTimeout(r, this.rateLimitConfig.delayBetweenUploads - timeSinceLastUpload));
      }
    }

    const uploadPromises = [];

    // Process each category independently
    for (const category of Object.keys(this.queue)) {
      // Check global limit again before starting new upload
      if (this.globalActiveUploads >= this.rateLimitConfig.maxConcurrent) {
        break;
      }

      const limit = this.concurrencyLimits[category];
      const active = this.active[category];
      const queue = this.queue[category];

      // Start uploads up to concurrency limit (respecting global limit)
      while (active.size < limit && queue.length > 0 && this.globalActiveUploads < this.rateLimitConfig.maxConcurrent) {
        const fileState = queue.shift();
        active.add(fileState.id);
        this.globalActiveUploads++;
        this.lastUploadTime = Date.now();

        const uploadPromise = this._uploadFile(category, fileState)
          .finally(() => {
            active.delete(fileState.id);
            this.globalActiveUploads--;
            // Continue processing queue
            this._processQueue();
          });

        uploadPromises.push(uploadPromise);
      }
    }

    // Check if all uploads are complete
    if (uploadPromises.length === 0 && this._isQueueEmpty()) {
      this.isProcessing = false;

      const status = this.getStatus();
      logger.log('UploadManager', 'All uploads complete', status);

      this._emit('upload:complete', status);
    }
  }

  /**
   * Check if all queues are empty and no active uploads
   * @private
   * @returns {boolean}
   */
  _isQueueEmpty() {
    const hasQueuedFiles = Object.values(this.queue).some(q => q.length > 0);
    const hasActiveFiles = Object.values(this.active).some(set => set.size > 0);
    return !hasQueuedFiles && !hasActiveFiles;
  }

  /**
   * Enqueue files for upload (adds to current batch if one exists)
   * @public
   * @param {File[]} files - Files to upload
   * @param {string} projectUuid - Project UUID
   * @param {Object} [metadata={}] - Optional metadata for files
   */
  enqueue(files, projectUuid, metadata = {}) {
    if (!files || files.length === 0) {
      logger.warn('UploadManager', 'No files to enqueue');
      return;
    }

    if (!projectUuid) {
      throw new Error('projectUuid is required');
    }

    this.projectUuid = projectUuid;
    this.isCancelled = false;

    // Auto-clear previous batch if no active uploads
    if (!this.hasActiveUploads() && this.files.size > 0) {
      logger.log('UploadManager', 'Auto-clearing ' + this.files.size + ' files from previous batch');
      this.reset();
    }

    logger.log('UploadManager', `Enqueuing ${files.length} files for project ${projectUuid}`);

    // Categorize files
    const categorized = this._categorizeFiles(files);

    // Warn about unsupported files
    if (categorized.unsupported.length > 0) {
      logger.warn('UploadManager', `${categorized.unsupported.length} unsupported files:`,
        categorized.unsupported.map(f => f.name));

      this._emit('upload:unsupported', {
        count: categorized.unsupported.length,
        files: categorized.unsupported.map(f => f.name),
      });
    }

    // Create file states and add to queues
    const typeMap = {
      readyImages: 'photo',
      heicImages: 'heic',
      videos: 'video',
      documents: 'document',
    };

    for (const [category, categoryFiles] of Object.entries(categorized)) {
      if (category === 'unsupported') continue;

      const type = typeMap[category];
      categoryFiles.forEach(file => {
        const fileState = this._createFileState(file, type);
        this.files.set(fileState.id, fileState);
        this.queue[category].push(fileState);

        logger.log('UploadManager', `Queued ${file.name} as ${type} in ${category}`);
      });
    }

    // Emit upload start event
    this._emit('upload:start', {
      total: this.files.size,
      categories: Object.fromEntries(
        Object.entries(categorized).map(([k, v]) => [k, v.length])
      ),
    });

    // Auto-update survey status when photos start uploading
    // Only update if there are photo/heic files (not just documents/videos)
    const hasPhotoFiles = categorized.readyImages.length > 0 || categorized.heicImages.length > 0;
    if (hasPhotoFiles && projectUuid) {
      autoUpdateSurveyStatusOnPhotoUpload(projectUuid).catch(err => {
        logger.error('UploadManager', 'Failed to auto-update survey status:', err);
      });
    }

    // Start processing if not already
    if (!this.isProcessing) {
      this.isProcessing = true;
      this._processQueue();
    }
  }

  /**
   * Get current upload status
   * @public
   * @returns {Object} Status summary
   */
  getStatus() {
    const filesArray = Array.from(this.files.values());

    return {
      total: filesArray.length,
      completed: filesArray.filter(f => f.status === 'complete').length,
      failed: filesArray.filter(f => f.status === 'error').length,
      inProgress: filesArray.filter(f =>
        f.status === 'processing' || f.status === 'uploading'
      ).length,
      queued: filesArray.filter(f => f.status === 'queued').length,
      files: filesArray,
    };
  }

  /**
   * Check if there are active uploads
   * @public
   * @returns {boolean}
   */
  hasActiveUploads() {
    const status = this.getStatus();
    return status.inProgress > 0 || status.queued > 0;
  }

  /**
   * Cancel all remaining uploads
   * @public
   */
  cancel() {
    logger.log('UploadManager', 'Cancelling all uploads');

    this.isCancelled = true;
    this.isProcessing = false;

    // Clear queues
    for (const category of Object.keys(this.queue)) {
      this.queue[category] = [];
    }

    // Mark queued files as cancelled
    Array.from(this.files.values())
      .filter(f => f.status === 'queued')
      .forEach(f => {
        this._updateFile(f.id, {
          status: 'error',
          stage: 'error',
          error: 'Cancelled by user',
          endTime: Date.now(),
        });
      });

    this._emit('upload:cancelled', this.getStatus());
  }

  /**
   * Retry failed uploads
   * @public
   */
  async retryFailed() {
    const failedFiles = Array.from(this.files.values())
      .filter(f => f.status === 'error');

    if (failedFiles.length === 0) {
      logger.warn('UploadManager', 'No failed files to retry');
      return;
    }

    logger.log('UploadManager', `Retrying ${failedFiles.length} failed uploads`);

    this.isCancelled = false;

    // Reset failed files and re-queue
    failedFiles.forEach(fileState => {
      fileState.status = 'queued';
      fileState.stage = 'pending';
      fileState.error = null;
      fileState.percent = 0;

      const category = this._getCategoryForType(fileState.type);
      this.queue[category].push(fileState);
    });

    this._emit('upload:retry', { count: failedFiles.length });

    // Restart processing
    if (!this.isProcessing) {
      this.isProcessing = true;
      this._processQueue();
    }
  }

  /**
   * Clear completed uploads from state
   * @public
   */
  clearCompleted() {
    const completedIds = Array.from(this.files.values())
      .filter(f => f.status === 'complete')
      .map(f => f.id);

    completedIds.forEach(id => this.files.delete(id));

    logger.log('UploadManager', `Cleared ${completedIds.length} completed uploads`);

    this._emit('upload:cleared', { count: completedIds.length });
  }

  /**
   * Full reset - clear ALL files from state (completed, failed, everything)
   * Called when starting a fresh batch or closing the modal after completion
   * @public
   */
  reset() {
    this.files.clear();
    this.globalActiveUploads = 0;
    this.lastUploadTime = null;

    for (const category of Object.keys(this.queue)) {
      this.queue[category] = [];
    }
    for (const category of Object.keys(this.active)) {
      this.active[category].clear();
    }

    this.isProcessing = false;
    this.isCancelled = false;

    logger.log('UploadManager', 'Full reset - all state cleared');
    this._emit('upload:cleared', { count: 0 });
  }

  /**
   * Subscribe to upload events
   * @public
   * @param {Function} callback - Event callback (event, data) => void
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Unsubscribe from upload events
   * @public
   * @param {Function} callback - Callback to remove
   */
  unsubscribe(callback) {
    this.subscribers.delete(callback);
  }
}

// Export singleton instance
export const uploadManager = UploadManager.getInstance();
export default uploadManager;
