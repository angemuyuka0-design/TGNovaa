/**
 * SCRIPT DE TEST - DISCUSSIONS FIREBASE
 * À exécuter dans la console du navigateur
 */

console.log('🧪 Tests du système de discussions');

// Test 1: Vérifier Firebase
console.log('✅ Test 1: Firebase connecté?', typeof firebase !== 'undefined');

// Test 2: Vérifier Firestore
console.log('✅ Test 2: Firestore disponible?', typeof firebase.firestore !== 'undefined');

// Test 3: Vérifier l'utilisateur connecté
console.log('✅ Test 3: Utilisateur connecté?', utilisateurConnecte ? `${utilisateurConnecte.nom} (${utilisateurConnecte.id})` : 'Non');

// Test 4: Vérifier les conversations chargées
console.log('✅ Test 4: Conversations chargées?', Object.keys(conversations).length + ' conversation(s)');

// Test 5: Lister les conversations
if (Object.keys(conversations).length > 0) {
    console.log('📋 Conversations disponibles:');
    Object.values(conversations).forEach((conv, index) => {
        console.log(`  ${index + 1}. ${conv.nom} (${conv.membres.length} membres)`);
    });
}

// Test 6: Fonction pour créer une discussion de test
async function testerCreerDiscussion() {
    console.log('🧪 Création d\'une discussion de test...');
    
    try {
        const db = firebase.firestore();
        
        // Récupérer un autre utilisateur
        const snapshot = await db.collection('utilisateurs').limit(2).get();
        const autresUsers = snapshot.docs
            .filter(doc => doc.id !== utilisateurConnecte.id)
            .map(doc => doc.id);
        
        if (autresUsers.length === 0) {
            console.log('❌ Pas d\'autre utilisateur pour la discussion de test');
            return;
        }
        
        const convId = await creerNouvelleDiscussion('Test Discussion', autresUsers);
        console.log('✅ Discussion créée:', convId);
        
    } catch (error) {
        console.error('❌ Erreur création discussion:', error);
    }
}

// Test 7: Fonction pour envoyer un message de test
async function testerEnvoyerMessage() {
    if (!conversationActive) {
        console.log('❌ Aucune conversation active');
        return;
    }
    
    console.log('🧪 Envoi d\'un message de test...');
    
    try {
        await envoyerMessage('Ceci est un message de test! 🧪');
        console.log('✅ Message envoyé');
    } catch (error) {
        console.error('❌ Erreur envoi message:', error);
    }
}

// Test 8: Afficher l'état actuel
function afficherEtatActuel() {
    console.log('📊 État actuel du système:');
    console.log({
        'Utilisateur': utilisateurConnecte?.nom || 'Non connecté',
        'Conversation active': conversationActive ? conversations[conversationActive]?.nom : 'Aucune',
        'Nombre de conversations': Object.keys(conversations).length,
        'Nombre de messages': document.querySelectorAll('.groupe-messages').length
    });
}

// Afficher les fonctions disponibles pour les tests
console.log('\n📌 Fonctions de test disponibles:');
console.log('  - testerCreerDiscussion()');
console.log('  - testerEnvoyerMessage()');
console.log('  - afficherEtatActuel()');
console.log('\nExemple: testerCreerDiscussion()');
