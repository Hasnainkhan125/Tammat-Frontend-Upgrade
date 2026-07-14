'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX,
  Sparkles, Loader2, X, MessageSquare
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useVoiceAgent } from '@/contexts/VoiceAgentContext'

// ============================================================================
// Types
// ============================================================================

export interface TammatVoiceAgentProps {
  className?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  size?: 'sm' | 'md' | 'lg'
  showTranscript?: boolean
  floatingButton?: boolean
}

// ============================================================================
// Component
// ============================================================================

export default function TammatVoiceAgent({
  className = '',
  position = 'bottom-right',
  size = 'md',
  showTranscript = true,
  floatingButton = true
}: TammatVoiceAgentProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const transcriptRef = useRef<HTMLDivElement>(null)

  // Use shared voice agent context
  const { 
    state, 
    conversation, 
    startVoiceSession, 
    endVoiceSession 
  } = useVoiceAgent()

  const isConnected = conversation?.status === 'connected'
  const isSpeaking = conversation?.isSpeaking || false

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [state.transcript])

  // Toggle mute
  const toggleMute = useCallback(async () => {
    if (conversation) {
      if (isMuted) {
        await conversation.setVolume({ volume: 1 })
      } else {
        await conversation.setVolume({ volume: 0 })
      }
      setIsMuted(!isMuted)
    }
  }, [conversation, isMuted])

  // Handle start/end session
  const handleToggleSession = useCallback(async () => {
    if (isConnected) {
      await endVoiceSession()
      setIsExpanded(false)
    } else {
      await startVoiceSession()
      setIsExpanded(true)
    }
  }, [isConnected, startVoiceSession, endVoiceSession])

  // Position classes
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  }

  // Size classes
  const sizeClasses = {
    sm: { button: 'w-12 h-12', icon: 'w-5 h-5' },
    md: { button: 'w-14 h-14', icon: 'w-6 h-6' },
    lg: { button: 'w-16 h-16', icon: 'w-7 h-7' }
  }

  // If not floating button mode, render inline
  if (!floatingButton) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Button
          onClick={handleToggleSession}
          disabled={state.isVoiceConnecting}
          variant={isConnected ? 'default' : 'outline'}
          size="sm"
          className={`rounded-full ${isConnected ? 'bg-green-500 hover:bg-green-600' : ''} ${isSpeaking ? 'animate-pulse' : ''}`}
        >
          {state.isVoiceConnecting ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : isConnected ? (
            <Mic className={`w-4 h-4 mr-2 ${isSpeaking ? 'animate-pulse' : ''}`} />
          ) : (
            <Phone className="w-4 h-4 mr-2" />
          )}
          {isConnected ? 'Listening...' : 'Voice Assistant'}
        </Button>
        
        {isConnected && (
          <Button
            onClick={toggleMute}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
        )}
      </div>
    )
  }

  // Floating button mode
  return (
    <div className={`fixed ${positionClasses[position]} z-50 flex flex-col items-end gap-3 ${className}`}>
      {/* Expanded Panel */}
      <AnimatePresence>
        {isExpanded  && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="bg-surface border border-border rounded-2xl shadow-2xl w-80 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary/10 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="font-semibold text-sm">Tammat Voice Assistant</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsExpanded(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Status */}
            <div className="px-4 py-2 border-b border-border flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span className="text-xs text-muted-foreground">
                {isSpeaking ? 'Speaking...' : isConnected ? 'Listening...' : 'Disconnected'}
              </span>
              {state.lastVoiceCommand && (
                <span className="text-xs text-primary ml-auto truncate max-w-32">
                  {state.lastVoiceCommand}
                </span>
              )}
            </div>

            {/* Transcript */}
            {showTranscript && state.transcript.length > 0 && (
              <div 
                ref={transcriptRef}
                className="max-h-48 overflow-y-auto p-4 space-y-2"
              >
                {state.transcript.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-2"
                  >
                    <MessageSquare className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">{msg}</p>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Current State Info */}
            {state.selectedService && (
              <div className="px-4 py-2 bg-primary/5 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Service:</span> {state.selectedService.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Step:</span> {state.activeTab.replace('-', ' ')}
                </p>
              </div>
            )}

            {/* Controls */}
            <div className="p-4 border-t border-border flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="flex-1"
              >
                {isMuted ? <VolumeX className="w-4 h-4 mr-2" /> : <Volume2 className="w-4 h-4 mr-2" />}
                {isMuted ? 'Unmute' : 'Mute'}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={endVoiceSession}
                className="flex-1"
              >
                <PhoneOff className="w-4 h-4 mr-2" />
                End
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Floating Button */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative"
      >
        <Button
          onClick={handleToggleSession}
          disabled={state.isVoiceConnecting}
          className={`${sizeClasses[size].button} rounded-full p-0 shadow-lg transition-all ${
            isConnected 
              ? 'bg-green-500 hover:bg-green-600' 
              : 'bg-primary hover:bg-primary/90'
          } ${isSpeaking ? 'ring-4 ring-primary/30 animate-pulse' : ''}`}
        >
          {state.isVoiceConnecting ? (
            <Loader2 className={`${sizeClasses[size].icon} text-primary-foreground animate-spin`} />
          ) : isConnected ? (
            <Mic className={`${sizeClasses[size].icon} text-white ${isSpeaking ? 'animate-pulse' : ''}`} />
          ) : (
            <Phone className={`${sizeClasses[size].icon} text-primary-foreground`} />
          )}
        </Button>

        {/* Status indicator dot */}
        {isConnected && !isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"
          />
        )}
      </motion.div>

      {/* Tooltip when not connected */}
      {/* {!isConnected && !state.isVoiceConnecting && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-card border border-border rounded-lg px-3 py-2 shadow-lg whitespace-nowrap"
        >
          <p className="text-sm font-medium">Talk to apply for services</p>
          <p className="text-xs text-muted-foreground">Click to start voice assistant</p>
        </motion.div>
      )} */}
    </div>
  )
}
