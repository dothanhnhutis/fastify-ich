# Fastify Lifecycle

Mối quan hệ giữa 2 Lifecycle
Application Lifecycle (1 lần)

Chạy 1 lần khi server khởi động/tắt
Setup toàn bộ application

Request Lifecycle (nhiều lần)

Chạy mỗi khi có request trong Runtime Phase
Xử lý từng request riêng biệt

```typescript
const fastify = require("fastify")({ logger: true });

// ===== APPLICATION LIFECYCLE HOOKS =====
console.log("🏗️  1. Instance Created");

fastify.addHook("onRegister", (instance, opts) => {
  console.log("📦 2. Plugin Registration Phase - onRegister");
});

fastify.addHook("onRoute", (routeOptions) => {
  console.log("📍 2. Plugin Registration Phase - onRoute:", routeOptions.url);
});

fastify.addHook("onReady", async () => {
  console.log("🚀 3. Ready Phase - Server ready!");
});

fastify.addHook("onClose", async () => {
  console.log("🔄 6. Shutdown Phase - onClose");
});

// ===== REQUEST LIFECYCLE HOOKS =====
// Chỉ chạy trong Runtime Phase khi có request
fastify.addHook("onRequest", async (request, reply) => {
  console.log(
    `🔄 5. Runtime Phase - REQUEST START: ${request.method} ${request.url}`
  );
});

fastify.addHook("preValidation", async (request, reply) => {
  console.log("✅ 5. Runtime Phase - preValidation");
});

fastify.addHook("preHandler", async (request, reply) => {
  console.log("🎯 5. Runtime Phase - preHandler");
});

fastify.addHook("preSerialization", async (request, reply, payload) => {
  console.log("📦 5. Runtime Phase - preSerialization");
  return payload;
});

fastify.addHook("onSend", async (request, reply, payload) => {
  console.log("📤 5. Runtime Phase - onSend");
  return payload;
});

fastify.addHook("onResponse", async (request, reply) => {
  console.log(`✅ 5. Runtime Phase - REQUEST END: ${reply.statusCode}`);
});

fastify.addHook("onError", async (request, reply, error) => {
  console.log("❌ 5. Runtime Phase - onError:", error.message);
});

// Register routes (triggers Application hooks)
fastify.register(
  async function routes(fastify) {
    fastify.get(
      "/users",
      {
        schema: {
          response: {
            200: {
              type: "object",
              properties: {
                users: { type: "array" },
              },
            },
          },
        },
      },
      async (request, reply) => {
        console.log("🏃 5. Runtime Phase - Handler executing");
        return { users: ["user1", "user2"] };
      }
    );

    fastify.get("/error", async (request, reply) => {
      throw new Error("Test error");
    });
  },
  { name: "routes" }
);

// Start server
const start = async () => {
  try {
    console.log("🚀 4. Listen Phase - Starting...");
    await fastify.listen({ port: 3000 });
    console.log("✅ 4. Listen Phase - Server listening");
    console.log("⏳ 5. Runtime Phase - Waiting for requests...");
  } catch (err) {
    console.error("❌ Failed to start:", err);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n📢 Shutdown signal received");
  await fastify.close();
  console.log("✅ Server closed");
});

start();
```
