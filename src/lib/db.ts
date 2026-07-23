import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";
import fs from "fs";
import testingData from "./testingData.json";
import { CertificateRecord } from "./types";

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

// Self-healing DB initializer for production
let isInitialized = false;

export async function initializeDatabaseIfNeeded() {
  if (isInitialized) return;
  try {
    // Ensure SQLite schema tables exist
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Certificate" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "certificateId" TEXT NOT NULL UNIQUE,
        "name" TEXT NOT NULL,
        "phone" TEXT NOT NULL,
        "cleanPhone" TEXT NOT NULL,
        "driveUrl" TEXT NOT NULL,
        "event" TEXT NOT NULL,
        "issueDate" TEXT NOT NULL,
        "details" TEXT,
        "downloads" INTEGER NOT NULL DEFAULT 0,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SystemStat" (
        "key" TEXT NOT NULL PRIMARY KEY,
        "value" INTEGER NOT NULL DEFAULT 0
      );
    `);

    await db.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Certificate_cleanPhone_idx" ON "Certificate"("cleanPhone");
    `);

    await db.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Certificate_phone_idx" ON "Certificate"("phone");
    `);

    const count = await db.certificate.count().catch(() => 0);
    if (count === 0 && Array.isArray(testingData) && testingData.length > 0) {
      console.log(`Auto-seeding ${testingData.length} records into SQLite database...`);
      for (const cert of testingData as CertificateRecord[]) {
        await db.certificate.create({
          data: {
            id: cert.id,
            certificateId: cert.certificateId,
            name: cert.name,
            phone: cert.phone,
            cleanPhone: (cert.phone || "").replace(/\D/g, ""),
            driveUrl: cert.driveUrl,
            event: cert.event,
            issueDate: cert.issueDate,
            details: cert.details || "",
            downloads: cert.downloads || 0,
          },
        }).catch(() => {});
      }
    }
    isInitialized = true;
  } catch (err) {
    console.warn("Database initialization notice:", err);
  }
}

