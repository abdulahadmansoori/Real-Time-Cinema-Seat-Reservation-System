import { z } from "zod";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

const candidates = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../../.env"),
  path.resolve(__dirname, "../../../.env"),
];
for (const p of candidates) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    break;
  }
}
dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default("redis://localhost:6380"),
  JWT_SECRET: z.string().min(8),
  ADMIN_EMAIL: z.string().email().default("admin@cinema.local"),
  ADMIN_PASSWORD: z.string().min(8),
  PARTNER_API_KEY: z.string().min(8),
  RESERVATION_TTL_MS: z.coerce.number().int().positive().default(300_000),
  API_PORT: z.coerce.number().int().default(4001),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  NODE_ENV: z.string().default("development"),
});

export const env = envSchema.parse(process.env);
export type Env = typeof env;
