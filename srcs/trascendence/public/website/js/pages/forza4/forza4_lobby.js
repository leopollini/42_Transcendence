import { navigate, current_user} from "../../main.js";

let invitedPlayers = [];
let selectedPlayer;
let numPlayersLabel;
let numPlayersAccepted = 0;
let totalPlayers = 2;

export default function Forza4LobbyRoom() {
    return `
        <img id="backImageButton" src="../../website/images/home.png" alt="Back" class="back-button">
        <h1 class="text">
            <span class="letter letter-1">F</span>
            <span class="letter letter-2">o</span>
            <span class="letter letter-3">r</span>
            <span class="letter letter-4">z</span>
            <span class="letter letter-5">a</span>
            <span class="letter letter-6"> </span>
            <span class="letter letter-7"> </span>
            <span class="letter letter-8">4</span>
            <span class="letter letter-9"> </span>
            <span class="letter letter-10"> </span>
            <span class="letter letter-11">g</span>
            <span class="letter letter-12">a</span>
            <span class="letter letter-13">m</span>
            <span class="letter letter-14">e</span>
        </h1>
        <div class="lobbyContainer">
            <div class="lobbyLabel">Online</div>
            <div class="lobbyBox" id="f4OnlinePlayers">
                <!-- Lista dei giocatori online -->
            </div>
            <button id="f4InviteButton" class="button-style" disabled>Invite →</button>
            <div id="f4NumPlayersLabel"></div>
            <div class="lobbyBox" id="f4MatchPlayers">
                <!-- Lista dei giocatori nel torneo -->
            </div>
        </div>
        <button id="f4ToggleStartMatch" class="button-style" disabled>Start Match</button>`;
}


export function handleForza4Lobby() {
    invitedPlayers = [];
    const onlinePlayers = document.getElementById("f4OnlinePlayers");
    const matchPlayers = document.getElementById("f4MatchPlayers");
    const inviteButton = document.getElementById("f4InviteButton");
    numPlayersLabel = document.getElementById("f4NumPlayersLabel");
    
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

export function addForza4LobbyPageHandlers() {
    const toggleStartMatch = document.getElementById("f4ToggleStartMatch");
    const matchPlayers = document.getElementById("f4MatchPlayers");
    const inviteButton = document.getElementById("f4InviteButton");
    f4InviteButton.onclick = () => {
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
        console.log("avversario = ", invitedPlayers[1]);
        sessionStorage.setItem("opponent", invitedPlayers[1]);
        navigate( "/forza4/game", "Forza 4 Game", invitedPlayers);
    });

    backImageButton?.addEventListener('click', () => {
        navigate("/modes", "Return to Game Mode");   
        invitedPlayers = [];     
    });
}
