import { FastifyReply, FastifyRequest } from "fastify";
import {
  CreateNewPackagingBodyType,
  DeletePackagingByIdParamsType,
  GetPackagingByIdType,
  GetWarehousesByPackagingIdParamsType,
  GetWarehousesByPackagingIdQueryType,
  QueryPackagingsType,
  UpdatePackagingByIdBodyType,
  UpdatePackagingByIdParamsType,
} from "./packaging.schema";
import { BadRequestError } from "@/shared/error-handler";
import { StatusCodes } from "http-status-codes";

export class PackagingController {
  static async query(
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

  static async getById(
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

  static async getDetailById(
    req: FastifyRequest<{ Params: GetPackagingByIdType }>,
    reply: FastifyReply
  ) {
    const packaging = await req.packagings.findPackagingDetailById(
      req.params.id
    );
    if (!packaging) throw new BadRequestError("Bao bì không tồn tại.");
    reply.code(StatusCodes.OK).send({
      statusCode: StatusCodes.OK,
      statusText: "OK",
      data: {
        packaging,
      },
    });
  }

  static async getWarehousesById(
    req: FastifyRequest<{
      Params: GetWarehousesByPackagingIdParamsType;
      Querystring: GetWarehousesByPackagingIdQueryType;
    }>,
    reply: FastifyReply
  ) {
    console.log(req.query);
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

  static async create(
    req: FastifyRequest<{ Body: CreateNewPackagingBodyType }>,
    reply: FastifyReply
  ) {
    if (req.body.warehouseIds) {
      for (const packagingId of req.body.warehouseIds) {
        const existsPackaging = await req.warehouses.findWarehouseById(
          packagingId
        );
        if (!existsPackaging)
          throw new BadRequestError(
            `Mã kho hàng id=${packagingId} không tồn tại`
          );
      }
    }

    const packaging = await req.packagings.createNewPackaging(req.body);

    reply.code(StatusCodes.OK).send({
      statusCode: StatusCodes.OK,
      statusText: "OK",
      data: {
        message: "Tạo bao bì thành công.",
        packaging,
      },
    });
  }

  static async updateById(
    req: FastifyRequest<{
      Params: UpdatePackagingByIdParamsType;
      Body: UpdatePackagingByIdBodyType;
    }>,
    reply: FastifyReply
  ) {
    const packaging = await req.packagings.findPackagingById(req.params.id);
    if (!packaging) throw new BadRequestError("Bao bì không tồn tại.");

    const unit = req.body.unit || packaging.unit;
    const pcs_ctn =
      unit == "PIECE" ? null : req.body.pcs_ctn || packaging.pcs_ctn;

    if (unit == "CARTON" && !pcs_ctn) {
      throw new BadRequestError("Thiếu trường 'pcs_ctn' bắt buộc.");
    }

    if (req.body.warehouseIds) {
      for (const warehouseId of req.body.warehouseIds) {
        const existsWarehouse = await req.warehouses.findWarehouseById(
          warehouseId
        );
        if (!existsWarehouse)
          throw new BadRequestError(
            `Mã kho hàng id=${warehouseId} không tồn tại`
          );
      }
    }

    await req.packagings.updatePackagingById(req.params.id, {
      ...req.body,
      unit,
      pcs_ctn,
    });
    reply.code(StatusCodes.OK).send({
      statusCode: StatusCodes.OK,
      statusText: "OK",
      data: {
        message: "Cập nhật bao bì thành công.",
      },
    });
  }

  static async deleteById(
    req: FastifyRequest<{ Params: DeletePackagingByIdParamsType }>,
    reply: FastifyReply
  ) {
    const packaging = await req.packagings.findPackagingById(req.params.id);
    if (!packaging) throw new BadRequestError("Bao bì không tồn tại.");
    await req.packagings.deletePackagingById(packaging.id);
    reply.code(StatusCodes.OK).send({
      statusCode: StatusCodes.OK,
      statusText: "OK",
      data: {
        message: "Xoá bao bì thành công.",
      },
    });
  }
}
