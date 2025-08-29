import { FastifyRequest, FastifyReply, RouteGenericInterface } from "fastify";
import { NotAuthorizedError } from "../error-handler";

export default async function requiredAuthMiddleware<
  T extends RouteGenericInterface
>(req: FastifyRequest<T>, reply: FastifyReply) {
  if (!req.currUser) {
    throw new NotAuthorizedError();
  }
}
