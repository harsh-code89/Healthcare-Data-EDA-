import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Send, Bot, User, Sparkles, RotateCcw, Copy, Check,
  ChevronDown, AlertTriangle, Loader2, FlaskConical,
  BookOpen, Heart, Pill, Microscope, Clock, Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePatientData } from '../../hooks/usePatientData';

// ── Types ──────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isError?: boolean;
  provider?: string;
  model?: string;
  isFallback?: boolean;
}

// ── Suggested prompt categories ───────────────────────────────────────────
const SUGGESTED_PROMPTS = [
  {
    icon: Pill,
    category: 'Medicines',
    color: 'text-violet-600 bg-violet-50 border-violet-200',
    prompts: [
      'What is Metformin and how does it work?',
      'What are the risks of taking Ibuprofen long-term?',
      'Explain the difference between paracetamol and ibuprofen',
    ],
  },
  {
    icon: FlaskConical,
    category: 'Longevity',
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    prompts: [
      'What is Rapamycin and what is the evidence for longevity?',
      'Does metformin extend lifespan in humans?',
      'What does science say about NAD+ supplements?',
    ],
  },
  {
    icon: Microscope,
    category: 'Research',
    color: 'text-cyan-600 bg-cyan-50 border-cyan-200',
    prompts: [
      'What experimental cancer therapies are in clinical trials?',
      'Explain senolytics — what are they and what\'s the evidence?',
      'What is GLP-1 and why is Semaglutide so popular?',
    ],
  },
  {
    icon: Heart,
    category: 'Preventive Health',
    color: 'text-rose-600 bg-rose-50 border-rose-200',
    prompts: [
      'What are evidence-based ways to lower my blood pressure naturally?',
      'How does sleep affect cardiovascular health?',
      'What blood tests should I get for a basic health check-up in India?',
    ],
  },
  {
    icon: BookOpen,
    category: 'Understanding Reports',
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    prompts: [
      'What does HbA1c measure and what do the numbers mean?',
      'My LDL cholesterol is high — what does that mean and what should I do?',
      'Explain what TSH levels tell us about thyroid health',
    ],
  },
];

// ── Markdown-like renderer (lightweight, no external lib) ──────────────────
function renderContent(content: string) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Headers
    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={i} className="text-base font-bold text-slate-800 mt-4 mb-2 first:mt-0">
          {renderInline(line.slice(3))}
        </h3>
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <h4 key={i} className="text-sm font-bold text-slate-700 mt-3 mb-1.5">
          {renderInline(line.slice(4))}
        </h4>
      );
    }
    // Table detection
    else if (line.startsWith('|') && lines[i + 1]?.startsWith('|--')) {
      const tableLines: string[] = [line];
      i++;
      while (i < lines.length && lines[i].startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      elements.push(renderTable(tableLines, i));
      continue;
    }
    // Bullet list
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      const listItems: string[] = [line.slice(2)];
      while (i + 1 < lines.length && (lines[i + 1].startsWith('- ') || lines[i + 1].startsWith('* '))) {
        i++;
        listItems.push(lines[i].slice(2));
      }
      elements.push(
        <ul key={i} className="list-none space-y-1 my-2">
          {listItems.map((item, idx) => (
            <li key={idx} className="flex gap-2 text-sm text-slate-700 leading-relaxed">
              <span className="text-slate-400 mt-0.5 shrink-0">•</span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
    }
    // Numbered list
    else if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+)\.\s(.*)$/);
      const listItems: Array<{ num: string; text: string }> = match
        ? [{ num: match[1], text: match[2] }]
        : [];
      while (i + 1 < lines.length && /^\d+\.\s/.test(lines[i + 1])) {
        i++;
        const m = lines[i].match(/^(\d+)\.\s(.*)$/);
        if (m) listItems.push({ num: m[1], text: m[2] });
      }
      elements.push(
        <ol key={i} className="space-y-1 my-2">
          {listItems.map((item, idx) => (
            <li key={idx} className="flex gap-2 text-sm text-slate-700 leading-relaxed">
              <span className="text-slate-400 shrink-0 font-medium w-5">{item.num}.</span>
              <span>{renderInline(item.text)}</span>
            </li>
          ))}
        </ol>
      );
    }
    // Horizontal rule
    else if (line === '---' || line === '***') {
      elements.push(<hr key={i} className="border-slate-100 my-3" />);
    }
    // Empty line
    else if (line.trim() === '') {
      elements.push(<div key={i} className="h-1.5" />);
    }
    // Regular paragraph
    else {
      elements.push(
        <p key={i} className="text-sm text-slate-700 leading-relaxed">
          {renderInline(line)}
        </p>
      );
    }
    i++;
  }

  return <div className="space-y-1">{elements}</div>;
}

