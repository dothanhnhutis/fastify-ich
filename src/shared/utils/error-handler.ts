import env from "@shared/config/env";
import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import {
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
} from "fastify-type-provider-zod";
import { StatusCodes } from "http-status-codes";
import type { LevelWithSilent } from "pino";

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
      message: this.message,
      statusCode: this.statusCode,
      ...(this.details && { details: this.details }),
    };
  }
}

export class DatabaseError<
  D extends Record<string, unknown> = Record<string, unknown>
> extends CustomError<D> {
  constructor(
    message = "Permission denied",
    error: string = "DatabaseError",
    details?: D
  ) {
    super({
      level: "error",
      error,
      message,
      statusCode: StatusCodes.FORBIDDEN,
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
      details: details ?? ({} as D),
    });
  }
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
  if (error instanceof CustomError) {
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
