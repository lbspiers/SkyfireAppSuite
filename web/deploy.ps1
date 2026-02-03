# deploy.ps1 - Skyfire PWA Deploy Script (Hardened with Rollback)
# Automatically builds and deploys the Skyfire web app to production
# Usage: .\deploy.ps1
# Rollback: .\deploy.ps1 -Rollback [-RollbackVersion "2026-01-01_1430"]

param(
    [switch]$Rollback,
    [string]$RollbackVersion
)

$ErrorActionPreference = "Stop"

# Configuration
$serverIP = "52.37.200.197"
$sshKeyPath = "C:\Users\logan\Downloads\LightsailDefaultKey-us-west-2.pem"
$remotePath = "/opt/bitnami/apache/htdocs/webapp/"
$appURL = "https://skyfireapp.io"
$backupDir = "/opt/bitnami/backups/webapp"
$maxBackups = 5

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

function Backup-CurrentVersion {
    param([string]$Version)

    Write-Host ""
    Write-Host "Backing up current version..." -ForegroundColor Yellow

    $backupPath = "$backupDir/$Version"

    # Build bash command to run on remote server (using single quotes to avoid PowerShell parsing)
    $tailNum = $maxBackups + 1
    $backupCmd = 'mkdir -p ' + $backupDir + '; if [ -d "' + $remotePath + '" ] && [ "$(ls -A ' + $remotePath + ' 2>/dev/null)" ]; then cp -r ' + $remotePath + ' ' + $backupPath + '; echo "Backup created: ' + $backupPath + '"; cd ' + $backupDir + '; ls -t | tail -n +' + $tailNum + ' | xargs -r rm -rf; echo "Old backups cleaned"; else echo "No existing version to backup"; fi'

    ssh -i $sshKeyPath bitnami@$serverIP $backupCmd

    if ($LASTEXITCODE -eq 0) {
        Write-Host ('      OK: Backup complete: ' + $backupPath) -ForegroundColor Green
        return $true
    } else {
        Write-Host '      WARNING: Backup failed, continuing anyway...' -ForegroundColor Yellow
        return $false
    }
}

function Restore-Backup {
    param([string]$Version)

    Write-Host ""
    Write-Host "Rolling back to version: $Version" -ForegroundColor Yellow

    # Build bash command to run on remote server (using single quotes to avoid PowerShell parsing)
    $restoreCmd = 'if [ -d "' + $backupDir + '/' + $Version + '" ]; then rm -rf ' + $remotePath + '/*; cp -r ' + $backupDir + '/' + $Version + '/* ' + $remotePath + '/; echo "Restored from backup: ' + $Version + '"; else echo "ERROR: Backup not found: ' + $backupDir + '/' + $Version + '"; exit 1; fi'

    ssh -i $sshKeyPath bitnami@$serverIP $restoreCmd

    if ($LASTEXITCODE -eq 0) {
        Write-Host '      OK: Rollback complete!' -ForegroundColor Green

        # Fix permissions after restore
        $permissionCmd = 'sudo find ' + $remotePath + ' -type d -exec chmod 755 ' + '{}' + ' \;; sudo find ' + $remotePath + ' -type f -exec chmod 644 ' + '{}' + ' \;; sudo chown -R bitnami:daemon ' + $remotePath
        ssh -i $sshKeyPath bitnami@$serverIP $permissionCmd

        return $true
    } else {
        Write-Host '      ERROR: Rollback failed!' -ForegroundColor Red
        return $false
    }
}

function Get-AvailableBackups {
    Write-Host ""
    Write-Host "Available backups:" -ForegroundColor Cyan
    $listCmd = 'ls -lt ' + $backupDir + ' 2>/dev/null | head -10'
    ssh -i $sshKeyPath bitnami@$serverIP $listCmd
}

