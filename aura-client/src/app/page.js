"use client"; // Required for Next.js 13+ App Router

import React, { useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  ArrowUpRight, 
  Eye, 
  AlertTriangle, 
  LayoutDashboard, 
  BrainCircuit, 
  Check 
} from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-violet-900 selection:text-white font-sans scroll-smooth overflow-x-hidden">
      
      {/* --- NAVIGATION --- */}
      <nav className="fixed top-0 w-full z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/5">
        <div className="w-full px-6 md:px-12 h-24 flex justify-between items-center">
          <div className="text-3xl font-extrabold tracking-tighter">
            AURA<span className="text-violet-500">.</span>
          </div>
          
          <div className="hidden md:flex gap-12 text-sm font-medium text-zinc-400">
            <Link href="#mission" className="hover:text-white transition-colors">Mission</Link>
            <Link href="#platform" className="hover:text-white transition-colors">Platform</Link>
            <Link href="#roadmap" className="hover:text-white transition-colors">Future</Link>
          </div>

          <Link href="/Signup" className="group relative px-8 py-3 bg-white text-black font-bold text-sm rounded-full overflow-hidden transition-all hover:bg-violet-100">
            <span className="relative z-10 flex items-center gap-2">
              Let's Begin <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-48 pb-24 px-6 md:px-12 min-h-screen flex flex-col justify-center">
        {/* Glow Orb Effect */}
        <div className="absolute top-[-300px] left-1/2 -translate-x-1/2 w-[80vw] h-[800px] bg-[radial-gradient(circle,rgba(109,40,217,0.12)_0%,rgba(0,0,0,0)_70%)] rounded-full pointer-events-none z-0"></div>
        
        <div className="w-full relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 text-xs font-mono text-violet-300 mb-10">
            <span className="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></span>
            SYSTEM OPERATIONAL // V1.0
          </div>

          <h1 className="text-7xl md:text-9xl font-extrabold tracking-tighter leading-[0.85] mb-12">
            ROUTINE <br />
            INTELLIGENCE <br />
            <span className="text-zinc-600">REDEFINED.</span>
          </h1>

          <div className="flex flex-col xl:flex-row items-end justify-between gap-12 border-t border-zinc-800 pt-10">
            <p className="max-w-2xl text-xl text-zinc-400 font-light leading-relaxed">
              We don't just record video. We understand it. AURA utilizes <span className="text-white font-medium">Weakly Supervised Action Segmentation</span> to analyze egocentric footage, creating a safety net for your daily life.
            </p>
            
            <div className="flex gap-12">
              <div className="text-right">
                <div className="text-4xl font-bold font-mono">82%</div>
                <div className="text-sm text-zinc-500 uppercase tracking-widest mt-1">Precision</div>
              </div>
              <div className="w-px h-16 bg-zinc-800"></div>
              <div className="text-right">
                <div className="text-4xl font-bold font-mono">1.2s</div>
                <div className="text-sm text-zinc-500 uppercase tracking-widest mt-1">Latency</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- PLATFORM / BENTO GRID --- */}
      <section id="platform" className="py-24 px-6 md:px-12 bg-[#050505]">
        <div className="w-full">
          <div className="flex justify-between items-end mb-12">
            <h2 className="text-5xl font-bold tracking-tight">The Architecture.</h2>
            <p className="text-zinc-500 font-mono text-sm hidden md:block">SCROLL TO EXPLORE -{'>'}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-6 h-auto md:h-[700px]">
            
            {/* Main Visual Card */}
            <div className="col-span-1 md:col-span-2 row-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-10 relative overflow-hidden group hover:-translate-y-1 hover:bg-white/10 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-900/10 to-transparent"></div>
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="flex justify-between items-start">
                  <div className="p-4 bg-white/5 rounded-2xl"><Eye className="w-8 h-8 text-violet-400" /></div>
                  <span className="font-mono text-xs text-zinc-500">INPUT PROCESSING</span>
                </div>
                
                <div className="mt-10">
                  <div className="flex gap-1 mb-6 opacity-50 group-hover:opacity-100 transition-opacity">
                    <div className="h-24 w-1/4 bg-zinc-800 rounded-md"></div>
                    <div className="h-24 w-1/3 bg-violet-900 rounded-md"></div>
                    <div className="h-24 w-1/6 bg-white/20 rounded-md"></div>
                    <div className="h-24 w-1/4 bg-zinc-800 rounded-md"></div>
                  </div>
                  <h3 className="text-4xl font-bold mb-4">Egocentric Vision Analysis</h3>
                  <p className="text-zinc-400 text-base max-w-lg leading-relaxed">Our SynTNet model processes first-person video feeds, breaking down complex activities into atomic actions without needing frame-by-frame timestamps.</p>
                </div>
              </div>
            </div>

            {/* Anomaly Card */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-10 flex flex-col justify-between hover:-translate-y-1 hover:bg-white/10 transition-all duration-500 md:col-span-2">
              <div className="flex justify-between items-start">
                <div className="p-4 bg-white/5 rounded-2xl w-fit"><AlertTriangle className="w-8 h-8 text-red-400" /></div>
                <ArrowUpRight className="text-zinc-600" />
              </div>
              <div>
                <h3 className="text-3xl font-bold mb-2">Anomaly Detection</h3>
                <p className="text-zinc-500 text-sm font-mono">DEVIATION {'>'} THRESHOLD</p>
              </div>
            </div>

            {/* Dashboard Card */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-10 flex flex-col justify-between hover:-translate-y-1 hover:bg-white/10 transition-all duration-500 md:col-span-1">
              <div className="p-4 bg-white/5 rounded-2xl w-fit"><LayoutDashboard className="w-8 h-8 text-green-400" /></div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Live Dashboard</h3>
                <p className="text-zinc-500 text-xs font-mono">REAL-TIME MONITORING</p>
              </div>
            </div>

            {/* Architecture Card */}
            <div className="bg-violet-900/10 backdrop-blur-xl border border-violet-500/20 rounded-[2rem] p-10 flex flex-col justify-between hover:-translate-y-1 hover:bg-violet-900/20 transition-all duration-500 md:col-span-1">
              <div className="p-4 bg-violet-500/20 rounded-2xl w-fit"><BrainCircuit className="w-8 h-8 text-violet-400" /></div>
              <div>
                <h3 className="text-2xl font-bold mb-2">SynTNet</h3>
                <p className="text-zinc-500 text-xs font-mono">CUSTOM ARCHITECTURE</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- RESEARCH SECTION --- */}
      <section className="py-32 border-y border-zinc-900 bg-[#0A0A0A] relative overflow-hidden">
        <div className="w-full px-6 md:px-12 grid lg:grid-cols-2 gap-20 items-center">
          
          <div className="max-w-3xl">
            <h2 className="text-5xl font-bold tracking-tight mb-8">Built on SynTNet.</h2>
            <div className="space-y-8 text-zinc-400 text-lg">
              <p>
                AURA isn't just a wrapper. It is powered by a custom <strong className="text-white">Temporal Convolutional Network</strong> designed specifically for the temporal segmentation of human action sequences.
              </p>
              <ul className="space-y-4 font-mono text-sm text-zinc-500">
                <li className="flex items-center gap-4">
                  <Check className="w-5 h-5 text-violet-500" /> Temporal Action Segmentation
                </li>
                <li className="flex items-center gap-4">
                  <Check className="w-5 h-5 text-violet-500" /> Weak Supervision (Transcript only)
                </li>
                <li className="flex items-center gap-4">
                  <Check className="w-5 h-5 text-violet-500" /> Frame-wise Accuracy Metric
                </li>
              </ul>
            </div>
            <div className="mt-12">
              <a href="#" className="text-white border-b border-white pb-1 hover:text-violet-400 hover:border-violet-400 transition-colors text-lg">Read the Research Paper -{'>'}</a>
            </div>
          </div>

          <div className="relative w-full">
            <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl blur opacity-25"></div>
            <div className="relative bg-[#0A0A0A] rounded-xl border border-zinc-800 p-8 font-mono text-sm overflow-hidden shadow-2xl">
              <div className="flex gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
              </div>
              <div className="text-zinc-400 space-y-2 text-base">
                <p><span className="text-violet-400">class</span> <span className="text-yellow-200">AURA_Engine</span>(nn.Module):</p>
                <p className="pl-6">def <span className="text-blue-400">__init__</span>(self, layers):</p>
                <p className="pl-12">super().__init__()</p>
                <p className="pl-12">self.encoder = SynTNet(layers)</p>
                <p className="pl-12 text-zinc-600"># Temporal Convolutions</p>
                <p className="pl-12">self.tcn = nn.Conv1d(in_channels, out)</p>
                <br />
                <p className="pl-6">def <span className="text-blue-400">forward</span>(self, video_stream):</p>
                <p className="pl-12">features = self.extract(video_stream)</p>
                <p className="pl-12"><span className="text-violet-400">return</span> self.segment(features)</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- ROADMAP --- */}
      <section id="roadmap" className="py-32 px-6 md:px-12 bg-[#050505]">
        <div className="w-full">
          <h2 className="text-4xl font-bold tracking-tight mb-20 text-center">Development Roadmap</h2>
          
          <div className="grid md:grid-cols-3 gap-12 relative max-w-7xl mx-auto">
            {/* Connector Line */}
            <div className="hidden md:block absolute top-12 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-900 to-transparent z-0"></div>

            {/* Phase 1 */}
            <div className="relative z-10 text-center group">
              <div className="w-24 h-24 mx-auto bg-[#0A0A0A] border border-violet-500 rounded-full flex items-center justify-center mb-8 shadow-[0_0_20px_rgba(109,40,217,0.3)]">
                <span className="font-mono text-violet-400 text-xl font-bold">01</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Web Platform</h3>
              <p className="text-zinc-500 px-6">Current Phase. User registration, reference upload, and simulator inference via web dashboard.</p>
            </div>

            {/* Phase 2 */}
            <div className="relative z-10 text-center group opacity-50 hover:opacity-100 transition-opacity">
              <div className="w-24 h-24 mx-auto bg-[#0A0A0A] border border-zinc-700 rounded-full flex items-center justify-center mb-8">
                <span className="font-mono text-zinc-500 text-xl font-bold">02</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Smart Glass Sync</h3>
              <p className="text-zinc-500 px-6">Direct integration with hardware (Vuzix/Google Glass) for real-time video streaming.</p>
            </div>

            {/* Phase 3 */}
            <div className="relative z-10 text-center group opacity-50 hover:opacity-100 transition-opacity">
              <div className="w-24 h-24 mx-auto bg-[#0A0A0A] border border-zinc-700 rounded-full flex items-center justify-center mb-8">
                <span className="font-mono text-zinc-500 text-xl font-bold">03</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Audio Feedback</h3>
              <p className="text-zinc-500 px-6">Generative AI voice prompts to guide the user when an anomaly is detected.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-24 px-6 md:px-12">
        <div className="w-full text-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] p-20 md:p-32 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-violet-900/20 to-transparent pointer-events-none"></div>

          <h2 className="text-5xl md:text-8xl font-bold tracking-tighter mb-12 relative z-10">
            Ready to optimize<br />your routine?
          </h2>
          <div className="flex flex-col sm:flex-row justify-center gap-6 relative z-10">
            <Link href="/Signup" className="px-10 py-5 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform text-lg">
              Launch The System
            </Link>
            <button className="px-10 py-5 bg-transparent border border-zinc-700 text-white font-bold rounded-full hover:bg-white/10 transition-colors text-lg">
              Contact Research Team
            </button>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-12 border-t border-zinc-900 bg-black text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-2xl font-bold tracking-tighter">AURA<span className="text-violet-500">.</span></span>
        </div>
        <p className="text-zinc-600 text-sm">
          © 2025 Final Year Project. University of Westminster.<br />
          Designed for the future of Assistive Living.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;