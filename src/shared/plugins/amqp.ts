import amqplib from "amqplib";
import fp from "fastify-plugin";
import { FastifyInstance, FastifyPluginOptions } from "fastify";

import AMQPConnectionPool, { AMQPConnectionPoolOptions } from "../rabbitmq";

declare module "fastify" {
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

  fastify.addHook("onReady", async () => {
    await amqp.connect();
  });

  fastify.decorateRequest("getChannel", amqp.getChannel);
  fastify.decorateRequest("getConfirmChannel", amqp.getConfirmChannel);

  fastify.addHook("onClose", async () => {
    await amqp.closeAll();
  });
}

export default fp(amqplibPlugin, {
  name: "amqplib-plugin",
});
