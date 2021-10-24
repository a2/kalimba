const { Input, Speaker, Thumby } = require('./thumby')

const MAX_FPS = 30

class Game extends Thumby {
    constructor() {
        super()
    }

    start() {
        this.updateTimer = setInterval(() => {
            this.update()
        }, Math.round(1000 / MAX_FPS))

        for (let key in Object.keys(Input)) {
            const value = Input[key];
            setWatch(() => this.keyDown(value), value, FALLING)
        }
    }

    update() {

    }
}

console.log('hello, world')
const game = Game()
game.start()
