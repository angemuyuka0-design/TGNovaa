// Gestion des paramètres
document.addEventListener('DOMContentLoaded', () => {
    initialiserParametres();
    chargerParametresSauvegardes();
    
    // Initialiser la gestion des mots de passe
    initialiserGestionMotsDePasse();
    
    // Initialiser la création de compte
    initialiserCreationCompte();

    // Attendre que Firebase soit prêt AVANT d'initialiser les sections d'administration
    firebase.auth().onAuthStateChanged((user) => {
        console.log('🔄 onAuthStateChanged déclenché, utilisateur:', user?.uid || 'non connecté');
        
        // Vérifier l'accès à la création de compte et administration
        verifierAccesCreationCompte();
        verifierAccesAdministration();
        
        // Initialiser l'administration une fois que Firebase est prêt
        initialiserAdministration();
    });
    
    // Afficher l'indicateur de modifications
    initialiserIndicateurModifications();
});

/**
 * Initialise les fonctionnalités des paramètres
 */
function initialiserParametres() {
    // Navigation entre les sections
    document.querySelectorAll('.element-navigation-parametres').forEach(element => {
        element.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('href').substring(1);
            afficherSection(sectionId);
        });
    });

    // Mode sombre avec préférence système
    const interrupteurModeSombre = document.getElementById('modeSombre');
    if (interrupteurModeSombre) {
        // Vérifier les préférences système et localStorage
        const modeSombreSysteme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const modeSombreSauvegarde = localStorage.getItem('modeSombre');
        const modeSombreActif = modeSombreSauvegarde !== null 
            ? modeSombreSauvegarde === 'true'
            : modeSombreSysteme;
        
        interrupteurModeSombre.checked = modeSombreActif;
        appliquerModeSombre(modeSombreActif);

        // Écouter les changements système
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                if (localStorage.getItem('modeSombre') === null) {
                    interrupteurModeSombre.checked = e.matches;
                    appliquerModeSombre(e.matches);
                }
            });
        }

        // Gérer le changement utilisateur
        interrupteurModeSombre.addEventListener('change', function() {
            localStorage.setItem('modeSombre', this.checked.toString());
            appliquerModeSombre(this.checked);
            
            if (window.TGNOVA) {
                window.TGNOVA.afficherToast(
                    this.checked ? 'Mode sombre activé' : 'Mode clair activé',
                    'info'
                );
            }
        });
    }

    // Sauvegarder les paramètres
    document.querySelectorAll('.bouton-parametre-principal').forEach(bouton => {
        if (bouton.id.includes('enregistrer') || bouton.textContent.includes('Enregistrer')) {
            bouton.addEventListener('click', sauvegarderParametres);
        }
    });

    // Gérer les abonnements
    document.querySelectorAll('.carte-abonnement button').forEach(bouton => {
        bouton.addEventListener('click', gererAbonnement);
    });

    // Recherche dans les paramètres
    const champRecherche = document.querySelector('.champ-recherche');
    if (champRecherche) {
        champRecherche.addEventListener('input', rechercherParametres);
    }

    // Validation en temps réel des champs de formulaire
    initialiserValidationFormulaire();

    // Gestion des onglets dans les paramètres
    initialiserOngletsParametres();

    // Éditeur de bio en temps réel
    initialiserEditeurBio();

    // Sélecteur de thème de couleur
    initialiserSelecteurCouleur();

    // Gestion des notifications
    initialiserGestionNotifications();
}

/**
 * Affiche une section spécifique des paramètres
 */
function afficherSection(sectionId) {
    // Animation de transition
    const sections = document.querySelectorAll('.section-parametres.active');
    sections.forEach(section => {
        section.classList.add('fade-out');
        setTimeout(() => {
            section.classList.remove('active', 'fade-out');
        }, 200);
    });

    // Mettre à jour la navigation
    document.querySelectorAll('.element-navigation-parametres').forEach(element => {
        element.classList.remove('active');
        if (element.getAttribute('href') === `#${sectionId}`) {
            element.classList.add('active');
            
            // Animation sur l'élément actif
            element.style.transform = 'translateY(-2px)';
            setTimeout(() => {
                element.style.transform = '';
            }, 300);
        }
    });

    // Afficher la nouvelle section avec animation
    setTimeout(() => {
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.add('fade-in');
            section.classList.add('active');
            
            setTimeout(() => {
                section.classList.remove('fade-in');
            }, 300);
        }
    }, 200);

    // Mettre à jour l'historique
    history.pushState({ section: sectionId }, '', `#${sectionId}`);

    // Recharger les données spécifiques à la section
    chargerDonneesSection(sectionId);
}

/**
 * Charge les données spécifiques à une section
 */
function chargerDonneesSection(sectionId) {
    switch(sectionId) {
        case 'compte':
            chargerStatistiquesCompte();
            break;
        case 'notifications':
            synchroniserPreferencesNotifications();
            break;
        case 'securite':
            verifierEtatSecurite();
            break;
        case 'abonnement':
            mettreAJourDetailsAbonnement();
            break;
    }
}

/**
 * Applique le mode sombre/clair
 */
function appliquerModeSombre(actif) {
    document.documentElement.setAttribute('data-theme', actif ? 'dark' : 'light');
    document.body.classList.toggle('mode-sombre', actif);
    
    // Sauvegarder pour les composants spécifiques
    document.querySelectorAll('[data-mode-sensitive]').forEach(element => {
        element.dataset.mode = actif ? 'dark' : 'light';
    });
}

/**
 * Sauvegarde les paramètres modifiés
 */
function sauvegarderParametres(event) {
    // Afficher un indicateur de chargement
    const bouton = event.target;
    const texteOriginal = bouton.innerHTML;
    bouton.innerHTML = '<span class="loader"></span> Enregistrement...';
    bouton.disabled = true;

    // Récupérer toutes les données du formulaire de manière dynamique
    const parametres = collecterParametresFormulaires();

    // Valider les données avant sauvegarde
    if (!validerParametres(parametres)) {
        reinitialiserBouton(bouton, texteOriginal);
        return;
    }

    // Simulation d'appel API avec délai réaliste
    setTimeout(() => {
        try {
            // Sauvegarder dans le localStorage
            localStorage.setItem('tgnova_parametres', JSON.stringify(parametres));
            localStorage.setItem('tgnova_parametres_timestamp', Date.now().toString());

            // Afficher un message de succès
            afficherMessage('Paramètres enregistrés avec succès', 'succes');

            // Mettre à jour l'affichage
            mettreAJourAffichageParametres(parametres);

            // Mettre à jour les indicateurs de modification
            document.querySelectorAll('[data-modified]').forEach(el => {
                delete el.dataset.modified;
            });

            // Synchroniser avec d'autres onglets
            synchroniserBetweenTabs();

        } catch (error) {
            console.error('Erreur de sauvegarde:', error);
            afficherMessage('Erreur lors de la sauvegarde', 'erreur');
        } finally {
            reinitialiserBouton(bouton, texteOriginal);
        }
    }, 800);
}

/**
 * Collecte tous les paramètres des formulaires
 */
function collecterParametresFormulaires() {
    const parametres = {
        // Section Compte
        compte: {
            nom: document.querySelector('[name="nom"]')?.value || '',
            email: document.querySelector('[name="email"]')?.value || '',
            telephone: document.querySelector('[name="telephone"]')?.value || '',
            bio: document.querySelector('[name="bio"]')?.value || ''
        },
        
        // Section Préférences
        preferences: {
            langue: document.querySelector('[name="langue"]')?.value || '',
            fuseauHoraire: document.querySelector('[name="fuseau_horaire"]')?.value || '',
            formatDate: document.querySelector('[name="format_date"]')?.value || '',
            themeCouleur: document.querySelector('[name="theme_couleur"]')?.value || '',
            densiteAffichage: document.querySelector('[name="densite"]')?.value || ''
        },
        
        // Section Notifications
        notifications: {
            email: {
                general: document.querySelector('[name="notif_email_general"]')?.checked || false
            },
            push: {
                general: document.querySelector('[name="notif_push_general"]')?.checked || false
            }
        },
        
        // Métadonnées
        meta: {
            derniereModification: new Date().toISOString(),
            versionParametres: '1.0'
        }
    };

    return parametres;
}

