

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Send, Upload, User, Sparkles, MessageSquare, Brain, PhoneCall,
  Minimize2, Clock, ShieldCheck, Paperclip, X, ArrowUp,
  CheckCircle2, AlertCircle,
} from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { getSocket } from '@/lib/socket';
import { StreamingMessage, TypingIndicator } from '@/components/Chat/StreamingMessage';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

// ─── Types ──────────────────────────────────────────────────────────────────
type ChatMode = 'ai' | 'amer' | 'voice';
type ConnectionStatus = 'idle' | 'requesting' | 'pending' | 'connected' | 'no_officers';

type ChatMessage = {
  id: string;
  type: 'user' | 'bot' | 'system' | 'amer' | 'file';
  content: string;
  timestamp: Date;
  metadata?: any;
  isStreaming?: boolean;
};

// ─── Anonymous identity helper ──────────────────────────────────────────────
// Returns a stable anonymous ID for unauthenticated users so the backend can
// maintain conversation context across messages. Stored in localStorage.
const getAnonId = (): string => {
  let id = localStorage.getItem('tammat:anonId');
  if (!id) {
    id = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem('tammat:anonId', id);
  }
  return id;
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const TammatSupervisor = ({
  position = 'bottom-right',
  size = 'md',
  showTranscript = true,
  floatingButton = true
}) => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.language === 'ur';

  // ─── Panel state ──────────────────────────────────────────────────────────
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [chatMode, setChatMode] = useState<ChatMode>('ai');

  // ─── Connection state ─────────────────────────────────────────────────────
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
  const [officerInfo, setOfficerInfo] = useState<{ name: string; id: string } | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);

  // ─── Chat state (separate per mode) ───────────────────────────────────────
  const [aiChat, setAiChat] = useState<ChatMessage[]>([]);
  const [amerChat, setAmerChat] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isAIStreaming, setIsAIStreaming] = useState(false);
  const [isOfficerTyping, setIsOfficerTyping] = useState(false);

  // ─── File upload state ────────────────────────────────────────────────────
  const [showUpload, setShowUpload] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── DOM refs ─────────────────────────────────────────────────────────────
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const apiBase = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:5001';
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : '';

  // ─── Auto-scroll ──────────────────────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  // ─── Current chat (derived) ───────────────────────────────────────────────
  const currentChat = chatMode === 'amer' ? amerChat : aiChat;
  const setCurrentChat = chatMode === 'amer' ? setAmerChat : setAiChat;

  // ─── Socket setup (only when authenticated) ───────────────────────────────
  // Anonymous users don't get a socket — they only get AI streaming.
  // The socket is needed only for talking to live Amer officers.
  useEffect(() => {
    if (!token) {
      setSocket(null);
      return;
    }
    const sock = getSocket() as unknown as Socket;
    setSocket(sock);
  }, [token]);

  // ─── Socket event listeners ───────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onAmerConnected = (payload: any) => {
      setRoomId(payload?.chatId || payload?.roomId);
      setConnectionStatus('connected');
      setOfficerInfo({
        name: payload?.officerName || 'Amer',
        id: payload?.officerId || 'unknown',
      });
      setPendingRequestId(null);
      addSystem(`Connected to ${payload?.officerName || 'Amer'}. You can now chat live.`, 'amer');
      toast.success('Amer is now in the chat', {
        description: `${payload?.officerName || 'Officer'} just joined.`,
      });
    };

    const onRequestSent = (payload: any) => {
      setConnectionStatus('pending');
      setPendingRequestId(payload?.requestId);
      addSystem(
        `Request sent. ${payload?.officersCount || 'Available'} officers notified — typical reply time is 2 minutes.`,
        'amer'
      );
    };

    const onNoOfficers = (payload: any) => {
      setConnectionStatus('no_officers');
      addSystem(
        payload?.message || 'No officers online right now. Leave a message and Amer will reply within 1 hour.',
        'amer'
      );
      setTimeout(() => setConnectionStatus('idle'), 4000);
    };

    const onNewMessage = (msg: any) => {
      const isFile = msg.type === 'file';
      const newMessage: ChatMessage = {
        id: msg.id || Date.now().toString(),
        type: isFile ? 'file' : msg.sender === 'user' ? 'user' : 'amer',
        content: isFile ? msg.metadata?.fileName || 'File shared' : msg.content,
        metadata: msg.metadata,
        timestamp: new Date(msg.timestamp || Date.now()),
      };

      if (msg.sender === 'amer' || msg.type === 'amer') {
        setAmerChat((prev) => (prev.some((p) => p.id === msg.id) ? prev : [...prev, newMessage]));
        if (chatMode !== 'amer') setChatMode('amer');
      } else {
        setCurrentChat((prev) => (prev.some((p) => p.id === msg.id) ? prev : [...prev, newMessage]));
      }
      scrollToBottom();
    };

    const onTyping = (p: any) => setIsOfficerTyping(!!p?.isTyping);

    const onChatEnded = (payload: any) => {
      setConnectionStatus('idle');
      setRoomId(null);
      setOfficerInfo(null);
      addSystem(payload.message || `Chat ended: ${payload.reason}`, 'amer');
    };

    socket.on('amer_connected', onAmerConnected);
    socket.on('request_sent', onRequestSent);
    socket.on('no_officers_available', onNoOfficers);
    socket.on('new_message', onNewMessage);
    socket.on('user_typing', onTyping);
    socket.on('chat_ended', onChatEnded);

    return () => {
      socket.off('amer_connected', onAmerConnected);
      socket.off('request_sent', onRequestSent);
      socket.off('no_officers_available', onNoOfficers);
      socket.off('new_message', onNewMessage);
      socket.off('user_typing', onTyping);
      socket.off('chat_ended', onChatEnded);
    };
  }, [socket, chatMode, scrollToBottom]);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const addSystem = (content: string, target: 'ai' | 'amer' = 'ai') => {
    const msg: ChatMessage = {
      id: Date.now().toString() + Math.random(),
      type: 'system',
      content,
      timestamp: new Date(),
    };
    if (target === 'amer') setAmerChat((p) => [...p, msg]);
    else setAiChat((p) => [...p, msg]);
    scrollToBottom();
  };

  // ─── Send: AI streaming (works for ANONYMOUS users) ───────────────────────
  const sendAIMessage = async (content: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date(),
    };
    setAiChat((prev) => [...prev, userMsg]);
    scrollToBottom();
    setIsAIStreaming(true);

    const botId = (Date.now() + 1).toString();
    setAiChat((prev) => [
      ...prev,
      { id: botId, type: 'bot', content: '', timestamp: new Date(), isStreaming: true },
    ]);

    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      } else {
        // Anonymous user — send anonId for context continuity
        headers['X-Anon-Id'] = getAnonId();
      }

      const res = await fetch(`${apiBase}/api/v1/chat/stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: content,
          chatHistory: aiChat.slice(-10),
          context: { authenticated: !!token },
        }),
      });

      if (!res.body) throw new Error('No stream body');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullResponse = '';
      
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content' && parsed.content) {
              fullResponse += parsed.content;
              setAiChat((prev) =>
                prev.map((m) => (m.id === botId ? { ...m, content: m.content + parsed.content } : m))
              );
              scrollToBottom();
            }
            if (parsed.type === 'complete') {
              setAiChat((prev) =>
                prev.map((m) =>
                  m.id === botId ? { ...m, content: parsed.fullResponse || fullResponse, isStreaming: false } : m
                )
              );
              // Detect billable-topic escalation opportunity
              const lower = (parsed.fullResponse || fullResponse).toLowerCase();
              if (
                lower.includes('nawakas') ||
                lower.includes('fine') ||
                lower.includes('absconding') ||
                lower.includes('mercy letter') ||
                lower.includes('amer officer') ||
                lower.includes('human agent')
              ) {
                setTimeout(() => {
                  setAiChat((prev) => [
                    ...prev,
                    {
                      id: Date.now().toString() + '_cta',
                      type: 'system',
                      content: '',
                      timestamp: new Date(),
                      metadata: { action: 'connect_amer_upsell' },
                    },
                  ]);
                  scrollToBottom();
                }, 400);
              }
            }
          } catch (e) {
            // Ignore malformed chunks
          }
        }
      }
    } catch (err) {
      setAiChat((prev) =>
        prev.map((m) =>
          m.id === botId
            ? { ...m, content: 'Sorry, I had trouble responding. Try again in a moment.', isStreaming: false }
            : m
        )
      );
    } finally {
      setIsAIStreaming(false);
    }
  };

  // ─── Send: Officer chat (requires auth + socket) ──────────────────────────
  const sendOfficerMessage = (content: string) => {
    if (!user) {
      toast.error('Please log in to chat with Amer');
      return;
    }
    if (!socket || !roomId) {
      toast.error('Connection not ready — requesting Amer first');
      requestAmer();
      return;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date(),
    };
    setAmerChat((prev) => [...prev, userMsg]);
    scrollToBottom();
    socket.emit('chat_message', { message: content, chatId: roomId, type: 'text' });
  };

  // ─── Send dispatcher ──────────────────────────────────────────────────────
  const handleSend = async () => {
      const content = input.trim();
    if (!content) return;
    setInput('');

    if (chatMode === 'ai') {
      await sendAIMessage(content);
    } else if (chatMode === 'amer') {
      sendOfficerMessage(content);
    }
  };

  // ─── Request Amer (auth-gated) ────────────────────────────────────────────
  const requestAmer = () => {
    if (!user) {
      toast.error('Please log in', {
        description: 'Live chat with Amer requires an account so we can save your application.',
        action: { label: 'Log in', onClick: () => (window.location.href = '/auth?redirect=' + window.location.pathname) },
      });
      return;
    }
    if (!socket) {
      toast.error('Connection unavailable. Please refresh.');
      return;
    }
    if (connectionStatus === 'pending') {
      toast.info('Request already pending');
      return;
    }
    if (connectionStatus === 'connected') return;

    setConnectionStatus('requesting');
    socket.emit('request_amer_connection', {
      service: 'visa application',
      userId: user?.id,
      userData: { name: user?.name || 'User', email: user?.email || '' },
      timestamp: new Date().toISOString(),
    });
    addSystem('Looking for an available Amer officer…', 'amer');
  };

  // ─── File upload (auth-gated) ─────────────────────────────────────────────
  const handleFiles = async (files: File[]) => {
    if (!user) {
      toast.error('Please log in to upload files');
      return;
    }
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        continue;
      }
      const fileMsg: ChatMessage = {
        id: Date.now().toString() + '_file',
        type: 'file',
        content: `Uploading ${file.name}…`,
        timestamp: new Date(),
        metadata: { fileName: file.name, fileSize: file.size, fileType: file.type, uploading: true },
      };
      setAmerChat((p) => [...p, fileMsg]);

      try {
        const form = new FormData();
        form.append('file', file);
        const res = await fetch(`${apiBase}/api/v1/chat/upload?roomId=${roomId || 'general'}`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: form,
        });
        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        const { fileUrl } = data.data || {};
        setAmerChat((p) =>
          p.map((m) =>
            m.id === fileMsg.id
              ? { ...m, content: file.name, metadata: { ...m.metadata, fileUrl, uploading: false } }
              : m
          )
        );
        if (socket && roomId) {
          socket.emit('file_upload_complete', {
            chatId: roomId,
            userId: user.id,
            fileUrl,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
          });
        }
        toast.success(`${file.name} uploaded`);
      } catch {
        setAmerChat((p) =>
          p.map((m) => (m.id === fileMsg.id ? { ...m, content: `Failed: ${file.name}`, metadata: { error: true } } : m))
        );
      }
    }
    setShowUpload(false);
  };

  // ─── Drag handlers ────────────────────────────────────────────────────────
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setShowUpload(false);
    handleFiles(Array.from(e.dataTransfer.files));
  };

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  // ─── Collapsed: floating button ───────────────────────────────────────────
  if (isCollapsed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-20 right-6 z-50"
      >
        <button
          onClick={() => setIsCollapsed(false)}
          className="group relative h-14 w-14 rounded-full bg-gradient-to-br from-[#0B1F3B] to-[#1a3358] shadow-xl shadow-[#0B1F3B]/30 hover:shadow-2xl hover:shadow-[#0B1F3B]/40 transition-all hover:scale-105"
          aria-label="Open chat"
        >
          <MessageSquare className="absolute inset-0 m-auto h-6 w-6 text-[#C9A227]" strokeWidth={1.5} />
          {connectionStatus === 'connected' && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
              <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-500 border-2 border-white" />
            </span>
          )}
          {/* Hover tooltip */}
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-[#0B1F3B] px-3 py-1.5 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
            Ask Amer
          </span>
        </button>
      </motion.div>
    );
  }

  // ─── Open: chat panel ─────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="fixed bottom-6 right-6 z-50 w-[min(420px,calc(100vw-2rem))] h-[min(640px,calc(100vh-3rem))] flex flex-col rounded-3xl overflow-hidden shadow-2xl shadow-[#0B1F3B]/30 bg-white border border-[#0B1F3B]/8"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* ─── HEADER ─────────────────────────────────────────────────────── */}
      <ChatHeader
        chatMode={chatMode}
        connectionStatus={connectionStatus}
        officerInfo={officerInfo}
        onClose={() => setIsCollapsed(true)}
      />

      {/* ─── MODE SWITCHER ──────────────────────────────────────────────── */}
      <ChatModeSwitcher
        chatMode={chatMode}
        onModeChange={(m) => {
          setChatMode(m);
          if (m === 'amer' && connectionStatus === 'idle') requestAmer();
          if (m === 'voice') toast('Voice call feature coming soon');
        }}
        hasUser={!!user}
      />

      {/* ─── MESSAGES ───────────────────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto bg-gradient-to-b from-[#FAF6EC]/40 to-white relative"
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragOver(false);
        }}
        onDrop={onDrop}
      >
        {/* Drag overlay */}
        <AnimatePresence>
          {isDragOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex items-center justify-center bg-[#0B1F3B]/85 backdrop-blur-sm"
            >
              <div className="text-center">
                <Upload className="h-12 w-12 text-[#C9A227] mx-auto mb-3" strokeWidth={1.5} />
                <p className="text-white font-medium" style={{ fontFamily: "'Fraunces', serif" }}>
                  Drop file to share
                </p>
                <p className="text-white/60 text-xs mt-1">PDF, image, or document up to 10MB</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="px-4 py-5 space-y-4">
          {currentChat.length === 0 && <EmptyState chatMode={chatMode} onSuggestionClick={(s) => setInput(s)} />}

          {currentChat.map((m, idx) => (
            <React.Fragment key={`${m.id}-${idx}`}>
              {/* CTA upsell card — fires when AI mentions a billable service */}
              {m.metadata?.action === 'connect_amer_upsell' ? (
                <UpsellCard onConnect={() => { setChatMode('amer'); requestAmer(); }} />
              ) : (
                <StreamingMessage
                  type={m.type === 'bot' ? 'ai' : (m.type as any)}
                  content={m.content}
                  isStreaming={m.isStreaming}
                  metadata={m.metadata}
                  timestamp={m.timestamp}
                />
              )}
            </React.Fragment>
          ))}

          {isAIStreaming && currentChat[currentChat.length - 1]?.isStreaming !== true && (
            <TypingIndicator sender="Tammat AI" />
          )}
          {isOfficerTyping && <TypingIndicator sender={officerInfo?.name || 'Amer'} />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ─── INPUT BAR ──────────────────────────────────────────────────── */}
      <div className="border-t border-[#0B1F3B]/8 bg-white">
        {/* SLA + status strip */}
        <div className="px-4 py-2 flex items-center justify-between text-[11px] text-[#0B1F3B]/55 border-b border-[#0B1F3B]/5">
          <div className="flex items-center gap-1.5">
            {chatMode === 'ai' ? (
              <>
                <Sparkles className="h-3 w-3 text-[#C9A227]" />
                <span>Instant AI replies</span>
              </>
            ) : connectionStatus === 'connected' ? (
              <>
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                <span>Live with {officerInfo?.name || 'Amer'}</span>
              </>
            ) : (
              <>
                <Clock className="h-3 w-3" />
                <span>Amer typically replies in 2 minutes</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            <span>Encrypted</span>
          </div>
        </div>

        {/* Input */}
        <div className="p-3 flex items-end gap-2">
          <button
            onClick={() => {
              if (!user && chatMode === 'amer') {
                toast.error('Log in to share files with Amer');
                return;
              }
              fileInputRef.current?.click();
            }}
            className="shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-[#0B1F3B]/60 hover:text-[#0B1F3B] hover:bg-[#0B1F3B]/5 transition"
            aria-label="Attach file"
          >
            <Paperclip className="h-4 w-4" />
          </button>

          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
                if (chatMode === 'amer' && roomId && socket) {
                  socket.emit('typing_start', { roomId, userId: 'user' });
                }
              }}
              placeholder={
                chatMode === 'ai'
                  ? 'Ask Amer about your visa, fine, or document…'
                  : connectionStatus === 'connected'
                  ? 'Message Amer…'
                  : 'Tap "Talk to Amer" to start'
              }
              className="h-10 px-4 rounded-full border-[#0B1F3B]/15 bg-[#FAF6EC]/30 focus:bg-white focus:border-[#0B1F3B]/30 transition placeholder:text-[#0B1F3B]/40"
              disabled={chatMode === 'amer' && connectionStatus !== 'connected'}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!input.trim() || isAIStreaming}
            className={cn(
              'shrink-0 h-10 w-10 rounded-full flex items-center justify-center transition-all',
              input.trim() && !isAIStreaming
                ? 'bg-[#0B1F3B] text-[#C9A227] hover:bg-[#1a3358] shadow-md'
                : 'bg-[#0B1F3B]/10 text-[#0B1F3B]/30 cursor-not-allowed'
            )}
            aria-label="Send"
          >
            <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.txt"
          onChange={(e) => handleFiles(Array.from(e.target.files || []))}
          className="hidden"
          multiple
        />
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

const ChatHeader = ({
  chatMode,
  connectionStatus,
  officerInfo,
  onClose,
}: {
  chatMode: ChatMode;
  connectionStatus: ConnectionStatus;
  officerInfo: { name: string; id: string } | null;
  onClose: () => void;
}) => (
  <div className="relative bg-gradient-to-br from-[#0B1F3B] via-[#142a4a] to-[#0B1F3B] text-white px-5 py-4">
    {/* Gold accent line */}
    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A227] to-transparent opacity-40" />

    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Amer avatar */}
        <div className="relative">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#C9A227] to-[#8B6F1A] flex items-center justify-center text-[#0B1F3B] font-semibold text-sm border-2 border-[#C9A227]/30">
            ع
          </div>
          {connectionStatus === 'connected' && (
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-500 border-2 border-[#0B1F3B] rounded-full" />
          )}
        </div>
        <div>
          <p className="font-medium text-sm leading-tight" style={{ fontFamily: "'Fraunces', serif" }}>
            {connectionStatus === 'connected' && officerInfo ? officerInfo.name : 'Amer'}
          </p>
          <p className="text-[11px] text-white/60 leading-tight mt-0.5">
            {connectionStatus === 'connected'
              ? 'Online — Professional Typist'
              : chatMode === 'ai'
              ? 'AI Assistant'
              : 'Professional Typist, Dubai'}
          </p>
        </div>
      </div>

      <button
        onClick={onClose}
        className="h-8 w-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition"
        aria-label="Minimize"
      >
        <Minimize2 className="h-3.5 w-3.5" />
      </button>
    </div>
  </div>
);

const ChatModeSwitcher = ({
  chatMode,
  onModeChange,
  hasUser,
}: {
  chatMode: ChatMode;
  onModeChange: (m: ChatMode) => void;
  hasUser: boolean;
}) => {
  const modes: { id: ChatMode; label: string; icon: any; sub: string }[] = [
    { id: 'ai', label: 'AI', icon: Brain, sub: 'Instant' },
    { id: 'amer', label: 'Amer', icon: User, sub: hasUser ? '~2 min' : 'Login' },
    { id: 'voice', label: 'Call', icon: PhoneCall, sub: 'Soon' },
  ];

  return (
    <div className="px-3 py-2 bg-[#FAF6EC]/50 border-b border-[#0B1F3B]/8">
      <div className="grid grid-cols-3 gap-1.5">
        {modes.map((m) => {
          const isActive = chatMode === m.id;
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              onClick={() => onModeChange(m.id)}
              className={cn(
                'flex flex-col items-center justify-center py-2 px-2 rounded-xl transition-all',
                isActive
                  ? 'bg-[#0B1F3B] text-[#C9A227] shadow-md'
                  : 'bg-white/60 text-[#0B1F3B]/70 hover:bg-white hover:text-[#0B1F3B]'
              )}
            >
              <Icon className="h-3.5 w-3.5 mb-0.5" strokeWidth={1.75} />
              <span className="text-[11px] font-medium leading-tight">{m.label}</span>
              <span className={cn('text-[9px] leading-tight mt-0.5', isActive ? 'text-[#C9A227]/70' : 'text-[#0B1F3B]/40')}>
                {m.sub}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const EmptyState = ({ chatMode, onSuggestionClick }: { chatMode: ChatMode; onSuggestionClick: (s: string) => void }) => {
  const suggestions =
    chatMode === 'ai'
      ? [
          'How do I check my overstay fine?',
          'What is a Nawakas application?',
          'My visa expires next month — what do I do?',
          'How to file a fine mercy letter?',
        ]
      : ['I need help with a fine', 'I have a Nawakas issue', 'Visa cancellation help', 'Status of my application'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-5 py-2"
    >
      {/* Greeting */}
      <div className="text-center space-y-3 pt-2 pb-4">
        <div className="inline-flex h-16 w-16 rounded-full bg-gradient-to-br from-[#C9A227] to-[#8B6F1A] items-center justify-center text-[#0B1F3B] text-2xl font-bold shadow-lg shadow-[#C9A227]/20" style={{ fontFamily: "'Fraunces', serif" }}>
          ع
        </div>
        <div>
          <h3 className="text-lg font-medium text-[#0B1F3B]" style={{ fontFamily: "'Fraunces', serif" }}>
            Hi, I'm Amer.
          </h3>
          <p className="text-sm text-[#0B1F3B]/60 mt-1 leading-relaxed max-w-[280px] mx-auto">
            {chatMode === 'ai'
              ? "Ask me anything about UAE visas, fines, or documents. I'll help instantly — or call my human team if you need it."
              : 'Tell me what you need help with and I will reply within 2 minutes.'}
          </p>
        </div>
      </div>

      {/* Suggestion chips */}
      <div className="space-y-2">
        <p className="text-[11px] uppercase tracking-widest text-[#0B1F3B]/40 font-medium px-1">Common questions</p>
        <div className="grid grid-cols-1 gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => onSuggestionClick(s)}
              className="group flex items-center justify-between px-4 py-2.5 rounded-2xl bg-white border border-[#0B1F3B]/8 hover:border-[#C9A227]/40 hover:bg-[#C9A227]/5 transition text-left"
            >
              <span className="text-sm text-[#0B1F3B]/80 group-hover:text-[#0B1F3B]">{s}</span>
              <Send className="h-3 w-3 text-[#0B1F3B]/30 group-hover:text-[#C9A227] transition" />
            </button>
          ))}
        </div>
      </div>

      {/* Trust strip */}
      <div className="flex items-center justify-center gap-3 text-[10px] text-[#0B1F3B]/40 pt-2">
        <span className="flex items-center gap-1">
          <ShieldCheck className="h-3 w-3" />
          Encrypted
        </span>
        <span>•</span>
        <span>Licensed Typist</span>
        <span>•</span>
        <span>Dubai</span>
      </div>
    </motion.div>
  );
};

const UpsellCard = ({ onConnect }: { onConnect: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 8, scale: 0.96 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    className="mx-auto max-w-[85%] rounded-2xl border border-[#C9A227]/30 bg-gradient-to-br from-[#FAF6EC] to-[#F5EBD2] p-4 shadow-sm"
  >
    <div className="flex items-start gap-3">
      <div className="h-8 w-8 shrink-0 rounded-full bg-[#C9A227]/20 flex items-center justify-center">
        <Sparkles className="h-4 w-4 text-[#8B6F1A]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#0B1F3B]" style={{ fontFamily: "'Fraunces', serif" }}>
          Want Amer to handle this for you?
        </p>
        <p className="text-xs text-[#0B1F3B]/65 mt-1 leading-relaxed">
          He'll prepare the documents and submit on your behalf — usually done within 24 hours.
        </p>
        <button
          onClick={onConnect}
          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0B1F3B] text-[#C9A227] text-xs font-medium hover:bg-[#1a3358] transition"
        >
          Talk to Amer
          <Send className="h-3 w-3" />
        </button>
      </div>
    </div>
  </motion.div>
);

export default TammatSupervisor;

// ═══════════════════════════════════════════════════════════════════════════
// BACKEND CHANGES YOU NEED
// ═══════════════════════════════════════════════════════════════════════════
//
// 1. NEW ENDPOINT: POST /api/v1/chat/anonymous/stream
//    Same as your existing /api/v1/chat/stream, but:
//    - No authMiddleware required
//    - Reads X-Anon-Id header for context continuity
//    - Optional: rate-limit per anonId (e.g., 30 messages/day) to prevent abuse
//    - Optional: cache anonymous conversations in Redis with 24h TTL
//
//    Snippet (drop into your chatController.js):
//
//    exports.streamAnonymousMessage = catchAsync(async (req, res, next) => {
//      const { message, chatHistory = [], context = {} } = req.body;
//      const anonId = req.headers['x-anon-id'];
//      if (!message) return next(new AppError('Message required', 400));
//      if (!anonId) return next(new AppError('Anonymous ID required', 400));
//
//      // Optional rate limit
//      // const count = await redis.incr(`anon:${anonId}:msgs`);
//      // await redis.expire(`anon:${anonId}:msgs`, 86400);
//      // if (count > 30) return next(new AppError('Rate limit. Please log in.', 429));
//
//      // ... rest is identical to your streamMessage function ...
//    });
//
//    Route: router.post('/anonymous/stream', chatController.streamAnonymousMessage);
//    (NO authMiddleware on this route)
//
// 2. SYSTEM PROMPT TWEAK for anonymous users:
//    "The user is browsing Tammat without an account. After 2-3 exchanges,
//     if they mention a fine, Nawakas, absconding case, or visa cancellation,
//     suggest they 'talk to Amer' (our human typist) to actually file it.
//     Don't pressure them — just mention it's available."
//
// 3. KEEP your existing socket.io 'request_amer_connection' auth-gated.
//    Anonymous users CANNOT request a live officer — that's the upsell moment.
//
// ═══════════════════════════════════════════════════════════════════════════