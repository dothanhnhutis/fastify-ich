import { FastifyReply, FastifyRequest } from "fastify";
import { CreateNewPackagingTransactionBodyType } from "./packaging-transaction.schema";
import { BadRequestError } from "@/shared/error-handler";
import { StatusCodes } from "http-status-codes";

export async function createPackagingTransactionController(
  request: FastifyRequest<{ Body: CreateNewPackagingTransactionBodyType }>,
  reply: FastifyReply
) {
  const { items, from_warehouse_id, type } = request.body;

  const existsFromWarehouse = await request.warehouses.findWarehouseById(
    from_warehouse_id
  );
  if (!existsFromWarehouse)
    throw new BadRequestError("Mã kho hàng không tồn tại.");

  if (type == "TRANSFER") {
    const existsToWarehouse = await request.warehouses.findWarehouseById(
      request.body.to_warehouse_id
    );
    if (!existsToWarehouse)
      throw new BadRequestError("Mã kho hàng đích không tồn tại.");
  }

  for (const item of items) {
    const existsPackaging = await request.packagings.findPackagingById(
      item.packaging_id
    );
    if (!existsPackaging) throw new BadRequestError("Mã bao bì không tồn tại.");

    const fromInventory =
      await request.packagingTransactions.findOrCreatePackagingInventory(
        item.packaging_id,
        from_warehouse_id
      );

    if (type == "TRANSFER") {
      await request.packagingTransactions.findOrCreatePackagingInventory(
        item.packaging_id,
        request.body.to_warehouse_id
      );
    }

    if (
      (type == "EXPORT" || type == "TRANSFER") &&
      fromInventory.quantity - item.quantity < 0
    ) {
      throw new BadRequestError(
        `Số lượng không hợp lệ tại packaging_id='${item.packaging_id}'.`
      );
    }
  }

  await request.packagingTransactions.createNewPackagingTransaction(
    request.body
  );

  reply.code(StatusCodes.OK).send({
    statusCode: StatusCodes.OK,
    statusText: "OK",
    data: {
      message: "Tạo phiếu thành công.",
    },
  });
}
