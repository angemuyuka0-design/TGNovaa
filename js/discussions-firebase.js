/**
 * SYSTÈME DE DISCUSSIONS EN TEMPS RÉEL AVEC FIREBASE
 * Gère les conversations, messages, et indicateurs de saisie
 */

// ============================================
// VARIABLES GLOBALES
// ============================================

let conversationActive = null;
let utilisateurConnecte = null;
let conversationListener = null;
let typingListener = null;
let typingTimeout = null;
let conversations = {};

// ============================================
// INITIALISATION
// ============================================

/**
 * Initialise le système de discussions
 */
async function initialiserDiscussionsFirebase() {
    console.log('🚀 Initialisation du système de discussions Firebase');
    
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
            
            // Charger les conversations de l'utilisateur
            chargerConversations();
            
            // Ajouter les écouteurs de boutons
            const boutonNouvelleDiscussion = document.getElementById('boutonNouvelleDiscussion');
            if (boutonNouvelleDiscussion) {
                boutonNouvelleDiscussion.addEventListener('click', afficherModalNouvelleDiscussion);
            }
            
        } catch (error) {
            console.error('Erreur initialisation utilisateur:', error);
        }
    });
}

/**
 * Charge les conversations de l'utilisateur
 */
function chargerConversations() {
    if (!utilisateurConnecte) return;
    
    // Écouter les conversations de l'utilisateur
    const q = firebase.firestore()
        .collection('discussions')
        .where('membres', 'array-contains', utilisateurConnecte.id);
    
    q.onSnapshot((snapshot) => {
        conversations = {};
        
        snapshot.docs.forEach(doc => {
            conversations[doc.id] = {
                id: doc.id,
                ...doc.data()
            };
        });
        
        console.log(`✅ ${Object.keys(conversations).length} conversations chargées`);
        reconstruireListeConversations();
        
        // Charger la conversation active
        if (conversationActive && conversations[conversationActive]) {
            chargerConversation(conversationActive);
        }
    });
}

/**
 * Reconstruit la liste des conversations dans l'interface
 */
