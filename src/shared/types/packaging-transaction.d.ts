declare global {
  type PackagingInventory = {
    packaging_id: string;
    warehouse_id: string;
    quantity: number;
    created_at: Date;
    updated_at: Date;
  };

  type PackagingTransaction = {
    id: string;
    type: string;
    from_warehouse_id: string;
    to_warehouse_id: string | null;
    note: string;
    transaction_date: Date;
    status: string;
    created_at: Date;
    updated_at: Date;
  };

  type PackagingTransactionItem = PackagingInventory & {
    signed_quantity: number;
  };
}
