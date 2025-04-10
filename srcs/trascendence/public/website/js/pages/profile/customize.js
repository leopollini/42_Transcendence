import { navigate } from "../../main.js";
import { pongCustomData } from "../../game/pong/data/game_global.js";


let pongData;
let previewCanvas;
let ctx;
let stars = [];
const starCount = 30;

export default function Customize() {
  return `
        <h1 class="customize-title">Customize</h1>
        <div id="customize-container" class="customize-wrapper">
            <div class="customize-content">
                <div id="game-customize" class="customize-section">
                    <h2 class="section-title">Game Elements</h2>
                    <div id="game-elements-color" class="color-picker-section">
                        <div class="color-picker">
                            <label for="paddleColorPicker">Paddle:</label>
                            <input type="color" id="paddleColorPicker" value="#ffffff">
                        </div>
                        <div class="color-picker">
                            <label for="ballColorPicker">Ball:</label>
                            <input type="color" id="ballColorPicker" value="#ffffff">
                        </div>
                        <div class="color-picker">
                            <label for="ballTrailColorPicker">Ball Trail:</label>
                            <input type="color" id="ballTrailColorPicker" value="#014C4A">
                        </div>
                        <div class="color-picker">
                            <label for="wallsColorPicker">Walls:</label>
                            <input type="color" id="wallsColorPicker" value="#014C4A">
                        </div>
                    </div>
                </div>
                <div id="preview" class="preview-section">
                    <h2 class="section-title">Preview</h2>
                    <canvas id="previewCanvas" class="preview-canvas"></canvas>
                </div>
            </div>
        </div>
        <div id="backgrounds" class="backgrounds-section">
            <h2 class="section-title">Backgrounds</h2>
            <div id="backgrounds-container" class="backgrounds-grid">
                <div class="background-item">
                    <label class="background-label">
                        <input type="radio" id="backgroundCheckbox1" name="background" class="background-checkbox" />
                        <span class="background-text">Space</span>
                    </label>
                </div>
                <div class="background-item">
                    <label class="background-label">
                        <input type="radio" id="backgroundCheckbox2" name="background" class="background-checkbox" />
                        <span class="background-text">Classic</span>
                    </label>
                </div>
                <div class="background-item">
                    <label class="background-label">
                        <input type="radio" id="backgroundCheckbox3" name="background" class="background-checkbox" />
                        <span class="background-text">Ping Pong</span>
                    </label>
                </div>
            </div>
        </div>
        <div id="powerup-checkbox-container" class="powerup-container">
            <label class="powerup-label">
                <input type="checkbox" id="powerup-checkbox" class="powerup-checkbox" />
                <span class="powerup-text">Power-ups</span>
            </label>
        </div>
        <button id="applyCustomization" class="customization-button">Apply</button>
    `;
}

function initializeStarsPreviewBackground(width, height) {
  stars = [];
  for (let i = 0; i < starCount; i++) {
    const starX = Math.random() * width;
    const starY = Math.random() * height;
    const starRadius = Math.random() * 0.5; // variazione di dimensione
    stars.push({ x: starX, y: starY, radius: starRadius });
  }
}

