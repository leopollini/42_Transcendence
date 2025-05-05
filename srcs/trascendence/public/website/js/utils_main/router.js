import { buttonTitle, playerNames, players, save_global, winner} from "../main.js";
import Login, { addLoginPageHandlers }from "../pages/profile/login.js";
import Callback from "../login/login_logic.js";
import Modes, { addModesPageHandlers } from "../pages/modes.js";
import PongGame from "../pages/pong_game.js";
import ClassicPongLobbyRoom, {addClassicPongLobbyPageHandlers, handleClassicPongLobby} from "../pages/classic_pong_lobby.js";
import Profile, {profileHandler} from "../pages/profile/profile.js";
import Settings, {addSettingsPageHandlers}from "../pages/profile/settings.js";
import Customize, {addCustomizeGame} from "../pages/profile/customize.js";
import GameUserStatistics, {pongShowMatchDetails, gameUserStatisticsPageHandlers} from "../pages/game_statistics.js";
import Forza4Customize, {forza4Config} from "../pages/forza4/forza4_customize.js";
import Forza4, {startForza4Game} from "../game/forza4/main/forza4.js";
import Forza4LobbyRoom, {handleForza4Lobby, addForza4LobbyPageHandlers} from "../pages/forza4/forza4_lobby.js";
import Tournament, {addTournamentPageHandlers} from "../pages/tournament/tournament.js";
import Knockout , {addKnockoutPageHandlers} from "../pages/tournament/knockout.js";
import Roundrobin, {addRoundRobinPageHandlers} from "../pages/tournament/roundrobin.js";
import LobbyRoom, {addLobbyPageHandlers, handleTournamentLobby } from "../pages/tournament/tournament_lobby.js";
import Bracket, {resetBracketState, addBracketPageHandlers, backToBracket} from "../pages/tournament/bracket.js";
import RobinRanking, {addRobinRankingPageHandlers, robinDraw, assignPointsToPlayer} from "../pages/tournament/robindraw.js";

// Mappa delle rotte
export const routes = {
    "/":Login,
    "/callback": Callback,
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
    "/tournament/roundrobin/robinranking": RobinRanking,        // lobby_data -> null
    "/tournament/roundrobin/robinranking/game": PongGame,       // lobby_data -> null
    "/tournament/roundrobin/lobby": LobbyRoom,
    "/tournament/knockout/bracket": Bracket,                    // lobby_data -> null
    "/tournament/knockout/bracket/game": PongGame,              // lobby_data -> null
    "/profile": Profile
};

export const handlerMap = {
    "/": () => {
        addLoginPageHandlers();
    },
    "/profile": () => {
        profileHandler();
    },
    "/classic": () => {
        save_global("lobby_data", null)
    },
    "/classic/lobby": () => {
        addClassicPongLobbyPageHandlers();
        handleClassicPongLobby();
    },
    "/modes": () => {
        addModesPageHandlers();
    },
    "/tournament": () => {
        addTournamentPageHandlers();
    },
    "/tournament/knockout": () => {
        addKnockoutPageHandlers();
        resetBracketState();
    },
    "/tournament/knockout/lobby": () => {
        handleTournamentLobby("knockout");
        addLobbyPageHandlers();
        resetBracketState();
    },
    "/tournament/roundrobin/lobby": () => {
        addLobbyPageHandlers();
        handleTournamentLobby("roundrobin");
    },
    "/tournament/knockout/bracket": () => {
        addBracketPageHandlers();
        if (buttonTitle === "Return from Match") {
        	//console.log("loading winner: ", winner);
            backToBracket(winner);
        }
    },
    "/tournament/roundrobin": () => {
        addRoundRobinPageHandlers();
    },
    "/tournament/roundrobin/robinranking": () => {
        addRobinRankingPageHandlers();
        if (buttonTitle === "Return from Match") {
            //console.log("loading winner winner: ", winner);
            assignPointsToPlayer(winner);
        }
        robinDraw(players);
    },
    "/settings": () => {
        addSettingsPageHandlers();
    },
    "/settings/customizepong": () => {
        addCustomizeGame();
    },
    "/settings/customizeforza4": () => {
        forza4Config();
    },
    "/userstats": () => {
        GameUserStatistics();
        gameUserStatisticsPageHandlers();
    },
    "/forza4/findopponent": () => {
        handleForza4Lobby();
        addForza4LobbyPageHandlers();
    },
    "/forza4/game": () => {
        save_global("lobby_data", null)
        startForza4Game();
    },
};
