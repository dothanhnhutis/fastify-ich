import argon2 from "argon2";
import genPass from "generate-password";

export default class Password {
  static hash(data: string): Promise<string> {
    return argon2.hash(data);
  }
  static async compare(hashData: string, data: string) {
    return await argon2.verify(hashData, data).catch(() => false);
  }

  static genAndHash() {
    return Password.hash(
      genPass.generate({
        length: 15,
        numbers: true,
        uppercase: true,
        lowercase: true,
        symbols: "@$!%*?&",
      })
    );
  }
}
