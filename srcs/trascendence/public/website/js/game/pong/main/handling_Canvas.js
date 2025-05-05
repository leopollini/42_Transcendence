import { startPongGame, PongGame } from "./pong.js";
import { current_user} from "../../../main.js";
import { showInfoModal } from "../../../modal.js";
let gameInstance;

export function initializeGameCanvas() {
    //console.log("Inizializzazione game canvas");
    const path = window.location.pathname;
    let players_single;

    //console.log("PATH =>" +path);
    const gameCanvas = document.getElementById('gameCanvas');
    if (!gameCanvas) {
        showInfoModal("Canvas non trovato nel DOM!");
        return;
    }
    gameCanvas.width = window.innerWidth;
    gameCanvas.height = window.innerHeight;
    gameCanvas.style.display = "block";

    if (current_user)
    {
        setTimeout(() => {
            if (path === "/VS_AI") {
                players_single = [current_user.display_name, "AI"];
                startPongGame("ai");
            } 
            else if (path === "/classic") {
                startPongGame("classic");
            }
            else {
                //players = JSON.parse(sessionStorage.getItem('matchPlayers')) || ["Player 1", "Player 2"];
                //console.log("inizio partita torneo => "+ matchPlayers);
                const mode = path.includes("knockout") ? "knockout" : "roundrobin";
                startPongGame(mode);
            }
            
            gameInstance = new PongGame();
            gameInstance.start();
        }, 50);
    }
}