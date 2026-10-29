# PowerShell Launch Script for Food Rescue System
Write-Host "========================================================" -ForegroundColor Green
Write-Host "FOOD RESCUE — Smart Food Redistribution System" -ForegroundColor Green
Write-Host "SAKEC Second Year AIDS Microproject" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Green

# Ensure tools are in PATH if available
if (Test-Path "$env:USERPROFILE\.tools\w64devkit\bin") {
    $env:PATH = "$env:USERPROFILE\.tools\w64devkit\bin;" + $env:PATH
}
if (Test-Path "$env:USERPROFILE\.tools\nodejs") {
    $env:PATH = "$env:USERPROFILE\.tools\nodejs;" + $env:PATH
}

# 1. Start C++ Backend
Write-Host "Starting C++ Backend on http://127.0.0.1:8080 ..." -ForegroundColor Yellow
Start-Process -FilePath "backend\food_rescue_backend.exe"

Start-Sleep -Seconds 2

# 2. Start Frontend
Write-Host "Starting React Frontend on http://127.0.0.1:3000 ..." -ForegroundColor Yellow
Start-Process -FilePath "npm" -ArgumentList "run", "dev", "--", "--host", "127.0.0.1", "--port", "3000" -WorkingDirectory "frontend"

Write-Host ""
Write-Host "System live!" -ForegroundColor Green
Write-Host "Open your browser at: http://127.0.0.1:3000" -ForegroundColor Cyan
Write-Host "Backend API docs at:  http://127.0.0.1:8080/api/health" -ForegroundColor Cyan
