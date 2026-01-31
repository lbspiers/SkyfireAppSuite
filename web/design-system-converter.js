#!/usr/bin/env node

/**
 * SKYFIRE DESIGN SYSTEM CONVERTER
 *
 * Automatically converts hardcoded values to design tokens.
 * Outputs unmapped values that need manual review.
 *
 * Usage:
 *   node design-system-converter.js --scan          # Dry run - show what would change
 *   node design-system-converter.js --fix           # Apply fixes
 *   node design-system-converter.js --fix --verbose # Apply fixes with details
 */

const fs = require('fs');
const path = require('path');

// ============================================
// TOKEN MAPPINGS - Add more as needed
// ============================================

const COLOR_MAP = {
  // Primary/Brand
  '#FD7332': 'var(--color-primary)',
  '#fd7332': 'var(--color-primary)',
  '#B92011': 'var(--color-primary-dark)',
  '#b92011': 'var(--color-primary-dark)',
  '#FF8C42': 'var(--color-primary-light)',
  '#ff8c42': 'var(--color-primary-light)',

  // Backgrounds
  '#0C1F3F': 'var(--bg-page)',
  '#0c1f3f': 'var(--bg-page)',
  '#0A1628': 'var(--bg-panel)',
  '#0a1628': 'var(--bg-panel)',
  '#111C2E': 'var(--bg-surface)',
  '#111c2e': 'var(--bg-surface)',
  '#213454': 'var(--bg-elevated)',
  '#2E4161': 'var(--bg-input-hover)',
  '#2e4161': 'var(--bg-input-hover)',

  // Grayscale
  '#F9FAFB': 'var(--gray-50)',
  '#f9fafb': 'var(--gray-50)',
  '#F3F4F6': 'var(--gray-100)',
  '#f3f4f6': 'var(--gray-100)',
  '#E5E7EB': 'var(--gray-200)',
  '#e5e7eb': 'var(--gray-200)',
  '#D1D5DB': 'var(--gray-300)',
  '#d1d5db': 'var(--gray-300)',
  '#9CA3AF': 'var(--gray-400)',
  '#9ca3af': 'var(--gray-400)',
  '#6B7280': 'var(--gray-500)',
  '#6b7280': 'var(--gray-500)',
  '#4B5563': 'var(--gray-600)',
  '#4b5563': 'var(--gray-600)',
  '#374151': 'var(--gray-700)',
  '#1F2937': 'var(--gray-800)',
  '#1f2937': 'var(--gray-800)',
  '#111827': 'var(--gray-900)',

  // Status
  '#10B981': 'var(--color-success)',
  '#10b981': 'var(--color-success)',
  '#4CAF50': 'var(--color-success)',
  '#4caf50': 'var(--color-success)',
  '#22C55E': 'var(--color-success)',
  '#22c55e': 'var(--color-success)',
  '#3B82F6': 'var(--color-info)',
  '#3b82f6': 'var(--color-info)',
  '#F59E0B': 'var(--color-warning)',
  '#f59e0b': 'var(--color-warning)',
  '#FF9800': 'var(--color-warning)',
  '#ff9800': 'var(--color-warning)',
  '#EF4444': 'var(--color-error)',
  '#ef4444': 'var(--color-error)',
  '#F44336': 'var(--color-error)',
  '#f44336': 'var(--color-error)',
  '#DC2626': 'var(--color-danger)',
  '#dc2626': 'var(--color-danger)',

  // Accent
  '#0EA5E9': 'var(--color-link)',
  '#0ea5e9': 'var(--color-link)',
  '#2563EB': 'var(--color-accent-blue-dark)',
  '#2563eb': 'var(--color-accent-blue-dark)',
  '#60A5FA': 'var(--color-accent-blue-light)',
  '#60a5fa': 'var(--color-accent-blue-light)',

  // Project Status (keep these - they're semantic)
  '#E6C800': 'var(--status-sales)',
  '#e6c800': 'var(--status-sales)',
  '#FFA300': 'var(--status-site-survey)',
  '#ffa300': 'var(--status-site-survey)',
  '#FF0000': 'var(--status-revisions)',
  '#ff0000': 'var(--status-revisions)',
  '#7FDB51': 'var(--status-permits)',
  '#7fdb51': 'var(--status-permits)',
  '#00B140': 'var(--status-install)',
  '#00b140': 'var(--status-install)',
  '#00B7C2': 'var(--status-commissioning)',
  '#00b7c2': 'var(--status-commissioning)',
  '#6A0DAD': 'var(--status-pto)',
  '#6a0dad': 'var(--status-pto)',
  '#979797': 'var(--status-on-hold)',

  // Common text colors
  '#FFFFFF': 'var(--text-primary)',
  '#ffffff': 'var(--text-primary)',
  '#fff': 'var(--text-primary)',
  '#FFF': 'var(--text-primary)',
  '#000000': 'var(--gray-900)',
  '#000': 'var(--gray-900)',
};

