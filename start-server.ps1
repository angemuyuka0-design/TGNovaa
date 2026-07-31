# Serveur web pour TGNova
# Lance un serveur HTTP simple sur http://localhost:8000

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "      SERVEUR TGNOVA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $PSScriptRoot

# Vérifie si Python est installé
$pythonExists = $null -ne (Get-Command python -ErrorAction SilentlyContinue)

if (-not $pythonExists) {
    Write-Host "Erreur: Python n'est pas installé ou n'est pas dans le PATH" -ForegroundColor Red
    Write-Host "Veuillez installer Python depuis https://www.python.org" -ForegroundColor Red
    Read-Host "Appuyez sur Entrée pour fermer cette fenêtre"
    exit 1
}

Write-Host "🚀 Démarrage du serveur..." -ForegroundColor Green
Write-Host ""

python server.py
