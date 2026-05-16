// "use client";

// import React, { useState, useRef, useEffect } from 'react';
// import Link from 'next/link';
// import { 
//   ArrowLeft, Video, Play, Layers, Check, Trash2, Edit2, 
//   ArrowRight, RotateCcw, Clock, Activity, FileVideo, Cpu, UploadCloud 
// } from 'lucide-react';
// import { useRouter, useSearchParams } from 'next/navigation';

// const TrainingStudio = () => {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const fileInputRef = useRef(null);
//   const taskName = searchParams.get('task')
  
//   // -- STATE --
//   const [file, setFile] = useState(null);
//   const [videoUrl, setVideoUrl] = useState(null);
//   const [videoDuration, setVideoDuration] = useState(0); 
//   const [processing, setProcessing] = useState(false);
//   const [progress, setProgress] = useState(0);
//   const [segments, setSegments] = useState([]); // Will hold REAL data from backend
//   const [activeClipUrl, setActiveClipUrl] = useState(null);
//   const [logs, setLogs] = useState([]);
//   const [avgConfidence, setAvgConfidence] = useState(0);

//   const addLog = (msg) => setLogs(prev => [...prev, `> ${msg}`]);

//   // -- HANDLERS --

//   const triggerFileUpload = () => {
//     if (fileInputRef.current) fileInputRef.current.click();
//   };

//   const handleFileChange = (e) => {
//     const selectedFile = e.target.files?.[0];
//     if (selectedFile) {
//       setFile(selectedFile);
//       setVideoUrl(URL.createObjectURL(selectedFile));
//       // Reset
//       setSegments([]);
//       setLogs([]);
//       setActiveClipUrl(null);
//       setAvgConfidence(0);
      
//       startProcessing(selectedFile);
//     }
//   };

//   const handleReRun = () => {
//     setFile(null);
//     setVideoUrl(null);
//     setSegments([]);
//     setProcessing(false);
//     setProgress(0);
//   };

//   const playClip = (filename) => {
//     // Points to FastAPI static mount
//     setActiveClipUrl(`http://localhost:8000/clips/${filename}`);
//   };

//   // --- CORE LOGIC: SEND TO BACKEND ---
//   const startProcessing = async (selectedFile) => {
//     setProcessing(true);
//     setProgress(0);
//     setLogs([]);

//     // 1. Visual Progress Animation (loops until backend responds)
//     const interval = setInterval(() => {
//       setProgress(old => {
//         const increment = Math.floor(Math.random() * 5);
//         return old < 90 ? old + increment : 90;
//       });
//       // Realistic logs
//       if (Math.random() > 0.85) {
//         const msgs = ["loading_videomae_weights...", "extracting_i3d_features...", "syn_tnet_forward_pass...", "generating_clips..."];
//         addLog(msgs[Math.floor(Math.random() * msgs.length)]);
//       }
//     }, 500);

//     try {
//       const formData = new FormData();
//       formData.append("file", selectedFile);

//       // 2. REAL API CALL
//       const response = await fetch("http://localhost:8000/api/segment", {
//         method: "POST",
//         body: formData,
//       });

//       if (!response.ok) throw new Error("Segmentation failed");

//       const data = await response.json();
      
//       // 3. Success
//       clearInterval(interval);
//       setProgress(100);
//       setSegments(data.segments);
      
//       if (data.segments.length > 0) {
//         const totalConf = data.segments.reduce((acc, seg) => acc + seg.confidence, 0);
//         setAvgConfidence(Math.round((totalConf / data.segments.length) * 100));
//       }

//       setTimeout(() => setProcessing(false), 500);

//     } catch (error) {
//       clearInterval(interval);
//       console.error("Error:", error);
//       addLog("ERROR: Connection Failed");
//       alert("ML Engine Error: Ensure backend is running.");
//       setProcessing(false);
//     }
//   };

//   const confirmTraining = async () => {
//     try {
//         await fetch("http://localhost:8000/api/train", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({
//                 task_name: taskName,
//                 steps: segments // Sends full segment objects for GTRM
//             })
//         });
//         router.push('/Dashboard/patient');
//     } catch (e) { console.error(e); }
//   };

//   const handleLoadedMetadata = (e) => {
//     setVideoDuration(e.target.duration);
//   };

//   return (
//     <div className="min-h-screen p-6 md:p-10 flex flex-col gap-6 bg-[#050505] text-white font-sans selection:bg-violet-500 selection:text-white">
      
//       {/* HEADER */}
//       <header className="flex justify-between items-center pb-6 border-b border-white/10">
//         <div className="flex items-center gap-4">
//           <Link href="/Dashboard/patient" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 border border-white/10 transition-colors">
//             <ArrowLeft className="w-5 h-5 text-zinc-400" />
//           </Link>
//           <div>
//             <h1 className="text-2xl font-extrabold tracking-tighter">AURA<span className="text-violet-500">.</span></h1>
//             <p className="text-xs font-mono text-zinc-500 uppercase">Training Studio // Getting Up Routine</p>
//           </div>
//         </div>
        
//         <div className="hidden md:flex items-center gap-2">
//             <div className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${processing ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-white/5 border-white/10'}`}>
//                 <span className={`w-2 h-2 rounded-full ${processing ? 'bg-yellow-500 animate-pulse' : 'bg-emerald-500'}`}></span>
//                 <span className={`text-xs font-bold ${processing ? 'text-yellow-500' : 'text-zinc-300'}`}>
//                     {processing ? 'PROCESSING VIDEO...' : 'ENGINE READY'}
//                 </span>
//             </div>
//         </div>
//       </header>

