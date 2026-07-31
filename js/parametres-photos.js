// ============================================
// GESTION DE LA PHOTO DE PROFIL - TGNOVA (Version Firebase)
// ============================================

// État local pour la gestion de l'avatar
const EtatAvatar = {
    imageActuelle: null, // URL de l'avatar (Base64 ou URL Firebase)
    timestamp: localStorage.getItem('tgnova_avatar_timestamp') || null,
    fichierEnCours: null,
    apercu: null,
    utilisateurId: null,
    firebaseUrl: null // URL stockée dans Firebase Storage
};

// ============================================
// INITIALISATION
// ============================================

/**
 * Initialise la gestion de la photo de profil
 */
document.addEventListener('DOMContentLoaded', () => {
    // Attendre que l'utilisateur soit connecté (Firebase)
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            EtatAvatar.utilisateurId = user.uid;
            initialiserGestionPhoto();
            chargerAvatarFirebase();
        }
        unsubscribe();
    });

    // Écouter les changements de localStorage pour synchroniser entre onglets
    window.addEventListener('storage', (e) => {
        if (e.key === 'tgnova_avatar_sync' || e.key === 'tgnova_avatar_timestamp') {
            synchroniserAvatar();
        }
    });

    // Écouter les changements dans Firestore (synchronisation entre onglets)
    if (firebase.auth().currentUser) {
        ecouterChangementsFirestore();
    }
});

/**
 * Initialise toutes les fonctionnalités liées à la photo
 */
function initialiserGestionPhoto() {
    // Créer l'input file s'il n'existe pas
    creerInputFile();

    // Ajouter les boutons de téléversement
    ajouterBoutonsTeleversement();

    // Initialiser le drag & drop
    initialiserDragDrop();

    // Initialiser les aperçus d'avatar
    initialiserApercusAvatar();

    // Charger l'avatar sauvegardé (local d'abord, puis Firebase)
    chargerAvatarLocal();
}

/**
 * Écoute les changements en temps réel sur Firestore pour l'avatar
 */
function ecouterChangementsFirestore() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    firebase.firestore().collection('utilisateurs').doc(user.uid)
        .onSnapshot((doc) => {
            if (doc.exists) {
                const data = doc.data();
                const firebaseAvatarUrl = data.photoURL || data.avatarUrl;

                // Ne mettre à jour que si l'URL Firebase est différente de l'URL actuelle
                // ET si le changement ne vient pas d'une action locale récente
                if (firebaseAvatarUrl && firebaseAvatarUrl !== EtatAvatar.firebaseUrl) {
                    const dernierChangementLocal = localStorage.getItem('tgnova_avatar_timestamp');
                    const maintenant = Date.now();

                    // Éviter les boucles de synchronisation (délai de 2 secondes)
                    if (!dernierChangementLocal || (maintenant - parseInt(dernierChangementLocal)) > 2000) {
                        console.log('Avatar mis à jour depuis Firestore');
                        EtatAvatar.firebaseUrl = firebaseAvatarUrl;
                        mettreAJourTousAvatars(firebaseAvatarUrl);
                        sauvegarderAvatarLocal(firebaseAvatarUrl);
                    }
                }
            }
        }, (error) => {
            console.error('Erreur écoute Firestore avatar:', error);
        });
}

// ============================================
// CRÉATION DES ÉLÉMENTS UI
// ============================================

/**
 * Crée l'input file pour la sélection d'image
 */
function creerInputFile() {
    // Vérifier si l'input existe déjà
    let inputFile = document.getElementById('input-avatar-file');

    if (!inputFile) {
        inputFile = document.createElement('input');
        inputFile.type = 'file';
        inputFile.id = 'input-avatar-file';
        inputFile.accept = 'image/jpeg,image/png,image/gif,image/webp';
        inputFile.style.display = 'none';
        inputFile.setAttribute('aria-label', 'Choisir une photo de profil');
        document.body.appendChild(inputFile);

        // Gérer le changement de fichier
        inputFile.addEventListener('change', (e) => {
            const fichier = e.target.files[0];
            if (fichier) {
                traiterFichierImage(fichier);
            }
            // Réinitialiser l'input pour permettre de sélectionner le même fichier
            inputFile.value = '';
        });
    }

    return inputFile;
}

