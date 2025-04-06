import { navigate } from "../main.js";
import { userName } from "./user_data.js";
import { formatTime } from "../game/pong/other/timer.js";
import { showCharts } from "./tournament/charts.js";
import { showInfoModal } from "../modal.js";

let wins = 0;
let losses = 0;
let ties = 0;
let f4UserData;
let pongUserData;

export function GameUserStatistics() {
    return `
        <img id="backImageButton" src="../website/images/home.png" alt="Back" class="back-button">
        <h1 class="text h1_margin">
            <span class="letter letter-1">G</span>
            <span class="letter letter-2">a</span>
            <span class="letter letter-3">m</span>
            <span class="letter letter-4">e</span>
            <span class="letter letter-5"> </span>
            <span class="letter letter-6"> </span>
            <span class="letter letter-7">S</span>
            <span class="letter letter-8">t</span>
            <span class="letter letter-9">a</span>
            <span class="letter letter-10">t</span>
            <span class="letter letter-11">i</span>
            <span class="letter letter-12">s</span>
            <span class="letter letter-13">t</span>
            <span class="letter letter-14">i</span>
            <span class="letter letter-15">c</span>
            <span class="letter letter-16">s</span>
        </h1>
        

        <div id="gameUserStats">
            <div class="stats-switcher">
                <label class="gamestats-label">
                    <input type="radio" id="pongChartsCheckbox" name="gamestats" class="gamestats-checkbox" />
                    <span class="gamestats-text">Pong Charts</span>
                </label>
                <label class="gamestats-label">
                    <input type="radio" id="pongMatchesCheckbox" name="gamestats" class="gamestats-checkbox" checked />
                    <span class="gamestats-text">Pong Matches</span>
                </label>
                <label class="gamestats-label">
                    <input type="radio" id="forza4StatsCheckbox" name="gamestats" class="gamestats-checkbox" />
                    <span class="gamestats-text">Forza4 Stats</span>
                </label>
                <label class="gamestats-label">
                    <input type="radio" id="forza4MatchesCheckbox" name="gamestats" class="gamestats-checkbox"  />
                    <span class="gamestats-text">Forza4 Matches</span>
                </label>
            </div>

            <div class="stats-content-container">

                <!-- Sezione statistiche Forza4 -->
                <div class="stats-card hidden1" id="forza4StatsSection">
                    <dl class="stats-grid">
                        <div class="stat-item">
                            <dt>Total matches played:</dt>
                            <dd id="totalMatches" aria-live="polite">-</dd>
                        </div>
                         <div class="stat-item">
                            <dt>Points:</dt>
                            <dd id="points" aria-live="polite">-</dd>
                        </div>
                        <div class="stat-item">
                            <dt>Wins:</dt>
                            <dd id="totalWins" aria-live="polite">-</dd>
                        </div>
                        <div class="stat-item">
                            <dt>Losses:</dt>
                            <dd id="totalLosses" aria-live="polite">-</dd>
                        </div>
                        <div class="stat-item">
                            <dt>Ties:</dt>
                            <dd id="totalTies" aria-live="polite">-</dd>
                        </div>
                        <div class="stat-item">
                            <dt>Victory Rate:</dt>
                            <dd id="victoryRate" aria-live="polite">-</dd>
                        </div>
                        <div class="stat-item">
                            <dt>Average Moves:</dt>
                            <dd id="averageMoves" aria-live="polite">-</dd>
                        </div>
                        <div class="stat-item">
                            <dt>Average Time:</dt>
                            <dd id="averageTime" aria-live="polite"><time datetime="PT0M0S">-</time></dd>
                        </div>
                    </dl>
                </div>

                <!-- Sezione charts Pong -->
                <div class="stats-card hidden1" id="pongChartsSection">
                    <div id="noMatchesMessage" class="no-matches-message">
                        <h2>No matches played</h2>
                    </div>
                    <div class="charts-container">
                        <div class="chart-item"><canvas id="matchLongestRallyChart"></canvas></div>
                        <div class="chart-item"><canvas id="winLossChart"></canvas></div>
                        <div class="chart-item">
                            <h2>Matches Played</h2>
                            <h1 id="matchesPlayed"></h1>
                            <h2>Average Match Duration</h2>
                            <h1 id="avgMatchTime"></h1>
                            <h2>Points</h2>
                            <h1 id="rankPointsLabel"></h1>
                        </div>
                        <div class="chart-item"><canvas id="xpProgressChart"></canvas></div>
                    </div>
                </div>

                <!-- Sezione Match History -->
                <div id="f4MatchDetailsContainer" class="hidden1">
                    <!-- I dettagli delle partite forza 4 verranno inseriti qui -->
                </div>
                <div id="pongMatchDetailsContainer" class="visible">
                    <!-- I dettagli delle partite pong verranno inseriti qui -->
                </div>
            </div>
        </div>
    `;
}

