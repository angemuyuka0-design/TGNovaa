# 🚀 Configuration Cloud Functions Firebase - Envoi d'Emails

## Vue d'ensemble

Les Cloud Functions Firebase envoient automatiquement les identifiants de connexion quand un compte est créé.

**Flux :**
1. Administrateur crée un compte → mot de passe généré
2. Utilisateur créé dans Firebase Auth
3. Cloud Function déclenche automatiquement
4. Email envoyé via Gmail avec identifiants

---

## ✅ Étape 1 : Générer un mot de passe d'application Gmail

Firebase utilise Nodemailer pour envoyer les emails via Gmail. Vous **DEVEZ** utiliser un mot de passe d'application, pas votre mot de passe Google.

### Instructions :

1. **Allez sur :** https://myaccount.google.com/apppasswords
   - Connectez-vous avec `wallyleonel237@gmail.com` si vous n'êtes pas déjà connecté

2. **Sélectionnez :**
   - **Appareil :** Ordinateur
   - **Application :** Courrier

3. **Cliquez sur "Générer"**
   - Gmail génère un mot de passe d'application (exemple : `abcd efgh ijkl mnop`)

4. **Coplez ce mot de passe** (vous l'utiliserez à l'étape suivante)

---

## ✅ Étape 2 : Configurer le mot de passe dans Cloud Functions

### Fichier à éditer : `functions/index.js`

Cherchez cette ligne (environ ligne 11) :

```javascript
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'wallyleonel237@gmail.com',
        // REMPLACEZ PAR VOTRE MOT DE PASSE D'APPLICATION GMAIL
        pass: 'votre_mot_de_passe_application_ici'
    }
});
```

**Remplacez :**
```javascript
pass: 'votre_mot_de_passe_application_ici'
```

**Par :**
```javascript
pass: 'abcd efgh ijkl mnop'  // Votre mot de passe d'application Gmail
```

**⚠️ IMPORTANT :** Incluez les espaces dans le mot de passe !

---

## ✅ Étape 3 : Installer les dépendances

### Terminal PowerShell dans le dossier `functions/` :

```bash
cd functions
npm install
```

Cela installe :
- `firebase-admin` : SDK Firebase côté serveur
- `firebase-functions` : Déploie vos fonctions
- `nodemailer` : Envoie les emails

---

## ✅ Étape 4 : Déployer les Cloud Functions

### Dans le terminal (depuis la racine du projet) :

```bash
firebase login
firebase deploy --only functions
```

**Première utilisation :**
- Firebase vous demandera de vous connecter à votre compte Google
- Pui sélectionnez votre projet `gestion-taches-86f9c`

**Après le déploiement :**
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/gestion-taches-86f9c/overview
Function URL: https://us-central1-gestion-taches-86f9c.cloudfunctions.net/envoirEmailIdentifiants
```

---

## ✅ Étape 5 : Tester la Cloud Function

### Test 1 : Créer un compte via le formulaire d'inscription

1. Allez sur `register.html`
2. Créez un compte test avec une vraie adresse email
3. **Vérifiez :**
   - ✅ Email reçu avec identifiants
   - ✅ Vérifiez aussi le dossier **Spam**

### Test 2 : Via administration

1. Connectez-vous comme admin (`wallyleonel237@gmail.com`)
2. Allez dans **Paramètres → Gestion des comptes**
3. Créez un nouveau compte
4. Vérifiez que l'email est reçu

---

## 📊 Surveillance des Cloud Functions

### Voir les logs en temps réel :

```bash
firebase functions:log
```

Ou dans la console Firebase :
1. Allez sur **Build > Functions** dans la console Firebase
2. Cliquez sur `envoirEmailIdentifiants`
3. Onglet **Logs** pour voir les détails

---

## 🔧 Dépannage

### ❌ Email non reçu

**Vérifiez :**
1. ✅ Mot de passe d'application Gmail correctement configuré
2. ✅ Dossier Spam (même Gmail peut bloquer)
3. ✅ Logs Firebase → vérifiez s'il y a une erreur (voir ci-dessous)

### ❌ Erreur "Invalid login credentials"

- Le mot de passe d'application est incorrect
- Régénérez-en un nouveau sur https://myaccount.google.com/apppasswords

### ❌ Erreur "Less secure app access"

- Vérifiez que la sécurité 2FA est activée sur le compte Gmail
- Les mots de passe d'application ne fonctionnent qu'avec 2FA

### ✅ Voir les erreurs dans la console navigateur (F12)

Quand vous créez un compte, ouvrez F12 et cherchez :
- `📧 Envoi de l'email de bienvenue pour : email@example.com`
- `✅ Email envoyé avec succès`
- Ou une erreur complète

---

## 📧 Personnaliser les emails

### Fichier à éditer : `functions/index.js`

La fonction `envoirEmailIdentifiants` (ligne ~50) génère l'email HTML.

**Vous pouvez modifier :**
- Sujet de l'email (ligne 59)
- Titre et description (lignes 63-64)
- Contenu du message (lignes 67-68)
- Lien de connexion (ligne 86)

Après modification, redéployez :
```bash
firebase deploy --only functions
```

---

## 🔐 Sécurité

**⚠️ MOT DE PASSE D'APPLICATION :**
- Ne partagez JAMAIS votre mot de passe d'application
- Stockez-le uniquement dans `functions/index.js`
- Ne le commencez pas dans GitHub

**Recommandé (optionnel) :** Utiliser des variables d'environnement Firebase :
```bash
firebase functions:config:set gmail.password="votre_motdepasse"
```

Puis dans `index.js` :
```javascript
pass: functions.config().gmail.password
```

---

## ✅ Résumé du flux

```
👤 Utilisateur créé
    ↓
🔐 Mot de passe généré et stocké dans Firestore
    ↓
🚀 Cloud Function déclenchée automatiquement
    ↓
✉️ Nodemailer envoie email via Gmail
    ↓
📧 Utilisateur reçoit ses identifiants
    ↓
✅ Peut se connecter
```

---

## 📖 Ressources

- Firebase Cloud Functions : https://firebase.google.com/docs/functions
- Nodemailer : https://nodemailer.com/
- Mots de passe d'application Gmail : https://support.google.com/accounts/answer/185833

---

**Questions ?** Vérifiez les logs Firebase ou consultez la console navigateur (F12).
