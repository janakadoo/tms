@echo off
title TMS Pro - Transport Management System
color 0A

echo ====================================================
echo      TMS Pro - Transport Management System
echo      Firebase Cloud Database Enabled
echo ====================================================
echo.
echo Opening app in browser...
echo.
echo IMPORTANT: Internet connection is required for Firebase sync.
echo.

cd /d "E:\my\projects\TRANSPORT SYSTEM"

:: Open the app directly in the default browser
start "" "http://localhost:8080"

:: Run a simple static file server (no Node.js backend needed!)
npx -y serve . -p 8080 -s

pause
