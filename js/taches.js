// ============================================
// GESTION DES TÂCHES - TGNOVA (VERSION AMÉLIORÉE)
// ============================================

/**
 * État global de l'application
 */
const AppState = {
    taches: [],
    modeEdition: null,
    filtreRecherche: '',
    filtres: {
        statut: "tous",
        priorite: "toutes",
        projet: "tous",
        echeance: "toutes"
    },
    vue: "tableau", // Valeur par défaut
    suppressionEnCours: null,
    filtresVisibles: false,
    pageCourante: 1,
    elementsParPage: 10,
    quickFilters: {
        tous: true,
        today: false,
        week: false,
        overdue: false,
        mine: false
    },
    evenements: []
};

/**
 * Initialisation au chargement de la page
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initialisation de TGNOVA Tâches');
    
    // Charger les préférences depuis localStorage
    chargerPreferencesDepuisLocalStorage();
    
    // Charger les tâches depuis localStorage
    chargerDepuisLocalStorage();
    chargerEvenements();
    
    // Initialiser tous les composants
    initialiserComposants();
    
    // Afficher l'état initial
    afficherTaches();
    mettreAJourStatistiques();
    
    console.log('✅ Application prête - Mode vue:', AppState.vue);
});

/**
 * Initialise tous les composants de l'interface
 */
function initialiserComposants() {
    // 1. Bouton "Nouvelle tâche"
    const btnNouvelleTache = document.getElementById('boutonNouvelleTache');
    if (btnNouvelleTache) {
        btnNouvelleTache.onclick = () => ouvrirModal();
    }
    
    // 2. Bouton "Filtres"
    const btnFiltres = document.querySelector('.bouton-action-secondaire');
    if (btnFiltres) {
        btnFiltres.onclick = basculerFiltres;
        // Masquer les filtres par défaut
        const filtresSection = document.querySelector('.filtres-taches');
        if (filtresSection) {
            filtresSection.style.display = 'none';
        }
    }
    
    // 3. Sélecteur de vue (tableau/grille) - AMÉLIORÉ : Chargement du mode sauvegardé
    const selecteurVue = document.getElementById('selecteurVue');
    if (selecteurVue) {
        // Définir la valeur sauvegardée ou par défaut
        selecteurVue.value = AppState.vue;
        
        selecteurVue.onchange = (e) => {
            const nouvelleVue = e.target.value;
            AppState.vue = nouvelleVue;
            
            // Sauvegarder la préférence
            sauvegarderPreferenceVue(nouvelleVue);
            
            // Actualiser l'affichage
            afficherTaches();
            
            console.log('🔄 Mode vue changé:', nouvelleVue);
        };
    }
    
    // 4. Champ de recherche
    const champRecherche = document.querySelector('.champ-recherche');
    if (champRecherche) {
        champRecherche.oninput = (e) => {
            AppState.filtreRecherche = e.target.value.toLowerCase().trim();
            AppState.pageCourante = 1; // Réinitialiser la pagination
            afficherTaches();
        };
    }
    
    // 5. Filtres avancés
    initialiserFiltresAvances();
    
    // 6. Quick Filters
    initialiserQuickFilters();
    
    // 7. Modal de création/édition
    initialiserModal();
    
    // 8. Modal de confirmation
    initialiserModalConfirmation();
    
    // 9. Gestion des clics sur les actions
    document.addEventListener('click', gererClicsActions);
    
    // 10. Sélection multiple
    initialiserSelectionMultiple();
    
    // 11. Pagination
    initialiserPagination();
    
    // 12. Écouter les événements du dashboard
    initialiserCommunicationDashboard();
    
    // 13. Écouter les changements de page pour restaurer la vue
    window.addEventListener('pageshow', function() {
        // S'assurer que la vue est correcte après navigation
        restaurerVueSauvegardee();
    });
}

/**
 * Restaure la vue sauvegardée
 */
function restaurerVueSauvegardee() {
    const selecteurVue = document.getElementById('selecteurVue');
    if (selecteurVue && selecteurVue.value !== AppState.vue) {
        selecteurVue.value = AppState.vue;
        console.log('🔄 Vue restaurée:', AppState.vue);
    }
}

/**
 * Initialise la communication avec le dashboard
 */
function initialiserCommunicationDashboard() {
    // Écouter les événements du dashboard
    window.addEventListener('tachesModifiees', (e) => {
        if (e.detail.taches) {
            AppState.taches = e.detail.taches;
            afficherTaches();
            mettreAJourStatistiques();
        }
    });
    
    window.addEventListener('nouvelleTacheAjoutee', (e) => {
        if (e.detail.tache) {
            AppState.taches.unshift(e.detail.tache);
            sauvegarderDansLocalStorage();
            afficherTaches();
            mettreAJourStatistiques();
        }
    });
}

/**
 * Initialise les filtres avancés
 */
function initialiserFiltresAvances() {
    const selecteurs = {
        'filtreStatut': 'statut',
        'filtrePriorite': 'priorite',
        'filtreProjet': 'projet',
        'filtreEcheance': 'echeance'
    };
    
    Object.entries(selecteurs).forEach(([id, type]) => {
        const selecteur = document.getElementById(id);
        if (selecteur) {
            selecteur.onchange = (e) => {
                AppState.filtres[type] = e.target.value;
                AppState.pageCourante = 1;
                afficherTaches();
            };
        }
    });
}

/**
 * Initialise les quick filters
 */
function initialiserQuickFilters() {
    const quickFilters = document.querySelectorAll('.quick-filter');
    
    quickFilters.forEach(filter => {
        filter.onclick = function() {
            const filtre = this.dataset.filtre;
            
            // Désactiver tous les filtres
            Object.keys(AppState.quickFilters).forEach(key => {
                AppState.quickFilters[key] = false;
            });
            
            // Activer le filtre sélectionné
            AppState.quickFilters[filtre] = true;
            
            // Mettre à jour l'interface
            quickFilters.forEach(f => f.classList.remove('active'));
            this.classList.add('active');
            
            // Réinitialiser les autres filtres
            AppState.filtres = {
                statut: "tous",
                priorite: "toutes",
                projet: "tous",
                echeance: "toutes"
            };
            
            // Réinitialiser les sélecteurs de filtres
            document.querySelectorAll('.selecteur-filtre').forEach(selecteur => {
                selecteur.value = 'tous';
                if (selecteur.id === 'filtrePriorite') selecteur.value = 'toutes';
                if (selecteur.id === 'filtreEcheance') selecteur.value = 'toutes';
            });
            
            AppState.filtreRecherche = '';
            const champRecherche = document.querySelector('.champ-recherche');
            if (champRecherche) champRecherche.value = '';
            
            AppState.pageCourante = 1;
            
            // Appliquer le filtre
            afficherTaches();
        };
    });
}