function renderTable(lines: string[], keyBase: number) {
  const parseRow = (line: string) =>
    line.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1).map(c => c.trim());

  const headers = parseRow(lines[0]);
  const rows = lines.slice(2).map(parseRow);

  return (
    <div key={keyBase} className="overflow-x-auto my-3 rounded-lg border border-slate-200">
      <table className="w-full text-xs">
        <thead className="bg-slate-50">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-3 py-2 text-left font-semibold text-slate-600 border-b border-slate-200">
                {renderInline(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2 text-slate-700 border-b border-slate-100 last:border-b-0">
                  {renderInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  // Bold: **text**
  // Inline code: `code`
  // Emoji labels pass through
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-slate-800">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded text-[11px] font-mono">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

// ── Copy button ────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={copy}
      title="Copy response"
      className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export function AIAssistant() {
  const location = useLocation();
  const { user } = useAuth();
  const { appointments, activeMedications, reports } = usePatientData();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPrompts, setShowPrompts] = useState(true);
  const [activeCategory, setActiveCategory] = useState(0);
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initialPromptFired = useRef(false);

  // Check if AI is configured on first interaction (0 quota consumed)
  const checkConfiguration = useCallback(async () => {
    if (isConfigured !== null) return;
    try {
      const res = await fetch('/api/ai-health-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ping: true }),
      });
      const data = await res.json().catch(() => ({}));
      setIsConfigured(data.configured ?? res.status !== 503);
    } catch {
      setIsConfigured(false);
    }
  }, [isConfigured]);

  useEffect(() => { checkConfiguration(); }, [checkConfiguration]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 128) + 'px';
    }
  }, [input]);

  // Build user context from patient data
  const buildUserContext = () => {
    const context: Record<string, any> = {};
    if (user?.name) context.name = user.name;

    if (activeMedications?.length > 0) {
      context.medications = activeMedications
        .slice(0, 5)
        .map((m: any) => `${m.name} ${m.dosage} ${m.frequency}`);
    }
    if (appointments?.length > 0) {
      const upcoming = appointments
        .filter((a: any) => a.status === 'upcoming')
        .slice(0, 3)
        .map((a: any) => `${a.providerName} on ${a.date}`);
      if (upcoming.length > 0) context.upcomingAppointments = upcoming;
    }
    if (reports?.length > 0) {
      context.recentReports = reports
        .slice(0, 3)
        .map((r: any) => `${r.name} (${r.reportDate})`);
    }
    return context;
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);
    setShowPrompts(false);

    try {
      const res = await fetch('/api/ai-health-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          userContext: buildUserContext(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        let errorMessage = data.message || 'Something went wrong. Please try again.';
        if (typeof errorMessage === 'string' && (errorMessage.includes('{"error"') || errorMessage.startsWith('{'))) {
          try {
            const jsonPart = errorMessage.substring(errorMessage.indexOf('{'));
            const parsed = JSON.parse(jsonPart);
            errorMessage = parsed.error?.message || errorMessage;
          } catch {}
        }

        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: errorMessage,
            timestamp: new Date().toISOString(),
            isError: true,
          },
        ]);
        return;
      }

      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toISOString(),
          provider: data.provider,
          model: data.model,
          isFallback: data.isFallback,
        },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Unable to reach the AI service. Check your internet connection and try again.',
          timestamp: new Date().toISOString(),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle auto-starting a prompt when navigated from Reports or Medications
  useEffect(() => {
    if (initialPromptFired.current) return;
    const prompt = (location.state as any)?.initialPrompt || new URLSearchParams(location.search).get('q');
    if (prompt && typeof prompt === 'string' && prompt.trim()) {
      initialPromptFired.current = true;
      sendMessage(prompt.trim());
    }
  }, [location]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setShowPrompts(true);
  };

  // ── NOT CONFIGURED banner ─────────────────────────────────────────────
  const NotConfiguredBanner = () => (
    <div className="mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
      <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-amber-900">AI service not configured</p>
        <p className="text-xs text-amber-700 mt-1 leading-relaxed">
          The <code className="bg-amber-100 px-1 py-0.5 rounded">GEMINI_API_KEY</code> environment
          variable is not set in Netlify. Add it to enable CareOS AI.{' '}
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-medium"
          >
            Get a free key from Google AI Studio →
          </a>
        </p>
      </div>
    </div>
  );

  // ── Disclaimer ────────────────────────────────────────────────────────
  const Disclaimer = () => (
    <div className="flex justify-center px-4">
      <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-500 text-[11px] px-3 py-1.5 rounded-full font-medium">
        <Info className="h-3 w-3" />
        CareOS AI provides health information, not medical advice. Always consult a doctor.
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-violet-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-sm">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-base">CareOS AI</h2>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs text-slate-500">Health Intelligence · Gemini & OpenAI Dual-Engine</p>
            </div>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearConversation}
            title="New conversation"
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            New chat
          </button>
        )}
      </div>

      {/* ── Not configured warning ────────────────────────────────────── */}
      {isConfigured === false && <NotConfiguredBanner />}

      {/* ── Messages Area ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {/* Welcome / Prompt Explorer */}
        {showPrompts && messages.length === 0 && (
          <div className="p-4 space-y-5">
            <Disclaimer />

            {/* Welcome message */}
            <div className="text-center pt-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-3 shadow-md">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                Hi{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! I'm CareOS AI
              </h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                Ask me about medicines, health research, longevity science, lab reports,
                or any health topic — with transparent, evidence-graded answers.
              </p>
            </div>

            {/* Capabilities pills */}
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                { icon: '🔬', label: 'Drug research' },
                { icon: '📊', label: 'Evidence grading' },
                { icon: '🇮🇳', label: 'India context' },
                { icon: '🧬', label: 'Longevity science' },
                { icon: '💊', label: 'Pharmacology' },
                { icon: '📋', label: 'Report explained' },
              ].map((cap) => (
                <span
                  key={cap.label}
                  className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full"
                >
                  {cap.icon} {cap.label}
                </span>
              ))}
            </div>

            {/* Category tabs */}
            <div>
              <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                {SUGGESTED_PROMPTS.map((cat, idx) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.category}
                      onClick={() => setActiveCategory(idx)}
                      className={`shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                        activeCategory === idx
                          ? cat.color
                          : 'text-slate-500 bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="h-3 w-3" />
                      {cat.category}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 space-y-2">
                {SUGGESTED_PROMPTS[activeCategory].prompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="w-full text-left text-sm text-slate-700 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-800 border border-slate-200 hover:border-indigo-200 px-4 py-3 rounded-xl transition-all flex items-center justify-between group"
                  >
                    <span>{prompt}</span>
                    <ChevronDown className="h-4 w-4 rotate-[-90deg] text-slate-300 group-hover:text-indigo-400 shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Conversation messages */}
        {messages.length > 0 && (
          <div className="p-4 space-y-5">
            <Disclaimer />

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-cyan-600'
                      : msg.isError
                      ? 'bg-red-500'
                      : 'bg-gradient-to-br from-indigo-600 to-violet-600'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <User className="h-4 w-4 text-white" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-white" />
                  )}
                </div>

                {/* Bubble */}
                <div className={`max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  {msg.role === 'user' ? (
                    <div className="bg-cyan-600 text-white rounded-2xl rounded-tr-sm px-4 py-3">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ) : (
                    <div
                      className={`bg-white border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm ${
                        msg.isError ? 'border-red-200 bg-red-50' : 'border-slate-100'
                      }`}
                    >
                      {msg.isError ? (
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700">{msg.content}</p>
                          </div>
                          <button
                            onClick={() => {
                              const idx = messages.findIndex(m => m.id === msg.id);
                              if (idx > 0 && messages[idx - 1].role === 'user') {
                                sendMessage(messages[idx - 1].content);
                              }
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-100 hover:bg-red-200/80 px-2.5 py-1 rounded-md transition-colors"
                          >
                            <RotateCcw className="h-3 w-3" /> Retry question
                          </button>
                        </div>
                      ) : (
                        renderContent(msg.content)
                      )}

                      {/* Message actions */}
                      {!msg.isError && (
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-50">
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            <Clock className="h-3 w-3" />
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            {msg.model && (
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                                msg.isFallback
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {msg.isFallback ? `⚡ Fallback: ${msg.model}` : msg.model}
                              </span>
                            )}
                          </div>
                          <CopyButton text={msg.content} />
                        </div>
                      )}
                    </div>
                  )}

                  {msg.role === 'user' && (
                    <span className="text-[10px] text-slate-400 mr-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shrink-0 shadow-sm">
                  <Loader2 className="h-4 w-4 text-white animate-spin" />
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ── Input Area ────────────────────────────────────────────────── */}
      <div className="border-t border-slate-100 bg-white p-3">
        {/* Quick topics when mid-conversation */}
        {messages.length > 0 && messages.length < 3 && (
          <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
            {['Explain side effects', 'What\'s the evidence?', 'Is it available in India?', 'Safer alternatives?'].map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                disabled={isLoading}
                className="shrink-0 text-xs text-slate-600 bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 rounded-xl p-2 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about medicines, research, lab reports, health…"
              disabled={isLoading || isConfigured === false}
              rows={1}
              className="flex-1 bg-transparent resize-none outline-none text-sm text-slate-700 placeholder-slate-400 px-1 py-1 min-h-[36px] disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading || isConfigured === false}
              className="p-2 bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-lg hover:from-indigo-700 hover:to-violet-700 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 transition-all shadow-sm"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="text-[10px] text-slate-400 text-center mt-1.5">
            Shift + Enter for new line · CareOS AI may make mistakes — verify important health information
          </p>
        </form>
      </div>
    </div>
  );
}
