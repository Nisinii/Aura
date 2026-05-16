"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, FileText, Filter, Loader2 } from 'lucide-react';
// NEW IMPORTS FOR PDF GENERATION
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const ClinicianAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [data, setData] = useState({
    patient: { name: "Loading...", id: "...", age: "-", diagnosis: "-" },
    kpi: { adherence_rate: 0, cognitive_load: "-", critical_errors: 0, active_routines: 0 },
    history: []
  });

  useEffect(() => {
    const fetchClinicalData = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/clinician/analytics');
        const result = await response.json();
        
        if (response.ok) {
            setData(result);
        } else {
            console.error("Failed to fetch:", result.detail);
        }
      } catch (error) {
        console.error("Error fetching clinician analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClinicalData();
  }, []);

  // --- CORRECTED: PDF GENERATION LOGIC ---
  const generatePDF = () => {
    setIsExporting(true);
    
    // Create a new PDF document (A4 size)
    const doc = new jsPDF();
    
    // 1. Add Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(124, 58, 237); // Brand Violet
    doc.text("AURA Clinical Progress Report", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
    doc.line(14, 32, 196, 32); // Horizontal line

    // 2. Add Patient Details
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Patient Information", 14, 42);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${data.patient.name}`, 14, 50);
    doc.text(`ID: #${data.patient.id}`, 14, 56);
    doc.text(`Age: ${data.patient.age}`, 14, 62);
    doc.text(`Diagnosis: ${data.patient.diagnosis}`, 14, 68);

    // 3. Add KPI Summary
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Clinical KPIs", 14, 82);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Adherence Rate: ${data.kpi.adherence_rate}%`, 14, 90);
    doc.text(`Cognitive Load Estimate: ${data.kpi.cognitive_load}`, 14, 96);
    doc.text(`Critical Errors Logged: ${data.kpi.critical_errors}`, 14, 102);
    doc.text(`Active Monitored Routines: ${data.kpi.active_routines}`, 14, 108);

    // 4. Add Session History Table
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Recent Session History", 14, 122);

    // Map the history data
    const tableColumn = ["Date & Time", "Routine", "Status", "Errors"];
    const tableRows = data.history.map(log => [
        log.timestamp,
        log.task,
        log.result,
        log.errors
    ]);

    // THE FIX: Call autoTable directly and pass 'doc' as the first argument
    autoTable(doc, {
        startY: 128,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [124, 58, 237] }, // Brand violet header
        styles: { fontSize: 10 },
        alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    // 5. Add Footer Notes
    const finalY = doc.lastAutoTable.finalY || 128;
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("This report is generated automatically by the AURA Assistive System.", 14, finalY + 15);
    doc.text("CONFIDENTIAL - FOR CLINICIAN USE ONLY", 14, finalY + 22);

    // Save the PDF
    const safeName = data.patient.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    doc.save(`AURA_Report_${safeName}.pdf`);
    
    setIsExporting(false);
  };

  const renderBadge = (result) => {
      if (result === "Success") {
          return <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] uppercase tracking-wider font-bold border border-emerald-500/20">Success</span>;
      }
      if (result === "Critical") {
          return <span className="px-2 py-1 rounded bg-red-500/10 text-red-400 text-[10px] uppercase tracking-wider font-bold border border-red-500/20">Critical</span>;
      }
      return <span className="px-2 py-1 rounded bg-yellow-500/10 text-yellow-400 text-[10px] uppercase tracking-wider font-bold border border-yellow-500/20">Anomaly</span>;
  };

  if (loading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-[#050505] text-violet-500">
              <Loader2 className="w-10 h-10 animate-spin" />
          </div>
      );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden bg-[#050505] text-white font-sans selection:bg-violet-500 selection:text-white">
      
      {/* --- NAV --- */}
      <nav className="border-b border-white/10 bg-[#050505]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="w-full px-6 md:px-12 h-20 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tighter">AURA<span className="text-violet-500">.</span></span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 border border-emerald-500/20 font-mono text-emerald-400 uppercase tracking-widest font-bold">
              Clinician View
            </span>
          </div>
          
          <Link href="/Dashboard/doctor" className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Return to Patient List
          </Link>
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 w-full px-6 md:px-12 py-10">
        
        {/* Patient Profile Header */}
        <div className="glass-panel p-8 rounded-3xl mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 border-2 border-white/10 shadow-2xl"></div>
            <div>
              <h1 className="text-3xl font-bold mb-1 capitalize">{data.patient.name}</h1>
              <div className="flex gap-4 text-xs font-mono text-zinc-400">
                <span>ID: #{data.patient.id}</span>
                <span>•</span>
                <span>Age: {data.patient.age}</span>
                <span>•</span>
                <span className="text-zinc-300">Diagnosis: {data.patient.diagnosis}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm font-bold flex items-center gap-2 transition-all">
              <MessageSquare className="w-4 h-4" /> Message
            </button>
            {/* EXPORT PDF BUTTON */}
            <button 
                onClick={generatePDF}
                disabled={isExporting}
                className="px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] border border-violet-500/50 disabled:opacity-50"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} 
              {isExporting ? 'Generating...' : 'Export Medical Report'}
            </button>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-emerald-500 border-y border-r border-white/5 bg-white/[0.02]">
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest block mb-2">Adherence Rate</span>
            <div className="text-3xl font-bold">{data.kpi.adherence_rate}%</div>
            <div className="text-xs text-emerald-400 mt-1">Overall Compliance</div>
          </div>
          
          <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-yellow-500 border-y border-r border-white/5 bg-white/[0.02]">
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest block mb-2">Cognitive Load</span>
            <div className="text-3xl font-bold">{data.kpi.cognitive_load}</div>
            <div className="text-xs text-zinc-400 mt-1">Based on execution scores</div>
          </div>
          
          <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-red-500 bg-red-500/5 border-y border-r border-white/5">
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest block mb-2">Critical Errors</span>
            <div className="text-3xl font-bold text-red-400">{data.kpi.critical_errors}</div>
            <div className="text-xs text-red-400/70 mt-1">Requires Attention</div>
          </div>
          
          <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-violet-500 border-y border-r border-white/5 bg-white/[0.02]">
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest block mb-2">Active Routines</span>
            <div className="text-3xl font-bold">{data.kpi.active_routines}</div>
            <div className="text-xs text-zinc-400 mt-1">Currently Monitored</div>
          </div>
        </div>

        {/* Main Dashboard Layout */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Table Column */}
          <div className="lg:col-span-2 glass-panel rounded-3xl overflow-hidden flex flex-col h-[600px] border border-white/5 bg-white/[0.02]">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
              <h2 className="text-lg font-bold">Session History Log</h2>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Filter tasks..." 
                  className="bg-black/50 border border-white/10 rounded-lg px-3 py-1 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition-colors"
                />
                <button className="p-1.5 bg-white/5 rounded-lg hover:bg-white/10 border border-white/5 transition-colors">
                  <Filter className="w-4 h-4 text-zinc-400" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto custom-scroll">
              <table className="w-full text-left text-sm text-zinc-400">
                <thead className="bg-white/5 text-xs uppercase font-mono text-zinc-500 sticky top-0 backdrop-blur-md z-10">
                  <tr>
                    <th className="px-6 py-4 font-bold tracking-widest">Timestamp</th>
                    <th className="px-6 py-4 font-bold tracking-widest">Routine Task</th>
                    <th className="px-6 py-4 font-bold tracking-widest">Result</th>
                    <th className="px-6 py-4 font-bold tracking-widest">Errors</th>
                    <th className="px-6 py-4 font-bold tracking-widest">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.history.length === 0 ? (
                      <tr>
                          <td colSpan="5" className="px-6 py-10 text-center text-zinc-600">No session history recorded yet.</td>
                      </tr>
                  ) : (
                      data.history.map((log, idx) => (
                          <tr key={idx} className="hover:bg-white/5 transition-colors group">
                            <td className="px-6 py-4 font-mono text-xs">{log.timestamp}</td>
                            <td className="px-6 py-4 text-white font-bold group-hover:text-violet-300 transition-colors">{log.task}</td>
                            <td className="px-6 py-4">
                              {renderBadge(log.result)}
                            </td>
                            <td className="px-6 py-4 text-xs">{log.errors}</td>
                            <td className="px-6 py-4">
                                <span className={log.result !== "Success" ? "text-violet-400 hover:text-violet-300 hover:underline cursor-pointer text-xs font-bold" : "text-zinc-600 text-xs font-medium cursor-not-allowed"}>
                                    {log.action}
                                </span>
                            </td>
                          </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes & Risk Assessment Column */}
          <div className="flex flex-col gap-6 h-[600px]">
            
            <div className="glass-panel p-6 rounded-3xl flex-1 flex flex-col border border-white/5 bg-white/[0.02]">
              <h2 className="text-lg font-bold mb-4">Clinical Notes</h2>
              <textarea 
                className="flex-1 w-full bg-black/30 border border-white/10 rounded-xl p-4 text-sm text-zinc-300 resize-none focus:outline-none focus:border-violet-500 transition-colors custom-scroll" 
                placeholder="Add observation notes here..."
              ></textarea>
              <button className="mt-4 w-full py-3 bg-white text-black font-bold rounded-xl text-sm hover:bg-zinc-200 transition-colors shadow-lg shadow-white/5">
                Save Entry
              </button>
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-white/[0.02]">
              <h2 className="text-lg font-bold mb-6">Risk Assessment Model</h2>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-zinc-400 font-mono uppercase tracking-wider">Routine Consistency</span>
                    <span className="text-emerald-400 font-bold uppercase tracking-wider">Stable</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-emerald-500 w-[85%] shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-zinc-400 font-mono uppercase tracking-wider">Forgetfulness Trend</span>
                    <span className="text-yellow-400 font-bold uppercase tracking-wider">Moderate Increase</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-yellow-500 w-[45%] shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-zinc-400 font-mono uppercase tracking-wider">Motor Skills</span>
                    <span className="text-emerald-400 font-bold uppercase tracking-wider">Good</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-emerald-500 w-[92%] shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
};

export default ClinicianAnalytics;