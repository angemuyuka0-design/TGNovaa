# 🚀 TGNOVA - Plateforme de Gestion Intégrée

## Vue d'ensemble

TGNOVA est une application web moderne de gestion de **tâches**, **projets** et **discussions en temps réel** construite avec:
- **Frontend**: HTML5, CSS3, JavaScript moderne
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Architecture**: Progressive Web App (PWA)

---

## 📋 Fonctionnalités principales

### 1. 📊 Dashboard
- Vue d'ensemble des tâches et projets
- Statistiques en temps réel
- Notifications
- Synchronisation Firestore

### 2. ✅ Gestion des tâches
- Créer, modifier, supprimer les tâches
- Assigner à des utilisateurs
- Définir priorités et dates limites
- Catégoriser par projet
- Marquer comme complétée
- Synchronisation temps réel

### 3. 📁 Gestion des projets
- Créer des projets
- Suivre la progression
- Ajouter des membres
- Définir des dates limites
- Gérer les catégories
- Synchronisation temps réel

### 4. 💬 Discussions en temps réel
- Conversations entre utilisateurs
- Indicateur "en train d'écrire"
- Partage de fichiers/images
- Confirmation de lecture
- Synchronisation instantanée
- Gestion de groupes

### 5. ⚙️ Paramètres
- Profil utilisateur
- Préférences
- Thème (clair/sombre)
- Notifications

---

## 🏗️ Architecture

```
tgnova/
├── index.html                 # Page d'accueil
├── login.html                 # Connexion
├── register.html              # Inscription
├── dashboard.html             # Tableau de bord principal
├── 404.html                   # Page erreur
│
├── assets/
│   ├── discussions.html       # Page discussions
│   ├── taches.html            # Page tâches
│   ├── projets.html           # Page projets
│   ├── parametres.html        # Page paramètres
│   └── ...
│
├── css/
│   ├── style.css              # Styles principaux
│   ├── dashboard.css          # Styles dashboard
│   ├── discussions-firebase.css # Styles discussions
│   ├── taches.css
│   ├── parametres.css
│   └── ...
│
├── js/
│   ├── firebase-config.js     # Configuration Firebase
│   ├── auth.js                # Authentification
│   ├── dashboard.js           # Logique dashboard
│   ├── discussions-firebase.js # Système discussions
│   ├── discussions-modal.js    # Modal discussions
│   ├── discussions-config.js   # Config discussions
│   ├── taches.js
│   ├── projets.js
│   ├── parametres.js
│   └── ...
│
├── images/
│   ├── logo*.png
│   └── ...
│
├── dataconnect/
│   ├── dataconnect.yaml
│   ├── schema/
│   └── ...
│
└── firebase.json              # Config Firebase
```

---

## 🔐 Authentification

### Méthodes supportées:
- ✅ Email/Mot de passe
- ✅ Google OAuth
- ✅ GitHub OAuth (à implémenter)

### Flux:
```
1. Utilisateur accède à login.html
2. Entre email et mot de passe
3. Firebase Auth valide les credentials
4. Redirection vers dashboard.html
5. Dashboard charge les données Firestore
```

---

## 🗄️ Base de données (Firestore)

### Collections principales:

#### `utilisateurs/`
```javascript
{
  id: userId,
  nom: "John Doe",
  email: "john@example.com",
  avatar: "https://...",
  statut: "en-ligne",
  ...
}
```

#### `tasks/`
```javascript
{
  titre: "Implement feature X",
  description: "...",
  statut: "en-cours",
  priorite: "haute",
  createurId: userId,
  assigneId: userId,
  dateCreation: timestamp,
  echeance: date,
  ...
}
```

#### `projets/`
```javascript
{
  nom: "Projet X",
  description: "...",
  progression: 45,
  membres: [userId1, userId2],
  createurId: userId,
  dateCreation: timestamp,
  ...
}
```

#### `discussions/`
```javascript
{
  nom: "Discussion Projet X",
  membres: [userId1, userId2],
  dateCreation: timestamp,
  utilisateurEnTrainDecrire: [userId],
  messages: {
    messageId: {
      auteurId: userId,
      texte: "...",
      dateEnvoi: timestamp,
      ...
    }
  },
  ...
}
```

---

## 🚀 Démarrage

### Pré-requis:
- Node.js 14+ (pour développement)
- Compte Firebase
- Navigateur moderne (Chrome, Firefox, Safari)

### Installation:
1. Cloner le repository
2. Créer un projet Firebase
3. Configurer `js/firebase-config.js` avec vos clés
4. Déployer avec Firebase Hosting

### Développement local:
```bash
# Avec Python 3
python -m http.server 8000

# Avec Node.js
npx http-server

# Accéder à http://localhost:8000
```

