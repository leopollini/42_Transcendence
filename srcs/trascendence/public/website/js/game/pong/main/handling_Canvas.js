import { startPongGame, PongGame } from "./pong.js";
import { current_user } from "../../../pages/modes.js";
let gameInstance;

// Funzione per aggiungere il canvas di gioco
export function initializeGameCanvas(matchPlayers) {
    console.log("Inizializzazione game canvas");
    const path = window.location.pathname;
    let players;

    const gameCanvas = document.getElementById('gameCanvas');
    if (!gameCanvas) {
        console.error("Canvas non trovato nel DOM!");
        return;
    }
    console.log("user = ", current_user);   
    gameCanvas.width = window.innerWidth;
    gameCanvas.height = window.innerHeight;
    gameCanvas.style.display = "block";

    if (current_user)
    {
        setTimeout(() => {
            if (path === "/V.S._AI") {
                players = [current_user.display_name, "AI"];
                startPongGame(players, "ai");
            } 
            else if (path === "/classic") {
                startPongGame(matchPlayers, "classic");
            }
            else {
                players = JSON.parse(sessionStorage.getItem('matchPlayers')) || ["Player 1", "Player 2"];
                const mode = path.includes("knockout") ? "knockout" : "roundrobin";
                startPongGame(players, mode);
            }
            
            gameInstance = new PongGame();
            gameInstance.start();
        }, 50);
    }
}