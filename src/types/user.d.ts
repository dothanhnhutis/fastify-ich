type UserWithoutPassword = {
  id: string;
  email: string;
  has_password: boolean;
  username: string;
  status: string;
  deactived_at: Date;
  created_at: Date;
  updated_at: Date;
};

type User = {
  id: string;
  email: string;
  password_hash: string;
  username: string;
  status: string;
  deactived_at: Date;
  created_at: Date;
  updated_at: Date;
};

type QueryUserRole = { users: UserRole[]; metadata: Metadata };

type UserRole = UserWithoutPassword & {
  role_count: number;
};

type UserRoleDetail = UserWithoutPassword & {
  role_count: number;
  roles: Role[];
};
