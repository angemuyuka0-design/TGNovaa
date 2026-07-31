# ⚡ DÉMARRAGE RAPIDE - Cloud Functions Email

## 🎯 Ce qui a été fait

✅ Cloud Functions créées pour envoyer les emails automatiquement  
✅ Code client simplifié (pas de vérification d'email)  
✅ Firebase configuré pour les functions  

## 🚀 À faire MAINTENANT (5 minutes)

### 1️⃣ Générer mot de passe Gmail (2 min)

Allez ici : https://myaccount.google.com/apppasswords

- **Appareil :** Ordinateur
- **Application :** Courrier
- **Cliquez :** Générer
- **Copiez** le mot de passe généré

### 2️⃣ Configurer le mot de passe (1 min)

**Fichier :** `functions/index.js`  
**Ligne :** ~11

Trouvez cette section :
```javascript
pass: 'votre_mot_de_passe_application_ici'
```

Remplacez par (avec les espaces) :
```javascript
pass: 'abcd efgh ijkl mnop'
```

### 3️⃣ Installer et déployer (2 min)

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### 4️⃣ Tester

Allez sur `register.html` et créez un compte test.

**Vérifiez :**
- ✅ Vous recevez un email avec identifiants
- ✅ Vérifiez aussi le dossier Spam

## 📍 Fichiers modifiés

| Fichier | Changement |
|---------|-----------|
| `functions/index.js` | ✨ Cloud Functions pour envoyer emails |
| `functions/package.json` | ✨ Dépendances Cloud |
| `firebase.json` | ✨ Configuration functions |
| `js/auth.js` | ✏️ Suppression sendEmailVerification() |
| `js/parametres.js` | ✏️ Suppression sendEmailVerification() |

## ❓ Si ça ne marche pas

**Erreur "Invalid login credentials"**
→ Mot de passe d'application incorrect
→ Régénérez-en un nouveau

**Email non reçu**
→ Vérifiez dossier Spam
→ Vérifiez logs : `firebase functions:log`

**Plus de détails :** Lire `CLOUD_FUNCTIONS_SETUP.md`

---

**C'est tout ! Les emails seront envoyés automatiquement après ça. 🎉**
