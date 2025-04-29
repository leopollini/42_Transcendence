import { navigate, save_global } from "../../main.js";
import { pongCustomData } from "../../game/pong/data/game_global.js";

let pongData;
let previewCanvas;
let ctx;
let stars = [];
const starCount = 30;

let ballColorPicker;
let paddleColorPicker;
let ballTrailColorPicker;
let wallsColorPicker;

export default function Customize() {
  return `
    <section id="pongCustomize" class="customize-container">
      <h1 class="page-title">Pong Customization</h1>

      <div class="customize-options">

        <!-- Game Elements + Preview -->
        <div class="option-group">
          <h2 class="section-title">Game Elements & Preview</h2>
          <div class="game-preview-flex">
            <div class="color-picker-section">
                    <div class="color-picker">
                <label for="paddleColorPicker">Paddle Color:</label>
                <input type="color" id="paddleColorPicker">
                    </div>
                    <div class="color-picker">
                <label for="ballColorPicker">Ball Color:</label>
                <input type="color" id="ballColorPicker">
                    </div>
                    <div class="color-picker">
                        <label for="ballTrailColorPicker">Ball Trail:</label>
                <input type="color" id="ballTrailColorPicker">
                    </div>
                    <div class="color-picker">
                        <label for="wallsColorPicker">Walls:</label>
                <input type="color" id="wallsColorPicker">
                </div>
            </div>
            <div class="preview-wrapper">
                <canvas id="previewCanvas" class="preview-canvas"></canvas>
            </div>
        </div>
    </div>

        <!-- Backgrounds -->
        <div class="option-group">
        <h2 class="section-title">Backgrounds</h2>
          <div class="background-buttons">
            <button id="pongButtonBackground1" class="bg-button">Space</button>
            <button id="pongButtonBackground2" class="bg-button">Classic</button>
            <button id="pongButtonBackground3" class="bg-button">Ping Pong</button>
            </div>
          <div id="backgroundSelected" class="background-selected">Selected: Space</div>
        </div>

        <!-- Power-Up -->
        <div class="option-group powerup-options">
        <label class="powerup-label">
            <input type="checkbox" id="powerup-checkbox" class="powerup-checkbox" />
            <span class="powerup-text">Power-ups</span>
        </label>
    </div>

      </div>

      <button id="pongApplyCustom" class="customization-button">Apply</button>
    </section>
`;
}

function setupCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const container = previewCanvas.parentElement;
  const maxWidth = container.clientWidth;
  const maxHeight = window.innerHeight * 0.4; 
 
  let canvasWidth = maxWidth;
  let canvasHeight = canvasWidth / 2;
  if (canvasHeight > maxHeight) {
    canvasHeight = maxHeight;
    canvasWidth = canvasHeight * 2;
  }
  
  previewCanvas.width = Math.floor(canvasWidth * dpr);
  previewCanvas.height = Math.floor(canvasHeight * dpr);
  previewCanvas.style.width = `${canvasWidth}px`;
  previewCanvas.style.height = `${canvasHeight}px`;

  ctx = previewCanvas.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.imageSmoothingEnabled = false;
  drawPreview();
}

function initializeStarsPreviewBackground(width, height) {
  stars = [];
  for (let i = 0; i < starCount; i++) {
    const starX = Math.random() * width;
    const starY = Math.random() * height;
    const starRadius = Math.random() * 0.8;
    stars.push({ x: starX, y: starY, radius: starRadius });
  }
}

