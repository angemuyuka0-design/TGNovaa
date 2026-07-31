// ===== INSCRIPTION EMAIL =====
window.register = function() {
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // Valider les champs
    if (!name || !email || !password) {
        modalUtils.afficherMessage('Erreur', 'Tous les champs sont obligatoires', 'erreur');
        return;
    }

    // Valider le format email
    if (!email.includes('@')) {
        modalUtils.afficherMessage('Erreur', 'Veuillez entrer une adresse email valide', 'erreur');
        return;
    }

    // Valider la longueur du mot de passe
    if (password.length < 6) {
        modalUtils.afficherMessage('Erreur', 'Le mot de passe doit contenir au moins 6 caractères', 'erreur');
        return;
    }

    console.log('🔄 Tentative d\'inscription pour:', email);

    // Afficher l'overlay de chargement
    afficherLoading('Inscription en cours', 'Création du compte...');

    // Créer l'utilisateur dans Firebase Auth
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then(async (userCredential) => {
            const user = userCredential.user;
            const db = firebase.firestore();
            
            console.log('✅ Utilisateur créé dans Auth:', user.uid);
            
            // Créer l'avatar avec UI Avatars
            const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4F46E5&color=fff`;
            
            try {
                // Sauvegarder les infos dans la collection "utilisateurs"
                await db.collection('utilisateurs').doc(user.uid).set({
                    id: user.uid,
                    nom: name,
                    email: email,
                    avatar: avatar,
                    dateCreation: new Date(),
                    statut: 'actif'
                });
                
                console.log('✅ Utilisateur sauvegardé dans Firestore');
                
                // Mettre à jour le profil Firebase
                await user.updateProfile({
                    displayName: name,
                    photoURL: avatar
                });
                
                console.log('✅ Profil Firebase mis à jour');
                
                modalUtils.afficherMessage('Inscription réussie', '✅ Inscription réussie !\n\n📬 Un email avec vos identifiants de connexion a été envoyé à votre adresse.\n\nVérifiez aussi votre dossier spam.', 'succes', {
                    confirmText: 'Continuer',
                    onClose: () => window.location.href = 'login.html'
                });
            } catch (firestoreError) {
                console.error('❌ Erreur Firestore:', firestoreError);
                modalUtils.afficherMessage('Attention', `Compte créé dans Auth, mais erreur Firestore: ${firestoreError.message}`, 'erreur', {
                    confirmText: 'Continuer',
                    onClose: () => window.location.href = 'login.html'
                });
            } finally {
                masquerLoading();
            }
        })
        .catch((error) => {
            console.error('❌ Erreur inscription:', error.code, error.message);
            masquerLoading();
            
            // Gérer les erreurs spécifiques
            switch(error.code) {
                case 'auth/network-request-failed':
                    modalUtils.afficherMessage('Erreur', '❌ Erreur réseau: Vérifiez votre connexion Internet ou que le serveur est accessible', 'erreur');
                    break;
                case 'auth/email-already-in-use':
                    modalUtils.afficherMessage('Erreur', '❌ Cet email est déjà utilisé', 'erreur');
                    break;
                case 'auth/weak-password':
                    modalUtils.afficherMessage('Erreur', '❌ Le mot de passe est trop faible (min 6 caractères)', 'erreur');
                    break;
                case 'auth/invalid-email':
                    modalUtils.afficherMessage('Erreur', '❌ Email invalide', 'erreur');
                    break;
                default:
                    modalUtils.afficherMessage('Erreur', `❌ Erreur: ${error.message}`, 'erreur');
            }
        });
}


// ===== CONNEXION EMAIL =====
window.login = function() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // Afficher l'overlay de chargement
    afficherLoading('Connexion en cours', 'Vérification des identifiants...');

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then(async (userCredential) => {
            const user = userCredential.user;
            
            console.log('✅ Connexion autorisée');
            masquerLoading();
            
            modalUtils.afficherMessage('Connexion réussie', '✅ Bienvenue ' + (user.displayName || user.email) + ' !', 'succes', {
                confirmText: 'Continuer',
                onClose: () => window.location.href = 'dashboard.html'
            });
        })
        .catch((error) => {
            masquerLoading();
            modalUtils.afficherMessage('Erreur', `Erreur : ${error.message}`, 'erreur');
        });
}

// ===== RENVOYER L'EMAIL AVEC IDENTIFIANTS =====
window.renvoyerEmailIdentifiants = async function() {
    const user = firebase.auth().currentUser;
    
    if (!user) {
        modalUtils.afficherMessage('Erreur', 'Aucun utilisateur connecté', 'erreur');
        return;
    }
    
    try {
        afficherLoading('Envoi en cours', 'Envoi de vos identifiants...');
        
        // Appeler la Cloud Function
        const renvoyerEmail = firebase.functions().httpsCallable('renvoyerEmailIdentifiants');
        const result = await renvoyerEmail();
        
        masquerLoading();
        modalUtils.afficherMessage(
            'Email envoyé',
            '📧 Vos identifiants de connexion ont été renvoyés à ' + user.email + '.\n\nVérifiez aussi votre dossier spam.',
            'succes'
        );
    } catch (error) {
        masquerLoading();
        console.error('Erreur renvoi email:', error);
        modalUtils.afficherMessage('Erreur', 'Impossible de renvoyer l\'email: ' + error.message, 'erreur');
    }
};

window.loginWithGoogle = function() {
    // Afficher l'overlay de chargement
    afficherLoading('Connexion Google', 'Authentification en cours...');

    const googleProvider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(googleProvider)
        .then(() => {
            modalUtils.afficherMessage('Connexion réussie', '✅ Connexion avec Google réussie !', 'succes', {
                confirmText: 'Continuer',
                onClose: () => window.location.href = 'dashboard.html'
            });
        })
        .catch((error) => {
            modalUtils.afficherMessage('Erreur', `Erreur Google : ${error.message}`, 'erreur');
            masquerLoading();
        });
}

// Connexion via GitHub
window.loginWithGithub = function() {
    // Afficher l'overlay de chargement
    afficherLoading('Connexion GitHub', 'Authentification en cours...');

    const githubProvider = new firebase.auth.GithubAuthProvider();
    firebase.auth().signInWithPopup(githubProvider)
        .then(() => {
            modalUtils.afficherMessage('Connexion réussie', '✅ Connexion GitHub réussie !', 'succes', {
                confirmText: 'Continuer',
                onClose: () => window.location.href = 'dashboard.html'
            });
        })
        .catch((error) => {
            modalUtils.afficherMessage('Erreur', `Erreur GitHub : ${error.message}`, 'erreur');
            masquerLoading();
        });
}
