"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  User, 
  Lock, 
  Bell, 
  Shield, 
  Save, 
  CreditCard,
  Smartphone,
  Eye,
  Activity,
  FileText,
  LogOut,
  ChevronRight,
  Globe
} from 'lucide-react';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile');

  // Extended Menu
  const menuItems = [
    { id: 'profile', label: 'Personal & Medical', icon: User, desc: "Manage personal details and medical ID" },
    { id: 'devices', label: 'Devices & Sensors', icon: Smartphone, desc: "Connected smart glasses and wearables" },
    { id: 'notifications', label: 'Notifications', icon: Bell, desc: "Alert preferences and quiet hours" },
    { id: 'privacy', label: 'Privacy & Data', icon: Shield, desc: "Data sharing and export controls" },
    { id: 'accessibility', label: 'Accessibility', icon: Eye, desc: "Display and audio settings" },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col">
      
      {/* FULL WIDTH NAV */}
      <nav className="border-b border-white/10 bg-[#050505]/80 backdrop-blur-md px-6 md:px-12 h-20 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link 
            href="/Dashboard/patient" 
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-400 group-hover:text-white" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Account Settings</h1>
            <p className="text-xs text-zinc-500">Manage your AURA experience</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <button className="text-xs font-bold text-zinc-500 hover:text-white transition-colors">Help Center</button>
           <div className="w-px h-4 bg-white/10"></div>
           <button className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors">Sign Out</button>
        </div>
      </nav>

      {/* FULL WIDTH LAYOUT */}
      <main className="flex-1 w-full px-6 md:px-12 py-8">
        <div className="grid grid-cols-12 gap-8 h-full">
          
          {/* LEFT SIDEBAR (3 Columns) */}
          <aside className="col-span-12 lg:col-span-3 space-y-2">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 px-2">General</p>
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`group flex items-center justify-between w-full p-4 rounded-2xl transition-all border text-left ${
                  activeTab === item.id 
                  ? 'bg-violet-500/10 border-violet-500/50' 
                  : 'bg-transparent border-transparent hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${activeTab === item.id ? 'bg-violet-500 text-white' : 'bg-white/5 text-zinc-400 group-hover:text-white'}`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className={`block text-sm font-bold ${activeTab === item.id ? 'text-white' : 'text-zinc-400 group-hover:text-white'}`}>
                      {item.label}
                    </span>
                    <span className="block text-[10px] text-zinc-600 mt-0.5 max-w-[140px] truncate">{item.desc}</span>
                  </div>
                </div>
                {activeTab === item.id && <ChevronRight className="w-4 h-4 text-violet-500" />}
              </button>
            ))}
          </aside>

          {/* RIGHT CONTENT (9 Columns) */}
          <section className="col-span-12 lg:col-span-9">
            <div className="h-full glass-panel rounded-3xl p-8 md:p-10 border border-white/5 bg-white/[0.01]">
              
              {/* --- TAB: PROFILE --- */}
              {activeTab === 'profile' && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex justify-between items-end border-b border-white/5 pb-6">
                    <div>
                      <h2 className="text-2xl font-bold">Personal & Medical Profile</h2>
                      <p className="text-zinc-400 text-sm mt-1">Manage your identity and clinical information.</p>
                    </div>
                    <button className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-violet-900/20">
                      <Save className="w-4 h-4" /> Save Changes
                    </button>
                  </div>

                  {/* Avatar Section */}
                  <div className="flex items-center gap-8">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-violet-500 to-blue-600 p-[2px]">
                        <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                           <User className="w-10 h-10 text-white/80" />
                        </div>
                      </div>
                      <button className="absolute bottom-0 right-0 p-2 bg-zinc-800 rounded-full border border-black hover:bg-zinc-700 transition-colors">
                        <EditIcon className="w-3 h-3 text-white" />
                      </button>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Profile Photo</h3>
                      <p className="text-xs text-zinc-500 mb-3">This will be displayed to your assigned clinicians.</p>
                      <div className="flex gap-3">
                        <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold hover:bg-white/10 transition-colors">Upload New</button>
                        <button className="px-4 py-2 text-red-400 text-xs font-bold hover:text-red-300 transition-colors">Remove</button>
                      </div>
                    </div>
                  </div>

                  {/* Forms Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5 pb-2">Basic Details</h4>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-zinc-300">Full Name</label>
                          <input type="text" defaultValue="John Doe" className="w-full bg-black/50 border border-white/10 rounded-xl p-3.5 text-sm focus:border-violet-500 focus:outline-none transition-colors" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-zinc-300">Email Address</label>
                          <input type="email" defaultValue="john.doe@example.com" className="w-full bg-black/50 border border-white/10 rounded-xl p-3.5 text-sm focus:border-violet-500 focus:outline-none transition-colors" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                              <label className="text-xs font-medium text-zinc-300">Phone</label>
                              <input type="tel" defaultValue="+1 (555) 000-0000" className="w-full bg-black/50 border border-white/10 rounded-xl p-3.5 text-sm focus:border-violet-500 focus:outline-none transition-colors" />
                           </div>
                           <div className="space-y-2">
                              <label className="text-xs font-medium text-zinc-300">Date of Birth</label>
                              <input type="date" className="w-full bg-black/50 border border-white/10 rounded-xl p-3.5 text-sm focus:border-violet-500 focus:outline-none transition-colors text-zinc-400" />
                           </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5 pb-2">Medical Context</h4>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-zinc-300">Primary Condition</label>
                          <select className="w-full bg-black/50 border border-white/10 rounded-xl p-3.5 text-sm focus:border-violet-500 focus:outline-none transition-colors text-zinc-300">
                            <option>Mild Cognitive Impairment (MCI)</option>
                            <option>Early Stage Dementia</option>
                            <option>Traumatic Brain Injury (TBI)</option>
                            <option>None / Preventive</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-zinc-300">Emergency Contact</label>
                          <input type="text" defaultValue="Sarah Doe (Wife)" className="w-full bg-black/50 border border-white/10 rounded-xl p-3.5 text-sm focus:border-violet-500 focus:outline-none transition-colors" />
                        </div>
                        <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/20">
                           <div className="flex items-start gap-3">
                              <Activity className="w-5 h-5 text-violet-400 mt-0.5" />
                              <div>
                                 <h5 className="text-sm font-bold text-violet-100">Sync with Clinical Records</h5>
                                 <p className="text-xs text-violet-300/60 mt-1 mb-3">Allow AURA to fetch basic health data from your hospital provider.</p>
                                 <button className="text-xs font-bold bg-violet-500/20 px-3 py-1.5 rounded-lg text-violet-300 hover:bg-violet-500 hover:text-white transition-colors">Connect Provider</button>
                              </div>
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* --- TAB: DEVICES --- */}
              {activeTab === 'devices' && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <div>
                      <h2 className="text-2xl font-bold">Connected Devices</h2>
                      <p className="text-zinc-400 text-sm mt-1">Manage smart glasses and sensors used for routine tracking.</p>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Active Device */}
                      <div className="p-6 rounded-2xl bg-gradient-to-br from-zinc-900 to-black border border-emerald-500/30 relative overflow-hidden group">
                         <div className="absolute top-4 right-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[10px] font-bold text-emerald-500 tracking-wider">ONLINE</span>
                         </div>
                         <Smartphone className="w-8 h-8 text-white mb-4" />
                         <h3 className="text-lg font-bold">Vuzix Blade 2</h3>
                         <p className="text-xs text-zinc-500 font-mono mt-1">ID: VZX-9928-XA</p>
                         <div className="mt-6 flex gap-3">
                            <button className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold border border-white/10 transition-colors">Calibrate</button>
                            <button className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold border border-white/10 transition-colors">Ping</button>
                         </div>
                      </div>

                      {/* Add New Device */}
                      <div className="p-6 rounded-2xl border border-dashed border-zinc-700 flex flex-col items-center justify-center text-center hover:border-violet-500 hover:bg-violet-500/5 transition-all cursor-pointer group">
                         <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:bg-violet-500/20 transition-colors">
                            <span className="text-2xl text-zinc-400 group-hover:text-violet-400">+</span>
                         </div>
                         <h3 className="text-sm font-bold text-zinc-300 group-hover:text-white">Pair New Device</h3>
                         <p className="text-xs text-zinc-500 mt-1">Supports Vuzix, Google Glass, and GoPro</p>
                      </div>
                   </div>
                </div>
              )}

              {/* --- TAB: PRIVACY --- */}
              {activeTab === 'privacy' && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <div>
                      <h2 className="text-2xl font-bold">Privacy & Data Control</h2>
                      <p className="text-zinc-400 text-sm mt-1">We take your data sovereignty seriously.</p>
                   </div>

                   <div className="space-y-6">
                      <div className="flex items-center justify-between p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                         <div className="flex gap-4">
                            <div className="p-3 rounded-xl bg-violet-500/10 text-violet-400"><FileText className="w-6 h-6" /></div>
                            <div>
                               <h3 className="text-base font-bold text-white">Download Your Data</h3>
                               <p className="text-xs text-zinc-500 mt-1 max-w-md">Get a full copy of your routine logs, video metadata, and performance history in JSON format.</p>
                            </div>
                         </div>
                         <button className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-lg text-sm font-bold transition-colors">Request Archive</button>
                      </div>

                      <div className="flex items-center justify-between p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                         <div className="flex gap-4">
                            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400"><Activity className="w-6 h-6" /></div>
                            <div>
                               <h3 className="text-base font-bold text-white">Doctor Access</h3>
                               <p className="text-xs text-zinc-500 mt-1 max-w-md">Currently, <strong className="text-white">Dr. Sarah Connor</strong> has read-access to your analytics.</p>
                            </div>
                         </div>
                         <button className="px-4 py-2 border border-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 rounded-lg text-sm font-bold transition-colors">Revoke Access</button>
                      </div>
                   </div>
                </div>
              )}

              {/* --- TAB: NOTIFICATIONS --- */}
              {activeTab === 'notifications' && (
                 <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div>
                      <h2 className="text-2xl font-bold">Notification Preferences</h2>
                      <p className="text-zinc-400 text-sm mt-1">Customize how and when you receive alerts.</p>
                    </div>

                    <div className="space-y-6 max-w-2xl">
                       <div className="flex items-center justify-between">
                          <div>
                             <h3 className="font-bold text-white">Critical Alerts</h3>
                             <p className="text-xs text-zinc-500">Immediate notifications for skipped steps or safety hazards.</p>
                          </div>
                          <ToggleSwitch checked={true} />
                       </div>
                       <div className="w-full h-px bg-white/5"></div>
                       <div className="flex items-center justify-between">
                          <div>
                             <h3 className="font-bold text-white">Weekly Summaries</h3>
                             <p className="text-xs text-zinc-500">Email digest of your routine performance accuracy.</p>
                          </div>
                          <ToggleSwitch checked={true} />
                       </div>
                       <div className="w-full h-px bg-white/5"></div>
                       <div className="flex items-center justify-between">
                          <div>
                             <h3 className="font-bold text-white">Marketing & Updates</h3>
                             <p className="text-xs text-zinc-500">News about AURA features and updates.</p>
                          </div>
                          <ToggleSwitch checked={false} />
                       </div>
                    </div>
                 </div>
              )}

            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

// Helper Component for the visual Toggle
const ToggleSwitch = ({ checked }) => (
  <div className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${checked ? 'bg-violet-600' : 'bg-zinc-700'}`}>
    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all ${checked ? 'left-7' : 'left-1'}`}></div>
  </div>
);

// Helper for Edit Icon to avoid clutter
const EditIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
);

export default SettingsPage;