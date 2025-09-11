import { StatusCodes } from "http-status-codes";
import { FastifyReply, FastifyRequest } from "fastify";

import {
  CreateNewUserBodyType,
  GetUserByIdParamsType,
  GetUserDetailByIdParamsType,
  GetUserRolesByUserIdParamsType,
  QueryUsersType,
  UpdateUserByIdBodyType,
  UpdateUserByIdParamsType,
} from "./user.schema";
import config from "@/shared/config";
import { BadRequestError } from "@/shared/error-handler";
import { QueryRolesType } from "../roles/role.schema";

// Admin
export async function getUserRoleByIdController(
  req: FastifyRequest<{ Params: GetUserByIdParamsType }>,
  reply: FastifyReply
) {
  const existsUser = await req.users.findUserRoleById(req.params.id);
  if (!existsUser) throw new BadRequestError("Người dùng không tồn tại.");
  reply.code(StatusCodes.OK).send({
    statusCode: StatusCodes.OK,
    statusText: "OK",
    data: {
      user: existsUser,
    },
  });
}

export async function getRolesByUserIdController(
  req: FastifyRequest<{
    Params: GetUserRolesByUserIdParamsType;
    Querystring: QueryRolesType;
  }>,
  reply: FastifyReply
) {
  const existsUser = await req.users.findById(req.params.id);
  if (!existsUser) throw new BadRequestError("Người dùng không tồn tại.");
  const roles = await req.users.findRolesByUserId(req.params.id, req.query);
  reply.code(StatusCodes.OK).send({
    statusCode: StatusCodes.OK,
    statusText: "OK",
    data: roles,
  });
}

export async function getUserDetailByIdController(
  req: FastifyRequest<{ Params: GetUserDetailByIdParamsType }>,
  reply: FastifyReply
) {
  const userDetail = await req.users.findUserRoleDetailById(req.params.id);
  if (!userDetail) throw new BadRequestError("Người dùng không tồn tại.");
  reply.code(StatusCodes.OK).send({
    statusCode: StatusCodes.OK,
    statusText: "OK",
    data: {
      user: userDetail,
    },
  });
}

export async function queryUserController(
  req: FastifyRequest<{ Querystring: QueryUsersType }>,
  reply: FastifyReply
) {
  const data = await req.users.query(req.query);

  reply.code(StatusCodes.OK).send({
    statusCode: StatusCodes.OK,
    statusText: "OK",
    data,
  });
}

export async function updateUserByIdController(
  req: FastifyRequest<{
    Params: UpdateUserByIdParamsType;
    Body: UpdateUserByIdBodyType;
  }>,
  reply: FastifyReply
) {
  const { id } = req.params;

  const existsUser = await req.users.findById(id);
  if (!existsUser) throw new BadRequestError("Người dùng không tồn tại.");

  await req.users.update(id, req.body);

  reply.code(StatusCodes.OK).send({
    statusCode: StatusCodes.OK,
    statusText: "OK",
    data: {
      message: "Cập nhật người dùng thành công.",
    },
  });
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
      if (!role) throw new BadRequestError(`Quyền id='${id}' không tồn tại.`);
    }
  }
  await req.users.create(req.body);

  reply.code(StatusCodes.CREATED).send({
    statusCode: StatusCodes.OK,
    statusText: "CREATED",
    data: {
      message: "Tạo người dùng thành công.",
    },
  });
}

// Base
export async function currentUserController(
  req: FastifyRequest,
  reply: FastifyReply
) {
  reply.code(StatusCodes.OK).send({
    statusCode: StatusCodes.OK,
    statusText: "OK",
    data: {
      currentUser: req.currUser,
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
