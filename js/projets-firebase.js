/**
 * SYSTÈME DE GESTION DES PROJETS AVEC FIREBASE
 * Gère la création, modification, suppression et affichage des projets
 */

// ============================================
// VARIABLES GLOBALES
// ============================================

let projetActuel = null;
let utilisateurConnecte = null;
let projetsListener = null;
let projets = {};

// ============================================
// INITIALISATION
// ============================================

/**
 * Initialise le système de projets
 */
async function initialiserProjetsFirebase() {
    console.log('🚀 Initialisation du système de projets Firebase');
    
    // Vérifier l'utilisateur connecté
    firebase.auth().onAuthStateChanged(async (user) => {
        if (!user) {
            console.error('Aucun utilisateur connecté');
            window.location.href = '../login.html';
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
            
            console.log('✅ Utilisateur connecté:', utilisateurConnecte.nom);
            
            // Charger les projets de l'utilisateur
            chargerProjets();
            
            // Initialiser les événements de l'interface
            initialiserEvenementsProjets();
            
        } catch (error) {
            console.error('Erreur initialisation utilisateur:', error);
        }
    });
}

/**
 * Initialise les événements de l'interface projets
 */
function initialiserEvenementsProjets() {
    // Bouton nouveau projet
    const boutonNouveauProjet = document.getElementById('boutonNouveauProjet');
    if (boutonNouveauProjet) {
        boutonNouveauProjet.addEventListener('click', () => {
            ouvrirModalProjet();
        });
    }
    
    // Bouton annuler dans la modale
    const boutonAnnuler = document.getElementById('boutonAnnulerProjet');
    if (boutonAnnuler) {
        boutonAnnuler.addEventListener('click', fermerModalProjet);
    }
    
    // Bouton fermer de la modale
    const boutonFermer = document.getElementById('boutonFermerModale');
    if (boutonFermer) {
        boutonFermer.addEventListener('click', fermerModalProjet);
    }
    
    // Formulaire de projet
    const formulaire = document.getElementById('formulaireProjet');
    if (formulaire) {
        formulaire.addEventListener('submit', (e) => {
            e.preventDefault();
            sauvegarderProjet();
        });
    }
    
    // Bouton fermer modale info
    const boutonFermerInfo = document.getElementById('boutonFermerModaleInfo');
    if (boutonFermerInfo) {
        boutonFermerInfo.addEventListener('click', fermerModaleInfoProjet);
    }
    
    const boutonFermerInfo2 = document.getElementById('boutonFermerInfo');
    if (boutonFermerInfo2) {
        boutonFermerInfo2.addEventListener('click', fermerModaleInfoProjet);
    }
    
    // Bouton éditer depuis info
    const boutonEditer = document.getElementById('boutonEditerDepuisInfo');
    if (boutonEditer) {
        boutonEditer.addEventListener('click', () => {
            if (projetActuel) {
                fermerModaleInfoProjet();
                ouvrirModalProjet(projetActuel);
            }
        });
    }
    
    // Sélecteur de vue (grille/tableau)
    const selecteurVue = document.getElementById('selecteurVueProjets');
    if (selecteurVue) {
        selecteurVue.addEventListener('change', (e) => {
            const vueGrille = document.getElementById('vueGrilleProjets');
            const vueTableau = document.getElementById('vueTableauProjets');
            
            if (e.target.value === 'grille') {
                vueGrille.style.display = 'grid';
                vueTableau.style.display = 'none';
            } else {
                vueGrille.style.display = 'none';
                vueTableau.style.display = 'block';
            }
        });
    }
    
    // Filtres de projets
    document.querySelectorAll('.bouton-filtre').forEach(bouton => {
        bouton.addEventListener('click', (e) => {
            document.querySelectorAll('.bouton-filtre').forEach(b => b.classList.remove('actif'));
            bouton.classList.add('actif');
            
            const filtre = bouton.dataset.filtre;
            filtrerProjets(filtre);
        });
    });
    
    // Recherche
    const champRecherche = document.getElementById('champRechercheProjets');
    if (champRecherche) {
        champRecherche.addEventListener('input', (e) => {
            rechercherProjets(e.target.value.toLowerCase());
        });
    }
    
    // Fermeture des modales au clic sur l'overlay
    document.querySelectorAll('.modale-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                if (overlay.id === 'modaleProjet') {
                    fermerModalProjet();
                } else if (overlay.id === 'modaleInfoProjet') {
                    fermerModaleInfoProjet();
                }
            }
        });
    });
}

