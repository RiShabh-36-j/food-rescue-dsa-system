# PowerShell script to reset database to synthetic seed data
Write-Host "Triggering database reset..." -ForegroundColor Yellow
$res = Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/system/reset-demo" -Method POST
Write-Host $res.message -ForegroundColor Green
