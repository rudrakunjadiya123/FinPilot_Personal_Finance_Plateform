import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../hooks/useChat';
import { Bot, User, Send, X, Shield, Terminal, Sparkles } from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import MarkdownRenderer from './MarkdownRenderer';

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
  }, [messages]);

  const loadSession = async (id) => {
     const data = await fetchSession(id);
     if (data) setMessages(data.messages || []);
  };

  const handleNewSession = async () => {
     const data = await createSession();
     if (data) setActiveSessionId(data.id);
     setMessages([]);
  };

  const handleSend = async (e) => {
     e.preventDefault();
     if (!input.trim() || !activeSessionId) return;

     const userQuery = input.trim();
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
      <div className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-[2px] animate-fade-in" onClick={toggleChat} />
      
      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-[420px] max-w-full bg-paper-raised z-[70] shadow-elevated border-l border-border-default flex flex-col animate-slide-up transition-colors duration-300"
        style={{ animationName: 'slideFromRight' }}
      >
        {/* Header */}
        <div className="h-16 px-5 border-b border-border-default flex items-center justify-between shrink-0">
           <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg accent-gradient flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-ink text-sm">FinPilot AI</span>
           </div>
           
           <div className="flex items-center gap-2">
              <button onClick={toggleChat} className="p-1.5 text-ink-faint hover:text-ink rounded-lg hover:bg-paper-sunken transition-all duration-150">
                <X className="w-5 h-5" />
              </button>
           </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={scrollRef}>
           {messages.length === 0 && (
             <div className="text-center text-ink-faint text-xs mt-8 border border-border-default border-dashed py-8 rounded-xl bg-paper-sunken/50">
                <Sparkles className="w-6 h-6 text-accent mx-auto mb-2 opacity-50" />
                No conversation yet.<br/>Ask about your finances!
             </div>
           )}
           
           {messages.map((msg, i) => {
              const isUser = msg.role === 'user';
              
              const renderContent = () => {
                 if (!isUser) {
                    return <MarkdownRenderer content={msg.content} />;
                 }
                 return msg.content;
              };

              return (
                 <div key={i} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                   <div className="flex items-end gap-2 max-w-[85%]">
                      {!isUser && (
                        <div className="w-6 h-6 rounded-lg bg-accent-soft flex items-center justify-center shrink-0">
                          <Bot className="w-3 h-3 text-accent" />
                        </div>
                      )}
                      
                      <div className={`p-3 rounded-xl text-sm ${
                        isUser 
                          ? 'accent-gradient text-white rounded-br-sm' 
                          : 'bg-paper-sunken border border-border-default text-ink rounded-bl-sm'
                      }`}>
                         {renderContent()}
                         
                         {msg.pathUsed === 'function_call' && (
                           <div className="mt-2 text-[9px] text-ink-faint flex items-center border-t border-border-default/50 pt-1.5 uppercase tracking-wider gap-1">
                             <Terminal className="w-2.5 h-2.5" /> Query executed
                           </div>
                         )}
                      </div>
                   </div>
                 </div>
              );
           })}
           
           {isSending && (
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-lg bg-accent-soft flex items-center justify-center shrink-0">
                  <Bot className="w-3 h-3 text-accent" />
                </div>
                <div className="p-3 rounded-xl text-sm bg-paper-sunken border border-border-default text-ink-soft flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
                  Analyzing...
                </div>
              </div>
           )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border-default shrink-0">
           <form onSubmit={handleSend} className="relative flex items-center">
              <input 
                 type="text" 
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 placeholder="Ask FinPilot..."
                 className="w-full bg-paper-sunken border border-border-strong rounded-xl py-2.5 pl-4 pr-11 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200 text-ink placeholder:text-ink-faint"
                 disabled={isSending}
              />
              <button 
                 type="submit" 
                 disabled={!input.trim() || isSending}
                 className="absolute right-2 w-7 h-7 rounded-lg accent-gradient flex items-center justify-center text-white disabled:opacity-30 transition-opacity btn-press"
              >
                 <Send className="w-3.5 h-3.5" />
              </button>
           </form>
        </div>
      </div>
    </>
  );
}