/**
 * Ajoute les boutons de téléversement sur tous les avatars
 */
function ajouterBoutonsTeleversement() {
    // Bouton dans la section profil (page paramètres)
    const boutonChangerAvatar = document.querySelector('.bouton-changer-avatar');
    if (boutonChangerAvatar && !boutonChangerAvatar.dataset.photoInit) {
        boutonChangerAvatar.addEventListener('click', ouvrirSelecteurFichier);
        boutonChangerAvatar.dataset.photoInit = 'true';
    }

    // Ajouter un bouton de téléversement direct dans la zone avatar de la page de profil
    ajouterBoutonTeleversementDirect();

    // Ajouter également sur l'avatar de la barre latérale (dashboard)
    ajouterBoutonSurAvatarSidebar();
}

/**
 * Ajoute un bouton de téléversement direct dans la zone avatar principale
 */
function ajouterBoutonTeleversementDirect() {
    const zoneAvatar = document.querySelector('.zone-avatar, .avatar-profil');
    if (!zoneAvatar) return;

    // Vérifier si le bouton existe déjà
    if (zoneAvatar.querySelector('.btn-televersement-avatar')) return;

    const boutonTeleversement = document.createElement('button');
    boutonTeleversement.className = 'btn-televersement-avatar';
    boutonTeleversement.innerHTML = `
        <i class="fas fa-camera"></i>
        <span>Changer la photo</span>
    `;
    boutonTeleversement.setAttribute('type', 'button');
    boutonTeleversement.setAttribute('title', 'Changer la photo de profil');

    boutonTeleversement.addEventListener('click', ouvrirSelecteurFichier);

    zoneAvatar.appendChild(boutonTeleversement);
}

/**
 * Ajoute un bouton de téléversement sur l'avatar de la barre latérale
 */
function ajouterBoutonSurAvatarSidebar() {
    const avatarSidebar = document.querySelector('.avatar-utilisateur');
    if (!avatarSidebar) return;

    // Vérifier si le bouton existe déjà
    if (avatarSidebar.querySelector('.btn-avatar-sidebar')) return;

    // Créer un overlay au survol
    const overlay = document.createElement('div');
    overlay.className = 'avatar-overlay btn-avatar-sidebar';
    overlay.innerHTML = `
        <i class="fas fa-camera"></i>
        <span>Changer</span>
    `;

    overlay.addEventListener('click', (e) => {
        e.stopPropagation();
        ouvrirSelecteurFichier();
    });

    avatarSidebar.style.position = 'relative';
    avatarSidebar.appendChild(overlay);

    // Ajouter les styles pour l'overlay
    ajouterStylesOverlay();
}

/**
 * Ajoute les styles CSS pour l'overlay de l'avatar
 */
function ajouterStylesOverlay() {
    if (document.getElementById('avatar-overlay-styles')) return;

    const style = document.createElement('style');
    style.id = 'avatar-overlay-styles';
    style.textContent = `
        .avatar-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 50%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            opacity: 0;
            transition: opacity 0.2s ease;
            cursor: pointer;
            z-index: 10;
        }

        .avatar-utilisateur:hover .avatar-overlay {
            opacity: 1;
        }

        .avatar-overlay i {
            font-size: 1.2rem;
            margin-bottom: 0.2rem;
        }

        .avatar-overlay span {
            font-size: 0.7rem;
            font-weight: 500;
        }

        .mode-sombre .avatar-overlay {
            background: rgba(0, 0, 0, 0.7);
        }

        @media (max-width: 768px) {
            .avatar-overlay {
                opacity: 0.8;
                background: rgba(0, 0, 0, 0.6);
            }
            
            .avatar-overlay span {
                display: none;
            }
        }
    `;
    document.head.appendChild(style);
}

