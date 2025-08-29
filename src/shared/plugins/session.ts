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

  interface FastifyReply {}
}

interface SessionOptions {
  cookieName: string;
  secret: string;
  refreshCookie?: boolean;
}

async function session(fastify: FastifyInstance, options: SessionOptions) {
  const { cookieName, secret, refreshCookie = false } = options;

  fastify.decorateRequest("currUser", null);
  fastify.decorateRequest("sessionId", null);
  fastify.decorateRequest("userRoles");
  fastify.decorateReply(
    "setSession",
    function (data: string, options?: CookieOptions) {}
  );

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
        req.currUser = user;
        req.userRoles = await req.users.findRoles(user.id);
      }
    }
  );

  fastify.addHook("onResponse", async (req, reply) => {
    if (req.sessionId && refreshCookie) {
      const refreshSession = await req.sessions.refresh(req.sessionId);
      if (refreshSession) {
        reply.setCookie(
          config.SESSION_KEY_NAME,
          cryptoCookie.encrypt(req.sessionId),
          refreshSession.cookie
        );
      }
    }
  });
}

export default fp(session, {
  name: "sessionPlugin",
});
