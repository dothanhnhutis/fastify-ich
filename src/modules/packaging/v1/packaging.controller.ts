import { BadRequestError } from "@shared/utils/error-handler";
import { convertImage } from "@shared/utils/file";
import type { FastifyReply, FastifyRequest } from "fastify";
import { StatusCodes } from "http-status-codes";
import type { PackagingRequestType } from "./packaging.schema";

export const PackagingController = {
  async query(
    req: FastifyRequest<PackagingRequestType["Query"]>,
    reply: FastifyReply
  ) {
    const data = await req.packagings.findPackagings(req.query);

    const convert = data.packagings.map((p) => ({
      ...p,
      image: p.image ? convertImage(p.image) : null,
    }));

    reply.code(StatusCodes.OK).send({
      statusCode: StatusCodes.OK,
      statusText: "OK",
      data: {
        users: convert,
        metadata: data.metadata,
      },
    });
  },

  async getById(
    req: FastifyRequest<PackagingRequestType["GetById"]>,
    reply: FastifyReply
  ) {
    const packaging = await req.packagings.findPackagingById(req.params.id);
    if (!packaging) throw new BadRequestError("Bao bì không tồn tại.");
    reply.code(StatusCodes.OK).send({
      statusCode: StatusCodes.OK,
      statusText: "OK",
      data: {
        packaging: {
          ...packaging,
          image: packaging.image ? convertImage(packaging.image) : null,
        },
      },
    });
  },

  async getDetailById(
    req: FastifyRequest<PackagingRequestType["GetDetailById"]>,
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
        packaging: {
          ...packaging,
          image: packaging.image ? convertImage(packaging.image) : null,
        },
      },
    });
  },

  async getWarehousesById(
    req: FastifyRequest<PackagingRequestType["GetWarehousesById"]>,
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
  },

  async create(
    req: FastifyRequest<PackagingRequestType["Create"]>,
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
  },

  async updateById(
    req: FastifyRequest<PackagingRequestType["UpdateById"]>,
    reply: FastifyReply
  ) {
    const packaging = await req.packagings.findPackagingById(req.params.id);
    if (!packaging) throw new BadRequestError("Bao bì không tồn tại.");

    const unit = req.body.unit || packaging.unit;
    const pcs_ctn =
      req.body.pcs_ctn === undefined ? packaging.pcs_ctn : req.body.pcs_ctn;

    if (unit === "CARTON" && pcs_ctn == null) {
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
  },

  async uploadPackagingImage(
    request: FastifyRequest<PackagingRequestType["UpdateImageById"]>,
    reply: FastifyReply
  ) {
    const packaging = await request.packagings.findPackagingById(
      request.params.id
    );
    if (!packaging) throw new BadRequestError("Bao bì không tồn tại.");

    if (
      !request.multerField ||
      !request.multerField.image ||
      !Array.isArray(request.multerField.image)
    ) {
      throw new BadRequestError("Không có file nào tải lên.");
    }

    const file = request.multerField.image[0];

    await request.packagings.updateImageById(
      packaging.id,
      file,
      request.currUser?.id ?? ""
    );

    return reply.send({
      statusCode: StatusCodes.OK,
      statusText: "OK",
      data: {
        message: "Cập nhật hinh bao bì thành công.",
      },
    });
  },

  //  async deleteById(
  //   req: FastifyRequest<{ Params: DeletePackagingByIdParamsType }>,
  //   reply: FastifyReply
  // ) {
  //   const packaging = await req.packagings.findPackagingById(req.params.id);
  //   if (!packaging) throw new BadRequestError("Bao bì không tồn tại.");
  //   await req.packagings.deletePackagingById(packaging.id);
  //   reply.code(StatusCodes.OK).send({
  //     statusCode: StatusCodes.OK,
  //     statusText: "OK",
  //     data: {
  //       message: "Xoá bao bì thành công.",
  //     },
  //   });
  // }
};
