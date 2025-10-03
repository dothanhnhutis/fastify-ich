import { StatusCodes } from "http-status-codes";
import { FastifyReply, FastifyRequest } from "fastify";

import { UserRequsetType } from "./user.schema";
import config from "@/shared/config";
import { BadRequestError } from "@/shared/error-handler";
import { convertAvatar, isFastifyError } from "@/shared/utils";
import { privateFileUpload } from "@/shared/upload";

// Admin
export class SuperUserController {
  static async query(
    request: FastifyRequest<UserRequsetType["Query"]>,
    reply: FastifyReply
  ) {
    const data = await request.users.findUsers(request.query);
    const convertAvatars = data.users.map((u) => ({
      ...u,
      avatar: u.avatar ? convertAvatar(u.avatar) : null,
    }));

    reply.code(StatusCodes.OK).send({
      statusCode: StatusCodes.OK,
      statusText: "OK",
      data: {
        users: convertAvatars,
        metadata: data.metadata,
      },
    });
  }

  static async getById(
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
      data: {
        user: {
          ...existsUser,
          avatar: existsUser.avatar ? convertAvatar(existsUser.avatar) : null,
        },
      },
    });
  }

  static async getRolesById(
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
  }

  static async getDetailById(
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
      data: {
        user: {
          ...userDetail,
          avatar: userDetail.avatar ? convertAvatar(userDetail.avatar) : null,
        },
      },
    });
  }

  static async create(
    request: FastifyRequest<UserRequsetType["Create"]>,
    reply: FastifyReply
  ) {
    const existsUser = await request.users.findUserWithoutPasswordByEmail(
      request.body.email
    );
    if (existsUser) throw new BadRequestError("Email đã tồn tại.");

    if (request.body.roleIds) {
      for (let id of request.body.roleIds) {
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
  }

  static async updateById(
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
  }
}

export class UserController {
  static async me(request: FastifyRequest, reply: FastifyReply) {
    reply.code(StatusCodes.OK).send({
      statusCode: StatusCodes.OK,
      statusText: "OK",
      data: {
        currentUser: {
          ...request.currUser,
          avatar: request.currUser?.avatar
            ? convertAvatar(request.currUser.avatar)
            : null,
        },
      },
    });
  }

  static async logout(request: FastifyRequest, reply: FastifyReply) {
    if (request.sessionId) {
      await request.sessions.delete(request.sessionId);
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

  static async uploadAvatar(request: FastifyRequest, reply: FastifyReply) {
    if (
      !request.multerField ||
      !request.multerField["avatar"] ||
      !Array.isArray(request.multerField["avatar"])
    ) {
      throw new BadRequestError("Không có file nào tải lên.");
    }

    const file = request.multerField["avatar"][0];
    console.log(file);

    await request.users.updateAvatarById(request.currUser!.id, file);

    return reply.send({
      statusCode: StatusCodes.OK,
      statusText: "OK",
      data: {
        message: "Cập nhật avatar thành công.",
      },
    });
  }

  static async deleteAvatar(request: FastifyRequest, reply: FastifyReply) {
    await request.users.deleteAvatarById(request.currUser!.id);

    return reply.send({
      statusCode: StatusCodes.OK,
      statusText: "OK",
      data: {
        message: "Xoá avatar thành công.",
      },
    });
  }
}
