import LiveChat from "./pages/live-chat.js";
import ChatApp from "./pages/live-chat/ChatApp.js";

import { remove_all } from "./utils_main/error_main.js";
import { routes, handlerMap } from "./utils_main/router.js"
import { handle_popstate, save_at_exit } from "./utils_main/listener_Compacter.js";
import { util_main, set_prev_path } from "./utils_main/utils.js";

export let Bracket_state = null,
    refresh = false,
    current_user = null,
    tournament = null,
    user_name = null,
    opponent = null,
    pong_save = null,
    forza4_save = null,
    token = null,
    prev_path = null,
    playerNames = null,
    Player1 = null,
    Player2 = null,
    in_game = 0,
    winner = null,
    players = null,
    match_ended = null,
    robinranking = null,
    numPlayers = null,
    buttonTitle = null,
    acess = false;

export function reset_all_let() {
    if (window.location.pathname === "/")
        refresh = null;
    Bracket_state = null,
        current_user = null,
        tournament = null,
        user_name = null,
        opponent = null,
        pong_save = null,
        forza4_save = null,
        token = null,
        prev_path = null,
        playerNames = null,
        Player1 = null,
        Player2 = null,
        in_game = 0,
        winner = null,
        players = null,
        match_ended = null,
        robinranking = null,
        numPlayers = null,
        buttonTitle = null,
        acess = false;
}

function is_parsable(value, to_parse) {
    if (value && typeof value === "string" && to_parse) {
        try {
            return JSON.parse(value);
        }
        catch {
            return value;
        }
    }
    return value;
}

export function save_global(type, data) {
    let parsed_data = is_parsable(data, true);
    if (type === "pong")
        pong_save = parsed_data;
    if (type === "name")
        user_name = parsed_data;
    if (type === "opponent")
        opponent = parsed_data;
    if (type === "forza4")
        forza4_save = parsed_data;
    if (type === "p1")
        Player1 = parsed_data;
    if (type === "p2")
        Player2 = parsed_data;
    if (type === "token")
        token = parsed_data;
    if (type === "tournament")
        tournament = parsed_data;
    if (type === "bracket")
        Bracket_state = parsed_data
    if (type === "game")
        in_game = parsed_data;
    if (type === "winner")
        winner = parsed_data;
    if (type === "players")
        players = parsed_data;
    if (type === "end")
        match_ended = parsed_data;
    if (type === "robinranked")
        robinranking = parsed_data;
    if (type === "numP")
        numPlayers = parsed_data;
    if (type === "acess")
        acess = parsed_data;
    if (type === "prev_path")
        prev_path = parsed_data;
    if (type === "user")
        current_user = parsed_data;
    if (type === "PlayerName")
        playerNames = parsed_data
}

window.addEventListener('beforeunload', () => {
    save_at_exit();
    if (refresh === false && window.location.pathname !== '/') {
        if (sessionStorage.getItem('already in') === '1')
            remove_all(0, 0, 1);
    }
});


document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    const isReloadKey = key === 'f5' ||
        ((e.ctrlKey || e.metaKey) && key === 'r');

    if (isReloadKey)
        refresh = true;
});

//restore logged da sistemare
export const navigate = async (path, new_title = "", lobbyPlayers) => {
    buttonTitle = new_title;
    players = lobbyPlayers;
    history.pushState({ path }, new_title, path);
    await loadContent();
};

// Caricamento dinamico del contenuto
export const loadContent = async () => {
    const path = window.location.pathname;
    const app = document.getElementById("app");
    const component = routes[path];
    prev_path = set_prev_path();
    if (!component) {
        app.innerHTML = `
        <div class="error-container">
            <h1>404 - Page not found</h1>
            <p>Sorry, the page you're looking for doesn't exist.</p>
        </div>`;
        return;
    }
    if (await util_main(path, component, app) === -2)
        return;
    if (handlerMap[path]) {
        handlerMap[path]();
    }

    const chatRoutes = ["/modes"]; // aggiungi qui le rotte dove vuoi visualizzare la chat
    if (chatRoutes.includes(path)) {
        initChat();
    } else {
        // If don't needed, empty the chat content
        document.getElementById("chatApp").innerHTML = "";//sicuro
    }
};

function initChat() {
    const chatContainer = document.getElementById("chatApp");
    // Insert chat template
    chatContainer.innerHTML = LiveChat();//sicuro
    // Initialize chat logic by creating the ChatApp instance   
    new ChatApp();
}

// Initialize app
document.addEventListener("DOMContentLoaded", loadContent);

// Handling "Forward" and "Backward" browser buttons
window.addEventListener("popstate", async () => {
    handle_popstate();
});