// Pixel to spacing token (for CSS files)
const SPACING_MAP = {
  '2px': 'var(--spacing-xs)',      // Close enough - 4px
  '4px': 'var(--spacing-xs)',
  '6px': 'var(--spacing-xxs)',
  '8px': 'var(--spacing-tight)',
  '10px': 'var(--spacing-tight)',  // Round to 8px
  '12px': 'var(--spacing-sm)',
  '14px': 'var(--spacing-sm)',     // Round to 12px
  '16px': 'var(--spacing)',
  '18px': 'var(--spacing)',        // Round to 16px
  '20px': 'var(--spacing-md)',
  '24px': 'var(--spacing-loose)',
  '28px': 'var(--spacing-loose)',  // Round to 24px
  '32px': 'var(--spacing-wide)',
  '36px': 'var(--spacing-wide)',   // Round to 32px
  '40px': 'var(--spacing-wide)',   // Round to 32px
  '48px': 'var(--spacing-2xl)',
  '64px': 'var(--spacing-3xl)',
};

// Font sizes
const FONT_SIZE_MAP = {
  '10px': 'var(--text-xs)',        // Round up to 12px
  '11px': 'var(--text-xs)',
  '12px': 'var(--text-xs)',
  '13px': 'var(--text-sm)',        // Round to 14px
  '14px': 'var(--text-sm)',
  '15px': 'var(--text-base)',      // Round to 16px
  '16px': 'var(--text-base)',
  '17px': 'var(--text-lg)',        // Round to 18px
  '18px': 'var(--text-lg)',
  '19px': 'var(--text-xl)',        // Round to 20px
  '20px': 'var(--text-xl)',
  '22px': 'var(--text-2xl)',       // Round to 24px
  '24px': 'var(--text-2xl)',
  '28px': 'var(--text-3xl)',       // Round to 30px
  '30px': 'var(--text-3xl)',
  '32px': 'var(--text-3xl)',
  '36px': 'var(--text-4xl)',       // Round to 40px
  '40px': 'var(--text-4xl)',

  // Rem equivalents
  '0.625rem': 'var(--text-xs)',    // 10px
  '0.75rem': 'var(--text-xs)',     // 12px
  '0.8125rem': 'var(--text-sm)',   // 13px
  '0.875rem': 'var(--text-sm)',    // 14px
  '1rem': 'var(--text-base)',      // 16px
  '1.125rem': 'var(--text-lg)',    // 18px
  '1.25rem': 'var(--text-xl)',     // 20px
  '1.5rem': 'var(--text-2xl)',     // 24px
  '1.875rem': 'var(--text-3xl)',   // 30px
  '2rem': 'var(--text-3xl)',       // 32px
  '2.5rem': 'var(--text-4xl)',     // 40px
};

