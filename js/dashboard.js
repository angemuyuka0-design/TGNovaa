// ============================================
// DASHBOARD AMÉLIORÉ - TGNOVA (Version Firebase)
// ============================================

// Utilise les variables globales 'db' et 'auth' initialisées dans firebase-config.js

/**
 * État global de l'application
 */
const EtatApplication = {
    barreLateraleReduite: localStorage.getItem('barreLateraleReduite') === 'true',
    modeSombre: localStorage.getItem('modeSombre') === 'true',
    notifications: [],
    taches: [],
    projets: [],
    evenements: [],
    modalOuverte: null,
    modeEdition: null,
    utilisateur: null,
    utilisateurInfo: {
        nom: '.',
        email: '.',
        prenom: '.',
        avatar: null
    }
};

// ============================================
// AUTHENTIFICATION & INITIALISATION
// ============================================

/**
 * Initialisation au chargement de la page
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initialisation du Dashboard TGNOVA (Firebase)');
    
    // Vérifier l'authentification
    firebase.auth().onAuthStateChanged((user) => {
        if (!user) {
            console.log("Aucun utilisateur connecté - Redirection vers la page de connexion");
            window.location.href = 'login.html';
            return;
        }
        
        console.log("Utilisateur connecté :", user.uid);
        EtatApplication.utilisateur = user;
        
        // Récupérer les informations de l'utilisateur
        recupererInfosUtilisateur(user);
        
        // Charger les données depuis Firebase
        chargerDonneesFirebase();
        
        // Initialiser l'application
        initialiserApplication();
        
        // Afficher l'état initial
        initialiserDate();
        initialiserRecherche();
        initialiserObservateurAnimations();
        initialiserActionsRapides();
        
        // Mettre à jour l'affichage
        mettreAJourAffichage();
        
        console.log('✅ Dashboard prêt');
    });
});

/**
 * Récupère les informations de l'utilisateur depuis Firebase Auth
 */
