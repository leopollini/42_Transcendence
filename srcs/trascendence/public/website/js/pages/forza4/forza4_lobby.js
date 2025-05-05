import { navigate, current_user, save_global, lobby_data} from "../../main.js";
import { initSocket, sendMessage } from "../live-chat/socketHandler.js";
import { showInfoModal } from "../../modal.js";
import { fetchOnlineUsers } from "../get_online_users.js";

let players;
let invitedPlayers = [];
export let acceptedUsers = [];
let selectedPlayer = null;
let numPlayersLabel;
let numPlayersAccepted = 0;
const totalPlayers = 2;
let addedPlayer = [];
let socket;
let newPlayer;
let onlineEl;
let matchEl;
let inviteBtn;
let onlineBadge;
let startBtn;
let backBtn;

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

function update_data() {
  invitedPlayers = lobby_data.invitedPlayers;
  numPlayersAccepted = lobby_data.numPlayersAccepted;
  numPlayersLabel = lobby_data.numPlayersLabel;
  players = lobby_data.players;
  newPlayer = lobby_data.newPlayer;
  addedPlayer = lobby_data.addedPlayer;
}

export async function handleForza4Lobby() {
  // Elementi DOM
  onlineEl = document.getElementById("f4OnlinePlayers");
  matchEl = document.getElementById("f4MatchPlayers");
  inviteBtn = document.getElementById("f4InviteButton");
  onlineBadge = document.getElementById("f4OnlinePlayersCount");
  startBtn = document.getElementById("f4ToggleStartMatch");
  backBtn = document.getElementById("backImageButton");
  
  get_socket();
  save_global("game", 0);
  if (lobby_data)
    update_data();
  else {
    players = null;
    invitedPlayers = [];
    numPlayersLabel = 0;
    numPlayersAccepted = 0;
    addedPlayer = [];
    socket = null;
    newPlayer = null;
  }
  
  numPlayersLabel = document.getElementById("f4NumPlayersLabel");

  selectedPlayer = null;
  inviteBtn.disabled = true;
  startBtn.disabled = true;
  numPlayersLabel.textContent = `0/${totalPlayers}`;

  if (current_user) {
    const me = document.createElement("div");
    me.classList.add("player");
    me.textContent = current_user.display_name;
    matchEl.appendChild(me);


    if (!invitedPlayers.includes(current_user.display_name))
      invitedPlayers.push(current_user.display_name);
    if (addedPlayer) {
      addedPlayer.forEach(e => {
        if (!invitedPlayers.includes(e))
          invitedPlayers.push(e);
        const playerDiv = document.createElement("div");
        playerDiv.classList.add("player");
        playerDiv.textContent = e;
        matchEl.appendChild(playerDiv);
        save_global("opponent", e);
      });
    }
    numPlayersAccepted = invitedPlayers.length;
    numPlayersLabel.textContent = `${numPlayersAccepted}/${totalPlayers}`;
    if (numPlayersAccepted === totalPlayers)
      startBtn.disabled = false;
  }
  if (!players)
    players = await fetchOnlineUsers(current_user.display_name);
  players.forEach(name => {
    const p = document.createElement("div");
    p.classList.add("player");
    p.textContent = name;
    p.addEventListener("click", () => {
      onlineEl.querySelectorAll(".player").forEach(c => {
        c.style.background = "";
        c.style.color = "";
      });
      p.style.background = "#007bff";
      p.style.color = "white";
      selectedPlayer = p;
      inviteBtn.disabled = false;
    });
    onlineEl.appendChild(p);
  });
  onlineBadge.textContent = players.length.toString();
}

function give_lobby_forza4() {
  let all_data_to_be_saved =
  {
    players,
    invitedPlayers,
    numPlayersAccepted,
    numPlayersLabel,
    newPlayer,
    addedPlayer
  };
  return all_data_to_be_saved;
}

export function addForza4LobbyPageHandlers() {
  inviteBtn.onclick = () => {
    if (selectedPlayer && numPlayersAccepted < totalPlayers) {
      sendMessage({
        type: "match_request",
        to: selectedPlayer.textContent,
        mode: "forza4"
      });
      inviteBtn.disabled = true;
    }
  };

  startBtn.addEventListener('click', () => {
    save_global("game", 1);
    navigate("/forza4/game", "Forza 4 Game", invitedPlayers);
  });

  backImageButton.addEventListener('click', () => {
    navigate("/modes", "Return to Game Mode");
  });
}

function match_response_event(event) {
  const msg = JSON.parse(event.data)
  if (msg.data.accepted !== "true")
    return;
  if (msg.type === "match_response" && msg.data.accepted) {
    const from = msg.data.from;
    if (!acceptedUsers.includes(from)) {
      acceptedUsers.push(from);
    }
    numPlayersLabel = document.getElementById("f4NumPlayersLabel");

    // **UPDATE IMMEDIATO** UI e stato (come in Forza4)
    newPlayer = document.createElement("div");
    newPlayer.classList.add("player");
    newPlayer.textContent = from;
    matchEl = document.getElementById("f4MatchPlayers");
    matchEl.appendChild(newPlayer);

    onlineEl.querySelectorAll(".player").forEach(p => {
      if (p.textContent === from) p.remove();
    });
    save_global("opponent", from);
    let index = players.indexOf(msg.data.from);
    if (index !== -1)
      players.splice(index, 1);
    addedPlayer.push(from);
    invitedPlayers.push(from);
    numPlayersAccepted = invitedPlayers.length;
    numPlayersLabel.textContent = `${numPlayersAccepted}/${totalPlayers}`;
    onlineBadge.textContent = onlineEl.querySelectorAll(".player").length;

    if (numPlayersAccepted === totalPlayers) {
      startBtn.disabled = false;
    }
    // **POI** notifica con modal
    showInfoModal(`${from} has accepted the invite to classic Pong!`, () => { });
    if (!lobby_data)
      save_global("lobby_data", give_lobby_forza4());
  }
  removeEventListener("message", match_response_event);
}

function get_socket() {
  socket = initSocket(current_user.display_name);
  socket.addEventListener("message", match_response_event);
}