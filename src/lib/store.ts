import { CertificateRecord } from "./types";
import { cleanPhoneNumber } from "./drive";

export const INITIAL_CERTIFICATES: CertificateRecord[] = [
  {
    id: "cert_1",
    certificateId: "CERT-2026-8941",
    name: "Alex Morgan",
    phone: "+19876543210",
    driveUrl: "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view?usp=sharing",
    event: "Full-Stack Web Engineering Masterclass 2026",
    issueDate: "2026-06-15",
    details: "Grade: Distinction (98/100). Completed advanced Next.js & UI/UX Design.",
    downloads: 14,
    createdAt: "2026-06-15T10:00:00.000Z",
  },
  {
    id: "cert_2",
    certificateId: "CERT-2026-9022",
    name: "Sophia Chen",
    phone: "+15550192834",
    driveUrl: "https://drive.google.com/file/d/1v8T-vWp3mH9zZ1Xn3lXn3lXn3lXn3lXn/view",
    event: "AI & Machine Learning Innovation Hackathon",
    issueDate: "2026-07-01",
    details: "1st Place Winner - Best Agentic AI Solution",
    downloads: 28,
    createdAt: "2026-07-01T14:30:00.000Z",
  },
  {
    id: "cert_3",
    certificateId: "CERT-2026-7731",
    name: "Rahul Sharma",
    phone: "+919876543210",
    driveUrl: "https://drive.google.com/file/d/1u2v3w4x5y6z7a8b9c0d1e2f3g4h5i6j/view",
    event: "Global Cloud Architecture Summit 2026",
    issueDate: "2026-05-20",
    details: "Certified Cloud Solutions Specialist",
    downloads: 8,
    createdAt: "2026-05-20T09:15:00.000Z",
  },
  {
    id: "cert_4",
    certificateId: "CERT-2026-5120",
    name: "Emily Watson",
    phone: "+12125550199",
    driveUrl: "https://drive.google.com/file/d/1xYz90123456789abcdefghijklmn/view",
    event: "UX/UI Design & Micro-Interactions Workshop",
    issueDate: "2026-07-10",
    details: "Completed 40 Hours of UI Animation & Systems Design",
    downloads: 5,
    createdAt: "2026-07-10T11:00:00.000Z",
  },
  {
    id: "cert_5",
    certificateId: "CERT-2026-3409",
    name: "David Miller",
    phone: "+14155550148",
    driveUrl: "https://drive.google.com/file/d/19876543210abcdefghijklmnop/view",
    event: "Cyber Security & Systems Integrity Bootcamp",
    issueDate: "2026-04-12",
    details: "Passed Practical Penetration Testing & Defense Exam",
    downloads: 19,
    createdAt: "2026-04-12T16:00:00.000Z",
  }
];

const LOCAL_STORAGE_KEY = "certipulse_certificates_v1";
const LOOKUPS_KEY = "certipulse_total_lookups_v1";

export function getStoredCertificates(): CertificateRecord[] {
  if (typeof window === "undefined") return INITIAL_CERTIFICATES;
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!data) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_CERTIFICATES));
      return INITIAL_CERTIFICATES;
    }
    return JSON.parse(data);
  } catch {
    return INITIAL_CERTIFICATES;
  }
}

export function saveStoredCertificates(certs: CertificateRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(certs));
  } catch (e) {
    console.error("Failed to save certificates to localStorage", e);
  }
}

export async function fetchCertificatesFromApi(): Promise<{ certificates: CertificateRecord[]; totalLookups: number }> {
  try {
    const res = await fetch("/api/certificates");
    if (!res.ok) throw new Error("API failed");
    const json = await res.json();
    if (json.success && Array.isArray(json.certificates)) {
      saveStoredCertificates(json.certificates);
      return { certificates: json.certificates, totalLookups: json.totalLookups || 142 };
    }
  } catch (e) {
    console.warn("Falling back to local storage", e);
  }
  return { certificates: getStoredCertificates(), totalLookups: getLookupCount() };
}

export async function findCertificateByPhoneApi(phoneQuery: string): Promise<CertificateRecord | null> {
  if (!phoneQuery) return null;

  try {
    const res = await fetch(`/api/certificates?phone=${encodeURIComponent(phoneQuery)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.certificate) {
        return json.certificate;
      }
    }
  } catch {
    // Fallback to local storage
  }

  const currentList = getStoredCertificates();
  return findCertificateByPhone(phoneQuery, currentList);
}

export function findCertificateByPhone(phoneQuery: string, records: CertificateRecord[]): CertificateRecord | null {
  if (!phoneQuery) return null;
  const targetClean = cleanPhoneNumber(phoneQuery);
  if (!targetClean) return null;

  return records.find((rec) => {
    const recClean = cleanPhoneNumber(rec.phone);
    return recClean.includes(targetClean) || targetClean.includes(recClean);
  }) || null;
}

export async function incrementCertificateDownloadApi(id: string): Promise<CertificateRecord[]> {
  try {
    await fetch("/api/certificates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "incrementDownload", id }),
    });
  } catch {
    // Silent catch
  }

  return incrementCertificateDownload(id);
}

export function incrementCertificateDownload(id: string): CertificateRecord[] {
  const list = getStoredCertificates();
  const updated = list.map((item) => {
    if (item.id === id) {
      return { ...item, downloads: (item.downloads || 0) + 1 };
    }
    return item;
  });
  saveStoredCertificates(updated);
  return updated;
}

export function recordLookupEvent(): number {
  if (typeof window === "undefined") return 142;
  try {
    const val = parseInt(localStorage.getItem(LOOKUPS_KEY) || "142", 10);
    const nextVal = val + 1;
    localStorage.setItem(LOOKUPS_KEY, nextVal.toString());
    return nextVal;
  } catch {
    return 143;
  }
}

export function getLookupCount(): number {
  if (typeof window === "undefined") return 142;
  try {
    return parseInt(localStorage.getItem(LOOKUPS_KEY) || "142", 10);
  } catch {
    return 142;
  }
}