function recupererInfosUtilisateur(user) {
    if (!user) return;
    
    // Récupérer le prénom depuis le displayName ou l'email
    let prenom = 'Utilisateur';
    
    if (user.displayName) {
        // Si displayName est présent, prendre le premier mot comme prénom
        prenom = user.displayName.split(' ')[0];
    } else if (user.email) {
        // Sinon, utiliser la partie avant le @ dans l'email
        prenom = user.email.split('@')[0];
        // Capitaliser la première lettre
        prenom = prenom.charAt(0).toUpperCase() + prenom.slice(1);
    }
    
    // Récupérer le nom complet depuis displayName ou créer un nom par défaut
    let nomComplet = user.displayName || prenom;
    
    EtatApplication.utilisateurInfo = {
        nom: nomComplet,
        prenom: prenom,
        email: user.email || 'email@non.defini',
        avatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(prenom)}&background=4F46E5&color=fff`
    };
    
    console.log("✅ Informations utilisateur:", EtatApplication.utilisateurInfo);
    
    // Mettre à jour l'affichage du profil et du message d'accueil
    mettreAJourProfilUtilisateur();
    mettreAJourMessageAccueil();
}

/**
 * Met à jour le message d'accueil avec le prénom de l'utilisateur
 */
function mettreAJourMessageAccueil() {
    const titreAccueil = document.querySelector('.contenu-accueil h1');
    if (titreAccueil) {
        const prenom = EtatApplication.utilisateurInfo.prenom;
        titreAccueil.textContent = `Bonjour, ${prenom}`;
    }
}

/**
 * Met à jour les informations du profil dans la barre latérale
 */
function mettreAJourProfilUtilisateur() {
    const nomUtilisateur = document.querySelector('.nom-utilisateur');
    const emailUtilisateur = document.querySelector('.email-utilisateur');
    const avatarUtilisateur = document.querySelector('.avatar-utilisateur img');
    
    if (nomUtilisateur) {
        nomUtilisateur.textContent = EtatApplication.utilisateurInfo.nom;
    }
    
    if (emailUtilisateur) {
        emailUtilisateur.textContent = EtatApplication.utilisateurInfo.email;
    }
    
    if (avatarUtilisateur && EtatApplication.utilisateurInfo.avatar) {
        avatarUtilisateur.src = EtatApplication.utilisateurInfo.avatar;
    }
}

/**
 * Charge toutes les données depuis Firebase
 */
async function chargerDonneesFirebase() {
    if (!EtatApplication.utilisateur) return;
    
    // Afficher l'overlay de chargement
    afficherLoading('Chargement des données', 'Synchronisation avec la base de données...');
    
    try {
        // Charger les tâches
        await ecouterTachesFirebase();
        
        // Charger les projets
        await ecouterProjetsFirebase();
        
        // Charger les notifications depuis localStorage (temporaire)
        chargerNotificationsLocal();
        
        // Masquer l'overlay après un court délai pour permettre l'affichage initial
        setTimeout(() => {
            masquerLoading();
        }, 1000);
        
    } catch (error) {
        console.error('Erreur de chargement des données Firebase:', error);
        afficherToast('Erreur de synchronisation avec la base de données', 'erreur');
        masquerLoading();
    }
}

/**
 * Écoute en temps réel les tâches Firebase
 */
function ecouterTachesFirebase() {
    if (!EtatApplication.utilisateur) return;
    
    const q = firebase.firestore()
        .collection("tasks")
        .where("createurId", "==", EtatApplication.utilisateur.uid);
    
    return q.onSnapshot((snapshot) => {
        EtatApplication.taches = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: parseInt(doc.id.replace(/\D/g, '')) || Date.now() + Math.random(),
                firestoreId: doc.id,
                titre: data.titre || 'Sans titre',
                description: data.description || '',
                projet: data.projet || 'Général',
                priorite: data.priorite || 'moyenne',
                statut: data.statut || 'a-faire',
                echeance: data.dateFin || data.echeance || null,
                completee: data.statut === 'terminee',
                assigne: data.assigne || 'John Doe',
                dateCreation: data.dateCreation?.toDate?.()?.toISOString() || new Date().toISOString(),
                dateModification: data.dateModification?.toDate?.()?.toISOString() || new Date().toISOString()
            };
        }).sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation));
        
        mettreAJourAffichage();
        sauvegarderDonneesLocale();
        
        console.log(`✅ ${EtatApplication.taches.length} tâches chargées depuis Firebase`);
    }, (error) => {
        console.error('Erreur écoute tâches:', error);
    });
}

/**
 * Écoute en temps réel les projets Firebase
 */
function ecouterProjetsFirebase() {
    if (!EtatApplication.utilisateur) return;
    
    const q = firebase.firestore()
        .collection("projets")
        .where("createurId", "==", EtatApplication.utilisateur.uid);
    
    return q.onSnapshot((snapshot) => {
        EtatApplication.projets = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: parseInt(doc.id.replace(/\D/g, '')) || Date.now() + Math.random(),
                firestoreId: doc.id,
                nom: data.nom || data.titre || 'Sans titre',
                titre: data.nom || data.titre || 'Sans titre',
                description: data.description || '',
                taches: data.taches || 0,
                progression: data.progression || 0,
                icone: data.icone || 'folder',
                couleur: data.couleur || 'bleu',
                categorie: data.categorie || 'autre',
                statut: data.statut || 'actif',
                dateDebut: data.dateDebut || new Date().toISOString().split('T')[0],
                dateLimite: data.dateLimite || null,
                membres: data.membres || ['john'],
                favori: data.favori || false,
                dateCreation: data.dateCreation?.toDate?.()?.toISOString() || new Date().toISOString(),
                dateModification: data.dateModification?.toDate?.()?.toISOString() || new Date().toISOString()
            };
        }).sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation));
        
        mettreAJourProjetsActifs();
        mettreAJourStatistiquesProjets();
        sauvegarderDonneesLocale();
        
        console.log(`✅ ${EtatApplication.projets.length} projets chargés depuis Firebase`);
    }, (error) => {
        console.error('Erreur écoute projets:', error);
    });
}

/**
 * Charge les notifications depuis localStorage
 */
function chargerNotificationsLocal() {
    try {
        const notifications = localStorage.getItem('tgnova_notifications');
        if (notifications) {
            EtatApplication.notifications = JSON.parse(notifications);
        } else {
            EtatApplication.notifications = [];
            localStorage.setItem('tgnova_notifications', JSON.stringify([]));
        }
    } catch (error) {
        console.error('Erreur de chargement des notifications:', error);
        EtatApplication.notifications = [];
    }
}

/**
 * Sauvegarde les données en local
 */
function sauvegarderDonneesLocale() {
    try {
        localStorage.setItem('tgnova_taches_local', JSON.stringify(EtatApplication.taches));
        localStorage.setItem('tgnova_projets_local', JSON.stringify(EtatApplication.projets));
    } catch (error) {
        console.error('Erreur sauvegarde locale:', error);
    }
}

/**
 * Sauvegarde les données (compatibilité avec l'ancien code)
 */
function sauvegarderDonnees() {
    sauvegarderDonneesLocale();
}

// ============================================
// GESTION DES TÂCHES (Firebase)
// ============================================

/**
 * Sauvegarde une nouvelle tâche dans Firebase
 */
async function sauvegarderNouvelleTache() {
    const titre = document.getElementById('titreTache')?.value.trim();
    const description = document.getElementById('descriptionTache')?.value.trim() || '';
    const projet = document.getElementById('projetTache')?.value || 'Général';
    const priorite = document.getElementById('prioriteTache')?.value || 'moyenne';
    const statut = document.getElementById('statutTache')?.value || 'a-faire';
    const echeance = document.getElementById('echeanceTache')?.value || null;
    
    if (!titre) {
        afficherToast('Le titre est obligatoire', 'erreur');
        document.getElementById('titreTache')?.focus();
        return;
    }
    
    if (!EtatApplication.utilisateur) {
        afficherToast('Vous devez être connecté', 'erreur');
        return;
    }
    
    try {
        // Afficher l'overlay de chargement
        afficherLoading('Création de la tâche', 'Ajout à la base de données...');

        const nouvelleTache = {
            titre,
            description,
            projet,
            priorite,
            statut,
            dateFin: echeance,
            echeance,
            completee: statut === 'terminee',
            assigne: EtatApplication.utilisateurInfo.nom || 'John Doe',
            createurId: EtatApplication.utilisateur.uid,
            dateCreation: new Date(),
            dateModification: new Date()
        };
        
        const docRef = await firebase.firestore().collection("tasks").add(nouvelleTache);
        console.log("✅ Tâche ajoutée à Firebase avec ID:", docRef.id);
        
        // Ajouter une notification
        ajouterNotification({
            message: `Nouvelle tâche créée : "${titre}"`,
            time: 'À l\'instant',
            icon: 'tasks'
        });
        
        // Notifier la page des tâches
        window.dispatchEvent(new CustomEvent('nouvelleTacheAjoutee', { 
            detail: { tache: { ...nouvelleTache, id: docRef.id, firestoreId: docRef.id } } 
        }));
        
        fermerModalTache();
        afficherToast('Tâche créée avec succès', 'succes');
        
        masquerLoading();
        
    } catch (error) {
        console.error("Erreur ajout tâche Firebase:", error);
        afficherToast('Erreur lors de la création de la tâche', 'erreur');
        masquerLoading();
    }
}

/**
 * Met à jour le statut d'une tâche
 */
async function mettreAJourStatutTache(id, completee) {
    if (!EtatApplication.utilisateur) return;
    
    try {
        const tache = EtatApplication.taches.find(t => t.id === id || t.firestoreId === id);
        if (!tache || !tache.firestoreId) return;
        
        const nouveauStatut = completee ? 'terminee' : 'a-faire';
        
        await firebase.firestore().collection("tasks").doc(tache.firestoreId).update({
            statut: nouveauStatut,
            completee: completee,
            dateModification: new Date()
        });
        
        console.log(`✅ Tâche ${tache.firestoreId} mise à jour: ${nouveauStatut}`);
        
    } catch (error) {
        console.error("Erreur mise à jour tâche Firebase:", error);
        afficherToast('Erreur lors de la mise à jour', 'erreur');
    }
}

/**
 * Gère les cases à cocher des tâches
 */
function gererCaseCoche(e) {
    const caseCoche = e.target;
    const idTache = caseCoche.dataset.id;
    
    if (!idTache) return;
    
    const tache = EtatApplication.taches.find(t => t.id == idTache || t.firestoreId === idTache);
    
    if (tache) {
        // Animation
        const elementTache = caseCoche.closest('.element-tache');
        if (elementTache) {
            if (caseCoche.checked) {
                elementTache.style.opacity = '0.6';
                afficherToast('Tâche terminée !', 'succes');
            } else {
                elementTache.style.opacity = '1';
                afficherToast('Tâche remise en attente', 'info');
            }
        }
        
        // Mettre à jour dans Firebase
        mettreAJourStatutTache(idTache, caseCoche.checked);
        
        // Notifier la page des tâches
        window.dispatchEvent(new CustomEvent('tachesModifiees', { 
            detail: { taches: EtatApplication.taches } 
        }));
    }
}

// ============================================
// GESTION DES PROJETS (Firebase)
// ============================================

/**
 * Sauvegarde un nouveau projet dans Firebase
 */
async function sauvegarderNouveauProjet() {
    const nom = document.getElementById('nomProjet')?.value.trim();
    const description = document.getElementById('descriptionProjet')?.value.trim() || '';
    const icone = document.getElementById('iconeProjet')?.value || 'folder';
    const couleur = document.getElementById('couleurProjet')?.value || 'bleu';
    const dateDebut = document.getElementById('dateDebutProjet')?.value || new Date().toISOString().split('T')[0];
    
    if (!nom) {
        afficherToast('Le nom du projet est obligatoire', 'erreur');
        document.getElementById('nomProjet')?.focus();
        return;
    }
    
    if (!EtatApplication.utilisateur) {
        afficherToast('Vous devez être connecté', 'erreur');
        return;
    }
    
    try {
        // Afficher l'overlay de chargement
        afficherLoading('Création du projet', 'Ajout à la base de données...');

        const dateLimite = new Date(dateDebut);
        dateLimite.setDate(dateLimite.getDate() + 30);
        
        const nouveauProjet = {
            nom,
            titre: nom,
            description,
            taches: 0,
            progression: 0,
            icone,
            couleur,
            categorie: getCategorieParDefaut(icone, couleur),
            statut: 'actif',
            dateDebut: dateDebut,
            dateLimite: dateLimite.toISOString().split('T')[0],
            membres: [EtatApplication.utilisateur.uid],
            favori: false,
            createurId: EtatApplication.utilisateur.uid,
            dateCreation: new Date(),
            dateModification: new Date()
        };
        
        const docRef = await firebase.firestore().collection("projets").add(nouveauProjet);
        console.log("✅ Projet ajouté à Firebase avec ID:", docRef.id);
        
        // Ajouter une notification
        ajouterNotification({
            message: `Nouveau projet créé : "${nom}"`,
            time: 'À l\'instant',
            icon: 'folder'
        });
        
        // Notifier la page projets
        window.dispatchEvent(new CustomEvent('nouveauProjetAjoute', {
            detail: { projet: { ...nouveauProjet, id: docRef.id, firestoreId: docRef.id } }
        }));
        
        fermerModalProjet();
        afficherToast('Projet créé avec succès', 'succes');
        
        masquerLoading();
        
    } catch (error) {
        console.error("Erreur ajout projet Firebase:", error);
        afficherToast('Erreur lors de la création du projet', 'erreur');
        masquerLoading();
    }
}

/**
 * Exporte un projet vers la page projets
 */
function exporterProjetVersPage(projet) {
    // Notifier la page projets
    window.dispatchEvent(new CustomEvent('nouveauProjetAjoute', { 
        detail: { projet: projet } 
    }));
    
    // Mettre à jour le badge dans la navigation
    const badgeNavigation = document.querySelector('.lien-navigation[href*="projets.html"] .badge-navigation');
    if (badgeNavigation) {
        badgeNavigation.textContent = EtatApplication.projets.length;
    }
}

// ============================================
// GESTION DES ÉVÉNEMENTS (LocalStorage)
// ============================================

/**
 * Sauvegarde un nouvel événement
 */
function sauvegarderNouvelEvenement() {
    const titre = document.getElementById('titreEvenement')?.value.trim();
    const date = document.getElementById('dateEvenement')?.value;
    const heure = document.getElementById('heureEvenement')?.value;
    const type = document.getElementById('typeEvenement')?.value || 'event';
    
    if (!titre || !date || !heure) {
        afficherToast('Tous les champs sont obligatoires', 'erreur');
        return;
    }
    
    const nouvelEvenement = {
        id: genererNouvelId(EtatApplication.evenements),
        titre,
        date,
        heure,
        type,
        dateCreation: new Date().toISOString()
    };
    
    EtatApplication.evenements.push(nouvelEvenement);
    localStorage.setItem('tgnova_evenements', JSON.stringify(EtatApplication.evenements));
    
    mettreAJourEvenements();
    
    ajouterNotification({
        message: `Nouvel événement : "${titre}"`,
        time: 'À l\'instant',
        icon: 'calendar'
    });
    
    fermerModalEvenement();
    afficherToast('Événement créé avec succès', 'succes');
}

/**
 * Supprime un événement
 */
function supprimerEvenement(evenementId) {
    const evenementIndex = EtatApplication.evenements.findIndex(e => e.id === evenementId);
    
    if (evenementIndex === -1) return;
    
    const evenement = EtatApplication.evenements[evenementIndex];
    
    modalUtils.demanderConfirmation(
        'Suppression d\'événement',
        `Êtes-vous sûr de vouloir supprimer l'événement "${evenement.titre}" ?`,
        () => {
            EtatApplication.evenements.splice(evenementIndex, 1);
            localStorage.setItem('tgnova_evenements', JSON.stringify(EtatApplication.evenements));
            mettreAJourEvenements();

            ajouterNotification({
                message: `Événement supprimé : "${evenement.titre}"`,
                time: 'À l\'instant',
                icon: 'calendar-times'
            });

            afficherToast('Événement supprimé', 'succes');
        }
    );
}

// ============================================
// COMMUNICATION ENTRE PAGES
// ============================================

/**
 * Initialise la communication avec toutes les pages
 */
