import { CertificateRecord } from "./types";
import { cleanPhoneNumber } from "./drive";
import testingData from "./testingData.json";

const shouldUseSampleData = process.env.NODE_ENV !== "production";

export const INITIAL_CERTIFICATES: CertificateRecord[] = shouldUseSampleData ? (testingData as CertificateRecord[]) : [];

const LOCAL_STORAGE_KEY = "certipulse_certificates_v3";
const LOOKUPS_KEY = "certipulse_total_lookups_v1";

export function getStoredCertificates(): CertificateRecord[] {
  if (typeof window === "undefined") return INITIAL_CERTIFICATES;
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (data === null) {
      if (!shouldUseSampleData) return [];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_CERTIFICATES));
      return INITIAL_CERTIFICATES;
    }
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : (shouldUseSampleData ? INITIAL_CERTIFICATES : []);
  } catch {
    return shouldUseSampleData ? INITIAL_CERTIFICATES : [];
  }
}

export function saveStoredCertificates(certs: CertificateRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    if (Array.isArray(certs)) {
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
      if (json.success && Array.isArray(json.certificates)) {
        saveStoredCertificates(json.certificates);
        return { certificates: json.certificates, totalLookups: json.totalLookups || 597 };
      }
    }
  } catch (e) {
    console.warn("API fetch timeout or error, using local dataset", e);
  }
  if (shouldUseSampleData) {
    return { certificates: getStoredCertificates(), totalLookups: getLookupCount() };
  }
  return { certificates: [], totalLookups: 0 };
}

export async function findCertificateByQueryApi(query: string): Promise<CertificateRecord | null> {
  if (!query || !query.trim()) return null;
  const cleanQuery = query.trim();

  // 1. Try local instant search first for 0ms response time in development only
  const localList = shouldUseSampleData ? getStoredCertificates() : [];
  const instantMatch = shouldUseSampleData
    ? (findCertificateByQuery(cleanQuery, localList) || findCertificateByQuery(cleanQuery, INITIAL_CERTIFICATES))
    : null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`/api/certificates?query=${encodeURIComponent(cleanQuery)}`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.certificate) {
        return json.certificate;
      }
    }
  } catch {
    // Silent catch, fallback only in development
  }

  return instantMatch;
}

export async function findCertificateByPhoneApi(phoneQuery: string): Promise<CertificateRecord | null> {
  return findCertificateByQueryApi(phoneQuery);
}

export function findCertificateByQuery(query: string, records: CertificateRecord[]): CertificateRecord | null {
  if (!query || !query.trim() || !Array.isArray(records)) return null;
  const trimmed = query.trim().toLowerCase();
  const digitsQuery = query.replace(/\D/g, "");

  const searchInList = (list: CertificateRecord[]): CertificateRecord | null => {
    // 1. Phone Search (If query contains digits)
    if (digitsQuery && digitsQuery.length >= 4) {
      const coreTarget = digitsQuery.length >= 10 ? digitsQuery.slice(-10) : digitsQuery;

      // Priority 1: Exact subscriber 10-digit match
      let phoneMatch = list.find((rec) => {
        if (!rec) return false;
        const recDigits = (rec.phone || "").replace(/\D/g, "");
        if (!recDigits) return false;
        const recCore = recDigits.length >= 10 ? recDigits.slice(-10) : recDigits;
        return recCore === coreTarget;
      });
      if (phoneMatch) return phoneMatch;

      // Priority 2: Substring / contains match for valid query lengths
      phoneMatch = list.find((rec) => {
        if (!rec) return false;
        const recDigits = (rec.phone || "").replace(/\D/g, "");
        if (!recDigits) return false;
        const recCore = recDigits.length >= 10 ? recDigits.slice(-10) : recDigits;

        return (
          recDigits.endsWith(coreTarget) ||
          digitsQuery.endsWith(recCore) ||
          recDigits.includes(digitsQuery) ||
          (digitsQuery.length >= 6 && recDigits.includes(coreTarget))
        );
      });
      if (phoneMatch) return phoneMatch;
    }

    // 2. Email Search
    if (trimmed.includes("@") || trimmed.includes(".")) {
      let emailMatch = list.find((rec) => rec && rec.email && rec.email.toLowerCase() === trimmed);
      if (emailMatch) return emailMatch;

      emailMatch = list.find((rec) => {
        if (!rec) return false;
        if (rec.email && rec.email.toLowerCase().includes(trimmed)) return true;
        if (rec.details && rec.details.toLowerCase().includes(trimmed)) return true;
        return false;
      });
      if (emailMatch) return emailMatch;
    }

    // 3. Certificate ID or Name Search
    let textMatch = list.find(
      (rec) =>
        Boolean(rec) &&
        ((rec.certificateId && rec.certificateId.toLowerCase() === trimmed) ||
         (rec.name && rec.name.toLowerCase() === trimmed))
    );
    if (textMatch) return textMatch;

    textMatch = list.find(
      (rec) =>
        Boolean(rec) &&
        ((rec.certificateId && rec.certificateId.toLowerCase().includes(trimmed)) ||
         (rec.name && rec.name.toLowerCase().includes(trimmed)) ||
         (rec.details && rec.details.toLowerCase().includes(trimmed)))
    );
    if (textMatch) return textMatch;

    return null;
  };

  const primaryMatch = searchInList(records);
  if (primaryMatch) return primaryMatch;

  if (records !== INITIAL_CERTIFICATES) {
    return searchInList(INITIAL_CERTIFICATES);
  }

  return null;
}

export function findCertificateByPhone(phoneQuery: string, records: CertificateRecord[]): CertificateRecord | null {
  return findCertificateByQuery(phoneQuery, records);
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
  if (typeof window === "undefined") return 0;
  try {
    const val = parseInt(localStorage.getItem(LOOKUPS_KEY) || "0", 10);
    const nextVal = val + 1;
    localStorage.setItem(LOOKUPS_KEY, nextVal.toString());
    return nextVal;
  } catch {
    return 0;
  }
}

export function getLookupCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    return parseInt(localStorage.getItem(LOOKUPS_KEY) || "0", 10);
  } catch {
    return 0;
  }
}
