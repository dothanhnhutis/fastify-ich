import { BadRequestError } from "@shared/utils/error-handler";
import type { FastifyReply, FastifyRequest } from "fastify";
import { StatusCodes } from "http-status-codes";
import type { RoleRequestType } from "./role.schema";

export const RoleController = {
  async getUsersById(
    req: FastifyRequest<RoleRequestType["GetUsersById"]>,
    reply: FastifyReply
  ) {
    const role = await req.roles.findUsersByRoleId(req.params.id, req.query);

    reply.code(StatusCodes.OK).send({
      statusCode: StatusCodes.OK,
      statusText: "OK",
      data: role,
    });
  },

  async getDetailById(
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
  },

  async getById(
    req: FastifyRequest<RoleRequestType["GetById"]>,
    reply: FastifyReply
  ) {
    const role = await req.roles.findRoleById(req.params.id);
    if (!role) throw new BadRequestError("Vai trò không tồn tại.");

    reply.code(StatusCodes.OK).send({
      statusCode: StatusCodes.OK,
      statusText: "OK",
      data: role,
    });
  },

  async query(
    req: FastifyRequest<RoleRequestType["Query"]>,
    reply: FastifyReply
  ) {
    const data = await req.roles.findRolesv2(req.query);

    reply.code(StatusCodes.OK).send({
      statusCode: StatusCodes.OK,
      statusText: "OK",
      data,
    });
  },

  async create(
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
  },

  async updateById(
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
  },

  async deleteById(
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
  },
};
