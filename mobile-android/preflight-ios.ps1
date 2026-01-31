param(
  [string]$AppDir = ".",
  # Optional override if your 1024x1024 lives elsewhere
  [string]$SourceIconOverride = ""
)

function Fail($msg) { Write-Host "`n✘ $msg" -ForegroundColor Red; exit 1 }
function Ok($msg)   { Write-Host "✔ $msg" -ForegroundColor Green }
function Warn($msg) { Write-Host "⚠ $msg" -ForegroundColor Yellow }

# Move into app dir and **lock it as absolute**
$AppDir = (Resolve-Path -LiteralPath $AppDir).Path
Set-Location $AppDir

Write-Host "=== iOS Preflight ===`n" -ForegroundColor Cyan

# 1) Install JS deps (prefer npm ci with legacy peer deps)
if (Test-Path package-lock.json) {
  Write-Host "Installing deps with npm ci (legacy peer deps)..."
  npm ci --legacy-peer-deps
  if ($LASTEXITCODE -ne 0) { Fail "Dependency install failed." }
} else {
  Write-Host "No package-lock.json found. Running npm install (legacy peer deps)..."
  npm install --legacy-peer-deps
  if ($LASTEXITCODE -ne 0) { Fail "Dependency install failed." }
}
Ok "Dependencies installed."

