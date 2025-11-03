import { buildServer } from "./server";
import config from "./shared/config/env";

// Khởi tạo server
async function start(): Promise<void> {
  try {
    const server = await buildServer();

    const port = config.PORT || 3000;
    const host = config.HOST || "0.0.0.0";

    await server.listen({ port, host });

    server.log.info(`Server started on ${host}:${port}`);
  } catch (err) {
    console.error("Error starting server:", err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Received SIGINT, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Received SIGTERM, shutting down gracefully...");
  process.exit(0);
});

start();
