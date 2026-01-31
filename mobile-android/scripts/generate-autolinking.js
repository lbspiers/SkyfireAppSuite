#!/usr/bin/env node

/**
 * Generate autolinking.json for RN 0.76 Gradle plugin
 * This script runs `npx react-native config` and generates the autolinking.json file
 * that the Gradle plugin expects.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const outputPath = path.join(__dirname, '../android/build/generated/autolinking/autolinking.json');

console.log('[Autolinking] Generating autolinking.json...');

try {
  // Run react-native config command
  const configOutput = execSync('npx react-native config', {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf8'
  });

  // Parse the output
  const config = JSON.parse(configOutput);

  // The Gradle plugin expects autolinking.json with this structure
  const autolinkingConfig = {
    reactNativeVersion: config.reactNativeVersion || config.version,
    dependencies: config.dependencies || {},
    project: config.project || null
  };

  // If project.android is missing, add it from build.gradle
  if (!autolinkingConfig.project || !autolinkingConfig.project.android) {
    console.log('[Autolinking] project.android missing in config, reading from build.gradle...');

    const buildGradlePath = path.join(__dirname, '../android/app/build.gradle');
    const buildGradle = fs.readFileSync(buildGradlePath, 'utf8');

    // Extract namespace from build.gradle
    const namespaceMatch = buildGradle.match(/namespace\s+["']([^"']+)["']/);
    const applicationIdMatch = buildGradle.match(/applicationId\s+["']([^"']+)["']/);

    const packageName = namespaceMatch ? namespaceMatch[1] : (applicationIdMatch ? applicationIdMatch[1] : 'com.skyfire.solarapp');

    autolinkingConfig.project = {
      android: {
        sourceDir: path.join(__dirname, '../android/app'),
        appName: 'app',
        packageName: packageName,
        applicationId: packageName,
        mainActivity: '.MainActivity',
        watchModeCommandParams: null,
        dependencyConfiguration: 'implementation'
      }
    };

    console.log(`[Autolinking] Using packageName: ${packageName}`);
  }

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write the autolinking.json file
  fs.writeFileSync(outputPath, JSON.stringify(autolinkingConfig, null, 2));

  console.log(`[Autolinking] ✅ Generated: ${outputPath}`);
  console.log(`[Autolinking] Package name: ${autolinkingConfig.project?.android?.packageName}`);
  console.log(`[Autolinking] Dependencies: ${Object.keys(autolinkingConfig.dependencies || {}).length}`);

  process.exit(0);
} catch (error) {
  console.error('[Autolinking] ❌ Error generating autolinking.json:', error.message);
  process.exit(1);
}
