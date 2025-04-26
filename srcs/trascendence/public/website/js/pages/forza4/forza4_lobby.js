import { navigate, current_user, save_global} from "../../main.js";
import { initSocket, sendMessage } from "../live-chat/socketHandler.js";
import { showInfoModal } from "../../modal.js";
import { fetchOnlineUsers } from "../get_online_users.js";

let invitedPlayers = [];
let selectedPlayer;
let numPlayersLabel;
let numPlayersAccepted = 0;
let totalPlayers = 2;
let socket;

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


export async function handleForza4Lobby() {

    if (!socket && current_user) {
        // Initialize socket
        socket = initSocket(current_user.display_name, /* chatAppInstance se necessario */);
        
        // Handle incoming invite responses
        socket.onmessage = (event) => {
            let msg = JSON.parse(event.data);
            
            if (msg.type === "match_response") {
                const accepted = msg.data.accepted === true || msg.data.accepted === "true";

                console.log("📩 Risposta ricevuta:", msg);
                const matchPlayers = document.getElementById("f4MatchPlayers");
                const numPlayersLabel = document.getElementById("f4NumPlayersLabel");
                const toggleStartMatch = document.getElementById("f4ToggleStartMatch");
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

export function addForza4LobbyPageHandlers() {
    const toggleStartMatch = document.getElementById("f4ToggleStartMatch");
    const matchPlayers = document.getElementById("f4MatchPlayers");
    const inviteButton = document.getElementById("f4InviteButton");
    f4InviteButton.onclick = () => {
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
            // save_global("opponent", playerName);
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
        navigate( "/forza4/game", "Forza 4 Game", invitedPlayers);
    });

    backImageButton?.addEventListener('click', () => {
        navigate("/modes", "Return to Game Mode");   
        invitedPlayers = [];     
    });
}






