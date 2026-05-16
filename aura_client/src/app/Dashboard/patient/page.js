// "use client";

// import React, { useState, useEffect, useRef } from 'react';
// import Link from 'next/link';
// import { useRouter } from 'next/navigation';
// import { 
//   Bell, BarChart2, X, CheckCircle, Lock, 
//   Coffee, Activity, Utensils, Syringe, Droplets, Bandage, Bed, 
//   Clock, Trophy, Flame, User as UserIcon, Settings, LogOut, ChevronDown, Calendar,
//   Laptop, RotateCcw
// } from 'lucide-react';

// const ICON_MAP = {
//   "Coffee": Coffee,
//   "Activity": Activity,
//   "Utensils": Utensils,
//   "Laptop": Laptop,
//   "Droplets": Droplets,
//   "Bandage": Bandage,
//   "Bed": Bed 
// };

// const PatientDashboard = () => {
//   const router = useRouter();
//   const [selectedTask, setSelectedTask] = useState(null);
//   const [user, setUser] = useState({ username: "Patient", role: "patient" });
//   const [isDropdownOpen, setIsDropdownOpen] = useState(false);
//   const dropdownRef = useRef(null);

//   const [tasks, setTasks] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [greeting, setGreeting] = useState("Good Morning");
  
//   const [globalStats, setGlobalStats] = useState({ totalSessions: 0, globalAccuracy: 0 });
//   const [isResetting, setIsResetting] = useState(false); // Track reset loading state

//   useEffect(() => {
//     function handleClickOutside(event) {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//         setIsDropdownOpen(false);
//       }
//     }
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, [dropdownRef]);

//   useEffect(() => {
//     const storedData = localStorage.getItem('user');
//     if (storedData) setUser(JSON.parse(storedData));

//     const updateGreeting = () => {
//       const now = new Date();
//       const totalMinutes = now.getHours() * 60 + now.getMinutes();
//       if (totalMinutes < 720) setGreeting("Good Morning");
//       else if (totalMinutes < 990) setGreeting("Good Afternoon");
//       else setGreeting("Good Evening");
//     };
//     updateGreeting();

//     const fetchTasks = async () => {
//       try {
//         const response = await fetch('http://localhost:8000/tasks');
//         const data = await response.json();
//         setTasks(data);

//         let totalSess = 0;
//         let totalAccSum = 0;
//         let enrolledCount = 0;

//         data.forEach(t => {
//             totalSess += t.sessions;
//             if (t.status === 'enrolled') {
//                 totalAccSum += t.accuracy;
//                 enrolledCount++;
//             }
//         });

//         const avgGlobalAcc = enrolledCount > 0 ? Math.round(totalAccSum / enrolledCount) : 0;
//         setGlobalStats({ totalSessions: totalSess, globalAccuracy: avgGlobalAcc });
//         setLoading(false);
//       } catch (error) {
//         console.error("Failed to fetch tasks:", error);
//         setLoading(false);
//       }
//     };

//     fetchTasks();
//   }, []);

//   const handleSignOut = () => {
//     localStorage.removeItem('user');
//     router.push('/Signup');
//   };

//   // --- NEW: RE-ENROLL FUNCTION ---
//   const handleReEnroll = async (taskName) => {
//     setIsResetting(true);
//     try {
//         await fetch("http://localhost:8000/api/tasks/reset", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ task_name: taskName })
//         });
//         // Direct to training to establish the new baseline
//         router.push(`/Training?task=${encodeURIComponent(taskName)}`);
//     } catch (e) {
//         console.error("Reset Failed:", e);
//         setIsResetting(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex flex-col relative overflow-x-hidden bg-[#050505] text-white font-sans w-full">

//       {/* NAV */}
//       <nav className="border-b border-white/10 bg-[#050505]/50 backdrop-blur-md sticky top-0 z-40 w-full">
//         <div className="w-full px-6 md:px-12 h-20 flex justify-between items-center">
//           <div className="flex items-center gap-2">
//             <span className="text-xl font-extrabold tracking-tighter">AURA<span className="text-violet-500">.</span></span>
//             <span className="px-2 py-0.5 rounded text-[10px] bg-white/10 border border-white/10 font-mono text-zinc-400">
//               {user.role.toUpperCase()}
//             </span>
//           </div>

