export type Role = {
  id: string;
  name: string;
  permissions: string[];
  description: string;
  status: string;
  deactived_at: Date;
  can_delete: boolean;
  can_update: boolean;
  created_at: Date;
  updated_at: Date;
  user_count: number;
};
