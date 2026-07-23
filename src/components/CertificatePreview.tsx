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
  Award,
  Calendar,
  Phone,
  FileCheck,
  Sparkles,
  Maximize2,
  Image as ImageIcon,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  certificate: CertificateRecord;
  onDownload?: () => void;
}

export const CertificatePreview: React.FC<Props> = ({ certificate, onDownload }) => {
  const { showToast } = useToast();
  const driveInfo = getDriveUrls(certificate.driveUrl);

  // Check if link is an image format (.jpg, .jpeg, .png, .webp, .svg)
  const isDirectImage =
    certificate.driveUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i) !== null;

  const [activeTab, setActiveTab] = useState<"original" | "rendered">("original");
  const [imgError, setImgError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleCopyLink = () => {
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const link = `${origin}?phone=${encodeURIComponent(certificate.phone)}`;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = link;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      showToast("Link Copied!", "Shareable certificate verification link copied to clipboard.", "success");
    } catch {
      showToast("Share Link", certificate.driveUrl, "info");
    }
  };

  const handleDownloadOriginal = () => {
    if (onDownload) onDownload();
    showToast("Downloading", "Opening original certificate document...", "info");
    try {
      const a = document.createElement("a");
      a.href = driveInfo.downloadUrl;
      a.target = "_blank";
      a.rel = "noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      window.open(driveInfo.downloadUrl, "_blank");
    }
  };

  return (
    <div className="w-full bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl shadow-emerald-950/5 space-y-6">
      {/* Header Info & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              Verified Authentic
            </span>
            <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
              {certificate.certificateId}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{certificate.name}</h2>
          <p className="text-sm text-emerald-700 flex items-center gap-2 mt-1 font-medium">
            <Award className="w-4 h-4 text-emerald-600" />
            {certificate.event}
          </p>
        </div>

        {/* Tab Switcher & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center">
            <button
              type="button"
              onClick={() => setActiveTab("original")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "original"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Original Certificate
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("rendered")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "rendered"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Digital Badge View
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyLink}
            className="p-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-all text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            title="Copy verification link"
          >
            <Share2 className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Share</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadOriginal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-sm shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download Original
          </button>
        </div>
      </div>

      {/* Main Preview Screen */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100/70 shadow-inner min-h-[460px] flex items-center justify-center p-2 sm:p-4">
        {activeTab === "original" ? (
          /* REAL ORIGINAL CERTIFICATE PREVIEW FROM LINK */
          <div className="w-full h-full flex flex-col items-center justify-center relative group">
            {isDirectImage && !imgError ? (
              <div className="relative max-w-4xl w-full flex items-center justify-center">
                <img
                  src={certificate.driveUrl}
                  alt={`Official Certificate for ${certificate.name}`}
                  onError={() => setImgError(true)}
                  className="max-h-[600px] w-auto object-contain rounded-xl shadow-xl border border-slate-200 bg-white"
                />

                {/* Floating Fullscreen / Open Original Action Overlay */}
                <div className="absolute top-3 right-3 flex items-center gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => setIsFullscreen(true)}
                    className="p-2 rounded-lg bg-white/90 hover:bg-white text-xs text-slate-800 border border-slate-200 backdrop-blur-md flex items-center gap-1.5 shadow-md cursor-pointer font-medium"
                    title="Fullscreen Preview"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Expand</span>
                  </button>
                  <a
                    href={certificate.driveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs text-white border border-emerald-500 backdrop-blur-md flex items-center gap-1.5 shadow-md font-medium"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open High-Res
                  </a>
                </div>
              </div>
            ) : driveInfo.isDrive ? (
              /* Google Drive Iframe Preview */
              <div className="w-full h-[540px] relative">
                <iframe
                  src={driveInfo.previewUrl}
                  className="w-full h-full border-none rounded-xl"
                  title="Google Drive Original Certificate Preview"
                  allow="autoplay"
                />
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <a
                    href={driveInfo.directViewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-white/90 hover:bg-white text-xs text-emerald-700 border border-slate-200 backdrop-blur-md flex items-center gap-1.5 shadow-md font-medium"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open in Drive
                  </a>
                </div>
              </div>
            ) : (
              /* Generic URL Iframe / Embed Fallback */
              <div className="w-full h-[540px] relative flex flex-col items-center justify-center">
                <iframe
                  src={certificate.driveUrl}
                  className="w-full h-full border-none rounded-xl bg-white"
                  title="Original Certificate Document"
                />
                <div className="absolute top-3 right-3">
                  <a
                    href={certificate.driveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 rounded-lg bg-white/90 hover:bg-white text-xs text-emerald-700 border border-slate-200 backdrop-blur-md flex items-center gap-1.5 shadow-md font-medium"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open Original Link
                  </a>
                </div>
              </div>
            )}

            {imgError && (
              <div className="p-8 text-center space-y-3">
                <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
                <h4 className="text-slate-800 font-semibold">Image Load Notice</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  The original certificate file is located at <span className="font-mono text-emerald-700 font-semibold">{certificate.driveUrl}</span>.
                </p>
                <a
                  href={certificate.driveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md"
                >
                  <ExternalLink className="w-4 h-4" /> Open Certificate Document Directly
                </a>
              </div>
            )}
          </div>
        ) : (
          /* Digital Badge Verification View */
          <div className="w-full p-4 sm:p-8 flex justify-center print:p-0">
            <div
              id="digital-certificate-card"
              className="w-full max-w-3xl aspect-[1.414/1] bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-950 border-4 border-amber-400/40 rounded-2xl p-6 sm:p-10 relative overflow-hidden shadow-2xl text-center flex flex-col justify-between select-none group text-white"
            >
              <div className="absolute inset-2 border-2 border-dashed border-amber-400/20 rounded-xl pointer-events-none" />
              <div className="relative z-10 space-y-2">
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-semibold tracking-widest uppercase">
                  <Award className="w-4 h-4 text-amber-400" />
                  Official Credential Details
                </div>
                <h3 className="text-xl sm:text-2xl font-serif text-emerald-100 tracking-wide font-medium mt-2">
                  This Credential Record is Registered To
                </h3>
              </div>

              <div className="relative z-10 my-4 sm:my-6">
                <h1 className="text-3xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-amber-100 tracking-tight py-1 font-serif">
                  {certificate.name}
                </h1>
                <div className="w-48 h-0.5 mx-auto bg-gradient-to-r from-transparent via-amber-400/60 to-transparent my-3" />
                <h2 className="text-lg sm:text-2xl font-bold text-emerald-200 mt-2 px-4">
                  {certificate.event}
                </h2>
                {certificate.details && (
                  <p className="text-xs sm:text-sm text-emerald-300/80 italic mt-2 max-w-lg mx-auto">
                    "{certificate.details}"
                  </p>
                )}
              </div>

              <div className="relative z-10 flex items-end justify-between border-t border-emerald-800/80 pt-4 text-left">
                <div className="space-y-1">
                  <p className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold">Issue Date</p>
                  <p className="text-xs font-medium text-emerald-100 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    {certificate.issueDate}
                  </p>
                  <p className="text-[10px] text-emerald-300 mt-2 font-mono">ID: {certificate.certificateId}</p>
                </div>

                <div className="flex flex-col items-center justify-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 p-0.5 shadow-lg shadow-amber-400/20 flex items-center justify-center">
                    <div className="w-full h-full rounded-full border border-amber-200/40 flex flex-col items-center justify-center text-center text-slate-950 p-1">
                      <Award className="w-6 h-6 text-slate-950" />
                      <span className="text-[7px] font-extrabold uppercase tracking-tighter">VERIFIED</span>
                    </div>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <p className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold">Authorized Authority</p>
                  <div className="font-serif italic text-sm text-amber-300 font-semibold border-b border-emerald-700 pb-0.5">
                    Uttaranchal University
                  </div>
                  <p className="text-[10px] text-emerald-300">Official Directorate</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Image Modal */}
      <AnimatePresence>
        {isFullscreen && isDirectImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xl p-4 cursor-pointer"
            onClick={() => setIsFullscreen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-6xl max-h-[90vh]"
            >
              <img
                src={certificate.driveUrl}
                alt={certificate.name}
                className="max-h-[90vh] w-auto object-contain rounded-2xl shadow-2xl border border-slate-200 bg-white"
              />
              <p className="text-center text-xs text-white mt-3 font-medium">Click anywhere to close full screen</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Extra Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
        <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center gap-3">
          <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
          <div>
            <span className="text-slate-500 block text-[10px]">Registered Mobile</span>
            <span className="font-semibold text-slate-800">{certificate.phone}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center gap-3">
          <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <div>
            <span className="text-slate-500 block text-[10px]">Status</span>
            <span className="font-semibold text-emerald-700 font-semibold">Verified & Authentic</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center gap-3">
          <Download className="w-4 h-4 text-emerald-600 shrink-0" />
          <div>
            <span className="text-slate-400 block text-[10px]">Total Views / Downloads</span>
            <span className="font-semibold text-slate-800">{certificate.downloads || 0} times</span>
          </div>
        </div>
      </div>
    </div>
  );
};
