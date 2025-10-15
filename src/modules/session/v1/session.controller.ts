import env from "@shared/config/env";
import { BadRequestError } from "@shared/utils/error-handler";
import type { FastifyReply, FastifyRequest } from "fastify";
import { StatusCodes } from "http-status-codes";
import type { SessionRequestType } from "./session.schema";

export const SessionController = {
  async getAll(req: FastifyRequest, reply: FastifyReply) {
    const sessions = await req.sessions.findByUserId(req.currUser?.id ?? "");

    reply.code(StatusCodes.OK).send({
      statusCodes: StatusCodes.OK,
      statusText: "OK",
      data: {
        sessions,
      },
    });
  },

  async deleteById(
    req: FastifyRequest<SessionRequestType["DeleteById"]>,
    reply: FastifyReply
  ) {
    const { id } = req.params;
    const userId = req.currUser?.id ?? "";

    const sessionId = `${env.SESSION_KEY_NAME}:${userId}:${id}`;
    const session = await req.sessions.findById(sessionId);

    if (!session || session.userId !== userId)
      throw new BadRequestError("Phiên không tồn tại");

    if (sessionId === req.sessionId)
      throw new BadRequestError("Không thể xoá phiên hiện tại");

    await req.sessions.delete(sessionId);

    reply.code(StatusCodes.OK).send({
      data: { message: "Xoá phiên thành công" },
    });
  },
};
