/**
 * Shared PrismaClient singleton. Next.js dev hot-reload re-imports modules, so
 * without this guard every reload would open a new pg Pool and leak
 * connections. Every server module imports `prisma` from here.
 */

import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { env } from "@/lib/env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const pool = new Pool({ connectionString: env.DATABASE_URL });

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter: new PrismaPg(pool) });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
