'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Load saved ID on mount
  useEffect(() => {
    const savedId = localStorage.getItem('savedId');
    if (savedId) {
      setEmail(savedId);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    // Save or clear ID
    if (rememberMe) {
      localStorage.setItem('savedId', email);
    } else {
      localStorage.removeItem('savedId');
    }

    try {
      const res = await fetch('/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.access_token);
        router.push('/board');
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      setError('Connection failed: Make sure backend is running on port 8000');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white selection:bg-blue-500/30 font-sans">
      <div className="p-10 bg-zinc-900 rounded-[2.5rem] shadow-2xl w-[400px] border border-zinc-800">
        <div className="flex justify-center mb-8">
          <div className="bg-blue-600 p-4 rounded-3xl shadow-lg shadow-blue-500/20">
            <span className="text-3xl">🐌</span>
          </div>
        </div>
        <h1 className="mb-2 text-3xl font-black text-center tracking-tighter text-blue-500">STRONTIUM</h1>
        <p className="text-zinc-500 text-center text-sm font-medium mb-8">Welcome back, Please login</p>
        
        {error && <p className="text-red-400 text-xs mb-6 text-center p-3 bg-red-400/10 border border-red-400/20 rounded-2xl font-bold">{error}</p>}
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">Email Address</label>
            <input 
              type="email" 
              placeholder="corona89@nate.com" 
              className="w-full p-4 bg-zinc-800 border border-zinc-700 rounded-2xl text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="w-full p-4 bg-zinc-800 border border-zinc-700 rounded-2xl text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center gap-2 px-1">
            <input 
              type="checkbox" 
              id="remember"
              className="w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-blue-600 focus:ring-offset-zinc-950"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label htmlFor="remember" className="text-xs text-zinc-400 font-bold select-none cursor-pointer">ID 저장</label>
          </div>

          <button type="submit" className="w-full p-4 text-white bg-blue-600 rounded-2xl hover:bg-blue-500 transition-all font-black text-sm shadow-lg shadow-blue-500/20 active:scale-95">
            LOG IN
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-zinc-800">
          <button type="button" className="w-full p-4 bg-zinc-800 border border-zinc-700 rounded-2xl text-zinc-400 hover:text-white hover:bg-zinc-700 font-bold text-xs flex items-center justify-center gap-3 transition">
            <span className="text-base">🌐</span> Continue with Google
          </button>
        </div>
      </div>
      <p className="mt-8 text-zinc-600 text-[10px] font-black tracking-widest">STRONTIUM v1.3.0 STABLE</p>
    </div>
  );
}