//       <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 h-full min-h-[600px]">
        
//         {/* --- LEFT COLUMN --- */}
//         <div className="lg:col-span-7 flex flex-col gap-6">
          
//           <div className="relative aspect-video glass-panel rounded-3xl overflow-hidden flex items-center justify-center bg-white/[0.02] border border-white/5 shadow-2xl group">
            
//             {!file && !processing && (
//               <div className="text-center p-8 cursor-pointer group" onClick={triggerFileUpload}>
//                 <div className="w-24 h-24 bg-violet-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-violet-500/20 group-hover:scale-110 transition-transform duration-300">
//                   <UploadCloud className="w-10 h-10 text-violet-500" />
//                 </div>
//                 <h2 className="text-2xl font-bold mb-2">Upload Reference Video</h2>
//                 <p className="text-sm text-zinc-500 max-w-sm mx-auto mb-6">Select a clear, continuous recording. AI will auto-segment the steps.</p>
//                 <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="video/*" />
//                 <button onClick={(e) => { e.stopPropagation(); triggerFileUpload(); }} className="px-8 py-3 bg-white text-black font-bold rounded-full text-sm hover:bg-zinc-200 transition-colors shadow-lg shadow-white/10">
//                     Choose Video File
//                 </button>
//               </div>
//             )}

//             {processing && (
//               <div className="absolute inset-0 bg-black z-20 flex flex-col items-center justify-center">
//                  <div className="w-64 h-2 bg-zinc-800 rounded-full overflow-hidden mb-6">
//                     <div className="h-full bg-violet-500 transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
//                  </div>
//                  <div className="text-5xl font-mono font-bold text-violet-500 mb-2 tracking-tighter">{progress}%</div>
//                  <p className="text-xs text-zinc-400 font-mono uppercase tracking-widest animate-pulse">Running Neural Segmentation...</p>
//                  <div className="mt-8 h-24 w-80 bg-zinc-900/50 p-4 rounded-xl border border-white/5 overflow-hidden text-[10px] text-zinc-500 font-mono shadow-inner flex flex-col justify-end">
//                     {logs.slice(-4).map((l, i) => <div key={i} className="truncate animate-in fade-in slide-in-from-bottom-2">{l}</div>)}
//                  </div>
//               </div>
//             )}

//             {(videoUrl || activeClipUrl) && !processing && (
//               <video 
//                 key={activeClipUrl || videoUrl}
//                 src={activeClipUrl || videoUrl} 
//                 controls 
//                 className="w-full h-full object-contain"
//                 onLoadedMetadata={handleLoadedMetadata}
//               />
//             )}
//           </div>

//           {segments.length > 0 && !processing && (
//              <>
//                <div className="grid grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
//                   <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col justify-between h-32 hover:bg-white/5 transition-colors">
//                      <div className="p-2 w-fit rounded-lg bg-blue-500/10 text-blue-400"><Clock className="w-5 h-5" /></div>
//                      <div><div className="text-2xl font-bold text-white">{Math.round(videoDuration)}s</div><div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Video Duration</div></div>
//                   </div>
//                   <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col justify-between h-32 hover:bg-white/5 transition-colors">
//                      <div className="p-2 w-fit rounded-lg bg-violet-500/10 text-violet-400"><Layers className="w-5 h-5" /></div>
//                      <div><div className="text-2xl font-bold text-white">{segments.length}</div><div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Segments Found</div></div>
//                   </div>
//                   <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col justify-between h-32 hover:bg-white/5 transition-colors">
//                      <div className="p-2 w-fit rounded-lg bg-emerald-500/10 text-emerald-400"><Activity className="w-5 h-5" /></div>
//                      <div><div className="text-2xl font-bold text-white">{avgConfidence}%</div><div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Avg Confidence</div></div>
//                   </div>
//                </div>

//                <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 animate-in fade-in slide-in-from-bottom-6 duration-1000">
//                   <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Sequence Timeline</h3>
//                   <div className="w-full h-10 bg-zinc-900/50 rounded-lg overflow-hidden flex border border-white/5">
//                      {segments.map((seg, i) => {
//                         const duration = seg.end - seg.start;
//                         const percent = (duration / videoDuration) * 100;
//                         const colors = ['bg-violet-600', 'bg-blue-600', 'bg-emerald-600', 'bg-orange-600'];
//                         return (
//                            <div 
//                               key={i} 
//                               style={{ width: `${percent}%` }} 
//                               className={`h-full ${colors[i % 4]} opacity-80 hover:opacity-100 transition-all cursor-pointer border-r border-black/20 relative group`}
//                               onClick={() => playClip(seg.filename)}
//                            >
//                               <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black text-[10px] px-2 py-1 rounded text-white opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-10 border border-white/10 shadow-xl">
//                                  {seg.label}
//                               </div>
//                            </div>
//                         );
//                      })}
//                   </div>
//                   <div className="flex justify-between mt-2 text-[10px] text-zinc-600 font-mono">
//                      <span>00:00</span>
//                      <span>{Math.round(videoDuration / 2)}s</span>
//                      <span>{Math.round(videoDuration)}s</span>
//                   </div>
//                </div>
//              </>
//           )}
//         </div>

