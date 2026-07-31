// Gestionnaire de projets
class GestionnaireProjets {
    constructor() {
        this.projets = this.chargerProjets();
        this.projetEnEdition = null;
        this.projetEnVue = null;
        this.vueActive = this.chargerPreferenceVue();
        this.filtreActif = 'tous';
        this.modeSelection = false;
        this.initialiser();
    }
    
    /**
     * Initialise toutes les fonctionnalités
     */
    initialiser() {
        this.initialiserEcouteurs();
        this.afficherProjets();
        this.mettreAJourStatistiques();
        this.configurerVue();
        this.configurerRecherche();
        
        // Écouter les événements depuis le dashboard
        this.initialiserCommunicationDashboard();
        
        // Vérifier si un projet spécifique doit être ouvert
        this.verifierProjetSelectionne();
        
        // Ajouter le bouton de sélection multiple
        this.ajouterBoutonSelectionMultiple();
    }
    
    /**
     * Ajoute le bouton de sélection multiple dans l'interface
     */
    ajouterBoutonSelectionMultiple() {
        setTimeout(() => {
            const enTeteProjets = document.querySelector('.en-tete-projets .boutons-action-projets');
            if (enTeteProjets) {
                // Vérifier si le bouton existe déjà
                if (enTeteProjets.querySelector('#boutonSelectionMultiple')) {
                    return;
                }
                
                const btnSelectionMultiple = document.createElement('button');
                btnSelectionMultiple.id = 'boutonSelectionMultiple';
                btnSelectionMultiple.className = 'bouton-action-secondaire bouton-selection-multiple';
                btnSelectionMultiple.innerHTML = '<i class="fas fa-check-square"></i> Sélection multiple';
                btnSelectionMultiple.onclick = () => this.toggleModeSelectionMultiple();
                enTeteProjets.appendChild(btnSelectionMultiple);
            }
        }, 500);
    }
    
    /**
     * Active ou désactive le mode sélection multiple
     */
    toggleModeSelectionMultiple() {
        if (this.modeSelection) {
            this.quitterModeSelection();
        } else {
            this.activerModeSelectionMultiple();
        }
    }
    
    /**
     * Vérifie si un projet spécifique doit être ouvert
     */
    verifierProjetSelectionne() {
        const projetSelectionne = sessionStorage.getItem('tgnova_projet_selectionne');
        if (projetSelectionne) {
            const id = parseInt(projetSelectionne);
            setTimeout(() => {
                this.ouvrirProjet(id);
                // Supprimer l'ID du stockage pour éviter la réouverture automatique
                sessionStorage.removeItem('tgnova_projet_selectionne');
            }, 500);
        }
    }
    
    /**
     * Initialise la communication avec le dashboard
     */
    initialiserCommunicationDashboard() {
        // Écouter les événements de création de projets depuis le dashboard
        window.addEventListener('nouveauProjetAjoute', (e) => {
            if (e.detail && e.detail.projet) {
                // Vérifier si le projet existe déjà
                const existeDeja = this.projets.some(p => p.id === e.detail.projet.id);
                
                if (!existeDeja) {
                    // Ajouter le projet
                    this.projets.unshift(e.detail.projet);
                    this.sauvegarderProjets();
                    this.afficherProjets();
                    this.mettreAJourStatistiques();
                    this.afficherMessage(`Projet "${e.detail.projet.nom}" synchronisé depuis le dashboard`, 'succes');
                    
                    // Notifier d'autres onglets
                    this.notifierModificationProjets();
                }
            }
        });
        
        // Écouter les modifications de localStorage depuis d'autres onglets
        window.addEventListener('storage', (e) => {
            if (e.key === 'tgnova_projets') {
                this.projets = JSON.parse(e.newValue || '[]');
                this.afficherProjets();
                this.mettreAJourStatistiques();
                this.afficherMessage('Projets mis à jour depuis un autre onglet', 'info');
            }
        });
    }
    
    /**
     * Charge les projets depuis le stockage local
     * @returns {Array} Liste des projets
     */
    chargerProjets() {
        const projetsStockes = localStorage.getItem('tgnova_projets');
        if (projetsStockes) {
            return JSON.parse(projetsStockes);
        }
        
        // Données par défaut alignées avec celles du dashboard
        return [
            {
                id: 1,
                nom: "Analyse de marché",
                titre: "Analyse de marché",
                description: "Étude approfondie du marché pour identifier les opportunités",
                categorie: "marketing",
                icone: "chart-line",
                couleur: "bleu",
                taches: 12,
                progression: 75,
                statut: "actif",
                dateDebut: "2024-01-10",
                dateLimite: "2024-03-15",
                membres: ["john", "sarah", "lisa"],
                favori: false
            },
            {
                id: 2,
                nom: "Développement App",
                titre: "Développement App",
                description: "Création d'une application mobile pour la gestion de projets",
                categorie: "developpement",
                icone: "code",
                couleur: "vert",
                taches: 8,
                progression: 60,
                statut: "actif",
                dateDebut: "2024-01-15",
                dateLimite: "2024-03-30",
                membres: ["john", "marc", "emma"],
                favori: true
            },
            {
                id: 3,
                nom: "Design UI/UX",
                titre: "Design UI/UX",
                description: "Refonte de l'interface utilisateur pour améliorer l'expérience",
                categorie: "design",
                icone: "paint-brush",
                couleur: "violet",
                taches: 6,
                progression: 90,
                statut: "actif",
                dateDebut: "2024-02-10",
                dateLimite: "2024-03-15",
                membres: ["emma", "alex"],
                favori: false
            }
        ];
    }
    
    /**
     * Charge la préférence de vue depuis le stockage local
     * @returns {string} Vue préférée
     */
    chargerPreferenceVue() {
        return localStorage.getItem('tgnova_vue_projets') || 'grille';
    }
    
    /**
     * Sauvegarde la préférence de vue
     */
    sauvegarderPreferenceVue(vue) {
        localStorage.setItem('tgnova_vue_projets', vue);
    }
    
    /**
     * Initialise les écouteurs d'événements
     */
    initialiserEcouteurs() {
        // Bouton nouveau projet
        document.getElementById('boutonNouveauProjet').addEventListener('click', () => this.ouvrirFormulaireProjet());
        
        // Boutons de fermeture de modale
        document.getElementById('boutonFermerModale').addEventListener('click', () => this.fermerModaleFormulaire());
        document.getElementById('boutonAnnulerProjet').addEventListener('click', () => this.fermerModaleFormulaire());
        document.getElementById('boutonFermerModaleInfo').addEventListener('click', () => this.fermerModaleInfo());
        document.getElementById('boutonFermerInfo').addEventListener('click', () => this.fermerModaleInfo());
        
        // Bouton éditer depuis la modale d'info
        document.getElementById('boutonEditerDepuisInfo').addEventListener('click', () => {
            this.fermerModaleInfo();
            if (this.projetEnVue) {
                this.editerProjet(this.projetEnVue.id);
            }
        });
        
        // Formulaire de projet
        document.getElementById('formulaireProjet').addEventListener('submit', (e) => this.soumettreFormulaire(e));
        
        // Sélecteur de vue
        document.getElementById('selecteurVueProjets').addEventListener('change', (e) => this.basculerVue(e.target.value));
        
        // Filtres
        document.querySelectorAll('.bouton-filtre').forEach(bouton => {
            bouton.addEventListener('click', (e) => this.appliquerFiltre(e.currentTarget.dataset.filtre));
        });
        
        // Recherche
        document.getElementById('champRechercheProjets').addEventListener('input', (e) => this.rechercherProjets(e.target.value));
        
        // Fermer les modales en cliquant à l'extérieur
        document.getElementById('modaleProjet').addEventListener('click', (e) => {
            if (e.target.id === 'modaleProjet') {
                this.fermerModaleFormulaire();
            }
        });
        
        document.getElementById('modaleInfoProjet').addEventListener('click', (e) => {
            if (e.target.id === 'modaleInfoProjet') {
                this.fermerModaleInfo();
            }
        });
    }
    
    /**
     * Ouvre le formulaire pour créer ou éditer un projet
     * @param {Object} projet - Projet à éditer (optionnel)
     */
    ouvrirFormulaireProjet(projet = null) {
        const modale = document.getElementById('modaleProjet');
        const titreModale = document.getElementById('titreModaleProjet');
        const formulaire = document.getElementById('formulaireProjet');
        
        if (projet) {
            // Mode édition
            this.projetEnEdition = projet;
            titreModale.textContent = "Éditer le projet";
            
            // Remplir le formulaire
            document.getElementById('projetId').value = projet.id;
            document.getElementById('titreProjet').value = projet.titre;
            document.getElementById('categorieProjet').value = projet.categorie;
            document.getElementById('descriptionProjet').value = projet.description;
            document.getElementById('dateDebutProjet').value = projet.dateDebut;
            document.getElementById('dateLimiteProjet').value = projet.dateLimite;
            document.getElementById('statutProjet').value = projet.statut;
            document.getElementById('progressionProjet').value = projet.progression;
            document.getElementById('valeurProgression').textContent = projet.progression + '%';
            
            // Sélectionner les membres
            const selectMembres = document.getElementById('membresProjet');
            Array.from(selectMembres.options).forEach(option => {
                option.selected = projet.membres.includes(option.value);
            });
        } else {
            // Mode création
            this.projetEnEdition = null;
            titreModale.textContent = "Nouveau projet";
            formulaire.reset();
            document.getElementById('projetId').value = '';
            document.getElementById('valeurProgression').textContent = '0%';
            
            // Définir la date d'aujourd'hui par défaut
            const aujourdhui = new Date().toISOString().split('T')[0];
            document.getElementById('dateDebutProjet').value = aujourdhui;
            
            // Date limite dans 30 jours par défaut
            const dateLimite = new Date();
            dateLimite.setDate(dateLimite.getDate() + 30);
            document.getElementById('dateLimiteProjet').value = dateLimite.toISOString().split('T')[0];
        }
        
        // Afficher la modale
        modale.classList.add('active');
        document.getElementById('titreProjet').focus();
    }
    
