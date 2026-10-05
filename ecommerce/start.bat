@echo off
setlocal
cd /d "%~dp0"

echo ========================================
echo ECOMMERCE APP STARTER
echo ========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js is not installed or not in PATH.
  echo Install Node.js 18+ and try again.
  exit /b 1
)

if not exist node_modules (
  echo [INFO] node_modules not found. Installing dependencies...
  echo [INFO] Using npmjs.org registry...
  call npm install --legacy-peer-deps --no-audit --omit=optional

  if errorlevel 1 (
    echo [ERROR] Dependency installation failed.
    echo Please check network connectivity and rerun start.bat.
    exit /b 1
  )
)

echo.
echo [INFO] Starting development server...
call npm run dev

exit /b %errorlevel%
