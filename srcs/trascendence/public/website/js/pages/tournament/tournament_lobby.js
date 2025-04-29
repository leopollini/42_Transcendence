import { navigate, current_user, save_global, numPlayers } from "../../main.js";
import { initSocket, sendMessage } from "../live-chat/socketHandler.js";
import { showInfoModal } from "../../modal.js";
import { fetchOnlineUsers } from "../get_online_users.js";

let invitedPlayers = [];
let tournament = null;
let selectedPlayer = null;
let numPlayersLabel = null;
let numPlayersAccepted = 0;
let totalPlayers = null;
let socket = null;

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

export async function handleLobby(type) {
    if (!socket && current_user) {
        // Initialize socket
        socket = initSocket(current_user.display_name, /* chatAppInstance se necessario */);
        
        // Handle incoming invite responses
        socket.onmessage = (event) => {
            let msg = JSON.parse(event.data);

            if (msg.type === "match_response") {
                const accepted = msg.data.accepted === true || msg.data.accepted === "true";
                console.log("📩 Risposta ricevuta:", msg);
                const tournamentPlayers = document.getElementById("tournamentPlayers");
                const numPlayersLabel = document.getElementById("numPlayersLabel");
                const toggleStartTournament = document.getElementById("toggleStartTournament");
                console.log("message accepted =>", msg.data.accepted);
                if (accepted) {
                    console.log("📩 L'utente ha accettato l'invito");
                    console.log("utente", msg.data.from);
                    showInfoModal(`${msg.data.from} ha accettato l'invito al torneo!`, () => {
                        // Add player to tournament
                        const newPlayer = document.createElement("div");
                        newPlayer.classList.add("player");
                        newPlayer.textContent = msg.data.from;
                        tournamentPlayers.appendChild(newPlayer);
                        
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
                            toggleStartTournament.disabled = false;
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
    const tournamentPlayers = document.getElementById("tournamentPlayers");
    const inviteButton = document.getElementById("inviteButton");
    numPlayersLabel = document.getElementById("numPlayersLabel");
    
    // Reset state
    onlinePlayers.innerHTML = "";
    tournamentPlayers.innerHTML = "";
    invitedPlayers = [];
    numPlayersAccepted = 0;
    selectedPlayer = null;
    totalPlayers = Number(numPlayers);
    
    if (type === "Bracket")
        save_global("tournament","knockout");
    else
        save_global("tournament", "roundrobin");
    numPlayersLabel.textContent = "0/" + totalPlayers;

    // Add organizer to tournament
    if (current_user) {
        const creatorDiv = document.createElement("div");
        creatorDiv.classList.add("player");
        creatorDiv.textContent = current_user.display_name;
        tournamentPlayers.appendChild(creatorDiv);
        invitedPlayers.push(current_user.display_name);
        numPlayersAccepted++;
        numPlayersLabel.textContent = numPlayersAccepted + "/" + totalPlayers;
    }

    // Load online users list
    let players = await fetchOnlineUsers(current_user.display_name);

    // let players = ["Alice", "Bob", "Charlie", "David", "Marco", "Mario", 
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

function createKnockoutMatches() {
    fetch("http://localhost:8008", {
        method: "create_tournament",
        body: JSON.stringify({
            players: invitedPlayers,
            mode: tournament,
        }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.status} - ${response.statusText}`);
        }
        return response.status === 204 ? {} : response.json();
    })
    .then(data => {
        //console.log("Create Tournament response: ", data.matches);
        invitedPlayers = [];
         data.matches.forEach(match => {
            [match.player1, match.player2].forEach(player => {
                invitedPlayers.push(player);
            });
        }); 
    })
    .catch(error => console.error("Fetch error:", error));
}

export function addLobbyPageHandlers() {
    save_global("end", null);
    save_global("game", null);
    save_global("players", null);
    save_global("robinranked", null);
    
    const toggleStartTournament = document.getElementById("toggleStartTournament");
    const inviteButton = document.getElementById("inviteButton");
    const backImageButton = document.getElementById("backImageButton");

    inviteButton.onclick = () => {
        if (selectedPlayer && numPlayersAccepted < totalPlayers) {
            // Send Request to selected player
            sendMessage({
                type: "match_request",
                to: selectedPlayer.textContent
            });
            
            //showInfoModal(`Invito inviato a ${selectedPlayer.textContent}. Attendere risposta...`, () => {});
            
            inviteButton.disabled = true;
        }
    };

    toggleStartTournament?.addEventListener('click', async() => {
        save_global("game", 1);
        if (tournament === "knockout")
            createKnockoutMatches();
        //console.log("match players: ", invitedPlayers);
        
        if (tournament === "knockout")
            navigate("/tournament/knockout/bracket", "Starting knockout tournament", invitedPlayers);
        else
            navigate("/tournament/roundrobin/robinranking", "Starting roundrobin tournament", invitedPlayers);
    });

    backImageButton?.addEventListener('click', () => {
        navigate("/modes", "Return to Game Mode");   
    });
}