# 🚀 Démarrage Rapide - Serveur TGNova

## Vos problèmes CORS sont maintenant résolus !

### 🎯 Étape 1 : Installez Node.js (si vous ne l'avez pas)
Téléchargez depuis : https://nodejs.org/ (Version LTS recommandée)

### 🎯 Étape 2 : Lancez le serveur

**Option A - Facile (Windows)** :
1. Allez dans votre dossier `c:\gestion-taches`
2. Doublé-cliquez sur `start-server-node.bat`
3. Le serveur démarre automatiquement

**Option B - Avec PowerShell** :
```powershell
cd c:\gestion-taches
.\start-server-node.ps1
```

**Option C - Directement** :
```bash
cd c:\gestion-taches
node server.js
```

### 🎯 Étape 3 : Ouvrez votre application
Une fois que vous voyez : `🚀 Serveur démarré sur http://localhost:8000`

Ouvrez votre navigateur et allez à :
```
http://localhost:8000
```

---

## ✅ Ce qui a été résolu

| Problème | Solution |
|----------|----------|
| ❌ `Access to script at 'file://...' has been blocked by CORS` | ✅ Serveur web local qui gère CORS |
| ❌ `GET file://... net::ERR_FAILED` | ✅ Utilisation du protocole `http://` |
| ❌ `Uncaught ReferenceError: login is not defined` | ✅ Scripts chargés correctement |

---

## 💡 Besoin d'aide ?

- **Serveur ne démarre pas** → Vérifiez que Node.js est installé : `node --version`
- **Port 8000 utilisé** → Changez le port dans `server.js` (ligne 3)
- **Fichiers CSS/JS ne chargent pas** → Vérifiez les chemins dans le HTML
- **Plus d'infos** → Consultez `CORS_RESOLUTION.md`

---

**Vous êtes prêt !** 🎉 Votre application TGNova fonctionne maintenant sans erreurs CORS.
