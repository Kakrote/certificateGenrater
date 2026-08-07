import { NextResponse } from "next/server";
import { db, initializeDatabaseIfNeeded } from "@/lib/db";
import testingData from "@/lib/testingData.json";
import { CertificateRecord } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 300;
const shouldUseSampleData = process.env.NODE_ENV !== "production";

function findInDataset(query: string): CertificateRecord | null {
  if (!query || !query.trim()) return null;
  const trimmed = query.trim().toLowerCase();
  const digitsQuery = query.replace(/\D/g, "");
  const dataset = testingData as CertificateRecord[];

  // 1. Exact Certificate ID Search
  let match = dataset.find(
    (rec) => rec && rec.certificateId && rec.certificateId.toLowerCase() === trimmed
  );
  if (match) return match;

  // 2. Exact Phone Search
  if (digitsQuery && digitsQuery.length >= 4) {
    const coreTarget = digitsQuery.length >= 10 ? digitsQuery.slice(-10) : digitsQuery;

    match = dataset.find((rec) => {
      if (!rec) return false;
      const recDigits = (rec.phone || "").replace(/\D/g, "");
      if (!recDigits) return false;
      if (recDigits === digitsQuery) return true;
      if (digitsQuery.length >= 10) {
        const recCore = recDigits.length >= 10 ? recDigits.slice(-10) : recDigits;
        return recCore === coreTarget;
      }
      return false;
    });
    if (match) return match;
  }

  // 3. Exact Email Search
  if (trimmed.includes("@") || trimmed.includes(".")) {
    match = dataset.find((rec) => rec && rec.email && rec.email.toLowerCase() === trimmed);
    if (match) return match;
  }

  // 4. Exact Name Search
  match = dataset.find(
    (rec) => rec && rec.name && rec.name.toLowerCase() === trimmed
  );
  if (match) return match;

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

      try {
        await db.systemStat.upsert({
          where: { key: "lookupCount" },
          update: { value: { increment: 1 } },
          create: { key: "lookupCount", value: 597 },
        });

        const orConditions: any[] = [];

        // Phone search conditions
        if (digitsQuery && digitsQuery.length >= 4) {
          const coreTarget = digitsQuery.length >= 10 ? digitsQuery.slice(-10) : digitsQuery;
          orConditions.push(
            { cleanPhone: { contains: coreTarget } },
            { phone: { contains: coreTarget } },
            { cleanPhone: { contains: digitsQuery } },
            { phone: { contains: digitsQuery } }
          );
        }

        // Email, Name, and Certificate ID conditions
        orConditions.push(
          { email: { contains: cleanQuery } },
          { name: { contains: cleanQuery } },
          { certificateId: { contains: cleanQuery } }
        );

        if (orConditions.length > 0) {
          const certificates = await db.certificate.findMany({
            where: { OR: orConditions },
          });

          if (certificates.length > 0) {
            // Strict matching validation
            const exactCertId = certificates.find(
              (c) => c.certificateId && c.certificateId.toLowerCase() === cleanQuery.toLowerCase()
            );

            let exactPhone: any = null;
            if (digitsQuery && digitsQuery.length >= 4) {
              const coreTarget = digitsQuery.length >= 10 ? digitsQuery.slice(-10) : digitsQuery;
              exactPhone = certificates.find((c) => {
                const cClean = c.cleanPhone || (c.phone || "").replace(/\D/g, "");
                if (cClean === digitsQuery) return true;
                if (digitsQuery.length >= 10) {
                  const cCore = cClean.length >= 10 ? cClean.slice(-10) : cClean;
                  return cCore === coreTarget;
                }
                return false;
              });
            }

            const exactEmail = certificates.find(
              (c) => c.email && c.email.toLowerCase() === cleanQuery.toLowerCase()
            );

            const exactName = certificates.find(
              (c) => c.name && c.name.toLowerCase() === cleanQuery.toLowerCase()
            );

            const bestMatch = exactCertId || exactPhone || exactEmail || exactName || null;

            if (bestMatch) {
              return NextResponse.json({ success: true, certificate: bestMatch });
            }
          }
        }
      } catch (dbErr) {
        console.warn("DB search fallback to JSON:", dbErr);
      }

      if (shouldUseSampleData) {
        // Memory fallback for development only
        const match = findInDataset(cleanQuery);
        if (match) {
          return NextResponse.json({ success: true, certificate: match });
        }
      }

      return NextResponse.json(
        { success: false, message: "No certificate found for your search query." },
        { status: 404 }
      );
    }

    try {
      const allCerts = await db.certificate.findMany({
        orderBy: { createdAt: "desc" },
      });

      const lookupStat = await db.systemStat.findUnique({ where: { key: "lookupCount" } });

      return NextResponse.json({
        success: true,
        certificates: allCerts,
        totalLookups: lookupStat?.value || 597,
      });
    } catch (dbErr) {
      console.warn("DB list fallback to JSON:", dbErr);
    }

    if (shouldUseSampleData) {
      return NextResponse.json({
        success: true,
        certificates: testingData,
        totalLookups: 0,
      });
    }

    return NextResponse.json({
      success: false,
      error: "Failed to load certificates from the database.",
    }, { status: 500 });
  } catch (error) {
    console.error("GET /api/certificates error:", error);
    if (shouldUseSampleData) {
      return NextResponse.json({
        success: true,
        certificates: testingData,
        totalLookups: 0,
      });
    }
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await initializeDatabaseIfNeeded();
    const body = await request.json();

    if (body.action === "deleteCertificates" && Array.isArray(body.ids)) {
      const idsToDelete = Array.from(new Set(body.ids.map((id: string) => String(id).trim()).filter(Boolean)));

      if (idsToDelete.length === 0) {
        return NextResponse.json({ success: false, error: "No certificate IDs were provided." }, { status: 400 });
      }

      try {
        const res = await db.certificate.deleteMany({
          where: {
            OR: [
              { id: { in: idsToDelete } },
              { certificateId: { in: idsToDelete } },
            ],
          },
        });

        if (res.count === 0) {
          return NextResponse.json(
            { success: false, error: "No certificate records were deleted." },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: `Successfully deleted ${res.count} certificate(s).`,
          count: res.count,
          deletedIds: idsToDelete,
        });
      } catch (err) {
        console.error("Bulk delete DB error:", err);
        return NextResponse.json(
          { success: false, error: "Failed to delete certificate records from the database." },
          { status: 500 }
        );
      }
    }

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
    const idsParam = searchParams.get("ids");

    let idsToDelete: string[] = [];

    if (id) idsToDelete.push(id);
    if (idsParam) {
      idsToDelete.push(...idsParam.split(",").map((s) => s.trim()).filter(Boolean));
    }

    try {
      const body = await request.json();
      if (Array.isArray(body?.ids)) {
        idsToDelete.push(...body.ids);
      }
    } catch {
      // Body not provided or not JSON
    }

    idsToDelete = Array.from(new Set(idsToDelete));

    if (idsToDelete.length > 0) {
      const res = await db.certificate.deleteMany({
        where: {
          OR: [
            { id: { in: idsToDelete } },
            { certificateId: { in: idsToDelete } },
          ],
        },
      });

      if (res.count === 0) {
        return NextResponse.json(
          { success: false, error: "No certificate records were deleted." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Successfully deleted ${res.count} certificate(s).`,
        count: res.count,
        deletedIds: idsToDelete,
      });
    }

    return NextResponse.json({ success: false, error: "Missing id or ids parameter." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

