/**
 * BATCH IMAGE COMPRESSION SCRIPT
 *
 * Compresses existing photos in S3 without re-uploading
 *
 * Usage:
 *   node scripts/compress-existing-photos.js --project=PROJECT_UUID
 *   node scripts/compress-existing-photos.js --all  (compress all projects)
 *   node scripts/compress-existing-photos.js --project=PROJECT_UUID --dry-run  (test mode)
 *
 * Requirements:
 *   npm install sharp aws-sdk dotenv
 *
 * What it does:
 * 1. Fetches all photos for project(s) from database
 * 2. Downloads original from S3
 * 3. Generates 3 compressed versions:
 *    - thumbnail: 300x300, 70% quality (~50KB)
 *    - preview: 1920px max, 85% quality (~500KB)
 *    - optimized: 4000px max, 90% quality (~2-3MB)
 * 4. Uploads compressed versions to S3
 * 5. Updates database with new URLs
 * 6. Optionally deletes bloated originals
 */

const sharp = require('sharp');
const AWS = require('aws-sdk');
const { Pool } = require('pg');
require('dotenv').config();

// Configuration
const S3_BUCKET = process.env.S3_BUCKET || 'skyfire-media-files';
const S3_REGION = process.env.S3_REGION || 'us-east-1';
const DB_CONNECTION = process.env.DATABASE_URL;

// Compression settings
const COMPRESSION_SETTINGS = {
  thumbnail: {
    width: 300,
    height: 300,
    quality: 70,
    fit: 'cover',
    suffix: '-thumb'
  },
  preview: {
    maxDimension: 1920,
    quality: 85,
    fit: 'inside',
    suffix: '-preview'
  },
  optimized: {
    maxDimension: 4000,
    quality: 90,
    fit: 'inside',
    suffix: '-opt'
  }
};

// Size thresholds
const MIN_SIZE_TO_COMPRESS = 2 * 1024 * 1024; // 2MB
const MIN_DIMENSION_TO_COMPRESS = 2000; // 2000px

