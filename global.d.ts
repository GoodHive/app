export {};

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
  }
}
