import { navigate, save_global} from "../main.js";
import { current_user } from "../main.js";
import { initSocket, sendMessage } from "./live-chat/socketHandler.js";
import { showInfoModal } from "../modal.js";
import { fetchOnlineUsers } from "./get_online_users.js";

let invitedPlayers = [];
let selectedPlayer;
let numPlayersLabel;
let numPlayersAccepted = 0;
let totalPlayers = 2;
let socket;

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



export async function handleClassicPongLobby() {
    if (!socket && current_user) {
        // Initialize socket
        socket = initSocket(current_user.display_name, /* chatAppInstance se necessario */);
        
        // Handle incoming invite responses
        socket.onmessage = (event) => {
            let msg = JSON.parse(event.data);
            
            if (msg.type === "match_response") {
                const accepted = msg.data.accepted === true || msg.data.accepted === "true";
                console.log("📩 Risposta ricevuta:", msg);
                const matchPlayers = document.getElementById("pongMatchPlayers");
                const numPlayersLabel = document.getElementById("pongNumPlayersLabel");
                const toggleStartMatch = document.getElementById("pongToggleStartMatch");
                console.log("message accepted =>", msg.data.accepted);
                if (accepted) {
                    console.log("📩 L'utente ha accettato l'invito");
                    console.log("utente", msg.data.from);
                    showInfoModal(`${msg.data.from} ha accettato l'invito al torneo!`, () => {
                        // Add player to match
                        const newPlayer = document.createElement("div");
                        newPlayer.classList.add("player");
                        newPlayer.textContent = msg.data.from;
                        matchPlayers.appendChild(newPlayer);
                        save_global("opponent", msg.data.from);
                        numPlayersAccepted++;
                        numPlayersLabel.textContent = numPlayersAccepted + "/" + totalPlayers;
                        invitedPlayers.push(msg.data.from);
                        
                        // Remove player from online list
                        const onlinePlayers = document.querySelectorAll("#onlinePlayers .player");
                        onlinePlayers.forEach(player => {
                            if (player.textContent === msg.data.from) {
                                player.remove();
                            }
                        });
                        // If number of players reached total, enable start match button
                        if (numPlayersAccepted === totalPlayers) {
                            toggleStartMatch.disabled = false;
                        }
                    });
                } else {
                    console.log("📩 L'utente ha rifiutato l'invito");
                    //showInfoModal(`${msg.data ? msg.data.from : msg.from} ha rifiutato l'invito al torneo.`, () => {});
                }
            }
            
        };
    }

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
    
    let players = await fetchOnlineUsers(current_user.display_name);

    // const players = ["Alice", "Bob", "Charlie", "David", "Marco", "Mario", 
    // "Samuele", "Samir", "Leonardo", "Rostik", "Pasquale_R.", "Salvatore_A.",
    // "Alberto_A.", "Steve", "Ronald", "Ciccio", "Briciola", "Rocco"];

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
    const inviteButton = document.getElementById("pongInviteButton");
    const backImageButton = document.getElementById("backImageButton");

    inviteButton.onclick = () => {
        if (selectedPlayer && numPlayersAccepted < totalPlayers) {
            // Send Request to selected player
            sendMessage({
                type: "match_request",
                to: selectedPlayer.textContent
            });
            inviteButton.disabled = true;
            // const newPlayer = selectedPlayer.cloneNode(true);
            // newPlayer.style.background = "";
            // newPlayer.style.color = "white";
            // newPlayer.onclick = null;
            // const playerName = newPlayer.textContent.trim();
            // save_global("opponent",playerName);
            // matchPlayers.appendChild(newPlayer);
            // numPlayersAccepted++;
            // numPlayersLabel.textContent = numPlayersAccepted + "/" +  totalPlayers;
            // invitedPlayers.push(selectedPlayer.textContent);
            // selectedPlayer.remove();
            // selectedPlayer = null;
            // inviteButton.disabled = true;
            // if (numPlayersAccepted === totalPlayers)
            //     toggleStartMatch.disabled = false;
        }
    };

    toggleStartMatch?.addEventListener('click', () => {
        save_global("game", 1);
        console.log("invited players =>", invitedPlayers);
        navigate( "/classic", "Pong Classic Game", invitedPlayers);
    });

    backImageButton?.addEventListener('click', () => {
        navigate("/modes", "Return to Game Mode");   
        invitedPlayers = [];     
    });
}

