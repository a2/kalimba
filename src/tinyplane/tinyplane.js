import plane from "./plane";
import Thumby from "../runtime/thumby";

export default class TinyPlane extends Thumby {
  scene;
  fps;

  play() {
    this.title();
  }

  repeatUntil(callback) {
    const id = setInterval(() => {
      callback(() => {
        clearInterval(id);
        if (this.scene === id) {
          this.scene = undefined;
        }
      });
    }, 1000 / this.fps);
    this.scene = id;
  }

  title() {
    let spriteX = 7;
    let spriteY = 2;
    let frame = 0;

    this.repeatUntil((done) => {
      if (this.buttonA.pressed()) {
        this.game();
        return done();
      }

      frame += 1;
      const angle = 22.5 * Math.round(4 * Math.sin(frame / 12));
      const bitmap = plane(Math.abs(angle));

      if (spriteY - bitmap.height / 2 < this.ctx.getHeight()) {
        const angleRadians = ((90 - angle) * Math.PI) / 180;
        spriteX += 2 * Math.cos(angleRadians);
        spriteY += 0.1 + 2 * Math.sin(angleRadians);
      }

      this.ctx.clearScreen();
      if (spriteY - bitmap.height / 2 < this.ctx.getHeight()) {
        this.ctx.drawBitmap(
          spriteX - bitmap.width / 2,
          spriteY - bitmap.height / 2,
          bitmap,
          { flipX: angle < 0 }
        );
      } else if (Math.floor(frame / 30) % 2 == 0) {
        const start = "start";
        const startSize = this.ctx.measureText(start);
        this.ctx.drawText(
          (this.ctx.getWidth() - startSize.width) >> 1,
          this.ctx.getHeight() - startSize.height,
          start
        );
      }

      const tinyPlane = "TinyPlane";
      const tinyPlaneSize = this.ctx.measureText(tinyPlane);
      this.ctx.drawText(
        (this.ctx.getWidth() - tinyPlaneSize.width) >> 1,
        (this.ctx.getHeight() - tinyPlaneSize.height) >> 1,
        tinyPlane.substring(0, Math.floor(frame / 5))
      );
      this.ctx.display();
    });
  }

  game() {
    let score = 0;
    let cameraY = 0;
    let spriteX = 0;
    let spriteY = 2;
    let spriteA = 90;

    let blockH = 5;
    let blockGap = 20;
    let blockMinW = 20;
    let blockMaxW = this.ctx.getWidth() - 20;
    let blocks = [
      { x: 0, y: 20, width: this.ctx.getWidth() >> 1, height: blockH },
    ];

    this.repeatUntil((done) => {
      // update sprite
      if (this.buttonLeft.pressed()) {
        spriteA = Math.max(-90, spriteA - 45 / 4);
      }
      if (this.buttonRight.pressed()) {
        spriteA = Math.min(90, spriteA + 45 / 4);
      }

      const roundSpriteAngle = 22.5 * Math.round(spriteA / 22.5);
      const sprite = plane(Math.abs(spriteA));
      const angle = ((90 - roundSpriteAngle) * Math.PI) / 180;
      spriteX += Math.cos(angle);
      const dy = 0.1 + 2 * Math.sin(angle);
      spriteY += dy;
      if (spriteY >= Math.floor(20 - sprite.height / 2 + 0.5)) {
        cameraY += dy;
      }

      if (spriteX <= 0) {
        spriteX = 0;
        spriteA = 0;
      } else if (spriteX >= this.ctx.getWidth()) {
        spriteX = this.ctx.getWidth();
        spriteA = 0;
      }

      // Update blocks
      for (const block of blocks) {
        if (block.y + block.height < cameraY) {
          score += 1;
          blocks.splice(blocks.indexOf(block), 1);
        } else {
          if (
            spriteX + 2 >= block.x &&
            spriteX - 2 <= block.x + block.width &&
            spriteY + 2 >= block.y &&
            spriteY - 2 <= block.y + block.height
          ) {
            // game over
            this.gameOver(score);
            return done();
          }
        }
      }

      // Add new blocks
      let lastBlock = blocks[blocks.length - 1];
      while (lastBlock.y + lastBlock.height < cameraY + this.ctx.getHeight()) {
        const dx = Math.random() * 20 - 10;
        let x = 0;
        const y = lastBlock.y + lastBlock.height + blockGap;
        let w = Math.min(blockMaxW, Math.max(blockMinW, lastBlock.x + dx));

        if (lastBlock.x === 0) {
          w = Math.min(
            blockMaxW,
            Math.max(blockMinW, this.ctx.getWidth() - lastBlock.width + dx)
          );
          x = this.ctx.getWidth() - w;
        }

        lastBlock = { x, y, width: w, height: blockH };
        blocks.push(lastBlock);
      }

      // Draw
      this.ctx.clearScreen();
      this.ctx.drawBitmap(
        spriteX - sprite.width / 2,
        spriteY - sprite.height / 2 - cameraY,
        sprite,
        { flipX: spriteA < 0 }
      );

      blocks.forEach(({ x, y, width, height }) => {
        // Extend outer edge beyonds screen
        if (x === 0) {
          x -= 1;
          width += 1;
        }
        if (x + width === this.ctx.getWidth()) {
          width += 1;
        }

        this.ctx.drawRect(x, y - cameraY, width, height);
      });

      this.ctx.drawText(0, 0, score.toString());
      this.ctx.display();
    });
  }

  gameOver(score) {
    let frame = 0;

    const gameOver = "Game Over";
    const gameOverSize = this.ctx.measureText(gameOver);

    const scoreString = score.toString();
    const scoreSize = this.ctx.measureText(scoreString);

    const retryString = "Retry A/B";
    const retrySize = this.ctx.measureText(retryString);

    const padding = 4;
    const totalHeight =
      gameOverSize.height +
      padding +
      scoreSize.height +
      padding +
      retrySize.height;
    const startY = (this.ctx.getHeight() - totalHeight) >> 1;

    this.repeatUntil((done) => {
      if (this.buttonA.pressed() || this.buttonB.pressed()) {
        this.game();
        return done();
      }

      this.ctx.clearScreen();

      this.ctx.drawText(
        (this.ctx.getWidth() - gameOverSize.width) >> 1,
        startY,
        gameOver
      );

      this.ctx.drawText(
        (this.ctx.getWidth() - scoreSize.width) >> 1,
        startY + gameOverSize.height + padding,
        scoreString
      );

      if (Math.floor(frame / 30) % 2 === 0) {
        this.ctx.drawText(
          (this.ctx.getWidth() - retrySize.width) >> 1,
          startY + gameOverSize.height + padding + scoreSize.height + padding,
          retryString
        );
      }

      this.ctx.display();

      frame += 1;
    });
  }
}
