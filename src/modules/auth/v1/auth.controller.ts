import { BadRequestError } from "@shared/utils/error-handler";
import { comparePassword } from "@shared/utils/password";
import type { FastifyReply, FastifyRequest } from "fastify";
import { StatusCodes } from "http-status-codes";
import type { AuthRequestType } from "./auth.schema";

export const AuthController = {
  async signIn(
    req: FastifyRequest<AuthRequestType["SignIn"]>,
    reply: FastifyReply
  ) {
    const { email, password } = req.body;
    const user = await req.users.findUserByEmail(email);

    if (
      !user ||
      !user.password_hash ||
      !(await comparePassword(user.password_hash, password))
    )
      throw new BadRequestError(
        "AuthController.signIn function error: invalid password.",
        "Email và mật khẩu không hợp lệ.",
        { metadata: { sdsd: "123" } }
      );

    const { sessionId, cookie } = await req.sessions.create({
      userId: user.id,
      ip: req.ip || req.ips?.[0] || "",
      provider: "credential",
      userAgentRaw: req.headers["user-agent"] || "",
    });

    reply
      .code(StatusCodes.OK)
      .setSession(sessionId, { ...cookie })
      .send({
        statusCode: StatusCodes.OK,
        data: {
          message: "Đăng nhập thành công.",
        },
      });
  },
};