// ============================================
// INTERACTIONS UTILISATEUR
// ============================================

/**
 * Initialise le drag & drop pour les zones d'avatar
 */
function initialiserDragDrop() {
    const zonesAvatar = document.querySelectorAll('.zone-avatar, .avatar-profil, .avatar-utilisateur');

    zonesAvatar.forEach(zone => {
        // Éviter les doublons d'écouteurs
        if (zone.dataset.dragDropInit) return;

        zone.dataset.dragDropInit = 'true';

        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('drag-over');
        });

        zone.addEventListener('dragleave', () => {
            zone.classList.remove('drag-over');
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('drag-over');

            const fichier = e.dataTransfer.files[0];
            if (fichier && fichier.type.startsWith('image/')) {
                traiterFichierImage(fichier);
            } else {
                afficherMessage('Veuillez déposer une image valide', 'erreur');
            }
        });
    });
}

/**
 * Initialise les aperçus d'avatar
 */
function initialiserApercusAvatar() {
    // Mettre à jour tous les avatars avec l'image sauvegardée
    if (EtatAvatar.imageActuelle) {
        mettreAJourTousAvatars(EtatAvatar.imageActuelle);
    }
}

/**
 * Ouvre le sélecteur de fichier
 */
function ouvrirSelecteurFichier() {
    const inputFile = document.getElementById('input-avatar-file');
    if (inputFile) {
        inputFile.click();
    }
}

// ============================================
// TRAITEMENT DES IMAGES
// ============================================

/**
 * Traite le fichier image sélectionné
 */
function traiterFichierImage(fichier) {
    // Validation du type de fichier
    if (!fichier.type.startsWith('image/')) {
        afficherMessage('Veuillez sélectionner une image valide (JPEG, PNG, GIF, WEBP)', 'erreur');
        return;
    }

    // Validation de la taille (max 5MB)
    const tailleMax = 5 * 1024 * 1024; // 5MB
    if (fichier.size > tailleMax) {
        afficherMessage('L\'image ne doit pas dépasser 5 Mo', 'erreur');
        return;
    }

    // Afficher le loader
    afficherLoaderAvatar();

    // Lire le fichier
    const lecteur = new FileReader();

    lecteur.onload = async (e) => {
        const imageDataUrl = e.target.result;

        // Créer une image pour le redimensionnement
        const img = new Image();
        img.onload = async () => {
            // Redimensionner l'image
            const imageRedimensionnee = redimensionnerImage(img, 512, 512);

            // Mettre à jour tous les avatars immédiatement (UI)
            mettreAJourTousAvatars(imageRedimensionnee);

            // Sauvegarder localement
            sauvegarderAvatarLocal(imageRedimensionnee);

            // Afficher l'overlay de chargement
            afficherLoading('Téléversement en cours', 'Envoi vers le cloud...');

            // Upload vers Firebase Storage et mettre à jour Firestore
            await uploaderAvatarFirebase(imageRedimensionnee, fichier);

            // Masquer l'overlay
            masquerLoading();

            // Cacher le loader
            cacherLoaderAvatar();

            // Afficher le message de succès
            afficherMessage('Photo de profil mise à jour avec succès', 'succes');

            // Notifier les autres onglets
            notifierChangementAvatar();
        };

        img.onerror = () => {
            cacherLoaderAvatar();
            afficherMessage('Erreur lors du chargement de l\'image', 'erreur');
        };

        img.src = imageDataUrl;
    };

    lecteur.onerror = () => {
        cacherLoaderAvatar();
        afficherMessage('Erreur lors de la lecture du fichier', 'erreur');
    };

    lecteur.readAsDataURL(fichier);
}

