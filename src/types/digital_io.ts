export {};

declare global {
  enum PinMode {
    INPUT = 0,
    OUTPUT = 1,
    INPUT_PULLUP = 2,
    INPUT_PULLDOWN = 3,
  }

  const INPUT = PinMode.INPUT;
  const OUTPUT = PinMode.OUTPUT;
  const INPUT_PULLUP = PinMode.INPUT_PULLUP;
  const INPUT_PULLDOWN = PinMode.INPUT_PULLDOWN;

  enum PinValue {
    HIGH = 1,
    LOW = 0,
  }

  const HIGH = PinValue.HIGH;
  const LOW = PinValue.LOW;

  enum PinEvent {
    LOW_LEVEL = 1,
    HIGH_LEVEL = 2,
    FALLING = 4,
    RISING = 8,
    CHANGE = 12,
  }

  const LOW_LEVEL = PinEvent.LOW_LEVEL;
  const HIGH_LEVEL = PinEvent.HIGH_LEVEL;
  const FALLING = PinEvent.FALLING;
  const RISING = PinEvent.RISING;
  const CHANGE = PinEvent.CHANGE;

  function pinMode(pin: number | number[], mode: PinMode): void;
  function digitalRead(pin: number): PinMode;
  function digitalWrite(pin: number, value?: PinValue): void;
  function digitalWrite(pin: number[], value?: number): void;
  function digitalToggle(pin: number): void;
  function setWatch(
    callback: (pin: number) => void,
    pin: number,
    events?: PinEvent,
    debounce?: number
  ): number;
  function clearWatch(id: number): void;

  interface PulseReadOptions {
    timeout?: number;
    startState?: number;
    mode: PinMode;
    trigger?: {
      pin?: number;
      startState?: PinValue;
      interval?: number[];
    };
  }

  function pulseRead(
    pin: number,
    count: number,
    options?: PulseReadOptions
  ): number[] | null;
  function pulseWrite(
    pin: number,
    startState: PinValue,
    interval: number[]
  ): number;
}
