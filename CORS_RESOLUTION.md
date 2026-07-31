# 🔧 Guide de Résolution des Erreurs CORS

## Problèmes Identifiés

Vous aviez 3 erreurs principales :

1. **Erreur CORS** : `Access to script at 'file:///D:/gestion-taches/js/auth.js' from origin 'null' has been blocked by CORS policy`
2. **Erreur de chargement** : `GET file:///D:/gestion-taches/js/auth.js net::ERR_FAILED`
3. **Erreur de fonction** : `Uncaught ReferenceError: login is not defined`

## Cause Racine

Vous ouvriez l'application en utilisant le protocole `file://` (en doublant cliquant sur login.html). Les navigateurs modernes bloquent les scripts externes par des restrictions de sécurité CORS sur ce protocole.

## ✅ Solution Implémentée

Un **serveur web local** a été créé pour servir l'application correctement avec le protocole `http://`.

### Fichiers Créés :

1. **`server.js`** - Serveur web Node.js avec support CORS
2. **`start-server-node.bat`** - Lanceur Windows (batch)
3. **`start-server-node.ps1`** - Lanceur PowerShell
4. **`package.json`** - Configuration npm
5. **`server.py`** - Alternative avec Python (si Node.js n'est pas disponible)
6. **`start-server.bat`** - Lanceur Python (batch)
7. **`start-server.ps1`** - Lanceur Python (PowerShell)

## 🚀 Comment Utiliser

### ⭐ Option 1 : Via Node.js (Recommandé - Moderne)
```powershell
# Ouvrir PowerShell dans le répertoire du projet
cd c:\gestion-taches

# Donner la permission d'exécuter les scripts (première fois seulement)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Lancer le serveur
.\start-server-node.ps1
```

**Ou via Batch** (plus simple) :
- Doublé-cliquez sur `start-server-node.bat` dans l'explorateur Windows

### Option 2 : Via Python (Alternative)
```powershell
cd c:\gestion-taches
.\start-server.ps1
```

**Ou via Batch** :
- Doublé-cliquez sur `start-server.bat`

### Option 3 : Lancer Directement
```bash
# Avec Node.js
node server.js

# Ou avec Python
python server.py
```

## 📱 Accéder à l'Application

Une fois le serveur démarré, ouvrez votre navigateur et allez à :

```
http://localhost:8000
```

Vous verrez une liste de fichiers. Cliquez sur `login.html`

## 🔒 Avantages de cette Solution

✅ **Pas d'erreurs CORS** - Le serveur gère les headers CORS correctement
✅ **Fonctions accessibles** - `login()`, `loginWithGoogle()`, etc. fonctionneront
✅ **Proche de la production** - Simule le comportement d'un serveur réel
✅ **Facile à utiliser** - Simple lancement avec un script

## ⚙️ Configuration

Pour changer le port (par défaut 8000), éditez `server.py` ligne :
```python
PORT = 8000  # Changez ce numéro
```

## 🆘 Troubleshooting

### "Node.js n'est pas reconnu"
- Installez Node.js depuis https://nodejs.org/ (LTS recommandé)
- Pendant l'installation, acceptez l'ajout au PATH
- Redémarrez votre terminal après installation

### "Python n'est pas reconnu"
- Installez Python depuis https://www.python.org
- Pendant l'installation, cochez "Add Python to PATH"
- Redémarrez votre terminal après installation

### Le port 8000 est déjà utilisé
- Changez le `PORT = 8000` dans `server.js` ou `server.py`
- Ou fermez l'application qui l'utilise
- Vous pouvez vérifier les ports en utilisant : `netstat -ano | findstr :8000`

### Les fichiers CSS/JS ne se chargent pas
- Assurez-vous que tous les chemins sont relatifs (sans `/D:/...`)
- Vérifiez la structure du dossier et les majuscules/minuscules
- Regardez la console du navigateur (F12) pour voir les chemins

### Erreur "ERR_FAILED" ou "Access Denied"
- Quittez complètement le navigateur et ouvrez http://localhost:8000 à nouveau
- Vérifiez que le serveur affiche "✅ Serveur démarré"
- Essayez un port différent si 8000 est en conflit

## 📚 Fichiers de Référence

- `js/auth.js` - Contient `login()`, `register()`, `loginWithGoogle()`, etc.
- `js/firebase-config.js` - Configuration Firebase
- Les fonctions sont exposées avec `window.functionName = function() { ... }`

---

**Problème résolu !** Vous pouvez maintenant développer et tester votre application localement sans erreurs CORS.
