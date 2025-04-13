import { navigate } from "../../main.js";

let boxColor = 'black';
let matchBoxPos = [];
let matchesPerRound = 8;
let matchesThisRound;
let rounds = 4;
let currentMatch = 0;
let currentRound = 0;
let firstDraw = true;
let bracketPlayers;
let bracketCanvas;
let bracketCtx;
let initialPlayersCount = 8; // Valore predefinito

export default function Bracket() {
    return `
        <img id="backImageButton" src="../../website/images/home.png" alt="Back" class="back-button">
        <h1 class="text">
            <span class="letter letter-1">T</span>
            <span class="letter letter-2">o</span>
            <span class="letter letter-3">u</span>
            <span class="letter letter-4">r</span>
            <span class="letter letter-5">n</span>
            <span class="letter letter-6">a</span>
            <span class="letter letter-7">m</span>
            <span class="letter letter-8">e</span>
            <span class="letter letter-9">n</span>
            <span class="letter letter-10">t</span>
            <span class="letter letter-11"> </span>
            <span class="letter letter-12"> </span>
            <span class="letter letter-13">B</span>
            <span class="letter letter-14">r</span>
            <span class="letter letter-15">a</span>
            <span class="letter letter-16">c</span>
            <span class="letter letter-17">k</span>
            <span class="letter letter-18">e</span>
            <span class="letter letter-19">t</span>
        </h1>
        <div id="tournamentBracket">
            <canvas id="bracketCanvas"></canvas>
        </div>
        <div class="bracket-button-container">
            <button class="button-style" id="knockoutMatchButton">Play Match</button>
        </div>
    `;
}

// Shuffle players
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function drawLine(x1, y1, x2, y2, ctx) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = 'rgb(80, 80, 80)';
    ctx.stroke();
}

function drawRectangle(x, y, width, height, player1, player2, color, ctx) {
    ctx.strokeStyle = color;
    ctx.strokeRect(x, y, width, height);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';

    const vsOffset = 1;
    const playerOffset = 15;

    ctx.font = '14px Liberty';
    ctx.textBaseline = 'bottom';
    if (player1) ctx.fillText(player1, x + width / 2, y + height / 2 - playerOffset);

    ctx.font = '12px Liberty';
    ctx.textBaseline = 'middle';
    ctx.fillText('vs', x + width / 2, y + height / 2 - vsOffset);

    ctx.font = '14px Liberty';
    ctx.textBaseline = 'top';
    if (player2) ctx.fillText(player2, x + width / 2, y + height / 2 + playerOffset);
}

function initializeBracket() {
    bracketPlayers = new Array(rounds);
    for (let i = 0; i < rounds; i++) {
        bracketPlayers[i] = new Array(initialPlayersCount);
    }
}

// Save and Load Tournament State
function saveBracketState() {
    sessionStorage.setItem('bracketState', JSON.stringify({
        bracketPlayers,
        currentRound,
        currentMatch,
        matchesThisRound,
        rounds,
        firstDraw,
        matchBoxPos,
        initialPlayersCount
    }));
}

function loadBracketState() {
    const savedState = sessionStorage.getItem('bracketState');
    if (savedState) {
        const state = JSON.parse(savedState);
        bracketPlayers = state.bracketPlayers;
        currentRound = state.currentRound;
        currentMatch = state.currentMatch;
        matchesThisRound = state.matchesThisRound;
        rounds = state.rounds;
        firstDraw = state.firstDraw;
        matchBoxPos = state.matchBoxPos || [];
        initialPlayersCount = state.initialPlayersCount;
        
        return {
            players: bracketPlayers[0],
            initialCount: initialPlayersCount
        };
    }
    return null;
}

