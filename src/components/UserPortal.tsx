"use client";

import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { CertificateRecord } from "@/lib/types";
import {
  fetchCertificatesFromApi,
  findCertificateByPhoneApi,
  incrementCertificateDownloadApi,
  recordLookupEvent,
  getStoredCertificates,
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
  const [records, setRecords] = useState<CertificateRecord[]>([]);

  useEffect(() => {
    fetchCertificatesFromApi().then((data) => {
      setRecords(data.certificates);
    });
  }, []);

  // Check URL parameters for direct phone search (e.g. ?phone=+19876543210)
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

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 85,
        spread: 75,
        origin: { y: 0.6 },
        colors: ["#6366f1", "#10b981", "#f59e0b", "#ec4899"],
      });
    } catch {
      // Fallback
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
    } catch {
      setSearching(false);
      setFoundCertificate(null);
      showToast("Search Error", "An error occurred while querying records.", "error");
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
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-medium backdrop-blur-md"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Official Certificate Verification Portal</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight"
        >
          Retrieve Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Verified Certificate</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed"
        >
          Enter your registered phone number to preview and download your official credential instantly.
        </motion.p>
      </div>

      {/* Search Bar Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.25 }}
        className="bg-slate-900/80 border border-slate-800 p-4 sm:p-6 rounded-3xl shadow-2xl backdrop-blur-xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="space-y-4"
        >
          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                <PhoneCall className="w-5 h-5 text-indigo-400" />
              </div>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter your phone number (e.g. +1 9876543210)"
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-base sm:text-lg transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={searching}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-base shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-70 shrink-0 cursor-pointer"
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

          {/* Quick Demo Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60">
            <span className="text-xs text-slate-400 font-medium">Quick Demo Test Numbers:</span>
            {records.slice(0, 3).map((rec) => (
              <button
                key={rec.id}
                type="button"
                onClick={() => handleQuickChip(rec.phone)}
                className="text-xs px-3 py-1 rounded-full bg-slate-800/80 hover:bg-indigo-600/30 text-indigo-300 border border-slate-700/60 hover:border-indigo-500/50 transition-all font-mono cursor-pointer"
              >
                {rec.phone} ({rec.name})
              </button>
            ))}
          </div>
        </form>
      </motion.div>

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
            <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin mx-auto" />
            <p className="text-slate-300 font-medium text-sm">Searching SQLite database for matching phone record...</p>
          </motion.div>
        )}

        {!searching && hasSearched && foundCertificate && (
          <motion.div
            key="found"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-emerald-300">Certificate Found & Verified</h4>
                  <p className="text-xs text-emerald-400/80">Matched database record for {foundCertificate.name}</p>
                </div>
              </div>
            </div>

            <CertificatePreview certificate={foundCertificate} onDownload={handleDownload} />
          </motion.div>
        )}

        {!searching && hasSearched && !foundCertificate && (
          <motion.div
            key="notfound"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 text-center space-y-4 max-w-lg mx-auto"
          >
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">No Certificate Found</h3>
              <p className="text-slate-400 text-sm mt-1">
                We couldn't find any certificate linked with <span className="text-slate-200 font-mono font-semibold">{phoneNumber}</span>.
              </p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl text-xs text-slate-400 text-left space-y-2 border border-slate-800">
              <p className="font-semibold text-slate-300">Troubleshooting Tips:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Double check country codes (e.g. +1, +91).</li>
                <li>Ensure the phone number matches the one registered during enrollment.</li>
                <li>Ask your admin to upload your details in the Admin Dashboard.</li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
