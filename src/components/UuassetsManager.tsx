"use client";

import React, { useState, useEffect, useRef } from "react";
import { useToast } from "./Toast";
import {
  UploadCloud,
  FileImage,
  FileText,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Search,
  RefreshCw,
  FolderUp,
  FileSpreadsheet,
  Info,
  Sparkles,
  Link2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface UuassetFile {
  filename: string;
  url: string;
  fullUrl: string;
  size: number;
  uploadedAt: string;
  isImage: boolean;
  isPdf: boolean;
}

interface UuassetsManagerProps {
  onSelectUrl?: (url: string) => void;
  compact?: boolean;
}

export const UuassetsManager: React.FC<UuassetsManagerProps> = ({
  onSelectUrl,
  compact = false,
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<UuassetFile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);

  const fetchUuassets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/uuassets");
      const data = await res.json();
      if (data.success && Array.isArray(data.files)) {
        setFiles(data.files);
      } else {
        setFiles([]);
      }
    } catch (err) {
      console.warn("Failed to fetch uuassets:", err);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUuassets();
  }, []);

  const handleFilesUpload = async (fileList: FileList | File[]) => {
    if (!fileList || fileList.length === 0) return;

    setUploading(true);
    showToast("Uploading to uuassets", `Processing ${fileList.length} certificate file(s)...`, "info");

    const formData = new FormData();
    Array.from(fileList).forEach((file) => {
      formData.append("files", file);
    });

    try {
      const res = await fetch("/api/uuassets", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        showToast(
          "Upload Successful!",
          `Uploaded ${data.count || fileList.length} certificate(s) to uuassets directory.`,
          "success"
        );
        await fetchUuassets();
      } else {
        showToast("Upload Failed", data.error || "Could not save files.", "error");
      }
    } catch (err: any) {
      showToast("Upload Error", err?.message || "Failed to communicate with server", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFilesUpload(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesUpload(e.dataTransfer.files);
    }
  };

  const handleDelete = async (filename: string) => {
    if (!confirm(`Are you sure you want to delete ${filename} from uuassets?`)) return;

    try {
      const res = await fetch(`/api/uuassets?filename=${encodeURIComponent(filename)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showToast("File Deleted", `Removed ${filename} from uuassets repository.`, "info");
        setFiles(files.filter((f) => f.filename !== filename));
      } else {
        showToast("Delete Failed", data.error || "Could not delete file.", "error");
      }
    } catch (err: any) {
      showToast("Delete Error", err?.message || "Failed to delete file", "error");
    }
  };

  const copyToClipboard = (text: string, label: string = "Link") => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopiedUrl(text);
      setTimeout(() => setCopiedUrl(null), 2500);
      showToast(
        "Copied to Clipboard!",
        `${label} copied. You can now paste this directly into your Excel sheet!`,
        "success"
      );
    } catch {
      showToast("Copy Link", text, "info");
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const filteredFiles = files.filter((f) =>
    f.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full bg-white border border-slate-200 rounded-3xl p-6 shadow-xl shadow-blue-950/5 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-100 text-orange-700">
              <FolderUp className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              uuassets Certificate Repository
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200 uppercase">
              {files.length} Files
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Upload certificate documents (Images & PDFs) to the <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-orange-700 font-bold">uuassets</code> folder. Copy any link to paste directly into your Excel spreadsheet!
          </p>
        </div>

        <button
          onClick={fetchUuassets}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Assets
        </button>
      </div>

      {/* Excel Usage Quick Banner */}
      {!compact && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-50 via-amber-50 to-blue-50 border border-orange-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-orange-500 text-white shrink-0 shadow-md">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-xs">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <span>How to use uuassets with Excel Spreadsheets</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              </h4>
              <p className="text-slate-600 leading-relaxed">
                1. Drag & drop certificate images/PDFs below to upload them to <span className="font-mono text-orange-700 font-bold">uuassets</span>.<br />
                2. Click <span className="font-semibold text-slate-900">"Copy Link"</span> on any uploaded certificate file.<br />
                3. Paste that link into the <span className="font-semibold text-slate-900">"Certificate Drive Link"</span> column in your Excel file, then upload the Excel sheet!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
          dragActive
            ? "border-orange-500 bg-orange-50/60 scale-[0.99]"
            : "border-slate-300 hover:border-orange-400 bg-slate-50/50 hover:bg-orange-50/20"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept="image/*,.pdf"
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-inner">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">
              {uploading ? "Uploading certificate files..." : "Bulk Upload Certificate Files (Select Multiple or Drag Folder)"}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Select 1, 10, or 100+ PNG, JPG, WEBP, or PDF certificate files at once. Saved to <span className="font-mono text-orange-700 font-bold">public/uuassets</span>
            </p>
          </div>
          {uploading && (
            <div className="flex items-center gap-2 text-xs text-orange-700 font-semibold pt-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Saving certificate files to uuassets...</span>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Action Controls Bar */}
      {files.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-slate-100/80 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <Sparkles className="w-4 h-4 text-orange-600" />
            <span>Bulk Tools ({files.length} uuassets files available):</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                const allLinks = files.map((f) => f.url).join("\n");
                copyToClipboard(allLinks, `All ${files.length} certificate links`);
              }}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-orange-600" />
              Bulk Copy All Links
            </button>

            <button
              onClick={() => {
                import("@/lib/excel").then((mod) => mod.generateExcelFromUuassets(files));
                showToast("Excel Generated", `Downloaded Excel template pre-filled with ${files.length} uuassets links.`, "success");
              }}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Export Excel Pre-filled Template
            </button>

            <button
              onClick={async () => {
                if (!confirm(`Auto-create database records for all ${files.length} uploaded files in uuassets?`)) return;
                const recordsToCreate = files.map((file, idx) => {
                  const nameWithoutExt = file.filename.replace(/\.[^/.]+$/, "");
                  const cleanName = nameWithoutExt.replace(/[-_]/g, " ").replace(/\d+/g, "").trim();
                  const digits = nameWithoutExt.replace(/\D/g, "");

                  return {
                    name: cleanName || `Participant ${idx + 1}`,
                    phone: digits.length >= 7 ? digits : `+198765${1000 + idx}`,
                    email: undefined,
                    driveUrl: file.url,
                    event: "General Certificate of Achievement",
                    issueDate: new Date().toISOString().split("T")[0],
                    details: "Auto-linked from uuassets bulk upload",
                  };
                });

                try {
                  const res = await fetch("/api/certificates", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ records: recordsToCreate }),
                  });
                  const data = await res.json();
                  if (data.success) {
                    showToast("Bulk Import Success!", `Created ${data.count || recordsToCreate.length} database certificate records.`, "success");
                  }
                } catch (err: any) {
                  showToast("Error", err?.message || "Failed to create records", "error");
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Auto-Create DB Records
            </button>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search uuassets files..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-orange-500 focus:bg-white"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Showing {filteredFiles.length} of {files.length} files
        </span>
      </div>

      {/* Files Grid / List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-orange-600" />
          <span>Loading uuassets repository files...</span>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="text-center py-12 bg-slate-50/50 border border-slate-200/60 rounded-2xl text-slate-400 text-xs space-y-2">
          <FolderUp className="w-8 h-8 mx-auto text-slate-300" />
          <p className="font-medium text-slate-600">No certificate files found in uuassets.</p>
          <p className="text-[11px]">Upload certificate images or PDFs above to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredFiles.map((file) => {
              const isCopied = copiedUrl === file.url || copiedUrl === file.fullUrl;

              return (
                <motion.div
                  key={file.filename}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-slate-50/70 border border-slate-200/90 hover:border-orange-300 rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-all hover:shadow-md group relative"
                >
                  {/* Top Preview */}
                  <div className="relative aspect-[1.6/1] bg-slate-200/70 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200">
                    {file.isImage ? (
                      <img
                        src={file.url}
                        alt={file.filename}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : file.isPdf ? (
                      <div className="flex flex-col items-center justify-center text-rose-600 space-y-1">
                        <FileText className="w-10 h-10" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">PDF Document</span>
                      </div>
                    ) : (
                      <FileImage className="w-8 h-8 text-slate-400" />
                    )}

                    {/* Quick Badge */}
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-900/80 text-white backdrop-blur-xs font-mono uppercase">
                      {file.filename.split(".").pop()}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="space-y-1">
                    <h4
                      className="font-bold text-xs text-slate-900 truncate font-mono"
                      title={file.filename}
                    >
                      {file.filename}
                    </h4>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>{formatFileSize(file.size)}</span>
                      <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-slate-200/80 flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => copyToClipboard(file.url, `Relative link (${file.url})`)}
                      className={`flex-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        isCopied
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-orange-600 hover:bg-orange-700 text-white shadow-xs"
                      }`}
                      title="Copy link to paste into Excel sheet (e.g. /uuassets/filename.jpg)"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? "Copied!" : "Copy Link"}</span>
                    </button>

                    <button
                      onClick={() => copyToClipboard(file.fullUrl, `Full URL (${file.fullUrl})`)}
                      className="p-1.5 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-700 transition-all text-xs cursor-pointer"
                      title="Copy full HTTP URL"
                    >
                      <Link2 className="w-3.5 h-3.5 text-blue-600" />
                    </button>

                    <a
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-700 transition-all text-xs"
                      title="Open asset in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                    </a>

                    {onSelectUrl && (
                      <button
                        onClick={() => onSelectUrl(file.url)}
                        className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                      >
                        Select
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(file.filename)}
                      className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/80 transition-all text-xs cursor-pointer"
                      title="Delete asset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