//           <div className="flex items-center gap-6">
//             <Link href="/Analytics/patient" className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full hover:bg-white/5 transition-colors text-sm font-bold text-zinc-400 hover:text-white">
//               <BarChart2 className="w-4 h-4" /> Analytics
//             </Link>

//             <Link href="/Notifications/patient" className="relative p-2 hover:bg-white/10 rounded-full transition-colors group">
//               <Bell className="w-5 h-5 text-zinc-400 group-hover:text-white" />
//               <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
//             </Link>

//             <div className="w-px h-8 bg-white/10 hidden md:block"></div>

//             <div className="relative" ref={dropdownRef}>
//               <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-4 hover:opacity-80 transition-opacity">
//                 <div className="hidden md:flex flex-col text-right">
//                   <span className="text-sm font-bold capitalize">{user.username}</span>
//                   <span className="text-[10px] text-zinc-500 font-mono uppercase">ID: 9281-A</span>
//                 </div>
//                 <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-500 to-blue-600 border border-white/10 ring-2 ring-black flex items-center justify-center">
//                    <UserIcon className="w-5 h-5 text-white/80" />
//                 </div>
//                 <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
//               </button>

//               {isDropdownOpen && (
//                 <div className="absolute right-0 mt-4 w-56 rounded-2xl border border-white/10 bg-[#0A0A0A] shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
//                   <div className="p-4 border-b border-white/5">
//                     <p className="text-sm font-bold text-white">{user.username}</p>
//                     <p className="text-xs text-zinc-500">{user.role}</p>
//                   </div>
//                   <div className="p-2">
//                     <Link href="/Settings/patient" className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
//                       <Settings className="w-4 h-4" /> Account Settings
//                     </Link>
//                     <button onClick={handleSignOut} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-left">
//                       <LogOut className="w-4 h-4" /> Sign Out
//                     </button>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </nav>

//       {/* MAIN CONTENT */}
//       <main className="flex-1 w-full px-6 md:px-12 py-10">
        
//         <div className="mb-12">
//           <h1 className="text-3xl md:text-4xl font-bold mb-6 capitalize">{greeting}, {user.username}.</h1>
          
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//             <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 border border-white/5 bg-white/[0.02]">
//               <div className="p-3 bg-violet-500/10 rounded-xl text-violet-400"><Trophy className="w-6 h-6" /></div>
//               <div>
//                   <div className="text-2xl font-bold">{globalStats.globalAccuracy}%</div>
//                   <div className="text-xs text-zinc-500 uppercase tracking-widest">Global Accuracy</div>
//               </div>
//             </div>
//             <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 border border-white/5 bg-white/[0.02]">
//               <div className="p-3 bg-orange-500/10 rounded-xl text-orange-400"><Flame className="w-6 h-6" /></div>
//               <div>
//                   <div className="text-2xl font-bold">0 Days</div>
//                   <div className="text-xs text-zinc-500 uppercase tracking-widest">Current Streak</div>
//               </div>
//             </div>
//             <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 border border-white/5 bg-white/[0.02]">
//               <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400"><Clock className="w-6 h-6" /></div>
//               <div>
//                   <div className="text-2xl font-bold">{globalStats.totalSessions}</div>
//                   <div className="text-xs text-zinc-500 uppercase tracking-widest">Total Sessions</div>
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-6 border-b border-white/10 pb-6">
//           <div><h2 className="text-2xl font-bold mb-1">My Routines</h2><p className="text-zinc-400 text-sm">Select a module to begin training or inference.</p></div>
//           <div className="flex gap-2 p-1 bg-white/5 rounded-full border border-white/5">
//             <button className="px-6 py-2 rounded-full bg-zinc-800 text-white font-bold text-xs shadow-lg">All</button>
//             <button className="px-6 py-2 rounded-full text-zinc-400 hover:text-white transition-colors text-xs font-medium">Enrolled</button>
//             <button className="px-6 py-2 rounded-full text-zinc-400 hover:text-white transition-colors text-xs font-medium">New</button>
//           </div>
//         </div>

