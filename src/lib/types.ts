export interface CertificateRecord {
  id: string;
  name: string;
  phone: string;
  driveUrl: string;
  event: string;
  issueDate: string;
  certificateId: string;
  details?: string;
  downloads: number;
  createdAt: string;
}

export interface ExcelUploadRow {
  [key: string]: any;
  name?: string;
  Name?: string;
  "Full Name"?: string;
  phone?: string;
  Phone?: string;
  "Phone Number"?: string;
  "Mobile Number"?: string;
  driveUrl?: string;
  "Drive Link"?: string;
  "Certificate Link"?: string;
  "Certificate Drive Link"?: string;
  "Drive Url"?: string;
  Url?: string;
  event?: string;
  Event?: string;
  "Course Name"?: string;
  "Event Name"?: string;
  issueDate?: string;
  "Issue Date"?: string;
  Date?: string;
  details?: string;
  Details?: string;
  Grade?: string;
  Description?: string;
}

export interface StatsOverview {
  totalCertificates: number;
  totalLookups: number;
  totalDownloads: number;
  recentAdditions: number;
}
