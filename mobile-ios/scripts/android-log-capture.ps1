<# 
  android-log-capture.ps1
  Capture Android logcat output to a file (dump or continuous follow).
  - PowerShell 5.1 compatible
  - Avoids assigning to automatic variables ($PID, $args)
  - Safe string interpolation for tag/level (uses ${} around names)
#>

[CmdletBinding()]
param(
  [string]$DeviceId      = "",          # e.g. emulator-5554
  [string]$OutDir        = ".devlogs",  # output folder (created if missing)
  [switch]$Dump,                        # dump and exit
  [switch]$Follow,                      # follow (continuous). Default if neither Dump/Clear set
  [switch]$Clear,                       # clear device logs and exit
  [int]$Last             = 1000,        # for -Dump: last N lines
  [string]$Tag,                         # filter: log tag
  [ValidateSet("V","D","I","W","E","F","S","*")]
  [string]$Level         = "",          # filter level (e.g. D/W/E). If empty no level filter
  [string]$Format        = "",          # logcat -v <format> (e.g. threadtime, time)
  [int]$TimeoutSec       = 0            # for follow: optional timeout (0 = no timeout)
)

function Write-Info([string]$msg) { Write-Host "[INFO] $msg" }
function Write-Warn([string]$msg) { Write-Warning $msg }
function Write-Err ([string]$msg) { Write-Error $msg }

# --- Resolve & prepare output directory ---
try {
  if (-not [System.IO.Path]::IsPathRooted($OutDir)) {
    $OutDir = Join-Path -Path (Get-Location) -ChildPath $OutDir
  }
  if (-not (Test-Path -LiteralPath $OutDir)) {
    New-Item -ItemType Directory -Path $OutDir -Force | Out-Null
  }
  $resolved = Resolve-Path -LiteralPath $OutDir -ErrorAction Stop
  $OutDir = $resolved.Path
} catch {
  Write-Warn "Could not fully resolve OutDir. Using as-is: $OutDir"
}

# --- Build base adb args (do NOT use $args automatic variable) ---
$adbArgs = @()
if ($DeviceId) { $adbArgs += @('-s', $DeviceId) }

# If Clear, run separate command: adb -s <id> logcat -c
if ($Clear) {
  $clearArgs = $adbArgs + @('logcat','-c')
  Write-Info ("adb {0}" -f ($clearArgs -join ' '))
  & adb @clearArgs
  exit $LASTEXITCODE
}

# Build filter spec (optional) — use ${} to avoid "$Tag:*" parsing issues
$filterSpec = @()
if ($Tag -and $Level) {
  $filterSpec += @("${Tag}:${Level}")
} elseif ($Tag) {
  $filterSpec += @("${Tag}:*")
} elseif ($Level) {
  $filterSpec += @("*:${Level}")
}

# Build logcat command
$adbLogcat = $adbArgs + 'logcat'
if ($Format) { $adbLogcat += @('-v', $Format) }

# Decide mode (default to Follow if neither specified)
$doFollow = $Follow -or (-not $Dump)

# Output file name
$ts = Get-Date -Format "yyyyMMdd_HHmmss"
$devPart = ($DeviceId -replace '[^\w\-\.]', '_')
if (-not $devPart) { $devPart = "device" }
$logPath = Join-Path $OutDir ("logcat_{0}_{1}.txt" -f $devPart, $ts)

if ($Dump) {
  # One-shot dump
  $dumpArgs = @($adbLogcat)
  if ($Last -gt 0) {
    $dumpArgs += @('-d','-t', $Last.ToString())
  } else {
    $dumpArgs += @('-d')
  }
  if ($filterSpec.Count -gt 0) { $dumpArgs += $filterSpec }

  Write-Info ("Dumping logs to: {0}" -f $logPath)
  Write-Info ("adb {0}" -f ($dumpArgs -join ' '))
  $output = & adb @dumpArgs 2>&1
  $output | Out-File -LiteralPath $logPath -Encoding UTF8
  Write-Info ("Saved {0} lines." -f ($output.Count))
  Write-Host $logPath
  exit 0
}

# Follow (continuous)
if ($doFollow) {
  $followArgs = @($adbLogcat)
  if ($filterSpec.Count -gt 0) { $followArgs += $filterSpec }

  Write-Info ("Following logs → {0}" -f $logPath)
  Write-Info ("adb {0}" -f ($followArgs -join ' '))

  # Start Logcat and capture its PID (use $procId, not $pid)
  $p = Start-Process -FilePath "adb" -ArgumentList $followArgs `
        -RedirectStandardOutput $logPath -NoNewWindow -PassThru

  $procId = $p.Id
  Write-Info ("Started logcat PID: {0}" -f $procId)
  Write-Host  ("To stop: taskkill /PID {0} /T /F" -f $procId)

  if ($TimeoutSec -gt 0) {
    if (-not $p.WaitForExit($TimeoutSec * 1000)) {
      Write-Warn "Timeout reached. Stopping logcat PID $procId"
      try { Stop-Process -Id $procId -Force -ErrorAction Stop } catch {}
    }
  } else {
    $p.WaitForExit() | Out-Null
  }

  exit 0
}

Write-Err "No mode selected. Use -Dump or -Follow (default)."
exit 1
