import { I2C, I2COptions } from "i2c";
import { PWM } from "pwm";

declare global {
  class Board {
    name: string;
    LED: number;
    // gpio(pin: number, mode?: PinMode): GPIO
    // led(pin: number): LED
    button(pin: number, options?: ButtonOptions): Button;
    pwm(pin: number, frequency?: number, duty?: number): PWM;
    // adc(pin: number): ADC
    i2c(bus: number, options?: I2COptions): I2C;
    // spi(bus: number, options?: any): SPI
    // uart(port: number, options?: any): UART
  }

  const board: Board;
}
