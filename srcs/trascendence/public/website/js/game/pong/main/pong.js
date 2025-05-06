import { navigate, opponent, Player1, Player2, save_global } from "../../../main.js";
import { Ball } from "../elements/ball.js";
import { Paddle } from "../elements/paddle.js";
import { ParticlePool } from "../elements/particle_pool.js";
import { UI } from "../scene/ui.js";
import { ScreenShake } from "../scene/screenshake.js";
import { createStarsBackground, renderBackground } from "../scene/background.js";
import { updateParticles, renderParticles } from "../elements/particle.js";
import { handlePowerups } from "../elements/powerup.js";
import { checkScore } from "../other/score.js";
import { matchData } from "../data/game_global.js";
import { saveMatchStatsData, resetMatchStatsData } from "../data/game_stats.js";
import { pongCustomData } from "../data/game_global.js";
import { updateTimer } from "../other/timer.js";
import { current_user, pong_save } from "../../../main.js";

export let gameContainer;
export let game;
export let mode;
export let pongGameData;
// Buttons
export let backToBracketButton;
export let backToRobinButton;
export let backToMenuButton;

export function startPongGame(gameMode) {
  backToBracketButton = document.getElementById("backToBracketButton");
  backToRobinButton = document.getElementById("backToRobinButton");
  backToMenuButton = document.getElementById("backToMenuButton");

  if (backToBracketButton)
    backToBracketButton.hidden = true;
  if (backToRobinButton)
    backToRobinButton.hidden = true;
  if (backToMenuButton)
    backToMenuButton.hidden = true;
  if (pong_save !== null && (gameMode === "ai" || gameMode === "classic"))
    pongGameData = pong_save;
  else
    pongGameData = pongCustomData;

  resetMatchStatsData();
  // Set the game mode (classic, ai, knocknout, rondrobin)
  mode = gameMode;
}

// Main class
export class PongGame {
  constructor() {
    // Create Canvas and Context
    this.canvas = document.getElementById("gameCanvas");
    if (!this.canvas) {
      return;
    }
    this.ctx = this.canvas.getContext("2d");
    if (!this.ctx) {
      return;
    }

    // Set canvas width and height as window dimensions
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    // Set game variables
    if (mode === "classic" || mode === "ai") {
      this.p1Name = current_user.display_name;
      //this.p2Name = sessionStorage.getItem("opponent") || "IA";
      this.p2Name = opponent || "IA";
    } else {
      this.p1Name = Player1;
      this.p2Name = Player2;
    }
    this.scoreP1 = 0;
    this.scoreP2 = 0;
    this.maxScore = 2;
    this.winner = "";
    this.wallThickness = this.canvas.width * 0.008;
    this.wallsColor = pongGameData.wallsColor;

    this.stars = [];
    this.particles = [];
    this.powerup = [];

    // Instantiate game objects
    this.ball = new Ball(
      this.canvas,
      this.ctx,
      this.canvas.width / 2,
      this.canvas.height / 2,
      pongGameData.ballColor,
      pongGameData.ballTrailColor
    );
    this.paddle1 = new Paddle(
      this.canvas,
      this.wallThickness + 20,
      "w",
      "s",
      pongGameData.paddleColor
    );
    this.paddle2 = new Paddle(
      this.canvas,
      this.canvas.width - this.wallThickness - 20,
      "ArrowUp",
      "ArrowDown",
      pongGameData.paddleColor
    );
    this.particlePool = new ParticlePool(this, 20);
    this.ui = new UI(this.p1Name, this.p2Name, this.canvas, this.ctx);
    this.screenShake = new ScreenShake();

    this.running = false;
    this.gamePaused = false;
    this.gameEnd = false;
    this.backToGameTimer = false;
    this.powerUpTimerStarted = false;

    this.lastTime = 0;
    this.deltaTime = 0;

    //AI
    this.lastMoveTime = 0;
    this.paddle2Paused = false;

    this.oldCanvasWidth = 0;
    this.oldCanvasHeight = 0;
    this.newCanvasWidth = 0;
    this.newCanvasHeight = 0;

    this.starsNumber = 30;
    //this.beginTime = new Date().getTime();
    createStarsBackground(this, this.starsNumber);
    this.addEventListeners();
    //this.renderBackground();
  }

  start() {
    this.running = true;
    this.loop();
    matchData.timer = setInterval(updateTimer.bind(this), 1000);
  }

  loop() {
    if (this.running || (this.gameEnd && this.screenShake.shakeTimer > 0)) {
      const now = performance.now();
      this.deltaTime = (now - this.lastTime) / 1000; // Converti in secondi
      this.lastTime = now;
      this.update();
      this.render();
      requestAnimationFrame(() => this.loop());
    }
  }

