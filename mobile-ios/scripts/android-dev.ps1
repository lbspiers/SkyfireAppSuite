# scripts/android-dev.ps1
# Make Gradle use a local cache (so user cache can’t break builds)
$P = (Get-Location).Path
$env:GRADLE_USER_HOME = "$P\android\.gradle-user"

# Turn off the flaky config cache & daemon for this session
$env:GRADLE_OPTS = "-Dorg.gradle.unsafe.configuration-cache=false -Dorg.gradle.daemon=false"

# Ensure JDK 17 (adjust path if yours differs)
if (-not $env:JAVA_HOME -or -not (Test-Path "$env:JAVA_HOME\bin\javac.exe")) {
  $jdk = "C:\Program Files\Eclipse Adoptium\jdk-17"
  if (Test-Path $jdk) { $env:JAVA_HOME = $jdk; $env:PATH = "$env:JAVA_HOME\bin;$env:PATH" }
}

# Metro quality-of-life
$env:REACT_NATIVE_PACKAGER=1