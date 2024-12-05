// Funzione per gestire il login tramite popup
function performLogin() {
    fetch('/auth/login')
        .then(response => response.json())
        .then(data => {
            console.log('Risposta dal server:', data); // Log per vedere cosa ricevi dal server
            if (data.auth_url) {
                // Log per vedere l'URL di autenticazione ricevuto
                console.log('URL di autenticazione:', data.auth_url);

                // Apri il popup con l'URL di login
                const popup = window.open(data.auth_url, 'Login', 'width=600,height=400');
                
                const checkPopup = setInterval(() => {
                    if (popup.closed) {
                        console.log('Popup chiuso, procedendo con il recupero del codice');
                        clearInterval(checkPopup);
                    }
                }, 500);
            } else {
                console.error('URL di autenticazione non ricevuto.');
            }
        })
        .catch(error => {
            console.error('Errore nel recupero dell\'URL di autenticazione:', error);
        });
}

// Funzione per recuperare il token di accesso dal backend
function getAccessToken(code) {
    if (!code) return;
    console.log("Codice ricevuto:", code); // Aggiungi questo log per vedere se il codice viene ricevuto correttamente
    console.log('URL di callback:', `/callback?code=${code}`);
    fetch(`/callback?code=${code}`)
        .then(response => response.json())
        .then(data => {
            console.log('Dati ricevuti dalla callback:', data); // Log per vedere la risposta della callback
            if (data.success && data.access_token) {
                console.log('Token ricevuto:', data.access_token); // Aggiungi questo log per vedere se il token viene restituito
                sessionStorage.setItem('access_token', data.access_token);
                console.log('Token salvato nel sessionStorage:', data.access_token); // Aggiungi questo log
                renderAuthenticatedPage(); // Aggiorna la UI per mostrare i pulsanti di gioco
            } else {
                console.error('Errore nella risposta della callback:', data.error || 'Errore sconosciuto.');
            }
        })
        .catch(error => {
            console.error('Errore nella callback:', error);
        });
}

// Funzione per aggiornare la UI dopo l'autenticazione
function renderAuthenticatedPage() {
    // Nasconde i pulsanti di login
    console.log('Aggiornamento UI per autenticato');
    document.getElementById('authButtonsContainer').classList.add('hidden');

    // Mostra i pulsanti del gioco
    const container = document.getElementById('newButtonsContainer');
    container.classList.remove('hidden');
    container.classList.add('show-new-buttons');
}

// Funzione per controllare lo stato di autenticazione
function checkAuthentication() {
    const token = sessionStorage.getItem('access_token');
    console.log('Token salvato:', sessionStorage.getItem('access_token'));
    if (token) {
        renderAuthenticatedPage();
    }
}

// Esegui il controllo dello stato al caricamento
window.onload = () => {
    checkAuthentication();
    const code = new URLSearchParams(window.location.search).get('code');
    console.log('Codice nella URL:', code); // Verifica se il codice è presente nell'URL
    if (code) {
        history.replaceState(null, '', window.location.pathname); // Rimuove il parametro "code" dall'URL
        getAccessToken(code); // Recupera il token senza redirect
    }
};

// Gestione del click sul pulsante di login
document.getElementById('loginButton').addEventListener('click', performLogin);
