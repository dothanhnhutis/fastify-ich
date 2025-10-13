import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import {
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
} from "fastify-type-provider-zod";
import { StatusCodes } from "http-status-codes";
import config from "./config";

export class CustomError<C extends string> extends Error {
  message: string;
  statusCode: number;
  statusText?: C;

  constructor({
    message,
    statusCode,
    statusText,
  }: {
    message: string;
    statusCode: number;
    statusText?: C;
  }) {
    super();
    this.message = message;
    this.statusCode = statusCode;
    this.statusText = statusText;
  }

  serialize() {
    return {
      statusText: this.statusText,
      statusCode: this.statusCode,
      data: { message: this.message },
    };
  }
}

type ErrorCode =
  | "NOT_FOUND"
  | "BAD_REQUEST"
  | "TOO_MANY_REQUESTS"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "ERR_VALID";

export class BadRequestError extends CustomError<ErrorCode> {
  constructor(message: string) {
    super({
      message,
      statusCode: StatusCodes.BAD_REQUEST,
      statusText: "BAD_REQUEST",
    });
  }
}

export class NotAuthorizedError extends CustomError<ErrorCode> {
  constructor(message: string = "Authentication failed") {
    super({
      message,
      statusCode: StatusCodes.UNAUTHORIZED,
      statusText: "UNAUTHORIZED",
    });
  }
}

export class PermissionError extends CustomError<ErrorCode> {
  constructor(message = "Permission denied") {
    super({
      statusCode: StatusCodes.FORBIDDEN,
      statusText: "FORBIDDEN",
      message,
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

  if (reply.sent || (reply.raw && reply.raw.headersSent) || config.DEBUG) {
    return reply.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
  }

  if (error instanceof CustomError) {
    return reply.status(error.statusCode).send(error.serialize());
  }

  console.log(error);

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
