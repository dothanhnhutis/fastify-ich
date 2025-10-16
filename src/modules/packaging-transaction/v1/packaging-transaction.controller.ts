import { BadRequestError } from "@shared/utils/error-handler";
import type { FastifyReply, FastifyRequest } from "fastify";
import { StatusCodes } from "http-status-codes";
import type { PackagingTransactionRequestType } from "./packaging-transaction.schema";

export const PackagingTransactionController = {
  async create(
    request: FastifyRequest<PackagingTransactionRequestType["Create"]>,
    reply: FastifyReply
  ) {
    const { items, from_warehouse_id, type } = request.body;

    const existsFromWarehouse = await request.warehouses.findWarehouseById(
      from_warehouse_id
    );
    if (!existsFromWarehouse)
      throw new BadRequestError("Mã kho hàng không tồn tại.");

    if (type === "TRANSFER") {
      if (from_warehouse_id === request.body.to_warehouse_id)
        throw new BadRequestError(
          "Mã kho đích không được trùng với mã kho nguồn."
        );
      const existsToWarehouse = await request.warehouses.findWarehouseById(
        request.body.to_warehouse_id
      );
      if (!existsToWarehouse)
        throw new BadRequestError("Mã kho hàng đích không tồn tại.");
    }

    const newItems: PackagingTransactionDBType["create"]["items"] = [];

    for (const item of items) {
      const existsPackaging = await request.packagings.findPackagingById(
        item.packaging_id
      );
      if (!existsPackaging)
        throw new BadRequestError("Mã bao bì không tồn tại.");

      const fromInventory =
        await request.packagingTransactions.findOrCreatePackagingInventory(
          item.packaging_id,
          from_warehouse_id
        );

      if (
        (type === "EXPORT" || type === "TRANSFER") &&
        fromInventory.quantity - item.quantity < 0
      ) {
        throw new BadRequestError(
          `Số lượng không hợp lệ tại packaging_id='${item.packaging_id}'.`
        );
      }

      newItems.push({
        ...item,
        warehouse_id: from_warehouse_id,
        signed_quantity:
          type === "IMPORT"
            ? item.quantity
            : type === "EXPORT" || type === "TRANSFER"
            ? -item.quantity
            : type === "ADJUST"
            ? item.quantity - fromInventory.quantity
            : 0,
      });

      if (type === "TRANSFER") {
        await request.packagingTransactions.findOrCreatePackagingInventory(
          item.packaging_id,
          request.body.to_warehouse_id
        );

        newItems.push({
          ...item,
          warehouse_id: request.body.to_warehouse_id,
          signed_quantity: item.quantity,
        });
      }
    }

    await request.packagingTransactions.create({
      ...request.body,
      items: newItems,
    });

    reply.code(StatusCodes.OK).send({
      statusCode: StatusCodes.OK,
      statusText: "OK",
      data: {
        message: "Tạo phiếu thành công.",
      },
    });
  },

  async updateById(
    request: FastifyRequest<{
      Params: { id: string };
      Body: {
        type?: string;
        from_warehouse_id: string;
        to_warehouse_id: string;
        note: string;
        transaction_date: string;
        status?: string;
      };
    }>,
    reply: FastifyReply
  ) {
    const transaction = await request.packagingTransactions.findDetailById(
      request.params.id
    );

    if (!transaction) throw new BadRequestError("Phiếu không tồn tại.");

    const updateData: PackagingTransaction = {
      ...transaction,
    };

    if (
      transaction.status === "COMPLETED" &&
      request.body.status === transaction.status &&
      Object.keys(request.body).length > 1
    )
      throw new BadRequestError(
        "Không thê cập nhât nội dung phiếu đã hoàn thành."
      );
  },

  async getById(
    request: FastifyRequest<PackagingTransactionRequestType["GetById"]>,
    reply: FastifyReply
  ) {
    const transaction = await request.packagingTransactions.findById(
      request.params.id
    );
    if (!transaction) throw new BadRequestError("Phiếu không tồn tại.");
    reply.code(StatusCodes.OK).send({
      statusCode: StatusCodes.OK,
      statusText: "OK",
      data: {
        transaction,
      },
    });
  },

  async getDetailById(
    request: FastifyRequest<PackagingTransactionRequestType["GetDetailById"]>,
    reply: FastifyReply
  ) {
    const transaction = await request.packagingTransactions.findDetailById(
      request.params.id
    );
    if (!transaction) throw new BadRequestError("Phiếu không tồn tại.");
    reply.code(StatusCodes.OK).send({
      statusCode: StatusCodes.OK,
      statusText: "OK",
      data: {
        transaction,
      },
    });
  },

  async getItemsById(
    request: FastifyRequest<PackagingTransactionRequestType["GetItemsById"]>,
    reply: FastifyReply
  ) {
    const transactions = await request.packagingTransactions.findItemsById(
      request.params.id
    );
    reply.code(StatusCodes.OK).send({
      statusCode: StatusCodes.OK,
      statusText: "OK",
      data: {
        transactions,
      },
    });
  },
};
