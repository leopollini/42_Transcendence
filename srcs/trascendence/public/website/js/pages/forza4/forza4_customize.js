import { navigate } from "../../main.js";
import { token1Color, token2Color, powerUpMode } from "../../game/forza4/data/forza4_game_global.js";
import { setToken1Color, setToken2Color, setBoardBackground, setPowerUpState } from "../../game/forza4/data/forza4_game_global.js";

export function Forza4Customize() {
  const html = `
    <section id="forza4Customize" class="customize-container">
      <h1 class="page-title">Forza 4 Customization</h1>
      <div class="customize-options">
      
        <!-- Color Settings -->
        <div class="option-group color-options">
          <div class="color-picker">
            <label for="token1ColorPicker">Token Player 1 Color:</label>
            <input type="color" id="token1ColorPicker" value="${token1Color}">
          </div>
          <div class="color-picker">
            <label for="token2ColorPicker">Token Player 2 Color:</label>
            <input type="color" id="token2ColorPicker" value="${token2Color}">
          </div>
        </div>
        
        <!-- Background Settings -->
        <div class="option-group background-options">
          <h2 class="section-title">Backgrounds</h2>
          <div class="background-buttons">
            <button id="f4ButtonBackground1" class="bg-button">Classic</button>
            <button id="f4ButtonBackground2" class="bg-button">Neon</button>
            <button id="f4ButtonBackground3" class="bg-button">Faded 70's</button>
          </div>
          <div id="f4BackgroundSelected" class="background-selected">Background Selected: None</div>
        </div>
        
        <!-- Power-Up Setting -->
        <div class="option-group powerup-options">
          <label class="powerup-label">
            <input type="checkbox" id="powerup-checkbox" class="powerup-checkbox" ${powerUpMode ? "checked" : ""} />
            <span class="powerup-text">Power-ups</span>
          </label>
        </div>
      
      </div>
      <button id="forza4ApplyCustom" class="customization-button">Apply</button>
    </section>
  `;
  return html;
}


export function forza4Config() {


    const token1ColorPicker = document.getElementById('token1ColorPicker');
    const token2ColorPicker = document.getElementById('token2ColorPicker');
    const forza4ApplyCustom = document.getElementById('forza4ApplyCustom');
    const f4ButtonBackground1 = document.getElementById('f4ButtonBackground1'); 
    const f4ButtonBackground2 = document.getElementById('f4ButtonBackground2');
    const f4ButtonBackground3 = document.getElementById('f4ButtonBackground3');
    const f4BackgroundSelected = document.getElementById('f4BackgroundSelected');
    const f4powerupCheckbox = document.getElementById('powerup-checkbox');

    token1ColorPicker.value = token1Color;
    token2ColorPicker.value = token2Color;
    f4powerupCheckbox.checked = powerUpMode;

    f4ButtonBackground1.style.width = '20%';
    f4ButtonBackground2.style.width = '20%';
    f4ButtonBackground3.style.width = '20%';

    forza4ApplyCustom.addEventListener('click', () => {
        setToken1Color(token1ColorPicker.value);
        setToken2Color(token2ColorPicker.value);
        //window.history.pushState({}, path, window.location.origin + path);
        navigate("/modes", "Back to Game Modes");
    });

    f4ButtonBackground1.addEventListener('click', () => {
        f4BackgroundSelected.textContent = 'Background Selected: Classic';
        setBoardBackground("bg1");
    });
    
    f4ButtonBackground2.addEventListener('click', () => {
        f4BackgroundSelected.textContent = 'Background Selected: Neon';
        setBoardBackground("bg2");
    });
    
    f4ButtonBackground3.addEventListener('click', () => {
        f4BackgroundSelected.textContent = 'Background Selected: Faded 70s';
        setBoardBackground("bg3");
    });
    

    f4powerupCheckbox.addEventListener('change', () => {
            if (f4powerupCheckbox.checked) {
                setPowerUpState(true);
            }
            else {
                setPowerUpState(false);
            }
        });
}