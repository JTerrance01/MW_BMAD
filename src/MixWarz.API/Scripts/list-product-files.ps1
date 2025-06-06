# MixWarz Product File Management Script
# This script helps you find and manage uploaded product files

Write-Host "=== MixWarz Product File Locations ===" -ForegroundColor Cyan
Write-Host ""

$apiPath = Split-Path -Parent $PSScriptRoot
$appDataUploads = Join-Path $apiPath "AppData\uploads"
$wwwrootUploads = Join-Path $apiPath "wwwroot\uploads"

Write-Host "API Project Path: $apiPath" -ForegroundColor Yellow
Write-Host ""

# Check AppData uploads (Active file storage)
Write-Host "=== ACTIVE FILE STORAGE (AppData/uploads) ===" -ForegroundColor Green
if (Test-Path $appDataUploads) {
    Write-Host "AppData uploads directory exists: $appDataUploads" -ForegroundColor Green
    
    # List product directories
    $productImages = Join-Path $appDataUploads "products\images"
    $productFiles = Join-Path $appDataUploads "products\files"
    $legacyProductImages = Join-Path $appDataUploads "mixwarz-product-images"
    $legacyProductFiles = Join-Path $appDataUploads "mixwarz-product-files"
    
    Write-Host ""
    Write-Host "Product Images (products/images):" -ForegroundColor Cyan
    if (Test-Path $productImages) {
        $imageFiles = Get-ChildItem $productImages -File
        if ($imageFiles.Count -gt 0) {
            foreach ($file in $imageFiles) {
                $sizeKB = [math]::Round($file.Length/1KB, 2)
                Write-Host "  $($file.Name) ($sizeKB KB)" -ForegroundColor White
            }
        } else {
            Write-Host "  Directory exists but no files found" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  Directory not found" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Product Files (products/files):" -ForegroundColor Cyan
    if (Test-Path $productFiles) {
        $zipFiles = Get-ChildItem $productFiles -File
        if ($zipFiles.Count -gt 0) {
            foreach ($file in $zipFiles) {
                $sizeMB = [math]::Round($file.Length/1MB, 2)
                Write-Host "  $($file.Name) ($sizeMB MB)" -ForegroundColor White
            }
        } else {
            Write-Host "  Directory exists but no files found" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  Directory not found" -ForegroundColor Red
    }
    
    # Check legacy directories
    Write-Host ""
    Write-Host "Legacy Product Images (mixwarz-product-images):" -ForegroundColor Magenta
    if (Test-Path $legacyProductImages) {
        $legacyImages = Get-ChildItem $legacyProductImages -File
        if ($legacyImages.Count -gt 0) {
            foreach ($file in $legacyImages) {
                $sizeKB = [math]::Round($file.Length/1KB, 2)
                Write-Host "  $($file.Name) ($sizeKB KB)" -ForegroundColor White
            }
        } else {
            Write-Host "  Directory exists but no files found" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  Directory not found" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Legacy Product Files (mixwarz-product-files):" -ForegroundColor Magenta
    if (Test-Path $legacyProductFiles) {
        $legacyFiles = Get-ChildItem $legacyProductFiles -File
        if ($legacyFiles.Count -gt 0) {
            foreach ($file in $legacyFiles) {
                $sizeMB = [math]::Round($file.Length/1MB, 2)
                Write-Host "  $($file.Name) ($sizeMB MB)" -ForegroundColor White
            }
        } else {
            Write-Host "  Directory exists but no files found" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  Directory not found" -ForegroundColor Red
    }
    
} else {
    Write-Host "AppData uploads directory not found: $appDataUploads" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== SUMMARY ===" -ForegroundColor Cyan
Write-Host "Active uploads go to: AppData/uploads/ (served at /uploads URL path)" -ForegroundColor Green
Write-Host "Product files should be in: AppData/uploads/products/" -ForegroundColor Yellow
Write-Host "URLs are accessible at: https://localhost:7001/uploads/products/" -ForegroundColor Magenta
Write-Host "" 