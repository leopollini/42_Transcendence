import { startPongGame, PongGame } from "./pong.js";
import { current_user } from "../../../main.js";
let gameInstance;

export function initializeGameCanvas(matchPlayers) {
    console.log("Inizializzazione game canvas");
    const path = window.location.pathname;
    let players;

    console.log("PATH =>" +path);
    const gameCanvas = document.getElementById('gameCanvas');
    if (!gameCanvas) {
        console.error("Canvas non trovato nel DOM!");
        return;
    }
    gameCanvas.width = window.innerWidth;
    gameCanvas.height = window.innerHeight;
    gameCanvas.style.display = "block";

    if (current_user)
    {
        setTimeout(() => {
            if (path === "/VS_AI") {
                players = [current_user.display_name, "AI"];
                startPongGame(players, "ai");
            } 
            else if (path === "/classic") {
                startPongGame(matchPlayers, "classic");
            }
            else {
                //players = JSON.parse(sessionStorage.getItem('matchPlayers')) || ["Player 1", "Player 2"];
                console.log("inizio partita torneo => "+matchPlayers);
                const mode = path.includes("knockout") ? "knockout" : "roundrobin";
                startPongGame(matchPlayers, mode);
            }
            
            gameInstance = new PongGame();
            gameInstance.start();
        }, 50);
    }
}