
$ErrorActionPreference = 'Stop'

$repo = 'callmegautam/flux'
$installDir = if ($env:FLUX_INSTALL_DIR) { $env:FLUX_INSTALL_DIR } else { Join-Path $env:LOCALAPPDATA 'flux\bin' }

if ([Environment]::Is64BitOperatingSystem -eq $false) {
    throw 'Flux binaries require 64-bit Windows. Alternative: npm i -g fluxpm'
}

$version = $env:FLUX_VERSION
if (-not $version) {
    $version = (Invoke-RestMethod "https://api.github.com/repos/$repo/releases/latest").tag_name
}
if (-not $version) { throw 'Could not determine latest version; set FLUX_VERSION.' }

$asset = 'flux-windows-x64.exe'
$url = "https://github.com/$repo/releases/download/$version/$asset"

Write-Host "Installing flux $version (windows-x64)..."

New-Item -ItemType Directory -Force -Path $installDir | Out-Null
$target = Join-Path $installDir 'flux.exe'
$tmp = Join-Path ([System.IO.Path]::GetTempPath()) "flux-$([guid]::NewGuid()).exe"

Invoke-WebRequest -Uri $url -OutFile $tmp -UseBasicParsing

try {
    $sumsUrl = "https://github.com/$repo/releases/download/$version/SHA256SUMS"
    $sums = (Invoke-WebRequest -Uri $sumsUrl -UseBasicParsing).Content
    $expected = ($sums -split "`n" | Where-Object { $_ -match [regex]::Escape($asset) }) -split '\s+' | Select-Object -First 1
    if ($expected) {
        $actual = (Get-FileHash -Path $tmp -Algorithm SHA256).Hash.ToLower()
        if ($expected.ToLower() -ne $actual) {
            Remove-Item $tmp -Force
            throw "Checksum mismatch for $asset"
        }
    }
} catch [System.Net.WebException] {
}

Move-Item -Path $tmp -Destination $target -Force
Write-Host "Installed flux to $target"

$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
if ($userPath -notlike "*$installDir*") {
    $newPath = if ($userPath) { "$userPath;$installDir" } else { $installDir }
    [Environment]::SetEnvironmentVariable('Path', $newPath, 'User')
    Write-Host ''
    Write-Host "Added $installDir to your PATH."
    Write-Host 'Restart your terminal, then run: flux --help'
} else {
    Write-Host 'Run: flux --help'
}
