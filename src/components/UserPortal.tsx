"use client";

import React, { useState, useEffect } from "react";
import { CertificateRecord } from "@/lib/types";
import {
  fetchCertificatesFromApi,
  findCertificateByPhoneApi,
  incrementCertificateDownloadApi,
  recordLookupEvent,
  INITIAL_CERTIFICATES,
} from "@/lib/store";
import { CertificatePreview } from "./CertificatePreview";
import { useToast } from "./Toast";
import {
  Search,
  PhoneCall,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const UserPortal: React.FC = () => {
  const { showToast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [searching, setSearching] = useState(false);
  const [foundCertificate, setFoundCertificate] = useState<CertificateRecord | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [records, setRecords] = useState<CertificateRecord[]>(INITIAL_CERTIFICATES);

  useEffect(() => {
    fetchCertificatesFromApi().then((data) => {
      if (data && Array.isArray(data.certificates) && data.certificates.length > 0) {
        setRecords(data.certificates);
      }
    }).catch(() => {});
  }, []);

  // Check URL parameters for direct phone search (e.g. ?phone=7018321825)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const phoneParam = params.get("phone");
      if (phoneParam) {
        setPhoneNumber(phoneParam);
        handleSearch(phoneParam);
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
        colors: ["#059669", "#10b981", "#34d399", "#047857"],
      });
    } catch {
      // Fallback if confetti is blocked
    }
  };

  const handleSearch = async (phoneToSearch?: string) => {
    const target = phoneToSearch !== undefined ? phoneToSearch : phoneNumber;
    if (!target.trim()) {
      showToast("Phone Required", "Please enter your registered phone number to search.", "error");
      return;
    }

    setSearching(true);
    setHasSearched(true);
    recordLookupEvent();

    try {
      const match = await findCertificateByPhoneApi(target);
      setSearching(false);

      if (match) {
        setFoundCertificate(match);
        showToast("Certificate Found!", `Verified credential for ${match.name}`, "success");
        triggerConfetti();
      } else {
        setFoundCertificate(null);
        showToast("No Record Found", "No certificate found associated with this phone number.", "error");
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
      setRecords(updated);
      const refreshed = updated.find((c) => c.id === foundCertificate.id);
      if (refreshed) {
        setFoundCertificate(refreshed);
      }
    }
  };

  const handleQuickChip = (phone: string) => {
    setPhoneNumber(phone);
    handleSearch(phone);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 pt-4 sm:pt-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Official Certificate Verification Portal</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Retrieve Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700">Verified Certificate</span>
        </h1>

        <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          Enter your registered phone number to preview and download your official credential instantly.
        </p>
      </div>

      {/* Search Bar Card */}
      <div className="bg-white border border-slate-200/90 p-4 sm:p-6 rounded-3xl shadow-xl shadow-emerald-950/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

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
                <PhoneCall className="w-5 h-5 text-emerald-600" />
              </div>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter your phone number (e.g. 7018321825)"
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 text-base sm:text-lg transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={searching}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-base shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-70 shrink-0 cursor-pointer"
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

          {/* Quick Test Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <span className="text-xs text-slate-500 font-medium">Quick Test Numbers:</span>
            {(records.length > 0 ? records : INITIAL_CERTIFICATES).slice(0, 4).map((rec) => (
              <button
                key={rec.id}
                type="button"
                onClick={() => handleQuickChip(rec.phone)}
                className="text-xs px-3 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 border border-emerald-200 transition-all font-mono cursor-pointer font-medium"
              >
                {rec.phone} ({rec.name})
              </button>
            ))}
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
            <div className="w-16 h-16 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin mx-auto" />
            <p className="text-slate-600 font-medium text-sm">Searching registry for matching phone record...</p>
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
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-emerald-900">Certificate Found & Verified</h4>
                  <p className="text-xs text-emerald-700">Matched record for {foundCertificate.name}</p>
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
            className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-4 max-w-lg mx-auto shadow-lg"
          >
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">No Certificate Found</h3>
              <p className="text-slate-600 text-sm mt-1">
                We couldn't find any certificate linked with <span className="text-slate-900 font-mono font-bold">{phoneNumber}</span>.
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-600 text-left space-y-2 border border-slate-200">
              <p className="font-semibold text-slate-800">Troubleshooting Tips:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Ensure the phone number matches your registered number.</li>
                <li>Try searching with or without country code.</li>
                <li>Contact your organization administrator to add your record.</li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
