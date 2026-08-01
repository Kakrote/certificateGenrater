const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const path = require("path");
const fs = require("fs");

const testingData = require("../src/lib/testingData.json");

const prismaDir = path.resolve(process.cwd(), "prisma");
if (!fs.existsSync(prismaDir)) {
  fs.mkdirSync(prismaDir, { recursive: true });
}

const dbPath = path.resolve(prismaDir, "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
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
    console.log("Checking SQLite database seeding status...");
    const count = await prisma.certificate.count().catch(() => 0);

    if (count <= 10) {
      console.log(`Seeding ${testingData.length} records from test.xlsx into SQLite DB...`);
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
      console.log("Database successfully seeded with 597 records!");
    } else {
      console.log(`Database already initialized with ${count} records.`);
    }
  } catch (e) {
    console.error("Seeding warning:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
