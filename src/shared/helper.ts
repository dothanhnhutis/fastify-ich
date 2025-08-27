import crypto from "crypto";

export default class Helper {
  static async generateId() {
    const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
    return randomBytes.toString("hex");
  }

  static generateOTP(props?: { digits?: number } | undefined): string {
    if (props && props.digits && props.digits <= 0)
      throw new Error("Digits must be a positive integer");
    return Array.from({ length: props?.digits || 6 })
      .map(() => Math.floor(Math.random() * 10))
      .join("");
  }

  static hasDuplicateByKeys<T extends { [index: string]: any }>(
    arr: T[],
    keys: (keyof T)[]
  ): boolean {
    const seen = new Set();
    return arr.some((obj) => {
      const compositeKey = keys.map((k) => obj[k]).join("|");
      if (seen.has(compositeKey)) return true;
      seen.add(compositeKey);
      return false;
    });
  }

  static gcd(a: number, b: number): number {
    return b === 0 ? a : Helper.gcd(b, a % b);
  }

  static getAspectFraction(width: number, height: number): string {
    const divisor = Helper.gcd(width, height);
    const w = width / divisor;
    const h = height / divisor;
    return `${w}:${h}`;
  }
}