//         {/* LOADING STATE */}
//         {loading && (
//           <div className="text-center py-20 text-zinc-500 animate-pulse">Loading Tasks from Database...</div>
//         )}

//         {/* TASKS GRID */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
//           {tasks.map((task) => {
//             const isEnrolled = task.status === 'enrolled';
//             const TaskIcon = ICON_MAP[task.icon_name] || Activity; 

//             return (
//               <div key={task.id} onClick={() => setSelectedTask({ ...task, Icon: TaskIcon })} className={`glass-panel rounded-3xl p-6 cursor-pointer transition-all duration-300 group relative overflow-hidden border hover:-translate-y-1 hover:shadow-2xl ${isEnrolled ? 'border-violet-500/30 hover:border-violet-500' : 'border-white/5 hover:border-zinc-600'}`}>
//                 <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${isEnrolled ? 'from-violet-600 to-blue-600' : 'from-zinc-500 to-zinc-700'}`}></div>
                
//                 <div className="relative z-10 flex justify-between items-start mb-6">
//                   <div className={`p-3.5 rounded-2xl border ${isEnrolled ? 'bg-violet-500/10 border-violet-500/20 text-violet-300' : 'bg-white/5 border-white/10 text-zinc-400'}`}>
//                     <TaskIcon className="w-6 h-6" />
//                   </div>
//                   {isEnrolled ? (<div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold tracking-wide"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> ACTIVE</div>) : (<div className="px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-500 text-[10px] font-bold tracking-wide">AVAILABLE</div>)}
//                 </div>
                
//                 <div className="relative z-10 mb-6">
//                   <h3 className="text-xl font-bold mb-1 tracking-tight text-white group-hover:text-violet-200 transition-colors">{task.title}</h3>
//                   <p className="text-xs text-zinc-500 font-mono">{task.steps.length} Steps • {task.sessions} Sessions</p>
//                 </div>

//                 <div className="relative z-10 pt-4 border-t border-white/5">
//                   {isEnrolled ? (
//                     <div className="space-y-3">
//                       <div className="flex justify-between text-xs font-bold">
//                         <span className="text-zinc-400">Accuracy</span>
//                         <span className={`${task.accuracy >= 90 ? 'text-emerald-400' : 'text-yellow-400'}`}>{task.accuracy.toFixed(0)}%</span>
//                       </div>
//                       <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
//                         <div className={`h-full rounded-full transition-all duration-1000 ${task.accuracy >= 90 ? 'bg-emerald-500' : 'bg-yellow-500'}`} style={{ width: `${task.accuracy}%` }}></div>
//                       </div>
//                       <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono mt-2"><Calendar className="w-3 h-3" /> Last: <span className="text-zinc-300">{task.last_accessed}</span></div>
//                     </div>
//                   ) : (
//                     <div className="flex justify-between items-center mt-2">
//                       <span className="text-xs text-zinc-500">Not started yet</span>
//                       <span className="text-xs font-bold text-white group-hover:translate-x-1 transition-transform">Start Training &rarr;</span>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </main>