function Test-HealthCheck {
    param([string]$ExpectedVersion)

    Write-Host "Running health checks..." -ForegroundColor Yellow

    $healthPassed = $true

    try {
        # Check 1: Main page
        $mainPageCheck = Invoke-WebRequest -Uri $appURL -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        if ($mainPageCheck.StatusCode -eq 200) {
            Write-Host '      OK: Main page accessible (HTTP 200)' -ForegroundColor Green
        } else {
            Write-Host ('      WARNING: Main page returned HTTP ' + $mainPageCheck.StatusCode) -ForegroundColor Yellow
            $healthPassed = $false
        }

        # Check 2: Manifest file
        $manifestCheck = Invoke-WebRequest -Uri "$appURL/manifest.json" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        if ($manifestCheck.StatusCode -eq 200) {
            Write-Host '      OK: Manifest accessible (HTTP 200)' -ForegroundColor Green
        } else {
            $healthPassed = $false
        }

        # Check 3: Service worker
        $swCheck = Invoke-WebRequest -Uri "$appURL/sw.js" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        if ($swCheck.StatusCode -eq 200) {
            Write-Host '      OK: Service worker accessible (HTTP 200)' -ForegroundColor Green

            # Verify version in deployed SW (if expected version provided)
            if ($ExpectedVersion) {
                $versionPattern = 'const CACHE_VERSION = ''' + $ExpectedVersion + ''';'
                if ($swCheck.Content -match $versionPattern) {
                    Write-Host "      OK: Service worker version verified: $ExpectedVersion" -ForegroundColor Green
                } else {
                    Write-Host '      WARNING: Service worker version mismatch' -ForegroundColor Yellow
                }
            }
        } else {
            $healthPassed = $false
        }
    } catch {
        Write-Host ('      WARNING: Health check error: ' + $_.Exception.Message) -ForegroundColor Yellow
        $healthPassed = $false
    }

    return $healthPassed
}

# ============================================================================
# ROLLBACK MODE
# ============================================================================

if ($Rollback) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "  ROLLBACK MODE" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow

    # Show available backups
    Get-AvailableBackups

    if ([string]::IsNullOrEmpty($RollbackVersion)) {
        Write-Host ""
        $RollbackVersion = Read-Host "Enter backup folder name to restore (or 'latest')"
    }

    if ($RollbackVersion -eq 'latest') {
        $latestCmd = 'ls -t ' + $backupDir + ' 2>/dev/null | head -1'
        $RollbackVersion = ssh -i $sshKeyPath bitnami@$serverIP $latestCmd
        Write-Host "Latest backup: $RollbackVersion" -ForegroundColor Cyan
    }

    Write-Host ""
    $confirm = Read-Host "Restore version $RollbackVersion? (y/N)"
    if ($confirm -eq 'y') {
        $rollbackSuccess = Restore-Backup -Version $RollbackVersion

        if ($rollbackSuccess) {
            Write-Host ""
            $healthPassed = Test-HealthCheck

            if ($healthPassed) {
                Write-Host ""
                Write-Host "========================================" -ForegroundColor Green
                Write-Host "  ROLLBACK SUCCESSFUL!" -ForegroundColor Green
                Write-Host "========================================" -ForegroundColor Green
                Write-Host ""
                Write-Host "  Restored version: $RollbackVersion" -ForegroundColor White
                Write-Host "  URL: $appURL" -ForegroundColor White
                Write-Host ""
            } else {
                Write-Host ""
                Write-Host "WARNING: Rollback completed but health checks failed!" -ForegroundColor Yellow
                Write-Host "   Manual verification recommended." -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "Rollback cancelled." -ForegroundColor Gray
    }

    exit 0
}

# ============================================================================
# DEPLOYMENT MODE
# ============================================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   SKYFIRE PWA DEPLOYMENT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Auto-generate version based on date and time
$version = Get-Date -Format 'yyyy.MM.dd.HHmm'
$backupVersion = Get-Date -Format 'yyyy-MM-dd_HHmmss'
$buildDate = Get-Date -Format 'yyyy-MM-dd'
$buildTime = Get-Date -Format 'HH:mm'
Write-Host "Step 1/9: Generating deployment version: $version" -ForegroundColor Yellow

# Step 2: Update version.js with deployment info (before build)
$versionJsPath = 'src\config\version.js'
if (Test-Path $versionJsPath) {
    $versionJsContent = Get-Content $versionJsPath -Raw

    # Extract and increment DEPLOYMENT_NUMBER
    if ($versionJsContent -match 'export const DEPLOYMENT_NUMBER = (\d+);') {
        $currentDeploymentNum = [int]$matches[1]
        $newDeploymentNum = $currentDeploymentNum + 1
    } else {
        $newDeploymentNum = 1
    }

    # Update DEPLOYMENT_NUMBER
    $versionJsContent = $versionJsContent -replace 'export const DEPLOYMENT_NUMBER = \d+;.*', "export const DEPLOYMENT_NUMBER = $newDeploymentNum; // Auto-incremented by deploy script"

    # Update DEPLOYMENT_VERSION
    $versionJsContent = $versionJsContent -replace "export const DEPLOYMENT_VERSION = '.*?';.*", "export const DEPLOYMENT_VERSION = '$version'; // Auto-updated by deploy script"

    # Update BUILD_DATE
    $versionJsContent = $versionJsContent -replace "export const BUILD_DATE = '.*?';.*", "export const BUILD_DATE = '$buildDate'; // Auto-updated by deploy script"

    # Update BUILD_TIME
    $versionJsContent = $versionJsContent -replace "export const BUILD_TIME = '.*?';.*", "export const BUILD_TIME = '$buildTime'; // Auto-updated by deploy script"

    Set-Content $versionJsPath $versionJsContent -NoNewline

    Write-Host "      OK: Updated version.js:" -ForegroundColor Green
    Write-Host "         - Deployment #$newDeploymentNum" -ForegroundColor Gray
    Write-Host "         - Version: $version" -ForegroundColor Gray
    Write-Host "         - Date: $buildDate $buildTime" -ForegroundColor Gray
    Write-Host ""
}

# Step 3: Update sw.js version
$swPath = 'public\sw.js'
if (-Not (Test-Path $swPath)) {
    Write-Host 'ERROR: public\sw.js not found!' -ForegroundColor Red
    exit 1
}

$swContent = Get-Content $swPath -Raw
$pattern = 'const CACHE_VERSION = ''.*?'';'
$replacement = 'const CACHE_VERSION = ''' + $version + ''';'
$swContent = $swContent -replace $pattern, $replacement
Set-Content $swPath $swContent -NoNewline

Write-Host '      OK: Updated CACHE_VERSION in sw.js' -ForegroundColor Green
Write-Host ""

# Step 4: Build the app
Write-Host 'Step 2/9: Building React app...' -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host 'ERROR: Build failed! Check errors above.' -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host '      OK: Build completed successfully' -ForegroundColor Green
Write-Host ""

# Step 5: Verify build output exists
if (-Not (Test-Path 'build')) {
    Write-Host 'ERROR: build/ directory not found!' -ForegroundColor Red
    exit 1
}

# Step 6: Calculate actual build size and update both source and built version.js
Write-Host 'Step 3/9: Calculating build size...' -ForegroundColor Yellow

$buildStaticPath = 'build\static'
if (Test-Path $buildStaticPath) {
    $totalBytes = (Get-ChildItem -Path $buildStaticPath -Recurse -File | Measure-Object -Property Length -Sum).Sum
    $totalMB = [math]::Round($totalBytes / 1MB, 1)

    if ($totalMB -lt 1) {
        $totalKB = [math]::Round($totalBytes / 1KB, 0)
        $buildSizeStr = $totalKB.ToString() + ' KB'
    } else {
        $buildSizeStr = $totalMB.ToString() + ' MB'
    }

    Write-Host ('      Total build size: ' + $buildSizeStr) -ForegroundColor Gray

    # Update source version.js (for next build)
    if (Test-Path $versionJsPath) {
        $versionJsContent = Get-Content $versionJsPath -Raw
        $pattern = 'export const BUILD_SIZE = ''.*?'';.*'
        $replacement = 'export const BUILD_SIZE = ''' + $buildSizeStr + '''; // Auto-calculated by deploy script'
        $versionJsContent = $versionJsContent -replace $pattern, $replacement
        Set-Content $versionJsPath $versionJsContent -NoNewline
        Write-Host ('      OK: Updated BUILD_SIZE to ' + $buildSizeStr + ' in source version.js') -ForegroundColor Green
    }

    # Update built version.js (for current deployment)
    $builtVersionFiles = Get-ChildItem -Path 'build\static\js' -Filter 'main.*.js' -File
    if ($builtVersionFiles) {
        foreach ($file in $builtVersionFiles) {
            $builtContent = Get-Content $file.FullName -Raw
            # Update the BUILD_SIZE value in the minified bundle
            $builtContent = $builtContent -replace 'BUILD_SIZE="[^"]*"', "BUILD_SIZE=`"$buildSizeStr`""
            $builtContent = $builtContent -replace 'BUILD_SIZE=''[^'']*''', "BUILD_SIZE='$buildSizeStr'"
            Set-Content $file.FullName $builtContent -NoNewline
        }
        Write-Host ('      OK: Updated BUILD_SIZE to ' + $buildSizeStr + ' in built bundle') -ForegroundColor Green
    }
} else {
    Write-Host '      WARNING: build/static not found, skipping size calculation' -ForegroundColor Yellow
    $buildSizeStr = "Unknown"
}

Write-Host ""

# Step 7: Backup current version before deploying
Write-Host 'Step 4/9: Creating backup...' -ForegroundColor Yellow
$backupSuccess = Backup-CurrentVersion -Version $backupVersion
Write-Host ""

# Step 8: Upload to production server
Write-Host 'Step 5/9: Uploading to production server...' -ForegroundColor Yellow
Write-Host "      Server: bitnami@$serverIP" -ForegroundColor Gray
Write-Host "      Destination: $remotePath" -ForegroundColor Gray
Write-Host ""

if (-Not (Test-Path $sshKeyPath)) {
    Write-Host ('ERROR: SSH key not found at ' + $sshKeyPath) -ForegroundColor Red
    exit 1
}

# Upload build directory contents
# Convert Windows path to Unix-style path for Git's scp
$buildPath = (Resolve-Path ".\build").Path
$unixBuildPath = $buildPath -replace '\\', '/' -replace '^([A-Z]):', '/$1'
& scp -i $sshKeyPath -r "$unixBuildPath/*" "bitnami@${serverIP}:${remotePath}"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host 'ERROR: Upload failed! Check SSH connection and permissions.' -ForegroundColor Red

    # Offer to rollback
    if ($backupSuccess) {
        $rollbackChoice = Read-Host "Rollback to previous version? (y/N)"
        if ($rollbackChoice -eq 'y') {
            Restore-Backup -Version $backupVersion
        }
    }

    exit 1
}

