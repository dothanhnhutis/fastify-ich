import fs from "fs";
import path from "path";
import { v7 as uuidv7 } from "uuid";
import { pipeline } from "stream/promises";
import { MultipartFile } from "@fastify/multipart";
import { FastifyReply, FastifyRequest, preHandlerHookHandler } from "fastify";
import { BadRequestError } from "../error-handler";

declare module "fastify" {
  interface FastifyRequest {
    multerField?: FilesMap;
  }
}

const DEFAULT_CONFIG = {
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
    files: 9,
  },
  allowedMimeTypes: ["image/jpeg", "image/png", "image/gif", "application/pdf"],
  uploadDir: "/uploads",
};

export type FileUploadType = {
  originalname: string;
  mimetype: string;
  encoding: string;
  filename: string;
  path: string;
  size: number;
  destination: string;
};

type MulterFileConfig = {
  type: "file";
  name: string;
  fileSize?: number;
  maxCount?: number;
  allowedMimeTypes?: string[];
  uploadDir?: string;
};

type MulterTextConfig = {
  type: "text";
  name: string;
  fieldSize: number;
};

type MulterConfig = MulterFileConfig | MulterTextConfig;

interface FilesMap {
  [fieldname: string]: FileUploadType[] | string;
}

/**
 * Kiểm tra MIME type của file
 */
function validateMimeType(mimetype: string, allowedTypes: string[]): boolean {
  if (!allowedTypes || allowedTypes.length === 0) return true;
  return allowedTypes.includes(mimetype);
}

/**
 * Lưu file vào disk
 */
async function saveFile(
  file: MultipartFile,
  uploadDir: string
): Promise<FileUploadType> {
  const id = uuidv7();
  const { filename: originalname, mimetype, encoding } = file;
  const filename = `${id}.${mimetype.split("/")[1]}`;
  const dir = path.join(__dirname, ...uploadDir.split(/(\\|\/)/));

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const filepath = path.join(dir, filename);

  await pipeline(file.file, fs.createWriteStream(filepath));

  return {
    originalname,
    mimetype,
    encoding,
    filename,
    destination: uploadDir.replace(/(\\|\/)/, "/"),
    path: filepath,
    size: fs.statSync(filepath).size,
  };
}

/**
 * Đọc file stream toàn bộ và lưu vào disk
 */
async function saveFileFromStream(
  part: MultipartFile,
  uploadDir: string,
  maxSize: number
): Promise<FileUploadType> {
  let size = 0;
  const chunks: Buffer[] = [];

  const { filename: originalname, mimetype, encoding } = part;
  for await (const chunk of part.file) {
    size += chunk.length;
    if (size > maxSize) {
      part.file.destroy();
      throw new Error(
        `File "${part.filename}" quá lớn. Kích thước tối đa: ${maxSize} bytes`
      );
    }
    chunks.push(chunk);
  }

  const buffer = Buffer.concat(chunks);
  const filename = `${uuidv7()}.${mimetype.split("/")[1]}`;
  const dir = path.join(__dirname, ...uploadDir.split(/(\\|\/)/));
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const filepath = path.join(dir, filename);

  fs.writeFileSync(filepath, buffer);

  return {
    originalname,
    mimetype,
    encoding,
    filename,
    destination: uploadDir.replace(/(\\|\/)/, "/"),
    path: filepath,
    size,
  };
}
/**
 * Đọc file từng phần chunk và lưu vào disk
 */
async function saveFileFromStreamV2(
  part: MultipartFile,
  uploadDir: string,
  maxSize: number
): Promise<FileUploadType> {
  let size = 0;
  const { filename: originalname, mimetype, encoding } = part;
  const filename = `${uuidv7()}.${mimetype.split("/")[1]}`;
  const dir = path.join(__dirname, ...uploadDir.split(/(\\|\/)/));

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const filepath = path.join(dir, filename);
  const writeStream = fs.createWriteStream(filepath);

  try {
    for await (const chunk of part.file) {
      size += chunk.length;
      if (size > maxSize) {
        writeStream.destroy();
        fs.unlinkSync(filepath);
        throw new Error(
          `File "${part.filename}" quá lớn. Kích thước tối đa: ${maxSize} bytes`
        );
      }
      writeStream.write(chunk);
    }
    writeStream.end();
    return {
      originalname,
      mimetype,
      encoding,
      filename,
      destination: uploadDir.replace(/(\\|\/)/, "/"),
      path: filepath,
      size,
    };
  } catch (error) {
    // Cleanup nếu có lỗi
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    throw error;
  }
}

export const multerMiddleware = (
  fields: MulterConfig[]
): preHandlerHookHandler => {
  const fieldMap = new Map<
    string,
    | Omit<Required<MulterFileConfig>, "name">
    | Omit<Required<MulterTextConfig>, "name">
  >(
    fields.map((f) => {
      const { name, ...other } = f;
      return [
        f.name,
        other.type === "text"
          ? other
          : {
              type: "file",
              fileSize: other.fileSize || DEFAULT_CONFIG.limits.fileSize,
              maxCount: other.maxCount || DEFAULT_CONFIG.limits.files,
              allowedMimeTypes: other.allowedMimeTypes || [],
              uploadDir: other.uploadDir || DEFAULT_CONFIG.uploadDir,
            },
      ];
    })
  );
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.isMultipart())
      throw new BadRequestError("Request must be multipart/form-data");

    try {
      const parts = request.parts();
      const filesMap: FilesMap = {};

      for await (const part of parts) {
        const fieldname = part.fieldname;
        const field = fieldMap.get(fieldname);

        if (field === undefined)
          throw new Error(`Field '${fieldname}' không được phép`);

        if (part.type === "file" && field.type == "file") {
          if (!filesMap[fieldname]) {
            filesMap[fieldname] = [];
          }

          if (filesMap[fieldname].length >= field.maxCount) {
            // xoá các file đã lưu trước đó
            for (const key of Object.keys(filesMap)) {
              if (Array.isArray(filesMap[key])) {
                filesMap[key].forEach((f) => {
                  if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
                });
              }
            }

            throw new Error(
              `Field '${fieldname}' vượt quá số file cho phép (${field.maxCount})`
            );
          }
          // Kiểm tra MIME type
          if (!validateMimeType(part.mimetype, field.allowedMimeTypes)) {
            throw new Error(
              `Loại file ${
                part.mimetype
              } không được phép hoặc trống. Chỉ chấp nhận file có format: ${field.allowedMimeTypes.join(
                ", "
              )}`
            );
          }
          // Lưu file
          const fileInfo = await saveFileFromStreamV2(
            part,
            field.uploadDir,
            field.fileSize
          );

          (filesMap[fieldname] as FileUploadType[]).push(fileInfo);
        }

        if (part.type === "field" && field.type == "text") {
          if (Buffer.byteLength(part.value as string, "utf8") > field.fieldSize)
            throw new Error(
              `Field "${fieldname}" vượt quá số bytes cho phép (${field.fieldSize})`
            );

          filesMap[fieldname] = part.value as string;
        }
      }
      request.multerField = filesMap;
    } catch (error) {
      console.log(error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new BadRequestError(errorMessage);
    }
  };
};
