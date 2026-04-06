import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import axios from 'axios';
import { cn } from '../lib/utils';
import { SelectionOverlay } from './SelectionOverlay';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const STARTER_CHIPS = [
  "What crops are best for sandy soil?",
  "How does soil pH affect my yield?",
  "What is the best crop for low rainfall areas?",
  "How to improve nitrogen naturally?"
];

export const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'SYSTEM INITIALIZED. Awaiting agricultural queries.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    
    const userMsg = { role: 'user' as const, content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const resp = await axios.post('http://localhost:8000/chat', {
        message: text,
        history: messages.map(m => ({ role: m.role, content: m.content }))
      });
      setMessages(prev => [...prev, { role: 'assistant', content: resp.data.response }]);
    } catch (e) {
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'ERR: Backend communication failed. Check API configuration.' 
        }]);
      }, 1000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative mt-3 ml-3 mr-3 mb-3">
      <SelectionOverlay label="CHAT_UI_CONTAINER" />
      <div className="border-2 border-black flex flex-col h-[600px] bg-white relative z-10 w-full">
        {/* Header */}
        <div className="border-b-2 border-black p-6 bg-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="font-serif text-3xl uppercase tracking-widest">Agronomy Assistant</h2>
            <p className="font-sans text-[10px] uppercase tracking-widest text-[#4B5563] mt-2 flex items-center space-x-2">
               <span className="inline-block w-2 h-2 bg-black"></span>
               <span>System Online // Gemini Engine API</span>
            </p>
          </div>
          <div className="w-[48px] h-[48px] border-2 border-black flex items-center justify-center bg-black text-white">
            <Bot className="w-6 h-6" />
          </div>
        </div>

        {/* Messages body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}>
              <div className={cn("flex max-w-[85%]", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                <div className={cn(
                  "w-[44px] h-[44px] border-2 border-black flex items-center justify-center shrink-0 items-start", 
                  msg.role === 'user' ? "ml-4 bg-white" : "mr-4 bg-black text-white"
                )}>
                  {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                <div className={cn(
                  "p-4 border-2 border-black font-sans text-sm leading-relaxed", 
                  msg.role === 'user' ? "bg-black text-white" : "bg-white text-black"
                )}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex max-w-[85%] flex-row">
                <div className="w-[44px] h-[44px] border-2 border-black flex items-center justify-center shrink-0 mr-4 bg-black text-white">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="p-4 border-2 border-black font-sans text-sm flex items-center space-x-3 bg-white">
                  <div className="w-2 h-2 bg-black animate-ping"></div>
                  <span className="uppercase tracking-widest text-[10px] font-medium">Processing...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-6 bg-white border-t-2 border-black shrink-0 relative">
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2 absolute bottom-full left-0 mb-6 px-6 w-full pointer-events-none">
              {STARTER_CHIPS.map(chip => (
                <button 
                  key={chip} 
                  onClick={() => handleSend(chip)}
                  className="pointer-events-auto text-[10px] font-sans font-medium uppercase tracking-widest px-3 py-2 border-2 border-black bg-white hover:bg-black hover:text-white transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}
          <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="flex space-x-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="ENTER QUERY COMMAND..."
              className="flex-1 w-full border-2 border-black py-4 px-5 font-sans focus:outline-none focus:bg-gray-50 uppercase tracking-wide text-sm"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-[56px] h-[56px] border-2 border-black flex items-center justify-center bg-white hover:bg-black hover:text-white transition-colors disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-black shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
