# 💬 SYSTÈME DE DISCUSSIONS EN TEMPS RÉEL - GUIDE UTILISATEUR

## 🎯 Vue d'ensemble

Le système de discussions TGNOVA offre une communication en temps réel entre les utilisateurs avec:
- **Conversations instantanées** synchronisées avec Firebase
- **Indicateur "en train d'écrire"** (style WhatsApp)
- **Messages avec pièces jointes** (images, fichiers)
- **Confirmation de lecture** (double checkmark)
- **Gestion des groupes de discussion**

---

## 🚀 Comment utiliser

### 1. **Accéder aux discussions**
- Cliquer sur "Discussions" dans la barre latérale
- Voir la liste des conversations existantes

### 2. **Créer une nouvelle discussion**
- Cliquer sur le bouton **"+ Nouvelle discussion"** (en haut du panneau des conversations)
- Une modal s'ouvre:
  - **Nom** (optionnel) : Nommer la discussion
  - **Ajouter des membres** : Rechercher par nom ou email
  - **Sélectionner** : Cliquer sur un utilisateur pour l'ajouter
  - Cliquer **"Créer"** pour créer la discussion
- La nouvelle discussion s'ouvre automatiquement

### 3. **Ouvrir une conversation**
- Cliquer sur une conversation dans le panneau gauche
- L'historique des messages s'affiche
- La zone de saisie devient active

### 4. **Envoyer un message**
- Taper le message dans le champ de saisie en bas
- Appuyer sur **Entrée** ou cliquer sur le bouton d'envoi ✈️
- Le message s'affiche immédiatement

### 5. **Recevoir des messages**
- Les messages reçus apparaissent en temps réel
- Voir le nom et l'avatar de l'expéditeur
- Les messages lus affichent une double checkmark ✓✓

### 6. **Voir qui tape**
Quand un autre utilisateur écrit un message:
- Sous la zone de messages, voir: **"[Nom] entrain d'écrire..."**
- Cet indicateur disparaît 3 secondes après avoir arrêté d'écrire

---

## 📱 Layout

```
┌─────────────────────────────────────┐
│ Barre latérale TGNOVA               │
├─────────────────────────────────────┤
│ Conversations    │ Discussion actif  │
│                  │                   │
│ [Conv 1] ----┐   │ En-tête:          │
│ [Conv 2] ----│   │ [Avatar] Nom      │
│ [Conv 3] ────┼→  │ Statut            │
│              │   │                   │
│              │   │ Zone de messages  │
│              │   │ [Message 1]       │
│              │   │ [Message 2]       │
│              │   │ [Message 3]       │
│              │   │                   │
│              │   │ "[User] en train  │
│              │   │  d'écrire..."     │
│              │   │                   │
│              │   │ [Saisie message]  │
│              │   │ [Envoyer] ✈️      │
└─────────────────────────────────────┘
```

---

## 🔔 Indicateurs

### Message non-lu
- **Badge rouge** avec le nombre de messages non-lus
- Apparaît sur la conversation dans le panneau gauche
- Le badge disparaît quand la conversation est ouverte

### "En train d'écrire"
- Affiche: **"[Nom] entrain d'écrire..."**
- Animation de clignotement
- Auto-disparition après 3 secondes d'inactivité

### Message lu
- **Double checkmark ✓✓** (en bleu) sur vos messages
- Indique que l'autre utilisateur a lu le message

---

## 🎨 Éléments de l'interface

### Panneau des conversations
| Élément | Description |
|---------|-------------|
| Avatar | Photo de profil du groupe ou de la personne |
| Nom | Nom de la discussion ou des participants |
| Aperçu | Dernier message envoyé |
| Heure | Quand le dernier message a été envoyé |
| Badge | Nombre de messages non-lus |

### En-tête de conversation
| Élément | Description |
|---------|-------------|
| Avatar | Photo du groupe ou de la personne |
| Nom | Nom complet de la discussion |
| Statut | "En ligne" ou "Hors ligne" |
| 📞 Appel audio | Démarrer un appel audio (à implémenter) |
| 📹 Appel vidéo | Démarrer un appel vidéo (à implémenter) |
| ℹ️ Infos | Voir les infos de la discussion |

### Messages
```
[Avatar] Nom
┌─────────────────────────┐
│ Ceci est un message     │
│ 14:32              ✓✓   │
└─────────────────────────┘
```

---

## ⌨️ Raccourcis clavier

| Raccourci | Action |
|-----------|--------|
| **Entrée** | Envoyer le message |
| **Shift + Entrée** | Aller à la ligne suivante |
| **Ctrl/Cmd + N** | Nouvelle discussion (à implémenter) |

---

## 🔐 Sécurité et confidentialité

- Les messages sont chiffrés en transit (HTTPS)
- Seuls les membres d'une discussion peuvent voir ses messages
- Les messages supprimés peuvent être sauvegardés dans les sauvegardes
- Les lectures de messages sont tracées pour les confirmations

---

## ⚠️ Limitations connues

- Pas d'édition de messages (à implémenter)
- Pas de suppression de messages (à implémenter)
- Pas de partage de vidéos (fichiers volumineux)
- Pas de réactions aux messages (à implémenter)
- Pas de mentions (@user) (à implémenter)

---

## 🆘 Dépannage

### Je ne vois pas mes conversations
1. Vérifier la connexion Firebase
2. Rafraîchir la page
3. Vérifier que vous êtes membre de la discussion

### Le message n'est pas envoyé
1. Vérifier la connexion internet
2. Vérifier que le texte n'est pas vide
3. Vérifier les permissions Firestore

### L'indicateur "en train d'écrire" ne s'affiche pas
1. C'est normal si vous écrivez seul
2. Vérifier que l'autre utilisateur est connecté
3. Attendre quelques secondes

### Je n'ai pas les droits d'accès
1. Vous devez être membre de la discussion
2. Demander à l'administrateur de vous ajouter
3. Vérifier les règles de sécurité Firestore

---

## 📞 Support

Pour plus d'aide:
1. Consulter le guide technique: `GUIDE_DISCUSSIONS.md`
2. Vérifier les logs dans la console (F12)
3. Contacter l'équipe de support TGNOVA

---

## 📝 Notes importantes

- **Données en temps réel** : Les conversations sont synchronisées en temps réel
- **Historique persistant** : Les messages restent même après fermeture
- **Notification** : Les compteurs de non-lus se mettent à jour automatiquement
- **Indicateur de saisie** : Mise à jour chaque 3 secondes maximum