function drawPreview() {
  // Recupera le dimensioni attuali del canvas
  const width = previewCanvas.width;
  const height = previewCanvas.height;
  ctx.clearRect(0, 0, width, height);

  // Black bg
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, width, height);

  if (pongData.background === "space") {
    // Initialize stars preview bg
    if (stars.length === 0 || stars[0].x > width || stars[0].y > height) {
      initializeStarsPreviewBackground(width, height);
    }
    // Draw stars
    ctx.fillStyle = "white";
    stars.forEach((star) => {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (pongData.background === "classic") {
    ctx.fillStyle = pongData.wallsColor;
    for (
      let y = ctx.lineWidth;
      y < height - ctx.lineWidth;
      y += height * 0.05
    ) {
      ctx.fillRect(width / 2, y, ctx.lineWidth * 0.5, height * 0.03);
    }
  } else if (pongData.background === "pingpong") {
    ctx.fillStyle = "#1d8819";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "white";
    ctx.fillRect(
      ctx.lineWidth * 0.5,
      height / 2,
      width - ctx.lineWidth * 0.5,
      ctx.lineWidth * 0.5
    );
    ctx.fillRect(
      width / 2,
      ctx.lineWidth * 0.5,
      ctx.lineWidth * 0.5,
      height - ctx.lineWidth * 0.5
    );
  }

  // Draw walls
  ctx.fillStyle = pongData.wallsColor;
  const wallWOffset = width * 0.005;
  const wallHOffset = height * 0.005;
  ctx.strokeStyle = wallsColorPicker.value;
  //setWallsColor(wallsColorPicker.value);
  ctx.lineWidth = Math.max(2, width * 0.02);
  ctx.strokeRect(
    wallWOffset,
    wallHOffset,
    width - wallWOffset,
    height - wallHOffset
  );

  // Define ball and paddle size
  const paddleWidth = width * 0.025;
  const paddleHeight = height * 0.2;
  const ballRadius = Math.min(width, height) * 0.025;

  // Draw paddle
  ctx.fillStyle = paddleColorPicker.value;
  ctx.fillRect(width * 0.05, height * 0.4, paddleWidth, paddleHeight);
  ctx.fillRect(
    width * 0.95 - paddleWidth,
    height * 0.4,
    paddleWidth,
    paddleHeight
  );

  // Draw ball
  ctx.fillStyle = ballColorPicker.value;
  ctx.beginPath();
  ctx.arc(width / 3, height / 3, ballRadius, 0, Math.PI * 2);
  ctx.fill();

  // Draw ball trail
  const trailCount = 5;
  for (let i = 1; i <= trailCount; i++) {
    const alpha = 0.5 * (1 - i / (trailCount + 1));
    ctx.globalAlpha = alpha;
    const offsetX = -i * (ballRadius * 1.5);
    ctx.beginPath();
    ctx.arc(width / 3 + offsetX, height / 3, ballRadius * 0.8, 0, Math.PI * 2);
    ctx.fillStyle = ballTrailColorPicker.value;
    ctx.fill();
  }
  ctx.globalAlpha = 1.0; // Reset opacity
}

export function addCustomizeGame() {
  const applyCustomization = document.getElementById("applyCustomization");
  let ballColorPicker = document.getElementById("ballColorPicker");
  let paddleColorPicker = document.getElementById("paddleColorPicker");
  let ballTrailColorPicker = document.getElementById("ballTrailColorPicker");
  let wallsColorPicker = document.getElementById("wallsColorPicker");

  let powerupCheckbox = document.getElementById("powerup-checkbox");
  let powerupSelected;
  let backgroundCheckbox1 = document.getElementById("backgroundCheckbox1");
  let backgroundCheckbox2 = document.getElementById("backgroundCheckbox2");
  let backgroundCheckbox3 = document.getElementById("backgroundCheckbox3");

  let backgroundSelected = document.getElementById("background-selected");

  if (sessionStorage.getItem("pongData") !== null)
    pongData = JSON.parse(sessionStorage.getItem("pongData"));
  else
    pongData = pongCustomData;
  console.log("backroundd = " + pongData.background);
  ballColorPicker.value = pongData.ballColor;
  paddleColorPicker.value = pongData.paddleColor;
  ballTrailColorPicker.value = pongData.ballTrailColor;
  wallsColorPicker.value = pongData.wallsColor;

  powerupCheckbox.addEventListener("change", (event) => {
    if (powerupCheckbox.checked) {
      pongData.powerUpActive = true;
      //setPowerUpState(true);
    } else {
      pongData.powerUpActive = false;
      //setPowerUpState(false);
    }
  });

  previewCanvas = document.getElementById("previewCanvas");
  ctx = previewCanvas.getContext("2d");
  previewCanvas.width = 200; // Dimensioni ridotte per anteprima
  previewCanvas.height = 100;

  // Update preview on color picker change
  ballColorPicker.addEventListener("input", drawPreview);
  paddleColorPicker.addEventListener("input", drawPreview);
  ballTrailColorPicker.addEventListener("input", drawPreview);
  wallsColorPicker.addEventListener("input", drawPreview);


  if (pongData.background == "space")
    backgroundCheckbox1.checked = true;
  else if (pongData.background == "classic")
    backgroundCheckbox2.checked = true;
  else if (pongData.background == "pingpong")
    backgroundCheckbox3.checked = true;

  if (pongData.powerUpActive)
    powerupCheckbox.checked = true;


  drawPreview();

  backgroundCheckbox1.addEventListener("change", () => {
    if (backgroundCheckbox1.checked) {
      pongData.background = "space";
      //setBackground("space");
      drawPreview();
    }
  });
  backgroundCheckbox2.addEventListener("change", () => {
    if (backgroundCheckbox2.checked) {
      pongData.background = "classic";
      //setBackground("classic");
      drawPreview();
    }
  });
  backgroundCheckbox3.addEventListener("change", () => {
    if (backgroundCheckbox3.checked) {
      pongData.background = "pingpong";
      //setBackground("pingpong");
      drawPreview();
    }
  });

  applyCustomization.addEventListener("click", (event) => {
    ballColorPicker = document.getElementById("ballColorPicker");
    paddleColorPicker = document.getElementById("paddleColorPicker");
    // setBallColor(ballColorPicker.value);
    // setPaddleColor(paddleColorPicker.value);
    // setBallTrailColor(ballTrailColorPicker.value);
    // setWallsColor(wallsColorPicker.value);
    pongData.ballColor = ballColorPicker.value;
    pongData.paddleColor = paddleColorPicker.value;
    pongData.ballTrailColor = ballTrailColorPicker.value;
    pongData.wallsColor = wallsColorPicker.value;
    sessionStorage.setItem("pongData", JSON.stringify(pongData));
    // if (powerupSelected) {
    //     setPowerupPlayer(powerupSelected.value, 1);
    // }
    navigate("/modes", "Return to Game Mode");
  });
}