//         {/* --- RIGHT COLUMN --- */}
//         <div className="lg:col-span-5 flex flex-col h-full">
//           <div className="glass-panel rounded-3xl flex-1 flex flex-col overflow-hidden border border-white/5 bg-white/[0.02] shadow-xl relative">
             
//              {segments.length === 0 && !processing ? (
//                 <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40">
//                     <div className="w-full h-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
//                     <div className="absolute inset-0 flex items-center justify-center">
//                         <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 animate-pulse">
//                             <div className="w-2 h-2 bg-zinc-500 rounded-full"></div>
//                             <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Awaiting Input Stream</span>
//                         </div>
//                     </div>
//                 </div>
//              ) : null}

//              {segments.length > 0 && !processing && (
//                 <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-500">
//                   <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
//                     <div><h2 className="text-lg font-bold">Detected Steps</h2><p className="text-xs text-zinc-400 mt-0.5">Review segments before saving.</p></div>
//                     <button onClick={handleReRun} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 transition-all hover:text-white"><RotateCcw className="w-3 h-3" /> Re-run</button>
//                   </div>

//                   <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scroll">
//                     {segments.map((seg, index) => (
//                         <div key={index} onClick={() => playClip(seg.filename)} className="group flex gap-4 p-3 rounded-xl bg-black/20 border border-white/5 hover:bg-white/5 hover:border-violet-500/30 transition-all cursor-pointer animate-in slide-in-from-right-4 duration-500" style={{ animationDelay: `${index * 100}ms` }}>
//                            <div className="w-20 h-16 bg-black rounded-lg relative overflow-hidden flex-shrink-0 border border-white/10 flex flex-col items-center justify-center group-hover:border-violet-500/50 transition-colors">
//                                <Play className="w-4 h-4 text-zinc-600 group-hover:text-violet-400 mb-1 transition-colors" /><span className="text-[9px] text-zinc-500 font-mono">{seg.start.toFixed(0)}s-{seg.end.toFixed(0)}s</span>
//                            </div>
//                            <div className="flex-1 flex flex-col justify-center min-w-0">
//                               <div className="flex justify-between items-center mb-1"><span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Step {index + 1}</span><span className={`text-[9px] px-1.5 py-0.5 rounded ${seg.confidence > 0.9 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'}`}>{Math.round(seg.confidence * 100)}% Conf.</span></div>
//                               <div className="text-sm font-bold text-white truncate group-hover:text-violet-200 transition-colors">{seg.label}</div>
//                            </div>
//                            <div className="flex flex-col justify-center gap-1 border-l border-white/10 pl-3"><button className="p-1.5 hover:bg-white/10 rounded-md text-zinc-500 hover:text-white transition-colors"><Edit2 className="w-3.5 h-3.5" /></button><button className="p-1.5 hover:bg-red-500/10 rounded-md text-zinc-500 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button></div>
//                         </div>
//                     ))}
//                   </div>

//                   <div className="p-6 border-t border-white/5 bg-[#0A0A0A]/80 backdrop-blur-md">
//                     <button onClick={confirmTraining} className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] flex items-center justify-center gap-2 group">Confirm & Build Graph <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></button>
//                   </div>
//                 </div>
//              )}
//           </div>
//         </div>

//       </main>
//     </div>
//   );
// };

// export default TrainingStudio;

// "use client";

// import React, { useState, useRef, useEffect } from 'react';
// import Link from 'next/link';
// import { 
//   ArrowLeft, Video, Play, Layers, Check, Trash2, Edit2, 
//   ArrowRight, RotateCcw, Clock, Activity, FileVideo, Cpu, UploadCloud 
// } from 'lucide-react';
// import { useRouter, useSearchParams } from 'next/navigation';

// const TrainingStudio = () => {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const fileInputRef = useRef(null);
//   const taskName = searchParams.get('task')
  
//   // -- STATE --
//   const [file, setFile] = useState(null);
//   const [videoUrl, setVideoUrl] = useState(null);
//   const [videoDuration, setVideoDuration] = useState(0); 
//   const [processing, setProcessing] = useState(false);
//   const [progress, setProgress] = useState(0);
//   const [segments, setSegments] = useState([]); // Will hold REAL data from backend
//   const [activeClipUrl, setActiveClipUrl] = useState(null);
//   const [logs, setLogs] = useState([]);
//   const [avgConfidence, setAvgConfidence] = useState(0);

//   const addLog = (msg) => setLogs(prev => [...prev, `> ${msg}`]);

//   // -- HANDLERS --

//   const triggerFileUpload = () => {
//     if (fileInputRef.current) fileInputRef.current.click();
//   };

//   const handleFileChange = (e) => {
//     const selectedFile = e.target.files?.[0];
//     if (selectedFile) {
//       setFile(selectedFile);
//       setVideoUrl(URL.createObjectURL(selectedFile));
//       // Reset
//       setSegments([]);
//       setLogs([]);
//       setActiveClipUrl(null);
//       setAvgConfidence(0);
      
//       startProcessing(selectedFile);
//     }
//   };

//   const handleReRun = () => {
//     setFile(null);
//     setVideoUrl(null);
//     setSegments([]);
//     setProcessing(false);
//     setProgress(0);
//   };

//   const playClip = (filename) => {
//     // Points to FastAPI static mount
//     setActiveClipUrl(`http://localhost:8000/clips/${filename}`);
//   };

//   // --- CORE LOGIC: SEND TO BACKEND ---
//   const startProcessing = async (selectedFile) => {
//     setProcessing(true);
//     setProgress(0);
//     setLogs([]);

