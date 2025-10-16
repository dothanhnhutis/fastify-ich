import crypto from "node:crypto";
import type { FastifyError } from "fastify";

export const generateId = async () => {
  const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
  return randomBytes.toString("hex");
};

export const generateOTP = (
  props?: { digits?: number } | undefined
): string => {
  if (props?.digits && props.digits <= 0)
    throw new Error("Digits must be a positive integer");
  return Array.from({ length: props?.digits || 6 })
    .map(() => Math.floor(Math.random() * 10))
    .join("");
};

export const hasDuplicateByKeys = <
  T extends {
    [index: string]: string | number | (string | number | object)[] | object;
  }
>(
  arr: T[],
  keys: (keyof T)[]
): boolean => {
  const seen = new Set();
  return arr.some((obj) => {
    const compositeKey = keys.map((k) => obj[k]).join("|");
    if (seen.has(compositeKey)) return true;
    seen.add(compositeKey);
    return false;
  });
};

export const gcd = (a: number, b: number): number => {
  return b === 0 ? a : gcd(b, a % b);
};

export const getAspectFraction = (width: number, height: number): string => {
  const divisor = gcd(width, height);
  const w = width / divisor;
  const h = height / divisor;
  return `${w}:${h}`;
};

const dateStringRegex: RegExp = /^\d{4}-\d{2}-\d{2}$/;
const timestamptzStringRegex: RegExp =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:.\d+)(?:Z|[+-]\d{2}:\d{2})$/;

export const isDateString = (s: string): boolean => dateStringRegex.test(s);
export const isTimestamptzString = (s: string): boolean =>
  timestamptzStringRegex.test(s);

export function isFastifyError(err: unknown): err is FastifyError {
  return typeof err === "object" && err !== null && "code" in err;
}
