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
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');

  // Details Modal state
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  
  // Settings Dropdown state
  const [showSettings, setShowSettings] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  
  const router = useRouter();
  const observer = useRef<IntersectionObserver | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch current user data (including API key)
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await fetch('/api/users/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setApiKey(data.api_key || '');
        } else if (res.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('token');
          router.push('/');
        }
      } catch (err) { 
        console.error("Failed to fetch user data", err); 
        setError('Session expired. Please login again.');
      }
    };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleGenerateApiKey = async () => {
    const token = localStorage.getItem('token');
    setIsGenerating(true);
    try {
      const res = await fetch('http://localhost:8000/users/me/generate-api-key', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setApiKey(data.api_key);
        alert('New API Key generated successfully!');
      } else {
        alert('Failed to generate API Key');
      }
    } catch (err) { alert('Generation failed'); } finally { setIsGenerating(false); }
  };

  const fetchMessages = useCallback(async (isInitial = false, term = searchTerm) => {
    if (loading) return;
    setLoading(true);
    
    const currentSkip = isInitial ? 0 : page * 10;
    const url = new URL('/api/messages', window.location.origin);
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
    const delayDebounceFn = setTimeout(() => {
      fetchMessages(true);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    const formData = new FormData();
    
    Array.from(e.target.files).forEach(file => {
      formData.append('files', file);
    });

    try {
      const res = await fetch('/api/upload-multiple', { method: 'POST', body: formData });
      const data = await res.json();
      setFileUrls(data.file_urls);
    } catch (err) { 
      alert('Upload failed'); 
    } finally { 
      setUploading(false); 
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) { router.push('/'); return; }
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          content: newContent, 
          file_urls: fileUrls 
        }),
      });
      if (res.ok) {
        setNewContent(''); setFileUrls([]); fetchMessages(true);
      } else {
        const errData = await res.json();
        alert(`Failed to post: ${errData.detail || res.statusText}`);
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
        <div className="max-w-[1600px] mx-auto flex justify-between items-center gap-6">
          <h1 className="text-2xl font-black tracking-tighter text-blue-500 shrink-0">STRONTIUM</h1>
          
          <div className="flex-1 max-w-2xl relative">
            <input 
              type="text"
              placeholder="Search posts..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-full py-2 px-6 focus:ring-2 focus:ring-blue-500 outline-none text-sm transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500">🔍</div>
          </div>

          <div className="relative shrink-0" ref={settingsRef}>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 bg-zinc-900 border border-zinc-800 rounded-full hover:bg-zinc-800 transition active:scale-95"
            >
              <span className="text-lg">⚙️</span>
            </button>
            
            {showSettings && (
              <div className="absolute right-0 mt-3 w-48 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl py-2 overflow-hidden animate-in fade-in zoom-in duration-150">
                <div className="px-4 py-2 border-b border-zinc-800 mb-1">
                  <p className="text-[10px] font-black text-zinc-500 uppercase">Settings</p>
                </div>
                <button 
                  onClick={() => setShowApiKeyModal(true)}
                  className="w-full text-left px-4 py-3 text-sm font-bold text-zinc-300 hover:bg-zinc-800 transition"
                >
                  Manage API Key
                </button>
                <button 
                  onClick={() => { localStorage.removeItem('token'); router.push('/'); }}
                  className="w-full text-left px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-500/10 transition border-t border-zinc-800"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-black mb-1 tracking-tight">API Key Management</h2>
                <p className="text-zinc-500 text-xs font-semibold">Generate keys for external AI tools.</p>
              </div>
              <button onClick={() => setShowApiKeyModal(false)} className="text-zinc-600 hover:text-white transition">✕</button>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 mb-8 flex items-center gap-3">
              <code className="flex-1 text-xs font-mono text-zinc-400 truncate">
                {apiKey || "No key generated yet"}
              </code>
              {apiKey && (
                <button 
                  onClick={() => { navigator.clipboard.writeText(apiKey); alert('Copied!'); }}
                  className="text-[10px] bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded-lg font-black"
                >
                  COPY
                </button>
              )}
            </div>

            <div className="space-y-3">
              <button 
                onClick={handleGenerateApiKey} 
                disabled={isGenerating}
                className="w-full py-4 bg-blue-600 rounded-2xl font-black text-sm hover:bg-blue-500 transition shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50"
              >
                {isGenerating ? "GENERATING..." : apiKey ? "REGENERATE KEY" : "GENERATE NEW KEY"}
              </button>
              <p className="text-[10px] text-center text-zinc-600 font-bold uppercase tracking-widest pt-2">
                ⚠️ Regenerating will invalidate your old key.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={() => setSelectedMessage(null)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-8">
              <span className="text-xs font-black text-blue-500 uppercase tracking-widest">Detail View</span>
              <button onClick={() => setSelectedMessage(null)} className="text-zinc-500 hover:text-white transition text-2xl">✕</button>
            </div>
            
            <div className="mb-10">
              <p className="text-2xl md:text-4xl font-black leading-tight mb-8 break-words text-zinc-100 whitespace-pre-wrap selection:bg-blue-500/40">
                {selectedMessage.content}
              </p>
              
              <div className="flex flex-wrap gap-3">
                {selectedMessage.file_urls && selectedMessage.file_urls.map((url: string, i: number) => (
                  <a key={i} href={url} target="_blank" className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-2xl text-xs font-bold transition">
                    🖇️ ATTACHMENT {i+1}
                  </a>
                ))}
                {selectedMessage.file_url && !selectedMessage.file_urls?.includes(selectedMessage.file_url) && (
                  <a href={selectedMessage.file_url} target="_blank" className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-2xl text-xs font-bold transition">
                    🖇️ ATTACHMENT
                  </a>
                )}
              </div>
            </div>

            <div className="pt-8 border-t border-zinc-800 flex justify-between items-center bg-zinc-900/50 sticky bottom-0">
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-500 font-black uppercase">Posted on</span>
                <span className="text-sm text-zinc-300 font-bold">{new Date(selectedMessage.timestamp).toLocaleString()}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-zinc-500 font-black uppercase">Author</span>
                <span className="text-sm bg-zinc-800 px-4 py-2 rounded-full text-zinc-100 font-black">USER {selectedMessage.owner_id}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="p-8 max-w-[1600px] mx-auto">
        <div className="mb-12">
          <form onSubmit={handlePost} className="bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] p-10 flex flex-col gap-6">
            <div className="w-full">
              <textarea 
                className="w-full bg-transparent border-none text-xl md:text-2xl font-medium placeholder:text-zinc-700 resize-none h-32 focus:ring-0 outline-none no-scrollbar"
                placeholder="Share your thoughts or technical insights..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                required
              ></textarea>
            </div>
            
            <div className="flex flex-wrap items-center justify-between gap-6 pt-6 border-t border-zinc-800/50">
              <div className="flex flex-wrap items-center gap-4">
                <input type="file" id="file-id" className="hidden" multiple onChange={handleFileUpload} />
                <label htmlFor="file-id" className="cursor-pointer flex items-center gap-3 px-6 py-3 bg-zinc-800 rounded-2xl hover:bg-zinc-700 transition">
                  <span className="text-lg">{uploading ? '⏳' : '🖇️'}</span>
                  <span className="text-xs font-black uppercase tracking-tight">
                    {uploading ? 'Uploading...' : 'Attach Files'}
                  </span>
                </label>
                
                {fileUrls.length > 0 && (
                  <div className="flex gap-2">
                    {fileUrls.map((_, i) => (
                      <div key={i} className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    ))}
                    <span className="text-[10px] text-blue-500 font-black uppercase ml-1">{fileUrls.length} Files Ready</span>
                  </div>
                )}
              </div>
              
              <button type="submit" className="px-12 py-4 bg-blue-600 rounded-[1.25rem] font-black text-sm hover:bg-blue-500 shadow-xl shadow-blue-500/20 transition active:scale-95">
                PUBLISH POST
              </button>
            </div>
          </form>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-12">
          {messages.map((msg: any, index: number) => (
            <div 
              key={msg.id} 
              ref={index === messages.length - 1 ? lastElementRef : null}
              className="group relative flex flex-col bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem] hover:border-zinc-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl cursor-pointer overflow-hidden min-h-[320px]"
              onClick={() => setSelectedMessage(msg)}
            >
              {editingId === msg.id ? (
                <div className="h-full flex flex-col" onClick={e => e.stopPropagation()}>
                  <textarea 
                    className="flex-1 bg-zinc-800 rounded-2xl p-6 mb-4 resize-none outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    value={editContent} onChange={(e) => setEditContent(e.target.value)}
                  />
                  <div className="flex gap-3">
                    <button onClick={(e) => { e.stopPropagation(); handleUpdate(msg.id); }} className="px-6 py-3 bg-blue-600 rounded-2xl text-xs font-black">SAVE</button>
                    <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="px-6 py-3 bg-zinc-800 rounded-2xl text-xs font-black">CANCEL</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-6" onClick={e => e.stopPropagation()}>
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-3 py-1 bg-zinc-950 rounded-full"># {msg.id}</span>
                    <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition duration-200">
                      <button onClick={(e) => { e.stopPropagation(); setEditingId(msg.id); setEditContent(msg.content); }} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-500 hover:text-white transition">✎</button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(msg.id); }} className="p-2 hover:bg-red-500/20 rounded-full text-zinc-500 hover:text-red-500 transition">✕</button>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-xl font-bold leading-relaxed mb-6 line-clamp-4 text-zinc-200 group-hover:text-white transition whitespace-pre-wrap">{msg.content}</p>
                    
                    {(msg.file_urls?.length > 0 || msg.file_url) && (
                      <div className="flex gap-2">
                        <span className="inline-flex items-center gap-2 text-[10px] font-black text-blue-500 bg-blue-500/10 px-3 py-1 rounded-lg">
                          ATTACHMENTS ({(msg.file_urls?.length || 0) + (msg.file_url && !msg.file_urls?.includes(msg.file_url) ? 1 : 0)})
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-8 border-t border-zinc-800/50 flex justify-between items-center mt-6">
                    <span className="text-[10px] text-zinc-600 font-black uppercase tabular-nums">{new Date(msg.timestamp).toLocaleDateString()}</span>
                    <span className="text-[10px] bg-zinc-950 border border-zinc-800 px-4 py-1.5 rounded-full text-zinc-400 font-black">USER {msg.owner_id}</span>
                  </div>
                </>
              )}
            </div>
          ))}
          {loading && <div className="flex items-center justify-center p-12 text-blue-500 animate-pulse font-black italic tracking-widest col-span-full">LOADING INTEL...</div>}
        </div>
        
        {messages.length === 0 && !loading && (
          <div className="py-60 text-center border-4 border-dashed border-zinc-900 rounded-[5rem] animate-pulse">
            <p className="text-zinc-800 font-black text-4xl tracking-tighter uppercase opacity-50">Archive Empty</p>
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
