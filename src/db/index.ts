import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://factory:factorypassword@127.0.0.1:5433/factory";

// Convert pooling options if needed, or just pass string
const client = postgres(connectionString);
export const db = drizzle(client, { schema });

export type Database = typeof db;
