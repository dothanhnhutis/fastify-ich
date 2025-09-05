import { FastifyReply, FastifyRequest } from "fastify";
import {
  CreateWarehouseBodyType,
  DeleteWarehouseByIdParamsType,
  GetWarehouseByIdParamsType,
  QueryWarehousesType,
  UpdateWarehouseByIdBodyType,
  UpdateWarehouseByIdParamsType,
} from "./warehouse.schema";
import { StatusCodes } from "http-status-codes";
import { BadRequestError } from "@/shared/error-handler";

export async function queryWarehousesController(
  req: FastifyRequest<{ Querystring: QueryWarehousesType }>,
  reply: FastifyReply
) {
  const data = await req.warehouses.query(req.query);

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
  const warehouse = await req.warehouses.findById(req.params.id);
  if (!warehouse) throw new BadRequestError("Nhà kho không tồn tại.");
  reply.code(StatusCodes.OK).send({
    statusCode: StatusCodes.OK,
    statusText: "OK",
    data: {
      warehouse,
    },
  });
}

export async function createWarehouseController(
  req: FastifyRequest<{ Body: CreateWarehouseBodyType }>,
  reply: FastifyReply
) {
  const role = await req.warehouses.create(req.body);
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
  const warehouse = await req.warehouses.findById(req.params.id);
  if (!warehouse) throw new BadRequestError("Nhà kho không tồn tại.");

  await req.warehouses.update(warehouse.id, req.body);

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
  const warehouse = await req.warehouses.findById(req.params.id);
  if (!warehouse) throw new BadRequestError("Nhà kho không tồn tại.");

  await req.warehouses.delete(warehouse.id);

  reply.code(StatusCodes.OK).send({
    statusCode: StatusCodes.OK,
    statusText: "OK",
    data: {
      message: "Xoá nhà kho thành công.",
    },
  });
}
