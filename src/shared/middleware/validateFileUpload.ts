import { FastifyRequest, FastifyReply } from "fastify";
import { BadRequestError } from "../error-handler";
import { StatusCodes } from "http-status-codes";

type FileOptions = {
  name: string;
};

export default function validateFileUpload(options: FileOptions) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!request.isMultipart())
        return reply.code(StatusCodes.BAD_REQUEST).send({
          statusCode: StatusCodes.BAD_REQUEST,
          statusText: "BAD_REQUEST",
          data: { message: "Request must be multipart/form-data" },
        });

      const data = await request.file({
        limits: {
          fieldNameSize: 50,
          fileSize: 2 * 1024 * 1024,
          files: 1,
          fields: 0,
        },
      });

      if (!data || data.fieldname != "avatar") {
        return reply.code(StatusCodes.BAD_REQUEST).send({
          statusCode: StatusCodes.BAD_REQUEST,
          statusText: "BAD_REQUEST",
          data: { message: "Không có tập tin nào được tải lên." },
        });
      }
    } catch (error) {}
  };
}