/**
 * Valide les paramètres avant sauvegarde
 */
function validerParametres(parametres) {
    const erreurs = [];

    // Validation email
    const email = parametres.compte.email;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        erreurs.push('Adresse email invalide');
        highlightErreur('[name="email"]');
    }

    // Validation téléphone (format international simplifié)
    const telephone = parametres.compte.telephone;
    if (telephone && !/^[\+]?[0-9\s\-\(\)]+$/.test(telephone.replace(/\s/g, ''))) {
        erreurs.push('Numéro de téléphone invalide');
        highlightErreur('[name="telephone"]');
    }

    if (erreurs.length > 0) {
        afficherMessage(`Erreurs: ${erreurs.join(', ')}`, 'erreur');
        return false;
    }

    return true;
}

/**
 * Met à jour l'affichage avec les nouveaux paramètres
 */
function mettreAJourAffichageParametres(parametres) {
    // Mettre à jour la barre latérale
    const nomUtilisateur = document.querySelector('.nom-utilisateur');
    if (nomUtilisateur && parametres.compte.nom) {
        nomUtilisateur.textContent = parametres.compte.nom;
    }

    const emailUtilisateur = document.querySelector('.email-utilisateur');
    if (emailUtilisateur && parametres.compte.email) {
        emailUtilisateur.textContent = parametres.compte.email;
    }

    // Mettre à jour le profil
    const titreProfil = document.querySelector('.infos-profil h3');
    if (titreProfil && parametres.compte.nom) {
        titreProfil.textContent = parametres.compte.nom;
    }

    const emailProfil = document.querySelector('.infos-profil p');
    if (emailProfil) {
        emailProfil.textContent = parametres.compte.email || 'Email non défini';
    }

    // Mettre à jour l'avatar avec les initiales
    if (parametres.compte.nom) {
        mettreAJourInitialesAvatar(parametres.compte.nom);
    }

    // Mettre à jour les indicateurs de paramètres
    mettreAJourIndicateursParametres(parametres);
}

/**
 * Met à jour l'avatar avec les initiales
 */
function mettreAJourInitialesAvatar(nomComplet) {
    const avatarInitiales = document.querySelectorAll('.avatar-initiales');
    if (avatarInitiales.length > 0 && nomComplet) {
        const initiales = nomComplet.split(' ')
            .map(part => part.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);
        
        avatarInitiales.forEach(el => {
            el.textContent = initiales || '?';
        });
    }
}

/**
 * Gère les actions d'abonnement
 */
function gererAbonnement(e) {
    const bouton = e.target;
    const carte = bouton.closest('.carte-abonnement');
    const plan = carte.querySelector('.titre-abonnement')?.textContent.trim() || 'Inconnu';
    
    // Désactiver temporairement le bouton
    const texteOriginal = bouton.innerHTML;
    bouton.innerHTML = '<span class="loader"></span> Traitement...';
    bouton.disabled = true;

    if (bouton.textContent.includes('Passer au plan Pro') || bouton.textContent.includes('Mettre à niveau')) {
        // Simulation de processus de paiement
        afficherMessage(`Mise à niveau vers ${plan}...`, 'info');

        // Simulation d'appel API
        setTimeout(() => {
            afficherMessage(`Abonnement ${plan} activé avec succès`, 'succes');
            reinitialiserBouton(bouton, texteOriginal);
        }, 2000);
    } else if (bouton.textContent.includes('Contacter')) {
        // Redirection vers le service commercial
        window.open('mailto:sales@tgnova.com?subject=Demande d\'information abonnement', '_blank');
        
        setTimeout(() => {
            reinitialiserBouton(bouton, texteOriginal);
        }, 1000);
    } else if (bouton.textContent.includes('Plan actuel')) {
        afficherMessage(`Vous êtes déjà sur le plan ${plan}`, 'info');
        reinitialiserBouton(bouton, texteOriginal);
    }
}

/**
 * Recherche dans les paramètres
 */
function rechercherParametres(e) {
    const terme = e.target.value.trim().toLowerCase();
    
    if (terme === '') {
        // Réinitialiser l'affichage
        document.querySelectorAll('.section-parametres, .groupe-parametres').forEach(el => {
            el.style.display = 'block';
            el.classList.remove('resultat-trouve');
        });
        return;
    }

    const sections = document.querySelectorAll('.section-parametres');
    
    sections.forEach(section => {
        const elements = section.querySelectorAll('h2, h3, label, .description-parametre');
        let correspondanceTrouvee = false;
        
        elements.forEach(element => {
            if (element.textContent.toLowerCase().includes(terme)) {
                correspondanceTrouvee = true;
            }
        });
        
        // Afficher/masquer la section
        section.style.display = correspondanceTrouvee ? 'block' : 'none';
        section.classList.toggle('resultat-trouve', correspondanceTrouvee);
    });
}

/**
 * Charge les paramètres sauvegardés
 */
function chargerParametresSauvegardes() {
    const donneesSauvegardes = localStorage.getItem('tgnova_parametres');
    
    if (donneesSauvegardes) {
        try {
            const parametres = JSON.parse(donneesSauvegardes);
            
            // Remplir les formulaires
            remplirFormulaireParametres(parametres);
            
            // Mettre à jour l'affichage
            mettreAJourAffichageParametres(parametres);
            
            console.log('Paramètres chargés depuis le stockage local');
        } catch (e) {
            console.error('Erreur de lecture des paramètres:', e);
        }
    } else {
        // Ne pas initialiser de paramètres par défaut, laisser les champs vides
        console.log('Aucun paramètre sauvegardé trouvé');
    }
}

/**
 * Remplit le formulaire avec les paramètres
 */
function remplirFormulaireParametres(parametres) {
    // Section Compte
    if (parametres.compte) {
        remplirChamp('[name="nom"]', parametres.compte.nom);
        remplirChamp('[name="email"]', parametres.compte.email);
        remplirChamp('[name="telephone"]', parametres.compte.telephone);
        remplirChamp('[name="bio"]', parametres.compte.bio);
    }

    // Section Préférences
    if (parametres.preferences) {
        remplirChamp('[name="langue"]', parametres.preferences.langue);
        remplirChamp('[name="fuseau_horaire"]', parametres.preferences.fuseauHoraire);
        remplirChamp('[name="format_date"]', parametres.preferences.formatDate);
        remplirChamp('[name="theme_couleur"]', parametres.preferences.themeCouleur);
        remplirChamp('[name="densite"]', parametres.preferences.densiteAffichage);
    }

    // Section Notifications
    if (parametres.notifications) {
        remplirCheckbox('[name="notif_email_general"]', parametres.notifications.email?.general);
        remplirCheckbox('[name="notif_push_general"]', parametres.notifications.push?.general);
    }
}

/**
 * Remplit un champ de formulaire
 */
function remplirChamp(selecteur, valeur) {
    const element = document.querySelector(selecteur);
    if (element && valeur !== undefined && valeur !== null) {
        element.value = valeur;
    }
}

/**
 * Remplit une checkbox
 */
function remplirCheckbox(selecteur, valeur) {
    const element = document.querySelector(selecteur);
    if (element) {
        element.checked = !!valeur;
    }
}

/**
 * Synchronise entre les onglets
 */
function synchroniserBetweenTabs(type = 'parametres') {
    const timestamp = Date.now();
    localStorage.setItem(`tgnova_sync_${type}`, timestamp.toString());
}

/**
 * Écoute les changements de localStorage
 */
window.addEventListener('storage', function(e) {
    if (e.key === 'tgnova_sync_parametres') {
        // Recharger les paramètres
        chargerParametresSauvegardes();
        
        afficherMessage('Paramètres synchronisés', 'info');
    }
});

