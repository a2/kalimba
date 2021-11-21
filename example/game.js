const { Input, Speaker, Thumby } = require('./thumby')

const MAX_FPS = 60

class Game extends Thumby {
    init() {
        super.init();

        this.x = 0;
        this.y = 0;
    }

    start() {
        this.init();
        this.update();
    }

    update() {
        if (this.input(Input.UP)) this.y -= 1;
        if (this.input(Input.DOWN)) this.y += 1;
        if (this.input(Input.RIGHT)) this.x += 1;
        if (this.input(Input.LEFT)) this.x -= 1;

        this.gc.clearScreen();
        this.gc.drawText(this.x, this.y, 'hi!');
        this.gc.display();

        setTimeout(() => this.update(), 0);
    }
}

const game = new Game();
game.start();