// ============================================
// CHARGEMENT DES UTILISATEURS
// ============================================

/**
 * Charge tous les utilisateurs depuis Firebase et remplit le select des membres
 */
async function chargerUtilisateursPourProjets(membresSelectionnes = []) {
    try {
        const db = firebase.firestore();
        const snapshot = await db.collection('utilisateurs').get();
        
        const selectMembres = document.getElementById('membresProjet');
        if (!selectMembres) return;
        
        // Vider le select (garder seulement une option vide au début si nécessaire)
        selectMembres.innerHTML = '<option value="">Sélectionnez des membres...</option>';
        
        if (snapshot.empty) {
            console.warn('⚠️ Aucun utilisateur trouvé dans la collection "utilisateurs"');
            return;
        }
        
        // Ajouter tous les utilisateurs comme options
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = data.nom || 'Utilisateur';
            
            // Sélectionner si dans la liste des membres sélectionnés
            if (membresSelectionnes.includes(doc.id)) {
                option.selected = true;
            }
            
            selectMembres.appendChild(option);
        });
        
        console.log(`✅ ${snapshot.size} utilisateurs chargés pour la sélection des membres`);
        
    } catch (error) {
        console.error('❌ Erreur lors du chargement des utilisateurs:', error);
    }
}

// ============================================
// CHARGEMENT DES PROJETS
// ============================================

/**
 * Charge les projets de l'utilisateur en temps réel
 */
function chargerProjets() {
    if (!utilisateurConnecte) return;
    
    const db = firebase.firestore();
    
    // Écouter les projets où l'utilisateur est membre ou créateur
    const q = db.collection('projets')
        .where('membres', 'array-contains', utilisateurConnecte.id);
    // Ne pas ordonner côté Firestore pour éviter l'obligation d'un index composite
    
    projetsListener = q.onSnapshot((snapshot) => {
        projets = {};
        
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            
            // Convertir les timestamps Firestore en objets Date
            const projet = {
                id: doc.id,
                ...data,
                dateCreation: data.dateCreation?.toDate?.() || null,
                dateModification: data.dateModification?.toDate?.() || null,
                dateDebut: data.dateDebut ? new Date(data.dateDebut) : null,
                dateLimite: data.dateLimite ? new Date(data.dateLimite) : null
            };
            
            projets[doc.id] = projet;
        });
        
        // Trier en JS par date de création (descendant)
        const sortedProjets = Object.values(projets).sort((a, b) => {
            const da = a.dateCreation ? a.dateCreation.getTime() : 0;
            const db = b.dateCreation ? b.dateCreation.getTime() : 0;
            return db - da;
        });
        projets = Object.fromEntries(sortedProjets.map(p => [p.id, p]));
        
        console.log(`✅ ${Object.keys(projets).length} projets chargés`);
        
        // Mettre à jour l'affichage
        mettreAJourAffichageProjets();
        
        // Mettre à jour les statistiques
        mettreAJourStatistiques();
        
    }, (error) => {
        console.error('Erreur chargement projets:', error);
        afficherNotification('Erreur de chargement des projets', 'erreur');
    });
}

/**
 * Met à jour l'affichage des projets (grille et tableau)
 */
function mettreAJourAffichageProjets() {
    const projetsArray = Object.values(projets);
    const vueActuelle = document.getElementById('selecteurVueProjets')?.value || 'grille';
    const filtreActif = document.querySelector('.bouton-filtre.actif')?.dataset.filtre || 'tous';
    const termeRecherche = document.getElementById('champRechercheProjets')?.value.toLowerCase() || '';
    
    // Filtrer les projets
    let projetsFiltres = projetsArray;
    
    // Appliquer le filtre de statut
    if (filtreActif !== 'tous') {
        projetsFiltres = projetsFiltres.filter(p => {
            if (filtreActif === 'actifs') return p.statut === 'actif';
            if (filtreActif === 'termines') return p.statut === 'termine';
            if (filtreActif === 'en-retard') return p.statut === 'en-retard';
            if (filtreActif === 'favoris') return p.favori === true;
            return true;
        });
    }
    
    // Appliquer la recherche
    if (termeRecherche) {
        projetsFiltres = projetsFiltres.filter(p => 
            p.titre?.toLowerCase().includes(termeRecherche) ||
            p.nom?.toLowerCase().includes(termeRecherche) ||
            p.description?.toLowerCase().includes(termeRecherche) ||
            p.categorie?.toLowerCase().includes(termeRecherche)
        );
    }
    
    // Afficher l'état vide si nécessaire
    const etatVide = document.getElementById('etatVideProjets');
    if (projetsFiltres.length === 0) {
        if (etatVide) etatVide.style.display = 'block';
        document.getElementById('vueGrilleProjets').innerHTML = '';
        document.getElementById('corpsTableauProjets').innerHTML = '';
        return;
    } else {
        if (etatVide) etatVide.style.display = 'none';
    }
    
    // Mettre à jour la grille
    mettreAJourGrilleProjets(projetsFiltres);
    
    // Mettre à jour le tableau
    mettreAJourTableauProjets(projetsFiltres);
}