function reconstruireListeConversations() {
    const listeConversations = document.querySelector('.liste-conversations');
    if (!listeConversations) return;
    
    // Trier les conversations par dernier message
    const conversationsSortees = Object.values(conversations).sort((a, b) => {
        const dateA = a.derniereModification?.toDate?.() || new Date(0);
        const dateB = b.derniereModification?.toDate?.() || new Date(0);
        return dateB - dateA;
    });
    
    if (conversationsSortees.length === 0) {
        listeConversations.innerHTML = '<p class="aucune-conversation">Aucune conversation. Créez-en une nouvelle!</p>';
        return;
    }
    
    listeConversations.innerHTML = conversationsSortees.map(conv => {
        const autresMembres = conv.membres.filter(m => m !== utilisateurConnecte.id);
        const nomConversation = conv.nom || autresMembres.map(id => {
            // Récupérer le nom du membre depuis la conversation
            return conv.membresInfo?.find(m => m.id === id)?.nom || 'Utilisateur';
        }).join(', ');
        
        const estActive = conversationActive === conv.id ? 'active' : '';
        const nonLuClass = (conv.nonLus?.[utilisateurConnecte.id] > 0) ? 'non-lu' : '';
        
        return `
            <div class="conversation-item ${estActive} ${nonLuClass}" data-conversation-id="${conv.id}">
                <div class="avatar-conversation">
                    <img src="${conv.avatarGroupe || `https://ui-avatars.com/api/?name=${encodeURIComponent(nomConversation)}&background=4F46E5&color=fff`}" alt="${nomConversation}">
                </div>
                <div class="infos-conversation">
                    <div class="nom-et-heure">
                        <h4 class="nom-conversation">${nomConversation}</h4>
                        <span class="heure-message">${formatHeure(conv.derniereModification?.toDate?.())}</span>
                    </div>
                    <p class="apercu-message">${conv.derniereMessage || 'Aucun message'}</p>
                    ${conv.nonLus?.[utilisateurConnecte.id] > 0 ? `<span class="badge-non-lu">${conv.nonLus[utilisateurConnecte.id]}</span>` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    // Ajouter les écouteurs
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.addEventListener('click', () => {
            const convId = item.dataset.conversationId;
            chargerConversation(convId);
        });
    });
}

/**
 * Charge une conversation spécifique
 */
function chargerConversation(conversationId) {
    if (!conversations[conversationId]) return;
    
    conversationActive = conversationId;
    const conversation = conversations[conversationId];
    
    console.log('📬 Conversation chargée:', conversation.nom);
    
    // Afficher les infos de la conversation
    afficherEntetteConversation(conversation);
    
    // Charger les messages en temps réel
    if (conversationListener) conversationListener();
    
    chargerMessagesEnTempsReel(conversationId);
    
    // Écouter l'indicateur de saisie
    ecouterIndicateurSaisie(conversationId);
    
    // Marquer les messages comme lus
    marquerMessagesCommelusLocalement(conversationId);
    
    // Initialiser le chat
    initialiserChat();
    
    // Afficher le contenu du chat
    const sectionChat = document.querySelector('.section-chat');
    const stateVide = document.querySelector('.etat-vide-discussions');
    
    if (sectionChat) sectionChat.style.display = 'flex';
    if (stateVide) stateVide.style.display = 'none';
}

/**
 * Affiche l'entête de la conversation
 */
function afficherEntetteConversation(conversation) {
    const entetteConversation = document.querySelector('.entete-conversation');
    if (!entetteConversation) return;
    
    const autresMembres = conversation.membres.filter(m => m !== utilisateurConnecte.id);
    const nomConversation = conversation.nom || autresMembres.map(id => {
        return conversation.membresInfo?.find(m => m.id === id)?.nom || 'Utilisateur';
    }).join(', ');
    
    const statutTexte = conversation.statut === 'en-ligne' ? 'En ligne' : 'Hors ligne';
    
    entetteConversation.innerHTML = `
        <div class="infos-entete">
            <img src="${conversation.avatarGroupe || `https://ui-avatars.com/api/?name=${encodeURIComponent(nomConversation)}&background=4F46E5&color=fff`}" alt="${nomConversation}" class="avatar-entete">
            <div class="texte-entete">
                <h3 class="nom-entete">${nomConversation}</h3>
                <p class="statut-entete">${statutTexte}</p>
            </div>
        </div>
        <div class="actions-entete">
            <button class="bouton-action-discussion" title="Appel vidéo">
                <i class="fas fa-video"></i>
            </button>
            <button class="bouton-action-discussion" title="Appel audio">
                <i class="fas fa-phone"></i>
            </button>
            <button class="bouton-action-discussion" title="Infos">
                <i class="fas fa-info-circle"></i>
            </button>
        </div>
    `;
}

/**
 * Charge les messages en temps réel
 */
function chargerMessagesEnTempsReel(conversationId) {
    const db = firebase.firestore();
    
    const q = db.collection('discussions').doc(conversationId).collection('messages')
        .orderBy('dateEnvoi', 'asc');
    
    conversationListener = q.onSnapshot((snapshot) => {
        const containerMessages = document.querySelector('.zone-messages');
        if (!containerMessages) return;
        
        // Récupérer les messages
        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Afficher les messages
        containerMessages.innerHTML = messages.map(msg => {
            const estMoi = msg.auteurId === utilisateurConnecte.id;
            const nomAuteur = conversations[conversationId].membresInfo?.find(m => m.id === msg.auteurId)?.nom || 'Utilisateur';

            // lire la liste des utilisateurs ayant ouvert le message
            const lusPar = msg.lusPar || [];

            // déterminer si le message est considéré comme lu pour l'auteur
            let estLuPourAuteur = false;
            const conv = conversations[conversationId] || { membres: [] };
            const autresMembres = (conv.membres || []).filter(id => id !== msg.auteurId);

            if (estMoi) {
                if (autresMembres.length === 0) {
                    estLuPourAuteur = false;
                } else if (autresMembres.length === 1) {
                    estLuPourAuteur = lusPar.includes(autresMembres[0]);
                } else {
                    estLuPourAuteur = autresMembres.every(id => lusPar.includes(id));
                }
            }

            const iconeLu = estMoi ? `<i class="fas fa-check-double ${estLuPourAuteur ? 'lu' : ''}"></i>` : '';

            // DEBUG: log information sur les read receipts
            try {
                console.log('renderMessage:', { id: msg.id, auteurId: msg.auteurId, estMoi, lusPar, estLuPourAuteur });
            } catch (e) {
                console.log('renderMessage: erreur log', e);
            }

            return `
                <div class="groupe-messages ${estMoi ? 'messages-moi' : 'messages-autre'}">
                    ${!estMoi ? `<img src="${msg.avatarAuteur}" alt="${nomAuteur}" class="avatar-message">` : ''}
                    <div class="contenu-messages">
                        ${!estMoi ? `<p class="nom-auteur">${nomAuteur}</p>` : ''}
                        <div class="bulle-message">
                            ${msg.texte ? `<p>${echapperHTML(msg.texte)}</p>` : ''}
                            ${msg.images?.map(img => `<img src="${img}" alt="Image" class="image-message">`).join('') || ''}
                            ${msg.fichiers?.map(fichier => `
                                <a href="${fichier.url}" class="lien-fichier" download="${fichier.nom}">
                                    <i class="fas fa-file"></i> ${fichier.nom}
                                </a>
                            `).join('') || ''}
                            <span class="heure-message">${formatHeure(msg.dateEnvoi?.toDate?.())}</span>
                            ${iconeLu}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Scroller vers le bas
        containerMessages.scrollTop = containerMessages.scrollHeight;
    });
}

