/**
 * GESTION DU PROFIL UTILISATEUR AVEC FIREBASE
 * Charge et enregistre les données de profil utilisateur dans Firestore
 */

// Variables globales
let utilisateurActuel = null;
let donneesProfilOriginales = {};

// ============================================
// INITIALISATION
// ============================================

/**
 * Initialise la gestion du profil avec Firebase
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initialisation du profil Firebase');
    
    // Initialiser les événements AVANT d'authentifier
    initialiserEvenementsFormulaireProfil();
    
    // Attendre que l'utilisateur soit connecté
    firebase.auth().onAuthStateChanged(async (user) => {
        if (!user) {
            console.warn('Aucun utilisateur connecté');
            return;
        }
        
        utilisateurActuel = user;
        console.log('👤 Utilisateur connecté:', user.uid);
        
        // Charger les données du profil depuis Firestore
        await chargerProfilUtilisateur();
    });
});

// ============================================
// CHARGEMENT DES DONNÉES
// ============================================

/**
 * Charge les données du profil de l'utilisateur depuis Firestore
 */
async function chargerProfilUtilisateur() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    // Afficher l'overlay de chargement
    afficherLoading('Chargement du profil', 'Récupération des informations...');
    
    try {
        const db = firebase.firestore();
        const docUser = await db.collection('utilisateurs').doc(user.uid).get();
        
        console.log('🔍 Recherche du document utilisateur:', user.uid);
        
        if (docUser.exists) {
            const data = docUser.data();
            console.log('📦 Données trouvées:', data);
            
            utilisateurActuel = {
                ...user,
                ...data
            };
            
            // Sauvegarder les données originales pour la comparaison
            donneesProfilOriginales = { ...data };
            
            // Remplir le formulaire avec les données
            remplirFormulaireProfilUtilisateur(data);
            
            console.log('✅ Profil utilisateur chargé:', utilisateurActuel.nom);
        } else {
            console.warn('Document utilisateur non trouvé dans Firestore - création par défaut');
            // Créer un document par défaut
            await creerProfilParDefaut();
        }
    } catch (error) {
        console.error('❌ Erreur chargement profil:', error);
        afficherNotification('Erreur lors du chargement du profil', 'erreur');
    } finally {
        // Masquer l'overlay de chargement
        masquerLoading();
    }
}

/**
 * Crée un profil utilisateur par défaut
 */
