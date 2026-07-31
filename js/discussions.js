// Gestion des discussions
document.addEventListener('DOMContentLoaded', () => {
    initialiserDiscussions();
});

// Stockage des conversations avec données enrichies
let conversations = {};
let conversationActive = null;
let emojiPicker = null;
let fichiersEnAttente = [];
let imagesEnAttente = [];
let typingTimeout = null;
let membreEnTrainDecrire = null;

// Données de l'utilisateur connecté
const utilisateurConnecte = {
    id: 'user1',
    nom: 'John Doe',
    email: 'john@tgnova.com',
    avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=4F46E5&color=fff',
    statut: 'en-ligne',
    role: 'Admin'
};

// Clé pour le stockage local
const STORAGE_KEY = 'tgnova_conversations_v2';
const ACTIVE_CONVERSATION_KEY = 'tgnova_active_conversation';

/**
 * Charge les conversations depuis le stockage local
 */
function chargerConversationsDepuisStockage() {
    const donneesStockees = localStorage.getItem(STORAGE_KEY);
    if (donneesStockees) {
        try {
            conversations = JSON.parse(donneesStockees);
            
            // S'assurer que seules les conversations de l'utilisateur connecté sont chargées
            Object.keys(conversations).forEach(conversationId => {
                const conversation = conversations[conversationId];
                const estMembre = conversation.membres.some(m => m.id === utilisateurConnecte.id);
                
                if (!estMembre) {
                    delete conversations[conversationId];
                }
            });
            
            sauvegarderConversations();
        } catch (error) {
            console.error('Erreur lors du chargement des conversations:', error);
            conversations = {};
        }
    } else {
        conversations = {};
    }
}

/**
 * Charge la conversation active depuis le stockage local
 */
function chargerConversationActiveDepuisStockage() {
    const conversationId = localStorage.getItem(ACTIVE_CONVERSATION_KEY);
    if (conversationId && conversations[conversationId]) {
        conversationActive = conversationId;
    }
}

/**
 * Sauvegarde les conversations dans le stockage local
 */
function sauvegarderConversations() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des conversations:', error);
    }
}

/**
 * Sauvegarde la conversation active dans le stockage local
 */
function sauvegarderConversationActive() {
    if (conversationActive) {
        localStorage.setItem(ACTIVE_CONVERSATION_KEY, conversationActive);
    } else {
        localStorage.removeItem(ACTIVE_CONVERSATION_KEY);
    }
}

/**
 * Initialise les fonctionnalités des discussions
 */
function initialiserDiscussions() {
    // Charger les conversations depuis le stockage
    chargerConversationsDepuisStockage();
    
    // Charger la conversation active
    chargerConversationActiveDepuisStockage();
    
    // Afficher l'état approprié en fonction de la conversation active
    afficherEtatApproprié();
    
    // Initialiser le chat si nécessaire
    if (conversationActive) {
        initialiserChat();
    }
    
    // Initialiser le sélecteur d'emojis
    initialiserEmojiPicker();
    
    // Gérer l'envoi de messages
    const boutonEnvoi = document.getElementById('boutonEnvoi');
    const champMessage = document.getElementById('champMessage');
    
    if (boutonEnvoi && champMessage) {
        boutonEnvoi.addEventListener('click', () => envoyerMessageEtFichiers());
        
        champMessage.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                envoyerMessageEtFichiers();
            }
        });
        
        // Détecter la saisie pour l'indicateur "en train d'écrire"
        champMessage.addEventListener('input', () => {
            gererIndicateurSaisie();
            ajusterHauteurChamp({ target: champMessage });
        });
        
        // Ajuster la hauteur du champ de saisie
        champMessage.addEventListener('input', ajusterHauteurChamp);
    }
    
    // Nouvelle discussion
    const boutonNouvelleDiscussion = document.getElementById('boutonNouvelleDiscussion');
    if (boutonNouvelleDiscussion) {
        boutonNouvelleDiscussion.addEventListener('click', afficherModalNouvelleDiscussion);
    }
    
    // Actions de discussion (boutons d'appel, info, etc.)
    document.querySelectorAll('.bouton-action-discussion').forEach(bouton => {
        bouton.addEventListener('click', function() {
            const action = this.querySelector('i').className;
            if (action.includes('fa-info-circle')) {
                afficherInformationsDiscussion();
            } else {
                gererActionDiscussion(action);
            }
        });
    });
    
    // Recherche de discussions
    const champRecherche = document.querySelector('.champ-recherche');
    if (champRecherche) {
        champRecherche.addEventListener('input', rechercherDiscussions);
    }
    
    // Gestion des pièces jointes
    const boutonPieceJointe = document.querySelector('.bouton-action-saisie[title*="pièce jointe"], .bouton-action-saisie .fa-paperclip');
    const boutonImage = document.querySelector('.bouton-action-saisie[title*="image"], .bouton-action-saisie .fa-image');
    const boutonEmoji = document.querySelector('.bouton-action-saisie[title*="emoji"], .bouton-action-saisie .fa-smile');
    
    if (boutonPieceJointe) {
        boutonPieceJointe.addEventListener('click', () => selectionnerFichiers('file'));
    }
    
    if (boutonImage) {
        boutonImage.addEventListener('click', () => selectionnerFichiers('image'));
    }
    
    if (boutonEmoji) {
        boutonEmoji.addEventListener('click', afficherEmojiPicker);
    }
    
    // Gérer le retour à l'onglet discussions
    window.addEventListener('focus', () => {
        afficherEtatApproprié();
    });
}

/**
 * Affiche l'état approprié en fonction de la conversation active
 */
function afficherEtatApproprié() {
    // Reconstruire la liste des conversations
    reconstruireListeConversations();
    
    // Si une conversation est active, l'afficher
    if (conversationActive && conversations[conversationActive]) {
        chargerConversation(conversationActive);
    } else {
        // Sinon afficher l'état vide
        afficherEtatVide();
    }
}

/**
 * Reconstruit la liste des conversations depuis les données stockées
 */
function reconstruireListeConversations() {
    const liste = document.querySelector('.liste-conversations');
    if (!liste) return;
    
    // Supprimer tous les éléments existants
    liste.innerHTML = '';
    
    // Si aucune conversation, afficher le message
    if (Object.keys(conversations).length === 0) {
        liste.innerHTML = `
<div class="aucune-conversation" style="
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 3rem 2rem;
    border-radius: 12px;
    border: 2px dashed #dee2e6;
    margin: 2rem auto;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
    animation: fadeIn 0.5s ease-out;
">
    <i class="fas fa-comments" style="
        font-size: 3.5rem;
        color: #6c757d;
        margin-bottom: 1.5rem;
        background: white;
        width: 80px;
        height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(108, 117, 125, 0.1);
    "></i>
    <p style="
        font-size: 1.5rem;
        font-weight: 600;
        color: #495057;
        margin-bottom: 0.5rem;
        line-height: 1.4;
    ">Aucune discussion</p>
    <small style="
        font-size: 0.95rem;
        color: #6c757d;
        margin-bottom: 1.5rem;
        line-height: 1.5;
        max-width: 280px;
    ">Créez votre première discussion pour commencer à échanger</small>
    
</div>

<style>
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .aucune-conversation:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
        border-color: #adb5bd;
    }
    
    .aucune-conversation button:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(79, 70, 229, 0.3);
        background: linear-gradient(135deg, #4338ca 0%, #6d28d9 100%);
    }
    
    .aucune-conversation button:active {
        transform: translateY(0);
        box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);
    }
</style>
        `;
        return;
    }
    
    // Ajouter chaque conversation
    Object.values(conversations).forEach(conversation => {
        ajouterConversationListe(conversation);
    });
}

/**
 * Initialise la zone de chat
 */
function initialiserChat() {
    const zoneMessages = document.getElementById('zoneMessages');
    if (zoneMessages) {
        zoneMessages.scrollTop = zoneMessages.scrollHeight;
    }
}

/**
 * Affiche l'état vide lorsqu'il n'y a pas de conversations
 */
