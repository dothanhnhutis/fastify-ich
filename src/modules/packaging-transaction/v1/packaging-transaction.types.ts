import type z from "zod/v4";
import type { PackagingTransactionRequestType } from "./packaging-transaction.schema";

export type PackagingInventory = {
  packaging_id: string;
  warehouse_id: string;
  quantity: number;
  created_at: Date;
  updated_at: Date;
};

export type PackagingTransaction = {
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

export type PackagingTransactionItem = PackagingInventory & {
  signed_quantity: number;
};

export interface IPackagingTransactionRepository {
  findById(id: string): Promise<PackagingTransaction>;
  findDetailById(id: string): Promise<PackagingTransaction>;
  findItemsById(id: string, _?: string): Promise<PackagingTransaction[]>;
  findOrCreatePackagingInventory(
    packaging_id: string,
    warehouse_id: string
  ): Promise<PackagingInventory>;
  create(data: PackagingTransactionDBType["create"]): Promise<void>;
}

type AddProp<T, P extends object> = T extends unknown ? T & P : never;

export type CreatePackagingTransactionItem = AddProp<
  Omit<PackagingTransactionRequestType["Create"]["Body"], "items">,
  {
    items: {
      warehouse_id: string;
      packaging_id: string;
      quantity: number;
      signed_quantity: number;
    }[];
  }
>;
