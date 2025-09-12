type Warehouse = {
  id: string;
  name: string;
  address: string;
  status: string;
  deactived_at: Date;
  created_at: Date;
  updated_at: Date;
  packaging_count: number;
};

type WarehouseDetail = Warehouse & {
  packagings: {
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
  }[];
};