    /**
     * Ferme la modale de formulaire
     */
    fermerModaleFormulaire() {
        document.getElementById('modaleProjet').classList.remove('active');
        document.getElementById('formulaireProjet').reset();
        this.projetEnEdition = null;
    }
    
    /**
     * Ouvre la modale d'information d'un projet
     * @param {Object} projet - Projet à afficher
     */
    ouvrirModaleInfo(projet) {
        this.projetEnVue = projet;
        const modale = document.getElementById('modaleInfoProjet');
        const corps = document.getElementById('corpsModaleInfo');
        
        // Formater les dates
        const dateDebut = this.formaterDate(projet.dateDebut);
        const dateLimite = this.formaterDate(projet.dateLimite);
        const aujourdhui = new Date();
        const dateEcheance = new Date(projet.dateLimite);
        const joursRestants = Math.ceil((dateEcheance - aujourdhui) / (1000 * 60 * 60 * 24));
        
        // Icône et couleur
        const iconeClasse = projet.icone ? `fa-${projet.icone}` : 'fa-folder';
        const couleur = projet.couleur || 'bleu';
        
        // Générer le contenu
        corps.innerHTML = `
            <div class="en-tete-info-projet">
                <span class="categorie-projet ${projet.categorie}">${this.getCategorieLabel(projet.categorie)}</span>
                <h1 class="titre-info-projet">${projet.titre}</h1>
                <p class="description-info-projet">${projet.description}</p>
            </div>
            
            <div class="progression-info">
                <div class="en-tete-progression-info">
                    <h3>Progression du projet</h3>
                    <span class="pourcentage-progression-info">${projet.progression}%</span>
                </div>
                <div class="barre-progression-info">
                    <div class="remplissage-progression-info" style="width: ${projet.progression}%"></div>
                </div>
            </div>
            
            <div class="grille-info-projet">
                <div class="groupe-info">
                    <h3>Informations générales</h3>
                    <div class="element-info">
                        <i class="fas ${iconeClasse}" style="color: var(--${couleur});"></i>
                        <span>Catégorie:</span>
                        <span class="valeur-info">${this.getCategorieLabel(projet.categorie)}</span>
                    </div>
                    <div class="element-info">
                        <i class="fas fa-flag"></i>
                        <span>Statut:</span>
                        <span class="statut-info ${projet.statut}">
                            ${projet.statut === 'actif' ? '<i class="fas fa-play-circle"></i>' : ''}
                            ${projet.statut === 'termine' ? '<i class="fas fa-check-circle"></i>' : ''}
                            ${projet.statut === 'en-retard' ? '<i class="fas fa-clock"></i>' : ''}
                            ${this.getStatutLabel(projet.statut)}
                        </span>
                    </div>
                    ${projet.favori ? `
                    <div class="element-info">
                        <i class="fas fa-star" style="color: #F59E0B;"></i>
                        <span>Favori:</span>
                        <span class="valeur-info">Oui</span>
                    </div>
                    ` : ''}
                    <div class="element-info">
                        <i class="fas fa-tasks"></i>
                        <span>Tâches:</span>
                        <span class="valeur-info">${projet.taches || '0'}</span>
                    </div>
                </div>
                
                <div class="groupe-info">
                    <h3>Dates clés</h3>
                    <div class="element-info">
                        <i class="fas fa-calendar-plus"></i>
                        <span>Date de début:</span>
                        <span class="valeur-info">${dateDebut}</span>
                    </div>
                    <div class="element-info">
                        <i class="fas fa-calendar-check"></i>
                        <span>Date d'échéance:</span>
                        <span class="valeur-info">${dateLimite}</span>
                    </div>
                    <div class="element-info">
                        <i class="fas fa-clock"></i>
                        <span>Jours restants:</span>
                        <span class="valeur-info ${joursRestants < 0 ? 'erreur' : ''}">
                            ${joursRestants < 0 ? `Dépassé de ${Math.abs(joursRestants)} jours` : `${joursRestants} jours`}
                        </span>
                    </div>
                </div>
            </div>
            
            <div class="membres-info-projet">
                <h3>Équipe du projet</h3>
                <div class="liste-membres">
                    ${projet.membres.map(membreId => {
                        const nom = this.getNomMembre(membreId);
                        const role = this.getRoleMembre(membreId);
                        const couleur = this.getCouleurMembre(membreId);
                        return `
                            <div class="membre-info">
                                <div class="avatar-membre-info">
                                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(nom)}&background=${couleur}&color=fff" alt="${nom}">
                                </div>
                                <div class="infos-membre">
                                    <h4>${nom}</h4>
                                    <p>${role}</p>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        
        // Afficher la modale
        modale.classList.add('active');
    }
    
    /**
     * Ferme la modale d'information
     */
    fermerModaleInfo() {
        document.getElementById('modaleInfoProjet').classList.remove('active');
        this.projetEnVue = null;
    }
    
    /**
     * Soumet le formulaire de projet
     * @param {Event} e - Événement de soumission
     */
    soumettreFormulaire(e) {
        e.preventDefault();
        
        // Récupérer les données du formulaire
        const formulaire = e.target;
        const projetId = document.getElementById('projetId').value;
        const projet = {
            id: projetId ? parseInt(projetId) : Date.now(),
            titre: document.getElementById('titreProjet').value,
            nom: document.getElementById('titreProjet').value, // Même valeur que titre
            categorie: document.getElementById('categorieProjet').value,
            description: document.getElementById('descriptionProjet').value,
            dateDebut: document.getElementById('dateDebutProjet').value,
            dateLimite: document.getElementById('dateLimiteProjet').value,
            statut: document.getElementById('statutProjet').value,
            progression: parseInt(document.getElementById('progressionProjet').value),
            membres: Array.from(document.getElementById('membresProjet').selectedOptions).map(opt => opt.value),
            favori: this.projetEnEdition ? this.projetEnEdition.favori : false,
            // Champs alignés avec le dashboard
            icone: this.projetEnEdition ? this.projetEnEdition.icone : 'folder',
            couleur: this.projetEnEdition ? this.projetEnEdition.couleur : 'bleu',
            taches: this.projetEnEdition ? this.projetEnEdition.taches : 0,
            tachesTerminees: this.projetEnEdition ? this.projetEnEdition.tachesTerminees : 0
        };
        
        // Valider les dates
        if (new Date(projet.dateLimite) < new Date(projet.dateDebut)) {
            this.afficherMessage("La date limite doit être après la date de début", 'erreur');
            return;
        }
        
        if (this.projetEnEdition) {
            // Mettre à jour un projet existant
            const index = this.projets.findIndex(p => p.id === this.projetEnEdition.id);
            if (index !== -1) {
                this.projets[index] = projet;
                this.afficherMessage("Projet mis à jour avec succès", 'succes');
            }
        } else {
            // Ajouter un nouveau projet
            this.projets.unshift(projet);
            this.afficherMessage("Projet créé avec succès", 'succes');
        }
        
        // Sauvegarder et mettre à jour l'affichage
        this.sauvegarderProjets();
        this.afficherProjets();
        this.mettreAJourStatistiques();
        this.fermerModaleFormulaire();
    }
    
    /**
     * Sauvegarde les projets dans le stockage local
     */
    sauvegarderProjets() {
        localStorage.setItem('tgnova_projets', JSON.stringify(this.projets));
        
        // Notifier le dashboard de la modification
        this.notifierModificationProjets();
        
        // Notifier d'autres onglets
        localStorage.setItem('tgnova_projets_sync', Date.now().toString());
    }
    
    /**
     * Notifie le dashboard de la modification des projets
     */
    notifierModificationProjets() {
        // Notifier la page dashboard
        window.dispatchEvent(new CustomEvent('projetsModifies', { 
            detail: { projets: this.projets } 
        }));
        
        // Notifier la page dashboard (autre méthode)
        if (window.TGNOVA && TGNOVA.mettreAJourProjetsActifs) {
            TGNOVA.mettreAJourProjetsActifs();
        }
    }
    
    /**
     * Supprime un projet
     * @param {number} id - ID du projet
     */
    supprimerProjet(id) {
        modalUtils.demanderConfirmation(
            'Suppression de projet',
            'Êtes-vous sûr de vouloir supprimer ce projet ?',
            () => {
                this.projets = this.projets.filter(projet => projet.id !== id);
                this.sauvegarderProjets();
                this.afficherProjets();
                this.mettreAJourStatistiques();
                this.afficherMessage('Projet supprimé avec succès', 'succes');
            }
        );
    }
    
    /**
     * Supprime définitivement un projet
     * @param {number} id - ID du projet
     * @param {boolean} sansConfirmation - Si true, supprime sans confirmation
     */
    supprimerProjetDefinitivement(id, sansConfirmation = false) {
        const projet = this.projets.find(p => p.id === id);
        if (!projet) {
            this.afficherMessage("Projet non trouvé", 'erreur');
            return;
        }
        
        // Vérifier si le projet a des tâches associées
        const tachesAssociees = this.compterTachesProjet(id);
        
        let messageConfirmation = `Êtes-vous sûr de vouloir supprimer définitivement le projet "${projet.titre}" ?`;
        
        if (tachesAssociees > 0) {
            messageConfirmation += `\n\n⚠️ Attention: Ce projet contient ${tachesAssociees} tâche${tachesAssociees > 1 ? 's' : ''}. Elles seront également supprimées.`;
        }
        
        if (!sansConfirmation) {
            modalUtils.demanderConfirmation(
                'Suppression définitive',
                messageConfirmation,
                () => {
                    // Supprimer les tâches associées si elles existent
                    if (tachesAssociees > 0) {
                        this.supprimerTachesProjet(id);
                    }

                    // Archivage temporaire avant suppression complète
                    this.archiverProjetAvantSuppression(projet);
                }
            );
            return;
        }
        
        // Supprimer les tâches associées si elles existent
        if (tachesAssociees > 0) {
            this.supprimerTachesProjet(id);
        }
        
        // Archivage temporaire avant suppression complète
        this.archiverProjetAvantSuppression(projet);
        
        // Animation de suppression
        const elementProjet = document.querySelector(`[data-id="${id}"]`);
        if (elementProjet) {
            elementProjet.classList.add('projet-supprime');
            setTimeout(() => {
                if (elementProjet.parentNode) {
                    elementProjet.parentNode.removeChild(elementProjet);
                }
            }, 300);
        }
        
        // Supprimer le projet de la liste
        const index = this.projets.findIndex(p => p.id === id);
        this.projets.splice(index, 1);
        
        // Sauvegarder les modifications
        this.sauvegarderProjets();
        
        // Mettre à jour l'affichage
        this.afficherProjets();
        this.mettreAJourStatistiques();
        
        // Afficher un message de confirmation
        this.afficherMessage(`Projet "${projet.titre}" supprimé définitivement`, 'succes');
        
        // Notifier les autres modules
        this.notifierSuppressionProjet(id);
    }
    
    /**
     * Compte les tâches associées à un projet
     * @param {number} projetId - ID du projet
     * @returns {number} Nombre de tâches associées
     */
    compterTachesProjet(projetId) {
        try {
            const taches = JSON.parse(localStorage.getItem('tgnova_taches') || '[]');
            return taches.filter(tache => tache.projet === projetId.toString()).length;
        } catch (error) {
            console.error('Erreur lors du comptage des tâches:', error);
            return 0;
        }
    }
    
    /**
     * Supprime les tâches associées à un projet
     * @param {number} projetId - ID du projet
     */
    supprimerTachesProjet(projetId) {
        try {
            const taches = JSON.parse(localStorage.getItem('tgnova_taches') || '[]');
            const tachesRestantes = taches.filter(tache => tache.projet !== projetId.toString());
            localStorage.setItem('tgnova_taches', JSON.stringify(tachesRestantes));
            
            // Notifier la page des tâches
            window.dispatchEvent(new CustomEvent('tachesSupprimees', {
                detail: { projetId: projetId }
            }));
        } catch (error) {
            console.error('Erreur lors de la suppression des tâches:', error);
        }
    }
    
    /**
     * Archive un projet avant suppression
     * @param {Object} projet - Projet à archiver
     */
    archiverProjetAvantSuppression(projet) {
        try {
            // Charger l'archive existante
            const archive = JSON.parse(localStorage.getItem('tgnova_projets_archive') || '[]');
            
            // Ajouter le projet avec la date de suppression
            const projetArchive = {
                ...projet,
                dateSuppression: new Date().toISOString(),
                raisonSuppression: 'Suppression manuelle'
            };
            
            archive.unshift(projetArchive);
            
            // Limiter l'archive à 100 projets maximum
            if (archive.length > 100) {
                archive.pop();
            }
            
            // Sauvegarder l'archive
            localStorage.setItem('tgnova_projets_archive', JSON.stringify(archive));
            
            console.log(`Projet "${projet.titre}" archivé avant suppression`);
        } catch (error) {
            console.error('Erreur lors de l\'archivage du projet:', error);
        }
    }
    
    /**
     * Notifie les autres modules de la suppression d'un projet
     * @param {number} projetId - ID du projet supprimé
     */
    notifierSuppressionProjet(projetId) {
        // Notifier le dashboard
        window.dispatchEvent(new CustomEvent('projetSupprime', {
            detail: { projetId: projetId }
        }));
        
        // Notifier la page dashboard si elle existe
        if (window.TGNOVA && TGNOVA.mettreAJourProjetsActifs) {
            TGNOVA.mettreAJourProjetsActifs();
        }
    }
    
    /**
     * Bascule l'état favori d'un projet
     * @param {number} id - ID du projet
     */
    toggleFavori(id) {
        const projet = this.projets.find(p => p.id === id);
        if (projet) {
            projet.favori = !projet.favori;
            this.sauvegarderProjets();
            this.afficherProjets();
            this.afficherMessage(projet.favori ? "Projet ajouté aux favoris" : "Projet retiré des favoris", 'info');
        }
    }
    
    /**
     * Affiche les projets filtrés
     */
    afficherProjets() {
        const projetsFiltres = this.filtrerProjets();
        const vueGrille = document.getElementById('vueGrilleProjets');
        const vueTableau = document.getElementById('vueTableauProjets');
        const corpsTableau = document.getElementById('corpsTableauProjets');
        const etatVide = document.getElementById('etatVideProjets');
        
        // Effacer le contenu précédent
        vueGrille.innerHTML = '';
        corpsTableau.innerHTML = '';
        
        if (projetsFiltres.length === 0) {
            etatVide.style.display = 'block';
            return;
        }
        
        etatVide.style.display = 'none';
        
        // Générer les cartes pour la vue grille
        projetsFiltres.forEach(projet => {
            const carte = this.creerCarteProjet(projet);
            vueGrille.appendChild(carte);
        });
        
        // Générer les lignes pour la vue tableau
        projetsFiltres.forEach(projet => {
            const ligne = this.creerLigneTableau(projet);
            corpsTableau.appendChild(ligne);
        });
        
        // Ajouter les écouteurs d'événements
        this.ajouterEcouteursActions();
    }
    
    /**
     * Crée une carte de projet pour la vue grille
     * @param {Object} projet - Projet à afficher
     * @returns {HTMLElement} Élément HTML de la carte
     */
    creerCarteProjet(projet) {
        const carte = document.createElement('div');
        carte.className = 'carte-projet';
        carte.dataset.id = projet.id;
        carte.dataset.statut = projet.statut;
        carte.dataset.categorie = projet.categorie;
        carte.dataset.favori = projet.favori;
        
        // Formater les dates
        const dateDebut = this.formaterDate(projet.dateDebut);
        const dateLimite = this.formaterDate(projet.dateLimite);
        
        // Obtenir les membres
        const membresAffiches = projet.membres.slice(0, 3);
        const autresMembres = projet.membres.length - 3;
        
        // Icône basée sur les données
        const iconeClasse = projet.icone ? `fa-${projet.icone}` : 'fa-folder';
        const couleurClasse = projet.couleur || 'bleu';
        
        // État d'archivage (nouveau)
        const estArchive = projet.archive || false;
        
        carte.innerHTML = `
            <div class="en-tete-carte-projet">
                <div class="infos-projet-principales">
                    <span class="categorie-projet ${projet.categorie}">${this.getCategorieLabel(projet.categorie)}</span>
                    <h3 class="titre-projet">${projet.titre}</h3>
                    <p class="description-projet">${projet.description}</p>
                    <div class="progression-courte">
                        <div class="barre-progression-courte" style="width: ${projet.progression}%"></div>
                    </div>
                </div>
                <div class="pourcentage-projet">${projet.progression}%</div>
            </div>
            
            <div class="corps-carte-projet">
                <div class="meta-projet">
                    <div class="element-meta-projet">
                        <i class="fas fa-${iconeClasse}" style="color: var(--${couleurClasse});"></i>
                        <span>${projet.taches || '0'} tâche${projet.taches !== 1 ? 's' : ''}</span>
                    </div>
                    <div class="element-meta-projet">
                        <i class="fas fa-calendar"></i>
                        <span>Début: ${dateDebut}</span>
                    </div>
                    <div class="element-meta-projet">
                        <i class="fas fa-flag"></i>
                        <span>Échéance: ${dateLimite}</span>
                    </div>
                </div>
                
                <div class="membres-projet">
                    ${membresAffiches.map(membre => `
                        <div class="avatar-membre" title="${this.getNomMembre(membre)}">
                            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(this.getNomMembre(membre))}&background=${this.getCouleurMembre(membre)}&color=fff" alt="${this.getNomMembre(membre)}">
                        </div>
                    `).join('')}
                    ${autresMembres > 0 ? `<div class="plus-membres">+${autresMembres}</div>` : ''}
                </div>
            </div>
            
            <div class="pied-carte-projet">
                <div>
                    <span class="badge-statut-projet ${projet.statut}">${this.getStatutLabel(projet.statut)}</span>
                    ${estArchive ? '<span class="badge-statut-projet archive" style="background: #F3F4F6; color: #6B7280; margin-left: 8px;"><i class="fas fa-archive"></i> Archivé</span>' : ''}
                </div>
                <div class="actions-projet">
                    <button class="bouton-action-projet ouvrir" title="Voir les détails" data-action="ouvrir" data-id="${projet.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="bouton-action-projet editer" title="Éditer" data-action="editer" data-id="${projet.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="bouton-action-projet favori" title="${projet.favori ? 'Retirer des favoris' : 'Ajouter aux favoris'}" data-action="favori" data-id="${projet.id}">
                        <i class="fas ${projet.favori ? 'fa-star' : 'fa-star-o'}"></i>
                    </button>
                    <button class="bouton-action-projet supprimer" title="Supprimer définitivement" data-action="supprimer" data-id="${projet.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        return carte;
    }
    
    /**
     * Crée une ligne de tableau pour la vue tableau
     * @param {Object} projet - Projet à afficher
     * @returns {HTMLElement} Élément HTML de la ligne
     */
    creerLigneTableau(projet) {
        const ligne = document.createElement('tr');
        ligne.dataset.id = projet.id;
        ligne.dataset.statut = projet.statut;
        ligne.dataset.categorie = projet.categorie;
        ligne.dataset.favori = projet.favori;
        
        // Formater la date limite
        const dateLimite = this.formaterDate(projet.dateLimite);
        
        // Icône
        const iconeClasse = projet.icone ? `fa-${projet.icone}` : 'fa-folder';
        
        // État d'archivage (nouveau)
        const estArchive = projet.archive || false;
        
        ligne.innerHTML = `
            <td>
                <div class="titre-projet">
                    <i class="fas ${iconeClasse}" style="margin-right: 8px; color: var(--${projet.couleur || 'bleu'});"></i>
                    ${projet.titre}
                    ${estArchive ? '<span style="margin-left: 8px; font-size: 0.75rem; color: #6B7280;"><i class="fas fa-archive"></i> Archivé</span>' : ''}
                </div>
                <div class="description-projet">${projet.description}</div>
            </td>
            <td><span class="categorie-projet ${projet.categorie}">${this.getCategorieLabel(projet.categorie)}</span></td>
            <td>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div class="progression-courte" style="flex: 1;">
                        <div class="barre-progression-courte" style="width: ${projet.progression}%"></div>
                    </div>
                    <span class="pourcentage-projet">${projet.progression}%</span>
                </div>
            </td>
            <td>
                <span class="badge-statut-projet ${projet.statut}">${this.getStatutLabel(projet.statut)}</span>
                ${estArchive ? '<span class="badge-statut-projet archive" style="background: #F3F4F6; color: #6B7280; margin-left: 8px; font-size: 0.75rem;"><i class="fas fa-archive"></i></span>' : ''}
            </td>
            <td>${dateLimite}</td>
            <td>
                <div class="actions-projet">
                    <button class="bouton-action-projet ouvrir" title="Voir les détails" data-action="ouvrir" data-id="${projet.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="bouton-action-projet editer" title="Éditer" data-action="editer" data-id="${projet.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="bouton-action-projet favori" title="${projet.favori ? 'Retirer des favoris' : 'Ajouter aux favoris'}" data-action="favori" data-id="${projet.id}">
                        <i class="fas ${projet.favori ? 'fa-star' : 'fa-star-o'}"></i>
                    </button>
                    <button class="bouton-action-projet supprimer" title="Supprimer définitivement" data-action="supprimer" data-id="${projet.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        return ligne;
    }
    
    /**
     * Ajoute les écouteurs d'événements pour les actions
     */
    ajouterEcouteursActions() {
        document.querySelectorAll('[data-action="ouvrir"]').forEach(bouton => {
            bouton.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(e.currentTarget.dataset.id);
                this.ouvrirProjet(id);
            });
        });
        
        document.querySelectorAll('[data-action="editer"]').forEach(bouton => {
            bouton.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(e.currentTarget.dataset.id);
                this.editerProjet(id);
            });
        });
        
        document.querySelectorAll('[data-action="favori"]').forEach(bouton => {
            bouton.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(e.currentTarget.dataset.id);
                this.toggleFavori(id);
            });
        });
        
        // NOUVEAU: Écouteur pour la suppression
        document.querySelectorAll('[data-action="supprimer"]').forEach(bouton => {
            bouton.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(e.currentTarget.dataset.id);
                this.supprimerProjetDefinitivement(id);
            });
        });
        
        // Ouvrir la modale d'info en cliquant sur la carte/ligne
        document.querySelectorAll('.carte-projet, .tableau-projets tbody tr').forEach(element => {
            element.addEventListener('click', (e) => {
                // Ne pas ouvrir si on a cliqué sur un bouton d'action
                if (!e.target.closest('.actions-projet')) {
                    const id = parseInt(element.dataset.id);
                    this.ouvrirProjet(id);
                }
            });
        });
    }
    
    /**
     * Ouvre les détails d'un projet dans une modale
     * @param {number} id - ID du projet
     */
    ouvrirProjet(id) {
        const projet = this.projets.find(p => p.id === id);
        if (projet) {
            this.ouvrirModaleInfo(projet);
        }
    }
    
    /**
     * Édite un projet existant
     * @param {number} id - ID du projet
     */
    editerProjet(id) {
        const projet = this.projets.find(p => p.id === id);
        if (projet) {
            this.ouvrirFormulaireProjet(projet);
        }
    }
    
    /**
     * Applique un filtre aux projets
     * @param {string} filtre - Type de filtre
     */
    appliquerFiltre(filtre) {
        this.filtreActif = filtre;
        
        // Mettre à jour l'état actif des boutons
        document.querySelectorAll('.bouton-filtre').forEach(bouton => {
            bouton.classList.remove('actif');
        });
        document.querySelector(`[data-filtre="${filtre}"]`).classList.add('actif');
        
        // Afficher les projets filtrés
        this.afficherProjets();
        
        // Afficher un message
        this.afficherMessage(`Filtre "${this.getFiltreLabel(filtre)}" appliqué`, 'info');
    }
    
    /**
     * Filtre les projets selon le filtre actif
     * @returns {Array} Projets filtrés
     */
    filtrerProjets() {
        let projetsFiltres = [...this.projets];
        
        switch (this.filtreActif) {
            case 'actifs':
                projetsFiltres = projetsFiltres.filter(p => p.statut === 'actif');
                break;
            case 'termines':
                projetsFiltres = projetsFiltres.filter(p => p.statut === 'termine');
                break;
            case 'en-retard':
                projetsFiltres = projetsFiltres.filter(p => p.statut === 'en-retard');
                break;
            case 'favoris':
                projetsFiltres = projetsFiltres.filter(p => p.favori);
                break;
            // 'tous' - pas de filtre
        }
        
        return projetsFiltres;
    }
    
    /**
     * Recherche des projets par texte
     * @param {string} texte - Texte de recherche
     */
    rechercherProjets(texte) {
        const projetsFiltres = this.filtrerProjets();
        const terme = texte.toLowerCase().trim();
        
        if (!terme) {
            this.afficherProjets();
            return;
        }
        
        const projetsRecherches = projetsFiltres.filter(projet =>
            projet.titre.toLowerCase().includes(terme) ||
            projet.description.toLowerCase().includes(terme) ||
            this.getCategorieLabel(projet.categorie).toLowerCase().includes(terme)
        );
        
        // Mettre à jour l'affichage avec les résultats de recherche
        this.afficherProjetsRecherches(projetsRecherches);
    }
    
    /**
     * Affiche les résultats de recherche
     * @param {Array} projets - Projets à afficher
     */
    afficherProjetsRecherches(projets) {
        // Même logique que afficherProjets mais avec une liste différente
        // Pour simplifier, on va filtrer directement
        const etatVide = document.getElementById('etatVideProjets');
        
        if (projets.length === 0) {
            // Masquer tous les projets
            document.querySelectorAll('.carte-projet').forEach(carte => carte.style.display = 'none');
            document.querySelectorAll('.tableau-projets tbody tr').forEach(ligne => ligne.style.display = 'none');
            etatVide.style.display = 'block';
            etatVide.querySelector('h3').textContent = "Aucun projet trouvé";
            etatVide.querySelector('p').textContent = "Essayez avec d'autres termes de recherche";
            return;
        }
        
        etatVide.style.display = 'none';
        
        // Afficher/masquer les éléments selon la recherche
        document.querySelectorAll('.carte-projet').forEach(carte => {
            const id = parseInt(carte.dataset.id);
            const trouve = projets.some(p => p.id === id);
            carte.style.display = trouve ? 'flex' : 'none';
        });
        
        document.querySelectorAll('.tableau-projets tbody tr').forEach(ligne => {
            const id = parseInt(ligne.dataset.id);
            const trouve = projets.some(p => p.id === id);
            ligne.style.display = trouve ? 'table-row' : 'none';
        });
    }
    
    /**
     * Bascule entre les vues grille et tableau
     * @param {string} vue - Type de vue
     */
    basculerVue(vue) {
        this.vueActive = vue;
        this.sauvegarderPreferenceVue(vue);
        this.configurerVue();
        this.afficherMessage(`Vue ${vue} activée`, 'info');
    }
    
    /**
     * Configure l'affichage selon la vue active
     */
    configurerVue() {
        const vueGrille = document.getElementById('vueGrilleProjets');
        const vueTableau = document.getElementById('vueTableauProjets');
        const selecteurVue = document.getElementById('selecteurVueProjets');
        
        selecteurVue.value = this.vueActive;
        
        if (this.vueActive === 'grille') {
            vueGrille.style.display = 'grid';
            vueTableau.style.display = 'none';
        } else {
            vueGrille.style.display = 'none';
            vueTableau.style.display = 'block';
        }
    }
    
    /**
     * Configure la recherche en temps réel
     */
    configurerRecherche() {
        const champRecherche = document.getElementById('champRechercheProjets');
        let timeout;
        
        champRecherche.addEventListener('input', (e) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                this.rechercherProjets(e.target.value);
            }, 300);
        });
    }
    
    /**
     * Met à jour les statistiques
     */
    mettreAJourStatistiques() {
        const projetsActifs = this.projets.filter(p => p.statut === 'actif').length;
        const projetsTermines = this.projets.filter(p => p.statut === 'termine').length;
        const projetsEnRetard = this.projets.filter(p => p.statut === 'en-retard').length;
        
        // Pour les équipes, on compte les membres uniques
        const tousMembres = this.projets.flatMap(p => p.membres);
        const equipesUniques = [...new Set(tousMembres)].length;
        
        document.getElementById('statProjetsActifs').textContent = projetsActifs;
        document.getElementById('statProjetsTermines').textContent = projetsTermines;
        document.getElementById('statProjetsEnRetard').textContent = projetsEnRetard;
        document.getElementById('statEquipesImpliquees').textContent = equipesUniques;
        
        // Mettre à jour le badge dans la navigation
        const badgeNavigation = document.getElementById('badgeProjets');
        if (badgeNavigation) {
            badgeNavigation.textContent = this.projets.length;
        }
    }
    
    /**
     * Affiche un message à l'utilisateur
     * @param {string} message - Message à afficher
     * @param {string} type - Type de message (succes, erreur, info)
     */
    afficherMessage(message, type) {
        // Utiliser le système de notification existant
        if (window.TGNOVA && TGNOVA.afficherToast) {
            TGNOVA.afficherToast(message, type);
        } else {
            // Fallback simple
            const couleur = {
                succes: '#10B981',
                erreur: '#EF4444',
                info: '#3B82F6'
            }[type] || '#3B82F6';
            
            console.log(`[${type.toUpperCase()}] ${message}`);
            
            // Créer un toast simple
            const toast = document.createElement('div');
            toast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${couleur};
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                z-index: 1000;
                animation: slideIn 0.3s ease;
            `;
            toast.textContent = message;
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => document.body.removeChild(toast), 300);
            }, 3000);
        }
    }
    
    /**
     * Formate une date au format JJ MMM AAAA
     * @param {string} dateStr - Date au format YYYY-MM-DD
     * @returns {string} Date formatée
     */
    formaterDate(dateStr) {
        const date = new Date(dateStr);
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return date.toLocaleDateString('fr-FR', options);
    }
    
    /**
     * Obtient le label d'une catégorie
     * @param {string} categorie - Clé de la catégorie
     * @returns {string} Label de la catégorie
     */
    getCategorieLabel(categorie) {
        const labels = {
            'developpement': 'Développement',
            'design': 'Design',
            'marketing': 'Marketing',
            'autre': 'Autre'
        };
        return labels[categorie] || categorie;
    }
    
    /**
     * Obtient le label d'un statut
     * @param {string} statut - Clé du statut
     * @returns {string} Label du statut
     */
    getStatutLabel(statut) {
        const labels = {
            'actif': 'Actif',
            'termine': 'Terminé',
            'en-retard': 'En retard'
        };
        return labels[statut] || statut;
    }
    
    /**
     * Obtient le label d'un filtre
     * @param {string} filtre - Clé du filtre
     * @returns {string} Label du filtre
     */
    getFiltreLabel(filtre) {
        const labels = {
            'tous': 'Tous les projets',
            'actifs': 'Actifs',
            'termines': 'Terminés',
            'en-retard': 'En retard',
            'favoris': 'Favoris'
        };
        return labels[filtre] || filtre;
    }
    
    /**
     * Obtient le nom d'un membre
     * @param {string} idMembre - ID du membre
     * @returns {string} Nom du membre
     */
    getNomMembre(idMembre) {
        const membres = {
            'john': 'John Doe',
            'sarah': 'Sarah Chen',
            'marc': 'Marc Dubois',
            'emma': 'Emma Wilson',
            'alex': 'Alex Martin',
            'lisa': 'Lisa Wang',
            'thomas': 'Thomas Roux'
        };
        return membres[idMembre] || idMembre;
    }
    
    /**
     * Obtient le rôle d'un membre
     * @param {string} idMembre - ID du membre
     * @returns {string} Rôle du membre
     */
    getRoleMembre(idMembre) {
        const roles = {
            'john': 'Chef de projet',
            'sarah': 'Développeuse Frontend',
            'marc': 'Développeur Backend',
            'emma': 'Designer UI/UX',
            'alex': 'Designer Graphique',
            'lisa': 'Responsable Marketing',
            'thomas': 'Spécialiste Marketing'
        };
        return roles[idMembre] || 'Membre d\'équipe';
    }
    
    /**
     * Obtient la couleur d'un membre pour l'avatar
     * @param {string} idMembre - ID du membre
     * @returns {string} Couleur hexadécimale
     */
    getCouleurMembre(idMembre) {
        const couleurs = {
            'john': '4F46E5',
            'sarah': 'EF4444',
            'marc': '3B82F6',
            'emma': '8B5CF6',
            'alex': '10B981',
            'lisa': 'F59E0B',
            'thomas': 'EC4899'
        };
        return couleurs[idMembre] || '6B7280';
    }
    
    // ============================================
    // NOUVELLES FONCTIONNALITÉS DE SUPPRESSION
    // ============================================
    
    /**
     * Affiche l'interface de gestion des archives
     */
    afficherGestionArchives() {
        // Créer une modale pour les archives
        const modaleArchives = document.createElement('div');
        modaleArchives.className = 'modale-overlay';
        modaleArchives.id = 'modaleArchivesProjets';
        modaleArchives.innerHTML = `
            <div class="modale-projet" style="max-width: 800px;">
                <div class="en-tete-modale">
                    <h2>📦 Archive des projets supprimés</h2>
                    <button class="bouton-fermer-modale" onclick="document.getElementById('modaleArchivesProjets').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div style="padding: 1.5rem;">
                    <div class="controles-archives" style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <input type="text" id="rechercheArchive" placeholder="Rechercher dans l'archive..." 
                                   style="padding: 0.5rem; border: 1px solid var(--gris-300); border-radius: 6px; width: 300px;">
                        </div>
                        <div>
                            <button class="bouton-modale secondaire" onclick="gestionnaireProjets.viderArchive()">
                                <i class="fas fa-trash"></i> Vider l'archive
                            </button>
                        </div>
                    </div>
                    
                    <div id="listeArchives" style="max-height: 400px; overflow-y: auto;">
                        <!-- Liste des projets archivés -->
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modaleArchives);
        
        // Charger et afficher les archives
        this.afficherListeArchives();
        
        // Configurer la recherche
        document.getElementById('rechercheArchive').addEventListener('input', (e) => {
            this.filtrerArchives(e.target.value);
        });
    }
    
    /**
     * Affiche la liste des projets archivés
     */
    afficherListeArchives() {
        const conteneur = document.getElementById('listeArchives');
        if (!conteneur) return;
        
        try {
            const archives = JSON.parse(localStorage.getItem('tgnova_projets_archive') || '[]');
            
            if (archives.length === 0) {
                conteneur.innerHTML = `
                    <div style="text-align: center; padding: 3rem; color: #9CA3AF;">
                        <i class="fas fa-archive" style="font-size: 3rem; opacity: 0.5; margin-bottom: 1rem;"></i>
                        <p>Aucun projet dans l'archive</p>
                    </div>
                `;
                return;
            }
            
            conteneur.innerHTML = archives.map(projet => {
                const dateSuppression = new Date(projet.dateSuppression).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                return `
                    <div class="carte-archive" data-id="${projet.id}" style="
                        background: white;
                        border: 1px solid var(--gris-200);
                        border-radius: 12px;
                        padding: 1rem;
                        margin-bottom: 1rem;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <div style="flex: 1;">
                            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                                <span class="categorie-projet ${projet.categorie}" style="font-size: 0.75rem;">${this.getCategorieLabel(projet.categorie)}</span>
                                <span style="font-size: 0.75rem; color: #6B7280; background: #F3F4F6; padding: 0.25rem 0.5rem; border-radius: 4px;">
                                    <i class="fas fa-calendar"></i> ${dateSuppression}
                                </span>
                            </div>
                            <h4 style="margin: 0 0 0.5rem 0; color: #111827;">${projet.titre}</h4>
                            <p style="margin: 0; color: #6B7280; font-size: 0.875rem;">${projet.description}</p>
                            <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
                                <span style="font-size: 0.75rem; color: #6B7280;">
                                    <i class="fas fa-tasks"></i> ${projet.taches || 0} tâches
                                </span>
                                <span style="font-size: 0.75rem; color: #6B7280;">
                                    <i class="fas fa-users"></i> ${projet.membres.length} membres
                                </span>
                                <span style="font-size: 0.75rem; color: #6B7280;">
                                    <i class="fas fa-chart-bar"></i> ${projet.progression}% terminé
                                </span>
                            </div>
                        </div>
                        <div style="display: flex; gap: 0.5rem;">
                            <button onclick="gestionnaireProjets.restaurerProjet(${projet.id})" 
                                    style="padding: 0.5rem 1rem; background: #10B981; color: white; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                                <i class="fas fa-redo"></i> Restaurer
                            </button>
                            <button onclick="gestionnaireProjets.supprimerArchive(${projet.id})" 
                                    style="padding: 0.5rem 1rem; background: #EF4444; color: white; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                                <i class="fas fa-trash"></i> Supprimer
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Erreur lors du chargement des archives:', error);
            conteneur.innerHTML = `
                <div style="color: #EF4444; text-align: center; padding: 2rem;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>Erreur lors du chargement des archives</p>
                </div>
            `;
        }
    }
    
    /**
     * Filtre les archives par texte de recherche
     * @param {string} texte - Texte de recherche
     */
    filtrerArchives(texte) {
        const terme = texte.toLowerCase().trim();
        const cartes = document.querySelectorAll('.carte-archive');
        
        if (!terme) {
            cartes.forEach(carte => carte.style.display = 'flex');
            return;
        }
        
        cartes.forEach(carte => {
            const titre = carte.querySelector('h4').textContent.toLowerCase();
            const description = carte.querySelector('p').textContent.toLowerCase();
            const categorie = carte.querySelector('.categorie-projet').textContent.toLowerCase();
            
            const correspond = titre.includes(terme) || 
                              description.includes(terme) || 
                              categorie.includes(terme);
            
            carte.style.display = correspond ? 'flex' : 'none';
        });
    }
    
    /**
     * Restaure un projet depuis l'archive
     * @param {number} projetId - ID du projet à restaurer
     */
    restaurerProjet(projetId) {
        try {
            const archives = JSON.parse(localStorage.getItem('tgnova_projets_archive') || '[]');
            const index = archives.findIndex(p => p.id === projetId);
            
            if (index === -1) {
                this.afficherMessage("Projet non trouvé dans l'archive", 'erreur');
                return;
            }
            
            const projetArchive = archives[index];
            
            // Vérifier si un projet avec le même ID existe déjà
            const existeDeja = this.projets.some(p => p.id === projetId);
            if (existeDeja) {
                modalUtils.demanderConfirmation(
                    'Projet existant',
                    `Un projet avec l'ID ${projetId} existe déjà. Voulez-vous le remplacer ?`,
                    () => {
                        // Supprimer l'ancienne version
                        this.projets = this.projets.filter(p => p.id !== projetId);
                        this.projets.unshift(projetArchive);
                        this.sauvegarderProjets();
                        const newArchives = archives.filter((_, indexArchive) => indexArchive !== index);
                        localStorage.setItem('tgnova_projets_archive', JSON.stringify(newArchives));
                        this.afficherProjets();
                        this.afficherListeArchives();
                        this.mettreAJourStatistiques();
                        this.afficherMessage(`Projet "${projetArchive.titre}" restauré avec succès`, 'succes');
                    }
                );
                return;
            }
            
            // Nettoyer les données d'archive
            delete projetArchive.dateSuppression;
            delete projetArchive.raisonSuppression;
            
            // Ajouter le projet restauré
            this.projets.unshift(projetArchive);
            this.sauvegarderProjets();
            
            // Retirer de l'archive
            archives.splice(index, 1);
            localStorage.setItem('tgnova_projets_archive', JSON.stringify(archives));
            
            // Mettre à jour l'affichage
            this.afficherProjets();
            this.afficherListeArchives();
            this.mettreAJourStatistiques();
            
            this.afficherMessage(`Projet "${projetArchive.titre}" restauré avec succès`, 'succes');
        } catch (error) {
            console.error('Erreur lors de la restauration:', error);
            this.afficherMessage("Erreur lors de la restauration du projet", 'erreur');
        }
    }
    
    /**
     * Supprime un projet de l'archive
     * @param {number} projetId - ID du projet à supprimer
     */
    supprimerArchive(projetId) {
        modalUtils.demanderConfirmation(
            'Suppression d\'archive',
            "Êtes-vous sûr de vouloir supprimer définitivement ce projet de l'archive ? Cette action est irréversible.",
            () => {
                try {
                    const archives = JSON.parse(localStorage.getItem('tgnova_projets_archive') || '[]');
                    const nouvelleArchive = archives.filter(p => p.id !== projetId);
                    localStorage.setItem('tgnova_projets_archive', JSON.stringify(nouvelleArchive));

                    this.afficherListeArchives();
                    this.afficherMessage("Projet supprimé définitivement de l'archive", 'succes');
                } catch (error) {
                    console.error('Erreur lors de la suppression:', error);
                    this.afficherMessage("Erreur lors de la suppression", 'erreur');
                }
            }
        );
    }
    
    /**
     * Vide complètement l'archive
     */
    viderArchive() {
        const archives = JSON.parse(localStorage.getItem('tgnova_projets_archive') || '[]');
        
        if (archives.length === 0) {
            this.afficherMessage("L'archive est déjà vide", 'info');
            return;
        }
        
        modalUtils.demanderConfirmation(
            'Vider l\'archive',
            `Êtes-vous sûr de vouloir vider complètement l'archive ?\n\nCette action supprimera définitivement ${archives.length} projet${archives.length > 1 ? 's' : ''} et est irréversible.`,
            () => {
                localStorage.removeItem('tgnova_projets_archive');
                this.afficherListeArchives();
                this.afficherMessage(`Archive vidée (${archives.length} projet${archives.length > 1 ? 's' : ''} supprimé${archives.length > 1 ? 's' : ''})`, 'succes');
            }
        );
    }
    
    // ============================================
    // FONCTIONNALITÉS DE SÉLECTION MULTIPLE - AMÉLIORÉES
    // ============================================
    
    /**
     * Active ou désactive le mode de sélection multiple
     */
    activerModeSelectionMultiple() {
        if (this.modeSelection) {
            return;
        }
        
        this.modeSelection = true;
        
        // Mettre à jour le bouton
        const bouton = document.getElementById('boutonSelectionMultiple');
        if (bouton) {
            bouton.classList.add('active');
            bouton.innerHTML = '<i class="fas fa-check-double"></i> Annuler sélection';
        }
        
        // Créer la barre d'actions en bas
        this.creerBarreActionsMultiples();
        
        // Ajouter les cases à cocher aux projets
        this.ajouterCasesSelection();
        
        // Ajouter le sélecteur "Tout sélectionner" dans l'en-tête du tableau
        this.ajouterSelecteurTout();
        
        // Ajuster le style des projets pour la sélection
        this.adapterStylePourSelection();
        
        this.afficherMessage("Mode sélection multiple activé - Sélectionnez les projets à gérer", 'info');
    }
    
    /**
     * Crée la barre d'actions multiples
     */
    creerBarreActionsMultiples() {
        // Vérifier si la barre existe déjà
        if (document.getElementById('barreActionsMultiples')) {
            return;
        }
        
        const barreActions = document.createElement('div');
        barreActions.id = 'barreActionsMultiples';
        barreActions.className = 'barre-actions-multiples';
        barreActions.innerHTML = `
            <div class="contenu-barra-actions">
                <div class="infos-selection">
                    <span id="compteurSelection" class="compteur-selection">
                        <i class="fas fa-check-circle"></i>
                        <span class="nombre">0</span> projet(s) sélectionné(s)
                    </span>
                    <button class="bouton-action-secondaire petit" id="boutonDeselectionnerTout">
                        <i class="fas fa-times"></i> Tout désélectionner
                    </button>
                </div>
                <div class="actions-selection">
                    <button class="bouton-action-secondaire" id="boutonArchiverSelection">
                        <i class="fas fa-archive"></i> Archiver
                    </button>
                    <button class="bouton-action-principal supprimer" id="boutonSupprimerSelection">
                        <i class="fas fa-trash"></i> Supprimer la sélection
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(barreActions);
        
        // Ajouter les écouteurs d'événements
        document.getElementById('boutonDeselectionnerTout').addEventListener('click', () => this.deselectionnerTout());
        document.getElementById('boutonSupprimerSelection').addEventListener('click', () => this.supprimerSelectionMultiple());
        document.getElementById('boutonArchiverSelection').addEventListener('click', () => this.archiverSelectionMultiple());
        
        // Mettre à jour le compteur initial
        this.mettreAJourCompteurSelection();
    }
    
    /**
     * Ajoute les cases à cocher pour la sélection multiple
     */
    ajouterCasesSelection() {
        // Pour la vue grille
        document.querySelectorAll('.carte-projet').forEach((carte, index) => {
            // Vérifier si la case existe déjà
            if (carte.querySelector('.checkbox-selection-projet')) {
                return;
            }
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'checkbox-selection-projet';
            checkbox.dataset.id = carte.dataset.id;
            checkbox.dataset.index = index;
            
            checkbox.addEventListener('change', () => this.mettreAJourCompteurSelection());
            
            // Créer un conteneur pour la checkbox
            const conteneurCheckbox = document.createElement('div');
            conteneurCheckbox.className = 'conteneur-checkbox-selection';
            conteneurCheckbox.appendChild(checkbox);
            
            carte.style.position = 'relative';
            carte.insertBefore(conteneurCheckbox, carte.firstChild);
        });
        
        // Pour la vue tableau
        document.querySelectorAll('.tableau-projets tbody tr').forEach((ligne, index) => {
            // Vérifier si la case existe déjà
            if (ligne.querySelector('.checkbox-selection-projet')) {
                return;
            }
            
            const cellule = document.createElement('td');
            cellule.className = 'cellule-selection';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'checkbox-selection-projet';
            checkbox.dataset.id = ligne.dataset.id;
            checkbox.dataset.index = index;
            
            checkbox.addEventListener('change', () => this.mettreAJourCompteurSelection());
            
            cellule.appendChild(checkbox);
            ligne.insertBefore(cellule, ligne.firstChild);
        });
    }
    
    /**
     * Ajoute le sélecteur "Tout sélectionner"
     */
    ajouterSelecteurTout() {
        // Pour l'en-tête du tableau
        const thead = document.querySelector('.tableau-projets thead tr');
        if (thead && !thead.querySelector('.cellule-selection-tout')) {
            const thCheckbox = document.createElement('th');
            thCheckbox.className = 'cellule-selection-tout';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = 'selectionToutProjets';
            
            checkbox.addEventListener('change', (e) => {
                const estCoche = e.target.checked;
                document.querySelectorAll('.checkbox-selection-projet').forEach(cb => {
                    cb.checked = estCoche;
                });
                this.mettreAJourCompteurSelection();
            });
            
            thCheckbox.appendChild(checkbox);
            thead.insertBefore(thCheckbox, thead.firstChild);
        }
        
        // Pour la vue grille (ajouter dans l'en-tête des projets)
        const enTeteProjets = document.querySelector('.en-tete-projets');
        if (enTeteProjets && !enTeteProjets.querySelector('#selectionToutProjetsGrille')) {
            const conteneurCheckbox = document.createElement('div');
            conteneurCheckbox.className = 'conteneur-selection-tout-grille';
            conteneurCheckbox.style.marginLeft = '10px';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = 'selectionToutProjetsGrille';
            checkbox.style.marginRight = '8px';
            
            const label = document.createElement('label');
            label.htmlFor = 'selectionToutProjetsGrille';
            label.textContent = 'Tout sélectionner';
            label.style.fontSize = '0.875rem';
            label.style.color = '#6B7280';
            
            checkbox.addEventListener('change', (e) => {
                const estCoche = e.target.checked;
                document.querySelectorAll('.checkbox-selection-projet').forEach(cb => {
                    cb.checked = estCoche;
                });
                this.mettreAJourCompteurSelection();
            });
            
            conteneurCheckbox.appendChild(checkbox);
            conteneurCheckbox.appendChild(label);
            
            // Trouver le conteneur des boutons d'action
            const boutonsContainer = enTeteProjets.querySelector('.boutons-action-projets');
            if (boutonsContainer) {
                boutonsContainer.insertBefore(conteneurCheckbox, boutonsContainer.firstChild);
            }
        }
    }
    
    /**
     * Adapte le style des projets pour la sélection
     */
    adapterStylePourSelection() {
        // Ajouter une classe pour indiquer le mode sélection
        document.querySelectorAll('.carte-projet, .tableau-projets tbody tr').forEach(element => {
            element.classList.add('mode-selection-active');
        });
    }
    
    /**
     * Met à jour le compteur de projets sélectionnés
     */
    mettreAJourCompteurSelection() {
        const selectionnes = document.querySelectorAll('.checkbox-selection-projet:checked');
        const compteur = document.getElementById('compteurSelection');
        const barreActions = document.getElementById('barreActionsMultiples');
        
        if (compteur) {
            const nombreElement = compteur.querySelector('.nombre');
            if (nombreElement) {
                nombreElement.textContent = selectionnes.length;
            }
        }
        
        if (barreActions) {
            barreActions.style.display = selectionnes.length > 0 ? 'flex' : 'none';
        }
        
        // Mettre à jour les sélecteurs "Tout sélectionner"
        const toutesCheckboxes = document.querySelectorAll('.checkbox-selection-projet');
        const toutesCochees = toutesCheckboxes.length > 0 && 
                              selectionnes.length === toutesCheckboxes.length;
        
        document.querySelectorAll('#selectionToutProjets, #selectionToutProjetsGrille').forEach(checkbox => {
            checkbox.checked = toutesCochees;
            checkbox.indeterminate = selectionnes.length > 0 && !toutesCochees;
        });
        
        // Mettre à jour le style des projets sélectionnés
        this.mettreAJourStyleSelection(selectionnes);
    }
    
    /**
     * Met à jour le style des projets sélectionnés
     * @param {NodeList} selectionnes - Checkboxes sélectionnées
     */
    mettreAJourStyleSelection(selectionnes) {
        // Réinitialiser tous les styles
        document.querySelectorAll('.carte-projet, .tableau-projets tbody tr').forEach(element => {
            element.classList.remove('projet-selectionne');
        });
        
        // Appliquer le style aux projets sélectionnés
        selectionnes.forEach(checkbox => {
            const id = checkbox.dataset.id;
            const carte = document.querySelector(`.carte-projet[data-id="${id}"]`);
            const ligne = document.querySelector(`.tableau-projets tbody tr[data-id="${id}"]`);
            
            if (carte) carte.classList.add('projet-selectionne');
            if (ligne) ligne.classList.add('projet-selectionne');
        });
    }
    
    /**
     * Désélectionne tous les projets
     */
    deselectionnerTout() {
        document.querySelectorAll('.checkbox-selection-projet').forEach(cb => {
            cb.checked = false;
        });
        this.mettreAJourCompteurSelection();
        this.afficherMessage("Tous les projets désélectionnés", 'info');
    }
    
    /**
     * Supprime les projets sélectionnés
     */
    supprimerSelectionMultiple() {
        const casesSelectionnees = document.querySelectorAll('.checkbox-selection-projet:checked');
        
        if (casesSelectionnees.length === 0) {
            this.afficherMessage("Aucun projet sélectionné", 'erreur');
            return;
        }
        
        const ids = Array.from(casesSelectionnees).map(cb => parseInt(cb.dataset.id));
        const projets = this.projets.filter(p => ids.includes(p.id));
        const nomsProjets = projets.map(p => `"${p.titre}"`).join(', ');
        
        const message = projets.length > 1 
            ? `Êtes-vous sûr de vouloir supprimer ${projets.length} projets ?\n\nProjets concernés:\n${nomsProjets}\n\n⚠️ Cette action est irréversible.`
            : `Êtes-vous sûr de vouloir supprimer le projet ${nomsProjets} ?\n\n⚠️ Cette action est irréversible.`;
        
        modalUtils.demanderConfirmation(
            'Suppression multiple',
            message,
            () => {
                // Supprimer chaque projet
                ids.forEach(id => {
                    this.supprimerProjetDefinitivement(id, true);
                });

                // Quitter le mode sélection
                this.quitterModeSelection();

                this.afficherMessage(`${ids.length} projet${ids.length > 1 ? 's' : ''} supprimé${ids.length > 1 ? 's' : ''} avec succès`, 'succes');
            }
        );
    }
    
    /**
     * Archive les projets sélectionnés
     */
    archiverSelectionMultiple() {
        const casesSelectionnees = document.querySelectorAll('.checkbox-selection-projet:checked');
        
        if (casesSelectionnees.length === 0) {
            this.afficherMessage("Aucun projet sélectionné", 'erreur');
            return;
        }
        
        const ids = Array.from(casesSelectionnees).map(cb => parseInt(cb.dataset.id));
        
        modalUtils.demanderConfirmation(
            'Archivage multiple',
            `Êtes-vous sûr de vouloir archiver ${ids.length} projet${ids.length > 1 ? 's' : ''} ?\n\nLes projets archivés seront déplacés dans l'archive et ne seront plus visibles dans la liste principale.`,
            () => {
                // Archiver chaque projet
                ids.forEach(id => {
                    const projet = this.projets.find(p => p.id === id);
                    if (projet) {
                        this.archiverProjetAvantSuppression(projet);

                        // Mettre à jour le statut du projet
                        projet.archive = true;
                        projet.statut = 'termine';
                    }
                });

                // Sauvegarder les modifications
                this.sauvegarderProjets();
                this.afficherProjets();
                this.mettreAJourStatistiques();

                // Quitter le mode sélection
                this.quitterModeSelection();

                this.afficherMessage(`${ids.length} projet${ids.length > 1 ? 's' : ''} archivé${ids.length > 1 ? 's' : ''} avec succès`, 'succes');
            }
        );
    }

    /**
     * Quitte le mode de sélection multiple
     */
    quitterModeSelection() {
        // Supprimer les cases à cocher
        document.querySelectorAll('.checkbox-selection-projet').forEach(cb => {
            const conteneur = cb.closest('.conteneur-checkbox-selection, .cellule-selection');
            if (conteneur) {
                conteneur.remove();
            }
        });
        
        // Supprimer les sélecteurs "Tout sélectionner"
        document.querySelectorAll('.cellule-selection-tout, .conteneur-selection-tout-grille').forEach(el => el.remove());
        
        // Retirer les classes de style
        document.querySelectorAll('.carte-projet, .tableau-projets tbody tr').forEach(element => {
            element.classList.remove('mode-selection-active', 'projet-selectionne');
        });
        
        // Cacher la barre d'actions
        const barreActions = document.getElementById('barreActionsMultiples');
        if (barreActions) {
            barreActions.remove();
        }
        
        // Mettre à jour le bouton
        const bouton = document.getElementById('boutonSelectionMultiple');
        if (bouton) {
            bouton.classList.remove('active');
            bouton.innerHTML = '<i class="fas fa-check-square"></i> Sélection multiple';
        }
        
        this.modeSelection = false;
        this.afficherMessage("Mode sélection multiple désactivé", 'info');
    }
}

