import { navigate, save_global } from "../main.js";
import { current_user } from "../main.js";
import { initSocket, sendMessage } from "./live-chat/socketHandler.js";
import { showInfoModal } from "../modal.js";
import { fetchOnlineUsers } from "./get_online_users.js";
import { is_online } from "../login/user.js";

let invitedPlayers = [];
let selectedPlayer = null;
let numPlayersLabel = null;
let numPlayersAccepted = 0;
let totalPlayers = 2;
let socket = null;

export default function ClassicPongLobbyRoom() {
    return `
        <div class="lobby">
          <div class="lobby__container">
            <h1 class="lobby__title">Classic Pong Lobby</h1>
            <div class="lobby__content">
              <section class="lobby__section">
                <div class="lobby__subtitle">
                  Online Players <span id="onlinePlayersCount" class="lobby__badge">0</span>
                </div>
                <div id="onlinePlayers" class="lobby__list"></div>
                <button id="pongInviteButton" class="button button-lobby" disabled>
                  Invite Player
                </button>
              </section>

              <section class="lobby__section">
                <div class="lobby__subtitle">Match Info</div>
                <div id="pongNumPlayersLabel" class="lobby__badge">0/2</div>
                <div id="pongMatchPlayers" class="lobby__participants"></div>
                <button id="pongToggleStartMatch" class="button button-lobby" disabled>
                  Start Match
                </button>
              </section>
            </div>
          </div>
        </div>
    `;
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
                    showInfoModal(`${msg.data.from} has accepted the invite to classic mode!`, () => {
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
                    //showInfoModal(`${msg.data ? msg.data.from : msg.from} ha rifiutato l'invito alla modalita classica.`, () => {});
                }
            }

        };
    }

    const onlinePlayers = document.getElementById("onlinePlayers");
    const matchPlayers = document.getElementById("pongMatchPlayers");
    const inviteButton = document.getElementById("pongInviteButton");

    numPlayersLabel = document.getElementById("pongNumPlayersLabel");
    numPlayersLabel.textContent = `0/${totalPlayers}`;
    matchPlayers.innerHTML = "";
    onlinePlayers.innerHTML = "";

    // Aggiungi il creatore alla partita
    if (current_user) {
        const creatorDiv = document.createElement("div");
        creatorDiv.classList.add("player");
        creatorDiv.textContent = current_user.display_name;
        matchPlayers.appendChild(creatorDiv);
        invitedPlayers.push(current_user.display_name);
        numPlayersAccepted++;
        numPlayersLabel.textContent = `${numPlayersAccepted}/${totalPlayers}`;
    }
    // Carica giocatori online
    const players = await fetchOnlineUsers(current_user.display_name);
    //console.log("onlione users = ", players);
    renderOnlinePlayers(players, onlinePlayers, inviteButton);

    // Aggiorna badge numero giocatori
    const onlinePlayersCount = document.getElementById("onlinePlayersCount");
    if (onlinePlayersCount) {
        onlinePlayersCount.textContent = players.length;
    }
}

function handleSocketMessage(msg) {
    const onlinePlayers = document.getElementById("onlinePlayers");
    const toggleStartMatch = document.getElementById("pongToggleStartMatch");

    if (msg.type === "match_response") {
        const accepted = msg.data.accepted === true || msg.data.accepted === "true";
        if (accepted) {
            showInfoModal(`${msg.data.from} has accepted the invite to classic mode!`, () => {
                addPlayerToMatch(msg.data.from);

                // Rimuovi l'utente dalla lista online se presente
                const onlinePlayerDivs = onlinePlayers.querySelectorAll(".player");
                onlinePlayerDivs.forEach(div => {
                    if (div.textContent === msg.data.from) {
                        div.remove();
                    }
                });

                updatePlayerStatus(toggleStartMatch);
            });
        } else {
            console.log("📩 L'utente ha rifiutato l'invito");

            // Riabilita il bottone di invito
            const inviteButton = document.getElementById("pongInviteButton");
            if (inviteButton) {
                inviteButton.disabled = false;
            }
        }
    }
}


function renderOnlinePlayers(players, onlinePlayers, inviteButton) {
    players.forEach(player => {
        // Se il giocatore è già tra gli invitati, non mostrarlo più
        if (invitedPlayers.includes(player)) {
            return;
        }

        const div = document.createElement("div");
        div.classList.add("player");
        div.textContent = player;
        div.onclick = () => {
            // Scoloro solo quelli nella lista online
            onlinePlayers.querySelectorAll(".player").forEach(el => {
                el.style.background = "";
                el.style.color = "";
            });
            div.style.background = "#007bff";
            div.style.color = "white";
            selectedPlayer = div;
            inviteButton.disabled = false;
        };
        onlinePlayers.appendChild(div);
    });
}


function addPlayerToMatch(playerName) {
    const matchPlayers = document.getElementById("pongMatchPlayers");
    const newPlayer = document.createElement("div");
    newPlayer.classList.add("player");
    newPlayer.textContent = playerName;
    matchPlayers.appendChild(newPlayer);
    invitedPlayers.push(playerName);
}

function updatePlayerStatus(toggleStartMatch) {
    numPlayersAccepted++;
    numPlayersLabel.textContent = `${numPlayersAccepted}/${totalPlayers}`;
    if (numPlayersAccepted === totalPlayers) {
        toggleStartMatch.disabled = false;
    }
}

export async function addClassicPongLobbyPageHandlers() {
    const toggleStartMatch = document.getElementById("pongToggleStartMatch");
    const inviteButton = document.getElementById("pongInviteButton");
    const backImageButton = document.getElementById("backImageButton");

    inviteButton.onclick = async () => {
        if (selectedPlayer && numPlayersAccepted < totalPlayers) {
            if (await is_online(selectedPlayer.textContent) === false) {
                showInfoModal("Error: user not online anymore", () => { });
                return;
            }
            sendMessage({
                type: "match_request",
                to: selectedPlayer.textContent
            });
            inviteButton.disabled = true;
        }
    };

    toggleStartMatch?.addEventListener('click', () => {
        save_global("game", 1);
        navigate("/classic", "Pong Classic Game", invitedPlayers);
    });

    backImageButton?.addEventListener('click', () => {
        invitedPlayers = [];
        navigate("/modes", "Return to Game Mode");
    });
}