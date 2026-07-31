/**
 * GESTIONNAIRE D'OVERLAY DE CHARGEMENT
 * Affiche un overlay de chargement pendant les opérations Firebase
 * Empêche les interactions utilisateur multiples
 */

// ============================================
// CONFIGURATION ET INITIALISATION
// ============================================

// État du chargement
let isLoading = false;
let loadingOverlay = null;

// ============================================
// CRÉATION DE L'OVERLAY
// ============================================

/**
 * Initialise l'overlay de chargement
 */
function initialiserLoadingOverlay() {
    // Éviter les doublons
    if (document.getElementById('loading-overlay')) return;

    // Injecter le CSS
    injecterCSSLoading();

    // Créer l'overlay HTML
    creerOverlayHTML();

    console.log('✅ Overlay de chargement initialisé');
}

/**
 * Injecte le CSS pour l'overlay de chargement
 */
function injecterCSSLoading() {
    const css = `
        /* Overlay de chargement */
        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            pointer-events: none;
        }

        .loading-overlay.active {
            opacity: 1;
            visibility: visible;
            pointer-events: auto;
        }

        .loading-content {
            background: white;
            border-radius: 16px;
            padding: 2rem;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            max-width: 300px;
            width: 90%;
        }

        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #e3e3e3;
            border-top: 4px solid #4F46E5;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
        }

        .loading-text {
            color: #333;
            font-size: 1rem;
            font-weight: 500;
            margin: 0;
            font-family: 'Inter', sans-serif;
        }

        .loading-subtext {
            color: #666;
            font-size: 0.9rem;
            margin: 0.5rem 0 0 0;
            font-family: 'Inter', sans-serif;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        /* Mode sombre */
        .mode-sombre .loading-content {
            background: #1f2937;
            color: white;
        }

        .mode-sombre .loading-text {
            color: #f3f4f6;
        }

        .mode-sombre .loading-subtext {
            color: #9ca3af;
        }

        .mode-sombre .loading-spinner {
            border-color: #374151;
            border-top-color: #8b5cf6;
        }

        /* Modal utilitaire */
        .modal-utils-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.55);
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.25s ease;
            z-index: 10001;
            pointer-events: none;
        }

        .modal-utils-overlay.visible {
            opacity: 1;
            visibility: visible;
            pointer-events: auto;
        }

        .modal-utils-content {
            background: #ffffff;
            border-radius: 18px;
            box-shadow: 0 24px 50px rgba(0, 0, 0, 0.25);
            width: min(520px, calc(100% - 32px));
            max-height: 90vh;
            overflow: hidden;
            transform: translateY(-20px);
            transition: transform 0.25s ease;
        }

        .modal-utils-overlay.visible .modal-utils-content {
            transform: translateY(0);
        }

        .modal-utils-header {
            padding: 20px 24px;
            border-bottom: 1px solid #edf2f7;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .modal-utils-title {
            font-size: 1.15rem;
            font-weight: 700;
            margin: 0;
            color: #111827;
        }

        .modal-utils-close {
            background: transparent;
            border: none;
            font-size: 1.5rem;
            color: #6b7280;
            cursor: pointer;
            line-height: 1;
        }

        .modal-utils-body {
            padding: 20px 24px;
            color: #374151;
            font-size: 0.98rem;
            line-height: 1.6;
            overflow-y: auto;
            max-height: calc(90vh - 170px);
        }

        .modal-utils-actions {
            padding: 16px 24px 24px;
            display: flex;
            gap: 12px;
            justify-content: flex-end;
            flex-wrap: wrap;
            background: #fafafa;
        }

        .modal-utils-btn {
            min-width: 100px;
            padding: 10px 16px;
            border-radius: 10px;
            border: 1px solid transparent;
            cursor: pointer;
            font-weight: 600;
            transition: background-color 0.2s ease, border-color 0.2s ease;
        }

        .modal-utils-btn.primary {
            background: #4f46e5;
            color: white;
            border-color: #4f46e5;
        }

        .modal-utils-btn.primary:hover {
            background: #4338ca;
        }

        .modal-utils-btn.secondary {
            background: white;
            color: #374151;
            border-color: #d1d5db;
        }

        .modal-utils-btn.secondary:hover {
            background: #f8fafc;
        }

        .modal-utils-btn.danger {
            background: #dc2626;
            color: white;
            border-color: #dc2626;
        }

        .modal-utils-btn.danger:hover {
            background: #b91c1c;
        }

        .modal-utils-body p {
            margin: 0 0 1rem;
        }

        .modal-utils-body p:last-child {
            margin-bottom: 0;
        }

        /* Responsive */
        @media (max-width: 480px) {
            .loading-content {
                padding: 1.5rem;
                margin: 1rem;
            }

            .loading-text {
                font-size: 0.95rem;
            }

            .loading-subtext {
                font-size: 0.85rem;
            }

            .modal-utils-content {
                width: calc(100% - 24px);
                border-radius: 14px;
            }

            .modal-utils-header,
            .modal-utils-body,
            .modal-utils-actions {
                padding-left: 16px;
                padding-right: 16px;
            }
        }
    `;

    const style = document.createElement('style');
    style.id = 'loading-overlay-styles';
    style.textContent = css;
    document.head.appendChild(style);
}

