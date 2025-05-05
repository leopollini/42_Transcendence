import { Bracket_state, in_game, navigate, save_global, players, match_ended, winner} from "../../main.js";
import { showInfoModal } from "../../modal.js";
import { reset_tournament_data } from "../../utils_main/listener_Compacter.js";
import { sendMessage, socket } from "../live-chat/socketHandler.js";
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
            <button class="button-style down" id="knockoutMatchButton">Play Match</button>
        </div>
    `;
}

// Shuffle players
/*function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}*/

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
    const playerOffset = 5;

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


function loadBracketState()
{
    //const savedState = sessionStorage.getItem('bracketState');
    const savedState = Bracket_state;
    if (savedState) {
        //const state = JSON.parse(savedState);
        const state = savedState;
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

function give_data()
{
    let Bracket_data =
    {
        bracketPlayers,
        currentRound,
        currentMatch,
        matchesThisRound,
        rounds,
        firstDraw,
        matchBoxPos,
        initialPlayersCount
    }
    return Bracket_data;
}

// Main function
export function drawBracket(match_players) {
    if (!initialPlayersCount)
        initialPlayersCount = match_players.length;
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
        bracketPlayers[0] = match_players.slice(); // Create array match_players copy
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
            
            // Show match_players if found
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

    save_global("bracket", give_data())
}

export function resetBracketState() {
    currentMatch = 0;
    currentRound = 0;
    firstDraw = true;
    matchBoxPos = [];
    initialPlayersCount = 0;
    save_global("bracket", null);
}



function send_request_to_players()
{
    sendMessage({
        type: "match_request",
        to: bracketPlayers[currentRound][currentMatch * 2],
        mode: "tournament match"
    });
    sendMessage({
        type: "match_request",
        to: bracketPlayers[currentRound][currentMatch * 2 + 1],
        mode: "tournament match"
    });
}

function you_win(match_winner)
{
    drawBracket(bracketPlayers[0], initialPlayersCount);
    const button = document.getElementById('knockoutMatchButton');
    if (button) {
        button.hidden = true;
        button.style.display = 'none';
    }
    save_global("end", 1)
    bracketCtx.font = '30px Liberty';
    bracketCtx.fillStyle = 'white';
    bracketCtx.textAlign = 'center';
    bracketCtx.textBaseline = 'top';
    bracketCtx.fillText(`${match_winner} Wins the Tournament!`, bracketCanvas.width / 2, bracketCanvas.height - 110);
}

export function backToBracket(match_winner) {
    //console.log("bracketPlayers ", bracketPlayers);
    if (match_winner === null) {
        drawBracket(bracketPlayers[0], initialPlayersCount);
        return;
    }
    /*console.log("last match was won by ", match_winner);
    console.log("current round", currentRound, "; rounds", rounds);*/
    if (currentRound < rounds - 1) {
        if (!bracketPlayers[currentRound + 1]) {
            bracketPlayers[currentRound + 1] = [];
        }
        
        bracketPlayers[currentRound + 1][currentMatch] = match_winner;
        currentMatch++;
        
        if (currentMatch >= matchesThisRound) {
            currentMatch = 0;
            currentRound++;
            matchesThisRound = Math.floor(matchesThisRound / 2);
        }
        drawBracket(bracketPlayers[0], initialPlayersCount);

        send_request_to_players();
    }
    else
        you_win(match_winner);
    save_global("bracket", give_data());
}

export const addBracketPageHandlers = async () => {
    const backImageButton = document.getElementById('backImageButton');
    const knockoutMatchButton = document.getElementById('knockoutMatchButton');
    // Check if there is saved state
    const savedState = loadBracketState();
    if (in_game !== 1 && window.location.pathname)
    {
        reset_tournament_data();
        return (1);
    }
    if (match_ended === 1)
    {
        you_win(winner);
        return;
    }
    if (savedState)
        drawBracket(savedState.players, savedState.initialCount);
    else
        drawBracket(players);
    knockoutMatchButton?.addEventListener('click', () => {
        const matchPlayers = [
            bracketPlayers[currentRound][currentMatch * 2],
            bracketPlayers[currentRound][currentMatch * 2 + 1]
        ];
        save_global("p1", matchPlayers[0]);
        save_global("p2", matchPlayers[1]);
        navigate("/tournament/knockout/bracket/game", "Bracket Pong Game", matchPlayers);
    });

    backImageButton?.addEventListener('click', () => {
        navigate("/modes", "Return to Game Mode");
        if (match_ended === 1)
            showInfoModal("You finished the tournament!");
        reset_tournament_data();
        resetBracketState();
        bracketPlayers = [];
    });
};