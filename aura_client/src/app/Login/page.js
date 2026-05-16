"use client";

import React, { useState } from 'react';
import { AtSign, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const LoginPage = () => {
  const router = useRouter();

  // 1. STATE TO HOLD DATA
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  // 2. FUNCTION TO UPDATE STATE
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    // Debugging: Check console (F12) to ensure data is not empty
    console.log("Logging in with:", formData);

    try {
      const response = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Save user info
        localStorage.setItem('user', JSON.stringify(data));

        // Redirect based on role
        if (data.role === 'patient') {
          router.push('/Dashboard/patient');
        } else if (data.role === 'doctor') {
          router.push('/Dashboard/doctor');
        }
      } else {
        alert("Invalid Credentials: " + (data.detail || "Check username/password"));
      }
    } catch (error) {
      console.error("Login Error:", error);
      alert("Server not responding");
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[40%_60%] text-white font-sans">

      {/* LEFT: Form */}
      <div className="flex flex-col justify-center p-8 md:p-16 relative bg-[#050505] order-last lg:order-first">
        
        <div className="absolute top-6 left-6 md:top-10 md:left-10">
          <Link href="/" className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-medium group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Home
          </Link>
        </div>

        <div className="w-full max-w-sm mx-auto space-y-8">
          <div className="text-center lg:text-left">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome Back</h1>
            <p className="text-zinc-500 text-sm">Enter your credentials to access the Neural Dashboard.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* USERNAME INPUT - FIXED */}
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

            {/* PASSWORD INPUT - FIXED */}
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Password</label>
                <a href="#" className="text-[10px] text-violet-500 hover:text-white transition-colors">Forgot password?</a>
              </div>
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
              <input type="checkbox" id="remember" className="rounded bg-white/10 border-white/20 text-violet-500 focus:ring-violet-500" />
              <label htmlFor="remember" className="text-xs text-zinc-400">Remember this device</label>
            </div>

            <button type="submit" className="w-full py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] flex items-center justify-center gap-2 group text-sm">
              Log In <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="text-center text-xs text-zinc-500">
            Don't have an identity? <Link href="/Signup" className="text-violet-500 hover:text-white transition-colors font-bold">Create Account</Link>
          </div>
        </div>
      </div>

      {/* RIGHT: Visuals */}
      <div className="relative hidden lg:flex flex-col justify-between p-16 bg-zinc-900 overflow-hidden text-right">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-bl from-violet-600/20 via-black to-black"></div>
        
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] bg-violet-600/20 rounded-full blur-[120px]"></div>

        <div className="relative z-10">
          <span className="text-3xl font-extrabold tracking-tighter">AURA<span className="text-violet-500">.</span></span>
        </div>

        <div className="relative z-10 max-w-lg ml-auto">
          <h2 className="text-5xl font-bold mb-6 tracking-tight leading-tight">Continue your progress.</h2>
          <p className="text-zinc-400 text-lg font-light">Your personalized models and routine data are ready. Log in to resume monitoring.</p>
        </div>

        <div className="relative z-10 flex gap-6 text-xs font-mono text-zinc-500 justify-end">
          <span>// SECURE_ACCESS</span>
          <span>// SYSTEM_ONLINE</span>
        </div>
      </div>

    </div>
  );
};

export default LoginPage;