import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const UUASSETS_DIR = path.join(process.cwd(), "public", "uuassets");

// Helper to ensure public/uuassets directory exists
async function ensureUuassetsDir() {
  try {
    await fs.mkdir(UUASSETS_DIR, { recursive: true });
  } catch {
    // Directory already exists or created
  }
}

// GET /api/uuassets - List all uploaded certificate files in public/uuassets
export async function GET(request: Request) {
  try {
    await ensureUuassetsDir();
    const filenames = await fs.readdir(UUASSETS_DIR);
    const origin = new URL(request.url).origin;

    const fileList = await Promise.all(
      filenames
        .filter((fn) => !fn.startsWith(".")) // Ignore hidden files like .DS_Store
        .map(async (filename) => {
          const filePath = path.join(UUASSETS_DIR, filename);
          try {
            const stat = await fs.stat(filePath);
            const ext = path.extname(filename).toLowerCase();
            const isImage = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"].includes(ext);
            const isPdf = ext === ".pdf";

            return {
              filename,
              url: `/uuassets/${filename}`,
              fullUrl: `${origin}/uuassets/${filename}`,
              size: stat.size,
              uploadedAt: stat.mtime.toISOString(),
              isImage,
              isPdf,
            };
          } catch {
            return null;
          }
        })
    );

    const validFiles = fileList
      .filter((f): f is NonNullable<typeof f> => f !== null)
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    return NextResponse.json({
      success: true,
      count: validFiles.length,
      files: validFiles,
    });
  } catch (error: any) {
    console.error("GET /api/uuassets error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to list uuassets files" },
      { status: 500 }
    );
  }
}

// POST /api/uuassets - Handle certificate uploads to public/uuassets
export async function POST(request: Request) {
  try {
    await ensureUuassetsDir();
    const formData = await request.formData();
    const origin = new URL(request.url).origin;

    const files = formData.getAll("files") as File[];
    const singleFile = formData.get("file") as File;
    const fileList = files.length > 0 ? files : singleFile ? [singleFile] : [];

    if (fileList.length === 0) {
      return NextResponse.json(
        { success: false, error: "No certificate files received." },
        { status: 400 }
      );
    }

    const uploadedFiles = [];

    for (const file of fileList) {
      if (!file || typeof file === "string" || !file.name) continue;

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const rawName = file.name;
      const ext = path.extname(rawName).toLowerCase() || ".jpg";
      const nameWithoutExt = path.basename(rawName, path.extname(rawName));
      
      // Clean filename for safe filesystem saving
      let cleanName = nameWithoutExt
        .trim()
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .replace(/_+/g, "_");

      if (!cleanName) cleanName = "certificate";

      let finalFilename = `${cleanName}${ext}`;
      let targetPath = path.join(UUASSETS_DIR, finalFilename);

      // Avoid overwriting existing files by appending timestamp
      try {
        await fs.access(targetPath);
        finalFilename = `${cleanName}_${Date.now()}${ext}`;
        targetPath = path.join(UUASSETS_DIR, finalFilename);
      } catch {
        // File does not exist yet, safe to use
      }

      await fs.writeFile(targetPath, buffer);

      const stat = await fs.stat(targetPath);
      const isImage = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"].includes(ext);
      const isPdf = ext === ".pdf";

      uploadedFiles.push({
        filename: finalFilename,
        originalName: rawName,
        url: `/uuassets/${finalFilename}`,
        fullUrl: `${origin}/uuassets/${finalFilename}`,
        size: stat.size,
        uploadedAt: stat.mtime.toISOString(),
        isImage,
        isPdf,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${uploadedFiles.length} file(s) to uuassets directory.`,
      count: uploadedFiles.length,
      files: uploadedFiles,
    });
  } catch (error: any) {
    console.error("POST /api/uuassets error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to upload certificate files." },
      { status: 500 }
    );
  }
}

// DELETE /api/uuassets?filename=xxx - Delete an uploaded certificate from public/uuassets
export async function DELETE(request: Request) {
  try {
    await ensureUuassetsDir();
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename");

    if (!filename) {
      return NextResponse.json(
        { success: false, error: "Missing filename parameter." },
        { status: 400 }
      );
    }

    // Sanitize filename to prevent directory traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(UUASSETS_DIR, safeFilename);

    try {
      await fs.unlink(filePath);
      return NextResponse.json({
        success: true,
        message: `File ${safeFilename} removed from uuassets repository.`,
      });
    } catch {
      return NextResponse.json(
        { success: false, error: `File ${safeFilename} not found in uuassets.` },
        { status: 404 }
      );
    }
  } catch (error: any) {
    console.error("DELETE /api/uuassets error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete file." },
      { status: 500 }
    );
  }
}
