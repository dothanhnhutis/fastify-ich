import * as z from "zod/v4";

const signInBodySchema = z
  .object({
    email: z.email({
      error: (ctx) => {
        if (ctx.code === "invalid_format") {
          return "Email không đúng định dạng";
        } else {
          return "Email phải là chuỗi";
        }
      },
    }),
    password: z
      .string({
        error: (ctx) => {
          if (ctx.code === "invalid_type") return "Mật khẩu phải là chuỗi";
          return ctx.message;
        },
      })
      .min(8, "Email và mật khẩu không hợp lệ.")
      .max(125, "Email và mật khẩu không hợp lệ.")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@$!%*?&])[A-Za-z0-9@$!%*?&]+$/,
        "Email và mật khẩu không hợp lệ."
      ),
  })
  .strict();

export const authSchema = {
  signin: {
    body: signInBodySchema,
  },
};

export type AuthRequestType = {
  SignIn: {
    Body: z.infer<typeof signInBodySchema>;
  };
};
