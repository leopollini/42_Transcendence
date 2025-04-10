import { forza4GameData } from "../main/forza4.js";

export function highlightColumn(game, col, highlight) {
    for (let row = 0; row < game.rows; row++) {
        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);

        // Check if there's token in a cell
        if (game.board[row][col] === 'token1') 
            cell.style.backgroundColor = forza4GameData.token1Color; 
        else if (game.board[row][col] === 'token2')
            cell.style.backgroundColor = forza4GameData.token2Color; 
        else //empty cell
            cell.style.backgroundColor = highlight ? 'rgba(255, 255, 255, 0.8)' : 'rgba(240, 240, 240, 0.5)';
    }
}
    
    
export function resetCellBorders() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.style.border = '1px solid #fff'; // Reset initial cell border color (white)
    });
}
