"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, UserCheck, AlertTriangle } from 'lucide-react';

const DoctorNotifications = () => {
  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden bg-[#050505] text-white font-sans">

      {/* --- NAV --- */}
      <nav className="border-b border-white/10 bg-[#050505]/50 backdrop-blur-md px-6 md:px-12 h-20 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="text-xl font-extrabold tracking-tighter">
            AURA<span className="text-violet-500">.</span>
          </span>
        </div>
        <Link 
          href="/Dashboard/doctor" 
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> 
          <span className="font-medium">Back to Dashboard</span>
        </Link>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-8">Clinical Alerts</h1>

        <div className="space-y-4">
            
            {/* Notification 1: Request Accepted */}
            <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 border-l-4 border-l-emerald-500 border border-white/5 bg-white/[0.02]">
                <div className="w-10 h-10 rounded-full bg-emerald-900/30 flex items-center justify-center shrink-0">
                    <UserCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                    <h3 className="text-base font-bold text-white">Request Accepted</h3>
                    <p className="text-zinc-400 text-sm mt-0.5">Patient <strong className="text-white">John Doe</strong> accepted your monitoring request.</p>
                </div>
            </div>

            {/* Notification 2: Critical Anomaly */}
            <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 border-l-4 border-l-red-500 bg-red-900/5 border border-red-500/10">
                <div className="w-10 h-10 rounded-full bg-red-900/30 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                    <h3 className="text-base font-bold text-red-100">Critical Anomaly: Alice V.</h3>
                    <p className="text-red-200/60 text-sm mt-0.5">Dangerous sequence detected in "Insulin Injection". Please review analytics.</p>
                    {/* Assuming dynamic routing for doctor analytics, otherwise link to static page */}
                    <Link href="/doctor/analytics/8821" className="inline-block mt-2 text-xs font-bold text-red-400 hover:text-red-300 hover:underline transition-colors">
                        View Data -&gt;
                    </Link>
                </div>
            </div>

        </div>
      </main>
    </div>
  );
};

export default DoctorNotifications;