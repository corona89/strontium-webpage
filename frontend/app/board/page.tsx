'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BoardPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newContent, setNewContent] = useState('');
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState('');
  const router = useRouter();

  const fetchMessages = () => {
    fetch('http://localhost:8000/messages/')
      .then(res => res.json())
      .then(data => {
        setMessages(data);
        setLoading(false);
      })
      .catch(err => {
        setError('Could not connect to backend');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    
    setUploading(true);
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:8000/upload/', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setFileUrl(data.file_url);
    } catch (err) {
      alert('File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login first');
      router.push('/');
      return;
    }

    try {
      const res = await fetch('http://localhost:8000/messages/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: newContent,
          file_url: fileUrl
        }),
      });

      if (res.ok) {
        setNewContent('');
        setFileUrl('');
        fetchMessages();
      } else {
        alert('Failed to post message');
      }
    } catch (err) {
      alert('Post failed');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-8 text-zinc-900 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-black text-zinc-900 tracking-tighter">STRONTIUM BOARD</h1>
          <button onClick={() => { localStorage.removeItem('token'); router.push('/'); }} className="px-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm font-bold hover:bg-zinc-100 transition shadow-sm">
            LOGOUT
          </button>
        </div>

        {/* Post Editor */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-200 mb-10">
          <h2 className="text-lg font-bold mb-4">Create new post</h2>
          <form onSubmit={handlePost} className="space-y-4">
            <textarea 
              className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl resize-none h-32 focus:ring-2 focus:ring-blue-500 outline-none text-zinc-800"
              placeholder="What's on your mind?"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              required
            ></textarea>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input type="file" id="file-id" className="hidden" onChange={handleFileUpload} />
                <label htmlFor="file-id" className="cursor-pointer px-4 py-2 bg-zinc-100 rounded-full text-xs font-bold hover:bg-zinc-200 transition active:scale-95">
                  {uploading ? 'Uploading...' : 'Attach File'}
                </label>
                {fileUrl && <span className="text-xs text-green-600 font-medium">File attached!</span>}
              </div>
              <button type="submit" className="px-8 py-2 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 active:scale-95">
                POST
              </button>
            </div>
          </form>
        </div>
        
        {error && <div className="p-4 mb-6 bg-red-50 text-red-600 rounded-2xl text-center font-medium border border-red-100">{error}</div>}

        {/* Message List */}
        <div className="grid gap-6">
          {loading ? (
            <div className="text-center p-20 text-zinc-400 font-medium">Loading fresh content...</div>
          ) : messages.length === 0 ? (
            <div className="p-20 text-center bg-white border border-dashed border-zinc-200 rounded-3xl text-zinc-300 font-medium">No posts yet. Start the conversation!</div>
          ) : messages.map((msg: any) => (
            <div key={msg.id} className="p-6 bg-white border border-zinc-100 rounded-3xl shadow-sm hover:shadow-md transition duration-300">
              <p className="text-zinc-800 text-lg leading-relaxed mb-4">{msg.content}</p>
              {msg.file_url && (
                <div className="mb-4">
                  <a href={msg.file_url} target="_blank" className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-2">
                    View Attachment
                  </a>
                </div>
              )}
              <div className="flex justify-between items-center pt-4 border-t border-zinc-50">
                <span className="text-xs text-zinc-400 font-semibold">{new Date(msg.timestamp).toLocaleString()}</span>
                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                  Author #{msg.owner_id}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
