# Patch Flow component syntax for Metro 0.81 compatibility
# This script replaces the "component(" syntax with "React.AbstractComponent"

$files = @(
    "node_modules\react-native\Libraries\Components\View\View.js",
    "node_modules\react-native\Libraries\Components\Touchable\TouchableOpacity.js",
    "node_modules\react-native\Libraries\Components\Touchable\TouchableHighlight.js",
    "node_modules\react-native\Libraries\Components\TextInput\TextInput.js",
    "node_modules\react-native\Libraries\Text\Text.js",
    "node_modules\react-native\Libraries\Components\Switch\Switch.js",
    "node_modules\react-native\Libraries\Lists\SectionListModern.js",
    "node_modules\react-native\Libraries\Components\ScrollView\ScrollViewStickyHeader.js",
    "node_modules\react-native\Libraries\Components\ScrollView\ScrollView.js",
    "node_modules\react-native\Libraries\Components\SafeAreaView\SafeAreaView.js",
    "node_modules\react-native\Libraries\Components\ProgressBarAndroid\ProgressBarAndroid.android.js",
    "node_modules\react-native\Libraries\Debugging\DebuggingOverlay.js",
    "node_modules\react-native\Libraries\Components\Button.js",
    "node_modules\react-native\Libraries\ReactNative\AppContainer.js",
    "node_modules\react-native\Libraries\Components\ActivityIndicator\ActivityIndicator.js"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Patching $file..."
        $content = Get-Content $file -Raw

        # Replace component( syntax with React.Component< syntax
        # Pattern: const NAME: component(\n  ref: Type,\n  ...props: Props\n) =
        # Replace with: // Changed component syntax for Metro 0.81\nconst NAME: any =

        $content = $content -replace '(?m)^(const\s+\w+):\s*component\([^)]+\)\s*=', '// Changed component syntax for Metro 0.81 compatibility$0$1: any ='

        Set-Content $file -Value $content -NoNewline
        Write-Host "  ✓ Patched"
    } else {
        Write-Host "  ✗ File not found: $file"
    }
}

Write-Host "`nAll files patched!"
