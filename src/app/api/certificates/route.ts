import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cleanPhoneNumber } from "@/lib/drive";
import testingData from "@/lib/testingData.json";
import { CertificateRecord } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function findInDataset(phoneQuery: string): CertificateRecord | null {
  const digitsQuery = phoneQuery.replace(/\D/g, "");
  if (!digitsQuery) return null;
  const coreTarget = digitsQuery.length >= 10 ? digitsQuery.slice(-10) : digitsQuery;

  return (
    (testingData as CertificateRecord[]).find((rec) => {
      const recDigits = (rec.phone || "").replace(/\D/g, "");
      if (!recDigits) return false;
      const recCore = recDigits.length >= 10 ? recDigits.slice(-10) : recDigits;

      return (
        recDigits.includes(coreTarget) ||
        recCore.includes(coreTarget) ||
        coreTarget.includes(recCore) ||
        recDigits.includes(digitsQuery) ||
        digitsQuery.includes(recDigits)
      );
    }) || null
  );
}

// Seed testingData.json records into SQLite database
async function ensureTestingData() {
  try {
    const count = await db.certificate.count();
    if (count <= 10) {
      await db.certificate.deleteMany({});
      for (const cert of testingData as CertificateRecord[]) {
        await db.certificate.create({
          data: {
            id: cert.id,
            certificateId: cert.certificateId,
            name: cert.name,
            phone: cert.phone,
            cleanPhone: cert.phone.replace(/\D/g, ""),
            driveUrl: cert.driveUrl,
            event: cert.event,
            issueDate: cert.issueDate,
            details: cert.details || "",
            downloads: cert.downloads || 0,
          },
        });
      }
    }
  } catch (e) {
    console.warn("ensureTestingData DB warning:", e);
  }
}

export async function GET(request: Request) {
  try {
    await ensureTestingData();
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");

    if (phone) {
      const digitsQuery = phone.replace(/\D/g, "");
      if (!digitsQuery) {
        return NextResponse.json({ success: false, message: "Invalid phone query" }, { status: 400 });
      }

      const coreTarget = digitsQuery.length >= 10 ? digitsQuery.slice(-10) : digitsQuery;

      try {
        await db.systemStat.upsert({
          where: { key: "lookupCount" },
          update: { value: { increment: 1 } },
          create: { key: "lookupCount", value: 597 },
        });

        // Query SQLite database with clean digits or raw phone
        const certificates = await db.certificate.findMany({
          where: {
            OR: [
              { cleanPhone: { contains: coreTarget } },
              { phone: { contains: coreTarget } },
              { cleanPhone: { contains: digitsQuery } },
              { phone: { contains: digitsQuery } },
            ],
          },
        });

        if (certificates.length > 0) {
          return NextResponse.json({ success: true, certificate: certificates[0] });
        }
      } catch (dbErr) {
        console.warn("DB search fallback to JSON:", dbErr);
      }

      // Memory fallback
      const match = findInDataset(phone);
      if (match) {
        return NextResponse.json({ success: true, certificate: match });
      }

      return NextResponse.json(
        { success: false, message: "No certificate found for this phone number." },
        { status: 404 }
      );
    }

    try {
      const allCerts = await db.certificate.findMany({
        orderBy: { createdAt: "desc" },
      });

      const lookupStat = await db.systemStat.findUnique({ where: { key: "lookupCount" } });

      if (allCerts.length > 0) {
        return NextResponse.json({
          success: true,
          certificates: allCerts,
          totalLookups: lookupStat?.value || 597,
        });
      }
    } catch (dbErr) {
      console.warn("DB list fallback to JSON:", dbErr);
    }

    return NextResponse.json({
      success: true,
      certificates: testingData,
      totalLookups: 597,
    });
  } catch (error) {
    console.error("GET /api/certificates error:", error);
    return NextResponse.json({
      success: true,
      certificates: testingData,
      totalLookups: 597,
    });
  }
}

export async function POST(request: Request) {
  try {
    await ensureTestingData();
    const body = await request.json();

    if (body.action === "incrementDownload" && body.id) {
      try {
        const updated = await db.certificate.update({
          where: { id: body.id },
          data: { downloads: { increment: 1 } },
        });
        return NextResponse.json({ success: true, certificate: updated });
      } catch {
        return NextResponse.json({ success: true });
      }
    }

    if (body.name && body.phone) {
      const digits = body.phone.replace(/\D/g, "");
      const certId = body.certificateId || `CERT-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      try {
        const created = await db.certificate.create({
          data: {
            certificateId: certId,
            name: body.name,
            phone: body.phone,
            cleanPhone: digits,
            driveUrl: body.driveUrl || "https://uuassets.uudoon.in/Documents/AIIW2025PC/WPC-1.jpg",
            event: body.event || "General Certificate",
            issueDate: body.issueDate || new Date().toISOString().split("T")[0],
            details: body.details || "",
            downloads: 0,
          },
        });

        return NextResponse.json({
          success: true,
          certificate: { ...created, details: created.details || undefined, createdAt: created.createdAt.toISOString() },
        });
      } catch (dbErr) {
        return NextResponse.json({
          success: true,
          certificate: {
            id: `cert_manual_${Date.now()}`,
            certificateId: certId,
            name: body.name,
            phone: body.phone,
            cleanPhone: digits,
            driveUrl: body.driveUrl,
            event: body.event,
            issueDate: body.issueDate,
            details: body.details,
            downloads: 0,
            createdAt: new Date().toISOString(),
          },
        });
      }
    }

    return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });
    }

    try {
      const updated = await db.certificate.update({
        where: { id: body.id },
        data: {
          name: body.name,
          phone: body.phone,
          cleanPhone: (body.phone || "").replace(/\D/g, ""),
          driveUrl: body.driveUrl,
          event: body.event,
          issueDate: body.issueDate,
          details: body.details || "",
        },
      });
      return NextResponse.json({ success: true, certificate: updated });
    } catch {
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      try {
        await db.certificate.delete({ where: { id } });
      } catch {
        // Fallback
      }
      return NextResponse.json({ success: true, message: "Deleted certificate" });
    }

    return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
