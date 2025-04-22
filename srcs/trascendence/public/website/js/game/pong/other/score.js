import { matchData } from "../data/game_global.js";
export function checkScore(game) {
    if (game.scoreP1 >= game.maxScore || game.scoreP2 >= game.maxScore) {
        game.gameEnd = true;
        //game.running = false;
        if (game.ball.hits > matchData.longestRally)
            matchData.longestRally = game.ball.hits;
        if (game.scoreP1 > game.scoreP2) 
            game.winner = game.p1Name;
        else 
            game.winner = game.p2Name;
        
        if (window.location.pathname === "/classic" || window.location.pathname === "/VS_AI")
        {
            backToMenuButton.style.display = "block";
            backToMenuButton.hidden = false;
        }
        else if (window.location.pathname === "/tournament/roundrobin/robinranking/game")
            backToRobinButton.style.display = "block";
        else if (window.location.pathname === "/tournament/knockout/bracket/game")
            backToBracketButton.style.display = "block";

        game.ui.render(game, game.scoreP1, game.scoreP2); 
    }
}