function initialiserCommunication() {
    window.addEventListener('tachesModifiees', (e) => {
        if (e.detail.taches) {
            // Ne pas remplacer, car Firebase gère déjà
            console.log('Événement tachesModifiees reçu');
        }
    });
    
    window.addEventListener('nouvelleTacheAjoutee', (e) => {
        if (e.detail.tache) {
            console.log('Nouvelle tâche ajoutée:', e.detail.tache.titre);
        }
    });
    
    window.addEventListener('projetsModifies', (e) => {
        console.log('Événement projetsModifies reçu');
    });
    
    window.addEventListener('nouveauProjetAjoute', (e) => {
        if (e.detail.projet) {
            console.log('Nouveau projet ajouté:', e.detail.projet.nom);
        }
    });
}

// ============================================
// INITIALISATION DES COMPOSANTS
// ============================================

/**
 * Initialise toutes les fonctionnalités
 */
function initialiserApplication() {
    // Appliquer l'état sauvegardé
    if (EtatApplication.barreLateraleReduite) {
        document.getElementById('barreLaterale')?.classList.add('reduite');
    }
    
    if (EtatApplication.modeSombre) {
        document.body.classList.add('mode-sombre');
        document.querySelector('.bouton-theme i')?.classList.replace('fa-moon', 'fa-sun');
    }

    // Événements de la barre latérale
    document.getElementById('boutonReductionBarreLaterale')?.addEventListener('click', basculerBarreLaterale);
    document.getElementById('boutonMenuMobile')?.addEventListener('click', basculerBarreLateraleMobile);
    document.getElementById('boutonDeconnexion')?.addEventListener('click', gererDeconnexion);
    
    // Événements des notifications
    document.getElementById('boutonNotifications')?.addEventListener('click', basculerNotifications);
    document.querySelector('.bouton-tout-lire')?.addEventListener('click', marquerToutesNotificationsLues);
    
    // Événement du thème
    document.getElementById('boutonTheme')?.addEventListener('click', basculerTheme);
    
    // Navigation
    document.querySelectorAll('.lien-navigation').forEach(lien => {
        lien.addEventListener('click', gererNavigation);
    });

    // Fermer les menus au clic extérieur
    document.addEventListener('click', gererClicExterieur);
    
    // Créer les modals s'ils n'existent pas
    creerModals();
    
    // Initialiser la communication
    initialiserCommunication();
}

/**
 * Crée les modals nécessaires
 */
function creerModals() {
    // Modal pour nouvelle tâche
    if (!document.getElementById('modalNouvelleTache')) {
        const modalTache = document.createElement('div');
        modalTache.id = 'modalNouvelleTache';
        modalTache.className = 'modal-overlay';
        modalTache.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h2>Nouvelle Tâche</h2>
                    <button class="modal-close" onclick="window.fermerModalTache()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-content">
                    <form id="formNouvelleTache" onsubmit="event.preventDefault(); window.sauvegarderNouvelleTache();">
                        <div class="form-group">
                            <label for="titreTache" class="form-label">Titre *</label>
                            <input type="text" id="titreTache" class="form-input" placeholder="Titre de la tâche" required>
                        </div>
                        <div class="form-group">
                            <label for="descriptionTache" class="form-label">Description</label>
                            <textarea id="descriptionTache" class="form-textarea" placeholder="Description détaillée..." rows="4"></textarea>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="projetTache" class="form-label">Projet</label>
                                <select id="projetTache" class="form-select">
                                    <option value="Général">Général</option>
                                    <option value="Analyse">Analyse</option>
                                    <option value="Développement">Développement</option>
                                    <option value="Marketing">Marketing</option>
                                    <option value="Design">Design</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="prioriteTache" class="form-label">Priorité</label>
                                <select id="prioriteTache" class="form-select">
                                    <option value="basse">Basse</option>
                                    <option value="moyenne" selected>Moyenne</option>
                                    <option value="haute">Haute</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="statutTache" class="form-label">Statut</label>
                                <select id="statutTache" class="form-select">
                                    <option value="a-faire" selected>À faire</option>
                                    <option value="en-cours">En cours</option>
                                    <option value="terminee">Terminée</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="echeanceTache" class="form-label">Échéance</label>
                                <input type="date" id="echeanceTache" class="form-input">
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="window.fermerModalTache()">
                        Annuler
                    </button>
                    <button type="button" class="btn-primary" onclick="window.sauvegarderNouvelleTache()">
                        <i class="fas fa-save"></i> Créer la tâche
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modalTache);
    }
    
    // Modal pour nouvel événement
    if (!document.getElementById('modalNouvelEvenement')) {
        const modalEvenement = document.createElement('div');
        modalEvenement.id = 'modalNouvelEvenement';
        modalEvenement.className = 'modal-overlay';
        modalEvenement.innerHTML = `
            <div class="modal" style="max-width: 500px;">
                <div class="modal-header">
                    <h2>Nouvel Événement</h2>
                    <button class="modal-close" onclick="window.fermerModalEvenement()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-content">
                    <form id="formNouvelEvenement" onsubmit="event.preventDefault(); window.sauvegarderNouvelEvenement();">
                        <div class="form-group">
                            <label for="titreEvenement" class="form-label">Titre *</label>
                            <input type="text" id="titreEvenement" class="form-input" placeholder="Titre de l'événement" required>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="dateEvenement" class="form-label">Date *</label>
                                <input type="date" id="dateEvenement" class="form-input" required>
                            </div>
                            <div class="form-group">
                                <label for="heureEvenement" class="form-label">Heure *</label>
                                <input type="time" id="heureEvenement" class="form-input" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="typeEvenement" class="form-label">Type</label>
                            <select id="typeEvenement" class="form-select">
                                <option value="meeting">Réunion</option>
                                <option value="call">Appel</option>
                                <option value="event">Événement</option>
                                <option value="deadline">Date limite</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="window.fermerModalEvenement()">
                        Annuler
                    </button>
                    <button type="button" class="btn-primary" onclick="window.sauvegarderNouvelEvenement()">
                        <i class="fas fa-save"></i> Créer l'événement
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modalEvenement);
    }
    
    // Modal pour nouveau projet
    if (!document.getElementById('modalNouveauProjet')) {
        const modalProjet = document.createElement('div');
        modalProjet.id = 'modalNouveauProjet';
        modalProjet.className = 'modal-overlay';
        modalProjet.innerHTML = `
            <div class="modal" style="max-width: 600px;">
                <div class="modal-header">
                    <h2><i class="fas fa-folder-plus"></i> Nouveau Projet</h2>
                    <button class="modal-close" onclick="window.fermerModalProjet()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-content">
                    <form id="formNouveauProjet" onsubmit="event.preventDefault(); window.sauvegarderNouveauProjet();">
                        <div class="form-group">
                            <label for="nomProjet" class="form-label">
                                <i class="fas fa-heading"></i> Nom du projet *
                            </label>
                            <input type="text" id="nomProjet" class="form-input" 
                                   placeholder="Nom du projet" required maxlength="100">
                        </div>
                        
                        <div class="form-group">
                            <label for="descriptionProjet" class="form-label">
                                <i class="fas fa-align-left"></i> Description
                            </label>
                            <textarea id="descriptionProjet" class="form-textarea" 
                                      placeholder="Décrivez les objectifs et détails de ce projet..." 
                                      rows="4" maxlength="500"></textarea>
                            <div class="compteur-caracteres" id="compteurDescription">0/500</div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="iconeProjet" class="form-label">
                                    <i class="fas fa-icons"></i> Icône
                                </label>
                                <div class="selecteur-icones">
                                    <select id="iconeProjet" class="form-select" onchange="window.afficherApercuIcone()">
                                        <option value="folder">📁 Dossier</option>
                                        <option value="chart-line">📈 Graphique</option>
                                        <option value="code">💻 Code</option>
                                        <option value="paint-brush">🎨 Design</option>
                                        <option value="bullhorn">📢 Marketing</option>
                                        <option value="shopping-cart">🛒 E-commerce</option>
                                        <option value="users">👥 Équipe</option>
                                        <option value="lightbulb">💡 Idée</option>
                                        <option value="rocket">🚀 Lancement</option>
                                        <option value="chart-bar">📊 Analytics</option>
                                    </select>
                                    <div class="apercu-icone" id="apercuIcone">
                                        <i class="fas fa-folder"></i>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="couleurProjet" class="form-label">
                                    <i class="fas fa-palette"></i> Couleur
                                </label>
                                <div class="selecteur-couleurs">
                                    <select id="couleurProjet" class="form-select" onchange="window.afficherApercuCouleur()">
                                        <option value="bleu" selected>🔵 Bleu</option>
                                        <option value="vert">🟢 Vert</option>
                                        <option value="violet">🟣 Violet</option>
                                        <option value="orange">🟠 Orange</option>
                                        <option value="rose">🌸 Rose</option>
                                        <option value="rouge">🔴 Rouge</option>
                                        <option value="cyan">🌊 Cyan</option>
                                        <option value="jaune">🟡 Jaune</option>
                                    </select>
                                    <div class="apercu-couleur bleu" id="apercuCouleur"></div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="dateDebutProjet" class="form-label">
                                <i class="fas fa-calendar-alt"></i> Date de début
                            </label>
                            <input type="date" id="dateDebutProjet" class="form-input">
                        </div>
                    </form>
                    
                    <div class="apercu-projet" id="apercuProjet">
                        <h4><i class="fas fa-eye"></i> Aperçu du projet</h4>
                        <div class="carte-apercu">
                            <div class="entete-apercu bleu">
                                <i class="fas fa-folder"></i>
                                <h5>Nom du projet</h5>
                            </div>
                            <div class="corps-apercu">
                                <p>Aucune description</p>
                                <div class="stats-apercu">
                                    <span><i class="fas fa-tasks"></i> 0 tâches</span>
                                    <span><i class="fas fa-percentage"></i> 0% complété</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="window.fermerModalProjet()">
                        <i class="fas fa-times"></i> Annuler
                    </button>
                    <button type="button" class="btn-primary" onclick="window.sauvegarderNouveauProjet()">
                        <i class="fas fa-save"></i> Créer le projet
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modalProjet);
        
        // Initialiser les événements du formulaire
        initialiserFormulaireProjet();
    }
}

