# Guide d'utilisation - Migration des rôles utilisateur

## Problème résolu

Vous aviez des utilisateurs dans votre base de données Firestore mais pas de système de rôles pour différencier les administrateurs des utilisateurs simples. Le code que j'ai ajouté vérifie les champs `role` et `statut` dans Firestore, mais vos utilisateurs existants n'avaient pas ces champs.

## Solution implémentée

J'ai créé un système complet de migration et gestion des rôles :

### 1. Script de migration (`js/migration-roles.js`)
- Fonction `migrerUtilisateursRoles()` : Migre automatiquement tous les utilisateurs existants
- Définit l'utilisateur actuel comme administrateur
- Attribue le rôle 'utilisateur' à tous les autres
- Met à jour les champs `role` et `statut` dans Firestore

### 2. Section Administration dans les paramètres
- **Migration des rôles** : Bouton pour lancer la migration automatique
- **Vérification des rôles** : Affiche la liste des rôles dans la console
- **Gestion des administrateurs** : Liste des admins actuels + possibilité d'en définir manuellement

### 3. Champs ajoutés dans Firestore
Pour chaque utilisateur :
```javascript
{
  role: 'administrateur' | 'utilisateur',
  statut: 'administrateur' | 'actif',
  permissions: {}, // Pour les admins
  dateCreation: timestamp,
  dateModification: timestamp
}
```

## Comment utiliser

### Étape 1 : Accéder à la section Administration
1. Connectez-vous à votre application
2. Allez dans **Paramètres** → **Administration**
3. La section n'est visible que pour les administrateurs

### Étape 2 : Lancer la migration
1. Cliquez sur **"Migrer les rôles utilisateur"**
2. Attendez que la migration se termine
3. La page se recharge automatiquement

### Étape 3 : Vérifier le résultat
- Cliquez sur **"Vérifier les rôles"** pour voir les rôles dans la console
- Consultez la **liste des administrateurs** dans l'interface

### Étape 4 : Gestion manuelle (si nécessaire)
- Pour définir un admin manuellement : collez son ID utilisateur et cliquez sur **"Définir comme administrateur"**

## Que fait la migration ?

1. **Récupère tous les utilisateurs** de la collection 'utilisateurs'
2. **Définit l'utilisateur connecté** comme administrateur (champ `role: 'administrateur'`)
3. **Définit tous les autres** comme utilisateurs simples (champ `role: 'utilisateur'`)
4. **Ajoute les champs manquants** : `statut`, `permissions`, `dateCreation`, `dateModification`
5. **Met à jour Firestore** avec un batch pour éviter les conflits

## Dépannage

### La section Administration n'apparaît pas
- Vérifiez que vous êtes connecté
- Assurez-vous d'avoir le rôle 'administrateur' (après migration)
- Actualisez la page

### Erreur lors de la migration
- Vérifiez la console du navigateur (F12)
- Assurez-vous que Firebase est correctement configuré
- Vérifiez les permissions Firestore

### Utilisateur pas défini comme admin
- Utilisez la fonction manuelle : collez l'ID utilisateur dans le champ prévu
- Ou utilisez la console : `definirAdministrateur('USER_ID')`

## Sécurité

- Seuls les administrateurs peuvent voir la section Administration
- La migration ne peut être lancée que par un utilisateur connecté
- Les changements sont enregistrés de manière sécurisée dans Firestore

## Support

Si vous rencontrez des problèmes :
1. Ouvrez la console du navigateur (F12 → Console)
2. Lancez `verifierRolesUtilisateurs()` pour diagnostiquer
3. Vérifiez les logs Firebase pour les erreurs</content>
<parameter name="filePath">c:\xampp\htdocs\gestion-taches\MIGRATION_ROLES_GUIDE.md