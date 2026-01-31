'use client';
import React, { useEffect, useState } from 'react';

export default function BoardPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8000/messages/')
      .then(res => res.json())
      .then(data => {
        setMessages(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-4xl mx-auto mt-10 p-5 bg-white shadow-lg rounded-xl">
      <h1 className="text-3xl font-bold mb-6 text-black">Message Board</h1>
      {loading ? (
        <p className="text-gray-500">Loading messages...</p>
      ) : (
        <div className="space-y-4">
          {messages.length === 0 ? (
             <p className="text-gray-400">No messages yet.</p>
          ) : messages.map((msg: any) => (
            <div key={msg.id} className="p-4 border rounded-lg bg-gray-50 shadow-sm transition hover:shadow-md">
              <p className="text-gray-800 font-medium">{msg.content}</p>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-400">{new Date(msg.timestamp).toLocaleString()}</span>
                <span className="text-xs text-blue-500">User #{msg.owner_id}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-8">
        <a href="/" className="text-blue-500 hover:underline">Back to Login</a>
      </div>
    </div>
  );
}
