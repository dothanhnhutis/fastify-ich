import amqplib from "amqplib";

export interface ExchangeConfig {
  name: string;
  type: "direct" | "topic" | "fanout" | "headers";
  options?: amqplib.Options.AssertExchange;
}

export type QueueConfig =
  | {
      type: "queue";
      name: string;
      options?: amqplib.Options.AssertQueue;
    }
  | {
      type: "direct" | "topic";
      exchange: string;
      name?: string;
      routingKey: string;
      options?: amqplib.Options.AssertQueue;
    }
  | {
      type: "headers";
      exchange: string;
      name?: string;
      headers: { "x-match": "all" | "any"; [index: string]: string };
      options?: amqplib.Options.AssertQueue;
    }
  | {
      type: "fanout";
      exchange: string;
      name?: string;
      options?: amqplib.Options.AssertQueue;
    };

export interface AMQPConnection {
  name: string;
  maxRetries?: number;
  retryDelay?: number;
  clientProperties?: Partial<{
    connection_name: string;
    purpose: string;
  }>;
  // config?: amqplib.Options.Connect;
  channels?: {
    name: string;
    confirmSelect?: boolean;
    prefetch?: number;
  }[];
}

export interface AMQPConnectionPoolOptions {
  connections: AMQPConnection[];
  server: amqplib.Options.Connect;
  exchanges?: ExchangeConfig[];
  queues?: QueueConfig[];
}

export default class AMQPConnectionPool {
  private connections: Map<string, amqplib.ChannelModel> = new Map();
  private channels: Map<string, amqplib.Channel | amqplib.ConfirmChannel> =
    new Map();
  private options: AMQPConnectionPoolOptions;
  constructor(options: AMQPConnectionPoolOptions) {
    this.options = options;
  }

  public async connect() {
    // if (!this.options.connections) return;
    try {
      for (let connection of this.options.connections) {
        const { clientProperties, name, channels = [] } = connection;

        const conn = await amqplib.connect(this.options.server, {
          clientProperties,
        });

        this.handleConnectionError(conn, connection);

        this.connections.set(name, conn);

        await this.createChannels(conn, channels);
      }
      this.setupQueuesAndExchanges();

      console.log("RabbitMQ - connect success");
    } catch (error) {
      this.closeAll();
      throw new Error("RabbitMQ connect Error: ");
    }
  }

  private async createChannels(
    conn: amqplib.ChannelModel,
    channels: NonNullable<AMQPConnection["channels"]>
  ) {
    for (let ch of channels) {
      let channel: amqplib.Channel | amqplib.ConfirmChannel;
      if (ch.confirmSelect) {
        channel = await conn.createConfirmChannel();
      } else {
        channel = await conn.createChannel();
      }

      if (ch.prefetch && ch.prefetch > 0) {
        await channel.prefetch(ch.prefetch);
      }
      this.channels.set(ch.name, channel);
    }
  }

  private async handleConnectionError(
    conn: amqplib.ChannelModel,
    connection: AMQPConnection
  ) {
    conn.on("error", (error) => {
      console.error(`❌ Connection error (${connection.name}):`, error);
      // this.handleConnectionFailure(name);
    });

    const maxRetries =
      !connection.maxRetries || connection.maxRetries <= 0
        ? 0
        : connection.maxRetries;

    conn.on("close", async () => {
      console.log(`RabbitMQ - connection ${connection.name} closed`);
      if (maxRetries > 0) {
        await this.reconnect(connection);
      }
    });
  }

  public getChannel(name: string): amqplib.Channel {
    const channel = this.channels.get(name);
    if (!channel || this.isConfirmChannel(channel))
      throw new Error(`Channel ${name} not exists.`);
    return channel;
  }

  public getConfirmChannel(name: string): amqplib.ConfirmChannel {
    const confirmChannel = this.channels.get(name);
    if (!confirmChannel || !this.isConfirmChannel(confirmChannel))
      throw new Error(`ConfirmChannel ${name} not exists.`);
    return confirmChannel;
  }

