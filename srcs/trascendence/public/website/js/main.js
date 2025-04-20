import Login, { addLoginPageHandlers } from "./pages/profile/login.js";
import Modes, { addModesPageHandlers } from "./pages/modes.js";
import Tournament, { addTournamentPageHandlers } from "./pages/tournament/tournament.js";
import PongGame from "./pages/pong_game.js";
import ClassicPongLobbyRoom, { handleClassicPongLobby, addClassicPongLobbyPageHandlers } from "./pages/classic_pong_lobby.js";
import Knockout, { addKnockoutPageHandlers } from "./pages/tournament/knockout.js";
import Customize, { addCustomizeGame } from "./pages/profile/customize.js";
import Roundrobin, { addRoundRobinPageHandlers } from "./pages/tournament/roundrobin.js";
import RobinRanking, { addRobinRankingPageHandlers, robinDraw, assignPointsToPlayer, reset_all } from "./pages/tournament/robindraw.js";
import LobbyRoom, { addLobbyPageHandlers, handleLobby } from "./pages/tournament/tournament_lobby.js";
import Bracket, { addBracketPageHandlers, backToBracket, resetBracketState } from "./pages/tournament/bracket.js";
import { initializeGameCanvas } from "./game/pong/main/handling_Canvas.js";
import Profile, { profileHandler } from "./pages/profile/profile.js";
import Settings, { addSettingsPageHandlers } from "./pages/profile/settings.js";
import { userName } from "./pages/user_data.js";
import { Forza4Customize, forza4Config } from "./pages/forza4/forza4_customize.js";
import { Forza4, startForza4Game } from "./game/forza4/main/forza4.js";
import { GameUserStatistics, pongShowMatchDetails, gameUserStatisticsPageHandlers } from "./pages/game_statistics.js";
import Forza4LobbyRoom, { handleForza4Lobby, addForza4LobbyPageHandlers } from "./pages/forza4/forza4_lobby.js";
import LiveChat from "./pages/live-chat.js";
import ChatApp from "./pages/live-chat/ChatApp.js";
import { check_valid_operation, remove_all } from "./error_main.js";
import { showInfoModal } from "./modal.js";
import { restore_user } from "./login/user.js";
let buttonTitle;

let prev_path = null;

// Mappa delle rotte
const routes = {
    "/": Login,
    "/modes": Modes,
    "/classic": PongGame,
    "/classic/lobby": ClassicPongLobbyRoom,
    "/VS_AI": PongGame,
    "/tournament": Tournament,
    "/userstats": GameUserStatistics,
    "/forza4/game": Forza4,
    "/forza4/findopponent": Forza4LobbyRoom,
    "/settings": Settings,
    "/settings/customizepong": Customize,
    "/settings/customizeforza4": Forza4Customize,
    "/tournament/knockout": Knockout,
    "/tournament/knockout/lobby": LobbyRoom,
    "/tournament/roundrobin": Roundrobin,
    "/tournament/roundrobin/robinranking": RobinRanking,
    "/tournament/roundrobin/robinranking/game": PongGame,
    "/tournament/roundrobin/lobby": LobbyRoom,
    "/tournament/knockout/bracket": Bracket,
    "/tournament/knockout/bracket/game": PongGame,
    "/profile": Profile
};

export let Bracket_state, current_user, user_name, opponent, pong_save, forza4_save = null;
export let Player1, Player2, in_game, winner, players, match_ended, robinranking, numPlayers = null;
export let acess = false;

export async function initUser() {
    if (window.location.pathname !== "/")
        current_user = await restore_user();
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
}

export function nullify_user() {
    current_user = null;
}

//restore logged da sistemare
export const navigate = async (path, title = "", lobbyPlayers) => {
    buttonTitle = title;
    players = lobbyPlayers;
    history.pushState({ path }, title, path);
    await loadContent();
};

function createPlayersArray(numPlayers) {
    let players = [];
    for (let i = 1; i <= numPlayers; i++) {
        if (i === 1)
            players.push(userName);
        else
            players.push(`Player ${i}`);
    }
    return players;
}

function restoreBackground() {
    document.getElementById('app').classList.remove('no-background');
}

