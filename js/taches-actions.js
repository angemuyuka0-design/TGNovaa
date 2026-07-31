/**
 * taches-actions.js - Gestionnaire des actions rapides pour les tâches TGNOVA
 * Ce fichier gère toutes les actions interactives comme le marquage rapide,
 * les changements de statut en un clic, et les raccourcis clavier
 * Version améliorée avec gestion complète des modales de modification/suppression
 */

// ============================================
// ÉTAT DES ACTIONS RAPIDES
// ============================================

const ActionsRapides = {
    actionsEnCours: new Set(), // Pour suivre les actions en cours d'exécution
    dernierRaccourci: null,
    modeActionRapide: false,
    historiqueActions: [],
    preferences: {
        doubleClicPourEditer: true,
        entreePourValider: true,
        confirmationSuppression: true,
        animations: true
    },
    tacheEnCours: null // Pour suivre la tâche en cours d'édition/suppression
};

// ============================================
// INITIALISATION DES ACTIONS RAPIDES
// ============================================

/**
 * Initialise tous les gestionnaires d'actions rapides
 */
function initialiserActionsRapides() {
    console.log('⚡ Initialisation des actions rapides');
    
    // Charger les préférences
    chargerPreferencesActions();
    
    // Initialiser les différents types d'actions
    initialiserActionsSurvol();
    initialiserActionsClic();
    initialiserRaccourcisClavier();
    initialiserDragAndDrop();
    initialiserActionsContextuelles();
    initialiserBoutonsActions(); // Nouvelle fonction pour les boutons d'action
    
    // Observer les nouvelles tâches ajoutées dynamiquement
    observerNouvellesTaches();
    
    console.log('✅ Actions rapides initialisées');
}

/**
 * Initialise les boutons d'action (éditer/supprimer) dans les tâches
 */
function initialiserBoutonsActions() {
    // Délégation d'événements pour tous les boutons d'action
    document.addEventListener('click', (e) => {
        // Bouton Éditer
        if (e.target.closest('.bouton-action-tache.editer') || 
            (e.target.classList.contains('fa-edit') && e.target.closest('button'))) {
            
            const bouton = e.target.closest('.bouton-action-tache.editer') || e.target.closest('button');
            const id = obtenirIdTacheDepuisBouton(bouton);
            
            if (id) {
                e.preventDefault();
                e.stopPropagation();
                ouvrirModalEdition(id);
            }
            return;
        }
        
        // Bouton Supprimer
        if (e.target.closest('.bouton-action-tache.supprimer') || 
            (e.target.classList.contains('fa-trash') && e.target.closest('button'))) {
            
            const bouton = e.target.closest('.bouton-action-tache.supprimer') || e.target.closest('button');
            const id = obtenirIdTacheDepuisBouton(bouton);
            
            if (id) {
                e.preventDefault();
                e.stopPropagation();
                ouvrirModalSuppression(id);
            }
            return;
        }
    });
}

/**
 * Obtient l'ID d'une tâche depuis un bouton d'action
 */
function obtenirIdTacheDepuisBouton(element) {
    if (!element) return null;
    
    let id = null;
    
    // 1. Vérifier l'attribut data-task-id sur le bouton
    if (element.dataset.taskId) {
        id = element.dataset.taskId;
    }
    
    // 2. Chercher dans les parents
    if (!id) {
        const parentWithId = element.closest('[data-id]');
        if (parentWithId && parentWithId.dataset.id) {
            id = parentWithId.dataset.id;
        }
    }
    
    // 3. Chercher dans la ligne du tableau ou la carte
    if (!id) {
        const row = element.closest('tr[data-id]');
        if (row && row.dataset.id) {
            id = row.dataset.id;
        } else {
            const card = element.closest('.carte-tache[data-id]');
            if (card && card.dataset.id) {
                id = card.dataset.id;
            }
        }
    }
    
    return id ? (isNaN(parseInt(id)) ? id : parseInt(id)) : null;
}

// ============================================
// GESTION DES MODALES
// ============================================

/**
 * Ouvre la modale d'édition pour une tâche
 */
function ouvrirModalEdition(id) {
    console.log('📝 Ouverture de la modale d\'édition pour la tâche:', id);
    
    // Version Firebase
    if (window.TGNOVA_TACHES && window.TGNOVA_TACHES.taches) {
        const tache = window.TGNOVA_TACHES.taches[id];
        if (tache && window.TGNOVA_TACHES.ouvrirModalTache) {
            window.TGNOVA_TACHES.ouvrirModalTache(id);
            return;
        }
    }
    
    // Version localStorage
    if (window.AppState && window.editerTache) {
        window.editerTache(id);
        return;
    }
    
    // Fallback: essayer de trouver la fonction appropriée
    if (window.ouvrirModalTache) {
        window.ouvrirModalTache(id);
    } else if (window.editerTache) {
        window.editerTache(id);
    } else {
        console.error('Aucune fonction d\'édition trouvée');
        afficherNotificationRapide('Erreur: fonction d\'édition non disponible', 'error');
    }
}