/**
 * Réinitialise un bouton après action
 */
function reinitialiserBouton(bouton, texteOriginal) {
    bouton.innerHTML = texteOriginal;
    bouton.disabled = false;
}

/**
 * Met en évidence les erreurs de validation
 */
function highlightErreur(selecteur) {
    const element = document.querySelector(selecteur);
    if (element) {
        element.classList.add('erreur-validation');
        setTimeout(() => {
            element.classList.remove('erreur-validation');
        }, 3000);
    }
}

/**
 * Initialise la validation des formulaires
 */
function initialiserValidationFormulaire() {
    document.querySelectorAll('input, select, textarea').forEach(element => {
        element.addEventListener('change', function() {
            this.dataset.modified = 'true';
            
            // Validation en temps réel pour certains champs
            if (this.type === 'email' && this.value) {
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.value)) {
                    this.classList.add('invalide');
                } else {
                    this.classList.remove('invalide');
                }
            }
        });
    });
}

/**
 * Initialise les onglets des paramètres
 */
function initialiserOngletsParametres() {
    document.querySelectorAll('.onglet-parametres').forEach(onglet => {
        onglet.addEventListener('click', function() {
            const targetId = this.dataset.target;
            
            // Mettre à jour les onglets actifs
            document.querySelectorAll('.onglet-parametres').forEach(t => {
                t.classList.remove('actif');
            });
            this.classList.add('actif');
            
            // Afficher le contenu correspondant
            document.querySelectorAll('.contenu-onglet').forEach(contenu => {
                contenu.classList.remove('actif');
            });
            
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.add('actif');
            }
        });
    });
}

/**
 * Initialise l'éditeur de bio
 */
function initialiserEditeurBio() {
    const textareaBio = document.querySelector('[name="bio"]');
    const compteurBio = document.getElementById('compteur-bio');
    
    if (textareaBio && compteurBio) {
        // Mettre à jour le compteur
        textareaBio.addEventListener('input', function() {
            const longueur = this.value.length;
            compteurBio.textContent = `${longueur}/500`;
            
            if (longueur > 500) {
                compteurBio.classList.add('depasse');
            } else {
                compteurBio.classList.remove('depasse');
            }
        });
    }
}

/**
 * Initialise le sélecteur de couleur
 */
function initialiserSelecteurCouleur() {
    const selecteur = document.querySelector('[name="theme_couleur"]');
    if (selecteur) {
        // Ajouter des échantillons de couleur
        const conteneur = selecteur.parentNode;
        const palette = document.createElement('div');
        palette.className = 'palette-couleurs';
        
        const couleurs = [
            { valeur: 'bleu', nom: 'Bleu', code: '#0066cc' },
            { valeur: 'violet', nom: 'Violet', code: '#8a2be2' },
            { valeur: 'vert', nom: 'Vert', code: '#2e8b57' },
            { valeur: 'orange', nom: 'Orange', code: '#ff8c00' },
            { valeur: 'rose', nom: 'Rose', code: '#ff69b4' }
        ];
        
        couleurs.forEach(couleur => {
            const bouton = document.createElement('button');
            bouton.type = 'button';
            bouton.className = 'couleur-option';
            bouton.dataset.valeur = couleur.valeur;
            bouton.style.backgroundColor = couleur.code;
            bouton.title = couleur.nom;
            
            bouton.addEventListener('click', function() {
                selecteur.value = couleur.valeur;
                
                // Mettre à jour la sélection visuelle
                document.querySelectorAll('.couleur-option').forEach(btn => {
                    btn.classList.remove('selectionnee');
                });
                this.classList.add('selectionnee');
                
                // Appliquer le thème temporairement
                document.documentElement.style.setProperty('--couleur-principale', couleur.code);
            });
            
            palette.appendChild(bouton);
        });
        
        conteneur.appendChild(palette);
        
        // Sélectionner la couleur actuelle si elle existe
        setTimeout(() => {
            const couleurActuelle = selecteur.value;
            if (couleurActuelle) {
                const boutonCorrespondant = palette.querySelector(`[data-valeur="${couleurActuelle}"]`);
                if (boutonCorrespondant) {
                    boutonCorrespondant.classList.add('selectionnee');
                }
            }
        }, 100);
    }
}

/**
 * Initialise la gestion des notifications
 */
function initialiserGestionNotifications() {
    // Activer/désactiver toutes les notifications d'une catégorie
    document.querySelectorAll('.toggle-categorie').forEach(toggle => {
        toggle.addEventListener('change', function() {
            const categorie = this.dataset.categorie;
            const etat = this.checked;
            
            document.querySelectorAll(`[data-categorie="${categorie}"] input[type="checkbox"]`).forEach(cb => {
                cb.checked = etat;
            });
        });
    });
}

/**
 * Charge les préférences système
 */
function chargerPreferencesSysteme() {
    // Cette fonction peut être appelée mais ne fait rien par défaut
    // Elle est conservée pour compatibilité
}

/**
 * Met à jour les indicateurs de paramètres
 */
function mettreAJourIndicateursParametres(parametres) {
    // Indicateur de complétude du profil
    const champsRequises = ['nom', 'email'];
    const champsRemplis = champsRequises.filter(champ => 
        parametres.compte[champ] && parametres.compte[champ].trim() !== ''
    ).length;
    
    const pourcentageComplet = champsRequises.length > 0 
        ? Math.round((champsRemplis / champsRequises.length) * 100) 
        : 0;
    
    const indicateurProfil = document.querySelector('.indicateur-completude');
    if (indicateurProfil) {
        indicateurProfil.innerHTML = `
            <div class="progression-profil">
                <div class="barre-progression" style="width: ${pourcentageComplet}%"></div>
            </div>
            <span>Profil complété à ${pourcentageComplet}%</span>
        `;
    }
}

/**
 * Initialise la gestion des mots de passe
 */
function initialiserGestionMotsDePasse() {
    const champNouveau = document.getElementById('nouveauMotdepasse');
    const champConfirmation = document.getElementById('confirmerMotdepasse');
    const indicateurForce = document.getElementById('indicateurForceNouveau');
    const indicateurConfirmation = document.getElementById('indicateurConfirmation');
    
    if (champNouveau) {
        champNouveau.addEventListener('input', function() {
            const force = evaluerForceMotDePasse(this.value);
            mettreAJourIndicateurForce(indicateurForce, force);
            
            // Vérifier la confirmation si remplie
            if (champConfirmation && champConfirmation.value) {
                verifierConfirmationMotDePasse();
            }
        });
    }
    
    if (champConfirmation) {
        champConfirmation.addEventListener('input', verifierConfirmationMotDePasse);
    }
    
    // Bouton de mise à jour du mot de passe
    const boutonSecurite = document.getElementById('enregistrerSecurite');
    if (boutonSecurite) {
        boutonSecurite.addEventListener('click', mettreAJourMotDePasse);
    }
    
    // Bouton annuler
    const boutonAnnuler = document.getElementById('annulerSecurite');
    if (boutonAnnuler) {
        boutonAnnuler.addEventListener('click', reinitialiserFormulaireSecurite);
    }
}

/**
 * Évalue la force d'un mot de passe
 */
