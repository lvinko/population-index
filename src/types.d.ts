declare global {
  interface Window {
    OneSignalDeferred: ((oneSignal: OneSignal) => Promise<void>)[];
  }
}

export {};