//     // 1. Visual Progress Animation
//     const interval = setInterval(() => {
//       setProgress(old => {
//         const increment = Math.floor(Math.random() * 5);
//         return old < 90 ? old + increment : 90;
//       });
//       // Realistic logs
//       if (Math.random() > 0.85) {
//         const msgs = ["loading_videomae_weights...", "extracting_i3d_features...", "syn_tnet_forward_pass...", "generating_clips..."];
//         addLog(msgs[Math.floor(Math.random() * msgs.length)]);
//       }
//     }, 500);

//     try {
//       const formData = new FormData();
//       formData.append("file", selectedFile);
//       formData.append("task_name", taskName); // <-- ADDED: Tell backend which task this is

//       // 2. REAL API CALL
//       const response = await fetch("http://localhost:8000/api/segment", {
//         method: "POST",
//         body: formData,
//       });

//       const data = await response.json();

//       if (!response.ok) {
//           // --- NEW: CATCH BACKEND VALIDATION ERROR ---
//           throw new Error(data.detail || "Segmentation failed");
//       }
      
//       // 3. Success
//       clearInterval(interval);
//       setProgress(100);
//       setSegments(data.segments);
      
//       if (data.segments.length > 0) {
//         const totalConf = data.segments.reduce((acc, seg) => acc + seg.confidence, 0);
//         setAvgConfidence(Math.round((totalConf / data.segments.length) * 100));
//       }

//       setTimeout(() => setProcessing(false), 500);

//     } catch (error) {
//       clearInterval(interval);
//       console.error("Error:", error);
//       addLog(`ERROR: ${error.message}`);
      
//       // --- NEW: POP UP ERROR AND RESET UI ---
//       alert(`Validation Failed:\n\n${error.message}`);
//       setProcessing(false);
//       setFile(null);
//       setVideoUrl(null);
//     }
//   };
//   // const startProcessing = async (selectedFile) => {
//   //   setProcessing(true);
//   //   setProgress(0);
//   //   setLogs([]);

//   //   // 1. Visual Progress Animation (loops until backend responds)
//   //   const interval = setInterval(() => {
//   //     setProgress(old => {
//   //       const increment = Math.floor(Math.random() * 5);
//   //       return old < 90 ? old + increment : 90;
//   //     });
//   //     // Realistic logs
//   //     if (Math.random() > 0.85) {
//   //       const msgs = ["loading_videomae_weights...", "extracting_i3d_features...", "syn_tnet_forward_pass...", "generating_clips..."];
//   //       addLog(msgs[Math.floor(Math.random() * msgs.length)]);
//   //     }
//   //   }, 500);

//   //   try {
//   //     const formData = new FormData();
//   //     formData.append("file", selectedFile);

//   //     // 2. REAL API CALL
//   //     const response = await fetch("http://localhost:8000/api/segment", {
//   //       method: "POST",
//   //       body: formData,
//   //     });

//   //     if (!response.ok) throw new Error("Segmentation failed");

//   //     const data = await response.json();
      
//   //     // 3. Success
//   //     clearInterval(interval);
//   //     setProgress(100);
//   //     setSegments(data.segments);
      
//   //     if (data.segments.length > 0) {
//   //       const totalConf = data.segments.reduce((acc, seg) => acc + seg.confidence, 0);
//   //       setAvgConfidence(Math.round((totalConf / data.segments.length) * 100));
//   //     }

//   //     setTimeout(() => setProcessing(false), 500);

//   //   } catch (error) {
//   //     clearInterval(interval);
//   //     console.error("Error:", error);
//   //     addLog("ERROR: Connection Failed");
//   //     alert("ML Engine Error: Ensure backend is running.");
//   //     setProcessing(false);
//   //   }
//   // };

//   // --- CRITICAL UPDATE: PASS USER_ID TO BACKEND ---
//   const confirmTraining = async () => {
//     try {
//         const storedData = localStorage.getItem('user');
//         const currentUser = storedData ? JSON.parse(storedData) : null;

//         if (!currentUser || !currentUser.user_id) {
//             alert("Session expired. Please log in again.");
//             router.push('/login');
//             return;
//         }

//         await fetch("http://localhost:8000/api/train", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({
//                 user_id: currentUser.user_id, // <-- ADDED
//                 task_name: taskName,
//                 steps: segments 
//             })
//         });
//         router.push('/Dashboard/patient');
//     } catch (e) { console.error(e); }
//   };

//   const handleLoadedMetadata = (e) => {
//     setVideoDuration(e.target.duration);
//   };

//   return (
//     <div className="min-h-screen p-6 md:p-10 flex flex-col gap-6 bg-[#050505] text-white font-sans selection:bg-violet-500 selection:text-white">
      
//       {/* HEADER */}
//       <header className="flex justify-between items-center pb-6 border-b border-white/10">
//         <div className="flex items-center gap-4">
//           <Link href="/Dashboard/patient" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 border border-white/10 transition-colors">
//             <ArrowLeft className="w-5 h-5 text-zinc-400" />
//           </Link>
//           <div>
//             <h1 className="text-2xl font-extrabold tracking-tighter">AURA<span className="text-violet-500">.</span></h1>
//             <p className="text-xs font-mono text-zinc-500 uppercase">Training Studio // Getting Up Routine</p>
//           </div>
//         </div>
        