/**
 * Initialise les événements du formulaire projet
 */
function initialiserFormulaireProjet() {
    const descriptionInput = document.getElementById('descriptionProjet');
    const compteur = document.getElementById('compteurDescription');
    
    if (descriptionInput && compteur) {
        descriptionInput.addEventListener('input', function() {
            const longueur = this.value.length;
            compteur.textContent = `${longueur}/500`;
            
            if (longueur > 450) {
                compteur.style.color = '#ef4444';
            } else if (longueur > 400) {
                compteur.style.color = '#f59e0b';
            } else {
                compteur.style.color = 'var(--gris-500)';
            }
            
            mettreAJourApercuProjet();
        });
    }
    
    const nomInput = document.getElementById('nomProjet');
    if (nomInput) {
        nomInput.addEventListener('input', mettreAJourApercuProjet);
    }
    
    mettreAJourApercuProjet();
}

/**
 * Met à jour l'aperçu du projet
 */
function mettreAJourApercuProjet() {
    const nom = document.getElementById('nomProjet')?.value || 'Nom du projet';
    const description = document.getElementById('descriptionProjet')?.value || 'Aucune description';
    const icone = document.getElementById('iconeProjet')?.value || 'folder';
    const couleur = document.getElementById('couleurProjet')?.value || 'bleu';
    
    const apercu = document.getElementById('apercuProjet');
    if (apercu) {
        const nomApercu = apercu.querySelector('.carte-apercu h5');
        const descriptionApercu = apercu.querySelector('.corps-apercu p');
        const iconeApercu = apercu.querySelector('.entete-apercu i');
        const enteteApercu = apercu.querySelector('.entete-apercu');
        
        if (nomApercu) nomApercu.textContent = nom.substring(0, 30) + (nom.length > 30 ? '...' : '');
        if (descriptionApercu) {
            const descTronquee = description.substring(0, 80) + (description.length > 80 ? '...' : '');
            descriptionApercu.textContent = descTronquee || 'Aucune description';
        }
        if (iconeApercu) iconeApercu.className = `fas fa-${icone}`;
        if (enteteApercu) {
            enteteApercu.className = `entete-apercu ${couleur}`;
        }
    }
}

/**
 * Affiche l'aperçu de l'icône
 */
function afficherApercuIcone() {
    const icone = document.getElementById('iconeProjet')?.value || 'folder';
    const apercu = document.getElementById('apercuIcone');
    if (apercu) {
        apercu.innerHTML = `<i class="fas fa-${icone}"></i>`;
    }
    mettreAJourApercuProjet();
}

/**
 * Affiche l'aperçu de la couleur
 */
function afficherApercuCouleur() {
    const couleur = document.getElementById('couleurProjet')?.value || 'bleu';
    const apercu = document.getElementById('apercuCouleur');
    if (apercu) {
        apercu.className = `apercu-couleur ${couleur}`;
    }
    mettreAJourApercuProjet();
}

// ============================================
// INITIALISATION DES COMPOSANTS (Suite)
// ============================================

/**
 * Initialise et met à jour la date
 */
function initialiserDate() {
    const dateElement = document.getElementById('dateActuelle');
    if (!dateElement) return;
    
    const maintenant = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    
    const dateFormatee = maintenant.toLocaleDateString('fr-FR', options);
    dateElement.textContent = dateFormatee.charAt(0).toUpperCase() + dateFormatee.slice(1);
    
    setInterval(() => {
        const date = new Date();
        const dateFormatee = date.toLocaleDateString('fr-FR', options);
        dateElement.textContent = dateFormatee.charAt(0).toUpperCase() + dateFormatee.slice(1);
    }, 60000);
}

/**
 * Initialise la fonctionnalité de recherche
 */
function initialiserRecherche() {
    const champRecherche = document.querySelector('.champ-recherche');
    if (!champRecherche) return;
    
    champRecherche.addEventListener('input', function(e) {
        const terme = e.target.value.toLowerCase().trim();
        
        if (terme.length < 2) {
            document.querySelectorAll('.carte-statistique, .carte-contenu').forEach(element => {
                element.style.display = 'block';
            });
            return;
        }
        
        document.querySelectorAll('.carte-statistique, .carte-contenu').forEach(element => {
            const texte = element.textContent.toLowerCase();
            element.style.display = texte.includes(terme) ? 'block' : 'none';
        });
    });
    
    champRecherche.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            this.value = '';
            this.dispatchEvent(new Event('input'));
            this.blur();
        }
    });
}

/**
 * Initialise les actions rapides
 */
function initialiserActionsRapides() {
    document.querySelectorAll('.bouton-action-rapide').forEach(bouton => {
        bouton.addEventListener('click', gererActionRapide);
    });
}

/**
 * Gère les actions rapides
 */
function gererActionRapide(e) {
    const bouton = e.currentTarget;
    const action = bouton.querySelector('span')?.textContent;
    
    bouton.style.transform = 'scale(0.95)';
    setTimeout(() => {
        bouton.style.transform = '';
    }, 150);
    
    switch(action) {
        case 'Nouvelle tâche':
            ouvrirModalTache();
            break;
        case 'Nouveau projet':
            ouvrirModalProjet();
            break;
        case 'Exporter rapport':
            exporterRapport();
            break;
        case 'Ajouter événement':
            ouvrirModalEvenement();
            break;
    }
}

/**
 * Exporte un rapport
 */
function exporterRapport() {
    afficherToast('Génération du rapport en cours...', 'info');
    
    const progression = document.createElement('div');
    progression.className = 'barre-progression-export';
    progression.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        height: 3px;
        background: var(--bleu-principal);
        width: 0%;
        transition: width 1.5s ease;
        z-index: 10001;
    `;
    document.body.appendChild(progression);
    
    setTimeout(() => {
        progression.style.width = '100%';
    }, 10);
    
    setTimeout(() => {
        progression.remove();
        
        const rapport = {
            date: new Date().toISOString(),
            utilisateur: EtatApplication.utilisateurInfo,
            statistiques: calculerStatistiques(),
            taches: EtatApplication.taches,
            projets: EtatApplication.projets,
            evenements: EtatApplication.evenements
        };
        
        const dataStr = JSON.stringify(rapport, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `rapport_tgnova_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        
        afficherToast('Rapport exporté avec succès', 'succes');
    }, 1500);
}

// ============================================
// GESTION DES MODALS
// ============================================

/**
 * Ouvre le modal de nouvelle tâche
 */
function ouvrirModalTache() {
    const modal = document.getElementById('modalNouvelleTache');
    if (!modal) return;
    
    document.getElementById('formNouvelleTache')?.reset();
    
    const aujourdhui = new Date().toISOString().split('T')[0];
    const echeanceInput = document.getElementById('echeanceTache');
    if (echeanceInput) echeanceInput.value = aujourdhui;
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    EtatApplication.modalOuverte = 'tache';
    
    setTimeout(() => {
        document.getElementById('titreTache')?.focus();
    }, 100);
}

/**
 * Ferme le modal de tâche
 */
function fermerModalTache() {
    const modal = document.getElementById('modalNouvelleTache');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        EtatApplication.modalOuverte = null;
    }
}

/**
 * Ouvre le modal d'événement
 */
function ouvrirModalEvenement() {
    const modal = document.getElementById('modalNouvelEvenement');
    if (!modal) return;
    
    document.getElementById('formNouvelEvenement')?.reset();
    
    const aujourdhui = new Date();
    const dateInput = document.getElementById('dateEvenement');
    const heureInput = document.getElementById('heureEvenement');
    
    if (dateInput) dateInput.value = aujourdhui.toISOString().split('T')[0];
    if (heureInput) heureInput.value = '14:00';
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    EtatApplication.modalOuverte = 'evenement';
    
    setTimeout(() => {
        document.getElementById('titreEvenement')?.focus();
    }, 100);
}

/**
 * Ferme le modal d'événement
 */
function fermerModalEvenement() {
    const modal = document.getElementById('modalNouvelEvenement');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        EtatApplication.modalOuverte = null;
    }
}

/**
 * Ouvre le modal de projet
 */
function ouvrirModalProjet() {
    const modal = document.getElementById('modalNouveauProjet');
    if (!modal) {
        creerModals();
    }
    
    const form = document.getElementById('formNouveauProjet');
    if (form) form.reset();
    
    const aujourdhui = new Date().toISOString().split('T')[0];
    const dateDebutInput = document.getElementById('dateDebutProjet');
    if (dateDebutInput) dateDebutInput.value = aujourdhui;
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    EtatApplication.modalOuverte = 'projet';
    
    setTimeout(() => {
        document.getElementById('nomProjet')?.focus();
    }, 100);
}

