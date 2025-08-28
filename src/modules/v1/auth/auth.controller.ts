import { StatusCodes } from "http-status-codes";
import { FastifyReply, FastifyRequest } from "fastify";

import { SignInBodyType } from "./auth.schema";

import Password from "src/shared/password";
import { BadRequestError } from "@/shared/error-handler";
import { cryptoCookie } from "@/shared/constants";
import config from "@/shared/config";

export async function signInController(
  req: FastifyRequest<{
    Body: SignInBodyType;
  }>,
  reply: FastifyReply
) {
  const { email, password } = req.body;
  const user = await req.users.findByEmail(email);
  if (
    !user ||
    !user.password_hash ||
    !(await Password.compare(user.password_hash, password))
  )
    throw new BadRequestError("Email và mật khẩu không hợp lệ.");

  const session = await req.sessions.create({
    userId: user.id,
    ip: req.ip || req.ips?.[0] || "",
    provider: "credential",
    userAgentRaw: req.headers["user-agent"] || "",
  });

  const encryptSession = cryptoCookie.encrypt(session.sessionId);

  reply
    .code(StatusCodes.OK)
    .setCookie(config.SESSION_KEY_NAME, encryptSession, {
      ...session.cookie,
    })
    .send({
      statusCode: StatusCodes.OK,
      statusText: "OK",
      data: {
        message: "Đăng nhập thành công.",
      },
    });
}
