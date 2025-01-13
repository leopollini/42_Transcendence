import { Ball } from './ball.js';
import { Paddle } from './paddle.js';
import { UI } from './ui.js';
import { Star } from './star.js';
import { Particle } from './particle.js';
import { Powerup } from './powerup.js';
import { navigate } from '../../main.js';
import { matchData } from './game_global.js';
import { ballColor, paddleColor, ballTrailColor, wallsColor, powerUpActive, background } from './game_global.js';

export let canvas;
export let ctx;
export let game;
export let players;
export let backToBracketButton;
export let backToRobinButton;
export let matchStatisticsButton;
export let matchStatsPopup;
export let mode;


export function PongGameScreen() {
    const html = `
     
        <div id="gameContainer">
        <canvas id="gameCanvas"> </canvas>
        </div>
        <div id="matchStatsPopup" style="display: none; flex-direction: column; align-items: center; justify-content: center;">
            <h2>Match Statistics</h2>
            <table style="width: 80%; border-collapse: collapse; font-size: 1rem; background-color: #fff; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
                <tbody>
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 10px; background-color: #e6f7ff; font-weight: bold; text-align: center;">PLAYERS</td>
                        <td id="playersColumn" style="border: 1px solid #ddd; padding: 10px; text-align: center;"></td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 10px; background-color: #e6f7ff; font-weight: bold; text-align: center;">MATCH TIME</td>
                        <td id="matchTimeColumn" style="border: 1px solid #ddd; padding: 10px; text-align: center;"></td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 10px; background-color: #e6f7ff; font-weight: bold; text-align: center;">SCORE</td>
                        <td id="scoreColumn" style="border: 1px solid #ddd; padding: 10px; text-align: center;"></td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 10px; background-color: #e6f7ff; font-weight: bold; text-align: center;">LONGEST RALLY</td>
                        <td id="longestRallyColumn" style="border: 1px solid #ddd; padding: 10px; text-align: center;"></td>
                    </tr>
                </tbody>
            </table>
        </div>
        <br>
       
        <button id="backToBracketButton">Back to Bracket</button>  
        <button id="backToRobinButton">Back to Ranking</button>
        <button id="matchStatisticsButton">End Match</button>
       
    
    `;
    return html;
}

export function startPongGame(matchPlayers, tournamentMode) {
    mode = tournamentMode;
    players = matchPlayers;
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    if (background == "pingpong")
        canvas.style.background = "#1d8819";
    backToBracketButton = document.getElementById('backToBracketButton');
    backToRobinButton = document.getElementById('backToRobinButton');
    matchStatisticsButton = document.getElementById('matchStatisticsButton');
    matchStatsPopup = document.getElementById('matchStatsPopup');
    matchStatsPopup.style.display = "none";
    backToBracketButton.hidden = true;
    backToRobinButton.hidden = true;
    matchStatisticsButton.hidden = true;
    console.log("power up = " + powerUpActive);
    
    game = new Game(canvas);
    game.start();
   

}

