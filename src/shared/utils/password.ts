import argon2 from "argon2";
import genPass from "generate-password";

export const hashPassword = (data: string): Promise<string> => {
  return argon2.hash(data);
};
export const comparePassword = async (hashData: string, data: string) => {
  return await argon2.verify(hashData, data).catch(() => false);
};
export const generatePassword = () => {
  return genPass.generate({
    length: 15,
    numbers: true,
    uppercase: true,
    lowercase: true,
    symbols: "@$!%*?&",
    strict: true,
  });
};