/**
 * Ferme le modal de projet
 */
function fermerModalProjet() {
    const modal = document.getElementById('modalNouveauProjet');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        EtatApplication.modalOuverte = null;
    }
}

// ============================================
// MISE À JOUR DES AFFICHAGES
// ============================================

/**
 * Met à jour tout l'affichage du dashboard
 */
function mettreAJourAffichage() {
    animerCompteursStatistiques();
    mettreAJourTachesRecentes();
    mettreAJourProgressionGlobale();
    mettreAJourProjetsActifs();
    mettreAJourEvenements();
    mettreAJourBadgeNotifications();
    mettreAJourStatistiquesProjets();
}

/**
 * Met à jour les tâches récentes
 */
function mettreAJourTachesRecentes() {
    const listeTaches = document.querySelector('.liste-taches');
    if (!listeTaches) return;
    
    const tachesTriees = [...EtatApplication.taches].sort((a, b) => 
        new Date(b.dateModification || b.dateCreation) - new Date(a.dateModification || a.dateCreation)
    );
    
    const tachesRecentes = tachesTriees.slice(0, 3);
    
    if (tachesRecentes.length === 0) {
        listeTaches.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--gris-500);">
                <i class="fas fa-tasks" style="font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.5;"></i>
                <p>Aucune tâche récente</p>
                <button onclick="window.ouvrirModalTache()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--bleu-principal); color: white; border: none; border-radius: 6px; cursor: pointer;">
                    <i class="fas fa-plus"></i> Créer une tâche
                </button>
            </div>
        `;
        return;
    }
    
    listeTaches.innerHTML = tachesRecentes.map((tache, index) => `
        <div class="element-tache">
            <div class="case-tache">
                <input type="checkbox" id="tache${index + 1}" ${tache.completee ? 'checked' : ''} data-id="${tache.firestoreId || tache.id}">
                <label for="tache${index + 1}"></label>
            </div>
            <div class="contenu-tache">
                <h4>${echapperHTML(tache.titre)}</h4>
                <p class="meta-tache">Projet: ${echapperHTML(tache.projet)} • Échéance: ${formaterDate(tache.echeance)}</p>
            </div>
            <span class="priorite-tache ${tache.priorite}">${getLabelPriorite(tache.priorite)}</span>
        </div>
    `).join('');
    
    document.querySelectorAll('.case-tache input[type="checkbox"]').forEach(caseCoche => {
        caseCoche.removeEventListener('change', gererCaseCoche);
        caseCoche.addEventListener('change', gererCaseCoche);
    });
}

/**
 * Met à jour la progression globale
 */
function mettreAJourProgressionGlobale() {
    const statistiques = calculerStatistiques();
    const pourcentage = statistiques.total > 0 ? Math.round((statistiques.terminees / statistiques.total) * 100) : 0;
    
    const pourcentageElement = document.querySelector('.pourcentage-progression');
    const barreProgression = document.querySelector('.barre-progression');
    
    if (pourcentageElement) {
        pourcentageElement.textContent = `${pourcentage}%`;
    }
    
    if (barreProgression) {
        barreProgression.style.width = `${pourcentage}%`;
    }
    
    const statsProgression = document.querySelectorAll('.valeur-statistique-progression');
    if (statsProgression.length >= 3) {
        statsProgression[0].textContent = statistiques.aFaire;
        statsProgression[1].textContent = statistiques.enCours;
        statsProgression[2].textContent = statistiques.terminees;
    }
}

/**
 * Met à jour les projets actifs
 */
function mettreAJourProjetsActifs() {
    const listeProjets = document.querySelector('.liste-projets');
    if (!listeProjets) return;
    
    const projetsAvecStats = EtatApplication.projets.map(projet => {
        const tachesDuProjet = EtatApplication.taches.filter(t => t.projet === projet.nom || t.projet === projet.titre);
        const totalTaches = tachesDuProjet.length;
        const tachesTerminees = tachesDuProjet.filter(t => t.statut === 'terminee').length;
        const progression = totalTaches > 0 ? Math.round((tachesTerminees / totalTaches) * 100) : 0;
        const scoreActivite = (progression * 0.7) + (totalTaches * 3);
        
        return {
            ...projet,
            taches: totalTaches,
            progression,
            scoreActivite
        };
    });
    
    const projetsTries = projetsAvecStats.sort((a, b) => b.scoreActivite - a.scoreActivite);
    const projetsTop = projetsTries.slice(0, 3);
    
    if (projetsTop.length === 0) {
        listeProjets.innerHTML = `
            <div class="vide-message">
                <i class="fas fa-folder" style="font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.5;"></i>
                <p>Aucun projet actif</p>
                <button onclick="window.ouvrirModalProjet()" class="btn-vide">
                    <i class="fas fa-plus"></i> Créer un projet
                </button>
            </div>
        `;
        return;
    }
    
    listeProjets.innerHTML = projetsTop.map(projet => `
        <div class="element-projet" data-id="${projet.firestoreId || projet.id}" onclick="window.ouvrirPageProjet('${projet.firestoreId || projet.id}')" style="cursor: pointer;">
            <div class="icone-projet ${projet.couleur}">
                <i class="fas fa-${projet.icone}"></i>
            </div>
            <div class="infos-projet">
                <h4>${echapperHTML(projet.nom)}</h4>
                <p>${projet.taches} tâche${projet.taches > 1 ? 's' : ''} • ${projet.progression}% complété</p>
                ${projet.description ? `<p class="description-projet">${echapperHTML(projet.description.substring(0, 60))}${projet.description.length > 60 ? '...' : ''}</p>` : ''}
            </div>
            <div class="progression-projet">
                <div class="barre-progression petite" style="width: ${projet.progression}%"></div>
                <span class="pourcentage-projet">${projet.progression}%</span>
            </div>
        </div>
    `).join('');
}

/**
 * Met à jour les événements
 */
function mettreAJourEvenements() {
    const evenementsSection = document.querySelector('.evenements-a-venir');
    if (!evenementsSection) return;
    
    const evenementsTries = [...EtatApplication.evenements].sort((a, b) => 
        new Date(a.date + 'T' + a.heure) - new Date(b.date + 'T' + b.heure)
    );
    
    const maintenant = new Date();
    const prochainsEvenements = evenementsTries.filter(e => 
        new Date(e.date + 'T' + e.heure) >= maintenant
    ).slice(0, 2);
    
    let container = evenementsSection.querySelector('.conteneur-evenements');
    if (!container) {
        container = document.createElement('div');
        container.className = 'conteneur-evenements';
        const h4 = evenementsSection.querySelector('h4');
        if (h4 && h4.nextSibling) {
            evenementsSection.insertBefore(container, h4.nextSibling);
        } else {
            evenementsSection.appendChild(container);
        }
    }
    
    if (prochainsEvenements.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 1rem; color: var(--gris-500); font-size: 0.875rem;">
                Aucun événement à venir
            </div>
        `;
        return;
    }
    
    container.innerHTML = prochainsEvenements.map(evenement => `
        <div class="element-evenement" data-id="${evenement.id}">
            <i class="fas fa-${obtenirIconeEvenement(evenement.type)} icone-evenement"></i>
            <div class="details-evenement">
                <p>${echapperHTML(evenement.titre)}</p>
                <span>${formaterDate(evenement.date)}, ${evenement.heure}</span>
            </div>
            <button class="bouton-supprimer-evenement" onclick="window.supprimerEvenement(${evenement.id})" title="Supprimer cet événement">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

/**
 * Anime les compteurs de statistiques
 */
function animerCompteursStatistiques() {
    const statistiques = calculerStatistiques();
    
    const compteurs = document.querySelectorAll('.valeur-statistique');
    
    if (compteurs.length >= 4) {
        animerCompteur(compteurs[0], statistiques.total);
        animerCompteur(compteurs[1], statistiques.terminees);
        animerCompteur(compteurs[2], statistiques.enCours);
        animerCompteur(compteurs[3], statistiques.projetsActifs);
    }
}

/**
 * Anime un compteur
 */
function animerCompteur(element, valeurFinale, suffixe = '') {
    if (!element) return;
    
    const valeurActuelle = parseInt(element.textContent.replace(suffixe, '')) || 0;
    if (valeurActuelle === valeurFinale) return;
    
    const duree = 800;
    const pas = Math.abs(valeurFinale - valeurActuelle) / (duree / 16);
    let valeurCourante = valeurActuelle;
    
    const timer = setInterval(() => {
        if (valeurFinale > valeurActuelle) {
            valeurCourante += pas;
            if (valeurCourante >= valeurFinale) {
                valeurCourante = valeurFinale;
                clearInterval(timer);
            }
        } else {
            valeurCourante -= pas;
            if (valeurCourante <= valeurFinale) {
                valeurCourante = valeurFinale;
                clearInterval(timer);
            }
        }
        
        element.textContent = Math.round(valeurCourante) + suffixe;
    }, 16);
}

/**
 * Calcule les statistiques
 */
function calculerStatistiques() {
    const total = EtatApplication.taches.length;
    const terminees = EtatApplication.taches.filter(t => t.statut === 'terminee').length;
    const enCours = EtatApplication.taches.filter(t => t.statut === 'en-cours').length;
    const aFaire = EtatApplication.taches.filter(t => t.statut === 'a-faire').length;
    
    const projetsUniques = [...new Set(EtatApplication.taches.map(t => t.projet))];
    const projetsActifs = projetsUniques.length;
    
    return {
        total,
        terminees,
        enCours,
        aFaire,
        projetsActifs
    };
}

/**
 * Calcule et met à jour les statistiques des projets
 */
function mettreAJourStatistiquesProjets() {
    const projetsActifs = EtatApplication.projets.filter(p => p.statut === 'actif').length;
    const projetsTermines = EtatApplication.projets.filter(p => p.statut === 'termine').length;
    const projetsEnRetard = EtatApplication.projets.filter(p => p.statut === 'en-retard').length;
    
    const tousMembres = EtatApplication.projets.flatMap(p => p.membres || []);
    const equipesUniques = [...new Set(tousMembres)].length;
    
    const statActifs = document.getElementById('statProjetsActifs');
    const statTermines = document.getElementById('statProjetsTermines');
    const statEnRetard = document.getElementById('statProjetsEnRetard');
    const statEquipes = document.getElementById('statEquipesImpliquees');
    
    if (statActifs) statActifs.textContent = projetsActifs;
    if (statTermines) statTermines.textContent = projetsTermines;
    if (statEnRetard) statEnRetard.textContent = projetsEnRetard;
    if (statEquipes) statEquipes.textContent = equipesUniques;
    
    const badgeNavigation = document.querySelector('.lien-navigation[href*="projets.html"] .badge-navigation');
    if (badgeNavigation) {
        badgeNavigation.textContent = EtatApplication.projets.length;
    }
}

/**
 * Ouvre la page des projets
 */
function ouvrirPageProjet(projetId) {
    sessionStorage.setItem('tgnova_projet_selectionne', projetId);
    window.location.href = 'projets.html';
}

// ============================================
// GESTION DES INTERACTIONS
// ============================================

/**
 * Bascule la barre latérale
 */
function basculerBarreLaterale() {
    const barreLaterale = document.getElementById('barreLaterale');
    const boutonIcone = document.querySelector('.bouton-reduction-barre-laterale i');
    
    barreLaterale?.classList.toggle('reduite');
    EtatApplication.barreLateraleReduite = !EtatApplication.barreLateraleReduite;
    
    if (boutonIcone) {
        boutonIcone.style.transform = EtatApplication.barreLateraleReduite ? 'rotate(180deg)' : 'rotate(0)';
    }
    
    if (barreLaterale) {
        barreLaterale.style.transition = 'width 0.3s ease';
    }
    
    localStorage.setItem('barreLateraleReduite', EtatApplication.barreLateraleReduite);
    
    afficherToast('Barre latérale ' + (EtatApplication.barreLateraleReduite ? 'réduite' : 'étendue'), 'info');
}

/**
 * Bascule la barre latérale sur mobile
 */
function basculerBarreLateraleMobile() {
    const barreLaterale = document.getElementById('barreLaterale');
    let overlay = document.getElementById('overlayMobile');
    
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'overlayMobile';
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 999; display: none;';
        document.body.appendChild(overlay);
        
        overlay.addEventListener('click', basculerBarreLateraleMobile);
    }
    
    barreLaterale?.classList.toggle('active');
    
    if (barreLaterale?.classList.contains('active')) {
        overlay.style.display = 'block';
        document.body.style.overflow = 'hidden';
    } else {
        overlay.style.display = 'none';
        document.body.style.overflow = '';
    }
}

/**
 * Bascule les notifications
 */
function basculerNotifications(e) {
    e.stopPropagation();
    
    const menu = document.getElementById('menuDeroulantNotifications');
    if (!menu) return;
    
    menu.classList.toggle('visible');
    
    if (menu.classList.contains('visible')) {
        mettreAJourListeNotifications();
        
        setTimeout(() => {
            const nonLues = EtatApplication.notifications.filter(n => !n.read);
            nonLues.forEach(notification => {
                notification.read = true;
            });
            localStorage.setItem('tgnova_notifications', JSON.stringify(EtatApplication.notifications));
            mettreAJourBadgeNotifications();
        }, 1000);
    }
}

/**
 * Marque toutes les notifications comme lues
 */
function marquerToutesNotificationsLues() {
    EtatApplication.notifications.forEach(notification => {
        notification.read = true;
    });
    
    localStorage.setItem('tgnova_notifications', JSON.stringify(EtatApplication.notifications));
    
    document.querySelectorAll('.element-notification').forEach(element => {
        element.classList.remove('non-lue');
    });
    
    mettreAJourBadgeNotifications();
    
    const menu = document.getElementById('menuDeroulantNotifications');
    if (menu) menu.classList.remove('visible');
    
    afficherToast('Toutes les notifications marquées comme lues', 'succes');
}

/**
 * Supprime toutes les notifications lues
 */
function supprimerNotificationsLues() {
    const notificationsNonLues = EtatApplication.notifications.filter(n => !n.read);
    const notificationsLues = EtatApplication.notifications.filter(n => n.read);
    
    if (notificationsLues.length === 0) {
        afficherToast('Aucune notification lue à supprimer', 'info');
        return;
    }
    
    modalUtils.demanderConfirmation(
        'Suppression des notifications',
        `Êtes-vous sûr de vouloir supprimer définitivement ${notificationsLues.length} notification(s) lue(s) ?`,
        () => {
            EtatApplication.notifications = notificationsNonLues;
            localStorage.setItem('tgnova_notifications', JSON.stringify(EtatApplication.notifications));
            mettreAJourListeNotifications();
            mettreAJourBadgeNotifications();
            afficherToast(`${notificationsLues.length} notification(s) lue(s) supprimée(s)`, 'succes');
        }
    );
}

/**
 * Supprime une notification spécifique
 */
function supprimerNotification(notificationId) {
    const notificationIndex = EtatApplication.notifications.findIndex(n => n.id === notificationId);
    
    if (notificationIndex !== -1) {
        EtatApplication.notifications.splice(notificationIndex, 1);
        localStorage.setItem('tgnova_notifications', JSON.stringify(EtatApplication.notifications));
        mettreAJourListeNotifications();
        mettreAJourBadgeNotifications();
        afficherToast('Notification supprimée', 'info');
    }
}

/**
 * Met à jour le badge des notifications
 */
function mettreAJourBadgeNotifications() {
    const notificationsNonLues = EtatApplication.notifications.filter(n => !n.read).length;
    const badge = document.querySelector('.badge-notification');
    
    if (badge) {
        badge.textContent = notificationsNonLues;
        badge.style.display = notificationsNonLues > 0 ? 'flex' : 'none';
        
        if (notificationsNonLues > 0) {
            badge.style.animation = 'pulse 2s infinite';
        } else {
            badge.style.animation = '';
        }
    }
}

/**
 * Met à jour la liste des notifications
 */
function mettreAJourListeNotifications() {
    const liste = document.querySelector('.liste-notifications');
    if (!liste) return;
    
    const notificationsRecentes = EtatApplication.notifications.slice(0, 10);
    
    if (notificationsRecentes.length === 0) {
        liste.innerHTML = `
            <div class="vide-notifications">
                <i class="fas fa-bell-slash"></i>
                <p>Aucune notification</p>
            </div>
        `;
        return;
    }
    
    liste.innerHTML = notificationsRecentes.map(notification => `
        <div class="element-notification ${!notification.read ? 'non-lue' : ''}">
            <i class="fas fa-${notification.icon} icone-notification"></i>
            <div class="contenu-notification">
                <p>${echapperHTML(notification.message)}</p>
                <span class="horodatage-notification">${notification.time}</span>
            </div>
            <button class="bouton-supprimer-notification" onclick="window.supprimerNotification(${notification.id})" title="Supprimer cette notification">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
    
    const notificationsLues = EtatApplication.notifications.filter(n => n.read);
    if (notificationsLues.length > 0) {
        const boutonSupprimerLues = document.createElement('div');
        boutonSupprimerLues.className = 'bouton-supprimer-lues';
        boutonSupprimerLues.innerHTML = `
            <button onclick="window.supprimerNotificationsLues()">
                <i class="fas fa-trash-alt"></i> Supprimer les notifications lues (${notificationsLues.length})
            </button>
        `;
        liste.appendChild(boutonSupprimerLues);
    }
}

