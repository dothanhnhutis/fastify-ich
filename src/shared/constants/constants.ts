import config from "../config/env";
import { CryptoAES } from "../utils/crypto";

export const cryptoCookie = new CryptoAES(
  "aes-256-gcm",
  config.SESSION_SECRET_KEY
);