// Initialiser l'application
document.addEventListener('DOMContentLoaded', () => {
    window.gestionnaireProjets = new GestionnaireProjets();
    
    // Ajouter des styles pour les animations et la sélection multiple
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        @keyframes fadeOut {
            from { opacity: 1; transform: scale(1); }
            to { opacity: 0; transform: scale(0.95); }
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        
        .valeur-info.erreur {
            color: #EF4444 !important;
            font-weight: 600;
        }
        
        .fa-star {
            color: #F59E0B;
        }
        
        .fa-star-o {
            color: var(--gris-400);
        }
        
        /* Styles pour les couleurs de projet */
        .entete-apercu.bleu { background: #3b82f6; }
        .entete-apercu.vert { background: #10b981; }
        .entete-apercu.violet { background: #8b5cf6; }
        .entete-apercu.orange { background: #f59e0b; }
        .entete-apercu.rose { background: #ec4899; }
        .entete-apercu.rouge { background: #ef4444; }
        .entete-apercu.cyan { background: #06b6d4; }
        .entete-apercu.jaune { background: #fbbf24; }
        
        /* Styles pour les boutons de suppression */
        .bouton-action-projet.supprimer {
            color: #EF4444;
            border-color: #EF4444;
        }
        
        .bouton-action-projet.supprimer:hover {
            background: #FEE2E2;
            color: #DC2626;
            border-color: #DC2626;
        }
        
        /* Badge pour les projets archivés */
        .badge-statut-projet.archive {
            background: #F3F4F6 !important;
            color: #6B7280 !important;
            border: 1px solid #D1D5DB;
        }
        
        /* ============================================ */
        /* STYLES POUR LA SÉLECTION MULTIPLE - AMÉLIORÉS */
        /* ============================================ */
        
        /* Bouton de sélection multiple */
        .bouton-selection-multiple {
            padding: 0.75rem 1.25rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            border-radius: 10px;
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-size: 0.95rem;
            font-weight: 600;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }
        
        .bouton-selection-multiple:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }
        
        .bouton-selection-multiple.active {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
            animation: pulse 2s infinite;
        }
        
        .bouton-selection-multiple.active:hover {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            box-shadow: 0 6px 20px rgba(220, 38, 38, 0.4);
        }
        
        /* Cases à cocher */
        .checkbox-selection-projet {
            width: 22px;
            height: 22px;
            cursor: pointer;
            accent-color: #4F46E5;
            transition: all 0.2s ease;
            border-radius: 6px;
        }
        
        .checkbox-selection-projet:hover {
            transform: scale(1.1);
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }
        
        /* Conteneurs pour les cases à cocher */
        .conteneur-checkbox-selection {
            position: absolute;
            top: 16px;
            left: 16px;
            z-index: 10;
            background: rgba(255, 255, 255, 0.9);
            padding: 4px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .cellule-selection {
            width: 50px;
            text-align: center;
            vertical-align: middle;
            background: #F9FAFB;
        }
        
        .cellule-selection-tout {
            width: 50px;
            text-align: center;
            vertical-align: middle;
            background: #F3F4F6;
            font-weight: 500;
            color: #374151;
        }
        
        .conteneur-selection-tout-grille {
            display: flex;
            align-items: center;
            padding: 0.5rem 1rem;
            background: #F3F4F6;
            border-radius: 8px;
            border: 1px solid #E5E7EB;
        }
        
        /* Barre d'actions multiples */
        .barre-actions-multiples {
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: white;
            padding: 0;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            display: none;
            align-items: center;
            z-index: 1000;
            min-width: 600px;
            overflow: hidden;
            border: 2px solid #4F46E5;
            animation: slideUp 0.3s ease;
        }
        
        @keyframes slideUp {
            from { 
                opacity: 0;
                transform: translateX(-50%) translateY(100px);
            }
            to { 
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
        }
        
        .contenu-barra-actions {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            padding: 1.25rem 1.5rem;
        }
        
        .infos-selection {
            display: flex;
            align-items: center;
            gap: 1.5rem;
        }
        
        .compteur-selection {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-weight: 600;
            color: #1F2937;
            font-size: 1rem;
        }
        
        .compteur-selection i {
            color: #4F46E5;
            font-size: 1.25rem;
        }
        
        .compteur-selection .nombre {
            background: #4F46E5;
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-weight: 700;
            min-width: 30px;
            text-align: center;
        }
        
        .actions-selection {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .bouton-action-secondaire.petit {
            padding: 0.5rem 1rem;
            font-size: 0.875rem;
            background: #F3F4F6;
            color: #374151;
            border: 1px solid #D1D5DB;
        }
        
        .bouton-action-secondaire.petit:hover {
            background: #E5E7EB;
        }
        
        /* Styles pour les projets en mode sélection */
        .carte-projet.mode-selection-active {
            cursor: pointer;
            transition: all 0.3s ease;
            border: 2px solid transparent;
        }
        
        .carte-projet.mode-selection-active:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 24px rgba(0,0,0,0.15);
            border-color: rgba(79, 70, 229, 0.3);
        }
        
        .carte-projet.projet-selectionne {
            border: 2px solid #4F46E5 !important;
            box-shadow: 0 8px 20px rgba(79, 70, 229, 0.2) !important;
            background: linear-gradient(to right, rgba(79, 70, 229, 0.02), rgba(79, 70, 229, 0.05));
        }
        
        .tableau-projets tbody tr.projet-selectionne {
            background: linear-gradient(to right, rgba(79, 70, 229, 0.05), rgba(79, 70, 229, 0.1)) !important;
            border-left: 4px solid #4F46E5;
        }
        
        .tableau-projets tbody tr.mode-selection-active:hover {
            background: #F9FAFB;
            cursor: pointer;
        }
        
        /* Animation pour la suppression */
        .projet-supprime {
            animation: fadeOut 0.3s ease forwards;
        }
        
        /* Style pour les cartes d'archive */
        .carte-archive {
            transition: all 0.3s ease;
        }
        
        .carte-archive:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        /* Toast personnalisé pour les suppressions */
        .toast-suppression {
            border-left: 4px solid #EF4444 !important;
        }
        
        /* Responsive pour la barre d'actions */
        @media (max-width: 768px) {
            .barre-actions-multiples {
                min-width: 90%;
                bottom: 20px;
            }
            
            .contenu-barra-actions {
                flex-direction: column;
                gap: 1rem;
                padding: 1rem;
            }
            
            .infos-selection {
                width: 100%;
                justify-content: space-between;
            }
            
            .actions-selection {
                width: 100%;
                justify-content: space-between;
            }
        }
        
        /* Styles pour les boutons d'action dans la barre */
        #boutonSupprimerSelection {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 10px;
            font-weight: 600;
            transition: all 0.3s ease;
        }
        
        #boutonSupprimerSelection:hover {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(220, 38, 38, 0.3);
        }
        
        #boutonArchiverSelection {
            padding: 0.75rem 1.5rem;
            border-radius: 10px;
            border: 2px solid #6B7280;
            color: #6B7280;
            font-weight: 600;
            transition: all 0.3s ease;
        }
        
        #boutonArchiverSelection:hover {
            background: #6B7280;
            color: white;
            transform: translateY(-2px);
        }
    `;
    document.head.appendChild(style);
});

// Exposer les fonctions globales
window.supprimerProjet = function(id) {
    if (window.gestionnaireProjets) {
        gestionnaireProjets.supprimerProjetDefinitivement(id);
    }
};

window.activerModeSelectionProjets = function() {
    if (window.gestionnaireProjets) {
        gestionnaireProjets.toggleModeSelectionMultiple();
    }
};

// Fonction pour archiver la sélection (exposée globalement)
window.archiverSelectionProjets = function() {
    if (window.gestionnaireProjets) {
        gestionnaireProjets.archiverSelectionMultiple();
    }
};

console.log('✨ Gestionnaire de projets chargé avec fonctionnalités de sélection multiple avancées !');