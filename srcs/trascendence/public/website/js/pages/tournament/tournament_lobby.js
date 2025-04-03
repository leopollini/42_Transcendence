import { escapeHTML } from "../../login/user.js";
import { navigate } from "../../main.js";
import { current_user} from "../modes.js";
import { showInfoModal } from "../../modal.js";

let invitedPlayers = [];
let tournament;

export default function LobbyRoom() {
    return `
        <img id="backImageButton" src="../../website/images/home.png" alt="Back" class="back-button">
        <h1 class="text">
            <span class="letter letter-1">T</span>
            <span class="letter letter-2">o</span>
            <span class="letter letter-3">u</span>
            <span class="letter letter-4">r</span>
            <span class="letter letter-5">n</span>
            <span class="letter letter-6">a</span>
            <span class="letter letter-7">m</span>
            <span class="letter letter-8">e</span>
            <span class="letter letter-9">n</span>
            <span class="letter letter-10">t</span>
            <span class="letter letter-11"> </span>
            <span class="letter letter-12"> </span>
            <span class="letter letter-13">l</span>
            <span class="letter letter-14">o</span>
            <span class="letter letter-15">b</span>
            <span class="letter letter-16">b</span>
            <span class="letter letter-17">y</span>
        </h1>
        <div id="lobbyRoom">
            <div class="form" id="playerSearchForm">
                <div>
                    <h2 id="playerText">Search for players</h2> 
                    <input type="text" id="pongPlayerSearch" class="form__field" placeholder="Search a player..." autocomplete="off">
                    <button id="toggleSearchUser" class="button-style">Search</button>
                </div>
                <div>
                    <h2 id="playerSearchResult">Waiting for User...</h2>
                    <button id="toggleInviteUser" class="button-style" disabled>Invite</button>
                    <button id="toggleAddUserRaw" class="button-style">Add(test)</button>
                </div>

            </div>
             
            <div id="playersAdded">
                <h2 id="numPlayers"></h2>
                <div id=lobbyUsersList>
                    
                    <canvas id="lobbyUsersCanvas"></canvas>
                </div>
                <button id="toggleStartTournament" class="button-style" disabled>Start Tournament</button>
            </div>
        </div>`;
}


// export function handleLobby(tournamentType, totPlayers) {
//     ////console.log("total players = " + totPlayers);
//     const canvas = document.getElementById('lobbyUsersCanvas');
//     //const ctx = canvas.getContext('2d');
//     canvas.width = window.innerWidth * 0.5; 
//     canvas.height = window.innerHeight * 0.9; 

//     const numPlayersLabel = document.getElementById("numPlayers");
//     numPlayersLabel.innerHTML = "0/" + Number(totPlayers);
// }

function updateCanvas() {
    const canvas = document.getElementById('lobbyUsersCanvas');
    const ctx = canvas.getContext('2d');
    const toggleStartTournament = document.getElementById('toggleStartTournament');

    // Puliamo il canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    

    // Impostiamo il font e il colore del testo
    ctx.font = "40px Liberty";
    ctx.fillStyle = "white";

    invitedPlayers.forEach((player, index) => {
        ctx.fillText(player, 20, 60 + index * 50);
    });

    // Aggiorniamo anche il contatore dei giocatori
    const numPlayersLabel = document.getElementById("numPlayers");
    numPlayersLabel.innerHTML = `${invitedPlayers.length}/${canvas.dataset.totalPlayers}`;

    //console.log(canvas.dataset.totalPlayers);
    //console.log("length: " +invitedPlayers.length);
    if (invitedPlayers.length === Number(canvas.dataset.totalPlayers)) {
        //console.log("eoeijoeij")
        toggleStartTournament.disabled = false;
    }
}


export function handleLobby(type, totPlayers) {
    const canvas = document.getElementById('lobbyUsersCanvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth * 0.5; 
    canvas.height = window.innerHeight; 
    invitedPlayers = [];
    tournament = type;
    canvas.dataset.totalPlayers = totPlayers;

    ctx.font = "40px Liberty";
    ctx.fillStyle = "white";
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Puliamo il canvas inizialmente

    invitedPlayers.push(current_user.display_name);

    updateCanvas(); // Disegniamo gli utenti invitati
}

function searchUser(username) {
    const playerSearchResult = document.getElementById("playerSearchResult");
    const toggleInviteUser = document.getElementById("toggleInviteUser");
    
    if (!username)
        return;
    fetch("http://localhost:8008", {
            method: "get_user",
            body: JSON.stringify({ 
                "params" : [{}] 
            }) 
        })
        .then(response => response.json())
        .then(data =>
        {
            if (!data || (!data.user && !data.guest)) 
            {
                nullify_user();
                showInfoModal("ERROR: no users found...", () => {});
                navigate("/", "home");
                return;
            }
            let user_name;
            let find_user = data.user?.find(u => u.username === username);
            if (!find_user)
                find_user = data.guest?.find(g => g.username === username);
            if (find_user) 
            {
                user_name = find_user;
                if (user_name) {
                    playerSearchResult.innerHTML = "User Found: " + user_name.username;
                    toggleInviteUser.disabled = false;
                }
            }
            else {
                playerSearchResult.innerHTML = "User Not Found";
                toggleInviteUser.disabled = true;
            }
        })
        .catch(error => {
            console.error("Error fetching user data:", error);
        });
}


export function addLobbyPageHandlers() {
    const backImageButton = document.getElementById('backImageButton');
    const toggleSearchUser = document.getElementById('toggleSearchUser');
    const toggleInviteUser = document.getElementById('toggleInviteUser');
    const pongPlayerSearch = document.getElementById('pongPlayerSearch');
    const toggleAddUserRaw = document.getElementById('toggleAddUserRaw');
    const toggleStartTournament = document.getElementById('toggleStartTournament');
    const canvas = document.getElementById('lobbyUsersCanvas');

    backImageButton?.addEventListener('click', () => {
        navigate("/modes", "Return to Game Mode");   
        invitedPlayers = [];     
    });

    toggleSearchUser?.addEventListener('click', () => {
        //console.log("searching user...." +pongPlayerSearch.value);
        pongPlayerSearch.value = escapeHTML(pongPlayerSearch.value);
        searchUser(pongPlayerSearch.value);
    });

    toggleInviteUser?.addEventListener('click', () => {
        const playerSearchResult = document.getElementById("playerSearchResult").innerText;
        
        if (playerSearchResult.startsWith("User Found: ")) {
            const playerName = playerSearchResult.replace("User Found: ", "");

            if (!invitedPlayers.includes(playerName)) {
                invitedPlayers.push(playerName); // Aggiungiamo il giocatore alla lista
                updateCanvas(); // Ridisegnamo il canvas
            }
        }
    });

    toggleAddUserRaw?.addEventListener('click', () => {
        const playerName = pongPlayerSearch.value;
        if (!invitedPlayers.includes(playerName) && playerName && invitedPlayers.length < canvas.dataset.totalPlayers) {
            //console.log("adding player");
            invitedPlayers.push(playerName);
            updateCanvas(); 
        }
    });

    toggleStartTournament?.addEventListener('click', () => {
        if (tournament === "Bracket")
            navigate("/tournament/knockout/bracket", "Starting knockout tournament", invitedPlayers);
        else
            navigate("/tournament/roundrobin/robinranking", "Starting roundrobin tournament", invitedPlayers);
    });

}