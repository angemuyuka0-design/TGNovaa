# 🎨 Guide Complet du Système de Discussions Refondu

## Table des matières
1. [Architecture](#architecture)
2. [Structure des fichiers](#structure-des-fichiers)
3. [Fonctionnalités principales](#fonctionnalités-principales)
4. [API Firestore](#api-firestore)
5. [Utilisation du code](#utilisation-du-code)
6. [Personnalisation](#personnalisation)
7. [Dépannage](#dépannage)

---

## Architecture

### Vue d'ensemble
Le système de discussions utilise une architecture en couches:

```
┌─────────────────────────────────────────┐
│           Interface HTML                 │
│        (assets/discussions.html)          │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│    Styles CSS (chat-modern.css)          │
│  • Layout et composants                  │
│  • Variables de thème                    │
│  • Responsive design                     │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│    Logique JavaScript                    │
├─────────────────────────────────────────┤
│ discussions-firebase.js                  │
│ • Gestion conversations                  │
│ • Envoi/réception messages               │
│ • Indicateurs temps réel                 │
│                                         │
│ discussions-modal-advanced.js            │
│ • Formulaire création discussion          │
│ • Sélection participants                 │
│ • Multi-étapes modal                     │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│        Firebase Firestore                │
│  • Collections discussions               │
│  • Utilisateurs                          │
│  • Messages (subcollections)             │
└─────────────────────────────────────────┘
```

---

## Structure des fichiers

### CSS - `css/chat-modern.css` (850+ lignes)

**Variables racine:**
```css
:root {
    --primary: #4F46E5;           /* Couleur d'accent */
    --gray-50: #F9FAFB;          /* Fonds clairs */
    --gray-900: #111827;         /* Texte principal */
    /* ... 20+ variables ... */
}
```

**Sections principales:**
- `.conteneur-discussions` - Conteneur principal Flexbox
- `.panneau-conversations` - Sidebar gauche (360px)
- `.panneau-discussion` - Zone chat principale
- `.zone-messages` - Affichage messages avec scroll
- `.bulle-message` - Style messages individuels
- `.zone-saisie` - Barre de saisie avec textarea

**Animations:**
```css
@keyframes slideIn { /* Messages qui arrivent */ }
@keyframes fadeIn { /* Indicateur saisie */ }
```

---

### JavaScript - `js/discussions-firebase.js`

**Initialisateur:**
```javascript
initialiserDiscussionsFirebase()
│
├─ Vérifie authentification
├─ Charge profil utilisateur
├─ Lance chargerConversations()
└─ Attache événement bouton "+ Nouvelle"
```

**Fonctions principales:**

#### 1. `chargerConversations()`
```javascript
// Écoute toutes les conversations de l'utilisateur
// Trie par derniereModification
// Met à jour reconstruireListeConversations() en temps réel
```

#### 2. `chargerConversation(conversationId)`
```javascript
// Sélectionne une conversation spécifique
// Affiche entête et messages
// Lance écouteurs temps réel
```

#### 3. `chargerMessagesEnTempsReel(conversationId)`
```javascript
// Firestore onSnapshot() - Écoute les changements
// Affiche messages groupés par auteur
// Auto-scroll vers le bas
```

#### 4. `envoyerMessage(texte, images, fichiers)`
```javascript
// Crée document message
// Ajoute à subcollection messages/
// Met à jour derniereMessage de la conversation
// Arrête indicateur saisie automatiquement
```

#### 5. `ecouterIndicateurSaisie(conversationId)`
```javascript
// Affiche "[Nom] entrain d'écrire..."
// Écoute tableau utilisateurEnTrainDecrire
// Disparaît après 3 secondes d'inactivité
```

#### 6. `creerNouvelleDiscussion(nom, membresIds, description, type)`
```javascript
// Paramètres:
//   - nom: string (optionnel pour individuel)
//   - membresIds: userId[]
//   - description: string (optionnel)
//   - type: "individuel" | "groupe"

// Récupère infos membres depuis BD
// Crée document discussion
// Initialise nonLus counter
// Lance chargerConversation()
```

---

### JavaScript - `js/discussions-modal-advanced.js`

**Fonction principale:**
```javascript
afficherModalNouvelleDiscussion()
│
├─ Charge tous les utilisateurs
│
├─ ÉTAPE 1: Sélection type
│  ├─ Individuel (1 participant)
│  └─ Groupe (multiple participants)
│
├─ ÉTAPE 2: Infos & Participants
│  ├─ Champs nom/description (groupe)
│  ├─ Recherche utilisateurs en temps réel
│  ├─ Sélection avec checkboxes
│  └─ Badges participants
│
└─ CRÉATION: Appelle creerNouvelleDiscussion()
```

**Sous-fonctions:**
- `chargerUtilisateurs()` - Query Firestore collection utilisateurs
- `afficherEtapeType()` - Render étape 1
- `afficherEtapeInfo()` - Render étape 2 avec recherche
- `mettreAJourParticipants()` - Mise à jour badges
- `creerDiscussionFinal()` - Validation et création

---

## Fonctionnalités principales

### 1. Conversations

**Affichage liste:**
- Avatar avec indicateur statut (point vert/gris)
- Nom conversation (ou noms membres)
- Aperçu dernier message
- Heure relative (formatée)
- Badge non-lu count

**Tri:**
```javascript
conversations.sort((a, b) => dateB - dateA) // Plus récent d'abord
```

**Recherche:**
```javascript
// Filtre par nom conversation ou membre
const resultats = conversations.filter(conv =>
    conv.nom.includes(terme) ||
    conv.membresInfo.some(m => m.nom.includes(terme))
)
```

---

### 2. Messages

**Affichage groupé par auteur:**
```
Moi (17:45)
> Bonjour !
> Comment allez-vous ?    ✓✓

Autre (17:46)
> Ça va bien merci !
> Et vous ?
```

**Métadonnées:**
- Avatar auteur
- Nom auteur (sauf messages moi)
- Texte + images + fichiers
- Heure précise
- Confirmation lecture (✓✓ pour messages)

**Sécurité:**
```javascript
// Échappement HTML pour éviter XSS
function echapperHTML(texte) {
    const div = document.createElement('div');
    div.textContent = texte;
    return div.innerHTML;
}
```

---

### 3. Indicateur "entrain d'écrire"

**Affichage:**
```
[Nom utilisateur] entrain d'écrire...
```

**Déclenchement:**
```javascript
champMessage.addEventListener('input', gererIndicateurSaisie)
// Ajoute utilisateur à tableau utilisateurEnTrainDecrire
```

**Auto-arrêt:**
```javascript
setTimeout(arreterIndicateurSaisie, 3000) // Après 3s d'inactivité
```

---

### 4. Sélection participants

**Modal multi-étapes:**

```
Étape 1: Type
┌─────────────────┐
│ ◉ Individuel    │
│ ○ Groupe        │
└─────────────────┘

Étape 2: Participants
┌──────────────────────────┐
│ Rechercher utilisateur... │
│                          │
│ [Avatar] Nom 1           │
│ [Avatar] Nom 2 ✓         │
│                          │
│ Sélectionnés:            │
│ [Avatar] Nom 2 ×         │
└──────────────────────────┘
```

**Recherche en temps réel:**
```javascript
// Filtre utilisateurs par nom ou email
utilisateurs.filter(u =>
    u.nom.toLowerCase().includes(terme) ||
    u.email.toLowerCase().includes(terme)
)
```

**Limitations:**
- Individuel: max 1 participant
- Groupe: min 1 participant

---

## API Firestore

### Collections

#### `discussions/{discussionId}`
```javascript
{
    nom: "Discussion Project X",          // string
    type: "groupe",                       // "individuel" | "groupe"
    membres: ["uid1", "uid2", ...],       // userId[]
    membresInfo: [                        // Snapshot infos
        {
            id: "uid1",
            nom: "Alice",
            email: "alice@example.com",
            avatar: "https://..."
        }
    ],
    description: "Description du groupe",  // string | ""
    avatarGroupe: "https://...",          // URL | null
    createurId: "uid",                    // userId
    dateCreation: Timestamp,               // server timestamp
    derniereModification: Timestamp,       // server timestamp
    derniereMessage: "Dernier message...", // string
    statut: "actif",                      // "actif" | "archivé"
    nonLus: {                             // Non-lu count par utilisateur
        "uid1": 2,
        "uid2": 0,
        ...
    },
    utilisateurEnTrainDecrire: ["uid2"],  // Users typing
}
```

#### `discussions/{discussionId}/messages/{messageId}`
```javascript
{
    auteurId: "uid",
    avatarAuteur: "https://...",
    texte: "Contenu du message",
    images: ["url1", "url2"],             // Photos attachées
    fichiers: [                           // Fichiers partagés
        {
            nom: "document.pdf",
            url: "https://..."
        }
    ],
    dateEnvoi: Timestamp,
    lu: false,                            // Confirmation lecture
}
```

#### `utilisateurs/{userId}`
```javascript
{
    id: "uid",
    nom: "Alice Dupont",
    email: "alice@example.com",
    avatar: "https://ui-avatars.com/api/?name=Alice+Dupont",
    statut: "en-ligne",                   // "en-ligne" | "hors-ligne"
    // ... autres champs
}
```

---

### Requêtes courantes

**Charger conversations utilisateur:**
```javascript
db.collection('discussions')
  .where('membres', 'array-contains', userId)
  .onSnapshot(snapshot => { ... })
```

**Charger messages:**
```javascript
db.collection('discussions')
  .doc(discussionId)
  .collection('messages')
  .orderBy('dateEnvoi', 'asc')
  .onSnapshot(snapshot => { ... })
```

**Chercher utilisateurs:**
```javascript
db.collection('utilisateurs')
  .where('email', '>=', terme)
  .limit(10)
  .get()
```

---

## Utilisation du code

### Initialisation
```javascript
// Chargé automatiquement au démarrage
<script src="../js/discussions-firebase.js"></script>

// Appelé dans window.load ou au montage de la page
initialiserDiscussionsFirebase()
```

### Créer discussion programmatiquement
```javascript
// Groupe avec participants
await creerNouvelleDiscussion(
    "Réunion d'équipe",              // nom
    ["uid1", "uid2"],                // membresIds
    "Discutons du Q2 2026",          // description
    "groupe"                         // type
)

// Individuel
await creerNouvelleDiscussion(
    null,
    ["uid1"],
    null,
    "individuel"
)
```

### Envoyer message
```javascript
envoyerMessage(
    "Bonjour!", // texte
    [],         // images (URLs)
    []          // fichiers ({nom, url})
)
```

### Obtenir conversation active
```javascript
const conv = conversations[conversationActive]
console.log(conv.nom, conv.membres)
```

---

## Personnalisation

### Couleurs

Modifiez les CSS variables dans `chat-modern.css`:
```css
:root {
    --primary: #4F46E5;        /* Bleu → vert, rouge, etc */
    --success: #10B981;        /* Vert statut en-ligne */
    --gray-900: #111827;       /* Texte principal */
    /* ... */
}
```

### Tailles

Panneau conversations:
```css
.panneau-conversations {
    width: 360px;              /* Augmenter/diminuer */
}
```

Messages max-width:
```css
.bulle-message {
    max-width: 65%;            /* 50%, 75%, 85% */
}
```

### Polices

Modifier l'import Google Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=VOTRE_POLICE" rel="stylesheet">
```

Appliquer à `chat-modern.css`:
```css
body {
    font-family: 'VOTRE_POLICE';
}
```

---

## Dépannage

### Modal ne s'affiche pas
**Causes possibles:**
- Z-index: Vérifiez `.modal-backdrop { z-index: 10000 }`
- CSS non chargé: Confirmez `<link rel="stylesheet" href="../css/chat-modern.css">`
- JavaScript erreur: Ouvrez la console (F12) et cherchez erreurs

**Solution:**
```javascript
// Testez si la modal s'affiche
afficherModalNouvelleDiscussion()
// Vérifiez console pour erreurs Firebase
```

### Utilisateurs ne s'affichent pas
**Causes:**
- Collection `utilisateurs` vide dans Firestore
- Permissions Firestore
- Requête sans résultats

**Vérification:**
```javascript
// Dans la console
const db = firebase.firestore()
db.collection('utilisateurs').get().then(snap => {
    console.log('Utilisateurs:', snap.size)
    snap.forEach(doc => console.log(doc.data()))
})
```

### Messages ne se synchronisent pas
**Causes:**
- Listener pas actif: Vérifiez `ecouterIndicateurSaisie()`
- Document discussion inexistant
- Permissions Firestore

**Solution:**
```javascript
// Testez la synchronisation
chargerConversation(conversationId)
// Vérifiez la console pour erreurs
```

### Style "cassé" sur mobile
**Cause:** Viewport meta tag manquant
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

### Indicateur saisie qui reste
**Cause:** Timer d'arrêt pas appelé
```javascript
// Vérifiez arreterIndicateurSaisie est appelé après 3s
// Forcez nettoyage:
document.querySelector('.indicateur-saisie').style.display = 'none'
```

---

## Performance

### Optimisations
- Messages paginés (charger les 50 derniers d'abord)
- Images lazy-loaded
- Écouteurs nettoyés au changement de conversation
- Limit 10 dans recherche utilisateurs

### Scalabilité
- Max 10,000 conversations par utilisateur (Firestore limite)
- Max 50 participants par groupe (soft limit)
- Messages illimités par conversation

---

## Sécurité

### Validation côté client
```javascript
// Vérifiez authentification
if (!firebase.auth().currentUser) {
    window.location.href = '/login.html'
}

// Validez avant Firestore
if (!nomDiscussion.trim()) {
    afficherToast('Nom obligatoire', 'warning')
    return
}
```

### Règles Firestore (recommandées)
```javascript
match /discussions/{docId} {
    // Lecture: être dans les membres
    allow read: if request.auth.uid in resource.data.membres
    
    // Création: être authentifié
    allow create: if request.auth != null
    
    // Mise à jour/suppression: être le créateur
    allow update, delete: if request.auth.uid == resource.data.createurId
}

match /discussions/{docId}/messages/{msgId} {
    allow read: if request.auth.uid in get(/databases/$(database)/documents/discussions/$(docId)).data.membres
    allow create: if request.auth != null
}
```

---

## Support

Pour questions/problèmes:
1. Vérifiez la console (F12)
2. Consultez Firestore Rules
3. Vérifiez authentification Firebase
4. Testez avec autre navigateur

