import fs from "node:fs";
import path from "node:path";
import type { FastifyError } from "fastify";
import config from "./config";
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

export function convertImage(image: Image): ImageURL {
  const url = `${config.SERVER_URL}/api/v1${image.destination
    .replace("uploads", "files")
    .replace(/\\/g, "/")}/${image.file_name}`;

  return {
    id: image.id,
    height: image.height,
    width: image.width,
    size: image.size,
    fileName: image.file_name,
    url,
    created_at: image.created_at,
  };
}

export const buildSortField = (fields: string[]) => {
  return fields.flatMap((f) => [`${f}.asc`, `${f}.desc`]);
};
