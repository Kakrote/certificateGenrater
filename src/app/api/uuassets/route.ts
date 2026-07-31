import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const UUASSETS_DIR = path.join(process.cwd(), "public", "uuassets");

// Helper to ensure base public/uuassets directory exists
async function ensureUuassetsDir(subfolder?: string) {
  try {
    await fs.mkdir(UUASSETS_DIR, { recursive: true });
    if (subfolder && subfolder.trim()) {
      const cleanSub = sanitizeName(subfolder);
      const targetDir = path.join(UUASSETS_DIR, cleanSub);
      await fs.mkdir(targetDir, { recursive: true });
      return targetDir;
    }
  } catch {
    // Directory already exists or created
  }
  return UUASSETS_DIR;
}

// Sanitize folder and file names to prevent path traversal
function sanitizeName(name: string): string {
  return name
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_");
}

// Helper to safely get stats and details for a file
async function getFileDetails(filePath: string, folderRelative: string, filename: string, origin: string) {
  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) return null;

    const ext = path.extname(filename).toLowerCase();
    const isImage = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"].includes(ext);
    const isPdf = ext === ".pdf";

    const relativeUrlPath = folderRelative ? `/uuassets/${folderRelative}/${filename}` : `/uuassets/${filename}`;

    return {
      filename,
      folder: folderRelative || "root",
      url: relativeUrlPath,
      fullUrl: `${origin}${relativeUrlPath}`,
      size: stat.size,
      uploadedAt: stat.mtime.toISOString(),
      isImage,
      isPdf,
    };
  } catch {
    return null;
  }
}

// GET /api/uuassets - List all folders and certificate files in public/uuassets
export async function GET(request: Request) {
  try {
    await ensureUuassetsDir();
    const origin = new URL(request.url).origin;
    const { searchParams } = new URL(request.url);
    const requestedFolder = searchParams.get("folder");

    const entries = await fs.readdir(UUASSETS_DIR, { withFileTypes: true });

    const folders: { name: string; count: number }[] = [];
    const files: any[] = [];

    // Process root directory items
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;

      if (entry.isDirectory()) {
        const folderName = entry.name;
        const subDirPath = path.join(UUASSETS_DIR, folderName);
        try {
          const subEntries = await fs.readdir(subDirPath);
          const subFiles = subEntries.filter((f) => !f.startsWith("."));
          folders.push({ name: folderName, count: subFiles.length });

          // If requested folder matches or 'all' requested, list these files
          if (!requestedFolder || requestedFolder === "all" || requestedFolder === folderName) {
            for (const subFile of subFiles) {
              const fileDetail = await getFileDetails(path.join(subDirPath, subFile), folderName, subFile, origin);
              if (fileDetail) files.push(fileDetail);
            }
          }
        } catch {
          // Ignore unreadable directory
        }
      } else if (entry.isFile()) {
        // Root file
        if (!requestedFolder || requestedFolder === "all" || requestedFolder === "root") {
          const fileDetail = await getFileDetails(path.join(UUASSETS_DIR, entry.name), "", entry.name, origin);
          if (fileDetail) files.push(fileDetail);
        }
      }
    }

    const sortedFiles = files.sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );

    return NextResponse.json({
      success: true,
      folders,
      count: sortedFiles.length,
      files: sortedFiles,
    });
  } catch (error: any) {
    console.error("GET /api/uuassets error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to list uuassets files" },
      { status: 500 }
    );
  }
}

// POST /api/uuassets - Handle folder creation or certificate file uploads
export async function POST(request: Request) {
  try {
    const origin = new URL(request.url).origin;
    const contentType = request.headers.get("content-type") || "";

    // Handle JSON body for creating a new event folder
    if (contentType.includes("application/json")) {
      const body = await request.json();
      if (body.action === "createFolder" && body.folderName) {
        const cleanFolder = sanitizeName(body.folderName);
        if (!cleanFolder) {
          return NextResponse.json({ success: false, error: "Invalid folder name" }, { status: 400 });
        }

        const targetDir = path.join(UUASSETS_DIR, cleanFolder);
        await fs.mkdir(targetDir, { recursive: true });

        return NextResponse.json({
          success: true,
          message: `Created event folder '${cleanFolder}' in uuassets repository.`,
          folder: cleanFolder,
        });
      }
    }

    // Handle FormData for file upload into a folder
    const formData = await request.formData();
    const folderInput = (formData.get("folder") as string) || "";
    const cleanFolder = folderInput && folderInput !== "root" ? sanitizeName(folderInput) : "";

    const targetDir = await ensureUuassetsDir(cleanFolder);

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

      let cleanFileName = sanitizeName(nameWithoutExt);
      if (!cleanFileName) cleanFileName = "certificate";

      let finalFilename = `${cleanFileName}${ext}`;
      let targetFilePath = path.join(targetDir, finalFilename);

      // Avoid overwriting existing files by appending timestamp
      try {
        await fs.access(targetFilePath);
        finalFilename = `${cleanFileName}_${Date.now()}${ext}`;
        targetFilePath = path.join(targetDir, finalFilename);
      } catch {
        // Safe to write
      }

      await fs.writeFile(targetFilePath, buffer);

      const fileDetail = await getFileDetails(targetFilePath, cleanFolder, finalFilename, origin);
      if (fileDetail) uploadedFiles.push(fileDetail);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${uploadedFiles.length} file(s) to uuassets${cleanFolder ? `/${cleanFolder}` : ""}.`,
      folder: cleanFolder || "root",
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

// DELETE /api/uuassets - Delete a file or an entire event folder
export async function DELETE(request: Request) {
  try {
    await ensureUuassetsDir();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const filename = searchParams.get("filename");
    const folder = searchParams.get("folder");

    // Action: Delete entire subfolder
    if (action === "deleteFolder" && folder) {
      const cleanFolder = sanitizeName(folder);
      if (!cleanFolder || cleanFolder === "root") {
        return NextResponse.json({ success: false, error: "Cannot delete root folder" }, { status: 400 });
      }

      const folderPath = path.join(UUASSETS_DIR, cleanFolder);
      try {
        await fs.rm(folderPath, { recursive: true, force: true });
        return NextResponse.json({
          success: true,
          message: `Successfully deleted folder '${cleanFolder}' and all its contents.`,
        });
      } catch {
        return NextResponse.json({ success: false, error: `Folder '${cleanFolder}' not found.` }, { status: 404 });
      }
    }

    // Action: Delete individual file
    if (filename) {
      const cleanFolder = folder && folder !== "root" ? sanitizeName(folder) : "";
      const safeFilename = path.basename(filename);
      const filePath = cleanFolder
        ? path.join(UUASSETS_DIR, cleanFolder, safeFilename)
        : path.join(UUASSETS_DIR, safeFilename);

      try {
        await fs.unlink(filePath);
        return NextResponse.json({
          success: true,
          message: `File '${safeFilename}' deleted successfully.`,
        });
      } catch {
        return NextResponse.json(
          { success: false, error: `File '${safeFilename}' not found.` },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({ success: false, error: "Missing filename or folder parameter." }, { status: 400 });
  } catch (error: any) {
    console.error("DELETE /api/uuassets error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete item." },
      { status: 500 }
    );
  }
}
