/**
 * SYSTÈME DE GESTION DES TÂCHES EN TEMPS RÉEL AVEC FIREBASE
 * Gère la création, modification, suppression et affichage des tâches
 */

// ============================================
// VARIABLES GLOBALES
// ============================================

let tacheActuelle = null;
let utilisateurConnecte = null;
let tachesListener = null;
let taches = {};
let projets = {}; // Projets disponibles pour les tâches


const STORAGE_KEYS = {
    TACHES: 'tgnova_taches_firebase',
    TIMESTAMP: 'tgnova_taches_timestamp',
    UTILISATEUR: 'tgnova_utilisateur_cache'
};

// ============================================
// INITIALISATION
// ============================================

/**
 * Initialise le système de tâches
 */
async function initialiserTachesFirebase() {
    console.log('🚀 Initialisation du système de tâches Firebase');
    
    // Tentative de chargement depuis localStorage d'abord (mode hors ligne)
    const chargeLocal = chargerTachesDepuisLocal();
    if (chargeLocal) {
        console.log('📂 Tâches chargées depuis cache local');
        mettreAJourAffichageTaches();
        mettreAJourStatistiques();
    }
    
    // Vérifier l'utilisateur connecté
    firebase.auth().onAuthStateChanged(async (user) => {
        if (!user) {
            console.log('Aucun utilisateur connecté - Mode hors ligne');
            utilisateurConnecte = chargerUtilisateurDepuisLocal();
            
            // Si on a un utilisateur en cache, continuer en mode hors ligne
            if (utilisateurConnecte) {
                console.log('👤 Utilisation du profil en cache:', utilisateurConnecte.nom);
                if (!chargeLocal) {
                    mettreAJourAffichageTaches();
                    mettreAJourStatistiques();
                }
            }
            return;
        }
        
        // Récupérer les infos de l'utilisateur depuis Firestore
        try {
            const docUser = await firebase.firestore().collection('utilisateurs').doc(user.uid).get();
            
            if (docUser.exists) {
                utilisateurConnecte = {
                    id: user.uid,
                    ...docUser.data()
                };
            } else {
                // Créer un profil utilisateur par défaut
                utilisateurConnecte = {
                    id: user.uid,
                    nom: user.displayName || 'Utilisateur',
                    email: user.email,
                    avatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=4F46E5&color=fff`,
                    statut: 'en-ligne'
                };
                
                await firebase.firestore().collection('utilisateurs').doc(user.uid).set(utilisateurConnecte);
            }
            
            // Sauvegarder en cache local
            sauvegarderUtilisateurLocal(utilisateurConnecte);
            
            console.log('✅ Utilisateur connecté:', utilisateurConnecte.nom);
            
            // Charger les tâches de l'utilisateur
            chargerTaches();

            // Charger les projets disponibles pour les tâches
            chargerProjetsPourTaches();
            
            // Initialiser les événements de l'interface
            initialiserEvenementsTaches();
            
        } catch (error) {
            console.error('Erreur initialisation utilisateur:', error);
            // Fallback sur cache local
            utilisateurConnecte = chargerUtilisateurDepuisLocal();
            if (utilisateurConnecte && !chargeLocal) {
                mettreAJourAffichageTaches();
                mettreAJourStatistiques();
            }
        }
    });
}

/**
 * Sauvegarde l'utilisateur en cache local
 */
function sauvegarderUtilisateurLocal(utilisateur) {
    try {
        localStorage.setItem(STORAGE_KEYS.UTILISATEUR, JSON.stringify({
            id: utilisateur.id,
            nom: utilisateur.nom,
            email: utilisateur.email,
            avatar: utilisateur.avatar,
            timestamp: Date.now()
        }));
    } catch (error) {
        console.error('Erreur cache utilisateur:', error);
    }
}

/**
 * Charge l'utilisateur depuis le cache local
 */
function chargerUtilisateurDepuisLocal() {
    try {
        const cache = localStorage.getItem(STORAGE_KEYS.UTILISATEUR);
        if (cache) {
            return JSON.parse(cache);
        }
    } catch (error) {
        console.error('Erreur chargement cache utilisateur:', error);
    }
    return null;
}

// ============================================
// CHARGEMENT DES PROJETS (TÂCHES)
// ============================================

/**
 * Charge les projets de l'utilisateur et remplit les selecteurs de projet
 */
async function chargerProjetsPourTaches() {
    if (!utilisateurConnecte?.id) return;

    try {
        const db = firebase.firestore();
        const snapshot = await db.collection('projets')
            .where('membres', 'array-contains', utilisateurConnecte.id)
            // Ne pas ordonner côté Firestore pour éviter l'obligation d'un index composite
            .get();

        projets = {};

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            projets[doc.id] = {
                id: doc.id,
                nom: data.nom || data.titre || 'Projet',
                membres: data.membres || [],
                membresInfo: data.membresInfo || [],
                dateCreation: data.dateCreation?.toDate?.() || null
            };
        });

        // Trier en JS par date de création (descendant)
        const sortedProjets = Object.values(projets).sort((a, b) => {
            const da = a.dateCreation ? a.dateCreation.getTime() : 0;
            const db = b.dateCreation ? b.dateCreation.getTime() : 0;
            return db - da;
        });
        projets = Object.fromEntries(sortedProjets.map(p => [p.id, p]));

        // Remplir le select de création/édition de tâche
        const selectProjet = document.getElementById('projetTache');
        if (selectProjet) {
            selectProjet.innerHTML = '<option value="">Sélectionner un projet</option>';
            Object.values(projets).forEach(projet => {
                const option = document.createElement('option');
                option.value = projet.id;
                option.textContent = projet.nom;
                selectProjet.appendChild(option);
            });

            // Mettre à jour la liste d'assignation quand le projet change
            selectProjet.addEventListener('change', () => {
                mettreAJourAssignationSelonProjet(selectProjet.value);
            });
        }

        // Remplir le filtre de projet
        const filtreProjet = document.getElementById('filtreProjet');
        if (filtreProjet) {
            const valeurActuelle = filtreProjet.value;
            filtreProjet.innerHTML = '<option value="tous">Tous les projets</option>';
            Object.values(projets).forEach(projet => {
                const option = document.createElement('option');
                option.value = projet.id;
                option.textContent = projet.nom;
                filtreProjet.appendChild(option);
            });
            // Si une sélection existait, la restaurer
            if (valeurActuelle) {
                filtreProjet.value = valeurActuelle;
            }
        }

        console.log(`✅ ${Object.keys(projets).length} projets chargés pour les tâches`);
        
        // Exposer globalement pour les autres scripts
        window.projets = projets;
    } catch (error) {
        console.error('❌ Erreur chargement projets pour tâches:', error);
    }
}

/**
 * Met à jour la liste des assignés en fonction du projet sélectionné
 */
function mettreAJourAssignationSelonProjet(projetId) {
    const selectAssignation = document.getElementById('assignationTache');
    if (!selectAssignation) return;

    // Vider la liste
    selectAssignation.innerHTML = '';
    selectAssignation.disabled = true;

    if (!projetId) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Sélectionnez un projet d\'abord';
        selectAssignation.appendChild(option);
        return;
    }

    const projet = window.projets[projetId];
    if (!projet) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Projet introuvable';
        selectAssignation.appendChild(option);
        return;
    }

    const membres = projet.membresInfo || [];
    if (membres.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Aucun membre dans ce projet';
        selectAssignation.appendChild(option);
        return;
    }

    // Ajouter une option vide
    const optionVide = document.createElement('option');
    optionVide.value = '';
    optionVide.textContent = 'Sélectionnez un membre';
    selectAssignation.appendChild(optionVide);

    membres.forEach(member => {
        const option = document.createElement('option');
        option.value = member.id || member.uid || member.userId || '';
        option.textContent = member.nom || member.name || member.displayName || 'Utilisateur';
        option.dataset.nom = option.textContent;
        selectAssignation.appendChild(option);
    });

    selectAssignation.disabled = false;
}

/**
 * Sauvegarde les tâches dans localStorage
 */
function sauvegarderTachesLocalement() {
    try {
        const tachesArray = Object.values(taches);
        localStorage.setItem(STORAGE_KEYS.TACHES, JSON.stringify(tachesArray));
        localStorage.setItem(STORAGE_KEYS.TIMESTAMP, Date.now().toString());
        console.log(`✅ ${tachesArray.length} tâches sauvegardées localement`);
    } catch (error) {
        console.error('Erreur sauvegarde locale:', error);
    }
}

/**
 * Charge les tâches depuis localStorage (fallback)
 */
function chargerTachesDepuisLocal() {
    try {
        const sauvegarde = localStorage.getItem(STORAGE_KEYS.TACHES);
        if (sauvegarde) {
            const tachesArray = JSON.parse(sauvegarde);
            taches = {};
            tachesArray.forEach(t => {
                // Restaurer les dates
                if (t.echeance) t.echeance = new Date(t.echeance);
                if (t.dateCreation) t.dateCreation = new Date(t.dateCreation);
                if (t.dateModification) t.dateModification = new Date(t.dateModification);
                taches[t.id] = t;
            });
            console.log(`📂 ${tachesArray.length} tâches chargées depuis localStorage`);
            return true;
        }
    } catch (error) {
        console.error('Erreur chargement local:', error);
    }
    return false;
}

/**
 * Initialise les événements de l'interface tâches
 */
function initialiserEvenementsTaches() {
    // Bouton nouvelle tâche
    const boutonNouvelleTache = document.getElementById('boutonNouvelleTache');
    if (boutonNouvelleTache) {
        boutonNouvelleTache.addEventListener('click', () => {
            ouvrirModalTache();
        });
    }
    
    // Bouton annuler dans la modale
    const boutonAnnuler = document.getElementById('annulerModalTache');
    if (boutonAnnuler) {
        boutonAnnuler.addEventListener('click', fermerModalTache);
    }
    
    // Bouton fermer de la modale
    const boutonFermer = document.getElementById('fermerModalTache');
    if (boutonFermer) {
        boutonFermer.addEventListener('click', fermerModalTache);
    }
    
    // Formulaire de tâche
    const formulaire = document.getElementById('formTache');
    if (formulaire) {
        formulaire.addEventListener('submit', (e) => {
            e.preventDefault();
            sauvegarderTache();
        });
    }
    
    // Bouton fermer modale confirmation
    const boutonFermerConfirmation = document.getElementById('fermerModalConfirmation');
    if (boutonFermerConfirmation) {
        boutonFermerConfirmation.addEventListener('click', fermerModalConfirmation);
    }
    
    const boutonAnnulerSuppression = document.getElementById('annulerSuppression');
    if (boutonAnnulerSuppression) {
        boutonAnnulerSuppression.addEventListener('click', fermerModalConfirmation);
    }
    
    // Bouton confirmer suppression
    const boutonConfirmer = document.getElementById('confirmerSuppression');
    if (boutonConfirmer) {
        boutonConfirmer.addEventListener('click', supprimerTacheConfirmee);
    }
    
    // Sélecteur de vue (tableau/grille)
    const selecteurVue = document.getElementById('selecteurVue');
    if (selecteurVue) {
        selecteurVue.addEventListener('change', (e) => {
            changerVue(e.target.value);
        });
    }
    
    // Filtres de tâches
    const filtres = ['filtreStatut', 'filtrePriorite', 'filtreProjet', 'filtreEcheance'];
    filtres.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', () => {
                mettreAJourAffichageTaches();
            });
        }
    });
    
    // Filtres rapides
    document.querySelectorAll('.quick-filter').forEach(bouton => {
        bouton.addEventListener('click', (e) => {
            document.querySelectorAll('.quick-filter').forEach(b => b.classList.remove('active'));
            bouton.classList.add('active');
            
            const filtre = bouton.dataset.filtre;
            appliquerFiltreRapide(filtre);
        });
    });
    
    // Recherche
    const champRecherche = document.querySelector('.champ-recherche');
    if (champRecherche) {
        champRecherche.addEventListener('input', (e) => {
            rechercherTaches(e.target.value.toLowerCase());
        });
    }
    
    // Bouton "Tout sélectionner"
    const selectAll = document.getElementById('selectionToutes');
    if (selectAll) {
        selectAll.addEventListener('change', (e) => {
            const tousIds = Object.keys(taches);
            if (e.target.checked) {
                window.tachesSelectionnees = tousIds;
            } else {
                window.tachesSelectionnees = [];
            }
            mettreAJourSelection();
            
            document.querySelectorAll('.case-selection-tache').forEach(c => {
                c.checked = e.target.checked;
            });
        });
    }
    
    // Actions groupées
    const btnMarquerTerminees = document.querySelector('.bulk-actions .btn-secondary');
    if (btnMarquerTerminees) {
        btnMarquerTerminees.addEventListener('click', marquerSelectionCommeTerminee);
    }
    
    const btnSupprimerGroupes = document.querySelector('.bulk-actions .btn-danger');
    if (btnSupprimerGroupes) {
        btnSupprimerGroupes.addEventListener('click', () => {
            if (window.tachesSelectionnees?.length > 0) {
                modalUtils.demanderConfirmation(
                    'Suppression groupée',
                    `Êtes-vous sûr de vouloir supprimer ${window.tachesSelectionnees.length} tâche(s) ?`,
                    () => supprimerSelection()
                );
            }
        });
    }
    
    const btnExporter = document.querySelector('.bulk-actions .btn-primary');
    if (btnExporter) {
        btnExporter.addEventListener('click', () => exporterTaches('json'));
    }
    
    // Fermeture des modales au clic sur l'overlay
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                if (overlay.id === 'modalTache') {
                    fermerModalTache();
                } else if (overlay.id === 'modalConfirmation') {
                    fermerModalConfirmation();
                }
            }
        });
    });
}

// ============================================
// CHARGEMENT DES TÂCHES
// ============================================

/**
 * Charge les tâches de l'utilisateur en temps réel
 */
function chargerTaches() {
    if (!utilisateurConnecte || !utilisateurConnecte.id) {
        // Fallback sur localStorage si pas de connexion
        if (!chargerTachesDepuisLocal()) {
            taches = {};
        }
        mettreAJourAffichageTaches();
        mettreAJourStatistiques();
        return;
    }
    
    const db = firebase.firestore();
    
    // Écouter les tâches de l'utilisateur
    const q = db.collection('tasks')
        .where('createurId', '==', utilisateurConnecte.id)
        .orderBy('dateCreation', 'desc');
    
    // Nettoyer l'ancien listener
    if (tachesListener) {
        tachesListener();
    }
    
    tachesListener = q.onSnapshot((snapshot) => {
        // Traiter les changements un par un pour éviter de tout réinitialiser
        snapshot.docChanges().forEach(change => {
            const data = change.doc.data();
            const tache = {
                id: change.doc.id,
                firestoreId: change.doc.id,
                ...data,
                dateCreation: data.dateCreation?.toDate?.() || null,
                dateModification: data.dateModification?.toDate?.() || null,
                dateFin: data.dateFin ? new Date(data.dateFin) : null,
                echeance: data.echeance ? new Date(data.echeance) : null
            };
            
            if (change.type === 'removed') {
                delete taches[change.doc.id];
                console.log('🗑️ Tâche supprimée:', change.doc.id);
            } else if (change.type === 'added') {
                taches[change.doc.id] = tache;
                console.log('➕ Tâche ajoutée:', change.doc.id);
            } else if (change.type === 'modified') {
                taches[change.doc.id] = tache;
                console.log('✏️ Tâche modifiée:', change.doc.id);
            }
        });
        
        console.log(`✅ ${Object.keys(taches).length} tâches synchronisées`);
        
        // Sauvegarder localement après chaque mise à jour
        sauvegarderTachesLocalement();
        
        // Mettre à jour l'affichage
        mettreAJourAffichageTaches();
        mettreAJourStatistiques();
        
        // Émettre un événement pour le dashboard
        document.dispatchEvent(new CustomEvent('tachesModifiees', { 
            detail: { taches: Object.values(taches) } 
        }));
        
    }, (error) => {
        console.error('Erreur synchronisation Firebase:', error);
        // Fallback sur localStorage en cas d'erreur réseau
        if (chargerTachesDepuisLocal()) {
            mettreAJourAffichageTaches();
            mettreAJourStatistiques();
        }
        afficherNotification('Erreur de synchronisation - Mode hors ligne', 'warning');
    });
}

/**
 * Met à jour l'affichage des tâches (tableau et grille)
 */
function mettreAJourAffichageTaches() {
    const tachesArray = Object.values(taches);
    const vueActuelle = document.getElementById('selecteurVue')?.value || 'tableau';
    
    // Récupérer les filtres
    const filtres = {
        statut: document.getElementById('filtreStatut')?.value || 'tous',
        priorite: document.getElementById('filtrePriorite')?.value || 'toutes',
        projet: document.getElementById('filtreProjet')?.value || 'tous',
        echeance: document.getElementById('filtreEcheance')?.value || 'toutes',
        recherche: window.termeRecherche || ''
    };
    
    // Appliquer les filtres
    let tachesFiltrees = tachesArray;
    
    // Filtre par statut
    if (filtres.statut !== 'tous') {
        tachesFiltrees = tachesFiltrees.filter(t => t.statut === filtres.statut);
    }
    
    // Filtre par priorité
    if (filtres.priorite !== 'toutes') {
        tachesFiltrees = tachesFiltrees.filter(t => t.priorite === filtres.priorite);
    }
    
    // Filtre par projet
    if (filtres.projet !== 'tous') {
        tachesFiltrees = tachesFiltrees.filter(t => t.projet === filtres.projet);
    }
    
    // Filtre par échéance
    if (filtres.echeance !== 'toutes') {
        const aujourdhui = new Date();
        aujourdhui.setHours(0, 0, 0, 0);
        
        tachesFiltrees = tachesFiltrees.filter(t => {
            if (!t.echeance) return false;
            
            const echeance = new Date(t.echeance);
            echeance.setHours(0, 0, 0, 0);
            
            switch (filtres.echeance) {
                case 'aujourdhui':
                    return echeance.getTime() === aujourdhui.getTime();
                    
                case 'semaine':
                    const finSemaine = new Date(aujourdhui);
                    finSemaine.setDate(aujourdhui.getDate() + 7);
                    return echeance >= aujourdhui && echeance <= finSemaine;
                    
                case 'mois':
                    const finMois = new Date(aujourdhui);
                    finMois.setMonth(aujourdhui.getMonth() + 1);
                    return echeance >= aujourdhui && echeance <= finMois;
                    
                case 'retard':
                    return echeance < aujourdhui && t.statut !== 'terminee';
                    
                default:
                    return true;
            }
        });
    }
    
    // Filtre par recherche
    if (filtres.recherche && filtres.recherche.length >= 2) {
        const recherche = filtres.recherche.toLowerCase();
        tachesFiltrees = tachesFiltrees.filter(t => 
            (t.titre?.toLowerCase().includes(recherche)) ||
            (t.description?.toLowerCase().includes(recherche)) ||
            (t.projet?.toLowerCase().includes(recherche))
        );
    }
    
    // Afficher l'état vide si nécessaire
    const etatVide = document.querySelector('.etat-vide');
    if (tachesFiltrees.length === 0) {
        if (etatVide) etatVide.style.display = 'block';
        const tbody = document.querySelector('.vue-tableau-taches tbody');
        if (tbody) tbody.innerHTML = '';
        const grille = document.querySelector('.grille-taches');
        if (grille) grille.innerHTML = '';
        return;
    } else {
        if (etatVide) etatVide.style.display = 'none';
    }
    
    // Mettre à jour la vue tableau
    mettreAJourTableauTaches(tachesFiltrees);
    
    // Mettre à jour la vue grille
    mettreAJourGrilleTaches(tachesFiltrees);
    
    // Mettre à jour la sélection
    mettreAJourSelection();
}

/**
 * Met à jour la vue tableau des tâches
 */
function mettreAJourTableauTaches(tachesArray) {
    const corpsTableau = document.querySelector('.vue-tableau-taches tbody');
    if (!corpsTableau) return;
    
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);
    
    corpsTableau.innerHTML = tachesArray.map(tache => {
        const estSelectionnee = window.tachesSelectionnees?.includes(tache.id);
        const estEnRetard = tache.echeance && new Date(tache.echeance) < aujourdhui && tache.statut !== 'terminee';
        
        return `
            <tr data-id="${tache.id}" class="${estEnRetard ? 'en-retard' : ''}">
                <td>
                    <input type="checkbox" class="case-selection-tache" 
                           data-id="${tache.id}" ${estSelectionnee ? 'checked' : ''}>
                </td>
                <td>
                    <div class="titre-tache">${echapperHTML(tache.titre || 'Sans titre')}</div>
                    <div class="description-tache">${echapperHTML(tache.description || '')}</div>
                </td>
                <td>
                    <span class="badge-projet">${echapperHTML(tache.projet || 'Général')}</span>
                </td>
                <td>
                    <span class="badge-statut ${tache.priorite || 'moyenne'}">
                        ${obtenirLibellePriorite(tache.priorite)}
                    </span>
                </td>
                <td>
                    <span class="badge-statut ${tache.statut || 'a-faire'}">
                        ${obtenirLibelleStatut(tache.statut)}
                    </span>
                </td>
                <td>
                    <div class="date-echeance ${estEnRetard ? 'en-retard' : ''}">
                        ${formaterEcheance(tache.echeance)}
                    </div>
                </td>
                <td>
                    <div class="actions-tache">
                        <button class="bouton-action-tache editer" onclick="event.stopPropagation(); window.ouvrirModalTache('${tache.id}')" title="Éditer">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="bouton-action-tache supprimer" onclick="event.stopPropagation(); window.confirmerSuppressionTache('${tache.id}')" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    // Ajouter les écouteurs sur les cases à cocher
    document.querySelectorAll('.case-selection-tache').forEach(caseCoche => {
        caseCoche.addEventListener('change', (e) => {
            const id = e.target.dataset.id;
            if (e.target.checked) {
                if (!window.tachesSelectionnees.includes(id)) {
                    window.tachesSelectionnees.push(id);
                }
            } else {
                window.tachesSelectionnees = window.tachesSelectionnees.filter(tId => tId !== id);
                
                // Décocher "Tout sélectionner" si nécessaire
                const selectAll = document.getElementById('selectionToutes');
                if (selectAll) selectAll.checked = false;
            }
            mettreAJourSelection();
        });
    });
    
    // Ajouter l'événement de clic sur la ligne pour ouvrir les détails
    document.querySelectorAll('#corpsTableauTaches tr').forEach(ligne => {
        ligne.addEventListener('click', (e) => {
            if (e.target.closest('.bouton-action-tache') || e.target.closest('input[type="checkbox"]')) return;
            
            const tacheId = ligne.dataset.id;
            if (tacheId) afficherDetailsTache(tacheId);
        });
    });
}

/**
 * Met à jour la vue grille des tâches
 */
function mettreAJourGrilleTaches(tachesArray) {
    const grille = document.querySelector('.grille-taches');
    if (!grille) return;
    
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);
    
    grille.innerHTML = tachesArray.map(tache => {
        const estSelectionnee = window.tachesSelectionnees?.includes(tache.id);
        const estEnRetard = tache.echeance && new Date(tache.echeance) < aujourdhui && tache.statut !== 'terminee';
        
        return `
            <div class="carte-tache ${estEnRetard ? 'en-retard' : ''}" data-id="${tache.id}">
                <div class="en-tete-carte-tache">
                    <span class="badge-statut ${tache.statut || 'a-faire'}">${obtenirLibelleStatut(tache.statut)}</span>
                    <input type="checkbox" class="case-selection-tache" 
                           data-id="${tache.id}" ${estSelectionnee ? 'checked' : ''}>
                </div>
                <div class="contenu-carte-tache">
                    <h3>${echapperHTML(tache.titre || 'Sans titre')}</h3>
                    <p class="description-carte-tache">${echapperHTML(tache.description || 'Aucune description')}</p>
                    <div class="meta-carte-tache">
                        <div class="element-meta">
                            <i class="fas fa-folder"></i>
                            <span>Projet: ${echapperHTML(tache.projet || 'Général')}</span>
                        </div>
                        <div class="element-meta">
                            <i class="fas fa-flag"></i>
                            <span>Priorité: ${obtenirLibellePriorite(tache.priorite)}</span>
                        </div>
                        <div class="element-meta">
                            <i class="fas fa-calendar"></i>
                            <span>Échéance: ${formaterEcheance(tache.echeance)}</span>
                        </div>
                    </div>
                </div>
                <div class="pied-carte-tache">
                    <span class="badge-projet">${echapperHTML(tache.projet || 'Général')}</span>
                    <div class="actions-tache">
                        <button class="bouton-action-tache editer" onclick="event.stopPropagation(); window.ouvrirModalTache('${tache.id}')" title="Éditer">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="bouton-action-tache supprimer" onclick="event.stopPropagation(); window.confirmerSuppressionTache('${tache.id}')" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Ajouter les écouteurs sur les cases à cocher
    document.querySelectorAll('.grille-taches .case-selection-tache').forEach(caseCoche => {
        caseCoche.addEventListener('change', (e) => {
            const id = e.target.dataset.id;
            if (e.target.checked) {
                if (!window.tachesSelectionnees.includes(id)) {
                    window.tachesSelectionnees.push(id);
                }
            } else {
                window.tachesSelectionnees = window.tachesSelectionnees.filter(tId => tId !== id);
                
                // Décocher "Tout sélectionner" si nécessaire
                const selectAll = document.getElementById('selectionToutes');
                if (selectAll) selectAll.checked = false;
            }
            mettreAJourSelection();
        });
    });
    
    // Ajouter l'événement de clic sur la carte pour ouvrir les détails
    document.querySelectorAll('.carte-tache').forEach(carte => {
        carte.addEventListener('click', (e) => {
            if (e.target.closest('.bouton-action-tache') || e.target.closest('input[type="checkbox"]')) return;
            
            const tacheId = carte.dataset.id;
            if (tacheId) afficherDetailsTache(tacheId);
        });
    });
}

/**
 * Met à jour les statistiques des tâches
 */
function mettreAJourStatistiques() {
    const tachesArray = Object.values(taches);
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);
    
    const total = tachesArray.length;
    const terminees = tachesArray.filter(t => t.statut === 'terminee').length;
    const enCours = tachesArray.filter(t => t.statut === 'en-cours').length;
    const aFaire = tachesArray.filter(t => t.statut === 'a-faire').length;
    const enRetard = tachesArray.filter(t => {
        if (t.statut === 'terminee') return false;
        if (!t.echeance) return false;
        return new Date(t.echeance) < aujourdhui;
    }).length;
    
    // Mettre à jour l'affichage
    const stats = document.querySelectorAll('.valeur-statistique-tache');
    
    if (stats.length >= 4) {
        animerCompteur(stats[0], total);
        animerCompteur(stats[1], terminees);
        animerCompteur(stats[2], enCours);
        animerCompteur(stats[3], enRetard);
    }
    
    // Mettre à jour le badge dans la navigation
    const badge = document.querySelector('.lien-navigation[href="taches.html"] .badge-navigation');
    if (badge) {
        badge.textContent = aFaire + enCours;
    }
}

/**
 * Anime un compteur de statistiques
 */
function animerCompteur(element, valeurFinale) {
    if (!element) return;
    
    const valeurActuelle = parseInt(element.textContent) || 0;
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
        
        element.textContent = Math.round(valeurCourante);
    }, 16);
}

// ============================================
// CRÉATION ET MODIFICATION DE TÂCHES
// ============================================

/**
 * Ouvre la modale de tâche (création ou édition)
 */
async function ouvrirModalTache(tacheId = null) {
    const modal = document.getElementById('modalTache');
    const titreModal = document.getElementById('modalTitre');
    const formulaire = document.getElementById('formTache');
    const sauvegarderBtn = document.getElementById('sauvegarderTache');
    
    if (!modal) return;
    
    // Charger les projets (et préparer les assignations)
    await chargerProjetsPourTaches();
    
    // Réinitialiser le formulaire
    formulaire.reset();
    
    // Valeurs par défaut
    const aujourdhui = new Date().toISOString().split('T')[0];

    if (tacheId && taches[tacheId]) {
        // Mode édition
        const tache = taches[tacheId];
        tacheActuelle = tacheId;
        
        titreModal.textContent = 'Modifier la tâche';
        sauvegarderBtn.dataset.tacheId = tacheId;
        
        // Remplir le formulaire
        document.getElementById('titreTache').value = tache.titre || '';
        document.getElementById('descriptionTache').value = tache.description || '';
        const selectProjet = document.getElementById('projetTache');
        if (selectProjet) {
            const projetId = tache.projetId || Object.values(projets).find(p => p.nom === tache.projet)?.id;
            selectProjet.value = projetId || '';
            mettreAJourAssignationSelonProjet(selectProjet.value);
        }
        document.getElementById('prioriteTache').value = tache.priorite || 'moyenne';
        document.getElementById('statutTache').value = tache.statut || 'a-faire';
        
        if (tache.echeance) {
            const date = new Date(tache.echeance);
            document.getElementById('echeanceTache').value = date.toISOString().split('T')[0];
        } else {
            document.getElementById('echeanceTache').value = aujourdhui;
        }
        
        document.getElementById('assignationTache').value = tache.assigne || utilisateurConnecte?.nom || '';
        
    } else {
        // Mode création
        titreModal.textContent = 'Nouvelle tâche';
        delete sauvegarderBtn.dataset.tacheId;
        tacheActuelle = null;
        
        document.getElementById('echeanceTache').value = aujourdhui;
        document.getElementById('prioriteTache').value = 'moyenne';
        document.getElementById('statutTache').value = 'a-faire';
        document.getElementById('assignationTache').value = utilisateurConnecte?.nom || '';
    }
    
    modal.classList.add('visible');
    document.body.style.overflow = 'hidden';
    
    // Focus sur le premier champ
    setTimeout(() => {
        document.getElementById('titreTache')?.focus();
    }, 100);
}

/**
 * Ferme la modale de tâche
 */
function fermerModalTache() {
    const modal = document.getElementById('modalTache');
    if (modal) {
        modal.classList.remove('visible');
        document.body.style.overflow = '';
        tacheActuelle = null;
    }
}

/**
 * Sauvegarde une tâche (création ou modification)
 */
async function sauvegarderTache() {
    // Récupérer les valeurs du formulaire
    const tacheId = document.getElementById('sauvegarderTache').dataset.tacheId;
    const titre = document.getElementById('titreTache').value.trim();
    const description = document.getElementById('descriptionTache').value.trim();
    const projet = document.getElementById('projetTache').value;
    const priorite = document.getElementById('prioriteTache').value;
    const statut = document.getElementById('statutTache').value;
    const echeance = document.getElementById('echeanceTache').value;
    const assigne = document.getElementById('assignationTache').value.trim();
    
    // Validation
    if (!titre) {
        afficherNotification('Le titre de la tâche est obligatoire', 'erreur');
        document.getElementById('titreTache').focus();
        return;
    }
    
    const maintenant = new Date();
    const dateStr = maintenant.toISOString();
    
    if (tacheId && taches[tacheId]) {
        // Mode édition
        taches[tacheId] = {
            ...taches[tacheId],
            titre: titre,
            description: description || '',
            projet: projet || 'Général',
            priorite: priorite || 'moyenne',
            statut: statut || 'a-faire',
            echeance: echeance ? new Date(echeance) : null,
            assigne: assigne || utilisateurConnecte?.nom || 'Utilisateur',
            completee: statut === 'terminee',
            dateModification: maintenant
        };
        
        // Si connecté à Firebase, synchroniser
        if (utilisateurConnecte && utilisateurConnecte.id) {
            try {
                const db = firebase.firestore();
                await db.collection('tasks').doc(tacheId).update({
                    titre: titre,
                    description: description || '',
                    projet: projet || 'Général',
                    priorite: priorite || 'moyenne',
                    statut: statut || 'a-faire',
                    echeance: echeance || null,
                    assigne: assigne || utilisateurConnecte.nom,
                    completee: statut === 'terminee',
                    dateModification: firebase.firestore.FieldValue.serverTimestamp()
                });
                console.log('✅ Tâche mise à jour dans Firebase:', tacheId);
            } catch (error) {
                console.error('Erreur mise à jour Firebase:', error);
                // Continuer avec sauvegarde locale
            }
        }
        
        afficherNotification('Tâche mise à jour avec succès', 'succes');
        
    } else {
        // Mode création
        const nouvelleTache = {
            id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            titre: titre,
            description: description || '',
            projet: projet || 'Général',
            priorite: priorite || 'moyenne',
            statut: statut || 'a-faire',
            echeance: echeance ? new Date(echeance) : null,
            assigne: assigne || utilisateurConnecte?.nom || 'Utilisateur',
            completee: statut === 'terminee',
            dateCreation: maintenant,
            dateModification: maintenant
        };
        
        // Si connecté à Firebase, ajouter l'ID du créateur
        if (utilisateurConnecte && utilisateurConnecte.id) {
            nouvelleTache.createurId = utilisateurConnecte.id;
            
            try {
                const db = firebase.firestore();
                const docRef = await db.collection('tasks').add({
                    ...nouvelleTache,
                    dateCreation: firebase.firestore.FieldValue.serverTimestamp(),
                    dateModification: firebase.firestore.FieldValue.serverTimestamp(),
                    echeance: echeance || null
                });
                nouvelleTache.id = docRef.id;
                nouvelleTache.firestoreId = docRef.id;
                console.log('✅ Tâche créée dans Firebase:', docRef.id);
            } catch (error) {
                console.error('Erreur création Firebase:', error);
                // Garder l'ID local
            }
        }
        
        taches[nouvelleTache.id] = nouvelleTache;
        afficherNotification('Tâche créée avec succès', 'succes');
    }
    
    // Sauvegarde locale
    sauvegarderTachesLocalement();
    
    // Mettre à jour l'affichage
    mettreAJourAffichageTaches();
    mettreAJourStatistiques();
    
    // Fermer la modale
    fermerModalTache();
    
    // Émettre événement
    document.dispatchEvent(new CustomEvent('tachesModifiees', { 
        detail: { taches: Object.values(taches) } 
    }));
}

// ============================================
// GESTION DES TÂCHES (Actions)
// ============================================

/**
 * Affiche les détails d'une tâche
 */
function afficherDetailsTache(tacheId) {
    const tache = taches[tacheId];
    if (!tache) return;
    
    tacheActuelle = tacheId;
    
    // Créer une modale de détails si elle n'existe pas
    let modalDetails = document.getElementById('modalDetailsTache');
    
    if (!modalDetails) {
        modalDetails = document.createElement('div');
        modalDetails.id = 'modalDetailsTache';
        modalDetails.className = 'modal-overlay';
        modalDetails.innerHTML = `
            <div class="modal" style="max-width: 600px;">
                <div class="modal-header">
                    <h2 id="titreDetailsTache">Détails de la tâche</h2>
                    <button class="modal-close" id="fermerDetailsTache">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-content" id="contenuDetailsTache">
                    <!-- Contenu généré dynamiquement -->
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" id="fermerDetailsBtn">
                        Fermer
                    </button>
                    <button type="button" class="btn-primary" id="editerDepuisDetails">
                        <i class="fas fa-edit"></i> Modifier
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modalDetails);
        
        // Ajouter les événements
        document.getElementById('fermerDetailsTache').addEventListener('click', fermerDetailsTache);
        document.getElementById('fermerDetailsBtn').addEventListener('click', fermerDetailsTache);
        document.getElementById('editerDepuisDetails').addEventListener('click', () => {
            fermerDetailsTache();
            ouvrirModalTache(tacheActuelle);
        });
        
        modalDetails.addEventListener('click', (e) => {
            if (e.target === modalDetails) {
                fermerDetailsTache();
            }
        });
    }
    
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);
    const echeance = tache.echeance ? new Date(tache.echeance) : null;
    const estEnRetard = echeance && echeance < aujourdhui && tache.statut !== 'terminee';
    
    const contenu = document.getElementById('contenuDetailsTache');
    contenu.innerHTML = `
        <div style="margin-bottom: 1.5rem;">
            <h3 style="font-size: 1.25rem; margin-bottom: 0.5rem;">${echapperHTML(tache.titre)}</h3>
            <p style="color: var(--gris-600); line-height: 1.6;">${echapperHTML(tache.description) || 'Aucune description'}</p>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
            <div>
                <div style="font-size: 0.875rem; color: var(--gris-500); margin-bottom: 0.25rem;">Projet</div>
                <div><span class="badge-projet">${echapperHTML(tache.projet || 'Général')}</span></div>
            </div>
            <div>
                <div style="font-size: 0.875rem; color: var(--gris-500); margin-bottom: 0.25rem;">Priorité</div>
                <div><span class="badge-statut ${tache.priorite || 'moyenne'}">${obtenirLibellePriorite(tache.priorite)}</span></div>
            </div>
            <div>
                <div style="font-size: 0.875rem; color: var(--gris-500); margin-bottom: 0.25rem;">Statut</div>
                <div><span class="badge-statut ${tache.statut || 'a-faire'}">${obtenirLibelleStatut(tache.statut)}</span></div>
            </div>
            <div>
                <div style="font-size: 0.875rem; color: var(--gris-500); margin-bottom: 0.25rem;">Échéance</div>
                <div class="${estEnRetard ? 'en-retard' : ''}">${formaterEcheance(tache.echeance)}</div>
            </div>
        </div>
        
        <div style="border-top: 1px solid var(--gris-200); padding-top: 1rem;">
            <div style="font-size: 0.875rem; color: var(--gris-500); margin-bottom: 0.5rem;">Assigné à</div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <img src="${utilisateurConnecte?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(tache.assigne || 'U')}&background=4F46E5&color=fff`}" 
                     style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">
                <span>${echapperHTML(tache.assigne || 'Non assigné')}</span>
            </div>
        </div>
        
        <div style="margin-top: 1rem; font-size: 0.75rem; color: var(--gris-500); display: flex; gap: 1rem;">
            <span>Créé le: ${formaterDateComplet(tache.dateCreation)}</span>
            ${tache.dateModification ? `<span>Modifié le: ${formaterDateComplet(tache.dateModification)}</span>` : ''}
        </div>
    `;
    
    modalDetails.classList.add('visible');
    document.body.style.overflow = 'hidden';
}

/**
 * Ferme la modale de détails
 */
function fermerDetailsTache() {
    const modal = document.getElementById('modalDetailsTache');
    if (modal) {
        modal.classList.remove('visible');
        document.body.style.overflow = '';
        tacheActuelle = null;
    }
}

/**
 * Confirme et supprime une tâche
 */
function confirmerSuppressionTache(tacheId) {
    const tache = taches[tacheId];
    if (!tache) return;
    
    const modal = document.getElementById('modalConfirmation');
    const message = document.getElementById('messageConfirmation');
    
    if (modal && message) {
        message.textContent = `Êtes-vous sûr de vouloir supprimer définitivement la tâche "${tache.titre}" ? Cette action est irréversible.`;
        modal.classList.add('visible');
        document.getElementById('confirmerSuppression').dataset.tacheId = tacheId;
    } else {
        // Fallback
        modalUtils.demanderConfirmation(
            'Confirmation de suppression',
            `Supprimer la tâche "${tache.titre}" ?`,
            () => supprimerTache(tacheId)
        );
    }
}

/**
 * Supprime une tâche après confirmation
 */
async function supprimerTacheConfirmee() {
    const tacheId = document.getElementById('confirmerSuppression').dataset.tacheId;
    
    if (tacheId) {
        await supprimerTache(tacheId);
        fermerModalConfirmation();
    }
}

/**
 * Supprime une tâche
 */
async function supprimerTache(tacheId) {
    const tache = taches[tacheId];
    if (!tache) return;
    
    // Supprimer de Firebase si connecté
    if (utilisateurConnecte && utilisateurConnecte.id && tache.firestoreId) {
        try {
            const db = firebase.firestore();
            await db.collection('tasks').doc(tache.firestoreId).delete();
            console.log('✅ Tâche supprimée de Firebase:', tacheId);
        } catch (error) {
            console.error('Erreur suppression Firebase:', error);
            // Continuer avec suppression locale
        }
    }
    
    // Supprimer localement
    delete taches[tacheId];
    
    // Sauvegarde locale
    sauvegarderTachesLocalement();
    
    // Mettre à jour l'affichage
    mettreAJourAffichageTaches();
    mettreAJourStatistiques();
    
    console.log('✅ Tâche supprimée:', tacheId);
    afficherNotification('Tâche supprimée avec succès', 'succes');
    
    // Fermer les modales si ouvertes
    fermerDetailsTache();
    
    // Émettre événement
    document.dispatchEvent(new CustomEvent('tachesModifiees', { 
        detail: { taches: Object.values(taches) } 
    }));
}

/**
 * Ferme le modal de confirmation
 */
function fermerModalConfirmation() {
    const modal = document.getElementById('modalConfirmation');
    if (modal) {
        modal.classList.remove('visible');
        delete document.getElementById('confirmerSuppression').dataset.tacheId;
    }
}

// ============================================
// ACTIONS GROUPÉES
// ============================================

/**
 * Met à jour l'affichage de la sélection
 */
function mettreAJourSelection() {
    const compteurSelection = document.querySelector('.bulk-count');
    const bulkActions = document.querySelector('.bulk-actions');
    
    if (compteurSelection) {
        const count = window.tachesSelectionnees?.length || 0;
        compteurSelection.textContent = `${count} tâche(s) sélectionnée(s)`;
    }
    
    if (bulkActions) {
        if (window.tachesSelectionnees?.length > 0) {
            bulkActions.classList.add('visible');
        } else {
            bulkActions.classList.remove('visible');
        }
    }
}

/**
 * Marque les tâches sélectionnées comme terminées
 */
async function marquerSelectionCommeTerminee() {
    if (!window.tachesSelectionnees?.length) return;
    
    const maintenant = new Date();
    const batchMode = utilisateurConnecte && utilisateurConnecte.id;
    let batch = null;
    let db = null;
    
    if (batchMode) {
        db = firebase.firestore();
        batch = db.batch();
    }
    
    window.tachesSelectionnees.forEach(id => {
        if (taches[id]) {
            taches[id].statut = 'terminee';
            taches[id].completee = true;
            taches[id].dateModification = maintenant;
            
            // Ajouter au batch Firebase si disponible
            if (batchMode && taches[id].firestoreId) {
                const ref = db.collection('tasks').doc(taches[id].firestoreId);
                batch.update(ref, { 
                    statut: 'terminee',
                    completee: true,
                    dateModification: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        }
    });
    
    // Exécuter le batch Firebase
    if (batchMode && batch) {
        try {
            await batch.commit();
            console.log(`✅ ${window.tachesSelectionnees.length} tâches marquées terminées dans Firebase`);
        } catch (error) {
            console.error('Erreur batch Firebase:', error);
        }
    }
    
    // Sauvegarde locale
    sauvegarderTachesLocalement();
    
    afficherNotification(`${window.tachesSelectionnees.length} tâche(s) marquée(s) comme terminée(s)`, 'succes');
    
    window.tachesSelectionnees = [];
    const selectAll = document.getElementById('selectionToutes');
    if (selectAll) selectAll.checked = false;
    mettreAJourSelection();
    
    // Mettre à jour l'affichage
    mettreAJourAffichageTaches();
    mettreAJourStatistiques();
    
    // Émettre événement
    document.dispatchEvent(new CustomEvent('tachesModifiees', { 
        detail: { taches: Object.values(taches) } 
    }));
}

/**
 * Supprime les tâches sélectionnées
 */
async function supprimerSelection() {
    if (!window.tachesSelectionnees?.length) return;
    
    const batchMode = utilisateurConnecte && utilisateurConnecte.id;
    let batch = null;
    let db = null;
    
    if (batchMode) {
        db = firebase.firestore();
        batch = db.batch();
    }
    
    window.tachesSelectionnees.forEach(id => {
        // Ajouter au batch Firebase si disponible
        if (batchMode && taches[id] && taches[id].firestoreId) {
            const ref = db.collection('tasks').doc(taches[id].firestoreId);
            batch.delete(ref);
        }
        
        // Supprimer localement
        delete taches[id];
    });
    
    // Exécuter le batch Firebase
    if (batchMode && batch) {
        try {
            await batch.commit();
            console.log(`✅ ${window.tachesSelectionnees.length} tâches supprimées de Firebase`);
        } catch (error) {
            console.error('Erreur batch Firebase:', error);
        }
    }
    
    // Sauvegarde locale
    sauvegarderTachesLocalement();
    
    afficherNotification(`${window.tachesSelectionnees.length} tâche(s) supprimée(s)`, 'succes');
    
    window.tachesSelectionnees = [];
    const selectAll = document.getElementById('selectionToutes');
    if (selectAll) selectAll.checked = false;
    mettreAJourSelection();
    
    // Mettre à jour l'affichage
    mettreAJourAffichageTaches();
    mettreAJourStatistiques();
    
    // Émettre événement
    document.dispatchEvent(new CustomEvent('tachesModifiees', { 
        detail: { taches: Object.values(taches) } 
    }));
}

// ============================================
// FILTRES ET RECHERCHE
// ============================================

/**
 * Applique un filtre rapide
 */
function appliquerFiltreRapide(filtre) {
    const selectStatut = document.getElementById('filtreStatut');
    const selectPriorite = document.getElementById('filtrePriorite');
    const selectProjet = document.getElementById('filtreProjet');
    const selectEcheance = document.getElementById('filtreEcheance');
    
    switch (filtre) {
        case 'tous':
            if (selectStatut) selectStatut.value = 'tous';
            if (selectPriorite) selectPriorite.value = 'toutes';
            if (selectProjet) selectProjet.value = 'tous';
            if (selectEcheance) selectEcheance.value = 'toutes';
            window.termeRecherche = '';
            document.querySelector('.champ-recherche').value = '';
            break;
            
        case 'today':
            if (selectEcheance) selectEcheance.value = 'aujourdhui';
            break;
            
        case 'week':
            if (selectEcheance) selectEcheance.value = 'semaine';
            break;
            
        case 'overdue':
            if (selectStatut) selectStatut.value = 'tous';
            if (selectEcheance) selectEcheance.value = 'retard';
            break;
    }
    
    mettreAJourAffichageTaches();
}

/**
 * Recherche des tâches
 */
function rechercherTaches(terme) {
    window.termeRecherche = terme;
    mettreAJourAffichageTaches();
}

// ============================================
// GESTION DE LA VUE
// ============================================

/**
 * Change la vue (tableau/grille)
 */
function changerVue(vue) {
    const vueTableau = document.querySelector('.vue-tableau-taches');
    const vueGrille = document.querySelector('.vue-grille-taches');
    
    if (vueTableau && vueGrille) {
        if (vue === 'tableau') {
            vueTableau.style.display = 'block';
            vueGrille.style.display = 'none';
        } else {
            vueTableau.style.display = 'none';
            vueGrille.style.display = 'block';
        }
    }
    
    localStorage.setItem('tgnova_vue_taches', vue);
}

// ============================================
// EXPORTATION
// ============================================

/**
 * Exporte les tâches
 */
function exporterTaches(format = 'json') {
    const tachesArray = Object.values(taches);
    
    if (tachesArray.length === 0) {
        afficherNotification('Aucune tâche à exporter', 'info');
        return;
    }
    
    const date = new Date().toISOString().split('T')[0];
    let contenu, nomFichier, type;
    
    if (format === 'json') {
        const exportData = {
            metadata: {
                date: new Date().toISOString(),
                utilisateur: utilisateurConnecte?.nom || 'Utilisateur',
                total: tachesArray.length
            },
            taches: tachesArray.map(t => ({
                titre: t.titre,
                description: t.description,
                projet: t.projet,
                priorite: t.priorite,
                statut: t.statut,
                echeance: t.echeance,
                assigne: t.assigne,
                dateCreation: t.dateCreation,
                dateModification: t.dateModification
            }))
        };
        
        contenu = JSON.stringify(exportData, null, 2);
        nomFichier = `taches_${date}.json`;
        type = 'application/json';
        
    } else {
        const enTete = ['Titre', 'Description', 'Projet', 'Priorité', 'Statut', 'Échéance', 'Assigné'];
        const lignes = tachesArray.map(t => [
            `"${(t.titre || '').replace(/"/g, '""')}"`,
            `"${(t.description || '').replace(/"/g, '""')}"`,
            `"${t.projet || ''}"`,
            obtenirLibellePriorite(t.priorite),
            obtenirLibelleStatut(t.statut),
            t.echeance ? new Date(t.echeance).toLocaleDateString('fr-FR') : '',
            `"${t.assigne || ''}"`
        ]);
        
        contenu = [enTete.join(','), ...lignes.map(l => l.join(','))].join('\n');
        nomFichier = `taches_${date}.csv`;
        type = 'text/csv';
    }
    
    const blob = new Blob([contenu], { type });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement('a');
    lien.href = url;
    lien.download = nomFichier;
    lien.click();
    URL.revokeObjectURL(url);
    
    afficherNotification(`Export ${format.toUpperCase()} généré`, 'succes');
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Échappe le HTML pour éviter les injections XSS
 */
