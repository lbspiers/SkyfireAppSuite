// Rollback script for dashboard optimization
// Run with: node src/scripts/rollback-optimization.js

const fs = require('fs');
const path = require('path');

console.log("🔄 Rolling back dashboard optimization...\n");

const backupFile = path.join(__dirname, '../../src/navigation/router.tsx.backup');
const targetFile = path.join(__dirname, '../../src/navigation/router.tsx');

if (fs.existsSync(backupFile)) {
  try {
    const backupContent = fs.readFileSync(backupFile, 'utf8');
    fs.writeFileSync(targetFile, backupContent);
    console.log("✅ Router restored from backup");
    console.log("   Dashboard will now use the original (slower) version");
    console.log("\n⚠️  Note: Optimized files are still present but unused:");
    console.log("   - src/utils/batchApiUtils.ts");
    console.log("   - src/api/optimizedProjectService.ts");
    console.log("   - src/screens/app/home/DashboardScreenOptimized.tsx");
    console.log("\nYou can safely delete these if not needed.");
  } catch (error) {
    console.error("❌ Error restoring backup:", error.message);
  }
} else {
  console.log("❌ No backup file found at:", backupFile);
  console.log("\nTo manually rollback:");
  console.log("1. Edit src/navigation/router.tsx");
  console.log("2. Change 'DashboardScreenOptimized' to 'DashboardScreen'");
  console.log("3. Update import from '../screens/app/home/DashboardScreenOptimized'");
  console.log("   to '../screens/app/home/DashboardScreen'");
}