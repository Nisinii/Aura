// "use client";

// import React, { useState, useEffect } from 'react';
// import Link from 'next/link';
// import { 
//   Activity, AlertTriangle, Layers, Crosshair, LayoutGrid, 
//   ArrowUpRight, Play, User as UserIcon
// } from 'lucide-react';

// const AnalyticsPage = () => {
//   const [user, setUser] = useState({ username: "John Doe", id: "9281" });
  
//   // Real Data State
//   const [stats, setStats] = useState({
//     score: 0,
//     anomalies: 0,
//     tasks_tracked: 0,
//     total_sessions: 0
//   });
//   const [incidents, setIncidents] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const storedUser = localStorage.getItem('user');
//     if (storedUser) {
//         try { setUser(JSON.parse(storedUser)); } catch (e) {}
//     }

//     // FETCH REAL ANALYTICS
//     const fetchAnalytics = async () => {
//         try {
//             const response = await fetch('http://localhost:8000/api/analytics');
//             const data = await response.json();
//             setStats(data.kpi);
//             setIncidents(data.incidents);
//             setLoading(false);
//         } catch (e) {
//             console.error("Analytics Error", e);
//         }
//     };

//     fetchAnalytics();
//   }, []);

//   return (
//     <div className="min-h-screen flex flex-col relative overflow-x-hidden bg-[#050505] text-white font-sans">

//       {/* --- NAV --- */}
//       <nav className="border-b border-white/10 bg-[#050505]/50 backdrop-blur-md sticky top-0 z-40">
//         <div className="w-full px-6 md:px-12 h-20 flex justify-between items-center">
//             <div className="flex items-center gap-2">
//                 <Link href="/Dashboard/patient" className="hover:opacity-70 transition-opacity">
//                     <span className="text-xl font-extrabold tracking-tighter">AURA<span className="text-violet-500">.</span></span>
//                 </Link>
//                 <span className="px-2 py-0.5 rounded text-[10px] bg-white/10 border border-white/10 font-mono text-zinc-400">ANALYTICS</span>
//             </div>

//             <div className="flex items-center gap-6">
//                 <Link 
//                   href="/Dashboard/patient" 
//                   className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 transition-all group"
//                 >
//                     <LayoutGrid className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
//                     <span className="text-sm font-bold text-white">Dashboard</span>
//                 </Link>
//                 <div className="w-px h-8 bg-white/10 hidden md:block"></div>
//                 <div className="flex items-center gap-4">
//                     <div className="hidden md:flex flex-col text-right">
//                         <span className="text-sm font-bold capitalize">{user.username}</span>
//                         <span className="text-xs text-zinc-500 font-mono">User_ID: #{user.id}</span>
//                     </div>
//                     <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-500 to-blue-600 border border-white/10 flex items-center justify-center">
//                         <UserIcon className="w-5 h-5 text-white/80" />
//                     </div>
//                 </div>
//             </div>
//         </div>
//       </nav>

//       {/* --- MAIN CONTENT --- */}
//       <main className="flex-1 w-full px-6 md:px-12 py-10">
        
//         {/* KPIs Grid */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
//             {/* Metric 1 */}
//             <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:bg-white/5 transition-colors border border-white/5">
//                 <div className="absolute -right-4 -top-4 w-24 h-24 bg-violet-500/10 rounded-full blur-xl group-hover:bg-violet-500/20 transition-colors"></div>
//                 <div className="flex justify-between items-start mb-4">
//                     <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Global Score</span>
//                     <Activity className="w-5 h-5 text-violet-500" />
//                 </div>
//                 <div className="text-4xl font-extrabold mb-1">{stats.score}%</div>
//                 <div className="text-xs text-emerald-400 flex items-center gap-1"><ArrowUpRight className="w-3 h-3" /> updated live</div>
//             </div>

//             {/* Metric 2 */}
//             <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:bg-white/5 transition-colors border border-white/5">
//                 <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/10 rounded-full blur-xl group-hover:bg-red-500/20 transition-colors"></div>
//                 <div className="flex justify-between items-start mb-4">
//                     <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Anomalies</span>
//                     <AlertTriangle className="w-5 h-5 text-red-400" />
//                 </div>
//                 <div className="text-4xl font-extrabold mb-1">{stats.anomalies}</div>
//                 <div className="text-xs text-zinc-500">Critical errors detected</div>
//             </div>

