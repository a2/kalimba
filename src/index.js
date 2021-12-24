import Kalimba from "./kalimba";
import firmware from "../static/kaluma-rp2-pico-1.0.0-beta.12.uf2?asset";
import program from "./tinyplane?build";

fetch(firmware)
  .then((response) => response.arrayBuffer())
  .then((firmware) => {
    console.log(program);
    const kalimba = new Kalimba(
      document.getElementsByTagName("canvas")[0],
      firmware,
      program
    );
    kalimba.start();
  });