// Main class
export class Game {
    constructor() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        this.wallThickness = canvas.width * 0.008;
        this.wallsColor = wallsColor;
        this.ball = new Ball(canvas.width / 2, canvas.height / 2, ballColor, ballTrailColor);
        this.paddle1 = new Paddle(this.wallThickness + 20, 'w', 's', paddleColor);
        this.paddle2 = new Paddle(canvas.width - this.wallThickness - 20, 'ArrowUp', 'ArrowDown', paddleColor);
        this.p1Name = players[0]; 
        this.p2Name = players[1];
        this.ui = new UI(this.p1Name, this.p2Name);
        this.stars = [];
        this.createStarsBackground(100);
        this.scoreP1 = 0;
        this.scoreP2 = 0;
        this.running = false;
        this.particles = [];
        this.gamePaused = false;
        this.gameEnd = false;
        this.backToGameTimer = false;
        this.powerUpTimerStarted = false;
        this.powerup = [];
        this.addEventListeners();
        this.winner = '';
    }

    addEventListeners() {
        document.addEventListener('keydown', (event) => {
            //event.preventDefault();
            this.paddle1.handleInput(event.key, true);
            this.paddle2.handleInput(event.key, true);
            if (event.key === 'p' || event.key === 'P') {
                this.togglePause();
            }
        
        });
        document.addEventListener('keyup', (event) => {
            //event.preventDefault();
            this.paddle1.handleInput(event.key, false);
            this.paddle2.handleInput(event.key, false);
        });

        backToBracketButton.addEventListener('click', (event) => {
            const path = "#bracket";
            backToBracketButton.hidden = true;
            window.history.pushState({}, path, window.location.origin + path);
            sessionStorage.setItem("winner", this.winner);
            this.resetMatchStatsData();
            navigate(path, event.target.id);
        })

        backToRobinButton.addEventListener('click', (event) => {
            const path = "#robindraw";
            backToRobinButton.hidden = true;
            window.history.pushState({}, path, window.location.origin + path);
            sessionStorage.setItem("winner", this.winner);
            this.resetMatchStatsData();
            navigate(path, event.target.id);
        })

        matchStatisticsButton.addEventListener('click', (event) => {
            gameCanvas.style.display = "none";
            matchStatsPopup.style.display = "flex";
            matchStatsPopup.style.marginTop = window.innerHeight * 0.4 + "px";
            matchStatisticsButton.style.display = "none";
            if (mode === "knockout") 
                backToBracketButton.hidden = false;
            else if (mode === "roundrobin")
                backToRobinButton.hidden = false;
            this.saveMatchStatsData();
            const playersColumn = document.getElementById('playersColumn');
            const matchTimeColumn = document.getElementById('matchTimeColumn');
            const scoreColumn = document.getElementById('scoreColumn');
            const longestRallyColumn = document.getElementById('longestRallyColumn');
            playersColumn.textContent = matchData.player1 + " vs " + matchData.player2;
            matchTimeColumn.textContent = matchData.matchTime;
            scoreColumn.textContent = `${matchData.scorep1} - ${matchData.scorep2}`;
            longestRallyColumn.textContent = matchData.longestRally + " hits";
        })
        window.addEventListener('resize', () => this.resize());
    }
    saveMatchStatsData() {
        matchData.player1 = this.p1Name;
        matchData.player2 = this.p2Name;
        matchData.scorep1 = this.scoreP1;
        matchData.scorep2 = this.scoreP2;
        matchData.matchTime = this.formatTime(matchData.seconds);

        
        localStorage.setItem('match_data', JSON.stringify(matchData)); // Da sostituire con salvataggio in db postgres
        this.saveUserStatsData(matchData.player1, matchData.player2, matchData.scorep1, matchData.scorep2); // Match 1
        
    }

    saveUserStatsData(player1, player2, score1, score2) {
        // Recover existing data (if exists, otherwise create)
        const data = JSON.parse(localStorage.getItem('game_data')) || { players: {} };
        
        // Initialize data if no players
        if (!data.players[player1]) {
            data.players[player1] = { wins: 0, losses: 0, xp: 0, level: 1, pointsToLoseLevel: 0, pointsToNextLevel: 100, matches: [] };
        }
        if (!data.players[player2]) {
            data.players[player2] = { wins: 0, losses: 0, xp: 0, level: 1, pointsToLoseLevel: 0, pointsToNextLevel: 100, matches: [] };
        }

        // Who wins?
        let winner;
        let loser;
        if (score1 > score2) {
            winner = player1;
            loser = player2;
            data.players[player1].wins += 1;
            data.players[player2].losses += 1;
        } else {
            winner = player2;
            loser = player1;
            data.players[player2].wins += 1;
            data.players[player1].losses += 1;
        }


        // Crea un oggetto per il match
        const matchDetails = {
            player1,
            player2,
            score1,
            score2,
            winner,
            date: new Date().toISOString() // Data del match
        };

        // Aggiungi il match al rispettivo array dei match giocati
        data.players[player1].matches.push(matchDetails);
        data.players[player2].matches.push(matchDetails);

        this.calculateXpPlayers(data, winner, loser);
        this.calculateLevelPlayers(data, winner, loser);
        // Salva i dati aggiornati
        localStorage.setItem('game_data', JSON.stringify(data));
        console.log("Dati aggiornati:", data);
        // Esempio d'uso
       
    }

    calculateXpPlayers(data, winner, loser) {
        // Winner gains xp
        if (data.players[loser].level <= data.players[winner].level)
            data.players[winner].xp += 20;
        else if (data.players[loser].level > data.players[winner].level)
            data.players[winner].xp += 20 * (data.players[loser].level - data.players[winner].level + 1);

        // Loser lost xp
        if (data.players[loser].level >= data.players[winner].level)
            data.players[loser].xp -= 20;
        else if (data.players[loser].level < data.players[winner].level)
            data.players[loser].xp -= 20 * (data.players[winner].level - data.players[loser].level + 1);

        if (data.players[loser].xp < 0)
            data.players[loser].xp = 0;
    }


    calculateLevelPlayers(data, winner, loser) {
        if(data.players[winner].xp >= data.players[winner].pointsToNextLevel) {
            data.players[winner].level += 1;
            data.players[winner].pointsToLoseLevel = data.players[winner].pointsToNextLevel;
            data.players[winner].pointsToNextLevel *= 2;
        }

        if (data.players[loser].xp <= data.players[loser].pointsToLoseLevel) {
            if (data.players[loser].pointsToLoseLevel > 0) {
                data.players[loser].level -= 1;
                data.players[loser].pointsToNextLevel = data.players[winner].pointsToLoseLevel;
                if (data.players[loser].level == 1)
                    data.players[loser].pointsToLoseLevel = 0;
                else 
                    data.players[loser].pointsToLoseLevel /= 2; 
            }
        }
            
    }

    resetMatchStatsData() {
        matchData.player1 = '';
        matchData.player2 = '';
        matchData.scorep1 = 0;
        matchData.scorep2 = 0;
        matchData.matchTime = '';
        matchData.seconds = 0;
        matchData.longestRally = 0;
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    }

    start() {
        this.running = true;
        this.loop();
        matchData.timer = setInterval(this.updateTimer.bind(this), 1000);
    }

    loop() {
        if (this.running) {
            this.update();
            this.render();
            requestAnimationFrame(() => this.loop());
        }
    }

    update() {
        if (!this.gamePaused && !this.gameEnd) {
            this.ball.update(this.paddle1, this.paddle2, this.powerup[0]);
            this.paddle1.update();
            this.paddle2.update();
            this.updateParticles();
            this.checkBallPosition();
            if (powerUpActive) 
                this.handlePowerups();
            this.checkScore();
        }
        if (background == "space")
        {
            for (let i = 0; i < 100; i++) {
                this.stars[i].update();
            }
        }
    }

    updateTimer() {
        if (!this.gameEnd && !this.gamePaused)
            matchData.seconds++;
        else
            clearInterval(matchData.timer);
        console.log(matchData.seconds);        
    }

    checkBallPosition() {
        if (this.ball.out && this.ball.hits > matchData.longestRally) {
                matchData.longestRally = this.ball.hits; 
        }
        if (this.ball.x <= 0 && !this.ball.out) {
            this.ball.out = true;
            if (this.powerup[0]) {
                this.powerup.splice(0, 1);
                this.powerUpTimerStarted = false;
            }    
            this.scoreP2++;
            this.screenShake(300, 15);
            setTimeout(() => {
                if (!this.gameEnd)
                    this.ball.reset(2); // Reposition ball to center
                this.ball.out = false;
            }, 2000);
        } else if (this.ball.x >= canvas.width && !this.ball.out) {
            this.ball.out = true;
            if (this.powerup[0]) {
                this.powerup.splice(0, 1);
                this.powerUpTimerStarted = false;
            }
            this.scoreP1++;
            this.screenShake(500, 25);
            setTimeout(() => {
                if (!this.gameEnd)
                    this.ball.reset(1); // Reposition ball to center
                this.ball.out = false;
            }, 2000);
        }
    }

    screenShake(duration, intensity) {
        const gameContainer = document.getElementById('gameContainer');
        const startTime = performance.now();
    
        function shakeFrame(time) {
            const elapsedTime = time - startTime;
    
            if (elapsedTime < duration) {
                const progress = elapsedTime / duration;
                const currentIntensity = intensity * (1 - progress);
    
                const offsetX = (Math.random() - 0.5) * currentIntensity;
                const offsetY = (Math.random() - 0.5) * currentIntensity;
    
                gameContainer.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
                requestAnimationFrame(shakeFrame);
            } else {
                gameContainer.style.transform = 'translate(0, 0)';
            }
        }
    
        requestAnimationFrame(shakeFrame);
    }

    checkScore() {
        if (this.scoreP1 >= 3 || this.scoreP2 >= 3) {
            this.gameEnd = true;
            if (this.scoreP1 > this.scoreP2) {
                this.winner = this.p1Name;
            } 
            else {
                this.winner = this.p2Name;
            }
            this.gameEnd = true;
           
            
            matchStatisticsButton.hidden = false;
            this.ui.render(this.scoreP1, this.scoreP2, this.gameEnd, this.gamePaused, this.backToGameTimer);
        }
    }

    handlePowerups() {
        if (!this.powerUpTimerStarted) {
            this.powerUpTimerStarted = true;
            setTimeout(() => {
                if (!this.gameEnd)
                {
                    let powerup = new Powerup();
                    this.powerup.push(powerup)
                }
                
            }, 5000);
        }
    }
    togglePause() {
         // If game paused, and no countdown active, start countdown
        if (this.gamePaused && !this.backToGameTimer) {
            this.ui.startCountdown(this, this.gamePaused, this.backToGameTimer);
        } else {
            this.gamePaused = true;
        }
    }

    getRandomValue(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }

    render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.renderBackground();
        this.ball.render();
        this.paddle1.render();
        this.paddle2.render();
        if (this.powerup[0])
            this.powerup[0].render();
        
        if (background == "space")
        {
            for (let i = 0; i < 100; i++) {
                this.stars[i].render();
            }
        }
        this.ui.render(this.scoreP1, this.scoreP2, this.gameEnd, this.gamePaused, this.backToGameTimer);
        this.renderParticles();
    }

    addParticles(x, y, count) {
        for (let i = 0; i < count; i++) {
            const particle = new Particle(x, y);
            this.particles.push(particle);
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].size <= 0) {
                this.particles.splice(i, 1); // Remove dead particles
            }
        }
    }

    renderParticles() {
        for (const particle of this.particles) {
            particle.render();
        }
    }

    createStarsBackground(count) {
        for (let i = 0; i < count; i++) {
            const star = new Star();
            this.stars.push(star);
        }
    }

    renderBackground() {
        // Walls
        if (background == "space")
            ctx.fillStyle = this.wallsColor;
        else 
            ctx.fillStyle = "white";
        ctx.shadowColor = this.wallsColor;
        ctx.shadowBlur = 20;
        ctx.fillRect(this.wallThickness, 0, canvas.width - this.wallThickness, this.wallThickness);
        ctx.fillRect(this.wallThickness, canvas.height - this.wallThickness, canvas.width - this.wallThickness, this.wallThickness);
        ctx.fillRect(0, 0, this.wallThickness, canvas.height);
        ctx.fillRect(canvas.width - this.wallThickness, 0, this.wallThickness, canvas.height);

        if (background == "pingpong") {
            // Background
           ctx.fillStyle = "white";
           ctx.fillRect(this.wallThickness, canvas.height / 2, canvas.width - this.wallThickness, this.wallThickness);
           ctx.fillRect(canvas.width / 2, this.wallThickness, this.wallThickness, canvas.height - this.wallThickness);
       }

        if (background == "classic") {
            // Draw vertical dashed line
            for (let y = this.wallThickness; y < canvas.height - this.wallThickness; y += 50) {
                ctx.fillRect(canvas.width / 2, y, this.wallThickness, 30);
            }
        }
       
    }

    resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        this.wallThickness = canvas.width * 0.008;
        this.renderBackground();
        //this.paddle1 = new Paddle(this.wallThickness + 20, 'w', 's');
        //this.paddle2 = new Paddle(canvas.width - this.wallThickness - 20, 'ArrowUp', 'ArrowDown');
        this.ball.resize();
        this.paddle1.resize(this.wallThickness + 20);
        this.paddle2.resize(canvas.width - this.wallThickness - 20);
        this.ui.resize(this.ui.scoreP1, this.ui.scoreP2);
        this.ball.reset(1);
        this.paddle1.y = canvas.height / 2 - this.paddle1.height / 2;
        this.paddle2.y = canvas.height / 2 - this.paddle2.height / 2;
        this.stars = [];
        this.createStarsBackground(100);
        this.ui.render(this.scoreP1, this.scoreP2, this.gameEnd, this.gamePaused, this.backToGameTimer);
        
    }
}