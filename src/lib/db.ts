import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import testingData from "./testingData.json";
import { CertificateRecord } from "./types";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaPool?: pg.Pool;
};

const pool = globalForPrisma.prismaPool || new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
  globalForPrisma.prismaPool = pool;
}

// Self-healing DB initializer for the first startup
let isInitialized = false;
const shouldSeedSampleData = process.env.NODE_ENV !== "production" || process.env.SEED_SAMPLE_DATA === "true";

export function extractEmailFromDetails(details?: string, explicitEmail?: string): string | null {
  if (explicitEmail && explicitEmail.trim()) {
    return explicitEmail.trim().toLowerCase();
  }
  if (!details) return null;
  const emailMatch = details.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
  return emailMatch ? emailMatch[0].toLowerCase() : null;
}

export async function initializeDatabaseIfNeeded() {
  if (isInitialized) return;
  try {
    await db.$connect();

    const seedStat = await db.systemStat.findUnique({ where: { key: "isSeeded" } }).catch(() => null);
    if (!seedStat) {
      const count = await db.certificate.count().catch(() => 0);
      if (shouldSeedSampleData && count === 0 && Array.isArray(testingData) && testingData.length > 0) {
        console.log(`Initial seeding ${testingData.length} records into PostgreSQL database...`);
        for (const cert of testingData as CertificateRecord[]) {
          const extractedEmail = extractEmailFromDetails(cert.details, cert.email);
          await db.certificate.upsert({
            where: { certificateId: cert.certificateId },
            update: {},
            create: {
              id: cert.id,
              certificateId: cert.certificateId,
              name: cert.name,
              phone: cert.phone || "",
              cleanPhone: (cert.phone || "").replace(/\D/g, ""),
              email: extractedEmail,
              driveUrl: cert.driveUrl,
              event: cert.event,
              issueDate: cert.issueDate,
              details: cert.details || "",
              downloads: cert.downloads || 0,
            },
          }).catch(() => {});
        }
      }
      await db.systemStat.upsert({
        where: { key: "isSeeded" },
        update: { value: 1 },
        create: { key: "isSeeded", value: 1 },
      }).catch(() => {});
    }
    isInitialized = true;
  } catch (err) {
    console.warn("Database initialization notice:", err);
  }
}