function set_prev_path() {
    let path = window.location.pathname;
    if (path === "/modes")
        prev_path = "/modes";
    else if (path === '/')
        return;
    else
        prev_path = null;
}

// Caricamento dinamico del contenuto
const loadContent = async () => {
    const path = window.location.pathname;
    const app = document.getElementById("app");
    const component = routes[path];
    set_prev_path();
    if (await check_valid_operation(path, component) === 1)
        return;
    else
        await initUser();
    let playerNames;
    if (buttonTitle === "Robin4" || buttonTitle === "Robin5" || buttonTitle === "Robin6" || buttonTitle === "Robin7" || buttonTitle === "Robin8"
        || buttonTitle === "Bracket4" || buttonTitle === "Bracket8" || buttonTitle === "Bracket16")
        numPlayers = parseInt(buttonTitle.replace(/\D/g, ""), 10);
    if (!players)
        players = createPlayersArray(numPlayers);
    playerNames = players;
    if (component) {
        app.innerHTML = component();//sicuro se lo purifichi blocca codici
        if (path === "/classic" || path === "/VS_AI" || path === "/tournament/knockout/bracket/game" || path === "/tournament/roundrobin/robinranking/game") {
            //console.log("playerzzzz2: " + players);
            in_game = 1;
            initializeGameCanvas();
            document.getElementById('app').classList.add('no-background');
        }
        else
            restoreBackground();
        switch (path) {
            case "/":
                addLoginPageHandlers();
                break;
            case "/profile":
                profileHandler();
                break;
            case "/classic/lobby":
                in_game = 0;
                addClassicPongLobbyPageHandlers();
                handleClassicPongLobby();
                break;
            case "/modes":
                addModesPageHandlers();
                break;
            case "/tournament":
                addTournamentPageHandlers();
                break;
            case "/tournament/knockout":
                addKnockoutPageHandlers();
                resetBracketState();
                break;
            case "/tournament/knockout/lobby":
                addLobbyPageHandlers();
                handleLobby("Bracket");
                resetBracketState();
                break;
            case "/tournament/roundrobin/lobby":
                addLobbyPageHandlers();
                handleLobby("Robin");
                break;
            case "/tournament/knockout/bracket":
                addBracketPageHandlers();
                //players = JSON.parse(sessionStorage.getItem('players'));
                //console.log("title => " + buttonTitle);
                if (buttonTitle === "Return from Match") {
                    //console.log("return to bracket");
                    backToBracket(winner);
                }
                break;
            case "/tournament/roundrobin":
                addRoundRobinPageHandlers();
                break;
            case "/tournament/roundrobin/robinranking":
                addRobinRankingPageHandlers();
                if (buttonTitle === "Return from Match") {
                    //console.log("return to bracket");
                    assignPointsToPlayer(winner);
                }
                robinDraw(playerNames);
                break;
            case "/settings":
                addSettingsPageHandlers();
                break;
            case "/settings/customizepong":
                addCustomizeGame();
                break;
            case "/forza4":
                showForza4HomeScreen();
                break;
            case "/settings/customizeforza4":
                forza4Config();
                break;
            case "/userstats":
                GameUserStatistics()
                pongShowMatchDetails();
                gameUserStatisticsPageHandlers();
                break;
            case "/forza4/findopponent":
                in_game = 0;
                handleForza4Lobby();
                addForza4LobbyPageHandlers();
                break;
            case "/forza4/game":
                startForza4Game();
                in_game = 1;
                break;
            default:
                break;
        }
    }

    const chatRoutes = ["/modes"]; // aggiungi qui le rotte dove vuoi visualizzare la chat
    if (chatRoutes.includes(path)) {
        initChat();
    } else {
        // If don't needed, empty the chat content
        document.getElementById("chatApp").innerHTML = "";//sicuro
    }
};
window.onpopstate = function () {

};
// Handling "Forward" and "Backward" browser buttons
window.addEventListener("popstate", async() => {
    const path = window.location.pathname;
    if (prev_path === "/modes" && path === "/") {
        showInfoModal("you have quitted the active session", () => { });
        remove_all(0, 0, 1);
    }
    if (in_game === 1 && path !== '/tournament/knockout/bracket/game'
        && path !== '/tournament/knockout/bracket' && path !== "/tournament/roundrobin/robinranking"
        && path !== "/tournament/roundrobin/robinranking/game") {
        remove_all(1, 1);
        Bracket_state = null;
        robinranking = null;
        reset_all();
        resetBracketState();
        showInfoModal("you successfully exited the game", () => { });
        await loadContent();
        return;
    }
    if ((path === "/tournament/knockout/bracket" || path === "/tournament/roundrobin/robinranking/game"
        || path === "/tournament/knockout/bracket/game" || path === "/tournament/roundrobin/robinranking")
        && match_ended !== 1) {
        Bracket_state = null;
        robinranking = null;
        reset_all();
        resetBracketState();
        navigate("/modes", "Return to Game Mode");
        showInfoModal("Leaving Tournament...", () => { });
        return;
    }
    if (match_ended === 1 && (path === "/tournament/knockout/bracket/game" || 
    path === "/tournament/roundrobin/robinranking/game")) {
        Bracket_state = null;
        robinranking = null;
        reset_all();
        resetBracketState();
        navigate("/modes", "Return to Game Mode");
        showInfoModal("You finised the tournament yay");
        return;
    }
    await loadContent();
});

