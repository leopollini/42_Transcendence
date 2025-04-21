import { free_users } from "./security/security.js";
import { resetMatchStatsData } from "./game/pong/data/game_stats.js";
import {nullify_user, navigate, reset_all_let, current_user,opponent, save_global,in_game, user_name} from "./main.js";
import { showInfoModal } from "./modal.js";
import { resetBracketState } from "./pages/tournament/bracket.js";
import { addCallbackPageHandlers } from "./login/login_logic.js";

function reset_value(path) {
    let session = localStorage.getItem('session opened');
    let already = sessionStorage.getItem('already in');
    if (in_game && path === "/tournament/knockout/lobby")
        save_global("game", null);
    if (!already) {
        sessionStorage.setItem('already in', '0');
        already = '0';
    }
    if (!session) {
        localStorage.setItem('session opened', '0');
        session = '0';
    }
    if (already === '1' && session === '0')
        localStorage.setItem('session opened', 1);
    /* if ((already !== '1' && already !== '0') || (session !== '1' && session !== '0')) {
        if (path !== '/') {
            navigate("/", "home");
            remove_all(0, 0, 1);
        }
        remove_all(0, 0);
        showInfoModal("Error: Operation uniavable,quitting session...");
    } */
}

export function remove_all(session, already, all) {
    if (all === 1) {
        if (current_user && (current_user.display_name || current_user.realname)) {
            if (current_user.type === "login")
                save_global("name", current_user.realname);
            else
                save_global("name", current_user.display_name);
        }
        reset_all_let();
        save_global("acess", false);
        if (current_user && user_name)
            free_users();
        nullify_user();
    }
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('session opened', session);
    sessionStorage.setItem('already in', already);
}

export async function check_valid_operation(path) {
    reset_value(path);
    refresh_reset(path);
    if (path === "/callback")
    {   
        await addCallbackPageHandlers();
        return (1);
    }
    if (path === "/tournament/knockout/lobby" || path === "/tournament/roundrobin/lobby") {
        save_global("bracket", null);
        save_global("players", null);
        save_global("robinranked", null);
        resetBracketState();
    }
    if (sessionStorage.getItem('already in') === '1' && path === "/") {
        remove_all(0, 0, 1);
        return (0);
    }
    else if (path !== '/') {
        if (continue_error_check(path) === 1)
            return (1);
    }
    if (await cont_check(path) === 1)
        return (1);
    if (path !== "/" && path !== "/classic" && path !== "/forza4/game"
    && path !== "/tournament/knockout/bracket/game" && path !== "/tournament/roundrobin/robinranking/game") {
        save_global("opponent", null);
        remove_all(1, 1);
    }
    return (0);
}

function refresh_reset(path) {
    if (sessionStorage.getItem("user_name")) {
        save_global("name", sessionStorage.getItem("user_name"));
        sessionStorage.removeItem("user_name");
    }
    if (path !== '/') {
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
}

async function cont_check(path) {
    if (!opponent && (path === "/classic" || path === "/forza4/game")) {
        navigate("/modes", "return to modes");
        showInfoModal("the operation you are doing is forbidden", () => { });
        return (1);
    }
    if (path === "/modes") {
        resetBracketState();
        resetMatchStatsData();
        save_global("game", null);
    }
    return (0);
}

function continue_error_check(path) {
    let session = localStorage.getItem('session opened');
    let already = sessionStorage.getItem('already in');
    if ((session === '1' && already === '0')
    || (already === '0' && session === '0')) {
        remove_all(0, 0, 1);
        showInfoModal("ERROR: accessing unauthorized page...", () => { });
        navigate("/", "home");
        return (1);
    }
}
