import { StatusCodes } from "http-status-codes";
import { FastifyReply, FastifyRequest } from "fastify";

import { RoleRequestType } from "./role.schema";
import { BadRequestError } from "@/shared/error-handler";

export class RoleController {
  static async getUsersById(
    req: FastifyRequest<RoleRequestType["GetUsersById"]>,
    reply: FastifyReply
  ) {
    const role = await req.roles.findUsersByRoleId(req.params.id, req.query);

    reply.code(StatusCodes.OK).send({
      statusCode: StatusCodes.OK,
      statusText: "OK",
      data: role,
    });
  }

  static async getDetailById(
    req: FastifyRequest<RoleRequestType["GetDetailById"]>,
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

  static async getById(
    req: FastifyRequest<RoleRequestType["GetById"]>,
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

  static async query(
    req: FastifyRequest<RoleRequestType["Query"]>,
    reply: FastifyReply
  ) {
    const data = await req.roles.findRoles(req.query);

    reply.code(StatusCodes.OK).send({
      statusCode: StatusCodes.OK,
      statusText: "OK",
      data,
    });
  }

  static async create(
    req: FastifyRequest<RoleRequestType["Create"]>,
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

  static async updateById(
    req: FastifyRequest<RoleRequestType["UpdateById"]>,
    reply: FastifyReply
  ) {
    const role = await req.roles.findRoleById(req.params.id);
    if (!role) throw new BadRequestError("Vai trò không tồn tại.");
    if (!role.canUpdate)
      throw new BadRequestError("Vai trò không được chỉnh sửa.");

    await req.roles.update(role.id, req.body);

    reply.code(StatusCodes.OK).send({
      statusCode: StatusCodes.OK,
      statusText: "OK",
      data: {
        message: "Cập nhật vai trò thành công.",
      },
    });
  }

  static async deleteById(
    req: FastifyRequest<RoleRequestType["DeletaById"]>,
    reply: FastifyReply
  ) {
    const role = await req.roles.findRoleById(req.params.id);
    if (!role) throw new BadRequestError("Vai trò không tồn tại.");
    if (!role.canDelete) throw new BadRequestError("Vai trò không được xoá.");
    await req.roles.delete(role.id);

    reply.code(StatusCodes.OK).send({
      statusCode: StatusCodes.OK,
      statusText: "OK",
      data: {
        message: "Xoá vai trò thành công.",
      },
    });
  }
}