/**
 * Envoie un message
 */
async function envoyerMessage(texte, images = [], fichiers = []) {
    if (!conversationActive || !utilisateurConnecte) return;
    
    if (!texte.trim() && images.length === 0 && fichiers.length === 0) return;
    
    try {
        const db = firebase.firestore();
        const conversation = conversations[conversationActive];
        
        // Créer le message
        const message = {
            auteurId: utilisateurConnecte.id,
            avatarAuteur: utilisateurConnecte.avatar,
            texte: texte.trim(),
            images: images,
            fichiers: fichiers,
            dateEnvoi: firebase.firestore.FieldValue.serverTimestamp(),
            lu: false,
            lusPar: []
        };
        
        // Ajouter le message à la collection
        await db.collection('discussions').doc(conversationActive).collection('messages').add(message);
        
        // Mettre à jour la conversation
        await db.collection('discussions').doc(conversationActive).update({
            derniereMessage: texte.trim() || '[Fichier(s) jointe(s)]',
            derniereModification: firebase.firestore.FieldValue.serverTimestamp(),
            derniereAuteur: utilisateurConnecte.id
        });
        
        // Arrêter l'indicateur "en train d'écrire"
        await arreterIndicateurSaisie();
        
        console.log('✅ Message envoyé');
        
    } catch (error) {
        console.error('Erreur envoi message:', error);
        afficherToast('Erreur lors de l\'envoi du message', 'erreur');
    }
}

/**
 * Gère l'indicateur "en train d'écrire"
 */
async function gererIndicateurSaisie() {
    if (!conversationActive || !utilisateurConnecte) return;
    
    try {
        const db = firebase.firestore();
        const conversation = conversations[conversationActive];
        
        // Ajouter l'utilisateur à la liste des personnes qui écrivent
        await db.collection('discussions').doc(conversationActive).update({
            'utilisateurEnTrainDecrire': firebase.firestore.FieldValue.arrayUnion(utilisateurConnecte.id)
        });
        
        // Supprimer après 3 secondes d'inactivité
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(async () => {
            await arreterIndicateurSaisie();
        }, 3000);
        
    } catch (error) {
        console.error('Erreur indicateur saisie:', error);
    }
}

