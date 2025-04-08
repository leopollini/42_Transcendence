import Login, { addLoginPageHandlers } from "./pages/profile/login.js";
import Modes, {addModesPageHandlers} from "./pages/modes.js";
import Tournament, { addTournamentPageHandlers } from "./pages/tournament/tournament.js";
import PongGame from "./pages/pong_game.js";
import ClassicPongLobbyRoom, { handleClassicPongLobby, addClassicPongLobbyPageHandlers } from "./pages/classic_pong_lobby.js";
import Knockout, { addKnockoutPageHandlers } from "./pages/tournament/knockout.js";
import Customize, { addCustomizeGame } from "./pages/profile/customize.js";
import Roundrobin, { addRoundRobinPageHandlers } from "./pages/tournament/roundrobin.js";
import RobinRanking, { addRobinRankingPageHandlers, robinDraw, assignPointsToPlayer } from "./pages/tournament/robindraw.js";
import LobbyRoom, { addLobbyPageHandlers, handleLobby } from "./pages/tournament/tournament_lobby.js";
import Bracket, { addBracketPageHandlers, drawBracket, backToBracket, resetBracketState } from "./pages/tournament/bracket.js";
import { initializeGameCanvas } from "./game/pong/main/handling_Canvas.js";
import Profile, { profileHandler } from "./pages/profile/profile.js";
import Settings, { addSettingsPageHandlers } from "./pages/profile/settings.js";
import { userName } from "./pages/user_data.js";
import { Forza4Customize, forza4Config } from "./pages/forza4/forza4_customize.js";
import { Forza4, startForza4Game } from "./game/forza4/main/forza4.js";
import { GameUserStatistics, pongShowMatchDetails, gameUserStatisticsPageHandlers} from "./pages/game_statistics.js";
import Forza4LobbyRoom, { handleForza4Lobby, addForza4LobbyPageHandlers } from "./pages/forza4/forza4_lobby.js";
import LiveChat from "./pages/live-chat.js";
import ChatApp from "./pages/live-chat/ChatApp.js";
import { restore_user } from "./login/user.js";
import { showInfoModal } from "./modal.js";

import { free_users } from "./security/security.js";
let buttonTitle;
let winner;
let players;

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
    "/profile": Profile,
};

export let current_user = null;

export async function initUser()
{
    current_user = await restore_user();
}


export function update_user(user)
{
    current_user = user;
}

export function nullify_user()
{
    current_user = null;
}

window.addEventListener('load', () => {
    if (sessionStorage.getItem('already in') === null)
        sessionStorage.setItem('already in', 0);
    if (localStorage.getItem('session opened') === null)
        localStorage.setItem('session opened', 0);
});

//restore logged da sistemare
export const navigate = (path, title = "", lobbyPlayers) => {
    if (window.location.pathname !== path)
        history.pushState({ path }, title, path);
    else
        history.replaceState({ path }, title, path);
    buttonTitle = title;
    console.log("lobby playrs" + lobbyPlayers);
    players = lobbyPlayers;
    loadContent();
};