//         <div className="hidden md:flex items-center gap-2">
//             <div className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${processing ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-white/5 border-white/10'}`}>
//                 <span className={`w-2 h-2 rounded-full ${processing ? 'bg-yellow-500 animate-pulse' : 'bg-emerald-500'}`}></span>
//                 <span className={`text-xs font-bold ${processing ? 'text-yellow-500' : 'text-zinc-300'}`}>
//                     {processing ? 'PROCESSING VIDEO...' : 'ENGINE READY'}
//                 </span>
//             </div>
//         </div>
//       </header>

//       <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 h-full min-h-[600px]">
        
//         {/* --- LEFT COLUMN --- */}
//         <div className="lg:col-span-7 flex flex-col gap-6">
          
//           <div className="relative aspect-video glass-panel rounded-3xl overflow-hidden flex items-center justify-center bg-white/[0.02] border border-white/5 shadow-2xl group">
            
//             {!file && !processing && (
//               <div className="text-center p-8 cursor-pointer group" onClick={triggerFileUpload}>
//                 <div className="w-24 h-24 bg-violet-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-violet-500/20 group-hover:scale-110 transition-transform duration-300">
//                   <UploadCloud className="w-10 h-10 text-violet-500" />
//                 </div>
//                 <h2 className="text-2xl font-bold mb-2">Upload Reference Video</h2>
//                 <p className="text-sm text-zinc-500 max-w-sm mx-auto mb-6">Select a clear, continuous recording. AI will auto-segment the steps.</p>
//                 <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="video/*" />
//                 <button onClick={(e) => { e.stopPropagation(); triggerFileUpload(); }} className="px-8 py-3 bg-white text-black font-bold rounded-full text-sm hover:bg-zinc-200 transition-colors shadow-lg shadow-white/10">
//                     Choose Video File
//                 </button>
//               </div>
//             )}

//             {processing && (
//               <div className="absolute inset-0 bg-black z-20 flex flex-col items-center justify-center">
//                  <div className="w-64 h-2 bg-zinc-800 rounded-full overflow-hidden mb-6">
//                     <div className="h-full bg-violet-500 transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
//                  </div>
//                  <div className="text-5xl font-mono font-bold text-violet-500 mb-2 tracking-tighter">{progress}%</div>
//                  <p className="text-xs text-zinc-400 font-mono uppercase tracking-widest animate-pulse">Running Neural Segmentation...</p>
//                  <div className="mt-8 h-24 w-80 bg-zinc-900/50 p-4 rounded-xl border border-white/5 overflow-hidden text-[10px] text-zinc-500 font-mono shadow-inner flex flex-col justify-end">
//                     {logs.slice(-4).map((l, i) => <div key={i} className="truncate animate-in fade-in slide-in-from-bottom-2">{l}</div>)}
//                  </div>
//               </div>
//             )}

//             {(videoUrl || activeClipUrl) && !processing && (
//               <video 
//                 key={activeClipUrl || videoUrl}
//                 src={activeClipUrl || videoUrl} 
//                 controls 
//                 className="w-full h-full object-contain"
//                 onLoadedMetadata={handleLoadedMetadata}
//               />
//             )}
//           </div>

//           {segments.length > 0 && !processing && (
//              <>
//                <div className="grid grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
//                   <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col justify-between h-32 hover:bg-white/5 transition-colors">
//                      <div className="p-2 w-fit rounded-lg bg-blue-500/10 text-blue-400"><Clock className="w-5 h-5" /></div>
//                      <div><div className="text-2xl font-bold text-white">{Math.round(videoDuration)}s</div><div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Video Duration</div></div>
//                   </div>
//                   <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col justify-between h-32 hover:bg-white/5 transition-colors">
//                      <div className="p-2 w-fit rounded-lg bg-violet-500/10 text-violet-400"><Layers className="w-5 h-5" /></div>
//                      <div><div className="text-2xl font-bold text-white">{segments.length}</div><div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Segments Found</div></div>
//                   </div>
//                   <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col justify-between h-32 hover:bg-white/5 transition-colors">
//                      <div className="p-2 w-fit rounded-lg bg-emerald-500/10 text-emerald-400"><Activity className="w-5 h-5" /></div>
//                      <div><div className="text-2xl font-bold text-white">{avgConfidence}%</div><div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Avg Confidence</div></div>
//                   </div>
//                </div>

//                <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 animate-in fade-in slide-in-from-bottom-6 duration-1000">
//                   <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Sequence Timeline</h3>
//                   <div className="w-full h-10 bg-zinc-900/50 rounded-lg overflow-hidden flex border border-white/5">
//                      {segments.map((seg, i) => {
//                         const duration = seg.end - seg.start;
//                         const percent = (duration / videoDuration) * 100;
//                         const colors = ['bg-violet-600', 'bg-blue-600', 'bg-emerald-600', 'bg-orange-600'];
//                         return (
//                            <div 
//                               key={i} 
//                               style={{ width: `${percent}%` }} 
//                               className={`h-full ${colors[i % 4]} opacity-80 hover:opacity-100 transition-all cursor-pointer border-r border-black/20 relative group`}
//                               onClick={() => playClip(seg.filename)}
//                            >
//                               <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black text-[10px] px-2 py-1 rounded text-white opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-10 border border-white/10 shadow-xl">
//                                  {seg.label}
//                               </div>
//                            </div>
//                         );
//                      })}
//                   </div>
//                   <div className="flex justify-between mt-2 text-[10px] text-zinc-600 font-mono">
//                      <span>00:00</span>
//                      <span>{Math.round(videoDuration / 2)}s</span>
//                      <span>{Math.round(videoDuration)}s</span>
//                   </div>
//                </div>
//              </>
//           )}
//         </div>

