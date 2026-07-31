/**
 * MODAL AVANCÉE - CRÉER/GÉRER DISCUSSION
 * Design professionnel avec sélection de participants
 */

async function afficherModalNouvelleDiscussion() {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    
    let etape = 'type'; // type, info, participants, confirmation
    let typeDiscussion = 'individuel';
    let nomDiscussion = '';
    let description = '';
    const participantsSelectionnes = new Set();
    let tousLesUtilisateurs = [];

    // Charger tous les utilisateurs depuis Firestore
    async function chargerUtilisateurs() {
        try {
            const db = firebase.firestore();
            const auth = firebase.auth();
            
            // Obtenir l'ID de l'utilisateur actuel
            const currentUserId = auth.currentUser?.uid || utilisateurConnecte?.id;
            
            console.log('🔍 User actuel ID:', currentUserId);
            
            // Charger TOUS les utilisateurs de la collection 'utilisateurs'
            let snapshot = await db.collection('utilisateurs').get();
            
            console.log('📊 Total utilisateurs en collection "utilisateurs":', snapshot.size);
            
            // Si peu d'utilisateurs, créer des utilisateurs de test
            if (snapshot.size <= 1) {
                console.warn('⚠️ Très peu d\'utilisateurs! Création d\'utilisateurs de test dans Firestore...');
                
                // Utilisateurs de test à créer
                const utilisateursTest = [
                    {
                        id: 'test_alice_001',
                        nom: 'Alice Dupont',
                        email: 'alice@example.com',
                        avatar: 'https://ui-avatars.com/api/?name=Alice+Dupont&background=FF6B6B&color=fff'
                    },
                    {
                        id: 'test_bob_002',
                        nom: 'Bob Martin',
                        email: 'bob@example.com',
                        avatar: 'https://ui-avatars.com/api/?name=Bob+Martin&background=4ECDC4&color=fff'
                    },
                    {
                        id: 'test_caroline_003',
                        nom: 'Caroline Durand',
                        email: 'caroline@example.com',
                        avatar: 'https://ui-avatars.com/api/?name=Caroline+Durand&background=45B7D1&color=fff'
                    },
                    {
                        id: 'test_david_004',
                        nom: 'David Lefebvre',
                        email: 'david@example.com',
                        avatar: 'https://ui-avatars.com/api/?name=David+Lefebvre&background=FFA07A&color=fff'
                    }
                ];
                
                // Ajouter les utilisateurs de test à Firestore
                for (const user of utilisateursTest) {
                    await db.collection('utilisateurs').doc(user.id).set(user);
                    console.log('✅ Utilisateur créé:', user.nom);
                }
                
                // Recharger la liste
                snapshot = await db.collection('utilisateurs').get();
                console.log('📊 Total après création:', snapshot.size);
            }
            
            if (snapshot.empty) {
                console.warn('⚠️ Collection "utilisateurs" vide!');
                afficherToast('Aucun utilisateur trouvé', 'warning');
                tousLesUtilisateurs = [];
            } else {
                tousLesUtilisateurs = snapshot.docs
                    .map(doc => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            nom: data.nom || 'Utilisateur',
                            email: data.email || '',
                            avatar: data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.nom || 'User')}&background=4F46E5&color=fff`,
                            ...data
                        };
                    })
                    .filter(user => user.id !== currentUserId && user.id !== 'Utilisateur');
                
                console.log('✅ Utilisateurs chargés (excluant vous-même):', tousLesUtilisateurs.length);
                tousLesUtilisateurs.forEach(u => console.log('   -', u.nom, '(' + u.email + ')'));
            }
        } catch (error) {
            console.error('❌ Erreur chargement utilisateurs:', error);
            afficherToast('Erreur: ' + error.message, 'error');
            tousLesUtilisateurs = [];
        }
    }

    await chargerUtilisateurs();

    function afficherEtapeType() {
        const contenu = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Nouvelle discussion</h2>
                    <button class="btn-fermer">&times;</button>
                </div>

                <div class="modal-body">
                    <p class="modal-description">Sélectionnez le type de discussion</p>

                    <div class="options-type">
                        <label class="option-type">
                            <input type="radio" name="typeDiscussion" value="individuel" checked>
                            <div class="option-contenu">
                                <i class="fas fa-user"></i>
                                <div>
                                    <p class="option-titre">Individuel</p>
                                    <p class="option-sous-titre">Discussion avec une personne</p>
                                </div>
                            </div>
                        </label>

                        <label class="option-type">
                            <input type="radio" name="typeDiscussion" value="groupe">
                            <div class="option-contenu">
                                <i class="fas fa-users"></i>
                                <div>
                                    <p class="option-titre">Groupe</p>
                                    <p class="option-sous-titre">Discussion avec plusieurs personnes</p>
                                </div>
                            </div>
                        </label>
                    </div>
                </div>

                <div class="modal-footer">
                    <button class="btn btn-secondaire" onclick="this.closest('.modal-backdrop').remove()">Annuler</button>
                    <button class="btn btn-primaire" id="btnSuivant">Suivant</button>
                </div>
            </div>
        `;

        modal.innerHTML = contenu;

        // Événements
        modal.querySelectorAll('input[name="typeDiscussion"]').forEach(input => {
            input.addEventListener('change', (e) => {
                typeDiscussion = e.target.value;
            });
        });

        modal.querySelector('#btnSuivant').addEventListener('click', afficherEtapeInfo);
        modal.querySelector('.btn-fermer').addEventListener('click', () => modal.remove());
    }

    function afficherEtapeInfo() {
        const contenu = `
            <div class="modal-content">
                <div class="modal-header">
                    <button class="btn-retour"><i class="fas fa-arrow-left"></i></button>
                    <h2>${typeDiscussion === 'groupe' ? 'Informations du groupe' : 'Nouvelle discussion'}</h2>
                    <button class="btn-fermer">&times;</button>
                </div>

                <div class="modal-body">
                    ${typeDiscussion === 'groupe' ? `
                        <div class="groupe-formulaire">
                            <label>Nom du groupe</label>
                            <input type="text" id="nomDiscussion" placeholder="Ex: Projet Client ABC" value="${nomDiscussion}">
                        </div>

                        <div class="groupe-formulaire">
                            <label>Description (optionnel)</label>
                            <textarea id="descriptionDiscussion" placeholder="Décrivez le sujet ou l'objectif du groupe..." rows="3">${description}</textarea>
                        </div>
                    ` : ''}

                    <div class="groupe-formulaire">
                        <label>${typeDiscussion === 'groupe' ? 'Ajouter des participants' : 'Sélectionner un participant'}</label>
                        
                        ${typeDiscussion === 'individuel' ? `
                            <select id="selectParticipant" class="select-participant">
                                <option value="">Choisir un participant...</option>
                                ${tousLesUtilisateurs.map(user => `
                                    <option value="${user.id}" ${participantsSelectionnes.has(user.id) ? 'selected' : ''}>
                                        ${user.nom} (${user.email})
                                    </option>
                                `).join('')}
                            </select>
                        ` : `
                            <div class="liste-participants-checkboxes">
                                ${tousLesUtilisateurs.map(user => `
                                    <label class="participant-checkbox-item">
                                        <input type="checkbox" class="checkbox-participant" value="${user.id}" ${participantsSelectionnes.has(user.id) ? 'checked' : ''}>
                                        <img src="${user.avatar}" alt="${user.nom}" class="avatar-checkbox">
                                        <div class="info-participant-checkbox">
                                            <p class="nom-participant">${user.nom}</p>
                                            <p class="email-participant">${user.email}</p>
                                        </div>
                                    </label>
                                `).join('')}
                            </div>
                        `}
                    </div>

                    <div class="groupe-formulaire">
                        <label>Participants sélectionnés (${participantsSelectionnes.size})</label>
                        <div class="participants-selectionnes" id="participantsSelectionnes">
                            ${Array.from(participantsSelectionnes).length === 0 ? 
                                `<p class="texte-vide">${typeDiscussion === 'groupe' ? 'Aucun participant sélectionné' : 'Aucun participant sélectionné'}</p>` : ''}
                        </div>
                    </div>
                </div>

                <div class="modal-footer">
                    <button class="btn btn-secondaire" id="btnRetour">Retour</button>
                    <button class="btn btn-primaire" id="btnSuivant" ${participantsSelectionnes.size === 0 ? 'disabled' : ''}>Confirmer</button>
                </div>
            </div>
        `;

        modal.innerHTML = contenu;

        // Remplissage initial
        if (typeDiscussion === 'groupe') {
            document.getElementById('nomDiscussion').value = nomDiscussion;
            document.getElementById('descriptionDiscussion').value = description;
        }

        // Gestion des événements selon le type
        if (typeDiscussion === 'individuel') {
            // Pour les discussions individuelles - gérer le select
            const selectParticipant = document.getElementById('selectParticipant');
            selectParticipant.addEventListener('change', (e) => {
                participantsSelectionnes.clear();
                if (e.target.value) {
                    participantsSelectionnes.add(e.target.value);
                }
                mettreAJourParticipants();
                
                const btnSuivant = document.getElementById('btnSuivant');
                btnSuivant.disabled = participantsSelectionnes.size === 0;
            });
        } else {
            // Pour les groupes - gérer les checkboxes
            const checkboxes = document.querySelectorAll('.checkbox-participant');
            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                    const userId = e.target.value;
                    if (e.target.checked) {
                        participantsSelectionnes.add(userId);
                    } else {
                        participantsSelectionnes.delete(userId);
                    }
                    mettreAJourParticipants();
                    
                    const btnSuivant = document.getElementById('btnSuivant');
                    btnSuivant.disabled = participantsSelectionnes.size === 0;
                });
            });
        }

        function mettreAJourParticipants() {
            const container = document.getElementById('participantsSelectionnes');
            
            if (participantsSelectionnes.size === 0) {
                container.innerHTML = '<p class="texte-vide">Aucun participant sélectionné</p>';
                return;
            }

            container.innerHTML = Array.from(participantsSelectionnes).map(userId => {
                const user = tousLesUtilisateurs.find(u => u.id === userId);
                return `
                    <div class="badge-participant">
                        <img src="${user.avatar}" alt="${user.nom}" class="avatar-badge">
                        <span>${user.nom}</span>
                        <button class="btn-retirer-participant" data-user-id="${userId}">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
            }).join('');

            document.querySelectorAll('.btn-retirer-participant').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    participantsSelectionnes.delete(btn.dataset.userId);
                    mettreAJourParticipants();

                    const btnSuivant = document.getElementById('btnSuivant');
                    btnSuivant.disabled = participantsSelectionnes.size === 0;
                });
            });
        }

        // Sauvegarder les informations
        document.getElementById('btnSuivant').addEventListener('click', () => {
            if (typeDiscussion === 'groupe') {
                nomDiscussion = document.getElementById('nomDiscussion').value.trim();
                description = document.getElementById('descriptionDiscussion').value.trim();

                if (!nomDiscussion) {
                    afficherToast('Veuillez entrer un nom de groupe', 'warning');
                    return;
                }
            }

            creerDiscussionFinal();
        });

        document.getElementById('btnRetour').addEventListener('click', afficherEtapeType);
        document.querySelector('.btn-fermer').addEventListener('click', () => modal.remove());
        document.querySelector('.btn-retour').addEventListener('click', afficherEtapeType);
    }

    async function creerDiscussionFinal() {
        try {
            const membresIds = Array.from(participantsSelectionnes);
            
            await creerNouvelleDiscussion(
                nomDiscussion || null,
                membresIds,
                description || null,
                typeDiscussion
            );

            afficherToast('Discussion créée avec succès!', 'success');
            modal.remove();
        } catch (error) {
            console.error('Erreur création discussion:', error);
            afficherToast('Erreur lors de la création de la discussion', 'error');
        }
    }

    // Injection des styles
    if (!document.getElementById('styles-modal-avancee')) {
        const style = document.createElement('style');
        style.id = 'styles-modal-avancee';
        style.textContent = `
            .modal-backdrop {
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
                animation: fadeIn 0.3s ease;
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            .modal-content {
                background: white;
                border-radius: 12px;
                width: 90%;
                max-width: 600px;
                max-height: 85vh;
                display: flex;
                flex-direction: column;
                box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
                animation: slideUp 0.3s ease;
            }

            @keyframes slideUp {
                from {
                    transform: translateY(20px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }

            .modal-header {
                padding: 20px;
                border-bottom: 1px solid #E5E7EB;
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .modal-header h2 {
                margin: 0;
                font-size: 1.4rem;
                font-weight: 700;
                flex: 1;
                color: #111827;
            }

            .btn-retour,
            .btn-fermer {
                background: none;
                border: none;
                cursor: pointer;
                font-size: 1.2rem;
                color: #6B7280;
                padding: 4px 8px;
                border-radius: 4px;
                transition: all 0.2s ease;
            }

            .btn-retour:hover,
            .btn-fermer:hover {
                background: #F3F4F6;
                color: #111827;
            }

            .modal-body {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
            }

            .modal-description {
                margin: 0 0 16px;
                font-size: 0.95rem;
                color: #6B7280;
            }

            .options-type {
                display: flex;
                flex-direction: column;
                gap: 12px;
                margin-bottom: 20px;
            }

            .option-type {
                display: flex;
                align-items: center;
                cursor: pointer;
            }

            .option-type input[type="radio"] {
                margin: 0;
                cursor: pointer;
                accent-color: #4F46E5;
            }

            .option-contenu {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 16px;
                border: 2px solid #E5E7EB;
                border-radius: 8px;
                flex: 1;
                margin-left: 8px;
                transition: all 0.2s ease;
            }

            .option-type input[type="radio"]:checked ~ .option-contenu {
                border-color: #4F46E5;
                background: rgba(79, 70, 229, 0.05);
            }

            .option-contenu i {
                font-size: 1.5rem;
                color: #4F46E5;
                width: 24px;
                text-align: center;
            }

            .option-titre {
                margin: 0;
                font-weight: 600;
                color: #111827;
            }

            .option-sous-titre {
                margin: 4px 0 0;
                font-size: 0.8rem;
                color: #6B7280;
            }

            .groupe-formulaire {
                margin-bottom: 20px;
            }

            .groupe-formulaire label {
                display: block;
                margin-bottom: 8px;
                font-weight: 600;
                font-size: 0.95rem;
                color: #111827;
            }

            .groupe-formulaire input,
            .groupe-formulaire textarea {
                width: 100%;
                padding: 10px 12px;
                border: 1px solid #D1D5DB;
                border-radius: 8px;
                font-size: 0.95rem;
                font-family: inherit;
                color: #111827;
                background: #F9FAFB;
                transition: all 0.2s ease;
                box-sizing: border-box;
            }

            .groupe-formulaire input:focus,
            .groupe-formulaire textarea:focus {
                outline: none;
                border-color: #4F46E5;
                background: white;
                box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
            }

            .groupe-formulaire textarea {
                resize: vertical;
            }

            .conteneur-recherche-avancee {
                position: relative;
            }

            #rechercheMembres {
                width: 100% !important;
                padding: 10px 12px !important;
                border: 1px solid #D1D5DB !important;
            }

            .liste-utilisateurs {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: white;
                border: 1px solid #D1D5DB;
                border-top: none;
                border-radius: 0 0 8px 8px;
                max-height: 250px;
                overflow-y: auto;
                z-index: 100;
                margin-top: -1px;
                box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
            }

            .utilisateur-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px;
                cursor: pointer;
                transition: background 0.2s ease;
                border-bottom: 1px solid #F3F4F6;
            }

            .utilisateur-item:last-child {
                border-bottom: none;
            }

            .utilisateur-item:hover {
                background: #F9FAFB;
            }

            .utilisateur-item.selectionne {
                background: rgba(79, 70, 229, 0.05);
            }

            .avatar-petit {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                object-fit: cover;
                flex-shrink: 0;
            }

            .info-utilisateur {
                flex: 1;
                min-width: 0;
            }

            .nom-utilisateur {
                margin: 0;
                font-weight: 600;
                color: #111827;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .email-utilisateur {
                margin: 4px 0 0;
                font-size: 0.8rem;
                color: #6B7280;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .checkbox-custom {
                width: 20px;
                height: 20px;
                border: 2px solid #D1D5DB;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                transition: all 0.2s ease;
            }

            .utilisateur-item.selectionne .checkbox-custom {
                background: #4F46E5;
                border-color: #4F46E5;
                color: white;
            }

            .participants-selectionnes {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                padding: 12px;
                background: #F9FAFB;
                border-radius: 8px;
                min-height: 44px;
                align-content: flex-start;
            }

            .texte-vide {
                margin: 0;
                color: #9CA3AF;
                font-style: italic;
                width: 100%;
            }

            .badge-participant {
                display: flex;
                align-items: center;
                gap: 8px;
                background: #4F46E5;
                color: white;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 0.9rem;
                font-weight: 500;
            }

            .avatar-badge {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                object-fit: cover;
            }

            .btn-retirer-participant {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                padding: 0;
                display: flex;
                align-items: center;
                font-size: 0.9rem;
                transition: all 0.2s ease;
            }

            .btn-retirer-participant:hover {
                transform: scale(1.2);
            }

            .modal-footer {
                padding: 20px;
                border-top: 1px solid #E5E7EB;
                display: flex;
                gap: 12px;
                justify-content: flex-end;
                background: #F9FAFB;
                border-radius: 0 0 12px 12px;
            }

            .btn {
                padding: 10px 24px;
                border: none;
                border-radius: 8px;
                font-size: 0.95rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .btn-primaire {
                background: #4F46E5;
                color: white;
            }

            .btn-primaire:hover:not(:disabled) {
                background: #4338CA;
                transform: translateY(-1px);
                box-shadow: 0 8px 16px rgba(79, 70, 229, 0.3);
            }

            .btn-primaire:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .btn-secondaire {
                background: white;
                color: #4F46E5;
                border: 1px solid #D1D5DB;
            }

            .btn-secondaire:hover {
                background: #F9FAFB;
                border-color: #9CA3AF;
            }

            /* Styles pour le select */
            .select-participant {
                width: 100%;
                padding: 12px;
                border: 2px solid #E5E7EB;
                border-radius: 8px;
                font-size: 0.95rem;
                background: white;
                color: #111827;
                cursor: pointer;
                transition: all 0.2s ease;
                font-family: inherit;
            }

            .select-participant:hover {
                border-color: #9CA3AF;
                background: #F9FAFB;
            }

            .select-participant:focus {
                outline: none;
                border-color: #4F46E5;
                box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
            }

            .select-participant option {
                padding: 12px;
                background: white;
                color: #111827;
            }

            /* Styles pour liste de checkboxes */
            .liste-participants-checkboxes {
                border: 1px solid #E5E7EB;
                border-radius: 8px;
                max-height: 350px;
                overflow-y: auto;
                background: white;
            }

            .participant-checkbox-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
                border-bottom: 1px solid #F3F4F6;
            }

            .participant-checkbox-item:last-child {
                border-bottom: none;
            }

            .participant-checkbox-item:hover {
                background: #F9FAFB;
            }

            .participant-checkbox-item input[type="checkbox"] {
                width: 18px;
                height: 18px;
                cursor: pointer;
                accent-color: #4F46E5;
                flex-shrink: 0;
            }

            .avatar-checkbox {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                object-fit: cover;
                flex-shrink: 0;
            }

            .info-participant-checkbox {
                flex: 1;
                min-width: 0;
            }

            .nom-participant {
                margin: 0;
                font-weight: 600;
                color: #111827;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .email-participant {
                margin: 4px 0 0;
                font-size: 0.8rem;
                color: #6B7280;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            @media (max-width: 600px) {
                .modal-content {
                    width: 95%;
                    max-width: 100%;
                    max-height: 90vh;
                }

                .modal-header {
                    padding: 16px;
                }

                .modal-body {
                    padding: 16px;
                }

                .modal-footer {
                    padding: 16px;
                }

                .bulle-message {
                    max-width: 90%;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Afficher la première étape
    document.body.appendChild(modal);
    afficherEtapeType();
}
