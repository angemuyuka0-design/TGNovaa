# ✅ CHECKLIST - SYSTÈME EMAIL

## 📋 Avant de commencer

- [ ] Vous avez accès à wallyleonel237@gmail.com
- [ ] Node.js est installé (`node -v`)
- [ ] Firebase CLI est installé (`firebase --version`)
- [ ] Vous êtes connecté à votre compte Google

---

## 🔧 Configuration

- [ ] **Généré mot de passe d'application Gmail**
  - URL : https://myaccount.google.com/apppasswords
  - Sélection : Ordinateur + Courrier
  - Action : Copié le mot de passe généré

- [ ] **Configuré `functions/index.js`**
  - Ligne 11 : remplacé `pass: 'votre_mot_de_passe_application_ici'`
  - Avec le vrai mot de passe (avec espaces)
  - Fichier sauvegardé

- [ ] **Instalé dépendances Cloud Functions**
  ```bash
  cd functions
  npm install
  cd ..
  ```
  Résultat : Dossier `functions/node_modules` créé

- [ ] **Déployé les Cloud Functions**
  ```bash
  firebase login
  firebase deploy --only functions
  ```
  Résultat : Affichage ✔ Deploy complete!

---

## 🧪 Tests

### Test 1 : Inscription simple
- [ ] Allez sur `register.html`
- [ ] Créez un compte avec une vraie adresse email
- [ ] Attendez 30 secondes
- [ ] Vérifiez votre email (inbox + spam)
- [ ] Résultat : Email reçu avec identifiants

### Test 2 : Création admin
- [ ] Connectez-vous en tant que admin
- [ ] Allez dans Paramètres → Gestion des comptes
- [ ] Créez un compte test
- [ ] Attendez email
- [ ] Vérifiez email reçu avec identifiants

### Test 3 : Connexion
- [ ] Utilisez les identifiants de l'email pour vous connecter
- [ ] Résultat : Accès au dashboard

### Test 4 : Renvoyer email
- [ ] Appel fonction depuis console : `renvoyerEmailIdentifiants()`
- [ ] Attendez email
- [ ] Résultat : Email renvoyé

---

## 🚨 Dépannage

### Si email non reçu
- [ ] Vérifiez dossier Spam
- [ ] Attendez 5 minutes (parfois lent)
- [ ] Vérifiez logs : `firebase functions:log`
- [ ] Vérifiez console navigateur (F12) pour erreurs

### Si error "Invalid login credentials"
- [ ] Mot de passe d'application faux
- [ ] Régénérez un nouveau à https://myaccount.google.com/apppasswords
- [ ] Remplacez dans `functions/index.js`
- [ ] Redéployez : `firebase deploy --only functions`

### Si command not found
```bash
# Node.js
node -v  # Si erreur, installer https://nodejs.org

# Firebase CLI
firebase --version  # Si erreur, exécuter :
npm install -g firebase-tools
```

---

## 📊 Vérifications finales

**Console Navigator (F12) :**
- [ ] Pas d'erreur rouge lors de l'inscription
- [ ] Message "Inscription réussie" s'affiche

**Email reçu :**
- [ ] De : `TGNova <wallyleonel237@gmail.com>`
- [ ] Sujet : `🎉 Bienvenue sur TGNova`
- [ ] Contenu : Email + Mot de passe visibles
- [ ] Design : Formatage HTML propre

**Connexion :**
- [ ] Identifiants de l'email fonctionnent
- [ ] Dashboard accessible immédiatement
- [ ] Pas de message "Email non confirmé"

---

## 🎯 Status final

✅ **Tout est prêt si :**
- Cloud Functions déployées avec succès
- Email reçu lors du test d'inscription
- Connexion fonctionne avec les identifiants reçus
- Pas d'erreur dans logs Firebase

---

## 📞 Support

Si vous vous bloquez :

1. **Vérifiez les logs Firebase**
   ```bash
   firebase functions:log
   ```

2. **Vérifiez la console navigateur (F12)**
   - Onglet Console
   - Cherchez les erreurs rouges

3. **Relisez la documentation**
   - `CLOUD_FUNCTIONS_SETUP.md` (complète)
   - `START_HERE.md` (rapide)

4. **Réinitialisez et testez à nouveau**
   ```bash
   firebase deploy --only functions
   ```

---

**Bonne chance ! 🚀**
