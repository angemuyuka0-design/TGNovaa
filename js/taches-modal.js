/**
 * GESTION DES MODALES POUR LES TÂCHES
 * Formulaire de création et d'édition des tâches
 */

// ============================================
// VARIABLES GLOBALES DE LA MODALE
// ============================================

let modalTacheInstance = null;
let tacheEnEdition = null;

// ============================================
// CRÉATION DE LA MODALE
// ============================================

/**
 * Crée la modale de tâche si elle n'existe pas
 */
function creerModalTache() {
    if (document.getElementById('modalNouvelleTache')) return;

    const modalHTML = `
        <div class="modal-overlay" id="modalNouvelleTache">
            <div class="modal" style="max-width: 600px;">
                <div class="modal-header">
                    <h2 id="modalTitreTache">
                        <i class="fas fa-plus-circle"></i>
                        <span>Nouvelle Tâche</span>
                    </h2>
                    <button class="modal-close" id="fermerModalTacheBtn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-content">
                    <form id="formNouvelleTache" onsubmit="event.preventDefault();">
                        <!-- Titre -->
                        <div class="form-group">
                            <label for="titreTache" class="form-label">
                                <i class="fas fa-heading"></i>
                                Titre de la tâche <span class="requis">*</span>
                            </label>
                            <input type="text" 
                                   id="titreTache" 
                                   class="form-input" 
                                   placeholder="Ex: Finaliser le rapport mensuel" 
                                   required 
                                   maxlength="100"
                                   autocomplete="off">
                            <div class="aide-saisie" id="aideTitre">
                                <i class="fas fa-info-circle"></i>
                                <span>Minimum 3 caractères</span>
                            </div>
                        </div>

                        <!-- Description -->
                        <div class="form-group">
                            <label for="descriptionTache" class="form-label">
                                <i class="fas fa-align-left"></i>
                                Description
                            </label>
                            <textarea id="descriptionTache" 
                                      class="form-textarea" 
                                      placeholder="Décrivez les détails de la tâche..." 
                                      rows="4"
                                      maxlength="500"></textarea>
                            <div class="compteur-caracteres" id="compteurDescription">0/500</div>
                        </div>

                        <!-- Projet et Priorité -->
                        <div class="form-row">
                            <div class="form-group">
                                <label for="projetTache" class="form-label">
                                    <i class="fas fa-folder"></i>
                                    Projet
                                </label>
                                <div class="selecteur-personnalise">
                                    <select id="projetTache" class="form-select">
                                        <option value="Général">📋 Général</option>
                                        <option value="Analyse">📊 Analyse</option>
                                        <option value="Développement">💻 Développement</option>
                                        <option value="Marketing">📢 Marketing</option>
                                        <option value="Design">🎨 Design</option>
                                        <option value="Support">🛠️ Support</option>
                                    </select>
                                    <i class="fas fa-chevron-down icone-selecteur"></i>
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="prioriteTache" class="form-label">
                                    <i class="fas fa-flag"></i>
                                    Priorité
                                </label>
                                <div class="selecteur-priorite">
                                    <div class="option-priorite" data-priorite="basse" id="optionPrioriteBasse">
                                        <span class="indicateur-priorite basse"></span>
                                        <span>Basse</span>
                                    </div>
                                    <div class="option-priorite active" data-priorite="moyenne" id="optionPrioriteMoyenne">
                                        <span class="indicateur-priorite moyenne"></span>
                                        <span>Moyenne</span>
                                    </div>
                                    <div class="option-priorite" data-priorite="haute" id="optionPrioriteHaute">
                                        <span class="indicateur-priorite haute"></span>
                                        <span>Haute</span>
                                    </div>
                                    <select id="prioriteTache" class="form-select" style="display: none;">
                                        <option value="basse">Basse</option>
                                        <option value="moyenne" selected>Moyenne</option>
                                        <option value="haute">Haute</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- Statut et Échéance -->
                        <div class="form-row">
                            <div class="form-group">
                                <label for="statutTache" class="form-label">
                                    <i class="fas fa-tasks"></i>
                                    Statut
                                </label>
                                <div class="selecteur-statut">
                                    <div class="statut-option" data-statut="a-faire" id="statutAFaire">
                                        <span class="statut-indicateur a-faire"></span>
                                        <span>À faire</span>
                                    </div>
                                    <div class="statut-option" data-statut="en-cours" id="statutEnCours">
                                        <span class="statut-indicateur en-cours"></span>
                                        <span>En cours</span>
                                    </div>
                                    <div class="statut-option" data-statut="terminee" id="statutTerminee">
                                        <span class="statut-indicateur terminee"></span>
                                        <span>Terminée</span>
                                    </div>
                                    <select id="statutTache" class="form-select" style="display: none;">
                                        <option value="a-faire">À faire</option>
                                        <option value="en-cours">En cours</option>
                                        <option value="terminee">Terminée</option>
                                    </select>
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="echeanceTache" class="form-label">
                                    <i class="fas fa-calendar-alt"></i>
                                    Échéance
                                </label>
                                <div class="selecteur-date">
                                    <input type="date" id="echeanceTache" class="form-input">
                                    <button type="button" class="bouton-date-rapide" id="dateAujourdhui" title="Aujourd'hui">
                                        <i class="fas fa-calendar-day"></i>
                                    </button>
                                    <button type="button" class="bouton-date-rapide" id="dateDemain" title="Demain">
                                        <i class="fas fa-calendar-plus"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Assignation -->
                        <div class="form-group">
                            <label for="assignationTache" class="form-label">
                                <i class="fas fa-user"></i>
                                Assigner à
                            </label>
                            <div class="selecteur-assigne">
                                <input type="text" 
                                       id="assignationTache" 
                                       class="form-input" 
                                       placeholder="Nom de la personne assignée"
                                       value="John Doe"
                                       list="utilisateursRecents">
                                <datalist id="utilisateursRecents">
                                    <option value="John Doe">
                                    <option value="Jane Smith">
                                    <option value="Alice Johnson">
                                </datalist>
                            </div>
                        </div>

                        <!-- Options supplémentaires (pliables) -->
                        <div class="options-supplementaires">
                            <div class="en-tete-options" id="toggleOptions">
                                <i class="fas fa-chevron-down" id="iconeChevron"></i>
                                <span>Options avancées</span>
                            </div>
                            <div class="contenu-options" id="contenuOptions">
                                <!-- Tags -->
                                <div class="form-group">
                                    <label class="form-label">
                                        <i class="fas fa-tags"></i>
                                        Tags
                                    </label>
                                    <div class="selecteur-tags">
                                        <input type="text" 
                                               id="tagsTache" 
                                               class="form-input" 
                                               placeholder="Ajouter des tags (séparés par des virgules)">
                                        <div class="tags-recents">
                                            <span class="tag-recent" data-tag="urgent">urgent</span>
                                            <span class="tag-recent" data-tag="important">important</span>
                                            <span class="tag-recent" data-tag="révision">révision</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Rappel -->
                                <div class="form-group">
                                    <label class="form-label">
                                        <i class="fas fa-bell"></i>
                                        Rappel
                                    </label>
                                    <div class="selecteur-rappel">
                                        <select id="rappelTache" class="form-select">
                                            <option value="">Pas de rappel</option>
                                            <option value="15min">15 minutes avant</option>
                                            <option value="30min">30 minutes avant</option>
                                            <option value="1h">1 heure avant</option>
                                            <option value="2h">2 heures avant</option>
                                            <option value="1j">1 jour avant</option>
                                        </select>
                                    </div>
                                </div>

                                <!-- Sous-tâches (simplifié) -->
                                <div class="form-group">
                                    <label class="form-label">
                                        <i class="fas fa-list-ul"></i>
                                        Sous-tâches
                                    </label>
                                    <div class="liste-sous-taches" id="listeSousTaches">
                                        <div class="sous-tache-exemple">
                                            <i class="far fa-square"></i>
                                            <span>Cliquez pour ajouter des sous-tâches</span>
                                        </div>
                                    </div>
                                    <button type="button" class="btn-ajouter-sous-tache" id="ajouterSousTache">
                                        <i class="fas fa-plus"></i> Ajouter une sous-tâche
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>

                    <!-- Aperçu rapide -->
                    <div class="apercu-rapide" id="apercuRapide">
                        <h4>
                            <i class="fas fa-eye"></i>
                            Aperçu
                        </h4>
                        <div class="carte-apercu" id="carteApercu">
                            <div class="en-tete-apercu" id="enTeteApercu">
                                <i class="fas fa-tasks" id="iconeApercu"></i>
                                <span id="titreApercu">Nouvelle tâche</span>
                            </div>
                            <div class="corps-apercu">
                                <div class="badges-apercu">
                                    <span class="badge-apercu projet" id="projetApercu">📋 Général</span>
                                    <span class="badge-apercu priorite moyenne" id="prioriteApercu">Moyenne</span>
                                    <span class="badge-apercu statut a-faire" id="statutApercu">À faire</span>
                                </div>
                                <div class="date-apercu" id="dateApercu">
                                    <i class="fas fa-calendar-alt"></i>
                                    <span>Aujourd'hui</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn-secondary" id="annulerModalTacheBtn">
                        <i class="fas fa-times"></i>
                        Annuler
                    </button>
                    <button type="button" class="btn-primary" id="sauvegarderTacheBtn">
                        <i class="fas fa-save"></i>
                        <span id="texteBoutonSauvegarder">Créer la tâche</span>
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    initialiserEvenementsModal();
    initialiserApercuTempsReel();
    modalTacheInstance = document.getElementById('modalNouvelleTache');
}

// ============================================
// INITIALISATION DES ÉVÉNEMENTS DE LA MODALE
// ============================================

/**
 * Initialise tous les événements de la modale
 */
function initialiserEvenementsModal() {
    // Fermeture de la modale
    const fermerBtn = document.getElementById('fermerModalTacheBtn');
    const annulerBtn = document.getElementById('annulerModalTacheBtn');
    const modal = document.getElementById('modalNouvelleTache');

    if (fermerBtn) {
        fermerBtn.addEventListener('click', fermerModalTache);
    }

    if (annulerBtn) {
        annulerBtn.addEventListener('click', fermerModalTache);
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                fermerModalTache();
            }
        });
    }

    // Sauvegarde
    const sauvegarderBtn = document.getElementById('sauvegarderTacheBtn');
    if (sauvegarderBtn) {
        sauvegarderBtn.addEventListener('click', () => {
            if (tacheEnEdition) {
                mettreAJourTacheExistante();
            } else {
                creerNouvelleTache();
            }
        });
    }

    // Compteur de caractères pour la description
    const description = document.getElementById('descriptionTache');
    const compteur = document.getElementById('compteurDescription');
    
    if (description && compteur) {
        description.addEventListener('input', () => {
            const longueur = description.value.length;
            compteur.textContent = `${longueur}/500`;
            
            if (longueur > 450) {
                compteur.style.color = '#ef4444';
            } else if (longueur > 400) {
                compteur.style.color = '#f59e0b';
            } else {
                compteur.style.color = 'var(--gris-500)';
            }
        });
    }

    // Sélecteur de priorité personnalisé
    const optionsPriorite = document.querySelectorAll('.option-priorite');
    const selectPriorite = document.getElementById('prioriteTache');

    optionsPriorite.forEach(option => {
        option.addEventListener('click', () => {
            optionsPriorite.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            
            const priorite = option.dataset.priorite;
            if (selectPriorite) {
                selectPriorite.value = priorite;
                selectPriorite.dispatchEvent(new Event('change'));
            }
        });
    });

    // Sélecteur de statut personnalisé
    const optionsStatut = document.querySelectorAll('.statut-option');
    const selectStatut = document.getElementById('statutTache');

    optionsStatut.forEach(option => {
        option.addEventListener('click', () => {
            optionsStatut.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            
            const statut = option.dataset.statut;
            if (selectStatut) {
                selectStatut.value = statut;
                selectStatut.dispatchEvent(new Event('change'));
            }
        });
    });

    // Dates rapides
    const dateAujourdhui = document.getElementById('dateAujourdhui');
    const dateDemain = document.getElementById('dateDemain');
    const inputDate = document.getElementById('echeanceTache');

    if (dateAujourdhui && inputDate) {
        dateAujourdhui.addEventListener('click', () => {
            const aujourdhui = new Date().toISOString().split('T')[0];
            inputDate.value = aujourdhui;
            inputDate.dispatchEvent(new Event('change'));
        });
    }

    if (dateDemain && inputDate) {
        dateDemain.addEventListener('click', () => {
            const demain = new Date();
            demain.setDate(demain.getDate() + 1);
            inputDate.value = demain.toISOString().split('T')[0];
            inputDate.dispatchEvent(new Event('change'));
        });
    }

    // Toggle options avancées
    const toggleOptions = document.getElementById('toggleOptions');
    const contenuOptions = document.getElementById('contenuOptions');
    const iconeChevron = document.getElementById('iconeChevron');

    if (toggleOptions && contenuOptions) {
        toggleOptions.addEventListener('click', () => {
            contenuOptions.classList.toggle('visible');
            if (iconeChevron) {
                iconeChevron.classList.toggle('fa-chevron-down');
                iconeChevron.classList.toggle('fa-chevron-up');
            }
        });
    }

    // Tags récents
    document.querySelectorAll('.tag-recent').forEach(tag => {
        tag.addEventListener('click', () => {
            const inputTags = document.getElementById('tagsTache');
            if (inputTags) {
                const tagsActuels = inputTags.value ? inputTags.value.split(',').map(t => t.trim()) : [];
                const nouveauTag = tag.dataset.tag;
                
                if (!tagsActuels.includes(nouveauTag)) {
                    tagsActuels.push(nouveauTag);
                    inputTags.value = tagsActuels.join(', ');
                }
            }
        });
    });

    // Ajouter sous-tâche
    const ajouterSousTache = document.getElementById('ajouterSousTache');
    if (ajouterSousTache) {
        ajouterSousTache.addEventListener('click', () => {
            const liste = document.getElementById('listeSousTaches');
            if (liste) {
                const exemple = liste.querySelector('.sous-tache-exemple');
                if (exemple) exemple.remove();

                const nouvelleSousTache = document.createElement('div');
                nouvelleSousTache.className = 'sous-tache-item';
                nouvelleSousTache.innerHTML = `
                    <i class="far fa-square"></i>
                    <input type="text" class="input-sous-tache" placeholder="Nouvelle sous-tâche" maxlength="100">
                    <button type="button" class="supprimer-sous-tache">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                liste.appendChild(nouvelleSousTache);

                const input = nouvelleSousTache.querySelector('.input-sous-tache');
                if (input) {
                    input.focus();
                    input.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            ajouterSousTache.click();
                        }
                    });
                }

                const supprimerBtn = nouvelleSousTache.querySelector('.supprimer-sous-tache');
                if (supprimerBtn) {
                    supprimerBtn.addEventListener('click', () => {
                        nouvelleSousTache.remove();
                        if (liste.children.length === 0) {
                            liste.innerHTML = '<div class="sous-tache-exemple"><i class="far fa-square"></i><span>Cliquez pour ajouter des sous-tâches</span></div>';
                        }
                    });
                }
            }
        });
    }

    // Échap pour fermer
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalTacheInstance?.classList.contains('visible')) {
            fermerModalTache();
        }
    });
}

