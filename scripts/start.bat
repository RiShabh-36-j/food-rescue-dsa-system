@echo off
REM ========================================================
REM FOOD RESCUE — Launch Script (SAKEC AIDS Microproject)
REM ========================================================

echo Starting C++ Backend Server on port 8080...
start "Food Rescue C++ Backend" cmd /c "backend\food_rescue_backend.exe"

timeout /t 2 /nobreak > nul

echo Starting Frontend on port 3000...
cd frontend
start "Food Rescue Frontend" cmd /c "npm run dev -- --host 127.0.0.1 --port 3000"

echo.
echo ========================================================
echo FOOD RESCUE IS RUNNING!
echo Frontend Dashboard: http://127.0.0.1:3000
echo Backend API Server: http://127.0.0.1:8080
echo ========================================================
echo.
pause
