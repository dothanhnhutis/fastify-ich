import path from "path";
import fs from "fs";
import { FastifyError } from "fastify";

import { BadRequestError, PermissionError } from "./error-handler";

const dateStringRegex: RegExp = /^\d{4}-\d{2}-\d{2}$/;
const timestamptzStringRegex: RegExp =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:.\d+)(?:Z|[+-]\d{2}:\d{2})$/;

export const isDataString = (s: string): boolean => dateStringRegex.test(s);
export const isTimestamptzString = (s: string): boolean =>
  timestamptzStringRegex.test(s);

export function isFastifyError(err: unknown): err is FastifyError {
  return typeof err === "object" && err !== null && "code" in err;
}

export function securityPath(root: string, pathString: string) {
  // Security: Ngăn path traversal attacks

  // validate path
  const regex = /^(?:\/[a-zA-Z0-9._-]+)*\.(png|jpg|jpeg|gif|webp)$/i;
  if (!regex.test(pathString)) {
    throw new BadRequestError("Invalid file path");
  }

  const FILES_ROOT = path.join(__dirname, root);

  const shortFilePath = path.join(...pathString.split("/"));
  // chuẩn hóa path
  const absPath = path.resolve(FILES_ROOT, shortFilePath);
  // kiểm tra có nằm trong root không
  if (!absPath.startsWith(FILES_ROOT)) {
    throw new PermissionError("Forbidden");
  }
  return absPath;
}

export function deleteFile(pathString: string) {
  fs.unlink(pathString, (err) => {
    if (err) {
      console.log("xoá file thât bại.");
    }
    console.log("xoá file thanh công.");
  });
}
