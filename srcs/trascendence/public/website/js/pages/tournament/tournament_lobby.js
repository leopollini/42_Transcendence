import { navigate, current_user, save_global, numPlayers } from "../../main.js";
import { resetBracketState } from "./bracket.js";
let invitedPlayers = [];
let tournament;
let selectedPlayer;
let numPlayersLabel;
let numPlayersAccepted = 0;
let totalPlayers;

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


async function fetchOnlineUsers() {
    try {
        const response = await fetch("http://localhost:8008", {
            method: "get_online",
            body: JSON.stringify({ include_guests: true })
        });

        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.status} - ${response.statusText}`);
        }
        const data = await response.json();
        let users_online = [];
        data.online_users.forEach(user => {
                if (user !== current_user.display_name)
                    users_online.push(user);    
        }); 
        console.log("users online =>", users_online);
        return users_online; 
    } catch (error) {
        console.error("Fetch error:", error);
        throw error; // Rilancia l'errore se vuoi gestirlo al livello superiore
    }
}

export async function handleLobby(type) {
    const onlinePlayers = document.getElementById("onlinePlayers");
    const tournamentPlayers = document.getElementById("tournamentPlayers");
    const inviteButton = document.getElementById("inviteButton");
    numPlayersLabel = document.getElementById("numPlayersLabel");
    
    invitedPlayers = [];
    numPlayersAccepted = 0;
    selectedPlayer = null;
    totalPlayers = Number(numPlayers);
    if (type === "Bracket")
        tournament = "knockout";
    else
        tournament = "roundrobin";
    numPlayersLabel.textContent = "0/" + totalPlayers;

    if (current_user) {
        const creatorDiv = document.createElement("div");
        creatorDiv.classList.add("player");
        creatorDiv.textContent = current_user.display_name;
        tournamentPlayers.appendChild(creatorDiv);
        invitedPlayers.push(current_user.display_name);
        numPlayersAccepted++;
        numPlayersLabel.textContent = numPlayersAccepted + "/" +  totalPlayers;
    }


    let players = await fetchOnlineUsers();


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

function createKnockoutMatches()
{
    fetch("http://localhost:8008", {
        method: "create_tournament",
        body: JSON.stringify({
            players: invitedPlayers,
<<<<<<< HEAD
            mode: tournament,
=======
            tournament_mode: tournament,
>>>>>>> 486aab4b7f94963eae7ea616eb46651e5bf30b7f
        }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.status} - ${response.statusText}`);
        }
        return response.status === 204 ? {} : response.json();
    })
    .then(data => {
        console.log("Create Tournament response: ", data.matches);
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
    inviteButton.onclick = () => {
        if (selectedPlayer && numPlayersAccepted < totalPlayers) {
            const newPlayer = selectedPlayer.cloneNode(true);
            newPlayer.style.background = "";
            newPlayer.style.color = "white";
            newPlayer.onclick = null;
            tournamentPlayers.appendChild(newPlayer);
            numPlayersAccepted++;
            numPlayersLabel.textContent = numPlayersAccepted + "/" +  totalPlayers;
            invitedPlayers.push(selectedPlayer.textContent);
            selectedPlayer.remove();
            selectedPlayer = null;
            inviteButton.disabled = true;
            if (numPlayersAccepted === totalPlayers)
                toggleStartTournament.disabled = false;
        }
    };

    toggleStartTournament?.addEventListener('click', async() => {
        //console.log("tournament =>" + tournament);
        save_global("game", 1);
        if (tournament === "knockout")
            createKnockoutMatches();
        console.log("match players: ", invitedPlayers);
        
        if (tournament === "knockout")
            navigate("/tournament/knockout/bracket", "Starting knockout tournament", invitedPlayers);
        else
            navigate("/tournament/roundrobin/robinranking", "Starting roundrobin tournament", invitedPlayers);
    });

    backImageButton?.addEventListener('click', () => {
        navigate("/modes", "Return to Game Mode");   
        //invitedPlayers = [];     
    });
}