// ============================================
// APERÇU EN TEMPS RÉEL
// ============================================

/**
 * Initialise l'aperçu en temps réel du formulaire
 */
function initialiserApercuTempsReel() {
    const inputs = [
        { element: 'titreTache', cible: 'titreApercu', transform: (val) => val || 'Nouvelle tâche' },
        { element: 'projetTache', cible: 'projetApercu', transform: (val) => {
            const icones = {
                'Général': '📋',
                'Analyse': '📊',
                'Développement': '💻',
                'Marketing': '📢',
                'Design': '🎨',
                'Support': '🛠️'
            };
            return `${icones[val] || '📋'} ${val || 'Général'}`;
        }},
        { element: 'prioriteTache', cible: 'prioriteApercu', transform: (val) => {
            const classes = {
                'basse': 'basse',
                'moyenne': 'moyenne',
                'haute': 'haute'
            };
            const element = document.getElementById('prioriteApercu');
            if (element) {
                element.className = `badge-apercu priorite ${classes[val] || 'moyenne'}`;
            }
            return obtenirLibellePriorite(val);
        }},
        { element: 'statutTache', cible: 'statutApercu', transform: (val) => {
            const classes = {
                'a-faire': 'a-faire',
                'en-cours': 'en-cours',
                'terminee': 'terminee'
            };
            const element = document.getElementById('statutApercu');
            if (element) {
                element.className = `badge-apercu statut ${classes[val] || 'a-faire'}`;
            }
            return obtenirLibelleStatut(val);
        }},
        { element: 'echeanceTache', cible: 'dateApercu', transform: (val) => {
            if (!val) return 'Non définie';
            const date = new Date(val);
            const aujourdhui = new Date();
            aujourdhui.setHours(0, 0, 0, 0);
            
            const dateCompare = new Date(date);
            dateCompare.setHours(0, 0, 0, 0);
            
            const diffJours = Math.round((dateCompare - aujourdhui) / (1000 * 60 * 60 * 24));
            
            if (diffJours === 0) return "Aujourd'hui";
            if (diffJours === 1) return "Demain";
            if (diffJours === -1) return "Hier";
            
            return date.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long'
            });
        }}
    ];

    inputs.forEach(({ element, cible, transform }) => {
        const input = document.getElementById(element);
        if (input) {
            input.addEventListener('input', () => {
                const cibleElement = document.getElementById(cible);
                if (cibleElement) {
                    cibleElement.textContent = transform(input.value);
                }
            });
            
            input.addEventListener('change', () => {
                const cibleElement = document.getElementById(cible);
                if (cibleElement) {
                    cibleElement.textContent = transform(input.value);
                }
            });
        }
    });

    // Couleur de l'en-tête selon la priorité
    const selectPriorite = document.getElementById('prioriteTache');
    const enTeteApercu = document.getElementById('enTeteApercu');

    if (selectPriorite && enTeteApercu) {
        selectPriorite.addEventListener('change', () => {
            const priorite = selectPriorite.value;
            enTeteApercu.className = `en-tete-apercu ${priorite}`;
        });
    }
}

