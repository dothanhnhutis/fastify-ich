import { PermissionError } from "@shared/utils/error-handler";
import type {
  FastifyReply,
  FastifyRequest,
  RouteGenericInterface,
} from "fastify";

export default function checkPermissionMiddleware(permissions: string[]) {
  return async <T extends RouteGenericInterface>(
    req: FastifyRequest<T>,
    _: FastifyReply
  ) => {
    if (!req.currUser) throw new PermissionError();

    const pers: string[] = Array.from(
      new Set(req.currUser.roles.flatMap(({ permissions }) => permissions))
    );

    if (permissions.every((per) => !pers.includes(per)))
      throw new PermissionError();
  };
}
