import { free_users } from "../security/security.js";
import { resetMatchStatsData } from "../game/pong/data/game_stats.js";
import { navigate, reset_all_let, current_user, opponent, save_global, in_game, user_name, acess} from "../main.js";
import { showInfoModal } from "../modal.js";
import { resetBracketState } from "../pages/tournament/bracket.js";
import { addCallbackPageHandlers } from "../login/login_logic.js";

export async function check_valid_operation(path) {
    await refresh_reset();
    if (!sessionStorage.getItem('already in'))
        sessionStorage.setItem('already in', '0');
    if (!localStorage.getItem('session opened'))
        localStorage.setItem('session opened', '0');
    let session = localStorage.getItem('session opened');
    let already = sessionStorage.getItem('already in');
    if (path === '/') {
        if (await home_error(path, already, session) === 1)
            return (1);
        return (0);
    }
    else {
        if (await not_home(path, session, already) === 1)
            return (1);
        return (0);
    }
}

async function home_error(path, already, session) {
    if ((session !== '0' && session !== '1') || (already !== '0' && already !== '1'))
    {
        await remove_all(0, 0, 1);
        showInfoModal("Invalid operation detected.Resetting...", () => {});
        return (1);
    }
    if (sessionStorage.getItem('already in') === '1') {
        await remove_all(0, 0, 1);
        showInfoModal("Invalid value at HOME(\"/\")", () => {});
        return (0);
    }
    return (0);
}

async function not_home(path, session, already) {
    if ((session !== '0' && session !== '1') || (already !== '0' && already !== '1') ||
    (session === '0' && already === '1'))
    {
        await remove_all(0, 0, 1);
        showInfoModal("Invalid operation detected.Returning Home and resetting...", () => {});
        navigate("/", "home");
        return (1);
    }
    if (path === "/callback" && acess === false) {
        await addCallbackPageHandlers();
        return (1);
    }
    if (already === '0')
    {
        await remove_all(0, 0, 1);
        showInfoModal("Session invalided returning home...", () => {});
        navigate("/", "home");
        return (1);
    }
    if (in_game && path === "/tournament/knockout/lobby")
        save_global("game", null);
    if (already === '1' && session === '0')
        localStorage.setItem('session opened', 1);
    if (path === "/tournament/knockout/lobby" || path === "/tournament/roundrobin/lobby") {
        save_global("bracket", null);
        save_global("players", null);
        save_global("robinranked", null);
        resetBracketState();
    }
    if (path !== "/classic" && path !== "/forza4/game"
        && path !== "/tournament/knockout/bracket/game" && path !== "/tournament/roundrobin/robinranking/game") {
        save_global("opponent", null);
        remove_all(1, 1);
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
    if (path === "/modes") {
        resetBracketState();
        resetMatchStatsData();
    }
    if ((session === '1' && already === '0')
        || (already === '0' && session === '0')) {
        await remove_all(0, 0, 1);
        navigate("/", "home");
        showInfoModal("ERROR: accessing unauthorized page...", () => { });
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
}

export async function remove_all(session, already, all = 0) {
    if (all === 1) {
        if (current_user && (current_user.display_name || current_user.realname)) {
            if (current_user.type === "login")
                save_global("name", current_user.realname);
            else
                save_global("name", current_user.display_name);
        }
        if (current_user && user_name)
            free_users();
        reset_all_let();
        save_global("acess", false);
    }
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('session opened', session);
    sessionStorage.setItem('already in', already);
}