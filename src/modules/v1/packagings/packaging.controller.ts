import { FastifyReply, FastifyRequest } from "fastify";
import { QueryWarehousesType } from "../warehouses/warehouse.schema";
import {
  CreatePackagingBodyType,
  DeletePackagingParamsType,
  GetPackagingByIdType,
  GetWarehousesByPackagingIdParamsType,
  GetWarehousesByPackagingIdQueryType,
  QueryPackagingsType,
  UpdatePackagingByIdBodyType,
  UpdatePackagingByIdParamsType,
} from "./packaging.schema";
import { BadRequestError } from "@/shared/error-handler";
import { StatusCodes } from "http-status-codes";

export async function queryPackagingsController(
  req: FastifyRequest<{ Querystring: QueryPackagingsType }>,
  reply: FastifyReply
) {
  const data = await req.packagings.findPackagings(req.query);

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
  const packaging = await req.packagings.findPackagingById(req.params.id);
  if (!packaging) throw new BadRequestError("Bao bì không tồn tại.");
  reply.code(StatusCodes.OK).send({
    statusCode: StatusCodes.OK,
    statusText: "OK",
    data: {
      packaging,
    },
  });
}

export async function getPackagingDetailByIdController(
  req: FastifyRequest<{ Params: GetPackagingByIdType }>,
  reply: FastifyReply
) {
  const packaging = await req.packagings.findPackagingDetailById(req.params.id);
  if (!packaging) throw new BadRequestError("Bao bì không tồn tại.");
  reply.code(StatusCodes.OK).send({
    statusCode: StatusCodes.OK,
    statusText: "OK",
    data: {
      packaging,
    },
  });
}

export async function getWarehousesByPackagingIdController(
  req: FastifyRequest<{
    Params: GetWarehousesByPackagingIdParamsType;
    Querystring: GetWarehousesByPackagingIdQueryType;
  }>,
  reply: FastifyReply
) {
  const packaging = await req.packagings.findPackagingById(req.params.id);
  if (!packaging) throw new BadRequestError("Bao bì không tồn tại.");
  const data = await req.packagings.findWarehousesByPackagingId(
    req.params.id,
    req.query
  );
  reply.code(StatusCodes.OK).send({
    statusCode: StatusCodes.OK,
    statusText: "OK",
    data,
  });
}

export async function createPackagingController(
  req: FastifyRequest<{ Body: CreatePackagingBodyType }>,
  reply: FastifyReply
) {
  if (req.body.warehouseIds) {
    for (const packagingId of req.body.warehouseIds) {
      const existsPackaging = await req.warehouses.findById(packagingId);
      if (!existsPackaging)
        throw new BadRequestError(
          `Mã kho hàng id=${packagingId} không tồn tại`
        );
    }
  }

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
  const packaging = await req.packagings.findPackagingById(req.params.id);
  if (!packaging) throw new BadRequestError("Bao bì không tồn tại.");

  if (req.body.warehouseIds) {
    for (const warehouseId of req.body.warehouseIds) {
      const existsWarehouse = await req.warehouses.findById(warehouseId);
      if (!existsWarehouse)
        throw new BadRequestError(
          `Mã kho hàng id=${warehouseId} không tồn tại`
        );
    }
  }
  await req.packagings.update(req.params.id, req.body);
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
  const packaging = await req.packagings.findPackagingById(req.params.id);
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