function echapperHTML(texte) {
    if (!texte) return '';
    const div = document.createElement('div');
    div.textContent = texte;
    return div.innerHTML;
}

/**
 * Obtient le libellé d'une priorité
 */
function obtenirLibellePriorite(priorite) {
    const libelles = {
        'haute': 'Haute',
        'moyenne': 'Moyenne',
        'basse': 'Basse'
    };
    return libelles[priorite] || priorite || 'Moyenne';
}

/**
 * Obtient le libellé d'un statut
 */
function obtenirLibelleStatut(statut) {
    const libelles = {
        'a-faire': 'À faire',
        'en-cours': 'En cours',
        'terminee': 'Terminée'
    };
    return libelles[statut] || statut || 'À faire';
}

/**
 * Formate une échéance
 */
function formaterEcheance(echeance) {
    if (!echeance) return 'Non définie';
    
    try {
        const date = new Date(echeance);
        if (isNaN(date.getTime())) return 'Non définie';
        
        const aujourdhui = new Date();
        aujourdhui.setHours(0, 0, 0, 0);
        
        const dateCompare = new Date(date);
        dateCompare.setHours(0, 0, 0, 0);
        
        const diffJours = Math.round((dateCompare - aujourdhui) / (1000 * 60 * 60 * 24));
        
        if (diffJours === 0) return "Aujourd'hui";
        if (diffJours === 1) return 'Demain';
        if (diffJours === -1) return 'Hier';
        if (diffJours < 0) return `En retard (${Math.abs(diffJours)}j)`;
        if (diffJours < 7) return `Dans ${diffJours}j`;
        
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short'
        });
    } catch (error) {
        return 'Non définie';
    }
}

