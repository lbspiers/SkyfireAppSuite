/**
 * VERIFICATION SCRIPT - Check compression results
 *
 * Usage: node scripts/verify-compression.js
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function verify() {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║        COMPRESSION VERIFICATION REPORT             ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  try {
    // Total photo count
    const totalResult = await pool.query(`
      SELECT COUNT(*) as total
      FROM media
      WHERE media_type = 'photo'
    `);
    const total = parseInt(totalResult.rows[0].total);

    // Compressed photo count
    const compressedResult = await pool.query(`
      SELECT COUNT(*) as compressed
      FROM media
      WHERE media_type = 'photo'
        AND thumbnail_url IS NOT NULL
    `);
    const compressed = parseInt(compressedResult.rows[0].compressed);

    // Uncompressed photo count
    const uncompressed = total - compressed;

    // Average sizes
    const sizeResult = await pool.query(`
      SELECT
        AVG(file_size) as avg_original_size,
        COUNT(*) FILTER (WHERE file_size > 2000000) as large_files,
        COUNT(*) FILTER (WHERE file_size < 500000) as small_files
      FROM media
      WHERE media_type = 'photo'
        AND thumbnail_url IS NOT NULL
    `);

    const avgSize = parseInt(sizeResult.rows[0].avg_original_size || 0);
    const largeFiles = parseInt(sizeResult.rows[0].large_files || 0);
    const smallFiles = parseInt(sizeResult.rows[0].small_files || 0);

    // Failed compressions
    const failedResult = await pool.query(`
      SELECT
        file_name,
        s3_url,
        file_size
      FROM media
      WHERE media_type = 'photo'
        AND thumbnail_url IS NULL
        AND file_size > 2000000
      ORDER BY file_size DESC
      LIMIT 10
    `);

    // Sample compressed photos
    const sampleResult = await pool.query(`
      SELECT
        file_name,
        file_size,
        original_width,
        original_height,
        thumbnail_url,
        preview_url
      FROM media
      WHERE media_type = 'photo'
        AND thumbnail_url IS NOT NULL
      ORDER BY file_size DESC
      LIMIT 5
    `);

    // Print results
    console.log('📊 OVERALL STATISTICS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total Photos:           ${total}`);
    console.log(`✅ Compressed:          ${compressed} (${Math.round(compressed/total*100)}%)`);
    console.log(`⏭️  Uncompressed:        ${uncompressed}`);
    console.log(`\n📏 SIZE ANALYSIS`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Avg Original Size:      ${formatBytes(avgSize)}`);
    console.log(`Large Files (>2MB):     ${largeFiles}`);
    console.log(`Small Files (<500KB):   ${smallFiles}`);

    if (failedResult.rows.length > 0) {
      console.log(`\n❌ FAILED/UNCOMPRESSED (Top 10 by size)`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      failedResult.rows.forEach((photo, idx) => {
        console.log(`${idx + 1}. ${photo.file_name}`);
        console.log(`   Size: ${formatBytes(photo.file_size)}`);
        console.log(`   URL: ${photo.s3_url.substring(0, 80)}...`);
      });
    }

    console.log(`\n✅ SAMPLE COMPRESSED PHOTOS (Top 5 by original size)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    sampleResult.rows.forEach((photo, idx) => {
      console.log(`${idx + 1}. ${photo.file_name}`);
      console.log(`   Original: ${formatBytes(photo.file_size)} (${photo.original_width}x${photo.original_height})`);
      console.log(`   Thumbnail: ${photo.thumbnail_url ? '✅' : '❌'}`);
      console.log(`   Preview: ${photo.preview_url ? '✅' : '❌'}`);
    });

    console.log(`\n📋 SUMMARY`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (compressed === total) {
      console.log('🎉 ALL PHOTOS COMPRESSED!');
    } else if (compressed > total * 0.9) {
      console.log(`✅ ${Math.round(compressed/total*100)}% compressed - Very good!`);
      if (uncompressed > 0) {
        console.log(`⚠️  ${uncompressed} photos still need compression`);
      }
    } else {
      console.log(`⚠️  Only ${Math.round(compressed/total*100)}% compressed`);
      console.log(`❌ ${uncompressed} photos still need compression`);
    }

    // Performance estimate
    const estimatedLoad = compressed > 0 ? (avgSize / 1024 / 1024 * 0.15) : 0; // Estimate ~15% of original
    console.log(`\n⚡ ESTIMATED PERFORMANCE`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Avg Compressed Size:    ~${formatBytes(avgSize * 0.15)} (estimated)`);
    console.log(`Load Time Per Image:    ~${Math.round(estimatedLoad * 100)}ms (estimated)`);
    console.log(`Expected FPS:           ${estimatedLoad < 1 ? '55-60 ✅' : '30-50 ⚠️'}`);

    console.log('\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

function formatBytes(bytes, decimals = 2) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

verify().catch(console.error);
