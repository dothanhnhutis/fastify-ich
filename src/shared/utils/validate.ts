import z from "zod/v4";

export const queryParamToString = z
  .union([z.string(), z.array(z.string())])
  .transform((value) =>
    Array.isArray(value) ? value[value.length - 1].trim() : value.trim()
  );

export const queryParamToArray = z
  .union([z.string(), z.array(z.string())])
  .transform((value) =>
    Array.isArray(value) ? value.map((s) => s.trim()) : [value.trim()]
  );

export const buildSortField = (fields: string[]) => {
  return fields.flatMap((f) => [`${f}.asc`, `${f}.desc`]);
};

export const queryStringSchema = z.object({
  created_from: queryParamToString.pipe(
    z.iso.datetime({
      error: (ctx) => {
        if (ctx.code === "invalid_type") {
          return "created_from phải chuỗi date-time ISO 8601 có độ chính sác 3 số milisecond";
        }
        if (ctx.code === "invalid_format") {
          return "created_from phải có định dạng date-time ISO 8601 có độ chính sác 3 số milisecond";
        }
      },
    })
  ),
  created_to: queryParamToString.pipe(
    z.iso.datetime({
      offset: true,
      precision: 3,
      error: (ctx) => {
        if (ctx.code === "invalid_type") {
          return "created_to phải chuỗi date-time ISO 8601 có độ chính sác 3 số milisecond";
        }
        if (ctx.code === "invalid_format") {
          return "created_to phải có định dạng date-time ISO 8601 có độ chính sác 3 số milisecond";
        }
      },
    })
  ),
  limit: queryParamToString.pipe(z.coerce.number("limit phải là số")).pipe(
    z
      .number({
        error: (ctx) => {
          if (ctx.code === "invalid_type") {
            return "limit phải là số nguyên";
          }
          return ctx.message;
        },
      })
      .int({
        error: (ctx) => {
          if (ctx.code === "invalid_type") {
            return "limit phải là số nguyên";
          }
          if (ctx.code === "too_big") {
            return `limit phải là số nguyên .Số nguyên phải nằm trong phạm vi số nguyên an toàn < ${ctx.maximum}`;
          }
          if (ctx.code === "too_small") {
            return `limit phải là số nguyên .Số nguyên phải nằm trong phạm vi số nguyên an toàn > ${ctx.minimum}`;
          }
          return undefined;
        },
      })
      .min(1, "limit phải >= 1")
      .max(50, "limit tối đa là 50")
  ),
  page: queryParamToString.pipe(z.coerce.number("page phải là số")).pipe(
    z
      .number({
        error: (ctx) => {
          if (ctx.code === "invalid_type") {
            return "page phải là số nguyên";
          }
          return ctx.message;
        },
      })
      .int({
        error: (ctx) => {
          if (ctx.code === "invalid_type") {
            return "page phải là số nguyên";
          }
          if (ctx.code === "too_big") {
            return `page phải là số nguyên .Số nguyên phải nằm trong phạm vi số nguyên an toàn < ${ctx.maximum}`;
          }
          if (ctx.code === "too_small") {
            return `page phải là số nguyên .Số nguyên phải nằm trong phạm vi số nguyên an toàn > ${ctx.minimum}`;
          }
          return undefined;
        },
      })
      .min(1, "page phải >= 1")
      .max(50, "page tối đa là 50")
  ),
});
