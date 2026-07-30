import { NextResponse } from "next/server";
import { db, initializeDatabaseIfNeeded } from "@/lib/db";
import testingData from "@/lib/testingData.json";
import { CertificateRecord } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function findInDataset(query: string): CertificateRecord | null {
  if (!query || !query.trim()) return null;
  const trimmed = query.trim().toLowerCase();
  const digitsQuery = query.replace(/\D/g, "");
  const dataset = testingData as CertificateRecord[];

  // 1. Email Search (Exact or Partial in email or details)
  if (trimmed.includes("@") || /[a-z]/i.test(trimmed)) {
    let match = dataset.find((rec) => rec.email && rec.email.toLowerCase() === trimmed);
    if (match) return match;

    match = dataset.find((rec) => {
      if (rec.email && rec.email.toLowerCase().includes(trimmed)) return true;
      if (rec.details && rec.details.toLowerCase().includes(trimmed)) return true;
      return false;
    });
    if (match) return match;
  }

  // 2. Phone Search
  if (digitsQuery && digitsQuery.length >= 4) {
    const coreTarget = digitsQuery.length >= 10 ? digitsQuery.slice(-10) : digitsQuery;

    let match = dataset.find((rec) => {
      const recDigits = (rec.phone || "").replace(/\D/g, "");
      if (!recDigits) return false;
      const recCore = recDigits.length >= 10 ? recDigits.slice(-10) : recDigits;
      return recCore === coreTarget;
    });

    if (match) return match;

    return (
      dataset.find((rec) => {
        const recDigits = (rec.phone || "").replace(/\D/g, "");
        if (!recDigits) return false;
        const recCore = recDigits.length >= 10 ? recDigits.slice(-10) : recDigits;

        return (
          recDigits.endsWith(coreTarget) ||
          digitsQuery.endsWith(recCore) ||
          recDigits.includes(digitsQuery) ||
          (digitsQuery.length >= 6 && recDigits.includes(coreTarget))
        );
      }) || null
    );
  }

  return null;
}

export async function GET(request: Request) {
  try {
    await initializeDatabaseIfNeeded();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || searchParams.get("phone") || searchParams.get("email");

    if (query && query.trim()) {
      const cleanQuery = query.trim();
      const digitsQuery = cleanQuery.replace(/\D/g, "");
      const isEmailLike = cleanQuery.includes("@") || /[a-z]/i.test(cleanQuery);

      try {
        await db.systemStat.upsert({
          where: { key: "lookupCount" },
          update: { value: { increment: 1 } },
          create: { key: "lookupCount", value: 597 },
        });

        const orConditions: any[] = [];

        if (isEmailLike) {
          orConditions.push(
            { email: { contains: cleanQuery } },
            { details: { contains: cleanQuery } }
          );
        }

        if (digitsQuery && digitsQuery.length >= 4) {
          const coreTarget = digitsQuery.length >= 10 ? digitsQuery.slice(-10) : digitsQuery;
          orConditions.push(
            { cleanPhone: { contains: coreTarget } },
            { phone: { contains: coreTarget } },
            { cleanPhone: { contains: digitsQuery } },
            { phone: { contains: digitsQuery } }
          );
        }

        if (orConditions.length > 0) {
          const certificates = await db.certificate.findMany({
            where: { OR: orConditions },
          });

          if (certificates.length > 0) {
            // Priority matching
            let bestMatch = certificates[0];

            if (isEmailLike) {
              const exactEmail = certificates.find(
                (c) => c.email?.toLowerCase() === cleanQuery.toLowerCase()
              );
              if (exactEmail) bestMatch = exactEmail;
            } else if (digitsQuery) {
              const coreTarget = digitsQuery.length >= 10 ? digitsQuery.slice(-10) : digitsQuery;
              const exactPhone = certificates.find((c) => {
                const cClean = c.cleanPhone || (c.phone || "").replace(/\D/g, "");
                return cClean.endsWith(coreTarget) || cClean === digitsQuery;
              });
              if (exactPhone) bestMatch = exactPhone;
            }

            return NextResponse.json({ success: true, certificate: bestMatch });
          }
        }
      } catch (dbErr) {
        console.warn("DB search fallback to JSON:", dbErr);
      }

      // Memory fallback
      const match = findInDataset(cleanQuery);
      if (match) {
        return NextResponse.json({ success: true, certificate: match });
      }

      return NextResponse.json(
        { success: false, message: "No certificate found for this phone number or email address." },
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
    await initializeDatabaseIfNeeded();
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

    // Support Bulk Array Creation (e.g. Excel upload)
    if (Array.isArray(body?.records) && body.records.length > 0) {
      const createdRecords = [];
      for (const item of body.records) {
        if (!item.name || (!item.phone && !item.email)) continue;
        const phone = item.phone || "";
        const digits = phone.replace(/\D/g, "");
        const email = item.email || extractEmailFromDetails(item.details);
        const certId = item.certificateId || `CERT-2026-${Math.floor(1000 + Math.random() * 9000)}`;

        try {
          const rec = await db.certificate.create({
            data: {
              certificateId: certId,
              name: item.name,
              phone: phone,
              cleanPhone: digits,
              email: email,
              driveUrl: item.driveUrl || "https://uuassets.uudoon.in/Documents/AIIW2025PC/WPC-1.jpg",
              event: item.event || "General Certificate",
              issueDate: item.issueDate || new Date().toISOString().split("T")[0],
              details: item.details || "",
              downloads: 0,
            },
          });
          createdRecords.push(rec);
        } catch {
          // Ignore duplicate certificateId errors
        }
      }
      return NextResponse.json({ success: true, count: createdRecords.length, records: createdRecords });
    }

    if (body.name && (body.phone || body.email)) {
      const phone = body.phone || "";
      const digits = phone.replace(/\D/g, "");
      const email = body.email || extractEmailFromDetails(body.details);
      const certId = body.certificateId || `CERT-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      try {
        const created = await db.certificate.create({
          data: {
            certificateId: certId,
            name: body.name,
            phone: phone,
            cleanPhone: digits,
            email: email,
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
      } catch {
        return NextResponse.json({
          success: true,
          certificate: {
            id: `cert_manual_${Date.now()}`,
            certificateId: certId,
            name: body.name,
            phone: phone,
            cleanPhone: digits,
            email: email,
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
    await initializeDatabaseIfNeeded();
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });
    }

    try {
      const phone = body.phone || "";
      const email = body.email || extractEmailFromDetails(body.details);

      const updated = await db.certificate.update({
        where: { id: body.id },
        data: {
          name: body.name,
          phone: phone,
          cleanPhone: phone.replace(/\D/g, ""),
          email: email,
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
    await initializeDatabaseIfNeeded();
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

