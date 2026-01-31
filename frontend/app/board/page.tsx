'use client';
import React, { useEffect, useState } from 'react';

export default function BoardPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('Fetching messages...');
    fetch('http://localhost:8000/messages/')
      .then(async res => {
        if (!res.ok) throw new Error('API status: ' + res.status);
        return res.json();
      })
      .then(data => {
        console.log('Messages loaded:', data);
        setMessages(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Fetch error:', err);
        setError('Could not connect to backend (port 8000)');
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 p-8 text-zinc-900">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Board Content</h1>
          <a href="/" className="px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm hover:bg-zinc-100 transition shadow-sm">
            Logout
          </a>
        </div>
        
        {error && (
          <div className="p-4 mb-6 bg-red-50 border border-red-100 text-red-600 rounded-xl text-center">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center p-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-zinc-500">Loading the latest messages...</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {messages.length === 0 && !error ? (
               <div className="p-12 text-center bg-white border border-dashed border-zinc-300 rounded-2xl">
                 <p className="text-zinc-400">No messages have been posted yet. Be the first!</p>
               </div>
            ) : messages.map((msg: any) => (
              <div key={msg.id} className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-sm transition hover:shadow-md">
                <p className="text-zinc-800 text-lg mb-4 leading-relaxed">{msg.content}</p>
                <div className="flex justify-between items-center border-t pt-4 border-zinc-50">
                  <span className="text-xs font-medium text-zinc-400">{new Date(msg.timestamp).toLocaleString()}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">User #{msg.owner_id}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
