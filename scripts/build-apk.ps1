<#
Builds the debug APK on Windows without hitting the 260-character path limit.

Why a copy: the C++ part of the React Native build mirrors every source path inside its build folder, and
Windows' build tool (Ninja 1.10.2, bundled with the Android SDK) cannot open paths over 260 characters. So the
project is copied to a very short folder ($Short) and the C++ build folder is moved to another short one
($Staging). Nothing in the SDK is modified.

Usage (PowerShell, from anywhere):
  .\scripts\build-apk.ps1            # copy, build, copy the APK to dist\
  .\scripts\build-apk.ps1 -Prebuild  # also regenerate android\ (needed after a native dependency or app.json change)

Edit the four paths below for your machine. Takes about 8 minutes.
#>
param([switch]$Prebuild)

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
robocopy $Project $Short /MIR /XD '.git' '.expo' '.claude' 'dist' "$Project\android" "$Short\android" /XF '*.log' /NFL /NDL /NJH /NJS /NP /R:1 /W:1 | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy failed ($LASTEXITCODE)" }

Push-Location $Short
try {
  if ($Prebuild -or -not (Test-Path "$Short\android\gradlew.bat")) {
    Write-Host 'Generating android\ ...'
    npx expo prebuild --platform android --no-install
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

  $props = "$Short\android\gradle.properties"
  $p = [IO.File]::ReadAllText($props)
  if (-not $p.Contains('preferIPv4Stack')) {
    $p = [regex]::Replace($p, '(org\.gradle\.jvmargs=[^\r\n]*)', '$1 -Djava.net.preferIPv4Stack=true')
    [IO.File]::WriteAllText($props, $p, (New-Object Text.UTF8Encoding $false))
  }

  $env:JAVA_HOME = $jdk.FullName
  $env:GRADLE_USER_HOME = $GradleHome
  $env:ANDROID_HOME = $Sdk
  $env:ANDROID_SDK_ROOT = $Sdk
  Push-Location "$Short\android"
  try { .\gradlew.bat assembleDebug --console=plain } finally { Pop-Location }
  if ($LASTEXITCODE -ne 0) { throw "Gradle failed ($LASTEXITCODE)" }
} finally {
  Pop-Location
}

New-Item -ItemType Directory -Force "$Project\dist" | Out-Null
Copy-Item "$Short\android\app\build\outputs\apk\debug\app-debug.apk" "$Project\dist\saath-debug.apk" -Force
Write-Host "Done: $Project\dist\saath-debug.apk"
Write-Host 'Install: copy it to the phone and open it, or: adb install -r dist\saath-debug.apk'
