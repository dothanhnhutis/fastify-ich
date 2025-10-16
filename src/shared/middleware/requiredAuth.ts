import { NotAuthorizedError } from "@shared/utils/error-handler";
import type {
  FastifyReply,
  FastifyRequest,
  RouteGenericInterface,
} from "fastify";

export default async function requiredAuthMiddleware<
  T extends RouteGenericInterface
>(req: FastifyRequest<T>, _: FastifyReply) {
  if (!req.currUser) {
    throw new NotAuthorizedError();
  }
}
