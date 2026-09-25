import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../hooks/useChat';
import { Bot, Send, Sparkles, Plus, Lightbulb, ShieldCheck } from 'lucide-react';
import MarkdownRenderer from '../components/MarkdownRenderer';

const SUGGESTED_PROMPTS = [
  "How can I reduce my monthly loan interest?",
  "What is my highest expense category this month?",
  "Can I afford to prepay ₹50,000 on my loan?",
  "Am I on track to achieve my savings goals?",
  "Summarize my peer lending and borrowing exposure."
];

export default function ChatPage() {
  const { sessions, createSession, fetchSession, sendMessage, isSending } = useChat();
  
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (sessions?.length > 0 && !activeSessionId) {
      const latest = sessions[0];
      setActiveSessionId(latest.id);
      loadSession(latest.id);
    } else if (sessions && sessions.length === 0 && !activeSessionId) {
      handleNewSession();
    }
  }, [sessions, activeSessionId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isSending]);

  const loadSession = async (id) => {
    const data = await fetchSession(id);
    if (data) setMessages(data.messages || []);
  };

  const handleNewSession = async () => {
    const data = await createSession();
    if (data) setActiveSessionId(data.id);
    setMessages([]);
  };

  const handleSendQuery = async (queryText) => {
    if (!queryText.trim() || !activeSessionId) return;

    const userQuery = queryText.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userQuery }]);

    try {
      const res = await sendMessage({ sessionId: activeSessionId, content: userQuery });
      setMessages(prev => [...prev, { role: 'assistant', content: res.response }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection failed. Please retry.' }]);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-paper-raised border border-border-default rounded-2xl shadow-card overflow-hidden relative font-body">
      {/* ── Header ── */}
      <div className="h-16 px-6 border-b border-border-default flex items-center justify-between shrink-0 bg-paper-raised z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display font-bold text-ink text-base">FinPilot AI Copilot</h1>
            <p className="text-[11px] text-ink-faint">Decision support powered by your verified financial ledger</p>
          </div>
        </div>

        <button
          onClick={handleNewSession}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border-default hover:bg-paper-sunken text-xs font-semibold text-ink transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Chat</span>
        </button>
      </div>

      {/* ── Messages Container ── */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 scroll-smooth" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-8 max-w-xl mx-auto my-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-ink">How can I assist your finances today?</h2>
              <p className="text-xs text-ink-soft max-w-md mx-auto mt-1 leading-relaxed">
                Ask about spending trends, loan prepayment optimizations, or personalized budget recommendations.
              </p>
            </div>

            {/* Suggested Prompt Chips (Section 23) */}
            <div className="w-full pt-2">
              <span className="text-[11px] font-semibold text-ink-faint uppercase block mb-2">Suggested Inquiries</span>
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTED_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendQuery(prompt)}
                    className="text-left text-xs bg-paper-sunken hover:bg-purple-50 dark:hover:bg-purple-950/30 border border-border-default hover:border-purple-200 dark:hover:border-purple-800 text-ink-soft hover:text-purple-700 dark:hover:text-purple-300 p-2.5 rounded-xl transition-all flex items-center gap-1.5 group"
                  >
                    <Lightbulb className="w-3 h-3 text-purple-500 shrink-0" />
                    <span>{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isUser = msg.role === 'user';
            return (
              <div key={i} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-fade-in`}>
                <div className="flex items-start gap-3 max-w-[85%] md:max-w-[75%]">
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex items-center justify-center shrink-0 mt-1">
                      <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                  )}
                  
                  <div className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isUser 
                      ? 'bg-accent text-white rounded-br-sm shadow-sm' 
                      : 'bg-paper-sunken border border-border-default text-ink rounded-bl-sm shadow-sm'
                  }`}>
                    {isUser ? (
                      <span className="whitespace-pre-wrap">{msg.content}</span>
                    ) : (
                      <div>
                        <MarkdownRenderer content={msg.content} />
                        {/* Calculation transparency footer (Section 24) */}
                        <div className="mt-3 pt-2 border-t border-border-default/50 flex items-center gap-1.5 text-[10px] text-ink-faint">
                          <ShieldCheck className="w-3 h-3 text-positive shrink-0" />
                          <span>Generated using your active loans and categorized transactions.</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {isSending && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-purple-600 animate-spin" />
            </div>
            <div className="bg-paper-sunken border border-border-default px-4 py-2.5 rounded-2xl text-xs text-ink-soft animate-pulse">
              Computing financial projections...
            </div>
          </div>
        )}
      </div>

      {/* ── Input Box ── */}
      <div className="p-4 border-t border-border-default bg-paper-raised">
        <form onSubmit={(e) => { e.preventDefault(); handleSendQuery(input); }} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask FinPilot AI about your financial status..."
            className="flex-1 bg-paper-sunken border border-border-default rounded-xl px-4 py-2.5 text-xs text-ink placeholder:text-ink-faint outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            className="bg-accent hover:bg-accent-hover text-white p-2.5 rounded-xl shadow-sm transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
