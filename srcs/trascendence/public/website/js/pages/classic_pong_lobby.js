import { navigate } from "../main.js";
import { current_user } from "../main.js";

let invitedPlayers = [];
let selectedPlayer;
let numPlayersLabel;
let numPlayersAccepted = 0;
let totalPlayers = 2;

export default function ClassicPongLobbyRoom() {
    return `
        <img id="backImageButton" src="../../website/images/home.png" alt="Back" class="back-button">
        <h1 class="text">
            <span class="letter letter-1">P</span>
            <span class="letter letter-2">o</span>
            <span class="letter letter-3">n</span>
            <span class="letter letter-4">g</span>
            <span class="letter letter-5"> </span>
            <span class="letter letter-6"> </span>
            <span class="letter letter-7">G</span>
            <span class="letter letter-8">a</span>
            <span class="letter letter-9">m</span>
            <span class="letter letter-10">e</span>
        </h1>
        <div class="lobbyContainer">
            <div class="lobbyLabel">Online</div>
            <div class="lobbyBox" id="onlinePlayers">
                <!-- Lista dei giocatori online -->
            </div>
            <button id="pongInviteButton" class="button-style" disabled>Invite →</button>
            <div id="pongNumPlayersLabel"></div>
            <div class="lobbyBox" id="pongMatchPlayers">
                <!-- Lista dei giocatori nel torneo -->
            </div>
        </div>
        <button id="pongToggleStartMatch" class="button-style" disabled>Start Match</button>`;
}


export function handleClassicPongLobby() {
    const onlinePlayers = document.getElementById("onlinePlayers");
    const matchPlayers = document.getElementById("pongMatchPlayers");
    const inviteButton = document.getElementById("pongInviteButton");
    numPlayersLabel = document.getElementById("pongNumPlayersLabel");
    
    numPlayersAccepted = 0;
    selectedPlayer = null;
    numPlayersLabel.textContent = "0/" + totalPlayers;
    
    if (current_user) {
        const creatorDiv = document.createElement("div");
        creatorDiv.classList.add("player");
        creatorDiv.textContent = current_user.display_name;
        matchPlayers.appendChild(creatorDiv);
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

export function addClassicPongLobbyPageHandlers() {
    const toggleStartMatch = document.getElementById("pongToggleStartMatch");
    const matchPlayers = document.getElementById("pongMatchPlayers");
    const inviteButton = document.getElementById("pongInviteButton");
    inviteButton.onclick = () => {
        if (selectedPlayer && numPlayersAccepted < totalPlayers) {
            const newPlayer = selectedPlayer.cloneNode(true);
            newPlayer.style.background = "";
            newPlayer.style.color = "white";
            newPlayer.onclick = null;
            matchPlayers.appendChild(newPlayer);
            numPlayersAccepted++;
            numPlayersLabel.textContent = numPlayersAccepted + "/" +  totalPlayers;
            invitedPlayers.push(selectedPlayer.textContent);
            selectedPlayer.remove();
            selectedPlayer = null;
            inviteButton.disabled = true;
            if (numPlayersAccepted === totalPlayers)
                toggleStartMatch.disabled = false;
        }
    };

    toggleStartMatch?.addEventListener('click', () => {
        console.log("invitedPlayers: ", invitedPlayers);
        sessionStorage.setItem("opponent", invitedPlayers[1]);
        navigate( "/classic", "Pong Classic Game", invitedPlayers);
    });

    backImageButton?.addEventListener('click', () => {
        navigate("/modes", "Return to Game Mode");   
        invitedPlayers = [];     
    });
}