# 2) Bundle iOS JS (proves Metro config & assets)
New-Item -ItemType Directory -Force -Path build | Out-Null
Write-Host "Bundling JS for iOS (release)..."
npx react-native bundle `
  --platform ios `
  --dev false `
  --entry-file index.js `
  --bundle-output .\build\main.jsbundle `
  --assets-dest .\build\assets | Out-Host
if ($LASTEXITCODE -ne 0) { Fail "JS bundling failed." } else { Ok "JS bundle built (./build/main.jsbundle)." }

# 3) Check Info.plist for required privacy/icon keys
$plistPath = "ios\skyfire\Info.plist"
if (!(Test-Path $plistPath)) { Fail "Info.plist not found at $plistPath" }

$plistText = Get-Content $plistPath -Raw
$requiredKeys = @(
  "CFBundleIconName",
  "NSPhotoLibraryUsageDescription",
  "NSPhotoLibraryAddUsageDescription",
  "NSCameraUsageDescription",
  "NSSpeechRecognitionUsageDescription",
  "NSMicrophoneUsageDescription",
  "NSLocationWhenInUseUsageDescription"
)
$missing = @()
foreach ($k in $requiredKeys) {
  if ($plistText -notmatch "<key>$k</key>") { $missing += $k }
}
if ($missing.Count -gt 0) {
  Fail ("Missing Info.plist keys: " + ($missing -join ", "))
} else {
  Ok "Info.plist privacy & icon keys present."
}

# 4) AppIcon: self-heal & verify (up to 3 attempts), using ABSOLUTE PATHS + FileStream decode
$iconDirRel = "ios\skyfire\Images.xcassets\AppIcon.appiconset"
if (!(Test-Path $iconDirRel)) { Fail "AppIcon.appiconset not found at $iconDirRel" }
$iconDir = (Resolve-Path -LiteralPath $iconDirRel).Path

Add-Type -AssemblyName System.Drawing
# helpers that always use ABSOLUTE paths and non-caching stream loads
function Get-Full([string]$p) {
  if ([System.IO.Path]::IsPathRooted($p)) { return $p }
  return [System.IO.Path]::GetFullPath((Join-Path (Get-Location).Path $p))
}
function Load-Image([string]$absPath) {
  # Open with FileShare.ReadWrite so concurrent writes/reads are OK; no FromFile caching
  $fs = [System.IO.File]::Open($absPath, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
  try { return [System.Drawing.Image]::FromStream($fs, $false, $false) }
  finally { $fs.Close() }
}
function Save-Png($bmp, [string]$absPath) {
  # Ensure dir exists
  [System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($absPath)) | Out-Null
  $bmp.Save($absPath, [System.Drawing.Imaging.ImageFormat]::Png)
}

function Write-ContentsJson([string]$dirAbs) {
  $json = @{
    images = @(
      @{ idiom="iphone"; size="20x20";  scale="2x"; filename="icon-20@2x.png" },
      @{ idiom="iphone"; size="20x20";  scale="3x"; filename="icon-20@3x.png" },
      @{ idiom="iphone"; size="29x29";  scale="2x"; filename="icon-29@2x.png" },
      @{ idiom="iphone"; size="29x29";  scale="3x"; filename="icon-29@3x.png" },
      @{ idiom="iphone"; size="40x40";  scale="2x"; filename="icon-40@2x.png" },
      @{ idiom="iphone"; size="40x40";  scale="3x"; filename="icon-40@3x.png" },
      @{ idiom="iphone"; size="60x60";  scale="2x"; filename="icon-60@2x.png" },
      @{ idiom="iphone"; size="60x60";  scale="3x"; filename="icon-60@3x.png" },
      @{ idiom="ios-marketing"; size="1024x1024"; scale="1x"; filename="icon-1024.png" }
    )
    info = @{ version = 1; author = "xcode" }
  } | ConvertTo-Json -Depth 5
  Set-Content -LiteralPath (Join-Path $dirAbs 'Contents.json') -Value $json -Encoding UTF8
}

function Resize-From([string]$srcAbs, [int]$w, [int]$h, [string]$destAbs) {
  $img = Load-Image $srcAbs
  try {
    $bmp = New-Object System.Drawing.Bitmap $w,$h
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($img,0,0,$w,$h)
    Save-Png $bmp $destAbs
  } finally {
    if ($null -ne $g) { $g.Dispose() }
    if ($null -ne $bmp) { $bmp.Dispose() }
    if ($null -ne $img) { $img.Dispose() }
  }
}

function Ensure-1024([string]$dirAbs, [string]$overridePath) {
  $master = Join-Path $dirAbs 'icon-1024.png'
  if (Test-Path $master) { return $master }

  $candidates = @()
  if ($overridePath) {
    try {
      $ov = (Resolve-Path -LiteralPath $overridePath -ErrorAction Stop).Path
      $candidates += $ov
    } catch {}
  }
  $guess = Join-Path $AppDir 'src\assets\Images\icon.png'
  if (Test-Path $guess) { $candidates += (Resolve-Path $guess).Path }

  if ($candidates.Count -eq 0) { Fail "No source icon found to build icon-1024.png. Pass -SourceIconOverride <path> if needed." }
  $src = $candidates[0]
  Warn "icon-1024.png missing. Building from: $src"
  Resize-From $src 1024 1024 $master
  return $master
}

function Build-MinimalSet([string]$dirAbs) {
  $master = Ensure-1024 $dirAbs $SourceIconOverride
  # Minimal iPhone set
  Resize-From $master 40  40  (Join-Path $dirAbs 'icon-20@2x.png')
  Resize-From $master 60  60  (Join-Path $dirAbs 'icon-20@3x.png')
  Resize-From $master 58  58  (Join-Path $dirAbs 'icon-29@2x.png')
  Resize-From $master 87  87  (Join-Path $dirAbs 'icon-29@3x.png')
  Resize-From $master 80  80  (Join-Path $dirAbs 'icon-40@2x.png')
  Resize-From $master 120 120 (Join-Path $dirAbs 'icon-40@3x.png')
  Resize-From $master 120 120 (Join-Path $dirAbs 'icon-60@2x.png')
  Resize-From $master 180 180 (Join-Path $dirAbs 'icon-60@3x.png')

  # Legacy dupes
  Copy-Item (Join-Path $dirAbs 'icon-60@2x.png') (Join-Path $dirAbs 'icon-120.png') -Force
  Copy-Item (Join-Path $dirAbs 'icon-60@3x.png') (Join-Path $dirAbs 'icon-180.png') -Force

  Write-ContentsJson $dirAbs
}

function Validate-Icons([string]$dirAbs) {
  $targets = @(
    @{Path='icon-60@2x.png'; W=120; H=120},
    @{Path='icon-60@3x.png'; W=180; H=180},
    @{Path='icon-1024.png';  W=1024; H=1024}
  )
  foreach($t in $targets){
    $p = Join-Path $dirAbs $t.Path
    if (!(Test-Path $p)) { return "Missing $($t.Path)" }
    try {
      $im = Load-Image $p
      $w=$im.Width; $h=$im.Height; $im.Dispose()
      if ($w -ne $t.W -or $h -ne $t.H) {
        return "Wrong size for $($t.Path) (${w}x${h}) expected $($t.W)x$($t.H)"
      }
    } catch {
      return "Decode failed for $($t.Path): $($_.Exception.Message)"
    }
  }
  return $null
}

# Self-healing loop
$maxAttempts = 3
for($attempt=1; $attempt -le $maxAttempts; $attempt++){
  $result = Validate-Icons $iconDir
  if ($null -eq $result) {
    Ok "AppIcon images present with expected sizes. (attempt $attempt/$maxAttempts)"
    break
  } else {
    Warn "Icon check failed: $result (attempt $attempt/$maxAttempts) — rebuilding icon set..."
    Build-MinimalSet $iconDir
    Start-Sleep -Milliseconds 150
    if ($attempt -eq $maxAttempts) {
      Fail "Icon validation kept failing after $maxAttempts attempts. Last error: $result"
    }
  }
}

# 5) Podfile quick sanity: ensure RCTI18nStrings de-dupe snippet exists (optional)
$podfile = "ios\Podfile"
if (Test-Path $podfile) {
  $pf = Get-Content $podfile -Raw
  if ($pf -notmatch "RCTI18nStrings") {
    Warn "Podfile does not contain RCTI18nStrings de-dupe snippet. (May be fine for your current setup.)"
  } else {
    Ok "Podfile includes RCTI18nStrings safeguards."
  }
} else {
  Warn "Podfile not found; skipping Podfile checks."
}

Write-Host "`nAll preflight checks passed. You can try EAS build now." -ForegroundColor Green
