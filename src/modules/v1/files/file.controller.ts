import { FastifyReply, FastifyRequest } from "fastify";
import path from "path";
import fs from "fs";
import mime from "mime-types";

// cách 1: best
export async function viewFileController(
  request: FastifyRequest<{ Params: { dir: string; filename: string } }>,
  reply: FastifyReply
) {
  const { dir, filename } = request.params;

  console.log("dir", dir, filename);

  // Security: Ngăn path traversal attacks
  if (
    dir.includes("..") ||
    dir.includes("/") ||
    dir.includes("\\") ||
    filename.includes("..") ||
    filename.includes("/") ||
    filename.includes("\\")
  ) {
    return reply.code(400).send({ error: "Invalid filename" });
  }

  const filePath = path.join(__dirname, "uploads", dir, filename);

  console.log("filePath", filePath);

  try {
    // Sử dụng fs.promises thay vì fs.existsSync (non-blocking)
    const stats = await fs.promises.stat(filePath);

    if (!stats.isFile()) {
      return reply.code(404).send({ error: "File not found" });
    }

    // Lấy content-type từ đuôi file
    const contentType = mime.lookup(filePath) || "application/octet-stream";

    // Set headers
    reply.header("Content-Type", contentType);
    reply.header("Content-Length", stats.size);
    reply.header("Content-Disposition", `inline; filename="${filename}"`);
    reply.header("Cache-Control", "private, max-age=3600"); // Cache 1 giờ
    reply.header("Last-Modified", stats.mtime.toUTCString());

    // Support range requests (cho video, audio, large files)
    const range = request.headers.range;
    if (range && contentType.startsWith("video/")) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;

      if (start >= stats.size || end >= stats.size) {
        reply.code(416).header("Content-Range", `bytes */${stats.size}`);
        return reply.send("Range Not Satisfiable");
      }

      reply.code(206);
      reply.header("Content-Range", `bytes ${start}-${end}/${stats.size}`);
      reply.header("Content-Length", end - start + 1);
      reply.header("Accept-Ranges", "bytes");

      return fs.createReadStream(filePath, { start, end });
    }

    // Normal response
    reply.header("Accept-Ranges", "bytes");
    return fs.createReadStream(filePath);
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return reply.code(404).send({ error: "File not found" });
    } else if (error.code === "EACCES") {
      return reply.code(403).send({ error: "Access denied" });
    } else {
      //   req.log.error(error);
      return reply.code(500).send({ error: "Internal server error" });
    }
  }
}

export async function downloadFileController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const dir = "uploads";
  const filename = "logo.png";
  const filePath = path.join(__dirname, dir, filename);

  try {
    const stats = await fs.promises.stat(filePath);
    const contentType = mime.lookup(filePath) || "application/octet-stream";

    reply.header("Content-Type", contentType);
    reply.header("Content-Length", stats.size);
    // DOWNLOAD: dùng attachment thay vì inline
    reply.header("Content-Disposition", `attachment; filename="${filename}"`);

    return fs.createReadStream(filePath);
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return reply.code(404).send({ error: "File not found" });
    }
    return reply.code(500).send({ error: "Internal server error" });
  }
}
