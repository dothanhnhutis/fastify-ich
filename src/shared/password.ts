import argon2 from "argon2";
export default class Password {
  static hash(data: string): Promise<string> {
    return argon2.hash(data);
  }
  static async compare(hashData: string, data: string) {
    return await argon2.verify(hashData, data).catch(() => false);
  }
}
