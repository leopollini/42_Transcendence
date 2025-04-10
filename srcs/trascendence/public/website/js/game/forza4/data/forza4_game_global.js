
export let token1Color = '#ff0000';
export let token2Color = '#0000ff';
export let boardBackground = 'bg1';
export let powerUpMode = false;

export let f4matchData = {
    player1: "",
    player2: "",
    seconds:0,
    matchTime: "",
    moves: 0,
    timer: 0
};


export let forza4CustomData = {
    token1Color: "#ff0000",
    token2Color: "#0000ff",
    boardBackground: "bg1",
    powerUpMode: false
}


export function setToken1Color(color) {
    token1Color = color;
}

export function setToken2Color(color) {
    token2Color = color;
}

export function setBoardBackground(bg) {
    boardBackground = bg;
}

export function setPowerUpState(state) {
    powerUpMode = state;
}