function createPlayersArray(numPlayers) {
    let players = [];
    for (let i = 1; i <= numPlayers; i++)
    {
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

// Caricamento dinamico del contenuto
const loadContent = async () => {
    await initUser();
    const path = window.location.pathname;
    const app = document.getElementById("app");
    const component = routes[path];
    
    //console.log("path => " + path);
    let playerNames;
    let numPlayers = 4;
    if (check_valid_operation(path) === 1)
        return;
    if (buttonTitle === "Robin4" || buttonTitle === "Robin5" || buttonTitle === "Robin6" || buttonTitle === "Robin7" || buttonTitle === "Robin8" 
        || buttonTitle === "Bracket4" || buttonTitle === "Bracket8" || buttonTitle === "Bracket16")
        numPlayers = parseInt(buttonTitle.replace(/\D/g, ""), 10);
    // if (!players)
    //     players = createPlayersArray(numPlayers);
    //console.log("Players? " +players);
    playerNames = players;  
    //console.log("path => " + path);
    if (component)
    {
        app.innerHTML = component();
        if (path === "/classic" || path === "/VS_AI" || path === "/tournament/knockout/bracket/game" || path === "/tournament/roundrobin/robinranking/game") {
            console.log("playerzzzz2: " + players);
            initializeGameCanvas(players);
            document.getElementById('app').classList.add('no-background');
        }
        else
            restoreBackground();
        switch (path)
        {
            case "/":
                addLoginPageHandlers();
                break;
            case "/profile":
                profileHandler();
                break;
            case "/classic":
                break;
            case "/classic/lobby":
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
                handleLobby("Bracket", numPlayers);
                resetBracketState();
                break;
            case "/tournament/roundrobin/lobby":
                addLobbyPageHandlers();
                handleLobby("Robin", numPlayers);
                break;
            case "/tournament/knockout/bracket":
                addBracketPageHandlers();
                //players = JSON.parse(sessionStorage.getItem('players'));
                //console.log("title => " + buttonTitle);
                if (buttonTitle === "Return from Match") {
                    //console.log("return to bracket");
                    winner = sessionStorage.getItem('winner');
                    backToBracket(winner);
                }
                else
                    drawBracket(players);          
                break;
            case "/tournament/roundrobin":
                addRoundRobinPageHandlers();
                break;
            case "/tournament/roundrobin/robinranking":
                addRobinRankingPageHandlers();
                if (buttonTitle === "Return from Match") {
                    //console.log("return to bracket");
                    winner = sessionStorage.getItem('winner');
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
                handleForza4Lobby(); 
                addForza4LobbyPageHandlers();
                break;
            case "/forza4/game":
                startForza4Game(players);
                break;
            default:
                break;
        }
    }
    else
        app.innerHTML = "<h1 class='text'>404 - Pagina non trovata</h1>"; // Pagina non trovata

    const chatRoutes = ["/modes"]; // aggiungi qui le rotte dove vuoi visualizzare la chat
    if (chatRoutes.includes(path)) {
        initChat();
    } else {
        // If don't needed, empty the chat content
        document.getElementById("chatApp").innerHTML = "";
    }
};

    // Handling "Forward" and "Backward" browser buttons
window.addEventListener("popstate", loadContent);

function initChat() {
    const chatContainer = document.getElementById("chatApp");
    // Insert chat template
    chatContainer.innerHTML = LiveChat();
    // Initialize chat logic by creating the ChatApp instance   
    new ChatApp();
}

// Initialize app
document.addEventListener("DOMContentLoaded", loadContent);

const channel = new BroadcastChannel("session_sync");

window.addEventListener('beforeunload', () =>
{
    if (sessionStorage.getItem('already in') === '1')
    {
        localStorage.setItem('session opened', 0);
        channel.postMessage("session_closed");
    }
});

window.addEventListener('storage', (event) =>
{
    if (event.key === 'popup opened')
    {
        if (event.newValue === 'true')
            localStorage.setItem('popup opened', true);
    }
})

channel.addEventListener("message", (event) =>
{
    if (event.data === "session_closed")
    {
        localStorage.setItem('session opened', 0);
        free_users();
    }
});

function check_valid_operation(path)
{
    if (sessionStorage.getItem('already in') === '1' && localStorage.getItem('session opened') === '0')
        localStorage.setItem('session opened', 1);
    if (sessionStorage.getItem('already in') === '1' && path === "/")
    {
        free_users();
        nullify_user();
        localStorage.setItem('session opened', 0);
        sessionStorage.setItem('already in', 0);
        return (0);
    }
    else if (path !== '/')
    {
        if (continue_error_check(path) === 1)
            return (1);
    }
    return (0);
}

function continue_error_check(path)
{
    // if (sessionStorage.getItem('already in') === '1')
    // {
    //     if (path === window.location.pathname
    //     && sessionStorage.getItem('already in') === '1')
    //     {
    //         if (sessionStorage.getItem('game ended') === 'true')
    //         {
    //             sessionStorage.removeItem("game ended");
    //             showInfoModal("ERROR:(Invalid operation) going back to menu...", () => {});
    //             navigate("/modes", "Return to Game Mode");
    //             return (1);
    //         }
    //         return (0);
    //     }
    // }
    // else
    // {
    //     if (!sessionStorage.getItem('already in'))
    //         sessionStorage.setItem('already in', '0');
    //     if (!localStorage.getItem('session opened'))
    //         localStorage.setItem('session opened', '0');
    //     if ((localStorage.getItem('session opened') === '1' && sessionStorage.getItem('already in') === '0') ||
    //     (sessionStorage.getItem('already in') === '0' && localStorage.getItem('session opened') === '0'))
    //     {
    //         showInfoModal("ERROR: accessing unauthorized page...", () => {});
    //         navigate("/", "home");
    //         return (1);
    //     }
    // }
}