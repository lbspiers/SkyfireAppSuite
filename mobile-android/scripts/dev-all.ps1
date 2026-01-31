<# dev-all-compat.ps1 — Android dev launcher with robust logging + timeouts
   Works on Windows PowerShell 5.1 (no advanced attributes/syntax).

Usage examples:
  powershell -ExecutionPolicy Bypass -File ".\scripts\dev-all-compat.ps1"
  powershell -ExecutionPolicy Bypass -File ".\scripts\dev-all-compat.ps1" -Fresh -ColdBoot -GradleClean
#>

param(
  [string]$Frontend    = (Resolve-Path "..\").Path,              # project root
  [string]$AndroidDir  = ".\android",                             # android folder relative to $Frontend
  [string]$AvdName     = "Pixel_9_Pro_XL_API_35_8",               # your AVD name
  [switch]$Fresh,                                                 # also resets cache and clears logcat
  [switch]$ResetCache,                                            # --reset-cache for Metro
  [switch]$ColdBoot,                                              # cold boot the AVD
  [switch]$GradleClean,                                           # run gradle clean first
  [switch]$SkipInstall,                                           # build only (no install/launch)
  [string]$AppId       = "com.skyfire.solarapp",                  # package to launch
  [string]$OutDir      = ".devlogs",                              # logs folder (relative to $Frontend unless rooted)
  [int]$BootTimeoutSec = 300                                      # emulator boot timeout
)

# Fresh implies reset Metro cache
if ($Fresh) { $ResetCache = $true }

function TS($msg, $level = "INFO") {
  $ts = Get-Date -Format "HH:mm:ss"
  $color = "Cyan"
  if ($level -eq "OK")   { $color = "Green" }
  elseif ($level -eq "WARN") { $color = "Yellow" }
  elseif ($level -eq "ERR")  { $color = "Red" }
  Write-Host ("[{0}] [{1}] {2}" -f $ts, $level, $msg) -ForegroundColor $color
}

function Resolve-Adb {
  $cands = @()
  if ($env:ANDROID_SDK_ROOT) { $cands += (Join-Path $env:ANDROID_SDK_ROOT 'platform-tools\adb.exe') }
  if ($env:ANDROID_HOME)     { $cands += (Join-Path $env:ANDROID_HOME     'platform-tools\adb.exe') }
  if ($env:LOCALAPPDATA)     { $cands += (Join-Path $env:LOCALAPPDATA     'Android\Sdk\platform-tools\adb.exe') }
  foreach ($p in $cands) { if ($p -and (Test-Path $p)) { return $p } }
  throw "adb.exe not found. Install Android Platform Tools or set ANDROID_SDK_ROOT."
}

function Resolve-Emulator {
  $cands = @()
  if ($env:ANDROID_SDK_ROOT) { $cands += (Join-Path $env:ANDROID_SDK_ROOT 'emulator\emulator.exe') }
  if ($env:ANDROID_HOME)     { $cands += (Join-Path $env:ANDROID_HOME     'emulator\emulator.exe') }
  if ($env:LOCALAPPDATA)     { $cands += (Join-Path $env:LOCALAPPDATA     'Android\Sdk\emulator\emulator.exe') }
  foreach ($p in $cands) { if ($p -and (Test-Path $p)) { return $p } }
  throw "emulator.exe not found. Install Android SDK or set ANDROID_SDK_ROOT."
}

function Stop-Metro {
  TS "Stopping Metro on port 8081 (if running)..."
  try {
    Get-Process node -ErrorAction SilentlyContinue | ForEach-Object {
      Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }
  } catch { TS ("Stop-Metro: " + $_.Exception.Message) "WARN" }
}

function Wait-DeviceReady($Adb, $DeviceId, $TimeoutSec) {
  & $Adb -s $DeviceId wait-for-device | Out-Null
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  do {
    $state   = (& $Adb -s $DeviceId get-state 2>$null).Trim()
    $sysBoot = (& $Adb -s $DeviceId shell getprop sys.boot_completed 2>$null).Trim()
    $devBoot = (& $Adb -s $DeviceId shell getprop dev.bootcomplete 2>$null).Trim()
    $anim    = (& $Adb -s $DeviceId shell getprop init.svc.bootanim 2>$null).Trim()

    TS ("device={0} state={1} sys.boot_completed={2} dev.bootcomplete={3} bootanim={4} t={5}s" -f `
        $DeviceId,$state,$sysBoot,$devBoot,$anim,[int]$sw.Elapsed.TotalSeconds)

    if ($state -eq 'device' -and $sysBoot -eq '1' -and $devBoot -eq '1' -and $anim -eq 'stopped') {
      TS "Device reports boot complete." "OK"; return
    }
    Start-Sleep 2
  } while ($sw.Elapsed.TotalSeconds -lt $TimeoutSec)
  throw "Emulator did not reach boot-complete within $TimeoutSec seconds. Try -ColdBoot or wipe data."
}

function Stop-AndroidApp($Adb, $DeviceId, $PackageName) {
  if (-not $PackageName) { return }
  try {
    & $Adb -s $DeviceId shell am force-stop $PackageName 2>$null
    TS ("Force-stopped {0}." -f $PackageName)
  } catch { TS ("Stop-AndroidApp: " + $_.Exception.Message) "WARN" }
}

# ---------------- Begin ----------------
Push-Location $Frontend
$adb       = Resolve-Adb
$emulator  = Resolve-Emulator
$logScript = Join-Path (Join-Path $Frontend "scripts") "android-log-capture.ps1"

TS ("Using adb: {0}" -f $adb)
TS ("Using emulator: {0}" -f $emulator)
TS ("Frontend: {0}" -f $Frontend)

# Optional "fresh" prep
if ($Fresh) {
  Stop-Metro
}

# 1) Start (or reuse) emulator
& $adb start-server | Out-Null
$currentEmulators = (& $adb devices) | Select-String 'emulator-\d+\s+device' | ForEach-Object { ($_ -split '\s+')[0] }

if (-not $currentEmulators) {
  $emuArgs = @('-avd', $AvdName)
  if ($ColdBoot) { $emuArgs += '-no-snapshot-load' }
  $bootNote = if ($ColdBoot) { ' (cold boot)' } else { '' }
  TS ("Launching AVD: {0}{1}" -f $AvdName, $bootNote)
  $emuProc = Start-Process -FilePath $emulator -ArgumentList $emuArgs -PassThru -WindowStyle Normal
  TS ("Emulator PID: {0}" -f $emuProc.Id)
}

# Wait for an emulator-* device to appear
$dev = $null
$appearDeadline = (Get-Date).AddSeconds([Math]::Min(60, $BootTimeoutSec))
do {
  Start-Sleep 1
  $dev = (& $adb devices | Select-String 'emulator-\d+\s+device' |
          ForEach-Object { ($_ -split '\s+')[0] } | Select-Object -First 1)
} while (-not $dev -and (Get-Date) -lt $appearDeadline)

if (-not $dev) { throw "No emulator device appeared. Ensure AVD name is correct and virtualization is enabled." }

TS ("Using device: {0} (waiting for boot...)" -f $dev)
Wait-DeviceReady $adb $dev $BootTimeoutSec
TS "Device ready." "OK"

if ($Fresh -and $AppId) { Stop-AndroidApp $adb $dev $AppId }

# 2) Clear log buffer (Fresh only), then start log capture (background)
try {
  if ($Fresh) {
    TS "Clearing device log buffer..."
    & powershell -NoProfile -ExecutionPolicy Bypass -File $logScript -Clear -DeviceId $dev -OutDir $OutDir
  }
} catch { TS ("Log clear failed: " + $_.Exception.Message) "WARN" }

try {
  $logArgs = @(
    '-NoProfile','-ExecutionPolicy','Bypass',
    '-File', $logScript,
    '-Follow',
    '-OutDir', $OutDir,
    '-DeviceId', $dev,
    '-Format', 'threadtime'   # readable; change to 'time' or 'brief' if you prefer
  )
  TS ("Starting log capture: powershell {0}" -f ($logArgs -join ' '))
  Start-Process -FilePath 'powershell' -ArgumentList $logArgs -WindowStyle Minimized | Out-Null
  TS "Logcat capture started."
} catch {
  TS ("Log capture start failed: " + $_.Exception.Message) "WARN"
}

# 3) Start Metro (new window)
$cacheFlag = if ($ResetCache) { '--reset-cache' } else { '' }
$metroCmd  = "cd `"$Frontend`"; npx react-native start $cacheFlag"
TS ("Starting Metro: {0}" -f $metroCmd)
Start-Process -FilePath 'powershell' -ArgumentList @('-NoExit','-Command', $metroCmd) | Out-Null

# 4) Build / Install / Launch
Push-Location $AndroidDir
try {
  if ($GradleClean) {
    TS "Gradle clean..."
    .\gradlew clean --no-daemon --stacktrace
  }

  $tasksText = (.\gradlew :app:tasks --all) | Out-String
  if ($tasksText -match 'createBundleDebugJsAndAssets') {
    TS "Bundling JS via Gradle (createBundleDebugJsAndAssets)..."
    .\gradlew :app:createBundleDebugJsAndAssets --no-daemon --stacktrace
  } elseif ($tasksText -match 'bundleDebugJsAndAssets') {
    TS "Bundling JS via Gradle (bundleDebugJsAndAssets)..."
    .\gradlew :app:bundleDebugJsAndAssets --no-daemon --stacktrace
  } else {
    TS "Gradle JS bundle task not found. Skipping bundling step." "WARN"
  }

  TS "Assembling debug APK (no install yet)..."
  .\gradlew :app:assembleDebug --no-daemon --stacktrace

  if (-not $SkipInstall) {
    TS "Installing debug build to emulator..."
    .\gradlew :app:installDebug --no-daemon --stacktrace

    if ($AppId) {
      TS ("Launching {0}..." -f $AppId)
      & $adb -s $dev shell monkey -p $AppId -c android.intent.category.LAUNCHER 1 | Out-Null
    }
  } else {
    TS "SkipInstall set: not installing to emulator." "WARN"
  }
}
finally {
  Pop-Location
}

# 5) Footer — ensure logs dir exists, and print where to find & how to snapshot
if ([string]::IsNullOrWhiteSpace($OutDir)) { $OutDir = ".devlogs" }

if ([System.IO.Path]::IsPathRooted($OutDir)) {
  $logsDir = $OutDir
} else {
  $logsDir = Join-Path -Path $Frontend -ChildPath $OutDir
}

if (-not (Test-Path -LiteralPath $logsDir)) {
  New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
}

# Resolve absolute path without PowerShell 7's null-conditional
try {
  $resolved = Resolve-Path -LiteralPath $logsDir -ErrorAction Stop
  if ($resolved -and $resolved.Path) { $logsAbs = $resolved.Path } else { $logsAbs = $logsDir }
} catch { $logsAbs = $logsDir }

TS ("Logs dir: {0}" -f $logsAbs)
TS 'Snapshot logs later with:'

if (-not $dev) { $dev = "emulator-5554" }  # fallback
$dumpCmd = ('  .\scripts\android-log-capture.ps1 -Dump -Last 800 -OutDir "{0}" -DeviceId "{1}"' -f $OutDir, $dev)
Write-Host $dumpCmd

Pop-Location