function drawPreview() {
  const width = previewCanvas.width / (window.devicePixelRatio || 1);
  const height = previewCanvas.height / (window.devicePixelRatio || 1);
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, width, height);

  if (pongData.background === "space") {
    if (stars.length === 0) {
      initializeStarsPreviewBackground(width, height);
    }
    ctx.fillStyle = "white";
    stars.forEach((star) => {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (pongData.background === "classic") {
    ctx.fillStyle = pongData.wallsColor;
    for (let y = ctx.lineWidth; y < height - ctx.lineWidth; y += height * 0.05) {
      ctx.fillRect(width / 2, y, ctx.lineWidth * 0.5, height * 0.03);
    }
  } else if (pongData.background === "pingpong") {
    ctx.fillStyle = "#1d8819";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "white";
    ctx.fillRect(ctx.lineWidth * 0.5, height / 2, width - ctx.lineWidth, ctx.lineWidth * 0.5);
    ctx.fillRect(width / 2, ctx.lineWidth * 0.5, ctx.lineWidth * 0.5, height - ctx.lineWidth);
  }

  ctx.fillStyle = pongData.wallsColor;
  const wallWOffset = width * 0.005;
  const wallHOffset = height * 0.005;
  ctx.strokeStyle = wallsColorPicker.value;
  ctx.lineWidth = Math.max(2, width * 0.02);
  ctx.strokeRect(wallWOffset, wallHOffset, width - wallWOffset * 2, height - wallHOffset * 2);

  const paddleWidth = width * 0.025;
  const paddleHeight = height * 0.2;
  const ballRadius = Math.min(width, height) * 0.025;

  ctx.fillStyle = paddleColorPicker.value;
  ctx.fillRect(width * 0.05, height * 0.4, paddleWidth, paddleHeight);
  ctx.fillRect(width * 0.95 - paddleWidth, height * 0.4, paddleWidth, paddleHeight);

  ctx.fillStyle = ballColorPicker.value;
  ctx.beginPath();
  ctx.arc(width / 3, height / 3, ballRadius, 0, Math.PI * 2);
  ctx.fill();

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
  ctx.globalAlpha = 1.0;
}

export function addCustomizeGame() {
  const applyCustomization = document.getElementById("pongApplyCustom");
  ballColorPicker = document.getElementById("ballColorPicker");
  paddleColorPicker = document.getElementById("paddleColorPicker");
  ballTrailColorPicker = document.getElementById("ballTrailColorPicker");
  wallsColorPicker = document.getElementById("wallsColorPicker");
  previewCanvas = document.getElementById("previewCanvas");

  const bgBtn1 = document.getElementById("pongButtonBackground1");
  const bgBtn2 = document.getElementById("pongButtonBackground2");
  const bgBtn3 = document.getElementById("pongButtonBackground3");
  const backgroundSelected = document.getElementById("backgroundSelected");

  if (sessionStorage.getItem("pongData"))
    pongData = JSON.parse(sessionStorage.getItem("pongData"));
  else pongData = { ...pongCustomData };
  
  // Default background: space
  if (!pongData.background) pongData.background = "space";

  // Initialize preview and color pickers
  setupCanvas();
  const resizeObserver = new ResizeObserver(() => {
    setupCanvas();
  });
  resizeObserver.observe(previewCanvas.parentElement);

  ballColorPicker.value = pongData.ballColor;
  paddleColorPicker.value = pongData.paddleColor;
  ballTrailColorPicker.value = pongData.ballTrailColor;
  wallsColorPicker.value = pongData.wallsColor;

  ballColorPicker.addEventListener("input", drawPreview);
  paddleColorPicker.addEventListener("input", drawPreview);
  ballTrailColorPicker.addEventListener("input", drawPreview);
  wallsColorPicker.addEventListener("input", drawPreview);

  function updateBackgroundSelection(background) {
    pongData.background = background;
      drawPreview();
    [bgBtn1, bgBtn2, bgBtn3].forEach(btn => btn.classList.remove("active"));
    if (background === "space") {
      bgBtn1.classList.add("active");
      backgroundSelected.textContent = "Selected: Space";
    } else if (background === "classic") {
      bgBtn2.classList.add("active");
      backgroundSelected.textContent = "Selected: Classic";
    } else if (background === "pingpong") {
      bgBtn3.classList.add("active");
      backgroundSelected.textContent = "Selected: Ping Pong";
    }
  }

  bgBtn1.addEventListener("click", () => updateBackgroundSelection("space"));
  bgBtn2.addEventListener("click", () => updateBackgroundSelection("classic"));
  bgBtn3.addEventListener("click", () => updateBackgroundSelection("pingpong"));

  // Activate initial background
  updateBackgroundSelection(pongData.background);

  const powerupCheckbox = document.getElementById("powerup-checkbox");
  powerupCheckbox.checked = pongData.powerUpActive;
  powerupCheckbox.addEventListener("change", () => {
    pongData.powerUpActive = powerupCheckbox.checked;
  });

  applyCustomization.addEventListener("click", () => {
    pongData.ballColor = ballColorPicker.value;
    pongData.paddleColor = paddleColorPicker.value;
    pongData.ballTrailColor = ballTrailColorPicker.value;
    pongData.wallsColor = wallsColorPicker.value;
    save_global("pong", pongData);
    navigate("/modes", "Return to Game Mode");
  });

  window.addEventListener("resize", setupCanvas);
}