async function creerProfilParDefaut() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    // Afficher l'overlay de chargement
    afficherLoading('Création du profil', 'Configuration du compte...');
    
    try {
        const db = firebase.firestore();
        const profilParDefaut = {
            nom: user.displayName || 'Utilisateur',
            email: user.email,
            telephone: '',
            bio: '',
            avatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=4F46E5&color=fff`,
            dateCreation: firebase.firestore.FieldValue.serverTimestamp(),
            dateModification: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('utilisateurs').doc(user.uid).set(profilParDefaut);
        
        utilisateurActuel = {
            ...user,
            ...profilParDefaut
        };
        donneesProfilOriginales = { ...profilParDefaut };
        
        remplirFormulaireProfilUtilisateur(profilParDefaut);
        
        console.log('✅ Profil par défaut créé');
    } catch (error) {
        console.error('❌ Erreur création profil par défaut:', error);
    } finally {
        // Masquer l'overlay de chargement
        masquerLoading();
    }
}

/**
 * Remplit le formulaire avec les données du profil
 */
function remplirFormulaireProfilUtilisateur(data) {
    // Informations personnelles
    const champNom = document.querySelector('[name="nom"]');
    if (champNom) champNom.value = data.nom || '';
    
    const champEmail = document.querySelector('[name="email"]');
    if (champEmail) champEmail.value = data.email || utilisateurActuel.email || '';
    
    const champTelephone = document.querySelector('[name="telephone"]');
    if (champTelephone) champTelephone.value = data.telephone || '';
    
    const champBio = document.querySelector('[name="bio"]');
    if (champBio) {
        champBio.value = data.bio || '';
        // Mettre à jour le compteur de caractères
        mettreLaJourCompagterCaracteres();
    }
    
    // Afficher les informations du profil
    const nomProfil = document.getElementById('nomProfil');
    if (nomProfil) nomProfil.textContent = data.nom || 'Utilisateur';
    
    const detailsProfil = document.getElementById('detailsProfil');
    if (detailsProfil) {
        const statut = data.statut || 'Membre';
        detailsProfil.textContent = `${statut} • ${data.email || utilisateurActuel.email || ''}`;
    }
    
    // Mettre à jour la barre latérale
    mettreAJourBarreLaterale(data);
}

/**
 * Met à jour les informations dans la barre latérale
 */
function mettreAJourBarreLaterale(data) {
    // Nom de l'utilisateur
    const nomUser = document.getElementById('userName');
    if (nomUser) nomUser.textContent = data.nom || 'Utilisateur';
    
    // Email de l'utilisateur
    const emailUser = document.getElementById('userEmail');
    if (emailUser) emailUser.textContent = data.email || utilisateurActuel.email || '';
}

// ============================================
// GESTION DES ÉVÉNEMENTS
// ============================================

/**
 * Initialise les événements du formulaire de profil
 */
function initialiserEvenementsFormulaireProfil() {
    // Bouton Enregistrer
    const btnEnregistrer = document.getElementById('enregistrerProfil');
    if (btnEnregistrer) {
        btnEnregistrer.addEventListener('click', enregistrerModificationsProfil);
    }
    
    // Bouton Annuler
    const btnAnnuler = document.getElementById('annulerProfil');
    if (btnAnnuler) {
        btnAnnuler.addEventListener('click', annulerModificationsProfil);
    }
    
    // Compteur de caractères pour la bio
    const champBio = document.querySelector('[name="bio"]');
    if (champBio) {
        champBio.addEventListener('input', mettreLaJourCompagterCaracteres);
    }
    
    // Détecter les modifications
    const formulaireProfil = document.querySelector('#profil .carte-parametres') || document.querySelector('form');
    if (formulaireProfil) {
        formulaireProfil.querySelectorAll('.champ-parametre').forEach(champ => {
            champ.addEventListener('change', indicquerModifications);
        });
    }
}

// ============================================
// ENREGISTREMENT DES MODIFICATIONS
// ============================================

/**
 * Enregistre les modifications du profil dans Firestore
 */
async function enregistrerModificationsProfil() {
    const user = firebase.auth().currentUser;
    if (!user) {
        afficherNotification('Utilisateur non connecté', 'erreur');
        return;
    }
    
    try {
        // Récupérer les valeurs du formulaire
        const nom = document.querySelector('[name="nom"]')?.value?.trim() || '';
        const email = document.querySelector('[name="email"]')?.value?.trim() || '';
        const telephone = document.querySelector('[name="telephone"]')?.value?.trim() || '';
        const bio = document.querySelector('[name="bio"]')?.value?.trim() || '';
        
        // Validation
        if (!nom) {
            afficherNotification('Le nom est obligatoire', 'erreur');
            document.querySelector('[name="nom"]').focus();
            return;
        }
        
        if (!email) {
            afficherNotification('L\'email est obligatoire', 'erreur');
            document.querySelector('[name="email"]').focus();
            return;
        }
        
        // Limiter la bio à 500 caractères
        if (bio.length > 500) {
            afficherNotification('La bio ne peut pas dépasser 500 caractères', 'erreur');
            return;
        }
        
        // Préparer les données à enregistrer
        const donneesAEnregistrer = {
            nom: nom,
            email: email,
            telephone: telephone,
            bio: bio,
            dateModification: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        console.log('💾 Tentative d\'enregistrement pour l\'utilisateur:', user.uid);
        console.log('📝 Données à enregistrer:', donneesAEnregistrer);
        
        // Afficher l'overlay de chargement
        afficherLoading('Mise à jour du profil', 'Sauvegarde en cours...');
        
        try {
            // Enregistrer les données dans Firestore (mise à jour ou création)
            const db = firebase.firestore();
            const docRef = db.collection('utilisateurs').doc(user.uid);
            
            // Utiliser set avec merge pour mettre à jour le document existant ou le créer si nécessaire
            await docRef.set(donneesAEnregistrer, { merge: true });
            
            console.log('✅ Données enregistrées dans Firestore');
            
            // Relire les données depuis Firestore pour s'assurer qu'elles ont été sauvegardées
            const docMisAJour = await docRef.get();
            
            if (docMisAJour.exists) {
                const dataActualisee = docMisAJour.data();
                
                console.log('🔄 Données relues depuis Firestore:', dataActualisee);
                
                // Sauvegarder les données originales pour la comparaison
                donneesProfilOriginales = { ...dataActualisee };
                utilisateurActuel = {
                    ...utilisateurActuel,
                    ...dataActualisee
                };
                
                // Mettre à jour l'affichage du profil avec les données réelles de Firestore
                remplirFormulaireProfilUtilisateur(dataActualisee);
                
                // Mettre à jour la barre latérale
                mettreAJourBarreLaterale(dataActualisee);
                
                // Afficher la notification
                afficherNotification('✅ Profil mis à jour avec succès', 'succes');
                
                console.log('✅ Profil utilisateur enregistré et rechargé');
            } else {
                console.error('❌ Document non trouvé après enregistrement');
                afficherNotification('Erreur: document non trouvé après enregistrement', 'erreur');
            }
        } catch (error) {
            console.error('❌ Erreur sauvegarde:', error);
            afficherNotification('Erreur lors de la sauvegarde', 'erreur');
        } finally {
            // Masquer l'overlay de chargement
            masquerLoading();
        }
    } catch (error) {
        console.error('❌ Erreur enregistrement profil:', error);
        afficherNotification('Erreur lors de l\'enregistrement du profil', 'erreur');
    }
}

/**
 * Annule les modifications du profil
 */
function annulerModificationsProfil() {
    // Restaurer les données originales
    remplirFormulaireProfilUtilisateur(donneesProfilOriginales);
    afficherNotification('Modifications annulées', 'info');
}

// ============================================
// UTILITAIRES
// ============================================

/**
 * Met à jour le compteur de caractères de la bio
 */
function mettreLaJourCompagterCaracteres() {
    const champBio = document.querySelector('[name="bio"]');
    const compteur = document.getElementById('compteur-bio');
    
    if (champBio && compteur) {
        const nombre = champBio.value.length;
        compteur.textContent = `${nombre}/500`;
    }
}

/**
 * Indique que le formulaire a été modifié
 */
function indicquerModifications() {
    const btnEnregistrer = document.getElementById('enregistrerProfil');
    if (btnEnregistrer) {
        btnEnregistrer.style.opacity = '1';
        btnEnregistrer.style.pointerEvents = 'auto';
    }
}

/**
 * Affiche une notification
 */
function afficherNotification(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Créer une notification visuelle si possible
    try {
        // Créer un élément de notification temporaire
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            background: ${type === 'succes' ? '#4CAF50' : type === 'erreur' ? '#f44336' : '#2196F3'};
            color: white;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Supprimer la notification après 3 secondes
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    } catch (error) {
        console.warn('Impossible d\'afficher la notification:', error);
    }
}
