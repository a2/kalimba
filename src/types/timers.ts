export {};

declare global {
  function delay(msec: number): void;
  function millis(): number;
  function delayMicroseconds(usec: number): void;
  function micros(): number;
  function setTimeout(callback: () => void, timeout: number): number;
  function setInterval(callback: () => void, interval: number): number;
  function clearTimeout(id: number): void;
  function clearInterval(id: number): void;
}
