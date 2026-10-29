# PowerShell Setup & Build Script
Write-Host "========================================================" -ForegroundColor Green
Write-Host "FOOD RESCUE — Setup & Build Process" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green

if (Test-Path "$env:USERPROFILE\.tools\w64devkit\bin") {
    $env:PATH = "$env:USERPROFILE\.tools\w64devkit\bin;" + $env:PATH
}
if (Test-Path "$env:USERPROFILE\.tools\nodejs") {
    $env:PATH = "$env:USERPROFILE\.tools\nodejs;" + $env:PATH
}

# 1. Compile SQLite amalgamation object if not present
if (!(Test-Path "backend\include\sqlite3.o")) {
    Write-Host "[1/4] Compiling SQLite amalgamation object..." -ForegroundColor Yellow
    gcc -O2 -c backend\include\sqlite3.c -o backend\include\sqlite3.o
}

# 2. Compile C++ Backend
Write-Host "[2/4] Compiling C++ Backend (GCC 16.2 / C++17) ..." -ForegroundColor Yellow
g++ -std=c++17 -O2 -Ibackend\include -Ibackend\src backend\src\main.cpp backend\include\sqlite3.o -o backend\food_rescue_backend.exe -lws2_32 -lwsock32 -lcrypt32

# 3. Compile and Run Automated Tests
Write-Host "[3/4] Compiling & Running 18 Automated DSA Scenarios..." -ForegroundColor Yellow
g++ -std=c++17 -O2 -Ibackend\include -Ibackend\src backend\tests\run_tests.cpp backend\include\sqlite3.o -o backend\tests\run_tests.exe -lws2_32 -lwsock32 -lcrypt32
& "backend\tests\run_tests.exe"

# 4. Install Frontend Dependencies
Write-Host "[4/4] Installing Frontend NPM Packages..." -ForegroundColor Yellow
Set-Location frontend
npm install --no-audit --no-fund
Set-Location ..

Write-Host "========================================================" -ForegroundColor Green
Write-Host "SETUP COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "Run .\scripts\start.ps1 to launch application." -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Green