/**
 * Redimensionne une image aux dimensions spécifiées
 */
function redimensionnerImage(img, maxLargeur, maxHauteur) {
    let largeur = img.width;
    let hauteur = img.height;

    // Calculer les nouvelles dimensions en conservant le ratio
    if (largeur > hauteur) {
        if (largeur > maxLargeur) {
            hauteur = Math.round(hauteur * maxLargeur / largeur);
            largeur = maxLargeur;
        }
    } else {
        if (hauteur > maxHauteur) {
            largeur = Math.round(largeur * maxHauteur / hauteur);
            hauteur = maxHauteur;
        }
    }

    // Créer un canvas pour le redimensionnement
    const canvas = document.createElement('canvas');
    canvas.width = largeur;
    canvas.height = hauteur;

    const ctx = canvas.getContext('2d');

    // Remplir le fond en blanc pour les images avec transparence
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, largeur, hauteur);

    // Dessiner l'image redimensionnée
    ctx.drawImage(img, 0, 0, largeur, hauteur);

    // Convertir en JPEG de qualité 0.9
    return canvas.toDataURL('image/jpeg', 0.9);
}

// ============================================
// UPLOAD VERS FIREBASE
// ============================================

/**
 * Uploade l'avatar vers Firebase Storage et met à jour Firestore
 */
async function uploaderAvatarFirebase(imageDataUrl, fichierOriginal) {
    const user = firebase.auth().currentUser;
    if (!user) {
        console.error('Aucun utilisateur connecté');
        return;
    }

    try {
        // Afficher un indicateur de progression
        afficherMessage('Upload vers le cloud...', 'info');

        // Convertir le DataURL en Blob
        const blob = await fetch(imageDataUrl).then(res => res.blob());

        // Créer une référence dans Firebase Storage
        const cheminFichier = `avatars/${user.uid}/${Date.now()}_${fichierOriginal.name}`;
        const storageRef = firebase.storage().ref(cheminFichier);

        // Upload du fichier
        const snapshot = await storageRef.put(blob, {
            contentType: 'image/jpeg',
            customMetadata: {
                originalName: fichierOriginal.name,
                uploadedBy: user.uid,
                uploadedAt: new Date().toISOString()
            }
        });

        // Obtenir l'URL de téléchargement
        const downloadUrl = await snapshot.ref.getDownloadURL();

        // Sauvegarder l'URL Firebase dans l'état
        EtatAvatar.firebaseUrl = downloadUrl;

        // Mettre à jour Firestore
        await firebase.firestore().collection('utilisateurs').doc(user.uid).set({
            photoURL: downloadUrl,
            avatarUrl: downloadUrl,
            avatarTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
            dateMAJPhoto: new Date()
        }, { merge: true });

        console.log('✅ Avatar uploadé vers Firebase:', downloadUrl);

        return downloadUrl;
    } catch (error) {
        console.error('Erreur lors de l\'upload vers Firebase:', error);
        afficherMessage('Erreur lors de la sauvegarde dans le cloud', 'erreur');
        throw error;
    }
}

/**
 * Charge l'avatar depuis Firebase
 */
async function chargerAvatarFirebase() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    try {
        const doc = await firebase.firestore().collection('utilisateurs').doc(user.uid).get();

        if (doc.exists) {
            const data = doc.data();
            const firebaseAvatarUrl = data.photoURL || data.avatarUrl;

            if (firebaseAvatarUrl) {
                console.log('Avatar chargé depuis Firebase');

                // Sauvegarder dans l'état
                EtatAvatar.firebaseUrl = firebaseAvatarUrl;
                EtatAvatar.imageActuelle = firebaseAvatarUrl;

                // Mettre à jour l'affichage
                mettreAJourTousAvatars(firebaseAvatarUrl);

                // Sauvegarder localement
                sauvegarderAvatarLocal(firebaseAvatarUrl);
            } else {
                // Pas d'avatar dans Firebase, utiliser celui du localStorage
                chargerAvatarLocal();
            }
        } else {
            // Document utilisateur n'existe pas, créer un document vide
            await firebase.firestore().collection('utilisateurs').doc(user.uid).set({
                email: user.email,
                nom: user.displayName || '',
                dateCreation: new Date()
            });

            // Charger depuis localStorage
            chargerAvatarLocal();
        }
    } catch (error) {
        console.error('Erreur chargement avatar Firebase:', error);
        // Fallback sur localStorage
        chargerAvatarLocal();
    }
}

