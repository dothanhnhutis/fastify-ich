import fs from "fs";
import path from "path";
import { v7 as uuidv7 } from "uuid";
import { pipeline } from "stream/promises";
import { MultipartFile } from "@fastify/multipart";

type FileUploadType = {
  originalName: string;
  mimeType: string;
  encoding: string;
  fileName: string;
  path: string;
  size: number;
};

class FileUpload {
  constructor(private rootDir: string) {
    if (!fs.existsSync(this.rootDir)) {
      fs.mkdirSync(this.rootDir, { recursive: true });
    }
  }

  async singleUpload(
    data: MultipartFile,
    options?: { subDir?: string }
  ): Promise<FileUploadType> {
    const id = uuidv7();
    const { file, filename: originalName, mimetype, encoding } = data;
    const fileName = `${id}.${mimetype.split("/")[1]}`;
    const dir = path.join(this.rootDir, options?.subDir || "");

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

    return {
      originalName,
      mimeType: mimetype,
      encoding,
      fileName: fileName,
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
      // part = 1 file trong form-data
      files.push(await this.singleUpload(part, options));
    }
    return files;
  }
}

export default new FileUpload(path.join(__dirname, "uploads"));
