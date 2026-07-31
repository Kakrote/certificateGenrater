import * as XLSX from "xlsx";
import { CertificateRecord } from "./types";

// Helper function for fuzzy, case-insensitive, space-insensitive key matching
function getColumnValue(row: Record<string, any>, targetAliases: string[]): string {
  const normalizedMap: Record<string, any> = {};

  for (const key of Object.keys(row)) {
    if (key && row[key] !== undefined && row[key] !== null) {
      const cleanKey = String(key).trim().toLowerCase().replace(/[^a-z0-9]/g, "");
      normalizedMap[cleanKey] = row[key];
    }
  }

  for (const alias of targetAliases) {
    const cleanAlias = alias.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    if (normalizedMap[cleanAlias] !== undefined && normalizedMap[cleanAlias] !== null && String(normalizedMap[cleanAlias]).trim() !== "") {
      return String(normalizedMap[cleanAlias]).trim();
    }
  }

  return "";
}

export function parseExcelOrCsvFile(file: File): Promise<CertificateRecord[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const data = new Uint8Array(buffer);
        const workbook = XLSX.read(data, { type: "array", cellDates: true, cellText: false });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          reject(new Error("The uploaded Excel file contains no worksheets."));
          return;
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // 1. Read row objects from worksheet
        const rawObjRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: "" });

        const nameAliases = [
          "fullname", "name", "recipientname", "studentname", "participantname",
          "username", "personname", "clientname", "candidate", "candidatename", "user", "student"
        ];

        const phoneAliases = [
          "phonenumber", "phone", "mobilenumber", "mobile", "contactnumber",
          "contact", "phoneno", "mobileno", "cell", "telephone", "phone#", "mobile#", "number"
        ];

        const emailAliases = [
          "emailaddress", "email", "mail", "e-mail", "emailid", "useremail", "studentemail", "contactemail"
        ];

        const driveAliases = [
          "certificatedrivelink", "drivelink", "driveurl", "url", "link",
          "certificatelink", "drive", "googledrivelink", "fileurl", "filelink", "drivefile",
          "uuassets", "uuassetslink", "uuassetsurl", "uuasset", "certificatelocation", "asseturl"
        ];

        const eventAliases = [
          "eventname", "coursename", "event", "course", "program", "workshop", "title", "batch", "topic"
        ];

        const dateAliases = ["issuedate", "date", "dateofissue", "issued"];
        const detailsAliases = ["details", "grade", "description", "remarks", "note", "score", "grade/status"];

        const parsedRecords: CertificateRecord[] = [];

        for (let index = 0; index < rawObjRows.length; index++) {
          const row = rawObjRows[index];
          const allRowValues = Object.values(row).map((v) => String(v).trim()).filter(Boolean);

          // Skip completely blank rows
          if (allRowValues.length === 0) continue;

          let name = getColumnValue(row, nameAliases);
          let phone = getColumnValue(row, phoneAliases);
          let email = getColumnValue(row, emailAliases);
          let driveUrl = getColumnValue(row, driveAliases);
          let event = getColumnValue(row, eventAliases);
          let issueDate = getColumnValue(row, dateAliases);
          let details = getColumnValue(row, detailsAliases);

          // Smart auto-discovery for missing fields:
          // 1. If email was not matched by key, search for @ in row values
          if (!email) {
            const emailValue = allRowValues.find((val) => val.includes("@") && !val.toLowerCase().includes("http"));
            if (emailValue) email = emailValue;
          }

          // If email is still missing, attempt regex extraction from details
          if (!email && details) {
            const match = details.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
            if (match) email = match[0];
          }

          // 2. If phone was not matched by key, search all row values for digit sequence (>= 7 digits)
          if (!phone) {
            const digitValue = allRowValues.find((val) => {
              const digitsOnly = val.replace(/\D/g, "");
              return digitsOnly.length >= 7 && digitsOnly.length <= 15;
            });
            if (digitValue) phone = digitValue;
          }

          // 3. If driveUrl was not matched by key, search all row values for 'http', 'drive', or 'uuassets'
          if (!driveUrl) {
            const urlValue = allRowValues.find((val) => 
              val.toLowerCase().includes("http") || 
              val.toLowerCase().includes("drive") || 
              val.toLowerCase().includes("uuassets")
            );
            if (urlValue) driveUrl = urlValue;
          }

          // 4. If name was not matched by key, pick first non-URL, non-numeric text value
          if (!name) {
            const textValue = allRowValues.find((val) => {
              const clean = val.replace(/\D/g, "");
              return !val.toLowerCase().includes("http") && !val.includes("@") && clean.length < 7 && val.length >= 2;
            });
            if (textValue) name = textValue;
          }

          // Fallbacks for valid entry
          if (!name) name = `Participant ${index + 1}`;
          if (!phone && !email) phone = `+19876543${100 + index}`;

          const randomSuffix = Math.floor(1000 + Math.random() * 9000);

          parsedRecords.push({
            id: `cert_upload_${Date.now()}_${index}`,
            certificateId: `CERT-2026-${randomSuffix}`,
            name: name.trim(),
            phone: phone ? phone.trim() : "",
            email: email ? email.trim().toLowerCase() : undefined,
            driveUrl: driveUrl.trim() || "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view",
            event: event.trim() || "Certificate of Excellence",
            issueDate: issueDate.trim() || new Date().toISOString().split("T")[0],
            details: details.trim() || "Successfully completed program requirements.",
            downloads: 0,
            createdAt: new Date().toISOString(),
          });
        }

        if (parsedRecords.length > 0) {
          resolve(parsedRecords);
          return;
        }

        // 2. Ultimate Fallback: Parse as 2D array
        const raw2D = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: "" });
        const valid2DRows = raw2D.filter((r) => Array.isArray(r) && r.some((c) => String(c).trim() !== ""));

        const fallbackRecords: CertificateRecord[] = [];
        for (let i = 0; i < valid2DRows.length; i++) {
          const row = valid2DRows[i];
          const c0 = String(row[0] || "").trim();
          const c1 = String(row[1] || "").trim();
          const c2 = String(row[2] || "").trim();
          const c3 = String(row[3] || "").trim();

          // Skip if header row
          if (i === 0 && (c0.toLowerCase().includes("name") || c1.toLowerCase().includes("phone") || c1.toLowerCase().includes("email"))) continue;

          if (c0 || c1) {
            const isC1Email = c1.includes("@");
            fallbackRecords.push({
              id: `cert_upload_2d_${Date.now()}_${i}`,
              certificateId: `CERT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
              name: c0 || `Participant ${i}`,
              phone: !isC1Email ? (c1 || `+19876543${100 + i}`) : "",
              email: isC1Email ? c1.toLowerCase() : undefined,
              driveUrl: c2 || "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view",
              event: c3 || "Certificate of Excellence",
              issueDate: new Date().toISOString().split("T")[0],
              details: "Program completion",
              downloads: 0,
              createdAt: new Date().toISOString(),
            });
          }
        }

        if (fallbackRecords.length === 0) {
          reject(new Error("No readable data rows could be extracted from this file."));
          return;
        }

        resolve(fallbackRecords);
      } catch (err: any) {
        reject(new Error(`Excel Parsing Error: ${err?.message || String(err)}`));
      }
    };

    reader.onerror = (error) => reject(new Error("FileReader failed to read the file."));
    reader.readAsArrayBuffer(file);
  });
}

export function generateSampleExcelFile(): void {
  const sampleData = [
    {
      "Full Name": "Johnathan Doe",
      "Phone Number": "+19876543210",
      "Email Address": "johnathan.doe@example.com",
      "Certificate Drive Link": "/uuassets/certificate_john_doe.jpg",
      "Event Name": "Next.js Full-Stack Masterclass 2026",
      "Issue Date": "2026-07-20",
      "Details": "Grade A+ (Distinction in React 19 & Server Actions)",
    },
    {
      "Full Name": "Sarah Jenkins",
      "Phone Number": "",
      "Email Address": "sarah.jenkins@example.com",
      "Certificate Drive Link": "https://drive.google.com/file/d/1v8T-vWp3mH9zZ1Xn3lXn3lXn3lXn3lXn/view",
      "Event Name": "AI Systems & Microservices Hackathon",
      "Issue Date": "2026-07-15",
      "Details": "Best Backend Architecture Award",
    },
    {
      "Full Name": "Aarav Patel",
      "Phone Number": "+919876543210",
      "Email Address": "aarav.patel@example.com",
      "Certificate Drive Link": "/uuassets/certificate_aarav_patel.pdf",
      "Event Name": "Global Cloud & DevOps Conference",
      "Issue Date": "2026-06-30",
      "Details": "Certified Cloud Solutions Architect",
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Certificates");

  // Auto-width columns
  const maxWidths = [20, 18, 25, 50, 35, 15, 40];
  worksheet["!cols"] = maxWidths.map((w) => ({ wch: w }));

  XLSX.writeFile(workbook, "Sample_Certificate_Distribution_Template.xlsx");
}

export function exportCertificatesToExcel(records: CertificateRecord[]): void {
  const exportData = records.map((r) => ({
    "Certificate ID": r.certificateId,
    "Full Name": r.name,
    "Phone Number": r.phone || "",
    "Email Address": r.email || "",
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

export function generateExcelFromUuassets(uuassetFiles: { filename: string; url: string }[]): void {
  const sampleData = uuassetFiles.map((file, idx) => {
    // Clean filename for initial name guess
    const nameWithoutExt = file.filename.replace(/\.[^/.]+$/, "");
    const cleanName = nameWithoutExt.replace(/[-_]/g, " ").replace(/\d+/g, "").trim();
    const digits = nameWithoutExt.replace(/\D/g, "");

    return {
      "Full Name": cleanName || `Participant ${idx + 1}`,
      "Phone Number": digits.length >= 7 ? digits : "",
      "Email Address": "",
      "Certificate Drive Link": file.url,
      "Event Name": "General Certificate of Achievement",
      "Issue Date": new Date().toISOString().split("T")[0],
      "Details": "Bulk Uploaded Certificate Asset",
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Bulk uuassets Links");

  const maxWidths = [25, 18, 25, 45, 35, 15, 30];
  worksheet["!cols"] = maxWidths.map((w) => ({ wch: w }));

  XLSX.writeFile(workbook, `Bulk_uuassets_Certificates_Template_${new Date().toISOString().split("T")[0]}.xlsx`);
}
