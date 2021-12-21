import { RP2040, USBCDC, ConsoleLogger, LogLevel } from "rp2040js";
import { bootrom } from "./bootrom";
import loadUF2 from "./load-uf2";
import { Buffer } from "buffer/";
import Input from "./input";

declare const code: string;

async function run() {
  const mcu = new RP2040();
  mcu.loadBootrom(bootrom);
  mcu.logger = new ConsoleLogger(LogLevel.Error);
  await loadUF2("./kaluma-rp2-pico-1.0.0-beta.12.uf2", mcu);

  const cdc = new USBCDC(mcu.usbCtrl);
  const sendBufferToPrompt = (buffer: Buffer) => {
    for (const byte of buffer) cdc.sendSerialByte(byte);
  };
  const sendStringToPrompt = (string: string) =>
    sendBufferToPrompt(Buffer.from(string + "\r", "utf8"));

  cdc.onDeviceConnected = () => {
    const allPins = [
      Input.A,
      Input.B,
      Input.UP,
      Input.DOWN,
      Input.LEFT,
      Input.RIGHT,
    ];
    for (let pin of allPins) {
      mcu.gpio[pin].setInputValue(true);
    }
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

  mcu.flash.set(Buffer.from(code + "\x00", "utf8"), 0x100000);
  mcu.PC = 0x10000000;
  mcu.execute();

  const i2c = mcu.i2c[0];
  i2c.onStart = () => i2c.completeStart();
  i2c.onConnect = () => i2c.completeConnect(true);

  let buffer: number[] = [];
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
      parseDisplay(buffer);
      displayLock = false;
      buffer = [];
    }

    i2c.completeWrite(true);
  };

  sendStringToPrompt(".load");

  return mcu;
}

const canvas = document.querySelector("canvas")!;

function parseDisplay(data: number[]) {
  if (!data) return;

  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < Math.ceil(canvas.height / 8); y++) {
    for (let x = 0; x < canvas.width; x++) {
      const byte = data[y * canvas.width + x];
      for (let dy = 0; dy < 8; dy++) {
        ctx.fillStyle = byte & (1 << dy) ? "#fff" : "#000";
        ctx.fillRect(x, 8 * y + dy, 1, 1);
      }
    }
  }
}

(async () => {
  const mcu = await run();

  const keyMap: { [key: string]: keyof typeof Input } = {
    // WASD
    KeyW: "UP",
    KeyA: "LEFT",
    KeyS: "DOWN",
    KeyD: "RIGHT",

    // Arrow keys
    ArrowUp: "UP",
    ArrowLeft: "LEFT",
    ArrowRight: "RIGHT",
    ArrowDown: "DOWN",

    // Action buttons
    KeyZ: "A",
    Comma: "A",

    KeyX: "B",
    Period: "B",
  };
  const svg = document.querySelector("svg")!;
  const elementMap: { [key in keyof typeof Input]: HTMLElement } = {
    A: svg.querySelector("#a")!,
    B: svg.querySelector("#b")!,
    UP: svg.querySelector("#up")!,
    DOWN: svg.querySelector("#down")!,
    RIGHT: svg.querySelector("#right")!,
    LEFT: svg.querySelector("#left")!,
  };

  const downKeys = {
    A: false,
    B: false,
    UP: false,
    DOWN: false,
    LEFT: false,
    RIGHT: false,
  };

  const processButton = (key: keyof typeof Input, down: boolean) => {
    if (!key || down == downKeys[key]) return;
    downKeys[key] = down;

    const pin = Input[key];
    mcu.gpio[pin].setInputValue(!down);

    elementMap[key].style.opacity = down ? "1" : "0";
  };

  const keyHandler = (event: KeyboardEvent) =>
    processButton(keyMap[event.code], event.type === "keydown");
  document.addEventListener("keydown", keyHandler);
  document.addEventListener("keyup", keyHandler);

  Object.entries(elementMap).forEach(([rawKey, element]) => {
    const key = rawKey as keyof typeof Input;
    element.addEventListener("mousedown", () => processButton(key, true));
    element.addEventListener("mouseup", () => processButton(key, false));
  });
})();
