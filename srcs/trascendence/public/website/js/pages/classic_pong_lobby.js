// === ClassicPongLobby.js ===
import { navigate, save_global, current_user, lobby_data } from "../main.js";
import { initSocket, sendMessage } from "./live-chat/socketHandler.js";
import { showInfoModal } from "../modal.js";
import { fetchOnlineUsers } from "./get_online_users.js";

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
let inviteSended = 0;

export default function ClassicPongLobbyRoom() {
  return `
    <div class="lobby">
      <div class="lobby__container">

        <h1 class="lobby__title">Classic Pong Lobby</h1>
        <div class="lobby__content">
        <img id="backImageButton" src="../../website/images/home.png" alt="Back" class="back-button">
          <!-- Sezione Online Players -->
          <section class="lobby__section">
            <div class="lobby__header">
              <div class="lobby__subtitle">Online Players</div>
              <div id="pongOnlinePlayersCount" class="lobby__badge">0</div>
            </div>
            <div id="pongOnlinePlayers" class="lobby__list"></div>
            <button id="pongInviteButton" class="button button-lobby" disabled>Invite Player</button>
          </section>

          <!-- Sezione Match Info -->
          <section class="lobby__section">
            <div class="lobby__header">
              <div class="lobby__subtitle">Match Info</div>
              <div id="pongNumPlayersLabel" class="lobby__badge">0/${totalPlayers}</div>
            </div>
            <div id="pongMatchPlayers" class="lobby__participants"></div>
            <button id="pongToggleStartMatch" class="button button-lobby" disabled>Start Match</button>
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

export async function handleClassicPongLobby() {
  const onlineEl = document.getElementById("pongOnlinePlayers");
  const matchEl = document.getElementById("pongMatchPlayers");
  const inviteBtn = document.getElementById("pongInviteButton");
  const onlineBadge = document.getElementById("pongOnlinePlayersCount");
  const startBtn = document.getElementById("pongToggleStartMatch");
  const backBtn = document.getElementById("backImageButton");
  
  save_global("game", 0);
  if (lobby_data)
    update_data();
  else
  {
    console.log("players = ", players);
    players = [];
    addedPlayer = [];
  }

  console.log("lobby = ", lobby_data);

  get_socket();

  numPlayersLabel = document.getElementById("pongNumPlayersLabel");
  
  invitedPlayers = [];
  selectedPlayer = null;
  numPlayersAccepted = 0;
  
  inviteBtn.disabled = true;
  startBtn.disabled = true;
  numPlayersLabel.textContent = `0/${totalPlayers}`;
 
  if (current_user) {
    const me = document.createElement("div");
    me.classList.add("player");
    me.textContent = current_user.display_name;
    matchEl.appendChild(me);

    invitedPlayers.push(current_user.display_name);
    if (addedPlayer) {
      addedPlayer.forEach(e => {
        invitedPlayers.push(e)
        const playerDiv = document.createElement("div");
        playerDiv.classList.add("player");
        playerDiv.textContent = e;
        matchEl.appendChild(playerDiv);
        numPlayersAccepted++;
        save_global("opponent", e);
      });
    }
    numPlayersAccepted++;
    numPlayersLabel.textContent = `${numPlayersAccepted}/${totalPlayers}`;
    if (numPlayersAccepted === totalPlayers)
      startBtn.disabled = false;
  }

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
      if (inviteSended === 0)
      {
        p.style.background = "#007bff";
        p.style.color = "white";
        selectedPlayer = p;
        inviteBtn.disabled = false;
      }
      else
        p.style.background = '';
    });
    onlineEl.appendChild(p);
  });
  onlineBadge.textContent = players.length.toString();

  backBtn.addEventListener("click", () => {
    navigate("/modes", "Return to Game Mode");
  });
}

function give_lobby_classic() {
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

export function addClassicPongLobbyPageHandlers() {
  const inviteBtn = document.getElementById("pongInviteButton");
  const startBtn = document.getElementById("pongToggleStartMatch");

  inviteBtn.addEventListener("click", () => {
    if (selectedPlayer && numPlayersAccepted < totalPlayers) {
      sendMessage({ type: "match_request", to: selectedPlayer.textContent });
      inviteSended = 1;
      inviteBtn.disabled = true;
    }
  });

  startBtn.addEventListener("click", () => {
    if (numPlayersAccepted === totalPlayers) {
      save_global("game", 1);
      navigate("/classic", "Classic Pong Game", invitedPlayers);
    }
  });
}

function get_socket()
{

  if (current_user) {
    socket = initSocket(current_user.display_name);
    socket.addEventListener("message", event => {
      const msg = JSON.parse(event.data);
      if (msg.data.accepted !== "true")
        return;
      if (msg.type === "match_response" && msg.data.accepted) {
        inviteSended = 0;
        const from = msg.data.from;
        if (!acceptedUsers.includes(from)) {
          acceptedUsers.push(from);
        }
        const onlineEl = document.getElementById("pongOnlinePlayers");
        const matchEl = document.getElementById("pongMatchPlayers");
        const onlineBadge = document.getElementById("pongOnlinePlayersCount");
        const startBtn = document.getElementById("pongToggleStartMatch");
        numPlayersLabel = document.getElementById("pongNumPlayersLabel");

        // **UPDATE IMMEDIATO** UI e stato (come in Forza4)
        newPlayer = document.createElement("div");
        newPlayer.classList.add("player");
        newPlayer.textContent = from;
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
        numPlayersAccepted++;
        numPlayersLabel.textContent = `${numPlayersAccepted}/${totalPlayers}`;
        onlineBadge.textContent = onlineEl.querySelectorAll(".player").length;

        if (numPlayersAccepted === totalPlayers) {
          startBtn.disabled = false;
        }

        // **POI** notifica con modal
        showInfoModal(`${from} has accepted the invite to classic Pong!`, () => { });
        save_global("lobby_data", give_lobby_classic());
      }
    });
  }
}