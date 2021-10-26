const { SSD1306 } = require('./ssd1306-i2c');
const { BufferedGraphicsContext } = require('graphics');
const { I2C } = require('i2c');
const { Input } = require('./input');

const Speaker = 28;

class Thumby {
    constructor() {
        this.lcd = null;
        this.gc = null;
    }

    init() {
        pinMode(Input.A, INPUT_PULLUP);
        pinMode(Input.B, INPUT_PULLUP);
        pinMode(Input.UP, INPUT_PULLUP);
        pinMode(Input.DOWN, INPUT_PULLUP);
        pinMode(Input.LEFT, INPUT_PULLUP);
        pinMode(Input.RIGHT, INPUT_PULLUP);

        const i2c = new I2C(0, { sda: 16, scl: 17, baudrate: 1000000 });
        this.lcd = new SSD1306();
        this.lcd.setup(i2c, { width: 72, height: 40, rst: 18, address: 0x3D });

        let lastMessage = null;
        this.lcd.context = new BufferedGraphicsContext(this.lcd.width, this.lcd.height, {
            rotation: this.lcd.rotation,
            bpp: 1,
            display: (buffer) => {
                const message = '###DISPLAY###' + buffer.join(',') + '###/DISPLAY###';
                if (message !== lastMessage) {
                    console.log(message);
                    lastMessage = message;
                }
            }
        });

        this.gc = this.lcd.getContext();
        this.gc.clearScreen();
        this.gc.display();
    }

    input(key) {
        return 1 - digitalRead(key);
    }

    tone(freq, duration) {
        tone(Speaker, freq, { duration });
    }
}

exports.Input = Input;
exports.Speaker = Speaker;
exports.Thumby = Thumby;
