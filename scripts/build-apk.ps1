<#
Builds the debug APK on Windows without hitting the 260-character path limit.

Why a copy: the C++ part of the React Native build mirrors every source path inside its build folder, and
Windows' build tool (Ninja 1.10.2, bundled with the Android SDK) cannot open paths over 260 characters. So the
project is copied to a very short folder ($Short) and the C++ build folder is moved to another short one
($Staging). Nothing in the SDK is modified.

Usage (PowerShell, from anywhere):
  .\scripts\build-apk.ps1            # copy, build, copy the APK to dist\
  .\scripts\build-apk.ps1 -Prebuild  # also regenerate android\ (needed after a native dependency or app.json change)
  .\scripts\build-apk.ps1 -Release   # standalone APK (dist\saath.apk) that works without a PC running

Edit the four paths below for your machine. Takes about 8 minutes.
#>
param([switch]$Prebuild, [switch]$Release, [switch]$Emulator, [int]$GradleMemoryMB = 4096)

$ErrorActionPreference = 'Stop'
$Project = Split-Path -Parent $PSScriptRoot
$Short = 'Z:\s'                                  # short copy of the project
$Staging = 'Z:/c'                                # short folder for the C++ build
$GradleHome = 'Z:\gradle-home'                   # holds gradle-9.4.1-bin.zip and a JDK 17 under jdks\
$Sdk = "$env:LOCALAPPDATA\Android\Sdk"

$jdk = Get-ChildItem "$GradleHome\jdks" -Directory | Where-Object Name -match '17' | Select-Object -First 1
if (-not $jdk) { throw "No JDK 17 found under $GradleHome\jdks" }
if (-not (Test-Path "$GradleHome\gradle-9.4.1-bin.zip")) { throw "Missing $GradleHome\gradle-9.4.1-bin.zip" }

Write-Host "Copying project to $Short ..."
New-Item -ItemType Directory -Force $Short | Out-Null
# Exclude only the project's own dist\ (the APK output) by full path. A bare name 'dist' would also skip the
# dist\ folder inside installed libraries (for example node_modules\abort-controller\dist) and break bundling.
robocopy $Project $Short /MIR /XD "$Project\.git" "$Project\.expo" "$Project\.claude" "$Project\dist" "$Project\android" "$Short\android" "$Short\dist" /XF '*.log' /NFL /NDL /NJH /NJS /NP /R:1 /W:1 | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy failed ($LASTEXITCODE)" }

Push-Location $Short
try {
  if ($Prebuild -or -not (Test-Path "$Short\android\gradlew.bat")) {
    Write-Host 'Generating android\ ...'
    $ErrorActionPreference = 'Continue'
    npx expo prebuild --platform android --no-install
    $prebuildExit = $LASTEXITCODE
    $ErrorActionPreference = 'Stop'
    if ($prebuildExit -ne 0) { throw "expo prebuild failed ($prebuildExit)" }
  }

  # local settings that prebuild overwrites: use the local Gradle zip, and a short C++ build folder
  $wrapper = "$Short\android\gradle\wrapper\gradle-wrapper.properties"
  $w = [IO.File]::ReadAllText($wrapper)
  $w = $w.Replace('https\://services.gradle.org/distributions/gradle-9.4.1-bin.zip', 'file\:///' + ($GradleHome -replace '\\', '/') + '/gradle-9.4.1-bin.zip').Replace('validateDistributionUrl=true', 'validateDistributionUrl=false')
  [IO.File]::WriteAllText($wrapper, $w, (New-Object Text.UTF8Encoding $false))

  $gradle = "$Short\android\app\build.gradle"
  $g = [IO.File]::ReadAllText($gradle)
  if (-not $g.Contains('buildStagingDirectory')) {
    $i = $g.IndexOf('android {')
    $g = $g.Substring(0, $i) + "android {`n    externalNativeBuild {`n        cmake {`n            buildStagingDirectory file('$Staging')`n        }`n    }" + $g.Substring($i + 'android {'.Length)
    [IO.File]::WriteAllText($gradle, $g, (New-Object Text.UTF8Encoding $false))
  }

  # Memory for the build. The generated default (2 GB) is small for a release build with native code; this machine
  # has plenty. Edit $GradleMemoryMB for a smaller PC. -Djava.net.preferIPv4Stack avoids an IPv6 timeout downloading.
  $props = "$Short\android\gradle.properties"
  $p = [IO.File]::ReadAllText($props)
  $jvm = "org.gradle.jvmargs=-Xmx$($GradleMemoryMB)m -XX:MaxMetaspaceSize=1024m -Djava.net.preferIPv4Stack=true"
  $p = [regex]::Replace($p, 'org\.gradle\.jvmargs=[^\r\n]*', $jvm)
  if ($p -notmatch 'kotlin\.daemon\.jvmargs') { $p = $p.TrimEnd() + "`nkotlin.daemon.jvmargs=-Xmx2048m`n" }
  [IO.File]::WriteAllText($props, $p, (New-Object Text.UTF8Encoding $false))

  $env:JAVA_HOME = $jdk.FullName
  $env:GRADLE_USER_HOME = $GradleHome
  $env:ANDROID_HOME = $Sdk
  $env:ANDROID_SDK_ROOT = $Sdk
  Push-Location "$Short\android"
  # Gradle writes harmless warnings to stderr; judge success by its exit code, not by stderr text
  $ErrorActionPreference = 'Continue'
  # Stop Gradle helper processes left over from an earlier build, so the new one starts with the memory free.
  if (Test-Path "$Short\android\gradlew.bat") {
    $before = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    Push-Location "$Short\android"
    try { .\gradlew.bat --stop *> $null } finally { Pop-Location }
    $ErrorActionPreference = $before # put it back as it was: the build below relies on 'Continue'
  }

  # -Release builds a standalone APK with the app's JavaScript inside (it needs no PC running), for the two
  # CPU types real phones use. It is signed with the debug key, so it installs fine but is not a Play Store build.
  try {
    if ($Release -and $Emulator) { .\gradlew.bat assembleRelease '-PreactNativeArchitectures=x86_64' --console=plain }
    elseif ($Release) { .\gradlew.bat assembleRelease '-PreactNativeArchitectures=arm64-v8a,armeabi-v7a' --console=plain }
    elseif ($Emulator) { .\gradlew.bat assembleDebug '-PreactNativeArchitectures=x86_64' --console=plain }
    else { .\gradlew.bat assembleDebug --console=plain }
  } finally { Pop-Location }
  $gradleExit = $LASTEXITCODE
  # Release the build's memory straight away: a Gradle daemon would otherwise stay resident for hours.
  Push-Location "$Short\android"
  try { .\gradlew.bat --stop *> $null } finally { Pop-Location }
  $ErrorActionPreference = 'Stop'
  # (the 'Stop' above is correct here: the build has finished, so errors from now on should stop the script)
  if ($gradleExit -ne 0) { throw "Gradle failed ($gradleExit)" }
} finally {
  Pop-Location
}

New-Item -ItemType Directory -Force "$Project\dist" | Out-Null
if ($Release) { $from = "$Short\android\app\build\outputs\apk\release\app-release.apk"; $name = $(if ($Emulator) { 'saath-x86.apk' } else { 'saath.apk' }) }
else { $from = "$Short\android\app\build\outputs\apk\debug\app-debug.apk"; $name = $(if ($Emulator) { 'saath-debug-x86.apk' } else { 'saath-debug.apk' }) }
Copy-Item $from "$Project\dist\$name" -Force
Write-Host "Done: $Project\dist\$name"
Write-Host "Install: copy it to the phone and open it, or: adb install -r dist\$name"
