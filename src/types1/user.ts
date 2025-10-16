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

export type QueryUsers = { users: UserWithoutPassword[]; metadata: Metadata };

export type UserDetail = UserWithoutPassword & {
  roles: Role[];
};

export type QueryUser = {
  created_from: string | undefined;
  created_to: string | undefined;
  limit: number | undefined;
  page: number | undefined;
  username: string | undefined;
  email: string | undefined;
  status: "ACTIVE" | "INACTIVE" | undefined;
  sort: string[] | undefined;
};

export type QueryRole = {};

export type CreateUserData = {
  username: string;
  email: string;
  roleIds?: string[];
  password?: string;
};

export type UpdateUserData = {
  status?: "ACTIVE" | "INACTIVE";
  roleIds?: string[];
  username?: string;
};

export interface IUserRepository {
  findUserWithoutPasswordById(id: string): Promise<UserWithoutPassword | null>;
  findUserWithoutPasswordByEmail(
    email: string
  ): Promise<UserWithoutPassword | null>;
  findUserById(userId: string): Promise<UserPassword | null>;
  findUserByEmail(email: string): Promise<UserPassword | null>;
  findUserDetailById(userId: string): Promise<UserDetail | null>;
  findRolesByUserId(
    userId: string,
    query?: UserRequsetType["GetRolesById"]["Querystring"]
  ): Promise<QueryRoles>;
  findUsers(query: QueryUser): Promise<QueryUsers>;
  createNewUser(data: CreateUserData): Promise<UserPassword>;
  updateUserById(userId: string, data: UpdateUserData): Promise<void>;
  updateAvatarById(userId: string, file: MulterFile): Promise<void>;
  deleteAvatarById(userId: string): Promise<void>;
}
