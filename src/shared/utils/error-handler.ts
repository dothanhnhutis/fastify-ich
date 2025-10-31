import env from "@shared/config/env";
import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import {
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
} from "fastify-type-provider-zod";
import { StatusCodes } from "http-status-codes";

interface ICustomError<
  D extends Record<string, unknown> = Record<string, unknown>
> {
  error: string;
  message: string;
  statusCode: number;
  details?: D;
}

export class CustomError<
  D extends Record<string, unknown> = Record<string, unknown>
> extends Error {
  error: string;
  statusCode: number;
  details?: D;

  constructor({ error, message, statusCode, details }: ICustomError<D>) {
    super(message);

    this.name = new.target.name;
    this.error = error;
    this.statusCode = statusCode;
    this.details = details;

    // Giữ stack trace gọn khi chạy trong Node
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  serialize(): {
    details?: D | undefined;
    error: string;
    message: string;
    statusCode: number;
  } {
    return {
      error: this.error,
      message: this.message,
      statusCode: this.statusCode,
      ...(this.details && { details: this.details }),
    };
  }
}

// type ErrorCode =
//   | "NOT_FOUND"
//   | "BAD_REQUEST"
//   | "TOO_MANY_REQUESTS"
//   | "UNAUTHORIZED"
//   | "FORBIDDEN"
//   | "ERR_VALID";

export class BadRequestError<
  D extends Record<string, unknown> = Record<string, unknown>
> extends CustomError<D> {
  constructor(error: string, message: string, details?: D) {
    super({
      error,
      message,
      statusCode: StatusCodes.BAD_REQUEST,
      details: details ?? ({} as D),
    });
  }
}

export class NotAuthorizedError<
  D extends Record<string, unknown> = Record<string, unknown>
> extends CustomError<D> {
  constructor(
    error: string,
    message: string = "Authentication failed",
    details?: D
  ) {
    super({
      error,
      message,
      statusCode: StatusCodes.UNAUTHORIZED,
      details: details ?? ({} as D),
    });
  }
}

export class PermissionError<
  D extends Record<string, unknown> = Record<string, unknown>
> extends CustomError<D> {
  constructor(error: string, message = "Permission denied", details?: D) {
    super({
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
