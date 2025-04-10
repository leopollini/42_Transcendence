import { navigate, current_user } from "../../main.js";
let invitedPlayers = [];
let tournament;
let selectedPlayer;
let numPlayersLabel;
let numPlayersAccepted = 0;
let totalPlayers;

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
        <div class="lobbyContainer">
            <div class="lobbyLabel">Online</div>
            <div class="lobbyBox" id="onlinePlayers">
                <!-- Lista dei giocatori online -->
            </div>
            <button id="inviteButton" class="button-style" disabled>Invite →</button>
            <div id="numPlayersLabel"></div>
            <div class="lobbyBox" id="tournamentPlayers">
                <!-- Lista dei giocatori nel torneo -->
            </div>
        </div>
        <button id="toggleStartTournament" class="button-style" disabled>Start Tournament</button>`;
}


export function handleLobby(type, totPlayers) {
    const onlinePlayers = document.getElementById("onlinePlayers");
    const tournamentPlayers = document.getElementById("tournamentPlayers");
    const inviteButton = document.getElementById("inviteButton");
    numPlayersLabel = document.getElementById("numPlayersLabel");
    
    invitedPlayers = [];
    numPlayersAccepted = 0;
    selectedPlayer = null;
    totalPlayers = Number(totPlayers);
    tournament = type;
    numPlayersLabel.textContent = "0/" + totalPlayers;

    if (current_user) {
        const creatorDiv = document.createElement("div");
        creatorDiv.classList.add("player");
        creatorDiv.textContent = current_user.display_name;
        tournamentPlayers.appendChild(creatorDiv);
        invitedPlayers.push(current_user.display_name);
        numPlayersAccepted++;
        numPlayersLabel.textContent = numPlayersAccepted + "/" +  totalPlayers;
    }
    const players = ["Alice", "Bob", "Charlie", "David"];
    players.forEach(player => {
        const div = document.createElement("div");
        div.classList.add("player");
        div.textContent = player;
        div.onclick = () => {
            document.querySelectorAll(".player").forEach(el => el.style.background = "");
            div.style.background = "#007bff";
            div.style.color = "white";
            selectedPlayer = div;
            inviteButton.disabled = false;
        };
        onlinePlayers.appendChild(div);
    });

    
}

export function addLobbyPageHandlers() {
    const toggleStartTournament = document.getElementById("toggleStartTournament");
    inviteButton.onclick = () => {
        if (selectedPlayer && numPlayersAccepted < totalPlayers) {
            const newPlayer = selectedPlayer.cloneNode(true);
            newPlayer.style.background = "";
            newPlayer.style.color = "white";
            newPlayer.onclick = null;
            tournamentPlayers.appendChild(newPlayer);
            numPlayersAccepted++;
            numPlayersLabel.textContent = numPlayersAccepted + "/" +  totalPlayers;
            invitedPlayers.push(selectedPlayer.textContent);
            selectedPlayer.remove();
            selectedPlayer = null;
            inviteButton.disabled = true;
            if (numPlayersAccepted === totalPlayers)
                toggleStartTournament.disabled = false;
        }
    };

    toggleStartTournament?.addEventListener('click', () => {
        console.log("tournament =>" + tournament);
        if (tournament === "Bracket")
            navigate("/tournament/knockout/bracket", "Starting knockout tournament", invitedPlayers);
        else
            navigate("/tournament/roundrobin/robinranking", "Starting roundrobin tournament", invitedPlayers);
    });

    backImageButton?.addEventListener('click', () => {
        navigate("/modes", "Return to Game Mode");   
        //invitedPlayers = [];     
    });
}




















// // export function handleLobby(tournamentType, totPlayers) {
// //     ////console.log("total players = " + totPlayers);
   

// //     const numPlayersLabel = document.getElementById("numPlayers");
// //     numPlayersLabel.innerHTML = "0/" + Number(totPlayers);
// // }

// function updateCanvas() {
//     const onlineUserscanvas = document.getElementById('lobbyUsersCanvas');
//     const ctx = canvas.getContext('2d');
//     const toggleStartTournament = document.getElementById('toggleStartTournament');

//     // Puliamo il canvas
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
    

//     // Impostiamo il font e il colore del testo
//     ctx.font = "40px Liberty";
//     ctx.fillStyle = "white";

//     invitedPlayers.forEach((player, index) => {
//         ctx.fillText(player, 20, 60 + index * 50);
//     });

//     // Aggiorniamo anche il contatore dei giocatori
//     const numPlayersLabel = document.getElementById("numPlayers");
//     numPlayersLabel.innerHTML = `${invitedPlayers.length}/${canvas.dataset.totalPlayers}`;

//     //console.log(canvas.dataset.totalPlayers);
//     //console.log("length: " +invitedPlayers.length);
//     if (invitedPlayers.length === Number(canvas.dataset.totalPlayers)) {
//         //console.log("eoeijoeij")
//         toggleStartTournament.disabled = false;
//     }
// }


// export function handleLobby(type, totPlayers) {
//     /*const canvas = document.getElementById('lobbyUsersCanvas');
//     const ctx = canvas.getContext('2d');
    
//     canvas.width = window.innerWidth * 0.5; 
//     canvas.height = window.innerHeight; 
//     invitedPlayers = [];
//     tournament = type;
//     canvas.dataset.totalPlayers = totPlayers;

//     ctx.font = "40px Liberty";
//     ctx.fillStyle = "white";
//     ctx.clearRect(0, 0, canvas.width, canvas.height); // Puliamo il canvas inizialmente

//     invitedPlayers.push(current_user.display_name);*/

//     updateCanvas(); // Disegniamo gli utenti invitati
// }

// function searchUser(username) {
//     /*const playerSearchResult = document.getElementById("playerSearchResult");
//     const toggleInviteUser = document.getElementById("toggleInviteUser");
    
//     if (!username)
//         return;
//     fetch("http://localhost:8008", {
//             method: "get_user",
//             body: JSON.stringify({ 
//                 "params" : [{}] 
//             }) 
//         })
//         .then(response => response.json())
//         .then(data =>
//         {
//             if (!data || (!data.user && !data.guest)) 
//             {
//                 nullify_user();
//                 alert("ERROR: no users found...");
//                 navigate("/", "home");
//                 return;
//             }
//             let user_name;
//             let find_user = data.user?.find(u => u.username === username);
//             if (!find_user)
//                 find_user = data.guest?.find(g => g.username === username);
//             if (find_user) 
//             {

//                 user_name = find_user;
//                 if (user_name) {
//                     playerSearchResult.style.color = "green";
//                     playerSearchResult.innerHTML = "User Found: " + user_name.username;
//                     toggleInviteUser.disabled = false;
//                 }
//             }
//             else {
//                 playerSearchResult.style.color = "red";
//                 playerSearchResult.innerHTML = "User Not Found";
//                 toggleInviteUser.disabled = true;
//             }
//         })
//         .catch(error => {
//             console.error("Error fetching user data:", error);
//         });*/
// }


// export function addLobbyPageHandlers() {
//     /*const backImageButton = document.getElementById('backImageButton');
//     const toggleSearchUser = document.getElementById('toggleSearchUser');
//     const toggleInviteUser = document.getElementById('toggleInviteUser');
//     const pongPlayerSearch = document.getElementById('pongPlayerSearch');
//     //const toggleAddUserRaw = document.getElementById('toggleAddUserRaw');
//     const toggleStartTournament = document.getElementById('toggleStartTournament');
//     const canvas = document.getElementById('lobbyUsersCanvas');

//     backImageButton?.addEventListener('click', () => {
//         navigate("/modes", "Return to Game Mode");   
//         invitedPlayers = [];     
//     });

//     toggleSearchUser?.addEventListener('click', () => {
//         //console.log("searching user...." +pongPlayerSearch.value);

//         searchUser(pongPlayerSearch.value);
//     });

//     toggleInviteUser?.addEventListener('click', () => {
//         const playerSearchResult = document.getElementById("playerSearchResult").textContent;
        
//         if (playerSearchResult.startsWith("User Found: ")) {
//             const playerName = playerSearchResult.replace("User Found: ", "");

//             if (!invitedPlayers.includes(playerName)) {
//                 invitedPlayers.push(playerName); // Aggiungiamo il giocatore alla lista
//                 updateCanvas(); // Ridisegnamo il canvas
//             }
//         }
//     });

//     /*toggleAddUserRaw?.addEventListener('click', () => {
//         const playerName = pongPlayerSearch.value;
//         if (!invitedPlayers.includes(playerName) && playerName && invitedPlayers.length < canvas.dataset.totalPlayers) {
//             //console.log("adding player");
//             invitedPlayers.push(playerName);
//             updateCanvas(); 
//         }
//     });*/

//     toggleStartTournament?.addEventListener('click', () => {
//         if (tournament === "Bracket")
//             navigate("/tournament/knockout/bracket", "Starting knockout tournament", invitedPlayers);
//         else
//             navigate("/tournament/roundrobin/robinranking", "Starting roundrobin tournament", invitedPlayers);
//     });

// }