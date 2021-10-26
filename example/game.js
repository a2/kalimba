const { Input, Speaker, Thumby } = require('./thumby')

const MAX_FPS = 30

class Game extends Thumby {
    init() {
        super.init();

        this.x = 0;
        this.y = 0;
    }

    start() {
        this.init();

        this.updateTimer = setInterval(() => {
            this.update();
        }, Math.round(1000 / MAX_FPS));

        for (const pin of Object.values(Input)) {
            setWatch(() => this.keyDown(pin), pin, FALLING);
            setWatch(() => this.keyUp(pin), pin, RISING);
        }

        this.update();
    }

    keyDown(key) {
        if (key === Input.UP) this.y -= 1;
        if (key === Input.DOWN) this.y += 1;
        if (key === Input.RIGHT) this.x += 1;
        if (key === Input.LEFT) this.x -= 1;
    }

    keyUp(key) { }

    update() {
        this.gc.clearScreen();
        this.gc.drawText(this.x, this.y, 'Hello, world!');
        this.gc.display();
    }
}

const game = new Game();
game.start();
