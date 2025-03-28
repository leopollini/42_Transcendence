import { navigate } from "../../main.js";
import { current_user } from "../modes.js";

let matchPlayers = [];

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
        <div id="f4LobbyRoom">
            <div class="form" id="f4playerSearchForm">
                <div>
                    <h2 id="f4PlayerText">Search for opponent</h2> 
                    <input type="text" id="f4PlayerSearch" class="form__field" placeholder="Search a player..." autocomplete="off">
                    <button id="f4ToggleSearchUser" class="button-style">Search</button>
                </div>
                <div>
                    <h2 id="f4PlayerSearchResult">Waiting for User...</h2>
                    <button id="f4ToggleAddUser" class="button-style" disabled>Add</button>
                </div>
                <div>
                    <h2 id="f4PlayerInviteResult">Waiting for Response...</h2>
                    <button id="f4ToggleStartGame" class="button-style" disabled>Start Game</button>
                </div>
            </div>
        </div>`;
}

export function handleForza4Lobby() {
    matchPlayers = [];
    matchPlayers.push(current_user.display_name);
    //console.log("match players = " +matchPlayers[0]);
}

function searchUser(username) {
    const f4PlayerSearchResult = document.getElementById("f4PlayerSearchResult");
    const f4ToggleAddUser = document.getElementById('f4ToggleAddUser');
    
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
            let user_name;
            let find_user = data.user?.find(u => u.username === username);
            if (!find_user)
                find_user = data.guest?.find(g => g.username === username);
            if (find_user) 
            {
                user_name = find_user;
                if (user_name && matchPlayers.includes(user_name.username)) {
                    f4PlayerSearchResult.style.color = "red";
                    f4PlayerSearchResult.innerHTML = "Cannot add urself as opponent"
                    f4ToggleAddUser.disabled = true;
                }
                else if (user_name) 
                {
                    f4PlayerSearchResult.style.color = "green";
                    f4PlayerSearchResult.innerHTML = "User Found: " + user_name.username;
                    f4ToggleAddUser.disabled = false;
                }
            }
            else {
                f4PlayerSearchResult.style.color = "red";
                f4PlayerSearchResult.innerHTML = "User Not Found";
                f4ToggleAddUser.disabled = true;
            }
        })
        .catch(error => {
            console.error("Error fetching user data:", error);
        });
}


export function addForza4LobbyPageHandlers() {
    const backImageButton = document.getElementById('backImageButton');
    const f4ToggleSearchUser = document.getElementById('f4ToggleSearchUser');
    const f4PlayerSearch = document.getElementById('f4PlayerSearch');
    const f4ToggleStartGame = document.getElementById('f4ToggleStartGame');
    //const toggleAddUserRaw = document.getElementById('toggleAddUserRaw');

    backImageButton?.addEventListener('click', () => {
        navigate("/modes", "Return to Game Mode");   
        matchPlayers = [];     
    });

    f4ToggleSearchUser?.addEventListener('click', () => {
        //console.log("searching user...." +f4PlayerSearch.value);

        searchUser(f4PlayerSearch.value);
    });

    f4ToggleAddUser?.addEventListener('click', () => {
        const f4PlayerInviteResult = document.getElementById("f4PlayerInviteResult");

        f4PlayerInviteResult.innerHTML = "Player Added: " + f4PlayerSearch.value;
        f4ToggleStartGame.disabled = false;
        matchPlayers.push(f4PlayerSearch.value)
    });


    f4ToggleStartGame?.addEventListener('click', () => {
       navigate( "/forza4/game", "Forza 4 Game", matchPlayers);
    });

}