/**
 * Arrête l'indicateur "en train d'écrire"
 */
async function arreterIndicateurSaisie() {
    if (!conversationActive || !utilisateurConnecte) return;
    
    try {
        const db = firebase.firestore();
        
        await db.collection('discussions').doc(conversationActive).update({
            'utilisateurEnTrainDecrire': firebase.firestore.FieldValue.arrayRemove(utilisateurConnecte.id)
        });
        
    } catch (error) {
        console.error('Erreur arrêt indicateur:', error);
    }
}

/**
 * Écoute les indicateurs "en train d'écrire"
 */
function ecouterIndicateurSaisie(conversationId) {
    if (!conversationId) return;
    
    if (typingListener) typingListener();
    
    const db = firebase.firestore();
    const docRef = db.collection('discussions').doc(conversationId);
    
    typingListener = docRef.onSnapshot((doc) => {
        if (!doc.exists) return;
        
        const utilisateursEnTrainDecrire = doc.data().utilisateurEnTrainDecrire || [];
        const indicateur = document.querySelector('.indicateur-saisie');
        
        if (indicateur && utilisateursEnTrainDecrire.length > 0) {
            const noms = utilisateursEnTrainDecrire.map(userId => {
                if (userId === utilisateurConnecte.id) return null;
                return conversations[conversationId].membresInfo?.find(m => m.id === userId)?.nom || 'Utilisateur';
            }).filter(n => n);
            
            if (noms.length > 0) {
                indicateur.style.display = 'block';
                indicateur.innerHTML = `<p>${noms.join(', ')} entrain d\'écrire...</p>`;
            } else {
                indicateur.style.display = 'none';
            }
        }
    });
}

/**
 * Crée une nouvelle discussion
 */
async function creerNouvelleDiscussion(nomDiscussion, membresIds, description = null, typeDiscussion = 'groupe') {
    if (!utilisateurConnecte) return;
    
    // Ajouter l'utilisateur actuel aux membres
    const tousLesMembres = [...membresIds, utilisateurConnecte.id];
    
    try {
        const db = firebase.firestore();
        
        // Récupérer les infos des membres
        const membresInfo = [];
        for (const userId of tousLesMembres) {
            const docUser = await db.collection('utilisateurs').doc(userId).get();
            if (docUser.exists) {
                membresInfo.push({
                    id: userId,
                    ...docUser.data()
                });
            }
        }
        
        // Déterminer le nom de la discussion
        let nomFinal = nomDiscussion;
        if (!nomFinal) {
            if (typeDiscussion === 'individuel') {
                // Pour une discussion individuelle, utiliser le nom de l'autre personne
                nomFinal = membresInfo.find(m => m.id !== utilisateurConnecte.id)?.nom || 'Utilisateur';
            } else {
                nomFinal = membresInfo.map(m => m.nom).join(', ');
            }
        }
        
        // Créer la discussion
        const nouvelleDiscussion = {
            nom: nomFinal,
            type: typeDiscussion,
            membres: tousLesMembres,
            membresInfo: membresInfo,
            createurId: utilisateurConnecte.id,
            dateCreation: firebase.firestore.FieldValue.serverTimestamp(),
            derniereModification: firebase.firestore.FieldValue.serverTimestamp(),
            avatarGroupe: null,
            statut: 'actif',
            description: description || '',
            utilisateurEnTrainDecrire: [],
            nonLus: {}
        };
        
        // Initialiser le compteur de non-lus pour tous les membres
        tousLesMembres.forEach(memberId => {
            nouvelleDiscussion.nonLus[memberId] = 0;
        });
        
        const ref = await db.collection('discussions').add(nouvelleDiscussion);
        
        console.log('✅ Discussion créée:', ref.id);
        
        // Charger la nouvelle discussion
        chargerConversation(ref.id);
        
        return ref.id;
        
    } catch (error) {
        console.error('Erreur création discussion:', error);
        afficherToast('Erreur lors de la création de la discussion', 'erreur');
    }
}

