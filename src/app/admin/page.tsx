"use client";

import React from "react";
import { AdminDashboard } from "@/components/AdminDashboard";
import { ToastProvider } from "@/components/Toast";
import { ShieldCheck, Award, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
        {/* Background Gradients */}
        <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

        {/* Dedicated Admin Header */}
        <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Award className="w-4 h-4 text-indigo-400" />
                </div>
              </div>
              <div>
                <span className="font-extrabold text-base text-white tracking-tight">CertiPulse Admin</span>
                <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                  Management Console
                </span>
              </div>
            </div>

            <Link
              href="/"
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              User Portal
            </Link>
          </div>
        </header>

        {/* Main Admin Console */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 z-10">
          <AdminDashboard />
        </main>

        {/* Footer */}
        <footer className="w-full border-t border-slate-800/80 bg-slate-950/80 py-6 z-10 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>CertiPulse Admin Console &copy; 2026 — Authorized Personnel Only</span>
            </div>
          </div>
        </footer>
      </div>
    </ToastProvider>
  );
}