function afficherEtatVide() {
    const zoneMessages = document.getElementById('zoneMessages');
    const panneauDiscussion = document.querySelector('.panneau-discussion');
    
    if (panneauDiscussion) {
        // Masquer l'en-tête de discussion et la zone de saisie
        const enTeteDiscussion = document.querySelector('.en-tete-discussion');
        const zoneSaisie = document.querySelector('.zone-saisie');
        
        if (enTeteDiscussion) enTeteDiscussion.style.display = 'none';
        if (zoneSaisie) zoneSaisie.style.display = 'none';
        
        // Afficher l'état vide
        zoneMessages.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:var(--espace-xl);text-align:center;">
                <div class="discussion-vide" style="max-width:400px;">
                    <i class="fas fa-comments" style="font-size:4rem;color:var(--gris-400);margin-bottom:var(--espace-lg);display:block;"></i>
                    <h3 style="color:var(--gris-800);margin-bottom:var(--espace-sm);font-size:var(--taille-texte-xl);font-weight:600;">Aucune discussion</h3>
                    <p style="color:var(--gris-600);margin-bottom:var(--espace-lg);font-size:var(--taille-texte-sm);">
                        Commencez par créer une nouvelle discussion pour échanger avec vos collègues.
                    </p>
                    <button onclick="afficherModalNouvelleDiscussion()" style="background:var(--bleu-principal);color:white;border:none;padding:var(--espace-md) var(--espace-lg);border-radius:var(--rayon-md);cursor:pointer;font-weight:600;font-size:var(--taille-texte-sm);">
                        <i class="fas fa-plus" style="margin-right:var(--espace-sm);"></i>
                        Créer une discussion
                    </button>
                </div>
            </div>
        `;
    }
}

/**
 * Initialise le sélecteur d'emojis
 */
function initialiserEmojiPicker() {
    // Vérifier si emoji-mart est disponible
    if (typeof window.EmojiMart === 'undefined') {
        console.warn('EmojiMart non disponible');
        return;
    }
    
    // Créer un conteneur pour le picker emoji-mart
    const emojiContainer = document.createElement('div');
    emojiContainer.id = 'emoji-mart-container';
    emojiContainer.style.display = 'none';
    emojiContainer.style.position = 'absolute';
    emojiContainer.style.zIndex = '1000';
    emojiContainer.style.bottom = '100%';
    emojiContainer.style.right = '0';
    emojiContainer.style.marginBottom = '10px';
    document.body.appendChild(emojiContainer);
    
    // Initialiser emoji-mart
    new window.EmojiMart.Picker({
        onEmojiSelect: (emoji) => {
            // Insérer l'emoji dans le textarea du message
            const champMessage = document.getElementById('champMessage');
            if (champMessage) {
                champMessage.value += emoji.native;
                champMessage.focus();
            }
            // Masquer le picker
            emojiContainer.style.display = 'none';
        }
    });
    
    emojiPicker.on('emoji', emoji => {
        const champMessage = document.getElementById('champMessage');
        champMessage.value += emoji.emoji;
        champMessage.focus();
        ajusterHauteurChamp({ target: champMessage });
        masquerEmojiPicker();
    });
    
    // Cacher initialement
    emojiPicker.style.display = 'none';
    const zoneSaisie = document.querySelector('.zone-saisie');
    if (zoneSaisie) {
        zoneSaisie.appendChild(emojiPicker);
    }
}

/**
 * Affiche/masque le sélecteur d'emojis
 */
function afficherEmojiPicker() {
    if (!emojiPicker) return;
    
    if (emojiPicker.style.display === 'block') {
        masquerEmojiPicker();
    } else {
        emojiPicker.style.display = 'block';
        document.addEventListener('click', masquerEmojiPickerExterne);
    }
}

function masquerEmojiPicker() {
    if (emojiPicker) {
        emojiPicker.style.display = 'none';
        document.removeEventListener('click', masquerEmojiPickerExterne);
    }
}

function masquerEmojiPickerExterne(event) {
    if (!emojiPicker.contains(event.target) && 
        !event.target.closest('.bouton-action-saisie[title*="emoji"]') &&
        !event.target.closest('.fa-smile')) {
        masquerEmojiPicker();
    }
}

/**
 * Charge une conversation
 */
function chargerConversation(conversationId) {
    const conversation = conversations[conversationId];
    
    if (!conversation) {
        conversationActive = null;
        sauvegarderConversationActive();
        afficherEtatVide();
        return;
    }
    
    conversationActive = conversationId;
    sauvegarderConversationActive();
    
    // Vérifier si l'utilisateur est bloqué
    if (conversation.bloque) {
        afficherNotificationBlocage(conversation);
        return;
    }
    
    // Mettre à jour l'état actif
    document.querySelectorAll('.element-conversation').forEach(element => {
        element.classList.remove('active');
        if (element.dataset.conversation === conversationId) {
            element.classList.add('active');
            
            // Marquer les messages comme lus
            marquerMessagesCommeLus(conversationId);
        }
    });
    
    // Afficher l'en-tête de discussion et la zone de saisie
    const enTeteDiscussion = document.querySelector('.en-tete-discussion');
    const zoneSaisie = document.querySelector('.zone-saisie');
    
    if (enTeteDiscussion) enTeteDiscussion.style.display = 'flex';
    if (zoneSaisie) zoneSaisie.style.display = 'block';
    
    // Mettre à jour l'en-tête de la discussion
    const titreElement = document.getElementById('titre-discussion');
    const avatarElement = document.querySelector('.avatar-discussion img');
    
    if (titreElement) {
        titreElement.textContent = conversation.titre;
    }
    
    if (avatarElement) {
        avatarElement.src = conversation.avatar;
    }
    
    // Mettre à jour les informations de statut (correction ici)
    const statutContainer = document.querySelector('.statut-discussion');
    if (statutContainer) {
        // Supprimer le contenu existant
        statutContainer.innerHTML = '';
        
        if (conversation.type === 'groupe') {
            const membresEnLigne = conversation.membres.filter(m => m.statut === 'en-ligne').length;
            const totalMembres = conversation.membres.length;
            
            // Créer un conteneur pour les informations de statut
            const statutInfo = document.createElement('div');
            statutInfo.className = 'discussion-statut-info';
            statutInfo.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                margin-top: 4px;
                font-size: 0.875rem;
                color: var(--gris-600);
                line-height: 1.4;
            `;
            
            const enLigneText = document.createElement('span');
            enLigneText.textContent = `${membresEnLigne} en ligne`;
            enLigneText.style.cssText = 'display: block;';
            
            const membresText = document.createElement('span');
            membresText.textContent = `${totalMembres} membres`;
            membresText.style.cssText = 'display: block; color: var(--gris-500); font-size: 0.8125rem;';
            
            statutInfo.appendChild(enLigneText);
            statutInfo.appendChild(membresText);
            statutContainer.appendChild(statutInfo);
        } else {
            const autreMembre = conversation.membres.find(m => m.id !== utilisateurConnecte.id);
            const statuts = {
                'en-ligne': 'En ligne',
                'hors-ligne': 'Hors ligne',
                'occupe': 'Occupé'
            };
            
            const statutText = document.createElement('span');
            statutText.textContent = statuts[autreMembre?.statut] || 'Hors ligne';
            statutText.style.cssText = `
                display: block;
                margin-top: 4px;
                font-size: 0.875rem;
                color: var(--gris-600);
            `;
            statutContainer.appendChild(statutText);
        }
    }
    
    // Afficher les messages
    afficherMessages(conversation.messages);
    
    // Réinitialiser le champ de message et les fichiers en attente
    const champMessage = document.getElementById('champMessage');
    if (champMessage) {
        champMessage.value = '';
        champMessage.style.height = 'auto';
    }
    
    // Vider les prévisualisations
    fichiersEnAttente = [];
    imagesEnAttente = [];
    mettreAJourPrevisualisations();
    
    // Activer/désactiver le bouton d'envoi
    const boutonEnvoi = document.getElementById('boutonEnvoi');
    if (boutonEnvoi) {
        boutonEnvoi.disabled = true;
    }
    
    // Masquer l'indicateur de saisie
    masquerIndicateurSaisie();
    
    if (window.TGNOVA) {
        TGNOVA.afficherToast(`Conversation "${conversation.titre}" chargée`, 'info');
    }
}

/**
 * Marque tous les messages d'une conversation comme lus
 */
