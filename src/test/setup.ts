import "@testing-library/jest-dom";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  configurable: true,
  value: (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,

    // Deprecated but required by some libraries
    addListener: () => {},
    removeListener: () => {},

    // Modern standard
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