// ============================================
// GESTION LOCALE
// ============================================

/**
 * Charge l'avatar depuis le localStorage
 */
function chargerAvatarLocal() {
    const avatarSauvegarde = localStorage.getItem('tgnova_avatar');
    if (avatarSauvegarde) {
        EtatAvatar.imageActuelle = avatarSauvegarde;
        EtatAvatar.timestamp = localStorage.getItem('tgnova_avatar_timestamp');
        mettreAJourTousAvatars(avatarSauvegarde);
        console.log('Avatar chargé depuis localStorage');
    } else {
        // Aucun avatar sauvegardé, utiliser les initiales
        reinitialiserAvatarsParDefaut();
    }
}

/**
 * Sauvegarde l'avatar dans localStorage
 */
function sauvegarderAvatarLocal(imageDataUrl) {
    try {
        localStorage.setItem('tgnova_avatar', imageDataUrl);
        const timestamp = Date.now().toString();
        localStorage.setItem('tgnova_avatar_timestamp', timestamp);

        EtatAvatar.imageActuelle = imageDataUrl;
        EtatAvatar.timestamp = timestamp;

        console.log('✅ Avatar sauvegardé localement');
    } catch (error) {
        console.error('Erreur lors de la sauvegarde locale de l\'avatar:', error);

        // Si l'image est trop grande pour localStorage
        if (error.name === 'QuotaExceededError') {
            afficherMessage('L\'image est trop volumineuse pour la sauvegarde locale, mais elle est dans le cloud', 'info');
        }
    }
}

// ============================================
// MISE À JOUR DE L'AFFICHAGE
// ============================================

/**
 * Met à jour tous les avatars de l'application
 */
function mettreAJourTousAvatars(imageDataUrl) {
    // Mettre à jour l'état
    EtatAvatar.imageActuelle = imageDataUrl;

    // Mettre à jour les images d'avatar existantes
    document.querySelectorAll('.avatar-utilisateur img, .avatar-profil img, [data-avatar="image"], .user-avatar img').forEach(img => {
        img.src = imageDataUrl;
        img.style.display = 'block';
        img.alt = 'Photo de profil';
        img.onerror = () => {
            // En cas d'erreur de chargement, afficher les initiales
            img.style.display = 'none';
            afficherInitialesDansContainer(img.closest('.avatar-utilisateur, .avatar-profil'));
        };
    });

    // Cacher les initiales là où une image est présente
    document.querySelectorAll('.avatar-utilisateur .avatar-initiales, .avatar-profil .avatar-initiales').forEach(el => {
        el.style.display = 'none';
    });

    // Ajouter des images aux avatars qui n'en ont pas
    ajouterImagesAuxAvatars(imageDataUrl);

    // Mettre à jour les styles pour les avatars
    document.querySelectorAll('.avatar-utilisateur, .avatar-profil').forEach(container => {
        container.style.backgroundImage = 'none';
    });

    // Mettre à jour le style CSS pour les avatars sans image
    mettreAJourStyleAvatars(imageDataUrl);

    // Déclencher un événement pour les autres parties de l'application (discussions)
    window.dispatchEvent(new CustomEvent('avatarMisAJour', {
        detail: { avatarUrl: imageDataUrl }
    }));
}

