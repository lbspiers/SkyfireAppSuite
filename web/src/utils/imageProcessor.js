/**
 * @fileoverview Image Processing Utility for Skyfire Solar
 *
 * Provides HEIC-to-JPEG conversion and image compression for file uploads.
 * HEIC files from iPhones are automatically converted to JPEG format for
 * cross-browser compatibility (Chrome/Firefox don't support HEIC natively).
 *
 * @module utils/imageProcessor
 *
 * @example
 * // Basic usage - process a file before upload
 * import { processFileForUpload } from './imageProcessor';
 *
 * const handleUpload = async (file) => {
 *   const processed = await processFileForUpload(file, ({ stage, percent }) => {
 *     console.log(`${stage}: ${percent}%`);
 *   });
 *   await uploadToServer(processed);
 * };
 *
 * @example
 * // Check if file needs conversion
 * import { isHeicFile } from './imageProcessor';
 *
 * if (isHeicFile(file)) {
 *   console.log('This is an iPhone HEIC photo');
 * }
 *
 * Browser Compatibility:
 * - HEIC conversion: All modern browsers (uses heic2any library)
 * - Image compression: All browsers with Canvas API support
 * - Dynamic import of heic2any keeps bundle size small when not needed
 *
 * Default Settings:
 * - JPEG quality: 0.85 (85%)
 * - Max dimensions: 2048x2048 pixels
 * - Compression threshold: 1MB (files smaller than this skip compression)
 */

/**
 * Check if a file is in HEIC/HEIF format (common iPhone photo format)
 *
 * Detects by both file extension and MIME type since browsers may not
 * correctly identify HEIC MIME types.
 *
 * @param {File} file - File object to check
 * @returns {boolean} True if file is HEIC/HEIF format
 *
 * @example
 * const file = event.target.files[0];
 * if (isHeicFile(file)) {
 *   console.log('iPhone photo detected');
 * }
 */
export const isHeicFile = (file) => {
  const name = file.name.toLowerCase();
  return (
    name.endsWith('.heic') ||
    name.endsWith('.heif') ||
    file.type === 'image/heic' ||
    file.type === 'image/heif'
  );
};

/**
 * Check if a file is an image (including HEIC)
 *
 * @param {File} file - File object to check
 * @returns {boolean} True if file is any image type
 *
 * @example
 * const images = files.filter(isImageFile);
 */
export const isImageFile = (file) => {
  return file.type.startsWith('image/') || isHeicFile(file);
};

/**
 * Convert a HEIC/HEIF file to JPEG format
 *
 * Tries client-side conversion first (heic2any), falls back to server-side
 * conversion if client-side fails. Server-side uses sharp/heif-convert for
 * better codec support.
 *
 * @param {File} heicFile - HEIC file to convert
 * @param {string} projectId - Project UUID (required for server fallback)
 * @param {number} [quality=0.85] - JPEG quality from 0 to 1
 * @returns {Promise<Object>} Conversion result object:
 *   - { file: File, serverConverted: false } if client-side succeeded
 *   - { file: null, url: string, fileName: string, serverConverted: true } if server-side succeeded
 * @throws {Error} If both client and server conversion fail
 *
 * @example
 * const result = await convertHeicToJpeg(heicFile, projectId);
 * if (result.serverConverted) {
 *   // File already uploaded to S3, use result.url
 * } else {
 *   // File converted locally, upload result.file to S3
 * }
 */