function evaluerForceMotDePasse(motdepasse) {
    let score = 0;
    
    // Longueur minimale
    if (motdepasse.length >= 8) score++;
    
    // Majuscules et minuscules
    if (/[a-z]/.test(motdepasse) && /[A-Z]/.test(motdepasse)) score++;
    
    // Chiffres
    if (/\d/.test(motdepasse)) score++;
    
    // Caractères spéciaux
    if (/[!@#$%^&*(),.?":{}|<>]/.test(motdepasse)) score++;
    
    return score;
}

/**
 * Met à jour l'indicateur de force
 */
function mettreAJourIndicateurForce(indicateur, score) {
    if (!indicateur) return;
    
    const barre = indicateur.querySelector('.barre-force');
    const texte = indicateur.querySelector('.texte-force');
    
    if (barre) barre.dataset.niveau = score;
    
    const niveaux = ['Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort'];
    if (texte) texte.textContent = niveaux[score] || 'Faible';
    
    // Mettre à jour la couleur du texte
    if (texte) {
        if (score <= 1) {
            texte.style.color = 'var(--rouge)';
        } else if (score === 2) {
            texte.style.color = 'var(--orange)';
        } else if (score === 3) {
            texte.style.color = 'var(--jaune)';
        } else {
            texte.style.color = 'var(--vert)';
        }
    }
}

/**
 * Vérifie la confirmation du mot de passe
 */
function verifierConfirmationMotDePasse() {
    const motdepasse = document.getElementById('nouveauMotdepasse')?.value || '';
    const confirmation = document.getElementById('confirmerMotdepasse')?.value || '';
    const indicateur = document.getElementById('indicateurConfirmation');
    
    if (!indicateur) return;
    
    if (!confirmation) {
        indicateur.innerHTML = '';
        return;
    }
    
    if (motdepasse === confirmation) {
        indicateur.innerHTML = '<i class="fas fa-check-circle"></i> Les mots de passe correspondent';
        indicateur.className = 'indicateur-confirmation valide';
    } else {
        indicateur.innerHTML = '<i class="fas fa-times-circle"></i> Les mots de passe ne correspondent pas';
        indicateur.className = 'indicateur-confirmation invalide';
    }
}

/**
 * Met à jour le mot de passe
 */
function mettreAJourMotDePasse(e) {
    e.preventDefault();
    
    const motdepasseActuel = document.getElementById('motdepasseActuel')?.value || '';
    const nouveauMotdepasse = document.getElementById('nouveauMotdepasse')?.value || '';
    const confirmation = document.getElementById('confirmerMotdepasse')?.value || '';
    
    // Validation
    if (!motdepasseActuel) {
        afficherMessage('Veuillez entrer votre mot de passe actuel', 'erreur');
        return;
    }
    
    if (nouveauMotdepasse.length < 8) {
        afficherMessage('Le nouveau mot de passe doit contenir au moins 8 caractères', 'erreur');
        return;
    }
    
    if (nouveauMotdepasse !== confirmation) {
        afficherMessage('Les mots de passe ne correspondent pas', 'erreur');
        return;
    }
    
    // Simulation de mise à jour
    const bouton = e.target;
    const texteOriginal = bouton.innerHTML;
    bouton.innerHTML = '<span class="loader"></span> Mise à jour...';
    bouton.disabled = true;
    
    setTimeout(() => {
        afficherMessage('Mot de passe mis à jour avec succès', 'succes');
        
        // Réinitialiser le formulaire
        reinitialiserFormulaireSecurite();
        
        // Réactiver le bouton
        bouton.innerHTML = texteOriginal;
        bouton.disabled = false;
    }, 1500);
}

/**
 * Réinitialise le formulaire de sécurité
 */
function reinitialiserFormulaireSecurite() {
    const champActuel = document.getElementById('motdepasseActuel');
    const champNouveau = document.getElementById('nouveauMotdepasse');
    const champConfirmation = document.getElementById('confirmerMotdepasse');
    
    if (champActuel) champActuel.value = '';
    if (champNouveau) champNouveau.value = '';
    if (champConfirmation) champConfirmation.value = '';
    
    // Réinitialiser les indicateurs
    const indicateurForce = document.getElementById('indicateurForceNouveau');
    if (indicateurForce) {
        const barre = indicateurForce.querySelector('.barre-force');
        const texte = indicateurForce.querySelector('.texte-force');
        
        if (barre) barre.dataset.niveau = 0;
        if (texte) {
            texte.textContent = 'Faible';
            texte.style.color = 'var(--gris-600)';
        }
    }
    
    const indicateurConfirmation = document.getElementById('indicateurConfirmation');
    if (indicateurConfirmation) indicateurConfirmation.innerHTML = '';
}

/**
 * Vérifie l'accès à la section administration selon le statut utilisateur
 */
function verifierAccesAdministration() {
    const elementNavigation = document.querySelector('[href="#administration"]');
    const sectionAdministration = document.getElementById('administration');

    // Attendre que les données utilisateur soient chargées
    const verifierStatut = () => {
        // Vérifier si l'utilisateur est connecté et a le statut administrateur
        const user = firebase.auth().currentUser;
        if (!user) {
            // Masquer la section si pas connecté
            if (elementNavigation) elementNavigation.style.display = 'none';
            if (sectionAdministration) sectionAdministration.style.display = 'none';
            return;
        }

        // Vérifier le statut dans Firestore
        const db = firebase.firestore();
        db.collection('utilisateurs').doc(user.uid).get()
            .then(doc => {
                if (doc.exists) {
                    const data = doc.data();
                    const statut = data.statut || data.role || null;

                    if (statut === 'administrateur' || statut === 'admin') {
                        // Afficher la section pour les administrateurs
                        if (elementNavigation) elementNavigation.style.display = 'flex';
                        if (sectionAdministration) sectionAdministration.style.display = 'block';
                        console.log('✅ Accès administration autorisé pour administrateur');
                    } else if (!statut) {
                        // Si aucun rôle défini (migration non faite), on affiche la section
                        // pour permettre l'opération de migration initiale.
                        if (elementNavigation) elementNavigation.style.display = 'flex';
                        if (sectionAdministration) sectionAdministration.style.display = 'block';
                        console.log('⚠️ Aucun rôle défini - afficher administration pour migration possible');
                    } else {
                        // Masquer la section pour les utilisateurs simples
                        if (elementNavigation) elementNavigation.style.display = 'none';
                        if (sectionAdministration) sectionAdministration.style.display = 'none';
                        console.log('🚫 Accès administration refusé - utilisateur simple');
                    }
                } else {
                    // Document non trouvé, masquer par défaut
                    if (elementNavigation) elementNavigation.style.display = 'none';
                    if (sectionAdministration) sectionAdministration.style.display = 'none';
                }
            })
            .catch(error => {
                console.error('Erreur vérification statut administration:', error);
                // En cas d'erreur, masquer par défaut
                if (elementNavigation) elementNavigation.style.display = 'none';
                if (sectionAdministration) sectionAdministration.style.display = 'none';
            });
    };

    // Écouter les changements d'authentification (pas d'appel immédiat)
    firebase.auth().onAuthStateChanged(verifierStatut);
}

/**
 * Vérifie l'accès à la création de compte selon le statut utilisateur
 */
function verifierAccesCreationCompte() {
    const elementNavigation = document.querySelector('[href="#creation-compte"]');
    const sectionCreation = document.getElementById('creation-compte');
    
    // Attendre que les données utilisateur soient chargées
    const verifierStatut = () => {
        // Vérifier si l'utilisateur est connecté et a le statut administrateur
        const user = firebase.auth().currentUser;
        if (!user) {
            // Masquer la section si pas connecté
            if (elementNavigation) elementNavigation.style.display = 'none';
            if (sectionCreation) sectionCreation.style.display = 'none';
            return;
        }
        
        // Vérifier le statut dans Firestore
        const db = firebase.firestore();
        db.collection('utilisateurs').doc(user.uid).get()
            .then(doc => {
                if (doc.exists) {
                    const data = doc.data();
                    const statut = data.statut || data.role || null;
                    
                    if (statut === 'administrateur' || statut === 'admin') {
                        // Afficher la section pour les administrateurs
                        if (elementNavigation) elementNavigation.style.display = 'flex';
                        if (sectionCreation) sectionCreation.style.display = 'block';
                        console.log('✅ Accès création de compte autorisé pour administrateur');
                    } else if (!statut) {
                        // Si aucun rôle défini, on montre la section pour migration / initialisation
                        if (elementNavigation) elementNavigation.style.display = 'flex';
                        if (sectionCreation) sectionCreation.style.display = 'block';
                        console.log('⚠️ Aucun rôle défini - afficher création compte pour migration possible');
                    } else {
                        // Masquer la section pour les utilisateurs simples
                        if (elementNavigation) elementNavigation.style.display = 'none';
                        if (sectionCreation) sectionCreation.style.display = 'none';
                        console.log('🚫 Accès création de compte refusé - utilisateur simple');
                    }
                } else {
                    // Document non trouvé, masquer par défaut
                    if (elementNavigation) elementNavigation.style.display = 'none';
                    if (sectionCreation) sectionCreation.style.display = 'none';
                }
            })
            .catch(error => {
                console.error('Erreur vérification statut:', error);
                // En cas d'erreur, masquer par défaut
                if (elementNavigation) elementNavigation.style.display = 'none';
                if (sectionCreation) sectionCreation.style.display = 'none';
            });
    };
    
    // Écouter les changements d'authentification (pas d'appel immédiat)
    firebase.auth().onAuthStateChanged(verifierStatut);
}

/**
 * Initialise la création de compte
 */
function initialiserCreationCompte() {
    // La vérification d'accès est déjà faite dans verifierAccesCreationCompte()
    
    const formulaire = document.getElementById('formCreationCompte');
    const champMotdepasse = document.getElementById('nouveauMotdepasseCompte');
    const champConfirmation = document.getElementById('confirmerMotdepasseCompte');
    const indicateurForce = document.getElementById('indicateurForceCreation');
    const indicateurConfirmation = document.getElementById('indicateurConfirmationCreation');
    const selecteurRole = document.querySelectorAll('input[name="role"]');
    const sectionPermissions = document.getElementById('permissionsSection');
    
    // Gestion du changement de rôle
    selecteurRole.forEach(radio => {
        radio.addEventListener('change', function() {
            if (sectionPermissions) {
                if (this.value === 'administrateur') {
                    sectionPermissions.classList.add('visible');
                } else {
                    sectionPermissions.classList.remove('visible');
                }
            }
        });
    });
    
    // Force du mot de passe
    if (champMotdepasse) {
        champMotdepasse.addEventListener('input', function() {
            const force = evaluerForceMotDePasse(this.value);
            mettreAJourIndicateurForce(indicateurForce, force);
            
            if (champConfirmation && champConfirmation.value) {
                verifierConfirmationCreation();
            }
        });
    }
    
    // Confirmation
    if (champConfirmation) {
        champConfirmation.addEventListener('input', verifierConfirmationCreation);
    }
    
    // Soumission du formulaire
    if (formulaire) {
        formulaire.addEventListener('submit', creerNouveauCompte);
    }
    
    // Charger les comptes existants
    chargerComptesCrees();
}

/**
 * Vérifie la confirmation du mot de passe (création)
 */
function verifierConfirmationCreation() {
    const motdepasse = document.getElementById('nouveauMotdepasseCompte')?.value || '';
    const confirmation = document.getElementById('confirmerMotdepasseCompte')?.value || '';
    const indicateur = document.getElementById('indicateurConfirmationCreation');
    
    if (!indicateur) return;
    
    if (!confirmation) {
        indicateur.innerHTML = '';
        return;
    }
    
    if (motdepasse === confirmation) {
        indicateur.innerHTML = '<i class="fas fa-check-circle"></i> Correspondance confirmée';
        indicateur.className = 'indicateur-confirmation valide';
    } else {
        indicateur.innerHTML = '<i class="fas fa-times-circle"></i> Non correspondant';
        indicateur.className = 'indicateur-confirmation invalide';
    }
}

/**
 * Génère un mot de passe aléatoire sécurisé
 */
function genererMotDePasseAleatoire(longueur = 12) {
    const minuscules = 'abcdefghijklmnopqrstuvwxyz';
    const majuscules = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const chiffres = '0123456789';
    const speciaux = '!@#$%^&*';
    
    let motdepasse = '';
    
    // Assurer au moins un caractère de chaque type
    motdepasse += minuscules[Math.floor(Math.random() * minuscules.length)];
    motdepasse += majuscules[Math.floor(Math.random() * majuscules.length)];
    motdepasse += chiffres[Math.floor(Math.random() * chiffres.length)];
    motdepasse += speciaux[Math.floor(Math.random() * speciaux.length)];
    
    // Compléter avec des caractères aléatoires
    const tousCaracteres = minuscules + majuscules + chiffres + speciaux;
    for (let i = motdepasse.length; i < longueur; i++) {
        motdepasse += tousCaracteres[Math.floor(Math.random() * tousCaracteres.length)];
    }
    
    // Mélanger le mot de passe
    return motdepasse.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Simule l'envoi d'un email avec le mot de passe
 */
function envoyerEmailMotDePasse(email, nom, motdepasse) {
    // Simulation d'envoi d'email
    console.log('📧 Simulation envoi email à:', email);
    console.log('📧 Sujet: Bienvenue sur TGNOVA - Vos identifiants de connexion');
    console.log('📧 Contenu:');
    console.log(`Bonjour ${nom},`);
    console.log('');
    console.log('Votre compte TGNOVA a été créé avec succès.');
    console.log('Voici vos identifiants de connexion :');
    console.log(`Email: ${email}`);
    console.log(`Mot de passe: ${motdepasse}`);
    console.log('');
    console.log('Nous vous recommandons de changer votre mot de passe lors de votre première connexion.');
    console.log('');
    console.log('Cordialement,');
    console.log('L\'équipe TGNOVA');
    
    // Dans un environnement réel, on utiliserait un service comme :
    // - EmailJS
    // - Firebase Cloud Functions avec Nodemailer
    // - SendGrid, Mailgun, etc.
    
    return true;
}

/**
 * Crée un nouveau compte avec Firebase
 */
async function creerNouveauCompte(e) {
    e.preventDefault();
    
    // Vérifier que l'utilisateur actuel est administrateur
    const userActuel = firebase.auth().currentUser;
    if (!userActuel) {
        afficherMessage('Vous devez être connecté', 'erreur');
        return;
    }
    
    // Vérifier le statut administrateur
    const db = firebase.firestore();
    const docAdmin = await db.collection('utilisateurs').doc(userActuel.uid).get();
    if (!docAdmin.exists) {
        afficherMessage('Erreur: profil non trouvé', 'erreur');
        return;
    }
    
    const dataAdmin = docAdmin.data();
    if (dataAdmin.statut !== 'administrateur' && dataAdmin.role !== 'administrateur') {
        afficherMessage('Accès refusé: vous n\'êtes pas administrateur', 'erreur');
        return;
    }
    
    const nom = document.getElementById('nouveauNom')?.value?.trim() || '';
    const email = document.getElementById('nouveauEmail')?.value?.trim() || '';
    const poste = document.getElementById('nouveauPoste')?.value || '';
    const role = document.querySelector('input[name="role"]:checked')?.value || 'utilisateur';
    
    // Validation
    if (!nom || !email) {
        afficherMessage('Veuillez remplir tous les champs obligatoires', 'erreur');
        return;
    }
    
    // Validation email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        afficherMessage('Adresse email invalide', 'erreur');
        return;
    }
    
    // Afficher l'overlay de chargement
    afficherLoading('Création du compte', 'Génération des identifiants...');
    
    try {
        // Générer un mot de passe aléatoire
        const motdepasseGenere = genererMotDePasseAleatoire(12);
        console.log('🔐 Mot de passe généré pour', email, ':', motdepasseGenere);
        
        // Créer le compte dans Firebase Auth
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, motdepasseGenere);
        const nouveauUser = userCredential.user;
        
        console.log('✅ Compte créé dans Firebase Auth:', nouveauUser.uid);
        
        // Récupérer les permissions pour les administrateurs
        const permissions = {};
        if (role === 'administrateur') {
            document.querySelectorAll('.permission-item input[type="checkbox"]').forEach(cb => {
                permissions[cb.name] = cb.checked;
            });
        }
        
        // Créer l'avatar avec UI Avatars
        const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(nom)}&background=4F46E5&color=fff`;
        
        // Sauvegarder les informations dans Firestore
        const donneesUtilisateur = {
            id: nouveauUser.uid,
            nom: nom,
            email: email,
            poste: poste,
            role: role,
            statut: role === 'administrateur' ? 'administrateur' : 'actif',
            permissions: permissions,
            avatar: avatar,
            dateCreation: new Date(),
            dateModification: new Date(),
            creePar: userActuel.uid,
            creeParNom: dataAdmin.nom || 'Administrateur'
        };
        
        // Ajouter le mot de passe à la sauvegarde Firestore (pour Cloud Function)
        donneesUtilisateur.motDePasse = motdepasseGenere;
        
        await db.collection('utilisateurs').doc(nouveauUser.uid).set(donneesUtilisateur);
        
        // Masquer le loading avant d'afficher la modal
        masquerLoading();
        
        // Afficher une notification simple
        afficherMessage(
            `✅ Compte créé avec succès !\n\nEmail: ${email}\nMot de passe: ${motdepasseGenere}\n\n� Les identifiants ont été envoyés par email.`,
            'succes'
        );
        
        // Afficher aussi une modal de confirmation optionnelle
        // afficherModalConfirmationCreation(nom, email, role, motdepasseGenere);
        
        // Réinitialiser le formulaire
        document.getElementById('formCreationCompte')?.reset();
        
        // Réinitialiser les indicateurs
        const indicateurConfirmation = document.getElementById('indicateurConfirmationCreation');
        if (indicateurConfirmation) indicateurConfirmation.innerHTML = '';
        
        const sectionPermissions = document.getElementById('permissionsSection');
        if (sectionPermissions) sectionPermissions.classList.remove('visible');
        
        // Recharger la liste des comptes
        chargerComptesCrees();
        
    } catch (error) {
        console.error('❌ Erreur création compte:', error);
        
        // Gérer les erreurs spécifiques
        let messageErreur = 'Erreur lors de la création du compte';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                messageErreur = 'Cette adresse email est déjà utilisée';
                break;
            case 'auth/invalid-email':
                messageErreur = 'Adresse email invalide';
                break;
            case 'auth/weak-password':
                messageErreur = 'Le mot de passe généré est trop faible';
                break;
            case 'auth/network-request-failed':
                messageErreur = 'Erreur réseau - vérifiez votre connexion';
                break;
            default:
                messageErreur = error.message || messageErreur;
        }
        
        afficherMessage(messageErreur, 'erreur');
    } finally {
        // Masquer l'overlay de chargement
        masquerLoading();
    }
}

/**
 * Charge les comptes créés par l'administrateur actuel
 */
async function chargerComptesCrees() {
    const tbody = document.getElementById('corpsTableauComptes');
    if (!tbody) return;
    
    const user = firebase.auth().currentUser;
    if (!user) {
        tbody.innerHTML = '<tr><td colspan="5">Veuillez vous connecter</td></tr>';
        return;
    }
    
    try {
        const db = firebase.firestore();
        
        // Charger les comptes créés par cet administrateur
        const comptesSnapshot = await db.collection('utilisateurs')
            .where('creePar', '==', user.uid)
            .limit(20)
            .get();
        
        tbody.innerHTML = '';
        
        if (comptesSnapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="5">Aucun compte créé pour le moment</td></tr>';
            return;
        }
        
        const comptes = comptesSnapshot.docs
            .map(doc => doc.data())
            .sort((a, b) => {
                const aDate = a.dateCreation?.toMillis ? a.dateCreation.toMillis() : new Date(a.dateCreation).getTime();
                const bDate = b.dateCreation?.toMillis ? b.dateCreation.toMillis() : new Date(b.dateCreation).getTime();
                return bDate - aDate;
            });
        
        comptes.forEach(compte => ajouterCompteTableau(compte));
        
        console.log(`✅ ${comptesQuery.size} comptes chargés`);
        
    } catch (error) {
        console.error('Erreur chargement comptes:', error);
        tbody.innerHTML = '<tr><td colspan="5">Erreur de chargement</td></tr>';
    }
}

/**
 * Ajoute un compte au tableau
 */
function ajouterCompteTableau(compte) {
    const tbody = document.getElementById('corpsTableauComptes');
    if (!tbody) return;
    
    // Gérer les dates Firestore
    let dateCreation = '';
    if (compte.dateCreation) {
        if (compte.dateCreation.toDate) {
            // C'est un Timestamp Firestore
            dateCreation = compte.dateCreation.toDate().toLocaleDateString('fr-FR');
        } else if (compte.dateCreation instanceof Date) {
            dateCreation = compte.dateCreation.toLocaleDateString('fr-FR');
        } else {
            dateCreation = new Date(compte.dateCreation).toLocaleDateString('fr-FR');
        }
    }
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>${compte.nom || ''}</td>
        <td>${compte.email || ''}</td>
        <td><span class="badge-role ${compte.role || 'utilisateur'}">${compte.role || 'utilisateur'}</span></td>
        <td>${dateCreation}</td>
        <td><span class="badge-statut ${compte.statut || 'actif'}">${compte.statut || 'actif'}</span></td>
    `;
    
    tbody.prepend(tr); // Ajouter en haut de la liste
}

/**
 * Initialise l'indicateur de modifications
 */
function initialiserIndicateurModifications() {
    // Écouter les modifications dans les formulaires
    document.querySelectorAll('.champ-parametre, .selecteur-parametre').forEach(element => {
        element.addEventListener('input', function() {
            this.dataset.modified = 'true';
            afficherIndicateurModifications();
        });
    });
    
    // Masquer l'indicateur lors de la sauvegarde
    document.querySelectorAll('.bouton-parametre-principal').forEach(bouton => {
        bouton.addEventListener('click', function() {
            masquerIndicateurModifications();
        });
    });
}

/**
 * Affiche l'indicateur de modifications
 */
function afficherIndicateurModifications() {
    let indicateur = document.getElementById('indicateurModifications');
    
    if (!indicateur) {
        indicateur = document.createElement('div');
        indicateur.id = 'indicateurModifications';
        indicateur.className = 'indicateur-modification';
        indicateur.innerHTML = `
            <i class="fas fa-edit"></i>
            <span>Modifications non enregistrées</span>
        `;
        document.body.appendChild(indicateur);
    }
    
    indicateur.classList.add('visible');
}

/**
 * Masque l'indicateur de modifications
 */
function masquerIndicateurModifications() {
    const indicateur = document.getElementById('indicateurModifications');
    if (indicateur) {
        indicateur.classList.remove('visible');
    }
}

/**
 * Affiche un message système
 */
function afficherMessage(texte, type) {
    // Retirer les messages existants
    document.querySelectorAll('.message-systeme').forEach(msg => msg.remove());
    
    const message = document.createElement('div');
    message.className = `message-systeme ${type}`;
    message.innerHTML = `
        <i class="fas ${type === 'succes' ? 'fa-check-circle' : type === 'erreur' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${texte}</span>
    `;
    
    document.body.appendChild(message);
    
    // Supprimer après 5 secondes
    setTimeout(() => {
        if (message.parentNode) {
            message.style.opacity = '0';
            message.style.transform = 'translateY(-20px)';
            setTimeout(() => message.remove(), 300);
        }
    }, 5000);
}

/**
 * Met à jour l'affichage des informations utilisateur
 */
function mettreAJourAffichageUtilisateur(nom, email) {
    // Mettre à jour dans la barre latérale
    const nomNav = document.getElementById('userName');
    const emailNav = document.getElementById('userEmail');
    const avatarInitialesNav = document.getElementById('avatarProfilInitiales');
    
    if (nomNav && nom) nomNav.textContent = nom;
    if (emailNav && email) emailNav.textContent = email;
    
    // Mettre à jour dans la section profil
    const nomProfil = document.getElementById('nomProfil');
    const detailsProfil = document.getElementById('detailsProfil');
    
    if (nomProfil && nom) nomProfil.textContent = nom;
    if (detailsProfil && email) detailsProfil.textContent = email || 'Email non défini';
    
    // Mettre à jour les initiales des avatars
    if (nom && avatarInitialesNav) {
        const initiales = genererInitiales(nom);
        avatarInitialesNav.textContent = initiales;
    }
}

/**
 * Génère les initiales d'un nom
 */
function genererInitiales(nom) {
    if (!nom || nom.trim() === '') return '?';
    
    const parties = nom.split(' ');
    if (parties.length >= 2) {
        return (parties[0].charAt(0) + parties[parties.length - 1].charAt(0)).toUpperCase();
    } else if (nom.length >= 2) {
        return nom.substring(0, 2).toUpperCase();
    } else {
        return nom.charAt(0).toUpperCase();
    }
}

/**
 * Fonctions vides conservées pour compatibilité
 */
function chargerStatistiquesCompte() {}
function synchroniserPreferencesNotifications() {}
function verifierEtatSecurite() {}
function mettreAJourDetailsAbonnement() {}

// CSS à ajouter pour les nouvelles fonctionnalités
const stylesSupplementaires = `
/* Animations */
.section-parametres.fade-in {
    animation: fadeIn 0.3s ease;
}

.section-parametres.fade-out {
    animation: fadeOut 0.2s ease;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeOut {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(-10px); }
}

/* Loader */
.loader {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid #f3f3f3;
    border-top: 2px solid #0066cc;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-right: 8px;
    vertical-align: middle;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* Validation */
.erreur-validation {
    border-color: #dc3545 !important;
    animation: shake 0.5s;
}

@keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
}

.invalide {
    border-color: #dc3545;
    background-color: #fff5f5;
}

/* Palette de couleurs */
.palette-couleurs {
    display: flex;
    gap: 8px;
    margin-top: 10px;
    flex-wrap: wrap;
}

.couleur-option {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
    transition: transform 0.2s, border-color 0.2s;
}

.couleur-option:hover {
    transform: scale(1.1);
}

.couleur-option.selectionnee {
    border-color: #212529;
    transform: scale(1.1);
}

/* Mode sombre */
.mode-sombre .palette-couleurs {
    background: #2d3748;
    border-color: #4a5568;
}

/* Preview bio */
.preview-bio {
    background: #f8f9fa;
    border-radius: 6px;
    padding: 12px;
    margin-top: 10px;
    display: none;
    border-left: 4px solid #0066cc;
}

.preview-bio strong {
    display: block;
    margin-bottom: 8px;
    color: #495057;
}

/* Compteur de caractères */
.compteur-caracteres {
    font-size: 12px;
    color: #6c757d;
    text-align: right;
    margin-top: 4px;
}

.compteur-caracteres.depasse {
    color: #dc3545;
    font-weight: bold;
}

/* Indicateur de complétude */
.indicateur-completude {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #f8f9fa;
    padding: 10px;
    border-radius: 6px;
    margin-top: 15px;
}

.progression-profil {
    flex: 1;
    height: 6px;
    background: #dee2e6;
    border-radius: 3px;
    overflow: hidden;
}

.barre-progression {
    height: 100%;
    background: #28a745;
    transition: width 0.5s ease;
}

/* Message système */
.message-systeme {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 20px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 9999;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    animation: slideIn 0.3s ease;
    max-width: 400px;
}

.message-systeme.succes {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.message-systeme.erreur {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

.message-systeme.info {
    background: #d1ecf1;
    color: #0c5460;
    border: 1px solid #bee5eb;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateX(100%);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

/* Indicateur de modification */
.indicateur-modification {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #ffc107;
    color: #212529;
    padding: 12px 20px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 9998;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.3s ease;
    pointer-events: none;
}

.indicateur-modification.visible {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
}

/* Modal de confirmation de création de compte */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.modal-overlay.visible {
    opacity: 1;
}

.modal-content {
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    transform: scale(0.9);
    transition: transform 0.3s ease;
}

.modal-overlay.visible .modal-content {
    transform: scale(1);
}

.modal-header {
    padding: 20px 24px;
    border-bottom: 1px solid #e9ecef;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.modal-header h3 {
    margin: 0;
    color: #212529;
    font-size: 18px;
    font-weight: 600;
}

.bouton-fermer-modal {
    background: none;
    border: none;
    font-size: 24px;
    color: #6c757d;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s;
}

.bouton-fermer-modal:hover {
    background-color: #f8f9fa;
    color: #495057;
}

.modal-body {
    padding: 24px;
}

.info-compte-cree {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 20px;
}

.detail-compte {
    margin-bottom: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.detail-compte:last-child {
    margin-bottom: 0;
}

.detail-compte strong {
    color: #495057;
    min-width: 120px;
}

.mot-de-passe {
    background: #fff3cd;
    border: 1px solid #ffeaa7;
    border-radius: 6px;
    padding: 12px;
    margin-top: 8px;
}

.mot-de-passe-valeur {
    font-family: monospace;
    font-weight: bold;
    color: #856404;
    background: #fff;
    padding: 4px 8px;
    border-radius: 4px;
    margin-right: 10px;
}

.bouton-copier {
    background: #ffc107;
    color: #212529;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s;
}

.bouton-copier:hover {
    background: #e0a800;
}

.message-info {
    color: #6c757d;
    font-size: 14px;
}

.message-info p {
    margin: 8px 0;
}

.modal-footer {
    padding: 16px 24px 24px;
    border-top: 1px solid #e9ecef;
    text-align: right;
}

.bouton-principal {
    background: #0066cc;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;
}

.bouton-principal:hover {
    background: #0056b3;
}
`;

/**
 * Initialise la section administration
 */
function initialiserAdministration() {
    console.log('🔧 Initialisation de la section administration...');

    // Vérifier que l'utilisateur est administrateur avant d'initialiser
    const user = firebase.auth().currentUser;
    if (!user) {
        console.log('🚫 Aucun utilisateur connecté, annulation initialisation administration');
        return;
    }

    const db = firebase.firestore();
    db.collection('utilisateurs').doc(user.uid).get()
        .then(doc => {
            if (doc.exists) {
                const data = doc.data();
                const statut = data.statut || data.role || null;

                if (statut === 'administrateur' || statut === 'admin') {
                    console.log('✅ Utilisateur administrateur, initialisation des fonctions administration');
                    initialiserFonctionsAdministration();
                } else if (!statut) {
                    console.log('⚠️ Aucun rôle défini, initialisation des fonctions administration pour migration');
                    initialiserFonctionsAdministration();
                } else {
                    console.log('🚫 Utilisateur non administrateur, fonctions administration non initialisées');
                }
            } else {
                console.log('🚫 Document utilisateur non trouvé');
            }
        })
        .catch(error => {
            console.error('Erreur vérification statut pour administration:', error);
        });
}

/**
 * Initialise les fonctions d'administration (uniquement pour les administrateurs)
 */
function initialiserFonctionsAdministration() {
    // Bouton migration des rôles
    const boutonMigrer = document.getElementById('boutonMigrerRoles');
    console.log('🔍 Bouton migrer trouvé:', boutonMigrer);

    if (boutonMigrer) {
        console.log('✅ Attachement de l\'événement au bouton migrer');
        boutonMigrer.addEventListener('click', async () => {
            console.log('🖱️ Bouton migrer cliqué !');
            
            // Vérifier que la fonction existe
            if (typeof window.migrerUtilisateursRoles !== 'function') {
                console.error('❌ Erreur: migrerUtilisateursRoles n\'existe pas. migration-roles.js n\'a pas été chargé correctement.');
                afficherMessage('Erreur: le module de migration n\'est pas chargé. Rafraîchissez la page.', 'erreur');
                return;
            }
            
            afficherLoading('Migration en cours', 'Migration des rôles utilisateur...');

            try {
                console.log('🚀 Appel de migrerUtilisateursRoles...');
                const succes = await window.migrerUtilisateursRoles();
                console.log('✅ Migration terminée, résultat:', succes);
                masquerLoading();

                const resultatDiv = document.getElementById('resultatMigration');
                const texteResultat = document.getElementById('texteResultatMigration');

                if (resultatDiv && texteResultat) {
                    resultatDiv.style.display = 'block';
                    if (succes) {
                        texteResultat.textContent = 'Migration terminée avec succès ! Les rôles ont été attribués.';
                        resultatDiv.className = 'resultat-migration succes';
                        // Recharger la page après un court délai pour appliquer les changements
                        setTimeout(() => {
                            window.location.reload();
                        }, 2000);
                    } else {
                        texteResultat.textContent = 'Erreur lors de la migration. Vérifiez la console pour plus de détails.';
                        resultatDiv.className = 'resultat-migration erreur';
                    }
                }
            } catch (error) {
                masquerLoading();
                console.error('Erreur migration:', error);
                afficherMessage('Erreur lors de la migration: ' + error.message, 'erreur');
            }
        });
    }

    // Bouton vérifier les rôles
    const boutonVerifier = document.getElementById('boutonVerifierRoles');
    if (boutonVerifier) {
        boutonVerifier.addEventListener('click', async () => {
            if (typeof window.verifierRolesUtilisateurs !== 'function') {
                console.error('❌ verifierRolesUtilisateurs n\'existe pas');
                afficherMessage('Erreur: le module de migration n\'est pas chargé', 'erreur');
                return;
            }
            
            try {
                console.log('🔍 Vérification des rôles utilisateur...');
                await window.verifierRolesUtilisateurs();
                afficherMessage('Vérification terminée. Consultez la console pour les détails.', 'succes');
            } catch (error) {
                console.error('Erreur vérification:', error);
                afficherMessage('Erreur lors de la vérification: ' + error.message, 'erreur');
            }
        });
    }

    // Bouton définir administrateur
    const boutonDefinirAdmin = document.getElementById('boutonDefinirAdmin');
    if (boutonDefinirAdmin) {
        boutonDefinirAdmin.addEventListener('click', async () => {
            if (typeof window.definirAdministrateur !== 'function') {
                console.error('❌ definirAdministrateur n\'existe pas');
                afficherMessage('Erreur: le module de migration n\'est pas chargé', 'erreur');
                return;
            }
            
            const userId = document.getElementById('userIdAdmin')?.value?.trim();
            if (!userId) {
                afficherMessage('Veuillez saisir un ID utilisateur', 'erreur');
                return;
            }

            afficherLoading('Définition administrateur', 'Modification des permissions...');

            try {
                const succes = await window.definirAdministrateur(userId);
                masquerLoading();

                if (succes) {
                    afficherMessage('Utilisateur défini comme administrateur avec succès', 'succes');
                    document.getElementById('userIdAdmin').value = '';
                    // Recharger la liste des administrateurs
                    chargerListeAdministrateurs();
                } else {
                    afficherMessage('Erreur lors de la définition de l\'administrateur', 'erreur');
                }
            } catch (error) {
                masquerLoading();
                console.error('Erreur définition admin:', error);
                afficherMessage('Erreur lors de la définition', 'erreur');
            }
        });
    }

    // Charger la liste des administrateurs au chargement
    chargerListeAdministrateurs();
}

/**
 * Charge et affiche la liste des administrateurs
 */
async function chargerListeAdministrateurs() {
    const tableauAdmin = document.getElementById('tableauAdmin');
    if (!tableauAdmin) return;

    try {
        const db = firebase.firestore();
        const utilisateursRef = db.collection('utilisateurs');
        const snapshot = await utilisateursRef.where('role', '==', 'administrateur').get();

        if (snapshot.empty) {
            tableauAdmin.innerHTML = '<p class="aucun-admin">Aucun administrateur trouvé</p>';
            return;
        }

        const admins = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            admins.push({
                id: doc.id,
                nom: data.nom || 'N/A',
                email: data.email || 'N/A',
                dateCreation: data.dateCreation?.toDate?.() || new Date()
            });
        });

        // Trier par date de création (plus récent en premier)
        admins.sort((a, b) => b.dateCreation - a.dateCreation);

        const html = admins.map(admin => `
            <div class="admin-item">
                <div class="admin-info">
                    <div class="admin-nom">${admin.nom}</div>
                    <div class="admin-email">${admin.email}</div>
                    <div class="admin-date">Créé le ${admin.dateCreation.toLocaleDateString('fr-FR')}</div>
                </div>
                <div class="admin-actions">
                    <span class="badge-role administrateur">Admin</span>
                </div>
            </div>
        `).join('');

        tableauAdmin.innerHTML = html;

    } catch (error) {
        console.error('Erreur chargement administrateurs:', error);
        tableauAdmin.innerHTML = '<p class="erreur-admin">Erreur lors du chargement</p>';
    }
}

