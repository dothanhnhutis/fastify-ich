import {
  buildSortField,
  queryParamToArray,
  queryParamToString,
  queryStringSchema,
} from "@shared/utils/validate";
import z from "zod/v4";

const sortRoleEnum = buildSortField([
  "name",
  "permissions",
  "description",
  "status",
  "created_at",
  "updated_at",
]);

export const queryStringRolesSchema = queryStringSchema
  .extend({
    name: queryParamToString,
    permissions: queryParamToArray.pipe(
      z.array(z.string("Quyền phải là chuỗi."), "Danh sách quyền phải là mãng.")
    ),
    description: queryParamToString,
    status: queryParamToString.pipe(
      z.enum(
        ["ACTIVE", "INACTIVE"],
        `Trạng thái phải là một trong 'ACTIVE', 'INACTIVE'.`
      )
    ),
    sort: queryParamToArray.pipe(
      z.array(
        z.enum(
          sortRoleEnum,
          `sort phải là một trong: ${sortRoleEnum.join(", ")}`
        )
      )
    ),
  })
  .partial();
