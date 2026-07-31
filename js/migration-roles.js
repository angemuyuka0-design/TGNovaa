// Script de migration pour ajouter les rôles utilisateur
// À exécuter une seule fois pour migrer les utilisateurs existants

console.log('📦 Script migration-roles.js chargé');

/**
 * Migre les utilisateurs existants en ajoutant le champ 'role'
 * Valeur par défaut: 'utilisateur'
 * L'utilisateur actuel sera défini comme administrateur
 */
async function migrerUtilisateursRoles() {
    console.log('🚀 Démarrage de la migration des rôles utilisateur...');

    try {
        // Vérifier que l'utilisateur est connecté
        const userActuel = firebase.auth().currentUser;
        if (!userActuel) {
            console.error('❌ Aucun utilisateur connecté. Veuillez vous connecter d\'abord.');
            return false;
        }

        const db = firebase.firestore();
        const batch = db.batch();

        // Récupérer tous les utilisateurs existants
        const utilisateursRef = db.collection('utilisateurs');
        const snapshot = await utilisateursRef.get();

        if (snapshot.empty) {
            console.log('ℹ️ Aucun utilisateur trouvé dans la base de données.');
            return true;
        }

        console.log(`📊 ${snapshot.size} utilisateurs trouvés. Migration en cours...`);

        let utilisateursMisAJour = 0;
        let adminDefini = false;

        // Traiter chaque utilisateur
        for (const doc of snapshot.docs) {
            const data = doc.data();
            const updateData = {};

            // Vérifier si le champ role existe déjà
            if (!data.role && !data.statut) {
                // Définir l'utilisateur actuel comme administrateur
                if (doc.id === userActuel.uid && !adminDefini) {
                    updateData.role = 'administrateur';
                    updateData.statut = 'administrateur';
                    adminDefini = true;
                    console.log(`👑 Utilisateur ${data.nom || data.email} défini comme administrateur`);
                } else {
                    // Tous les autres sont des utilisateurs simples
                    updateData.role = 'utilisateur';
                    updateData.statut = 'actif';
                }

                // Ajouter d'autres champs par défaut si manquants
                if (!data.dateCreation) {
                    updateData.dateCreation = data.createdAt || firebase.firestore.FieldValue.serverTimestamp();
                }

                if (!data.dateModification) {
                    updateData.dateModification = firebase.firestore.FieldValue.serverTimestamp();
                }

                if (!data.permissions) {
                    updateData.permissions = {};
                }

                // Mettre à jour le document
                const docRef = utilisateursRef.doc(doc.id);
                batch.update(docRef, updateData);
                utilisateursMisAJour++;
            }
        }

        // Exécuter le batch
        if (utilisateursMisAJour > 0) {
            await batch.commit();
            console.log(`✅ Migration terminée: ${utilisateursMisAJour} utilisateurs mis à jour`);
        } else {
            console.log('ℹ️ Tous les utilisateurs avaient déjà un rôle défini');
        }

        // Afficher un résumé
        if (adminDefini) {
            console.log('🎉 Vous êtes maintenant défini comme administrateur');
            console.log('💡 Vous pouvez maintenant créer de nouveaux comptes utilisateur');
        }

        return true;

    } catch (error) {
        console.error('❌ Erreur lors de la migration:', error);
        return false;
    }
}

/**
 * Fonction utilitaire pour définir manuellement un administrateur
 * @param {string} userId - ID de l'utilisateur à définir comme admin
 */
async function definirAdministrateur(userId) {
    try {
        const db = firebase.firestore();
        await db.collection('utilisateurs').doc(userId).update({
            role: 'administrateur',
            statut: 'administrateur',
            dateModification: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log(`✅ Utilisateur ${userId} défini comme administrateur`);
        return true;
    } catch (error) {
        console.error('❌ Erreur lors de la définition de l\'administrateur:', error);
        return false;
    }
}

/**
 * Fonction utilitaire pour vérifier les rôles des utilisateurs
 */
async function verifierRolesUtilisateurs() {
    try {
        const db = firebase.firestore();
        const snapshot = await db.collection('utilisateurs').get();

        console.log('📋 Liste des utilisateurs et leurs rôles:');
        snapshot.forEach(doc => {
            const data = doc.data();
            console.log(`- ${data.nom || 'N/A'} (${data.email}): ${data.role || 'non défini'} (${data.statut || 'non défini'})`);
        });

        return true;
    } catch (error) {
        console.error('❌ Erreur lors de la vérification:', error);
        return false;
    }
}

// Exposer les fonctions globalement pour utilisation dans la console
window.migrerUtilisateursRoles = migrerUtilisateursRoles;
window.definirAdministrateur = definirAdministrateur;
window.verifierRolesUtilisateurs = verifierRolesUtilisateurs;

console.log('🔧 Fonctions de migration disponibles:');
console.log('- migrerUtilisateursRoles() : Migre tous les utilisateurs existants');
console.log('- definirAdministrateur(userId) : Définit un utilisateur spécifique comme admin');
console.log('- verifierRolesUtilisateurs() : Affiche les rôles de tous les utilisateurs');