/**
 * Ouvre la modale de suppression pour une tâche
 */
function ouvrirModalSuppression(id) {
    console.log('🗑️ Ouverture de la modale de suppression pour la tâche:', id);
    
    // Version Firebase
    if (window.TGNOVA_TACHES && window.TGNOVA_TACHES.confirmerSuppressionTache) {
        window.TGNOVA_TACHES.confirmerSuppressionTache(id);
        return;
    }
    
    // Version localStorage
    if (window.demanderSuppression) {
        window.demanderSuppression(id);
        return;
    }
    
    // Fallback
    if (window.confirmerSuppressionTache) {
        window.confirmerSuppressionTache(id);
    } else {
        // Dernier recours: confirmation native
        const tache = recupererTacheParId(id);
        if (tache) {
            modalUtils.demanderConfirmation(
                'Confirmation de suppression',
                `Êtes-vous sûr de vouloir supprimer la tâche "${tache.titre}" ?`,
                () => supprimerTacheDirectement(id)
            );
        }
    }
}

/**
 * Récupère une tâche par son ID (tous les modes confondus)
 */
function recupererTacheParId(id) {
    // Version Firebase
    if (window.TGNOVA_TACHES && window.TGNOVA_TACHES.taches) {
        return window.TGNOVA_TACHES.taches[id];
    }
    
    // Version localStorage
    if (window.AppState && window.AppState.taches) {
        return window.AppState.taches.find(t => t.id === parseInt(id));
    }
    
    return null;
}

/**
 * Supprime une tâche directement (fallback)
 */
async function supprimerTacheDirectement(id) {
    // Version Firebase
    if (window.TGNOVA_TACHES && window.TGNOVA_TACHES.supprimerTache) {
        await window.TGNOVA_TACHES.supprimerTache(id);
        return;
    }
    
    // Version localStorage
    if (window.AppState && window.supprimerTacheDirectement) {
        window.supprimerTacheDirectement(id);
    } else if (window.AppState) {
        const index = window.AppState.taches.findIndex(t => t.id === parseInt(id));
        if (index !== -1) {
            const tache = window.AppState.taches[index];
            window.AppState.taches.splice(index, 1);
            window.sauvegarderDansLocalStorage?.();
            window.synchroniserAvecDashboard?.();
            window.afficherTaches?.();
            window.mettreAJourStatistiques?.();
            afficherNotificationRapide(`Tâche "${tache.titre}" supprimée`, 'success');
        }
    }
}

// ============================================
// ACTIONS AU SURVOL
// ============================================

/**
 * Initialise les actions au survol des tâches
 */
function initialiserActionsSurvol() {
    const conteneurTaches = document.querySelector('.conteneur-taches');
    if (!conteneurTaches) return;
    
    // Délégation d'événements pour le survol
    conteneurTaches.addEventListener('mouseover', (e) => {
        const elementTache = e.target.closest('tr[data-id], .carte-tache[data-id]');
        if (!elementTache) return;
        
        // Ne pas afficher si on survole déjà les boutons d'action
        if (e.target.closest('.bouton-action-tache, .actions-rapides-survol')) return;
        
        if (!ActionsRapides.modeActionRapide) {
            afficherActionsRapidesSurvol(elementTache);
        }
    });
    
    conteneurTaches.addEventListener('mouseout', (e) => {
        const elementTache = e.target.closest('tr[data-id], .carte-tache[data-id]');
        if (!elementTache) return;
        
        const actionsSurvol = elementTache.querySelector('.actions-rapides-survol');
        if (actionsSurvol && !actionsSurvol.matches(':hover') && !e.relatedTarget?.closest('.actions-rapides-survol')) {
            masquerActionsRapidesSurvol(elementTache);
        }
    });
}

/**
 * Affiche les actions rapides au survol
 */
