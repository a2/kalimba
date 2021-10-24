const { SSD1306 } = require('@niklauslee/ssd1306-i2c')

const Input = {
    A: 27,
    B: 24,
    UP: 4,
    DOWN: 6,
    LEFT: 3,
    RIGHT: 5,
}

const Speaker = 28

class Thumby {
    constructor() {
        pinMode(Input.A, INPUT_PULLUP)
        pinMode(Input.B, INPUT_PULLUP)
        pinMode(Input.UP, INPUT_PULLUP)
        pinMode(Input.DOWN, INPUT_PULLUP)
        pinMode(Input.LEFT, INPUT_PULLUP)
        pinMode(Input.RIGHT, INPUT_PULLUP)

        this.lcd = new SSD1306()
        this.lcd.setup(board.i2c(0), { width: 72, height: 40 })

        this.gc = this.lcd.getContext()
        this.gc.clearScreen()
        this.gc.display()
    }

    input(key) {
        return 1 - digitalRead(key)
    }

    tone(freq, duration) {
        this.tone(Speaker, freq, { duration })
    }
}

exports.Input = Input
exports.Speaker = Speaker
exports.Thumby = Thumby
