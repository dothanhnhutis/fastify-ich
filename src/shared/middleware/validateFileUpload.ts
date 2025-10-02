import { FastifyRequest, FastifyReply, preHandlerHookHandler } from "fastify";
import { MultipartFile } from "@fastify/multipart";
import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";

// ==================== TYPES ====================

export interface UploadLimits {
  fileSize: number;
  files?: number;
}

export interface UploadOptions {
  limits?: Partial<UploadLimits>;
  allowedMimeTypes?: string[];
  uploadDir?: string;
}

export interface UploadedFileInfo {
  fieldname: string;
  originalname: string;
  filename: string;
  mimetype: string;
  path: string;
  size: number;
}

export interface FieldConfig {
  name: string;
  maxCount?: number;
}

export interface FilesMap {
  [fieldname: string]: UploadedFileInfo[];
}

// Extend FastifyRequest để thêm file và files properties
declare module "fastify" {
  interface FastifyRequest {
    file?: UploadedFileInfo;
    files?: UploadedFileInfo[] | FilesMap;
  }
}

// ==================== CONSTANTS ====================

const DEFAULT_CONFIG: Required<UploadOptions> & {
  limits: Required<UploadLimits>;
} = {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 10,
  },
  allowedMimeTypes: ["image/jpeg", "image/png", "image/gif", "application/pdf"],
  uploadDir: "./uploads",
};

// ==================== HELPER FUNCTIONS ====================

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
): Promise<UploadedFileInfo> {
  const filename = `${Date.now()}-${file.filename}`;
  const filepath = path.join(uploadDir, filename);

  // Tạo thư mục nếu chưa tồn tại
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  await pipeline(file.file, fs.createWriteStream(filepath));

  return {
    fieldname: file.fieldname,
    originalname: file.filename,
    filename: filename,
    mimetype: file.mimetype,
    path: filepath,
    size: fs.statSync(filepath).size,
  };
}

/**
 * Tạo tên file duy nhất
 */
