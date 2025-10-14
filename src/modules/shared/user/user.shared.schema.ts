import {
  buildSortField,
  queryParamToArray,
  queryParamToString,
  queryStringSchema,
} from "@shared/utils/validate";
import z from "zod/v4";

const sortUserEnum = buildSortField([
  "username",
  "email",
  "status",
  "deactived_at",
  "created_at",
  "updated_at",
]);

export const queryStringUsersSchema = queryStringSchema
  .extend({
    username: queryParamToString,
    email: queryParamToString.pipe(
      z.email({
        error: (ctx) => {
          if (ctx.code === "invalid_type") {
            return "Email phải là chuỗi.";
          } else {
            return "Email không đúng định dạng.";
          }
        },
      })
    ),
    status: queryParamToString.pipe(
      z.enum(
        ["ACTIVE", "INACTIVE"],
        `Trạng thái phải là một trong 'ACTIVE', 'INACTIVE'.`
      )
    ),
    sort: queryParamToArray.pipe(
      z.array(
        z.enum(
          sortUserEnum,
          `sort phải là một trong: ${sortUserEnum.join(", ")}`
        )
      )
    ),
  })
  .partial();
