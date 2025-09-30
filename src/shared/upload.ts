import fs from "fs";
import path from "path";
import { v7 as uuidv7 } from "uuid";
import { pipeline } from "stream/promises";
import { MultipartFile } from "@fastify/multipart";

export type FileUploadType = {
  originalName: string;
  mimeType: string;
  encoding: string;
  fileName: string;
  path: string;
  size: number;
  destination: string;
};

class FileUpload {
  constructor(private root: string) {
    const rootDir = path.join(__dirname, this.root);
    if (!fs.existsSync(rootDir)) {
      fs.mkdirSync(rootDir, { recursive: true });
    }
  }

  async singleUpload(
    data: MultipartFile,
    options?: { subDir?: string }
  ): Promise<FileUploadType> {
    const rootDir = path.join(__dirname, this.root);
    const id = uuidv7();
    const { file, filename: originalName, mimetype, encoding } = data;
    const fileName = `${id}.${mimetype.split("/")[1]}`;
    const dir = path.join(
      rootDir,
      ...(options?.subDir?.split(/(\\|\/)/) || "")
    );

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const toPath = path.join(dir, fileName);
    try {
      await pipeline(file, fs.createWriteStream(toPath));
    } catch (err) {
      throw new Error("File save failed");
    }

    const stats = fs.statSync(toPath);
    const fileSizeInBytes = stats.size;
    const destination = path.join(this.root, options?.subDir || "");

    return {
      originalName,
      mimeType: mimetype,
      encoding,
      fileName,
      destination,
      path: toPath,
      size: fileSizeInBytes,
    };
  }

  async multipleUpload(
    parts: AsyncIterableIterator<MultipartFile>,
    options?: { subDir?: string }
  ): Promise<FileUploadType[]> {
    const files: FileUploadType[] = [];
    for await (const part of parts) {
      files.push(await this.singleUpload(part, options));
    }
    return files;
  }
}

export const privateFileUpload = new FileUpload("uploads");
export const publicFileUpload = new FileUpload("public");
