import { save_global, current_user, buttonTitle, players, numPlayers, acess } from "../main.js";
import { check_valid_operation } from "./error_main.js";
import { initializeGameCanvas } from "../game/pong/main/handling_Canvas.js";
import { userName } from "../pages/user_data.js";
import { check_change } from "./listener_Compacter.js";
import { restore_user} from "../login/user.js";

const gamePaths = [
    "/classic",
    "/VS_AI",
    "/tournament/knockout/bracket/game",
    "/tournament/roundrobin/robinranking/game"
];

function createPlayersArray(numPlayers) {
    return Array.from({ length: numPlayers }, (_, i) =>
        i === 0 ? userName : `Player ${i + 1}`
    );
}

export function set_prev_path() {
    let path = window.location.pathname;
    let result = null;
    if (path === "/modes")
    result = "/modes";
    if (!result)
        result = "/";
    return path;
}

export async function util_main(path, component, app) {
    if (await check_valid_operation(path, component) === 1)
        return (-2);
    if (window.location.pathname !== "/") 
        save_global("user", await restore_user());
    setInterval(check_change, 100);

    if (/^Robin[4-8]$/.test(buttonTitle) || /^Bracket(4|8|16)$/.test(buttonTitle))
        save_global("numP", parseInt(buttonTitle.replace(/\D/g, ""), 10));
    if (!players)
        save_global("players", createPlayersArray(numPlayers));
    save_global("PlayerName", players);
    if (component) {
        app.innerHTML = component();
        if (gamePaths.includes(path)) {
            //console.log("playerzzzz2: " + players);
            save_global("game", 1);
            initializeGameCanvas();
            document.getElementById('app').classList.add('no-background');
        }
        else
            document.getElementById('app').classList.remove('no-background');
    }
    return 0;
}