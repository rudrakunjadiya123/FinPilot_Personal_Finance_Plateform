import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../hooks/useChat';
import { Bot, Send, X, Sparkles, Plus, Lightbulb, ShieldCheck } from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import MarkdownRenderer from './MarkdownRenderer';

const SUGGESTED_PROMPTS = [
  "How can I reduce loan interest?",
  "What is my highest expense?",
  "Can I afford to prepay ₹50,000?",
  "Am I on track for my goals?"
];

export default function ChatPanel() {
  const { isChatOpen, toggleChat } = useUIStore();
  const { sessions, createSession, fetchSession, sendMessage, isSending } = useChat();
  
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (isChatOpen && sessions?.length > 0 && !activeSessionId) {
      const latest = sessions[0];
      setActiveSessionId(latest.id);
      loadSession(latest.id);
    } else if (isChatOpen && sessions?.length === 0) {
      handleNewSession();
    }
  }, [isChatOpen, sessions]);

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

  if (!isChatOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm animate-fade-in" onClick={toggleChat} />
      
      {/* Panel */}
      <div 
        className="fixed top-0 right-0 h-full w-[440px] max-w-full bg-paper-raised z-[70] shadow-elevated border-l border-border-default flex flex-col font-body"
      >
        {/* Header */}
        <div className="h-16 px-5 border-b border-border-default flex items-center justify-between shrink-0 bg-paper-raised">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-display font-bold text-ink text-sm block">FinPilot AI Copilot</span>
              <span className="text-[10px] text-ink-faint block">Live financial decision support</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            <button 
              onClick={handleNewSession}
              title="Start New Chat"
              className="p-1.5 text-ink-soft hover:text-ink rounded-lg hover:bg-paper-sunken transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button 
              onClick={toggleChat} 
              className="p-1.5 text-ink-faint hover:text-ink rounded-lg hover:bg-paper-sunken transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-6 my-auto space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-sm text-ink">What would you like to know?</h3>
              <p className="text-[11px] text-ink-soft max-w-xs leading-relaxed">
                I can analyze your bank transactions, project cash flow, or evaluate loan prepayment scenarios.
              </p>

              {/* Prompt chips */}
              <div className="w-full pt-2 space-y-1.5">
                {SUGGESTED_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendQuery(prompt)}
                    className="w-full text-left text-xs bg-paper-sunken hover:bg-purple-50 dark:hover:bg-purple-950/30 border border-border-default hover:border-purple-200 p-2.5 rounded-xl transition-all flex items-center gap-2 text-ink-soft hover:text-purple-700"
                  >
                    <Lightbulb className="w-3 h-3 text-purple-500 shrink-0" />
                    <span className="truncate">{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isUser = msg.role === 'user';
              return (
                <div key={i} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-fade-in`}>
                  <div className="flex items-start gap-2 max-w-[90%]">
                    {!isUser && (
                      <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      </div>
                    )}
                    
                    <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                      isUser 
                        ? 'bg-accent text-white rounded-br-sm shadow-sm' 
                        : 'bg-paper-sunken border border-border-default text-ink rounded-bl-sm shadow-sm'
                    }`}>
                      {isUser ? (
                        <span className="whitespace-pre-wrap">{msg.content}</span>
                      ) : (
                        <div>
                          <MarkdownRenderer content={msg.content} />
                          <div className="mt-2 pt-1.5 border-t border-border-default/50 flex items-center gap-1 text-[9px] text-ink-faint">
                            <ShieldCheck className="w-2.5 h-2.5 text-positive shrink-0" />
                            <span>Calculated from live ledger data.</span>
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
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-spin" />
              </div>
              <div className="bg-paper-sunken border border-border-default px-3 py-2 rounded-xl text-xs text-ink-soft animate-pulse">
                Thinking...
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-border-default bg-paper-raised">
          <form onSubmit={(e) => { e.preventDefault(); handleSendQuery(input); }} className="flex items-center gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask FinPilot AI..." 
              className="flex-1 bg-paper-sunken border border-border-default rounded-xl px-3.5 py-2 text-xs text-ink placeholder:text-ink-faint outline-none focus:border-accent"
            />
            <button 
              type="submit" 
              disabled={!input.trim() || isSending}
              className="bg-accent hover:bg-accent-hover text-white p-2 rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
