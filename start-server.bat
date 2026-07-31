@echo off
REM Serveur web pour TGNova
REM Lance un serveur HTTP simple sur http://localhost:8000

echo.
echo ========================================
echo      SERVEUR TGNOVA
echo ========================================
echo.

cd /d "%~dp0"

python server.py

if errorlevel 1 (
    echo.
    echo Erreur: Python n'est pas installe ou n'est pas dans le PATH
    echo Veuillez installer Python depuis https://www.python.org
    pause
)
