declare module "i2c" {
  enum I2CMode {
    MASTER = 0,
    SLAVE = 1,
  }

  interface I2COptions {
    mode?: I2CMode;
    baudrate?: number;
    scl?: number;
    sda?: number;
  }

  class I2C {
    declare static MASTER: I2CMode;
    declare static SLAVE: I2CMode;
    constructor(bus: number, options?: I2COptions);
    write(
      data: Uint8Array | string,
      address: number,
      timeout?: number,
      count?: number
    ): number;
    read(length: number, address: number, timeout?: number): Uint8Array | null;
    memWrite(
      memAddress: number,
      data: Uint8Array | string,
      address: number,
      memAddr16bit?: 0 | 1,
      timeout?: number,
      count?: number
    ): number;
    memRead(
      memAddress: number,
      length: number,
      address: number,
      memAddr16bit?: 0 | 1,
      timeout?: number
    ): Uint8Array | null;
    close(): void;
  }
}
