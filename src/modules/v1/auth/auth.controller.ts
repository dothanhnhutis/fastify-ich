import { StatusCodes } from "http-status-codes";
import { FastifyReply, FastifyRequest } from "fastify";

import Password from "@/shared/password";
import { SignInBodyType } from "./auth.schema";
import { BadRequestError } from "@/shared/error-handler";

export async function signInController(
  req: FastifyRequest<{
    Body: SignInBodyType;
  }>,
  reply: FastifyReply
) {
  const { email, password } = req.body;
  const user = await req.users.findUserPasswordByEmail(email);

  if (
    !user ||
    !user.password_hash ||
    !(await Password.compare(user.password_hash, password))
  )
    throw new BadRequestError("Email và mật khẩu không hợp lệ.");

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
      statusText: "OK",
      data: {
        message: "Đăng nhập thành công.",
      },
    });
}
