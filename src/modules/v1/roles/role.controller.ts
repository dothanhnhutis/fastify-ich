import { StatusCodes } from "http-status-codes";
import { FastifyReply, FastifyRequest } from "fastify";

import {
  CreateNewRoleBodyType,
  GetRoleByIdParamsType,
  GetRoleDetailByIdParamsType,
  GetUsersByRoleIdParamsType,
  QueryRolesType,
  UpdateRoleByIdBodyType,
  UpdateRoleByIdParamsType,
} from "./role.schema";
import { BadRequestError } from "@/shared/error-handler";
import { QueryUsersType } from "../users/user.schema";

export async function getUsersByRoleIdController(
  req: FastifyRequest<{
    Params: GetUsersByRoleIdParamsType;
    Querystring: QueryUsersType;
  }>,
  reply: FastifyReply
) {
  const role = await req.roles.findUsersByRoleId(req.params.id, req.query);

  reply.code(StatusCodes.OK).send({
    statusCode: StatusCodes.OK,
    statusText: "OK",
    data: role,
  });
}

export async function getRoleDetailByIdController(
  req: FastifyRequest<{ Params: GetRoleDetailByIdParamsType }>,
  reply: FastifyReply
) {
  const role = await req.roles.findRoleDetailById(req.params.id);
  if (!role) throw new BadRequestError("Vai trò không tồn tại.");

  reply.code(StatusCodes.OK).send({
    statusCode: StatusCodes.OK,
    statusText: "OK",
    data: role,
  });
}

export async function getRoleByIdController(
  req: FastifyRequest<{ Params: GetRoleByIdParamsType }>,
  reply: FastifyReply
) {
  const role = await req.roles.findRoleById(req.params.id);
  if (!role) throw new BadRequestError("Vai trò không tồn tại.");

  reply.code(StatusCodes.OK).send({
    statusCode: StatusCodes.OK,
    statusText: "OK",
    data: {
      role,
    },
  });
}

export async function queryRolesController(
  req: FastifyRequest<{
    Querystring: QueryRolesType;
  }>,
  reply: FastifyReply
) {
  const data = await req.roles.findRoles(req.query);

  reply.code(StatusCodes.OK).send({
    statusCode: StatusCodes.OK,
    statusText: "OK",
    data,
  });
}

export async function createRoleController(
  req: FastifyRequest<{ Body: CreateNewRoleBodyType }>,
  reply: FastifyReply
) {
  const role = await req.roles.create(req.body);
  reply.code(StatusCodes.OK).send({
    statusCode: StatusCodes.OK,
    statusText: "OK",
    data: {
      message: "Tạo vai trò thành công.",
      role,
    },
  });
}

export async function updateRoleByIdController(
  req: FastifyRequest<{
    Params: UpdateRoleByIdParamsType;
    Body: UpdateRoleByIdBodyType;
  }>,
  reply: FastifyReply
) {
  const role = await req.roles.findRoleById(req.params.id);
  if (!role) throw new BadRequestError("Vai trò không tồn tại.");

  await req.roles.update(role.id, req.body);

  reply.code(StatusCodes.OK).send({
    statusCode: StatusCodes.OK,
    statusText: "OK",
    data: {
      message: "Cập nhật vai trò thành công.",
    },
  });
}

export async function deleteRoleByIdController(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const role = await req.roles.findRoleById(req.params.id);
  if (!role) throw new BadRequestError("Vai trò không tồn tại.");

  await req.roles.delete(role.id);

  reply.code(StatusCodes.OK).send({
    statusCode: StatusCodes.OK,
    statusText: "OK",
    data: {
      message: "Xoá vai trò thành công.",
    },
  });
}
