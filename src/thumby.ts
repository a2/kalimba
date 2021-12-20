import { BufferedGraphicsContext } from "graphics";
import SSD1306 from "./ssd1306-i2c";
import Input from "./input";

const Speaker = 28;

export default class Thumby {
  static Speaker = Speaker;
  static Input = Input;
  static Button = class Button {
    pin: Input;
    lastState: boolean = false;

    constructor(pin: Input) {
      this.pin = pin;
    }

    get value() {
      return digitalRead(this.pin);
    }

    pressed() {
      return !!(1 - this.value);
    }

    justPressed() {
      let returnValue = false;
      const currentState = this.pressed();
      if (!this.lastState && currentState) returnValue = true;
      this.lastState = currentState;
      return returnValue;
    }
  };

  lcd: SSD1306;
  ctx: BufferedGraphicsContext;

  buttonA: Thumby.Button;
  buttonB: Thumby.Button;
  buttonUp: Thumby.Button;
  buttonDown: Thumby.Button;
  buttonRight: Thumby.Button;
  buttonLeft: Thumby.Button;

  constructor() {
    const allPins = [
      Input.A,
      Input.B,
      Input.UP,
      Input.DOWN,
      Input.LEFT,
      Input.RIGHT,
    ];
    pinMode(allPins, INPUT_PULLUP);

    const i2c = board.i2c(0, { sda: 16, scl: 17, baudrate: 1000000 });
    this.lcd = new SSD1306(i2c, { width: 72, height: 40, rst: 18 });

    this.ctx = this.lcd.getContext();
    this.ctx.clearScreen();
    this.ctx.display();

    this.buttonA = new Thumby.Button(Input.A);
    this.buttonB = new Thumby.Button(Input.B);
    this.buttonUp = new Thumby.Button(Input.UP);
    this.buttonDown = new Thumby.Button(Input.DOWN);
    this.buttonLeft = new Thumby.Button(Input.LEFT);
    this.buttonRight = new Thumby.Button(Input.RIGHT);
  }

  tone(freq: number, duration: number) {
    tone(Speaker, freq, { duration });
  }

  actionPressed() {
    return this.buttonA.pressed() || this.buttonB.pressed();
  }

  actionJustPressed() {
    return this.buttonA.justPressed() || this.buttonB.justPressed();
  }

  directionalPressed() {
    return (
      this.buttonUp.pressed() ||
      this.buttonDown.pressed() ||
      this.buttonLeft.pressed() ||
      this.buttonRight.pressed()
    );
  }

  directionalJustPressed() {
    return (
      this.buttonUp.justPressed() ||
      this.buttonDown.justPressed() ||
      this.buttonLeft.justPressed() ||
      this.buttonRight.justPressed()
    );
  }

  inputPressed() {
    return this.actionPressed() || this.directionalPressed();
  }

  inputJustPressed() {
    return this.actionJustPressed() || this.directionalJustPressed();
  }
}

declare namespace Thumby {
  type Button = typeof Thumby.Button.prototype;
}
