import { free_users } from "../security/security.js";
import { resetMatchStatsData } from "../game/pong/data/game_stats.js";
import { navigate, reset_all_let, token, current_user, opponent, save_global, in_game, acess, invalid } from "../main.js";
import { showInfoModal } from "../modal.js";
import { resetBracketState } from "../pages/tournament/bracket.js";
import { addCallbackPageHandlers } from "../login/login_logic.js";
import { reset_tournament_data } from "./listener_Compacter.js";
import { closeSocket } from "../pages/live-chat/socketHandler.js";
import { change_name, update_image } from "../pages/modes.js";

export async function check_valid_operation(path) {
    await refresh_reset();
    if (invalid === 1 && path === "/") {
        showInfoModal("Error: Session lost", () => { });
        save_global("invalid", 0);
        navigate("/", "home");
        return (1);
    }
    if (path !== '/') {
        if (await not_home(path) === 1)
            return (1);
    }
    return (0);
}

async function not_home(path) {
    if (path === "/callback" && acess === false) {
        await addCallbackPageHandlers();
        return (1);
    }
    if (in_game && path === "/tournament/knockout/lobby")
        save_global("game", null);
    if (path === "/tournament/knockout/lobby" || path === "/tournament/roundrobin/lobby") {
        save_global("bracket", null);
        save_global("players", null);
        save_global("robinranked", null);
        resetBracketState();
    }
    if (path === "/modes") {
        resetBracketState();
        resetMatchStatsData();
        save_global("lobby_data", null);
        save_global("numP", null);
        change_name(current_user.display_name);
        update_image(current_user.image);
    }
    if (path !== "/classic" && path !== "/forza4/game"
        && path !== "/tournament/knockout/bracket/game" && path !== "/tournament/roundrobin/robinranking/game") {
        reset_tournament_data();
    }
    if (!opponent && (path === "/classic" || path === "/forza4/game")) {
        navigate("/modes", "return to modes");
        showInfoModal("the operation you are doing is forbidden", () => { });
        return (1);
    }
    if (in_game === 0 && (path === "/tournament/roundrobin/robinranking/game" ||
        path === "/tournament/knockout/bracket/game" || path === "/tournament/knockout/bracket" ||
        path === "/tournament/roundrobin/robinranking")) {
        navigate("/modes", "modes");
        showInfoModal("the operation you are doing is forbidden", () => { });
        return (1);
    }
    if (acess === false && !token) {
        showInfoModal("ERROR: accessing unauthorized page...", () => { });
        await remove_all();
        return (1);
    }
    return (0);
}

async function refresh_reset() {
    if (sessionStorage.getItem("user_name")) {
        save_global("name", sessionStorage.getItem("user_name"));
        sessionStorage.removeItem("user_name");
    }
    if (sessionStorage.getItem("PlayerName")) {
        save_global("PlayerName", sessionStorage.getItem("PlayerName"));
        sessionStorage.removeItem("PlayerName");
    }
    if (sessionStorage.getItem("prev_path")) {
        save_global("prev_path", sessionStorage.getItem("prev_path"));
        sessionStorage.removeItem("prev_path");
    }
    if (sessionStorage.getItem("pongData")) {
        save_global("pong", sessionStorage.getItem("pongData"));
        sessionStorage.removeItem("pongData");
    }
    if (sessionStorage.getItem("opponent")) {
        save_global("opponent", sessionStorage.getItem("opponent"));
        sessionStorage.removeItem("opponent");
    }
    if (sessionStorage.getItem("persist")) {
        save_global("persist", sessionStorage.getItem("persist"));
        sessionStorage.removeItem("persist");
    }
    if (sessionStorage.getItem("forza4Data")) {
        save_global("forza4", sessionStorage.getItem("forza4Data"));
        sessionStorage.removeItem("forza4Data");
    }
    if (sessionStorage.getItem("player1")) {
        save_global("p1", sessionStorage.getItem("player1"));
        sessionStorage.removeItem("player1");
    }
    if (sessionStorage.getItem("player2")) {
        save_global("p2", sessionStorage.getItem("player2"));
        sessionStorage.removeItem("player2");
    }
    if (sessionStorage.getItem("bracketState")) {
        save_global("bracket", sessionStorage.getItem("bracketState"));
        sessionStorage.removeItem("bracketState");
    }
    if (sessionStorage.getItem("invalid")) {
        save_global("invalid", sessionStorage.getItem("invalid"));
        sessionStorage.removeItem("invalid");
    }
    if (sessionStorage.getItem("game")) {
        save_global("game", sessionStorage.getItem("game"));
        sessionStorage.removeItem("game");
    }
    if (sessionStorage.getItem("token")) {
        save_global("token", sessionStorage.getItem("token"));
        sessionStorage.removeItem("token");
    }
    if (sessionStorage.getItem("winner")) {
        save_global("winner", sessionStorage.getItem("winner"));
        sessionStorage.removeItem("winner");
    }
    if (sessionStorage.getItem("players")) {
        save_global("players", sessionStorage.getItem("players"));
        sessionStorage.removeItem("players");
    }
    if (sessionStorage.getItem("end")) {
        save_global("end", sessionStorage.getItem("end"));
        sessionStorage.removeItem("end");
    }
    if (sessionStorage.getItem("robinranked")) {
        save_global("robinranked", sessionStorage.getItem("robinranked"));
        sessionStorage.removeItem("robinranked");
    }
    if (sessionStorage.getItem("numP")) {
        save_global("numP", sessionStorage.getItem("numP"));
        sessionStorage.removeItem("numP");
    }
    if (sessionStorage.getItem("acess")) {
        save_global("acess", sessionStorage.getItem("acess"));
        sessionStorage.removeItem("acess");
    }
    if (sessionStorage.getItem("lobby_data")) {
        save_global("lobby_data", sessionStorage.getItem("lobby_data"));
        sessionStorage.removeItem("lobby_data");
    }
    if (sessionStorage.getItem("user")) {
        save_global("user", sessionStorage.getItem("user"));
        sessionStorage.removeItem("user");
    }
}

export async function remove_all() {
    console.log("path: ", window.location.pathname);
    closeSocket();
    if (current_user && (current_user.display_name || current_user.realname)) {
        if (current_user.type === "login")
            save_global("name", current_user.realname);
        else
            save_global("name", current_user.display_name);
    }
    if (token)
        free_users();
    reset_all_let();
    if (window.location.pathname !== "/")
        navigate("/", "home");
}