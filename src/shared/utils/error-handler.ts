import env from "@shared/config/env";
import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import {
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
} from "fastify-type-provider-zod";
import { StatusCodes } from "http-status-codes";
import type { LevelWithSilent } from "pino";

export interface PostgresError extends Error {
  severity: string;
  code: string;
  detail?: string;
  hint?: string;
  position?: string;
  internalPosition?: string;
  internalQuery?: string;
  where?: string;
  schema?: string;
  table?: string;
  column?: string;
  dataType?: string;
  constraint?: string;
  file?: string;
  line?: string;
  routine?: string;
}

interface ICustomError<
  D extends Record<string, unknown> = Record<string, unknown>
> {
  level: LevelWithSilent;
  error: string;
  message: string;
  statusCode: number;
  details?: D;
}

export class CustomError<
    D extends Record<string, unknown> = Record<string, unknown>
  >
  extends Error
  implements ICustomError<D>
{
  level: LevelWithSilent;
  error: string;
  statusCode: number;
  details?: D;

  constructor({ level, error, message, statusCode, details }: ICustomError<D>) {
    super(message);
    this.name = new.target.name;
    this.level = level;
    this.error = error;
    this.statusCode = statusCode;
    this.details = details;

    // Giữ stack trace gọn khi chạy trong Node
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  serialize(): Omit<ICustomError<D>, "level"> {
    return {
      error: this.error,
      statusCode: this.statusCode,
      message: this.message,
      ...(this.details && { details: this.details }),
    };
  }
}

export class DatabaseError<
  D extends Record<string, unknown> = Record<string, unknown>
> extends CustomError<D> {
  constructor(
    message = "Database operation failed",
    error: string = "UNKNOWN_DB_ERROR",
    details?: D
  ) {
    super({
      level: "error",
      error,
      message,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      details: details ?? ({} as D),
    });
  }
}

export class BadRequestError extends CustomError {
  constructor(message: string, error?: string) {
    super({
      level: "debug",
      error: error ?? "BadRequestError",
      statusCode: StatusCodes.BAD_REQUEST,
      message,
    });
  }
}

export class NotAuthorizedError<
  D extends Record<string, unknown> = Record<string, unknown>
> extends CustomError<D> {
  constructor(
    message: string = "Authentication failed",
    error: string = "UNAUTHORIZED"
  ) {
    super({
      level: "debug",
      error,
      statusCode: StatusCodes.UNAUTHORIZED,
      message,
    });
  }
}

export class PermissionError<
  D extends Record<string, unknown> = Record<string, unknown>
> extends CustomError<D> {
  constructor(
    message = "Permission denied",
    error: string = "FORBIDDEN",
    details?: D
  ) {
    super({
      level: "warn",
      error,
      message,
      statusCode: StatusCodes.FORBIDDEN,
      details,
    });
  }
}

function extractConstraintField(constraint?: string): string {
  if (!constraint) return "unknown";
  const parts = constraint.split("_");
  return parts.length > 1 ? parts[1] : constraint;
}

export function mapPostgresError(err: unknown): DatabaseError {
  // Đảm bảo err thực sự là PostgresError
  if (isPostgresError(err)) {
    switch (err.code) {
      case "23505":
        // Unique constraint
        return new DatabaseError("Dữ liệu đã tồn tại", err.code, {
          constraint: err.constraint,
          field: extractConstraintField(err.constraint),
          detail: err.detail,
        });

      case "23503":
        // Foreign key violation
        return new DatabaseError("Tham chiếu không hợp lệ", err.code, {
          constraint: err.constraint,
          table: err.table,
          detail: err.detail,
        });

      case "22P02":
        // Invalid input syntax (e.g. UUID)
        return new DatabaseError("Dữ liệu không hợp lệ", err.code, {
          detail: err.detail,
        });

      case "23502":
        // Not-null violation
        return new DatabaseError("Thiếu dữ liệu bắt buộc", err.code, {
          column: err.column,
        });

      default:
        return new DatabaseError("Lỗi truy vấn cơ sở dữ liệu", err.code, {
          detail: err.detail,
          table: err.table,
          constraint: err.constraint,
        });
    }
  }

  // Không phải lỗi Postgres
  return new DatabaseError(
    "Lỗi không xác định trong cơ sở dữ liệu",
    "UNKNOWN_DB_ERROR",
    {
      originalError: String(err),
    }
  );
}

export function isPostgresError(err: unknown): err is PostgresError {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as { code: unknown }).code === "string"
  );
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  if (typeof error === "string") {
    return error;
  }
  return "An error occurred";
}

export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // validate input
  if (hasZodFastifySchemaValidationErrors(error)) {
    return reply.code(400).send({
      error: "Response Validation Error",
      message: "Request doesn't match the schema",
      statusCode: 400,
      details: {
        issues: error.validation,
        method: request.method,
        url: request.url,
      },
    });
  }
  // validate output
  if (isResponseSerializationError(error)) {
    return reply.code(500).send({
      error: "Internal Server Error",
      message: "Response doesn't match the schema",
      statusCode: 500,
      details: {
        issues: error.cause.issues,
        method: error.method,
        url: error.url,
      },
    });
  }

  // if (error.code === "FST_ERR_VALIDATION" && error.validation) {
  //   return reply.status(StatusCodes.BAD_REQUEST).send({
  //     statusText: "BAD_REQUEST",
  //     statusCode: StatusCodes.BAD_REQUEST,
  //     data: {
  //       message: error.validation[0].message ?? "Validate error",
  //     },
  //   });
  // }

  // debug mode
  if (reply.sent || reply.raw?.headersSent || env.DEBUG) {
    return reply.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
  }

  // app error
  if (error instanceof DatabaseError) {
    const err = error.serialize();
    return reply.status(err.statusCode).send({
      error: err.error,
      statusCode: err.statusCode,
      message: err.message,
    });
  } else if (error instanceof CustomError) {
    return reply.status(error.statusCode).send(error.serialize());
  }

  // unknown error
  reply.status(500).send({
    statusText: "INTERNAL_SERVER_ERROR",
    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    data: {
      message:
        getErrorMessage(error) ||
        "An error occurred. Please view logs for more details",
    },
  });
}
