declare module "graphics" {
  interface GraphicsBitmap {
    width: number;
    height: number;
    bpp: 1 | 16;
    data: string | Uint8Array;
  }

  interface GraphicsFont {
    bitmap: Uint8Array;
    glyphs: Uint8Array;
    width: number;
    height: number;
    first: number;
    last: number;
    advanceX: number;
    advanceY: number;
  }

  type GraphicsContextRotation = 0 | 1 | 2 | 3;

  interface GraphicsBitmapDrawingOptions {
    color?: number;
    transparent?: number;
    scaleX?: number;
    scaleY?: number;
    flipX?: boolean;
    flipY?: boolean;
  }

  interface GraphicsContextOptions {
    rotation: GraphicsContextRotation;
    setPixel: (x: number, y: number, color: number) => void;
    getPixel: (x: number, y: number) => number;
    fillRect?: (
      x: number,
      y: number,
      w: number,
      h: number,
      color: number
    ) => void;
  }

  class GraphicsContext {
    constructor(
      width: number,
      height: number,
      options?: GraphicsContextOptions
    );
    getWidth(): number;
    getHeight(): number;
    clearScreen(): void;
    color16(red: number, green: number, blue: number): number;
    fillScreen(color: number): void;
    setRotation(rotation: GraphicsContextRotation): void;
    getRotation(): GraphicsContextRotation;
    setColor(color: number): void;
    setFillColor(color: number): void;
    getFillColor(): number;
    setFontColor(color: number): void;
    getFontColor(): number;
    setFont(font: GraphicsFont | null): void;
    setFontScale(scaleX: number, scaleY: number): void;
    setPixel(x: number, y: number, color: number): void;
    getPixel(x: number, y: number): number;
    drawLine(x0: number, y0: number, x1: number, y1: number): void;
    drawRect(x: number, y: number, w: number, h: number): void;
    fillRect(x: number, y: number, w: number, h: number): void;
    drawCircle(x: number, y: number, r: number): void;
    fillCircle(x: number, y: number, r: number): void;
    drawRoundRect(x: number, y: number, w: number, h: number, r: number): void;
    fillRoundRect(x: number, y: number, w: number, h: number, r: number): void;
    drawText(x: number, y: number, text: string): void;
    measureText(text: string): { width: number; height: number };
    drawBitmap(
      x: number,
      y: number,
      bitmap: GraphicsBitmap,
      options?: GraphicsBitmapDrawingOptions
    ): void;
  }

  interface BufferedGraphicsContextOptions {
    rotation: GraphicsContextRotation;
    bpp: 1 | 16;
    display: (buffer: Uint8Array) => void;
  }

  class BufferedGraphicsContext extends GraphicsContext {
    constructor(
      width: number,
      height: number,
      options?: BufferedGraphicsContextOptions
    );
    buffer: Uint8Array;
    display(): void;
  }
}
