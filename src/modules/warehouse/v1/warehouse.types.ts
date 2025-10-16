import type { WarehouseRequestType } from "./warehouse.schema";

export type Warehouse = {
  id: string;
  name: string;
  address: string;
  status: string;
  deactived_at: Date;
  created_at: Date;
  updated_at: Date;
  packaging_count: number;
};

export type PackagingAtWarehouse = {
  id: string;
  name: string;
  min_stock_level: number;
  unit: string;
  pcs_ctn: number | null;
  status: string;
  deactived_at: Date | null;
  quantity: number;
  created_at: Date;
  updated_at: Date;
};

export type WarehouseDetail = Warehouse & {
  packagings: PackagingAtWarehouse[];
};

export interface IWarehouseRepository {
  findWarehouses(
    query: WarehouseRequestType["Query"]["Querystring"]
  ): Promise<{ warehouses: Warehouse[]; metadata: Metadata }>;
  findWarehouseById(warehouseId: string): Promise<Warehouse | null>;
  findPackagingsByWarehouseId(
    warehouseId: string,
    query?: WarehouseRequestType["GetPackagingsById"]["Querystring"]
  ): Promise<{ packagings: PackagingAtWarehouse; metadata: Metadata }>;
  findWarehouseDetailById(warehouseId: string): Promise<WarehouseDetail | null>;
  createNewWarehouse(
    data: WarehouseRequestType["Create"]["Body"]
  ): Promise<Warehouse>;
  updateWarehouseById(
    warehouseId: string,
    data: WarehouseRequestType["UpdateById"]["Body"]
  ): Promise<void>;
  deleteWarehouseById(id: string): Promise<Warehouse>;
}
