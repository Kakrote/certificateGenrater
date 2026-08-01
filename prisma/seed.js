require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const pg = require("pg");

const testingData = require("../src/lib/testingData.json");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required for seed");
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function extractEmailFromDetails(details, explicitEmail) {
  if (explicitEmail && explicitEmail.trim()) {
    return explicitEmail.trim().toLowerCase();
  }
  if (!details) return null;
  const emailMatch = details.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
  return emailMatch ? emailMatch[0].toLowerCase() : null;
}

async function main() {
  try {
    if (process.env.NODE_ENV === "production" && process.env.SEED_SAMPLE_DATA !== "true") {
      console.log("Skipping sample seed in production.");
      return;
    }

    console.log("Checking PostgreSQL database seeding status...");
    const count = await prisma.certificate.count().catch(() => 0);

    if (count <= 10) {
      console.log(`Seeding ${testingData.length} records from test.xlsx into PostgreSQL DB...`);
      await prisma.certificate.deleteMany({}).catch(() => {});

      for (const cert of testingData) {
        const email = extractEmailFromDetails(cert.details, cert.email);
        await prisma.certificate.create({
          data: {
            id: cert.id,
            certificateId: cert.certificateId,
            name: cert.name,
            phone: cert.phone || "",
            cleanPhone: (cert.phone || "").replace(/\D/g, ""),
            email: email,
            driveUrl: cert.driveUrl,
            event: cert.event,
            issueDate: cert.issueDate,
            details: cert.details || "",
            downloads: 0,
          },
        });
      }
      console.log(`Database successfully seeded with ${testingData.length} records!`);
    } else {
      console.log(`Database already initialized with ${count} records.`);
    }
  } catch (e) {
    console.error("Seeding warning:", e);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
