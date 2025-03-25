import Login, { addLoginPageHandlers } from "./pages/profile/login.js";
import Modes, {addModesPageHandlers, current_user, nullify_user} from "./pages/modes.js";
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
import {GameUserStatistics, pongShowMatchDetails, gameUserStatisticsPageHandlers} from "./pages/game_statistics.js";
import Forza4LobbyRoom, { handleForza4Lobby, addForza4LobbyPageHandlers } from "./pages/forza4/forza4_lobby.js";
import LiveChat from "./pages/live-chat.js";
import ChatApp from "./pages/live-chat/ChatApp.js";
let buttonTitle;
let winner;
let players;
// Mappa delle rotte
const routes = {
    "/": Login,
    "/modes": Modes,
    "/classic": PongGame,
    "/classic/lobby": ClassicPongLobbyRoom,
    "/V.S._AI": PongGame,
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

//restore logged da sistemare
export const navigate = (path, title = "", lobbyPlayers) => {
    history.pushState({ path }, title, path);
    buttonTitle = title;
    players = lobbyPlayers;
    let data = JSON.stringify({ "params" : [{}]});
    fetch("http://localhost:8008",
    {
        method: "get_user",
        body: data
    })
    .then(response => response.json())
    .then(data =>
    {
        console.log("(get_user)\nData login = ", data);
    });
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
const loadContent = () => {
    const path = window.location.pathname;
    const app = document.getElementById("app");
    const component = routes[path];
    
    let playerNames;
    let numPlayers = 4;
    
    if (window.location.pathname !== '/')
    {
        if (sessionStorage.getItem("prev_path") === null)
            sessionStorage.setItem("prev_path", window.location.pathname);
    }
    /*console.log("already in => " + sessionStorage.getItem("already in"));
    console.log("session opened => " + localStorage.getItem("session opened"));
    if (sessionStorage.getItem("already in") === '1' && localStorage.getItem("session opened") === '1' && path !== '/'
    && !current_user)
    {
        console.log("refreshing page and data");
        restore_user();
        return(0);
    }*/
    /*if (accessing_errors(path) === 1)
        return;*/
    if (buttonTitle === "Robin4" || buttonTitle === "Robin5" || buttonTitle === "Robin6" || buttonTitle === "Robin7" || buttonTitle === "Robin8" 
        || buttonTitle === "Bracket4" || buttonTitle === "Bracket8" || buttonTitle === "Bracket16")
        numPlayers = parseInt(buttonTitle.replace(/\D/g, ""), 10);
    if (!players)
        players = createPlayersArray(numPlayers);
    //console.log("Players? " +players);
    playerNames = players;  
    //console.log("path => " + path);
    if (component)
    {
        app.innerHTML = component();
        if (path === "/classic" || path === "/V.S._AI" || path === "/tournament/knockout/bracket/game" || path === "/tournament/roundrobin/robinranking/game") {
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
                if (current_user.type === "guest")
                    alert("You must be logged to use this feature!");
                else
                    addTournamentPageHandlers();
                break;
            case "/tournament/knockout":
                addKnockoutPageHandlers();
                resetBracketState();
                break;
            case "/tournament/knockout/lobby":
                addKnockoutPageHandlers();
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
                startForza4Game();
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
        // Se non serve, svuota il container della chat
        document.getElementById("chatApp").innerHTML = "";
    }
};

    // Gestione dei pulsanti "Indietro" e "Avanti" nel browser
window.addEventListener("popstate", loadContent);

function initChat() {
    const chatContainer = document.getElementById("chatApp");
    // Inserisce il template della chat
    chatContainer.innerHTML = LiveChat();
    // Inizializza la logica della chat creando una nuova istanza di ChatApp
    new ChatApp();
}

// Inizializzazione dell'app
document.addEventListener("DOMContentLoaded", loadContent);

export function unauthorized_acess()
{
    navigate("/", "home");
}

function accessing_errors(path)
{
    if (path !== "/")
    {
        let session = 0;
        let opened = 0;
        if (sessionStorage.getItem("already in") === '0' || sessionStorage.getItem("already in") === null)
            session = 1;
        if (localStorage.getItem("session opened") === '1' || localStorage.getItem("session opened") === null)
            opened = 1;
        if (session === 1 && opened === 1)
        {
            alert("ERROR: accessing unauthorized page...");
            unauthorized_acess();
            return (1);
        }
    }
    else
    {
        if (sessionStorage.getItem("already in") === '1')
        {
            sessionStorage.clear();
            localStorage.clear();
            nullify_user();
        }
    }
}