// Border radius
const RADIUS_MAP = {
  '2px': 'var(--radius-sm)',       // Round to 4px
  '3px': 'var(--radius-sm)',
  '4px': 'var(--radius-sm)',
  '5px': 'var(--radius-md)',       // Round to 8px
  '6px': 'var(--radius-md)',
  '8px': 'var(--radius-md)',
  '10px': 'var(--radius-lg)',      // Round to 12px
  '12px': 'var(--radius-lg)',
  '14px': 'var(--radius-xl)',      // Round to 16px
  '16px': 'var(--radius-xl)',
  '20px': 'var(--radius-xl)',
  '9999px': 'var(--radius-pill)',
  '50%': 'var(--radius-circle)',
};

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  // Directories to scan
  scanDirs: ['src'],

  // File extensions to process
  jsExtensions: ['.js', '.jsx', '.ts', '.tsx'],
  cssExtensions: ['.css'],

  // Files/directories to skip
  skipPatterns: [
    'node_modules',
    'build',
    'dist',
    '.git',
    'tokens.css',      // Don't modify the token source
    'tokens.js',       // Don't modify the token source
    'gradient.js',     // Gradient definitions are OK
    '.min.css',
    '.min.js',
  ],

  // Properties to convert in CSS (spacing)
  spacingProperties: [
    'padding',
    'padding-top',
    'padding-right',
    'padding-bottom',
    'padding-left',
    'margin',
    'margin-top',
    'margin-right',
    'margin-bottom',
    'margin-left',
    'gap',
    'row-gap',
    'column-gap',
    'top',
    'right',
    'bottom',
    'left',
  ],

  // Properties for font-size
  fontSizeProperties: ['font-size'],

  // Properties for border-radius
  radiusProperties: ['border-radius'],
};

// ============================================
// SCANNER & CONVERTER
// ============================================

class DesignSystemConverter {
  constructor(options = {}) {
    this.dryRun = options.dryRun !== false;
    this.verbose = options.verbose || false;
    this.stats = {
      filesScanned: 0,
      filesModified: 0,
      colorsConverted: 0,
      spacingConverted: 0,
      fontSizesConverted: 0,
      radiusConverted: 0,
      inlineStylesFound: 0,
      unmappedColors: new Set(),
      unmappedSpacing: new Set(),
      unmappedFontSizes: new Set(),
      unmappedRadius: new Set(),
    };
  }

  // Get all files to process
  getAllFiles(dir, files = []) {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);