/**
 * Initialise la sélection multiple
 */
function initialiserSelectionMultiple() {
    // Case "sélectionner tout"
    const selectionToutes = document.getElementById('selectionToutes');
    if (selectionToutes) {
        selectionToutes.onchange = function(e) {
            const estCoche = e.target.checked;
            const cases = document.querySelectorAll('.case-selection-tache:not(#selectionToutes)');
            
            cases.forEach(caseCoche => {
                caseCoche.checked = estCoche;
            });
            
            mettreAJourActionsGroupees();
        };
    }
    
    // Délégation d'événements pour les cases individuelles
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('case-selection-tache') && e.target.id !== 'selectionToutes') {
            mettreAJourActionsGroupees();
        }
    });
}

/**
 * Met à jour les actions groupées
 */
function mettreAJourActionsGroupees() {
    const casesSelectionnees = document.querySelectorAll('.case-selection-tache:not(#selectionToutes):checked');
    const bulkActions = document.querySelector('.bulk-actions');
    const bulkCount = document.querySelector('.bulk-count');
    
    if (bulkActions && bulkCount) {
        const count = casesSelectionnees.length;
        bulkCount.textContent = `${count} tâche${count > 1 ? 's' : ''} sélectionnée${count > 1 ? 's' : ''}`;
        
        if (count > 0) {
            bulkActions.classList.add('visible');
            bulkActions.style.display = 'flex';
        } else {
            bulkActions.classList.remove('visible');
            bulkActions.style.display = 'none';
        }
    }
}

/**
 * Marque les tâches sélectionnées comme terminées
 */
window.marquerSelectionCommeTerminee = function() {
    const casesSelectionnees = document.querySelectorAll('.case-selection-tache:not(#selectionToutes):checked');
    let count = 0;
    
    casesSelectionnees.forEach(caseCoche => {
        const id = obtenirIdTacheDepuisCase(caseCoche);
        if (id) {
            const tache = AppState.taches.find(t => t.id === id);
            if (tache && tache.statut !== 'terminee') {
                tache.statut = 'terminee';
                tache.dateModification = new Date().toISOString();
                count++;
            }
        }
    });
    
    if (count > 0) {
        sauvegarderDansLocalStorage();
        afficherTaches();
        mettreAJourStatistiques();
        synchroniserAvecDashboard();
        afficherNotification(`${count} tâche${count > 1 ? 's' : ''} marquée${count > 1 ? 's' : ''} comme terminée${count > 1 ? 's' : ''}`, 'success');
    }
    
    // Désélectionner tout
    const selectionToutes = document.getElementById('selectionToutes');
    if (selectionToutes) selectionToutes.checked = false;
    mettreAJourActionsGroupees();
};

/**
 * Supprime les tâches sélectionnées
 */
window.supprimerSelection = function() {
    const casesSelectionnees = document.querySelectorAll('.case-selection-tache:not(#selectionToutes):checked');
    
    if (casesSelectionnees.length === 0) return;
    
    modalUtils.demanderConfirmation(
        'Suppression de tâches',
        `Êtes-vous sûr de vouloir supprimer ${casesSelectionnees.length} tâche${casesSelectionnees.length > 1 ? 's' : ''} ?`,
        () => {
            const idsASupprimer = [];

            casesSelectionnees.forEach(caseCoche => {
                const id = obtenirIdTacheDepuisCase(caseCoche);
                if (id) idsASupprimer.push(id);
            });

            // Supprimer les tâches
            AppState.taches = AppState.taches.filter(t => !idsASupprimer.includes(t.id));
            sauvegarderDansLocalStorage();
            afficherTaches();
            mettreAJourStatistiques();
            synchroniserAvecDashboard();
            afficherNotification(`${idsASupprimer.length} tâche${idsASupprimer.length > 1 ? 's' : ''} supprimée${idsASupprimer.length > 1 ? 's' : ''}`, 'success');
        }
    );

    AppState.taches = AppState.taches.filter(t => !idsASupprimer.includes(t.id));
    
    sauvegarderDansLocalStorage();
    afficherTaches();
    mettreAJourStatistiques();
    synchroniserAvecDashboard();
    afficherNotification(`${idsASupprimer.length} tâche${idsASupprimer.length > 1 ? 's' : ''} supprimée${idsASupprimer.length > 1 ? 's' : ''}`, 'success');
    
    // Réinitialiser la sélection
    const selectionToutes = document.getElementById('selectionToutes');
    if (selectionToutes) selectionToutes.checked = false;
    mettreAJourActionsGroupees();
};

/**
 * Exporte les tâches sélectionnées
 */
window.exporterTaches = function() {
    const casesSelectionnees = document.querySelectorAll('.case-selection-tache:not(#selectionToutes):checked');
    
    if (casesSelectionnees.length === 0) {
        afficherNotification('Aucune tâche sélectionnée', 'error');
        return;
    }
    
    const tachesAExporter = [];
    casesSelectionnees.forEach(caseCoche => {
        const id = obtenirIdTacheDepuisCase(caseCoche);
        if (id) {
            const tache = AppState.taches.find(t => t.id === id);
            if (tache) tachesAExporter.push(tache);
        }
    });
    
    // Créer un fichier JSON
    const dataStr = JSON.stringify(tachesAExporter, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    // Télécharger
    const link = document.createElement('a');
    link.href = url;
    link.download = `taches_tgnova_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    afficherNotification(`${tachesAExporter.length} tâche${tachesAExporter.length > 1 ? 's' : ''} exportée${tachesAExporter.length > 1 ? 's' : ''}`, 'success');
};

/**
 * Obtient l'ID d'une tâche depuis une case à cocher
 */
function obtenirIdTacheDepuisCase(caseCoche) {
    const row = caseCoche.closest('tr');
    const card = caseCoche.closest('.carte-tache');
    
    if (row && row.dataset && row.dataset.id) {
        return parseInt(row.dataset.id);
    }
    if (card && card.dataset && card.dataset.id) {
        return parseInt(card.dataset.id);
    }
    return null;
}

/**
 * Initialise la pagination
 */
function initialiserPagination() {
    // Les contrôles de pagination sont ajoutés dynamiquement
}

/**
 * Bascule l'affichage des filtres
 */
function basculerFiltres() {
    const filtresSection = document.querySelector('.filtres-taches');
    if (filtresSection) {
        AppState.filtresVisibles = !AppState.filtresVisibles;
        filtresSection.style.display = AppState.filtresVisibles ? 'flex' : 'none';
    }
}

/**
 * Initialise le modal de création/édition
 * AMÉLIORATION : Style direct pour centrage immédiat
 */
function initialiserModal() {
    const modal = document.getElementById('modalTache');
    if (!modal) return;
    
    // Appliquer le style de centrage immédiat
    modal.style.cssText = `
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        justify-content: center;
        align-items: center;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    
    const modalContent = modal.querySelector('.modal');
    if (modalContent) {
        modalContent.style.cssText = `
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            width: 90%;
            max-width: 500px;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
            transform: none !important;
            animation: modalFadeIn 0.3s ease;
        `;
    }
    
    // Bouton fermer
    const btnFermer = modal.querySelector('#fermerModalTache');
    if (btnFermer) {
        btnFermer.onclick = fermerModal;
    }
    
    // Bouton annuler
    const btnAnnuler = modal.querySelector('#annulerModalTache');
    if (btnAnnuler) {
        btnAnnuler.onclick = fermerModal;
    }
    
    // Bouton sauvegarder
    const btnSauvegarder = modal.querySelector('#sauvegarderTache');
    if (btnSauvegarder) {
        btnSauvegarder.onclick = sauvegarderTache;
    }
    
    // Fermer en cliquant à l'extérieur
    modal.onclick = (e) => {
        if (e.target === modal) {
            fermerModal();
        }
    };
    
    // Fermer avec la touche Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            fermerModal();
        }
    });
}

