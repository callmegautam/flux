$githubRepoUrl = "https://github.com/iamgautamsuthar/flux/archive/refs/heads/main.zip"
$tempZip = "$env:TEMP\flux.zip"
$extractPath = "$env:TEMP\flux"
$fluxInstallPath = "C:\Program Files\nodejs\node_modules\flux"
$nodejsPath = "C:\Program Files\nodejs"

$adminCheck = [Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
if (-not $adminCheck.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "Please run this script as Administrator." -ForegroundColor Red
    Write-Host "Press any key to exit..."
    [void][System.Console]::ReadKey($true)
    exit 1
}

Write-Host "Downloading flux repository..."
Invoke-WebRequest -Uri $githubRepoUrl -OutFile $tempZip

Write-Host "Extracting flux repository..."
Expand-Archive -Path $tempZip -DestinationPath $extractPath -Force

$extractedFolder = Get-ChildItem -Path $extractPath | Where-Object { $_.PSIsContainer } | Select-Object -First 1

if ($null -ne $extractedFolder) {
    Write-Host "Renaming folder to 'flux'..."
    Rename-Item -Path $extractedFolder.FullName -NewName "flux"
} else {
    Write-Host "No folder found to rename." -ForegroundColor Red
    exit 1
}

Write-Host "Moving flux to $fluxInstallPath..."
if (Test-Path $fluxInstallPath) { Remove-Item -Recurse -Force $fluxInstallPath }
Move-Item -Path "$extractPath\flux" -Destination $fluxInstallPath

Set-Location -Path $fluxInstallPath
Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "install" -Wait


Write-Host "Copying install scripts to $nodejsPath..."
$installPath = "$fluxInstallPath\install"

if (Test-Path $installPath) {
    Write-Host "Found install folder. Copying scripts..."
    Copy-Item -Path "$installPath\flux" -Destination "$nodejsPath\flux" -Force
    Copy-Item -Path "$installPath\flux.ps1" -Destination "$nodejsPath\flux.ps1" -Force
    Copy-Item -Path "$installPath\flux.cmd" -Destination "$nodejsPath\flux.cmd" -Force
} else {
    Write-Host "Install folder not found: $installPath" -ForegroundColor Red
}

Write-Host "Flux installation complete!" -ForegroundColor Green

Write-Host "Press any key to exit..."
[void][System.Console]::ReadKey($true)
