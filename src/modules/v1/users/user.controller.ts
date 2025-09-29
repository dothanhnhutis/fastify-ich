import { StatusCodes } from "http-status-codes";
import { FastifyReply, FastifyRequest } from "fastify";

import { UserRequsetType } from "./user.schema";
import config from "@/shared/config";
import { BadRequestError } from "@/shared/error-handler";
import { convertAvatar, isFastifyError } from "@/shared/utils";

// Admin
export class SuperUserController {
  static async query(
    request: FastifyRequest<UserRequsetType["Query"]>,
    reply: FastifyReply
  ) {
    const data = await request.users.findUsers(request.query);
    const convertAvatars = data.users.map((u) => ({
      ...u,
      avatar: convertAvatar(u.avatar),
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
        user: { ...existsUser, avatar: convertAvatar(existsUser.avatar) },
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
        user: { ...userDetail, avatar: convertAvatar(userDetail.avatar) },
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

  static async updateAvatar(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.isMultipart()) {
        return reply
          .code(400)
          .send({ error: "Request must be multipart/form-data" });
      }

      const data = await request.file({
        limits: {
          fieldNameSize: 50,
          fileSize: 2 * 1024 * 1024,
          files: 1,
          fields: 0,
        },
      });

      if (!data || data.fieldname != "avatar") {
        return reply.code(StatusCodes.BAD_REQUEST).send({
          statusCode: StatusCodes.BAD_REQUEST,
          statusText: "BAD_REQUEST",
          data: {
            message: "Không có tập tin nào được tải lên.",
          },
        });
      }
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(data.mimetype)) {
        return reply.code(400).send({
          error: "Invalid file type",
          message: "Only JPEG, PNG, GIF, and WebP images are allowed",
        });
      }

      await request.users.updateAvatarById(request.currUser!.id, data);

      return reply.send({
        statusCode: StatusCodes.OK,
        statusText: "OK",
        data: {
          message: "Cập nhật avatar thành công.",
        },
      });
    } catch (error: unknown) {
      if (isFastifyError(error)) {
        switch (error.code) {
          case "FST_REQ_FILE_TOO_LARGE":
            reply.code(StatusCodes.REQUEST_TOO_LONG).send({
              statusCode: StatusCodes.BAD_REQUEST,
              statusText: "BAD_REQUEST",
              data: {
                message: "Kích thước file quá lớn.",
              },
            });
            break;
          // case "FST_PARTS_LIMIT":
          //   reply.code(StatusCodes.BAD_REQUEST).send({
          //     statusCode: StatusCodes.BAD_REQUEST,
          //     statusText: "BAD_REQUEST",
          //     data: {
          //       message: "FST_PARTS_LIMIT",
          //     },
          //   });
          //   break;

          case "FST_FIELDS_LIMIT":
            reply.code(StatusCodes.BAD_REQUEST).send({
              statusCode: StatusCodes.BAD_REQUEST,
              statusText: "BAD_REQUEST",
              data: {
                message: "Quá nhiều field không phải field file",
              },
            });
            break;
          case "FST_FILES_LIMIT":
            reply.code(StatusCodes.BAD_REQUEST).send({
              statusCode: StatusCodes.BAD_REQUEST,
              statusText: "BAD_REQUEST",
              data: {
                message: "Quá nhiều file tải lên.",
              },
            });
            break;

          default:
            break;
        }
      }
      throw error;
    }
  }
}
