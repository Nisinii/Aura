// "use client";

// import React, { useState, useEffect, useRef } from 'react';
// import Link from 'next/link';
// import { useSearchParams } from 'next/navigation';
// import { useRouter } from 'next/navigation';
// import { 
//   ArrowLeft, UploadCloud, Play, Pause, RotateCcw, 
//   AlertTriangle, Check, Cpu, Activity, Clock, 
//   CheckCircle2, ArrowRight, Scan, Zap, Wifi, BatteryMedium, Target, Video
// } from 'lucide-react';

// const Simulator = () => {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const taskName = searchParams.get('task') || "Getting Up";
  
//   // -- REFS --
//   const videoRef = useRef(null);
//   const fileInputRef = useRef(null);
//   const logsEndRef = useRef(null);
//   const spokenAnomaliesRef = useRef(new Set()); // Tracks spoken warnings

//   // -- STATE --
//   const [videoUrl, setVideoUrl] = useState(null);
//   const [videoDuration, setVideoDuration] = useState(0);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [currentTime, setCurrentTime] = useState(0);
  
//   const [processing, setProcessing] = useState(false);
//   const [inferenceLogs, setInferenceLogs] = useState([]); 
//   const [anomaliesFound, setAnomaliesFound] = useState(false);
//   const [currentAction, setCurrentAction] = useState("AWAITING_TELEMETRY");
//   const [isFinished, setIsFinished] = useState(false); 
  
//   // UI State
//   const [displayLogs, setDisplayLogs] = useState([]); 
//   const [isRecording, setIsRecording] = useState(false);

//   // Auto-scroll logs
//   useEffect(() => {
//     logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [displayLogs, isFinished]);

//   // Cleanup speech on page exit
//   useEffect(() => {
//     return () => {
//       if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
//         window.speechSynthesis.cancel();
//       }
//     };
//   }, []);

//   // -- HANDLERS --
//   const triggerFileUpload = () => {
//     if (fileInputRef.current) {
//       fileInputRef.current.click();
//     }
//   };

//   const handleFileUpload = async (e) => {
//     const selectedFile = e.target.files?.[0];
//     if (selectedFile) {
//       setVideoUrl(URL.createObjectURL(selectedFile));
//       setProcessing(true);
//       setInferenceLogs([]);
//       setDisplayLogs([]);
//       setAnomaliesFound(false);
//       setCurrentTime(0);
//       setIsPlaying(false);
//       setIsFinished(false);
//       setCurrentAction("ANALYZING_TOPOLOGY...");
      
//       // Reset spoken tracking for new video
//       spokenAnomaliesRef.current.clear();
//       if ('speechSynthesis' in window) window.speechSynthesis.cancel();

//       // --- GRAB USER ID ---
//       const storedData = localStorage.getItem('user');
//       const currentUser = storedData ? JSON.parse(storedData) : null;
//       if (!currentUser || !currentUser.user_id) {
//           alert("Session expired. Please log in again.");
//           router.push('/login');
//           return;
//       }

//       const formData = new FormData();
//       formData.append("file", selectedFile);
//       formData.append("user_id", currentUser.user_id); // <-- ADDED THIS

//       try {
//         const response = await fetch(`http://localhost:8000/api/inference?task_name=${encodeURIComponent(taskName)}`, {
//           method: "POST",
//           body: formData,
//         });
        
//         const data = await response.json();
        
//         if (data.status === 'error') {
//             addDisplayLog({ message: `ERR: ${data.message}`, type: "anomaly", time: 0 });
//         } else {
//             const sortedLogs = data.logs.sort((a, b) => a.time - b.time);
//             setInferenceLogs(sortedLogs);
//             setAnomaliesFound(data.anomalies_found);
            
//             addDisplayLog({ message: "GTRM GRAPH COMPARISON COMPLETE. HUD ACTIVE.", type: "system", time: 0 });
            
//             setTimeout(() => {
//                 if(videoRef.current) {
//                     videoRef.current.play();
//                     setIsPlaying(true);
//                 }
//             }, 800);
//         }
//       } catch (err) {
//         console.error(err);
//         addDisplayLog({ message: "FATAL: BACKEND UNREACHABLE", type: "anomaly", time: 0 });
//       } finally {
//         setProcessing(false);
//         setCurrentAction("SYS_READY");
//       }
//     }
//   };

//   const handleRecordDemo = async () => {
//     try {
//         const stream = await navigator.mediaDevices.getDisplayMedia({
//             video: { displaySurface: "browser" },
//             audio: false
//         });
        
//         const mediaRecorder = new MediaRecorder(stream);
//         const chunks = [];

//         mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        
//         mediaRecorder.onstop = () => {
//             const blob = new Blob(chunks, { type: 'video/webm' });
//             const url = URL.createObjectURL(blob);
//             const a = document.createElement('a');
//             a.href = url;
//             a.download = `AURA_HUD_DEMO_${taskName.replace(/\s+/g, '_')}.webm`;
//             a.click();
//             setIsRecording(false);
//         };

//         mediaRecorder.start();
//         setIsRecording(true);
        
//         if (videoRef.current) {
//             videoRef.current.play();
//             setIsPlaying(true);
//         }

//         stream.getVideoTracks()[0].onended = () => {
//             mediaRecorder.stop();
//         };

//     } catch (err) {
//         console.error("Recording failed or was cancelled", err);
//         setIsRecording(false);
//     }
//   };

//   const handleCompleteSession = async () => {
//     if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    
//     const validEvents = inferenceLogs.filter(l => l.type === 'normal' || l.type === 'anomaly');
//     const normalCount = validEvents.filter(l => l.type === 'normal').length;
//     const totalCount = validEvents.length;
//     const sessionScore = totalCount > 0 ? (normalCount / totalCount) * 100 : 0;

