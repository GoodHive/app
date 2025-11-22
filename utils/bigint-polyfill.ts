export {};

declare global {
  interface BigInt {
    toJSON(): string;
  }
}

if (typeof BigInt !== "undefined") {
  const proto = BigInt.prototype as BigInt & { toJSON?: () => string };

  if (typeof proto.toJSON !== "function") {
    Object.defineProperty(BigInt.prototype, "toJSON", {
      value() {
        return this.toString();
      },
      writable: true,
      configurable: true,
    });
  }
}
