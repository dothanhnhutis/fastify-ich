type Role = {
  id: string;
  name: string;
  permissions: string[];
  description: string;
  status: string;
  deactived_at: Date;
  created_at: Date;
  updated_at: Date;
  user_count: number;
};

type RoleDetail = Role & {
  users: UserWithoutPassword[];
};

type QueryRoles = {
  roles: Role[];
  metadata: Metadata;
};

type QueryUsersByRoleId = {
  users: User[];
  metadata: Metadata;
};
