/**
 * CONFIGURATION ET INITIALISATION DES PROJETS
 * Points d'entrée et variables globales pour la gestion des projets
 */

// ============================================
// DÉPENDANCES REQUISES
// ============================================
// 1. Firebase (firebase-config.js)
// 2. projets-firebase.js
// 3. dashboard.js (optionnel, pour les fonctions partagées)

// ============================================
// CONFIGURATION
// ============================================

const CONFIG_PROJETS = {
    // Paramètres d'affichage
    AFFICHAGE: {
        PROJETS_PAR_PAGE: 12,
        VUE_PAR_DEFAUT: 'grille', // 'grille' ou 'tableau'
        APERCU_DESCRIPTION_MAX: 100 // Nombre max de caractères pour l'aperçu
    },
    
    // Statuts possibles
    STATUTS: {
        ACTIF: 'actif',
        TERMINE: 'termine',
        EN_RETARD: 'en-retard'
    },
    
    // Catégories prédéfinies
    CATEGORIES: {
        DEVELOPPEMENT: 'developpement',
        DESIGN: 'design',
        MARKETING: 'marketing',
        AUTRE: 'autre'
    },
    
    // Couleurs disponibles
    COULEURS: ['bleu', 'vert', 'violet', 'orange', 'rose', 'rouge', 'cyan', 'jaune'],
    
    // Seuils de progression
    SEUILS: {
        CRITIQUE: 25,   // < 25% = progression critique
        ATTENTION: 50,  // < 50% = attention requise
        BON: 75,        // < 75% = bonne progression
        EXCELLENT: 100  // 100% = terminé
    },
    
    // Timeouts
    TIMEOUTS: {
        SAUVEGARDE_AUTO: 5000, // ms entre les sauvegardes auto
        ANIMATION_COMPTEUR: 800 // ms pour l'animation des compteurs
    },
    
    // Debug mode
    DEBUG: false
};

// ============================================
// VARIABLES GLOBALES (accessibles de partout)
// ============================================

// Utilisateur connecté
// Défini dans projets-firebase.js
// Exemple: {id: 'uid', nom: 'John', email: 'john@example.com', avatar: 'url', statut: 'en-ligne'}

// Projets de l'utilisateur
// Défini dans projets-firebase.js
// Exemple: {projetId: {id, titre, description, statut, progression, ...}, ...}

// Projet actuel (celui affiché dans les modales)
// Défini dans projets-firebase.js
// Exemple: 'projetId' ou null

// ============================================
// FONCTIONS PUBLIQUES
// ============================================

/**
 * Ouvre la modale pour créer ou modifier un projet
 * @param {string} [projetId] - ID du projet à modifier (optionnel, si absent → création)
 * @returns {void}
 */
// ouvrirModalProjet(projetId)

/**
 * Ferme la modale de projet
 * @returns {void}
 */
// fermerModalProjet()

/**
 * Sauvegarde un projet (création ou modification)
 * Récupère automatiquement les données du formulaire
 * @returns {Promise<void>}
 */
// sauvegarderProjet()

/**
 * Affiche les détails d'un projet
 * @param {string} projetId - ID du projet à afficher
 * @returns {Promise<void>}
 */
// afficherDetailsProjet(projetId)

/**
 * Ferme la modale d'information
 * @returns {void}
 */
// fermerModaleInfoProjet()

/**
 * Bascule le statut favori d'un projet
 * @param {string} projetId - ID du projet
 * @returns {Promise<void>}
 */
// toggleFavoriProjet(projetId)

/**
 * Confirme et supprime un projet
 * Affiche une boîte de dialogue de confirmation
 * @param {string} projetId - ID du projet à supprimer
 * @returns {void}
 */
// confirmerSuppressionProjet(projetId)

/**
 * Supprime un projet directement (sans confirmation)
 * @param {string} projetId - ID du projet à supprimer
 * @returns {Promise<void>}
 */
// supprimerProjet(projetId)

/**
 * Filtre les projets par statut
 * @param {string} filtre - 'tous', 'actifs', 'termines', 'en-retard', 'favoris'
 * @returns {void}
 */
// filtrerProjets(filtre)

/**
 * Recherche des projets par texte
 * @param {string} terme - Terme à rechercher
 * @returns {void}
 */
// rechercherProjets(terme)

/**
 * Met à jour l'affichage des projets (après filtres/recherche)
 * @returns {void}
 */
// mettreAJourAffichageProjets()

// ============================================
// INITIALISATION AUTOMATIQUE
// ============================================

// L'initialisation se fait automatiquement au chargement de projets-firebase.js
// et utilise firebase.auth().onAuthStateChanged()

// ============================================
// RACCOURCIS UTILES POUR LES TESTS
// ============================================

// Dans la console du navigateur, vous pouvez utiliser:
// - utilisateurConnecte : Voir l'utilisateur actuel
// - projets : Voir tous les projets
// - projetActuel : Voir le projet actuellement sélectionné
// - ouvrirModalProjet() : Créer un nouveau projet
// - ouvrirModalProjet('projetId') : Modifier un projet existant
// - afficherDetailsProjet('projetId') : Voir les détails
// - toggleFavoriProjet('projetId') : Ajouter/retirer des favoris