/**
 * Initialise le modal de confirmation
 * AMÉLIORATION : Style direct pour centrage immédiat
 */
function initialiserModalConfirmation() {
    const modal = document.getElementById('modalConfirmation');
    if (!modal) return;
    
    // Appliquer le style de centrage immédiat
    modal.style.cssText = `
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 1001;
        justify-content: center;
        align-items: center;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    
    const modalContent = modal.querySelector('.modal');
    if (modalContent) {
        modalContent.style.cssText = `
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            width: 90%;
            max-width: 400px;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
            transform: none !important;
            animation: modalFadeIn 0.3s ease;
        `;
    }
    
    // Bouton fermer
    const btnFermer = modal.querySelector('#fermerModalConfirmation');
    if (btnFermer) {
        btnFermer.onclick = fermerModalConfirmation;
    }
    
    // Bouton annuler
    const btnAnnuler = modal.querySelector('#annulerSuppression');
    if (btnAnnuler) {
        btnAnnuler.onclick = fermerModalConfirmation;
    }
    
    // Bouton confirmer
    const btnConfirmer = modal.querySelector('#confirmerSuppression');
    if (btnConfirmer) {
        btnConfirmer.onclick = confirmerSuppression;
    }
    
    // Fermer en cliquant à l'extérieur
    modal.onclick = (e) => {
        if (e.target === modal) {
            fermerModalConfirmation();
        }
    };
    
    // Fermer avec la touche Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            fermerModalConfirmation();
        }
    });
}

/**
 * Gère tous les clics sur les actions (éditer, supprimer)
 * AMÉLIORATION : Meilleure détection des boutons de suppression
 */
function gererClicsActions(e) {
    const target = e.target;
    
    // Éditer une tâche
    if (target.closest('.bouton-action-tache.editer') || 
        (target.classList.contains('fa-edit') && target.closest('button'))) {
        let bouton = target.closest('.bouton-action-tache.editer');
        if (!bouton) {
            bouton = target.closest('button');
        }
        const id = obtenirIdTache(bouton);
        if (id) {
            editerTache(id);
        }
        e.stopPropagation();
        e.preventDefault();
        return;
    }
    
    // Supprimer une tâche (AMÉLIORÉ : Détection plus robuste)
    if (target.closest('.bouton-action-tache.supprimer') || 
        (target.classList.contains('fa-trash') && target.closest('button'))) {
        let bouton = target.closest('.bouton-action-tache.supprimer');
        if (!bouton) {
            bouton = target.closest('button');
        }
        const id = obtenirIdTache(bouton);
        if (id) {
            demanderSuppression(id);
        }
        e.stopPropagation();
        e.preventDefault();
        return;
    }
}

/**
 * Obtient l'ID d'une tâche depuis un bouton d'action
 */
function obtenirIdTache(element) {
    // Essayer plusieurs méthodes pour trouver l'ID
    let id = null;
    
    // 1. Chercher dans l'élément lui-même
    if (element && element.dataset && element.dataset.taskId) {
        id = parseInt(element.dataset.taskId);
    }
    
    // 2. Chercher dans les parents
    if (!id && element.closest) {
        // Chercher un élément avec data-id
        const parentWithId = element.closest('[data-id]');
        if (parentWithId && parentWithId.dataset && parentWithId.dataset.id) {
            id = parseInt(parentWithId.dataset.id);
        }
    }
    
    // 3. Chercher spécifiquement dans les éléments de tâche
    if (!id) {
        const row = element.closest('tr[data-id]');
        if (row && row.dataset && row.dataset.id) {
            id = parseInt(row.dataset.id);
        } else {
            const card = element.closest('.carte-tache[data-id]');
            if (card && card.dataset && card.dataset.id) {
                id = parseInt(card.dataset.id);
            }
        }
    }
    
    return id;
}

/**
 * Ouvre le modal pour créer ou éditer une tâche
 * AMÉLIORATION : Affichage direct au centre
 */
function ouvrirModal(tache = null) {
    const modal = document.getElementById('modalTache');
    if (!modal) {
        console.error('Modal de tâche non trouvé');
        return;
    }
    
    const titreModal = modal.querySelector('#modalTitre');
    const form = document.getElementById('formTache');
    
    // Réinitialiser le formulaire
    if (form) {
        form.reset();
        
        // Réinitialiser les sélecteurs
        const selects = form.querySelectorAll('select');
        selects.forEach(select => {
            if (select.id === 'statutTache') select.value = 'a-faire';
            if (select.id === 'prioriteTache') select.value = 'moyenne';
        });
        
        // Populate project select from global projets
        const selectProjet = document.getElementById('projetTache');
        if (selectProjet && window.projets) {
            selectProjet.innerHTML = '<option value="">Sélectionner un projet</option>';
            Object.values(window.projets).forEach(projet => {
                const option = document.createElement('option');
                option.value = projet.id;
                option.textContent = projet.nom;
                selectProjet.appendChild(option);
            });
            // Attach change listener if not already attached
            if (!selectProjet.hasAttribute('data-listener-attached')) {
                selectProjet.addEventListener('change', () => {
                    if (typeof mettreAJourAssignationSelonProjet === 'function') {
                        mettreAJourAssignationSelonProjet(selectProjet.value);
                    }
                });
                selectProjet.setAttribute('data-listener-attached', 'true');
            }
        }
        
        // Set assignation to initial disabled state
        const selectAssignation = document.getElementById('assignationTache');
        if (selectAssignation) {
            selectAssignation.innerHTML = '<option value="">Sélectionnez un projet d\'abord</option>';
            selectAssignation.disabled = true;
            selectAssignation.value = '';
        }
    }
    
    if (tache) {
        // Mode édition
        AppState.modeEdition = tache.id;
        if (titreModal) titreModal.textContent = 'Modifier la tâche';
        
        // Pré-remplir les champs
        const champs = {
            'titreTache': tache.titre,
            'descriptionTache': tache.description,
            'projetTache': tache.projet,
            'prioriteTache': tache.priorite,
            'statutTache': tache.statut,
            'echeanceTache': tache.echeance ? tache.echeance.substring(0, 10) : '',
            'assignationTache': tache.assigne || 'John Doe'
        };
        
        Object.entries(champs).forEach(([id, valeur]) => {
            const champ = document.getElementById(id);
            if (champ) champ.value = valeur || '';
        });
        
        // If project is set, update assignation
        if (tache.projet && typeof mettreAJourAssignationSelonProjet === 'function') {
            mettreAJourAssignationSelonProjet(tache.projet);
        }
    } else {
        // Mode création
        AppState.modeEdition = null;
        if (titreModal) titreModal.textContent = 'Nouvelle tâche';
        
        // Date par défaut : aujourd'hui
        const echeanceInput = document.getElementById('echeanceTache');
        if (echeanceInput) {
            const aujourdhui = new Date();
            const dateStr = aujourdhui.toISOString().split('T')[0];
            echeanceInput.value = dateStr;
        }
        
        // Populate project select from global projets
        const selectProjet = document.getElementById('projetTache');
        if (selectProjet && window.projets) {
            selectProjet.innerHTML = '<option value="">Sélectionner un projet</option>';
            Object.values(window.projets).forEach(projet => {
                const option = document.createElement('option');
                option.value = projet.id;
                option.textContent = projet.nom;
                selectProjet.appendChild(option);
            });
            // Attach change listener if not already attached
            if (!selectProjet.hasAttribute('data-listener-attached')) {
                selectProjet.addEventListener('change', () => {
                    if (typeof mettreAJourAssignationSelonProjet === 'function') {
                        mettreAJourAssignationSelonProjet(selectProjet.value);
                    }
                });
                selectProjet.setAttribute('data-listener-attached', 'true');
            }
        }
        
        // Set assignation to initial disabled state
        const selectAssignation = document.getElementById('assignationTache');
        if (selectAssignation) {
            selectAssignation.innerHTML = '<option value="">Sélectionnez un projet d\'abord</option>';
            selectAssignation.disabled = true;
            selectAssignation.value = '';
        }
    }
    
    // Afficher le modal (apparaît directement au centre)
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.style.opacity = '1';
        modal.classList.add('visible');
    }, 10);
    document.body.style.overflow = 'hidden';
    
    // Focus sur le titre
    setTimeout(() => {
        const titreInput = document.getElementById('titreTache');
        if (titreInput) titreInput.focus();
    }, 100);
}

/**
 * Ferme le modal
 */
function fermerModal() {
    const modal = document.getElementById('modalTache');
    if (modal) {
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.remove('visible');
            document.body.style.overflow = '';
            AppState.modeEdition = null;
        }, 300);
    }
}

/**
 * Sauvegarde une tâche (création ou modification)
 */
function sauvegarderTache() {
    // Récupérer les valeurs du formulaire
    const titre = document.getElementById('titreTache').value.trim();
    const description = document.getElementById('descriptionTache').value.trim();
    const projet = document.getElementById('projetTache').value || 'Général';
    const priorite = document.getElementById('prioriteTache').value;
    const statut = document.getElementById('statutTache').value;
    const echeance = document.getElementById('echeanceTache').value;
    const assigne = document.getElementById('assignationTache').value.trim() || 'John Doe';
    
    // Validation
    if (!titre) {
        afficherNotification('Le titre de la tâche est obligatoire', 'error');
        document.getElementById('titreTache').focus();
        return;
    }
    
    let notificationMessage = '';
    
    if (AppState.modeEdition) {
        // Mode édition : modifier la tâche existante
        const index = AppState.taches.findIndex(t => t.id === AppState.modeEdition);
        if (index !== -1) {
            AppState.taches[index] = {
                ...AppState.taches[index],
                titre,
                description,
                projet,
                priorite,
                statut,
                echeance: echeance || null,
                assigne,
                dateModification: new Date().toISOString()
            };
            notificationMessage = 'Tâche modifiée avec succès';
        }
    } else {
        // Mode création : créer une nouvelle tâche
        const nouvelleTache = {
            id: genererNouvelId(),
            titre,
            description,
            projet,
            priorite,
            statut,
            echeance: echeance || null,
            assigne,
            dateCreation: new Date().toISOString(),
            dateModification: new Date().toISOString()
        };
        
        AppState.taches.unshift(nouvelleTache); // Ajouter au début
        notificationMessage = 'Tâche créée avec succès';
        
        // Ajouter une notification pour la nouvelle tâche
        ajouterNotificationNouvelleTache(nouvelleTache);
    }
    
    // Sauvegarder, fermer et actualiser
    sauvegarderDansLocalStorage();
    synchroniserAvecDashboard();
    fermerModal();
    afficherTaches();
    mettreAJourStatistiques();
    afficherNotification(notificationMessage, 'success');
}

/**
 * Ajoute une notification pour une nouvelle tâche
 */
function ajouterNotificationNouvelleTache(tache) {
    const notifications = JSON.parse(localStorage.getItem('tgnova_notifications') || '[]');
    
    const nouvelleNotification = {
        id: Date.now(),
        message: `Nouvelle tâche créée : "${tache.titre}"`,
        time: 'À l\'instant',
        read: false,
        icon: 'tasks'
    };
    
    notifications.unshift(nouvelleNotification);
    localStorage.setItem('tgnova_notifications', JSON.stringify(notifications));
}

/**
 * Édite une tâche existante
 */
function editerTache(id) {
    const tache = AppState.taches.find(t => t.id === id);
    if (tache) {
        ouvrirModal(tache);
    } else {
        console.error('Tâche non trouvée pour édition:', id);
        afficherNotification('Tâche non trouvée', 'error');
    }
}

/**
 * Demande confirmation avant suppression
 */
function demanderSuppression(id) {
    const tache = AppState.taches.find(t => t.id === id);
    if (!tache) {
        console.error('Tâche non trouvée pour suppression:', id);
        afficherNotification('Tâche non trouvée', 'error');
        return;
    }
    
    AppState.suppressionEnCours = id;
    
    const modal = document.getElementById('modalConfirmation');
    if (!modal) {
        console.error('Modal de confirmation non trouvé');
        modalUtils.demanderConfirmation(
            'Confirmation de suppression',
            `Êtes-vous sûr de vouloir supprimer la tâche "${tache.titre}" ?`,
            () => supprimerTacheDirectement(id)
        );
        return;
    }
    
    const message = modal.querySelector('#messageConfirmation');
    if (message) {
        message.textContent = `Êtes-vous sûr de vouloir supprimer la tâche "${tache.titre}" ?`;
    }
    
    // Afficher le modal (apparaît directement au centre)
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.style.opacity = '1';
        modal.classList.add('visible');
    }, 10);
    document.body.style.overflow = 'hidden';
}

/**
 * Ferme le modal de confirmation
 */
function fermerModalConfirmation() {
    const modal = document.getElementById('modalConfirmation');
    if (modal) {
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.remove('visible');
            document.body.style.overflow = '';
            AppState.suppressionEnCours = null;
        }, 300);
    }
}

/**
 * Confirme et exécute la suppression
 */
function confirmerSuppression() {
    if (!AppState.suppressionEnCours) {
        console.warn('Aucune suppression en cours');
        return;
    }
    
    const index = AppState.taches.findIndex(t => t.id === AppState.suppressionEnCours);
    if (index === -1) {
        afficherNotification('Tâche non trouvée', 'error');
        fermerModalConfirmation();
        return;
    }
    
    const tache = AppState.taches[index];
    AppState.taches.splice(index, 1);
    
    afficherNotification(`Tâche "${tache.titre}" supprimée avec succès`, 'success');
    
    sauvegarderDansLocalStorage();
    synchroniserAvecDashboard();
    fermerModalConfirmation();
    afficherTaches();
    mettreAJourStatistiques();
    
    // Réinitialiser la sélection multiple
    const selectionToutes = document.getElementById('selectionToutes');
    if (selectionToutes) selectionToutes.checked = false;
    mettreAJourActionsGroupees();
}

/**
 * Fonction de suppression directe (fallback)
 */
function supprimerTacheDirectement(id) {
    const index = AppState.taches.findIndex(t => t.id === id);
    if (index === -1) return;
    
    const tache = AppState.taches[index];
    AppState.taches.splice(index, 1);
    
    sauvegarderDansLocalStorage();
    synchroniserAvecDashboard();
    afficherTaches();
    mettreAJourStatistiques();
    afficherNotification(`Tâche "${tache.titre}" supprimée`, 'success');
}

/**
 * Affiche les tâches selon les filtres et la vue active
 */
function afficherTaches() {
    const tachesFiltrees = filtrerTaches();
    const totalTaches = tachesFiltrees.length;
    
    // Pagination
    const debut = (AppState.pageCourante - 1) * AppState.elementsParPage;
    const fin = debut + AppState.elementsParPage;
    const tachesPage = tachesFiltrees.slice(debut, fin);
    
    if (AppState.vue === 'tableau') {
        afficherVueTableau(tachesPage);
    } else {
        afficherVueGrille(tachesPage);
    }
    
    // Mettre à jour la pagination
    mettreAJourPagination(totalTaches);
}

/**
 * Filtre les tâches selon les critères actifs
 */
function filtrerTaches() {
    let tachesFiltrees = [...AppState.taches];
    
    // Quick filters
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);
    
    if (AppState.quickFilters.today) {
        const dateStr = aujourdhui.toISOString().split('T')[0];
        tachesFiltrees = tachesFiltrees.filter(t => t.echeance === dateStr);
    } else if (AppState.quickFilters.week) {
        const finSemaine = new Date(aujourdhui);
        finSemaine.setDate(finSemaine.getDate() + 7);
        tachesFiltrees = tachesFiltrees.filter(t => {
            if (!t.echeance) return false;
            const dateTache = new Date(t.echeance);
            dateTache.setHours(0, 0, 0, 0);
            return dateTache >= aujourdhui && dateTache <= finSemaine;
        });
    } else if (AppState.quickFilters.overdue) {
        tachesFiltrees = tachesFiltrees.filter(t => {
            if (t.statut === 'terminee' || !t.echeance) return false;
            const dateTache = new Date(t.echeance);
            dateTache.setHours(0, 0, 0, 0);
            return dateTache < aujourdhui;
        });
    } else if (AppState.quickFilters.mine) {
        // Filtrer les tâches assignées à l'utilisateur courant
        tachesFiltrees = tachesFiltrees.filter(t => 
            t.assigne && t.assigne.toLowerCase().includes('john')
        );
    }
    
    // Filtre par recherche texte
    if (AppState.filtreRecherche) {
        const terme = AppState.filtreRecherche;
        tachesFiltrees = tachesFiltrees.filter(tache => {
            const correspondTitre = tache.titre.toLowerCase().includes(terme);
            const correspondDescription = tache.description.toLowerCase().includes(terme);
            const correspondProjet = tache.projet.toLowerCase().includes(terme);
            const correspondAssignee = tache.assigne.toLowerCase().includes(terme);
            
            return correspondTitre || correspondDescription || correspondProjet || correspondAssignee;
        });
    }
    
    // Filtre par statut
    if (AppState.filtres.statut !== 'tous') {
        tachesFiltrees = tachesFiltrees.filter(t => t.statut === AppState.filtres.statut);
    }
    
    // Filtre par priorité
    if (AppState.filtres.priorite !== 'toutes') {
        tachesFiltrees = tachesFiltrees.filter(t => t.priorite === AppState.filtres.priorite);
    }
    
    // Filtre par projet
    if (AppState.filtres.projet !== 'tous') {
        tachesFiltrees = tachesFiltrees.filter(t => t.projet === AppState.filtres.projet);
    }
    
    // Filtre par échéance
    if (AppState.filtres.echeance !== 'toutes') {
        const aujourdhui = new Date();
        aujourdhui.setHours(0, 0, 0, 0);
        
        tachesFiltrees = tachesFiltrees.filter(t => {
            if (!t.echeance) return false;
            const dateTache = new Date(t.echeance);
            dateTache.setHours(0, 0, 0, 0);
            
            switch(AppState.filtres.echeance) {
                case 'aujourdhui':
                    return dateTache.getTime() === aujourdhui.getTime();
                case 'semaine':
                    const finSemaine = new Date(aujourdhui);
                    finSemaine.setDate(finSemaine.getDate() + 7);
                    return dateTache >= aujourdhui && dateTache <= finSemaine;
                case 'mois':
                    const finMois = new Date(aujourdhui);
                    finMois.setMonth(finMois.getMonth() + 1);
                    return dateTache >= aujourdhui && dateTache <= finMois;
                default:
                    return true;
            }
        });
    }
    
    return tachesFiltrees;
}

/**
 * Affiche la vue tableau
 */
function afficherVueTableau(taches) {
    const tbody = document.querySelector('.tableau-taches tbody');
    const vueTableau = document.querySelector('.vue-tableau-taches');
    const vueGrille = document.querySelector('.vue-grille-taches');
    
    // Masquer la vue grille
    if (vueGrille) vueGrille.style.display = 'none';
    
    if (!tbody || !vueTableau) return;
    
    // Afficher la vue tableau
    vueTableau.style.display = 'block';
    
    // Si aucune tâche
    if (taches.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 3rem;">
                    <div style="color: #9ca3af;">
                        <i class="fas fa-tasks" style="font-size: 3rem; margin-bottom: 1rem; display: block; opacity: 0.5;"></i>
                        <p style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem;">Aucune tâche</p>
                        <p style="font-size: 0.875rem; margin-bottom: 1.5rem;">Commencez par créer votre première tâche</p>
                        <button onclick="ouvrirModal()" style="padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                            <i class="fas fa-plus"></i> Créer une tâche
                        </button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    // Générer les lignes du tableau avec data-id bien défini
    tbody.innerHTML = taches.map(tache => `
        <tr data-id="${tache.id}">
            <td>
                <input type="checkbox" class="case-selection-tache" data-task-id="${tache.id}">
            </td>
            <td>
                <div class="titre-tache" data-task-id="${tache.id}">${echapperHTML(tache.titre)}</div>
                <div class="description-tache">${echapperHTML(tache.description.substring(0, 80))}${tache.description.length > 80 ? '...' : ''}</div>
            </td>
            <td>
                <span class="badge-projet">${echapperHTML(tache.projet)}</span>
            </td>
            <td>
                <span class="badge-statut ${tache.priorite}">${getLabelPriorite(tache.priorite)}</span>
            </td>
            <td>
                <span class="badge-statut ${tache.statut}">${getLabelStatut(tache.statut)}</span>
            </td>
            <td>
                <div class="date-echeance">${formaterDate(tache.echeance)}</div>
            </td>
            <td>
                <div class="actions-tache">
                    <button class="bouton-action-tache editer" title="Éditer" data-task-id="${tache.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="bouton-action-tache supprimer" title="Supprimer" data-task-id="${tache.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Affiche la vue grille
 */
function afficherVueGrille(taches) {
    const grille = document.querySelector('.grille-taches');
    const vueGrille = document.querySelector('.vue-grille-taches');
    const vueTableau = document.querySelector('.vue-tableau-taches');
    
    // Masquer la vue tableau
    if (vueTableau) vueTableau.style.display = 'none';
    
    if (!grille || !vueGrille) return;
    
    // Afficher la vue grille
    vueGrille.style.display = 'block';
    
    // Si aucune tâche
    if (taches.length === 0) {
        grille.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                <div style="color: #9ca3af;">
                    <i class="fas fa-tasks" style="font-size: 3rem; margin-bottom: 1rem; display: block; opacity: 0.5;"></i>
                    <p style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem;">Aucune tâche</p>
                    <p style="font-size: 0.875rem; margin-bottom: 1.5rem;">Commencez par créer votre première tâche</p>
                    <button onclick="ouvrirModal()" style="padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        <i class="fas fa-plus"></i> Créer une tâche
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    // Générer les cartes avec data-id bien défini
    grille.innerHTML = taches.map(tache => `
        <div class="carte-tache" data-id="${tache.id}">
            <div class="en-tete-carte-tache">
                <span class="badge-statut ${tache.statut}">${getLabelStatut(tache.statut)}</span>
                <input type="checkbox" class="case-selection-tache" data-task-id="${tache.id}">
            </div>
            <div class="contenu-carte-tache">
                <h3 data-task-id="${tache.id}">${echapperHTML(tache.titre)}</h3>
                <p class="description-carte-tache">${echapperHTML(tache.description.substring(0, 150))}${tache.description.length > 150 ? '...' : ''}</p>
                <div class="meta-carte-tache">
                    <div class="element-meta">
                        <i class="fas fa-folder"></i>
                        <span>${echapperHTML(tache.projet)}</span>
                    </div>
                    <div class="element-meta">
                        <i class="fas fa-flag"></i>
                        <span>Priorité: ${getLabelPriorite(tache.priorite)}</span>
                    </div>
                    <div class="element-meta">
                        <i class="fas fa-calendar"></i>
                        <span>${formaterDate(tache.echeance)}</span>
                    </div>
                </div>
            </div>
            <div class="pied-carte-tache">
                <span class="badge-projet">${echapperHTML(tache.projet)}</span>
                <div class="actions-tache">
                    <button class="bouton-action-tache editer" title="Éditer" data-task-id="${tache.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="bouton-action-tache supprimer" title="Supprimer" data-task-id="${tache.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Met à jour la pagination
 */
function mettreAJourPagination(totalTaches) {
    const totalPages = Math.ceil(totalTaches / AppState.elementsParPage);
    const controles = document.querySelector('.controles-pagination');
    const info = document.querySelector('.info-pagination');
    
    if (!controles || !info) return;
    
    // Mettre à jour l'info
    const debut = (AppState.pageCourante - 1) * AppState.elementsParPage + 1;
    const fin = Math.min(debut + AppState.elementsParPage - 1, totalTaches);
    info.textContent = totalTaches === 0 ? 'Aucune tâche' : `Affichage de ${debut} à ${fin} sur ${totalTaches} tâche${totalTaches > 1 ? 's' : ''}`;
    
    // Masquer la pagination si aucune tâche
    if (totalTaches === 0) {
        controles.style.display = 'none';
        return;
    }
    
    controles.style.display = 'flex';
    
    // Générer les numéros de page
    controles.innerHTML = '';
    
    // Bouton précédent
    const btnPrev = document.createElement('button');
    btnPrev.className = 'bouton-pagination';
    btnPrev.disabled = AppState.pageCourante === 1;
    btnPrev.innerHTML = '<i class="fas fa-chevron-left"></i>';
    btnPrev.onclick = () => {
        if (AppState.pageCourante > 1) {
            AppState.pageCourante--;
            afficherTaches();
        }
    };
    controles.appendChild(btnPrev);
    
    // Numéros de page
    const maxPagesVisibles = 5;
    let debutPage = Math.max(1, AppState.pageCourante - Math.floor(maxPagesVisibles / 2));
    let finPage = Math.min(totalPages, debutPage + maxPagesVisibles - 1);
    
    if (finPage - debutPage < maxPagesVisibles - 1) {
        debutPage = Math.max(1, finPage - maxPagesVisibles + 1);
    }
    
    if (debutPage > 1) {
        const btn1 = document.createElement('div');
        btn1.className = 'numero-page';
        btn1.textContent = '1';
        btn1.onclick = () => {
            AppState.pageCourante = 1;
            afficherTaches();
        };
        controles.appendChild(btn1);
        
        if (debutPage > 2) {
            const dots = document.createElement('div');
            dots.className = 'numero-page';
            dots.textContent = '...';
            controles.appendChild(dots);
        }
    }
    
    for (let i = debutPage; i <= finPage; i++) {
        const btnPage = document.createElement('div');
        btnPage.className = `numero-page ${i === AppState.pageCourante ? 'page-active' : ''}`;
        btnPage.textContent = i;
        btnPage.onclick = () => {
            AppState.pageCourante = i;
            afficherTaches();
        };
        controles.appendChild(btnPage);
    }
    
    if (finPage < totalPages) {
        if (finPage < totalPages - 1) {
            const dots = document.createElement('div');
            dots.className = 'numero-page';
            dots.textContent = '...';
            controles.appendChild(dots);
        }
        
        const btnLast = document.createElement('div');
        btnLast.className = 'numero-page';
        btnLast.textContent = totalPages;
        btnLast.onclick = () => {
            AppState.pageCourante = totalPages;
            afficherTaches();
        };
        controles.appendChild(btnLast);
    }
    
    // Bouton suivant
    const btnNext = document.createElement('button');
    btnNext.className = 'bouton-pagination';
    btnNext.disabled = AppState.pageCourante === totalPages;
    btnNext.innerHTML = '<i class="fas fa-chevron-right"></i>';
    btnNext.onclick = () => {
        if (AppState.pageCourante < totalPages) {
            AppState.pageCourante++;
            afficherTaches();
        }
    };
    controles.appendChild(btnNext);
}

/**
 * Met à jour les statistiques
 */
function mettreAJourStatistiques() {
    const total = AppState.taches.length;
    const terminees = AppState.taches.filter(t => t.statut === 'terminee').length;
    const enCours = AppState.taches.filter(t => t.statut === 'en-cours').length;
    
    // Calculer les tâches en retard
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);
    const enRetard = AppState.taches.filter(t => {
        if (t.statut === 'terminee' || !t.echeance) return false;
        const echeance = new Date(t.echeance);
        echeance.setHours(0, 0, 0, 0);
        return echeance < aujourdhui;
    }).length;
    
    // Calculer le pourcentage de progression
    const pourcentage = total > 0 ? Math.round((terminees / total) * 100) : 0;
    
    // Mettre à jour l'affichage
    const stats = document.querySelectorAll('.valeur-statistique-tache');
    if (stats.length >= 4) {
        stats[0].textContent = total;
        stats[1].textContent = terminees;
        stats[2].textContent = enCours;
        stats[3].textContent = enRetard;
    }
    
    // Mettre à jour le badge dans la navigation
    const badge = document.querySelector('.lien-navigation[href="taches.html"] .badge-navigation');
    if (badge) {
        const aFaire = AppState.taches.filter(t => t.statut === 'a-faire').length;
        badge.textContent = aFaire + enCours;
    }
    
    // Mettre à jour les statistiques globales
    mettreAJourStatistiquesDashboard();
}

/**
 * Synchronise avec le dashboard
 */
function synchroniserAvecDashboard() {
    // Sauvegarder les tâches dans localStorage pour que le dashboard puisse les lire
    localStorage.setItem('tgnova_taches', JSON.stringify(AppState.taches));
    
    // Mettre à jour les statistiques
    mettreAJourStatistiquesDashboard();
    
    // Déclencher un événement personnalisé pour notifier le dashboard
    window.dispatchEvent(new CustomEvent('tachesModifiees', { 
        detail: { taches: AppState.taches } 
    }));
}

/**
 * Met à jour les statistiques du dashboard
 */
function mettreAJourStatistiquesDashboard() {
    const statsDashboard = {
        total: AppState.taches.length,
        terminees: AppState.taches.filter(t => t.statut === 'terminee').length,
        enCours: AppState.taches.filter(t => t.statut === 'en-cours').length,
        projetsActifs: [...new Set(AppState.taches.map(t => t.projet))].length
    };
    
    localStorage.setItem('tgnova_statistiques', JSON.stringify(statsDashboard));
}

/**
 * Affiche une notification
 */
function afficherNotification(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 2000;';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.style.cssText = `
        background: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.5rem;
        animation: slideIn 0.3s ease;
        border-left: 4px solid ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        min-width: 300px;
    `;
    
    const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle';
    const color = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6';
    
    toast.innerHTML = `
        <i class="fas fa-${icon}" style="color: ${color}; font-size: 1.25rem;"></i>
        <span style="font-size: 0.875rem; flex: 1;">${message}</span>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; color: #9ca3af; cursor: pointer; padding: 0.25rem;">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Génère un nouvel ID unique
 */
function genererNouvelId() {
    return AppState.taches.length > 0 
        ? Math.max(...AppState.taches.map(t => t.id)) + 1 
        : 1;
}

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
 * Obtient le label de statut
 */
function getLabelStatut(statut) {
    const labels = {
        'a-faire': 'À faire',
        'en-cours': 'En cours',
        'terminee': 'Terminée'
    };
    return labels[statut] || statut;
}

/**
 * Formate une date de manière lisible
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
 * Charge les événements depuis le localStorage
 */
function chargerEvenements() {
    try {
        const donnees = localStorage.getItem('tgnova_evenements');
        if (donnees) {
            AppState.evenements = JSON.parse(donnees);
        }
    } catch (error) {
        console.error('Erreur de chargement des événements:', error);
        AppState.evenements = [];
    }
}

// ============================================
// GESTION DES PRÉFÉRENCES (VUE PERSISTANTE)
// ============================================

/**
 * Charge les préférences depuis le localStorage
 */
function chargerPreferencesDepuisLocalStorage() {
    try {
        // Charger la préférence de vue
        const preferenceVue = localStorage.getItem('tgnova_preference_vue');
        if (preferenceVue && (preferenceVue === 'tableau' || preferenceVue === 'grille')) {
            AppState.vue = preferenceVue;
            console.log('📂 Préférence de vue chargée:', AppState.vue);
        } else {
            console.log('📂 Aucune préférence de vue trouvée, utilisation du mode par défaut');
        }
        
        // Charger d'autres préférences si nécessaire
        const autresPreferences = localStorage.getItem('tgnova_preferences');
        if (autresPreferences) {
            try {
                const preferences = JSON.parse(autresPreferences);
                // Ici vous pouvez charger d'autres préférences
            } catch (e) {
                console.warn('Erreur de parsing des préférences:', e);
            }
        }
    } catch (error) {
        console.error('❌ Erreur de chargement des préférences:', error);
    }
}

/**
 * Sauvegarde la préférence de vue dans le localStorage
 */
function sauvegarderPreferenceVue(vue) {
    try {
        localStorage.setItem('tgnova_preference_vue', vue);
        console.log('💾 Préférence de vue sauvegardée:', vue);
        
        // Optionnel : sauvegarder d'autres préférences dans un objet
        const preferences = {
            vue: vue,
            derniereMiseAJour: new Date().toISOString()
        };
        localStorage.setItem('tgnova_preferences', JSON.stringify(preferences));
    } catch (error) {
        console.error('❌ Erreur de sauvegarde de la préférence de vue:', error);
    }
}

/**
 * Sauvegarde toutes les préférences utilisateur
 */
function sauvegarderPreferences() {
    try {
        const preferences = {
            vue: AppState.vue,
            elementsParPage: AppState.elementsParPage,
            derniereMiseAJour: new Date().toISOString()
        };
        
        localStorage.setItem('tgnova_preferences', JSON.stringify(preferences));
        console.log('💾 Toutes les préférences sauvegardées');
    } catch (error) {
        console.error('❌ Erreur de sauvegarde des préférences:', error);
    }
}

// ============================================
// STOCKAGE LOCAL (LocalStorage)
// ============================================

/**
 * Sauvegarde les tâches dans le localStorage
 */
function sauvegarderDansLocalStorage() {
    try {
        localStorage.setItem('tgnova_taches', JSON.stringify(AppState.taches));
        console.log('💾 Tâches sauvegardées:', AppState.taches.length);
    } catch (error) {
        console.error('❌ Erreur de sauvegarde:', error);
        afficherNotification('Erreur lors de la sauvegarde', 'error');
    }
}

/**
 * Charge les tâches depuis le localStorage
 */
function chargerDepuisLocalStorage() {
    try {
        const donnees = localStorage.getItem('tgnova_taches');
        if (donnees) {
            AppState.taches = JSON.parse(donnees);
            console.log('📂 Tâches chargées:', AppState.taches.length);
            
            // Si pas de tâches, créer des exemples
            if (AppState.taches.length === 0) {
                creerTachesExemples();
            }
        } else {
            console.log('📂 Aucune tâche enregistrée');
            creerTachesExemples();
        }
    } catch (error) {
        console.error('❌ Erreur de chargement:', error);
        creerTachesExemples();
    }
}

/**
 * Crée des tâches d'exemple
 */
function creerTachesExemples() {
    const aujourdhui = new Date();
    const demain = new Date(aujourdhui);
    demain.setDate(demain.getDate() + 1);
    const vendredi = new Date(aujourdhui);
    vendredi.setDate(vendredi.getDate() + 3);
    
    AppState.taches = [
    ];
    
    sauvegarderDansLocalStorage();
}

// ============================================
// ANIMATIONS CSS
// ============================================

const style = document.createElement('style');
style.textContent = `
    /* Modal fade in animation */
    @keyframes modalFadeIn {
        from {
            opacity: 0;
            transform: scale(0.95);
        }
        to {
            opacity: 1;
            transform: scale(1);
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
    
    .modal-overlay.visible {
        animation: fadeIn 0.3s ease;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    .bulk-actions {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        display: none;
        align-items: center;
        gap: 1rem;
        z-index: 1000;
    }
    
    .bulk-actions.visible {
        animation: slideUp 0.3s ease;
    }
    
    @keyframes slideUp {
        from {
            transform: translate(-50%, 100%);
            opacity: 0;
        }
        to {
            transform: translate(-50%, 0);
            opacity: 1;
        }
    }
    
    .quick-filters {
        display: flex;
        gap: 0.5rem;
        margin: 1rem 0;
        flex-wrap: wrap;
    }
    
    .quick-filter {
        padding: 0.5rem 1rem;
        background: #f3f4f6;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.875rem;
        transition: all 0.2s;
    }
    
    .quick-filter:hover {
        background: #e5e7eb;
    }
    
    .quick-filter.active {
        background: #4f46e5;
        color: white;
        border-color: #4f46e5;
    }
    
    /* Styles pour les modals (centrage direct) */
    .modal {
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        width: 90%;
        max-width: 500px;
        max-height: 90vh;
        overflow-y: auto;
        position: relative;
        animation: modalFadeIn 0.3s ease;
    }
    
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border-bottom: 1px solid #e5e7eb;
    }
    
    .modal-header h2 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: #111827;
    }
    
    .modal-close {
        background: none;
        border: none;
        color: #6b7280;
        cursor: pointer;
        font-size: 1.25rem;
        padding: 0.5rem;
        border-radius: 6px;
        transition: all 0.2s;
    }
    
    .modal-close:hover {
        background: #f3f4f6;
        color: #111827;
    }
    
    .modal-content {
        padding: 1.5rem;
    }
    
    .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        padding: 1.5rem;
        border-top: 1px solid #e5e7eb;
    }
    
    /* Boutons */
    .btn-primary, .btn-secondary, .btn-danger {
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        border: none;
        transition: all 0.2s;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .btn-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
    }
    
    .btn-primary:hover {
        opacity: 0.9;
        transform: translateY(-1px);
    }
    
    .btn-secondary {
        background: #f3f4f6;
        color: #374151;
    }
    
    .btn-secondary:hover {
        background: #e5e7eb;
    }
    
    .btn-danger {
        background: #ef4444;
        color: white;
    }
    
    .btn-danger:hover {
        background: #dc2626;
    }
    
    /* Formulaires */
    .form-group {
        margin-bottom: 1.5rem;
    }
    
    .form-row {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
    }
    
    .form-row .form-group {
        flex: 1;
        margin-bottom: 0;
    }
    
    .form-label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #374151;
        font-size: 0.875rem;
    }
    
    .form-input, .form-select, .form-textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 0.875rem;
        transition: all 0.2s;
    }
    
    .form-input:focus, .form-select:focus, .form-textarea:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    
    .form-textarea {
        resize: vertical;
        min-height: 100px;
    }
    
    /* Indicateur de mode de vue actif */
    .mode-vue-actif {
        font-weight: 600;
        color: #4f46e5;
        font-size: 0.75rem;
        margin-left: 0.5rem;
        padding: 0.25rem 0.5rem;
        background: #eef2ff;
        border-radius: 4px;
        display: inline-block;
    }
`;
document.head.appendChild(style);

// ============================================
// EXPOSITION DES FONCTIONS GLOBALES
// ============================================

window.ouvrirModal = ouvrirModal;
window.fermerModal = fermerModal;
window.editerTache = editerTache;
window.demanderSuppression = demanderSuppression;
window.marquerSelectionCommeTerminee = marquerSelectionCommeTerminee;
window.supprimerSelection = supprimerSelection;
window.exporterTaches = exporterTaches;
window.confirmerSuppression = confirmerSuppression;

console.log('✨ Module taches.js amélioré avec persistance du mode grille et modals centrés');