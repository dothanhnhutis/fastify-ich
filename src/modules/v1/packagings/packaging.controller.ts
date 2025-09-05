import { FastifyReply, FastifyRequest } from "fastify";
import { QueryWarehousesType } from "../warehouses/warehouse.schema";
import {
  CreatePackagingBodyType,
  DeletePackagingParamsType,
  GetPackagingByIdType,
  UpdatePackagingByIdBodyType,
  UpdatePackagingByIdParamsType,
} from "./packaging.schema";
import { BadRequestError } from "@/shared/error-handler";
import { StatusCodes } from "http-status-codes";

export async function queryPackagingsController(
  req: FastifyRequest<{ Querystring: QueryWarehousesType }>,
  reply: FastifyReply
) {
  const data = await req.packagings.query(req.query);

  reply.code(StatusCodes.OK).send({
    statusCode: StatusCodes.OK,
    statusText: "OK",
    data,
  });
}

export async function getPackagingByIdController(
  req: FastifyRequest<{ Params: GetPackagingByIdType }>,
  reply: FastifyReply
) {
  const packaging = await req.packagings.findById(req.params.id);
  if (!packaging) throw new BadRequestError("Bao bì không tồn tại.");
  reply.code(StatusCodes.OK).send({
    statusCode: StatusCodes.OK,
    statusText: "OK",
    data: {
      packaging,
    },
  });
}

export async function createPackagingController(
  req: FastifyRequest<{ Body: CreatePackagingBodyType }>,
  reply: FastifyReply
) {
  const packaging = await req.packagings.create(req.body);

  reply.code(StatusCodes.OK).send({
    statusCode: StatusCodes.OK,
    statusText: "OK",
    data: {
      message: "Tạo bao bì thành công.",
      packaging,
    },
  });
}

export async function updatePackagingByIdController(
  req: FastifyRequest<{
    Params: UpdatePackagingByIdParamsType;
    Body: UpdatePackagingByIdBodyType;
  }>,
  reply: FastifyReply
) {


  const packaging = await req.packagings.findById(req.params.id);
  if (!packaging) throw new BadRequestError("Bao bì không tồn tại.");

  // kiem tra warehouse



  await req.packagings.update(packaging.id, req.body);
  reply.code(StatusCodes.OK).send({
    statusCode: StatusCodes.OK,
    statusText: "OK",
    data: {
      message: "Cập nhật bao bì thành công.",
    },
  });
}

export async function deletePackagingByIdController(
  req: FastifyRequest<{ Params: DeletePackagingParamsType }>,
  reply: FastifyReply
) {
  const packaging = await req.packagings.findById(req.params.id);
  if (!packaging) throw new BadRequestError("Bao bì không tồn tại.");
  await req.warehouses.delete(packaging.id);
  reply.code(StatusCodes.OK).send({
    statusCode: StatusCodes.OK,
    statusText: "OK",
    data: {
      message: "Xoá bao bì thành công.",
    },
  });
}
