# Release Bundle Script for Skyfire Mobile App
# This script increments version numbers for Android and iOS, then creates a release bundle

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('major', 'minor', 'patch')]
    [string]$BumpType = 'patch',

    [Parameter(Mandatory=$false)]
    [switch]$AndroidOnly,

    [Parameter(Mandatory=$false)]
    [switch]$iOSOnly,

    [Parameter(Mandatory=$false)]
    [switch]$SkipBundle
)

Write-Host "=== Skyfire Release Bundle Script ===" -ForegroundColor Cyan
Write-Host ""

# Paths
$ProjectRoot = $PSScriptRoot
$PackageJsonPath = Join-Path $ProjectRoot "package.json"
$AndroidBuildGradlePath = Join-Path $ProjectRoot "android\app\build.gradle"
$iOSInfoPlistPath = Join-Path $ProjectRoot "ios\skyfire\Info.plist"

# Read current package.json
$PackageJson = Get-Content $PackageJsonPath -Raw | ConvertFrom-Json
$CurrentVersion = $PackageJson.version
Write-Host "Current version: $CurrentVersion" -ForegroundColor Yellow

# Parse version
$VersionParts = $CurrentVersion -split '\.'
$Major = [int]$VersionParts[0]
$Minor = [int]$VersionParts[1]
$Patch = [int]$VersionParts[2]

# Bump version based on type
switch ($BumpType) {
    'major' {
        $Major++
        $Minor = 0
        $Patch = 0
    }
    'minor' {
        $Minor++
        $Patch = 0
    }
    'patch' {
        $Patch++
    }
}

$NewVersion = "$Major.$Minor.$Patch"
Write-Host "New version: $NewVersion" -ForegroundColor Green
Write-Host ""

# Update package.json
Write-Host "Updating package.json..." -ForegroundColor Cyan
$PackageJsonContent = Get-Content $PackageJsonPath -Raw
$VersionPattern = "`"version`":\s*`"$CurrentVersion`""
$PackageJsonContent = $PackageJsonContent -replace $VersionPattern, "`"version`": `"$NewVersion`""
Set-Content -Path $PackageJsonPath -Value $PackageJsonContent -NoNewline
Write-Host "package.json updated" -ForegroundColor Green

# Update Android
if (-not $iOSOnly) {
    Write-Host ""
    Write-Host "Updating Android versions..." -ForegroundColor Cyan

    # Read build.gradle
    $BuildGradleContent = Get-Content $AndroidBuildGradlePath -Raw

    # Extract current versionCode
    if ($BuildGradleContent -match 'versionCode\s+(\d+)') {
        $CurrentVersionCode = [int]$Matches[1]
        $NewVersionCode = $CurrentVersionCode + 1
        Write-Host "  versionCode: $CurrentVersionCode -> $NewVersionCode" -ForegroundColor Yellow
        $BuildGradleContent = $BuildGradleContent -replace 'versionCode\s+\d+', "versionCode $NewVersionCode"
    }

    # Update versionName
    if ($BuildGradleContent -match 'versionName\s+"([^"]+)"') {
        $CurrentVersionName = $Matches[1]
        Write-Host "  versionName: $CurrentVersionName -> $NewVersion" -ForegroundColor Yellow
        $BuildGradleContent = $BuildGradleContent -replace 'versionName\s+"[^"]+"', "versionName `"$NewVersion`""
    }

    Set-Content -Path $AndroidBuildGradlePath -Value $BuildGradleContent -NoNewline
    Write-Host "Android build.gradle updated" -ForegroundColor Green
}

# Update iOS
if (-not $AndroidOnly) {
    Write-Host ""
    Write-Host "Updating iOS versions..." -ForegroundColor Cyan

    # Read Info.plist
    $InfoPlistContent = Get-Content $iOSInfoPlistPath -Raw

    # Extract current CFBundleVersion
    $BundleVersionPattern = '<key>CFBundleVersion</key>\s*<string>(\d+)</string>'
    if ($InfoPlistContent -match $BundleVersionPattern) {
        $CurrentBundleVersion = [int]$Matches[1]
        $NewBundleVersion = $CurrentBundleVersion + 1
        Write-Host "  CFBundleVersion: $CurrentBundleVersion -> $NewBundleVersion" -ForegroundColor Yellow
        $InfoPlistContent = $InfoPlistContent -replace $BundleVersionPattern, "<key>CFBundleVersion</key>`n  <string>$NewBundleVersion</string>"
    }

    # Update CFBundleShortVersionString
    $ShortVersionPattern = '<key>CFBundleShortVersionString</key>\s*<string>([^<]+)</string>'
    if ($InfoPlistContent -match $ShortVersionPattern) {
        $CurrentShortVersion = $Matches[1]
        Write-Host "  CFBundleShortVersionString: $CurrentShortVersion -> $NewVersion" -ForegroundColor Yellow
        $InfoPlistContent = $InfoPlistContent -replace $ShortVersionPattern, "<key>CFBundleShortVersionString</key>`n  <string>$NewVersion</string>"
    }

    Set-Content -Path $iOSInfoPlistPath -Value $InfoPlistContent -NoNewline
    Write-Host "iOS Info.plist updated" -ForegroundColor Green
}

# Build Android Release Bundle
if (-not $SkipBundle -and -not $iOSOnly) {
    Write-Host ""
    Write-Host "Building Android release bundle..." -ForegroundColor Cyan
    Write-Host ""

    Push-Location (Join-Path $ProjectRoot "android")

    try {
        # Clean previous builds
        Write-Host "Cleaning previous builds..." -ForegroundColor Yellow
        if (Test-Path ".\gradlew.bat") {
            & .\gradlew.bat clean
        } else {
            & gradle clean
        }

        Write-Host ""
        Write-Host "Building release AAB..." -ForegroundColor Yellow
        if (Test-Path ".\gradlew.bat") {
            & .\gradlew.bat bundleRelease
        } else {
            & gradle bundleRelease
        }

        Write-Host ""
        Write-Host "Android release bundle created!" -ForegroundColor Green

        $BundlePath = "app\build\outputs\bundle\release\app-release.aab"
        if (Test-Path $BundlePath) {
            $FullPath = Resolve-Path $BundlePath
            Write-Host "Bundle location: $FullPath" -ForegroundColor Cyan
        }

    } catch {
        Write-Host "Build failed: $_" -ForegroundColor Red
        Pop-Location
        exit 1
    }

    Pop-Location
}

Write-Host ""
Write-Host "=== Release Summary ===" -ForegroundColor Cyan
Write-Host "Version: $CurrentVersion -> $NewVersion" -ForegroundColor Green
if (-not $iOSOnly) {
    Write-Host "Android versionCode: $CurrentVersionCode -> $NewVersionCode" -ForegroundColor Green
}
if (-not $AndroidOnly) {
    Write-Host "iOS CFBundleVersion: $CurrentBundleVersion -> $NewBundleVersion" -ForegroundColor Green
}
Write-Host ""
Write-Host "Release preparation complete!" -ForegroundColor Green
Write-Host ""

# Show next steps
if (-not $SkipBundle) {
    Write-Host "Next steps:" -ForegroundColor Cyan
    if (-not $iOSOnly) {
        Write-Host "  - Upload AAB to Google Play Console" -ForegroundColor White
    }
    if (-not $AndroidOnly) {
        Write-Host "  - Build iOS release in Xcode and upload to App Store Connect" -ForegroundColor White
    }
    Write-Host "  - Commit version changes to git" -ForegroundColor White
}
