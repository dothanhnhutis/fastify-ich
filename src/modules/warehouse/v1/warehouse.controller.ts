import { BadRequestError } from "@shared/utils/error-handler";
import type { FastifyReply, FastifyRequest } from "fastify";
import { StatusCodes } from "http-status-codes";
import type { WarehouseRequestType } from "./warehouse.schema";

export const WarehouseController = {
  async query(
    req: FastifyRequest<WarehouseRequestType["Query"]>,
    reply: FastifyReply
  ) {
    const data = await req.warehouses.findWarehouses(req.query);

    reply.code(StatusCodes.OK).send({
      statusCode: StatusCodes.OK,
      statusText: "OK",
      data,
    });
  },

  async getById(
    req: FastifyRequest<WarehouseRequestType["GetById"]>,
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
  },

  async getPackagingsById(
    req: FastifyRequest<WarehouseRequestType["GetPackagingsById"]>,
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
  },

  async getDetailById(
    req: FastifyRequest<WarehouseRequestType["GetDetailById"]>,
    reply: FastifyReply
  ) {
    const detail = await req.warehouses.findWarehouseDetailById(req.params.id);
    if (!detail) throw new BadRequestError("Nhà kho không tồn tại.");
    reply.code(StatusCodes.OK).send({
      statusCode: StatusCodes.OK,
      statusText: "OK",
      packagings: detail,
    });
  },

  async create(
    req: FastifyRequest<WarehouseRequestType["Create"]>,
    reply: FastifyReply
  ) {
    if (req.body.packagingIds) {
      for (const packagingId of req.body.packagingIds) {
        const existsPackaging = await req.packagings.findPackagingById(
          packagingId
        );
        if (!existsPackaging)
          throw new BadRequestError(
            `Mã bao bì id=${packagingId} không tồn tại`
          );
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
  },

  async updateById(
    req: FastifyRequest<WarehouseRequestType["UpdateById"]>,
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
          throw new BadRequestError(
            `Mã bao bì id=${packagingId} không tồn tại`
          );
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
  },

  //  async deleteById(
  //   req: FastifyRequest<WarehouseRequestType[""]>,
  //   reply: FastifyReply
  // ) {
  //   const warehouse = await req.warehouses.findWarehouseById(req.params.id);
  //   if (!warehouse) throw new BadRequestError("Nhà kho không tồn tại.");

  //   await req.warehouses.findWarehouseDetailById(warehouse.id);

  //   reply.code(StatusCodes.OK).send({
  //     statusCode: StatusCodes.OK,
  //     statusText: "OK",
  //     data: {
  //       message: "Xoá nhà kho thành công.",
  //     },
  //   });
  // }
};