/**
 * Ajoute des images aux avatars qui n'en ont pas
 */
function ajouterImagesAuxAvatars(imageDataUrl) {
    // Sélectionner tous les conteneurs d'avatar sans image
    const conteneurs = document.querySelectorAll('.avatar-utilisateur:not(:has(img)), .avatar-profil:not(:has(img))');

    conteneurs.forEach(conteneur => {
        // Supprimer les initiales si présentes
        const initiales = conteneur.querySelector('.avatar-initiales');
        if (initiales) {
            initiales.remove();
        }

        // Créer et ajouter l'image
        const img = document.createElement('img');
        img.src = imageDataUrl;
        img.alt = 'Photo de profil';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '50%';

        conteneur.appendChild(img);
    });
}

/**
 * Affiche les initiales dans un conteneur d'avatar (fallback)
 */
function afficherInitialesDansContainer(conteneur) {
    if (!conteneur) return;

    // Récupérer le nom de l'utilisateur depuis le DOM
    let nom = '';
    const nomElement = document.querySelector('.nom-utilisateur, .user-name');
    if (nomElement) {
        nom = nomElement.textContent;
    }

    // Si aucun nom trouvé, utiliser '?'
    const initiales = nom ? genererInitiales(nom) : '?';

    // Supprimer l'image si elle existe
    const img = conteneur.querySelector('img');
    if (img) img.remove();

    // Créer ou afficher les initiales
    let initialesElement = conteneur.querySelector('.avatar-initiales');
    if (!initialesElement) {
        initialesElement = document.createElement('span');
        initialesElement.className = 'avatar-initiales';
        conteneur.appendChild(initialesElement);
    }

    initialesElement.textContent = initiales;
    initialesElement.style.display = 'flex';
    initialesElement.style.backgroundColor = nom ? genererCouleurDepuisNom(nom) : '#4F46E5';
}

/**
 * Met à jour le style CSS pour les avatars
 */
function mettreAJourStyleAvatars(imageDataUrl) {
    const styleId = 'avatar-dynamic-style';
    let styleTag = document.getElementById(styleId);

    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = styleId;
        document.head.appendChild(styleTag);
    }

    styleTag.textContent = `
        .avatar-utilisateur, .avatar-profil {
            background-image: url('${imageDataUrl}') !important;
            background-size: cover !important;
            background-position: center !important;
        }

        .avatar-utilisateur .avatar-initiales,
        .avatar-profil .avatar-initiales {
            display: none !important;
        }
    `;
}

// ============================================
// SYNCHRONISATION ENTRE ONGLETS
// ============================================

/**
 * Notifie les autres onglets du changement d'avatar
 */
function notifierChangementAvatar() {
    const timestamp = Date.now().toString();
    localStorage.setItem('tgnova_avatar_sync', timestamp);

    // Déclencher un événement personnalisé
    window.dispatchEvent(new CustomEvent('avatarModifie', {
        detail: { timestamp, avatar: EtatAvatar.imageActuelle }
    }));
}

/**
 * Synchronise l'avatar avec les autres onglets
 */
function synchroniserAvatar() {
    const nouvelAvatar = localStorage.getItem('tgnova_avatar');
    const nouveauTimestamp = localStorage.getItem('tgnova_avatar_timestamp');

    if (nouvelAvatar && nouveauTimestamp !== EtatAvatar.timestamp) {
        console.log('Synchronisation avatar depuis autre onglet');
        EtatAvatar.imageActuelle = nouvelAvatar;
        EtatAvatar.timestamp = nouveauTimestamp;
        mettreAJourTousAvatars(nouvelAvatar);
    }
}

// ============================================
// LOADERS ET MESSAGES
// ============================================

/**
 * Affiche le loader d'avatar
 */
