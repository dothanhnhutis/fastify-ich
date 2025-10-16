import type { Role } from "@modules/shared/role/role.shared.types";
import type {
  User,
  UserWithoutPassword,
} from "@modules/shared/user/user.shared.types";
import type { RoleRequestType } from "./role.schema";

type RoleDetail = Role & {
  users: UserWithoutPassword[];
};

type QueryUsersByRoleId = {
  users: User[];
  metadata: Metadata;
};

export interface IRoleRepository {
  findRoles(
    query: RoleRequestType["Query"]["Querystring"]
  ): Promise<{ roles: Role[]; metadata: Metadata }>;
  findRoleById(roleId: string): Promise<Role | null>;
  findUsersByRoleId(
    roleId: string,
    query?: RoleRequestType["GetUsersById"]["Querystring"]
  ): Promise<QueryUsersByRoleId>;

  findRoleDetailById(roleId: string): Promise<RoleDetail | null>;

  create(data: RoleRequestType["Create"]["Body"]): Promise<Role>;
  update(
    id: string,
    data: RoleRequestType["UpdateById"]["Body"]
  ): Promise<void>;

  delete(id: string): Promise<Role>;
}