/**
 * Ajoute une notification
 */
function ajouterNotification(notification) {
    notification.id = Date.now();
    notification.read = false;
    
    EtatApplication.notifications.unshift(notification);
    
    if (EtatApplication.notifications.length > 50) {
        EtatApplication.notifications = EtatApplication.notifications.slice(0, 50);
    }
    
    localStorage.setItem('tgnova_notifications', JSON.stringify(EtatApplication.notifications));
    mettreAJourBadgeNotifications();
}

/**
 * Bascule le thème
 */
function basculerTheme() {
    const iconeTheme = document.querySelector('.bouton-theme i');
    EtatApplication.modeSombre = !EtatApplication.modeSombre;
    
    document.documentElement.style.transition = 'background-color 0.3s ease, color 0.3s ease';
    
    if (EtatApplication.modeSombre) {
        document.body.classList.add('mode-sombre');
        if (iconeTheme) {
            iconeTheme.className = 'fas fa-sun';
            iconeTheme.style.transform = 'rotate(180deg)';
        }
        afficherToast('Mode sombre activé', 'info');
    } else {
        document.body.classList.remove('mode-sombre');
        if (iconeTheme) {
            iconeTheme.className = 'fas fa-moon';
            iconeTheme.style.transform = 'rotate(0)';
        }
        afficherToast('Mode clair activé', 'info');
    }
    
    setTimeout(() => {
        document.documentElement.style.transition = '';
    }, 300);
    
    localStorage.setItem('modeSombre', EtatApplication.modeSombre);
}

