#!/usr/bin/env node

/**
 * Icon Generation Script for Skyfire PWA
 *
 * Generates all required icons for premium desktop PWA experience:
 * - Maskable icons (192px, 512px) with 20% safe zone
 * - Apple icons (120px, 152px, 167px, 180px) for iOS/macOS
 *
 * Usage:
 *   node generate-icons.js
 *
 * Prerequisites:
 *   npm install sharp
 *
 * Input:
 *   Source logo must be at: public/logo512.png
 *   Logo should be square, high resolution, with transparent background
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Configuration
const SOURCE_LOGO = path.join(__dirname, 'public', 'logo512.png');
const OUTPUT_DIR = path.join(__dirname, 'public');

// Brand colors from Skyfire design system
const BRAND_COLORS = {
  primary: '#FD7332',
  navy: '#0C1F3F',
  gradient: {
    start: '#0C1F3F',
    end: '#2E4161'
  }
};

// Icon specifications
const MASKABLE_ICONS = [
  { size: 192, filename: 'logo192-maskable.png', safezone: 0.20 },
  { size: 512, filename: 'logo512-maskable.png', safezone: 0.20 }
];

const APPLE_ICONS = [
  { size: 120, filename: 'apple-icon-120.png', device: 'iPhone (iOS 7-14)' },
  { size: 152, filename: 'apple-icon-152.png', device: 'iPad (iOS 7-14)' },
  { size: 167, filename: 'apple-icon-167.png', device: 'iPad Pro' },
  { size: 180, filename: 'apple-icon-180.png', device: 'iPhone (iOS 8+, Retina)' }
];

/**
 * Check if source logo exists
 */
function checkSourceLogo() {
  if (!fs.existsSync(SOURCE_LOGO)) {
    console.error('❌ Error: Source logo not found at:', SOURCE_LOGO);
    console.error('');
    console.error('Please ensure public/logo512.png exists.');
    console.error('The logo should be:');
    console.error('  - Square (1:1 aspect ratio)');
    console.error('  - High resolution (at least 512x512px)');
    console.error('  - PNG format with transparent background');
    console.error('  - Contains your Skyfire logo/branding');
    process.exit(1);
  }
  console.log('✓ Source logo found:', SOURCE_LOGO);
}

/**
 * Generate maskable icon with safe zone padding
 */
async function generateMaskableIcon(spec) {
  const { size, filename, safezone } = spec;
  const logoSize = Math.floor(size * (1 - safezone * 2)); // Logo takes 60-80% of canvas
  const padding = Math.floor((size - logoSize) / 2);

  try {
    // Read source logo
    const logo = await sharp(SOURCE_LOGO)
      .resize(logoSize, logoSize, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toBuffer();

    // Create canvas with brand color background
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 253, g: 115, b: 50, alpha: 1 } // #FD7332
      }
    })
    .composite([{
      input: logo,
      top: padding,
      left: padding
    }])
    .png()
    .toFile(path.join(OUTPUT_DIR, filename));

    console.log(`  ✓ Generated ${filename} (${size}x${size} with ${safezone * 100}% safe zone)`);
    return true;
  } catch (error) {
    console.error(`  ❌ Failed to generate ${filename}:`, error.message);
    return false;
  }
}

/**
 * Generate Apple icon (simple resize, no padding)
 */
async function generateAppleIcon(spec) {
  const { size, filename, device } = spec;

  try {
    await sharp(SOURCE_LOGO)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 253, g: 115, b: 50, alpha: 1 } // #FD7332 background
      })
      .png()
      .toFile(path.join(OUTPUT_DIR, filename));

    console.log(`  ✓ Generated ${filename} (${size}x${size} for ${device})`);
    return true;
  } catch (error) {
    console.error(`  ❌ Failed to generate ${filename}:`, error.message);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('');
  console.log('====================================');
  console.log('  Skyfire PWA Icon Generator');
  console.log('====================================');
  console.log('');

  // Check prerequisites
  checkSourceLogo();

  // Check if Sharp is installed
  try {
    require.resolve('sharp');
  } catch (e) {
    console.error('❌ Error: sharp package not found');
    console.error('');
    console.error('Please install sharp:');
    console.error('  npm install sharp');
    console.error('');
    process.exit(1);
  }

  console.log('');
  console.log('Generating maskable icons (for macOS native feel)...');
  let maskableSuccess = 0;
  for (const spec of MASKABLE_ICONS) {
    if (await generateMaskableIcon(spec)) {
      maskableSuccess++;
    }
  }

  console.log('');
  console.log('Generating Apple icons (for iOS/macOS devices)...');
  let appleSuccess = 0;
  for (const spec of APPLE_ICONS) {
    if (await generateAppleIcon(spec)) {
      appleSuccess++;
    }
  }

  console.log('');
  console.log('====================================');
  console.log('  Generation Complete!');
  console.log('====================================');
  console.log('');
  console.log(`Maskable icons: ${maskableSuccess}/${MASKABLE_ICONS.length}`);
  console.log(`Apple icons:    ${appleSuccess}/${APPLE_ICONS.length}`);
  console.log('');

  if (maskableSuccess === MASKABLE_ICONS.length && appleSuccess === APPLE_ICONS.length) {
    console.log('✓ All icons generated successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Review generated icons in public/ folder');
    console.log('  2. Test maskable icons at: https://maskable.app/editor');
    console.log('  3. Run: npm run build');
    console.log('  4. Deploy and test on macOS Safari');
    console.log('');
  } else {
    console.error('⚠️  Some icons failed to generate. Please check errors above.');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { generateMaskableIcon, generateAppleIcon };
