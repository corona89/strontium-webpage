'use client';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function BoardPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [error, setError] = useState('');
  
  const [newContent, setNewContent] = useState('');
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  
  const router = useRouter();
  const observer = useRef<IntersectionObserver | null>(null);

  const fetchMessages = useCallback(async (isInitial = false, term = searchTerm) => {
    if (loading) return;
    setLoading(true);
    
    const currentSkip = isInitial ? 0 : page * 10;
    const url = new URL('http://localhost:8000/messages/');
    url.searchParams.append('skip', currentSkip.toString());
    url.searchParams.append('limit', '10');
    if (term) url.searchParams.append('search', term);

    try {
      const res = await fetch(url.toString());
      const data = await res.json();
      
      if (isInitial) {
        setMessages(data);
        setPage(1);
      } else {
        setMessages(prev => [...prev, ...data]);
        setPage(prev => prev + 1);
      }
      
      setHasMore(data.length === 10);
      setError('');
    } catch (err) {
      setError('Could not connect to backend');
    } finally {
      setLoading(false);
    }
  }, [page, loading, searchTerm]);

  // Infinite scroll observer
  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchMessages();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore, fetchMessages]);

  useEffect(() => {
    fetchMessages(true);
  }, [searchTerm]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    try {
      const res = await fetch('http://localhost:8000/upload/', { method: 'POST', body: formData });
      const data = await res.json();
      setFileUrl(data.file_url);
    } catch (err) { alert('Upload failed'); } finally { setUploading(false); }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) { router.push('/'); return; }
    try {
      const res = await fetch('http://localhost:8000/messages/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content: newContent, file_url: fileUrl }),
      });
      if (res.ok) {
        setNewContent(''); setFileUrl(''); fetchMessages(true);
      }
    } catch (err) { alert('Post failed'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete?')) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:8000/messages/${id}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) fetchMessages(true);
    } catch (err) { alert('Delete failed'); }
  };

  const handleUpdate = async (id: number) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:8000/messages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content: editContent }),
      });
      if (res.ok) { setEditingId(null); fetchMessages(true); }
    } catch (err) { alert('Update failed'); }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-blue-500/30">
      <div className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-900 px-8 py-4">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <h1 className="text-2xl font-black tracking-tighter text-blue-500">STRONTIUM</h1>
          
          <div className="flex-1 max-w-2xl w-full relative">
            <input 
              type="text"
              placeholder="Search content or date..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-full py-2 px-6 focus:ring-2 focus:ring-blue-500 outline-none text-sm transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500">🔍</div>
          </div>

          <button onClick={() => { localStorage.removeItem('token'); router.push('/'); }} className="px-5 py-2 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-bold hover:bg-zinc-800 transition">
            LOGOUT
          </button>
        </div>
      </div>

      <main className="p-8 max-w-[1600px] mx-auto">
        {/* Horizontal Editor Section */}
        <div className="mb-12">
          <form onSubmit={handlePost} className="bg-zinc-900/50 border border-zinc-800 rounded-[2rem] p-8 flex flex-col md:flex-row gap-6 items-end">
            <div className="flex-1 w-full">
              <textarea 
                className="w-full bg-transparent border-none text-xl md:text-2xl font-medium placeholder:text-zinc-700 resize-none h-24 focus:ring-0 outline-none"
                placeholder="What's happening?"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                required
              ></textarea>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <input type="file" id="file-id" className="hidden" onChange={handleFileUpload} />
              <label htmlFor="file-id" className="cursor-pointer p-3 bg-zinc-800 rounded-2xl hover:bg-zinc-700 transition">
                {uploading ? '...' : '🖇️'}
              </label>
              {fileUrl && <span className="text-[10px] text-blue-400 font-bold">READY</span>}
              <button type="submit" className="flex-1 md:flex-none px-10 py-4 bg-blue-600 rounded-2xl font-black text-sm hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition active:scale-95">
                POST
              </button>
            </div>
          </form>
        </div>

        {/* Horizontal Card Grid */}
        <div className="flex overflow-x-auto gap-6 pb-12 snap-x no-scrollbar">
          {messages.map((msg: any, index: number) => (
            <div 
              key={msg.id} 
              ref={index === messages.length - 1 ? lastElementRef : null}
              className="min-w-[320px] md:min-w-[400px] snap-start bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] flex flex-col justify-between hover:border-zinc-700 transition group relative overflow-hidden"
            >
              {editingId === msg.id ? (
                <div className="h-full flex flex-col">
                  <textarea 
                    className="flex-1 bg-zinc-800 rounded-2xl p-4 mb-4 resize-none outline-none focus:ring-2 focus:ring-blue-500"
                    value={editContent} onChange={(e) => setEditContent(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleUpdate(msg.id)} className="px-4 py-2 bg-blue-600 rounded-xl text-xs font-bold">SAVE</button>
                    <button onClick={() => setEditingId(null)} className="px-4 py-2 bg-zinc-800 rounded-xl text-xs font-bold">CANCEL</button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Post #{msg.id}</span>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => { setEditingId(msg.id); setEditContent(msg.content); }} className="text-zinc-500 hover:text-white">✎</button>
                        <button onClick={() => handleDelete(msg.id)} className="text-zinc-500 hover:text-red-500">✕</button>
                      </div>
                    </div>
                    <p className="text-lg md:text-xl font-medium leading-normal mb-6 break-words">{msg.content}</p>
                    {msg.file_url && (
                      <a href={msg.file_url} target="_blank" className="inline-flex items-center gap-2 text-xs text-blue-500 font-bold hover:underline mb-4">
                        <span className="p-1 px-2 bg-blue-500/10 rounded-lg">ATTACHMENT</span>
                      </a>
                    )}
                  </div>
                  <div className="pt-6 border-t border-zinc-800 flex justify-between items-center mt-auto">
                    <span className="text-[10px] text-zinc-500 font-bold">{new Date(msg.timestamp).toLocaleDateString()}</span>
                    <span className="text-[10px] bg-zinc-800 px-3 py-1 rounded-full text-zinc-400 font-black">USER {msg.owner_id}</span>
                  </div>
                </>
              )}
            </div>
          ))}
          {loading && <div className="min-w-[200px] flex items-center justify-center text-zinc-600 font-black italic">LOADING...</div>}
        </div>
        
        {messages.length === 0 && !loading && (
          <div className="py-40 text-center border-2 border-dashed border-zinc-900 rounded-[3rem]">
            <p className="text-zinc-700 font-black text-2xl">NO RESULTS FOUND</p>
          </div>
        )}
      </main>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