/**
 * Crée l'HTML de l'overlay
 */
function creerOverlayHTML() {
    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.className = 'loading-overlay';

    overlay.innerHTML = `
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <p class="loading-text" id="loading-text">Chargement en cours...</p>
            <p class="loading-subtext" id="loading-subtext">Veuillez patienter</p>
        </div>
    `;

    document.body.appendChild(overlay);
    loadingOverlay = overlay;
}

// ============================================
// GESTION DE L'AFFICHAGE
// ============================================

/**
 * Affiche l'overlay de chargement
 * @param {string} textePrincipal - Texte principal (ex: "Mise à jour des informations")
 * @param {string} texteSecondaire - Texte secondaire (optionnel)
 */
function afficherLoading(textePrincipal = 'Chargement en cours...', texteSecondaire = 'Veuillez patienter') {
    if (isLoading) return; // Éviter les appels multiples

    // Initialiser si nécessaire
    if (!loadingOverlay) {
        initialiserLoadingOverlay();
    }

    isLoading = true;

    // Mettre à jour les textes
    const texteElement = document.getElementById('loading-text');
    const subtexteElement = document.getElementById('loading-subtext');

    if (texteElement) texteElement.textContent = textePrincipal;
    if (subtexteElement) subtexteElement.textContent = texteSecondaire;

    // Afficher l'overlay
    loadingOverlay.classList.add('active');

    console.log('🔄 Loading overlay affiché:', textePrincipal);
}

/**
 * Masque l'overlay de chargement
 */
function masquerLoading() {
    if (!isLoading) return;

    isLoading = false;

    if (loadingOverlay) {
        loadingOverlay.classList.remove('active');
    }

    console.log('✅ Loading overlay masqué');
}

/**
 * Affiche l'overlay pendant l'exécution d'une promesse
 * @param {Promise} promesse - La promesse à exécuter
 * @param {string} textePrincipal - Texte principal
 * @param {string} texteSecondaire - Texte secondaire
 * @returns {Promise} - La promesse originale
 */
async function avecLoading(promesse, textePrincipal = 'Traitement en cours...', texteSecondaire = 'Veuillez patienter') {
    afficherLoading(textePrincipal, texteSecondaire);

    try {
        const resultat = await promesse;
        return resultat;
    } finally {
        masquerLoading();
    }
}

// ============================================
// MODALES UTILES
// ============================================

let modalUtilsOverlay = null;
let modalUtilsConfirmCallback = null;
let modalUtilsCancelCallback = null;

function initialiserModalUtils() {
    if (modalUtilsOverlay || document.getElementById('modal-utils-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'modal-utils-overlay';
    overlay.className = 'modal-utils-overlay';
    overlay.innerHTML = `
        <div class="modal-utils-content">
            <div class="modal-utils-header">
                <h2 class="modal-utils-title" id="modal-utils-title">Titre</h2>
                <button class="modal-utils-close" id="modal-utils-fermer" aria-label="Fermer">×</button>
            </div>
            <div class="modal-utils-body" id="modal-utils-body"></div>
            <div class="modal-utils-actions" id="modal-utils-actions"></div>
        </div>
    `;

    document.body.appendChild(overlay);
    modalUtilsOverlay = overlay;

    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
            fermerModalUtils();
            if (typeof modalUtilsCancelCallback === 'function') {
                modalUtilsCancelCallback();
            }
        }
    });

    overlay.querySelector('#modal-utils-fermer')?.addEventListener('click', () => {
        fermerModalUtils();
        if (typeof modalUtilsCancelCallback === 'function') {
            modalUtilsCancelCallback();
        }
    });
}