//       {/* DRAWER */}
//       <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${selectedTask ? 'opacity-100 visible' : 'opacity-0 invisible'}`} onClick={() => setSelectedTask(null)}></div>
//       <div className={`fixed top-0 right-0 h-full w-full md:w-[500px] bg-[#0A0A0A] border-l border-white/10 z-50 transform transition-transform duration-300 shadow-2xl flex flex-col ${selectedTask ? 'translate-x-0' : 'translate-x-full'}`}>
//         {selectedTask && (
//           <>
//             <div className="p-8 border-b border-white/10 flex justify-between items-start bg-zinc-900/50">
//               <div><span className="text-xs font-mono text-violet-500 uppercase tracking-widest mb-1 block">Module Details</span><h2 className="text-3xl font-bold leading-none tracking-tight">{selectedTask.title}</h2></div>
//               <button onClick={() => setSelectedTask(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6" /></button>
//             </div>
//             <div className="flex-1 overflow-y-auto p-8">
//               <div className={`p-5 rounded-2xl border mb-8 flex items-center justify-between ${selectedTask.status === 'enrolled' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-zinc-700 bg-zinc-900'}`}>
//                 <div className="flex items-center gap-4">
//                   <div className={`p-3 rounded-xl ${selectedTask.status === 'enrolled' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>{selectedTask.status === 'enrolled' ? <CheckCircle className="w-6 h-6" /> : <Lock className="w-6 h-6" />}</div>
//                   <div><div className="text-sm font-bold text-white uppercase tracking-wide">Status</div><div className="text-sm text-zinc-400 font-mono">{selectedTask.status === 'enrolled' ? `Active • ${selectedTask.sessions} Sessions` : 'Not Enrolled'}</div></div>
//                 </div>
//               </div>
//               {selectedTask.status === 'enrolled' && (<div className="mb-8 p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center"><span className="text-sm text-zinc-400">Last Accessed</span><span className="text-sm font-mono font-bold text-white">{selectedTask.last_accessed}</span></div>)}
//               <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6 pb-2 border-b border-white/5">Step Sequence</h3>
//               <div className="space-y-0 relative pl-6 border-l border-white/10">
//                 {selectedTask.steps.map((step, idx) => (
//                   <div key={idx} className="mb-8 relative group">
//                     <div className={`absolute -left-[29px] top-1 w-4 h-4 rounded-full border-4 border-[#0A0A0A] transition-all duration-300 ${selectedTask.status === 'enrolled' ? 'bg-violet-500 shadow-[0_0_10px_rgba(124,58,237,0.5)] group-hover:scale-125' : 'bg-zinc-600'}`}></div>
//                     <h4 className="text-base font-bold text-white leading-none mb-1 group-hover:text-violet-400 transition-colors">{step}</h4>
//                     <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">Seq_ID_0{idx + 1}</span>
//                   </div>
//                 ))}
//               </div>
//             </div>
            
//             {/* UPDATED ACTION AREA */}
//             <div className="p-8 border-t border-white/10 bg-black">
//               {selectedTask.status === 'enrolled' ? (
//                 <div className="flex flex-col gap-3">
//                   <button 
//                     onClick={() => router.push(`/Simulator?task=${encodeURIComponent(selectedTask.title)}`)} 
//                     className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-violet-500 hover:text-white transition-all text-sm shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2"
//                   >
//                     <Activity className="w-4 h-4" /> Launch Simulator
//                   </button>
                  
//                   <button 
//                     onClick={() => handleReEnroll(selectedTask.title)}
//                     disabled={isResetting}
//                     className="w-full py-4 bg-zinc-900 text-zinc-400 font-bold rounded-xl hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50 transition-all text-sm border border-white/5 flex items-center justify-center gap-2"
//                   >
//                     <RotateCcw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} /> 
//                     {isResetting ? 'Resetting...' : 'Re-Enroll (Reset Progress)'}
//                   </button>
//                 </div>
//               ) : (
//                 <button 
//                   onClick={() => router.push(`/Training?task=${encodeURIComponent(selectedTask.title)}`)} 
//                   className="w-full py-4 bg-zinc-800 text-white font-bold rounded-xl hover:bg-violet-600 hover:text-white transition-all text-sm border border-zinc-700 flex items-center justify-center gap-2"
//                 >
//                   <Coffee className="w-4 h-4" /> Train Model (Enroll)
//                 </button>
//               )}
//             </div>
//           </>
//         )}
//       </div>

//     </div>
//   );
// };

// export default PatientDashboard;

"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Bell, BarChart2, X, CheckCircle, Lock, 
  Coffee, Activity, Utensils, Syringe, Droplets, Bandage, Bed, 
  Clock, Trophy, Flame, User as UserIcon, Settings, LogOut, ChevronDown, Calendar,
  Laptop, RotateCcw
} from 'lucide-react';

const ICON_MAP = {
  "Coffee": Coffee,
  "Activity": Activity,
  "Utensils": Utensils,
  "Laptop": Laptop,
  "Droplets": Droplets,
  "Bandage": Bandage,
  "Bed": Bed 
};