### Déploiement:
```bash
# Avec Firebase CLI
firebase deploy
```

---

## 📱 Responsive Design

- ✅ Desktop (1200px+)
- ✅ Tablette (768px - 1199px)
- ✅ Mobile (< 768px)
- ✅ Responsive images
- ✅ Touch-friendly UI

---

## 🎨 Thème

### Variables CSS:
```css
--couleur-primaire: #4F46E5
--couleur-secondaire: #10B981
--couleur-fond: #FFFFFF
--couleur-texte: #1F2937
--couleur-bordure: #E5E7EB
```

### Modes:
- ✅ Mode clair (par défaut)
- ✅ Mode sombre (basculable)

---

## 📚 Documentation

- **[Guide Discussions](./GUIDE_DISCUSSIONS.md)** - Système en temps réel
- **[Guide Utilisateur](./GUIDE_UTILISATEUR_DISCUSSIONS.md)** - Comment utiliser
- **[Implémentation Complète](./IMPLEMENTATION_COMPLETE_DISCUSSIONS.md)** - Détails techniques

---

## 🔧 Configuration Firebase

### Fichier: `js/firebase-config.js`
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### Règles de sécurité recommandées:
Consulter `GUIDE_DISCUSSIONS.md` pour la configuration complète.

---

## 🧪 Tests

### Tests manuels:
1. Créer 2 comptes utilisateurs
2. Ouvrir 2 navigateurs différents
3. Créer une discussion
4. Envoyer des messages
5. Vérifier l'indicateur "en train d'écrire"
6. Vérifier les synchronisations

### Console tests:
```javascript
// Voir l'utilisateur connecté
console.log(utilisateurConnecte);

// Voir les conversations
console.log(conversations);

// Créer une discussion
creerNouvelleDiscussion('Test', ['userId']);

// Envoyer un message
envoyerMessage('Bonjour!');
```

---

## 🐛 Dépannage

### Problème: "Firebase is not defined"
**Solution**: Vérifier que `firebase-config.js` est chargé

### Problème: "Access denied" sur Firestore
**Solution**: Vérifier les règles de sécurité dans Firebase Console

### Problème: Les messages ne s'affichent pas
**Solution**: Vérifier que l'utilisateur est membre de la discussion

### Problème: Indicateur "en train d'écrire" ne s'affiche pas
**Solution**: Attendre quelques secondes, vérifier les écouteurs actifs

Voir **GUIDE_DISCUSSIONS.md** pour plus de dépannage.

---

## 📈 Améliorations futures

- [ ] Appels vidéo/audio
- [ ] Édition de messages
- [ ] Suppression de messages
- [ ] Réactions aux messages
- [ ] Mentions (@user)
- [ ] Recherche avancée
- [ ] Notifications push
- [ ] Partage d'écran
- [ ] Enregistrements vocaux
- [ ] Groupes avec permissions avancées

---

## 📦 Dépendances

### Externes:
- **Font Awesome 6.5.0** - Icônes
- **Google Fonts** - Polices (Inter)
- **Firebase SDK 10.7.1** - Backend
- **Emoji Mart** - Sélecteur d'emojis

### Internes:
- Tous les scripts sont en vanilla JavaScript
- Pas de framework frontend (React, Vue, etc.)

---

## 🔐 Sécurité

- ✅ HTTPS obligatoire
- ✅ Authentication Firebase
- ✅ Firestore security rules
- ✅ Validation côté client
- ✅ Chiffrement en transit
- ⚠️ À implémenter: Chiffrement E2E

---

## 📊 Performance

### Optimisations:
- Lazy loading des images
- Compression CSS/JS
- Cache du navigateur
- Requêtes Firestore optimisées
- Debouncing des événements

### Métriques cibles:
- Chargement page: < 3s
- Envoi message: < 1s
- Synchronisation: < 2s

---

## 🎓 Stack technique

- **HTML5** - Markup sémantique
- **CSS3** - Flexbox, Grid, animations
- **JavaScript ES6+** - Moderne et asynchrone
- **Firebase** - Realtime database et auth
- **Responsive Design** - Mobile-first

---

## 📝 Licence

Propriétaire - TGNOVA 2025

---

## 👥 Contributeurs

Projet développé par l'équipe TGNOVA

---

## 📞 Support

Pour les questions ou problèmes:
1. Consulter la documentation
2. Vérifier les logs (F12)
3. Contacter l'équipe de support

---

## 🎯 Version actuelle

**v1.0.0** - Février 2026

✅ Dashboard fonctionnel
✅ Gestion tâches implémentée
✅ Gestion projets implémentée
✅ Discussions temps réel implémentée
✅ Interface responsive
✅ Authentification sécurisée

---

**Prêt pour la production! 🚀**

