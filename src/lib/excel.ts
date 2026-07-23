import * as XLSX from "xlsx";
import { CertificateRecord, ExcelUploadRow } from "./types";

export function parseExcelOrCsvFile(file: File): Promise<CertificateRecord[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json<ExcelUploadRow>(worksheet, { defval: "" });

        const records: CertificateRecord[] = rawRows.map((row, index) => {
          const name =
            row["Full Name"] ||
            row["Name"] ||
            row["name"] ||
            row["Recipient Name"] ||
            "Unnamed Recipient";

          const rawPhone =
            row["Phone Number"] ||
            row["Phone"] ||
            row["phone"] ||
            row["Mobile Number"] ||
            "";

          const driveUrl =
            row["Certificate Drive Link"] ||
            row["Drive Link"] ||
            row["Drive Url"] ||
            row["driveUrl"] ||
            row["Url"] ||
            "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view";

          const event =
            row["Event Name"] ||
            row["Course Name"] ||
            row["Event"] ||
            row["event"] ||
            "Certificate of Excellence";

          const issueDate =
            row["Issue Date"] ||
            row["Date"] ||
            row["issueDate"] ||
            new Date().toISOString().split("T")[0];

          const details =
            row["Details"] ||
            row["details"] ||
            row["Grade"] ||
            row["Description"] ||
            "Successfully fulfilled all program requirements.";

          const randomSuffix = Math.floor(1000 + Math.random() * 9000);

          return {
            id: `cert_upload_${Date.now()}_${index}`,
            certificateId: `CERT-2026-${randomSuffix}`,
            name: String(name).trim(),
            phone: String(rawPhone).trim(),
            driveUrl: String(driveUrl).trim(),
            event: String(event).trim(),
            issueDate: String(issueDate).trim(),
            details: String(details).trim(),
            downloads: 0,
            createdAt: new Date().toISOString(),
          };
        });

        // Filter out empty rows without name or phone
        const validRecords = records.filter(
          (r) => r.name.length > 0 && r.phone.length > 0
        );

        resolve(validRecords);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

export function generateSampleExcelFile(): void {
  const sampleData = [
    {
      "Full Name": "Johnathan Doe",
      "Phone Number": "+19876543210",
      "Certificate Drive Link": "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view?usp=sharing",
      "Event Name": "Next.js Full-Stack Masterclass 2026",
      "Issue Date": "2026-07-20",
      "Details": "Grade A+ (Distinction in React 19 & Server Actions)",
    },
    {
      "Full Name": "Sarah Jenkins",
      "Phone Number": "+15550192834",
      "Certificate Drive Link": "https://drive.google.com/file/d/1v8T-vWp3mH9zZ1Xn3lXn3lXn3lXn3lXn/view",
      "Event Name": "AI Systems & Microservices Hackathon",
      "Issue Date": "2026-07-15",
      "Details": "Best Backend Architecture Award",
    },
    {
      "Full Name": "Aarav Patel",
      "Phone Number": "+919876543210",
      "Certificate Drive Link": "https://drive.google.com/file/d/1u2v3w4x5y6z7a8b9c0d1e2f3g4h5i6j/view",
      "Event Name": "Global Cloud & DevOps Conference",
      "Issue Date": "2026-06-30",
      "Details": "Certified Cloud Solutions Architect",
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Certificates");

  // Auto-width columns
  const maxWidths = [20, 18, 50, 35, 15, 40];
  worksheet["!cols"] = maxWidths.map((w) => ({ wch: w }));

  XLSX.writeFile(workbook, "Sample_Certificate_Distribution_Template.xlsx");
}

export function exportCertificatesToExcel(records: CertificateRecord[]): void {
  const exportData = records.map((r) => ({
    "Certificate ID": r.certificateId,
    "Full Name": r.name,
    "Phone Number": r.phone,
    "Certificate Drive Link": r.driveUrl,
    "Event Name": r.event,
    "Issue Date": r.issueDate,
    "Details": r.details || "",
    "Downloads Count": r.downloads,
    "Added On": r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Certificates Export");

  XLSX.writeFile(workbook, `Certificates_Export_${new Date().toISOString().split("T")[0]}.xlsx`);
}
