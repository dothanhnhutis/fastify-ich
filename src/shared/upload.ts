import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import type { MultipartFile } from "@fastify/multipart";
import { v7 as uuidv7 } from "uuid";

type FileStoreType = {
  originalname: string;
  mimetype: string;
  encoding: string;
  filename: string;
  path: string;
  size: number;
  destination: string;
};

class FileStore {
  constructor(private root: string) {
    const rootDir = path.join(__dirname, this.root);
    if (!fs.existsSync(rootDir)) {
      fs.mkdirSync(rootDir, { recursive: true });
    }
  }

  async singleUpload(
    data: MultipartFile,
    options?: { subDir?: string }
  ): Promise<FileStoreType> {
    const rootDir = path.join(__dirname, this.root);
    const id = uuidv7();
    const { file, filename: originalname, mimetype, encoding } = data;
    const filename = `${id}.${mimetype.split("/")[1]}`;
    const dir = path.join(
      rootDir,
      ...(options?.subDir?.split(/(\\|\/)/) || "")
    );

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const toPath = path.join(dir, filename);
    try {
      await pipeline(file, fs.createWriteStream(toPath));
    } catch (err: unknown) {
      throw new Error("File save failed");
    }

    const stats = fs.statSync(toPath);
    const fileSizeInBytes = stats.size;
    const destination = path.join(this.root, options?.subDir || "");

    return {
      originalname,
      mimetype,
      encoding,
      filename,
      destination,
      path: toPath,
      size: fileSizeInBytes,
    };
  }

  async multipleUpload(
    parts: AsyncIterableIterator<MultipartFile>,
    options?: { subDir?: string }
  ): Promise<FileStoreType[]> {
    const files: FileStoreType[] = [];
    for await (const part of parts) {
      files.push(await this.singleUpload(part, options));
    }
    return files;
  }
}

export const privateFileUpload = new FileStore("uploads");
export const publicFileUpload = new FileStore("public");
