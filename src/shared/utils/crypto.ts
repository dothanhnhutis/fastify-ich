import crypto from "node:crypto";

type AeadAlgorithm =
  | "aes-128-gcm"
  | "aes-192-gcm"
  | "aes-256-gcm"
  | "chacha20-poly1305";

export class CryptoAES {
  private IV_LENGTH = 12;
  private TAG_LENGTH = 16;

  constructor(private algorithm: AeadAlgorithm, private keyBase64: string) {}

  encrypt(text: string): string {
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const key = Buffer.from(this.keyBase64, "base64");

    const cipher = crypto.createCipheriv(
      this.algorithm,
      key,
      iv
    ) as crypto.CipherGCM;

    const encrypted = Buffer.concat([
      cipher.update(text, "utf8"),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    return Buffer.concat([iv, encrypted, tag]).toString("base64url");
  }

  static encrypt(algorithm: AeadAlgorithm, keyBase64: string, text: string) {
    return new CryptoAES(algorithm, keyBase64).encrypt(text);
  }

  decrypt(encryptedBase64URL: string): string {
    const data = Buffer.from(encryptedBase64URL, "base64url");
    const key = Buffer.from(this.keyBase64, "base64");

    const iv = data.subarray(0, this.IV_LENGTH);
    const tag = data.subarray(data.length - this.TAG_LENGTH);
    const encryptedText = data.subarray(
      this.IV_LENGTH,
      data.length - this.TAG_LENGTH
    );

    const decipher = crypto.createDecipheriv(
      this.algorithm,
      key,
      iv
    ) as crypto.DecipherGCM;
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(encryptedText),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  }

  static decrypt(
    algorithm: AeadAlgorithm,
    keyBase64: string,
    encryptedBase64URL: string
  ) {
    return new CryptoAES(algorithm, keyBase64).decrypt(encryptedBase64URL);
  }
}
