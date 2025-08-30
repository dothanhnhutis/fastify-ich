import fp from "fastify-plugin";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import config from "../config";
import { CryptoAES } from "../crypto";

declare module "fastify" {
  interface FastifyRequest {
    currUser: (User & { roles: Role[] }) | null;
    sessionId: string | null;
  }

  interface FastifyReply {
    setSession: (
      value: string,
      options?: CookieOptions & { name?: string }
    ) => FastifyReply;
  }
}

interface SessionOptions {
  cookieName: string;
  secret: string;
  refreshCookie?: boolean;
}

async function session(fastify: FastifyInstance, options: SessionOptions) {
  const { cookieName, secret, refreshCookie = false } = options;

  const cryptoCookie = new CryptoAES("aes-256-gcm", secret);

  fastify.decorateRequest("currUser", null);
  fastify.decorateRequest("sessionId", null);

  fastify.decorateReply(
    "setSession",
    function (data: string, options?: CookieOptions & { name?: string }) {
      const encryptData = cryptoCookie.encrypt(data);
      const { name = cookieName, ...other } = options || {};
      this.setCookie(name, encryptData, {
        ...other,
      });
      return this;
    }
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
        res.clearCookie(cookieName);
      } else {
        req.sessionId = sessionId;
        const roles = await req.users.findRoles(user.id);
        req.currUser = { ...user, roles };
      }
    }
  );

  fastify.addHook("onSend", async (req, reply) => {
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
