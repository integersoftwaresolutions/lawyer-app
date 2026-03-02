import http from "http";
import { createApp } from "./app.js";
import { connectMongo } from "./db/mongo.js";
import { env } from "./config/env.js";
import { initSocket } from "./socket/index.js";

process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
});

async function bootstrap() {
  await connectMongo();

  const app = createApp();
  const server = http.createServer(app);

  initSocket(server);

  server.listen(env.port, () => {
    console.log(`✅ Backend running on http://localhost:${env.port}`);
  });
}

bootstrap().catch((e) => {
  console.error("❌ Failed to start server:", e);
  process.exit(1);
});
