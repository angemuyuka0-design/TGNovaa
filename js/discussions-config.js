/**
 * CONFIGURATION ET INITIALISATION DES DISCUSSIONS
 * Points d'entrée et variables globales
 */

// ============================================
// DÉPENDANCES REQUISES
// ============================================
// 1. Firebase (firebase-config.js)
// 2. discussions-firebase.js
// 3. discussions-modal.js
// 4. discussions-firebase.css

// ============================================
// CONFIGURATION
// ============================================

const CONFIG_DISCUSSIONS = {
    // Timeout pour l'indicateur "en train d'écrire" (ms)
    TYPING_TIMEOUT: 3000,
    
    // Nombre maximum de messages à charger
    MAX_MESSAGES: 100,
    
    // Actualisations automatiques
    AUTO_REFRESH: true,
    
    // Debug mode
    DEBUG: false
};

// ============================================
// VARIABLES GLOBALES (accessibles de partout)
// ============================================

// Utilisateur connecté
// Défini dans discussions-firebase.js
// Exemple: {id: 'uid', nom: 'John', email: 'john@example.com', avatar: 'url', statut: 'en-ligne'}

// Conversations de l'utilisateur
// Défini dans discussions-firebase.js
// Exemple: {convId: {id, nom, membres, messages, ...}, ...}

// Conversation active
// Défini dans discussions-firebase.js
// Exemple: 'conversationId' ou null

// ============================================
// FONCTIONS PUBLIQUES
// ============================================

/**
 * Crée une nouvelle discussion
 * @param {string} nomDiscussion - Nom de la discussion
 * @param {string[]} membresIds - IDs des membres
 * @returns {Promise<string>} ID de la nouvelle discussion
 */
// creerNouvelleDiscussion(nomDiscussion, membresIds)

/**
 * Envoie un message
 * @param {string} texte - Contenu du message
 * @param {string[]} images - URLs des images (optionnel)
 * @param {object[]} fichiers - Fichiers avec {nom, url} (optionnel)
 * @returns {Promise<void>}
 */
// envoyerMessage(texte, images, fichiers)

/**
 * Charge une conversation
 * @param {string} conversationId - ID de la conversation
 * @returns {void}
 */
// chargerConversation(conversationId)

/**
 * Affiche la modal de nouvelle discussion
 * @returns {void}
 */
// afficherModalNouvelleDiscussion()

// ============================================
// INITIALISATION AUTOMATIQUE
// ============================================

// L'initialisation se fait automatiquement au chargement de discussions-firebase.js
// et utilise firebase.auth().onAuthStateChanged()

// ============================================
// RACCOURCIS UTILES POUR LES TESTS
// ============================================

// Dans la console du navigateur, vous pouvez utiliser:
// - utilisateurConnecte : Voir l'utilisateur actuel
// - conversations : Voir toutes les conversations
// - conversationActive : Voir la conversation active
// - creerNouvelleDiscussion('Nom', ['userId']) : Créer une discussion
// - envoyerMessage('Texte') : Envoyer un message

/**
 * EXEMPLE D'UTILISATION EN CONSOLE:
 * 
 * // 1. Voir l'utilisateur connecté
 * console.log(utilisateurConnecte);
 * 
 * // 2. Voir les conversations
 * console.log(conversations);
 * 
 * // 3. Créer une discussion avec un utilisateur
 * creerNouvelleDiscussion('Ma première discussion', ['userId123']);
 * 
 * // 4. Envoyer un message
 * envoyerMessage('Bonjour!');
 * 
 * // 5. Voir la configuration
 * console.log(CONFIG_DISCUSSIONS);
 */

// ============================================
// ÉVÉNEMENTS PERSONNALISÉS
// ============================================

// Les événements suivants sont disponibles:
// - 'nouvelleConversation' : Quand une conversation est créée
// - 'nouveauMessage' : Quand un message est reçu
// - 'utilisateurEnLigne' : Quand un utilisateur se connecte
// - 'utilisateurHorsLigne' : Quand un utilisateur se déconnecte

// Exemple d'écoute:
// document.addEventListener('nouveauMessage', (e) => {
//     console.log('Nouveau message:', e.detail);
// });

// ============================================
// INTÉGRATION AVEC LE RESTE DE L'APP
// ============================================

// Lié à dashboard.js pour:
// - Authentification utilisateur
// - Synchronisation de l'état de l'utilisateur
// - Navigation

// Utilise firebase-config.js pour:
// - Connexion à Firebase
// - Accès à Firestore
// - Authentification

// ============================================
// LIMITATIONS ET POINTS À AMÉLIORER
// ============================================

// TODO: 
// - [ ] Appels vidéo/audio avec WebRTC
// - [ ] Édition de messages
// - [ ] Suppression de messages
// - [ ] Réactions aux messages (emojis)
// - [ ] Mentions (@user)
// - [ ] Recherche dans les messages
// - [ ] Archivage de conversations
// - [ ] Partage d'écran
// - [ ] Enregistrements vocaux
// - [ ] Groupes avec permissions avancées

// ============================================
// STRUCTURE DES OBJETS
// ============================================

/*
// Structure d'un utilisateur
{
    id: "uid",
    nom: "John Doe",
    email: "john@example.com",
    avatar: "https://...",
    statut: "en-ligne"
}

// Structure d'une conversation
{
    id: "conversationId",
    nom: "Discussion avec Alice",
    membres: ["uid1", "uid2"],
    membresInfo: [
        {id, nom, email, avatar},
        ...
    ],
    createurId: "uid1",
    dateCreation: Timestamp,
    derniereModification: Timestamp,
    derniereMessage: "Dernier message...",
    derniereAuteur: "uid2",
    avatarGroupe: "url",
    statut: "actif",
    utilisateurEnTrainDecrire: ["uid2"],
    nonLus: {uid1: 0, uid2: 3},
    messages: {}
}

// Structure d'un message
{
    id: "messageId",
    auteurId: "uid1",
    avatarAuteur: "https://...",
    texte: "Contenu du message",
    images: ["url1", "url2"],
    fichiers: [{nom: "file.pdf", url: "https://..."}],
    dateEnvoi: Timestamp,
    lu: true
}
*/