// Initialize AWS S3
const s3 = new AWS.S3({
  region: S3_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

// Initialize database
const pool = new Pool({ connectionString: DB_CONNECTION });

// Statistics
const stats = {
  total: 0,
  processed: 0,
  skipped: 0,
  failed: 0,
  bytesOriginal: 0,
  bytesCompressed: 0,
  errors: []
};

/**
 * Main execution
 */
async function main() {
  const args = parseArgs();

  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║   SKYFIRE PHOTO COMPRESSION SCRIPT                ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  if (args.dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  try {
    // Get photos to process
    const photos = await getPhotosToProcess(args.project, args.all);
    stats.total = photos.length;

    console.log(`📊 Found ${photos.length} photos to process\n`);

    if (photos.length === 0) {
      console.log('✅ No photos need compression. Exiting.');
      process.exit(0);
    }

    // Process each photo
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      console.log(`\n[${i + 1}/${photos.length}] Processing: ${photo.filename}`);

      try {
        await processPhoto(photo, args.dryRun);
        stats.processed++;
      } catch (error) {
        console.error(`❌ Failed: ${error.message}`);
        stats.failed++;
        stats.errors.push({ photo: photo.filename, error: error.message });
      }
    }

    // Print summary
    printSummary();

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = {
    project: null,
    all: false,
    dryRun: false
  };

  process.argv.forEach(arg => {
    if (arg.startsWith('--project=')) {
      args.project = arg.split('=')[1];
    } else if (arg === '--all') {
      args.all = true;
    } else if (arg === '--dry-run') {
      args.dryRun = true;
    }
  });

  if (!args.project && !args.all) {
    console.error('❌ Error: Must specify --project=UUID or --all');
    console.log('\nUsage:');
    console.log('  node scripts/compress-existing-photos.js --project=PROJECT_UUID');
    console.log('  node scripts/compress-existing-photos.js --all');
    console.log('  node scripts/compress-existing-photos.js --project=UUID --dry-run');
    process.exit(1);
  }

  return args;
}

/**
 * Get photos to process from database
 */
async function getPhotosToProcess(projectUuid, processAll) {
  let query;
  let params;

  if (processAll) {
    query = `
      SELECT
        m.id,
        m.uuid,
        m.project_id,
        m.file_name as filename,
        m.s3_url as url,
        m.file_size,
        m.thumbnail_url,
        m.preview_url,
        m.original_width,
        m.original_height
      FROM media m
      WHERE m.media_type = 'photo'
        AND m.s3_url IS NOT NULL
        AND m.thumbnail_url IS NULL  -- Not yet compressed
      ORDER BY m.file_size DESC
    `;
    params = [];
  } else {
    query = `
      SELECT
        m.id,
        m.uuid,
        m.project_id,
        m.file_name as filename,
        m.s3_url as url,
        m.file_size,
        m.thumbnail_url,
        m.preview_url,
        m.original_width,
        m.original_height
      FROM media m
      JOIN projects p ON m.project_id = p.id
      WHERE p.uuid = $1
        AND m.media_type = 'photo'
        AND m.s3_url IS NOT NULL
        AND m.thumbnail_url IS NULL  -- Not yet compressed
      ORDER BY m.file_size DESC
    `;
    params = [projectUuid];
  }

  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Process single photo
 */
async function processPhoto(photo, dryRun) {
  // Step 1: Download original from S3
  console.log(`  📥 Downloading from S3...`);
  const originalBuffer = await downloadFromS3(photo.url);
  const originalSize = originalBuffer.length;
  stats.bytesOriginal += originalSize;

  console.log(`     Size: ${formatBytes(originalSize)}`);

  // Step 2: Get image metadata
  const metadata = await sharp(originalBuffer).metadata();
  console.log(`     Dimensions: ${metadata.width}x${metadata.height}`);

  // Step 3: Check if compression needed
  if (originalSize < MIN_SIZE_TO_COMPRESS &&
      metadata.width < MIN_DIMENSION_TO_COMPRESS &&
      metadata.height < MIN_DIMENSION_TO_COMPRESS) {
    console.log(`  ⏭️  SKIPPED (already small enough)`);
    stats.skipped++;
    return;
  }

  if (dryRun) {
    console.log(`  🔍 DRY RUN - Would compress to:`);
    console.log(`     - Thumbnail: ~50KB`);
    console.log(`     - Preview: ~${estimateCompressedSize(metadata, 'preview')}`);
    console.log(`     - Optimized: ~${estimateCompressedSize(metadata, 'optimized')}`);
    return;
  }

  // Step 4: Generate compressed versions
  console.log(`  🔧 Compressing...`);
  const compressed = await compressImage(originalBuffer, photo.filename);

  const totalCompressed = compressed.thumbnail.size + compressed.preview.size + compressed.optimized.size;
  stats.bytesCompressed += totalCompressed;

  console.log(`     ✅ Thumbnail: ${formatBytes(compressed.thumbnail.size)}`);
  console.log(`     ✅ Preview: ${formatBytes(compressed.preview.size)}`);
  console.log(`     ✅ Optimized: ${formatBytes(compressed.optimized.size)}`);
  console.log(`     💾 Saved: ${formatBytes(originalSize - totalCompressed)} (${Math.round((1 - totalCompressed/originalSize) * 100)}%)`);

  // Step 5: Upload to S3
  console.log(`  📤 Uploading compressed versions...`);
  const urls = await uploadCompressedToS3(photo, compressed);

  // Step 6: Update database
  console.log(`  💾 Updating database...`);
  await updateDatabaseUrls(photo.id, urls, metadata);

  console.log(`  ✅ COMPLETE`);
}

/**
 * Download file from S3
 */
async function downloadFromS3(url) {
  const key = url.replace('https://skyfire-media-files.s3.amazonaws.com/', '');

  const params = {
    Bucket: S3_BUCKET,
    Key: key
  };

  const data = await s3.getObject(params).promise();
  return data.Body;
}

/**
 * Compress image to multiple sizes
 */
async function compressImage(buffer, filename) {
  const results = {};

  // Thumbnail
  results.thumbnail = {
    buffer: await sharp(buffer)
      .resize(COMPRESSION_SETTINGS.thumbnail.width, COMPRESSION_SETTINGS.thumbnail.height, {
        fit: COMPRESSION_SETTINGS.thumbnail.fit,
        position: 'center'
      })
      .jpeg({ quality: COMPRESSION_SETTINGS.thumbnail.quality })
      .toBuffer(),
    suffix: COMPRESSION_SETTINGS.thumbnail.suffix
  };
  results.thumbnail.size = results.thumbnail.buffer.length;

  // Preview
  results.preview = {
    buffer: await sharp(buffer)
      .resize(COMPRESSION_SETTINGS.preview.maxDimension, COMPRESSION_SETTINGS.preview.maxDimension, {
        fit: COMPRESSION_SETTINGS.preview.fit,
        withoutEnlargement: true
      })
      .jpeg({ quality: COMPRESSION_SETTINGS.preview.quality })
      .toBuffer(),
    suffix: COMPRESSION_SETTINGS.preview.suffix
  };
  results.preview.size = results.preview.buffer.length;

  // Optimized original
  results.optimized = {
    buffer: await sharp(buffer)
      .resize(COMPRESSION_SETTINGS.optimized.maxDimension, COMPRESSION_SETTINGS.optimized.maxDimension, {
        fit: COMPRESSION_SETTINGS.optimized.fit,
        withoutEnlargement: true
      })
      .jpeg({ quality: COMPRESSION_SETTINGS.optimized.quality })
      .toBuffer(),
    suffix: COMPRESSION_SETTINGS.optimized.suffix
  };
  results.optimized.size = results.optimized.buffer.length;

  return results;
}

/**
 * Upload compressed versions to S3
 */
async function uploadCompressedToS3(photo, compressed) {
  const urls = {};
  const baseKey = photo.url.replace('https://skyfire-media-files.s3.amazonaws.com/', '').replace(/\.[^.]+$/, '');

  for (const [type, data] of Object.entries(compressed)) {
    const key = `${baseKey}${data.suffix}.jpg`;

    await s3.putObject({
      Bucket: S3_BUCKET,
      Key: key,
      Body: data.buffer,
      ContentType: 'image/jpeg',
      CacheControl: 'max-age=31536000' // 1 year
    }).promise();

    urls[type] = `https://skyfire-media-files.s3.amazonaws.com/${key}`;
  }

  return urls;
}

/**
 * Update database with new URLs
 */
async function updateDatabaseUrls(photoId, urls, metadata) {
  const query = `
    UPDATE media
    SET
      thumbnail_url = $1,
      preview_url = $2,
      s3_url = $3,
      original_width = $4,
      original_height = $5,
      was_compressed = true,
      updated_at = NOW()
    WHERE id = $6
  `;

  await pool.query(query, [
    urls.thumbnail,
    urls.preview,
    urls.optimized,
    metadata.width,
    metadata.height,
    photoId
  ]);
}

/**
 * Estimate compressed size (for dry run)
 */
function estimateCompressedSize(metadata, type) {
  const pixels = metadata.width * metadata.height;
  let estimatedBytes;

  if (type === 'preview') {
    estimatedBytes = Math.min(pixels * 0.15, 500 * 1024); // ~0.15 bytes per pixel, max 500KB
  } else {
    estimatedBytes = Math.min(pixels * 0.25, 3 * 1024 * 1024); // ~0.25 bytes per pixel, max 3MB
  }

  return formatBytes(estimatedBytes);
}

/**
 * Print summary statistics
 */
function printSummary() {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║              COMPRESSION SUMMARY                   ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  console.log(`Total Photos:      ${stats.total}`);
  console.log(`✅ Processed:      ${stats.processed}`);
  console.log(`⏭️  Skipped:        ${stats.skipped}`);
  console.log(`❌ Failed:         ${stats.failed}`);
  console.log(`\nOriginal Size:     ${formatBytes(stats.bytesOriginal)}`);
  console.log(`Compressed Size:   ${formatBytes(stats.bytesCompressed)}`);
  console.log(`Space Saved:       ${formatBytes(stats.bytesOriginal - stats.bytesCompressed)} (${Math.round((1 - stats.bytesCompressed / stats.bytesOriginal) * 100)}%)`);

  if (stats.errors.length > 0) {
    console.log('\n⚠️  Errors:');
    stats.errors.forEach(err => {
      console.log(`   - ${err.photo}: ${err.error}`);
    });
  }

  console.log('\n✅ Done!');
}

/**
 * Format bytes to human-readable
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Run
main().catch(console.error);
