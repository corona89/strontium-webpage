'use client';
import React from 'react';

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded shadow-md w-96">
        <h1 className="mb-6 text-2xl font-bold text-center text-black">Login</h1>
        <form className="space-y-4">
          <input type="email" placeholder="Email" className="w-full p-2 border rounded text-black" />
          <input type="password" placeholder="Password" className="w-full p-2 border rounded text-black" />
          <button type="button" className="w-full p-2 text-white bg-blue-500 rounded hover:bg-blue-600">Login</button>
        </form>
        <div className="mt-4 border-t pt-4">
          <button type="button" className="w-full p-2 text-gray-700 border rounded hover:bg-gray-50 flex items-center justify-center gap-2">
            Login with Google
          </button>
        </div>
      </div>
    </div>
  );
}
