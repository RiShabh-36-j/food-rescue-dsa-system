@echo off
REM ========================================================
REM FOOD RESCUE — Setup & Build Script
REM ========================================================

echo [1/3] Compiling C++ Backend...
if not exist "backend\include\sqlite3.o" (
    gcc -O2 -c backend\include\sqlite3.c -o backend\include\sqlite3.o
)
g++ -std=c++17 -O2 -Ibackend\include -Ibackend\src backend\src\main.cpp backend\include\sqlite3.o -o backend\food_rescue_backend.exe -lws2_32 -lwsock32 -lcrypt32

echo [2/3] Compiling and Running C++ Automated Tests...
g++ -std=c++17 -O2 -Ibackend\include -Ibackend\src backend\tests\run_tests.cpp backend\include\sqlite3.o -o backend\tests\run_tests.exe -lws2_32 -lwsock32 -lcrypt32
backend\tests\run_tests.exe

echo [3/3] Installing Frontend Dependencies...
cd frontend
call npm install --no-audit --no-fund
cd ..

echo.
echo ========================================================
echo SETUP COMPLETE! Run scripts\start.bat to launch.
echo ========================================================
pause
