import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";
import fs from "fs";

// Ensure prisma directory exists for SQLite
const prismaDir = path.resolve(process.cwd(), "prisma");
if (!fs.existsSync(prismaDir)) {
  try {
    fs.mkdirSync(prismaDir, { recursive: true });
  } catch (e) {
    console.warn("Could not create prisma directory:", e);
  }
}

const dbPath = path.resolve(prismaDir, "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
