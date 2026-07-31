        // Redirection après chargement
        setTimeout(() => {
            // Vérifier si l'utilisateur est connecté
            const session = localStorage.getItem('tgnova_session') || sessionStorage.getItem('tgnova_session');
            
            if (session) {
                try {
                    const sessionData = JSON.parse(session);
                    if (sessionData && sessionData.loggedIn) {
                        // Utilisateur connecté, rediriger vers le dashboard
                        window.location.href = 'login.html';
                        return;
                    }
                } catch (e) {
                    console.error('Erreur de lecture de session:', e);
                }
            }
            
            // Non connecté, rediriger vers l'authentification
            window.location.href = 'register.html';
        }, 6000); // 3 secondes de chargement

        // Animation des statistiques
        document.querySelectorAll('.valeur-statistique-chargement').forEach((element, index) => {
            const values = ['99.9%', '5s', '10k+'];
            const target = values[index];
            let current = 0;
            
            if (index === 0) {
                // Pourcentage
                current = 0;
                const increment = 99.9 / 50;
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= 99.9) {
                        element.textContent = target;
                        clearInterval(timer);
                    } else {
                        element.textContent = current.toFixed(1) + '%';
                    }
                }, 30);
            }else if (index === 1) {
            // Secondes - comptage progressif de 0 à 5
            element.textContent = '0s';
            
            // Créer une séquence de mise à jour
            for (let i = 1; i <= 5; i++) {
                setTimeout(() => {
                    element.textContent = i + 's';
                    // Quand on arrive à la valeur cible, on garde le dernier chiffre
                    if (i === 5) {
                        element.textContent = target;
                    }
                }, 500 + (i * 100)); // 600ms, 700ms, 800ms, 900ms, 1000ms
            }

            } else {
                // Utilisateurs
                current = 0;
                const targetNum = parseInt(target);
                const increment = targetNum / 40;
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= targetNum) {
                        element.textContent = target;
                        clearInterval(timer);
                    } else {
                        element.textContent = Math.floor(current) + '+';
                    }
                }, 30);
            }
        });
