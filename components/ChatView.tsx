
import React, { useState, useRef, useEffect } from 'react';
/* Update import to use .ts extension consistent with other components */
import { Message, HotelSite } from '../types.ts';
import { createChatSession } from '../services/geminiService';

interface ChatViewProps {
  site: HotelSite;
}

const ChatView: React.FC<ChatViewProps> = ({ site }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatSessionRef = useRef<any>(null);

  useEffect(() => {
    // Message de bienvenue contextualisé par site
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `Bonjour ! Je suis Aura, votre assistant IA. Je suis actuellement configuré pour la **Résidence Samia ${site}**. Comment puis-je vous aider ?`,
        timestamp: new Date()
      }
    ]);
    chatSessionRef.current = createChatSession();
  }, [site]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const textToSend = `[Context Site: ${site}] ${input}`;
    const displayMsg: Message = { id: Date.now().toString(), role: 'user', content: input, timestamp: new Date() };
    
    setMessages(prev => [...prev, displayMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await chatSessionRef.current.sendMessageStream({ message: textToSend });
      const assistantId = (Date.now() + 1).toString();
      let assistantContent = '';
      
      setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '', timestamp: new Date() }]);

      for await (const chunk of result) {
        assistantContent += chunk.text || '';
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: assistantContent } : m));
      }
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: 'Une erreur est survenue.', timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      <div className="px-4 py-3 flex justify-between items-center border-b border-white/5 glass-panel shrink-0">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aura Intelligence • {site}</span>
        </div>
        <div className="text-[10px] text-blue-500 font-bold uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
          Mode Privé
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 chat-scroll pb-24">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-300`}>
            <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 shadow-xl ${
              m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'glass-panel text-slate-100 rounded-bl-none border-white/10'
            }`}>
              <div className="text-sm md:text-base whitespace-pre-wrap leading-relaxed">{m.content}</div>
              <div className="flex justify-end mt-2 opacity-30 text-[9px] font-bold uppercase">
                {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="glass-panel px-4 py-3 rounded-2xl rounded-bl-none border border-white/5">
              <div className="flex space-x-1.5"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-150"></div><div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-300"></div></div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-900/50 glass-panel absolute bottom-0 left-0 right-0 md:relative md:bg-transparent">
        <div className="max-w-4xl mx-auto flex items-end space-x-2">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={`Posez une question pour ${site}...`}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white resize-none"
          />
          <button onClick={handleSend} disabled={!input.trim() || isLoading} className="w-12 h-12 flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-30 transition-all shadow-lg shrink-0">
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
