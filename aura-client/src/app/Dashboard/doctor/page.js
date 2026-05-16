"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Bell, 
  Stethoscope, 
  BarChart2, 
  AlertCircle,
  LogOut
} from 'lucide-react';

const DoctorDashboard = () => {
  const router = useRouter();

  const handleSignOut = () => {
    localStorage.removeItem('user');
    // Change this to '/Signup' if your main auth page is there
    router.push('/Login'); 
  };

  // Mock Data for Patients
  const patients = [
    {
      id: 9281,
      name: "Yaween De Silva",
      routines: 3,
      lastAnomaly: "2h ago",
      score: 94,
      status: "healthy", // for color logic
      bgGradient: "from-blue-500 to-purple-600"
    },
    {
      id: 8821,
      name: "Alice V.",
      routines: 2,
      lastAnomaly: "10m ago",
      score: 78,
      status: "critical",
      bgGradient: "from-orange-500 to-red-600"
    },
    {
      id: 7743,
      name: "Robert K.",
      routines: 4,
      lastAnomaly: "1d ago",
      score: 88,
      status: "warning",
      bgGradient: "from-emerald-500 to-teal-600"
    },
    {
      id: 5521,
      name: "Elena M.",
      routines: 6,
      lastAnomaly: "5h ago",
      score: 91,
      status: "healthy",
      bgGradient: "from-indigo-500 to-blue-500"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden bg-[#050505] text-white font-sans">
      
      {/* NAV */}
      <nav className="border-b border-white/10 bg-[#050505]/50 backdrop-blur-md sticky top-0 z-40">
        <div className="w-full px-6 md:px-12 h-20 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold tracking-tighter">AURA<span className="text-violet-500">.</span></span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-900/30 border border-emerald-500/30 font-mono text-emerald-400">CLINICIAN</span>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="hidden md:flex gap-6 text-sm font-bold">
              <Link href="#" className="text-white">My Patients</Link>
              <Link href="/Search" className="text-zinc-400 hover:text-white transition-colors">Find Patient</Link>
            </div>

            <div className="w-px h-8 bg-white/10 hidden md:block"></div>

            <div className="flex items-center gap-4">
              <Link href="/Notifications/doctor" className="relative group">
                <Bell className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-violet-500 rounded-full"></span>
              </Link>
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                <Stethoscope className="w-5 h-5 text-zinc-400" />
              </div>
              
              {/* NEW SIGN OUT BUTTON */}
              <button 
                onClick={handleSignOut} 
                className="w-10 h-10 ml-2 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 hover:bg-red-500/20 transition-all group"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4 text-red-400 group-hover:text-red-300 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="flex-1 w-full px-6 md:px-12 py-10">
        <h1 className="text-3xl font-bold mb-2">Active Patients</h1>
        <p className="text-zinc-400 text-sm mb-10">Monitoring {patients.length} individuals.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          
          {patients.map((patient) => (
            <div 
              key={patient.id} 
              className={`glass-panel p-6 rounded-3xl group transition-all relative overflow-hidden border border-white/5 hover:border-opacity-50 ${
                patient.status === 'critical' ? 'hover:border-red-500' : 'hover:border-violet-500'
              }`}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${patient.bgGradient}`}></div>
                  <div>
                    <h3 className="text-lg font-bold">{patient.name}</h3>
                    <div className="text-[10px] font-mono text-zinc-500">ID: #{patient.id}</div>
                  </div>
                </div>
                {patient.status === 'critical' ? (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                )}
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Routines</span>
                  <span className="font-bold">{patient.routines} Active</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Last Anomaly</span>
                  <span className={`${patient.status === 'critical' ? 'text-red-400' : 'text-zinc-300'} font-mono text-xs`}>
                    {patient.lastAnomaly}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Avg Score</span>
                  <span className={`${patient.score < 80 ? 'text-yellow-400' : 'text-emerald-400'} font-bold`}>
                    {patient.score}%
                  </span>
                </div>
              </div>

              <Link 
                href={`/Analytics/doctor`} 
                className={`flex items-center justify-center gap-2 w-full py-3 bg-white/5 rounded-xl transition-all text-sm font-bold border border-white/5 ${
                  patient.status === 'critical' 
                  ? 'hover:bg-red-600 hover:text-white' 
                  : 'hover:bg-violet-600 hover:text-white'
                }`}
              >
                {patient.status === 'critical' ? (
                  <><AlertCircle className="w-4 h-4" /> Investigate</>
                ) : (
                  <><BarChart2 className="w-4 h-4" /> See Analytics</>
                )}
              </Link>
            </div>
          ))}

        </div>
      </main>
    </div>
  );
};

export default DoctorDashboard;