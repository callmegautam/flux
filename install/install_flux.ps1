# Variables
$githubRepoUrl = "https://github.com/callmegautam/flux/archive/refs/heads/main.zip"
$tempZip = "$env:TEMP\flux.zip"
$extractPath = "$env:TEMP\flux"

$programFilesPath = "C:\Program Files\nodejs"
$programFilesFluxPath = Join-Path $programFilesPath "node_modules\flux"

$appDataPath = Join-Path $env:USERPROFILE "AppData\Roaming\npm"
$appDataFluxPath = Join-Path $appDataPath "node_modules\flux"

# Check admin
$adminCheck = [Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
if (-not $adminCheck.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "Please run this script as Administrator." -ForegroundColor Red
    Write-Host "Press any key to exit..."
    [void][System.Console]::ReadKey($true)
    exit 1
}

# Create necessary directories if missing
if (-not (Test-Path $programFilesFluxPath)) {
    New-Item -Path $programFilesFluxPath -ItemType Directory -Force | Out-Null
}
if (-not (Test-Path $appDataFluxPath)) {
    New-Item -Path $appDataFluxPath -ItemType Directory -Force | Out-Null
}
if (-not (Test-Path $appDataPath)) {
    New-Item -Path $appDataPath -ItemType Directory -Force | Out-Null
}

# Download
Write-Host "Downloading flux repository..."
Invoke-WebRequest -Uri $githubRepoUrl -OutFile $tempZip

# Extract
Write-Host "Extracting flux repository..."
Expand-Archive -Path $tempZip -DestinationPath $extractPath -Force

# Move extracted content (handle folder naming like flux-main)
$extractedContent = Get-ChildItem -Path $extractPath | Where-Object { $_.PSIsContainer }

if ($extractedContent.Count -eq 1) {
    $sourcePath = $extractedContent[0].FullName
    $destinationPath = Join-Path $extractPath "flux"

    if (-not (Test-Path $destinationPath)) {
        New-Item -Path $destinationPath -ItemType Directory -Force | Out-Null
    }

    Write-Host "Moving extracted content from '$sourcePath' to '$destinationPath'..."
    Move-Item -Path (Join-Path $sourcePath "*") -Destination $destinationPath -Force
    Remove-Item -Path $sourcePath -Recurse -Force
} else {
    Write-Host "Unexpected archive structure. Exiting." -ForegroundColor Red
    exit 1
}

# Move flux folder to Program Files node_modules
Write-Host "Moving flux folder to $programFilesFluxPath ..."
if (Test-Path $programFilesFluxPath) {
    Remove-Item -Path $programFilesFluxPath -Recurse -Force
}
Move-Item -Path (Join-Path $extractPath "flux") -Destination $programFilesFluxPath -Force

# Run npm install in flux folder
Set-Location -Path $programFilesFluxPath
Write-Host "Running npm install in $programFilesFluxPath ..."
try {
    npm install
} catch {
    Write-Host "Error running npm install. Make sure npm is in your PATH." -ForegroundColor Red
    Write-Host $_.Exception.Message
    Write-Host "Press any key to exit..."
    [void][System.Console]::ReadKey($true)
    exit 1
}

# Copy flux executables from install folder to Program Files and AppData
$fluxInstallFolder = Join-Path $programFilesFluxPath "install"
$execFiles = @("flux", "flux.cmd", "flux.ps1")

foreach ($file in $execFiles) {
    $sourceFile = Join-Path $fluxInstallFolder $file
    $destFileProgramFiles = Join-Path $programFilesPath $file
    $destFileAppData = Join-Path $appDataPath $file

    if (Test-Path $sourceFile) {
        Write-Host "Copying $file from flux install folder to Program Files nodejs folder..."
        Copy-Item -Path $sourceFile -Destination $destFileProgramFiles -Force

        Write-Host "Copying $file to AppData npm folder..."
        Copy-Item -Path $sourceFile -Destination $destFileAppData -Force
    } else {
        Write-Host "Warning: $file not found at $sourceFile, skipping copy."
    }
}

# Copy flux folder to AppData node_modules after npm install
Write-Host "Copying flux folder to AppData node_modules..."
if (Test-Path $appDataFluxPath) {
    Remove-Item -Path $appDataFluxPath -Recurse -Force
}
Copy-Item -Path $programFilesFluxPath -Destination $appDataFluxPath -Recurse -Force

# Cleanup temp files
Write-Host "Cleaning up temporary files..."
if (Test-Path $tempZip) { Remove-Item $tempZip -Force }
if (Test-Path $extractPath) { Remove-Item $extractPath -Recurse -Force }

Write-Host "Flux installation complete!" -ForegroundColor Green
Write-Host "Press any key to exit..."
[void][System.Console]::ReadKey($true)
