import type { Image } from "@modules/shared/file/file.shared.types";
import type { MulterFile } from "@shared/middleware/multer";
import type { PackagingRequestType } from "./packaging.schema";

export type Packaging = {
  id: string;
  name: string;
  min_stock_level: number;
  unit: "PIECE" | "CARTON";
  pcs_ctn: number | null;
  status: string;
  deactived_at: Date | null;
  image: Image;
  warehouse_count: number;
  total_quantity: number;
  created_at: Date;
  updated_at: Date;
};

export type StockAt = {};

export type PackagingDetail = Packaging & {
  warehouses: StockAt[];
};

export interface IPackagingRepository {
  findPackagings(
    query: PackagingRequestType["Query"]["Querystring"]
  ): Promise<{ packagings: Packaging[]; metadata: Metadata }>;

  findPackagingById(packagingId: string): Promise<Packaging | null>;

  findWarehousesByPackagingId(
    packagingId: string,
    query?: PackagingRequestType["GetWarehousesById"]["Querystring"]
  ): Promise<{ warehouses: StockAt[]; metadata: Metadata }>;

  findPackagingDetailById(packagingId: string): Promise<PackagingDetail | null>;

  createNewPackaging(
    data: PackagingRequestType["Create"]["Body"]
  ): Promise<Packaging>;

  updatePackagingById(
    packagingId: string,
    data: PackagingRequestType["UpdateById"]["Body"]
  ): Promise<void>;

  updateImageById(id: string, file: MulterFile, userId: string): Promise<void>;

  deletePackagingById(packagingId: string): Promise<Packaging>;
}
