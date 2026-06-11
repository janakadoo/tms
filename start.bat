@echo off
echo.
echo  ============================================
echo   TMS Pro -- Transport Management System
echo   Starting local HTTP server on port 8080
echo  ============================================
echo.
echo  Open your browser at:
echo  http://localhost:8080
echo.

:: Try Node.js / npx first
where node >nul 2>&1
if %errorlevel%==0 (
    echo  Using Node.js (npx serve)...
    npx -y serve . -p 8080
    goto :end
)

:: Fallback to Python
where python >nul 2>&1
if %errorlevel%==0 (
    echo  Using Python 3 http.server...
    python -m http.server 8080
    goto :end
)

where python3 >nul 2>&1
if %errorlevel%==0 (
    echo  Using Python 3 http.server...
    python3 -m http.server 8080
    goto :end
)

:: Nothing found
echo  ERROR: Node.js or Python not found!
echo  Please install Node.js from https://nodejs.org
echo  or Python from https://www.python.org
echo.
pause

:end