  update() {
    if (!this.gamePaused && !this.gameEnd && this.ball && this.paddle1) {
      this.ball.update(
        this,
        this.paddle1,
        this.paddle2,
        this.powerup[0],
        this.wallThickness
      );
      this.paddle1.update(this);
      if (mode === "ai") {
        //console.log("is AIII");
        if (this.ball.x > window.innerWidth / 3 && !this.paddle2Paused)
        // if (!this.paddle2Paused)
          this.paddle2.move_ia(this.ball, this);
        //}
      } else this.paddle2.update(this);
      updateParticles(this);
      //this.screenShake.update();
      this.ball.checkPosition(this);
      if (pongGameData.powerUpActive) handlePowerups(this);
      checkScore(this);
    }

    if (pongGameData.background == "space") {
      for (let i = 0; i < this.starsNumber; i++) {
        this.stars[i].update();
      }
    }
  }

  render() {
    if (this.ctx)
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    renderBackground(this);
    this.ball.render();
    this.screenShake.update();
    this.screenShake.apply(this.ctx);
    this.paddle1.render(this.ctx);
    this.paddle2.render(this.ctx);

    if (mode === "classic" || mode === 'ai')
    {
      if (this.powerup && this.powerup[0])
        this.powerup[0].render();
    }
    if (pongGameData.background == "space") {
      for (let i = 0; i < this.starsNumber; i++) {
        this.stars[i].render();
      }
    }
    this.ui.render(this, this.scoreP1, this.scoreP2);
    renderParticles(this);
    this.screenShake.reset(this.ctx);
    if (this.gameEnd && this.screenShake.shakeTimer > 0) {
      requestAnimationFrame(() => this.render());
    } else if (this.gameEnd) {
      // Reset screenshake when game ends
      this.screenShake.reset(this.ctx);
    }
  }

  resize() {
    this.oldCanvasWidth = this.canvas.width;
    this.oldCanvasHeight = this.canvas.height;
    // Ridimensiona il canvas
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.wallThickness = this.canvas.width * 0.008;

    renderBackground(this);

    // Check if object exists before resizing
    if (this.ball) this.ball.resize(this);
    if (this.paddle1) this.paddle1.resize(this);
    if (this.paddle2) this.paddle2.resize(this);
    if (this.ui) this.ui.resize(this, this.ui.scoreP1, this.ui.scoreP2);

    this.stars = [];
    createStarsBackground(this, this.starsNumber);
    // if (this.ui)
    //     this.ui.render(this, this.scoreP1, this.scoreP2);
  }

  stop() {
    //console.log("cancelll");
    this.running = false;
    if (this.loopId) {
      cancelAnimationFrame(this.loopId);
      this.loopId = null;
    }
    clearInterval(matchData.timer);
  }

  destroy() {
    this.stop(); // Stop game
    window.removeEventListener("resize", this.resize);
    document.removeEventListener("keydown", this.handleKeyDown);
    document.removeEventListener("keyup", this.handleKeyUp);
    backToBracketButton.removeEventListener("click", this.handleBackToBracket);
    backToRobinButton.removeEventListener("click", this.handleBackToRobin);
    backToMenuButton.removeEventListener("click", this.handleBackToMenu);
    this.ball = null;
    for (const particle of this.particles) {
      this.particlePool.releaseParticle(particle);
    }
    this.particles = [];
    this.particlePool = null;

    cancelAnimationFrame(this.animationFrameId);
    if (document.getElementById("gameCanvas"))
      document.getElementById("gameCanvas").remove();
  }

  addEventListeners() {
    document.addEventListener("keydown", (event) => {
      this.paddle1.handleInput(event.key, true);
      this.paddle2.handleInput(event.key, true);

      // Check if player pause the game
      if (event.key === "p" || event.key === "P") {
        if (this.gamePaused && !this.backToGameTimer)
          this.ui.startCountdown(this, this.gamePaused, this.backToGameTimer);
        else this.gamePaused = true;
      }
    });
    document.addEventListener("keyup", (event) => {
      this.paddle1.handleInput(event.key, false);
      this.paddle2.handleInput(event.key, false);
    });

    backToBracketButton.addEventListener("click", () => {
      gameCanvas.style.display = "none";
      backToBracketButton.hidden = true;
      // console.log("saving winner: ", this.winner);
      save_global("winner", this.winner);
      saveMatchStatsData(this.p1Name, this.p2Name, this.scoreP1, this.scoreP2);
      //resetMatchStatsData();
      this.destroy();
      navigate("/tournament/knockout/bracket", "Return from Match");
    });

    backToRobinButton.addEventListener("click", () => {
      gameCanvas.style.display = "none";
      backToRobinButton.hidden = true;
      // console.log("saving winner: ", this.winner);
      save_global("winner", this.winner);
      saveMatchStatsData(this.p1Name, this.p2Name, this.scoreP1, this.scoreP2);
      //resetMatchStatsData();
      this.destroy();
      navigate("/tournament/roundrobin/robinranking", "Return from Match");
    });

    backToMenuButton.addEventListener("click", () => {
      gameCanvas.style.display = "none";
      backToMenuButton.hidden = true;
      save_global("winner", this.winner);
      if (mode === "classic")
        saveMatchStatsData(
          this.p1Name,
          this.p2Name,
          this.scoreP1,
          this.scoreP2
        );
      //resetMatchStatsData();
      this.destroy();
      navigate("/modes", "Return from Classic");
    });

    window.addEventListener("resize", () => this.resize());
  }
}