/**
 * Gère la déconnexion
 */
function gererDeconnexion(e) {
    e.preventDefault();
    
    modalUtils.demanderConfirmation(
        'Déconnexion',
        'Êtes-vous sûr de vouloir vous déconnecter ?',
        () => {
            afficherToast('Déconnexion en cours...', 'info');
            document.body.style.opacity = '0.5';
            document.body.style.transition = 'opacity 0.5s ease';

            setTimeout(() => {
                auth.signOut().then(() => {
                    sessionStorage.clear();
                    window.location.href = 'login.html';
                });
            }, 1000);
        }
    );
}

/**
 * Gère la navigation
 */
function gererNavigation(e) {
    const lien = e.currentTarget;
    
    if (lien.classList.contains('lien-navigation')) {
        document.querySelectorAll('.lien-navigation').forEach(l => {
            l.classList.remove('actif');
        });
        lien.classList.add('actif');
        
        lien.style.transform = 'scale(0.95)';
        setTimeout(() => {
            lien.style.transform = '';
        }, 150);
    }
}

/**
 * Gère les clics extérieurs
 */
function gererClicExterieur(e) {
    const menuNotifications = document.getElementById('menuDeroulantNotifications');
    const boutonNotifications = document.getElementById('boutonNotifications');
    
    if (menuNotifications && boutonNotifications && 
        !menuNotifications.contains(e.target) && !boutonNotifications.contains(e.target)) {
        menuNotifications.classList.remove('visible');
    }
    
    if (EtatApplication.modalOuverte) {
        const modals = {
            'tache': 'modalNouvelleTache',
            'evenement': 'modalNouvelEvenement',
            'projet': 'modalNouveauProjet'
        };
        
        const modalId = modals[EtatApplication.modalOuverte];
        const modal = document.getElementById(modalId);
        
        if (modal && e.target === modal) {
            if (EtatApplication.modalOuverte === 'tache') fermerModalTache();
            else if (EtatApplication.modalOuverte === 'evenement') fermerModalEvenement();
            else if (EtatApplication.modalOuverte === 'projet') fermerModalProjet();
        }
    }
}

/**
 * Initialise les effets de survol
 */
function initialiserEffetsSurvol() {
    document.querySelectorAll('.carte-statistique, .carte-contenu').forEach(carte => {
        carte.addEventListener('mouseenter', () => {
            carte.style.transform = 'translateY(-2px)';
        });
        
        carte.addEventListener('mouseleave', () => {
            carte.style.transform = '';
        });
    });
}

/**
 * Initialise l'observateur d'animations
 */
