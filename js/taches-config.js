/**
 * CONFIGURATION ET INITIALISATION DES TÂCHES
 * Points d'entrée et variables globales
 */

// ============================================
// DÉPENDANCES REQUISES
// ============================================
// 1. Firebase (firebase-config.js)
// 2. taches-firebase.js
// 3. dashboard.js (pour les fonctions partagées)
// 4. taches.css

// ============================================
// CONFIGURATION
// ============================================

const CONFIG_TACHES = {
    // Options d'affichage
    VUES_DISPONIBLES: ['tableau', 'grille'],
    VUE_PAR_DEFAUT: 'tableau',
    
    // Filtres par défaut
    FILTRES_PAR_DEFAUT: {
        statut: 'tous',
        priorite: 'toutes',
        projet: 'tous',
        echeance: 'toutes'
    },
    
    // Pagination
    ITEMS_PAR_PAGE: 10,
    
    // Couleurs par priorité
    COULEURS_PRIORITE: {
        haute: 'rouge',
        moyenne: 'orange',
        basse: 'vert'
    },
    
    // Libellés
    LIBELLES_STATUT: {
        'a-faire': 'À faire',
        'en-cours': 'En cours',
        'terminee': 'Terminée'
    },
    
    LIBELLES_PRIORITE: {
        haute: 'Haute',
        moyenne: 'Moyenne',
        basse: 'Basse'
    },
    
    // Actualisations automatiques
    AUTO_REFRESH: true,
    
    // Timeout pour les actions (ms)
    ACTION_TIMEOUT: 5000,
    
    // Debug mode
    DEBUG: false
};

// ============================================
// VARIABLES GLOBALES
// ============================================

// Utilisateur connecté (partagé avec dashboard.js)
// Défini dans dashboard.js
// Exemple: {id: 'uid', nom: 'John', email: 'john@example.com', avatar: 'url'}

// Tâches de l'utilisateur
// Défini dans dashboard.js et taches-firebase.js
// Exemple: [{id, titre, description, projet, priorite, statut, echeance, ...}]

// Projets disponibles (pour les filtres)
// Défini dans dashboard.js
// Exemple: [{id, nom, couleur, icone}, ...]

// Vue active (tableau ou grille)
let vueActive = localStorage.getItem('tgnova_vue_taches') || CONFIG_TACHES.VUE_PAR_DEFAUT;

// Filtres actifs
let filtresActifs = { ...CONFIG_TACHES.FILTRES_PAR_DEFAUT };

// Tâches sélectionnées (pour actions groupées)
let tachesSelectionnees = [];

// Pagination
let pageActuelle = 1;
let totalPages = 1;

// ============================================
// FONCTIONS PUBLIQUES
// ============================================

/**
 * Charge toutes les tâches depuis Firebase
 * @returns {Promise<Array>} Liste des tâches
 */
// chargerTaches()

/**
 * Crée une nouvelle tâche
 * @param {Object} tache - Données de la tâche
 * @returns {Promise<string>} ID de la nouvelle tâche
 */
// creerNouvelleTache(tache)

/**
 * Met à jour une tâche existante
 * @param {string} tacheId - ID de la tâche
 * @param {Object} updates - Mises à jour
 * @returns {Promise<void>}
 */
// mettreAJourTache(tacheId, updates)

/**
 * Supprime une tâche
 * @param {string} tacheId - ID de la tâche
 * @returns {Promise<void>}
 */
// supprimerTache(tacheId)

/**
 * Filtre les tâches selon les critères
 * @param {Object} filtres - Critères de filtre
 * @returns {Array} Tâches filtrées
 */
// filtrerTaches(filtres)

/**
 * Change la vue (tableau/grille)
 * @param {string} vue - 'tableau' ou 'grille'
 */
// changerVue(vue)

/**
 * Exporte les tâches au format CSV/JSON
 * @param {Array} taches - Tâches à exporter
 * @param {string} format - 'csv' ou 'json'
 */
// exporterTaches(taches, format)

// ============================================
// INITIALISATION AUTOMATIQUE
// ============================================

// L'initialisation se fait automatiquement au chargement de taches-firebase.js
// et utilise firebase.auth().onAuthStateChanged() et les données de dashboard.js

// ============================================
// RACCOURCIS UTILES POUR LES TESTS
// ============================================

// Dans la console du navigateur, vous pouvez utiliser:
// - taches : Voir toutes les tâches
// - filtresActifs : Voir les filtres actuels
// - vueActive : Voir la vue active
// - creerNouvelleTache({titre: 'Test', ...}) : Créer une tâche
// - filtrerTaches({statut: 'a-faire'}) : Filtrer les tâches

// ============================================
// ÉVÉNEMENTS PERSONNALISÉS
// ============================================

// Les événements suivants sont disponibles:
// - 'tachesModifiees' : Quand la liste des tâches change
// - 'tacheAjoutee' : Quand une nouvelle tâche est créée
// - 'tacheModifiee' : Quand une tâche est modifiée
// - 'tacheSupprimee' : Quand une tâche est supprimée
// - 'filtresChanges' : Quand les filtres sont modifiés
// - 'vueChangee' : Quand la vue est changée

// Exemple d'écoute:
// document.addEventListener('tacheAjoutee', (e) => {
//     console.log('Nouvelle tâche:', e.detail);
// });

// ============================================
// INTÉGRATION AVEC LE RESTE DE L'APP
// ============================================

// Lié à dashboard.js pour:
// - Authentification utilisateur
// - État global de l'application
// - Notifications
// - Thème

// Lié à taches-firebase.js pour:
// - Opérations CRUD Firebase
// - Écoute en temps réel
// - Synchronisation