//             {/* Metric 3 */}
//             <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:bg-white/5 transition-colors border border-white/5">
//                 <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-colors"></div>
//                 <div className="flex justify-between items-start mb-4">
//                     <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Total Sessions</span>
//                     <Layers className="w-5 h-5 text-blue-400" />
//                 </div>
//                 <div className="text-4xl font-extrabold mb-1">{stats.total_sessions}</div>
//                 <div className="text-xs text-zinc-500">Across {stats.tasks_tracked} active tasks</div>
//             </div>

//             {/* Metric 4 */}
//             <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:bg-white/5 transition-colors border border-white/5">
//                 <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-colors"></div>
//                 <div className="flex justify-between items-start mb-4">
//                     <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Active Tasks</span>
//                     <Crosshair className="w-5 h-5 text-emerald-400" />
//                 </div>
//                 <div className="text-4xl font-extrabold mb-1">{stats.tasks_tracked}</div>
//                 <div className="text-xs text-zinc-500">Routines currently enrolled</div>
//             </div>
//         </div>

//         {/* Charts & Logs Grid */}
//         <div className="grid lg:grid-cols-3 gap-6">
            
//             {/* Chart Section (Static for now as requested) */}
//             <div className="lg:col-span-2 glass-panel p-8 rounded-3xl flex flex-col h-[400px] border border-white/5">
//                 <div className="flex justify-between items-center mb-8">
//                     <h2 className="text-xl font-bold">Performance History</h2>
//                     <select className="bg-black border border-white/10 rounded-lg text-xs px-3 py-1 text-zinc-400 focus:outline-none focus:border-violet-500">
//                         <option>Last 7 Days</option>
//                     </select>
//                 </div>
//                 <div className="flex-1 flex items-end justify-between gap-4 px-2">
//                     {[
//                         { day: "MON", height: "60%" }, { day: "TUE", height: "85%" }, { day: "WED", height: "40%" },
//                         { day: "THU", height: "95%" }, { day: "FRI", height: "70%" }, { day: "SAT", height: "50%" }, { day: "SUN", height: "80%" }
//                     ].map((item, index) => (
//                         <div key={index} className="w-full flex flex-col items-center gap-2 group cursor-pointer">
//                             <div className="w-full bg-violet-500/20 rounded-t-lg relative h-[200px] overflow-hidden">
//                                 <div className="absolute bottom-0 w-full bg-violet-500 transition-all duration-500 ease-out group-hover:bg-violet-400" style={{ height: item.height }}></div>
//                             </div>
//                             <span className="text-xs text-zinc-500 font-mono group-hover:text-white transition-colors">{item.day}</span>
//                         </div>
//                     ))}
//                 </div>
//             </div>

//             {/* Incident Log (Dynamic) */}
//             <div className="glass-panel p-8 rounded-3xl flex flex-col h-[400px] border border-white/5">
//                 <h2 className="text-xl font-bold mb-6">Recent Incidents</h2>
                
//                 <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scroll">
//                     {loading ? (
//                         <div className="text-center text-zinc-600 text-xs py-10">Loading history...</div>
//                     ) : incidents.length === 0 ? (
//                         <div className="text-center text-zinc-600 text-xs py-10">No recent anomalies detected.</div>
//                     ) : (
//                         incidents.map((inc, i) => (
//                             <div key={i} className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-red-500/30 transition-colors group cursor-pointer">
//                                 <div className="flex-shrink-0 mt-1">
//                                     <div className="w-2 h-2 rounded-full bg-red-500 group-hover:animate-pulse"></div>
//                                 </div>
//                                 <div className="flex-1">
//                                     <div className="flex justify-between items-start w-full gap-4">
//                                         <h4 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">{inc.task}</h4>
//                                         <span className="text-[10px] text-zinc-500 font-mono whitespace-nowrap">{new Date(inc.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
//                                     </div>
//                                     <p className="text-xs text-zinc-400 mt-1">{inc.detail}</p>
//                                 </div>
//                             </div>
//                         ))
//                     )}
//                 </div>
                
//                 <button className="w-full mt-4 py-3 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl text-xs font-bold transition-all border border-white/5">
//                     View Full Audit Log
//                 </button>
//             </div>

//         </div>

