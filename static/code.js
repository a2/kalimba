/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

const { SSD1306 } = __webpack_require__(2);
const { BufferedGraphicsContext } = __webpack_require__(3);
const { I2C } = __webpack_require__(4);
const { Input } = __webpack_require__(5);

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


/***/ }),
/* 2 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

const {BufferedGraphicsContext} = __webpack_require__(3);

/**
 * SSD1306 class
 */
class SSD1306 {
  /**
   * Setup SSD1306
   * @param {I2C} i2c
   * @param {Object} options
   *   .width {number=128}
   *   .height {number=64}
   *   .rst {number=-1}
   *   .address {number=0x3C}
   *   .extVcc {boolean=false}
   *   .rotation {number=0}
   */
  setup (i2c, options) {
    this.i2c = i2c;
    options = Object.assign({
      width: 128,
      height: 64,
      rst: -1,
      address: 0x3C, // 0x3C for 32px height, 0x3D for others
      extVcc: false,
      rotation: 0
    }, options);
    this.width = options.width;
    this.height = options.height;
    this.rst = options.rst;
    this.address = options.address;
    this.extVcc = options.extVcc;
    this.rotation = options.rotation;
    this.context = null;
    if (this.rst > -1) pinMode(this.rst, OUTPUT);
    this.reset();
    var initCmds = new Uint8Array([
      0xAE, // 0 disp off
      0xD5, // 1 clk div
      0x80, // 2 suggested ratio
      0xA8, this.height - 1, // 3 set multiplex, height-1
      0xD3, 0x00, // 5 display offset (no-offset)
      0x40, // 7 start line (line #0)
      0x8D, this.extVcc ? 0x10 : 0x14, // 8 charge pump
      0x20, 0x00, // 10 memory mode
      0xA1, // 12 seg remap 1
      0xC8, // 13 comscandec
      0xDA, this.height === 64 ? 0x12 : 0x02, // 14 set compins, height==64 ? 0x12:0x02,
      0x81, this.extVcc ? 0x9F : 0xCF, // 16 set contrast
      0xD9, this.extVcc ? 0x22 : 0xF1, // 18 set precharge
      0xDB, 0x40, // 20 set vcom detect
      0xA4, // 22 display all on
      0xA6, // 23 display normal (non-inverted)
      0x2E, // 24 deactivate scroll
      0xAF // 25 disp on
    ]);
    this.sendCommands(initCmds);
    delay(50);
  }

  sendCommands (cmds) {
    cmds.forEach(c => this.i2c.write(new Uint8Array([0, c]), this.address));
  }

  /**
   * Reset
   */
  reset () {
    if (this.rst > -1) {
      pinMode(this.rst, OUTPUT);
      digitalWrite(this.rst, HIGH);
      delay(1);
      digitalWrite(this.rst, LOW);
      delay(10);
      digitalWrite(this.rst, HIGH);
    }
  }

  /**
   * Return a graphic context
   * @return {GraphicContext}
   */
  getContext() {
    if (!this.context) {
      this.context = new BufferedGraphicsContext(this.width, this.height, {
        rotation: this.rotation,
        bpp: 1,
        display: (buffer) => {
          var cmds = new Uint8Array([
            0x22, // pages
            0, (this.height >> 3) - 1,
            0x21, // columns
            0, this.width - 1
          ]);
          this.sendCommands(cmds);
          var WIRE_MAX = 128;
          var chunk = new Uint8Array(WIRE_MAX + 1);
          chunk[0] = 0x40;
          for (var i = 0; i < buffer.byteLength; i += WIRE_MAX) {
            // chunk.set(new Uint8Array(buffer.buffer, i, WIRE_MAX), 1);
            chunk.set(new Uint8Array(buffer.buffer, i, Math.min(WIRE_MAX, buffer.byteLength - i)), 1);
            this.i2c.write(chunk, this.address);
          }
        }
      });
    }
    return this.context;
  }

  /**
   * Turn on
   */
  on () {
    this.i2c.write(new Uint8Array([0, 0xAF]), this.address);
  }
  
  /**
   * Turn off
   */
  off () {
    this.i2c.write(new Uint8Array([0, 0xAE]), this.address);
  }
  
  /**
   * Set contrast
   */
  setContrast (c) {
    this.i2c.write(new Uint8Array([0, 0x81, c]), this.address);
  }
}
 
exports.SSD1306 = SSD1306;


/***/ }),
/* 3 */
/***/ ((module) => {

"use strict";
module.exports = require("graphics");

/***/ }),
/* 4 */
/***/ ((module) => {

"use strict";
module.exports = require("i2c");

/***/ }),
/* 5 */
/***/ ((__unused_webpack_module, exports) => {

exports.Input = {
    A: 27,
    // B: 24, // 24 is an invalid pin according to Kaluma
    // (valid if ((pin <= 28) && !((pin == 23) || (pin == 24)))
    B: 22,
    UP: 4,
    DOWN: 6,
    LEFT: 3,
    RIGHT: 5,
};


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
const { Input, Speaker, Thumby } = __webpack_require__(1)

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

})();

/******/ })()
;