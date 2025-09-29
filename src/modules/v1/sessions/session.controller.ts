import { StatusCodes } from "http-status-codes";
import { FastifyReply, FastifyRequest } from "fastify";
import config from "@/shared/config";
import { BadRequestError } from "@/shared/error-handler";
import { DeleteSessionByIdParamsType } from "./session.schema";

export class SessionController {
  static async getAll(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.currUser!;
    const sessions = await req.sessions.findByUserId(id);

    reply.code(StatusCodes.OK).send({
      statusCodes: StatusCodes.OK,
      statusText: "OK",
      data: {
        sessions,
      },
    });
  }

  static async deleteById(
    req: FastifyRequest<{ Params: DeleteSessionByIdParamsType }>,
    reply: FastifyReply
  ) {
    const { id } = req.params;
    const { id: userId } = req.currUser!;

    const sessionId = `${config.SESSION_KEY_NAME}:${userId}:${id}`;
    const session = await req.sessions.findById(sessionId);

    if (!session || session.userId != userId)
      throw new BadRequestError("Phiên không tồn tại");

    if (sessionId == req.sessionId)
      throw new BadRequestError("Không thể xoá phiên hiện tại");

    await req.sessions.delete(sessionId);

    reply.code(StatusCodes.OK).send({
      data: { message: "Xoá phiên thành công" },
    });
  }
}