// Lié à taches.html pour:
// - Interface utilisateur
// - Événements DOM
// - Affichage des données

// ============================================
// LIMITATIONS ET POINTS À AMÉLIORER
// ============================================

// TODO: 
// - [ ] Sous-tâches
// - [ ] Tags personnalisés
// - [ ] Pièces jointes
// - [ ] Commentaires sur les tâches
// - [ ] Historique des modifications
// - [ ] Templates de tâches
// - [ ] Import/Export avancé
// - [ ] Rappels et notifications
// - [ ] Vue calendrier
// - [ ] Vue Kanban
// - [ ] Dépendances entre tâches
// - [ ] Estimation de temps
// - [ ] Assignation multiple
// - [ ] Filtres sauvegardés

// ============================================
// STRUCTURE DES OBJETS
// ============================================

/*
// Structure d'une tâche (identique à dashboard.js)
{
    id: "123",
    firestoreId: "abc123def456",
    titre: "Finaliser le rapport",
    description: "Rédaction et mise en forme...",
    projet: "Analyse",
    priorite: "haute",
    statut: "en-cours",
    echeance: "2024-12-31",
    completee: false,
    assigne: "John Doe",
    createurId: "user123",
    dateCreation: "2024-01-01T10:00:00.000Z",
    dateModification: "2024-01-02T14:30:00.000Z"
}

// Structure des filtres
{
    statut: "tous",           // 'tous', 'a-faire', 'en-cours', 'terminee'
    priorite: "toutes",        // 'toutes', 'haute', 'moyenne', 'basse'
    projet: "tous",            // 'tous' ou ID/nom du projet
    echeance: "toutes",        // 'toutes', 'aujourdhui', 'semaine', 'mois', 'retard'
    recherche: "",             // Texte de recherche
    assigne: "tous"            // 'tous' ou ID de l'utilisateur
}

// Structure pour l'export
{
    metadata: {
        date: "2024-01-15",
        utilisateur: "John Doe",
        total: 24
    },
    taches: [
        { titre, description, projet, priorite, statut, echeance, assigne }
    ]
}
*/

// ============================================
// UTILITAIRES SPÉCIFIQUES AUX TÂCHES
// ============================================

/**
 * Calcule les statistiques des tâches
 * @param {Array} taches - Liste des tâches
 * @returns {Object} Statistiques
 */
function calculerStatistiquesTaches(taches) {
    return {
        total: taches.length,
        terminees: taches.filter(t => t.statut === 'terminee').length,
        enCours: taches.filter(t => t.statut === 'en-cours').length,
        aFaire: taches.filter(t => t.statut === 'a-faire').length,
        enRetard: taches.filter(t => {
            if (!t.echeance || t.statut === 'terminee') return false;
            return new Date(t.echeance) < new Date();
        }).length
    };
}

/**
 * Vérifie si une tâche est en retard
 * @param {Object} tache - La tâche à vérifier
 * @returns {boolean} True si en retard
 */
function estEnRetard(tache) {
    if (!tache.echeance || tache.statut === 'terminee') return false;
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);
    const echeance = new Date(tache.echeance);
    echeance.setHours(0, 0, 0, 0);
    return echeance < aujourdhui;
}

/**
 * Formate l'échéance pour affichage
 * @param {string} echeance - Date d'échéance
 * @returns {string} Échéance formatée
 */
function formaterEcheance(echeance) {
    if (!echeance) return 'Non définie';
    
    const date = new Date(echeance);
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);
    
    const dateSansHeure = new Date(date);
    dateSansHeure.setHours(0, 0, 0, 0);
    
    const diffJours = Math.round((dateSansHeure - aujourdhui) / (1000 * 60 * 60 * 24));
    
    if (diffJours === 0) return "Aujourd'hui";
    if (diffJours === 1) return "Demain";
    if (diffJours === -1) return "Hier";
    if (diffJours < 0) return `En retard (${Math.abs(diffJours)}j)`;
    if (diffJours < 7) return `Dans ${diffJours}j`;
    
    return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short'
    });
}

// ============================================
// VALIDATION DES DONNÉES
// ============================================

/**
 * Valide les données d'une tâche
 * @param {Object} tache - Tâche à valider
 * @returns {Object} Résultat de la validation
 */
function validerTache(tache) {
    const erreurs = [];
    
    if (!tache.titre || tache.titre.trim().length < 3) {
        erreurs.push('Le titre doit contenir au moins 3 caractères');
    }
    
    if (tache.titre && tache.titre.length > 100) {
        erreurs.push('Le titre ne peut pas dépasser 100 caractères');
    }
    
    if (tache.description && tache.description.length > 500) {
        erreurs.push('La description ne peut pas dépasser 500 caractères');
    }
    
    const prioritesValides = ['haute', 'moyenne', 'basse'];
    if (tache.priorite && !prioritesValides.includes(tache.priorite)) {
        erreurs.push('Priorité invalide');
    }
    
    const statutsValides = ['a-faire', 'en-cours', 'terminee'];
    if (tache.statut && !statutsValides.includes(tache.statut)) {
        erreurs.push('Statut invalide');
    }
    
    if (tache.echeance && isNaN(new Date(tache.echeance).getTime())) {
        erreurs.push('Date d\'échéance invalide');
    }
    
    return {
        valide: erreurs.length === 0,
        erreurs
    };
}

// Exporter les fonctions utilitaires
window.TACHES_UTILS = {
    calculerStatistiquesTaches,
    estEnRetard,
    formaterEcheance,
    validerTache,
    CONFIG_TACHES
};

console.log('✅ Configuration des tâches initialisée');