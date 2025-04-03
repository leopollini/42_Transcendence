import { navigate } from "../main.js";
import { current_user } from "../main.js";
import { escapeHTML } from "../security/security.js";
import { showInfoModal } from "../modal.js";

let matchPlayers = [];

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
            <span class="letter letter-7">g</span>
            <span class="letter letter-8">a</span>
            <span class="letter letter-9">m</span>
            <span class="letter letter-10">e</span>
        </h1>
        <div id="pongLobbyRoom">
            <div class="form" id="pongPlayerSearchForm">
                <div>
                    <h2 id="pongPlayerText">Search for opponent</h2> 
                    <input type="text" id="pongPlayerSearch" class="form__field" placeholder="Search a player..." autocomplete="off">
                    <button id="pongToggleSearchUser" class="button-style">Search</button>
                </div>
                <div>
                    <h2 id="pongPlayerSearchResult">Waiting for User...</h2>
                    <button id="pongToggleAddUser" class="button-style" disabled>Add</button>
                </div>
                <div>
                    <h2 id="pongPlayerInviteResult">Waiting for Response...</h2>
                    <button id="pongToggleStartGame" class="button-style" disabled>Start Game</button>
                </div>
            </div>
        </div>`;
}


// export function handleLobby(tournamentType, totPlayers) {
//     //console.log("total players = " + totPlayers);
//     const canvas = document.getElementById('lobbyUsersCanvas');
//     //const ctx = canvas.getContext('2d');
//     canvas.width = window.innerWidth * 0.5; 
//     canvas.height = window.innerHeight * 0.9; 

//     const numPlayersLabel = document.getElementById("numPlayers");
//     numPlayersLabel.innerHTML = "0/" + Number(totPlayers);
// }



export function handleClassicPongLobby() {
    matchPlayers = [];
    matchPlayers.push(current_user.display_name);
    //console.log("match players = " +matchPlayers[0]);
}

async function name(params) {
    
}

function searchUser(username) {
    const pongPlayerSearchResult = document.getElementById("pongPlayerSearchResult");
    const pongToggleAddUser = document.getElementById('pongToggleAddUser');
    
    if (!username)
        return;
    fetch("http://localhost:8008", {
            method: "get_user",
            body: JSON.stringify({ 
                "params" : [{}] 
            }) 
        })
        .then(response => response.json())
        .then(data =>
        {
            if (!data || (!data.user && !data.guest)) 
            {
                nullify_user();
                showInfoModal("ERROR: no users found...", () => {});
                navigate("/", "home");
                return;
            }
            let user_name;
            let find_user = data.user?.find(u => u.username === username);
            if (!find_user)
                find_user = data.guest?.find(g => g.username === username);
            if (find_user) 
            {
                user_name = find_user;
                if (user_name && matchPlayers.includes(user_name.username)) {
                    pongPlayerSearchResult.style.color = "red";
                    pongPlayerSearchResult.textContent = "Cannot add urself as opponent"
                    pongToggleAddUser.disabled = true;
                }
                else if (user_name) 
                    fined_oppenet(user_name);
            }
            else {
                pongPlayerSearchResult.style.color = "red";
                pongPlayerSearchResult.textContent = "User Not Found";
                pongToggleAddUser.disabled = true;
            }
        })
        .catch(error => {
            console.error("Error fetching user data:", error);
        });
}


export function addClassicPongLobbyPageHandlers() {
    const backImageButton = document.getElementById('backImageButton');
    const pongToggleSearchUser = document.getElementById('pongToggleSearchUser');
    const pongPlayerSearch = document.getElementById('pongPlayerSearch');
    const pongToggleStartGame = document.getElementById('pongToggleStartGame');
    //const toggleAddUserRaw = document.getElementById('toggleAddUserRaw');

    backImageButton?.addEventListener('click', () => {
        navigate("/modes", "Return to Game Mode");   
        matchPlayers = [];     
    });

    pongToggleSearchUser?.addEventListener('click', () => {
        //console.log("searching user...." +pongPlayerSearch.value);
        pongPlayerSearch.value = escapeHTML(pongPlayerSearch.value);
        searchUser(pongPlayerSearch.value);
    });

    pongToggleAddUser?.addEventListener('click', () => {
        const pongPlayerInviteResult = document.getElementById("pongPlayerInviteResult");

        pongPlayerInviteResult.textContent = "Player Added: " + pongPlayerSearch.value;
        pongToggleStartGame.disabled = false;
        matchPlayers.push(pongPlayerSearch.value)
    });


    pongToggleStartGame?.addEventListener('click', () => {
       navigate( "/classic", "Forza 4 Game", matchPlayers);
    });

}