/**
 * Met à jour la vue grille des projets
 */
function mettreAJourGrilleProjets(projetsArray) {
    const grille = document.getElementById('vueGrilleProjets');
    if (!grille) return;
    
    grille.innerHTML = projetsArray.map(projet => {
        const progression = projet.progression || 0;
        const dateLimite = projet.dateLimite ? new Date(projet.dateLimite) : null;
        const estEnRetard = dateLimite && dateLimite < new Date() && projet.statut !== 'termine';
        
        // Déterminer la classe du statut
        let statutClass = 'actif';
        if (projet.statut === 'termine') statutClass = 'termine';
        else if (estEnRetard || projet.statut === 'en-retard') statutClass = 'en-retard';
        
        // Icône de favori
        const favoriIcon = projet.favori ? 'fas fa-star' : 'far fa-star';
        
        // Membres (limiter à 3)
        const membres = projet.membresInfo || [];
        const membresAffiches = membres.slice(0, 3);
        const membresRestants = membres.length - 3;
        
        return `
            <div class="carte-projet" data-projet-id="${projet.id}">
                <div class="en-tete-carte-projet">
                    <div class="infos-projet-principales">
                        <span class="categorie-projet ${projet.categorie || 'autre'}">${projet.categorie || 'Projet'}</span>
                        <h3 class="titre-projet">${echapperHTML(projet.titre || projet.nom || 'Sans titre')}</h3>
                        ${projet.description ? `<p class="description-projet">${echapperHTML(projet.description.substring(0, 100))}${projet.description.length > 100 ? '...' : ''}</p>` : ''}
                        <div class="progression-courte">
                            <div class="barre-progression-courte" style="width: ${progression}%"></div>
                        </div>
                    </div>
                    <span class="pourcentage-projet">${progression}%</span>
                </div>
                
                <div class="corps-carte-projet">
                    <div class="meta-projet">
                        <div class="element-meta-projet">
                            <i class="fas fa-calendar-alt"></i>
                            <span>Début: ${formaterDate(projet.dateDebut) || 'Non définie'}</span>
                        </div>
                        <div class="element-meta-projet">
                            <i class="fas fa-clock"></i>
                            <span>Limite: ${formaterDate(projet.dateLimite) || 'Non définie'}</span>
                        </div>
                    </div>
                    
                    <div class="membres-projet">
                        ${membresAffiches.map(membre => `
                            <div class="avatar-membre" title="${membre.nom || 'Membre'}">
                                <img src="${membre.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(membre.nom || 'M')}&background=4F46E5&color=fff`}" alt="${membre.nom || 'Membre'}">
                            </div>
                        `).join('')}
                        ${membresRestants > 0 ? `<div class="plus-membres">+${membresRestants}</div>` : ''}
                    </div>
                </div>
                
                <div class="pied-carte-projet">
                    <span class="badge-statut-projet ${statutClass}">
                        <i class="fas ${obtenirIconeStatut(projet.statut, estEnRetard)}"></i>
                        ${obtenirTexteStatut(projet.statut, estEnRetard)}
                    </span>
                    
                    <div class="actions-projet">
                        <button class="bouton-action-projet ouvrir" onclick="event.stopPropagation(); window.afficherDetailsProjet('${projet.id}')" title="Voir les détails">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="bouton-action-projet editer" onclick="event.stopPropagation(); window.ouvrirModalProjet('${projet.id}')" title="Modifier">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="bouton-action-projet favori" onclick="event.stopPropagation(); window.toggleFavoriProjet('${projet.id}')" title="${projet.favori ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
                            <i class="${favoriIcon}"></i>
                        </button>
                        <button class="bouton-action-projet supprimer" onclick="event.stopPropagation(); window.confirmerSuppressionProjet('${projet.id}')" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Ajouter l'événement de clic sur la carte pour ouvrir les détails
    document.querySelectorAll('.carte-projet').forEach(carte => {
        carte.addEventListener('click', (e) => {
            // Ne pas ouvrir si on clique sur un bouton
            if (e.target.closest('.bouton-action-projet')) return;
            
            const projetId = carte.dataset.projetId;
            if (projetId) afficherDetailsProjet(projetId);
        });
    });
}

/**
 * Met à jour la vue tableau des projets
 */
function mettreAJourTableauProjets(projetsArray) {
    const corpsTableau = document.getElementById('corpsTableauProjets');
    if (!corpsTableau) return;
    
    corpsTableau.innerHTML = projetsArray.map(projet => {
        const progression = projet.progression || 0;
        const dateLimite = projet.dateLimite ? new Date(projet.dateLimite) : null;
        const estEnRetard = dateLimite && dateLimite < new Date() && projet.statut !== 'termine';
        
        // Déterminer la classe du statut
        let statutClass = 'actif';
        if (projet.statut === 'termine') statutClass = 'termine';
        else if (estEnRetard || projet.statut === 'en-retard') statutClass = 'en-retard';
        
        // Icône de favori
        const favoriIcon = projet.favori ? 'fas fa-star' : 'far fa-star';
        
        return `
            <tr data-projet-id="${projet.id}">
                <td>
                    <strong>${echapperHTML(projet.titre || projet.nom || 'Sans titre')}</strong>
                </td>
                <td>
                    <span class="categorie-projet ${projet.categorie || 'autre'}">${projet.categorie || 'Projet'}</span>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="width: 80px; height: 6px; background: var(--gris-200); border-radius: 3px;">
                            <div style="width: ${progression}%; height: 100%; background: var(--degrade-bleu); border-radius: 3px;"></div>
                        </div>
                        <span>${progression}%</span>
                    </div>
                </td>
                <td>
                    <span class="badge-statut-projet ${statutClass}">
                        <i class="fas ${obtenirIconeStatut(projet.statut, estEnRetard)}"></i>
                        ${obtenirTexteStatut(projet.statut, estEnRetard)}
                    </span>
                </td>
                <td>${formaterDate(projet.dateLimite) || 'Non définie'}</td>
                <td>
                    <div class="actions-projet">
                        <button class="bouton-action-projet ouvrir" onclick="event.stopPropagation(); window.afficherDetailsProjet('${projet.id}')" title="Voir les détails">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="bouton-action-projet editer" onclick="event.stopPropagation(); window.ouvrirModalProjet('${projet.id}')" title="Modifier">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="bouton-action-projet favori" onclick="event.stopPropagation(); window.toggleFavoriProjet('${projet.id}')" title="${projet.favori ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
                            <i class="${favoriIcon}"></i>
                        </button>
                        <button class="bouton-action-projet supprimer" onclick="event.stopPropagation(); window.confirmerSuppressionProjet('${projet.id}')" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    // Ajouter l'événement de clic sur la ligne
    document.querySelectorAll('#corpsTableauProjets tr').forEach(ligne => {
        ligne.addEventListener('click', (e) => {
            if (e.target.closest('.bouton-action-projet')) return;
            
            const projetId = ligne.dataset.projetId;
            if (projetId) afficherDetailsProjet(projetId);
        });
    });
}

/**
 * Met à jour les statistiques des projets
 */
function mettreAJourStatistiques() {
    const projetsArray = Object.values(projets);
    
    const projetsActifs = projetsArray.filter(p => p.statut === 'actif').length;
    const projetsTermines = projetsArray.filter(p => p.statut === 'termine').length;
    const projetsEnRetard = projetsArray.filter(p => {
        if (p.statut === 'en-retard') return true;
        
        const dateLimite = p.dateLimite ? new Date(p.dateLimite) : null;
        return dateLimite && dateLimite < new Date() && p.statut !== 'termine';
    }).length;
    
    // Compter les équipes uniques impliquées
    const tousMembres = projetsArray.flatMap(p => p.membres || []);
    const equipesUniques = [...new Set(tousMembres)].length;
    
    // Mettre à jour l'affichage
    const statActifs = document.getElementById('statProjetsActifs');
    const statTermines = document.getElementById('statProjetsTermines');
    const statEnRetard = document.getElementById('statProjetsEnRetard');
    const statEquipes = document.getElementById('statEquipesImpliquees');
    
    if (statActifs) animerCompteur(statActifs, projetsActifs);
    if (statTermines) animerCompteur(statTermines, projetsTermines);
    if (statEnRetard) animerCompteur(statEnRetard, projetsEnRetard);
    if (statEquipes) animerCompteur(statEquipes, equipesUniques);
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
// CRÉATION ET MODIFICATION DE PROJETS
// ============================================

/**
 * Ouvre la modale de projet (création ou édition)
 */
function ouvrirModalProjet(projetId = null) {
    const modal = document.getElementById('modaleProjet');
    const titreModal = document.getElementById('titreModaleProjet');
    const formulaire = document.getElementById('formulaireProjet');
    const projetIdInput = document.getElementById('projetId');
    
    if (!modal) return;
    
    // Réinitialiser le formulaire
    formulaire.reset();
    
    if (projetId && projets[projetId]) {
        // Mode édition
        const projet = projets[projetId];
        projetActuel = projetId;
        
        titreModal.textContent = 'Modifier le projet';
        projetIdInput.value = projetId;
        
        // Remplir le formulaire
        document.getElementById('titreProjet').value = projet.titre || projet.nom || '';
        document.getElementById('categorieProjet').value = projet.categorie || '';
        document.getElementById('descriptionProjet').value = projet.description || '';
        
        if (projet.dateDebut) {
            const dateDebut = new Date(projet.dateDebut);
            document.getElementById('dateDebutProjet').value = dateDebut.toISOString().split('T')[0];
        }
        
        if (projet.dateLimite) {
            const dateLimite = new Date(projet.dateLimite);
            document.getElementById('dateLimiteProjet').value = dateLimite.toISOString().split('T')[0];
        }
        
        document.getElementById('statutProjet').value = projet.statut || 'actif';
        document.getElementById('progressionProjet').value = projet.progression || 0;
        document.getElementById('valeurProgression').textContent = (projet.progression || 0) + '%';
        
        // Charger les utilisateurs et sélectionner les membres du projet
        chargerUtilisateursPourProjets(projet.membres || []);
    } else {
        // Mode création
        titreModal.textContent = 'Nouveau projet';
        projetIdInput.value = '';
        projetActuel = null;
        
        // Valeurs par défaut
        const aujourdhui = new Date().toISOString().split('T')[0];
        document.getElementById('dateDebutProjet').value = aujourdhui;
        
        const dateLimite = new Date();
        dateLimite.setMonth(dateLimite.getMonth() + 1);
        document.getElementById('dateLimiteProjet').value = dateLimite.toISOString().split('T')[0];
        
        document.getElementById('progressionProjet').value = 0;
        document.getElementById('valeurProgression').textContent = '0%';
        
        // Charger les utilisateurs et sélectionner l'utilisateur courant par défaut
        chargerUtilisateursPourProjets(utilisateurConnecte ? [utilisateurConnecte.id] : []);
    }
    
    modal.classList.add('active');
}

/**
 * Ferme la modale de projet
 */
function fermerModalProjet() {
    const modal = document.getElementById('modaleProjet');
    if (modal) {
        modal.classList.remove('active');
        projetActuel = null;
    }
}

/**
 * Sauvegarde un projet (création ou modification)
 */
async function sauvegarderProjet() {
    if (!utilisateurConnecte) {
        afficherNotification('Vous devez être connecté', 'erreur');
        return;
    }
    
    // Récupérer les valeurs du formulaire
    const projetId = document.getElementById('projetId').value;
    const titre = document.getElementById('titreProjet').value.trim();
    const categorie = document.getElementById('categorieProjet').value;
    const description = document.getElementById('descriptionProjet').value.trim();
    const dateDebut = document.getElementById('dateDebutProjet').value;
    const dateLimite = document.getElementById('dateLimiteProjet').value;
    const statut = document.getElementById('statutProjet').value;
    const progression = parseInt(document.getElementById('progressionProjet').value) || 0;
    
    // Récupérer les membres sélectionnés
    const selectMembres = document.getElementById('membresProjet');
    const membres = Array.from(selectMembres.selectedOptions).map(opt => opt.value);
    
    // Validation
    if (!titre) {
        afficherNotification('Le titre du projet est obligatoire', 'erreur');
        document.getElementById('titreProjet').focus();
        return;
    }
    
    if (!categorie) {
        afficherNotification('La catégorie est obligatoire', 'erreur');
        document.getElementById('categorieProjet').focus();
        return;
    }
    
    if (!dateDebut) {
        afficherNotification('La date de début est obligatoire', 'erreur');
        document.getElementById('dateDebutProjet').focus();
        return;
    }
    
    if (!dateLimite) {
        afficherNotification('La date limite est obligatoire', 'erreur');
        document.getElementById('dateLimiteProjet').focus();
        return;
    }
    
    // S'assurer que l'utilisateur courant est dans les membres
    if (!membres.includes(utilisateurConnecte.id)) {
        membres.push(utilisateurConnecte.id);
    }
    
    try {
        const db = firebase.firestore();
        const maintenant = new Date();
        
        // Récupérer les informations des membres
        const membresInfo = [];
        for (const userId of membres) {
            try {
                const docUser = await db.collection('utilisateurs').doc(userId).get();
                if (docUser.exists) {
                    membresInfo.push({
                        id: userId,
                        nom: docUser.data().nom || 'Utilisateur',
                        email: docUser.data().email || '',
                        avatar: docUser.data().avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(docUser.data().nom || 'U')}&background=4F46E5&color=fff`
                    });
                }
            } catch (error) {
                console.warn(`Impossible de récupérer l'utilisateur ${userId}:`, error);
            }
        }
        
        const donneesProjet = {
            titre: titre,
            nom: titre, // Pour compatibilité
            categorie: categorie,
            description: description,
            dateDebut: dateDebut,
            dateLimite: dateLimite,
            statut: statut,
            progression: progression,
            membres: membres,
            membresInfo: membresInfo,
            dateModification: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        if (projetId) {
            // Mise à jour
            await db.collection('projets').doc(projetId).update(donneesProjet);
            console.log('✅ Projet mis à jour:', projetId);
            afficherNotification('Projet mis à jour avec succès', 'succes');
        } else {
            // Création
            donneesProjet.createurId = utilisateurConnecte.id;
            donneesProjet.dateCreation = firebase.firestore.FieldValue.serverTimestamp();
            donneesProjet.favori = false;
            
            const docRef = await db.collection('projets').add(donneesProjet);
            console.log('✅ Projet créé:', docRef.id);
            afficherNotification('Projet créé avec succès', 'succes');
        }
        
        fermerModalProjet();
        
    } catch (error) {
        console.error('Erreur sauvegarde projet:', error);
        afficherNotification('Erreur lors de la sauvegarde du projet', 'erreur');
    }
}

// ============================================
// GESTION DES PROJETS (Actions)
// ============================================

/**
 * Affiche les détails d'un projet
 */
async function afficherDetailsProjet(projetId) {
    const projet = projets[projetId];
    if (!projet) return;
    
    projetActuel = projetId;
    
    const modal = document.getElementById('modaleInfoProjet');
    const corps = document.getElementById('corpsModaleInfo');
    
    if (!modal || !corps) return;
    
    const dateLimite = projet.dateLimite ? new Date(projet.dateLimite) : null;
    const estEnRetard = dateLimite && dateLimite < new Date() && projet.statut !== 'termine';
    
    // Déterminer la classe du statut
    let statutClass = 'actif';
    if (projet.statut === 'termine') statutClass = 'termine';
    else if (estEnRetard || projet.statut === 'en-retard') statutClass = 'en-retard';
    
    const statutTexte = obtenirTexteStatut(projet.statut, estEnRetard);
    
    // Récupérer les tâches associées à ce projet
    let tachesProjet = [];
    try {
        const db = firebase.firestore();
        const snapshot = await db.collection('tasks')
            .where('projetId', '==', projetId)
            .get();
        
        tachesProjet = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.warn('Erreur récupération tâches:', error);
    }
    
    const tacheTerminees = tachesProjet.filter(t => t.statut === 'terminee').length;
    const totalTaches = tachesProjet.length;
    const progressionTaches = totalTaches > 0 ? Math.round((tacheTerminees / totalTaches) * 100) : 0;
    
    corps.innerHTML = `
        <div class="en-tete-info-projet">
            <span class="categorie-projet ${projet.categorie || 'autre'}">${projet.categorie || 'Projet'}</span>
            <h2 class="titre-info-projet">${echapperHTML(projet.titre || projet.nom || 'Sans titre')}</h2>
            ${projet.description ? `<p class="description-info-projet">${echapperHTML(projet.description)}</p>` : ''}
        </div>
        
        <div class="progression-info">
            <div class="en-tete-progression-info">
                <h3>Progression du projet</h3>
                <span class="pourcentage-progression-info">${projet.progression || 0}%</span>
            </div>
            <div class="barre-progression-info">
                <div class="remplissage-progression-info" style="width: ${projet.progression || 0}%"></div>
            </div>
        </div>
        
        ${totalTaches > 0 ? `
        <div class="progression-info" style="margin-top: 0.5rem;">
            <div class="en-tete-progression-info">
                <h3>Tâches complétées</h3>
                <span class="pourcentage-progression-info">${tacheTerminees}/${totalTaches} (${progressionTaches}%)</span>
            </div>
            <div class="barre-progression-info">
                <div class="remplissage-progression-info" style="width: ${progressionTaches}%"></div>
            </div>
        </div>
        ` : ''}
        
        <div class="grille-info-projet">
            <div class="groupe-info">
                <h3>Détails</h3>
                <div class="element-info">
                    <i class="fas fa-calendar-alt"></i>
                    <span>Date de début: <span class="valeur-info">${formaterDate(projet.dateDebut) || 'Non définie'}</span></span>
                </div>
                <div class="element-info">
                    <i class="fas fa-clock"></i>
                    <span>Date limite: <span class="valeur-info">${formaterDate(projet.dateLimite) || 'Non définie'}</span></span>
                </div>
                <div class="element-info">
                    <i class="fas fa-tasks"></i>
                    <span>Total tâches: <span class="valeur-info">${totalTaches}</span></span>
                </div>
                <div class="element-info">
                    <i class="fas fa-check-circle"></i>
                    <span>Tâches terminées: <span class="valeur-info">${tacheTerminees}</span></span>
                </div>
                <div class="element-info">
                    <i class="fas fa-tag"></i>
                    <span>Statut: <span class="statut-info ${statutClass}">${statutTexte}</span></span>
                </div>
            </div>
            
            <div class="groupe-info">
                <h3>Dates</h3>
                <div class="element-info">
                    <i class="fas fa-plus-circle"></i>
                    <span>Créé le: <span class="valeur-info">${formaterDateComplet(projet.dateCreation)}</span></span>
                </div>
                <div class="element-info">
                    <i class="fas fa-edit"></i>
                    <span>Modifié le: <span class="valeur-info">${formaterDateComplet(projet.dateModification) || 'Jamais'}</span></span>
                </div>
            </div>
        </div>
        
        <div class="membres-info-projet">
            <h3>Équipe (${(projet.membresInfo || []).length})</h3>
            <div class="liste-membres">
                ${(projet.membresInfo || []).map(membre => `
                    <div class="membre-info">
                        <div class="avatar-membre-info">
                            <img src="${membre.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(membre.nom || 'M')}&background=4F46E5&color=fff`}" alt="${membre.nom || 'Membre'}">
                        </div>
                        <div class="infos-membre">
                            <h4>${echapperHTML(membre.nom || 'Membre')}</h4>
                            <p>${membre.email || ''}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        ${tachesProjet.length > 0 ? `
        <div class="membres-info-projet">
            <h3>Tâches récentes</h3>
            <div style="max-height: 200px; overflow-y: auto;">
                ${tachesProjet.slice(0, 5).map(tache => `
                    <div style="padding: 0.75rem; border-bottom: 1px solid var(--gris-200); display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>${echapperHTML(tache.titre || 'Sans titre')}</strong>
                            <div style="font-size: 0.75rem; color: var(--gris-600);">${tache.description ? echapperHTML(tache.description.substring(0, 50)) + (tache.description.length > 50 ? '...' : '') : ''}</div>
                        </div>
                        <span class="badge-statut-projet ${tache.statut === 'terminee' ? 'termine' : tache.statut === 'en-cours' ? 'actif' : 'autre'}">
                            ${tache.statut === 'terminee' ? 'Terminée' : tache.statut === 'en-cours' ? 'En cours' : 'À faire'}
                        </span>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
    `;
    
    modal.classList.add('active');
}

/**
 * Ferme la modale d'information
 */
function fermerModaleInfoProjet() {
    const modal = document.getElementById('modaleInfoProjet');
    if (modal) {
        modal.classList.remove('active');
        projetActuel = null;
    }
}

/**
 * Bascule le statut favori d'un projet
 */
async function toggleFavoriProjet(projetId) {
    if (!utilisateurConnecte || !projets[projetId]) return;
    
    try {
        const db = firebase.firestore();
        const nouveauFavori = !projets[projetId].favori;
        
        await db.collection('projets').doc(projetId).update({
            favori: nouveauFavori
        });
        
        afficherNotification(
            nouveauFavori ? 'Projet ajouté aux favoris' : 'Projet retiré des favoris',
            'succes'
        );
        
    } catch (error) {
        console.error('Erreur toggle favori:', error);
        afficherNotification('Erreur lors de la mise à jour', 'erreur');
    }
}

/**
 * Confirme et supprime un projet
 */
function confirmerSuppressionProjet(projetId) {
    const projet = projets[projetId];
    if (!projet) return;

    modalUtils.demanderConfirmation(
        'Suppression de projet',
        `Êtes-vous sûr de vouloir supprimer définitivement le projet "${projet.titre || projet.nom}" ? Cette action est irréversible.`,
        () => supprimerProjet(projetId)
    );
}

/**
 * Supprime un projet
 */
async function supprimerProjet(projetId) {
    if (!utilisateurConnecte || !projets[projetId]) return;
    
    try {
        const db = firebase.firestore();
        await db.collection('projets').doc(projetId).delete();
        
        console.log('✅ Projet supprimé:', projetId);
        afficherNotification('Projet supprimé avec succès', 'succes');
        
        // Fermer les modales si ouvertes
        fermerModaleInfoProjet();
        fermerModalProjet();
        
    } catch (error) {
        console.error('Erreur suppression projet:', error);
        afficherNotification('Erreur lors de la suppression du projet', 'erreur');
    }
}

// ============================================
// FILTRES ET RECHERCHE
// ============================================

/**
 * Filtre les projets par statut
 */
function filtrerProjets(filtre) {
    mettreAJourAffichageProjets();
}

/**
 * Recherche des projets
 */
function rechercherProjets(terme) {
    mettreAJourAffichageProjets();
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
 * Formate une date au format court
 */
function formaterDate(date) {
    if (!date) return null;
    
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return null;
        
        const aujourdhui = new Date();
        aujourdhui.setHours(0, 0, 0, 0);
        
        const dateCompare = new Date(d);
        dateCompare.setHours(0, 0, 0, 0);
        
        const diffJours = Math.round((dateCompare - aujourdhui) / (1000 * 60 * 60 * 24));
        
        if (diffJours === 0) return "Aujourd'hui";
        if (diffJours === 1) return 'Demain';
        if (diffJours === -1) return 'Hier';
        
        return d.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: d.getFullYear() !== aujourdhui.getFullYear() ? 'numeric' : undefined
        });
    } catch (error) {
        return null;
    }
}

/**
 * Formate une date au format complet
 */
function formaterDateComplet(date) {
    if (!date) return null;
    
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return null;
        
        return d.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return null;
    }
}

/**
 * Obtient l'icône du statut
 */
function obtenirIconeStatut(statut, estEnRetard = false) {
    if (estEnRetard || statut === 'en-retard') return 'fa-exclamation-circle';
    if (statut === 'termine') return 'fa-check-circle';
    return 'fa-play-circle';
}

/**
 * Obtient le texte du statut
 */
function obtenirTexteStatut(statut, estEnRetard = false) {
    if (estEnRetard || statut === 'en-retard') return 'En retard';
    if (statut === 'termine') return 'Terminé';
    return 'Actif';
}

/**
 * Affiche une notification
 */
function afficherNotification(message, type = 'info') {
    console.log(`[${type}] ${message}`);
    
    // Utiliser la fonction du dashboard si disponible
    if (window.afficherToast) {
        window.afficherToast(message, type);
        return;
    }
    
    // Fallback
    modalUtils.afficherMessage('Information', message, type === 'erreur' ? 'erreur' : 'info');
}

// ============================================
// EXPOSITION DES FONCTIONS GLOBALES
// ============================================

window.TGNOVA_PROJETS = {
    initialiser: initialiserProjetsFirebase,
    ouvrirModalProjet,
    fermerModalProjet,
    sauvegarderProjet,
    afficherDetailsProjet,
    fermerModaleInfoProjet,
    toggleFavoriProjet,
    confirmerSuppressionProjet,
    supprimerProjet,
    filtrerProjets,
    rechercherProjets,
    mettreAJourAffichageProjets
};

// Exposition globale pour les événements onclick
window.ouvrirModalProjet = ouvrirModalProjet;
window.fermerModalProjet = fermerModalProjet;
window.sauvegarderProjet = sauvegarderProjet;
window.afficherDetailsProjet = afficherDetailsProjet;
window.fermerModaleInfoProjet = fermerModaleInfoProjet;
window.toggleFavoriProjet = toggleFavoriProjet;
window.confirmerSuppressionProjet = confirmerSuppressionProjet;
window.filtrerProjets = filtrerProjets;
window.rechercherProjets = rechercherProjets;

// Initialisation automatique
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialiserProjetsFirebase);
} else {
    initialiserProjetsFirebase();
}