const PatientDashboard = () => {
  const router = useRouter();
  const [selectedTask, setSelectedTask] = useState(null);
  const [user, setUser] = useState({ username: "Patient", role: "patient", user_id: "" });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("Good Morning");
  
  const [globalStats, setGlobalStats] = useState({ totalSessions: 0, globalAccuracy: 0 });
  const [isResetting, setIsResetting] = useState(false); 

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  useEffect(() => {
    // 1. Grab user data immediately so we can use the ID for fetching
    const storedData = localStorage.getItem('user');
    let currentUser = { username: "Patient", role: "patient", user_id: "" };
    
    if (storedData) {
        currentUser = JSON.parse(storedData);
        setUser(currentUser);
    }

    const updateGreeting = () => {
      const now = new Date();
      const totalMinutes = now.getHours() * 60 + now.getMinutes();
      if (totalMinutes < 720) setGreeting("Good Morning");
      else if (totalMinutes < 990) setGreeting("Good Afternoon");
      else setGreeting("Good Evening");
    };
    updateGreeting();

    const fetchTasks = async () => {
      try {
        // --- CHANGE 1: Pass the user_id as a query parameter ---
        const response = await fetch(`http://localhost:8000/tasks?user_id=${currentUser.user_id}`);
        const data = await response.json();
        
        // Safety check in case backend returns an error object
        if (!Array.isArray(data)) {
            console.error("Backend error:", data);
            setLoading(false);
            return;
        }

        setTasks(data);

        let totalSess = 0;
        let totalAccSum = 0;
        let enrolledCount = 0;

        data.forEach(t => {
            totalSess += t.sessions;
            if (t.status === 'enrolled') {
                totalAccSum += t.accuracy;
                enrolledCount++;
            }
        });

        const avgGlobalAcc = enrolledCount > 0 ? Math.round(totalAccSum / enrolledCount) : 0;
        setGlobalStats({ totalSessions: totalSess, globalAccuracy: avgGlobalAcc });
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('user');
    router.push('/Signup');
  };

  const handleReEnroll = async (taskName) => {
    setIsResetting(true);
    try {
        // --- CHANGE 2: Include user_id in the JSON payload ---
        await fetch("http://localhost:8000/api/tasks/reset", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                user_id: user.user_id, 
                task_name: taskName 
            })
        });
        
        router.push(`/Training?task=${encodeURIComponent(taskName)}`);
    } catch (e) {
        console.error("Reset Failed:", e);
        setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden bg-[#050505] text-white font-sans w-full">

      {/* NAV */}
      <nav className="border-b border-white/10 bg-[#050505]/50 backdrop-blur-md sticky top-0 z-40 w-full">
        <div className="w-full px-6 md:px-12 h-20 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold tracking-tighter">AURA<span className="text-violet-500">.</span></span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-white/10 border border-white/10 font-mono text-zinc-400">
              {user.role.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/Analytics/patient" className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full hover:bg-white/5 transition-colors text-sm font-bold text-zinc-400 hover:text-white">
              <BarChart2 className="w-4 h-4" /> Analytics
            </Link>

            <Link href="/Notifications/patient" className="relative p-2 hover:bg-white/10 rounded-full transition-colors group">
              <Bell className="w-5 h-5 text-zinc-400 group-hover:text-white" />
              <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
            </Link>

            <div className="w-px h-8 bg-white/10 hidden md:block"></div>

            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-4 hover:opacity-80 transition-opacity">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-sm font-bold capitalize">{user.username}</span>
                  {/* Shortened ID for UI neatness */}
                  <span className="text-[10px] text-zinc-500 font-mono uppercase">ID: {user.user_id ? user.user_id.substring(0, 6) : "N/A"}</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-500 to-blue-600 border border-white/10 ring-2 ring-black flex items-center justify-center">
                   <UserIcon className="w-5 h-5 text-white/80" />
                </div>
                <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-4 w-56 rounded-2xl border border-white/10 bg-[#0A0A0A] shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="p-4 border-b border-white/5">
                    <p className="text-sm font-bold text-white">{user.username}</p>
                    <p className="text-xs text-zinc-500">{user.role}</p>
                  </div>
                  <div className="p-2">
                    <Link href="/Settings/patient" className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                      <Settings className="w-4 h-4" /> Account Settings
                    </Link>
                    <button onClick={handleSignOut} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-left">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="flex-1 w-full px-6 md:px-12 py-10">
        
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 capitalize">{greeting}, {user.username}.</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 border border-white/5 bg-white/[0.02]">
              <div className="p-3 bg-violet-500/10 rounded-xl text-violet-400"><Trophy className="w-6 h-6" /></div>
              <div>
                  <div className="text-2xl font-bold">{globalStats.globalAccuracy}%</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-widest">Global Accuracy</div>
              </div>
            </div>
            <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 border border-white/5 bg-white/[0.02]">
              <div className="p-3 bg-orange-500/10 rounded-xl text-orange-400"><Flame className="w-6 h-6" /></div>
              <div>
                  <div className="text-2xl font-bold">0 Days</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-widest">Current Streak</div>
              </div>
            </div>
            <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 border border-white/5 bg-white/[0.02]">
              <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400"><Clock className="w-6 h-6" /></div>
              <div>
                  <div className="text-2xl font-bold">{globalStats.totalSessions}</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-widest">Total Sessions</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-6 border-b border-white/10 pb-6">
          <div><h2 className="text-2xl font-bold mb-1">My Routines</h2><p className="text-zinc-400 text-sm">Select a module to begin training or inference.</p></div>
          <div className="flex gap-2 p-1 bg-white/5 rounded-full border border-white/5">
            <button className="px-6 py-2 rounded-full bg-zinc-800 text-white font-bold text-xs shadow-lg">All</button>
            <button className="px-6 py-2 rounded-full text-zinc-400 hover:text-white transition-colors text-xs font-medium">Enrolled</button>
            <button className="px-6 py-2 rounded-full text-zinc-400 hover:text-white transition-colors text-xs font-medium">New</button>
          </div>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="text-center py-20 text-zinc-500 animate-pulse">Loading Tasks from Database...</div>
        )}

        {/* TASKS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
          {tasks.map((task) => {
            const isEnrolled = task.status === 'enrolled';
            const TaskIcon = ICON_MAP[task.icon_name] || Activity; 

            return (
              <div key={task.id} onClick={() => setSelectedTask({ ...task, Icon: TaskIcon })} className={`glass-panel rounded-3xl p-6 cursor-pointer transition-all duration-300 group relative overflow-hidden border hover:-translate-y-1 hover:shadow-2xl ${isEnrolled ? 'border-violet-500/30 hover:border-violet-500' : 'border-white/5 hover:border-zinc-600'}`}>
                <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${isEnrolled ? 'from-violet-600 to-blue-600' : 'from-zinc-500 to-zinc-700'}`}></div>
                
                <div className="relative z-10 flex justify-between items-start mb-6">
                  <div className={`p-3.5 rounded-2xl border ${isEnrolled ? 'bg-violet-500/10 border-violet-500/20 text-violet-300' : 'bg-white/5 border-white/10 text-zinc-400'}`}>
                    <TaskIcon className="w-6 h-6" />
                  </div>
                  {isEnrolled ? (<div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold tracking-wide"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> ACTIVE</div>) : (<div className="px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-500 text-[10px] font-bold tracking-wide">AVAILABLE</div>)}
                </div>
                
                <div className="relative z-10 mb-6">
                  <h3 className="text-xl font-bold mb-1 tracking-tight text-white group-hover:text-violet-200 transition-colors">{task.title}</h3>
                  <p className="text-xs text-zinc-500 font-mono">{task.steps.length} Steps • {task.sessions} Sessions</p>
                </div>

                <div className="relative z-10 pt-4 border-t border-white/5">
                  {isEnrolled ? (
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-zinc-400">Accuracy</span>
                        <span className={`${task.accuracy >= 90 ? 'text-emerald-400' : 'text-yellow-400'}`}>{task.accuracy.toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-1000 ${task.accuracy >= 90 ? 'bg-emerald-500' : 'bg-yellow-500'}`} style={{ width: `${task.accuracy}%` }}></div>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono mt-2"><Calendar className="w-3 h-3" /> Last: <span className="text-zinc-300">{task.last_accessed}</span></div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-zinc-500">Not started yet</span>
                      <span className="text-xs font-bold text-white group-hover:translate-x-1 transition-transform">Start Training &rarr;</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* DRAWER */}
      <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${selectedTask ? 'opacity-100 visible' : 'opacity-0 invisible'}`} onClick={() => setSelectedTask(null)}></div>
      <div className={`fixed top-0 right-0 h-full w-full md:w-[500px] bg-[#0A0A0A] border-l border-white/10 z-50 transform transition-transform duration-300 shadow-2xl flex flex-col ${selectedTask ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedTask && (
          <>
            <div className="p-8 border-b border-white/10 flex justify-between items-start bg-zinc-900/50">
              <div><span className="text-xs font-mono text-violet-500 uppercase tracking-widest mb-1 block">Module Details</span><h2 className="text-3xl font-bold leading-none tracking-tight">{selectedTask.title}</h2></div>
              <button onClick={() => setSelectedTask(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8">
              <div className={`p-5 rounded-2xl border mb-8 flex items-center justify-between ${selectedTask.status === 'enrolled' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-zinc-700 bg-zinc-900'}`}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${selectedTask.status === 'enrolled' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>{selectedTask.status === 'enrolled' ? <CheckCircle className="w-6 h-6" /> : <Lock className="w-6 h-6" />}</div>
                  <div><div className="text-sm font-bold text-white uppercase tracking-wide">Status</div><div className="text-sm text-zinc-400 font-mono">{selectedTask.status === 'enrolled' ? `Active • ${selectedTask.sessions} Sessions` : 'Not Enrolled'}</div></div>
                </div>
              </div>
              {selectedTask.status === 'enrolled' && (<div className="mb-8 p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center"><span className="text-sm text-zinc-400">Last Accessed</span><span className="text-sm font-mono font-bold text-white">{selectedTask.last_accessed}</span></div>)}
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6 pb-2 border-b border-white/5">Step Sequence</h3>
              <div className="space-y-0 relative pl-6 border-l border-white/10">
                {selectedTask.steps.map((step, idx) => (
                  <div key={idx} className="mb-8 relative group">
                    <div className={`absolute -left-[29px] top-1 w-4 h-4 rounded-full border-4 border-[#0A0A0A] transition-all duration-300 ${selectedTask.status === 'enrolled' ? 'bg-violet-500 shadow-[0_0_10px_rgba(124,58,237,0.5)] group-hover:scale-125' : 'bg-zinc-600'}`}></div>
                    <h4 className="text-base font-bold text-white leading-none mb-1 group-hover:text-violet-400 transition-colors">{step}</h4>
                    <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">Seq_ID_0{idx + 1}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* UPDATED ACTION AREA */}
            <div className="p-8 border-t border-white/10 bg-black">
              {selectedTask.status === 'enrolled' ? (
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => router.push(`/Simulator?task=${encodeURIComponent(selectedTask.title)}`)} 
                    className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-violet-500 hover:text-white transition-all text-sm shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2"
                  >
                    <Activity className="w-4 h-4" /> Launch Simulator
                  </button>
                  
                  <button 
                    onClick={() => handleReEnroll(selectedTask.title)}
                    disabled={isResetting}
                    className="w-full py-4 bg-zinc-900 text-zinc-400 font-bold rounded-xl hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50 transition-all text-sm border border-white/5 flex items-center justify-center gap-2"
                  >
                    <RotateCcw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} /> 
                    {isResetting ? 'Resetting...' : 'Re-Enroll (Reset Progress)'}
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => router.push(`/Training?task=${encodeURIComponent(selectedTask.title)}`)} 
                  className="w-full py-4 bg-zinc-800 text-white font-bold rounded-xl hover:bg-violet-600 hover:text-white transition-all text-sm border border-zinc-700 flex items-center justify-center gap-2"
                >
                  <Coffee className="w-4 h-4" /> Train Model (Enroll)
                </button>
              )}
            </div>
          </>
        )}
      </div>

    </div>
  );
};

export default PatientDashboard;