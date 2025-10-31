import { useEffect, useMemo, useRef, useState } from 'react';
import { createSession, getSession, listSessions, sendMessage } from '../services/chatService';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef(null);

  // Load session list
  useEffect(() => {
    const load = async () => {
      try {
        const s = await listSessions();
        setSessions(s);
        if (s.length > 0) {
          setActiveSessionId(s[0]._id);
        }
      } catch (_) {}
    };
    load();
  }, []);

  // Load messages when active session changes
  useEffect(() => {
    if (!activeSessionId) return;
    const load = async () => {
      try {
        const session = await getSession(activeSessionId);
        setMessages(session.messages || []);
      } catch (_) {}
    };
    load();
  }, [activeSessionId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const startNewChat = async () => {
    const title = `Chat ${new Date().toLocaleString()}`;
    try {
      const created = await createSession(title);
      setSessions(prev => [created, ...prev]);
      setActiveSessionId(created._id);
      setMessages([]);
      setIsOpen(true);
    } catch (_) {}
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !activeSessionId || isSending) return;
    setInput('');
    setIsSending(true);
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    try {
      const { reply } = await sendMessage(activeSessionId, text);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (_) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error contacting assistant. Please try again.' }]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 w-14 h-14 flex items-center justify-center"
          aria-label="Open Chatbot"
        >
          {/* chat icon */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor"><path d="M2 5a3 3 0 013-3h14a3 3 0 013 3v9a3 3 0 01-3 3H9.414l-3.707 3.707A1 1 0 014 20.586V17H5a3 3 0 01-3-3V5z"/></svg>
        </button>
      )}

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] max-w-[380px] md:max-w-[420px] h-[70vh] max-h-[640px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-green-800 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800">
            <div>
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">ERP Assistant</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Ask about courses, schedules, ERP help</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={startNewChat} className="text-xs px-2 py-1 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200">New</button>
              <button onClick={() => setIsOpen(false)} className="p-1 rounded-md hover:bg-gray-200/60 dark:hover:bg-gray-700" aria-label="Close">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700 dark:text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex flex-1 min-h-0">
            {/* Sidebar sessions */}
            <div className="hidden md:block w-32 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
              {sessions.map(s => (
                <button
                  key={s._id}
                  onClick={() => setActiveSessionId(s._id)}
                  className={`w-full text-left px-3 py-2 text-xs border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 ${activeSessionId===s._id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                >
                  {s.title || 'Chat'}
                </button>
              ))}
              {sessions.length === 0 && (
                <div className="p-3 text-xs text-gray-500">No chats yet</div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 flex flex-col">
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-white dark:bg-gray-900">
                {messages.length === 0 && (
                  <div className="text-xs text-gray-500">Start by asking a question…</div>
                )}
                {messages.map((m, idx) => (
                  <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${m.role==='user' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'}`}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {isSending && (
                  <div className="text-xs text-gray-500">Thinking…</div>
                )}
              </div>

              {/* Input */}
              <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                    placeholder="Type your question…"
                    className="flex-1 px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    onClick={handleSend}
                    disabled={isSending || !activeSessionId}
                    className="px-3 py-2 text-sm rounded-md bg-blue-600 text-white disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
                {!activeSessionId && (
                  <div className="mt-2 text-xs text-gray-500">Create a new chat to start.</div>
                )}
                {sessions.length === 0 && (
                  <div className="mt-2">
                    <button onClick={startNewChat} className="text-xs px-2 py-1 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200">Create first chat</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