export const convertHeicToJpeg = async (heicFile, projectId, quality = 0.85) => {
  // Step 1: Try client-side conversion first (faster when it works)
  try {
    console.log('🔥 [imageProcessor] Starting client-side HEIC conversion:', heicFile.name);

    // Dynamically import heic2any to avoid loading unless needed
    const heic2any = (await import('heic2any')).default;

    console.log('🔥 [imageProcessor] heic2any loaded, starting conversion...');

    const jpegBlob = await heic2any({
      blob: heicFile,
      toType: 'image/jpeg',
      quality,
    });

    // heic2any can return array for multi-image HEIC, handle both cases
    const blob = Array.isArray(jpegBlob) ? jpegBlob[0] : jpegBlob;

    console.log('🔥 [imageProcessor] Client-side conversion successful, JPEG size:', blob.size);

    // Create new File with .jpg extension
    const newName = heicFile.name
      .replace(/\.heic$/i, '.jpg')
      .replace(/\.heif$/i, '.jpg');

    const resultFile = new File([blob], newName, { type: 'image/jpeg' });

    console.log('🔥 [imageProcessor] Created JPEG file:', newName, 'size:', resultFile.size);

    return {
      file: resultFile,
      serverConverted: false,
    };
  } catch (clientError) {
    console.warn('🔥 [imageProcessor] Client-side HEIC conversion failed, trying server fallback:', clientError.message);
  }

  // Step 2: Fall back to server-side conversion
  try {
    console.log('🔥 [imageProcessor] Attempting server-side HEIC conversion...');

    const formData = new FormData();
    formData.append('file', heicFile);
    formData.append('projectId', projectId);
    formData.append('quality', quality.toString());

    // Get auth token
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    const response = await fetch('https://api.skyfireapp.io/media/convert-heic', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server conversion failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    console.log('🔥 [imageProcessor] Server-side conversion successful:', {
      url: data.url,
      fileName: data.fileName,
      size: data.convertedSize
    });

    return {
      file: null,
      url: data.url,
      fileName: data.fileName,
      fileSize: data.convertedSize,
      serverConverted: true,
    };
  } catch (serverError) {
    console.error('🔥 [imageProcessor] Server-side HEIC conversion failed:', serverError);

    // Both client and server failed
    throw new Error(
      `Could not convert ${heicFile.name}: Both client-side and server-side conversion failed. ` +
      `The file may be corrupted or in an unsupported format. Please try converting to JPG manually.`
    );
  }
};

/**
 * Compress an image by resizing and reducing JPEG quality
 *
 * Maintains aspect ratio when resizing. Uses Canvas API for processing.
 * Output is always JPEG format regardless of input format.
 *
 * @param {File} file - Image file to compress
 * @param {Object} [options] - Compression options
 * @param {number} [options.maxWidth=2048] - Maximum width in pixels
 * @param {number} [options.maxHeight=2048] - Maximum height in pixels
 * @param {number} [options.quality=0.85] - JPEG quality from 0 to 1
 * @returns {Promise<File>} Compressed image as JPEG File
 * @throws {Error} If image cannot be loaded or canvas fails
 *
 * @example
 * // Default compression (max 2048px, 85% quality)
 * const compressed = await compressImage(largePhoto);
 *
 * @example
 * // Custom settings for thumbnails
 * const thumbnail = await compressImage(photo, {
 *   maxWidth: 400,
 *   maxHeight: 400,
 *   quality: 0.7
 * });
 */
export const compressImage = async (file, options = {}) => {
  const {
    maxWidth = 2048,
    maxHeight = 2048,
    quality = 0.85,
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      URL.revokeObjectURL(img.src); // Clean up

      let { width, height } = img;

      // Calculate new dimensions maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Canvas toBlob failed'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Image load failed'));
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * Process a file for upload - main orchestration function
 *
 * Handles the complete processing pipeline:
 * 1. HEIC Detection & Conversion (if needed - tries client first, then server)
 * 2. Compression (if file > 1MB)
 *
 * Non-image files pass through unchanged.
 *
 * @param {File} file - File to process
 * @param {string} projectId - Project UUID (required for server-side HEIC fallback)
 * @param {Function} [onProgress] - Progress callback
 * @param {Object} onProgress.progress - Progress info
 * @param {string} onProgress.progress.stage - Current stage: 'converting' | 'compressing'
 * @param {number} onProgress.progress.percent - Progress percentage 0-100
 * @returns {Promise<Object>} Processed result:
 *   - { file: File, serverConverted: false } if needs S3 upload
 *   - { url: string, fileName: string, serverConverted: true } if already uploaded
 *
 * @example
 * const result = await processFileForUpload(file, projectId, ({ stage, percent }) => {
 *   console.log(`${stage}: ${percent}%`);
 * });
 * if (result.serverConverted) {
 *   // Skip S3 upload, file already on server
 * } else {
 *   // Upload result.file to S3
 * }
 */
export const processFileForUpload = async (file, projectId, onProgress = () => {}) => {
  // Skip non-image files
  if (!isImageFile(file)) {
    return { file, serverConverted: false };
  }

  let processedFile = file;
  let serverConverted = false;

  // Step 1: Convert HEIC if needed
  if (isHeicFile(file)) {
    try {
      onProgress({ stage: 'converting', percent: 0 });
      const conversionResult = await convertHeicToJpeg(file, projectId);
      onProgress({ stage: 'converting', percent: 100 });

      if (conversionResult.serverConverted) {
        // Server already converted and uploaded to S3
        console.log('🔥 [imageProcessor] Server-converted file, skipping compression and upload');
        return conversionResult;
      }

      processedFile = conversionResult.file;
    } catch (error) {
      // If HEIC conversion fails, throw a user-friendly error
      throw new Error(
        `Could not process ${file.name}: ${error.message || 'HEIC conversion failed'}.`
      );
    }
  }

  // Step 2: Compress if file is large (> 1MB)
  const ONE_MB = 1024 * 1024;
  if (processedFile.size > ONE_MB && processedFile.type.startsWith('image/')) {
    try {
      onProgress({ stage: 'compressing', percent: 0 });
      processedFile = await compressImage(processedFile);
      onProgress({ stage: 'compressing', percent: 100 });
    } catch (error) {
      // If compression fails, log but continue with uncompressed file
      console.warn(`Image compression failed for ${file.name}, uploading original:`, error);
      processedFile = file;
    }
  }

  return { file: processedFile, serverConverted: false };
};

export default {
  isHeicFile,
  isImageFile,
  convertHeicToJpeg,
  compressImage,
  processFileForUpload,
};
