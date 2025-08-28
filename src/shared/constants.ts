import config from "./config";
import { CryptoAES } from "./crypto";

export const cryptoCookie = new CryptoAES(
  "aes-256-gcm",
  config.SESSION_SECRET_KEY
);