Write-Host ""
Write-Host '      OK: Upload completed successfully' -ForegroundColor Green
Write-Host ""

# Step 9: Fix permissions (CRITICAL - prevents 403 errors)
Write-Host 'Step 6/9: Fixing file permissions...' -ForegroundColor Yellow
Write-Host "      Setting permissions: 755 (directories), 644 (files)" -ForegroundColor Gray

$permissionCmd = 'sudo find ' + $remotePath + ' -type d -exec chmod 755 ' + '{}' + ' \;; sudo find ' + $remotePath + ' -type f -exec chmod 644 ' + '{}' + ' \;; sudo chown -R bitnami:daemon ' + $remotePath
ssh -i $sshKeyPath bitnami@$serverIP $permissionCmd

if ($LASTEXITCODE -ne 0) {
    Write-Host '      WARNING: Permission fix failed (may require manual intervention)' -ForegroundColor Yellow
} else {
    Write-Host '      OK: Permissions fixed' -ForegroundColor Green
}

Write-Host ""

# Step 10: Health check
Write-Host 'Step 7/9: Running health checks...' -ForegroundColor Yellow
$healthPassed = Test-HealthCheck -ExpectedVersion $version
Write-Host ""

# Auto-rollback on health check failure
if (-not $healthPassed) {
    Write-Host "ERROR: Health check failed!" -ForegroundColor Red

    if ($backupSuccess) {
        Write-Host ""
        $autoRollback = Read-Host "Auto-rollback to previous version? (Y/n)"
        if ($autoRollback -ne 'n') {
            $rollbackSuccess = Restore-Backup -Version $backupVersion

            if ($rollbackSuccess) {
                Write-Host ""
                Write-Host "Verifying rollback..."
                $rollbackHealthy = Test-HealthCheck

                if ($rollbackHealthy) {
                    Write-Host ""
                    Write-Host "========================================" -ForegroundColor Green
                    Write-Host "  ROLLBACK SUCCESSFUL" -ForegroundColor Green
                    Write-Host "========================================" -ForegroundColor Green
                    Write-Host ""
                    Write-Host "  Previous version restored and verified" -ForegroundColor White
                    Write-Host "  Failed deployment version: $version" -ForegroundColor Yellow
                    Write-Host ""
                } else {
                    Write-Host ""
                    Write-Host "WARNING: CRITICAL: Rollback completed but health checks still failing!" -ForegroundColor Red
                    Write-Host "   Manual intervention required!" -ForegroundColor Red
                }
            }
        }
    } else {
        Write-Host ""
        Write-Host "WARNING: No backup available for rollback!" -ForegroundColor Yellow
        Write-Host "   Manual intervention may be required." -ForegroundColor Yellow
    }

    exit 1
}

# Step 11: Deployment summary
Write-Host 'Step 8/9: Deployment Summary' -ForegroundColor Yellow
Write-Host "      Version:    $version" -ForegroundColor White
Write-Host "      Build Size: $buildSizeStr" -ForegroundColor White
Write-Host "      URL:        $appURL" -ForegroundColor White
Write-Host "      Deployed:   $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White
Write-Host "      Backup:     $backupVersion" -ForegroundColor Gray
Write-Host ""

# Step 12: Next steps for users
Write-Host 'Step 9/9: User Update Timeline' -ForegroundColor Yellow
Write-Host '      OK: Active users will see Update Available modal within 5 minutes' -ForegroundColor Cyan
Write-Host ('      OK: Update modal will show: Download size: ' + $buildSizeStr) -ForegroundColor Cyan
Write-Host '      OK: New visitors will get the latest version immediately' -ForegroundColor Cyan
Write-Host '      OK: Users can manually check: Account > Check for Updates' -ForegroundColor Cyan
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "   DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Next: Test update flow at $appURL" -ForegroundColor White
Write-Host ""
Write-Host 'Rollback command: .\deploy.ps1 -Rollback' -ForegroundColor Gray
Write-Host ""