  private isConfirmChannel(
    ch: amqplib.Channel | amqplib.ConfirmChannel
  ): ch is amqplib.ConfirmChannel {
    return typeof (ch as amqplib.ConfirmChannel).waitForConfirms === "function";
  }

  private async setupQueuesAndExchanges(): Promise<void> {
    const conn = await amqplib.connect(this.options.server);
    const channel = await conn.createChannel();
    const { queues = [], exchanges = [] } = this.options;

    // Thiết lập exchanges
    for (const exchange of exchanges) {
      await channel.assertExchange(
        exchange.name,
        exchange.type,
        exchange.options
      );
    }

    // Thiết lập queues
    for (const queue of queues) {
      switch (queue.type) {
        case "queue":
          await channel.assertQueue(queue.name || "", queue.options);
          break;

        case "topic":
        case "direct":
          const q_topic_or_direct = await channel.assertQueue(
            queue.name || "",
            queue.options
          );
          await channel.bindQueue(
            q_topic_or_direct.queue,
            queue.exchange,
            queue.routingKey
          );
          break;

        case "headers":
          const q_headers = await channel.assertQueue(
            queue.name || "",
            queue.options
          );
          await channel.bindQueue(
            q_headers.queue,
            queue.exchange,
            "",
            queue.headers
          );
          break;

        default:
          const q_fanout = await channel.assertQueue(
            queue.name || "",
            queue.options
          );
          await channel.bindQueue(q_fanout.queue, queue.exchange, "");
          break;
      }
    }

    await channel.close();
    await conn.close();
  }

  public async closeAll(): Promise<void> {
    console.log("🛑 Closing connection pool...");

    // Close all channels first
    await Promise.all(
      Array.from(this.channels.values()).map((channel) =>
        channel
          .close()
          .catch((err) => console.error("Channel close error:", err))
      )
    );

    // Close all connections
    await Promise.all(
      Array.from(this.connections.values()).map((connection) =>
        connection
          .close()
          .catch((err) => console.error("Connection close error:", err))
      )
    );

    this.channels.clear();
    this.connections.clear();

    console.log("✅ Connection pool closed");
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async reconnect({
    name,
    maxRetries = 0,
    retryDelay = 5000,
    clientProperties,
    channels = [],
  }: AMQPConnection) {
    const maxAttempt = maxRetries <= 0 ? 0 : maxRetries;
    const delay = retryDelay <= 0 ? 5000 : retryDelay;
    console.log(`RabbitMQ - connection ${name} reconnection...`);
    for (let attempt = 1; attempt <= maxAttempt; attempt++) {
      try {
        console.log(
          `RabbitMQ - attempt connection ${name} time ${attempt} sau ${retryDelay}ms, retring...`
        );
        await this.sleep(delay);

        const conn = await amqplib.connect(this.options.server, {
          clientProperties,
        });

        conn.on("close", async () => {
          console.log(`RabbitMQ - connection ${name} closed`);
          if (maxRetries > 0) {
            await this.reconnect({
              name,
              maxRetries,
              retryDelay,
              clientProperties,
              channels,
            });
          }
        });

        this.connections.set(name, conn);

        await this.createChannels(conn, channels);
        console.log(`RabbitMQ - connection ${name} reconnect success`);
        break;
      } catch (error) {
        console.log(
          `RabbitMQ - attempt connection ${name} time ${attempt} that bai`
        );
        if (attempt == maxRetries)
          console.log(
            `RabbitMQ - connection ${name} đã hết số lần thử kết nối lại.`
          );
      }
    }
  }

  // Stats & monitoring
  // getPoolStats() {
  //   return {
  //     connections: {
  //       total: this.connections.size,
  //       active: Array.from(this.connections.entries()).map(([name, conn]) => ({
  //         name,
  //         status: conn.connection.expectSocketClose ? "closed" : "open",
  //       })),
  //     },
  //     channels: {
  //       total: this.channels.size,
  //       active: Array.from(this.channels.keys()),
  //     },
  //   };
  // }
}