// ============================================
// OUVERTURE ET FERMETURE DE LA MODALE
// ============================================

/**
 * Ouvre la modale de création de tâche
 * @param {Object} tacheExistante - Optionnel, pour le mode édition
 */
function ouvrirModalTache(tacheExistante = null) {
    creerModalTache();
    
    if (!modalTacheInstance) return;
    
    // Réinitialiser le formulaire
    const formulaire = document.getElementById('formNouvelleTache');
    const titreModal = document.getElementById('modalTitreTache');
    const texteBouton = document.getElementById('texteBoutonSauvegarder');
    
    if (formulaire) formulaire.reset();
    
    // Réinitialiser les sélecteurs personnalisés
    document.querySelectorAll('.option-priorite').forEach(opt => {
        opt.classList.remove('active');
    });
    document.getElementById('optionPrioriteMoyenne')?.classList.add('active');
    
    document.querySelectorAll('.statut-option').forEach(opt => {
        opt.classList.remove('active');
    });
    document.getElementById('statutAFaire')?.classList.add('active');
    
    // Réinitialiser l'aperçu
    const enTeteApercu = document.getElementById('enTeteApercu');
    if (enTeteApercu) {
        enTeteApercu.className = 'en-tete-apercu moyenne';
    }
    
    // Réinitialiser les sous-tâches
    const listeSousTaches = document.getElementById('listeSousTaches');
    if (listeSousTaches) {
        listeSousTaches.innerHTML = '<div class="sous-tache-exemple"><i class="far fa-square"></i><span>Cliquez pour ajouter des sous-tâches</span></div>';
    }
    
    // Valeurs par défaut
    const aujourdhui = new Date().toISOString().split('T')[0];
    const inputDate = document.getElementById('echeanceTache');
    if (inputDate) inputDate.value = aujourdhui;
    
    const assignation = document.getElementById('assignationTache');
    if (assignation && window.utilisateurConnecte) {
        assignation.value = window.utilisateurConnecte.nom || 'John Doe';
    }
    
    // Mode édition
    if (tacheExistante) {
        tacheEnEdition = tacheExistante;
        if (titreModal) {
            titreModal.innerHTML = '<i class="fas fa-edit"></i> Modifier la tâche';
        }
        if (texteBouton) {
            texteBouton.textContent = 'Mettre à jour';
        }
        remplirFormulaireEdition(tacheExistante);
    } else {
        tacheEnEdition = null;
        if (titreModal) {
            titreModal.innerHTML = '<i class="fas fa-plus-circle"></i> Nouvelle Tâche';
        }
        if (texteBouton) {
            texteBouton.textContent = 'Créer la tâche';
        }
    }
    
    // Afficher la modale
    modalTacheInstance.classList.add('visible');
    document.body.style.overflow = 'hidden';
    
    // Focus sur le titre
    setTimeout(() => {
        document.getElementById('titreTache')?.focus();
    }, 100);
    
    // Déclencher les événements pour mettre à jour l'aperçu
    document.getElementById('titreTache')?.dispatchEvent(new Event('input'));
    document.getElementById('projetTache')?.dispatchEvent(new Event('change'));
    document.getElementById('prioriteTache')?.dispatchEvent(new Event('change'));
    document.getElementById('statutTache')?.dispatchEvent(new Event('change'));
    document.getElementById('echeanceTache')?.dispatchEvent(new Event('change'));
}