/**
 * EXEMPLE D'UTILISATION EN CONSOLE:
 * 
 * // 1. Voir l'utilisateur connecté
 * console.log(utilisateurConnecte);
 * 
 * // 2. Voir tous les projets
 * console.log(projets);
 * 
 * // 3. Créer un nouveau projet
 * ouvrirModalProjet();
 * 
 * // 4. Voir les détails du premier projet
 * const premierProjet = Object.keys(projets)[0];
 * afficherDetailsProjet(premierProjet);
 * 
 * // 5. Ajouter aux favoris
 * toggleFavoriProjet(premierProjet);
 * 
 * // 6. Voir la configuration
 * console.log(CONFIG_PROJETS);
 */

// ============================================
// ÉVÉNEMENTS PERSONNALISÉS
// ============================================

// Les événements suivants sont disponibles:
// - 'projetCree' : Quand un projet est créé
// - 'projetModifie' : Quand un projet est modifié
// - 'projetSupprime' : Quand un projet est supprimé
// - 'projetFavoriChange' : Quand le statut favori change
// - 'projetsFiltres' : Quand un filtre est appliqué

// Exemple d'écoute:
// document.addEventListener('projetCree', (e) => {
//     console.log('Nouveau projet créé:', e.detail);
// });

// Pour émettre un événement personnalisé:
// document.dispatchEvent(new CustomEvent('projetCree', { 
//     detail: { projetId: '123', titre: 'Mon projet' } 
// }));

// ============================================
// INTÉGRATION AVEC LE RESTE DE L'APP
// ============================================

// Lié à dashboard.js pour:
// - Authentification utilisateur
// - Synchronisation de l'état de l'utilisateur
// - Navigation
// - Fonctions partagées (afficherToast, animerCompteur, etc.)

// Utilise firebase-config.js pour:
// - Connexion à Firebase
// - Accès à Firestore
// - Authentification

// Lié aux discussions via:
// - Membres partagés (utilisateurs)
// - Notifications communes

// ============================================
// STRUCTURE DES OBJETS
// ============================================

/*
// Structure d'un utilisateur (pour les membres)
{
    id: "uid123",
    nom: "John Doe",
    email: "john@example.com",
    avatar: "https://...",
    statut: "en-ligne"
}

// Structure d'un projet
{
    id: "projet123",
    titre: "Site web e-commerce",
    nom: "Site web e-commerce", // Pour compatibilité
    description: "Développement d'une plateforme de vente en ligne avec paiement intégré",
    categorie: "developpement", // developpement, design, marketing, autre
    dateDebut: "2024-01-15",
    dateLimite: "2024-03-30",
    statut: "actif", // actif, termine, en-retard
    progression: 45, // 0-100
    favori: false,
    createurId: "uid123",
    membres: ["uid123", "uid456"],
    membresInfo: [
        {
            id: "uid123",
            nom: "John Doe",
            email: "john@example.com",
            avatar: "https://..."
        },
        {
            id: "uid456",
            nom: "Jane Smith",
            email: "jane@example.com",
            avatar: "https://..."
        }
    ],
    dateCreation: Timestamp,
    dateModification: Timestamp,
    icone: "code", // Pour l'affichage (optionnel)
    couleur: "bleu", // Pour l'affichage (optionnel)
    taches: 12, // Nombre de tâches (calculé dynamiquement)
    tachesTerminees: 5 // Nombre de tâches terminées (calculé dynamiquement)
}

// Structure pour les statistiques
{
    projetsActifs: 5,
    projetsTermines: 2,
    projetsEnRetard: 1,
    equipesImpliquees: 8,
    progressionGlobale: 67, // Pourcentage moyen
    totalProjets: 8
}

// Structure pour les filtres
{
    statut: "actif", // ou "termine", "en-retard", "tous"
    categorie: "developpement", // ou null pour tous
    recherche: "site web",
    favoris: false, // ou true pour uniquement les favoris
    dateDebutMin: "2024-01-01",
    dateDebutMax: "2024-12-31"
}
*/

// ============================================
// LIMITATIONS ET POINTS À AMÉLIORER
// ============================================

// TODO: Fonctionnalités à ajouter
// - [ ] Modèles de projets pré-définis
// - [ ] Export de projets (PDF, CSV)
// - [ ] Duplication de projets
// - [ ] Partage public/privé
// - [ ] Historique des modifications
// - [ ] Gestion des droits (admin, éditeur, lecteur)
// - [ ] Sous-projets et dépendances
// - [ ] Budget et suivi financier
// - [ ] Documents joints (spécifications, maquettes)
// - [ ] Timeline/Gantt des projets
// - [ ] Notifications par email
// - [ ] Intégration calendrier
// - [ ] Métriques avancées (ROI, temps passé)
// - [ ] Import depuis Excel/CSV
// - [ ] Archives et sauvegardes

// ============================================
// AMÉLIORATIONS TECHNIQUES
// ============================================

// TODO: Optimisations
// - [ ] Mise en cache des données
// - [ ] Pagination pour les grands projets
// - [ ] Indexation Firestore optimisée
// - [ ] Validation côté serveur (security rules)
// - [ ] Tests unitaires et d'intégration
// - [ ] Gestion des conflits en temps réel
// - [ ] Compression des images
// - [ ] Mode hors-ligne