"use client";

import React, { useState } from "react";
import { CertificateRecord } from "@/lib/types";
import { getDriveUrls } from "@/lib/drive";
import { useToast } from "./Toast";
import {
  Download,
  ExternalLink,
  Share2,
  CheckCircle,
  Eye,
  Award,
  Calendar,
  Phone,
  FileCheck,
  Sparkles,
  Maximize2,
  Printer,
  Copy,
} from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  certificate: CertificateRecord;
  onDownload?: () => void;
}

export const CertificatePreview: React.FC<Props> = ({ certificate, onDownload }) => {
  const { showToast } = useToast();
  const driveInfo = getDriveUrls(certificate.driveUrl);
  const [activeTab, setActiveTab] = useState<"drive" | "rendered">("rendered");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleCopyLink = () => {
    const link = `${window.location.origin}?phone=${encodeURIComponent(certificate.phone)}`;
    navigator.clipboard.writeText(link);
    showToast("Link Copied!", "Shareable certificate verification link copied to clipboard.", "success");
  };

  const handleDownloadOriginal = () => {
    if (onDownload) onDownload();
    showToast("Initiating Download", "Opening official certificate file...", "info");
    window.open(driveInfo.downloadUrl, "_blank");
  };

  const handlePrint = () => {
    if (onDownload) onDownload();
    window.print();
  };

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800/80 rounded-3xl p-4 sm:p-6 lg:p-8 backdrop-blur-xl shadow-2xl space-y-6">
      {/* Header Info & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <CheckCircle className="w-3.5 h-3.5" />
              Verified Authentic
            </span>
            <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-md">
              {certificate.certificateId}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">{certificate.name}</h2>
          <p className="text-sm text-indigo-300 flex items-center gap-2 mt-1">
            <Award className="w-4 h-4 text-indigo-400" />
            {certificate.event}
          </p>
        </div>

        {/* Tab Switcher & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {driveInfo.isDrive && (
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center">
              <button
                onClick={() => setActiveTab("rendered")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === "rendered"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Digital View
              </button>
              <button
                onClick={() => setActiveTab("drive")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === "drive"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Drive Preview
              </button>
            </div>
          )}

          <button
            onClick={handleCopyLink}
            className="p-2.5 rounded-xl bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60 transition-all text-xs font-medium flex items-center gap-1.5"
            title="Copy verification link"
          >
            <Share2 className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Share</span>
          </button>

          <button
            onClick={handleDownloadOriginal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Certificate
          </button>
        </div>
      </div>

      {/* Main Preview Screen */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950/80 shadow-2xl min-h-[420px] flex items-center justify-center">
        {activeTab === "drive" && driveInfo.isDrive ? (
          <div className="w-full h-[520px] relative">
            <iframe
              src={driveInfo.previewUrl}
              className="w-full h-full border-none rounded-2xl"
              title="Google Drive Certificate Preview"
              allow="autoplay"
            />
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <a
                href={driveInfo.directViewUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-xs text-indigo-300 border border-slate-700/60 backdrop-blur-md flex items-center gap-1.5 shadow-lg"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Drive
              </a>
            </div>
          </div>
        ) : (
          /* High-End Digital Rendered Certificate Frame */
          <div className="w-full p-4 sm:p-8 flex justify-center print:p-0">
            <div
              id="digital-certificate-card"
              className="w-full max-w-3xl aspect-[1.414/1] bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/90 border-4 border-amber-500/40 rounded-2xl p-6 sm:p-10 relative overflow-hidden shadow-2xl text-center flex flex-col justify-between select-none group"
            >
              {/* Outer Decorative Border */}
              <div className="absolute inset-2 border-2 border-dashed border-amber-500/20 rounded-xl pointer-events-none" />
              
              {/* Corner Watermarks */}
              <div className="absolute top-4 left-4 text-amber-500/20 font-serif text-3xl font-bold">
                ❖
              </div>
              <div className="absolute top-4 right-4 text-amber-500/20 font-serif text-3xl font-bold">
                ❖
              </div>
              <div className="absolute bottom-4 left-4 text-amber-500/20 font-serif text-3xl font-bold">
                ❖
              </div>
              <div className="absolute bottom-4 right-4 text-amber-500/20 font-serif text-3xl font-bold">
                ❖
              </div>

              {/* Header Badge */}
              <div className="relative z-10 space-y-2">
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold tracking-widest uppercase">
                  <Award className="w-4 h-4 text-amber-400" />
                  Official Certificate of Achievement
                </div>
                <h3 className="text-xl sm:text-2xl font-serif text-slate-200 tracking-wide font-medium mt-2">
                  This Certificate is Proudly Presented To
                </h3>
              </div>

              {/* Recipient Name */}
              <div className="relative z-10 my-4 sm:my-6">
                <h1 className="text-3xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 tracking-tight py-1 font-serif">
                  {certificate.name}
                </h1>
                <div className="w-48 h-0.5 mx-auto bg-gradient-to-r from-transparent via-amber-500/60 to-transparent my-3" />
                <p className="text-sm sm:text-base text-slate-300 font-light max-w-xl mx-auto leading-relaxed">
                  for outstanding participation and successful completion of
                </p>
                <h2 className="text-lg sm:text-2xl font-bold text-indigo-300 mt-2 px-4">
                  {certificate.event}
                </h2>
                {certificate.details && (
                  <p className="text-xs sm:text-sm text-slate-400 italic mt-2 max-w-lg mx-auto">
                    "{certificate.details}"
                  </p>
                )}
              </div>

              {/* Footer Section with Seal and Details */}
              <div className="relative z-10 flex items-end justify-between border-t border-slate-800/80 pt-4 text-left">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    Issue Date
                  </p>
                  <p className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    {certificate.issueDate}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-2 font-mono">
                    ID: {certificate.certificateId}
                  </p>
                </div>

                {/* Gold Seal Graphic */}
                <div className="flex flex-col items-center justify-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center">
                    <div className="w-full h-full rounded-full border border-amber-200/40 flex flex-col items-center justify-center text-center text-slate-950 p-1">
                      <Award className="w-6 h-6 text-slate-950" />
                      <span className="text-[7px] font-extrabold uppercase tracking-tighter">
                        VERIFIED
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    Authorized Signatory
                  </p>
                  <div className="font-serif italic text-sm text-amber-300 font-semibold border-b border-slate-700 pb-0.5">
                    CertiPulse Directorate
                  </div>
                  <p className="text-[10px] text-slate-400">Global Certification Board</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Extra Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-3">
          <Phone className="w-4 h-4 text-indigo-400 shrink-0" />
          <div>
            <span className="text-slate-400 block text-[10px]">Registered Phone</span>
            <span className="font-semibold text-slate-200">{certificate.phone}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-3">
          <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <span className="text-slate-400 block text-[10px]">Status</span>
            <span className="font-semibold text-emerald-400">Active & Ready</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-3">
          <Download className="w-4 h-4 text-purple-400 shrink-0" />
          <div>
            <span className="text-slate-400 block text-[10px]">Total Downloads</span>
            <span className="font-semibold text-slate-200">{certificate.downloads || 0} times</span>
          </div>
        </div>
      </div>
    </div>
  );
};
