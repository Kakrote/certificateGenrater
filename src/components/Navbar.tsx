"use client";

import React from "react";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";

export const Navbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-emerald-100 bg-white/90 backdrop-blur-xl shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="h-12 flex items-center justify-center p-1 rounded-2xl bg-white border border-slate-200/80 shadow-xs group-hover:scale-105 transition-transform">
            <img
              src="/logos/pragarti.png"
              alt="CertiPulse Logo"
              className="h-10 w-auto object-contain"
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl text-slate-900 tracking-tight">CertiPulse</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-widest">
                Official Portal
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Credential Verification & Download</p>
          </div>
        </Link>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 flex items-center gap-2 text-xs text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-mono text-emerald-700 font-semibold">Verified System</span>
          </div>
        </div>
      </div>
    </header>
  );
};
