import { config as loadEnv } from "dotenv";
import { defineConfig, env } from "prisma/config";

// O Next.js lê .env.local automaticamente, mas a CLI do Prisma roda fora do
// Next.js e precisa carregá-lo explicitamente.
loadEnv({ path: ".env.local" });
loadEnv();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
