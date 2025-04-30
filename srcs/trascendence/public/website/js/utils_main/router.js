import { buttonTitle, playerNames, winner} from "../main.js";
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
import LobbyRoom, {addLobbyPageHandlers, handleLobby } from "../pages/tournament/tournament_lobby.js";
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
    "/tournament/roundrobin/robinranking": RobinRanking,
    "/tournament/roundrobin/robinranking/game": PongGame,
    "/tournament/roundrobin/lobby": LobbyRoom,
    "/tournament/knockout/bracket": Bracket,
    "/tournament/knockout/bracket/game": PongGame,
    "/profile": Profile
};

export const handlerMap = {
    "/": () => {
        addLoginPageHandlers();
    },
    "/profile": () => {
        profileHandler();
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
        handleLobby("Bracket");
        addLobbyPageHandlers();
        resetBracketState();
    },
    "/tournament/roundrobin/lobby": () => {
        addLobbyPageHandlers();
        handleLobby("Robin");
    },
    "/tournament/knockout/bracket": () => {
        addBracketPageHandlers();
        if (buttonTitle === "Return from Match") backToBracket(winner);
    },
    "/tournament/roundrobin": () => {
        addRoundRobinPageHandlers();
    },
    "/tournament/roundrobin/robinranking": () => {
        addRobinRankingPageHandlers();
        if (buttonTitle === "Return from Match") assignPointsToPlayer(winner);
        robinDraw(playerNames);
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
        //pongShowMatchDetails();
        gameUserStatisticsPageHandlers();
    },
    "/forza4/findopponent": () => {
        handleForza4Lobby();
        addForza4LobbyPageHandlers();
    },
    "/forza4/game": () => {
        startForza4Game();
    },
};
