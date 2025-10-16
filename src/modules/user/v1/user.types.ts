import type { Role } from "@modules/shared/role/role.shared.types";
import type {
  UserPassword,
  UserWithoutPassword,
} from "@modules/shared/user/user.shared.types";
import type { MulterFile } from "@shared/middleware/multer";
import type { UserRequsetType } from "./user.schema";

export type QueryUsers = { users: UserWithoutPassword[]; metadata: Metadata };

export type UserDetail = UserWithoutPassword & {
  roles: Role[];
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
  ): Promise<{ roles: Role[]; metadata: Metadata }>;
  findUsers(
    query: UserRequsetType["Query"]["Querystring"]
  ): Promise<QueryUsers>;
  createNewUser(data: UserRequsetType["Create"]["Body"]): Promise<UserPassword>;
  updateUserById(
    userId: string,
    data: UserRequsetType["UpdateById"]["Body"]
  ): Promise<void>;
  updateAvatarById(userId: string, file: MulterFile): Promise<void>;
  deleteAvatarById(userId: string): Promise<void>;
}
