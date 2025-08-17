import type {Bridge} from './preload';

declare global {
  interface Window {
    bridge: Bridge;
  }
}

export {};