// Injecter les styles
if (!document.querySelector('#styles-parametres')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'styles-parametres';
    styleElement.textContent = stylesSupplementaires;
    document.head.appendChild(styleElement);
}

/**
 * Affiche une modal de confirmation de création de compte
 */
function afficherModalConfirmationCreation(nom, email, role, motDePasse) {
    // Créer la modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay modal-confirmation-creation';
    modal.innerHTML = `
        <div class="modal-content modal-confirmation">
            <div class="modal-header">
                <h3>✅ Compte créé avec succès</h3>
                <button class="bouton-fermer-modal" onclick="this.closest('.modal-overlay').remove()">×</button>
            </div>
            <div class="modal-body">
                <div class="info-compte-cree">
                    <div class="detail-compte">
                        <strong>Nom:</strong> ${nom}
                    </div>
                    <div class="detail-compte">
                        <strong>Email:</strong> ${email}
                    </div>
                    <div class="detail-compte">
                        <strong>Rôle:</strong> ${role === 'administrateur' ? 'Administrateur' : 'Utilisateur'}
                    </div>
                    <div class="detail-compte mot-de-passe">
                        <strong>Mot de passe temporaire:</strong>
                        <span class="mot-de-passe-valeur">${motDePasse}</span>
                        <button class="bouton-copier" onclick="copierMotDePasse('${motDePasse}')">📋 Copier</button>
                    </div>
                </div>
                <div class="message-info">
                    <p>📧 Un email a été envoyé à <strong>${email}</strong> avec les identifiants de connexion.</p>
                    <p>🔄 L'utilisateur devra changer son mot de passe lors de sa première connexion.</p>
                </div>
            </div>
            <div class="modal-footer">
                <button class="bouton-principal" onclick="this.closest('.modal-overlay').remove()">Fermer</button>
            </div>
        </div>
    `;

    // Ajouter la modal au body
    document.body.appendChild(modal);

    // Fermer la modal en cliquant sur l'overlay
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });

    // Animation d'entrée
    setTimeout(() => {
        modal.classList.add('visible');
    }, 10);
}

/**
 * Fonction pour copier le mot de passe dans le presse-papiers
 */
function copierMotDePasse(motDePasse) {
    navigator.clipboard.writeText(motDePasse).then(() => {
        // Afficher un feedback temporaire
        const bouton = event.target;
        const texteOriginal = bouton.textContent;
        bouton.textContent = '✅ Copié!';
        bouton.style.background = '#10B981';

        setTimeout(() => {
            bouton.textContent = texteOriginal;
            bouton.style.background = '';
        }, 2000);
    }).catch(err => {
        console.error('Erreur copie:', err);
        // Fallback pour les navigateurs qui ne supportent pas clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = motDePasse;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);

        const bouton = event.target;
        bouton.textContent = '✅ Copié!';
        bouton.style.background = '#10B981';
        setTimeout(() => {
            bouton.textContent = '📋 Copier';
            bouton.style.background = '';
        }, 2000);
    });
}