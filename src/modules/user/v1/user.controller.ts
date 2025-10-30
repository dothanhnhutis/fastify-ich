import env from "@shared/config/env";
import { BadRequestError } from "@shared/utils/error-handler";
import type { FastifyReply, FastifyRequest } from "fastify";
import { StatusCodes } from "http-status-codes";
import type { UserRequsetType } from "./user.schema";

// Admin
export const SuperUserController = {
  async query(
    request: FastifyRequest<UserRequsetType["Query"]>,
    reply: FastifyReply
  ) {
    const data = await request.users.findUsers(request.query);

    reply.code(StatusCodes.OK).send({
      statusCode: StatusCodes.OK,
      statusText: "OK",
      data,
    });
  },

  async getById(
    request: FastifyRequest<UserRequsetType["GetById"]>,
    reply: FastifyReply
  ) {
    const existsUser = await request.users.findUserWithoutPasswordById(
      request.params.id
    );
    if (!existsUser) throw new BadRequestError("Người dùng không tồn tại.");
    reply.code(StatusCodes.OK).send({
      statusCode: StatusCodes.OK,
      statusText: "OK",
      data: existsUser,
    });
  },

  async getRolesById(
    request: FastifyRequest<UserRequsetType["GetRolesById"]>,
    reply: FastifyReply
  ) {
    const existsUser = await request.users.findUserWithoutPasswordById(
      request.params.id
    );
    if (!existsUser) throw new BadRequestError("Người dùng không tồn tại.");
    const roles = await request.users.findRolesByUserId(
      request.params.id,
      request.query
    );
    reply.code(StatusCodes.OK).send({
      statusCode: StatusCodes.OK,
      statusText: "OK",
      data: roles,
    });
  },

  async getDetailById(
    request: FastifyRequest<UserRequsetType["GetDetailById"]>,
    reply: FastifyReply
  ) {
    const userDetail = await request.users.findUserDetailById(
      request.params.id
    );
    if (!userDetail) throw new BadRequestError("Người dùng không tồn tại.");
    reply.code(StatusCodes.OK).send({
      statusCode: StatusCodes.OK,
      statusText: "OK",
      data: userDetail,
    });
  },

  async create(
    request: FastifyRequest<UserRequsetType["Create"]>,
    reply: FastifyReply
  ) {
    const existsUser = await request.users.findUserWithoutPasswordByEmail(
      request.body.email
    );
    if (existsUser) throw new BadRequestError("Email đã tồn tại.");

    if (request.body.roleIds) {
      for (const id of request.body.roleIds) {
        const role = await request.roles.findRoleById(id);
        if (!role) throw new BadRequestError(`Quyền id='${id}' không tồn tại.`);
      }
    }
    await request.users.createNewUser(request.body);

    reply.code(StatusCodes.CREATED).send({
      statusCode: StatusCodes.OK,
      statusText: "CREATED",
      data: {
        message: "Tạo người dùng thành công.",
      },
    });
  },

  async updateById(
    request: FastifyRequest<UserRequsetType["UpdateById"]>,
    reply: FastifyReply
  ) {
    const { id } = request.params;

    const existsUser = await request.users.findUserWithoutPasswordById(id);
    if (!existsUser) throw new BadRequestError("Người dùng không tồn tại.");

    await request.users.updateUserById(id, request.body);

    reply.code(StatusCodes.OK).send({
      statusCode: StatusCodes.OK,
      statusText: "OK",
      data: {
        message: "Cập nhật người dùng thành công.",
      },
    });
  },
};

export const UserController = {
  async me(request: FastifyRequest, reply: FastifyReply) {
    reply.code(StatusCodes.OK).send({
      statusCode: StatusCodes.OK,
      statusText: "OK",
      data: request.currUser,
    });
  },

  async logout(request: FastifyRequest, reply: FastifyReply) {
    if (request.sessionId) {
      await request.sessions.delete(request.sessionId);
    }

    reply
      .code(StatusCodes.OK)
      .clearCookie(env.SESSION_KEY_NAME)
      .send({
        statusCode: StatusCodes.OK,
        statusText: "OK",
        data: {
          message: "Đăng xuất thành công",
        },
      });
  },

  async uploadAvatar(request: FastifyRequest, reply: FastifyReply) {
    if (
      !request.multerField ||
      !request.multerField.avatar ||
      !Array.isArray(request.multerField.avatar)
    ) {
      throw new BadRequestError("Không có file nào tải lên.");
    }

    const file = request.multerField.avatar[0];

    await request.users.updateAvatarById(request.currUser?.id ?? "", file);

    return reply.send({
      statusCode: StatusCodes.OK,
      statusText: "OK",
      data: {
        message: "Cập nhật avatar thành công.",
      },
    });
  },

  async deleteAvatar(request: FastifyRequest, reply: FastifyReply) {
    await request.users.deleteAvatarById(request.currUser?.id ?? "");

    return reply.send({
      statusCode: StatusCodes.OK,
      statusText: "OK",
      data: {
        message: "Xoá avatar thành công.",
      },
    });
  },
};
