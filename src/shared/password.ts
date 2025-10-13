import argon2 from "argon2";
import genPass from "generate-password";

export const Password = {
  hash(data: string): Promise<string> {
    return argon2.hash(data);
  },
  async compare(hashData: string, data: string) {
    return await argon2.verify(hashData, data).catch(() => false);
  },
  generate() {
    return genPass.generate({
      length: 15,
      numbers: true,
      uppercase: true,
      lowercase: true,
      symbols: "@$!%*?&",
      strict: true,
    });
  },
};