//         {/* Processed Sessions (Static Visuals) */}
//         <div className="mt-8">
//             <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6">Recent Sessions</h3>
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                 {[1,2,3].map((i) => (
//                     <div key={i} className="glass-panel p-5 rounded-2xl flex items-center gap-5 group cursor-pointer hover:bg-white/5 transition-all border border-white/5">
//                         <div className="w-20 h-14 bg-zinc-800 rounded-lg flex items-center justify-center relative overflow-hidden">
//                             <Play className="w-6 h-6 text-white z-10 fill-current" />
//                             <div className="absolute inset-0 bg-violet-500/20 group-hover:bg-violet-500/40 transition-colors"></div>
//                         </div>
//                         <div>
//                             <div className="text-sm font-bold text-white group-hover:text-violet-400 transition-colors">Session #{8820+i}</div>
//                             <div className="text-xs text-zinc-500 font-mono mt-1">Duration: 45s • Score: 98%</div>
//                         </div>
//                     </div>
//                 ))}
//             </div>
//         </div>

//       </main>
//     </div>
//   );
// };

// export default AnalyticsPage;

"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Activity, AlertTriangle, Layers, Crosshair, LayoutGrid, 
  ArrowUpRight, Play, User as UserIcon
} from 'lucide-react';

const AnalyticsPage = () => {
  const [user, setUser] = useState({ username: "Patient", user_id: "..." });
  
  // Real Data State
  const [stats, setStats] = useState({
    score: 0,
    anomalies: 0,
    tasks_tracked: 0,
    total_sessions: 0
  });
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Grab user data immediately
    let currentUser = { username: "Patient", user_id: "" };
    const storedUser = localStorage.getItem('user');
    
    if (storedUser) {
        try { 
            currentUser = JSON.parse(storedUser);
            setUser(currentUser); 
        } catch (e) { console.error("Error parsing user data", e); }
    }

    // 2. Fetch Personalized Analytics
    const fetchAnalytics = async () => {
        if (!currentUser.user_id) {
            setLoading(false);
            return; // Safety check
        }

        try {
            // --- CRITICAL CHANGE: Pass user_id as query parameter ---
            const response = await fetch(`http://localhost:8000/api/analytics?user_id=${currentUser.user_id}`);
            const data = await response.json();
            
            if (data.kpi) {
                setStats(data.kpi);
                setIncidents(data.incidents || []);
            }
            setLoading(false);
        } catch (e) {
            console.error("Analytics Error", e);
            setLoading(false);
        }
    };

    fetchAnalytics();
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden bg-[#050505] text-white font-sans">

      {/* --- NAV --- */}
      <nav className="border-b border-white/10 bg-[#050505]/50 backdrop-blur-md sticky top-0 z-40">
        <div className="w-full px-6 md:px-12 h-20 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <Link href="/Dashboard/patient" className="hover:opacity-70 transition-opacity">
                    <span className="text-xl font-extrabold tracking-tighter">AURA<span className="text-violet-500">.</span></span>
                </Link>
                <span className="px-2 py-0.5 rounded text-[10px] bg-white/10 border border-white/10 font-mono text-zinc-400">ANALYTICS</span>
            </div>

            <div className="flex items-center gap-6">
                <Link 
                  href="/Dashboard/patient" 
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 transition-all group"
                >
                    <LayoutGrid className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
                    <span className="text-sm font-bold text-white">Dashboard</span>
                </Link>
                <div className="w-px h-8 bg-white/10 hidden md:block"></div>
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex flex-col text-right">
                        <span className="text-sm font-bold capitalize">{user.username}</span>
                        {/* Show shortened ID for clean UI */}
                        <span className="text-xs text-zinc-500 font-mono">ID: #{user.user_id ? user.user_id.substring(0, 6) : "N/A"}</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-500 to-blue-600 border border-white/10 flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-white/80" />
                    </div>
                </div>
            </div>
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 w-full px-6 md:px-12 py-10">
        
        {/* KPIs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {/* Metric 1 */}
            <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:bg-white/5 transition-colors border border-white/5">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-violet-500/10 rounded-full blur-xl group-hover:bg-violet-500/20 transition-colors"></div>
                <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Global Score</span>
                    <Activity className="w-5 h-5 text-violet-500" />
                </div>
                <div className="text-4xl font-extrabold mb-1">{stats.score}%</div>
                <div className="text-xs text-emerald-400 flex items-center gap-1"><ArrowUpRight className="w-3 h-3" /> updated live</div>
            </div>

            {/* Metric 2 */}
            <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:bg-white/5 transition-colors border border-white/5">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/10 rounded-full blur-xl group-hover:bg-red-500/20 transition-colors"></div>
                <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Anomalies</span>
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div className="text-4xl font-extrabold mb-1">{stats.anomalies}</div>
                <div className="text-xs text-zinc-500">Critical errors detected</div>
            </div>

            {/* Metric 3 */}
            <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:bg-white/5 transition-colors border border-white/5">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-colors"></div>
                <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Total Sessions</span>
                    <Layers className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-4xl font-extrabold mb-1">{stats.total_sessions}</div>
                <div className="text-xs text-zinc-500">Across {stats.tasks_tracked} active tasks</div>
            </div>

            {/* Metric 4 */}
            <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:bg-white/5 transition-colors border border-white/5">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-colors"></div>
                <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Active Tasks</span>
                    <Crosshair className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="text-4xl font-extrabold mb-1">{stats.tasks_tracked}</div>
                <div className="text-xs text-zinc-500">Routines currently enrolled</div>
            </div>
        </div>

        {/* Charts & Logs Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
            
            {/* Chart Section (Static for now as requested) */}
            <div className="lg:col-span-2 glass-panel p-8 rounded-3xl flex flex-col h-[400px] border border-white/5">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-bold">Performance History</h2>
                    <select className="bg-black border border-white/10 rounded-lg text-xs px-3 py-1 text-zinc-400 focus:outline-none focus:border-violet-500">
                        <option>Last 7 Days</option>
                    </select>
                </div>
                <div className="flex-1 flex items-end justify-between gap-4 px-2">
                    {[
                        { day: "MON", height: "60%" }, { day: "TUE", height: "85%" }, { day: "WED", height: "40%" },
                        { day: "THU", height: "95%" }, { day: "FRI", height: "70%" }, { day: "SAT", height: "50%" }, { day: "SUN", height: "80%" }
                    ].map((item, index) => (
                        <div key={index} className="w-full flex flex-col items-center gap-2 group cursor-pointer">
                            <div className="w-full bg-violet-500/20 rounded-t-lg relative h-[200px] overflow-hidden">
                                <div className="absolute bottom-0 w-full bg-violet-500 transition-all duration-500 ease-out group-hover:bg-violet-400" style={{ height: item.height }}></div>
                            </div>
                            <span className="text-xs text-zinc-500 font-mono group-hover:text-white transition-colors">{item.day}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Incident Log (Dynamic) */}
            <div className="glass-panel p-8 rounded-3xl flex flex-col h-[400px] border border-white/5">
                <h2 className="text-xl font-bold mb-6">Recent Incidents</h2>
                
                <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scroll">
                    {loading ? (
                        <div className="text-center text-zinc-600 text-xs py-10 animate-pulse">Loading history...</div>
                    ) : incidents.length === 0 ? (
                        <div className="text-center text-zinc-600 text-xs py-10">No recent anomalies detected.</div>
                    ) : (
                        incidents.map((inc, i) => (
                            <div key={i} className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-red-500/30 transition-colors group cursor-pointer">
                                <div className="flex-shrink-0 mt-1">
                                    <div className="w-2 h-2 rounded-full bg-red-500 group-hover:animate-pulse"></div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start w-full gap-4">
                                        <h4 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">{inc.task}</h4>
                                        <span className="text-[10px] text-zinc-500 font-mono whitespace-nowrap">{new Date(inc.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                    <p className="text-xs text-zinc-400 mt-1">{inc.detail}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                
                <button className="w-full mt-4 py-3 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl text-xs font-bold transition-all border border-white/5">
                    View Full Audit Log
                </button>
            </div>

        </div>

        {/* Processed Sessions (Static Visuals) */}
        <div className="mt-8">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6">Recent Sessions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1,2,3].map((i) => (
                    <div key={i} className="glass-panel p-5 rounded-2xl flex items-center gap-5 group cursor-pointer hover:bg-white/5 transition-all border border-white/5">
                        <div className="w-20 h-14 bg-zinc-800 rounded-lg flex items-center justify-center relative overflow-hidden">
                            <Play className="w-6 h-6 text-white z-10 fill-current" />
                            <div className="absolute inset-0 bg-violet-500/20 group-hover:bg-violet-500/40 transition-colors"></div>
                        </div>
                        <div>
                            <div className="text-sm font-bold text-white group-hover:text-violet-400 transition-colors">Session #{8820+i}</div>
                            <div className="text-xs text-zinc-500 font-mono mt-1">Duration: 45s • Score: 98%</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

      </main>
    </div>
  );
};

export default AnalyticsPage;