//     const anomalyLog = inferenceLogs.find(l => l.type === 'anomaly');
//     const detail = anomalyLog ? anomalyLog.message.replace("CRITICAL: ", "") : "Routine Completed Successfully";

//     try {
//         // --- GRAB USER ID ---
//         const storedData = localStorage.getItem('user');
//         const currentUser = storedData ? JSON.parse(storedData) : null;

//         await fetch("http://localhost:8000/api/session/complete", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ 
//                 user_id: currentUser?.user_id, // <-- ADDED THIS
//                 task_name: taskName,
//                 score: sessionScore,
//                 duration: videoDuration,
//                 anomalies_found: anomaliesFound,
//                 anomaly_detail: detail
//             })
//         });
//         router.push('/Dashboard/patient');
//     } catch (e) { console.error(e); }
//   };

//   const addDisplayLog = (logItem) => {
//     setDisplayLogs(prev => [...prev, logItem]);
//   };

//   const handleTimeUpdate = () => {
//     if (videoRef.current) {
//         const time = videoRef.current.currentTime;
//         setCurrentTime(time);
        
//         const relevantEvents = inferenceLogs.filter(e => e.time <= time && e.time > time - 0.3);
//         if (relevantEvents.length > 0) {
//             relevantEvents.forEach(event => {
//                 setDisplayLogs(prev => {
//                     if (prev.some(p => p.message === event.message && Math.abs(p.time - event.time) < 0.5)) return prev;
//                     return [...prev, event];
//                 });
                
//                 if (event.type === 'normal') {
//                     setCurrentAction(event.message.replace("DETECTED: ", ""));
//                 } 
//             });
//         }
//     }
//   };

//   const togglePlay = () => {
//     if (videoRef.current) {
//         if (isPlaying) videoRef.current.pause();
//         else videoRef.current.play();
//         setIsPlaying(!isPlaying);
//     }
//   };

//   const handleVideoEnd = () => {
//       setIsPlaying(false);
//       setIsFinished(true); 
//   };

//   // -- CLEAN AR LOGIC (Top Pill, 5 seconds) --
//   const activeAnomaly = [...displayLogs].reverse().find(
//       log => log.type === 'anomaly' && currentTime >= log.time && (currentTime - log.time) < 5
//   );
  
//   const isAnomalyActive = !!activeAnomaly;

//   let arInstruction = "";
//   if (activeAnomaly) {
//       const msg = activeAnomaly.message;
//       if (msg.toLowerCase().includes("omitted") || msg.toLowerCase().includes("missed")) {
//           const match = msg.match(/'([^']+)'/);
//           const missedStep = match ? match[1] : "Required Step";
//           arInstruction = `MISSED STEP: ${missedStep.toUpperCase()}`;
//       } else {
//           arInstruction = "SEQUENCE ERROR DETECTED";
//       }
//   }

//   // --- TRIGGER VOICE SYNTHESIS ---
//   useEffect(() => {
//       if (activeAnomaly) {
//           const uniqueId = `${activeAnomaly.time}_${activeAnomaly.message}`;
          
//           if (!spokenAnomaliesRef.current.has(uniqueId)) {
//               spokenAnomaliesRef.current.add(uniqueId); // Mark as spoken
              
//               if ('speechSynthesis' in window) {
//                   window.speechSynthesis.cancel(); // Interrupt any ongoing speech
                  
//                   let speechText = "Warning, you performed an unexpected action.";
                  
//                   // Extract step for audio
//                   if (activeAnomaly.message.toLowerCase().includes("omitted") || activeAnomaly.message.toLowerCase().includes("missed")) {
//                       const match = activeAnomaly.message.match(/'([^']+)'/);
//                       const missedStep = match ? match[1] : "a required step";
//                       speechText = `Warning. You missed the step: ${missedStep}.`;
//                   }

//                   const utterance = new SpeechSynthesisUtterance(speechText);
//                   utterance.rate = 1.0; 
//                   utterance.pitch = 1.0; 
//                   window.speechSynthesis.speak(utterance);
//               }
//           }
//       }
//   }, [activeAnomaly]);

//   const totalEvents = inferenceLogs.filter(l => l.type !== 'system').length;
//   const normalEvents = inferenceLogs.filter(l => l.type === 'normal').length;
//   const score = totalEvents > 0 ? Math.round((normalEvents / totalEvents) * 100) : 0;

//   return (
//     <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-violet-500 selection:text-white overflow-hidden flex flex-col">
      
//       {/* HEADER */}
//       <header className="h-16 border-b border-white/10 flex items-center px-6 md:px-10 justify-between bg-[#050505]/80 backdrop-blur-md sticky top-0 z-50">
//         <div className="flex items-center gap-4">
//           <Link href="/Dashboard/patient" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 border border-white/10 transition-colors">
//             <ArrowLeft className="w-4 h-4 text-zinc-400" />
//           </Link>
//           <div className="flex items-center gap-2">
//             <h1 className="text-xl font-extrabold tracking-tighter">AURA<span className="text-violet-500">.</span></h1>
//             <span className="text-zinc-700">/</span>
//             <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Inference Engine</p>
//           </div>
//         </div>
        
//         <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${anomaliesFound ? 'bg-red-900/10 border-red-500/20' : 'bg-violet-500/10 border-violet-500/20'}`}>
//             <div className={`w-1.5 h-1.5 rounded-full ${processing ? 'bg-yellow-500 animate-pulse' : (anomaliesFound ? 'bg-red-500' : 'bg-violet-500')}`}></div>
//             <span className={`text-[10px] font-mono font-bold tracking-widest ${anomaliesFound ? 'text-red-400' : 'text-violet-400'}`}>
//                 {processing ? 'ANALYZING' : (anomaliesFound ? 'VIOLATION LOGGED' : 'AR HUD ACTIVE')}
//             </span>
//         </div>
//       </header>

