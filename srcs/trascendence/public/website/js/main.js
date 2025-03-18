import Login, { addLoginPageHandlers } from "./pages/profile/login.js";
import Modes, {addModesPageHandlers, current_user, nullify_user} from "./pages/modes.js";
import Tournament, { addTournamentPageHandlers } from "./pages/tournament/tournament.js";
import PongGame from "./pages/pong_game.js";
import Knockout, { addKnockoutPageHandlers } from "./pages/tournament/knockout.js";
import Customize, { addCustomizeGame } from "./pages/profile/customize.js";
import Roundrobin, { addRoundRobinPageHandlers } from "./pages/tournament/roundrobin.js";
import RobinRanking, { addRobinRankingPageHandlers, robinDraw, assignPointsToPlayer } from "./pages/tournament/robindraw.js";
import { Charts, addChartsPageHandlers,showCharts } from "./pages/tournament/charts.js";
import MatchDetails, {showMatchDetails } from "./pages/match_details.js";
import Bracket, { addBracketPageHandlers, drawBracket, backToBracket, resetBracketState } from "./pages/tournament/bracket.js";
import { initializeGameCanvas } from "./game/pong/main/handling_Canvas.js";
import Profile, { profileHandler } from "./pages/profile/profile.js";
import Settings, { addSettingsPageHandlers } from "./pages/profile/settings.js";
import Stats, {ShowStats} from "./pages/profile/stats.js";
import { userName } from "./pages/user_data.js";
import { Forza4Home, showForza4HomeScreen, addForza4PageHandlers } from "./pages/forza4/forza4_home.js";
import { Forza4Customize, forza4Config } from "./pages/forza4/forza4_customize.js";
import { Forza4, startForza4Game } from "./game/forza4/main/forza4.js";
import { Forza4UserStats, forza4ShowUserStatistics, forza4ShowMatchDetails, addForza4StatsPageHandlers } from "./pages/forza4/forza4_statistics.js";
import Friends from "./pages/friends.js";
import LiveChat from "./pages/live-chat.js";
import ChatApp from "./pages/live-chat/ChatApp.js";
import { checkCookieAcrossTabs, deleteAllCookies, eraseCookie, readCookie } from "./login/user.js";
let buttonTitle;
let winner;

// Mappa delle rotte
const routes = {
    "/": Login,
    "/modes": Modes,
    "/classic": PongGame,
    "/V.S._AI": PongGame,
    "/tournament": Tournament,
    "/forza4": Forza4Home,
    "/forza4/game": Forza4,
    "/forza4/userstats": Forza4UserStats,
    "/settings": Settings,
    "/settings/customizepong": Customize,
    "/settings/customizeforza4": Forza4Customize,
    "/tournament/knockout": Knockout,
    "/tournament/roundrobin": Roundrobin,
    "/tournament/roundrobin/robinranking": RobinRanking,
    "/tournament/roundrobin/robinranking/game": PongGame,
    "/tournament/userstats": Charts,
    "/tournament/userstats/matchdetails": MatchDetails,
    "/tournament/knockout/bracket": Bracket,
    "/tournament/knockout/bracket/game": PongGame,
    "/profile": Profile,
    "/stats": Stats,
    "/friends": Friends,
};

// Funzione universale per la navigazione
export const navigate = async (path, title = "") => {
    history.pushState({ path }, title, path);
    buttonTitle = title;    
    await loadContent();
};

window.addEventListener("beforeunload", () => {
});

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

// Caricamento dinamico del contenuto
const loadContent = async () => {
    const path = window.location.pathname;
    const app = document.getElementById("app");
    const component = routes[path];
    let logged = await checkCookieAcrossTabs("logged");
    let userToken = await checkCookieAcrossTabs("user_token");
    let players;
    let playerNames;
    let numPlayers = 4;
    if (buttonTitle === "4" || buttonTitle === "5" || buttonTitle === "6" || buttonTitle === "7" || buttonTitle === "8" || buttonTitle === "16")
        numPlayers = +buttonTitle;
    
    players = createPlayersArray(numPlayers);

    //console.log("Players? " +players);
    playerNames = players;  
    //console.log("path => " + path);
    if (component)
    {
        app.innerHTML = await component();
        if (path === "/classic" || path === "/V.S._AI" || path === "/tournament/knockout/bracket/game" || path === "/tournament/roundrobin/robinranking/game") {
            initializeGameCanvas();
            document.getElementById('app').classList.add('no-background');
        }
        else
            restoreBackground();
        if ((logged === 0 && userToken === 0) || (logged === -1 && userToken === -1) && path !== "/")
        {
            alert("ERROR: accessing unautorized page...");
            navigate("/", "home");
            return;
        }
        else
        {
            switch (path)
            {
                case "/":
                    if (logged === 1 && userToken === 1)
                        deleteAllCookies();
                    addLoginPageHandlers();
                    break;
                case "/stats":
                        ShowStats()
                    break;
                case "/profile":
                    profileHandler();
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
                case "/tournament/userstats":
                    addChartsPageHandlers();
                    showCharts();
                    break;
                case "/tournament/userstats/matchdetails":
                    showMatchDetails();
                    break;
                case "/forza4":
                    showForza4HomeScreen();
                    addForza4PageHandlers();
                    break;
                case "/settings/customizeforza4":
                    forza4Config();
                    break;
                case "/forza4/userstats":
                    Forza4UserStats();
                    addForza4StatsPageHandlers();
                    forza4ShowUserStatistics();
                    break;
                case "/forza4/game":
                    startForza4Game();
                    break;
                default:
                    break;
            }
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