function afficherLoaderAvatar() {
    // Supprimer les loaders existants
    cacherLoaderAvatar();

    const zonesAvatar = document.querySelectorAll('.zone-avatar, .avatar-profil, .avatar-utilisateur');

    zonesAvatar.forEach(zone => {
        // Ne pas ajouter de loader sur les petits avatars (sidebar)
        if (zone.classList.contains('avatar-utilisateur') && zone.offsetWidth < 50) {
            return;
        }

        const loader = document.createElement('div');
        loader.className = 'avatar-loader';
        loader.innerHTML = `
            <div class="spinner"></div>
            <span>Chargement...</span>
        `;

        // Positionner le loader
        loader.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.9);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            z-index: 100;
        `;

        zone.style.position = 'relative';
        zone.appendChild(loader);
    });
}

/**
 * Cache le loader d'avatar
 */
function cacherLoaderAvatar() {
    document.querySelectorAll('.avatar-loader').forEach(loader => {
        loader.remove();
    });
}

/**
 * Affiche un message système
 */
function afficherMessage(texte, type) {
    // Retirer les messages existants
    document.querySelectorAll('.avatar-message').forEach(msg => msg.remove());

    const message = document.createElement('div');
    message.className = `avatar-message ${type}`;
    message.innerHTML = `
        <i class="fas ${type === 'succes' ? 'fa-check-circle' : type === 'erreur' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${texte}</span>
    `;

    message.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'succes' ? '#10b981' : type === 'erreur' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        font-size: 0.9rem;
        max-width: 350px;
    `;

    document.body.appendChild(message);

    setTimeout(() => {
        if (message.parentNode) {
            message.style.opacity = '0';
            message.style.transform = 'translateY(20px)';
            message.style.transition = 'all 0.3s ease';
            setTimeout(() => message.remove(), 300);
        }
    }, 4000);
}

// ============================================
// SUPPRESSION ET RÉINITIALISATION
// ============================================

/**
 * Supprime l'avatar actuel
 */
async function supprimerAvatar() {
    modalUtils.demanderConfirmation(
        'Suppression de photo',
        'Êtes-vous sûr de vouloir supprimer votre photo de profil ?',
        async () => {
            // Supprimer de localStorage
            localStorage.removeItem('tgnova_avatar');
            localStorage.removeItem('tgnova_avatar_timestamp');

            // Supprimer de Firebase Storage et Firestore
            await supprimerAvatarFirebase();

            // Réinitialiser l'état
            EtatAvatar.imageActuelle = null;
            EtatAvatar.timestamp = null;
            EtatAvatar.firebaseUrl = null;

            // Mettre à jour l'affichage
            reinitialiserAvatarsParDefaut();

            // Notifier les autres onglets
            notifierChangementAvatar();

            afficherMessage('Photo de profil supprimée', 'succes');
        }
    );
}

/**
 * Supprime l'avatar de Firebase
 */
async function supprimerAvatarFirebase() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    try {
        // Mettre à jour Firestore
        await firebase.firestore().collection('utilisateurs').doc(user.uid).update({
            photoURL: firebase.firestore.FieldValue.delete(),
            avatarUrl: firebase.firestore.FieldValue.delete(),
            dateSuppressionPhoto: new Date()
        });

        // Note: On ne supprime pas le fichier Storage pour garder l'historique
        console.log('✅ Référence avatar supprimée de Firestore');
    } catch (error) {
        console.error('Erreur suppression avatar Firebase:', error);
    }
}

/**
 * Réinitialise les avatars par défaut (initiales)
 */
