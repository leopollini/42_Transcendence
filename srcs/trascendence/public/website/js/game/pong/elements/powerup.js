export class Powerup {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.width = this.canvas.width * 0.06;
        this.height = this.canvas.width * 0.06;
        this.x = this.canvas.width / 2 - this.width / 2;
        this.y = Math.random() * (this.canvas.height - this.height);
        this.type = this.getType();

        this.sprites = {};
        this.loadImages();
        this.frameIndex = 0;   // Current animation frame
        this.frameWidth = 182;
        this.frameHeight = 182;
        this.totalFrames = 8;
        this.frameDelay = 4;  // Animation speed (bigger value = slower amim)
        this.frameCounter = 0; // For frame change
    }


    loadImages() {
        const types = ["shrinker", "teleport", "invisible"];
        types.forEach(type => {
            this.sprites[type] = new Image();
            this.sprites[type].src = `website/images/${type}_spritesheet.png`;

            this.sprites[type].onerror = () => {
                this.sprites[type] = null;
            };

            this.sprites[type].onload = () => {
            };
        });
    }

    getType() {
        const typeNum = Math.floor(Math.random() * 3) + 1;

        switch (typeNum) {
            case 1:
                return "shrinker";
            case 2:
                return "teleport";
            case 3:
                return "invisible";
        }
    }

    resize() {
        this.width = this.canvas.width * 0.06;
        this.height = this.canvas.width * 0.06;
        this.x = this.canvas.width / 2 - this.width / 2;
        this.y = Math.random() * (this.canvas.height - this.height);
    }

    updateAnimation() {
        this.frameCounter++;
        if (this.frameCounter >= this.frameDelay) {
            this.frameCounter = 0;
            this.frameIndex = (this.frameIndex + 1) % this.totalFrames;
        }
    }

    // render() {
    //         if (this.type === "shrinker")
    //             this.ctx.fillStyle = "#00ff00";
    //         else if (this.type === "teleport")
    //             this.ctx.fillStyle = "#0000ff";
    //         else
    //             this.ctx.fillStyle = "#ff0000";
    //         this.ctx.fillRect(this.x, this.y, this.width, this.height);
    // }

    render() {
        if (this.sprites[this.type]) {
            this.sprite = this.sprites[this.type];
            if (this.sprite.complete && this.sprite.naturalWidth !== 0 && this.sprite.naturalHeight !== 0) {  // If sprite loaded
                this.updateAnimation();

                this.ctx.drawImage(
                    this.sprite,
                    this.frameIndex * this.frameWidth, 0, // Select correct frame
                    this.frameWidth, this.frameHeight,   // Frame dimensions
                    this.x, this.y,                      // Frame position
                    this.width, this.height
                );
            }
            else {
                this.ctx.clearRect(this.x, this.y, this.width, this.height);
                //console.warn(`Sprite non ancora caricata: website/images/${this.type}_spritesheet.png`);
            }
        } else {
            this.ctx.clearRect(this.x, this.y, this.width, this.height);
        }
    }
}

export function handlePowerups(game) {
    // Generate a new power-up every 5 seconds
    if (!game.powerUpTimerStarted) {
        game.powerUpTimerStarted = true;
        setTimeout(() => {
            if (!game.gameEnd) {
                let power_up = new Powerup(game.canvas, game.ctx);
                game.powerup.push(power_up)
            }

        }, 5000);
    }
}

