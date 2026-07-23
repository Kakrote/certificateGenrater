"use client";

import React from "react";
import { Navbar } from "@/components/Navbar";
import { UserPortal } from "@/components/UserPortal";
import { ToastProvider } from "@/components/Toast";
import { ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white relative overflow-x-hidden">
        {/* Ambient Background Blur Gradients (Emerald & Mint) */}
        <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-300/20 rounded-full blur-[140px] pointer-events-none" />
        <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-300/20 rounded-full blur-[140px] pointer-events-none" />
        <div className="fixed top-[40%] right-[20%] w-[400px] h-[400px] bg-emerald-200/30 rounded-full blur-[160px] pointer-events-none" />

        {/* Top Header */}
        <Navbar />

        {/* Main User Portal Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 z-10">
          <UserPortal />
        </main>

        {/* Public Footer */}
        <footer className="w-full border-t border-emerald-100 bg-white/80 py-6 z-10 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>CertiPulse &copy; 2026 — Verified Certificate Distribution System</span>
            </div>
            <span className="text-[11px] text-slate-400">Official Student & Participant Portal</span>
          </div>
        </footer>
      </div>
    </ToastProvider>
  );
}