function afficherModalMessage(titre, message, type = 'info', options = {}) {
    initialiserModalUtils();
    modalUtilsConfirmCallback = null;
    modalUtilsCancelCallback = null;

    const titleElement = modalUtilsOverlay.querySelector('#modal-utils-title');
    const bodyElement = modalUtilsOverlay.querySelector('#modal-utils-body');
    const actionsElement = modalUtilsOverlay.querySelector('#modal-utils-actions');

    titleElement.textContent = titre || 'Information';
    bodyElement.innerHTML = `<p>${message}</p>`;
    actionsElement.innerHTML = `
        <button class="modal-utils-btn primary" id="modal-utils-ok">${options.confirmText || 'Fermer'}</button>
    `;

    const okButton = actionsElement.querySelector('#modal-utils-ok');
    okButton.addEventListener('click', () => {
        fermerModalUtils();
        if (typeof options.onClose === 'function') options.onClose();
    });

    modalUtilsOverlay.classList.add('visible');
}

function demanderConfirmation(titre, message, onConfirm, onCancel, options = {}) {
    initialiserModalUtils();
    modalUtilsConfirmCallback = onConfirm;
    modalUtilsCancelCallback = onCancel;

    const titleElement = modalUtilsOverlay.querySelector('#modal-utils-title');
    const bodyElement = modalUtilsOverlay.querySelector('#modal-utils-body');
    const actionsElement = modalUtilsOverlay.querySelector('#modal-utils-actions');

    titleElement.textContent = titre || 'Confirmation';
    bodyElement.innerHTML = `<p>${message}</p>`;
    actionsElement.innerHTML = `
        <button class="modal-utils-btn secondary" id="modal-utils-cancel">${options.cancelText || 'Annuler'}</button>
        <button class="modal-utils-btn primary" id="modal-utils-confirm">${options.confirmText || 'Confirmer'}</button>
    `;

    const cancelButton = actionsElement.querySelector('#modal-utils-cancel');
    const confirmButton = actionsElement.querySelector('#modal-utils-confirm');

    cancelButton.addEventListener('click', () => {
        fermerModalUtils();
        if (typeof onCancel === 'function') onCancel();
    });

    confirmButton.addEventListener('click', () => {
        fermerModalUtils();
        if (typeof onConfirm === 'function') onConfirm();
    });

    modalUtilsOverlay.classList.add('visible');
}

function fermerModalUtils() {
    if (!modalUtilsOverlay) return;
    modalUtilsOverlay.classList.remove('visible');
    modalUtilsConfirmCallback = null;
    modalUtilsCancelCallback = null;
}

window.modalUtils = {
    afficherMessage: afficherModalMessage,
    demanderConfirmation: demanderConfirmation,
    fermer: fermerModalUtils
};

// ============================================
// TEXTES PRÉDÉFINIS
// ============================================

const TEXTES_LOADING = {
    // Chargement de données
    chargementDonnees: ['Chargement des données', 'Récupération depuis la base de données'],
    chargementTaches: ['Chargement des tâches', 'Synchronisation en cours'],
    chargementProjets: ['Chargement des projets', 'Récupération des informations'],
    chargementUtilisateurs: ['Chargement des utilisateurs', 'Mise à jour de la liste'],

    // Actions
    sauvegarde: ['Sauvegarde en cours', 'Mise à jour des informations'],
    suppression: ['Suppression en cours', 'Traitement de la demande'],
    creation: ['Création en cours', 'Ajout à la base de données'],
    miseAJour: ['Mise à jour', 'Modification des données'],

    // Authentification
    connexion: ['Connexion en cours', 'Vérification des identifiants'],
    inscription: ['Inscription en cours', 'Création du compte'],
    deconnexion: ['Déconnexion', 'Fermeture de la session'],

    // Upload
    upload: ['Téléversement en cours', 'Envoi vers le cloud'],
    traitementImage: ['Traitement de l\'image', 'Optimisation en cours'],

    // Recherche
    recherche: ['Recherche en cours', 'Exploration de la base de données'],
    filtrage: ['Filtrage en cours', 'Application des critères']
};

// ============================================
// INITIALISATION AUTOMATIQUE
// ============================================

// Initialiser au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    initialiserLoadingOverlay();
});

// Exposer les fonctions globalement
window.LoadingOverlay = {
    afficher: afficherLoading,
    masquer: masquerLoading,
    avec: avecLoading,
    textes: TEXTES_LOADING
};