import { user_name, players, Player1, Player2, pong_save, opponent,
forza4_save, Bracket_state, in_game, winner, match_ended, robinranking,
numPlayers, acess, token, prev_path, loadContent,
save_global, navigate,
playerNames,
tournament
} from "../main.js";
import { resetBracketState } from "../pages/tournament/bracket.js";
import { showInfoModal } from "../modal.js";
import { remove_all } from "./error_main.js";
import { reset_all } from "../pages/tournament/robindraw.js";

function to_string(name, value, isjson) {
    if (typeof value === "object" && value !== null && isjson)
        sessionStorage.setItem(name, JSON.stringify(value));
    else
        sessionStorage.setItem(name, value);
}

export function save_at_exit() {
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
    if (token)
        to_string("token", token, false);
    if (tournament)
        to_string("tournament", tournament, false);
    if (prev_path)
        to_string("prev_path", prev_path, false);
    if (playerNames)
        to_string("PlayerName", playerNames, true);
}

function reset_tournament_data()
{
    save_global("bracket", null);
    save_global("robinranked", null);
    save_global("game", 0);
    save_global("tournament", null);
    
    resetBracketState();
}

export async function handle_popstate()
{
    const path = window.location.pathname;

    if (prev_path === "/modes" && (path === "/" || path === "/callback"))
    {
        await remove_all(0, 0, 1);
        if (path !== "/")
            navigate("/", "home");
        showInfoModal("you have quitted the active session", () => { });
    }
    if (prev_path === "/" && path === "/callback")
    {
        await remove_all(0, 0, 1);
        showInfoModal("i can't let you do this sorry", () => {});
        navigate("/", "home");
    }
    if (in_game === 1 && path !== '/tournament/knockout/bracket/game'
    && path !== '/tournament/knockout/bracket' && path !== "/tournament/roundrobin/robinranking"
    && path !== "/tournament/roundrobin/robinranking/game") {
        reset_tournament_data();
        showInfoModal("you successfully exited the game", () => { });
        await loadContent();
        return;
    }
    if ((path === "/tournament/knockout/bracket" || path === "/tournament/roundrobin/robinranking/game"
    || path === "/tournament/knockout/bracket/game" || path === "/tournament/roundrobin/robinranking")
    && match_ended !== 1) {
        reset_tournament_data();
        navigate("/modes", "Return to Game Mode", true);
        showInfoModal("Leaving Tournament...", () => { });
        return;
    }
    if (match_ended === 1 && (path === "/tournament/knockout/bracket/game" || 
    path === "/tournament/roundrobin/robinranking/game")) {
        reset_tournament_data();
        navigate("/modes", "Return to Game Mode");
        showInfoModal("You finised the tournament yay");
        return;
    }
    await loadContent();
}