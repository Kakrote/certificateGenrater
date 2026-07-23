import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cleanPhoneNumber } from "@/lib/drive";
import { INITIAL_CERTIFICATES } from "@/lib/store";
import { CertificateRecord } from "@/lib/types";

// Seed initial certificates if DB is empty
async function ensureSeedData() {
  const count = await db.certificate.count();
  if (count === 0) {
    for (const cert of INITIAL_CERTIFICATES) {
      await db.certificate.create({
        data: {
          id: cert.id,
          certificateId: cert.certificateId,
          name: cert.name,
          phone: cert.phone,
          cleanPhone: cleanPhoneNumber(cert.phone),
          driveUrl: cert.driveUrl,
          event: cert.event,
          issueDate: cert.issueDate,
          details: cert.details || "",
          downloads: cert.downloads || 0,
        },
      });
    }
  }
}

export async function GET(request: Request) {
  try {
    await ensureSeedData();
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");

    if (phone) {
      const cleanTarget = cleanPhoneNumber(phone);
      if (!cleanTarget) {
        return NextResponse.json({ success: false, message: "Invalid phone query" }, { status: 400 });
      }

      // Record lookup query count in SystemStat
      await db.systemStat.upsert({
        where: { key: "lookupCount" },
        update: { value: { increment: 1 } },
        create: { key: "lookupCount", value: 143 },
      });

      // Search in SQLite DB using clean phone or raw phone
      const certificates = await db.certificate.findMany({
        where: {
          OR: [
            { cleanPhone: { contains: cleanTarget } },
            { phone: { contains: cleanTarget } },
          ],
        },
      });

      if (certificates.length > 0) {
        return NextResponse.json({ success: true, certificate: certificates[0] });
      }

      return NextResponse.json(
        { success: false, message: "No certificate found for this phone number." },
        { status: 404 }
      );
    }

    // Fetch all certificates
    const allCerts = await db.certificate.findMany({
      orderBy: { createdAt: "desc" },
    });

    const lookupStat = await db.systemStat.findUnique({ where: { key: "lookupCount" } });

    return NextResponse.json({
      success: true,
      certificates: allCerts,
      totalLookups: lookupStat?.value || 142,
    });
  } catch (error) {
    console.error("GET /api/certificates error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureSeedData();
    const body = await request.json();

    // Action: Increment download count
    if (body.action === "incrementDownload" && body.id) {
      const updated = await db.certificate.update({
        where: { id: body.id },
        data: { downloads: { increment: 1 } },
      });
      return NextResponse.json({ success: true, certificate: updated });
    }

    // Bulk Add / Excel Upload
    if (Array.isArray(body.certificates)) {
      const createdItems: CertificateRecord[] = [];

      for (const item of body.certificates) {
        const clean = cleanPhoneNumber(item.phone || "");
        const certId = item.certificateId || `CERT-2026-${Math.floor(1000 + Math.random() * 9000)}`;

        const created = await db.certificate.create({
          data: {
            certificateId: certId,
            name: item.name,
            phone: item.phone,
            cleanPhone: clean,
            driveUrl: item.driveUrl || "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view",
            event: item.event || "General Certificate",
            issueDate: item.issueDate || new Date().toISOString().split("T")[0],
            details: item.details || "",
            downloads: 0,
          },
        });
        createdItems.push({
          ...created,
          details: created.details || undefined,
          createdAt: created.createdAt.toISOString(),
        });
      }

      return NextResponse.json({ success: true, count: createdItems.length, certificates: createdItems });
    }

    // Single Certificate Add
    if (body.name && body.phone) {
      const clean = cleanPhoneNumber(body.phone);
      const certId = body.certificateId || `CERT-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      const created = await db.certificate.create({
        data: {
          certificateId: certId,
          name: body.name,
          phone: body.phone,
          cleanPhone: clean,
          driveUrl: body.driveUrl || "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view",
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
    }

    return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/certificates error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });
    }

    const updated = await db.certificate.update({
      where: { id: body.id },
      data: {
        name: body.name,
        phone: body.phone,
        cleanPhone: cleanPhoneNumber(body.phone || ""),
        driveUrl: body.driveUrl,
        event: body.event,
        issueDate: body.issueDate,
        details: body.details || "",
      },
    });

    return NextResponse.json({ success: true, certificate: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      await db.certificate.delete({ where: { id } });
      return NextResponse.json({ success: true, message: "Deleted certificate" });
    }

    return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
