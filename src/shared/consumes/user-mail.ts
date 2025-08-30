import { FastifyInstance } from "fastify";

export function createUserConsume(fastify: FastifyInstance) {
  const channel = fastify.getChannel("consume-user-channel");
  channel.consume("create-new-user-mail-queue", (msg) => {
    if (msg) {
      const data = JSON.parse(msg.content.toString()) as {
        email: string;
        password: string;
      };
      /**
       * TODO: gửi email thông báo đến người dùng đăng ký thành công tài khoản và đưa mật khẩu
       */
      console.log(data);
      channel.ack(msg);
    }
  });
}
