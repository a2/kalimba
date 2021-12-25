const { RP2040, USBCDC, ConsoleLogger, LogLevel } = require("rp2040js");

import { Buffer } from "buffer/";
import { decodeBlock } from "uf2";

import { bootrom } from "./bootrom";
import Input from "../runtime/input";

export default class Kalimba {
  constructor({ display, firmware, program }) {
    this.display = display;
    this.firmware = firmware;
    this.program = program;

    const mcu = new RP2040();
    mcu.loadBootrom(bootrom);
    mcu.logger = new ConsoleLogger(LogLevel.Error);
    this.mcu = mcu;

    const cdc = new USBCDC(mcu.usbCtrl);
    cdc.onDeviceConnected = () => {
      Object.values(Input).forEach((pin) => mcu.gpio[pin].setInputValue(true));
      this.sendStringToPrompt(".load");
    };

    let lastLineOut = "";
    const decoder = new TextDecoder("utf8");
    cdc.onSerialData = (data) => {
      const chunk = decoder.decode(data);
      const lines = chunk.split("\n");
      lines[0] = lastLineOut + lines[0];
      lastLineOut = lines.pop();
      lines.forEach((line) => console.log(line));
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
        if (this.display) {
          this.display.draw(buffer);
        }
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

  getButton(button) {
    const pin = typeof button === "string" ? Input[button] : button;
    if (pin) return !this.mcu.gpio[pin].inputValue;
  }

  setButton(button, pressed) {
    const pin = typeof button === "string" ? Input[button] : button;
    if (pin) this.mcu.gpio[pin].setInputValue(!pressed);
  }
}
