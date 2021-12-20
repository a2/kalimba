declare module "events" {
  export type ListenerSignature<L> = {
    [E in keyof L]: (...args: any[]) => any;
  };

  export type DefaultListener = {
    [k: string]: (...args: any[]) => any;
  };

  export class EventEmitter<L extends ListenerSignature<L> = DefaultListener> {
    addListener<U extends keyof L>(eventName: U, listener: L[U]): void;
    emit<U extends keyof L>(eventName: U, ...args: Parameters<L[U]>): void;
    once<U extends keyof L>(eventName: U, listener: L[U]): void;
    removeListener<U extends keyof L>(eventName: U, listener: L[U]): void;
    removeAllListeners<U extends keyof L>(eventName?: U): void;
    removeAllListeners(): void;
    off<U extends keyof L>(eventName: U, listener: L[U]): void;
    listeners<U extends keyof L>(eventName: U): L[U][];
    listenerCount<U extends keyof L>(eventName: U): number;
  }
}