async function forza4CalculateUserStatistics() {

    let totalMoves;
    let totalTime;
    wins = 0;
    losses = 0;
    ties = 0;


    try {
        const response = await fetch("http://localhost:8008", {
            method: "get_f4_games",
            body: JSON.stringify({
            realname: userName,
            }),
        });
        const data = await response.json();
        //console.log("Get Pong Game response: ", data);
        if (data.games) {
            f4UserData = data.games;
            //console.log("f4UserData aggiornata: ", f4UserData);
        }
    } catch (error) {
    console.error("Fetch error:", error);
    }

    if (!f4UserData) {
        return null;
    }
      totalMoves = 0;
      totalTime = 0;
      f4UserData.forEach(game => {
        if (game.player1 === userName || game.player2 === userName) {
            if (game.winner === userName)
                wins++;
            else if (game.winner === 'tie') 
                ties++;
            else
                losses++;
            totalMoves += Number(game.moves);
            totalTime += Number(game.begin_time);
        }
    });
    const totalMatches = wins + losses + ties;
    const totalWins = wins || 0;
    const totalLosses = losses || 0;
    const totalTies = ties || 0;

    const victoryRate = totalMatches > 0 ? ((totalWins / totalMatches) * 100).toFixed(2) : 0;

    let rankPoints = totalMatches + (totalWins * 10) - (totalLosses * 5);
    if (rankPoints < 0)
        rankPoints = 0;

    const averageMoves = totalMatches > 0 ? (totalMoves / totalMatches).toFixed(1) : 0;
    
    //console.log("total time = " +totalTime);
    const averageTime = totalMatches > 0 ? (totalTime / totalMatches).toFixed(2) : 0;
    //console.log("average time = " + averageTime);

    return {
        totalMatches,
        totalWins,
        totalLosses,
        totalTies,
        victoryRate,
        rankPoints,
        averageMoves,
        averageTime,
    };
}


export async function forza4ShowUserStatistics() {
    const stats = await forza4CalculateUserStatistics();

    if (!stats) {
        showInfoModal("No statistics available for this player.", () => {});
        return;
    }

    //console.log("stats total matches" + stats.totalMatches);

    // Popola il template con i dati
    document.getElementById('totalMatches').textContent = stats.totalMatches;
    document.getElementById('totalWins').textContent = stats.totalWins;
    document.getElementById('totalLosses').textContent = stats.totalLosses;
    document.getElementById('totalTies').textContent = stats.totalTies;
    document.getElementById('victoryRate').textContent = stats.victoryRate + '%';
    document.getElementById('averageMoves').textContent = stats.averageMoves;
    document.getElementById('averageTime').textContent = formatTime(stats.averageTime);
    document.getElementById('points').textContent = stats.rankPoints; 

}

export function forza4ShowMatchDetails() {
    const f4MatchDetailsContainer = document.getElementById("f4MatchDetailsContainer");
    
    f4MatchDetailsContainer.textContent = "";

    if (f4UserData && f4UserData.length > 0) {
        f4UserData.forEach(match => {
            const opponent = match.player1 === userName ? match.player2 : match.player1;
            const isWinner = match.winner === userName;
            let resultText;
            let resultClass;

            let isTie = false;
            if (match.winner === 'tie') {
                isTie = true;
                resultText = "Tie";
                resultClass = "tie";
            } else {
                resultText = isWinner ? "Victory" : "Defeat";
                resultClass = isWinner ? "win" : "loss";
            }

            const matchTime = formatTime(match.begin_time);

           
            const matchCard = document.createElement('div');
            matchCard.classList.add('match-card', 'collapsed');

            const matchSummary = document.createElement('div');
            matchSummary.classList.add('match-summary', resultClass);

            const playersDiv = document.createElement('div');
            playersDiv.classList.add('players');
            playersDiv.textContent = `${userName} vs ${opponent}`;

            const matchInfoDiv = document.createElement('div');
            matchInfoDiv.classList.add('match-info');

            const resultSpan = document.createElement('span');
            resultSpan.classList.add('result');
            resultSpan.textContent = resultText;

            matchInfoDiv.appendChild(resultSpan);
            matchSummary.appendChild(playersDiv);
            matchSummary.appendChild(matchInfoDiv);

           
            const matchDetails = document.createElement('div');
            matchDetails.classList.add('match-details');

            const movesItem = document.createElement('div');
            movesItem.classList.add('detail-item');
            const movesSpan = document.createElement('span');
            movesSpan.textContent = `Moves:`;
            const movesValueSpan = document.createElement('span');
            movesValueSpan.textContent = match.moves;
            movesItem.appendChild(movesSpan);
            movesItem.appendChild(movesValueSpan);

            const durationItem = document.createElement('div');
            durationItem.classList.add('detail-item');
            const durationSpan = document.createElement('span');
            durationSpan.textContent = `Duration:`;
            const durationValueSpan = document.createElement('span');
            durationValueSpan.textContent = matchTime;
            durationItem.appendChild(durationSpan);
            durationItem.appendChild(durationValueSpan);

            matchDetails.appendChild(movesItem);
            matchDetails.appendChild(durationItem);

            matchCard.appendChild(matchSummary);
            matchCard.appendChild(matchDetails);

           
            f4MatchDetailsContainer.appendChild(matchCard);
        });

       
        document.querySelectorAll('.match-card').forEach(card => {
            card.addEventListener('click', function() {
                this.classList.toggle('collapsed');
            });
        });
    }
    else
    {
        f4MatchDetailsContainer.textContent = '';

        const p = document.createElement('p');
        p.classList.add('no-matches');
        p.textContent = 'No matches found';
        f4MatchDetailsContainer.appendChild(p);
    }

}



