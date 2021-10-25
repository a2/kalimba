const { Input, Speaker, Thumby } = require('./thumby')

const MAX_FPS = 30

class Game extends Thumby {
    start() {
        this.init()

        this.updateTimer = setInterval(() => {
            this.update()
        }, Math.round(1000 / MAX_FPS))

        for (const [key, value] of Object.entries(Input)) {
            setWatch(() => this.keyDown(value), value, FALLING)
        }

        this.gc.drawText(0, 0, 'Hello, world!')
        this.gc.display()
    }

    keyDown(key) {

    }

    update() {

    }
}

const game = new Game()
game.start()
