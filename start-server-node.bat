@echo off
REM Serveur web pour TGNova avec Node.js
REM Lance un serveur HTTP simple sur http://localhost:8000

echo.
echo ========================================
echo      SERVEUR TGNOVA
echo ========================================
echo.

cd /d "%~dp0"

REM Vérifie si Node.js est installé
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Erreur: Node.js n'est pas installe ou n'est pas dans le PATH
    echo Telecharge Node.js depuis: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js detecte
echo Demarrage du serveur...
echo.

node server.js

if errorlevel 1 (
    echo.
    echo Erreur lors du demarrage du serveur
    pause
)
