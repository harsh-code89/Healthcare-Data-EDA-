import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Activity, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePatientData } from '../../hooks/usePatientData';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export function AIAssistant() {
  const { user } = useAuth();
  const { appointments, activeMedications, reports } = usePatientData();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello ${user?.name || 'there'}! I'm your CareOS AI assistant. I can answer questions about your health records, summarize your recent lab reports, or remind you about your upcoming appointments and medications. How can I help you today?`,
      timestamp: new Date().toISOString(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simple mocked AI response logic based on context
    setTimeout(() => {
      let responseContent = "I understand. I'm here to help you manage your health journey. Remember to consult your primary care physician for any serious concerns.";
      
      const lowerInput = userMessage.content.toLowerCase();
      
      if (lowerInput.includes('medication') || lowerInput.includes('pill') || lowerInput.includes('medicine')) {
        if (activeMedications.length > 0) {
          const medList = activeMedications.map(m => `${m.name} (${m.dosage}, ${m.frequency})`).join(', ');
          responseContent = `You are currently taking: ${medList}. Always remember to take them exactly as prescribed by your doctor.`;
        } else {
          responseContent = "I don't see any active medications in your health record right now.";
        }
      } else if (lowerInput.includes('appointment') || lowerInput.includes('doctor') || lowerInput.includes('schedule')) {
        const upcoming = appointments.filter(a => a.status === 'upcoming');
        if (upcoming.length > 0) {
          const next = upcoming[0];
          responseContent = `Your next appointment is with ${next.providerName} on ${next.date} at ${next.time}.`;
        } else {
          responseContent = "You have no upcoming appointments scheduled. Would you like to book one from the Appointments page?";
        }
      } else if (lowerInput.includes('report') || lowerInput.includes('lab') || lowerInput.includes('test')) {
        if (reports.length > 0) {
          responseContent = `You have ${reports.length} reports in your file. Your latest one is "${reports[0].name}" from ${reports[0].reportDate}. You can view the full details and AI explanations in the Reports tab.`;
        } else {
          responseContent = "I don't see any uploaded lab reports. You can upload new reports in the Reports section.";
        }
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-indigo-50 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shadow-sm">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-indigo-900">CareOS Assistant</h2>
          <p className="text-xs text-indigo-600">AI-powered health insights</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50">
        <div className="flex justify-center">
          <div className="bg-slate-200/50 text-slate-500 text-xs px-3 py-1 rounded-full font-medium">
            This is an AI assistant. It does not provide medical advice.
          </div>
        </div>

        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              msg.role === 'user' ? 'bg-cyan-600' : 'bg-indigo-600'
            }`}>
              {msg.role === 'user' ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-white" />}
            </div>
            
            <div className={`max-w-[80%] rounded-2xl p-3 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-cyan-600 text-white rounded-tr-sm' 
                : 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              <span className={`text-[10px] mt-1 block ${msg.role === 'user' ? 'text-cyan-200' : 'text-slate-400'}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm p-4 shadow-sm flex gap-1">
              <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts */}
      {messages.length === 1 && (
        <div className="p-4 bg-white border-t border-slate-100 overflow-x-auto flex gap-2 hide-scrollbar">
          <button onClick={() => setInput("When is my next appointment?")} className="shrink-0 text-xs text-slate-600 bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 px-3 py-1.5 rounded-full transition-colors">
            📅 When is my next appointment?
          </button>
          <button onClick={() => setInput("What medications am I taking?")} className="shrink-0 text-xs text-slate-600 bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 px-3 py-1.5 rounded-full transition-colors">
            💊 What medications am I taking?
          </button>
          <button onClick={() => setInput("Summarize my latest lab report.")} className="shrink-0 text-xs text-slate-600 bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 px-3 py-1.5 rounded-full transition-colors">
            📊 Summarize my latest lab report
          </button>
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100">
        <div className="flex items-end gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about your health..."
            className="w-full bg-transparent resize-none outline-none max-h-32 p-1 text-sm text-slate-700"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isTyping}
            className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
