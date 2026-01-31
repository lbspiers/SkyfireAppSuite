#!/usr/bin/env node

/**
 * Patch Flow component syntax in React Native 0.78.3 for Metro 0.81 compatibility
 * Replaces "component(" syntax with "any" type to avoid Metro parsing errors
 */

const fs = require('fs');
const path = require('path');

const files = [
    "node_modules/react-native/Libraries/Components/View/View.js",
    "node_modules/react-native/Libraries/Components/Touchable/TouchableOpacity.js",
    "node_modules/react-native/Libraries/Components/Touchable/TouchableHighlight.js",
    "node_modules/react-native/Libraries/Components/TextInput/TextInput.js",
    "node_modules/react-native/Libraries/Text/Text.js",
    "node_modules/react-native/Libraries/Components/Switch/Switch.js",
    "node_modules/react-native/Libraries/Lists/SectionListModern.js",
    "node_modules/react-native/Libraries/Components/ScrollView/ScrollViewStickyHeader.js",
    "node_modules/react-native/Libraries/Components/ScrollView/ScrollView.js",
    "node_modules/react-native/Libraries/Components/SafeAreaView/SafeAreaView.js",
    "node_modules/react-native/Libraries/Components/ProgressBarAndroid/ProgressBarAndroid.android.js",
    "node_modules/react-native/Libraries/Debugging/DebuggingOverlay.js",
    "node_modules/react-native/Libraries/Components/Button.js",
    "node_modules/react-native/Libraries/ReactNative/AppContainer.js",
    "node_modules/react-native/Libraries/Components/ActivityIndicator/ActivityIndicator.js",
    "node_modules/react-native/Libraries/Components/LayoutConformance/LayoutConformance.js",
    "node_modules/react-native/Libraries/Components/Pressable/Pressable.js",
    "node_modules/react-native/Libraries/Components/TextInput/TextInput.flow.js",
    "node_modules/react-native/Libraries/ReactNative/renderApplication.js",
    "node_modules/react-native/Libraries/ReactNative/getCachedComponentWithDebugName.js",
    "node_modules/react-native/Libraries/Interaction/InteractionManager.js"
];

let patched = 0;
let skipped = 0;

files.forEach(file => {
    const fullPath = path.join(__dirname, '..', file);

    if (!fs.existsSync(fullPath)) {
        console.log(`  ✗ File not found: ${file}`);
        skipped++;
        return;
    }

    console.log(`Patching: ${file}`);
    let content = fs.readFileSync(fullPath, 'utf8');

    // Find and replace component( syntax
    // Pattern 1: ": component(\n  ref: ...\n  ...props: ...\n) ="
    // Pattern 2: ") as component(...Props)"
    // Pattern 3: "type X = component(...)"
    // Pattern 4: ") as typeof X"
    const regex1 = /:\s*component\s*\(\s*[\s\S]*?\)\s*=/g;
    const regex2 = /\)\s*as\s+component\s*\([^)]*\)/g;
    const regex3 = /type\s+\w+\s*=\s*component\s*\([^)]*\)\s*;/g;
    const regex4 = /\)\s*as\s+typeof\s+\w+;/g;

    let modified = false;

    // Pattern 1: Variable type annotations
    if (regex1.test(content)) {
        content = content.replace(/:\s*component\s*\(\s*[\s\S]*?\)\s*=/g, (match) => {
            return ': any =';
        });
        modified = true;
    }

    // Pattern 2: Export type casts
    // Looking for: export default (...) as component(...)
    const exportAsComponentRegex = /export\s+default\s+\(([^)]+)\)\s+as\s+component\s*\([^)]*\)\s*;/g;
    if (exportAsComponentRegex.test(content)) {
        content = content.replace(/export\s+default\s+\(([^)]+)\)\s+as\s+component\s*\([^)]*\)\s*;/g, (match, expression) => {
            // Refactor to use Flow type annotation instead of TypeScript 'as'
            const componentName = file.split('/').pop().replace('.js', '') + 'Component';
            return `const ${componentName}: any = ${expression};\n\nexport default ${componentName};`;
        });
        modified = true;
    }

    // Pattern 3: Type aliases
    // Looking for: type X = component(...)
    if (regex3.test(content)) {
        content = content.replace(/type\s+(\w+)\s*=\s*component\s*\([^)]*\)\s*;/g, (match, typeName) => {
            return `// Changed component syntax for Metro 0.81 compatibility\ntype ${typeName} = any;`;
        });
        modified = true;
    }

    // Pattern 4: 'as typeof' casts
    // Looking for: module.exports = (...) as typeof X;
    if (regex4.test(content)) {
        content = content.replace(/module\.exports\s*=\s*\(([\s\S]*?)\)\s*as\s+typeof\s+(\w+);/g, (match, expression, typeName) => {
            return `// Changed 'as typeof' syntax for Metro 0.81 compatibility\nconst Exported${typeName}: any = ${expression.trim()};\n\nmodule.exports = Exported${typeName};`;
        });
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`  ✓ Patched`);
        patched++;
    } else {
        console.log(`  - No component syntax found (may already be patched)`);
        skipped++;
    }
});

console.log(`\n=================================`);
console.log(`Patched: ${patched} files`);
console.log(`Skipped: ${skipped} files`);
console.log(`=================================`);

process.exit(0);
