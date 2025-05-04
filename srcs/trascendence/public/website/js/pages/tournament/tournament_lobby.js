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
      <div class="lobby">
        <!-- Back Button -->
        <img id="backImageButton" src="../../website/images/home.png" alt="Back" class="back-button">

        <div class="lobby__container">
          <h1 class="lobby__title">Tournament Lobby</h1>
          <div class="lobby__content">

            <!-- Sezione Online Players -->
            <section class="lobby__section">
              <div class="lobby__header">
                <div class="lobby__subtitle">Online Players</div>
                <div id="onlinePlayersCount" class="lobby__badge">0</div>
              </div>
              <div id="onlinePlayers" class="lobby__list">
                <!-- Lista dei giocatori online -->
              </div>
              <button id="inviteButton" class="button-lobby" disabled>
                Invite →
              </button>
            </section>

            <!-- Sezione Tournament Players -->
            <section class="lobby__section">
              <div class="lobby__header">
                <div class="lobby__subtitle">Match Info</div>
                <div id="numPlayersLabel" class="lobby__badge">0/0</div>
              </div>
              <div id="tournamentPlayers" class="lobby__participants">
                <!-- Lista dei giocatori nel torneo -->
              </div>
              <button id="toggleStartTournament" class="button-lobby" disabled>
                Start Tournament
              </button>
            </section>

          </div>
        </div>
      </div>
    `;
}

export async function handleLobby(type) {
  if (!socket && current_user) {
      socket = initSocket(current_user.display_name);
      socket.onmessage = (event) => {
          let msg = JSON.parse(event.data);

          if (msg.type === "match_response") {
              const accepted = msg.data.accepted === true || msg.data.accepted === "true";
              const tournamentPlayers = document.getElementById("tournamentPlayers");
              const numPlayersLabel = document.getElementById("numPlayersLabel");
              const toggleStartTournament = document.getElementById("toggleStartTournament");
              const onlinePlayersCount = document.getElementById("onlinePlayersCount");

              if (accepted) {
                  showInfoModal(`${msg.data.from} ha accettato l'invito al torneo!`, () => {
                      const newPlayer = document.createElement("div");
                      newPlayer.classList.add("player");
                      newPlayer.textContent = msg.data.from;
                      tournamentPlayers.appendChild(newPlayer);

                      numPlayersAccepted++;
                      numPlayersLabel.textContent = `${numPlayersAccepted}/${totalPlayers}`;
                      invitedPlayers.push(msg.data.from);

                      // Rimuovi il giocatore dalla lista online
                      document.querySelectorAll("#onlinePlayers .player").forEach(player => {
                          if (player.textContent === msg.data.from) player.remove();
                      });

                      // 🔧 Aggiorna il contatore dei giocatori online
                      onlinePlayersCount.textContent = document.querySelectorAll("#onlinePlayers .player").length;

                      if (numPlayersAccepted === totalPlayers)
                          toggleStartTournament.disabled = false;
                  });
              }
          }
      };
  }

  const onlinePlayers = document.getElementById("onlinePlayers");
  const tournamentPlayers = document.getElementById("tournamentPlayers");
  const inviteButton = document.getElementById("inviteButton");
  const onlinePlayersCount = document.getElementById("onlinePlayersCount");
  numPlayersLabel = document.getElementById("numPlayersLabel");

  onlinePlayers.innerHTML = "";
  tournamentPlayers.innerHTML = "";
  invitedPlayers = [];
  numPlayersAccepted = 0;
  selectedPlayer = null;
  totalPlayers = Number(numPlayers);

  save_global("tournament", type === "Bracket" ? "knockout" : "roundrobin");
  numPlayersLabel.textContent = `0/${totalPlayers}`;

  if (current_user) {
      const creatorDiv = document.createElement("div");
      creatorDiv.classList.add("player");
      creatorDiv.textContent = current_user.display_name;
      tournamentPlayers.appendChild(creatorDiv);
      invitedPlayers.push(current_user.display_name);
      numPlayersAccepted++;
      numPlayersLabel.textContent = `${numPlayersAccepted}/${totalPlayers}`;
  }

  const players = await fetchOnlineUsers(current_user.display_name);
  players.forEach(player => {
      const div = document.createElement("div");
      div.classList.add("player");
      div.textContent = player;
      div.onclick = () => {
          document.querySelectorAll("#onlinePlayers .player").forEach(el => el.style.background = "");
          div.style.background = "#007bff";
          div.style.color = "white";
          selectedPlayer = div;
          inviteButton.disabled = false;
      };
      onlinePlayers.appendChild(div);
  });

  // 🔧 Aggiorna il contatore dei giocatori online al primo caricamento
  onlinePlayersCount.textContent = players.length;
}

function createKnockoutMatches() {
    fetch("https://" + window.location.hostname + ":8008", {
        method: "create_tournament",
        body: JSON.stringify({ players: invitedPlayers, mode: tournament }),
    })
    .then(response => response.ok ? response.json() : Promise.reject(response))
    .then(data => {
        invitedPlayers = [];
        data.matches.forEach(match => invitedPlayers.push(match.player1, match.player2));
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
            sendMessage({ type: "match_request", to: selectedPlayer.textContent });
            inviteButton.disabled = true;
        }
    };

    toggleStartTournament?.addEventListener('click', () => {
        save_global("game", 1);
        if (tournament === "knockout") createKnockoutMatches();
        const path = tournament === "knockout" ? "/tournament/knockout/bracket" : "/tournament/roundrobin/robinranking";
        navigate(path, "Starting tournament", invitedPlayers);
    });

    backImageButton?.addEventListener('click', () => {
        navigate("/modes", "Return to Game Mode");
    });
}