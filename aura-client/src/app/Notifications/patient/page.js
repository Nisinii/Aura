"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Stethoscope, CheckCircle } from 'lucide-react';

const PatientNotifications = () => {
  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden bg-[#050505] text-white font-sans">

      {/* --- NAV --- */}
      <nav className="border-b border-white/10 bg-[#050505]/50 backdrop-blur-md px-6 md:px-12 h-20 flex items-center sticky top-0 z-40">
        <Link 
          href="/Dashboard/patient" 
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> 
          <span className="font-medium">Back to Dashboard</span>
        </Link>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-8">Notifications</h1>

        <div className="space-y-4">
            
            {/* Notification 1: Doctor Request */}
            <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-l-4 border-l-violet-500 border border-white/5 bg-white/[0.02]">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center shrink-0">
                        <Stethoscope className="w-6 h-6 text-violet-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">New Assistance Request</h3>
                        <p className="text-zinc-400 text-sm mt-1">
                          <strong className="text-white">Dr. Sarah Connor</strong> requested to monitor your "Medication" routine.
                        </p>
                        <span className="text-xs text-zinc-500 font-mono mt-2 block">Received: 10 mins ago</span>
                    </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto mt-2 md:mt-0">
                    <button className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-bold text-zinc-300 transition-colors flex-1 md:flex-none">
                      Decline
                    </button>
                    <button className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm font-bold text-white shadow-[0_0_15px_rgba(124,58,237,0.4)] transition-all flex-1 md:flex-none">
                      Accept Access
                    </button>
                </div>
            </div>

            {/* Notification 2: System Alert */}
            <div className="glass-panel p-6 rounded-2xl flex items-start gap-4 opacity-75 hover:opacity-100 transition-opacity border border-white/5 bg-white/[0.02]">
                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Routine Optimized</h3>
                    <p className="text-zinc-400 text-sm mt-1">Your "Making Tea" model has finished retraining with 98% accuracy.</p>
                    <span className="text-xs text-zinc-500 font-mono mt-2 block">2 hours ago</span>
                </div>
            </div>

        </div>
      </main>
    </div>
  );
};

export default PatientNotifications;