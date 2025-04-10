import { Star } from "../elements/star.js";
import { pongGameData } from "../main/pong.js";
export function createStarsBackground(game, count) {
    for (let i = 0; i < count; i++) {
        const star = new Star(game, game.canvas, game.ctx);
        game.stars.push(star);
    }
}

export function renderBackground(game) {
    // Walls

    if (pongGameData.background == "pingpong") {
        // Background
        game.ctx.fillStyle = "#1d8819";
        game.ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
        game.ctx.fillStyle = "white";
        game.ctx.fillRect(game.wallThickness, game.canvas.height / 2, game.canvas.width - game.wallThickness, game.wallThickness);
        game.ctx.fillRect(game.canvas.width / 2, game.wallThickness, game.wallThickness, game.canvas.height - game.wallThickness);
    }

    if (pongGameData.background == "classic") {
        game.ctx.fillStyle = game.wallsColor;
        // Draw vertical dashed line
        for (let y = game.wallThickness; y < game.canvas.height - game.wallThickness; y += 50) {
            game.ctx.fillRect(game.canvas.width / 2, y, game.wallThickness, 30);
        }
    }
    game.ctx.fillStyle = game.wallsColor;
    game.ctx.shadowColor = game.wallsColor;
    game.ctx.shadowBlur = 10;
    game.ctx.fillRect(game.wallThickness, 0, game.canvas.width - game.wallThickness, game.wallThickness);
    game.ctx.fillRect(game.wallThickness, game.canvas.height - game.wallThickness, game.canvas.width - game.wallThickness, game.wallThickness);
    game.ctx.fillRect(0, 0, game.wallThickness, game.canvas.height);
    game.ctx.fillRect(game.canvas.width - game.wallThickness, 0, game.wallThickness, game.canvas.height);
}