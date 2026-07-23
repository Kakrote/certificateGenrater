"use client";

import React, { useState, useEffect } from "react";
import { CertificateRecord } from "@/lib/types";
import { fetchCertificatesFromApi, getStoredCertificates, saveStoredCertificates, INITIAL_CERTIFICATES } from "@/lib/store";
import { parseExcelOrCsvFile, generateSampleExcelFile, exportCertificatesToExcel } from "@/lib/excel";
import { useToast } from "./Toast";
import { CertificatePreview } from "./CertificatePreview";
import {
  Upload,
  FileSpreadsheet,
  Plus,
  Download,
  Search,
  Trash2,
  Edit,
  Eye,
  RefreshCw,
  Award,
  Users,
  BarChart3,
  CheckCircle,
  X,
  FileText,
  ExternalLink,
  Lock,
  KeyRound,
  EyeOff,
  LogOut,
  ShieldAlert,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const AdminDashboard: React.FC = () => {
  const { showToast } = useToast();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");

  // Data States
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [totalLookups, setTotalLookups] = useState<number>(142);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<CertificateRecord[] | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCert, setEditingCert] = useState<CertificateRecord | null>(null);
  const [previewCert, setPreviewCert] = useState<CertificateRecord | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    driveUrl: "",
    event: "",
    issueDate: new Date().toISOString().split("T")[0],
    details: "",
  });

  const loadData = async () => {
    const data = await fetchCertificatesFromApi();
    setCertificates(data.certificates);
    setTotalLookups(data.totalLookups);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedAuth = sessionStorage.getItem("certipulse_admin_auth");
      if (storedAuth === "true") {
        setIsAuthenticated(true);
      }
      setAuthChecked(true);
    }
    loadData();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    const validUsername = "admin";
    const validPasswords = ["admin123", "adminpassword", "admin"];

    if (
      usernameInput.trim().toLowerCase() === validUsername &&
      validPasswords.includes(passwordInput.trim())
    ) {
      setIsAuthenticated(true);
      sessionStorage.setItem("certipulse_admin_auth", "true");
      showToast("Access Granted", "Welcome to the Admin Control Panel.", "success");
      setUsernameInput("");
      setPasswordInput("");
    } else {
      setAuthError("Invalid username or password. Please try again.");
      showToast("Access Denied", "Incorrect credentials entered.", "error");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("certipulse_admin_auth");
    showToast("Logged Out", "Admin session ended securely.", "info");
  };

  // Handle Excel Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const records = await parseExcelOrCsvFile(file);
      setIsUploading(false);

      if (records.length === 0) {
        showToast("Invalid File Format", "No valid certificate records found in Excel/CSV file.", "error");
        return;
      }

      setParsedPreview(records);
      showToast("Excel Parsed Successfully!", `${records.length} records ready for preview & import.`, "success");
    } catch {
      setIsUploading(false);
      showToast("Upload Error", "Failed to parse Excel file. Please check column headers.", "error");
    }
  };

  const handleConfirmImport = async () => {
    if (!parsedPreview) return;
    try {
      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certificates: parsedPreview }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("Import Complete!", `Saved ${parsedPreview.length} new certificates to SQLite Database.`, "success");
        setParsedPreview(null);
        await loadData();
        return;
      }
    } catch {
      // Local fallback
    }

    const combined = [...parsedPreview, ...certificates];
    setCertificates(combined);
    saveStoredCertificates(combined);
    showToast("Import Complete!", `Added ${parsedPreview.length} new certificates to registry.`, "success");
    setParsedPreview(null);
  };

  // Add Single Certificate
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      showToast("Validation Error", "Name and Phone Number are required fields.", "error");
      return;
    }

    try {
      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          driveUrl: formData.driveUrl.trim() || "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view",
          event: formData.event.trim() || "General Certificate of Achievement",
          issueDate: formData.issueDate || new Date().toISOString().split("T")[0],
          details: formData.details.trim() || "Successfully completed program requirements.",
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("Certificate Created!", `Saved ${json.certificate.name} to SQLite Database.`, "success");
        setShowAddModal(false);
        setFormData({ name: "", phone: "", driveUrl: "", event: "", issueDate: new Date().toISOString().split("T")[0], details: "" });
        await loadData();
        return;
      }
    } catch {
      // Local fallback
    }

    const newRec: CertificateRecord = {
      id: `cert_manual_${Date.now()}`,
      certificateId: `CERT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      driveUrl: formData.driveUrl.trim() || "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view",
      event: formData.event.trim() || "General Certificate of Achievement",
      issueDate: formData.issueDate || new Date().toISOString().split("T")[0],
      details: formData.details.trim() || "Successfully completed program requirements.",
      downloads: 0,
      createdAt: new Date().toISOString(),
    };

    const updated = [newRec, ...certificates];
    setCertificates(updated);
    saveStoredCertificates(updated);
    showToast("Certificate Created!", `Added record for ${newRec.name}`, "success");
    setShowAddModal(false);
    setFormData({ name: "", phone: "", driveUrl: "", event: "", issueDate: new Date().toISOString().split("T")[0], details: "" });
  };

  // Edit Certificate
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCert) return;

    try {
      const res = await fetch("/api/certificates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCert),
      });
      const json = await res.json();
      if (json.success) {
        showToast("Changes Saved", `Updated SQLite record for ${editingCert.name}`, "success");
        setEditingCert(null);
        await loadData();
        return;
      }
    } catch {
      // Local fallback
    }

    const updatedList = certificates.map((c) =>
      c.id === editingCert.id ? { ...editingCert } : c
    );
    setCertificates(updatedList);
    saveStoredCertificates(updatedList);
    showToast("Changes Saved", `Updated certificate for ${editingCert.name}`, "success");
    setEditingCert(null);
  };

  // Delete Record
  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete certificate for ${name}?`)) {
      try {
        const res = await fetch(`/api/certificates?id=${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        const json = await res.json();
        if (json.success) {
          showToast("Record Deleted", `Removed certificate for ${name} from SQLite DB`, "info");
          await loadData();
          return;
        }
      } catch {
        // Fallback
      }

      const filtered = certificates.filter((c) => c.id !== id);
      setCertificates(filtered);
      saveStoredCertificates(filtered);
      showToast("Record Deleted", `Removed certificate for ${name}`, "info");
    }
  };

  // Reset to initial demo data
  const handleResetDemoData = async () => {
    if (confirm("Reset dataset back to default demo records?")) {
      setCertificates(INITIAL_CERTIFICATES);
      saveStoredCertificates(INITIAL_CERTIFICATES);
      showToast("Data Reset", "Restored default demo certificates.", "info");
    }
  };

  // Filtered List
  const filteredCertificates = certificates.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.certificateId.toLowerCase().includes(q) ||
      c.event.toLowerCase().includes(q)
    );
  });

  const totalDownloads = certificates.reduce((acc, curr) => acc + (curr.downloads || 0), 0);
  const totalEvents = new Set(certificates.map((c) => c.event)).size;

  if (!authChecked) {
    return <div className="py-12 text-center text-slate-400">Verifying session security...</div>;
  }

  // Render Login Lock Screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-md mx-auto py-8 sm:py-16 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/90 border border-slate-800 p-6 sm:p-8 rounded-3xl backdrop-blur-xl shadow-2xl space-y-6 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header Lock Badge */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 mx-auto shadow-xl shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-indigo-400">
              <Lock className="w-8 h-8" />
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Admin Authentication</h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter your credentials to access the Certificate Management Console.
            </p>
          </div>

          {/* Demo Hint Banner */}
          {/* <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-3.5 text-left text-xs space-y-1">
            <p className="font-semibold text-indigo-300 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-indigo-400" /> Default Demo Credentials:
            </p>
            <div className="font-mono text-[11px] text-slate-300 pl-5 space-y-0.5">
              <p>Username: <span className="text-indigo-400 font-bold">admin</span></p>
              <p>Password: <span className="text-indigo-400 font-bold">admin123</span></p>
            </div>
          </div> */}

          {authError && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 text-left"
            >
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Username
              </label>
              <input
                type="text"
                required
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Enter username (e.g. admin)"
                className="w-full px-4 py-3 rounded-xl bg-slate-950/90 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter password (e.g. admin123)"
                  className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-950/90 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-sm shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              Sign In to Admin Dashboard
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Admin Console</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              SQLite Connected
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Upload Excel spreadsheets, manage recipient records in SQLite DB, and track download analytics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => generateSampleExcelFile()}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
            title="Download sample Excel template with standard columns"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            Sample Template (.xlsx)
          </button>

          <button
            onClick={() => exportCertificatesToExcel(certificates)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
            Export to Excel
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-xs shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Single Certificate
          </button>

          <button
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Sign out of Admin session"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </div>

      {/* Analytics Overview Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Issued</span>
            <Award className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-2xl font-extrabold text-white mt-2">{certificates.length}</p>
          <span className="text-[11px] text-emerald-400 mt-1 block">Active in SQLite DB</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Lookup Requests</span>
            <Users className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-white mt-2">{totalLookups}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">User Searches</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Downloads</span>
            <BarChart3 className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-2xl font-extrabold text-white mt-2">{totalDownloads}</p>
          <span className="text-[11px] text-purple-300 mt-1 block">Files Exported</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Events</span>
            <FileText className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-white mt-2">{totalEvents}</p>
          <span className="text-[11px] text-amber-300 mt-1 block">Courses & Hackathons</span>
        </div>
      </div>

      {/* Excel Upload Area */}
      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Upload Certificate Spreadsheet</h3>
              <p className="text-xs text-slate-400">Upload `.xlsx`, `.xls`, or `.csv` file containing names, phone numbers, and Drive links.</p>
            </div>
          </div>
        </div>

        {/* Dropzone */}
        <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-700/80 hover:border-indigo-500/60 rounded-2xl cursor-pointer bg-slate-950/60 hover:bg-slate-950 transition-all p-4 group">
          <div className="flex flex-col items-center justify-center text-center space-y-2">
            <FileSpreadsheet className="w-8 h-8 text-slate-500 group-hover:text-indigo-400 transition-colors" />
            <p className="text-xs text-slate-300">
              <span className="font-semibold text-indigo-400">Click to upload .xlsx file</span> or drag and drop Excel spreadsheet
            </p>
            <p className="text-[11px] text-slate-500">Supports .xlsx, .xls, .csv with columns: Full Name, Phone Number, Drive Link</p>
          </div>
          <input
            type="file"
            accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv"
            className="hidden"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
        </label>

        {/* Parsed Preview Confirmation Banner */}
        {parsedPreview && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-500/40 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-300 font-semibold text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Parsed {parsedPreview.length} records ready to import to SQLite
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setParsedPreview(null)}
                  className="px-3 py-1 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmImport}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md cursor-pointer"
                >
                  Confirm & Save All ({parsedPreview.length})
                </button>
              </div>
            </div>

            {/* Snippet Table Preview */}
            <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-900 text-slate-400 sticky top-0">
                  <tr>
                    <th className="p-2">Name</th>
                    <th className="p-2">Phone</th>
                    <th className="p-2">Event</th>
                    <th className="p-2">Drive Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {parsedPreview.slice(0, 5).map((row, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-medium">{row.name}</td>
                      <td className="p-2 font-mono text-slate-400">{row.phone}</td>
                      <td className="p-2">{row.event}</td>
                      <td className="p-2 truncate max-w-xs font-mono text-[10px] text-slate-500">{row.driveUrl}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>

      {/* Main Records Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Name, Phone, Event, or Certificate ID..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            onClick={handleResetDemoData}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 self-end sm:self-auto cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Demo Records
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider">
                <th className="p-3.5">ID</th>
                <th className="p-3.5">Recipient Name</th>
                <th className="p-3.5">Phone Number</th>
                <th className="p-3.5">Event Name</th>
                <th className="p-3.5">Drive Link</th>
                <th className="p-3.5 text-center">Downloads</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredCertificates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No certificates found in SQLite DB. Upload an Excel file or click "Add Single Certificate".
                  </td>
                </tr>
              ) : (
                filteredCertificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3.5 font-mono text-[11px] text-slate-400">{cert.certificateId}</td>
                    <td className="p-3.5 font-semibold text-white">{cert.name}</td>
                    <td className="p-3.5 font-mono text-slate-300">{cert.phone}</td>
                    <td className="p-3.5 text-indigo-300 max-w-xs truncate">{cert.event}</td>
                    <td className="p-3.5 max-w-xs truncate">
                      <a
                        href={cert.driveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-indigo-400 font-mono text-[11px] flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        <span className="truncate">{cert.driveUrl}</span>
                      </a>
                    </td>
                    <td className="p-3.5 text-center font-semibold text-purple-400">
                      {cert.downloads || 0}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setPreviewCert(cert)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Preview Certificate"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingCert(cert)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Edit Record"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cert.id, cert.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Single Certificate Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-white">Add New Certificate</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. John Doe"
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +19876543210"
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Certificate Drive Link</label>
                  <input
                    type="url"
                    value={formData.driveUrl}
                    onChange={(e) => setFormData({ ...formData, driveUrl: e.target.value })}
                    placeholder="https://drive.google.com/file/d/..."
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Event / Course Name</label>
                    <input
                      type="text"
                      value={formData.event}
                      onChange={(e) => setFormData({ ...formData, event: e.target.value })}
                      placeholder="e.g. AI Hackathon 2026"
                      className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Issue Date</label>
                    <input
                      type="date"
                      value={formData.issueDate}
                      onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                      className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Details / Note</label>
                  <input
                    type="text"
                    value={formData.details}
                    onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                    placeholder="e.g. Grade A+ / Distinction"
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-500/20 cursor-pointer"
                  >
                    Create Certificate
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Record Modal */}
      <AnimatePresence>
        {editingCert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-white">Edit Certificate</h3>
                <button onClick={() => setEditingCert(null)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editingCert.name}
                    onChange={(e) => setEditingCert({ ...editingCert, name: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editingCert.phone}
                    onChange={(e) => setEditingCert({ ...editingCert, phone: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Drive Link</label>
                  <input
                    type="url"
                    value={editingCert.driveUrl}
                    onChange={(e) => setEditingCert({ ...editingCert, driveUrl: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Event Name</label>
                    <input
                      type="text"
                      value={editingCert.event}
                      onChange={(e) => setEditingCert({ ...editingCert, event: e.target.value })}
                      className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Issue Date</label>
                    <input
                      type="date"
                      value={editingCert.issueDate}
                      onChange={(e) => setEditingCert({ ...editingCert, issueDate: e.target.value })}
                      className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Details</label>
                  <input
                    type="text"
                    value={editingCert.details || ""}
                    onChange={(e) => setEditingCert({ ...editingCert, details: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingCert(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-500/20 cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Certificate Live Preview Modal */}
      <AnimatePresence>
        {previewCert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl max-h-[90vh] overflow-y-auto my-auto"
            >
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => setPreviewCert(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <X className="w-4 h-4" /> Close Preview
                </button>
              </div>
              <CertificatePreview certificate={previewCert} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