function generateUniqueFilename(originalFilename: string): string {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .substring(7)}-${originalFilename}`;
}

/**
 * Đọc file stream và lưu vào disk
 */
async function saveFileFromStream(
  part: MultipartFile,
  uploadDir: string,
  maxSize: number
): Promise<UploadedFileInfo> {
  let size = 0;
  const chunks: Buffer[] = [];

  for await (const chunk of part.file) {
    size += chunk.length;
    if (size > maxSize) {
      throw new Error(
        `File "${part.filename}" quá lớn. Kích thước tối đa: ${maxSize} bytes`
      );
    }
    chunks.push(chunk);
  }

  const buffer = Buffer.concat(chunks);
  const filename = generateUniqueFilename(part.filename);
  const filepath = path.join(uploadDir, filename);

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  fs.writeFileSync(filepath, buffer);

  return {
    fieldname: part.fieldname,
    originalname: part.filename,
    filename: filename,
    mimetype: part.mimetype,
    path: filepath,
    size: size,
  };
}

// ==================== MIDDLEWARE FUNCTIONS ====================

/**
 * Middleware kiểm tra single upload
 * @param fieldname - Tên field trong form
 * @param options - Tùy chọn: limits, allowedMimeTypes, uploadDir
 */
export function singleUpload(
  fieldname: string,
  options: UploadOptions = {}
): preHandlerHookHandler {
  const config = {
    ...DEFAULT_CONFIG,
    ...options,
    limits: { ...DEFAULT_CONFIG.limits, ...options.limits },
  };

  return async function (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const data = await request.file({
        limits: {
          fileSize: config.limits.fileSize,
        },
      });

      if (!data) {
        throw new Error("Không tìm thấy file");
      }

      // Kiểm tra fieldname
      if (data.fieldname !== fieldname) {
        throw new Error(
          `Fieldname không hợp lệ. Mong đợi: "${fieldname}", nhận được: "${data.fieldname}"`
        );
      }

      // Kiểm tra MIME type
      if (!validateMimeType(data.mimetype, config.allowedMimeTypes)) {
        throw new Error(
          `Loại file không được phép. Chỉ chấp nhận: ${config.allowedMimeTypes.join(
            ", "
          )}`
        );
      }

      // Lưu file
      const fileInfo = await saveFile(data, config.uploadDir);

      // Gắn thông tin file vào request
      request.file = fileInfo;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      reply.code(400).send({
        error: "Upload failed",
        message: errorMessage,
      });
    }
  };
}

/**
 * Middleware kiểm tra multiple upload
 * @param fieldname - Tên field trong form (hoặc array các tên field)
 * @param maxCount - Số file tối đa
 * @param options - Tùy chọn: limits, allowedMimeTypes, uploadDir
 */
export function multipleUpload(
  fieldname: string | string[],
  maxCount?: number,
  options: UploadOptions = {}
): preHandlerHookHandler {
  const config = {
    ...DEFAULT_CONFIG,
    ...options,
    limits: { ...DEFAULT_CONFIG.limits, ...options.limits },
  };

  const maxFiles = maxCount || config.limits.files;
  const fieldnames = Array.isArray(fieldname) ? fieldname : [fieldname];

  return async function (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const parts = request.parts();
      const files: UploadedFileInfo[] = [];

      for await (const part of parts) {
        if (part.type === "file") {
          // Kiểm tra số lượng file
          if (files.length >= maxFiles) {
            throw new Error(
              `Vượt quá số lượng file cho phép. Tối đa: ${maxFiles} files`
            );
          }

          // Kiểm tra fieldname
          if (!fieldnames.includes(part.fieldname)) {
            throw new Error(
              `Fieldname không hợp lệ. Mong đợi: ${fieldnames.join(
                ", "
              )}, nhận được: "${part.fieldname}"`
            );
          }

          // Kiểm tra MIME type
          if (!validateMimeType(part.mimetype, config.allowedMimeTypes)) {
            throw new Error(
              `Loại file không được phép. Chỉ chấp nhận: ${config.allowedMimeTypes.join(
                ", "
              )}`
            );
          }

          // Lưu file
          const fileInfo = await saveFileFromStream(
            part,
            config.uploadDir,
            config.limits.fileSize
          );
          files.push(fileInfo);
        }
      }

      if (files.length === 0) {
        throw new Error("Không tìm thấy file nào");
      }

      // Gắn thông tin files vào request
      request.files = files;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      reply.code(400).send({
        error: "Upload failed",
        message: errorMessage,
      });
    }
  };
}

/**
 * Middleware để xử lý mixed fields (nhiều field khác nhau)
 * @param fields - Array các object {name, maxCount}
 * @param options - Tùy chọn
 */
export function fieldsUpload(
  fields: FieldConfig[],
  options: UploadOptions = {}
): preHandlerHookHandler {
  const config = {
    ...DEFAULT_CONFIG,
    ...options,
    limits: { ...DEFAULT_CONFIG.limits, ...options.limits },
  };

  const fieldMap = new Map<string, number>(
    fields.map((f) => [f.name, f.maxCount || 1])
  );

  return async function (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const parts = request.parts();
      const filesMap: FilesMap = {};

      for await (const part of parts) {
        if (part.type === "file") {
          const fieldname = part.fieldname;
          const maxCount = fieldMap.get(fieldname);

          if (maxCount === undefined) {
            throw new Error(`Field "${fieldname}" không được phép upload`);
          }

          if (!filesMap[fieldname]) {
            filesMap[fieldname] = [];
          }

          if (filesMap[fieldname].length >= maxCount) {
            throw new Error(
              `Field "${fieldname}" vượt quá số file cho phép (${maxCount})`
            );
          }

          // Kiểm tra MIME type
          if (!validateMimeType(part.mimetype, config.allowedMimeTypes)) {
            throw new Error(
              `Loại file không được phép. Chỉ chấp nhận: ${config.allowedMimeTypes.join(
                ", "
              )}`
            );
          }

          // Lưu file
          const fileInfo = await saveFileFromStream(
            part,
            config.uploadDir,
            config.limits.fileSize
          );
          filesMap[fieldname].push(fileInfo);
        }
      }

      request.files = filesMap;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      reply.code(400).send({
        error: "Upload failed",
        message: errorMessage,
      });
    }
  };
}

// ==================== VÍ DỤ SỬ DỤNG ====================

/*
import Fastify from 'fastify';
import fastifyMultipart from '@fastify/multipart';
import { singleUpload, multipleUpload, fieldsUpload } from './upload-middleware';

const fastify = Fastify({ logger: true });

// Đăng ký plugin multipart
await fastify.register(fastifyMultipart, {
  attachFieldsToBody: false,
});

// === SINGLE UPLOAD ===
fastify.post('/upload/single',
  { 
    preHandler: singleUpload('avatar', {
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
      allowedMimeTypes: ['image/jpeg', 'image/png'],
      uploadDir: './uploads/avatars',
    })
  },
  async (request, reply) => {
    return {
      message: 'File uploaded successfully',
      file: request.file,
    };
  }
);

// === MULTIPLE UPLOAD (cùng fieldname) ===
fastify.post('/upload/multiple',
  { 
    preHandler: multipleUpload('photos', 5, {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif'],
      uploadDir: './uploads/photos',
    })
  },
  async (request, reply) => {
    return {
      message: 'Files uploaded successfully',
      files: request.files,
    };
  }
);

// === FIELDS UPLOAD (nhiều field khác nhau) ===
fastify.post('/upload/fields',
  { 
    preHandler: fieldsUpload([
      { name: 'avatar', maxCount: 1 },
      { name: 'photos', maxCount: 3 },
      { name: 'documents', maxCount: 2 },
    ], {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
      uploadDir: './uploads/mixed',
    })
  },
  async (request, reply) => {
    return {
      message: 'Files uploaded successfully',
      files: request.files, // { avatar: [...], photos: [...], documents: [...] }
    };
  }
);

await fastify.listen({ port: 3000 });
*/