/**
 * Marque les messages comme lus
 */
async function marquerMessagesCommelusLocalement(conversationId) {
    if (!utilisateurConnecte) return;
    
    try {
        const db = firebase.firestore();
        
        // Marquer la conversation comme lue pour l'utilisateur
        const nonLus = conversations[conversationId].nonLus || {};
        nonLus[utilisateurConnecte.id] = 0;
        
        await db.collection('discussions').doc(conversationId).update({
            nonLus: nonLus
        });
        
        // Marquer individuellement les messages comme lus (ajouter utilisateur à lusPar)
        const messagesRef = db.collection('discussions').doc(conversationId).collection('messages');
        const snapshot = await messagesRef.get();

        console.log('marquerMessagesCommelusLocalement: messages trouvés =', snapshot.size);

        if (!snapshot.empty) {
            let batch = db.batch();
            let ops = 0;

            for (const doc of snapshot.docs) {
                const data = doc.data();
                if (!data) continue;

                // ne pas marquer les messages écrits par soi-même
                if (data.auteurId === utilisateurConnecte.id) continue;

                const lusPar = data.lusPar || [];
                if (lusPar.includes(utilisateurConnecte.id)) continue;

                const docRef = messagesRef.doc(doc.id);
                batch.update(docRef, { lusPar: firebase.firestore.FieldValue.arrayUnion(utilisateurConnecte.id) });
                ops += 1;

                // envoyer le batch tous les 400 ops en attendant le commit
                if (ops >= 400) {
                    try {
                        await batch.commit();
                        console.log('marquerMessagesCommelusLocalement: batch commit (400 ops)');
                    } catch (e) {
                        console.error('Erreur batch commit partiel:', e);
                    }
                    batch = db.batch();
                    ops = 0;
                }
            }

            if (ops > 0) {
                try {
                    await batch.commit();
                    console.log('marquerMessagesCommelusLocalement: batch commit final, ops =', ops);
                } catch (e) {
                    console.error('Erreur batch commit final:', e);
                }
            }
        }

    } catch (error) {
        console.error('Erreur marquage messages:', error);
    }
}

/**
 * Initialise les événements du chat
 */
function initialiserChat() {
    const champMessage = document.getElementById('champMessage');
    const boutonEnvoi = document.getElementById('boutonEnvoi');
    
    if (!champMessage || !boutonEnvoi) return;
    
    // Envoi du message
    boutonEnvoi.onclick = () => {
        envoyerMessage(champMessage.value);
        champMessage.value = '';
    };
    
    // Écouter la saisie
    champMessage.addEventListener('input', gererIndicateurSaisie);
    
    // Entrée pour envoyer
    champMessage.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            envoyerMessage(champMessage.value);
            champMessage.value = '';
        }
    });
    
    // Écouter les indicateurs de saisie
    ecouterIndicateurSaisie(conversationActive);
}

/**
 * Utilitaires
 */

function formatHeure(date) {
    if (!date) return '';
    
    const maintenant = new Date();
    const diff = maintenant - date;
    
    // Moins d'une minute
    if (diff < 60000) return 'À l\'instant';
    
    // Moins d'une heure
    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `${minutes}m`;
    }
    
    // Moins d'un jour
    if (diff < 86400000) {
        const heures = Math.floor(diff / 3600000);
        return `${heures}h`;
    }
    
    // Même année
    if (date.getFullYear() === maintenant.getFullYear()) {
        return date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
    }
    
    return date.toLocaleDateString('fr-FR');
}

function echapperHTML(texte) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return texte.replace(/[&<>"']/g, m => map[m]);
}

function afficherToast(message, type = 'info') {
    console.log(message);
    // Implémenter un toast UI si nécessaire
}

// Initialiser au chargement
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialiserDiscussionsFirebase);
} else {
    initialiserDiscussionsFirebase();
}
