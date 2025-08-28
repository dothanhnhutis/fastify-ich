import fp from "fastify-plugin";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import config from "../config";
import { cryptoCookie } from "../constants";

declare module "fastify" {
  interface FastifyRequest {
    currUser: User | null;
    sessionId: string | null;
    userRoles: Role[];
  }
}

interface SessionOptions {
  cookieName?: string;
  secret: string;
  refreshCookie?: boolean;
}

async function session(fastify: FastifyInstance, options: SessionOptions) {
  const { cookieName = "sid", secret } = options;

  fastify.decorateRequest("currUser", null);
  fastify.decorateRequest("sessionId", null);
  fastify.decorateRequest("userRoles");

  fastify.addHook(
    "onRequest",
    async (req: FastifyRequest, res: FastifyReply) => {
      const session = req.cookies.get(cookieName);
      if (!session) return;
      const sessionId = cryptoCookie.decrypt(session);
      const sessionData = await req.sessions.findById(sessionId);
      if (!sessionData) return;
      const user = await req.users.findById(sessionData.userId);
      if (!user) {
        res.clearCookie(config.SESSION_KEY_NAME);
      } else {
        req.sessionId = sessionId;
        const refreshSession = await req.sessions.refresh(sessionId);
        req.currUser = user;
        req.userRoles = await req.users.findRoles(user.id);

        if (refreshSession) {
          res.setCookie(
            config.SESSION_KEY_NAME,
            cryptoCookie.encrypt(sessionId),
            refreshSession.cookie
          );
        }
      }
    }
  );
}

export default fp(session, {
  name: "sessionPlugin",
});
