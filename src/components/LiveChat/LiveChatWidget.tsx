'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Send,
  X,
  Bot,
  User,
  Loader2,
  Paperclip,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { getSocket } from '@/lib/socket';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai' | 'officer';
  timestamp: Date;
  attachments?: string[];
}

const LiveChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your AI assistant. How can I help you with your visa application today?',
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [officerOnline, setOfficerOnline] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

  useEffect(() => {
    const socket = getSocket();

    // Listen for officer status
    socket.on('officer_status', (data: any) => {
      setOfficerOnline(data.online);
    });

    // Listen for incoming messages
    socket.on('chat_message', (data: any) => {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: data.message,
        sender: data.sender === 'officer' ? 'officer' : 'ai',
        timestamp: new Date(data.timestamp),
      };
      setMessages((prev) => [...prev, newMessage]);
      
      if (!isOpen) {
        setUnreadCount((prev) => prev + 1);
        toast.info('New message from support', {
          description: data.message.substring(0, 50) + '...',
        });
      }
    });

    // Listen for typing indicator
    socket.on('typing_indicator', (data: any) => {
      setIsTyping(data.isTyping);
    });

    return () => {
      socket.off('officer_status');
      socket.off('chat_message');
      socket.off('typing_indicator');
    };
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const token = localStorage.getItem('authToken');
      const socket = getSocket();

      // Emit message to server
      socket.emit('chat_message', {
        message: inputMessage,
        sender: 'user',
        timestamp: new Date(),
      });

      // Get AI response
      const response = await fetch(`${apiBase}/api/v1/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: inputMessage }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.response || 'I understand. Let me help you with that.',
          sender: officerOnline ? 'officer' : 'ai',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to send message');
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileAttach = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast.success(`File "${file.name}" attached`);
      // Handle file upload logic here
    }
  };

  const getSenderIcon = (sender: string) => {
    switch (sender) {
      case 'ai':
        return <Bot className="w-4 h-4" />;
      case 'officer':
        return <User className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getSenderColor = (sender: string) => {
    switch (sender) {
      case 'ai':
        return 'bg-blue-600';
      case 'officer':
        return 'bg-green-600';
      default:
        return 'bg-purple-600';
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 relative"
              size="icon"
            >
              <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-600 text-white text-xs">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Widget */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              height: isMinimized ? 'auto' : undefined,
            }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 max-h-[calc(100vh-2rem)] sm:max-h-[600px] bg-background rounded-2xl shadow-2xl border-2 border-primary/20 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-3 sm:p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border-2 border-white">
                  <AvatarFallback className="bg-white text-purple-600 text-sm sm:text-base">
                    {officerOnline ? <User className="w-4 h-4 sm:w-5 sm:h-5" /> : <Bot className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-white text-sm sm:text-base">
                    {officerOnline ? 'Live Support' : 'AI Assistant'}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <div className={`h-2 w-2 rounded-full ${officerOnline ? 'bg-green-400' : 'bg-yellow-400'}`} />
                    <span className="text-white/90 text-xs">
                      {officerOnline ? 'Officer Online' : 'AI Available'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="text-white hover:bg-white/20 h-8 w-8 sm:h-9 sm:w-9"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20 h-8 w-8 sm:h-9 sm:w-9"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gradient-to-b from-purple-50/30 to-blue-50/30">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-2 sm:gap-3 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <Avatar className={`h-7 w-7 sm:h-8 sm:w-8 shrink-0 ${getSenderColor(message.sender)}`}>
                        <AvatarFallback className="text-white text-xs">
                          {getSenderIcon(message.sender)}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`max-w-[75%] sm:max-w-[80%] rounded-2xl px-3 py-2 sm:px-4 sm:py-3 ${
                          message.sender === 'user'
                            ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white'
                            : 'bg-white border border-gray-200'
                        }`}
                      >
                        <p className="text-xs sm:text-sm break-words">{message.text}</p>
                        <span
                          className={`text-[10px] sm:text-xs mt-1 block ${
                            message.sender === 'user' ? 'text-white/70' : 'text-gray-500'
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                  
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-2 sm:gap-3"
                    >
                      <Avatar className={`h-7 w-7 sm:h-8 sm:w-8 ${officerOnline ? 'bg-green-600' : 'bg-blue-600'}`}>
                        <AvatarFallback className="text-white text-xs">
                          {officerOnline ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin text-gray-500" />
                        <span className="text-xs sm:text-sm text-gray-500">Typing...</span>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-3 sm:p-4 border-t bg-white">
                  <div className="flex gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleFileAttach}
                      className="shrink-0 h-9 w-9 sm:h-10 sm:w-10"
                    >
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type your message..."
                      className="flex-1 text-sm"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim()}
                      className="shrink-0 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-9 w-9 sm:h-10 sm:w-10"
                      size="icon"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-2 text-center">
                    {officerOnline
                      ? 'Connected to live officer support'
                      : 'AI-powered instant responses • Officer available soon'}
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LiveChatWidget;

