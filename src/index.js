import Kalimba from "./kalimba";
import kaluma from "../static/kaluma-rp2-pico-1.0.0-beta.12.uf2?asset";
import program from "./tinyplane?build";

const keyMap = {
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

(async () => {
  const canvas = document.getElementsByTagName("canvas")[0];
  const firmware = await fetch(kaluma.toString()).then((res) =>
    res.arrayBuffer()
  );
  const kalimba = new Kalimba(canvas, firmware, program);
  kalimba.start();

  const svg = document.querySelector("svg");
  const elementMap = {
    A: svg.querySelector("#a"),
    B: svg.querySelector("#b"),
    UP: svg.querySelector("#up"),
    DOWN: svg.querySelector("#down"),
    RIGHT: svg.querySelector("#right"),
    LEFT: svg.querySelector("#left"),
  };

  const downKeys = {};

  const processButton = (key, down) => {
    if (!key || down == downKeys[key]) return;
    downKeys[key] = down;
    kalimba.setButton(key, down);
    elementMap[key].style.opacity = down ? "1" : "0";
  };

  const keyHandler = (event) =>
    processButton(keyMap[event.code], event.type === "keydown");
  document.addEventListener("keydown", keyHandler);
  document.addEventListener("keyup", keyHandler);

  Object.entries(elementMap).forEach(([key, element]) => {
    element.addEventListener("mousedown", () => processButton(key, true));
    element.addEventListener("mouseup", () => processButton(key, false));
  });
})();