//       {/* MAIN LAYOUT */}
//       <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 md:p-8 h-[calc(100vh-64px)] relative z-10">
        
//         {/* --- LEFT: SMART GLASSES POV --- */}
//         <div className="lg:col-span-8 flex flex-col gap-6 h-full overflow-y-auto custom-scroll pr-2">
          
//           <div className="flex justify-between items-center px-1">
//              <div className="flex items-center gap-2 text-zinc-500">
//                 <Scan className="w-4 h-4" />
//                 <span className="text-xs font-mono tracking-widest uppercase">Optic Feed // AR_VISOR_01</span>
//              </div>
             
//              <div className="flex gap-3">
//                 {videoUrl && (
//                     <button 
//                         onClick={handleRecordDemo}
//                         disabled={isRecording}
//                         className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all text-xs font-bold ${isRecording ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse' : 'bg-violet-500/10 border-violet-500/30 text-violet-300 hover:bg-violet-500/20'}`}
//                     >
//                         <Video className="w-3.5 h-3.5" /> 
//                         {isRecording ? 'Recording HUD...' : 'Record Demo'}
//                     </button>
//                 )}

//                 <input type="file" ref={fileInputRef} className="hidden" accept="video/*" onChange={handleFileUpload} />
//                 <button 
//                     onClick={triggerFileUpload}
//                     className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-violet-500/30 transition-all text-xs font-bold text-zinc-300 group"
//                 >
//                     <RotateCcw className="w-3.5 h-3.5 group-hover:-rotate-180 transition-transform duration-500" /> 
//                     Reset Visor
//                 </button>
//              </div>
//           </div>

//           {/* SMART GLASSES VIDEO CONTAINER */}
//           <div className={`relative aspect-video bg-black rounded-xl overflow-hidden border transition-all shadow-2xl group ${isAnomalyActive ? 'border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.15)]' : (processing ? 'border-violet-500/50' : 'border-violet-500/30 shadow-[0_0_30px_rgba(139,92,246,0.1)]')}`}>
            
//             {!videoUrl && (
//                <div className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer opacity-80 hover:opacity-100 transition-opacity" onClick={triggerFileUpload}>
//                   <Target className="w-16 h-16 text-violet-500/50 animate-pulse mb-4" />
//                   <h3 className="text-xl font-mono text-violet-400 mb-2 tracking-widest uppercase">Initialize AR Link</h3>
//                   <p className="text-xs text-violet-500/70 font-mono">Upload POV video to begin GTRM overlay</p>
//                </div>
//             )}

//             {processing && (
//                 <div className="absolute inset-0 bg-[#050505]/95 z-50 flex flex-col items-center justify-center backdrop-blur-md">
//                     <div className="w-24 h-24 border border-violet-500/30 border-t-violet-500 rounded-full animate-spin mb-6 flex items-center justify-center">
//                         <div className="w-16 h-16 border border-white/10 border-b-white/50 rounded-full animate-spin-reverse"></div>
//                     </div>
//                     <span className="text-sm font-mono text-violet-400 font-bold tracking-widest animate-pulse">CALIBRATING GTRM TOPOLOGY</span>
//                     <span className="text-[10px] text-violet-500/50 mt-2 font-mono uppercase">Syncing visual cortex...</span>
//                 </div>
//             )}

//             {videoUrl && (
//                <>
//                  <video 
//                     ref={videoRef} 
//                     src={videoUrl} 
//                     className="w-full h-full object-contain" 
//                     onTimeUpdate={handleTimeUpdate} 
//                     onLoadedMetadata={(e) => setVideoDuration(e.target.duration)} 
//                     onEnded={handleVideoEnd}
//                  />
                 
//                  {/* --- AR HUD OVERLAYS --- */}
//                  <div className="absolute inset-0 pointer-events-none z-20">
//                     <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,3px_100%] opacity-30 mix-blend-overlay"></div>
//                     <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]"></div>

//                     {/* Corner Brackets */}
//                     <div className={`absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 transition-colors ${isAnomalyActive ? 'border-red-500' : 'border-violet-500/50'}`}></div>
//                     <div className={`absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 transition-colors ${isAnomalyActive ? 'border-red-500' : 'border-violet-500/50'}`}></div>
//                     <div className={`absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 transition-colors ${isAnomalyActive ? 'border-red-500' : 'border-violet-500/50'}`}></div>
//                     <div className={`absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 transition-colors ${isAnomalyActive ? 'border-red-500' : 'border-violet-500/50'}`}></div>

//                     {/* Status Bar */}
//                     <div className="absolute top-8 left-10 right-10 flex justify-between items-start text-violet-400 font-mono text-[10px] tracking-widest drop-shadow-[0_0_5px_rgba(139,92,246,0.8)]">
//                         <div className="flex gap-4">
//                             <div className="flex items-center gap-2">
//                                 <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-red-500 animate-pulse drop-shadow-[0_0_5px_rgba(239,68,68,1)]' : 'bg-violet-500'}`}></div>
//                                 <span>{isPlaying ? 'REC' : 'STDBY'}</span>
//                             </div>
//                             <span className="opacity-70">T+ {currentTime.toFixed(2)}s</span>
//                         </div>
//                         <div className="flex gap-4 items-center opacity-80">
//                             <BatteryMedium className="w-4 h-4" />
//                         </div>
//                     </div>

