# Serveur web pour TGNova
# Lance un serveur HTTP simple sur http://localhost:8000

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "      SERVEUR TGNOVA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $PSScriptRoot

# Vérifie si Node.js est installé
$nodeExists = $null -ne (Get-Command node -ErrorAction SilentlyContinue)

if (-not $nodeExists) {
    Write-Host "Erreur: Node.js n'est pas installé ou n'est pas dans le PATH" -ForegroundColor Red
    Write-Host "Téléchargez Node.js depuis: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Appuyez sur Entrée pour fermer cette fenêtre"
    exit 1
}

Write-Host "✅ Node.js détecté" -ForegroundColor Green
Write-Host "🚀 Démarrage du serveur..." -ForegroundColor Green
Write-Host ""

node server.js
