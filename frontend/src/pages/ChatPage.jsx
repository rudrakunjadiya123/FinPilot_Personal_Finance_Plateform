import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../hooks/useChat';
import { Bot, Send, Shield, Terminal, Sparkles } from 'lucide-react';

export default function ChatPage() {
  const { sessions, createSession, fetchSession, sendMessage, isSending } = useChat();
  
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [showAISees, setShowAISees] = useState(false);
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

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-paper-raised border border-border-default rounded-xl shadow-card overflow-hidden relative">
      {/* Header */}
      <div className="h-16 px-5 border-b border-border-default flex items-center justify-between shrink-0 bg-paper-sunken z-10">
         <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg accent-gradient flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-ink text-base">FinPilot AI</span>
         </div>
         
         <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowAISees(!showAISees)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all duration-200 ${
                showAISees 
                  ? 'bg-negative-soft text-negative border-negative/30' 
                  : 'bg-paper text-ink-faint border-border-default hover:text-ink hover:border-border-strong'
              }`}
              title="Toggle API payload view"
            >
              <Shield className="w-3.5 h-3.5" /> Developer Mode
            </button>
         </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth" ref={scrollRef}>
         {messages.length === 0 && (
           <div className="text-center text-ink-faint text-sm mt-12 border border-border-default border-dashed py-12 rounded-xl bg-paper-sunken/50 max-w-md mx-auto">
              <Sparkles className="w-8 h-8 text-accent mx-auto mb-3 opacity-50" />
              <p className="font-semibold text-ink-soft mb-1 text-base">No conversation yet</p>
              <p>Ask about your spending habits, check your loans, or ask for saving advice!</p>
           </div>
         )}
         
         {messages.map((msg, i) => {
            const isUser = msg.role === 'user';
            
            const renderContent = () => {
               if (showAISees && msg.redactedPayloadSent) {
                  return (
                     <div className="bg-paper-sunken text-ink p-3 rounded-lg text-xs font-mono break-all whitespace-pre-wrap border border-border-default">
                        {JSON.stringify(msg.redactedPayloadSent, null, 2)}
                     </div>
                  );
               }
               return msg.content;
            };

            return (
               <div key={i} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-fade-in`}>
                 <div className="flex items-end gap-3 max-w-[85%] md:max-w-[70%]">
                    {!isUser && (
                      <div className="w-8 h-8 rounded-xl bg-accent-soft flex items-center justify-center shrink-0 mb-1">
                        <Bot className="w-4 h-4 text-accent" />
                      </div>
                    )}
                    
                    <div className={`p-4 rounded-2xl text-[15px] leading-relaxed ${
                      isUser 
                        ? 'accent-gradient text-white rounded-br-sm shadow-sm' 
                        : 'bg-paper border border-border-default text-ink rounded-bl-sm shadow-sm'
                    }`}>
                       {renderContent()}
                       
                       {msg.pathUsed === 'function_call' && !showAISees && (
                         <div className="mt-3 text-[10px] text-ink-faint flex items-center border-t border-border-default/50 pt-2 uppercase tracking-wider gap-1.5 font-semibold">
                           <Terminal className="w-3 h-3" /> Query executed successfully
                         </div>
                       )}
                    </div>
                 </div>
               </div>
            );
         })}
         
         {isSending && (
            <div className="flex items-start gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-xl bg-accent-soft flex items-center justify-center shrink-0 mb-1">
                <Bot className="w-4 h-4 text-accent" />
              </div>
              <div className="p-4 rounded-2xl text-[15px] bg-paper border border-border-default text-ink-soft flex items-center gap-3 shadow-sm">
                <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
                FinPilot is thinking...
              </div>
            </div>
         )}
      </div>

      {/* Input */}
      <div className="p-4 md:p-5 border-t border-border-default shrink-0 bg-paper-sunken z-10">
         <form onSubmit={handleSend} className="relative flex items-center w-full mx-auto">
            <input 
               type="text" 
               value={input}
               onChange={(e) => setInput(e.target.value)}
               placeholder="Ask FinPilot about your finances..."
               className="w-full bg-paper border border-border-strong rounded-xl py-3.5 pl-5 pr-14 text-[15px] focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200 text-ink placeholder:text-ink-faint shadow-sm"
               disabled={isSending}
            />
            <button 
               type="submit" 
               disabled={!input.trim() || isSending}
               className="absolute right-2 w-10 h-10 rounded-lg accent-gradient flex items-center justify-center text-white disabled:opacity-30 transition-opacity btn-press shadow-sm"
            >
               <Send className="w-4 h-4" />
            </button>
         </form>
      </div>
    </div>
  );
}