async function getPongMatchesData() {
    try {
        const response = await fetch("http://localhost:8008", {
            method: "get_pong_games",
            body: JSON.stringify({
            realname: userName,
            }),
        });
        const data = await response.json();
        //console.log("Get Pong Game response: ", data);
        if (data.games) {
            pongUserData = data.games;
            //console.log("f4UserData aggiornata: ", pongUserData);
        }
    } catch (error) {
    console.error("Fetch error:", error);
    }
}

export async function pongShowMatchDetails() {
    const pongMatchDetailsContainer = document.getElementById("pongMatchDetailsContainer");
    
    await getPongMatchesData();

    if (!pongUserData) {
        return null;
    }

    pongMatchDetailsContainer.textContent = "";

    if (pongUserData && pongUserData.length > 0) {
        pongUserData.forEach(match => {
            const opponent = match.player1 === userName ? match.player2 : match.player1;
            const isWinner = match.winner === userName;
            let resultText;
            let resultClass;

            resultText = isWinner ? "Victory" : "Defeat";
            resultClass = isWinner ? "win" : "loss";

            const matchTime = formatTime(match.begin_time);

           
            const matchCard = document.createElement('div');
            matchCard.classList.add('match-card', 'collapsed');

            const matchSummary = document.createElement('div');
            matchSummary.classList.add('match-summary', resultClass);

            const playersDiv = document.createElement('div');
            playersDiv.classList.add('players');
            playersDiv.textContent = `${userName} vs ${opponent}`;

            const matchInfoDiv = document.createElement('div');
            matchInfoDiv.classList.add('match-info');

            const resultSpan = document.createElement('span');
            resultSpan.classList.add('result');
            resultSpan.textContent = resultText;

            matchInfoDiv.appendChild(resultSpan);
            matchSummary.appendChild(playersDiv);
            matchSummary.appendChild(matchInfoDiv);

           
            const matchDetails = document.createElement('div');
            matchDetails.classList.add('match-details');

            const scoreItem = document.createElement('div');
            scoreItem.classList.add('detail-item');
            const scoreSpan = document.createElement('span');
            scoreSpan.textContent = `Score:`;
            const scoreValueSpan = document.createElement('span');
            scoreValueSpan.textContent = `${match.score1} - ${match.score2}`;
            scoreItem.appendChild(scoreSpan);
            scoreItem.appendChild(scoreValueSpan);

            const durationItem = document.createElement('div');
            durationItem.classList.add('detail-item');
            const durationSpan = document.createElement('span');
            durationSpan.textContent = `Duration:`;
            const durationValueSpan = document.createElement('span');
            durationValueSpan.textContent = matchTime;
            durationItem.appendChild(durationSpan);
            durationItem.appendChild(durationValueSpan);

            matchDetails.appendChild(scoreItem);
            matchDetails.appendChild(durationItem);

            matchCard.appendChild(matchSummary);
            matchCard.appendChild(matchDetails);

           
            pongMatchDetailsContainer.appendChild(matchCard);
        });

       
        document.querySelectorAll('.match-card').forEach(card => {
            card.addEventListener('click', function() {
                this.classList.toggle('collapsed');
            });
        });
    }
    else
    {
        pongMatchDetailsContainer.textContent = '';

        const p = document.createElement('p');
        p.classList.add('no-matches');
        p.textContent = 'No matches found';

        pongMatchDetailsContainer.appendChild(p);
    }
}


