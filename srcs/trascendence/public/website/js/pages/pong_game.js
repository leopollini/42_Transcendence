export default function PongGame()
{
    return `
    <canvas id="gameCanvas"></canvas>
    <div class="menu-button-wrapper">
        <button class="button-style hidden-button pong-margin" id="backToBracketButton">Back to Bracket</button>  
        <button class="button-style hidden-button pong-margin" id="backToRobinButton">Back to Ranking</button>
        <button class="button-style hidden-button pong-margin" id="backToMenuButton">Back to Menu</button>
    </div>
    `;
}
