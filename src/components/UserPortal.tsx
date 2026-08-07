"use client";

import React, { useState, useEffect } from "react";
import { CertificateRecord } from "@/lib/types";
import {
  findCertificateByQueryApi,
  incrementCertificateDownloadApi,
  recordLookupEvent,
} from "@/lib/store";
import { CertificatePreview } from "./CertificatePreview";
import { CertificateCorrectionSection } from "./CertificateCorrectionSection";
import { useToast } from "./Toast";
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const UserPortal: React.FC = () => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [foundCertificate, setFoundCertificate] = useState<CertificateRecord | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Check URL parameters for direct phone or email or query search (e.g. ?query=7018321825 or ?email=user@domain.com)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const queryParam = params.get("query") || params.get("phone") || params.get("email");
      if (queryParam) {
        setSearchQuery(queryParam);
        handleSearch(queryParam);
      }
    }
  }, []);

  const triggerConfetti = async () => {
    try {
      const confettiModule = await import("canvas-confetti");
      const confetti = confettiModule.default || confettiModule;
      confetti({
        particleCount: 85,
        spread: 75,
        origin: { y: 0.6 },
        colors: ["#ea580c", "#2563eb", "#f59e0b", "#1d4ed8"],
      });
    } catch {
      // Fallback if confetti is blocked
    }
  };

  const handleSearch = async (queryToSearch?: string) => {
    const target = (queryToSearch !== undefined ? queryToSearch : searchQuery) || "";
    const cleanTarget = target.trim();
    if (!cleanTarget) {
      showToast("Phone or Email Required", "Please enter your registered phone number or email address to search.", "error");
      return;
    }

    setSearching(true);
    setHasSearched(true);
    recordLookupEvent();

    try {
      const match = await findCertificateByQueryApi(cleanTarget);
      setSearching(false);

      if (match) {
        setFoundCertificate(match);
        showToast("Certificate Found!", `Verified credential for ${match.name}`, "success");
        triggerConfetti();
      } else {
        setFoundCertificate(null);
        showToast(
          "No Registration Found",
          `We couldn't find any event registration associated with this credential: ${cleanTarget}.`,
          "error"
        );
      }
    } catch (err) {
      console.warn("Search error:", err);
      setSearching(false);
      setFoundCertificate(null);
      showToast("Search Error", "Could not complete lookup. Please try again.", "error");
    }
  };

  const handleDownload = async () => {
    if (foundCertificate) {
      const updated = await incrementCertificateDownloadApi(foundCertificate.id);
      const refreshed = updated.find((c) => c.id === foundCertificate.id);
      if (refreshed) {
        setFoundCertificate(refreshed);
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Top Banner Image - himlogo.png above main content */}
      <div className="flex justify-center items-center pt-2 sm:pt-4">
        <img
          src="/assests/himlogo.png"
          alt="HIM Logo"
          className="max-h-28 sm:max-h-80 w-auto object-contain drop-shadow-md hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Hero Section */}
      <div className="text-center space-y-4 pt-0">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-800 text-xs font-semibold shadow-xs">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Official Certificate Verification and Download Portal</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Retrieve Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-600 to-blue-600">Verified Certificate</span>
        </h1>

        <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          Enter your registered phone number or email address to preview and download your 3rd All India IQAC Workshop 2026 certificate.
        </p>
      </div>

      {/* Search Bar Card */}
      <div className="bg-white border border-slate-200/90 p-4 sm:p-6 rounded-3xl shadow-xl shadow-blue-950/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="space-y-4"
        >
          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Search className="w-5 h-5 text-blue-600" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter registered Phone Number or Email (e.g. 7018321825 or name@gmail.com)"
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 text-base sm:text-lg transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={searching}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-blue-600 hover:from-orange-700 hover:to-blue-700 text-white font-bold text-base shadow-lg shadow-orange-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-70 shrink-0 cursor-pointer"
            >
              {searching ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Get Certificate
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Results View */}
      <AnimatePresence mode="wait">
        {searching && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12 space-y-4"
          >
            <div className="w-16 h-16 rounded-full border-4 border-orange-200 border-t-orange-600 animate-spin mx-auto" />
            <p className="text-slate-600 font-medium text-sm">Searching registry for matching phone or email record...</p>
          </motion.div>
        )}

        {!searching && hasSearched && foundCertificate && (
          <motion.div
            key="found"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-blue-600 shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-blue-950">Certificate Found & Verified</h4>
                  <p className="text-xs text-blue-700">Matched record for {foundCertificate.name}</p>
                </div>
              </div>
            </div>

            <CertificatePreview certificate={foundCertificate} onDownload={handleDownload} />
          </motion.div>
        )}

        {!searching && hasSearched && !foundCertificate && (
          <motion.div
            key="notfound"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white border border-red-200 rounded-3xl p-6 sm:p-8 text-center space-y-4 max-w-xl mx-auto shadow-xl shadow-red-500/5"
          >
            <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900">No Registration Found</h3>
              <p className="text-slate-700 text-sm sm:text-base leading-relaxed max-w-md mx-auto">
                We couldn't find any event registration associated with this{" "}
                <span className="font-bold font-mono text-red-700 bg-red-50 px-2 py-0.5 rounded-lg border border-red-200 inline-block my-1">{searchQuery}</span>
                . It looks like you have not registered for this event.
              </p>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed pt-2 border-t border-slate-100">
                Please check the email address used during registration or contact the event organizer for assistance.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Certificate Correction Help Desk Section */}
      <CertificateCorrectionSection />

      {/* Bottom Sponsor Section */}
      <div className="pt-8 pb-4 border-t border-slate-200/80 flex flex-col items-center justify-center gap-3">
        <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">Official Sponsor & Partner</span>
        <img
          src="/assests/Sponsor2.png"
          alt="Sponsor Logo"
          className="max-h-24 sm:max-h-32 w-auto object-contain drop-shadow-sm transition-transform hover:scale-105"
        />
      </div>
    </div>
  );
};
