"use client";

import React, { useState } from 'react';
import { User, Stethoscope, AtSign, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const SignupPage = () => {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState('patient');

  // 1. STATE TO HOLD DATA
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    password: ''
  });

  // 2. FUNCTION TO UPDATE STATE WHEN TYPING
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    
    // Debugging: Check console to see if data exists before sending
    console.log("Sending Data:", formData); 

    try {
      const response = await fetch('http://localhost:8000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Map frontend camelCase to backend snake_case
          first_name: formData.firstName,
          last_name: formData.lastName,
          username: formData.username,
          password: formData.password,
          role: selectedRole
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Save user info locally
        localStorage.setItem('user', JSON.stringify(data));
        
        // Redirect
        if (data.role === 'patient') {
          router.push('/Dashboard/patient');
        } else {
          router.push('/Dashboard/doctor');
        }
      } else {
        alert(data.detail || "Registration failed");
      }
    } catch (error) {
      console.error("Signup Error:", error);
      alert("Backend server error");
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[60%_40%] text-white font-sans">

      {/* LEFT: Visuals */}
      <div className="relative hidden lg:flex flex-col justify-between p-16 bg-zinc-900 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-black to-black"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/30 rounded-full blur-[120px]"></div>
        <div className="relative z-10">
          <span className="text-3xl font-extrabold tracking-tighter">AURA<span className="text-violet-500">.</span></span>
        </div>
        <div className="relative z-10 max-w-lg">
          <h2 className="text-5xl font-bold mb-6 tracking-tight leading-tight">Begin your journey to optimized living.</h2>
          <p className="text-zinc-400 text-lg font-light">Join the research beta. Define your routines, train your models, and let AURA handle the rest.</p>
        </div>
        <div className="relative z-10 flex gap-6 text-xs font-mono text-zinc-500">
          <span>// SECURE_ENCRYPTION</span>
          <span>// UOW_FYP_2025</span>
        </div>
      </div>

      {/* RIGHT: Form */}
      <div className="flex flex-col justify-center p-8 md:p-16 relative bg-[#050505]">
        
        <div className="absolute top-6 left-6 md:top-10 md:left-10">
          <Link href="/" className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-medium group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Home
          </Link>
        </div>

        <div className="w-full max-w-sm mx-auto space-y-8">
          <div className="text-center lg:text-left">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Create Account</h1>
            <p className="text-zinc-500 text-sm">Select your role to customize your experience.</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            
            {/* Role Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">I am a...</label>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  type="button"
                  onClick={() => setSelectedRole('patient')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all group ${
                    selectedRole === 'patient' 
                    ? 'bg-violet-500/10 border-violet-500' 
                    : 'bg-white/5 border-white/10 hover:border-violet-500/50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    selectedRole === 'patient' ? 'bg-violet-500 text-white' : 'bg-white/10 text-zinc-400'
                  }`}>
                    <User className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-xs">Patient</span>
                </button>

                <button 
                  type="button"
                  onClick={() => setSelectedRole('doctor')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all group ${
                    selectedRole === 'doctor' 
                    ? 'bg-violet-500/10 border-violet-500' 
                    : 'bg-white/5 border-white/10 hover:border-violet-500/50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    selectedRole === 'doctor' ? 'bg-violet-500 text-white' : 'bg-white/10 text-zinc-400'
                  }`}>
                    <Stethoscope className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-xs">Doctor / Carer</span>
                </button>
              </div>
            </div>

            {/* Inputs - NOW WITH NAME AND ONCHANGE */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">First Name</label>
                <input 
                  type="text" 
                  name="firstName" 
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:bg-violet-500/5 focus:border-violet-500 outline-none transition-all text-sm" 
                  placeholder="John" 
                  required 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Last Name</label>
                <input 
                  type="text" 
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:bg-violet-500/5 focus:border-violet-500 outline-none transition-all text-sm" 
                  placeholder="Doe" 
                  required 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Username</label>
              <div className="relative">
                <AtSign className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                <input 
                  type="text" 
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full p-3 pl-10 rounded-xl bg-white/5 border border-white/10 text-white focus:bg-violet-500/5 focus:border-violet-500 outline-none transition-all text-sm" 
                  placeholder="aura_user" 
                  required 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                <input 
                  type="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full p-3 pl-10 rounded-xl bg-white/5 border border-white/10 text-white focus:bg-violet-500/5 focus:border-violet-500 outline-none transition-all text-sm" 
                  placeholder="••••••••" 
                  required 
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input type="checkbox" id="terms" className="rounded bg-white/10 border-white/20 text-violet-500 focus:ring-violet-500" />
              <label htmlFor="terms" className="text-xs text-zinc-400">I agree to the <a href="#" className="text-white hover:underline">Research Consent Form</a></label>
            </div>

            <button type="submit" className="w-full py-3.5 bg-white text-black font-bold rounded-xl hover:bg-violet-500 hover:text-white transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2 group text-sm">
              Initialize Profile <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="text-center text-xs text-zinc-500">
            Already have an identity? <Link href="/Login" className="text-violet-500 hover:text-white transition-colors font-bold">Log in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;