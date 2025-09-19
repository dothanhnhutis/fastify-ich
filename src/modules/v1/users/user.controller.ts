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
import { privateFileUpload } from "@/shared/upload";
import { isFastifyError } from "@/shared/utils";

// Admin
export async function queryUsersController(
  req: FastifyRequest<{ Querystring: QueryUsersType }>,
  reply: FastifyReply
) {
  const data = await req.users.findUsers(req.query);

  reply.code(StatusCodes.OK).send({
    statusCode: StatusCodes.OK,
    statusText: "OK",
    data,
  });
}

export async function getUserByIdController(
  req: FastifyRequest<{ Params: GetUserByIdParamsType }>,
  reply: FastifyReply
) {
  const existsUser = await req.users.findUserWithoutPasswordById(req.params.id);
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
  const existsUser = await req.users.findUserWithoutPasswordById(req.params.id);
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
  const userDetail = await req.users.findUserDetailById(req.params.id);
  if (!userDetail) throw new BadRequestError("Người dùng không tồn tại.");
  reply.code(StatusCodes.OK).send({
    statusCode: StatusCodes.OK,
    statusText: "OK",
    data: {
      user: userDetail,
    },
  });
}

export async function createNewUserController(
  req: FastifyRequest<{ Body: CreateNewUserBodyType }>,
  reply: FastifyReply
) {
  const existsUser = await req.users.findUserWithoutPasswordByEmail(
    req.body.email
  );
  if (existsUser) throw new BadRequestError("Email đã tồn tại.");

  if (req.body.roleIds) {
    for (let id of req.body.roleIds) {
      const role = await req.roles.findById(id);
      if (!role) throw new BadRequestError(`Quyền id='${id}' không tồn tại.`);
    }
  }
  await req.users.createNewUser(req.body);

  reply.code(StatusCodes.CREATED).send({
    statusCode: StatusCodes.OK,
    statusText: "CREATED",
    data: {
      message: "Tạo người dùng thành công.",
    },
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

  const existsUser = await req.users.findUserWithoutPasswordById(id);
  if (!existsUser) throw new BadRequestError("Người dùng không tồn tại.");

  await req.users.updateUserById(id, req.body);

  reply.code(StatusCodes.OK).send({
    statusCode: StatusCodes.OK,
    statusText: "OK",
    data: {
      message: "Cập nhật người dùng thành công.",
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

export async function updateAvatarController(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    if (!req.isMultipart()) {
      return reply
        .code(400)
        .send({ error: "Request must be multipart/form-data" });
    }

    const data = await req.file({
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
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(data.mimetype)) {
      return reply.code(400).send({
        error: "Invalid file type",
        message: "Only JPEG, PNG, GIF, and WebP images are allowed",
      });
    }

    await req.users.updateAvatarById(req.currUser!.id, data);

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
