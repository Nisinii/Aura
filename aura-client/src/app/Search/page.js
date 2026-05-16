"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, ArrowLeft } from 'lucide-react';

const FindPatient = () => {
  // 1. Mock Data for search results
  const mockPatients = [
    { id: '4421', name: 'Michael Scott', location: 'Colombo', color: 'bg-blue-600' },
    { id: '9912', name: 'Pam Beesly', location: 'Kandy', color: 'bg-emerald-600' },
    { id: '1184', name: 'Dwight Schrute', location: 'Galle', color: 'bg-yellow-600' },
    { id: '7732', name: 'Jim Halpert', location: 'Colombo', color: 'bg-violet-600' }
  ];

  // 2. Component State
  const [searchQuery, setSearchQuery] = useState("");
  const [requestedIds, setRequestedIds] = useState(new Set());

  // 3. Handlers
  const handleSendRequest = (id) => {
    setRequestedIds(prev => {
      const newSet = new Set(prev);
      newSet.add(id);
      return newSet;
    });
  };

  // Filter patients based on search input
  const filteredPatients = mockPatients.filter(patient => 
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    patient.id.includes(searchQuery)
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#050505] text-white font-sans selection:bg-violet-500 selection:text-white">
      
      {/* NAV */}
      <nav className="border-b border-white/10 bg-[#050505]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="w-full px-6 md:px-12 h-20 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold tracking-tighter">AURA<span className="text-violet-500">.</span></span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 border border-emerald-500/20 font-mono text-emerald-400 uppercase tracking-widest font-bold">
              Clinician
            </span>
          </div>
          
          <Link href="/Dashboard/doctor" className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center">Connect with a Patient</h1>
        
        {/* Search Bar */}
        <div className="relative mb-12">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search by Name or Patient ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white/5 border border-white/10 outline-none text-white text-lg placeholder-zinc-600 focus:border-violet-500 focus:bg-violet-500/5 transition-all shadow-lg"
          />
        </div>

        {/* Search Results */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">
            Search Results ({filteredPatients.length})
          </h3>

          {filteredPatients.length === 0 ? (
            <div className="text-center py-10 text-zinc-600">
              No patients found matching "{searchQuery}"
            </div>
          ) : (
            filteredPatients.map((patient) => {
              const isRequested = requestedIds.has(patient.id);

              return (
                <div 
                  key={patient.id} 
                  className="bg-white/[0.02] backdrop-blur-xl border border-white/5 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:bg-white/[0.04]"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full ${patient.color} shadow-lg`}></div>
                    <div>
                      <div className="font-bold text-lg">{patient.name}</div>
                      <div className="text-xs text-zinc-500 font-mono tracking-wide mt-0.5">
                        ID: #{patient.id} <span className="mx-2">•</span> Location: {patient.location}
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleSendRequest(patient.id)}
                    disabled={isRequested}
                    className={`w-full md:w-auto px-6 py-3 text-xs font-bold rounded-xl transition-all ${
                      isRequested 
                        ? 'bg-zinc-900 text-zinc-500 border border-white/5 cursor-not-allowed' 
                        : 'bg-white text-black hover:bg-violet-600 hover:text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(124,58,237,0.3)]'
                    }`}
                  >
                    {isRequested ? 'Request Sent' : 'Send Request'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
};

export default FindPatient;