function afficherActionsRapidesSurvol(element) {
    // Vérifier si les actions existent déjà
    let actionsContainer = element.querySelector('.actions-rapides-survol');
    
    if (!actionsContainer) {
        const id = element.dataset.id;
        if (!id) return;
        
        actionsContainer = document.createElement('div');
        actionsContainer.className = 'actions-rapides-survol';
        actionsContainer.innerHTML = `
            <button class="action-rapide-btn terminer" onclick="event.stopPropagation(); marquerTacheRapide('${id}', 'terminee')" title="Marquer comme terminée">
                <i class="fas fa-check-circle"></i>
            </button>
            <button class="action-rapide-btn demarrer" onclick="event.stopPropagation(); marquerTacheRapide('${id}', 'en-cours')" title="Commencer la tâche">
                <i class="fas fa-play-circle"></i>
            </button>
            <button class="action-rapide-btn reporter" onclick="event.stopPropagation(); reporterTacheRapide('${id}')" title="Reporter à demain">
                <i class="fas fa-calendar-plus"></i>
            </button>
            <button class="action-rapide-btn priorite" onclick="event.stopPropagation(); ouvrirMenuPriorite('${id}')" title="Changer la priorité">
                <i class="fas fa-flag"></i>
            </button>
            <div class="separateur-actions"></div>
            <button class="action-rapide-btn editer" onclick="event.stopPropagation(); ouvrirModalEdition('${id}')" title="Modifier">
                <i class="fas fa-edit"></i>
            </button>
            <button class="action-rapide-btn supprimer" onclick="event.stopPropagation(); ouvrirModalSuppression('${id}')" title="Supprimer">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        element.style.position = 'relative';
        element.appendChild(actionsContainer);
    }
    
    actionsContainer.classList.add('visible');
}

/**
 * Masque les actions rapides au survol
 */
function masquerActionsRapidesSurvol(element) {
    const actionsContainer = element.querySelector('.actions-rapides-survol');
    if (actionsContainer) {
        actionsContainer.classList.remove('visible');
    }
}

// ============================================
// ACTIONS AU CLIC
// ============================================

/**
 * Initialise les actions au clic sur les tâches
 */
function initialiserActionsClic() {
    document.addEventListener('click', (e) => {
        // Clic sur le badge de statut
        if (e.target.closest('.badge-statut') && !e.target.closest('.actions-tache')) {
            const badge = e.target.closest('.badge-statut');
            const elementTache = badge.closest('tr[data-id], .carte-tache[data-id]');
            
            if (elementTache && ActionsRapides.preferences.doubleClicPourEditer) {
                const id = elementTache.dataset.id;
                cyclerStatutTache(id, badge);
                e.stopPropagation();
            }
        }
        
        // Alt + clic sur le badge de priorité
        if (e.altKey && e.target.closest('.badge-statut.haute, .badge-statut.moyenne, .badge-statut.basse')) {
            const badge = e.target.closest('.badge-statut');
            const elementTache = badge.closest('tr[data-id], .carte-tache[data-id]');
            
            if (elementTache) {
                const id = elementTache.dataset.id;
                cyclerPrioriteTache(id, badge);
                e.preventDefault();
                e.stopPropagation();
            }
        }
    });
    
    // Double-clic sur une tâche
    if (ActionsRapides.preferences.doubleClicPourEditer) {
        document.addEventListener('dblclick', (e) => {
            const elementTache = e.target.closest('tr[data-id], .carte-tache[data-id]');
            if (elementTache && !e.target.closest('.bouton-action-tache, .actions-rapides-survol')) {
                const id = elementTache.dataset.id;
                if (id) {
                    ouvrirModalEdition(id);
                }
            }
        });
    }
}

// ============================================
// ACTIONS SUR LES TÂCHES
// ============================================

/**
 * Cycle à travers les statuts d'une tâche
 */
async function cyclerStatutTache(id, element) {
    if (ActionsRapides.actionsEnCours.has(id)) return;
    
    ActionsRapides.actionsEnCours.add(id);
    
    try {
        const ordreStatuts = ['a-faire', 'en-cours', 'terminee'];
        let tache = recupererTacheParId(id);
        
        if (!tache) return;
        
        const indexActuel = ordreStatuts.indexOf(tache.statut);
        const prochainStatut = ordreStatuts[(indexActuel + 1) % ordreStatuts.length];
        
        // Animation du bouton
        if (ActionsRapides.preferences.animations) {
            element.style.transform = 'scale(1.1)';
            setTimeout(() => {
                element.style.transform = 'scale(1)';
            }, 200);
        }
        
        // Mettre à jour la tâche
        await mettreAJourStatutTache(id, prochainStatut);
        
        // Mettre à jour l'affichage du badge
        element.className = `badge-statut ${prochainStatut}`;
        element.textContent = obtenirLibelleStatut(prochainStatut);
        
        // Notification
        afficherNotificationRapide(`Tâche marquée: ${obtenirLibelleStatut(prochainStatut)}`, 'success');
        
    } catch (error) {
        console.error('Erreur lors du cycle de statut:', error);
        afficherNotificationRapide('Erreur lors du changement de statut', 'error');
    } finally {
        ActionsRapides.actionsEnCours.delete(id);
    }
}

/**
 * Cycle à travers les priorités d'une tâche
 */
async function cyclerPrioriteTache(id, element) {
    if (ActionsRapides.actionsEnCours.has(id)) return;
    
    ActionsRapides.actionsEnCours.add(id);
    
    try {
        const ordrePriorites = ['basse', 'moyenne', 'haute'];
        let tache = recupererTacheParId(id);
        
        if (!tache) return;
        
        const indexActuel = ordrePriorites.indexOf(tache.priorite);
        const prochainePriorite = ordrePriorites[(indexActuel + 1) % ordrePriorites.length];
        
        // Animation
        if (ActionsRapides.preferences.animations) {
            element.style.transform = 'scale(1.1) rotate(5deg)';
            setTimeout(() => {
                element.style.transform = 'scale(1) rotate(0)';
            }, 200);
        }
        
        // Mettre à jour la tâche
        await mettreAJourPrioriteTache(id, prochainePriorite);
        
        // Mettre à jour l'affichage
        element.className = `badge-statut ${prochainePriorite}`;
        element.textContent = obtenirLibellePriorite(prochainePriorite);
        
        afficherNotificationRapide(`Priorité: ${obtenirLibellePriorite(prochainePriorite)}`, 'info');
        
    } catch (error) {
        console.error('Erreur lors du cycle de priorité:', error);
        afficherNotificationRapide('Erreur lors du changement de priorité', 'error');
    } finally {
        ActionsRapides.actionsEnCours.delete(id);
    }
}

/**
 * Marque rapidement une tâche avec un statut
 */
async function marquerTacheRapide(id, statut) {
    if (ActionsRapides.actionsEnCours.has(id)) return;
    
    ActionsRapides.actionsEnCours.add(id);
    
    try {
        const elementTache = document.querySelector(`[data-id="${id}"]`);
        
        // Animation
        if (elementTache && ActionsRapides.preferences.animations) {
            elementTache.style.transition = 'all 0.3s ease';
            elementTache.style.opacity = '0.7';
            elementTache.style.transform = 'scale(0.98)';
        }
        
        await mettreAJourStatutTache(id, statut);
        
        // Mettre à jour le badge de statut
        const badgeStatut = elementTache?.querySelector('.badge-statut');
        if (badgeStatut && !badgeStatut.classList.contains('haute') && !badgeStatut.classList.contains('moyenne') && !badgeStatut.classList.contains('basse')) {
            badgeStatut.className = `badge-statut ${statut}`;
            badgeStatut.textContent = obtenirLibelleStatut(statut);
        }
        
        // Animation de succès
        if (elementTache && ActionsRapides.preferences.animations) {
            elementTache.style.backgroundColor = statut === 'terminee' ? '#d1fae5' : '#e0f2fe';
            setTimeout(() => {
                elementTache.style.backgroundColor = '';
                elementTache.style.opacity = '1';
                elementTache.style.transform = 'scale(1)';
            }, 500);
        }
        
        const message = statut === 'terminee' ? 'Tâche terminée ! 🎉' : 
                       statut === 'en-cours' ? 'Tâche commencée' : 
                       'Tâche à faire';
        
        afficherNotificationRapide(message, 'success');
        
    } catch (error) {
        console.error('Erreur marquage rapide:', error);
        afficherNotificationRapide('Erreur lors du marquage', 'error');
    } finally {
        ActionsRapides.actionsEnCours.delete(id);
    }
}

/**
 * Reporte une tâche à demain
 */
async function reporterTacheRapide(id) {
    if (ActionsRapides.actionsEnCours.has(id)) return;
    
    ActionsRapides.actionsEnCours.add(id);
    
    try {
        const demain = new Date();
        demain.setDate(demain.getDate() + 1);
        const dateStr = demain.toISOString().split('T')[0];
        
        // Version Firebase
        if (window.TGNOVA_TACHES) {
            await firebase.firestore().collection('tasks').doc(id).update({
                echeance: dateStr,
                dateModification: firebase.firestore.FieldValue.serverTimestamp()
            });
        } 
        // Version localStorage
        else if (window.AppState) {
            const tache = window.AppState.taches.find(t => t.id === parseInt(id));
            if (tache) {
                tache.echeance = dateStr;
                tache.dateModification = new Date().toISOString();
                window.sauvegarderDansLocalStorage?.();
                window.synchroniserAvecDashboard?.();
                window.afficherTaches?.();
            }
        }
        
        // Mettre à jour l'affichage
        const elementDate = document.querySelector(`[data-id="${id}"] .date-echeance`);
        if (elementDate) {
            elementDate.textContent = 'Demain';
            elementDate.classList.add('reporte');
            setTimeout(() => elementDate.classList.remove('reporte'), 1000);
        }
        
        afficherNotificationRapide('Tâche reportée à demain', 'info');
        
    } catch (error) {
        console.error('Erreur report tâche:', error);
        afficherNotificationRapide('Erreur lors du report', 'error');
    } finally {
        ActionsRapides.actionsEnCours.delete(id);
    }
}

/**
 * Ouvre le menu de priorité
 */
function ouvrirMenuPriorite(id) {
    fermerTousMenusRapides();
    
    const menu = document.createElement('div');
    menu.className = 'menu-priorite-rapide';
    menu.innerHTML = `
        <div class="option-priorite haute" onclick="changerPrioriteAvecValeur('${id}', 'haute')">
            <i class="fas fa-flag"></i> Haute
        </div>
        <div class="option-priorite moyenne" onclick="changerPrioriteAvecValeur('${id}', 'moyenne')">
            <i class="fas fa-flag"></i> Moyenne
        </div>
        <div class="option-priorite basse" onclick="changerPrioriteAvecValeur('${id}', 'basse')">
            <i class="fas fa-flag"></i> Basse
        </div>
    `;
    
    const elementTache = document.querySelector(`[data-id="${id}"]`);
    if (elementTache) {
        // Positionner le menu près du bouton
        const rect = elementTache.getBoundingClientRect();
        menu.style.position = 'absolute';
        menu.style.top = '50%';
        menu.style.right = '50px';
        menu.style.transform = 'translateY(-50%)';
        
        elementTache.style.position = 'relative';
        elementTache.appendChild(menu);
        
        setTimeout(() => {
            menu.classList.add('visible');
        }, 10);
        
        // Fermer au clic ailleurs
        const fermerMenu = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', fermerMenu);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', fermerMenu);
        }, 100);
    }
}

/**
 * Change la priorité avec une valeur spécifique
 */
async function changerPrioriteAvecValeur(id, priorite) {
    if (ActionsRapides.actionsEnCours.has(id)) return;
    
    ActionsRapides.actionsEnCours.add(id);
    
    try {
        await mettreAJourPrioriteTache(id, priorite);
        
        // Mettre à jour l'affichage
        const badgePriorite = document.querySelector(`[data-id="${id}"] .badge-statut.${priorite === 'haute' ? 'haute' : priorite === 'moyenne' ? 'moyenne' : 'basse'}`);
        if (badgePriorite) {
            badgePriorite.className = `badge-statut ${priorite}`;
            badgePriorite.textContent = obtenirLibellePriorite(priorite);
        }
        
        afficherNotificationRapide(`Priorité: ${obtenirLibellePriorite(priorite)}`, 'info');
        
    } catch (error) {
        console.error('Erreur changement priorité:', error);
        afficherNotificationRapide('Erreur lors du changement', 'error');
    } finally {
        ActionsRapides.actionsEnCours.delete(id);
        
        // Fermer le menu
        const menu = document.querySelector('.menu-priorite-rapide');
        if (menu) menu.remove();
    }
}

// ============================================
// FONCTIONS DE MISE À JOUR (Firebase/LocalStorage)
// ============================================

/**
 * Met à jour le statut d'une tâche
 */
async function mettreAJourStatutTache(id, statut) {
    // Version Firebase
    if (window.TGNOVA_TACHES) {
        await firebase.firestore().collection('tasks').doc(id).update({
            statut: statut,
            completee: statut === 'terminee',
            dateModification: firebase.firestore.FieldValue.serverTimestamp()
        });
    } 
    // Version localStorage
    else if (window.AppState) {
        const tache = window.AppState.taches.find(t => t.id === parseInt(id));
        if (tache) {
            tache.statut = statut;
            tache.dateModification = new Date().toISOString();
            window.sauvegarderDansLocalStorage?.();
            window.synchroniserAvecDashboard?.();
            window.mettreAJourStatistiques?.();
            
            // Déclencher un événement pour mettre à jour l'affichage
            const event = new CustomEvent('tacheModifiee', { detail: { id, statut } });
            document.dispatchEvent(event);
        }
    }
}

/**
 * Met à jour la priorité d'une tâche
 */
async function mettreAJourPrioriteTache(id, priorite) {
    // Version Firebase
    if (window.TGNOVA_TACHES) {
        await firebase.firestore().collection('tasks').doc(id).update({
            priorite: priorite,
            dateModification: firebase.firestore.FieldValue.serverTimestamp()
        });
    }
    // Version localStorage
    else if (window.AppState) {
        const tache = window.AppState.taches.find(t => t.id === parseInt(id));
        if (tache) {
            tache.priorite = priorite;
            tache.dateModification = new Date().toISOString();
            window.sauvegarderDansLocalStorage?.();
            window.synchroniserAvecDashboard?.();
            
            // Déclencher un événement
            const event = new CustomEvent('tacheModifiee', { detail: { id, priorite } });
            document.dispatchEvent(event);
        }
    }
}

// ============================================
// RACCOURCIS CLAVIER
// ============================================

/**
 * Initialise les raccourcis clavier
 */
function initialiserRaccourcisClavier() {
    document.addEventListener('keydown', (e) => {
        // Ne pas activer si l'utilisateur tape dans un champ
        if (e.target.matches('input, textarea, select')) return;
        
        // Raccourci: 'N' pour nouvelle tâche
        if (e.key === 'n' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            if (window.TGNOVA_TACHES?.ouvrirModalTache) {
                window.TGNOVA_TACHES.ouvrirModalTache();
            } else if (window.ouvrirModal) {
                window.ouvrirModal();
            }
            afficherNotificationRapide('Création d\'une nouvelle tâche', 'info');
        }
        
        // Raccourci: 'F' pour focus recherche
        if (e.key === 'f' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            document.querySelector('.champ-recherche')?.focus();
        }
        
        // Raccourci: 'Ctrl+Enter' pour valider le formulaire
        if (e.key === 'Enter' && e.ctrlKey && ActionsRapides.preferences.entreePourValider) {
            const modalVisible = document.getElementById('modalTache')?.classList.contains('visible');
            if (modalVisible) {
                e.preventDefault();
                document.getElementById('sauvegarderTache')?.click();
            }
        }
        
        // Raccourci: 'Escape' pour fermer les menus
        if (e.key === 'Escape') {
            fermerTousMenusRapides();
            
            // Fermer les modales ouvertes
            const modalTache = document.getElementById('modalTache');
            if (modalTache?.classList.contains('visible')) {
                if (window.TGNOVA_TACHES?.fermerModalTache) {
                    window.TGNOVA_TACHES.fermerModalTache();
                } else if (window.fermerModal) {
                    window.fermerModal();
                }
            }
            
            const modalConfirmation = document.getElementById('modalConfirmation');
            if (modalConfirmation?.classList.contains('visible')) {
                if (window.TGNOVA_TACHES?.fermerModalConfirmation) {
                    window.TGNOVA_TACHES.fermerModalConfirmation();
                } else if (window.fermerModalConfirmation) {
                    window.fermerModalConfirmation();
                }
            }
        }
        
        // Mode action rapide: maintenir 'Shift'
        if (e.key === 'Shift') {
            ActionsRapides.modeActionRapide = true;
            document.body.classList.add('mode-action-rapide');
        }
    });
    
    document.addEventListener('keyup', (e) => {
        if (e.key === 'Shift') {
            ActionsRapides.modeActionRapide = false;
            document.body.classList.remove('mode-action-rapide');
        }
    });
}

// ============================================
// MENU CONTEXTUEL
// ============================================

/**
 * Initialise le menu contextuel
 */
function initialiserActionsContextuelles() {
    document.addEventListener('contextmenu', (e) => {
        const elementTache = e.target.closest('tr[data-id], .carte-tache[data-id]');
        if (!elementTache) return;
        
        e.preventDefault();
        
        const id = elementTache.dataset.id;
        afficherMenuContextuel(e.clientX, e.clientY, id);
    });
}

/**
 * Affiche le menu contextuel
 */
function afficherMenuContextuel(x, y, id) {
    // Fermer les anciens menus
    fermerTousMenusRapides();
    
    const menu = document.createElement('div');
    menu.className = 'menu-contextuel-rapide';
    menu.style.position = 'fixed';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.innerHTML = `
        <div class="menu-contextuel-item" onclick="marquerTacheRapide('${id}', 'terminee')">
            <i class="fas fa-check-circle"></i> Marquer terminée
        </div>
        <div class="menu-contextuel-item" onclick="marquerTacheRapide('${id}', 'en-cours')">
            <i class="fas fa-play-circle"></i> Commencer
        </div>
        <div class="menu-contextuel-item" onclick="reporterTacheRapide('${id}')">
            <i class="fas fa-calendar-plus"></i> Reporter à demain
        </div>
        <div class="menu-contextuel-separateur"></div>
        <div class="menu-contextuel-item" onclick="ouvrirMenuPriorite('${id}')">
            <i class="fas fa-flag"></i> Changer priorité
        </div>
        <div class="menu-contextuel-separateur"></div>
        <div class="menu-contextuel-item" onclick="ouvrirModalEdition('${id}')">
            <i class="fas fa-edit"></i> Modifier
        </div>
        <div class="menu-contextuel-item supprimer" onclick="ouvrirModalSuppression('${id}')">
            <i class="fas fa-trash"></i> Supprimer
        </div>
    `;
    
    document.body.appendChild(menu);
    
    // Ajuster la position si le menu dépasse
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
        menu.style.left = `${window.innerWidth - rect.width - 10}px`;
    }
    if (rect.bottom > window.innerHeight) {
        menu.style.top = `${window.innerHeight - rect.height - 10}px`;
    }
    
    // Fermer au clic ailleurs
    const fermerMenu = (e) => {
        if (!menu.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', fermerMenu);
        }
    };
    
    setTimeout(() => {
        document.addEventListener('click', fermerMenu);
    }, 100);
}

// ============================================
// DRAG AND DROP
// ============================================

/**
 * Initialise le drag and drop pour les tâches
 */
function initialiserDragAndDrop() {
    const conteneurTaches = document.querySelector('.vue-tableau-taches tbody, .grille-taches');
    if (!conteneurTaches) return;
    
    let elementDrag = null;
    
    conteneurTaches.addEventListener('dragstart', (e) => {
        const elementTache = e.target.closest('tr[data-id], .carte-tache[data-id]');
        if (!elementTache) return;
        
        elementDrag = elementTache;
        const id = elementTache.dataset.id;
        
        e.dataTransfer.setData('text/plain', id);
        e.dataTransfer.effectAllowed = 'move';
        
        elementTache.classList.add('en-cours-drag');
    });
    
    conteneurTaches.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    });
    
    conteneurTaches.addEventListener('drop', async (e) => {
        e.preventDefault();
        
        const elementCible = e.target.closest('tr[data-id], .carte-tache[data-id]');
        if (!elementCible || !elementDrag) return;
        
        const idDrag = elementDrag.dataset.id;
        const idCible = elementCible.dataset.id;
        
        if (idDrag === idCible) return;
        
        // Réorganiser les tâches (à implémenter selon le besoin)
        afficherNotificationRapide('Tâche déplacée', 'info');
        
        elementDrag.classList.remove('en-cours-drag');
        elementDrag = null;
    });
    
    conteneurTaches.addEventListener('dragend', () => {
        if (elementDrag) {
            elementDrag.classList.remove('en-cours-drag');
            elementDrag = null;
        }
    });
}

// ============================================
// CHARGEMENT DES PRÉFÉRENCES
// ============================================

/**
 * Charge les préférences des actions rapides
 */
function chargerPreferencesActions() {
    try {
        const preferences = localStorage.getItem('tgnova_preferences_actions');
        if (preferences) {
            ActionsRapides.preferences = {
                ...ActionsRapides.preferences,
                ...JSON.parse(preferences)
            };
        }
    } catch (error) {
        console.error('Erreur chargement préférences actions:', error);
    }
}

/**
 * Sauvegarde les préférences des actions rapides
 */
function sauvegarderPreferencesActions() {
    try {
        localStorage.setItem('tgnova_preferences_actions', 
            JSON.stringify(ActionsRapides.preferences));
    } catch (error) {
        console.error('Erreur sauvegarde préférences actions:', error);
    }
}

// ============================================
// OBSERVATEUR POUR NOUVELLES TÂCHES
// ============================================

/**
 * Observe l'ajout de nouvelles tâches
 */
function observerNouvellesTaches() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) {
                    if (node.matches('tr[data-id], .carte-tache[data-id]')) {
                        ajouterAttributsAccessibilite(node);
                    }
                    
                    const taches = node.querySelectorAll('tr[data-id], .carte-tache[data-id]');
                    taches.forEach(ajouterAttributsAccessibilite);
                }
            });
        });
    });
    
    const conteneurTaches = document.querySelector('.conteneur-taches');
    if (conteneurTaches) {
        observer.observe(conteneurTaches, {
            childList: true,
            subtree: true
        });
    }
}

/**
 * Ajoute des attributs d'accessibilité
 */
function ajouterAttributsAccessibilite(element) {
    if (!element.hasAttribute('role')) {
        element.setAttribute('role', 'button');
        element.setAttribute('tabindex', '0');
        element.setAttribute('aria-label', 'Tâche - Appuyez sur Entrée pour les actions rapides');
    }
}

// ============================================
// NOTIFICATIONS RAPIDES
// ============================================

/**
 * Affiche une notification rapide
 */
function afficherNotificationRapide(message, type = 'info') {
    // Utiliser le système existant si disponible
    if (window.afficherNotification) {
        window.afficherNotification(message, type);
        return;
    }
    
    // Sinon, créer une notification simple
    let container = document.getElementById('notificationsRapides');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notificationsRapides';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(container);
    }
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        background: white;
        color: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-size: 14px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideInRight 0.3s ease;
        border-left: 4px solid currentColor;
    `;
    
    const icon = type === 'success' ? 'check-circle' : 
                 type === 'error' ? 'exclamation-circle' : 'info-circle';
    
    notification.innerHTML = `
        <i class="fas fa-${icon}" style="color: currentColor;"></i>
        <span style="flex: 1; color: #1f2937;">${message}</span>
    `;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Ferme tous les menus rapides ouverts
 */
function fermerTousMenusRapides() {
    document.querySelectorAll('.menu-priorite-rapide, .actions-rapides-survol, .menu-contextuel-rapide').forEach(menu => {
        menu.remove();
    });
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

function obtenirLibelleStatut(statut) {
    const labels = {
        'a-faire': 'À faire',
        'en-cours': 'En cours',
        'terminee': 'Terminée'
    };
    return labels[statut] || statut;
}

function obtenirLibellePriorite(priorite) {
    const labels = {
        'haute': 'Haute',
        'moyenne': 'Moyenne',
        'basse': 'Basse'
    };
    return labels[priorite] || priorite;
}

// ============================================
// STYLES CSS
// ============================================

const styles = document.createElement('style');
styles.textContent = `
    /* Actions rapides au survol */
    .actions-rapides-survol {
        position: absolute;
        top: 50%;
        right: 10px;
        transform: translateY(-50%);
        display: flex;
        gap: 5px;
        background: white;
        padding: 5px;
        border-radius: 25px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.15);
        opacity: 0;
        transition: opacity 0.2s ease, transform 0.2s ease;
        z-index: 100;
        border: 1px solid #e5e7eb;
    }
    
    .actions-rapides-survol.visible {
        opacity: 1;
    }
    
    .action-rapide-btn {
        width: 32px;
        height: 32px;
        border: none;
        border-radius: 50%;
        background: #f3f4f6;
        color: #4b5563;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        font-size: 14px;
    }
    
    .action-rapide-btn:hover {
        transform: scale(1.1);
    }
    
    .action-rapide-btn.terminer:hover {
        background: #10b981;
        color: white;
    }
    
    .action-rapide-btn.demarrer:hover {
        background: #3b82f6;
        color: white;
    }
    
    .action-rapide-btn.reporter:hover {
        background: #f59e0b;
        color: white;
    }
    
    .action-rapide-btn.priorite:hover {
        background: #8b5cf6;
        color: white;
    }
    
    .action-rapide-btn.editer:hover {
        background: #3b82f6;
        color: white;
    }
    
    .action-rapide-btn.supprimer:hover {
        background: #ef4444;
        color: white;
    }
    
    .separateur-actions {
        width: 1px;
        height: 20px;
        background: #e5e7eb;
        margin: 0 2px;
    }
    
    /* Menu priorité rapide */
    .menu-priorite-rapide {
        position: absolute;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        padding: 5px 0;
        z-index: 200;
        min-width: 120px;
        opacity: 0;
        transition: opacity 0.2s ease;
        border: 1px solid #e5e7eb;
    }
    
    .menu-priorite-rapide.visible {
        opacity: 1;
    }
    
    .option-priorite {
        padding: 8px 15px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: background 0.2s;
        font-size: 13px;
    }
    
    .option-priorite:hover {
        background: #f3f4f6;
    }
    
    .option-priorite.haute i { color: #ef4444; }
    .option-priorite.moyenne i { color: #f59e0b; }
    .option-priorite.basse i { color: #10b981; }
    
    /* Menu contextuel */
    .menu-contextuel-rapide {
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        padding: 5px 0;
        z-index: 1000;
        min-width: 200px;
        animation: fadeIn 0.2s ease;
        border: 1px solid #e5e7eb;
    }
    
    .menu-contextuel-item {
        padding: 10px 15px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 10px;
        transition: background 0.2s;
        font-size: 14px;
    }
    
    .menu-contextuel-item:hover {
        background: #f3f4f6;
    }
    
    .menu-contextuel-item.supprimer:hover {
        background: #fee2e2;
        color: #dc2626;
    }
    
    .menu-contextuel-separateur {
        height: 1px;
        background: #e5e7eb;
        margin: 5px 0;
    }
    
    /* Mode action rapide */
    .mode-action-rapide [data-id] {
        cursor: crosshair !important;
    }
    
    /* Drag and drop */
    .en-cours-drag {
        opacity: 0.5;
        transform: scale(0.98);
        transition: all 0.2s ease;
    }
    
    /* État reporté */
    .date-echeance.reporte {
        animation: pulse 1s ease;
        color: #f59e0b;
        font-weight: 500;
    }
    
    /* Animations */
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); background: #fef3c7; border-radius: 4px; }
    }
`;

document.head.appendChild(styles);

// ============================================
// ÉCOUTEURS D'ÉVÉNEMENTS GLOBAUX
// ============================================

// Écouter les événements de modification de tâches
document.addEventListener('tacheModifiee', (e) => {
    console.log('Tâche modifiée:', e.detail);
    // Rafraîchir l'affichage si nécessaire
});

// Écouter les clics en dehors des menus pour les fermer
document.addEventListener('click', (e) => {
    if (!e.target.closest('.menu-priorite-rapide, .actions-rapides-survol, .menu-contextuel-rapide')) {
        fermerTousMenusRapides();
    }
});


// ============================================
// EXPOSITION DES FONCTIONS GLOBALES
// ============================================

window.ActionsRapides = ActionsRapides;
window.initialiserActionsRapides = initialiserActionsRapides;
window.marquerTacheRapide = marquerTacheRapide;
window.reporterTacheRapide = reporterTacheRapide;
window.ouvrirMenuPriorite = ouvrirMenuPriorite;
window.changerPrioriteAvecValeur = changerPrioriteAvecValeur;
window.ouvrirModalEdition = ouvrirModalEdition;
window.ouvrirModalSuppression = ouvrirModalSuppression;
window.fermerTousMenusRapides = fermerTousMenusRapides;
window.afficherNotificationRapide = afficherNotificationRapide;

// Initialisation automatique
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialiserActionsRapides);
} else {
    initialiserActionsRapides();
}

console.log('⚡ Module actions rapides amélioré chargé - Gestion complète des modales');