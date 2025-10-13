type QueryPackagings = {
  packagings: Packaging[];
  metadata: Metadata;
};

type QueryWarehousesByPackagingId = {
  warehouses: Warehouse[];
  metadata: Metadata;
};

type Packaging = {
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

type PackagingDetail = Packaging & {
  warehouses: any[];
};
//
type PackagingStock = Packaging;
