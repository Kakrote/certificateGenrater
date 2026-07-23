export function extractDriveFileId(url: string): string | null {
  if (!url) return null;
  
  // Match /d/FILE_ID/
  const dMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (dMatch && dMatch[1]) {
    return dMatch[1];
  }

  // Match ?id=FILE_ID or &id=FILE_ID
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    return idMatch[1];
  }

  return null;
}

export function getDriveUrls(url: string) {
  const fileId = extractDriveFileId(url);
  
  if (fileId) {
    return {
      isDrive: true,
      fileId,
      previewUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      downloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
      directViewUrl: `https://drive.google.com/file/d/${fileId}/view?usp=sharing`,
    };
  }

  // Non-drive URL (direct image, PDF, or custom link)
  return {
    isDrive: false,
    fileId: null,
    previewUrl: url,
    downloadUrl: url,
    directViewUrl: url,
  };
}

export function cleanPhoneNumber(phone: string): string {
  if (!phone) return "";
  // Strip non-digit characters except leading + if needed
  return phone.replace(/[^\d+]/g, "").replace(/^0+/, "");
}

export function formatPhoneNumberDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  return phone;
}
