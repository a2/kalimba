const { RP2040, USBCDC, ConsoleLogger, LogLevel } = require("rp2040js");

import { Buffer } from "buffer/";
import { decodeBlock } from "uf2";

import { bootrom } from "./bootrom";
import Input from "../runtime/input";

export default class Kalimba {
  static Input = Input;

  mcu;
  cdc;
  canvas;
  firmware;
  program;

  constructor({ canvas, firmware, program }) {
    this.canvas = canvas;
    this.firmware = firmware;
    this.program = program;

    const mcu = new RP2040();
    mcu.loadBootrom(bootrom);
    mcu.logger = new ConsoleLogger(LogLevel.Error);
    this.mcu = mcu;

    const cdc = new USBCDC(mcu.usbCtrl);
    cdc.onDeviceConnected = () => {
      const inputPins = [
        Input.A,
        Input.B,
        Input.UP,
        Input.DOWN,
        Input.LEFT,
        Input.RIGHT,
      ];
      for (let pin of inputPins) {
        mcu.gpio[pin].setInputValue(true);
      }

      this.sendStringToPrompt(".load");
    };

    let lastLineOut = "";
    const decoder = new TextDecoder("utf8");
    cdc.onSerialData = (data) => {
      const chunk = decoder.decode(data);
      const lines = chunk.split("\n");
      lines[0] = lastLineOut + lines[0];
      lastLineOut = lines.pop() || "";
      lines.forEach((line) => {
        console.log(line);
      });
    };
    this.cdc = cdc;

    this.loadFirmware(firmware);
    mcu.flash.set(Buffer.from(program + "\0", "utf8"), 0x100000);
    mcu.PC = 0x10000000;

    const i2c = mcu.i2c[0];
    i2c.onStart = () => i2c.completeStart();
    i2c.onConnect = () => i2c.completeConnect(true);

    let buffer = [];
    let displayLock = false;
    i2c.onWriteByte = (byte) => {
      buffer.push(byte);
      if (!displayLock && buffer.length > 4) buffer.shift();

      if (
        buffer[0] === 0 &&
        buffer[1] === 28 &&
        buffer[2] === 0 &&
        buffer[3] === 99
      ) {
        displayLock = true;
        buffer = [];
      }

      if (displayLock && buffer.length == 363) {
        buffer.splice(258, 1);
        buffer.splice(129, 1);
        buffer.splice(0, 1);
        this.parseDisplay(buffer);
        displayLock = false;
        buffer = [];
      }

      i2c.completeWrite(true);
    };
  }

  start() {
    this.mcu.execute();
  }

  // Based on https://git.io/JDQ3t
  loadFirmware(buffer) {
    const fileData = new Uint8Array(buffer);

    let fileIndex = 0;
    while (fileIndex < fileData.length) {
      const dataBlock = fileData.slice(fileIndex, fileIndex + 512);
      const { flashAddress, payload } = decodeBlock(dataBlock);
      this.mcu.flash.set(payload, flashAddress - 0x10000000);
      fileIndex += 512;
    }
  }

  sendBufferToPrompt(buffer) {
    for (const byte of buffer) {
      this.cdc.sendSerialByte(byte);
    }
  }

  sendStringToPrompt(string) {
    this.sendBufferToPrompt(Buffer.from(string + "\r", "utf8"));
  }

  parseDisplay(data) {
    const ctx = this.canvas.getContext("2d");
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let y = 0; y < Math.ceil(this.canvas.height / 8); y++) {
      for (let x = 0; x < this.canvas.width; x++) {
        const byte = data[y * this.canvas.width + x];
        for (let dy = 0; dy < 8; dy++) {
          ctx.fillStyle = byte & (1 << dy) ? "#fff" : "#000";
          ctx.fillRect(x, 8 * y + dy, 1, 1);
        }
      }
    }
  }

  setButton(button, pressed) {
    const pin = typeof button === "string" ? Input[button] : button;
    this.mcu.gpio[pin].setInputValue(!pressed);
  }
}