//                     {/* Center Crosshair */}
//                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 opacity-30 flex items-center justify-center">
//                         <div className="w-full h-[1px] bg-violet-400 absolute"></div>
//                         <div className="h-full w-[1px] bg-violet-400 absolute"></div>
//                     </div>

//                     {/* Action Target Box */}
//                     <div className="absolute bottom-10 left-10">
//                         <div className="text-[9px] text-violet-400/80 font-mono uppercase mb-1 tracking-widest drop-shadow-[0_0_2px_rgba(139,92,246,0.8)]">Action Match</div>
//                         <div className="text-xl font-mono font-bold text-violet-300 bg-violet-950/40 px-3 py-1 border-l-2 border-violet-400 backdrop-blur-sm drop-shadow-[0_0_5px_rgba(139,92,246,0.5)] uppercase">
//                             {currentAction}
//                         </div>
//                     </div>

//                     {/* --- SLEEK AR ANOMALY PILL (TOP CENTER) --- */}
//                     {isAnomalyActive && (
//                         <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center animate-in slide-in-from-top-4 fade-in duration-300">
//                             <div className="bg-red-950/90 border border-red-500/50 px-6 py-2.5 rounded-full backdrop-blur-md shadow-[0_0_30px_rgba(239,68,68,0.4)] flex items-center gap-3">
//                                 <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
//                                 <span className="text-red-100 font-mono font-bold tracking-widest text-sm">
//                                     {arInstruction}
//                                 </span>
//                             </div>
//                         </div>
//                     )}

//                  </div>
//                </>
//             )}
//           </div>

//           <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-center gap-4">
//              <div className="flex items-center gap-6">
//                 <button onClick={togglePlay} disabled={processing || !videoUrl} className="w-14 h-14 bg-violet-600 rounded-full flex items-center justify-center hover:bg-violet-500 transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(139,92,246,0.4)] hover:scale-105 active:scale-95">
//                    {isPlaying ? <Pause className="w-6 h-6 fill-current text-white" /> : <Play className="w-6 h-6 fill-current text-white ml-1" />}
//                 </button>
//                 <div className="flex-1">
//                    <div className="flex justify-between text-xs text-violet-400/70 font-mono mb-3 uppercase tracking-wider">
//                        <span>T+ {currentTime.toFixed(1)}s</span>
//                        <span>END {videoDuration.toFixed(1)}s</span>
//                    </div>
//                    <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden relative cursor-pointer border border-white/5">
//                       <div className="h-full bg-violet-500 transition-all duration-100 linear relative z-10 shadow-[0_0_10px_rgba(139,92,246,0.8)]" style={{ width: `${(currentTime / videoDuration) * 100}%` }}></div>
//                       {inferenceLogs.filter(l => l.type === 'anomaly').map((ev, i) => (
//                           <div key={i} className="absolute top-0 bottom-0 w-1.5 bg-red-500 z-0 drop-shadow-[0_0_5px_rgba(239,68,68,1)]" style={{ left: `${(ev.time / videoDuration) * 100}%` }} />
//                       ))}
//                    </div>
//                 </div>
//              </div>
//           </div>
//         </div>

//         {/* --- RIGHT: LOGS & SUMMARY --- */}
//         <div className="lg:col-span-4 h-full flex flex-col gap-6">
           
//            <div className="glass-panel rounded-3xl flex-1 flex flex-col border border-white/5 bg-white/[0.02] shadow-xl overflow-hidden min-h-0">
//               <div className="flex items-center gap-3 p-6 border-b border-white/5 bg-[#0A0A0A]/50 backdrop-blur-md z-10">
//                  <Cpu className="text-violet-500 w-5 h-5" />
//                  <h2 className="font-bold text-sm font-mono tracking-widest uppercase text-violet-400">System Telemetry</h2>
//               </div>

//               <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scroll bg-[#050505]/50">
//                  {displayLogs.length === 0 && (
//                     <div className="flex flex-col items-center justify-center h-full text-violet-500/30 space-y-2">
//                         <Scan className="w-10 h-10 animate-pulse" />
//                         <p className="text-xs font-mono tracking-widest">AWAITING OPTIC LINK...</p>
//                     </div>
//                  )}
//                  {displayLogs.map((log, i) => {
//                     let styles = "border-zinc-800 bg-zinc-900/50 text-zinc-400";
//                     let Icon = Clock;
                    
//                     if (log.type === 'anomaly') { styles = "border-red-500/50 bg-red-950/40 text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.2)] font-bold"; Icon = AlertTriangle; } 
//                     else if (log.type === 'normal') { styles = "border-emerald-500/30 bg-emerald-950/20 text-emerald-400"; Icon = Check; }
//                     else if (log.type === 'system') { styles = "border-violet-500/50 bg-violet-950/20 text-violet-300"; Icon = Cpu; }

//                     return (
//                         <div key={i} className={`p-3 rounded-lg border-l-2 ${styles} text-xs font-mono animate-in slide-in-from-right-4 fade-in duration-300`}>
//                            <div className="flex justify-between mb-1 opacity-50 text-[9px] uppercase tracking-wider">
//                               <span>{log.time > 0 ? `T+${log.time.toFixed(2)}s` : 'SYS'}</span>
//                               <span>MSG_ID_{1000+i}</span>
//                            </div>
//                            <div className="flex items-start gap-2.5">
//                               <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" />
//                               <span className="leading-relaxed">{log.message}</span>
//                            </div>
//                         </div>
//                     );
//                  })}
//                  <div ref={logsEndRef} />
//               </div>
//            </div>

