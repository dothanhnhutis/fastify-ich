import { FastifyInstance } from "fastify";

export async function createUserConsume(fastify: FastifyInstance) {
  const channel = fastify.getChannel("consume-user-channel");
  channel.consume("create-new-user-mail-queue", (msg) => {
    if (msg) {
      const data = JSON.parse(msg.content.toString());
      console.log(data);
      channel.ack(msg);
    }
  });
}
