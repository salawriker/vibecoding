import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL 환경변수가 설정되지 않았습니다.");
}

// Supabase의 커넥션 풀러(pooler)를 사용할 때는 prepare를 비활성화합니다.
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