//         {/* --- RIGHT COLUMN --- */}
//         <div className="lg:col-span-5 flex flex-col h-full">
//           <div className="glass-panel rounded-3xl flex-1 flex flex-col overflow-hidden border border-white/5 bg-white/[0.02] shadow-xl relative">
             
//              {segments.length === 0 && !processing ? (
//                 <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40">
//                     <div className="w-full h-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
//                     <div className="absolute inset-0 flex items-center justify-center">
//                         <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 animate-pulse">
//                             <div className="w-2 h-2 bg-zinc-500 rounded-full"></div>
//                             <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Awaiting Input Stream</span>
//                         </div>
//                     </div>
//                 </div>
//              ) : null}

//              {segments.length > 0 && !processing && (
//                 <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-500">
//                   <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
//                     <div><h2 className="text-lg font-bold">Detected Steps</h2><p className="text-xs text-zinc-400 mt-0.5">Review segments before saving.</p></div>
//                     <button onClick={handleReRun} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 transition-all hover:text-white"><RotateCcw className="w-3 h-3" /> Re-run</button>
//                   </div>

//                   <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scroll">
//                     {segments.map((seg, index) => (
//                         <div key={index} onClick={() => playClip(seg.filename)} className="group flex gap-4 p-3 rounded-xl bg-black/20 border border-white/5 hover:bg-white/5 hover:border-violet-500/30 transition-all cursor-pointer animate-in slide-in-from-right-4 duration-500" style={{ animationDelay: `${index * 100}ms` }}>
//                            <div className="w-20 h-16 bg-black rounded-lg relative overflow-hidden flex-shrink-0 border border-white/10 flex flex-col items-center justify-center group-hover:border-violet-500/50 transition-colors">
//                                <Play className="w-4 h-4 text-zinc-600 group-hover:text-violet-400 mb-1 transition-colors" /><span className="text-[9px] text-zinc-500 font-mono">{seg.start.toFixed(0)}s-{seg.end.toFixed(0)}s</span>
//                            </div>
//                            <div className="flex-1 flex flex-col justify-center min-w-0">
//                               <div className="flex justify-between items-center mb-1"><span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Step {index + 1}</span><span className={`text-[9px] px-1.5 py-0.5 rounded ${seg.confidence > 0.9 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'}`}>{Math.round(seg.confidence * 100)}% Conf.</span></div>
//                               <div className="text-sm font-bold text-white truncate group-hover:text-violet-200 transition-colors">{seg.label}</div>
//                            </div>
//                            <div className="flex flex-col justify-center gap-1 border-l border-white/10 pl-3"><button className="p-1.5 hover:bg-white/10 rounded-md text-zinc-500 hover:text-white transition-colors"><Edit2 className="w-3.5 h-3.5" /></button><button className="p-1.5 hover:bg-red-500/10 rounded-md text-zinc-500 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button></div>
//                         </div>
//                     ))}
//                   </div>

//                   <div className="p-6 border-t border-white/5 bg-[#0A0A0A]/80 backdrop-blur-md">
//                     <button onClick={confirmTraining} className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] flex items-center justify-center gap-2 group">Confirm & Build Graph <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></button>
//                   </div>
//                 </div>
//              )}
//           </div>
//         </div>

//       </main>
//     </div>
//   );
// };

// export default TrainingStudio;

"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Video, Play, Layers, Check, Trash2, Edit2, 
  ArrowRight, RotateCcw, Clock, Activity, FileVideo, Cpu, UploadCloud, AlertTriangle
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

