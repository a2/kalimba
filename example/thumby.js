const { SSD1306 } = require('./ssd1306-i2c');
const { BufferedGraphicsContext } = require('graphics');
const { I2C } = require('i2c');

const Input = {
    A: 27,
    // B: 24, // 24 is an invalid pin according to Kaluma
    // (valid if ((pin <= 28) && !((pin == 23) || (pin == 24)))
    B: 22,
    UP: 4,
    DOWN: 6,
    LEFT: 3,
    RIGHT: 5,
};

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
        this.lcd.context = new BufferedGraphicsContext(this.lcd.width, this.lcd.height, {
            rotation: this.lcd.rotation,
            bpp: 1,
            display: (buffer) => {
                const hex = Array.from(buffer, byte => byte.toString(16).padStart(2, '0')).join('');
                console.log('###DISPLAY###' + hex + '###/DISPLAY###');
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
