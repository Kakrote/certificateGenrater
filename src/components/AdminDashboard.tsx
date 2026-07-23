"use client";

import React, { useState, useEffect } from "react";
import { CertificateRecord } from "@/lib/types";
import { fetchCertificatesFromApi, saveStoredCertificates, INITIAL_CERTIFICATES } from "@/lib/store";
import { useToast } from "./Toast";
import { CertificatePreview } from "./CertificatePreview";
import {
  Plus,
  Search,
  Trash2,
  Edit,
  Eye,
  RefreshCw,
  Award,
  Users,
  BarChart3,
  X,
  FileText,
  ExternalLink,
  Lock,
  EyeOff,
  LogOut,
  ShieldAlert,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const AdminDashboard: React.FC = () => {
  const { showToast } = useToast();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");

  // Data States
  const [certificates, setCertificates] = useState<CertificateRecord[]>(INITIAL_CERTIFICATES);
  const [totalLookups, setTotalLookups] = useState<number>(597);
  const [searchQuery, setSearchQuery] = useState("");

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
    try {
      const data = await fetchCertificatesFromApi();
      if (data && Array.isArray(data.certificates) && data.certificates.length > 0) {
        setCertificates(data.certificates);
        setTotalLookups(data.totalLookups);
      }
    } catch (e) {
      console.warn("Failed to load DB data, using initial dataset", e);
    }
  };

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const sessionAuth = sessionStorage.getItem("certipulse_admin_auth");
        const localAuth = localStorage.getItem("certipulse_admin_auth");
        if (sessionAuth === "true" || localAuth === "true") {
          setIsAuthenticated(true);
        }
      }
    } catch {
      // Ignore storage restrictions
    }
    loadData();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    const validUsername = "admin";
    const validPasswords = ["admin123", "adminpassword", "admin", "123456", "admin@123"];

    const enteredUser = usernameInput.trim().toLowerCase();
    const enteredPass = passwordInput.trim().toLowerCase();

    if (
      enteredUser === validUsername &&
      validPasswords.includes(enteredPass)
    ) {
      setIsAuthenticated(true);
      try {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("certipulse_admin_auth", "true");
          localStorage.setItem("certipulse_admin_auth", "true");
        }
      } catch {
        // Fallback
      }
      showToast("Access Granted", "Welcome to the Admin Control Panel.", "success");
      setUsernameInput("");
      setPasswordInput("");
    } else {
      setAuthError("Invalid username or password. Try 'admin' and 'admin123'.");
      showToast("Access Denied", "Incorrect credentials entered.", "error");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    try {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("certipulse_admin_auth");
        localStorage.removeItem("certipulse_admin_auth");
      }
    } catch {
      // Fallback
    }
    showToast("Logged Out", "Admin session ended securely.", "info");
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
          driveUrl: formData.driveUrl.trim() || "https://uuassets.uudoon.in/Documents/AIIW2025PC/WPC-1.jpg",
          event: formData.event.trim() || "General Certificate of Achievement",
          issueDate: formData.issueDate || new Date().toISOString().split("T")[0],
          details: formData.details.trim() || "Successfully completed program requirements.",
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("Certificate Created!", `Saved ${json.certificate.name} to Database.`, "success");
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
      driveUrl: formData.driveUrl.trim() || "https://uuassets.uudoon.in/Documents/AIIW2025PC/WPC-1.jpg",
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
        showToast("Changes Saved", `Updated record for ${editingCert.name}`, "success");
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
          showToast("Record Deleted", `Removed certificate for ${name}`, "info");
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

  // Reset to testingData
  const handleResetDemoData = async () => {
    if (confirm("Reset dataset back to testing.xlsx records?")) {
      setCertificates(INITIAL_CERTIFICATES);
      saveStoredCertificates(INITIAL_CERTIFICATES);
      showToast("Data Reset", "Restored testing.xlsx dataset.", "info");
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

  // Render Login Lock Screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-md mx-auto py-8 sm:py-16 space-y-6">
        <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl backdrop-blur-xl shadow-xl shadow-emerald-950/5 space-y-6 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header Brand Logo */}
          <div className="h-16 flex items-center justify-center p-2 rounded-2xl bg-white border border-slate-200/80 mx-auto max-w-[200px] shadow-xs">
            <img
              src="/logos/pragarti.png"
              alt="CertiPulse Logo"
              className="h-12 w-auto object-contain"
            />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Authentication</h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter your credentials to access the Certificate Management Console.
            </p>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 text-left">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Username
              </label>
              <input
                type="text"
                required
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Enter username (e.g. admin)"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white text-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter password (e.g. admin123)"
                  className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white text-sm transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              Sign In to Admin Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Admin Console</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              System Active
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage recipient records in database and track download analytics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Single Certificate
          </button>

          <button
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Sign out of Admin session"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </div>

      {/* Analytics Overview Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-md shadow-emerald-950/5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Issued</span>
            <Award className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{certificates.length}</p>
          <span className="text-[11px] text-emerald-700 font-medium mt-1 block">Active Records</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-md shadow-emerald-950/5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Lookup Requests</span>
            <Users className="w-5 h-5 text-teal-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{totalLookups}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">User Searches</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-md shadow-emerald-950/5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Downloads</span>
            <BarChart3 className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{totalDownloads}</p>
          <span className="text-[11px] text-indigo-700 mt-1 block">Files Exported</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-md shadow-emerald-950/5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Events</span>
            <FileText className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{totalEvents}</p>
          <span className="text-[11px] text-amber-700 mt-1 block">Courses & Hackathons</span>
        </div>
      </div>

      {/* Main Records Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl shadow-emerald-950/5 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Name, Phone, Event, or Certificate ID..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
            />
          </div>

          <button
            onClick={handleResetDemoData}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1.5 self-end sm:self-auto cursor-pointer font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset to testing.xlsx Records
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider">
                <th className="p-3.5">ID</th>
                <th className="p-3.5">Recipient Name</th>
                <th className="p-3.5">Phone Number</th>
                <th className="p-3.5">Event Name</th>
                <th className="p-3.5">Drive Link</th>
                <th className="p-3.5 text-center">Downloads</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredCertificates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No certificates found. Click "Add Single Certificate" to create one.
                  </td>
                </tr>
              ) : (
                filteredCertificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="p-3.5 font-mono text-[11px] text-slate-500">{cert.certificateId}</td>
                    <td className="p-3.5 font-semibold text-slate-900">{cert.name}</td>
                    <td className="p-3.5 font-mono text-slate-700">{cert.phone}</td>
                    <td className="p-3.5 text-emerald-800 font-medium max-w-xs truncate">{cert.event}</td>
                    <td className="p-3.5 max-w-xs truncate">
                      <a
                        href={cert.driveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-500 hover:text-emerald-600 font-mono text-[11px] flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        <span className="truncate">{cert.driveUrl}</span>
                      </a>
                    </td>
                    <td className="p-3.5 text-center font-semibold text-emerald-700">
                      {cert.downloads || 0}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setPreviewCert(cert)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                          title="Preview Certificate"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingCert(cert)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 transition-colors cursor-pointer"
                          title="Edit Record"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cert.id, cert.name)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900">Add New Certificate</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. John Doe"
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. 7018321825"
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:border-emerald-500 focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Certificate Drive Link</label>
                  <input
                    type="url"
                    value={formData.driveUrl}
                    onChange={(e) => setFormData({ ...formData, driveUrl: e.target.value })}
                    placeholder="https://uuassets.uudoon.in/Documents/..."
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:border-emerald-500 focus:bg-white font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Event / Course Name</label>
                    <input
                      type="text"
                      value={formData.event}
                      onChange={(e) => setFormData({ ...formData, event: e.target.value })}
                      placeholder="e.g. Uttaranchal University"
                      className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Issue Date</label>
                    <input
                      type="date"
                      value={formData.issueDate}
                      onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                      className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Details / Note</label>
                  <input
                    type="text"
                    value={formData.details}
                    onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                    placeholder="e.g. Assistant Professor"
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-600/20 cursor-pointer"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900">Edit Certificate</h3>
                <button onClick={() => setEditingCert(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editingCert.name}
                    onChange={(e) => setEditingCert({ ...editingCert, name: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editingCert.phone}
                    onChange={(e) => setEditingCert({ ...editingCert, phone: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Drive Link</label>
                  <input
                    type="url"
                    value={editingCert.driveUrl}
                    onChange={(e) => setEditingCert({ ...editingCert, driveUrl: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Event Name</label>
                    <input
                      type="text"
                      value={editingCert.event}
                      onChange={(e) => setEditingCert({ ...editingCert, event: e.target.value })}
                      className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Issue Date</label>
                    <input
                      type="date"
                      value={editingCert.issueDate}
                      onChange={(e) => setEditingCert({ ...editingCert, issueDate: e.target.value })}
                      className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Details</label>
                  <input
                    type="text"
                    value={editingCert.details || ""}
                    onChange={(e) => setEditingCert({ ...editingCert, details: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingCert(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-600/20 cursor-pointer"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl max-h-[90vh] overflow-y-auto my-auto"
            >
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => setPreviewCert(null)}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md"
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
