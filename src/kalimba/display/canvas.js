export default class CanvasDisplayAdapter {
  constructor(canvas) {
    this.canvas = canvas;
  }

  draw(buffer) {
    const ctx = this.canvas.getContext("2d");
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let y = 0; y < Math.ceil(this.canvas.height / 8); y++) {
      for (let x = 0; x < this.canvas.width; x++) {
        const byte = buffer[y * this.canvas.width + x];
        for (let dy = 0; dy < 8; dy++) {
          ctx.fillStyle = byte & (1 << dy) ? "#fff" : "#000";
          ctx.fillRect(x, 8 * y + dy, 1, 1);
        }
      }
    }
  }
}