// Main function
export function drawBracket(players) {
  

    console.log("lenngthhhh = ", players.length);
    if (!initialPlayersCount)
        initialPlayersCount = players.length;
    bracketCanvas = document.getElementById('bracketCanvas');
    bracketCtx = bracketCanvas.getContext('2d');

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    const boxWidth = screenWidth * 0.12;
    const boxHeight = screenHeight * 0.07;
    const roundGap = screenWidth * 0.2;
    const yOffset = boxHeight + 10;
    const dynamicOffset = roundGap * 0.25;

    matchesPerRound = initialPlayersCount / 2;
    rounds = Math.log2(initialPlayersCount);
    matchBoxPos = [];

    const padding = 120;
    const totalWidth = (rounds - 1) * roundGap + boxWidth + 2 * padding;
    const totalHeight = matchesPerRound * yOffset + 2 * padding;

    bracketCanvas.width = totalWidth;
    bracketCanvas.height = totalHeight;
    bracketCanvas.style.display = 'block';
    bracketCtx.font = '14px Liberty';

    let xOffset = padding;
    let yStart = padding;

    if (firstDraw) {
        firstDraw = false;
        document.getElementById('knockoutMatchButton').style.display = 'block';
        matchesThisRound = matchesPerRound;
        initializeBracket();
        bracketPlayers[0] = shuffleArray(players.slice()); // Create array players copy
    }

    matchBoxPos[0] = [];

    // Draw first round
    for (let i = 0; i < matchesPerRound; i++) {
        let x = xOffset;
        let y = yStart + yOffset * i;
        let player1 = bracketPlayers[0][i * 2];
        let player2 = bracketPlayers[0][i * 2 + 1];

        boxColor = (i === currentMatch && currentRound === 0) ? 'rgb(2, 191, 185)' : 'white';
        drawRectangle(x, y, boxWidth, boxHeight, player1, player2, boxColor, bracketCtx);
        matchBoxPos[0].push([x, y]);
    }

    xOffset += roundGap;

    // Draw other rounds
    for (let round = 1; round < rounds; round++) {
        const currentMatches = matchesPerRound / Math.pow(2, round);
        matchBoxPos[round] = [];

        for (let i = 0; i < currentMatches; i++) {
            let prevY1 = matchBoxPos[round - 1][i * 2][1];
            let prevY2 = matchBoxPos[round - 1][i * 2 + 1][1];
            let y = (prevY1 + prevY2) / 2;
            let x = xOffset;

            boxColor = (i === currentMatch && currentRound === round) ? 'rgb(2, 191, 185)' : 'white';
            
            // Show players if found
            const player1 = round < bracketPlayers.length ? bracketPlayers[round][i * 2] : undefined;
            const player2 = round < bracketPlayers.length ? bracketPlayers[round][i * 2 + 1] : undefined;
            
            drawRectangle(x, y, boxWidth, boxHeight, player1, player2, boxColor, bracketCtx);
            matchBoxPos[round].push([x, y]);

            // Draw connecting lines
            let centerX = x;
            let centerY = y + boxHeight / 2;
            let prevCenterX = x - roundGap + boxWidth;
            let prevCenterY1 = prevY1 + boxHeight / 2;
            let prevCenterY2 = prevY2 + boxHeight / 2;
            let midY = (prevCenterY1 + prevCenterY2) / 2;

            drawLine(prevCenterX, prevCenterY1, prevCenterX + roundGap / 4, prevCenterY1, bracketCtx);
            drawLine(prevCenterX, prevCenterY2, prevCenterX + roundGap / 4, prevCenterY2, bracketCtx);
            drawLine(prevCenterX + roundGap / 4, prevCenterY1, prevCenterX + roundGap / 4, prevCenterY2, bracketCtx);
            drawLine(prevCenterX + roundGap / 2 - dynamicOffset, midY, centerX, centerY, bracketCtx);
        }

        xOffset += roundGap;
    }

    saveBracketState();
}

export function resetBracketState() {
    currentMatch = 0;
    currentRound = 0;
    firstDraw = true;
    matchBoxPos = [];
    initialPlayersCount = 0;
    sessionStorage.removeItem('bracketState');
}

export function backToBracket(winner) {
    if (winner === null) {
        drawBracket(bracketPlayers[0], initialPlayersCount);
        return;
    }

    if (currentRound < rounds - 1) {
        if (!bracketPlayers[currentRound + 1]) {
            bracketPlayers[currentRound + 1] = [];
        }
        
        bracketPlayers[currentRound + 1][currentMatch] = winner;
        currentMatch++;
        
        if (currentMatch >= matchesThisRound) {
            currentMatch = 0;
            currentRound++;
            matchesThisRound = Math.floor(matchesThisRound / 2);
        }
        drawBracket(bracketPlayers[0], initialPlayersCount);
    } else {
        drawBracket(bracketPlayers[0], initialPlayersCount);
        const button = document.getElementById('knockoutMatchButton');
        if (button) {
            button.hidden = true;
            button.style.display = 'none';
        }
        
        bracketCtx.font = '30px Liberty';
        bracketCtx.fillStyle = 'white';
        bracketCtx.textAlign = 'center';
        bracketCtx.textBaseline = 'top';
        bracketCtx.fillText(`${winner} Wins the Tournament!`, bracketCanvas.width / 2, bracketCanvas.height - 110);
        
        sessionStorage.removeItem('bracketState');
    }

    saveBracketState();
}

export const addBracketPageHandlers = async () => {
    const backImageButton = document.getElementById('backImageButton');
    const knockoutMatchButton = document.getElementById('knockoutMatchButton');

    // Check if there is saved state
    const savedState = loadBracketState();
    if (savedState) {
        drawBracket(savedState.players, savedState.initialCount);
    }

    knockoutMatchButton?.addEventListener('click', () => {
        const matchPlayers = [
            bracketPlayers[currentRound][currentMatch * 2],
            bracketPlayers[currentRound][currentMatch * 2 + 1]
        ];
        
        sessionStorage.setItem("player1", matchPlayers[0]);
        sessionStorage.setItem("player2", matchPlayers[1]);
        navigate("/tournament/knockout/bracket/game", "Bracket Pong Game", matchPlayers);
    });

    backImageButton?.addEventListener('click', () => {
        sessionStorage.removeItem('bracketState');
        navigate("/modes", "Return to Game Mode");
        resetBracketState();
        bracketPlayers = [];
    });

    // Save state before unload
    window.addEventListener('beforeunload', saveBracketState);
};