/**
 * Formate une date au format complet
 */
function formaterDateComplet(date) {
    if (!date) return 'Non définie';
    
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return 'Non définie';
        
        return d.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return 'Non définie';
    }
}

/**
 * Affiche une notification
 */
function afficherNotification(message, type = 'info') {
    console.log(`[${type}] ${message}`);
    
    // Utiliser la fonction du dashboard si disponible
    if (window.TGNOVA && window.TGNOVA.afficherToast) {
        window.TGNOVA.afficherToast(message, type);
        return;
    }
    
    // Créer un toast container si nécessaire
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icones = {
        succes: 'check-circle',
        erreur: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    
    toast.style.cssText = `
        background: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 300px;
        animation: slideIn 0.3s ease;
        border-left: 4px solid ${type === 'succes' ? '#10b981' : type === 'erreur' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
    `;
    
    toast.innerHTML = `
        <i class="fas fa-${icones[type] || 'info-circle'}" style="color: ${type === 'succes' ? '#10b981' : type === 'erreur' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};"></i>
        <span style="flex: 1; color: #1f2937;">${message}</span>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; color: #9ca3af; cursor: pointer; padding: 4px;">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// Ajouter les animations CSS
const styleAnimations = document.createElement('style');
styleAnimations.textContent = `
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
`;
document.head.appendChild(styleAnimations);

// ============================================
// EXPOSITION DES FONCTIONS GLOBALES
// ============================================

window.TGNOVA_TACHES = {
    initialiser: initialiserTachesFirebase,
    ouvrirModalTache,
    fermerModalTache,
    sauvegarderTache,
    afficherDetailsTache,
    fermerDetailsTache,
    confirmerSuppressionTache,
    supprimerTache,
    marquerSelectionCommeTerminee,
    supprimerSelection,
    exporterTaches,
    changerVue,
    mettreAJourAffichageTaches,
    sauvegarderTachesLocalement,
    chargerTachesDepuisLocal
};

// Exposition globale pour les événements onclick
window.ouvrirModalTache = ouvrirModalTache;
window.fermerModalTache = fermerModalTache;
window.sauvegarderTache = sauvegarderTache;
window.afficherDetailsTache = afficherDetailsTache;
window.fermerDetailsTache = fermerDetailsTache;
window.confirmerSuppressionTache = confirmerSuppressionTache;
window.supprimerTacheConfirmee = supprimerTacheConfirmee;
window.marquerSelectionCommeTerminee = marquerSelectionCommeTerminee;
window.supprimerSelection = supprimerSelection;
window.exporterTaches = exporterTaches;
window.changerVue = changerVue;

// Initialiser les variables globales
window.tachesSelectionnees = [];
window.termeRecherche = '';

// Initialisation automatique
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialiserTachesFirebase);
} else {
    initialiserTachesFirebase();
}

console.log('🚀 Système de tâches Firebase initialisé');