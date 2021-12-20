export {};

declare global {
  function analogRead(pin: number): number;
  function analogWrite(pin: number, duty?: number, frequency?: number): void;
  function tone(
    pin: number,
    frequency?: number,
    options?: { duration?: number; duty?: number; inversion?: number }
  ): void;
  function noTone(pin: number): void;
}