function marquerMessagesCommeLus(conversationId) {
    const conversation = conversations[conversationId];
    if (!conversation) return;
    
    conversation.messages.forEach(message => {
        message.lu = true;
    });
    
    // Sauvegarder les modifications
    sauvegarderConversations();
    
    // Supprimer le badge de messages non lus
    const elementConversation = document.querySelector(`.element-conversation[data-conversation="${conversationId}"]`);
    if (elementConversation) {
        const badgeNonLus = elementConversation.querySelector('.badge-messages-non-lus');
        if (badgeNonLus) {
            badgeNonLus.remove();
        }
    }
}

/**
 * Affiche les messages d'une conversation
 */
function afficherMessages(messages) {
    const zoneMessages = document.getElementById('zoneMessages');
    if (!zoneMessages) return;
    
    if (messages.length === 0) {
        // Ne rien afficher pour l'état "Aucun message"
        zoneMessages.innerHTML = '';
        return;
    }
    
    // Grouper les messages par date
    const messagesParDate = {};
    messages.forEach(message => {
        const date = new Date(message.date);
        const dateStr = formaterDateMessage(date);
        
        if (!messagesParDate[dateStr]) {
            messagesParDate[dateStr] = [];
        }
        messagesParDate[dateStr].push(message);
    });
    
    // Construire le HTML
    let html = '';
    
    Object.keys(messagesParDate).forEach(dateStr => {
        html += `
            <div class="groupe-date">
                <span class="libelle-date">${dateStr}</span>
            </div>
        `;
        
        messagesParDate[dateStr].forEach(message => {
            html += creerMessageHTML(message);
        });
    });
    
    zoneMessages.innerHTML = html;
    
    // Ajouter les événements pour les actions de message
    initialiserEvenementsMessages();
    
    // Faire défiler vers le bas
    setTimeout(() => {
        zoneMessages.scrollTop = zoneMessages.scrollHeight;
    }, 100);
}

/**
 * Crée le HTML pour un message avec actions
 */
function creerMessageHTML(message) {
    const date = new Date(message.date);
    const heure = date.getHours().toString().padStart(2, '0') + ':' + 
                 date.getMinutes().toString().padStart(2, '0');
    
    // Formater le contenu pour afficher les emojis
    const contenuFormate = formaterEmojis(message.contenu);
    
    let piecesJointesHTML = '';
    if (message.piecesJointes && message.piecesJointes.length > 0) {
        piecesJointesHTML = '<div class="pieces-jointes">';
        message.piecesJointes.forEach(piece => {
            const icone = getIconeFichier(piece.type);
            piecesJointesHTML += `
                <a href="#" class="piece-jointe" data-file-id="${piece.id}" onclick="ouvrirFichier('${piece.url}', event)">
                    <i class="fas ${icone} icone-piece-jointe"></i>
                    <span>${piece.nom} (${piece.taille})</span>
                </a>
            `;
        });
        piecesJointesHTML += '</div>';
    }
    
    let imageHTML = '';
    if (message.image) {
        imageHTML = `
            <div class="previsualisation-image">
                <img src="${message.image}" alt="Image envoyée" onclick="agrandirImage('${message.image}')" style="cursor: pointer;">
            </div>
        `;
    }
    
    // Boutons d'action pour les messages (suppression)
    const actionsHTML = message.type === 'envoye' ? `
        <div class="message-actions">
            <button class="message-action-btn delete" title="Supprimer le message" onclick="supprimerMessage('${message.id}', event)">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    ` : '';
    
    if (message.type === 'envoye') {
        return `
            <div class="message envoye" data-message-id="${message.id}">
                <div class="contenu-message">
                    ${actionsHTML}
                    <div class="en-tete-message">
                        <span class="expediteur-message">Vous</span>
                        <span class="horodatage-message">${heure}</span>
                    </div>
                    <p class="texte-message">${contenuFormate}</p>
                    ${imageHTML}
                    ${piecesJointesHTML}
                    ${message.lu ? '<span class="lu-indicator"><i class="fas fa-check-double"></i></span>' : ''}
                </div>
            </div>
        `;
    } else {
        return `
            <div class="message recu" data-message-id="${message.id}">
                <div class="avatar-message">
                    <img src="${message.expediteurAvatar || conversations[conversationActive].avatar}" alt="${message.expediteur}">
                </div>
                <div class="contenu-message">
                    <div class="en-tete-message">
                        <span class="expediteur-message">${message.expediteur}</span>
                        <span class="horodatage-message">${heure}</span>
                    </div>
                    <p class="texte-message">${contenuFormate}</p>
                    ${imageHTML}
                    ${piecesJointesHTML}
                </div>
            </div>
        `;
    }
}

/**
 * Formate les emojis dans le texte
 */
