"use client";

import React, { useState } from "react";
import { Mail, PhoneCall, Copy, Check, Sparkles, HelpCircle, FileCheck, ShieldAlert, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

export const CertificateCorrectionSection: React.FC = () => {
  const [copiedField, setCopiedField] = useState<"email" | "phone" | null>(null);

  const email = "iqacevents@uumail.in";
  const phone = "+91 7055452916";
  const rawPhone = "+917055452916";

  const handleCopy = (text: string, field: "email" | "phone") => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2500);
  };

  return (
    <section className="w-full my-8 relative" id="certificate-corrections">
      {/* Background Decorative Elements */}
      <div className="absolute -top-6 -left-6 w-40 h-40 bg-orange-400/15 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-6 -right-6 w-40 h-40 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />

      {/* Main Container Card */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/60 to-orange-50/40 p-6 sm:p-8 md:p-10 shadow-xl shadow-slate-200/50 backdrop-blur-md">
        
        {/* Accent Top Border Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-amber-500 to-blue-600" />

        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Header Area */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100/80 text-orange-900 border border-orange-200/80 text-xs font-bold tracking-wide uppercase shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-orange-600 animate-pulse" />
              <span>Himalayan Bodh 2026 • Helpdesk</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Need Corrections in your <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-600 to-blue-600">Certificate?</span>
            </h2>

            <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              If you notice any error in your name, designation, institution, or spelling on the 
              <strong className="text-slate-800 font-semibold"> 3rd All India IQAC Workshop 2026 </strong> 
              certificate, please reach out to our dedicated support team directly.
            </p>
          </div>

          {/* Contact Action Cards (Email & Phone Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            
            {/* Email Contact Card */}
            <motion.div 
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
              className="group relative bg-white border border-slate-200/90 hover:border-orange-300 rounded-2xl p-5 sm:p-6 shadow-md hover:shadow-xl hover:shadow-orange-500/10 transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Mail className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-100 text-slate-600">
                    Email Support
                  </span>
                </div>

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Direct Email</h3>
                  <a 
                    href={`mailto:${email}?subject=Certificate Correction - Himalayan Bodh Workshop 2026`}
                    className="text-lg sm:text-xl font-bold text-slate-900 hover:text-orange-600 transition-colors flex items-center gap-1.5 break-all mt-1"
                  >
                    <span>{email}</span>
                    <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-orange-600" />
                  </a>
                  <p className="text-xs text-slate-500 mt-1">
                    Send your request with your registered phone number & corrected details.
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-2">
                <a
                  href={`mailto:${email}?subject=Certificate Correction Request - Himalayan Bodh 2026`}
                  className="flex-1 text-center py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs transition-colors shadow-sm"
                >
                  Compose Email
                </a>
                <button
                  onClick={() => handleCopy(email, "email")}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                  title="Copy email address"
                >
                  {copiedField === "email" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>

            {/* Phone Contact Card */}
            <motion.div 
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
              className="group relative bg-white border border-slate-200/90 hover:border-blue-300 rounded-2xl p-5 sm:p-6 shadow-md hover:shadow-xl hover:shadow-blue-500/10 transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <PhoneCall className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-100 text-slate-600">
                    Helpline Call
                  </span>
                </div>

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Phone Helpline</h3>
                  <a 
                    href={`tel:${rawPhone}`}
                    className="text-lg sm:text-xl font-bold text-slate-900 hover:text-blue-600 transition-colors flex items-center gap-1.5 mt-1"
                  >
                    <span>{phone}</span>
                    <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-blue-600" />
                  </a>
                  <p className="text-xs text-slate-500 mt-1">
                    Call our support helpline during workshop assistance hours for urgent edits.
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-2">
                <a
                  href={`tel:${rawPhone}`}
                  className="flex-1 text-center py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-sm"
                >
                  Call Now
                </a>
                <button
                  onClick={() => handleCopy(phone, "phone")}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                  title="Copy phone number"
                >
                  {copiedField === "phone" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>

          </div>

          {/* Useful Guidelines Footer Note */}
          <div className="bg-slate-100/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5 text-xs text-slate-600 flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <p className="font-semibold text-slate-800">Quick Tip for Faster Certificate Re-issuance:</p>
                <p className="text-slate-500">Include your <strong>Registered Phone Number or Email</strong>, <strong>Full Correct Name</strong>, <strong>Institution Details</strong>, and <strong>Certificate ID</strong> (if visible) in your message.</p>
              </div>
            </div>
            
            <div className="shrink-0 text-slate-400 font-medium text-[11px]">
              IQAC Event Desk 2026
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
