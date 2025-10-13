import type amqplib from "amqplib";
import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import fp from "fastify-plugin";
import { createUserConsume } from "../consumes/user-mail";
import AMQPConnectionPool, {
  type AMQPConnectionPoolOptions,
} from "../rabbitmq";

declare module "fastify" {
  interface FastifyInstance {
    getChannel: (name: string) => amqplib.Channel;
    getConfirmChannel: (name: string) => amqplib.ConfirmChannel;
  }
  interface FastifyRequest {
    getChannel: (name: string) => amqplib.Channel;
    getConfirmChannel: (name: string) => amqplib.ConfirmChannel;
  }
}

interface AMQPPluginOptions
  extends AMQPConnectionPoolOptions,
    FastifyPluginOptions {}

async function amqplibPlugin(
  fastify: FastifyInstance,
  options: AMQPPluginOptions
) {
  const { server, connections = [], exchanges = [], queues = [] } = options;

  const amqp = new AMQPConnectionPool({
    server,
    connections,
    exchanges,
    queues,
  });

  // Giải pháp 1: Bind context với arrow functions
  // fastify.decorate("getChannel", (name: string) => amqp.getChannel(name));
  // fastify.decorate("getConfirmChannel", (name: string) =>
  //   amqp.getConfirmChannel(name)
  // );
  // fastify.decorateRequest("getChannel", (name: string) =>
  //   amqp.getChannel(name)
  // );
  // fastify.decorateRequest("getConfirmChannel", (name: string) =>
  //   amqp.getConfirmChannel(name)
  // );

  // Hoặc Giải pháp 2: Bind context explicitly (comment out nếu dùng giải pháp 1)
  // fastify.decorate("getChannel", amqp.getChannel.bind(amqp));
  // fastify.decorate("getConfirmChannel", amqp.getConfirmChannel.bind(amqp));
  // fastify.decorateRequest("getChannel", amqp.getChannel.bind(amqp));
  // fastify.decorateRequest(
  //   "getConfirmChannel",
  //   amqp.getConfirmChannel.bind(amqp)
  // );

  fastify.decorate("getChannel", amqp.getChannel);
  fastify.decorate("getConfirmChannel", amqp.getConfirmChannel);
  fastify.decorateRequest("getChannel", amqp.getChannel);
  fastify.decorateRequest("getConfirmChannel", amqp.getConfirmChannel);

  fastify.addHook("onReady", async () => {
    await amqp.connect();

    createUserConsume(fastify);
  });

  fastify.addHook("onClose", async () => {
    await amqp.closeAll();
  });
}

export default fp(amqplibPlugin, {
  name: "amqplib-plugin",
});
