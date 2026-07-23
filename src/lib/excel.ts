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
          // Flexible key matching for Recipient Name
          const name =
            row["Full Name"] ||
            row["Name"] ||
            row["name"] ||
            row["Recipient Name"] ||
            row["Student Name"] ||
            row["Participant Name"] ||
            row["User Name"] ||
            row["Person Name"] ||
            "Unnamed Recipient";

          // Flexible key matching for Phone Number
          const rawPhone =
            row["Phone Number"] ||
            row["Phone"] ||
            row["phone"] ||
            row["Mobile Number"] ||
            row["Mobile"] ||
            row["Contact Number"] ||
            row["Contact"] ||
            row["Phone No"] ||
            row["Mobile No"] ||
            row["Cell"] ||
            "";

          // Flexible key matching for Drive Link
          const driveUrl =
            row["Certificate Drive Link"] ||
            row["Drive Link"] ||
            row["Drive Url"] ||
            row["driveUrl"] ||
            row["Url"] ||
            row["Link"] ||
            row["Certificate Link"] ||
            row["Drive"] ||
            row["Google Drive Link"] ||
            "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view";

          // Flexible key matching for Event Name
          const event =
            row["Event Name"] ||
            row["Course Name"] ||
            row["Event"] ||
            row["event"] ||
            row["Course"] ||
            row["Program"] ||
            row["Workshop"] ||
            row["Title"] ||
            "Certificate of Excellence";

          // Flexible key matching for Issue Date
          const issueDate =
            row["Issue Date"] ||
            row["Date"] ||
            row["issueDate"] ||
            row["Date of Issue"] ||
            new Date().toISOString().split("T")[0];

          // Flexible key matching for Details
          const details =
            row["Details"] ||
            row["details"] ||
            row["Grade"] ||
            row["Description"] ||
            row["Remarks"] ||
            row["Note"] ||
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
          (r) => r.name.length > 0 && r.phone.length > 0 && r.name !== "Unnamed Recipient"
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