/**
 * Remplit le formulaire pour l'édition
 */
function remplirFormulaireEdition(tache) {
    document.getElementById('titreTache').value = tache.titre || '';
    document.getElementById('descriptionTache').value = tache.description || '';
    document.getElementById('projetTache').value = tache.projet || 'Général';
    
    // Priorité
    const priorite = tache.priorite || 'moyenne';
    document.getElementById('prioriteTache').value = priorite;
    document.querySelectorAll('.option-priorite').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.priorite === priorite);
    });
    
    // Statut
    const statut = tache.statut || 'a-faire';
    document.getElementById('statutTache').value = statut;
    document.querySelectorAll('.statut-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.statut === statut);
    });
    
    // Échéance
    if (tache.echeance) {
        const date = new Date(tache.echeance);
        document.getElementById('echeanceTache').value = date.toISOString().split('T')[0];
    }
    
    // Assignation
    document.getElementById('assignationTache').value = tache.assigne || '';
    
    // Tags (si présents)
    if (tache.tags && Array.isArray(tache.tags)) {
        document.getElementById('tagsTache').value = tache.tags.join(', ');
    }
    
    // Sous-tâches (si présentes)
    if (tache.sousTaches && Array.isArray(tache.sousTaches) && tache.sousTaches.length > 0) {
        const liste = document.getElementById('listeSousTaches');
        if (liste) {
            liste.innerHTML = '';
            tache.sousTaches.forEach(st => {
                const item = document.createElement('div');
                item.className = 'sous-tache-item';
                item.innerHTML = `
                    <i class="far fa-square"></i>
                    <input type="text" class="input-sous-tache" value="${st}" maxlength="100">
                    <button type="button" class="supprimer-sous-tache">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                liste.appendChild(item);
            });
        }
    }
}

/**
 * Ferme la modale de tâche
 */
function fermerModalTache() {
    if (modalTacheInstance) {
        modalTacheInstance.classList.remove('visible');
        document.body.style.overflow = '';
        tacheEnEdition = null;
        
        // Nettoyer les écouteurs temporaires si nécessaire
        const formulaire = document.getElementById('formNouvelleTache');
        if (formulaire) formulaire.reset();
    }
}

// ============================================
// ACTIONS SUR LES TÂCHES
// ============================================

/**
 * Crée une nouvelle tâche
 */
async function creerNouvelleTache() {
    // Validation du formulaire
    const titre = document.getElementById('titreTache').value.trim();
    if (!titre) {
        afficherNotificationV('Le titre est obligatoire', 'erreur');
        document.getElementById('titreTache').focus();
        return;
    }
    
    // Récupérer les valeurs
    const tache = {
        titre: titre,
        description: document.getElementById('descriptionTache').value.trim(),
        projet: document.getElementById('projetTache').value,
        priorite: document.getElementById('prioriteTache').value,
        statut: document.getElementById('statutTache').value,
        echeance: document.getElementById('echeanceTache').value || null,
        assigne: document.getElementById('assignationTache').value.trim() || 'John Doe',
        dateCreation: new Date().toISOString(),
        dateModification: new Date().toISOString(),
        completee: document.getElementById('statutTache').value === 'terminee'
    };
    
    // Tags
    const tagsInput = document.getElementById('tagsTache');
    if (tagsInput && tagsInput.value.trim()) {
        tache.tags = tagsInput.value.split(',').map(t => t.trim()).filter(t => t);
    }
    
    // Sous-tâches
    const sousTaches = [];
    document.querySelectorAll('#listeSousTaches .input-sous-tache').forEach(input => {
        if (input.value.trim()) {
            sousTaches.push(input.value.trim());
        }
    });
    if (sousTaches.length > 0) {
        tache.sousTaches = sousTaches;
    }
    
    // Utiliser la fonction du dashboard ou de taches-firebase
    if (window.TGNOVA && window.TGNOVA.sauvegarderNouvelleTache) {
        await window.TGNOVA.sauvegarderNouvelleTache(tache);
    } else if (window.sauvegarderNouvelleTache) {
        await window.sauvegarderNouvelleTache(tache);
    } else {
        console.log('Tâche à créer:', tache);
        afficherNotificationV('Tâche créée avec succès (simulation)', 'succes');
    }
    
    fermerModalTache();
}

/**
 * Met à jour une tâche existante
 */
async function mettreAJourTacheExistante() {
    if (!tacheEnEdition) return;
    
    // Validation
    const titre = document.getElementById('titreTache').value.trim();
    if (!titre) {
        afficherNotificationV('Le titre est obligatoire', 'erreur');
        document.getElementById('titreTache').focus();
        return;
    }
    
    // Récupérer les valeurs mises à jour
    const misesAJour = {
        titre: titre,
        description: document.getElementById('descriptionTache').value.trim(),
        projet: document.getElementById('projetTache').value,
        priorite: document.getElementById('prioriteTache').value,
        statut: document.getElementById('statutTache').value,
        echeance: document.getElementById('echeanceTache').value || null,
        assigne: document.getElementById('assignationTache').value.trim() || 'John Doe',
        dateModification: new Date().toISOString(),
        completee: document.getElementById('statutTache').value === 'terminee'
    };
    
    // Tags
    const tagsInput = document.getElementById('tagsTache');
    if (tagsInput && tagsInput.value.trim()) {
        misesAJour.tags = tagsInput.value.split(',').map(t => t.trim()).filter(t => t);
    }
    
    // Sous-tâches
    const sousTaches = [];
    document.querySelectorAll('#listeSousTaches .input-sous-tache').forEach(input => {
        if (input.value.trim()) {
            sousTaches.push(input.value.trim());
        }
    });
    if (sousTaches.length > 0) {
        misesAJour.sousTaches = sousTaches;
    }
    
    // Utiliser la fonction appropriée
    if (window.mettreAJourTache) {
        await window.mettreAJourTache(tacheEnEdition.id, misesAJour);
    } else {
        console.log('Tâche mise à jour:', tacheEnEdition.id, misesAJour);
        afficherNotificationV('Tâche mise à jour avec succès (simulation)', 'succes');
    }
    
    fermerModalTache();
}

// ============================================
// NOTIFICATIONS
// ============================================

/**
 * Affiche une notification (version pour la modale)
 */
function afficherNotificationV(message, type = 'info') {
    if (window.TGNOVA && window.TGNOVA.afficherToast) {
        window.TGNOVA.afficherToast(message, type);
    } else if (window.afficherToast) {
        window.afficherToast(message, type);
    } else {
        console.log(`[${type}] ${message}`);
    }
}

// ============================================
// UTILITAIRES
// ============================================

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

// ============================================
// STYLES ADDITIONNELS POUR LA MODALE
// ============================================

const styleModalTache = document.createElement('style');
styleModalTache.textContent = `
    /* Styles spécifiques à la modale de tâche */
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
    
    .modal-overlay.visible {
        display: flex;
    }
    
    .modal {
        background: var(--blanc);
        border-radius: var(--rayon-xl);
        width: 90%;
        max-width: 600px;
        max-height: 90vh;
        overflow-y: auto;
        transform: translateY(20px);
        transition: transform 0.3s ease;
        box-shadow: var(--ombre-extreme);
    }
    
    .modal-overlay.visible .modal {
        transform: translateY(0);
    }
    
    .modal-header {
        padding: 1.5rem;
        border-bottom: 1px solid var(--gris-200);
        display: flex;
        align-items: center;
        justify-content: space-between;
        position: sticky;
        top: 0;
        background: var(--blanc);
        z-index: 10;
        border-radius: var(--rayon-xl) var(--rayon-xl) 0 0;
    }
    
    .modal-header h2 {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--gris-900);
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    
    .modal-header h2 i {
        color: var(--bleu-principal);
    }
    
    .modal-close {
        background: none;
        border: none;
        color: var(--gris-500);
        cursor: pointer;
        padding: 0.5rem;
        border-radius: var(--rayon-md);
        transition: var(--transition-rapide);
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .modal-close:hover {
        background: var(--gris-100);
        color: var(--rouge);
    }
    
    .modal-content {
        padding: 1.5rem;
    }
    
    .modal-footer {
        padding: 1.5rem;
        border-top: 1px solid var(--gris-200);
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        position: sticky;
        bottom: 0;
        background: var(--blanc);
        border-radius: 0 0 var(--rayon-xl) var(--rayon-xl);
    }
    
    /* Formulaires */
    .form-group {
        margin-bottom: 1.5rem;
    }
    
    .form-label {
        display: block;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--gris-700);
        margin-bottom: 0.5rem;
    }
    
    .form-label i {
        margin-right: 0.5rem;
        color: var(--bleu-principal);
        width: 16px;
    }
    
    .requis {
        color: var(--rouge);
        margin-left: 0.25rem;
    }
    
    .form-input, .form-textarea, .form-select {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 1px solid var(--gris-300);
        border-radius: var(--rayon-md);
        font-size: 0.875rem;
        color: var(--gris-800);
        background: var(--blanc);
        transition: var(--transition-rapide);
    }
    
    .form-input:focus, .form-textarea:focus, .form-select:focus {
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
    
    /* Aide à la saisie */
    .aide-saisie {
        font-size: 0.75rem;
        color: var(--gris-500);
        margin-top: 0.25rem;
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }
    
    .aide-saisie i {
        font-size: 0.75rem;
    }
    
    .compteur-caracteres {
        text-align: right;
        font-size: 0.75rem;
        color: var(--gris-500);
        margin-top: 0.25rem;
    }
    
    /* Sélecteur de priorité personnalisé */
    .selecteur-priorite {
        display: flex;
        gap: 0.5rem;
        background: var(--gris-50);
        padding: 0.25rem;
        border-radius: var(--rayon-lg);
        border: 1px solid var(--gris-200);
    }
    
    .option-priorite {
        flex: 1;
        padding: 0.5rem;
        text-align: center;
        border-radius: var(--rayon-md);
        cursor: pointer;
        transition: var(--transition-rapide);
        font-size: 0.875rem;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
    }
    
    .indicateur-priorite {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        display: inline-block;
    }
    
    .indicateur-priorite.basse {
        background: var(--vert);
    }
    
    .indicateur-priorite.moyenne {
        background: var(--orange);
    }
    
    .indicateur-priorite.haute {
        background: var(--rouge);
    }
    
    .option-priorite:hover {
        background: var(--gris-200);
    }
    
    .option-priorite.active {
        background: var(--blanc);
        box-shadow: var(--ombre-legere);
        font-weight: 600;
    }
    
    .option-priorite.active.basse {
        color: var(--vert);
    }
    
    .option-priorite.active.moyenne {
        color: var(--orange);
    }
    
    .option-priorite.active.haute {
        color: var(--rouge);
    }
    
    /* Sélecteur de statut personnalisé */
    .selecteur-statut {
        display: flex;
        gap: 0.5rem;
        background: var(--gris-50);
        padding: 0.25rem;
        border-radius: var(--rayon-lg);
        border: 1px solid var(--gris-200);
    }
    
    .statut-option {
        flex: 1;
        padding: 0.5rem;
        text-align: center;
        border-radius: var(--rayon-md);
        cursor: pointer;
        transition: var(--transition-rapide);
        font-size: 0.875rem;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
    }
    
    .statut-indicateur {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        display: inline-block;
    }
    
    .statut-indicateur.a-faire {
        background: var(--orange);
    }
    
    .statut-indicateur.en-cours {
        background: var(--bleu-principal);
    }
    
    .statut-indicateur.terminee {
        background: var(--vert);
    }
    
    .statut-option:hover {
        background: var(--gris-200);
    }
    
    .statut-option.active {
        background: var(--blanc);
        box-shadow: var(--ombre-legere);
        font-weight: 600;
    }
    
    .statut-option.active[data-statut="a-faire"] {
        color: var(--orange);
    }
    
    .statut-option.active[data-statut="en-cours"] {
        color: var(--bleu-principal);
    }
    
    .statut-option.active[data-statut="terminee"] {
        color: var(--vert);
    }
    
    /* Sélecteur de date */
    .selecteur-date {
        display: flex;
        gap: 0.5rem;
    }
    
    .selecteur-date .form-input {
        flex: 1;
    }
    
    .bouton-date-rapide {
        padding: 0.5rem 1rem;
        background: var(--gris-100);
        border: 1px solid var(--gris-300);
        border-radius: var(--rayon-md);
        color: var(--gris-700);
        cursor: pointer;
        transition: var(--transition-rapide);
        display: flex;
        align-items: center;
        gap: 0.25rem;
        white-space: nowrap;
    }
    
    .bouton-date-rapide:hover {
        background: var(--gris-200);
        color: var(--bleu-principal);
    }
    
    /* Tags */
    .selecteur-tags {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .tags-recents {
        display: flex;
        gap: 0.5rem;
    }
    
    .tag-recent {
        padding: 0.25rem 0.75rem;
        background: var(--gris-100);
        border: 1px solid var(--gris-300);
        border-radius: var(--rayon-complet);
        font-size: 0.75rem;
        color: var(--gris-700);
        cursor: pointer;
        transition: var(--transition-rapide);
    }
    
    .tag-recent:hover {
        background: var(--bleu-principal);
        color: var(--blanc);
        border-color: var(--bleu-principal);
    }
    
    /* Sous-tâches */
    .liste-sous-taches {
        margin-bottom: 0.5rem;
    }
    
    .sous-tache-exemple {
        padding: 0.75rem;
        background: var(--gris-50);
        border: 1px dashed var(--gris-300);
        border-radius: var(--rayon-md);
        color: var(--gris-500);
        font-size: 0.875rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .sous-tache-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
        animation: slideIn 0.3s ease;
    }
    
    .sous-tache-item i {
        color: var(--gris-500);
        cursor: pointer;
    }
    
    .sous-tache-item i:hover {
        color: var(--bleu-principal);
    }
    
    .input-sous-tache {
        flex: 1;
        padding: 0.5rem;
        border: 1px solid var(--gris-300);
        border-radius: var(--rayon-md);
        font-size: 0.875rem;
    }
    
    .input-sous-tache:focus {
        outline: none;
        border-color: var(--bleu-principal);
    }
    
    .supprimer-sous-tache {
        background: none;
        border: none;
        color: var(--gris-400);
        cursor: pointer;
        padding: 0.25rem;
        border-radius: var(--rayon-sm);
        transition: var(--transition-rapide);
    }
    
    .supprimer-sous-tache:hover {
        color: var(--rouge);
        background: var(--gris-100);
    }
    
    .btn-ajouter-sous-tache {
        width: 100%;
        padding: 0.5rem;
        background: none;
        border: 1px dashed var(--gris-300);
        border-radius: var(--rayon-md);
        color: var(--gris-600);
        cursor: pointer;
        transition: var(--transition-rapide);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
    }
    
    .btn-ajouter-sous-tache:hover {
        border-color: var(--bleu-principal);
        color: var(--bleu-principal);
        background: var(--bleu-principal-clair);
    }
    
    /* Options supplémentaires */
    .options-supplementaires {
        margin: 1.5rem 0;
        border: 1px solid var(--gris-200);
        border-radius: var(--rayon-lg);
        overflow: hidden;
    }
    
    .en-tete-options {
        padding: 1rem;
        background: var(--gris-50);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 600;
        color: var(--gris-700);
        transition: var(--transition-rapide);
    }
    
    .en-tete-options:hover {
        background: var(--gris-100);
    }
    
    .contenu-options {
        padding: 0;
        max-height: 0;
        overflow: hidden;
        transition: all 0.3s ease;
    }
    
    .contenu-options.visible {
        padding: 1.5rem;
        max-height: 500px;
    }
    
    /* Aperçu rapide */
    .apercu-rapide {
        margin-top: 1.5rem;
        padding: 1rem;
        background: var(--gris-50);
        border-radius: var(--rayon-lg);
        border: 1px solid var(--gris-200);
    }
    
    .apercu-rapide h4 {
        font-size: 0.875rem;
        color: var(--gris-700);
        margin-bottom: 0.75rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .carte-apercu {
        background: var(--blanc);
        border-radius: var(--rayon-md);
        overflow: hidden;
        box-shadow: var(--ombre-legere);
    }
    
    .en-tete-apercu {
        padding: 0.75rem 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: white;
    }
    
    .en-tete-apercu.basse {
        background: linear-gradient(135deg, var(--vert), #34d399);
    }
    
    .en-tete-apercu.moyenne {
        background: linear-gradient(135deg, var(--orange), #fbbf24);
    }
    
    .en-tete-apercu.haute {
        background: linear-gradient(135deg, var(--rouge), #f87171);
    }
    
    .en-tete-apercu i {
        font-size: 1rem;
    }
    
    .corps-apercu {
        padding: 1rem;
    }
    
    .badges-apercu {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
    }
    
    .badge-apercu {
        padding: 0.25rem 0.5rem;
        border-radius: var(--rayon-sm);
        font-size: 0.75rem;
        font-weight: 600;
    }
    
    .badge-apercu.projet {
        background: var(--gris-100);
        color: var(--gris-700);
    }
    
    .badge-apercu.priorite.basse {
        background: var(--vert-clair);
        color: var(--vert);
    }
    
    .badge-apercu.priorite.moyenne {
        background: var(--orange-clair);
        color: var(--orange);
    }
    
    .badge-apercu.priorite.haute {
        background: var(--rouge-clair);
        color: var(--rouge);
    }
    
    .badge-apercu.statut.a-faire {
        background: var(--orange-clair);
        color: var(--orange);
    }
    
    .badge-apercu.statut.en-cours {
        background: var(--bleu-principal-clair);
        color: var(--bleu-principal);
    }
    
    .badge-apercu.statut.terminee {
        background: var(--vert-clair);
        color: var(--vert);
    }
    
    .date-apercu {
        font-size: 0.75rem;
        color: var(--gris-600);
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .date-apercu i {
        color: var(--bleu-principal);
    }
    
    /* Boutons */
    .btn-primary, .btn-secondary {
        padding: 0.75rem 1.5rem;
        border-radius: var(--rayon-md);
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        transition: var(--transition-rapide);
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        border: none;
    }
    
    .btn-primary {
        background: var(--bleu-principal);
        color: var(--blanc);
    }
    
    .btn-primary:hover {
        background: var(--bleu-principal-fonce);
        transform: translateY(-1px);
        box-shadow: var(--ombre-moyenne);
    }
    
    .btn-secondary {
        background: var(--gris-100);
        color: var(--gris-700);
        border: 1px solid var(--gris-300);
    }
    
    .btn-secondary:hover {
        background: var(--gris-200);
    }
    
    /* Mode sombre */
    .mode-sombre .modal,
    .mode-sombre .modal-header,
    .mode-sombre .modal-footer {
        background: var(--gris-900);
        border-color: var(--gris-700);
    }
    
    .mode-sombre .modal-header h2 {
        color: var(--gris-100);
    }
    
    .mode-sombre .form-label {
        color: var(--gris-300);
    }
    
    .mode-sombre .form-input,
    .mode-sombre .form-textarea,
    .mode-sombre .form-select {
        background: var(--gris-800);
        border-color: var(--gris-700);
        color: var(--gris-200);
    }
    
    .mode-sombre .selecteur-priorite,
    .mode-sombre .selecteur-statut {
        background: var(--gris-800);
        border-color: var(--gris-700);
    }
    
    .mode-sombre .option-priorite,
    .mode-sombre .statut-option {
        color: var(--gris-300);
    }
    
    .mode-sombre .option-priorite:hover,
    .mode-sombre .statut-option:hover {
        background: var(--gris-700);
    }
    
    .mode-sombre .option-priorite.active,
    .mode-sombre .statut-option.active {
        background: var(--gris-800);
    }
    
    .mode-sombre .apercu-rapide {
        background: var(--gris-800);
        border-color: var(--gris-700);
    }
    
    .mode-sombre .carte-apercu {
        background: var(--gris-900);
    }
    
    .mode-sombre .badge-apercu.projet {
        background: var(--gris-800);
        color: var(--gris-300);
    }
    
    .mode-sombre .options-supplementaires {
        border-color: var(--gris-700);
    }
    
    .mode-sombre .en-tete-options {
        background: var(--gris-800);
        color: var(--gris-300);
    }
    
    .mode-sombre .en-tete-options:hover {
        background: var(--gris-700);
    }
    
    /* Animations */
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(-10px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    /* Responsive */
    @media (max-width: 640px) {
        .form-row {
            grid-template-columns: 1fr;
        }
        
        .selecteur-priorite,
        .selecteur-statut {
            flex-direction: column;
        }
        
        .selecteur-date {
            flex-direction: column;
        }
        
        .bouton-date-rapide {
            width: 100%;
            justify-content: center;
        }
        
        .modal-footer {
            flex-direction: column-reverse;
        }
        
        .modal-footer button {
            width: 100%;
            justify-content: center;
        }
        
        .tags-recents {
            flex-wrap: wrap;
        }
    }
`;

document.head.appendChild(styleModalTache);

// ============================================
// EXPOSITION GLOBALE
// ============================================

// Exposer les fonctions nécessaires
window.ouvrirModalTache = ouvrirModalTache;
window.fermerModalTache = fermerModalTache;

console.log('✅ Module de modale de tâches initialisé');