import { navigate, save_global, current_user, lobby_data, numPlayers} from "../../main.js";
import { initSocket, sendMessage } from "../live-chat/socketHandler.js";
import { showInfoModal } from "../../modal.js";
import { fetchOnlineUsers } from "../get_online_users.js";

let tournament = null;

let players;
let invitedPlayers = [];
export let acceptedUsers = [];
let selectedPlayer = null;
let numPlayersLabel;
let numPlayersAccepted = 0;
let totalPlayers;
let addedPlayer = [];
let socket;
let newPlayer;
let onlineEl;
let matchEl;
let inviteBtn;
let onlineBadge;
let startBtn;





export default function LobbyRoom() {
    return `
    <div class="lobby">
      <div class="lobby__container">

        <h1 class="lobby__title">Tournament Lobby</h1>
        <div class="lobby__content">
        <img id="backImageButton" src="../../website/images/home.png" alt="Back" class="back-button">
          <!-- Sezione Online Players -->
          <section class="lobby__section">
            <div class="lobby__header">
              <div class="lobby__subtitle">Online Players</div>
              <div id="onlinePlayersCount" class="lobby__badge">0</div>
            </div>
            <div id="onlinePlayers" class="lobby__list"></div>
            <button id="inviteButton" class="button button-lobby" disabled>Invite Player</button>
          </section>

          <!-- Sezione Match Info -->
          <section class="lobby__section">
            <div class="lobby__header">
              <div class="lobby__subtitle">Match Info</div>
              <div id="numPlayersLabel" class="lobby__badge">0/${totalPlayers}</div>
            </div>
            <div id="tournamentPlayers" class="lobby__participants"></div>
            <button id="toggleStartTournament" class="button button-lobby" disabled>Start Match</button>
          </section>

        </div>
      </div>
    </div>
  `;
}


function update_data_tournament() {
  invitedPlayers = lobby_data.invitedPlayers;
  numPlayersAccepted = lobby_data.numPlayersAccepted;
  numPlayersLabel = lobby_data.numPlayersLabel;
  players = lobby_data.players;
  newPlayer = lobby_data.newPlayer;
  addedPlayer = lobby_data.addedPlayer;
  totalPlayers = numPlayers;
}

export async function handleTournamentLobby(tournament_mode) {
  onlineEl = document.getElementById("onlinePlayers");
  matchEl = document.getElementById("tournamentPlayers");
  inviteBtn = document.getElementById("inviteButton");
  onlineBadge = document.getElementById("onlinePlayersCount");
  startBtn = document.getElementById("toggleStartTournament");
  tournament = tournament_mode;
  //console.log("tournament mode: ", tournament);
  totalPlayers = numPlayers;
  
  get_socket();
  save_global("game", 0);
  if (lobby_data)
    update_data_tournament();
  else {
    players = null;
    invitedPlayers = [];
    numPlayersLabel = 0;
    numPlayersAccepted = 0;
    addedPlayer = [];
    socket = null;
    newPlayer = null;
  }

  numPlayersLabel = document.getElementById("numPlayersLabel");

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
    .catch(error => showInfoModal("Fetch error:", error));
}

export function addLobbyPageHandlers() {
    // save_global("end", null);
    // save_global("game", null);
    // save_global("players", null);
    // save_global("robinranked", null);

    const toggleStartTournament = document.getElementById("toggleStartTournament");
    const inviteButton = document.getElementById("inviteButton");
    const backImageButton = document.getElementById("backImageButton");

    inviteButton.onclick = () => {
        if (selectedPlayer && numPlayersAccepted < totalPlayers) {
            sendMessage({
              type: "match_request",
              to: selectedPlayer.textContent,
              mode: "tournament"
            });
            inviteButton.disabled = true;
            // sendMessage({type: "match_response", to: current_user.display_name, from: selectedPlayer.textContent, accepted: "true"});
        }
    };

    toggleStartTournament?.addEventListener('click', () => {
        save_global("game", 1);
        if (tournament === "knockout")
          createKnockoutMatches();
        const path = (tournament === "knockout" ? "/tournament/knockout/bracket" : "/tournament/roundrobin/robinranking");

        //console.log("Invited players: ", invitedPlayers);
        save_global("players", invitedPlayers);
        navigate(path, "Starting tournament", invitedPlayers);
    });

    backImageButton?.addEventListener('click', () => {
        navigate("/modes", "Return to Game Mode");
    });
}

function give_lobby_tournament() {
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

function tournament_response_event(event) {
  const msg = JSON.parse(event.data)
  if (msg.data.accepted !== "true")
    return;
  if (msg.type === "match_response" && msg.data.accepted) {
    matchEl = document.getElementById("tournamentPlayers");
    const from = msg.data.from;
    if (!acceptedUsers.includes(from)) {
      acceptedUsers.push(from);
    }
    numPlayersLabel = document.getElementById("numPlayersLabel");
    // **UPDATE IMMEDIATO** UI e stato (come in Forza4)
    newPlayer = document.createElement("div");
    newPlayer.classList.add("player");
    newPlayer.textContent = from;
    matchEl = document.getElementById("tournamentPlayers");
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
    // showInfoModal(`${from} has accepted your invitation!`, () => { });
    if (!lobby_data)
      save_global("lobby_data", give_lobby_tournament());
  }
  removeEventListener("message", tournament_response_event);
}

function get_socket() {
  socket = initSocket(current_user.display_name);
  socket.addEventListener("message", tournament_response_event);
}