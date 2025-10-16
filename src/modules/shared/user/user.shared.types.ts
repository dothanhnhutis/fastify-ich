import type { Image } from "@modules/shared/file/file.shared.types";

export type User = {
  id: string;
  email: string;
  username: string;
  status: string;
  avatar: Image;
  deactived_at: Date;
  role_count: number;
  created_at: Date;
  updated_at: Date;
};

export type UserWithoutPassword = User & {
  has_password: boolean;
};

export type UserPassword = User & {
  password_hash: string;
};
