import { navigate, current_user, save_global } from "../../main.js";
import { initSocket, sendMessage } from "../live-chat/socketHandler.js";
import { showInfoModal } from "../../modal.js";
import { fetchOnlineUsers } from "../get_online_users.js";

let invitedPlayers = [];
let selectedPlayer;
let numPlayersLabel;
let numPlayersAccepted = 0;
const totalPlayers = 2;
let socket;

export default function Forza4LobbyRoom() {
  return `
    <div class="lobby">
      <div class="lobby__container">

        <h1 class="lobby__title">Forza 4 Lobby</h1>
        <div class="lobby__content">
          <!-- Back Button -->
        <img id="backImageButton" src="../../website/images/home.png" alt="Back" class="back-button">
          <!-- Sezione Online Players -->
          <section class="lobby__section">
            <div class="lobby__header">
              <div class="lobby__subtitle">Online Players</div>
              <div id="f4OnlinePlayersCount" class="lobby__badge">0</div>
            </div>
            <div id="f4OnlinePlayers" class="lobby__list"></div>
            <button id="f4InviteButton" class="button button-lobby" disabled>Invite Player</button>
          </section>

          <!-- Sezione Match Info -->
          <section class="lobby__section">
            <div class="lobby__header">
              <div class="lobby__subtitle">Match Info</div>
              <div id="f4NumPlayersLabel" class="lobby__badge">0/${totalPlayers}</div>
            </div>
            <div id="f4MatchPlayers" class="lobby__participants"></div>
            <button id="f4ToggleStartMatch" class="button button-lobby" disabled>Start Match</button>
          </section>

        </div>
      </div>
    </div>
  `;
}

export async function handleForza4Lobby() {
  save_global("game", 0);

  // Inizializza socket se serve
  if (!socket && current_user) {
    socket = initSocket(current_user.display_name);
    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "match_response" && (msg.data.accepted === true || msg.data.accepted === "true")) {
        showInfoModal(`${msg.data.from} ha accettato l'invito!`, () => {
          const matchPlayers = document.getElementById("f4MatchPlayers");
          const numPlayersLabel = document.getElementById("f4NumPlayersLabel");
          const toggleStartMatch = document.getElementById("f4ToggleStartMatch");

          // Aggiungi ai partecipanti
          const newPlayer = document.createElement("div");
          newPlayer.classList.add("player");
          newPlayer.textContent = msg.data.from;
          matchPlayers.appendChild(newPlayer);

          // Stato partita
          save_global("opponent", msg.data.from);
          invitedPlayers.push(msg.data.from);
          numPlayersAccepted++;
          numPlayersLabel.textContent = `${numPlayersAccepted}/${totalPlayers}`;

          // Rimuovi dalla lista online
          const onlineContainer = document.getElementById("f4OnlinePlayers");
          onlineContainer.querySelectorAll(".player")
            .forEach(el => { if (el.textContent === msg.data.from) el.remove(); });

          // Aggiorna badge online
          document.getElementById("f4OnlinePlayersCount")
                  .textContent = onlineContainer.querySelectorAll(".player").length.toString();

          // Abilita Start Match
          if (numPlayersAccepted === totalPlayers) {
            toggleStartMatch.disabled = false;
          }
        });
      }
    };
  }

  // Elementi DOM
  const onlinePlayersContainer = document.getElementById("f4OnlinePlayers");
  const matchPlayers          = document.getElementById("f4MatchPlayers");
  const inviteButton          = document.getElementById("f4InviteButton");
  const onlineCountBadge      = document.getElementById("f4OnlinePlayersCount");
  numPlayersLabel             = document.getElementById("f4NumPlayersLabel");

  // RESET
  invitedPlayers = [];
  selectedPlayer = null;
  numPlayersAccepted = 0;
  matchPlayers.innerHTML = "";
  onlinePlayersContainer.innerHTML = "";
  numPlayersLabel.textContent = `0/${totalPlayers}`;

  // Aggiungi creator (te stesso)
  if (current_user) {
    const me = document.createElement("div");
    me.classList.add("player");
    me.textContent = current_user.display_name;
    matchPlayers.appendChild(me);

    invitedPlayers.push(current_user.display_name);
    numPlayersAccepted++;
    numPlayersLabel.textContent = `${numPlayersAccepted}/${totalPlayers}`;
  }

  // Carica la lista degli online, crea i div e abilita selezione/invito
  const players = await fetchOnlineUsers(current_user.display_name);
  players.forEach(player => {
    const div = document.createElement("div");
    div.classList.add("player");
    div.textContent = player;
    div.onclick = () => {
      onlinePlayersContainer.querySelectorAll(".player")
        .forEach(el => { el.style.background = ""; el.style.color = ""; });
      div.style.background = "#007bff";
      div.style.color = "white";
      selectedPlayer = div;
      inviteButton.disabled = false;
    };
    onlinePlayersContainer.appendChild(div);
  });
  onlineCountBadge.textContent = players.length.toString();
}

export function addForza4LobbyPageHandlers() {
  const inviteButton     = document.getElementById("f4InviteButton");
  const toggleStartMatch = document.getElementById("f4ToggleStartMatch");
  const backImageButton  = document.getElementById("backImageButton");

  inviteButton.onclick = () => {
    if (selectedPlayer && numPlayersAccepted < totalPlayers) {
      sendMessage({
        type: "match_request",
        to: selectedPlayer.textContent
      });
      inviteButton.disabled = true;
    }
  };

  toggleStartMatch.addEventListener('click', () => {
    save_global("game", 1);
    navigate("/forza4/game", "Forza 4 Game", invitedPlayers);
  });

  backImageButton.addEventListener('click', () => {
    navigate("/modes", "Return to Game Mode");
  });
}