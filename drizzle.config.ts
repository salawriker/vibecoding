import { defineConfig } from "drizzle-kit";

// drizzle-kit은 Next.js와 달리 .env.local을 자동 로드하지 않으므로 직접 읽어옵니다.
process.loadEnvFile(".env.local");

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