      // Skip ignored patterns
      if (CONFIG.skipPatterns.some(p => fullPath.includes(p))) {
        continue;
      }

      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        this.getAllFiles(fullPath, files);
      } else {
        const ext = path.extname(item);
        if ([...CONFIG.jsExtensions, ...CONFIG.cssExtensions].includes(ext)) {
          files.push(fullPath);
        }
      }
    }

    return files;
  }

  // Convert colors in a string
  convertColors(content, filePath) {
    let modified = content;
    const isJS = CONFIG.jsExtensions.includes(path.extname(filePath));

    // Find all hex colors
    const hexPattern = /#[0-9A-Fa-f]{3,6}\b/g;
    const matches = content.match(hexPattern) || [];

    for (const match of matches) {
      const normalized = match.length === 4
        ? `#${match[1]}${match[1]}${match[2]}${match[2]}${match[3]}${match[3]}`
        : match;

      if (COLOR_MAP[normalized] || COLOR_MAP[normalized.toLowerCase()]) {
        const token = COLOR_MAP[normalized] || COLOR_MAP[normalized.toLowerCase()];

        // In JS/JSX, we need to handle both string contexts and style objects
        if (isJS) {
          // Replace in string literals: '#FD7332' or "#FD7332"
          const stringPattern = new RegExp(`['"]${match}['"]`, 'g');
          const newContent = modified.replace(stringPattern, `'${token}'`);
          if (newContent !== modified) {
            modified = newContent;
            this.stats.colorsConverted++;
            if (this.verbose) {
              console.log(`  Color: ${match} → ${token}`);
            }
          }
        } else {
          // In CSS, direct replacement
          modified = modified.replace(new RegExp(match, 'g'), token);
          this.stats.colorsConverted++;
          if (this.verbose) {
            console.log(`  Color: ${match} → ${token}`);
          }
        }
      } else {
        this.stats.unmappedColors.add(match);
      }
    }

    return modified;
  }

  // Convert spacing in CSS
  convertSpacing(content) {
    let modified = content;

    for (const prop of CONFIG.spacingProperties) {
      // Match property: value patterns
      const pattern = new RegExp(`(${prop}\\s*:\\s*)([0-9]+px)`, 'gi');

      modified = modified.replace(pattern, (match, prefix, value) => {
        const normalized = value.toLowerCase();
        if (SPACING_MAP[normalized]) {
          this.stats.spacingConverted++;
          if (this.verbose) {
            console.log(`  Spacing: ${prop}: ${value} → ${SPACING_MAP[normalized]}`);
          }
          return prefix + SPACING_MAP[normalized];
        } else {
          this.stats.unmappedSpacing.add(value);
          return match;
        }
      });
    }

    return modified;
  }

  // Convert font sizes in CSS
  convertFontSizes(content) {
    let modified = content;

    for (const prop of CONFIG.fontSizeProperties) {
      // Pixel values
      const pxPattern = new RegExp(`(${prop}\\s*:\\s*)([0-9]+px)`, 'gi');
      modified = modified.replace(pxPattern, (match, prefix, value) => {
        const normalized = value.toLowerCase();
        if (FONT_SIZE_MAP[normalized]) {
          this.stats.fontSizesConverted++;
          if (this.verbose) {
            console.log(`  Font: ${prop}: ${value} → ${FONT_SIZE_MAP[normalized]}`);
          }
          return prefix + FONT_SIZE_MAP[normalized];
        } else {
          this.stats.unmappedFontSizes.add(value);
          return match;
        }
      });

      // Rem values
      const remPattern = new RegExp(`(${prop}\\s*:\\s*)([0-9.]+rem)`, 'gi');
      modified = modified.replace(remPattern, (match, prefix, value) => {
        const normalized = value.toLowerCase();
        if (FONT_SIZE_MAP[normalized]) {
          this.stats.fontSizesConverted++;
          if (this.verbose) {
            console.log(`  Font: ${prop}: ${value} → ${FONT_SIZE_MAP[normalized]}`);
          }
          return prefix + FONT_SIZE_MAP[normalized];
        } else {
          this.stats.unmappedFontSizes.add(value);
          return match;
        }
      });
    }

    return modified;
  }

  // Convert border radius in CSS
  convertRadius(content) {
    let modified = content;

    for (const prop of CONFIG.radiusProperties) {
      const pattern = new RegExp(`(${prop}\\s*:\\s*)([0-9]+px|50%)`, 'gi');

      modified = modified.replace(pattern, (match, prefix, value) => {
        const normalized = value.toLowerCase();
        if (RADIUS_MAP[normalized]) {
          this.stats.radiusConverted++;
          if (this.verbose) {
            console.log(`  Radius: ${prop}: ${value} → ${RADIUS_MAP[normalized]}`);
          }
          return prefix + RADIUS_MAP[normalized];
        } else {
          this.stats.unmappedRadius.add(value);
          return match;
        }
      });
    }

    return modified;
  }

  // Count inline styles in JS files
  countInlineStyles(content) {
    const matches = content.match(/style\s*=\s*\{\{/g) || [];
    return matches.length;
  }

  // Process a single file
  processFile(filePath) {
    const ext = path.extname(filePath);
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = content;

    this.stats.filesScanned++;

    const isJS = CONFIG.jsExtensions.includes(ext);
    const isCSS = CONFIG.cssExtensions.includes(ext);

    if (isJS) {
      // Count inline styles (can't auto-fix these easily)
      const inlineCount = this.countInlineStyles(content);
      if (inlineCount > 0) {
        this.stats.inlineStylesFound += inlineCount;
        if (this.verbose) {
          console.log(`\n⚠️  ${filePath}: ${inlineCount} inline styles (manual fix needed)`);
        }
      }

      // Convert colors in JS
      modified = this.convertColors(modified, filePath);
    }

    if (isCSS) {
      // Convert colors
      modified = this.convertColors(modified, filePath);

      // Convert spacing
      modified = this.convertSpacing(modified);

      // Convert font sizes
      modified = this.convertFontSizes(modified);

      // Convert border radius
      modified = this.convertRadius(modified);
    }

    // Write changes
    if (modified !== content) {
      this.stats.filesModified++;

      if (this.dryRun) {
        console.log(`\n📝 Would modify: ${filePath}`);
      } else {
        fs.writeFileSync(filePath, modified, 'utf8');
        console.log(`\n✅ Modified: ${filePath}`);
      }
    }
  }

  // Run the converter
  run(baseDir) {
    console.log('🔍 Skyfire Design System Converter');
    console.log('==================================\n');
    console.log(`Mode: ${this.dryRun ? 'DRY RUN (no changes)' : 'APPLYING FIXES'}`);
    console.log(`Scanning: ${baseDir}\n`);

    const files = this.getAllFiles(baseDir);

    for (const file of files) {
      this.processFile(file);
    }

    this.printReport();
  }

  // Print final report
  printReport() {
    console.log('\n');
    console.log('📊 CONVERSION REPORT');
    console.log('====================\n');

    console.log(`Files scanned:      ${this.stats.filesScanned}`);
    console.log(`Files modified:     ${this.stats.filesModified}`);
    console.log('');
    console.log(`Colors converted:   ${this.stats.colorsConverted}`);
    console.log(`Spacing converted:  ${this.stats.spacingConverted}`);
    console.log(`Font sizes converted: ${this.stats.fontSizesConverted}`);
    console.log(`Radius converted:   ${this.stats.radiusConverted}`);
    console.log('');
    console.log(`⚠️  Inline styles found: ${this.stats.inlineStylesFound} (manual fix required)`);

    if (this.stats.unmappedColors.size > 0) {
      console.log('\n🎨 UNMAPPED COLORS (need manual review):');
      for (const color of this.stats.unmappedColors) {
        console.log(`   ${color}`);
      }
    }

    if (this.stats.unmappedSpacing.size > 0) {
      console.log('\n📏 UNMAPPED SPACING (need manual review):');
      for (const spacing of this.stats.unmappedSpacing) {
        console.log(`   ${spacing}`);
      }
    }

    if (this.stats.unmappedFontSizes.size > 0) {
      console.log('\n🔤 UNMAPPED FONT SIZES (need manual review):');
      for (const size of this.stats.unmappedFontSizes) {
        console.log(`   ${size}`);
      }
    }

    if (this.stats.unmappedRadius.size > 0) {
      console.log('\n⭕ UNMAPPED BORDER RADIUS (need manual review):');
      for (const radius of this.stats.unmappedRadius) {
        console.log(`   ${radius}`);
      }
    }

    console.log('\n');
    if (this.dryRun) {
      console.log('💡 Run with --fix to apply these changes');
    } else {
      console.log('✅ Changes applied!');
    }
  }
}

// ============================================
// CLI
// ============================================

const args = process.argv.slice(2);
const dryRun = !args.includes('--fix');
const verbose = args.includes('--verbose') || args.includes('-v');

// Find the src directory
let baseDir = './src';
if (!fs.existsSync(baseDir)) {
  baseDir = '../src';
}
if (!fs.existsSync(baseDir)) {
  console.error('❌ Cannot find src directory. Run from project root.');
  process.exit(1);
}

const converter = new DesignSystemConverter({ dryRun, verbose });
converter.run(baseDir);
