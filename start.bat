@echo off
setlocal
cd /d "%~dp0ecommerce"
call start.bat
exit /b %errorlevel%
