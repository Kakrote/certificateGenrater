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
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_CERTIFICATES;
  } catch {
    return INITIAL_CERTIFICATES;
  }
}

export function saveStoredCertificates(certs: CertificateRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    if (Array.isArray(certs) && certs.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(certs));
    }
  } catch (e) {
    console.error("Failed to save certificates to localStorage", e);
  }
}

export async function fetchCertificatesFromApi(): Promise<{ certificates: CertificateRecord[]; totalLookups: number }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch("/api/certificates", { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.certificates) && json.certificates.length > 0) {
        saveStoredCertificates(json.certificates);
        return { certificates: json.certificates, totalLookups: json.totalLookups || 597 };
      }
    }
  } catch (e) {
    console.warn("API fetch timeout or error, using local dataset", e);
  }
  return { certificates: getStoredCertificates(), totalLookups: getLookupCount() };
}

export async function findCertificateByPhoneApi(phoneQuery: string): Promise<CertificateRecord | null> {
  if (!phoneQuery) return null;

  // 1. Try local instant search first for 0ms response time
  const localList = getStoredCertificates();
  const instantMatch = findCertificateByPhone(phoneQuery, localList) || findCertificateByPhone(phoneQuery, INITIAL_CERTIFICATES);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`/api/certificates?phone=${encodeURIComponent(phoneQuery)}`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.certificate) {
        return json.certificate;
      }
    }
  } catch {
    // Silent catch, fallback to instantMatch
  }

  return instantMatch;
}

export function findCertificateByPhone(phoneQuery: string, records: CertificateRecord[]): CertificateRecord | null {
  if (!phoneQuery || !Array.isArray(records)) return null;
  const digitsQuery = phoneQuery.replace(/\D/g, "");
  if (!digitsQuery) return null;

  // Extract core subscriber digits (last 10 digits)
  const coreTarget = digitsQuery.length >= 10 ? digitsQuery.slice(-10) : digitsQuery;

  // Search provided records list
  const match = records.find((rec) => {
    const recDigits = (rec.phone || "").replace(/\D/g, "");
    if (!recDigits) return false;
    const recCore = recDigits.length >= 10 ? recDigits.slice(-10) : recDigits;

    return (
      recDigits.includes(coreTarget) ||
      recCore.includes(coreTarget) ||
      coreTarget.includes(recCore) ||
      recDigits.includes(digitsQuery) ||
      digitsQuery.includes(recDigits)
    );
  });

  if (match) return match;

  // Fallback search in embedded INITIAL_CERTIFICATES if provided list yielded no match
  if (records !== INITIAL_CERTIFICATES) {
    return INITIAL_CERTIFICATES.find((rec) => {
      const recDigits = (rec.phone || "").replace(/\D/g, "");
      if (!recDigits) return false;
      const recCore = recDigits.length >= 10 ? recDigits.slice(-10) : recDigits;

      return (
        recDigits.includes(coreTarget) ||
        recCore.includes(coreTarget) ||
        coreTarget.includes(recCore) ||
        recDigits.includes(digitsQuery) ||
        digitsQuery.includes(recDigits)
      );
    }) || null;
  }

  return null;
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