function formaterEmojis(texte) {
    return texte.replace(/([\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/gu, 
        match => `<span class="emoji-in-message">${match}</span>`
    );
}

/**
 * Initialise les événements pour les messages
 */
function initialiserEvenementsMessages() {
    // Événements pour les fichiers
    document.querySelectorAll('.piece-jointe').forEach(lien => {
        lien.addEventListener('click', function(e) {
            e.preventDefault();
            const fileId = this.dataset.fileId;
            ouvrirFichier(this.href, e);
        });
    });
    
    // Événements pour les images
    document.querySelectorAll('.previsualisation-image img').forEach(img => {
        img.addEventListener('click', function() {
            agrandirImage(this.src);
        });
    });
}

/**
 * Ouvre un fichier (simulé pour l'exemple)
 */
function ouvrirFichier(url, event) {
    event.preventDefault();
    
    if (window.TGNOVA) {
        TGNOVA.afficherToast('Ouverture du fichier...', 'info');
    }
    
    // En production, cela ouvrirait le fichier dans un nouvel onglet ou téléchargerait le fichier
    // Pour l'exemple, on simule juste une notification
    setTimeout(() => {
        if (window.TGNOVA) {
            TGNOVA.afficherToast('Fichier ouvert avec succès', 'succes');
        }
    }, 500);
}

/**
 * Agrandit une image dans un modal
 */
function agrandirImage(src) {
    const modalHTML = `
        <div class="modal-image-agrandie" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);z-index:4000;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.3s ease;">
            <div style="position:relative;max-width:90%;max-height:90%;">
                <img src="${src}" alt="Image agrandie" style="width:100%;height:auto;border-radius:var(--rayon-md);">
                <button onclick="fermerModalImage()" style="position:absolute;top:-40px;right:0;background:none;border:none;color:white;font-size:1.5rem;cursor:pointer;padding:var(--espace-sm);">
                    <i class="fas fa-times"></i>
                </button>
                <button onclick="telechargerImage('${src}')" style="position:absolute;top:-40px;right:50px;background:var(--bleu-principal);color:white;border:none;border-radius:var(--rayon-md);padding:var(--espace-sm) var(--espace-md);cursor:pointer;font-size:var(--taille-texte-sm);">
                    <i class="fas fa-download"></i> Télécharger
                </button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function fermerModalImage() {
    const modal = document.querySelector('.modal-image-agrandie');
    if (modal) modal.remove();
}

function telechargerImage(src) {
    if (window.TGNOVA) {
        TGNOVA.afficherToast('Téléchargement de l\'image...', 'info');
    }
    // En production, cela déclencherait le téléchargement
}

/**
 * Gère l'indicateur "en train d'écrire"
 */
function gererIndicateurSaisie() {
    const conversation = conversations[conversationActive];
    if (!conversation) return;
    
    // Afficher l'indicateur
    if (conversation.type === 'individuel') {
        const autreMembre = conversation.membres.find(m => m.id !== utilisateurConnecte.id);
        if (autreMembre && !autreMembre.bloque) {
            afficherIndicateurSaisie(autreMembre.nom);
        }
    }
    
    // Réinitialiser le timeout
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        masquerIndicateurSaisie();
    }, 1000);
}

function afficherIndicateurSaisie(nom) {
    const zoneMessages = document.getElementById('zoneMessages');
    let indicateur = zoneMessages.querySelector('.typing-indicator');
    
    if (!indicateur) {
        indicateur = document.createElement('div');
        indicateur.className = 'typing-indicator';
        indicateur.innerHTML = `
            <span style="color:var(--gris-600);font-size:var(--taille-texte-sm);">${nom} écrit...</span>
            <div class="typing-indicator-dots">
                <div class="typing-indicator-dot"></div>
                <div class="typing-indicator-dot"></div>
                <div class="typing-indicator-dot"></div>
            </div>
        `;
        zoneMessages.appendChild(indicateur);
    }
    
    // Faire défiler vers le bas
    setTimeout(() => {
        zoneMessages.scrollTop = zoneMessages.scrollHeight;
    }, 100);
}

function masquerIndicateurSaisie() {
    const zoneMessages = document.getElementById('zoneMessages');
    const indicateur = zoneMessages.querySelector('.typing-indicator');
    if (indicateur) {
        indicateur.remove();
    }
}

/**
 * Sélectionne des fichiers ou images
 */
function selectionnerFichiers(type) {
    const inputId = type === 'image' ? 'imageUploadInput' : 'fileUploadInput';
    const input = document.getElementById(inputId);
    
    if (!input) {
        console.error(`Input ${inputId} non trouvé`);
        return;
    }
    
    input.onchange = (e) => {
        const fichiers = Array.from(e.target.files);
        fichiers.forEach(fichier => {
            if (type === 'image') {
                ajouterImageEnAttente(fichier);
            } else {
                ajouterFichierEnAttente(fichier);
            }
        });
        
        // Réinitialiser l'input
        input.value = '';
    };
    
    input.click();
}

/**
 * Ajoute un fichier à la liste d'attente
 */
function ajouterFichierEnAttente(fichier) {
    fichiersEnAttente.push({
        id: Date.now().toString(),
        fichier: fichier,
        nom: fichier.name,
        taille: formaterTailleFichier(fichier.size),
        type: fichier.name.split('.').pop().toLowerCase()
    });
    
    mettreAJourPrevisualisations();
    activerBoutonEnvoi();
}

/**
 * Ajoute une image à la liste d'attente
 */
function ajouterImageEnAttente(fichier) {
    const reader = new FileReader();
    reader.onload = (e) => {
        imagesEnAttente.push({
            id: Date.now().toString(),
            fichier: fichier,
            nom: fichier.name,
            taille: formaterTailleFichier(fichier.size),
            type: 'image',
            preview: e.target.result
        });
        
        mettreAJourPrevisualisations();
        activerBoutonEnvoi();
    };
    reader.readAsDataURL(fichier);
}

/**
 * Met à jour l'affichage des prévisualisations
 */
function mettreAJourPrevisualisations() {
    const conteneur = document.querySelector('.previsualisation-fichiers');
    
    if (!conteneur) {
        // Créer le conteneur si nécessaire
        const zoneSaisie = document.querySelector('.zone-saisie');
        if (zoneSaisie) {
            const nouveauConteneur = document.createElement('div');
            nouveauConteneur.className = 'previsualisation-fichiers';
            zoneSaisie.parentNode.insertBefore(nouveauConteneur, zoneSaisie);
        }
    }
    
    const toutesPrevisualisations = [...fichiersEnAttente, ...imagesEnAttente];
    
    if (toutesPrevisualisations.length === 0) {
        const conteneurExist = document.querySelector('.previsualisation-fichiers');
        if (conteneurExist) {
            conteneurExist.remove();
        }
        return;
    }
    
    let html = '';
    
    toutesPrevisualisations.forEach(item => {
        const icone = item.type === 'image' ? 'fa-image' : getIconeFichier(item.type);
        html += `
            <div class="previsualisation-fichier" data-id="${item.id}">
                <div class="previsualisation-fichier-info">
                    <i class="fas ${icone} previsualisation-fichier-icone"></i>
                    <span class="previsualisation-fichier-nom">${item.nom} (${item.taille})</span>
                </div>
                <button class="previsualisation-fichier-supprimer" onclick="supprimerPrevisualisation('${item.id}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    });
    
    const conteneurFinal = document.querySelector('.previsualisation-fichiers');
    if (conteneurFinal) {
        conteneurFinal.innerHTML = html;
    }
}

/**
 * Supprime une prévisualisation
 */
function supprimerPrevisualisation(id) {
    fichiersEnAttente = fichiersEnAttente.filter(f => f.id !== id);
    imagesEnAttente = imagesEnAttente.filter(i => i.id !== id);
    mettreAJourPrevisualisations();
    activerBoutonEnvoi();
}

/**
 * Active/désactive le bouton d'envoi
 */
function activerBoutonEnvoi() {
    const boutonEnvoi = document.getElementById('boutonEnvoi');
    const champMessage = document.getElementById('champMessage');
    
    if (boutonEnvoi) {
        const aDuContenu = champMessage.value.trim().length > 0 || 
                          fichiersEnAttente.length > 0 || 
                          imagesEnAttente.length > 0;
        boutonEnvoi.disabled = !aDuContenu;
    }
}

/**
 * Envoie le message et les fichiers
 */
async function envoyerMessageEtFichiers() {
    const conversation = conversations[conversationActive];
    if (!conversation || conversation.bloque) return;
    
    const champMessage = document.getElementById('champMessage');
    const messageTexte = champMessage.value.trim();
    
    // Vérifier qu'il y a quelque chose à envoyer
    if (messageTexte.length === 0 && fichiersEnAttente.length === 0 && imagesEnAttente.length === 0) {
        return;
    }
    
    // Créer le message de base
    const nouveauMessage = {
        id: Date.now().toString(),
        type: 'envoye',
        contenu: messageTexte,
        date: new Date().toISOString(),
        lu: false
    };
    
    // Traiter les fichiers
    const piecesJointes = [];
    const images = [];
    
    for (const fichierAttente of fichiersEnAttente) {
        // Simuler l'upload (en production, vous utiliseriez une API)
        piecesJointes.push({
            id: `file_${Date.now()}`,
            nom: fichierAttente.nom,
            taille: fichierAttente.taille,
            type: fichierAttente.type,
            url: `#fichier-${fichierAttente.id}`
        });
    }
    
    for (const imageAttente of imagesEnAttente) {
        images.push(imageAttente.preview);
    }
    
    if (piecesJointes.length > 0) {
        nouveauMessage.piecesJointes = piecesJointes;
    }
    
    if (images.length > 0) {
        // Pour l'exemple, on prend la première image
        nouveauMessage.image = images[0];
    }
    
    // Ajouter le message à la conversation
    conversation.messages.push(nouveauMessage);
    
    // Sauvegarder les conversations
    sauvegarderConversations();
    
    // Afficher le message immédiatement
    const zoneMessages = document.getElementById('zoneMessages');
    
    // Si c'est le premier message, effacer la zone vide et afficher le message
    if (conversation.messages.length === 1) {
        afficherMessages(conversation.messages);
    } else {
        zoneMessages.insertAdjacentHTML('beforeend', creerMessageHTML(nouveauMessage));
    }
    
    // Réinitialiser l'interface
    champMessage.value = '';
    champMessage.style.height = 'auto';
    fichiersEnAttente = [];
    imagesEnAttente = [];
    mettreAJourPrevisualisations();
    activerBoutonEnvoi();
    masquerIndicateurSaisie();
    
    // Faire défiler vers le bas
    setTimeout(() => {
        zoneMessages.scrollTop = zoneMessages.scrollHeight;
    }, 100);
    
    // Mettre à jour la dernière conversation
    mettreAJourDernierMessage(conversationActive, messageTexte);
    
    // Simuler une réponse (comme si un autre utilisateur répondait)
    setTimeout(() => {
        simulerReponseAutreUtilisateur(conversation, nouveauMessage);
    }, 2000);
}

/**
 * Simule une réponse d'un autre utilisateur
 */
function simulerReponseAutreUtilisateur(conversation, messageRecu) {
    if (conversation.bloque) return;
    
    // Trouver un autre membre (non bloqué) pour répondre
    const autresMembres = conversation.membres.filter(m => 
        m.id !== utilisateurConnecte.id && !m.bloque
    );
    
    if (autresMembres.length === 0) return;
    
    const membreRepondant = autresMembres[Math.floor(Math.random() * autresMembres.length)];
    
    // Générer une réponse contextuelle
    let reponse = genererReponseContextuelle(messageRecu.contenu);
    
    const reponseMessage = {
        id: Date.now().toString(),
        type: 'recu',
        expediteurId: membreRepondant.id,
        expediteur: membreRepondant.nom,
        expediteurAvatar: membreRepondant.avatar,
        contenu: reponse,
        date: new Date().toISOString(),
        lu: false
    };
    
    // Ajouter la réponse à la conversation
    conversation.messages.push(reponseMessage);
    
    // Sauvegarder les conversations
    sauvegarderConversations();
    
    // Afficher la réponse
    const zoneMessages = document.getElementById('zoneMessages');
    zoneMessages.insertAdjacentHTML('beforeend', creerMessageHTML(reponseMessage));
    
    // Faire défiler vers le bas
    setTimeout(() => {
        zoneMessages.scrollTop = zoneMessages.scrollHeight;
    }, 100);
    
    // Ajouter un badge de message non lu
    if (conversationActive !== conversation.id) {
        ajouterBadgeMessageNonLu(conversation.id);
    }
}

/**
 * Génère une réponse contextuelle basée sur le message reçu
 */
function genererReponseContextuelle(message) {
    const messagesCourts = message.toLowerCase();
    
    if (messagesCourts.includes('bonjour') || messagesCourts.includes('salut') || messagesCourts.includes('hello')) {
        const salutations = ['Bonjour ! 👋', 'Salut ! 😊', 'Hello !', 'Bonjour à vous !'];
        return salutations[Math.floor(Math.random() * salutations.length)];
    }
    
    if (messagesCourts.includes('merci')) {
        const merci = ['De rien ! 😊', 'Avec plaisir !', 'Je vous en prie !'];
        return merci[Math.floor(Math.random() * merci.length)];
    }
    
    if (messagesCourts.includes('d\'accord') || messagesCourts.includes('ok')) {
        const accords = ['Parfait ! 👍', 'D\'accord !', 'Entendu !', 'C\'est noté 📝'];
        return accords[Math.floor(Math.random() * accords.length)];
    }
    
    if (messagesCourts.includes('fichier') || messagesCourts.includes('document')) {
        const fichiers = ['J\'ai bien reçu le fichier, merci ! 📎', 'Fichier reçu, je vais le consulter.', 'Merci pour le document !'];
        return fichiers[Math.floor(Math.random() * fichiers.length)];
    }
    
    if (messagesCourts.includes('image') || messagesCourts.includes('photo')) {
        const images = ['Belle image ! 📸', 'J\'aime cette photo !', 'Image reçue, merci !'];
        return images[Math.floor(Math.random() * images.length)];
    }
    
    // Réponses génériques
    const reponsesGeneriques = [
        'Je vois ! 👀',
        'Intéressant ! 🤔',
        'Merci pour l\'info !',
        'Je prends note 📋',
        'Parfait, on continue comme ça ! 💪',
        'Excellent point ! 👍',
        'Je suis d\'accord avec vous ✅',
        'On en parle plus en détail ? 💬'
    ];
    
    return reponsesGeneriques[Math.floor(Math.random() * reponsesGeneriques.length)];
}

/**
 * Affiche les informations d'une discussion
 */
function afficherInformationsDiscussion() {
    const conversation = conversations[conversationActive];
    if (!conversation) return;
    
    const modalHTML = `
        <div class="modal-info-discussion">
            <div class="modal-info-content">
                <div class="modal-info-header">
                    <h3>Informations de la discussion</h3>
                    <button class="modal-info-close" onclick="fermerModalInfo()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-info-body">
                    <div class="info-status-section">
                        <div class="info-avatar-large" onclick="changerAvatarDiscussion('${conversation.id}')">
                            <img src="${conversation.avatar}" alt="${conversation.titre}">
                            <div class="info-avatar-overlay">
                                <i class="fas fa-camera"></i> Changer
                            </div>
                        </div>
                        <div class="info-details-large">
                            <h4>${conversation.titre}</h4>
                            <span class="info-type">${conversation.type === 'groupe' ? 'Groupe' : 'Discussion privée'}</span>
                            <div class="info-status">
                                <span class="point-vert"></span>
                                <span>${conversation.statut === 'en-ligne' ? 'En ligne' : 'Hors ligne'}</span>
                            </div>
                            ${conversation.description ? `<p style="color:var(--gris-600);font-size:var(--taille-texte-sm);margin-top:var(--espace-sm);">${conversation.description}</p>` : ''}
                            <p style="color:var(--gris-500);font-size:var(--taille-texte-xs);margin-top:var(--espace-sm);">
                                Créée le ${new Date(conversation.dateCreation).toLocaleDateString('fr-FR')}
                            </p>
                        </div>
                    </div>
                    
                    <div class="info-members-section">
                        <h5>Membres (${conversation.membres.length})</h5>
                        <div class="info-members-list">
                            ${conversation.membres.map(membre => `
                                <div class="info-member-item ${membre.bloque ? 'membre-bloque' : ''}">
                                    <div class="info-member-left">
                                        <div class="info-member-avatar">
                                            <img src="${membre.avatar}" alt="${membre.nom}">
                                        </div>
                                        <div class="info-member-details">
                                            <h6>${membre.nom} ${membre.id === utilisateurConnecte.id ? '(Vous)' : ''}</h6>
                                            <p>${membre.role} • ${membre.statut === 'en-ligne' ? 'En ligne' : 'Hors ligne'}</p>
                                        </div>
                                    </div>
                                    ${membre.id !== utilisateurConnecte.id ? `
                                        <div class="info-member-actions">
                                            <button class="info-member-action-btn ${membre.bloque ? 'unblock' : 'block'}" 
                                                    onclick="${membre.bloque ? `debloquerMembre('${conversation.id}', '${membre.id}')` : `bloquerMembre('${conversation.id}', '${membre.id}')`}">
                                                ${membre.bloque ? 'Débloquer' : 'Bloquer'}
                                            </button>
                                        </div>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="info-actions-section">
                        <h5>Actions</h5>
                        <div class="info-actions-list">
                            <button class="info-action-btn" onclick="exporterConversation('${conversation.id}')">
                                <i class="fas fa-download"></i>
                                <span>Exporter la conversation</span>
                            </button>
                            <button class="info-action-btn" onclick="viderConversation('${conversation.id}')">
                                <i class="fas fa-trash-alt"></i>
                                <span>Vider la conversation</span>
                            </button>
                            ${conversation.createurId === utilisateurConnecte.id || utilisateurConnecte.role === 'Admin' ? `
                                <button class="info-action-btn delete" onclick="supprimerDiscussionDefinitivement('${conversation.id}')">
                                    <i class="fas fa-trash"></i>
                                    <span>Supprimer définitivement</span>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalsContainer').innerHTML = modalHTML;
}

function fermerModalInfo() {
    document.getElementById('modalsContainer').innerHTML = '';
}

/**
 * Change l'avatar d'une discussion
 */
function changerAvatarDiscussion(conversationId) {
    const input = document.getElementById('avatarUploadInput');
    input.onchange = (e) => {
        const fichier = e.target.files[0];
        if (fichier && fichier.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                // Mettre à jour l'avatar dans les données
                conversations[conversationId].avatar = event.target.result;
                
                // Sauvegarder les modifications
                sauvegarderConversations();
                
                // Mettre à jour l'affichage
                if (conversationId === conversationActive) {
                    document.querySelector('.avatar-discussion img').src = event.target.result;
                }
                
                // Mettre à jour dans la liste des conversations
                const elementConversation = document.querySelector(`.element-conversation[data-conversation="${conversationId}"] .avatar-conversation img`);
                if (elementConversation) {
                    elementConversation.src = event.target.result;
                }
                
                if (window.TGNOVA) {
                    TGNOVA.afficherToast('Avatar mis à jour avec succès', 'succes');
                }
            };
            reader.readAsDataURL(fichier);
        }
        input.value = '';
    };
    input.click();
}

/**
 * Bloque un membre
 */
function bloquerMembre(conversationId, membreId) {
    const conversation = conversations[conversationId];
    if (!conversation) return;
    
    const membre = conversation.membres.find(m => m.id === membreId);
    if (membre) {
        membre.bloque = true;
        
        // Si c'est une discussion individuelle, bloquer toute la conversation
        if (conversation.type === 'individuel') {
            conversation.bloque = true;
            
            // Si cette conversation est active, afficher une notification
            if (conversationId === conversationActive) {
                afficherNotificationBlocage(conversation);
            }
        }
        
        // Sauvegarder les modifications
        sauvegarderConversations();
        
        // Mettre à jour le modal
        afficherInformationsDiscussion();
        
        if (window.TGNOVA) {
            TGNOVA.afficherToast(`${membre.nom} a été bloqué`, 'info');
        }
    }
}

/**
 * Débloque un membre
 */
function debloquerMembre(conversationId, membreId) {
    const conversation = conversations[conversationId];
    if (!conversation) return;
    
    const membre = conversation.membres.find(m => m.id === membreId);
    if (membre) {
        membre.bloque = false;
        
        // Si c'est une discussion individuelle, débloquer la conversation
        if (conversation.type === 'individuel') {
            conversation.bloque = false;
        }
        
        // Sauvegarder les modifications
        sauvegarderConversations();
        
        // Mettre à jour le modal
        afficherInformationsDiscussion();
        
        if (window.TGNOVA) {
            TGNOVA.afficherToast(`${membre.nom} a été débloqué`, 'succes');
        }
    }
}

/**
 * Affiche une notification de blocage
 */
function afficherNotificationBlocage(conversation) {
    const zoneMessages = document.getElementById('zoneMessages');
    if (!zoneMessages) return;
    
    zoneMessages.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:var(--espace-xl);text-align:center;">
            <div class="blocked-notice" style="max-width:400px;">
                <i class="fas fa-ban" style="font-size:2rem;margin-bottom:var(--espace-md);display:block;"></i>
                <h4 style="color:var(--rouge);margin-bottom:var(--espace-sm);">Conversation bloquée</h4>
                <p style="color:var(--gris-600);margin-bottom:var(--espace-lg);">
                    Vous avez bloqué ${conversation.type === 'individuel' ? 'cette personne' : 'des membres de ce groupe'}. 
                    Vous ne pouvez plus envoyer de messages.
                </p>
                ${conversation.type === 'individuel' ? `
                    <button onclick="debloquerMembre('${conversation.id}', '${conversation.membres.find(m => m.id !== utilisateurConnecte.id)?.id}')" 
                            style="background:var(--vert);color:white;border:none;padding:var(--espace-sm) var(--espace-lg);border-radius:var(--rayon-md);cursor:pointer;font-weight:600;">
                        Débloquer la conversation
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

/**
 * Supprime un message
 */
function supprimerMessage(messageId, event) {
    if (event) event.stopPropagation();
    
    afficherModalConfirmation(
        'Supprimer le message',
        'Êtes-vous sûr de vouloir supprimer ce message ? Cette action est irréversible.',
        () => {
            const conversation = conversations[conversationActive];
            if (!conversation) return;
            
            // Supprimer le message des données
            conversation.messages = conversation.messages.filter(m => m.id !== messageId);
            
            // Sauvegarder les modifications
            sauvegarderConversations();
            
            // Supprimer l'élément du DOM
            const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
            if (messageElement) {
                messageElement.style.opacity = '0';
                messageElement.style.transform = 'translateX(-20px)';
                setTimeout(() => {
                    messageElement.remove();
                    // Réafficher les messages pour mettre à jour les dates
                    afficherMessages(conversation.messages);
                }, 300);
            }
            
            if (window.TGNOVA) {
                TGNOVA.afficherToast('Message supprimé', 'succes');
            }
        }
    );
}

/**
 * Vider une conversation
 */
function viderConversation(conversationId) {
    afficherModalConfirmation(
        'Vider la conversation',
        'Êtes-vous sûr de vouloir supprimer tous les messages de cette conversation ? Cette action est irréversible.',
        () => {
            const conversation = conversations[conversationId];
            if (!conversation) return;
            
            conversation.messages = [];
            
            // Sauvegarder les modifications
            sauvegarderConversations();
            
            // Mettre à jour l'affichage
            if (conversationId === conversationActive) {
                afficherMessages([]);
            }
            
            // Mettre à jour le dernier message
            const elementConversation = document.querySelector(`.element-conversation[data-conversation="${conversationId}"]`);
            if (elementConversation) {
                const dernierMessage = elementConversation.querySelector('.dernier-message');
                if (dernierMessage) {
                    dernierMessage.textContent = 'Aucun message';
                }
            }
            
            if (window.TGNOVA) {
                TGNOVA.afficherToast('Conversation vidée', 'succes');
            }
        }
    );
}

/**
 * Supprime définitivement une discussion
 */
function supprimerDiscussionDefinitivement(conversationId) {
    afficherModalConfirmation(
        'Supprimer définitivement',
        'Êtes-vous sûr de vouloir supprimer définitivement cette discussion ? Tous les messages et informations seront définitivement perdus.',
        () => {
            const conversation = conversations[conversationId];
            if (!conversation) return;
            
            // Vérifier si l'utilisateur a le droit de supprimer
            const peutSupprimer = conversation.createurId === utilisateurConnecte.id || 
                                  utilisateurConnecte.role === 'Admin';
            
            if (!peutSupprimer) {
                if (window.TGNOVA) {
                    TGNOVA.afficherToast('Vous n\'avez pas la permission de supprimer cette discussion', 'erreur');
                }
                return;
            }
            
            // Supprimer de la liste des conversations
            delete conversations[conversationId];
            
            // Sauvegarder les modifications
            sauvegarderConversations();
            
            // Supprimer de l'interface
            const elementConversation = document.querySelector(`.element-conversation[data-conversation="${conversationId}"]`);
            if (elementConversation) {
                elementConversation.style.opacity = '0';
                elementConversation.style.transform = 'translateX(-20px)';
                setTimeout(() => {
                    elementConversation.remove();
                    
                    // Si c'était la conversation active, afficher l'état vide
                    if (conversationId === conversationActive) {
                        conversationActive = null;
                        sauvegarderConversationActive();
                        afficherEtatVide();
                    }
                    
                    // Si plus aucune conversation, afficher message dans la liste
                    if (Object.keys(conversations).length === 0) {
                        const listeConversations = document.querySelector('.liste-conversations');
                        listeConversations.innerHTML = `
                            <div class="aucune-conversation">
                                <i class="fas fa-comments"></i>
                                <p>Aucune discussion</p>
                                <small>Créez votre première discussion</small>
                            </div>
                        `;
                    }
                }, 300);
            }
            
            // Fermer le modal d'informations s'il est ouvert
            fermerModalInfo();
            
            if (window.TGNOVA) {
                TGNOVA.afficherToast('Discussion supprimée définitivement', 'succes');
            }
        }
    );
}

/**
 * Affiche un modal de confirmation
 */
function afficherModalConfirmation(titre, message, callback) {
    const modalHTML = `
        <div class="modal-confirmation">
            <div class="modal-confirmation-content">
                <h4>${titre}</h4>
                <p>${message}</p>
                <div class="modal-confirmation-actions">
                    <button class="modal-confirmation-btn cancel" onclick="fermerModalConfirmation()">
                        Annuler
                    </button>
                    <button class="modal-confirmation-btn confirm" onclick="executerConfirmation()">
                        Confirmer
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalsContainer').innerHTML = modalHTML;
    
    // Stocker la callback temporairement
    window.tempConfirmationCallback = callback;
}

function fermerModalConfirmation() {
    document.getElementById('modalsContainer').innerHTML = '';
    window.tempConfirmationCallback = null;
}

function executerConfirmation() {
    if (window.tempConfirmationCallback) {
        window.tempConfirmationCallback();
    }
    fermerModalConfirmation();
}

/**
 * Exporte une conversation
 */
function exporterConversation(conversationId) {
    const conversation = conversations[conversationId];
    if (!conversation) return;
    
    // Formater les données pour l'export
    const donneesExport = {
        titre: conversation.titre,
        type: conversation.type,
        dateCreation: conversation.dateCreation,
        messages: conversation.messages.map(msg => ({
            date: new Date(msg.date).toLocaleString('fr-FR'),
            expediteur: msg.type === 'envoye' ? 'Vous' : msg.expediteur,
            contenu: msg.contenu,
            piecesJointes: msg.piecesJointes ? msg.piecesJointes.length : 0
        }))
    };
    
    // Créer un blob et déclencher le téléchargement
    const blob = new Blob([JSON.stringify(donneesExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${conversation.titre.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    if (window.TGNOVA) {
        TGNOVA.afficherToast('Conversation exportée avec succès', 'succes');
    }
}

/**
 * Affiche le modal pour créer une nouvelle discussion
 */
function afficherModalNouvelleDiscussion() {
    // Liste des utilisateurs disponibles (simulée)
    const utilisateursDisponibles = [
        { id: 'user2', nom: 'Sarah Chen', email: 'sarah@tgnova.com', avatar: 'https://ui-avatars.com/api/?name=Sarah+Chen&background=EF4444&color=fff' },
        { id: 'user3', nom: 'Marc Dubois', email: 'marc@tgnova.com', avatar: 'https://ui-avatars.com/api/?name=Marc+Dubois&background=3B82F6&color=fff' },
        { id: 'user4', nom: 'Emma Wilson', email: 'emma@tgnova.com', avatar: 'https://ui-avatars.com/api/?name=Emma+Wilson&background=8B5CF6&color=fff' },
        { id: 'client1', nom: 'Client XYZ', email: 'contact@clientxyz.com', avatar: 'https://ui-avatars.com/api/?name=Client+XYZ&background=10B981&color=fff' },
        { id: 'client2', nom: 'Client ABC', email: 'contact@clientabc.com', avatar: 'https://ui-avatars.com/api/?name=Client+ABC&background=F59E0B&color=fff' },
        { id: 'support1', nom: 'Support Technique', email: 'support@tgnova.com', avatar: 'https://ui-avatars.com/api/?name=Support&background=EC4899&color=fff' }
    ];
    
    const modalHTML = `
        <div class="modal-nouvelle-discussion" id="modalNouvelleDiscussion">
            <div class="contenu-modal">
                <div class="en-tete-modal" style="padding: var(--espace-xl); border-bottom: 1px solid var(--gris-200);">
                    <h3 style="font-size: var(--taille-texte-xl); font-weight: 700; color: var(--gris-900); margin-bottom: var(--espace-sm);">
                        Nouvelle discussion
                    </h3>
                    <p style="color: var(--gris-600); font-size: var(--taille-texte-sm);">
                        Créez une nouvelle conversation avec une personne ou un groupe.
                    </p>
                </div>
                <div class="corps-modal" style="padding: var(--espace-xl);">
                    <div style="margin-bottom: var(--espace-lg);">
                        <label style="display: block; margin-bottom: var(--espace-sm); font-weight: 600; color: var(--gris-700);">
                            Type de discussion
                        </label>
                        <div style="display: flex; gap: var(--espace-md);">
                            <label style="flex: 1; cursor: pointer; display: flex; align-items: center;">
                                <input type="radio" name="typeDiscussion" value="individuel" checked 
                                       style="margin-right: var(--espace-sm);">
                                Individuel
                            </label>
                            <label style="flex: 1; cursor: pointer; display: flex; align-items: center;">
                                <input type="radio" name="typeDiscussion" value="groupe"
                                       style="margin-right: var(--espace-sm);">
                                Groupe
                            </label>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: var(--espace-lg);">
                        <label style="display: block; margin-bottom: var(--espace-sm); font-weight: 600; color: var(--gris-700);">
                            Nom de la discussion
                        </label>
                        <input type="text" id="nomDiscussion" placeholder="Entrez un nom pour la discussion"
                               style="width: 100%; padding: var(--espace-md); border: 1px solid var(--gris-300); 
                               border-radius: var(--rayon-md); font-size: var(--taille-texte-sm);" required>
                    </div>
                    
                    <div style="margin-bottom: var(--espace-lg);">
                        <label style="display: block; margin-bottom: var(--espace-sm); font-weight: 600; color: var(--gris-700);">
                            Description (optionnel)
                        </label>
                        <textarea id="descriptionDiscussion" placeholder="Description de la discussion"
                                  style="width: 100%; padding: var(--espace-md); border: 1px solid var(--gris-300); 
                                  border-radius: var(--rayon-md); font-size: var(--taille-texte-sm); min-height: 80px; resize: vertical;"></textarea>
                    </div>
                    
                    <div style="margin-bottom: var(--espace-xl);">
                        <label style="display: block; margin-bottom: var(--espace-sm); font-weight: 600; color: var(--gris-700);">
                            Participants
                        </label>
                        <div style="max-height: 200px; overflow-y: auto; border: 1px solid var(--gris-300); border-radius: var(--rayon-md); padding: var(--espace-sm);">
                            ${utilisateursDisponibles.map(user => `
                                <label style="display: flex; align-items: center; gap: var(--espace-sm); padding: var(--espace-sm); cursor: pointer; border-radius: var(--rayon-sm); transition: background 0.2s ease;">
                                    <input type="checkbox" name="participants" value="${user.id}" 
                                           style="margin-right: var(--espace-xs);">
                                    <img src="${user.avatar}" alt="${user.nom}" style="width: 32px; height: 32px; border-radius: 50%;">
                                    <div>
                                        <div style="font-weight: 500; color: var(--gris-800);">${user.nom}</div>
                                        <div style="font-size: var(--taille-texte-xs); color: var(--gris-600);">${user.email}</div>
                                    </div>
                                </label>
                            `).join('')}
                        </div>
                        <p style="color: var(--gris-500); font-size: var(--taille-texte-xs); margin-top: var(--espace-sm);">
                            Sélectionnez au moins un participant
                        </p>
                    </div>
                </div>
                <div class="pied-modal" style="padding: var(--espace-xl); border-top: 1px solid var(--gris-200); 
                     display: flex; justify-content: flex-end; gap: var(--espace-md);">
                    <button id="annulerDiscussion" style="padding: var(--espace-md) var(--espace-lg); 
                            background: var(--gris-200); color: var(--gris-700); border: none; 
                            border-radius: var(--rayon-md); cursor: pointer; font-weight: 600;">
                        Annuler
                    </button>
                    <button id="creerDiscussion" style="padding: var(--espace-md) var(--espace-lg); 
                            background: var(--bleu-principal); color: var(--blanc); border: none; 
                            border-radius: var(--rayon-md); cursor: pointer; font-weight: 600;">
                        Créer la discussion
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalsContainer').innerHTML = modalHTML;
    
    // Gérer les événements du modal
    document.getElementById('annulerDiscussion').addEventListener('click', () => {
        document.getElementById('modalsContainer').innerHTML = '';
    });
    
    document.getElementById('creerDiscussion').addEventListener('click', () => {
        creerDiscussionComplete();
    });
}

/**
 * Crée une discussion complète
 */
function creerDiscussionComplete() {
    const nom = document.getElementById('nomDiscussion').value.trim();
    const type = document.querySelector('input[name="typeDiscussion"]:checked').value;
    const description = document.getElementById('descriptionDiscussion').value.trim();
    const participantsSelectionnes = Array.from(document.querySelectorAll('input[name="participants"]:checked'))
        .map(input => input.value);
    
    // Validation
    if (!nom) {
        if (window.TGNOVA) {
            TGNOVA.afficherToast('Veuillez entrer un nom pour la discussion', 'erreur');
        }
        return;
    }
    
    if (participantsSelectionnes.length === 0) {
        if (window.TGNOVA) {
            TGNOVA.afficherToast('Veuillez sélectionner au moins un participant', 'erreur');
        }
        return;
    }
    
    // Créer un ID unique
    const nouveauId = 'conv_' + Date.now();
    
    // Récupérer les informations des participants
    const participantsComplets = participantsSelectionnes.map(participantId => {
        // Simuler la récupération des données utilisateur
        const utilisateursDisponibles = [
            { id: 'user2', nom: 'Sarah Chen', email: 'sarah@tgnova.com', avatar: 'https://ui-avatars.com/api/?name=Sarah+Chen&background=EF4444&color=fff', statut: 'en-ligne', role: 'Membre' },
            { id: 'user3', nom: 'Marc Dubois', email: 'marc@tgnova.com', avatar: 'https://ui-avatars.com/api/?name=Marc+Dubois&background=3B82F6&color=fff', statut: 'hors-ligne', role: 'Membre' },
            { id: 'user4', nom: 'Emma Wilson', email: 'emma@tgnova.com', avatar: 'https://ui-avatars.com/api/?name=Emma+Wilson&background=8B5CF6&color=fff', statut: 'occupe', role: 'Membre' },
            { id: 'client1', nom: 'Client XYZ', email: 'contact@clientxyz.com', avatar: 'https://ui-avatars.com/api/?name=Client+XYZ&background=10B981&color=fff', statut: 'en-ligne', role: 'Client' },
            { id: 'client2', nom: 'Client ABC', email: 'contact@clientabc.com', avatar: 'https://ui-avatars.com/api/?name=Client+ABC&background=F59E0B&color=fff', statut: 'hors-ligne', role: 'Client' },
            { id: 'support1', nom: 'Support Technique', email: 'support@tgnova.com', avatar: 'https://ui-avatars.com/api/?name=Support&background=EC4899&color=fff', statut: 'en-ligne', role: 'Support' }
        ];
        
        return utilisateursDisponibles.find(u => u.id === participantId) || {
            id: participantId,
            nom: `Utilisateur ${participantId}`,
            email: `${participantId}@example.com`,
            avatar: `https://ui-avatars.com/api/?name=Utilisateur+${participantId}&background=6B7280&color=fff`,
            statut: 'en-ligne',
            role: 'Membre'
        };
    });
    
    // Ajouter l'utilisateur connecté comme membre
    const tousLesMembres = [utilisateurConnecte, ...participantsComplets];
    
    // Générer l'avatar de groupe si c'est un groupe
    let avatar;
    if (type === 'groupe') {
        const nomsParticipants = participantsComplets.map(p => p.nom).join('+');
        avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(nomsParticipants.substring(0, 50))}&background=8B5CF6&color=fff`;
    } else {
        // Pour les discussions individuelles, utiliser l'avatar de l'autre personne
        avatar = participantsComplets[0]?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(nom)}&background=10B981&color=fff`;
    }
    
    // Créer la nouvelle conversation
    conversations[nouveauId] = {
        id: nouveauId,
        titre: nom,
        type: type,
        avatar: avatar,
        statut: 'en-ligne',
        description: description,
        dateCreation: new Date().toISOString(),
        createurId: utilisateurConnecte.id,
        membres: tousLesMembres,
        messages: [],
        bloque: false
    };
    
    // Sauvegarder la nouvelle conversation
    sauvegarderConversations();
    
    // Ajouter à la liste des conversations
    ajouterConversationListe(conversations[nouveauId]);
    
    // Fermer le modal
    document.getElementById('modalsContainer').innerHTML = '';
    
    // Charger la nouvelle conversation
    chargerConversation(nouveauId);
    
    if (window.TGNOVA) {
        TGNOVA.afficherToast(`Discussion "${nom}" créée avec succès`, 'succes');
    }
}

/**
 * Ajoute une conversation à la liste
 */
function ajouterConversationListe(conversation) {
    const liste = document.querySelector('.liste-conversations');
    if (!liste) return;
    
    // Supprimer le message "Aucune discussion" s'il existe
    const aucuneConversation = liste.querySelector('.aucune-conversation');
    if (aucuneConversation) {
        aucuneConversation.remove();
    }
    
    const statutClass = `statut-avatar ${conversation.statut}`;
    const badgeHTML = conversation.type === 'groupe' ? 
        '<span class="badge-conversation">Équipe</span>' : '';
    
    // Formater la date de création
    const dateCreation = new Date(conversation.dateCreation);
    const maintenant = new Date();
    const diffJours = Math.floor((maintenant - dateCreation) / (1000 * 60 * 60 * 24));
    
    let dateAffichage;
    if (diffJours === 0) {
        dateAffichage = 'Aujourd\'hui';
    } else if (diffJours === 1) {
        dateAffichage = 'Hier';
    } else if (diffJours < 7) {
        dateAffichage = 'Cette semaine';
    } else {
        dateAffichage = dateCreation.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
    
    const elementHTML = `
        <div class="element-conversation" data-conversation="${conversation.id}">
            <div class="avatar-conversation">
                <img src="${conversation.avatar}" alt="${conversation.titre}">
                <div class="${statutClass}"></div>
            </div>
            <div class="infos-conversation">
                <h4>${conversation.titre} ${badgeHTML}</h4>
                <p class="dernier-message">
                    Nouvelle discussion créée
                </p>
                <div class="meta-conversation">
                    <span class="horodatage-conversation">${dateAffichage}</span>
                </div>
            </div>
        </div>
    `;
    
    liste.insertAdjacentHTML('afterbegin', elementHTML);
    
    // Ajouter l'événement click
    const nouvelElement = liste.querySelector(`[data-conversation="${conversation.id}"]`);
    if (nouvelElement) {
        nouvelElement.addEventListener('click', function() {
            chargerConversation(conversation.id);
        });
    }
}

// Fonctions utilitaires
function ajusterHauteurChamp(e) {
    const champ = e.target;
    champ.style.height = 'auto';
    champ.style.height = Math.min(champ.scrollHeight, 120) + 'px';
    activerBoutonEnvoi();
}

function getIconeFichier(type) {
    const icones = {
        'pdf': 'fa-file-pdf',
        'doc': 'fa-file-word',
        'docx': 'fa-file-word',
        'xls': 'fa-file-excel',
        'xlsx': 'fa-file-excel',
        'ppt': 'fa-file-powerpoint',
        'pptx': 'fa-file-powerpoint',
        'zip': 'fa-file-archive',
        'rar': 'fa-file-archive',
        'jpg': 'fa-file-image',
        'jpeg': 'fa-file-image',
        'png': 'fa-file-image',
        'gif': 'fa-file-image',
        'mp4': 'fa-file-video',
        'mov': 'fa-file-video',
        'mp3': 'fa-file-audio',
        'wav': 'fa-file-audio'
    };
    
    return icones[type.toLowerCase()] || 'fa-file';
}

function formaterTailleFichier(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function mettreAJourDernierMessage(conversationId, message) {
    const elementConversation = document.querySelector(`.element-conversation[data-conversation="${conversationId}"]`);
    if (elementConversation) {
        const dernierMessage = elementConversation.querySelector('.dernier-message');
        if (dernierMessage) {
            dernierMessage.textContent = message.substring(0, 40) + (message.length > 40 ? '...' : '');
        }
        
        const horodatage = elementConversation.querySelector('.horodatage-conversation');
        if (horodatage) {
            const maintenant = new Date();
            horodatage.textContent = maintenant.getHours().toString().padStart(2, '0') + ':' + 
                                   maintenant.getMinutes().toString().padStart(2, '0');
        }
    }
}

function ajouterBadgeMessageNonLu(conversationId) {
    if (conversationId === conversationActive) return;
    
    const elementConversation = document.querySelector(`.element-conversation[data-conversation="${conversationId}"]`);
    if (elementConversation) {
        let badge = elementConversation.querySelector('.badge-messages-non-lus');
        if (badge) {
            const count = parseInt(badge.textContent) + 1;
            badge.textContent = count;
        } else {
            badge = document.createElement('span');
            badge.className = 'badge-messages-non-lus';
            badge.textContent = '1';
            elementConversation.querySelector('.meta-conversation').appendChild(badge);
        }
    }
}

function formaterDateMessage(date) {
    const aujourdhui = new Date();
    const hier = new Date(aujourdhui);
    hier.setDate(hier.getDate() - 1);
    
    if (date.toDateString() === aujourdhui.toDateString()) {
        return 'Aujourd\'hui';
    } else if (date.toDateString() === hier.toDateString()) {
        return 'Hier';
    } else if (date > new Date(aujourdhui.setDate(aujourdhui.getDate() - 7))) {
        return date.toLocaleDateString('fr-FR', { weekday: 'long' });
    } else {
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long'
        });
    }
}

function rechercherDiscussions(e) {
    const terme = e.target.value.toLowerCase();
    const conversationsElements = document.querySelectorAll('.element-conversation');
    
    conversationsElements.forEach(element => {
        const titre = element.querySelector('h4').textContent.toLowerCase();
        const dernierMessage = element.querySelector('.dernier-message').textContent.toLowerCase();
        
        if (titre.includes(terme) || dernierMessage.includes(terme)) {
            element.style.display = 'flex';
        } else {
            element.style.display = 'none';
        }
    });
}

function gererActionDiscussion(action) {
    const conversation = conversations[conversationActive];
    
    if (action.includes('fa-phone')) {
        if (window.TGNOVA) {
            TGNOVA.afficherToast(`Appel vocal avec ${conversation.titre} initié`, 'info');
        }
    } else if (action.includes('fa-video')) {
        if (window.TGNOVA) {
            TGNOVA.afficherToast(`Appel vidéo avec ${conversation.titre} initié`, 'info');
        }
    }
}