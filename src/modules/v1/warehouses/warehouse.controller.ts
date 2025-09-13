import { FastifyReply, FastifyRequest } from "fastify";
import {
  CreateNewWarehouseBodyType,
  DeleteWarehouseByIdParamsType,
  GetPackagingsByWarehouseIdParamsType,
  GetPackagingsByWarehouseIdQueryType,
  GetWarehouseByIdParamsType,
  QueryWarehousesType,
  UpdateWarehouseByIdBodyType,
  UpdateWarehouseByIdParamsType,
} from "./warehouse.schema";
import { StatusCodes } from "http-status-codes";
import { BadRequestError } from "@/shared/error-handler";
import { QueryPackagingsType } from "../packagings/packaging.schema";

export async function queryWarehousesController(
  req: FastifyRequest<{ Querystring: QueryWarehousesType }>,
  reply: FastifyReply
) {
  const data = await req.warehouses.findWarehouses(req.query);

  reply.code(StatusCodes.OK).send({
    statusCode: StatusCodes.OK,
    statusText: "OK",
    data,
  });
}

export async function getWarehouseByIdController(
  req: FastifyRequest<{ Params: GetWarehouseByIdParamsType }>,
  reply: FastifyReply
) {
  const warehouse = await req.warehouses.findWarehouseById(req.params.id);
  if (!warehouse) throw new BadRequestError("Nhà kho không tồn tại.");
  reply.code(StatusCodes.OK).send({
    statusCode: StatusCodes.OK,
    statusText: "OK",
    data: {
      warehouse,
    },
  });
}

export async function getWarehousesByPackagingIdController(
  req: FastifyRequest<{
    Params: GetPackagingsByWarehouseIdParamsType;
    Querystring: GetPackagingsByWarehouseIdQueryType;
  }>,
  reply: FastifyReply
) {
  const warehouse = await req.warehouses.findWarehouseById(req.params.id);
  if (!warehouse) throw new BadRequestError("Nhà kho không tồn tại.");
  const detail = await req.warehouses.findPackagingsByWarehouseId(
    req.params.id,
    req.query
  );
  reply.code(StatusCodes.OK).send({
    statusCode: StatusCodes.OK,
    statusText: "OK",
    packagings: detail,
  });
}

export async function getWarehouseDetailByIdController(
  req: FastifyRequest<{ Params: GetWarehouseByIdParamsType }>,
  reply: FastifyReply
) {
  const detail = await req.warehouses.findWarehouseDetailById(req.params.id);
  if (!detail) throw new BadRequestError("Nhà kho không tồn tại.");
  reply.code(StatusCodes.OK).send({
    statusCode: StatusCodes.OK,
    statusText: "OK",
    packagings: detail,
  });
}

export async function createNewWarehouseController(
  req: FastifyRequest<{ Body: CreateNewWarehouseBodyType }>,
  reply: FastifyReply
) {
  if (req.body.packagingIds) {
    for (const packagingId of req.body.packagingIds) {
      const existsPackaging = await req.packagings.findPackagingById(
        packagingId
      );
      if (!existsPackaging)
        throw new BadRequestError(`Mã bao bì id=${packagingId} không tồn tại`);
    }
  }
  const role = await req.warehouses.createNewWarehouse(req.body);
  reply.code(StatusCodes.OK).send({
    statusCode: StatusCodes.OK,
    statusText: "OK",
    data: {
      message: "Tạo nhà kho thành công.",
      role,
    },
  });
}

export async function updateWarehouseByIdController(
  req: FastifyRequest<{
    Params: UpdateWarehouseByIdParamsType;
    Body: UpdateWarehouseByIdBodyType;
  }>,
  reply: FastifyReply
) {
  const warehouse = await req.warehouses.findWarehouseById(req.params.id);
  if (!warehouse) throw new BadRequestError("Nhà kho không tồn tại.");

  if (req.body.packagingIds) {
    for (const packagingId of req.body.packagingIds) {
      const existsPackaging = await req.packagings.findPackagingById(
        packagingId
      );
      if (!existsPackaging)
        throw new BadRequestError(`Mã bao bì id=${packagingId} không tồn tại`);
    }
  }

  await req.warehouses.updateWarehouseById(warehouse.id, req.body);

  reply.code(StatusCodes.OK).send({
    statusCode: StatusCodes.OK,
    statusText: "OK",
    data: {
      message: "Cập nhật nhà kho thành công.",
    },
  });
}

export async function deleteWarehouseByIdController(
  req: FastifyRequest<{ Params: DeleteWarehouseByIdParamsType }>,
  reply: FastifyReply
) {
  const warehouse = await req.warehouses.findWarehouseById(req.params.id);
  if (!warehouse) throw new BadRequestError("Nhà kho không tồn tại.");

  await req.warehouses.findWarehouseDetailById(warehouse.id);

  reply.code(StatusCodes.OK).send({
    statusCode: StatusCodes.OK,
    statusText: "OK",
    data: {
      message: "Xoá nhà kho thành công.",
    },
  });
}