function initChat() {
    const chatContainer = document.getElementById("chatApp");
    // Insert chat template
    chatContainer.innerHTML = LiveChat();//sicuro
    // Initialize chat logic by creating the ChatApp instance   
    new ChatApp();
}

// Initialize app
document.addEventListener("DOMContentLoaded", loadContent);

window.addEventListener('keydown', function (e) {
    const result = ((e.key === 'F5') || (e.ctrlKey && e.key === 'r'));
    if (window.location.pathname !== '/' && result === true)
        sessionStorage.setItem("refresh", true);
    else
        sessionStorage.setItem("refresh", false);
});

window.addEventListener('storage', function(e)
{
    console.log("e = ", e);
    const path = window.location.pathname;
    const key = e.key === "session opened" || e.key === "already in";
    console.log("key = ", key);
    console.log("path = ", path);
    console.log("value = ", e.value);
    if (path === "/")
    {
        if(key === true)
        {
            if (e.value !== "0")
            {
                showInfoModal("Error: invalid operation...\nRestarting data...", () => {} );
                remove_all(0, 0, 1);
            }
        }
    }
    else
    {
        if(key === true)
        {
            if (e.value !== "1")
            {
                navigate("/", "home");
                showInfoModal("Error: invalid operation...\nRestarting data...", () => {} );
                remove_all(0, 0, 1);
            }
        }
    }
});

function to_string(name, value, isjson) {
    if (typeof value === "object" && value !== null && isjson)
        sessionStorage.setItem(name, JSON.stringify(value));
    else
        sessionStorage.setItem(name, value);
}

function save_at_exit() {
    if (user_name)
        to_string("user_name", user_name, false);
    if (pong_save)
        to_string("pongData", pong_save, true);
    if (opponent)
        to_string("opponent", opponent, false);
    if (forza4_save)
        to_string("forza4Data", forza4_save, true);
    if (Player1)
        to_string("player1", Player1, false);
    if (Player2)
        to_string("player2", Player2, false);
    if (Bracket_state)
        to_string("bracketState", Bracket_state, true);
    if (in_game)
        to_string("game", in_game, false);
    if (winner)
        to_string("winner", winner, false);
    if (players)
        to_string("players", players, true);
    if (match_ended)
        to_string("end", match_ended, false);
    if (robinranking)
        to_string("robinranked", robinranking, true);
    if (numPlayers)
        to_string("numP", numPlayers, true);
    if (acess === true || acess === "true")
        to_string("acess", acess, false);
}

window.addEventListener('beforeunload', () => {
    save_at_exit();
    const refresh = sessionStorage.getItem("refresh");
    if (refresh === 'false') {
        if (sessionStorage.getItem('already in') === '1') {
            remove_all(0, 0, 1);
            return (0);
        }
    }
});