//            {isFinished && (
//                 <div className="glass-panel rounded-3xl p-6 border border-violet-500/30 bg-violet-500/5 animate-in slide-in-from-bottom-4 shadow-[0_0_30px_rgba(139,92,246,0.1)]">
//                     <div className="flex justify-between items-start mb-4">
//                         <div>
//                             <h3 className="text-xs text-violet-400/70 font-mono uppercase tracking-widest mb-1">GTRM Match Score</h3>
//                             <div className={`text-4xl font-black font-mono ${score >= 80 ? 'text-emerald-400' : 'text-yellow-400'}`}>{score}%</div>
//                         </div>
//                         <div className={`p-2 rounded-xl border ${score >= 80 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-yellow-500/10 border-yellow-500/20'}`}>
//                             <CheckCircle2 className={`w-6 h-6 ${score >= 80 ? 'text-emerald-400' : 'text-yellow-400'}`} />
//                         </div>
//                     </div>

//                     <div className="space-y-4">
//                         <div className="flex justify-between text-[10px] text-violet-400 font-mono uppercase tracking-wider">
//                             <span>Nodes Verified</span>
//                             <span className="text-white">{normalEvents}/{totalEvents}</span>
//                         </div>
//                         <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
//                             <div className={`h-full transition-all duration-1000 ${score >= 80 ? 'bg-emerald-500' : 'bg-yellow-500'}`} style={{ width: `${score}%` }}></div>
//                         </div>
                        
//                         <button 
//                             onClick={handleCompleteSession}
//                             className="w-full py-3 mt-2 bg-violet-500/20 border border-violet-500/50 text-violet-300 font-bold font-mono uppercase tracking-widest rounded-xl hover:bg-violet-500 hover:text-white transition-all flex items-center justify-center gap-2 group text-xs"
//                         >
//                             Log Session Data
//                             <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
//                         </button>
//                     </div>
//                 </div>
//            )}

//            {!isFinished && inferenceLogs.length > 0 && (
//                 <div className="glass-panel rounded-3xl p-4 border border-white/5 bg-white/[0.02]">
//                     <button 
//                         onClick={handleCompleteSession}
//                         className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-white font-mono uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 text-[10px] border border-white/5"
//                     >
//                         Force Terminate Link
//                     </button>
//                 </div>
//            )}

//         </div>

//       </main>
//     </div>
//   );
// };

// export default Simulator;

"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, UploadCloud, Play, Pause, RotateCcw, 
  AlertTriangle, Check, Cpu, Activity, Clock, 
  CheckCircle2, ArrowRight, Scan, Zap, Wifi, BatteryMedium, Target, Video
} from 'lucide-react';

