import { StatusCodes } from "http-status-codes";
import { FastifyReply, FastifyRequest } from "fastify";

import config from "@/shared/config";
import { BadRequestError } from "@/shared/error-handler";
import {
  CreateNewUserBodyType,
  UpdateUserByIdBodyType,
  UpdateUserByIdParamsType,
} from "./user.schema";
import Password from "@/shared/password";

export async function queryUserController(
  req: FastifyRequest,
  reply: FastifyReply
) {}

export async function updateUserByIdController(
  req: FastifyRequest<{
    Params: UpdateUserByIdParamsType;
    Body: UpdateUserByIdBodyType;
  }>,
  reply: FastifyReply
) {
  const { id } = req.params;
  const {} = req.body;
}

export async function createUserController(
  req: FastifyRequest<{ Body: CreateNewUserBodyType }>,
  reply: FastifyReply
) {
  const existsUser = await req.users.findByEmail(req.body.email);
  if (existsUser) throw new BadRequestError("Email đã tồn tại.");

  if (req.body.roleIds) {
    for (let id of req.body.roleIds) {
      const role = await req.roles.findById(id);
      if (!role) throw new BadRequestError(`Quyền id=${id} không tồn tại.`);
    }
  }
  const password = Password.generate();
  await req.users.create({ ...req.body, password });

  reply.code(StatusCodes.CREATED).send({
    statusCode: StatusCodes.OK,
    statusText: "CREATED",
    data: {
      message: "Tạo người dùng thành công.",
    },
  });
}

export async function currentUserController(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const { password_hash, ...currentUser } = req.currUser!;
  reply.code(StatusCodes.OK).send({
    statusCode: StatusCodes.OK,
    statusText: "OK",
    data: {
      currentUser: currentUser,
    },
  });
}

export async function logoutUserController(
  req: FastifyRequest,
  reply: FastifyReply
) {
  if (req.sessionId) {
    await req.sessions.delete(req.sessionId);
  }

  reply
    .code(StatusCodes.OK)
    .clearCookie(config.SESSION_KEY_NAME)
    .send({
      statusCode: StatusCodes.OK,
      statusText: "OK",
      data: {
        message: "Đăng xuất thành công",
      },
    });
}
