'use client';
import React from 'react';

export default function BoardPage() {
  const messages = [
    { id: 1, content: "Welcome to the board!", timestamp: "2026-01-31T09:00:00" },
    { id: 2, content: "This is another message.", timestamp: "2026-01-31T09:05:00" },
  ];

  return (
    <div className="max-w-4xl mx-auto mt-10 p-5 bg-white shadow-lg rounded-xl">
      <h1 className="text-3xl font-bold mb-6 text-black">Message Board</h1>
      <div className="space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className="p-4 border rounded-lg bg-gray-50 shadow-sm transition hover:shadow-md">
            <p className="text-gray-800 font-medium">{msg.content}</p>
            <span className="text-xs text-gray-400">{new Date(msg.timestamp).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