export function gameUserStatisticsPageHandlers() {
    const backImageButton = document.getElementById('backImageButton');
    const pongChartsCheckbox = document.getElementById('pongChartsCheckbox');
    const pongMatchesCheckbox = document.getElementById('pongMatchesCheckbox');
    const forza4StatsCheckbox = document.getElementById('forza4StatsCheckbox');
    const forza4MatchesCheckbox = document.getElementById('forza4MatchesCheckbox');

    backImageButton?.addEventListener('click', () => {
        navigate("/modes", "Return to Game Mode");
    });

    pongChartsCheckbox?.addEventListener('change', () => {
        if (pongChartsCheckbox.checked) {
            //console.log("pong charts");
            document.getElementById('pongChartsSection').classList.remove('hidden1');
            document.getElementById('pongMatchDetailsContainer').classList.add('hidden1');
            document.getElementById('forza4StatsSection').classList.add('hidden1');
            document.getElementById('f4MatchDetailsContainer').classList.add('hidden1');
            showCharts();
        }
    });

    pongMatchesCheckbox?.addEventListener('change', () => {
        if (pongMatchesCheckbox.checked) {
            //console.log("pong matches");
            document.getElementById('pongMatchDetailsContainer').classList.remove('hidden1');
            document.getElementById('pongChartsSection').classList.add('hidden1');
            document.getElementById('forza4StatsSection').classList.add('hidden1');
            document.getElementById('f4MatchDetailsContainer').classList.add('hidden1');
            pongShowMatchDetails();
        } 
    });

    forza4StatsCheckbox?.addEventListener('change', () => {
        if (forza4StatsCheckbox.checked) {
            //console.log("forza4 stats");
            document.getElementById('forza4StatsSection').classList.remove('hidden1');
            document.getElementById('pongChartsSection').classList.add('hidden1');
            document.getElementById('pongMatchDetailsContainer').classList.add('hidden1');
            document.getElementById('f4MatchDetailsContainer').classList.add('hidden1');
            forza4ShowUserStatistics();
        } 
    });

    forza4MatchesCheckbox?.addEventListener('change', () => {
        if (forza4MatchesCheckbox.checked) {
            //console.log("forza4 matches");
            document.getElementById('f4MatchDetailsContainer').classList.remove('hidden1');
            document.getElementById('pongChartsSection').classList.add('hidden1');
            document.getElementById('pongMatchDetailsContainer').classList.add('hidden1');
            document.getElementById('forza4StatsSection').classList.add('hidden1');
            forza4ShowMatchDetails();
        } 
    });


    /*pongMatchHistoryBtn?.addEventListener('click', () => {
        pongShowMatchDetails();
        document.getElementById('forza4StatsSection').classList.add('hidden1');
        document.getElementById('pongChartsSection').classList.add('hidden1');
        document.getElementById('f4MatchDetailsContainer').classList.add('hidden1');
        document.getElementById('pongMatchDetailsContainer').classList.remove('hidden1');
       

    })

    f4MatchHistoryBtn?.addEventListener('click', () => {
        forza4ShowMatchDetails();
        document.getElementById('forza4StatsSection').classList.add('hidden1');
        document.getElementById('pongChartsSection').classList.add('hidden1');
        document.getElementById('pongMatchDetailsContainer').classList.add('hidden1');
        document.getElementById('f4MatchDetailsContainer').classList.remove('hidden1');

        f4MatchHistoryBtn.classList.add('active');
        forza4StatsBtn.classList.remove('active');
        pongChartsBtn.classList.remove('active');

       
    });

    forza4StatsBtn?.addEventListener('click', () => {
        document.getElementById('pongChartsSection').classList.add('hidden1');
        document.getElementById('f4MatchDetailsContainer').classList.add('hidden1');
        document.getElementById('pongMatchDetailsContainer').classList.add('hidden1');
        document.getElementById('forza4StatsSection').classList.remove('hidden1');

        forza4StatsBtn.classList.add('active');
        pongChartsBtn.classList.remove('active');
        f4MatchHistoryBtn.classList.remove('active');

        forza4ShowUserStatistics();
    });

    pongChartsBtn?.addEventListener('click', () => {
        document.getElementById('forza4StatsSection').classList.add('hidden1');
        document.getElementById('f4MatchDetailsContainer').classList.add('hidden1');
        document.getElementById('pongMatchDetailsContainer').classList.add('hidden1');
        document.getElementById('pongChartsSection').classList.remove('hidden1');

        pongChartsBtn.classList.add('active');
        forza4StatsBtn.classList.remove('active');
        f4MatchHistoryBtn.classList.remove('active');

        showCharts();

        // Al momento non serve logica specifica per Ping Pong; il test field basta per verificare il cambio finestra
    });*/
}

