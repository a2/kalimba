const { Input, Speaker, Thumby } = require('./thumby')

const MAX_FPS = 60

class Game extends Thumby {
    init() {
        super.init();

        this.bit = true;
    }

    start() {
        this.init();
        this.update();
    }

    update() {
        this.bit = !this.bit;

        this.gc.clearScreen();
        if (this.bit) this.gc.drawText(1, 1, 'hi!');
        console.log(this.bit);
        this.gc.display();

        this.update();
    }
}

const game = new Game();
game.start();