function reinitialiserAvatarsParDefaut() {
    // Supprimer les images
    document.querySelectorAll('.avatar-utilisateur img, .avatar-profil img').forEach(img => {
        img.remove();
    });

    // Afficher les initiales
    document.querySelectorAll('.avatar-utilisateur, .avatar-profil').forEach(container => {
        container.style.backgroundImage = '';
        afficherInitialesDansContainer(container);
    });

    // Supprimer le style dynamique
    const styleTag = document.getElementById('avatar-dynamic-style');
    if (styleTag) {
        styleTag.remove();
    }
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

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
 * Génère une couleur à partir d'un nom
 */
function genererCouleurDepuisNom(nom) {
    if (!nom || nom.trim() === '') return '#4F46E5';

    let hash = 0;
    for (let i = 0; i < nom.length; i++) {
        hash = nom.charCodeAt(i) + ((hash << 5) - hash);
    }

    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 60%)`;
}

// ============================================
// STYLES
// ============================================

const stylesPhoto = `
    .btn-televersement-avatar {
        position: absolute;
        bottom: 0;
        right: 0;
        background: var(--bleu-principal, #3b82f6);
        color: white;
        border: none;
        border-radius: 50%;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        z-index: 10;
    }

    .btn-televersement-avatar:hover {
        transform: scale(1.1);
        background: var(--bleu-principal-fonce, #2563eb);
    }

    .btn-televersement-avatar span {
        display: none;
        position: absolute;
        bottom: 100%;
        right: 0;
        background: var(--gris-800);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        white-space: nowrap;
        margin-bottom: 8px;
    }

    .btn-televersement-avatar:hover span {
        display: block;
    }

    .avatar-utilisateur, .avatar-profil {
        position: relative;
        overflow: hidden;
    }

    .avatar-utilisateur.drag-over,
    .avatar-profil.drag-over {
        outline: 2px dashed var(--bleu-principal);
        outline-offset: 2px;
    }

    .avatar-utilisateur img,
    .avatar-profil img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 50%;
    }

    .avatar-loader .spinner {
        width: 30px;
        height: 30px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid var(--bleu-principal);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 8px;
    }

    .avatar-loader span {
        font-size: 12px;
        color: var(--gris-700);
    }

    .mode-sombre .avatar-loader {
        background: rgba(31, 41, 55, 0.9);
    }

    .mode-sombre .avatar-loader span {
        color: var(--gris-300);
    }

    .avatar-message {
        animation: slideIn 0.3s ease;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
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

    @media (max-width: 768px) {
        .btn-televersement-avatar {
            width: 32px;
            height: 32px;
        }

        .btn-televersement-avatar i {
            font-size: 14px;
        }
        
        .btn-televersement-avatar span {
            display: none;
        }
    }
`;

// Injecter les styles
if (!document.querySelector('#styles-photo-avatar')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'styles-photo-avatar';
    styleElement.textContent = stylesPhoto;
    document.head.appendChild(styleElement);
}

// ============================================
// ÉVÉNEMENTS PERSONNALISÉS
// ============================================

window.addEventListener('storage', (e) => {
    if (e.key === 'tgnova_avatar_sync') {
        synchroniserAvatar();
    }
});

window.addEventListener('avatarModifie', (e) => {
    console.log('Avatar modifié dans un autre onglet');
});

// Écouter les changements d'utilisateur pour les discussions
document.addEventListener('avatarMisAJour', (e) => {
    // Mettre à jour l'avatar dans les composants de discussion
    const avatarDiscussions = document.querySelectorAll('.message-avatar img, .discussion-avatar img');
    avatarDiscussions.forEach(img => {
        img.src = e.detail.avatarUrl;
    });
});

// ============================================
// EXPOSITION DES FONCTIONS GLOBALES
// ============================================

window.TGNOVA_PHOTO = {
    ouvrirSelecteurFichier,
    traiterFichierImage,
    supprimerAvatar,
    mettreAJourTousAvatars,
    synchroniserAvatar,
    reinitialiserAvatarsParDefaut
};

// Exposer les fonctions nécessaires pour les événements onclick
window.ouvrirSelecteurFichier = ouvrirSelecteurFichier;
window.supprimerAvatar = supprimerAvatar;

console.log('📷 Gestionnaire de photo de profil (Firebase) chargé');