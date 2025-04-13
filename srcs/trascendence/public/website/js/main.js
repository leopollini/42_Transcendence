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
import {restore_user } from "./login/user.js";
import {check_valid_operation, remove_all, path_error} from "./error_main.js";
import { showInfoModal } from "./modal.js";
import {checkAuthentication} from "./login/login_logic.js";
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
    "/profile": Profile
};

export let current_user = null;

export async function initUser()
{
    if (window.location.pathname !== "/")
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

//restore logged da sistemare
export const navigate = async (path, title = "", lobbyPlayers) => {
    buttonTitle = title;
    players = lobbyPlayers;
    history.pushState({ path }, title, path);
    await loadContent();
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

export default function No_Page()
{
    return `
      <div class="error-container">
        <h1>404 - Page not found</h1>
        <p>Sorry, the page you're looking for doesn't exist.</p>
      </div>
    `;
}

// Caricamento dinamico del contenuto
const loadContent = async () => {
    const path = window.location.pathname;
    const app = document.getElementById("app");
    const component = routes[path];
    let let_me_in = await checkAuthentication(path);
    if (let_me_in === 1)
    {
        navigate("/", "Home");
        return;
    }
    else if (let_me_in === -1)
    {
        navigate("/modes", "Return to Game Mode");
        return;
    }
    if (!component)
    {
        app.innerHTML = No_Page();
        return;
    }
    if (check_valid_operation(path) === 1 || path_error(path) === 1)
        return;
    else
        await initUser();
    let playerNames;
    let numPlayers = 4
    if (buttonTitle === "Robin4" || buttonTitle === "Robin5" || buttonTitle === "Robin6" || buttonTitle === "Robin7" || buttonTitle === "Robin8" 
        || buttonTitle === "Bracket4" || buttonTitle === "Bracket8" || buttonTitle === "Bracket16")
        numPlayers = parseInt(buttonTitle.replace(/\D/g, ""), 10);
    if (!players)
        players = createPlayersArray(numPlayers);
    //console.log("Players? " +players);
    playerNames = players;  
    //console.log("path => " + path);
    if (path !== "/" && path !== "/classic" && path !== "/forza4/game")
        remove_all(1, 1);
    if (component)
    {
        app.innerHTML = component();//sicuro se lo purifichi blocca codici
        if (path === "/classic" || path === "/VS_AI" || path === "/tournament/knockout/bracket/game" || path === "/tournament/roundrobin/robinranking/game") {
            //console.log("playerzzzz2: " + players);
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
                sessionStorage.setItem("no", true);
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
                sessionStorage.setItem("no", true);
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

    // Handling "Forward" and "Backward" browser buttons
window.addEventListener("popstate", () => {
    loadContent();
});
    

window.addEventListener("popstate", () =>
{
    if (sessionStorage.getItem("no") === "true")
    {
        remove_all(1, 1);
        showInfoModal("you successfully exited the game", () => {});
        return;
    }
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

let isRefresh = false;

window.addEventListener('keydown', function (e) {
    if ((e.key === 'F5') || (e.ctrlKey && e.key === 'r'))
        isRefresh = true;
});

window.addEventListener('beforeunload', () =>
{
    if (sessionStorage.getItem('already in') === '1')
    {
        if (!isRefresh && window.location.pathname !== "/")
            channel.postMessage("session_closed");
        /*else if (current_user.type === "login")
            sessionStorage.setItem("user_name", current_user.realname);
        else
            sessionStorage.setItem("user_name", current_user.display_name);*/
        return
    }
});