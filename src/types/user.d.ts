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

type UserPassword = {
  id: string;
  email: string;
  password_hash: string;
  username: string;
  status: string;
  deactived_at: Date;
  created_at: Date;
  updated_at: Date;
};

type QueryUsers = { users: User[]; metadata: Metadata };

type User = UserWithoutPassword & {
  role_count: number;
};

type UserDetail = UserWithoutPassword & {
  role_count: number;
  roles: Role[];
};