const Simulator = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const taskName = searchParams.get('task') || "Getting Up";
  
  // -- REFS --
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const logsEndRef = useRef(null);
  const spokenAnomaliesRef = useRef(new Set()); 

  // -- STATE --
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  
  const [processing, setProcessing] = useState(false);
  const [inferenceLogs, setInferenceLogs] = useState([]); 
  const [anomaliesFound, setAnomaliesFound] = useState(false);
  const [currentAction, setCurrentAction] = useState("AWAITING_TELEMETRY");
  const [isFinished, setIsFinished] = useState(false); 
  
  // UI State
  const [displayLogs, setDisplayLogs] = useState([]); 
  const [isRecording, setIsRecording] = useState(false);
  
  // --- NEW: ERROR MODAL STATE ---
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: "" });

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayLogs, isFinished]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setVideoUrl(URL.createObjectURL(selectedFile));
      setProcessing(true);
      setInferenceLogs([]);
      setDisplayLogs([]);
      setAnomaliesFound(false);
      setCurrentTime(0);
      setIsPlaying(false);
      setIsFinished(false);
      setCurrentAction("ANALYZING_TOPOLOGY...");
      
      spokenAnomaliesRef.current.clear();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();

      const storedData = localStorage.getItem('user');
      const currentUser = storedData ? JSON.parse(storedData) : null;
      if (!currentUser || !currentUser.user_id) {
          setErrorModal({ isOpen: true, message: "Session expired. Please log in again." });
          setTimeout(() => router.push('/login'), 2000);
          return;
      }

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("user_id", currentUser.user_id); 

      try {
        const response = await fetch(`http://localhost:8000/api/inference?task_name=${encodeURIComponent(taskName)}`, {
          method: "POST",
          body: formData,
        });
        
        const data = await response.json();
        
        // --- NEW: CATCH BACKEND VALIDATION ERROR ---
        if (!response.ok) {
            throw new Error(data.detail || "Inference failed");
        }
        
        if (data.status === 'error') {
            throw new Error(data.message || "Unknown error");
        } 
        
        const sortedLogs = data.logs.sort((a, b) => a.time - b.time);
        setInferenceLogs(sortedLogs);
        setAnomaliesFound(data.anomalies_found);
        
        addDisplayLog({ message: "GTRM GRAPH COMPARISON COMPLETE. HUD ACTIVE.", type: "system", time: 0 });
        
        setTimeout(() => {
            if(videoRef.current) {
                videoRef.current.play();
                setIsPlaying(true);
            }
        }, 800);
        
      } catch (err) {
        console.error(err);
        // --- NEW: TRIGGER CUSTOM MODAL ---
        setErrorModal({ isOpen: true, message: err.message });
        setVideoUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } finally {
        setProcessing(false);
        setCurrentAction("SYS_READY");
      }
    }
  };

  const handleRecordDemo = async () => {
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: { displaySurface: "browser" },
            audio: false
        });
        
        const mediaRecorder = new MediaRecorder(stream);
        const chunks = [];

        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        
        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `AURA_HUD_DEMO_${taskName.replace(/\s+/g, '_')}.webm`;
            a.click();
            setIsRecording(false);
        };

        mediaRecorder.start();
        setIsRecording(true);
        
        if (videoRef.current) {
            videoRef.current.play();
            setIsPlaying(true);
        }

        stream.getVideoTracks()[0].onended = () => {
            mediaRecorder.stop();
        };

    } catch (err) {
        console.error("Recording failed", err);
        setIsRecording(false);
    }
  };

  const handleCompleteSession = async () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    
    const validEvents = inferenceLogs.filter(l => l.type === 'normal' || l.type === 'anomaly');
    const normalCount = validEvents.filter(l => l.type === 'normal').length;
    const totalCount = validEvents.length;
    const sessionScore = totalCount > 0 ? (normalCount / totalCount) * 100 : 0;

    const anomalyLog = inferenceLogs.find(l => l.type === 'anomaly');
    const detail = anomalyLog ? anomalyLog.message.replace("CRITICAL: ", "") : "Routine Completed Successfully";

    try {
        const storedData = localStorage.getItem('user');
        const currentUser = storedData ? JSON.parse(storedData) : null;

        await fetch("http://localhost:8000/api/session/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                user_id: currentUser?.user_id,
                task_name: taskName,
                score: sessionScore,
                duration: videoDuration,
                anomalies_found: anomaliesFound,
                anomaly_detail: detail
            })
        });
        router.push('/Dashboard/patient');
    } catch (e) { console.error(e); }
  };

  const addDisplayLog = (logItem) => {
    setDisplayLogs(prev => [...prev, logItem]);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
        const time = videoRef.current.currentTime;
        setCurrentTime(time);
        
        const relevantEvents = inferenceLogs.filter(e => e.time <= time && e.time > time - 0.3);
        if (relevantEvents.length > 0) {
            relevantEvents.forEach(event => {
                setDisplayLogs(prev => {
                    if (prev.some(p => p.message === event.message && Math.abs(p.time - event.time) < 0.5)) return prev;
                    return [...prev, event];
                });
                
                if (event.type === 'normal') {
                    setCurrentAction(event.message.replace("DETECTED: ", ""));
                } 
            });
        }
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
        if (isPlaying) videoRef.current.pause();
        else videoRef.current.play();
        setIsPlaying(!isPlaying);
    }
  };

  const handleVideoEnd = () => {
      setIsPlaying(false);
      setIsFinished(true); 
  };

  const activeAnomaly = [...displayLogs].reverse().find(
      log => log.type === 'anomaly' && currentTime >= log.time && (currentTime - log.time) < 5
  );
  
  const isAnomalyActive = !!activeAnomaly;

  let arInstruction = "";
  if (activeAnomaly) {
      const msg = activeAnomaly.message;
      if (msg.toLowerCase().includes("omitted") || msg.toLowerCase().includes("missed")) {
          const match = msg.match(/'([^']+)'/);
          const missedStep = match ? match[1] : "Required Step";
          arInstruction = `MISSED STEP: ${missedStep.toUpperCase()}`;
      } else {
          arInstruction = "SEQUENCE ERROR DETECTED";
      }
  }

  useEffect(() => {
      if (activeAnomaly) {
          const uniqueId = `${activeAnomaly.time}_${activeAnomaly.message}`;
          
          if (!spokenAnomaliesRef.current.has(uniqueId)) {
              spokenAnomaliesRef.current.add(uniqueId);
              
              if ('speechSynthesis' in window) {
                  window.speechSynthesis.cancel(); 
                  
                  let speechText = "Warning, you performed an unexpected action.";
                  
                  if (activeAnomaly.message.toLowerCase().includes("omitted") || activeAnomaly.message.toLowerCase().includes("missed")) {
                      const match = activeAnomaly.message.match(/'([^']+)'/);
                      const missedStep = match ? match[1] : "a required step";
                      speechText = `Warning. You missed the step: ${missedStep}.`;
                  }

                  const utterance = new SpeechSynthesisUtterance(speechText);
                  utterance.rate = 1.0; 
                  utterance.pitch = 1.0; 
                  window.speechSynthesis.speak(utterance);
              }
          }
      }
  }, [activeAnomaly]);

  const totalEvents = inferenceLogs.filter(l => l.type !== 'system').length;
  const normalEvents = inferenceLogs.filter(l => l.type === 'normal').length;
  const score = totalEvents > 0 ? Math.round((normalEvents / totalEvents) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-violet-500 selection:text-white overflow-hidden flex flex-col relative">
      
      {/* HEADER */}
      <header className="h-16 border-b border-white/10 flex items-center px-6 md:px-10 justify-between bg-[#050505]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link href="/Dashboard/patient" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 border border-white/10 transition-colors">
            <ArrowLeft className="w-4 h-4 text-zinc-400" />
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold tracking-tighter">AURA<span className="text-violet-500">.</span></h1>
            <span className="text-zinc-700">/</span>
            <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Inference Engine</p>
          </div>
        </div>
        
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${anomaliesFound ? 'bg-red-900/10 border-red-500/20' : 'bg-violet-500/10 border-violet-500/20'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${processing ? 'bg-yellow-500 animate-pulse' : (anomaliesFound ? 'bg-red-500' : 'bg-violet-500')}`}></div>
            <span className={`text-[10px] font-mono font-bold tracking-widest ${anomaliesFound ? 'text-red-400' : 'text-violet-400'}`}>
                {processing ? 'ANALYZING' : (anomaliesFound ? 'VIOLATION LOGGED' : 'AR HUD ACTIVE')}
            </span>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 md:p-8 h-[calc(100vh-64px)] relative z-10">
        
        {/* --- LEFT: SMART GLASSES POV --- */}
        <div className="lg:col-span-8 flex flex-col gap-6 h-full overflow-y-auto custom-scroll pr-2">
          
          <div className="flex justify-between items-center px-1">
             <div className="flex items-center gap-2 text-zinc-500">
                <Scan className="w-4 h-4" />
                <span className="text-xs font-mono tracking-widest uppercase">Optic Feed // AR_VISOR_01</span>
             </div>
             
             <div className="flex gap-3">
                {videoUrl && (
                    <button 
                        onClick={handleRecordDemo}
                        disabled={isRecording}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all text-xs font-bold ${isRecording ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse' : 'bg-violet-500/10 border-violet-500/30 text-violet-300 hover:bg-violet-500/20'}`}
                    >
                        <Video className="w-3.5 h-3.5" /> 
                        {isRecording ? 'Recording HUD...' : 'Record Demo'}
                    </button>
                )}

                <input type="file" ref={fileInputRef} className="hidden" accept="video/*" onChange={handleFileUpload} />
                <button 
                    onClick={triggerFileUpload}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-violet-500/30 transition-all text-xs font-bold text-zinc-300 group"
                >
                    <RotateCcw className="w-3.5 h-3.5 group-hover:-rotate-180 transition-transform duration-500" /> 
                    Reset Visor
                </button>
             </div>
          </div>

          <div className={`relative aspect-video bg-black rounded-xl overflow-hidden border transition-all shadow-2xl group ${isAnomalyActive ? 'border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.15)]' : (processing ? 'border-violet-500/50' : 'border-violet-500/30 shadow-[0_0_30px_rgba(139,92,246,0.1)]')}`}>
            
            {!videoUrl && (
               <div className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer opacity-80 hover:opacity-100 transition-opacity" onClick={triggerFileUpload}>
                  <Target className="w-16 h-16 text-violet-500/50 animate-pulse mb-4" />
                  <h3 className="text-xl font-mono text-violet-400 mb-2 tracking-widest uppercase">Initialize AR Link</h3>
                  <p className="text-xs text-violet-500/70 font-mono">Upload POV video to begin GTRM overlay</p>
               </div>
            )}

            {processing && (
                <div className="absolute inset-0 bg-[#050505]/95 z-50 flex flex-col items-center justify-center backdrop-blur-md">
                    <div className="w-24 h-24 border border-violet-500/30 border-t-violet-500 rounded-full animate-spin mb-6 flex items-center justify-center">
                        <div className="w-16 h-16 border border-white/10 border-b-white/50 rounded-full animate-spin-reverse"></div>
                    </div>
                    <span className="text-sm font-mono text-violet-400 font-bold tracking-widest animate-pulse">CALIBRATING GTRM TOPOLOGY</span>
                    <span className="text-[10px] text-violet-500/50 mt-2 font-mono uppercase">Syncing visual cortex...</span>
                </div>
            )}

            {videoUrl && (
               <>
                 <video 
                    ref={videoRef} 
                    src={videoUrl} 
                    className="w-full h-full object-contain" 
                    onTimeUpdate={handleTimeUpdate} 
                    onLoadedMetadata={(e) => setVideoDuration(e.target.duration)} 
                    onEnded={handleVideoEnd}
                 />
                 
                 <div className="absolute inset-0 pointer-events-none z-20">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,3px_100%] opacity-30 mix-blend-overlay"></div>
                    <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]"></div>

                    <div className={`absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 transition-colors ${isAnomalyActive ? 'border-red-500' : 'border-violet-500/50'}`}></div>
                    <div className={`absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 transition-colors ${isAnomalyActive ? 'border-red-500' : 'border-violet-500/50'}`}></div>
                    <div className={`absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 transition-colors ${isAnomalyActive ? 'border-red-500' : 'border-violet-500/50'}`}></div>
                    <div className={`absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 transition-colors ${isAnomalyActive ? 'border-red-500' : 'border-violet-500/50'}`}></div>

                    <div className="absolute top-8 left-10 right-10 flex justify-between items-start text-violet-400 font-mono text-[10px] tracking-widest drop-shadow-[0_0_5px_rgba(139,92,246,0.8)]">
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-red-500 animate-pulse drop-shadow-[0_0_5px_rgba(239,68,68,1)]' : 'bg-violet-500'}`}></div>
                                <span>{isPlaying ? 'REC' : 'STDBY'}</span>
                            </div>
                            <span className="opacity-70">T+ {currentTime.toFixed(2)}s</span>
                        </div>
                        <div className="flex gap-4 items-center opacity-80">
                            <BatteryMedium className="w-4 h-4" />
                        </div>
                    </div>

                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 opacity-30 flex items-center justify-center">
                        <div className="w-full h-[1px] bg-violet-400 absolute"></div>
                        <div className="h-full w-[1px] bg-violet-400 absolute"></div>
                    </div>

                    <div className="absolute bottom-10 left-10">
                        <div className="text-[9px] text-violet-400/80 font-mono uppercase mb-1 tracking-widest drop-shadow-[0_0_2px_rgba(139,92,246,0.8)]">Action Match</div>
                        <div className="text-xl font-mono font-bold text-violet-300 bg-violet-950/40 px-3 py-1 border-l-2 border-violet-400 backdrop-blur-sm drop-shadow-[0_0_5px_rgba(139,92,246,0.5)] uppercase">
                            {currentAction}
                        </div>
                    </div>

                    {isAnomalyActive && (
                        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center animate-in slide-in-from-top-4 fade-in duration-300">
                            <div className="bg-red-950/90 border border-red-500/50 px-6 py-2.5 rounded-full backdrop-blur-md shadow-[0_0_30px_rgba(239,68,68,0.4)] flex items-center gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
                                <span className="text-red-100 font-mono font-bold tracking-widest text-sm">
                                    {arInstruction}
                                </span>
                            </div>
                        </div>
                    )}

                 </div>
               </>
            )}
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-center gap-4">
             <div className="flex items-center gap-6">
                <button onClick={togglePlay} disabled={processing || !videoUrl} className="w-14 h-14 bg-violet-600 rounded-full flex items-center justify-center hover:bg-violet-500 transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(139,92,246,0.4)] hover:scale-105 active:scale-95">
                   {isPlaying ? <Pause className="w-6 h-6 fill-current text-white" /> : <Play className="w-6 h-6 fill-current text-white ml-1" />}
                </button>
                <div className="flex-1">
                   <div className="flex justify-between text-xs text-violet-400/70 font-mono mb-3 uppercase tracking-wider">
                       <span>T+ {currentTime.toFixed(1)}s</span>
                       <span>END {videoDuration.toFixed(1)}s</span>
                   </div>
                   <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden relative cursor-pointer border border-white/5">
                      <div className="h-full bg-violet-500 transition-all duration-100 linear relative z-10 shadow-[0_0_10px_rgba(139,92,246,0.8)]" style={{ width: `${(currentTime / videoDuration) * 100}%` }}></div>
                      {inferenceLogs.filter(l => l.type === 'anomaly').map((ev, i) => (
                          <div key={i} className="absolute top-0 bottom-0 w-1.5 bg-red-500 z-0 drop-shadow-[0_0_5px_rgba(239,68,68,1)]" style={{ left: `${(ev.time / videoDuration) * 100}%` }} />
                      ))}
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* --- RIGHT: LOGS & SUMMARY --- */}
        <div className="lg:col-span-4 h-full flex flex-col gap-6">
           
           <div className="glass-panel rounded-3xl flex-1 flex flex-col border border-white/5 bg-white/[0.02] shadow-xl overflow-hidden min-h-0">
              <div className="flex items-center gap-3 p-6 border-b border-white/5 bg-[#0A0A0A]/50 backdrop-blur-md z-10">
                 <Cpu className="text-violet-500 w-5 h-5" />
                 <h2 className="font-bold text-sm font-mono tracking-widest uppercase text-violet-400">System Telemetry</h2>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scroll bg-[#050505]/50">
                 {displayLogs.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-violet-500/30 space-y-2">
                        <Scan className="w-10 h-10 animate-pulse" />
                        <p className="text-xs font-mono tracking-widest">AWAITING OPTIC LINK...</p>
                    </div>
                 )}
                 {displayLogs.map((log, i) => {
                    let styles = "border-zinc-800 bg-zinc-900/50 text-zinc-400";
                    let Icon = Clock;
                    
                    if (log.type === 'anomaly') { styles = "border-red-500/50 bg-red-950/40 text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.2)] font-bold"; Icon = AlertTriangle; } 
                    else if (log.type === 'normal') { styles = "border-emerald-500/30 bg-emerald-950/20 text-emerald-400"; Icon = Check; }
                    else if (log.type === 'system') { styles = "border-violet-500/50 bg-violet-950/20 text-violet-300"; Icon = Cpu; }

                    return (
                        <div key={i} className={`p-3 rounded-lg border-l-2 ${styles} text-xs font-mono animate-in slide-in-from-right-4 fade-in duration-300`}>
                           <div className="flex justify-between mb-1 opacity-50 text-[9px] uppercase tracking-wider">
                              <span>{log.time > 0 ? `T+${log.time.toFixed(2)}s` : 'SYS'}</span>
                              <span>MSG_ID_{1000+i}</span>
                           </div>
                           <div className="flex items-start gap-2.5">
                              <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                              <span className="leading-relaxed">{log.message}</span>
                           </div>
                        </div>
                    );
                 })}
                 <div ref={logsEndRef} />
              </div>
           </div>

           {isFinished && (
                <div className="glass-panel rounded-3xl p-6 border border-violet-500/30 bg-violet-500/5 animate-in slide-in-from-bottom-4 shadow-[0_0_30px_rgba(139,92,246,0.1)]">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-xs text-violet-400/70 font-mono uppercase tracking-widest mb-1">GTRM Match Score</h3>
                            <div className={`text-4xl font-black font-mono ${score >= 80 ? 'text-emerald-400' : 'text-yellow-400'}`}>{score}%</div>
                        </div>
                        <div className={`p-2 rounded-xl border ${score >= 80 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-yellow-500/10 border-yellow-500/20'}`}>
                            <CheckCircle2 className={`w-6 h-6 ${score >= 80 ? 'text-emerald-400' : 'text-yellow-400'}`} />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between text-[10px] text-violet-400 font-mono uppercase tracking-wider">
                            <span>Nodes Verified</span>
                            <span className="text-white">{normalEvents}/{totalEvents}</span>
                        </div>
                        <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div className={`h-full transition-all duration-1000 ${score >= 80 ? 'bg-emerald-500' : 'bg-yellow-500'}`} style={{ width: `${score}%` }}></div>
                        </div>
                        
                        <button 
                            onClick={handleCompleteSession}
                            className="w-full py-3 mt-2 bg-violet-500/20 border border-violet-500/50 text-violet-300 font-bold font-mono uppercase tracking-widest rounded-xl hover:bg-violet-500 hover:text-white transition-all flex items-center justify-center gap-2 group text-xs"
                        >
                            Log Session Data
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
           )}

           {!isFinished && inferenceLogs.length > 0 && (
                <div className="glass-panel rounded-3xl p-4 border border-white/5 bg-white/[0.02]">
                    <button 
                        onClick={handleCompleteSession}
                        className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-white font-mono uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 text-[10px] border border-white/5"
                    >
                        Force Terminate Link
                    </button>
                </div>
           )}

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

export default Simulator;