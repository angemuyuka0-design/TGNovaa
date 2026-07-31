const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// Initialiser Firebase Admin
admin.initializeApp();

// Configuration Nodemailer avec Gmail
// ⚠️ IMPORTANT : Utilisez un mot de passe d'application Gmail, pas votre mot de passe Google
// Générez-le ici : https://myaccount.google.com/apppasswords
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'wallyleonel237@gmail.com',
        // REMPLACEZ PAR VOTRE MOT DE PASSE D'APPLICATION GMAIL
        pass: 'votre_mot_de_passe_application_ici'
    }
});

/**
 * Cloud Function déclenchée à la création d'un utilisateur Firebase
 * Envoie un email avec les identifiants de connexion
 */
exports.envoirEmailIdentifiants = functions.auth.user().onCreate(async (user) => {
    const { email, uid } = user;
    
    console.log(`📧 Envoi de l'email de bienvenue pour : ${email}`);
    
    try {
        // Récupérer le nom de l'utilisateur depuis Firestore
        const db = admin.firestore();
        const docUtilisateur = await db.collection('utilisateurs').doc(uid).get();
        const nom = docUtilisateur.exists ? docUtilisateur.data().nom : 'Utilisateur';
        
        // Récupérer le mot de passe depuis Firestore (stocké lors de la création)
        const motDePasse = docUtilisateur.exists ? docUtilisateur.data().motDePasse : 'Non disponible';
        
        // Contenu de l'email
        const sujet = '🎉 Bienvenue sur TGNova - Vos identifiants de connexion';
        const contenuHTML = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
                <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    
                    <h1 style="color: #4F46E5; text-align: center; margin-bottom: 10px;">🎉 Bienvenue sur TGNova</h1>
                    <p style="text-align: center; color: #666; margin-bottom: 30px;">Votre compte a été créé avec succès</p>
                    
                    <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Bonjour <strong>${nom}</strong>,</p>
                    
                    <p style="color: #333; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                        Votre compte TGNova a été créé avec succès. Voici vos identifiants de connexion :
                    </p>
                    
                    <div style="background-color: #f9f9f9; border-left: 4px solid #4F46E5; padding: 15px; margin: 20px 0; border-radius: 4px;">
                        <p style="margin: 0; color: #666; font-size: 13px;">
                            <strong>Email :</strong><br/>
                            <code style="background-color: #e8e8e8; padding: 5px 10px; border-radius: 3px; font-family: monospace;">${email}</code>
                        </p>
                        <p style="margin: 15px 0 0 0; color: #666; font-size: 13px;">
                            <strong>Mot de passe :</strong><br/>
                            <code style="background-color: #e8e8e8; padding: 5px 10px; border-radius: 3px; font-family: monospace;">${motDePasse}</code>
                        </p>
                    </div>
                    
                    <p style="color: #d32f2f; background-color: #fff3cd; padding: 12px; border-radius: 4px; margin: 20px 0; font-size: 13px;">
                        ⚠️ <strong>Important :</strong> Nous vous recommandons de changer votre mot de passe lors de votre première connexion.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://votre-domaine.com/login.html" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Se connecter</a>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    
                    <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                        TGNova - Gestion de Tâches et Projets<br/>
                        Si vous avez des questions, contactez l'administrateur.
                    </p>
                </div>
            </div>
        `;
        
        // Envoyer l'email
        await transporter.sendMail({
            from: 'TGNova <wallyleonel237@gmail.com>',
            to: email,
            subject: sujet,
            html: contenuHTML,
            text: `
Bienvenue sur TGNova

Bonjour ${nom},

Votre compte TGNova a été créé avec succès. Voici vos identifiants de connexion :

Email: ${email}
Mot de passe: ${motDePasse}

Nous vous recommandons de changer votre mot de passe lors de votre première connexion.

Cordialement,
L'équipe TGNova
            `
        });
        
        console.log(`✅ Email envoyé avec succès à ${email}`);
        return { success: true, message: `Email envoyé à ${email}` };
        
    } catch (error) {
        console.error(`❌ Erreur lors de l'envoi de l'email à ${email}:`, error);
        return { success: false, error: error.message };
    }
});

/**
 * Fonction callable pour renvoyer l'email de bienvenue
 * Permet à l'utilisateur de demander un renvoi de ses identifiants
 */
exports.renvoyerEmailIdentifiants = functions.https.onCall(async (data, context) => {
    // Vérifier que l'utilisateur est authentifié
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Utilisateur non authentifié');
    }
    
    const { uid, email } = context.auth;
    
    console.log(`📧 Renvoi de l'email pour : ${email}`);
    
    try {
        const db = admin.firestore();
        const docUtilisateur = await db.collection('utilisateurs').doc(uid).get();
        
        if (!docUtilisateur.exists) {
            throw new Error('Utilisateur non trouvé dans Firestore');
        }
        
        const { nom, motDePasse } = docUtilisateur.data();
        
        const contenuHTML = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2>Vos identifiants TGNova</h2>
                <p>Email: ${email}</p>
                <p>Mot de passe: ${motDePasse}</p>
            </div>
        `;
        
        await transporter.sendMail({
            from: 'TGNova <wallyleonel237@gmail.com>',
            to: email,
            subject: 'TGNova - Vos identifiants de connexion',
            html: contenuHTML
        });
        
        console.log(`✅ Email renvoyé à ${email}`);
        return { success: true, message: 'Email envoyé avec succès' };
        
    } catch (error) {
        console.error(`❌ Erreur lors du renvoi de l'email:`, error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
