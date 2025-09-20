type UserAvatar = {
  id: string;
  width: number;
  height: number;
  is_primary: boolean;
  original_name: string;
  mime_type: string;
  destination: string;
  file_name: string;
  size: number;
  created_at: Date;
};

type Avatar = {
  id: string;
  width: number;
  height: number;
  fileName: string;
  url: string;
  size: number;
  created_at: Date;
};

type User = {
  id: string;
  email: string;
  username: string;
  status: string;
  avatar: UserAvatar;
  deactived_at: Date;
  role_count: number;
  created_at: Date;
  updated_at: Date;
};

type UserWithoutPassword = User & {
  has_password: boolean;
};

type UserPassword = User & {
  password_hash: string;
};

type QueryUsers = { users: UserWithoutPassword[]; metadata: Metadata };

type UserDetail = UserWithoutPassword & {
  roles: Role[];
};