function initialiserObservateurAnimations() {
    const observateur = new IntersectionObserver((entrees) => {
        entrees.forEach(entree => {
            if (entree.isIntersecting) {
                entree.target.classList.add('apparition');
                observateur.unobserve(entree.target);
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.carte-statistique, .carte-contenu').forEach(element => {
        observateur.observe(element);
    });
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Génère un nouvel ID
 */
function genererNouvelId(tableau) {
    return tableau.length > 0 ? Math.max(...tableau.map(item => item.id || 0)) + 1 : 1;
}

/**
 * Échappe le HTML
 */
function echapperHTML(texte) {
    if (!texte) return '';
    const div = document.createElement('div');
    div.textContent = texte;
    return div.innerHTML;
}

/**
 * Formate une date
 */
function formaterDate(dateStr) {
    if (!dateStr) return 'Non définie';
    
    const date = new Date(dateStr);
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);
    
    const dateSansHeure = new Date(date);
    dateSansHeure.setHours(0, 0, 0, 0);
    
    const diffJours = Math.round((dateSansHeure - aujourdhui) / (1000 * 60 * 60 * 24));
    
    if (diffJours === 0) return "Aujourd'hui";
    if (diffJours === 1) return 'Demain';
    if (diffJours === -1) return 'Hier';
    if (diffJours < 0) return `Il y a ${Math.abs(diffJours)} jour${Math.abs(diffJours) > 1 ? 's' : ''}`;
    if (diffJours < 7) return `Dans ${diffJours} jour${diffJours > 1 ? 's' : ''}`;
    
    return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

/**
 * Obtient le label de priorité
 */
function getLabelPriorite(priorite) {
    const labels = {
        'haute': 'Haute',
        'moyenne': 'Moyenne',
        'basse': 'Basse'
    };
    return labels[priorite] || priorite;
}

/**
 * Obtient l'icône d'événement
 */
function obtenirIconeEvenement(type) {
    const icones = {
        'meeting': 'calendar-day',
        'call': 'video',
        'event': 'calendar',
        'deadline': 'clock'
    };
    return icones[type] || 'calendar';
}

/**
 * Obtient une catégorie par défaut
 */
function getCategorieParDefaut(icone, couleur) {
    const categories = {
        'code': 'developpement',
        'chart-line': 'marketing',
        'paint-brush': 'design',
        'bullhorn': 'marketing',
        'folder': 'autre',
        'chart-bar': 'marketing',
        'users': 'autre',
        'lightbulb': 'autre',
        'rocket': 'developpement',
        'shopping-cart': 'marketing'
    };
    return categories[icone] || 'autre';
}

/**
 * Affiche une notification toast
 */
function afficherToast(message, type = 'info') {
    document.querySelectorAll('.toast').forEach(toast => {
        toast.classList.add('sortie');
        setTimeout(() => toast.remove(), 300);
    });
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icones = {
        succes: 'check-circle',
        erreur: 'exclamation-circle',
        avertissement: 'exclamation-triangle',
        info: 'info-circle'
    };
    
    toast.innerHTML = `
        <i class="fas fa-${icones[type] || 'info-circle'} icone-toast"></i>
        <span>${message}</span>
    `;
    
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'succes' ? '#10b981' : type === 'erreur' ? '#ef4444' : type === 'avertissement' ? '#f59e0b' : '#3b82f6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        gap: 0.75rem;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        font-size: 0.875rem;
        max-width: 350px;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
        toast.style.opacity = '1';
    }, 10);
    
    setTimeout(() => {
        toast.classList.add('sortie');
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// STYLES ADDITIONNELS
// ============================================

const styleModals = document.createElement('style');
styleModals.textContent = `
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    }
    
    .modal {
        background: var(--blanc);
        border-radius: 12px;
        max-width: 600px;
        width: 90%;
        max-height: 90vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        animation: slideUp 0.3s ease;
    }
    
    .mode-sombre .modal {
        background: var(--gris-900);
        border: 1px solid var(--gris-700);
    }
    
    .modal-header {
        padding: 1.5rem;
        border-bottom: 1px solid var(--gris-200);
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    
    .mode-sombre .modal-header {
        border-bottom-color: var(--gris-700);
    }
    
    .modal-header h2 {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--gris-900);
        margin: 0;
    }
    
    .mode-sombre .modal-header h2 {
        color: var(--gris-100);
    }
    
    .modal-close {
        background: none;
        border: none;
        color: var(--gris-400);
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 6px;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .modal-close:hover {
        background: var(--gris-100);
        color: var(--gris-800);
    }
    
    .mode-sombre .modal-close:hover {
        background: var(--gris-800);
        color: var(--gris-200);
    }
    
    .modal-content {
        padding: 1.5rem;
        overflow-y: auto;
        flex: 1;
    }
    
    .modal-footer {
        padding: 1.5rem;
        border-top: 1px solid var(--gris-200);
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
    }
    
    .mode-sombre .modal-footer {
        border-top-color: var(--gris-700);
    }
    
    .form-group {
        margin-bottom: 1.25rem;
    }
    
    .form-label {
        display: block;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--gris-700);
        margin-bottom: 0.5rem;
    }
    
    .mode-sombre .form-label {
        color: var(--gris-300);
    }
    
    .form-input,
    .form-textarea,
    .form-select {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--gris-300);
        border-radius: 8px;
        font-size: 0.875rem;
        color: var(--gris-800);
        background: var(--blanc);
        transition: all 0.2s;
    }
    
    .mode-sombre .form-input,
    .mode-sombre .form-textarea,
    .mode-sombre .form-select {
        background: var(--gris-800);
        border-color: var(--gris-600);
        color: var(--gris-200);
    }
    
    .form-input:focus,
    .form-textarea:focus,
    .form-select:focus {
        outline: none;
        border-color: var(--bleu-principal);
        box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }
    
    .form-textarea {
        resize: vertical;
        min-height: 80px;
    }
    
    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }
    
    .btn-primary,
    .btn-secondary,
    .btn-danger {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 8px;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .btn-primary {
        background: var(--bleu-principal);
        color: white;
    }
    
    .btn-primary:hover {
        background: var(--bleu-principal-fonce);
        transform: translateY(-1px);
    }
    
    .btn-secondary {
        background: var(--gris-100);
        color: var(--gris-700);
    }
    
    .mode-sombre .btn-secondary {
        background: var(--gris-800);
        color: var(--gris-300);
    }
    
    .btn-secondary:hover {
        background: var(--gris-200);
    }
    
    .mode-sombre .btn-secondary:hover {
        background: var(--gris-700);
    }
    
    .btn-danger {
        background: var(--rouge);
        color: white;
    }
    
    .btn-danger:hover {
        background: #dc2626;
        transform: translateY(-1px);
    }
    
    .selecteur-icones,
    .selecteur-couleurs {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    
    .apercu-icone,
    .apercu-couleur {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
    }
    
    .apercu-icone {
        background: var(--gris-100);
        color: var(--gris-700);
    }
    
    .mode-sombre .apercu-icone {
        background: var(--gris-800);
        color: var(--gris-300);
    }
    
    .apercu-couleur.bleu { background: #3b82f6; }
    .apercu-couleur.vert { background: #10b981; }
    .apercu-couleur.violet { background: #8b5cf6; }
    .apercu-couleur.orange { background: #f59e0b; }
    .apercu-couleur.rose { background: #ec4899; }
    .apercu-couleur.rouge { background: #ef4444; }
    .apercu-couleur.cyan { background: #06b6d4; }
    .apercu-couleur.jaune { background: #fbbf24; }
    
    .apercu-projet {
        margin-top: 2rem;
        padding: 1.5rem;
        background: var(--gris-50);
        border-radius: 8px;
        border: 1px solid var(--gris-200);
    }
    
    .mode-sombre .apercu-projet {
        background: var(--gris-800);
        border-color: var(--gris-700);
    }
    
    .apercu-projet h4 {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 1rem;
        color: var(--gris-700);
        margin-bottom: 1rem;
    }
    
    .mode-sombre .apercu-projet h4 {
        color: var(--gris-300);
    }
    
    .carte-apercu {
        background: white;
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid var(--gris-300);
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .mode-sombre .carte-apercu {
        background: var(--gris-900);
        border-color: var(--gris-700);
    }
    
    .entete-apercu {
        padding: 1rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        color: white;
        font-weight: 600;
    }
    
    .entete-apercu.bleu { background: #3b82f6; }
    .entete-apercu.vert { background: #10b981; }
    .entete-apercu.violet { background: #8b5cf6; }
    .entete-apercu.orange { background: #f59e0b; }
    .entete-apercu.rose { background: #ec4899; }
    .entete-apercu.rouge { background: #ef4444; }
    .entete-apercu.cyan { background: #06b6d4; }
    .entete-apercu.jaune { background: #fbbf24; }
    
    .entete-apercu i {
        font-size: 1.25rem;
    }
    
    .corps-apercu {
        padding: 1rem;
    }
    
    .corps-apercu p {
        color: var(--gris-600);
        font-size: 0.875rem;
        margin-bottom: 0.75rem;
    }
    
    .mode-sombre .corps-apercu p {
        color: var(--gris-400);
    }
    
    .stats-apercu {
        display: flex;
        gap: 1rem;
        font-size: 0.75rem;
        color: var(--gris-500);
    }
    
    .stats-apercu span {
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }
    
    .compteur-caracteres {
        text-align: right;
        font-size: 0.75rem;
        color: var(--gris-500);
        margin-top: 0.25rem;
    }
    
    .vide-message {
        text-align: center;
        padding: 2rem;
        color: var(--gris-500);
    }
    
    .btn-vide {
        margin-top: 1rem;
        padding: 0.5rem 1rem;
        background: var(--bleu-principal);
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.875rem;
        transition: background 0.2s;
    }
    
    .btn-vide:hover {
        background: var(--bleu-principal-fonce);
    }
    
    .description-projet {
        font-size: 0.75rem;
        color: var(--gris-500);
        margin-top: 0.25rem;
        font-style: italic;
    }
    
    .element-projet {
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .element-projet:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    .pourcentage-projet {
        font-size: 0.75rem;
        color: var(--gris-600);
        margin-top: 0.25rem;
        text-align: center;
    }
    
    .mode-sombre .pourcentage-projet {
        color: var(--gris-400);
    }
    
    .element-notification {
        position: relative;
        padding-right: 2.5rem;
    }
    
    .bouton-supprimer-notification {
        position: absolute;
        top: 50%;
        right: 0.5rem;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: var(--gris-400);
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 4px;
        opacity: 0;
        transition: all 0.2s;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .element-notification:hover .bouton-supprimer-notification {
        opacity: 1;
    }
    
    .bouton-supprimer-notification:hover {
        background: var(--gris-100);
        color: var(--rouge);
    }
    
    .mode-sombre .bouton-supprimer-notification:hover {
        background: var(--gris-800);
    }
    
    .bouton-supprimer-lues {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid var(--gris-200);
        text-align: center;
    }
    
    .mode-sombre .bouton-supprimer-lues {
        border-top-color: var(--gris-700);
    }
    
    .bouton-supprimer-lues button {
        background: none;
        border: none;
        color: var(--rouge);
        cursor: pointer;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        font-size: 0.75rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0 auto;
        transition: all 0.2s;
    }
    
    .bouton-supprimer-lues button:hover {
        background: rgba(239, 68, 68, 0.1);
    }
    
    .mode-sombre .bouton-supprimer-lues button:hover {
        background: rgba(239, 68, 68, 0.2);
    }
    
    .element-evenement {
        position: relative;
        padding-right: 2.5rem;
        transition: all 0.2s;
    }
    
    .bouton-supprimer-evenement {
        position: absolute;
        top: 50%;
        right: 0.5rem;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: var(--gris-400);
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 4px;
        opacity: 0;
        transition: all 0.2s;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .element-evenement:hover .bouton-supprimer-evenement {
        opacity: 1;
    }
    
    .bouton-supprimer-evenement:hover {
        background: var(--gris-100);
        color: var(--rouge);
    }
    
    .mode-sombre .bouton-supprimer-evenement:hover {
        background: var(--gris-800);
    }
    
    .vide-notifications {
        text-align: center;
        padding: 2rem;
        color: var(--gris-500);
    }
    
    .vide-notifications i {
        font-size: 2rem;
        margin-bottom: 0.5rem;
        opacity: 0.5;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes slideUp {
        from {
            transform: translateY(20px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
    }
    
    @media (max-width: 640px) {
        .form-row {
            grid-template-columns: 1fr;
        }
        
        .modal {
            width: 95%;
        }
        
        .selecteur-icones,
        .selecteur-couleurs {
            flex-direction: column;
            align-items: flex-start;
        }
        
        .bouton-supprimer-notification,
        .bouton-supprimer-evenement {
            opacity: 1;
        }
    }
`;

document.head.appendChild(styleModals);

// ============================================
// EXPOSITION DES FONCTIONS GLOBALES
// ============================================

window.TGNOVA = {
    afficherToast,
    basculerTheme,
    basculerBarreLaterale,
    marquerToutesNotificationsLues,
    supprimerNotificationsLues,
    supprimerNotification,
    supprimerEvenement,
    mettreAJourTachesRecentes,
    mettreAJourProgressionGlobale,
    mettreAJourAffichage,
    mettreAJourProjetsActifs,
    mettreAJourStatistiquesProjets,
    ouvrirModalTache,
    ouvrirModalEvenement,
    ouvrirModalProjet,
    fermerModalTache,
    fermerModalEvenement,
    fermerModalProjet,
    sauvegarderNouvelleTache,
    sauvegarderNouvelEvenement,
    sauvegarderNouveauProjet,
    exporterRapport,
    exporterProjetVersPage,
    initialiserFormulaireProjet,
    mettreAJourApercuProjet,
    afficherApercuIcone,
    afficherApercuCouleur,
    ouvrirPageProjet,
    recupererInfosUtilisateur,
    mettreAJourMessageAccueil,
    mettreAJourProfilUtilisateur
};

// Exposition globale des fonctions pour onclick
window.ouvrirModalTache = ouvrirModalTache;
window.ouvrirModalEvenement = ouvrirModalEvenement;
window.ouvrirModalProjet = ouvrirModalProjet;
window.fermerModalTache = fermerModalTache;
window.fermerModalEvenement = fermerModalEvenement;
window.fermerModalProjet = fermerModalProjet;
window.sauvegarderNouvelleTache = sauvegarderNouvelleTache;
window.sauvegarderNouvelEvenement = sauvegarderNouvelEvenement;
window.sauvegarderNouveauProjet = sauvegarderNouveauProjet;
window.mettreAJourApercuProjet = mettreAJourApercuProjet;
window.afficherApercuIcone = afficherApercuIcone;
window.afficherApercuCouleur = afficherApercuCouleur;
window.ouvrirPageProjet = ouvrirPageProjet;
window.supprimerNotificationsLues = supprimerNotificationsLues;
window.supprimerNotification = supprimerNotification;
window.supprimerEvenement = supprimerEvenement;

console.log('🚀 Dashboard TGNOVA adapté pour Firebase');
console.log('✅ Authentification requise');
console.log('✅ Tâches synchronisées en temps réel avec Firebase');
console.log('✅ Projets synchronisés en temps réel avec Firebase');
console.log('✅ Événements en localStorage (compatibilité)');
console.log('✅ Compatibilité totale avec le HTML existant');