import { canvas, ctx } from './globals.js'; 
export class Paddle {
    constructor(x, upKey, downKey) {
        this.width = canvas.width * 0.01;
        this.height = canvas.height * 0.2;
        this.x = x - this.width / 2;
        this.y = canvas.height / 2 - this.height / 2;
        this.radius = this.width / 2;
        this.baseSpeed = canvas.height * 0.008; // Base speed based on screen height
        this.speed = this.baseSpeed; // Initialize speed based on canvas height
        this.upKey = upKey;
        this.downKey = downKey;
        this.moveUp = false;
        this.moveDown = false;
    }

    handleInput(key, isPressed) {
        if (key === 'W' || key === 'S') key = key.toLowerCase();
        if (key === this.upKey) this.moveUp = isPressed;
        if (key === this.downKey) this.moveDown = isPressed;
    }

    update() {
        if (this.moveUp && this.y > 15) this.y -= this.speed;
        if (this.moveDown && this.y + this.height < canvas.height - 15) this.y += this.speed;
    }

    resize(oldCanvasWidth, oldCanvasHeight, newCanvasWidth, newCanvasHeight) {
        // Aggiorna l'altezza e la velocità della racchetta in base alle nuove dimensioni del canvas
        this.height = newCanvasHeight * 0.2; // Adatta l'altezza della racchetta in base alla nuova altezza del canvas
        this.speed = (newCanvasHeight / oldCanvasHeight) * this.baseSpeed; // Adatta la velocità in base al cambiamento dell'altezza
        this.y = newCanvasHeight / 2 - this.height / 2; // Riposiziona la racchetta al centro
    
        if (this.isPaddle2) {  // Aggiungi una verifica per vedere se è la paddle destra
            this.x = newCanvasWidth - this.width - 10;  // Imposta la posizione orizzontale della paddle2 sulla destra
        }
    }
      

    // Metodo per muovere la racchetta
    move(direction) {
        if (direction === 'up')
            this.y = Math.max(15, this.y - this.speed);  // Evita di superare il bordo superiore
        else if (direction === 'down')
            this.y = Math.min(canvas.height - this.height - 15, this.y + this.speed);  // Evita di superare il bordo inferiore
    }

    // Previsione della posizione Y della palla
    predictBallY(ball) {
        if (ball.speedx > 0) {
            let timeToReachAI = (window.innerWidth - ball.x) / ball.speedx;
            let futureBallY = ball.y + ball.speedy * timeToReachAI;

            const maxBounces = 10;
            let bounces = 0;
            while ((futureBallY < 0 || futureBallY > window.innerHeight) && bounces < maxBounces) {
                bounces++;
                if (futureBallY < 0)
                    futureBallY = -futureBallY;
                else if (futureBallY > canvas.height)
                    futureBallY = 2 * canvas.height - futureBallY;
            }
            return futureBallY;
        }
        return ball.y;
    }

    move_ia(ball, lastMoveTime) {
        const now = Date.now();
        if (now - lastMoveTime > 1000) { // 1 secondo
            lastMoveTime = now;
    
            // Controlla se la palla sta andando verso destra (verso la paddle2)
            if (ball.speedX > 0) {
                this.speed = this.baseSpeed * 0.40;
    
                let targetY = this.predictBallY(ball);  // Prevedi la posizione della palla
                let distance = targetY - (this.y + this.height / 2);  // Calcola la distanza dalla posizione della paddle
                let direction = Math.sign(distance);  // Direzione per il movimento della paddle
                let aiSpeed = this.speed * (canvas.height / 500) * 0.5;  // Applica un rallentamento alla velocità
    
                // Muovi la paddle dell'IA in base alla distanza dalla palla
                if (Math.abs(distance) > aiSpeed)
                    this.y += aiSpeed * direction;
                else
                    this.y += distance;
    
                // Limita il movimento della paddle dentro i confini del canvas
                if (this.y < 0) this.y = 0;
                if (this.y + this.height > canvas.height) this.y = canvas.height - this.height;
                if (distance < -5) this.move('up');
                else if (distance > 5) this.move('down');
            }
        }
    }    

    render() {
        ctx.fillStyle = 'white';
        this.drawRoundedRect(ctx);
    }

    drawRoundedRect(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.x + this.radius, this.y);
        ctx.lineTo(this.x + this.width - this.radius, this.y);
        ctx.arcTo(this.x + this.width, this.y, this.x + this.width, this.y + this.radius, this.radius);
        ctx.lineTo(this.x + this.width, this.y + this.height - this.radius);
        ctx.arcTo(this.x + this.width, this.y + this.height, this.x + this.width - this.radius, this.y + this.height, this.radius);
        ctx.lineTo(this.x + this.radius, this.y + this.height);
        ctx.arcTo(this.x, this.y + this.height, this.x, this.y + this.height - this.radius, this.radius);
        ctx.lineTo(this.x, this.y + this.radius);
        ctx.arcTo(this.x, this.y, this.x + this.radius, this.y, this.radius);
        ctx.fill();
        ctx.closePath();
    }
}