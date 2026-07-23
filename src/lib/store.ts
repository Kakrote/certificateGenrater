import { CertificateRecord } from "./types";
import { cleanPhoneNumber } from "./drive";
import testingData from "./testingData.json";

export const INITIAL_CERTIFICATES: CertificateRecord[] = testingData as CertificateRecord[];

const LOCAL_STORAGE_KEY = "certipulse_certificates_v2";
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
      return { certificates: json.certificates, totalLookups: json.totalLookups || 597 };
    }
  } catch (e) {
    console.warn("Falling back to stored data", e);
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
    // Fallback
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
  if (typeof window === "undefined") return 597;
  try {
    const val = parseInt(localStorage.getItem(LOOKUPS_KEY) || "597", 10);
    const nextVal = val + 1;
    localStorage.setItem(LOOKUPS_KEY, nextVal.toString());
    return nextVal;
  } catch {
    return 598;
  }
}

export function getLookupCount(): number {
  if (typeof window === "undefined") return 597;
  try {
    return parseInt(localStorage.getItem(LOOKUPS_KEY) || "597", 10);
  } catch {
    return 597;
  }
}
