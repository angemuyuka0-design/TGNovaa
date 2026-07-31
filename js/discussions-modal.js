/**
 * MODAL CRÉER UNE NOUVELLE DISCUSSION
 */

function afficherModalNouvelleDiscussion() {
    const modal = document.createElement('div');
    modal.className = 'modal-discussion';
    modal.innerHTML = `
        <div class="contenu-modal">
            <div class="en-tete-modal">
                <h2>Nouvelle discussion</h2>
                <button class="bouton-fermer-modal">&times;</button>
            </div>
            
            <div class="corps-modal">
                <div class="groupe-formulaire">
                    <label>Nom de la discussion (optionnel)</label>
                    <input type="text" id="nomDiscussion" placeholder="Ex: Projet X, Réunion d'équipe...">
                </div>
                
                <div class="groupe-formulaire">
                    <label>Ajouter des membres</label>
                    <div class="conteneur-recherche-membres">
                        <input type="text" id="rechercheMembres" placeholder="Rechercher par nom ou email...">
                        <div class="liste-membres" id="listeMembres"></div>
                    </div>
                </div>
                
                <div class="groupe-formulaire">
                    <label>Membres sélectionnés</label>
                    <div class="membres-selectionnes" id="membresSelectionnes"></div>
                </div>
            </div>
            
            <div class="pied-modal">
                <button class="bouton-annuler">Annuler</button>
                <button class="bouton-creer" id="boutonCreerDiscussion">Créer</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const membresSelectionnes = new Set();
    const champRecherche = document.getElementById('rechercheMembres');
    const listeMembres = document.getElementById('listeMembres');
    const conteneurMembres = document.getElementById('membresSelectionnes');
    const boutonCreer = document.getElementById('boutonCreerDiscussion');
    
    // Fermer la modal
    modal.querySelector('.bouton-fermer-modal').onclick = () => modal.remove();
    modal.querySelector('.bouton-annuler').onclick = () => modal.remove();
    
    // Rechercher les utilisateurs
    champRecherche.addEventListener('input', async () => {
        const terme = champRecherche.value.trim().toLowerCase();
        
        if (!terme) {
            listeMembres.innerHTML = '';
            return;
        }
        
        try {
            const db = firebase.firestore();
            const snapshot = await db.collection('utilisateurs')
                .where('email', '>=', terme)
                .limit(10)
                .get();
            
            listeMembres.innerHTML = snapshot.docs
                .filter(doc => doc.id !== utilisateurConnecte.id)
                .map(doc => {
                    const user = doc.data();
                    const estSelectionne = membresSelectionnes.has(doc.id);
                    return `
                        <div class="element-membre ${estSelectionne ? 'selectionne' : ''}" data-user-id="${doc.id}">
                            <img src="${user.avatar}" alt="${user.nom}" class="avatar-petit">
                            <div class="infos-membre">
                                <p class="nom-membre">${user.nom}</p>
                                <p class="email-membre">${user.email}</p>
                            </div>
                        </div>
                    `;
                })
                .join('');
            
            // Ajouter les écouteurs
            document.querySelectorAll('.element-membre').forEach(elem => {
                elem.addEventListener('click', () => {
                    const userId = elem.dataset.userId;
                    if (membresSelectionnes.has(userId)) {
                        membresSelectionnes.delete(userId);
                    } else {
                        membresSelectionnes.add(userId);
                    }
                    mettreAJourMembresSelectionnes();
                    champRecherche.dispatchEvent(new Event('input'));
                });
            });
            
        } catch (error) {
            console.error('Erreur recherche utilisateurs:', error);
        }
    });
    
    function mettreAJourMembresSelectionnes() {
        conteneurMembres.innerHTML = Array.from(membresSelectionnes)
            .map(userId => {
                const user = conversations[Object.keys(conversations)[0]]?.membresInfo?.find(m => m.id === userId);
                return `
                    <div class="badge-membre" data-user-id="${userId}">
                        <span>${user?.nom || 'Utilisateur'}</span>
                        <button class="bouton-retirer" data-user-id="${userId}">&times;</button>
                    </div>
                `;
            })
            .join('');
        
        document.querySelectorAll('.bouton-retirer').forEach(btn => {
            btn.addEventListener('click', () => {
                membresSelectionnes.delete(btn.dataset.userId);
                mettreAJourMembresSelectionnes();
            });
        });
    }
    
    // Créer la discussion
    boutonCreer.addEventListener('click', async () => {
        if (membresSelectionnes.size === 0) {
            modalUtils.afficherMessage('Attention', 'Sélectionnez au moins un membre', 'erreur');
            return;
        }
        
        const nom = document.getElementById('nomDiscussion').value.trim();
        const membresIds = Array.from(membresSelectionnes);
        
        await creerNouvelleDiscussion(nom, membresIds);
        modal.remove();
    });
    
    // Ajouter les styles de la modal
    if (!document.getElementById('styles-modal-discussion')) {
        const style = document.createElement('style');
        style.id = 'styles-modal-discussion';
        style.textContent = `
            .modal-discussion {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.6);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.3s ease;
            }
            
            @keyframes fadeIn {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }
            
            .contenu-modal {
                background: var(--couleur-fond);
                border-radius: 12px;
                width: 90%;
                max-width: 550px;
                max-height: 85vh;
                display: flex;
                flex-direction: column;
                box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
                animation: slideUp 0.3s ease;
                z-index: 10001;
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
            
            .en-tete-modal {
                padding: var(--espace-lg);
                border-bottom: 1px solid var(--couleur-bordure);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .en-tete-modal h2 {
                margin: 0;
                font-size: 1.4rem;
                font-weight: 600;
                color: var(--couleur-texte);
            }
            
            .bouton-fermer-modal {
                background: none;
                border: none;
                font-size: 1.8rem;
                cursor: pointer;
                color: var(--couleur-texte-secondaire);
                padding: 0;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                border-radius: 4px;
            }
            
            .bouton-fermer-modal:hover {
                background: var(--couleur-fond-alt);
                color: var(--couleur-texte);
            }
            
            .corps-modal {
                flex: 1;
                overflow-y: auto;
                padding: var(--espace-lg);
                background: var(--couleur-fond);
            }
            
            .groupe-formulaire {
                margin-bottom: var(--espace-xl);
            }
            
            .groupe-formulaire:last-of-type {
                margin-bottom: var(--espace-lg);
            }
            
            .groupe-formulaire label {
                display: block;
                margin-bottom: var(--espace-md);
                font-weight: 600;
                font-size: 1rem;
                color: var(--couleur-texte);
            }
            
            #nomDiscussion {
                width: 100%;
                padding: var(--espace-md) var(--espace-lg);
                border: 2px solid var(--couleur-bordure);
                border-radius: 8px;
                font-size: 1rem;
                background: var(--couleur-fond-alt);
                color: var(--couleur-texte);
                transition: all 0.3s ease;
                box-sizing: border-box;
            }
            
            #nomDiscussion:focus {
                outline: none;
                border-color: var(--couleur-primaire);
                box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
            }
            
            .conteneur-recherche-membres {
                position: relative;
            }
            
            #rechercheMembres {
                width: 100%;
                padding: var(--espace-md) var(--espace-lg);
                border: 2px solid var(--couleur-bordure);
                border-radius: 8px;
                font-size: 1rem;
                background: var(--couleur-fond-alt);
                color: var(--couleur-texte);
                transition: all 0.3s ease;
                box-sizing: border-box;
            }
            
            #rechercheMembres:focus {
                outline: none;
                border-color: var(--couleur-primaire);
                box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
            }
            
            .liste-membres {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: var(--couleur-fond-alt);
                border: 1px solid var(--couleur-bordure);
                border-top: none;
                border-radius: 0 0 8px 8px;
                max-height: 280px;
                overflow-y: auto;
                z-index: 10100;
                box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
            }
            
            .element-membre {
                display: flex;
                align-items: center;
                gap: var(--espace-md);
                padding: var(--espace-md) var(--espace-lg);
                cursor: pointer;
                transition: all 0.2s ease;
                border-bottom: 1px solid var(--couleur-bordure);
            }
            
            .element-membre:last-child {
                border-bottom: none;
            }
            
            .element-membre:hover {
                background: rgba(79, 70, 229, 0.08);
            }
            
            .element-membre.selectionne {
                background: rgba(79, 70, 229, 0.15);
                font-weight: 500;
            }
            
            .avatar-petit {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                object-fit: cover;
                flex-shrink: 0;
            }
            
            .infos-membre {
                flex: 1;
                min-width: 0;
            }
            
            .nom-membre {
                margin: 0;
                font-weight: 500;
                font-size: 0.95rem;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .email-membre {
                margin: 4px 0 0 0;
                font-size: 0.85rem;
                color: var(--couleur-texte-secondaire);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .membres-selectionnes {
                display: flex;
                flex-wrap: wrap;
                gap: var(--espace-md);
                min-height: 44px;
                align-content: flex-start;
            }
            
            .badge-membre {
                display: flex;
                align-items: center;
                gap: var(--espace-sm);
                background: var(--couleur-primaire);
                color: white;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 0.9rem;
            }
            
            .bouton-retirer {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                font-size: 1.2rem;
                line-height: 1;
                padding: 0;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .pied-modal {
                padding: var(--espace-lg);
                border-top: 1px solid var(--couleur-bordure);
                display: flex;
                gap: var(--espace-md);
                justify-content: flex-end;
                background: var(--couleur-fond-alt);
                border-radius: 0 0 12px 12px;
            }
            
            .bouton-annuler,
            .bouton-creer {
                padding: 12px 24px;
                border-radius: 8px;
                border: none;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                min-width: 120px;
            }
            
            .bouton-annuler {
                background: var(--couleur-fond);
                color: var(--couleur-texte);
                border: 2px solid var(--couleur-bordure);
            }
            
            .bouton-annuler:hover {
                background: var(--couleur-bordure);
                transform: translateY(-2px);
            }
            
            .bouton-creer {
                background: var(--couleur-primaire);
                color: white;
            }
            
            .bouton-creer:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 24px rgba(79, 70, 229, 0.35);
            }
            
            .bouton-creer:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                transform: none;
            }
        `;
        document.head.appendChild(style);
    }
}
