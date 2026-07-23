import React from "react";
import { AdminDashboard } from "@/components/AdminDashboard";
import { ToastProvider } from "@/components/Toast";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AdminPage() {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white relative overflow-x-hidden">
        {/* Background Gradients */}
        <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-300/20 rounded-full blur-[140px] pointer-events-none" />
        <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-300/20 rounded-full blur-[140px] pointer-events-none" />

        {/* Dedicated Admin Header */}
        <header className="sticky top-0 z-40 w-full border-b border-emerald-100 bg-white/90 backdrop-blur-xl shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 flex items-center justify-center p-1 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                <img
                  src="/logos/pragarti.png"
                  alt="CertiPulse Logo"
                  className="h-10 w-auto object-contain"
                />
              </div>
              <div>
                <span className="font-extrabold text-lg text-slate-900 tracking-tight">CertiPulse Admin</span>
                <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                  Management Console
                </span>
              </div>
            </div>

            <Link
              href="/"
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
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
        <footer className="w-full border-t border-emerald-100 bg-white/80 py-6 z-10 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>CertiPulse Admin Console &copy; 2026 — Authorized Personnel Only</span>
            </div>
          </div>
        </footer>
      </div>
    </ToastProvider>
  );
}
