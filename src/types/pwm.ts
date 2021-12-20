declare module "pwm" {
  class PWM {
    constructor(pin: number, frequency?: number, duty?: number);
    start(): void;
    stop(): void;
    getFrequency(): number;
    setFrequency(frequency: number): void;
    getDuty(): number;
    setDuty(duty: number): void;
    close(): void;
  }
}