const TrainingStudio = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef(null);
  const taskName = searchParams.get('task');
  
  // -- STATE --
  const [file, setFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0); 
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [segments, setSegments] = useState([]); 
  const [activeClipUrl, setActiveClipUrl] = useState(null);
  const [logs, setLogs] = useState([]);
  const [avgConfidence, setAvgConfidence] = useState(0);
  
  // --- NEW: CUSTOM ERROR MODAL STATE ---
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: "" });

  const addLog = (msg) => setLogs(prev => [...prev, `> ${msg}`]);

  // -- HANDLERS --

  const triggerFileUpload = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setVideoUrl(URL.createObjectURL(selectedFile));
      // Reset
      setSegments([]);
      setLogs([]);
      setActiveClipUrl(null);
      setAvgConfidence(0);
      
      startProcessing(selectedFile);
    }
  };

  const handleReRun = () => {
    setFile(null);
    setVideoUrl(null);
    setSegments([]);
    setProcessing(false);
    setProgress(0);
  };

  const playClip = (filename) => {
    setActiveClipUrl(`http://localhost:8000/clips/${filename}`);
  };

  // --- CORE LOGIC: SEND TO BACKEND ---
  const startProcessing = async (selectedFile) => {
    setProcessing(true);
    setProgress(0);
    setLogs([]);

    // 1. Visual Progress Animation
    const interval = setInterval(() => {
      setProgress(old => {
        const increment = Math.floor(Math.random() * 5);
        return old < 90 ? old + increment : 90;
      });
      // Realistic logs
      if (Math.random() > 0.85) {
        const msgs = ["loading_videomae_weights...", "extracting_i3d_features...", "syn_tnet_forward_pass...", "generating_clips..."];
        addLog(msgs[Math.floor(Math.random() * msgs.length)]);
      }
    }, 500);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("task_name", taskName);

      // 2. REAL API CALL
      const response = await fetch("http://localhost:8000/api/segment", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
          throw new Error(data.detail || "Segmentation failed");
      }
      
      // 3. Success
      clearInterval(interval);
      setProgress(100);
      setSegments(data.segments);
      
      if (data.segments.length > 0) {
        const totalConf = data.segments.reduce((acc, seg) => acc + seg.confidence, 0);
        setAvgConfidence(Math.round((totalConf / data.segments.length) * 100));
      }

      setTimeout(() => setProcessing(false), 500);

    } catch (error) {
      clearInterval(interval);
      console.error("Error:", error);
      addLog(`ERROR: ${error.message}`);
      
      // --- NEW: TRIGGER CUSTOM MODAL INSTEAD OF ALERT ---
      setErrorModal({ isOpen: true, message: error.message });
      setProcessing(false);
      setFile(null);
      setVideoUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = ""; // Clear the file input
    }
  };

  // --- CRITICAL UPDATE: PASS USER_ID TO BACKEND ---
  const confirmTraining = async () => {
    try {
        const storedData = localStorage.getItem('user');
        const currentUser = storedData ? JSON.parse(storedData) : null;

        if (!currentUser || !currentUser.user_id) {
            setErrorModal({ isOpen: true, message: "Session expired. Please log in again." });
            setTimeout(() => router.push('/login'), 2000);
            return;
        }

        await fetch("http://localhost:8000/api/train", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: currentUser.user_id,
                task_name: taskName,
                steps: segments 
            })
        });
        router.push('/Dashboard/patient');
    } catch (e) { console.error(e); }
  };

  const handleLoadedMetadata = (e) => {
    setVideoDuration(e.target.duration);
  };

  return (
    <div className="min-h-screen p-6 md:p-10 flex flex-col gap-6 bg-[#050505] text-white font-sans selection:bg-violet-500 selection:text-white relative">
      
      {/* HEADER */}
      <header className="flex justify-between items-center pb-6 border-b border-white/10">
        <div className="flex items-center gap-4">
          <Link href="/Dashboard/patient" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 border border-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tighter">AURA<span className="text-violet-500">.</span></h1>
            <p className="text-xs font-mono text-zinc-500 uppercase">Training Studio // {taskName}</p>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-2">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${processing ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-white/5 border-white/10'}`}>
                <span className={`w-2 h-2 rounded-full ${processing ? 'bg-yellow-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                <span className={`text-xs font-bold ${processing ? 'text-yellow-500' : 'text-zinc-300'}`}>
                    {processing ? 'PROCESSING VIDEO...' : 'ENGINE READY'}
                </span>
            </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 h-full min-h-[600px]">
        
        {/* --- LEFT COLUMN --- */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          <div className="relative aspect-video glass-panel rounded-3xl overflow-hidden flex items-center justify-center bg-white/[0.02] border border-white/5 shadow-2xl group">
            
            {!file && !processing && (
              <div className="text-center p-8 cursor-pointer group" onClick={triggerFileUpload}>
                <div className="w-24 h-24 bg-violet-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-violet-500/20 group-hover:scale-110 transition-transform duration-300">
                  <UploadCloud className="w-10 h-10 text-violet-500" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Upload Reference Video</h2>
                <p className="text-sm text-zinc-500 max-w-sm mx-auto mb-6">Select a clear, continuous recording. AI will auto-segment the steps.</p>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="video/*" />
                <button onClick={(e) => { e.stopPropagation(); triggerFileUpload(); }} className="px-8 py-3 bg-white text-black font-bold rounded-full text-sm hover:bg-zinc-200 transition-colors shadow-lg shadow-white/10">
                    Choose Video File
                </button>
              </div>
            )}

            {processing && (
              <div className="absolute inset-0 bg-black z-20 flex flex-col items-center justify-center">
                 <div className="w-64 h-2 bg-zinc-800 rounded-full overflow-hidden mb-6">
                    <div className="h-full bg-violet-500 transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
                 </div>
                 <div className="text-5xl font-mono font-bold text-violet-500 mb-2 tracking-tighter">{progress}%</div>
                 <p className="text-xs text-zinc-400 font-mono uppercase tracking-widest animate-pulse">Running Neural Segmentation...</p>
                 <div className="mt-8 h-24 w-80 bg-zinc-900/50 p-4 rounded-xl border border-white/5 overflow-hidden text-[10px] text-zinc-500 font-mono shadow-inner flex flex-col justify-end">
                    {logs.slice(-4).map((l, i) => <div key={i} className="truncate animate-in fade-in slide-in-from-bottom-2">{l}</div>)}
                 </div>
              </div>
            )}

            {(videoUrl || activeClipUrl) && !processing && (
              <video 
                key={activeClipUrl || videoUrl}
                src={activeClipUrl || videoUrl} 
                controls 
                className="w-full h-full object-contain"
                onLoadedMetadata={handleLoadedMetadata}
              />
            )}
          </div>

          {segments.length > 0 && !processing && (
             <>
               <div className="grid grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col justify-between h-32 hover:bg-white/5 transition-colors">
                     <div className="p-2 w-fit rounded-lg bg-blue-500/10 text-blue-400"><Clock className="w-5 h-5" /></div>
                     <div><div className="text-2xl font-bold text-white">{Math.round(videoDuration)}s</div><div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Video Duration</div></div>
                  </div>
                  <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col justify-between h-32 hover:bg-white/5 transition-colors">
                     <div className="p-2 w-fit rounded-lg bg-violet-500/10 text-violet-400"><Layers className="w-5 h-5" /></div>
                     <div><div className="text-2xl font-bold text-white">{segments.length}</div><div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Segments Found</div></div>
                  </div>
                  <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col justify-between h-32 hover:bg-white/5 transition-colors">
                     <div className="p-2 w-fit rounded-lg bg-emerald-500/10 text-emerald-400"><Activity className="w-5 h-5" /></div>
                     <div><div className="text-2xl font-bold text-white">{avgConfidence}%</div><div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Avg Confidence</div></div>
                  </div>
               </div>

               <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Sequence Timeline</h3>
                  <div className="w-full h-10 bg-zinc-900/50 rounded-lg overflow-hidden flex border border-white/5">
                     {segments.map((seg, i) => {
                        const duration = seg.end - seg.start;
                        const percent = (duration / videoDuration) * 100;
                        const colors = ['bg-violet-600', 'bg-blue-600', 'bg-emerald-600', 'bg-orange-600'];
                        return (
                           <div 
                              key={i} 
                              style={{ width: `${percent}%` }} 
                              className={`h-full ${colors[i % 4]} opacity-80 hover:opacity-100 transition-all cursor-pointer border-r border-black/20 relative group`}
                              onClick={() => playClip(seg.filename)}
                           >
                              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black text-[10px] px-2 py-1 rounded text-white opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-10 border border-white/10 shadow-xl">
                                 {seg.label}
                              </div>
                           </div>
                        );
                     })}
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] text-zinc-600 font-mono">
                     <span>00:00</span>
                     <span>{Math.round(videoDuration / 2)}s</span>
                     <span>{Math.round(videoDuration)}s</span>
                  </div>
               </div>
             </>
          )}
        </div>

        {/* --- RIGHT COLUMN --- */}
        <div className="lg:col-span-5 flex flex-col h-full">
          <div className="glass-panel rounded-3xl flex-1 flex flex-col overflow-hidden border border-white/5 bg-white/[0.02] shadow-xl relative">
             
             {segments.length === 0 && !processing ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40">
                    <div className="w-full h-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 animate-pulse">
                            <div className="w-2 h-2 bg-zinc-500 rounded-full"></div>
                            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Awaiting Input Stream</span>
                        </div>
                    </div>
                </div>
             ) : null}

             {segments.length > 0 && !processing && (
                <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-500">
                  <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <div><h2 className="text-lg font-bold">Detected Steps</h2><p className="text-xs text-zinc-400 mt-0.5">Review segments before saving.</p></div>
                    <button onClick={handleReRun} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 transition-all hover:text-white"><RotateCcw className="w-3 h-3" /> Re-run</button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scroll">
                    {segments.map((seg, index) => (
                        <div key={index} onClick={() => playClip(seg.filename)} className="group flex gap-4 p-3 rounded-xl bg-black/20 border border-white/5 hover:bg-white/5 hover:border-violet-500/30 transition-all cursor-pointer animate-in slide-in-from-right-4 duration-500" style={{ animationDelay: `${index * 100}ms` }}>
                           <div className="w-20 h-16 bg-black rounded-lg relative overflow-hidden flex-shrink-0 border border-white/10 flex flex-col items-center justify-center group-hover:border-violet-500/50 transition-colors">
                               <Play className="w-4 h-4 text-zinc-600 group-hover:text-violet-400 mb-1 transition-colors" /><span className="text-[9px] text-zinc-500 font-mono">{seg.start.toFixed(0)}s-{seg.end.toFixed(0)}s</span>
                           </div>
                           <div className="flex-1 flex flex-col justify-center min-w-0">
                              <div className="flex justify-between items-center mb-1"><span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Step {index + 1}</span><span className={`text-[9px] px-1.5 py-0.5 rounded ${seg.confidence > 0.9 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'}`}>{Math.round(seg.confidence * 100)}% Conf.</span></div>
                              <div className="text-sm font-bold text-white truncate group-hover:text-violet-200 transition-colors">{seg.label}</div>
                           </div>
                           <div className="flex flex-col justify-center gap-1 border-l border-white/10 pl-3"><button className="p-1.5 hover:bg-white/10 rounded-md text-zinc-500 hover:text-white transition-colors"><Edit2 className="w-3.5 h-3.5" /></button><button className="p-1.5 hover:bg-red-500/10 rounded-md text-zinc-500 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button></div>
                        </div>
                    ))}
                  </div>

                  <div className="p-6 border-t border-white/5 bg-[#0A0A0A]/80 backdrop-blur-md">
                    <button onClick={confirmTraining} className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] flex items-center justify-center gap-2 group">Confirm & Build Graph <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></button>
                  </div>
                </div>
             )}
          </div>
        </div>
      </main>

      {/* --- CUSTOM ERROR MODAL --- */}
      {errorModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0A0A0A] border border-red-500/30 rounded-3xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(239,68,68,0.15)] flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">Validation Failed</h2>
            <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
              {errorModal.message}
            </p>
            <button 
              onClick={() => setErrorModal({ isOpen: false, message: "" })}
              className="w-full py-3.5 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)]"
            >
              Understood
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default TrainingStudio;