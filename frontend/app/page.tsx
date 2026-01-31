'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    try {
      const res = await fetch('http://localhost:8000/token', {
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-100 text-zinc-900">
      <div className="p-8 bg-white rounded-2xl shadow-xl w-96 border border-zinc-200">
        <h1 className="mb-6 text-2xl font-bold text-center text-zinc-900">Strontium Login</h1>
        {error && <p className="text-red-500 text-sm mb-4 text-center p-2 bg-red-50 rounded">{error}</p>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input 
              type="email" 
              placeholder="you@example.com" 
              className="w-full p-2 border rounded-lg bg-white text-black focus:ring-2 focus:ring-blue-500 outline-none" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="w-full p-2 border rounded-lg bg-white text-black focus:ring-2 focus:ring-blue-500 outline-none" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full p-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition font-semibold">
            Sign In
          </button>
        </form>
        <div className="mt-6 border-t pt-4 border-zinc-100">
          <button type="button" className="w-full p-2 text-zinc-700 border border-zinc-300 rounded-lg hover:bg-zinc-50 flex items-center justify-center gap-2 transition">
            Login with Google
          </button>
        </div>
      </div>
    </div>
  );
}
