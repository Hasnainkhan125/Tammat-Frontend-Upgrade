import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { DocumentManager } from '@/components/DocumentManager/DocumentManager'
import { 
  CheckCircle, Clock, PhoneCall, Search, Send, Upload, User, 
  Sparkles, FileCheck, Camera, Mic, 
  ChevronRight, Brain, MessageSquare, Crown,
  Rocket, Minimize2, Globe, Users
} from 'lucide-react'
import type { Socket } from 'socket.io-client'
import { getSocket } from '@/lib/socket'
import { toast } from 'sonner'
import { getAllServices as getLocalServices } from '@/config/services'
import StripePaymentForm from '@/components/Payment/StripePaymentForm'
import { StreamingMessage, TypingIndicator } from '@/components/Chat/StreamingMessage'
import { aiStreaming } from '@/lib/aiStreaming'
import { useAuth } from '@/contexts/AuthContext'
import { useVoiceAgent } from '@/contexts/VoiceAgentContext'
import TammatVoiceAgent from '@/components/VoiceAgent/TammatVoiceAgent'
import { cn } from '@/lib/utils'
type StartApplicationDialogProps = {
  open: boolean
  onOpenChange: (v: boolean) => void
  queryParams:string| undefined
}

type ServiceItem = {
  id: string
  name: string
  description: string
  category?: string
  requirements?: string[]
  processingTime?: string
  process?: Array<{ step: number; title: string; description?: string; requiredDocuments?: string[] }>
}

type ChatMessage = {
  id: string
  type: 'user' | 'bot' | 'system' | 'amer' | 'file'
  content: string
  timestamp: Date
  metadata?: any
  isStreaming?: boolean
}

// Service images mapping for ultra-realistic photos
const serviceImages: Record<string, string> = {
  'spouse': 'https://images.unsplash.com/photo-1529634597503-139d3726fed5?q=80&w=600&auto=format&fit=crop',
  'family': 'https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=600&auto=format&fit=crop',
  'parent': 'https://images.unsplash.com/photo-1506863530036-1efeddceb993?q=80&w=600&auto=format&fit=crop',
  'investor': 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?q=80&w=600&auto=format&fit=crop',
  'partner': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600&auto=format&fit=crop',
  'employment': 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=600&auto=format&fit=crop',
  'golden': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=600&auto=format&fit=crop',
  'emirates': 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=600&auto=format&fit=crop',
  'medical': 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=600&auto=format&fit=crop',
  'business': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=600&auto=format&fit=crop',
  'renewal': 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=600&auto=format&fit=crop',
  'cancellation': 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=600&auto=format&fit=crop',
  'default': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=600&auto=format&fit=crop'
}

// Get service image based on service name
const getServiceImage = (serviceName: string): string => {
  const name = serviceName.toLowerCase()
  if (name.includes('spouse') || name.includes('wife') || name.includes('husband')) return serviceImages.spouse
  if (name.includes('family') || name.includes('child') || name.includes('son') || name.includes('daughter')) return serviceImages.family
  if (name.includes('parent') || name.includes('mother') || name.includes('father')) return serviceImages.parent
  if (name.includes('investor')) return serviceImages.investor
  if (name.includes('partner')) return serviceImages.partner
  if (name.includes('employ') || name.includes('work')) return serviceImages.employment
  if (name.includes('golden')) return serviceImages.golden
  if (name.includes('emirates') || name.includes('id')) return serviceImages.emirates
  if (name.includes('medical') || name.includes('health')) return serviceImages.medical
  if (name.includes('business') || name.includes('license') || name.includes('establishment')) return serviceImages.business
  if (name.includes('renew')) return serviceImages.renewal
  if (name.includes('cancel')) return serviceImages.cancellation
  return serviceImages.default
}

// Animation variants for smooth transitions
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05
    }
  }
}

const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 }
}





// ── Redirect shim ─────────────────────────────────────────────────────────────
// StartApplicationDialog is deprecated in favour of the full-screen ApplicationFlow
// at /apply. This shim makes every existing caller transparently redirect there.
import { useNavigate as _useNavigate } from 'react-router'
function StartApplicationDialog({ open, onOpenChange }: StartApplicationDialogProps) {
  const _nav = _useNavigate()
  useEffect(() => {
    if (open) {
      onOpenChange(false)
      _nav('/apply')
    }
  }, [open, onOpenChange, _nav])
  return null
}
export default StartApplicationDialog

// ── Legacy implementation (kept for reference, no longer rendered) ────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function LegacyStartApplicationDialog({ open, onOpenChange,queryParams="" }: StartApplicationDialogProps) {
  const { user } = useAuth()
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar' || i18n.language === 'ur'
  
  // Voice Agent Context - for global voice control (shared conversation)
  const { 
    state: voiceAgentState,
    conversation: voiceConversation,
    selectService: voiceSelectService,
    setActiveTab: voiceSetActiveTab,
    updateSponsorInfo: voiceUpdateSponsorInfo,
    updateDocumentProgress: voiceUpdateDocumentProgress,
    updateApplicationProgress: voiceUpdateApplicationProgress
  } = useVoiceAgent();
  
  const [step, setStep] = useState(0)
  const [services, setServices] = useState<ServiceItem[]>([])
  const [filtered, setFiltered] = useState<ServiceItem[]>([])
  const [query, setQuery] = useState(queryParams)
  const [selected, setSelected] = useState<ServiceItem | null>(null)
  const [chat, setChat] = useState<ChatMessage[]>([])
  const [aiChat, setAiChat] = useState<ChatMessage[]>([])
  const [amerChat, setAmerChat] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [isAIStreaming, setIsAIStreaming] = useState(false)
  const [input, setInput] = useState('')
  const [roomId, setRoomId] = useState<string | null>(null)
  const [applicationId, setApplicationId] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [chatMode, setChatMode] = useState<'amer' | 'ai' | 'voice'>('ai')
  const [docDefs, setDocDefs] = useState<Array<{ id: string; label: string; category: 'sponsor' | 'sponsored' | 'establishment' | 'other'; required: boolean }>>([])
  const [uploaded, setUploaded] = useState<Record<string, boolean>>({})
  const [stagedDocs, setStagedDocs] = useState<Record<string, File[]>>({})
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, {
    id: string
    file: File
    preview: string
    status: 'uploading' | 'uploaded' | 'error'
    progress: number
    extractedData?: any
    rejectionReason?: string
  }>>({})
  const [slaUntil, setSlaUntil] = useState<number | null>(null)
  const [slaCountdown, setSlaCountdown] = useState<string>('')

  // Enhanced features state
  const [activeTab, setActiveTab] = useState('smart-start')
  const [amerConnected, setAmerConnected] = useState(false)
  const [liveGuidance, setLiveGuidance] = useState<string[]>([])
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'requesting' | 'pending' | 'connected' | 'no_officers'>('idle')
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null)
  const [officerInfo, setOfficerInfo] = useState<{ name: string; id: string } | null>(null)
  
  // Sponsor information state
  const [sponsorInfo, setSponsorInfo] = useState({
    email: '',
    phone: '',
    iban: '',
    sponsorType: 'employee' as 'employee' | 'investor' | 'partner',
    location: 'inside' as 'inside' | 'outside',
    processingMethod: 'tammat' as 'tammat' | 'amer'
  })

  
  // Chat panel state
  const [isChatCollapsed, setIsChatCollapsed] = useState(typeof window !== 'undefined' && window.innerWidth < 760 ? true : false)
  
  // UAE Pass state
  const [uaePassStatus, setUaePassStatus] = useState<'idle' | 'requesting' | 'authorized' | 'error'>('idle')
  
  // File upload state
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Payment state
  const [paymentCompleted, setPaymentCompleted] = useState(false)
  const [applicationFee] = useState(1500) // AED 1,500 default fee


  // ============================================================================
  // Voice Agent Sync Effects (bidirectional sync between UI and voice agent)
  // ============================================================================

  // Sync FROM voice agent TO local state (voice controls UI)
  useEffect(() => {
    if (voiceAgentState.selectedService && !selected && services.length > 0) {
      // Voice selected a service, update local state
      const serviceFromContext = services.find(s => s.id === voiceAgentState.selectedService?.id);
      if (serviceFromContext) {
        setSelected(serviceFromContext);
      }
    }
  }, [voiceAgentState.selectedService, selected, services]);

  useEffect(() => {
    if (voiceAgentState.activeTab && voiceAgentState.activeTab !== activeTab) {
      // Voice navigated to a different tab
      setActiveTab(voiceAgentState.activeTab);
    }
  }, [voiceAgentState.activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Sync sponsor info FROM voice agent
    const voiceSponsor = voiceAgentState.sponsorInfo;
    if (voiceSponsor.email && voiceSponsor.email !== sponsorInfo.email) {
      setSponsorInfo(prev => ({ ...prev, email: voiceSponsor.email }));
    }
    if (voiceSponsor.phone && voiceSponsor.phone !== sponsorInfo.phone) {
      setSponsorInfo(prev => ({ ...prev, phone: voiceSponsor.phone }));
    }
  }, [voiceAgentState.sponsorInfo]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync FROM local state TO voice agent context
  useEffect(() => {
    if (selected) {
      voiceSelectService({
        id: selected.id,
        name: selected.name,
        category: selected.category,
        description: selected.description
      });
    }
  }, [selected, voiceSelectService]);

  useEffect(() => {
    voiceSetActiveTab(activeTab);
  }, [activeTab, voiceSetActiveTab]);

  useEffect(() => {
    voiceUpdateSponsorInfo({
      email: sponsorInfo.email,
      phone: sponsorInfo.phone,
      sponsorType: sponsorInfo.sponsorType
    });
  }, [sponsorInfo.email, sponsorInfo.phone, sponsorInfo.sponsorType, voiceUpdateSponsorInfo]);

  useEffect(() => {
    const uploadedCount = Object.values(uploadedDocuments).filter(d => d.status === 'uploaded').length;
    const requiredCount = docDefs.filter(d => d.required).length;
    const uploadedIds = Object.keys(uploadedDocuments).filter(id => uploadedDocuments[id]?.status === 'uploaded');
    voiceUpdateDocumentProgress(uploadedCount, requiredCount, uploadedIds);
  }, [uploadedDocuments, docDefs, voiceUpdateDocumentProgress]);

  useEffect(() => {
    voiceUpdateApplicationProgress(progress);
  }, [progress, voiceUpdateApplicationProgress]);

  // Use shared voice conversation from context (no duplicate useConversation)
  // The voiceConversation from context is used for voice interactions
  // Get current chat based on mode
  const getCurrentChat = () => {
    switch (chatMode) {
      case 'ai': return aiChat
      case 'amer': return amerChat
      default: return chat
    }
  }
  
  const [sponsorPhone, setSponsorPhone] = useState('')
  const [sponsorEid, setSponsorEid] = useState('')
  const [sponsoredFirstName, setSponsoredFirstName] = useState('')
  const [sponsoredLastName, setSponsoredLastName] = useState('')
  const [sponsoredRelationship, setSponsoredRelationship] = useState('spouse')
  const [sponsoredPassport, setSponsoredPassport] = useState('')
  const [sponsoredNationality, setSponsoredNationality] = useState('')
  const [sponsoredDob, setSponsoredDob] = useState('')
  
  const apiBase = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:5001'
  const apiUrl = `${(import.meta.env.VITE_API_BASE_URL as string)}/api/v1` || 'http://localhost:5001/api/v1'
  const STORAGE_KEY = 'tammat:start-app:v1'
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : ''
  const [socket, setSocket] = useState<Socket | null>(null)
  
  
  
    const setCurrentChat = (newChat: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
      const updateFn = typeof newChat === 'function' ? newChat : () => newChat
      switch (chatMode) {
        case 'ai': 
          setAiChat(updateFn)
          break
        case 'amer': 
          setAmerChat(updateFn)
          break
        default: 
          setChat(updateFn)
      }
    }
  
    // Auto-scroll to bottom when new messages arrive
    const scrollToBottom = () => {
      setTimeout(() => {
        const chatContainer = document.getElementById('chat-messages-container')
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight
        }
      }, 100)
    }
  
    // Handle chat mode changes
    useEffect(() => {
      // Scroll to bottom when switching modes
      scrollToBottom()
    }, [chatMode])
  

  useEffect(() => {
    if (!queryParams) return;
  
    const q =
      typeof queryParams === "string"
        ? queryParams
        :  "";
  
    setQuery(q);
  }, [queryParams]);


  useEffect(() => {
    if (!query) {
      setFiltered(services);
      return;
    }
  
    const filtered = services.filter(s =>
      `${s.name} ${s.description}`
        .toLowerCase()
        .includes(query.toLowerCase())
    );
  
    setFiltered(filtered);
  }, [query, services]);
  
  

  // Restore from localStorage
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
      if (!raw) return
      const saved = JSON.parse(raw)
      if (saved?.selected) setSelected(saved.selected)
      if (typeof saved?.step === 'number') setStep(saved.step)
      if (saved?.sponsorPhone) setSponsorPhone(saved.sponsorPhone)
      if (saved?.sponsorEid) setSponsorEid(saved.sponsorEid)
      if (saved?.sponsoredFirstName) setSponsoredFirstName(saved.sponsoredFirstName)
      if (saved?.sponsoredLastName) setSponsoredLastName(saved.sponsoredLastName)
      if (saved?.sponsoredRelationship) setSponsoredRelationship(saved.sponsoredRelationship)
      if (saved?.sponsoredPassport) setSponsoredPassport(saved.sponsoredPassport)
      if (saved?.sponsoredNationality) setSponsoredNationality(saved.sponsoredNationality)
      if (saved?.sponsoredDob) setSponsoredDob(saved.sponsoredDob)
      if (saved?.uploaded) setUploaded(saved.uploaded)
    } catch {}  
  }, [])

  // Persist to localStorage
  useEffect(() => {
    try {
      const payload = {
        version: 1,
        step,
        selected,
        sponsorPhone,
        sponsorEid,
        sponsoredFirstName,
        sponsoredLastName,
        sponsoredRelationship,
        sponsoredPassport,
        sponsoredNationality,
        sponsoredDob,
        uploaded,
      }
      if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch {}
  }, [step, selected, sponsorPhone, sponsorEid, sponsoredFirstName, sponsoredLastName, sponsoredRelationship, sponsoredPassport, sponsoredNationality, sponsoredDob, uploaded])

  // Load services from backend services.json with graceful fallback to local config
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch(`${apiUrl}/services/search?q=visa&limit=50`, { credentials: 'include' })
        const data = await res.json()
        const list: ServiceItem[] = data?.data?.services?.map((s: any) => ({
          id: s.id || s.serviceId || s.slug || s.name,
          name: s.serviceName || s.name,
          description: s.outsideDescription || s.description || '',
          category: s.categoryName || s.category || '',
          requirements: s.requirements || s.requiredDocuments || [],
          processingTime: s.processingTime || '',
          process: s.process || s.processSteps || []
        })) || []
        if (!cancelled) {
          const source = list.length ? list : getLocalServices().map((ls: any) => ({ id: ls.id, name: ls.name, description: ls.description, category: ls.category, requirements: (ls.requirements||[]).map((r: any) => r.id), process: ls.process || [] }))
          setServices(source)
          if(queryParams){
            const filtered = source.filter((s: any) => (s.name + ' ' + s.description).toLowerCase().includes(query.toLowerCase()))
            setFiltered(filtered)
            console.log(source.filter((s: any) => (s.name).toLowerCase().includes(query.toLowerCase())),"filtered",queryParams)
          }else{
            setFiltered(source)
          }
        }
      } catch {
        const fallback = getLocalServices().map((ls: any) => ({ id: ls.id, name: ls.name, description: ls.description, category: ls.category, requirements: (ls.requirements||[]).map((r: any) => r.id), process: ls.process || [] }))
        if (!cancelled) {
          setServices(fallback)
          if(queryParams){
            const filtered = fallback.filter((s: any) => (s.name + ' ' + s.description).toLowerCase().includes(query.toLowerCase()))
            setFiltered(filtered)
          }else{
            setFiltered(fallback)
          }
        }
      }
    }
    if (open) load()
    return () => { cancelled = true }
  }, [open])



  
  useEffect(() => {
    if (token) {
      const socketConnection = getSocket() as unknown as Socket
      console.log('StartApplicationDialog: Socket connection established', socketConnection.connected)
      setSocket(socketConnection)
    } else {
      setSocket(null)
    }
  }, [token])
  // Enhanced Socket events for officer connection flow
  useEffect(() => {
    if (!socket) return

    const onAmerConnected = (payload: any) => {
      console.log('Amer officer connected:', payload)
      setRoomId(payload?.chatId || payload?.roomId)
      setAmerConnected(true)
      setConnectionStatus('connected')
      setOfficerInfo({ 
        name: payload?.officerName || 'Amer Officer', 
        id: payload?.officerId || 'unknown' 
      })
      setPendingRequestId(null)
      
      // Add system message about connection
      const systemMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'system',
        content: `✅ Connected to ${payload?.officerName || 'Amer Officer'}. You can now chat live!`,
        timestamp: new Date()
      }
      setAmerChat(prev => [...prev, systemMessage])
      scrollToBottom()
      
      toast.success('Connected to Amer Officer', { 
        description: `${payload?.officerName || 'Officer'} has joined the conversation` 
      })
      
      if (chatMode === 'voice' && payload?.chatId) {
        try {
          socket.emit('voice_call_request', { roomId: payload.chatId, userId: 'user' })
            toast('Voice call requested')
        } catch {}
      }
    }

    const onRequestSent = (payload: any) => {
      console.log('Request sent to officers:', payload)
      setConnectionStatus('pending')
      setPendingRequestId(payload?.requestId)
      
      const systemMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'system',
        content: `🔄 Request sent to ${payload?.officersCount || 'available'} officer(s). Please wait for an officer to accept...`,
        timestamp: new Date()
      }
      setAmerChat(prev => [...prev, systemMessage])
      scrollToBottom()
      
      toast.info('Request Sent', { 
        description: `Waiting for an officer to accept your request...` 
      })

      // Start timeout for pending request (5 minutes)
      const timeout = setTimeout(() => {
        setConnectionStatus((current) => {
          if (current === 'pending') {
            setPendingRequestId(null)
            toast.warning('Request Timeout', {
              description: 'No officers responded. Please try again.'
            })
            return 'idle'
          }
          return current
        })
      }, 5 * 60 * 1000)

      return () => clearTimeout(timeout)
    }

    const onNoOfficersAvailable = (payload: any) => {
      console.log('No officers available:', payload)
      setConnectionStatus('no_officers')
      
      const systemMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'system',
        content: `❌ ${payload?.message || 'No officers are currently available. Please try again later.'}`,
        timestamp: new Date()
      }
      setAmerChat(prev => [...prev, systemMessage])
      scrollToBottom()
      
      toast.warning('No Officers Available', { 
        description: 'Please try again later when officers are online.' 
      })

      // Reset status after a delay
      setTimeout(() => {
        setConnectionStatus('idle')
      }, 3000)
    }

    const onConversationQueued = (payload: any) => {
      if (payload?.roomId) {
        setRoomId(payload.roomId)
        setChat(prev => ([...prev, { 
          id: Date.now().toString(), 
          type: 'system', 
          content: 'Invite sent. Waiting for Amer officer to join…', 
          timestamp: new Date() 
        }]))
        // Start SLA 2 minutes by default
        const until = Date.now() + 2*60*1000
        setSlaUntil(until)
      }
    }
    const onNewMessage = (msg: any) => {
      console.log('StartApplicationDialog received new message:', msg)
      console.log('Current chat mode:', chatMode)
      console.log('Current room ID:', roomId)
      console.log('Message chat ID:', msg.chatId, msg.metadata?.roomId)
      
      const isFile = msg.type === 'file'
      const displayType: ChatMessage['type'] = isFile ? 'file' : (msg.sender === 'user' ? 'user' : 'amer')
      const content = isFile ? (msg.metadata?.fileName || 'File shared') : msg.content
      
      const newMessage = { 
        id: msg.id || Date.now().toString(), 
        type: displayType, 
        content, 
        metadata: msg.metadata, 
        timestamp: new Date(msg.timestamp || Date.now()) 
      }

      // Always add Amer officer messages to amerChat regardless of current mode
      if (msg.sender === 'amer' || displayType === 'amer' || msg.type === 'amer') {
        console.log('Adding message to Amer chat:', newMessage)
        setAmerChat(prev => {
        // Avoid duplicates by id
        if (prev.some(p => p.id === msg.id)) return prev
          const newChat = [...prev, newMessage]
          console.log('Updated Amer chat:', newChat.length, 'messages')
          return newChat
        })
        
        // Auto-switch to Amer mode if we receive an officer message
        if (chatMode !== 'amer') {
          console.log('Auto-switching to Amer chat mode')
          setChatMode('amer')
        }
      } else {
        // Handle user messages or system messages
        console.log('Adding message to current chat mode:', chatMode)
        setCurrentChat(prev => {
          // Avoid duplicates by id
          if (prev.some(p => p.id === msg.id)) return prev
          return [...prev, newMessage]
        })
      }
      
      scrollToBottom()
    }

    const onMessageSent = (msg: any) => {
      console.log('Message sent confirmation:', msg)
      // Message was successfully sent, no need to add to chat as it's already there
    }

    const onMessageError = (error: any) => {
      console.error('Message error:', error)
      setCurrentChat(prev => [...prev, { 
        id: Date.now().toString(), 
        type: 'system', 
        content: `Error: ${error.error || 'Failed to send message'}`, 
        timestamp: new Date() 
      }])
      setIsTyping(false)
    }
    const onTyping = (p: any) => setIsTyping(!!p?.isTyping)
    const onFileDone = () => toast.success('File uploaded')

    const onChatHistoryLoaded = (payload: any) => {
      console.log('Chat history loaded:', payload)
      if (payload.history && payload.history.length > 0) {
        const historyMessages = payload.history.map((msg: any) => ({
          id: msg.id,
          type: msg.type as ChatMessage['type'],
          content: msg.content,
          timestamp: new Date(msg.timestamp),
          metadata: msg.metadata
        }))
        
        setAmerChat(prev => [...historyMessages, ...prev])
        scrollToBottom()
        
        toast.info('Chat History Loaded', {
          description: `${payload.history.length} previous messages restored`
        })
      }
    }

    const onChatEnded = (payload: any) => {
      console.log('Chat ended:', payload)
      setConnectionStatus('idle')
      setAmerConnected(false)
      setRoomId(null)
      setOfficerInfo(null)
      
      const systemMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'system',
        content: payload.message || `Chat ended: ${payload.reason}`,
        timestamp: new Date()
      }
      setAmerChat(prev => [...prev, systemMessage])
      scrollToBottom()
      
      if (payload.canReconnect) {
        toast.info('Chat Ended', { 
          description: 'You can request a new connection anytime. Chat history is saved.' 
        })
      } else {
        toast.warning('Chat Ended', { 
          description: payload.reason || 'Chat session has ended.' 
        })
      }
    }

    const onUaePassResponse = (response: any) => {
      console.log('UAE Pass response:', response)
      if (response.status === 'pending') {
        setUaePassStatus('requesting')
        toast.info('UAE Pass Access', {
          description: 'Opening UAE Pass authentication...'
        })
        // Open UAE Pass in new window
        if (response.authUrl) {
          window.open(response.authUrl, '_blank', 'width=800,height=600')
        }
      } else if (response.status === 'authorized') {
        setUaePassStatus('authorized')
        toast.success('UAE Pass Connected', {
          description: 'Successfully connected to UAE government services'
        })
      } else {
        setUaePassStatus('error')
        toast.error('UAE Pass Error', {
          description: response.message || 'Failed to connect to UAE Pass'
        })
      }
    }
    
    // Register event listeners
    socket.on('amer_connected', onAmerConnected)
    socket.on('request_sent', onRequestSent)
    socket.on('no_officers_available', onNoOfficersAvailable)
    socket.on('conversation_queued', onConversationQueued)
    socket.on('new_message', onNewMessage)
    socket.on('message_sent', onMessageSent)
    socket.on('message_error', onMessageError)
    socket.on('user_typing', onTyping)
    socket.on('file_upload_complete', onFileDone)
    socket.on('chat_history_loaded', onChatHistoryLoaded)
    socket.on('chat_ended', onChatEnded)
    socket.on('uae_pass_response', onUaePassResponse)
    
    return () => {
      socket.off('amer_connected', onAmerConnected)
      socket.off('request_sent', onRequestSent)
      socket.off('no_officers_available', onNoOfficersAvailable)
      socket.off('conversation_queued', onConversationQueued)
      socket.off('new_message', onNewMessage)
      socket.off('message_sent', onMessageSent)
      socket.off('message_error', onMessageError)
      socket.off('user_typing', onTyping)
      socket.off('file_upload_complete', onFileDone)
      socket.off('chat_history_loaded', onChatHistoryLoaded)
      socket.off('chat_ended', onChatEnded)
      socket.off('uae_pass_response', onUaePassResponse)
    }
  }, [socket, chatMode, scrollToBottom])

  // If user switches to voice and already has a room, request a call
  useEffect(() => {
    if (chatMode !== 'voice' || !roomId || !socket) return
    try {
      socket.emit('voice_call_request', { roomId, userId: 'user' })
      toast('Voice call requested')
    } catch {}
  }, [chatMode, roomId, socket])

  // SLA countdown timer
  useEffect(() => {
    if (!slaUntil) { setSlaCountdown(''); return }
    const tick = () => {
      const left = Math.max(0, slaUntil - Date.now())
      const m = Math.floor(left/60000)
      const s = Math.floor((left%60000)/1000)
      setSlaCountdown(`${m}:${s.toString().padStart(2,'0')}`)
      if (left <= 0) setSlaUntil(null)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [slaUntil])


  useEffect(() => {
    if (!open) return
    setProgress(5) // Step 1: Select Service
    // Initialize enhanced features
    // keep at 5 — step-specific progress is set in goToNextTab and payment
  }, [open])

  // Update document score based on uploads
  useEffect(() => {
    const totalRequired = docDefs.filter(d => d.required).length || 1
    const uploadedRequired = docDefs.filter(d => d.required && uploaded[d.id]).length
    const newScore = Math.round((uploadedRequired / totalRequired) * 100)
    
    // Update live guidance based on progress
    if (newScore === 100) {
      setLiveGuidance(['All documents uploaded successfully', 'AI validation complete', 'Ready for submission'])
    } else if (newScore > 50) {
      setLiveGuidance(['Good progress on documents', 'Consider uploading remaining required docs'])
    } else {
      setLiveGuidance(['Start by uploading required documents', 'Use drag & drop for quick upload'])
    }
  }, [uploaded, docDefs])

  // File upload handlers
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    if (!user) {
      toast.error('Please log in to upload files')
      return
    }

    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
      toast.error('Please log in to upload files')
      return
    }

    const files = Array.from(e.target.files || [])
    handleFiles(files)
  }

  const handleFiles = async (files: File[]) => {
    if (!user) return

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error(`${file.name} is too large. Maximum size is 10MB.`)
        continue
      }

      // Create file message for immediate display
      const fileMessage: ChatMessage = {
        id: Date.now().toString() + '_file',
        type: 'file',
        content: `📎 Uploading ${file.name}...`,
        timestamp: new Date(),
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          uploading: true
        }
      }

      // Add to appropriate chat
      if (chatMode === 'amer' && roomId) {
        setAmerChat(prev => [...prev, fileMessage])
      } else {
        setCurrentChat(prev => [...prev, fileMessage])
      }

      scrollToBottom()

      try {
        // Upload to server
        const formData = new FormData()
        formData.append('file', file)
        formData.append('roomId', roomId || 'general')

        const response = await fetch(`${apiBase}/api/v1/chat/upload?roomId=${roomId || 'general'}`, {
          method: 'POST',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: formData
        })

        if (response.ok) {
          const data = await response.json()
          const { fileUrl } = data.data || {}

          // Update message with successful upload
          const successMessage: ChatMessage = {
            ...fileMessage,
            content: `📎 ${file.name}`,
            metadata: {
              ...fileMessage.metadata,
              fileUrl,
              uploading: false
            }
          }

          if (chatMode === 'amer' && roomId) {
            setAmerChat(prev => prev.map(msg =>
              msg.id === fileMessage.id ? successMessage : msg
            ))

            // Send file message via WebSocket if connected to officer
            if (socket && roomId) {
              socket.emit('file_upload_complete', {
                chatId: roomId,
                userId: user.id,
                fileUrl,
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type
              })
            }
          } else {
            setCurrentChat(prev => prev.map(msg =>
              msg.id === fileMessage.id ? successMessage : msg
            ))
          }

          toast.success(`${file.name} uploaded successfully`)
        } else {
          throw new Error('Upload failed')
        }
      } catch (error) {
        console.error('File upload error:', error)

        // Update message with error
        const errorMessage: ChatMessage = {
          id: fileMessage.id,
          type: 'file',
          content: `❌ Failed to upload ${file.name}`,
          timestamp: fileMessage.timestamp,
          metadata: {
            ...fileMessage.metadata,
            uploading: false,
            error: true
          }
        }

        if (chatMode === 'amer' && roomId) {
          setAmerChat(prev => prev.map(msg =>
            msg.id === fileMessage.id ? errorMessage : msg
          ))
        } else {
          setCurrentChat(prev => prev.map(msg =>
            msg.id === fileMessage.id ? errorMessage : msg
          ))
        }

        toast.error(`Failed to upload ${file.name}`)
      }
    }
  }

  const sendChat = async () => {
    if (!input.trim()) return
    const userMsg: ChatMessage = { id: Date.now().toString(), type: 'user', content: input.trim(), timestamp: new Date() }
    const currentInput = input.trim()
    setInput('')
    
    try {
      if (chatMode === 'ai' || !socket) {
        // AI with streaming - use AI chat context
        setAiChat(prev => [...prev, userMsg])

        // Check if user explicitly wants to connect to an officer
        const wantsOfficer = currentInput.toLowerCase().match(/\b(connect|officer|amer|human|live\s*support|speak\s*to|talk\s*to)\b/)
        if (wantsOfficer && socket) {
          setChatMode('amer')
          requestAmer()
          return
        }

        setIsAIStreaming(true)
        scrollToBottom()
        
        // Create placeholder message for streaming
        const botMsgId = Date.now().toString()
        const placeholderMsg: ChatMessage = { 
          id: botMsgId, 
          type: 'bot', 
          content: '', 
          timestamp: new Date(),
          isStreaming: true
        }
        setAiChat(prev => [...prev, placeholderMsg])
        scrollToBottom()

        // Get AI context with limit (last 10 messages)
        const aiContext = aiChat.slice(-10)

        // Stream the AI response
        await aiStreaming.getChatResponse(
          currentInput,
          { step, service: selected, chatHistory: aiContext },
          {
            onChunk: (chunk) => {
              setAiChat(prev => prev.map(msg => 
                msg.id === botMsgId 
                  ? { ...msg, content: msg.content + chunk }
                  : msg
              ))
              scrollToBottom()
            },
            onComplete: (fullResponse) => {
              setAiChat(prev => prev.map(msg => 
                msg.id === botMsgId 
                  ? { ...msg, content: fullResponse, isStreaming: false }
                  : msg
              ))
              setIsAIStreaming(false)
              scrollToBottom()

              const lowerResp = fullResponse.toLowerCase()
              const suggestsOfficer = lowerResp.includes('officer') ||
                lowerResp.includes('amer') ||
                lowerResp.includes('live support') ||
                lowerResp.includes('human agent') ||
                lowerResp.includes('connect you')

              if (suggestsOfficer) {
                const actionMsg: ChatMessage = {
                  id: Date.now().toString() + '_action',
                  type: 'system',
                  content: '💡 Would you like to connect with an Amer officer for live assistance?',
                  timestamp: new Date(),
                  metadata: { action: 'connect_officer' }
                }
                setAiChat(prev => [...prev, actionMsg])
                scrollToBottom()
              }
            },
            onError: (error) => {
              console.error('AI streaming error:', error)
              setAiChat(prev => prev.map(msg => 
                msg.id === botMsgId 
                  ? { 
                      ...msg, 
                      content: 'I apologize, but I encountered an error. Please try again.', 
                      isStreaming: false 
                    }
                  : msg
              ))
              setIsAIStreaming(false)
              scrollToBottom()
            }
          }
        )
      } else {
        // Amer/Voice modes use WS chat - use Amer chat context
        setAmerChat(prev => [...prev, userMsg])
        setIsTyping(true)
        scrollToBottom()
        
        if (roomId && socket) {
          // Send message using the new chat_message format
          console.log('Sending message to officer:', currentInput, 'Room ID:', roomId)
          console.log('Socket connected:', socket.connected)
          
          socket.emit('chat_message', { 
            message: currentInput, 
            chatId: roomId, 
            type: 'text' 
          })
          
          // Add timeout for message confirmation
          const messageTimeout = setTimeout(() => {
            console.warn('Message not confirmed, adding error message')
            setAmerChat(prev => [...prev, {
              id: Date.now().toString(),
              type: 'system',
              content: '⚠️ Message may not have been delivered. Please check your connection.',
              timestamp: new Date()
            }])
            setIsTyping(false)
          }, 5000)
          
          // Clear timeout on successful send (handled in onMessageSent)
          socket.once('message_sent', () => {
            clearTimeout(messageTimeout)
            setIsTyping(false)
          })
          
        } else {
          // No active chat session, try to request officer
          console.log('No active chat session or socket, requesting officer...')
          setIsTyping(false)
          requestAmer()
        }
      }
    } catch (error) {
      console.error('Chat error:', error)
      setCurrentChat(prev => [...prev, { id: Date.now().toString(), type: 'system', content: 'Network error. Please try again.', timestamp: new Date() }])
      setIsAIStreaming(false)
      setIsTyping(false)
      scrollToBottom()
    }
  }


  // Build dynamic document definitions from selected service with enhanced categorization
  useEffect(() => {
    if (!selected) { setDocDefs([]); return }

    // Enhanced document mapping with proper categorization and context awareness
    const enhancedDocumentMap: Record<string, {
      label: string
      category: 'sponsor' | 'sponsored' | 'establishment' | 'other'
      required: boolean
      description: string
      accepted?: string[]
      sponsorTypes?: string[]
    }> = {
      // Sponsor Documents
      'emirates-id': { label: 'Emirates ID Copy', category: 'sponsor', required: true, description: 'Clear copy of sponsor\'s Emirates ID' },
      'sponsor-passport': { label: 'Sponsor Passport Copy', category: 'sponsor', required: true, description: 'Clear copy of sponsor\'s passport' },
      'sponsor-visa': { label: 'Sponsor Visa Copy', category: 'sponsor', required: true, description: 'Copy of sponsor\'s current residence visa' },
      'sponsor-salary': { label: 'Salary Certificate', category: 'sponsor', required: true, description: 'Latest salary certificate from employer', sponsorTypes: ['employee'] },
      'sponsor-bank': { label: 'Bank Statement', category: 'sponsor', required: false, description: '3-month bank statement showing salary deposits', sponsorTypes: ['employee'] },
      
      // Sponsored Person Documents
      'spouse-passport': { label: 'Spouse Passport', category: 'sponsored', required: true, description: 'Clear copy of spouse\'s passport (valid for 6+ months)' },
      'spouse-photos': { label: 'Spouse Photos', category: 'sponsored', required: true, description: 'Recent passport-sized photos with white background' },
      'child-passport': { label: 'Child Passport', category: 'sponsored', required: true, description: 'Clear copy of child\'s passport (valid for 6+ months)' },
      'child-photos': { label: 'Child Photos', category: 'sponsored', required: true, description: 'Recent passport-sized photos with white background' },
      'birth-certificate': { label: 'Birth Certificate', category: 'sponsored', required: true, description: 'Attested birth certificate from home country' },
      'medical-certificate': { label: 'Medical Certificate', category: 'sponsored', required: false, description: 'Medical fitness certificate if required' },
      
      // Establishment Documents (only for investors/partners)
      'trade-license': { label: 'Trade License', category: 'establishment', required: true, description: 'Valid trade license copy', sponsorTypes: ['investor', 'partner'] },
      'establishment-card': { label: 'Establishment Card', category: 'establishment', required: true, description: 'Immigration establishment card', sponsorTypes: ['investor', 'partner'] },
      'mol-card': { label: 'MOL Card', category: 'establishment', required: false, description: 'Ministry of Labor card', sponsorTypes: ['investor', 'partner'] },
      'company-contract': { label: 'Company Contract', category: 'establishment', required: false, description: 'Company contract or MOA', sponsorTypes: ['investor', 'partner'] },
      'tenancy-contract': { label: 'Tenancy Contract', category: 'establishment', required: false, description: 'Office tenancy contract', sponsorTypes: ['investor', 'partner'] },
      
      // Other Documents
      'marriage-certificate': { label: 'Marriage Certificate', category: 'other', required: true, description: 'Attested marriage certificate from home country and MOFA UAE' },
      'police-clearance': { label: 'Police Clearance Certificate', category: 'other', required: false, description: 'Police clearance from home country' },
      'educational-certificate': { label: 'Educational Certificates', category: 'other', required: false, description: 'Attested educational certificates' },
      'passport': { label: 'Passport Copy', category: 'sponsor', required: true, description: 'Clear copy of passport' },
      'residency-visa': { label: 'Residency Visa Copy', category: 'sponsor', required: true, description: 'Copy of current residence visa' },
      'salary-certificate': { label: 'Salary Certificate', category: 'sponsor', required: true, description: 'Latest salary certificate' },
      'mohre-approval': { label: 'MOHRE Approval', category: 'sponsor', required: true, description: 'MOHRE approval permit for employment visa', sponsorTypes: ['employee'] },
      'labor-contract': { label: 'Labor Contract', category: 'sponsor', required: true, description: 'Labor contract with minimum salary requirements', sponsorTypes: ['employee'] }
    }

    // Filter documents based on sponsor type
    const filterDocumentsBySponsorType = (documents: any[]) => {
      return documents.filter(doc => {
        const enhanced = enhancedDocumentMap[doc.id as keyof typeof enhancedDocumentMap]
        if (!enhanced) return true
        
        // If document has sponsorTypes restriction, check if current sponsor type is included
        if (enhanced.sponsorTypes && !enhanced.sponsorTypes.includes(sponsorInfo.sponsorType)) {
          return false
        }
        
        return true
      })
    }

    // Try to enrich from local config (has detailed requirement objects)
    const local = getLocalServices().find((ls: any) => ls.id === selected.id)
    if (local && Array.isArray(local.requirements)) {
      const filteredRequirements = filterDocumentsBySponsorType(local.requirements)
      const defs = filteredRequirements.map((r: any) => {
        const enhanced = enhancedDocumentMap[r.id as keyof typeof enhancedDocumentMap]
        return {
          id: r.id as string,
          label: enhanced?.label || r.name as string,
          category: (enhanced?.category || (r.category as any) || 'other') as 'sponsor' | 'sponsored' | 'establishment' | 'other',
          required: enhanced?.required !== undefined ? enhanced.required : !!r.required,
          description: enhanced?.description || '',
          accepted: enhanced?.accepted || ['Jpeg', 'png', 'pdf']
        }
      })
      setDocDefs(defs as any)
      return
    }

    // Fallback: derive from requirements string[] with enhanced mapping
    const fallbackDefs = filterDocumentsBySponsorType(selected.requirements||[])
      .map((rid: any) => {
        const enhanced = enhancedDocumentMap[rid as keyof typeof enhancedDocumentMap]
        return {
          id: String(rid),
          label: enhanced?.label || String(rid).replace(/[-_]/g, ' '),
          category: (enhanced?.category || 'other') as 'sponsor' | 'sponsored' | 'establishment' | 'other',
          required: false,
          description: enhanced?.description || '',
          accepted: enhanced?.accepted || ['image/*', 'application/pdf'],
          sponsorTypes: enhanced?.sponsorTypes
        }
      })
      .filter(doc => {
        console.log('doc required based on sponsor type: ', doc)
        // Filter based on sponsor type
        if (doc.sponsorTypes && !doc.sponsorTypes.includes(sponsorInfo.sponsorType)) {
          return false
        }
        if(doc.label.toLowerCase().startsWith('memorandum') && sponsorInfo.sponsorType !== 'investor') {
          return false
        }
        return true
      })
      .map(({ sponsorTypes, ...doc }) => doc) // Remove sponsorTypes from final object
    console.log(fallbackDefs,'fallbackDefs')
    setDocDefs(fallbackDefs)
  }, [selected, sponsorInfo.sponsorType])

  // Progress based on required docs uploaded
  useEffect(() => {
    if (!docDefs.length) return
    const requiredTotal = docDefs.filter(d => d.required).length || 1
    const requiredUploaded = docDefs.filter(d => d.required && uploaded[d.id]).length
    const docsPct = Math.round((requiredUploaded/requiredTotal)*40) // up to 40% from docs
    setProgress(prev => Math.max(prev, 40 + docsPct))
  }, [uploaded, docDefs])

  // Map service id -> backend enum applicationType
  const toApplicationType = (id?: string | number | null) => {
    if (!id) return ''
    
    // Convert to string for processing
    const idStr = String(id)
    
    // Map based on service IDs from services.json
    const serviceIdMap: Record<string, string> = {
      '1': 'son_daughter_residence_visa',
      '4': 'spouse_residence_visa', 
      '9': 'parents_residence_visa',
      '12': 'investor_partner_visa',
      '13': 'entry_permit_short_term_visit_parents_siblings_inlaws',
      '14': 'entry_permit_short_term_visit_spouse_kids',
      '15': 'entry_permit_long_term_visit_parents_siblings_inlaws',
      '243': 'entry_permit_long_term_visit_spouse_kids',
      '50': 'change_status_family',
      '51': 'change_status_employee',
      '52': 'change_status_visit_visa',
      '23': 'spouse_children_visa_stamping',
      '26': 'parents_visa_stamping',
      '22': 'employee_visa_stamping',
      '32': 'son_daughter_visa_stamping',
      '35': 'partner_investor_visa_stamping_2_years',
      '227': 'spouse_children_visa_renewal',
      '229': 'son_above_18_visa_renewal',
      '236': 'partner_investor_visa_renewal_2_years',
      '239': 'parents_visa_renewal_1_year',
      '38': 'family_residence_visa_cancellation',
      '40': 'employment_visa_cancellation',
      '42': 'partner_investor_visa_cancellation',
      '293': 'cancellation_entry_permit_before_entry_company',
      '36': 'cancellation_entry_permit_after_entry_family',
      '37': 'cancellation_entry_permit_after_entry_company',
      '17': 'new_born_residence_visa',
      '16': 'employment_visa',
      '54': 'golden_visa_commercial_investor',
      '55': 'golden_visa_director_manager',
      '56': 'golden_visa_doctors',
      '57': 'golden_visa_engineers',
      '58': 'golden_visa_new_born_baby',
      '59': 'golden_visa_phd_holder',
      '60': 'golden_visa_scientists',
      '61': 'golden_visa_family_members',
      '63': 'golden_visa_commercial_investor_2m_deposit',
      '64': 'golden_visa_outstanding_student_highschool',
      '65': 'golden_visa_outstanding_student_university',
      '66': 'golden_visa_creative_people_culture_art',
      '44': 'new_establishment_card_with_online',
      '45': 'new_establishment_card_without_online',
      '46': 'renewal_establishment_card_with_online',
      '47': 'renewal_establishment_card_without_online',
      '218': 'immigration_employee_list',
      '220': 'modification_immigration_card',
      '53': 'holding_visa_family',
      '67': 'data_modification_family',
      '68': 'data_modification_company',
      '219': 'new_pro_card',
      '221': 'renewal_pro_card',
      '222': 'modify_pro_card',
      '223': 'reconsideration_rejected_visa_application',
      '20': 'family_visit_visa_extend',
      '48': 'travel_report_family',
      '49': 'travel_report_company',
      '69': 'security_deposit'
    }
    
    // Check if it's a service ID from the JSON
    if (serviceIdMap[idStr]) {
      return serviceIdMap[idStr]
    }
    
    // Fallback for string-based IDs (legacy or custom)
    const map: Record<string, string> = {
      'family-visa-spouse': 'family_visa_spouse',
      'family-visa-children': 'family_visa_child',
      'family-visa-child': 'family_visa_child',
      'residence-visa': 'residence_visa',
      'entry-permit': 'entry_permit',
      'emirates-id': 'emirates_id',
      'visa-renewal': 'visa_renewal'
    }
    
    return map[idStr] || idStr.replace(/-/g, '_')
  }

  async function uploadAllStagedDocuments(appId: string) {
    const form = new FormData()
    Object.entries(stagedDocs).forEach(([docId, files]) => {
      const field = mapDocIdToField(docId)
      files.forEach(f => form.append(field, f))
    })
    if ([...form.keys()].length === 0) return true
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/visa/${appId}/documents`, { method: 'POST', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: form })
    return res.ok
  }


  const createApplicationAndUpload = async (): Promise<boolean> => {
    try {
      if (!token) { toast.error('Please sign in to continue'); return false }
      if (!selected) { toast.error('Select a service'); return false }
      
      // Ensure payment is completed
      if (!paymentCompleted) {
        toast.error('Please complete payment before submitting application')
        return false
      }
      
      // Ensure required docs satisfied
      if (!canContinueDocs) {
        toast.error('Please upload all required documents before continuing')
        return false
      }
      // Ensure all required documents across service.process are uploaded
      const allRequired = new Set<string>()
      serviceSteps.forEach(s => (s.requiredDocuments || []).forEach((id: string) => allRequired.add(id)))
      if (allRequired.size === 0) {
        docDefs.filter(d => d.required).forEach(d => allRequired.add(d.id))
      }
      const allOk = Array.from(allRequired).every(id => uploaded[id])
      if (!allOk) {
        toast.error('Please upload all required documents for this service')
        setActiveTab('docs-upload')
        return false
      }
      // Validate sponsored fields if required
      console.log('Creating application...', selected?.id, sponsoredFirstName, sponsoredLastName,selected)
      
      // Check if this is a family visa that requires sponsored person details
      const familyVisaIds = ['1', '4', '9', '13', '14', '15', '243', '17'] // IDs that require sponsored person details
      const needsSponsoredDetails = selected?.id && (
        familyVisaIds.includes(String(selected.id)) || 
        String(selected.id).includes('family') ||
        selected.name?.toLowerCase().includes('spouse') ||
        selected.name?.toLowerCase().includes('child') ||
        selected.name?.toLowerCase().includes('parent')
      )
      
      // if (needsSponsoredDetails && (!sponsoredFirstName || !sponsoredLastName)) {
      //   toast.error('Please complete sponsored person details')
      //   setActiveTab('ai-guidance')
      //   return false
      // }
      console.log('Creating application...', (selected))

      setProgress(95)
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/visa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          applicationType: toApplicationType(selected?.id),
          serviceData: {
            id: selected?.id,
            name: selected?.name,
            description: selected?.description,
            requirements: selected?.requirements || []
          },
          sponsor: { 
            phone: sponsorPhone, 
            emiratesId: sponsorEid,
            email: user?.email || '',
            firstName: user?.name?.split(' ')[0] || '',
            lastName: user?.name?.split(' ').slice(1).join(' ') || ''
          },
          requiredDocuments: docDefs.filter(d => d.required).map(d => d.id),
          sponsored: needsSponsoredDetails && sponsoredFirstName && sponsoredLastName ? {
            firstName: sponsoredFirstName,
            lastName: sponsoredLastName,
            relationship: sponsoredRelationship,
            passportNumber: sponsoredPassport,
            nationality: sponsoredNationality,
            dateOfBirth: sponsoredDob
          } : undefined
        })
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data?.message || 'Failed to create application')
        return false
      }
      const appId = data?.data?.application?._id
      setApplicationId(appId)
      // Upload staged docs
      const ok = await uploadAllStagedDocuments(appId)
      if (!ok) {
        toast.error('Some documents failed to upload')
        return false
      }
      setProgress(100)
      toast.success('Application created and documents uploaded')
      return true
    } catch (e) {
      console.error('Creating application error:', e)
      toast.error('Network error')
      return false
    }
  }


  const requestAmer = () => {
    if (!socket) {
      toast.error('Connection not available. Please refresh the page.')
      return
    }

    if (connectionStatus === 'pending') {
      toast.info('Request already pending', { 
        description: 'Please wait for an officer to respond.' 
      })
      return
    }

    if (connectionStatus === 'connected') {
      toast.info('Already connected', { 
        description: `You are connected to ${officerInfo?.name || 'an officer'}` 
      })
      return
    }

    console.log('Requesting Amer officer connection...')
    setConnectionStatus('requesting')
    
    // Send the connection request with user data
    if (!socket) {
      toast.error('Connection unavailable. Please refresh the page.')
      setConnectionStatus('idle')
      return
    }
    
    socket.emit('request_amer_connection', { 
      service: selected?.name || selected?.id || 'visa application',
      userId: user?.id || 'user',
      userData: {
        name: user?.name ? `${user.name}` : 'User',
        email: user?.email || 'user@example.com'
      },
      timestamp: new Date().toISOString()
    })
    
    // Add immediate feedback
    const systemMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'system',
      content: '🔄 Sending request to available Amer officers...',
      timestamp: new Date()
    }
    setAmerChat(prev => [...prev, systemMessage])
    scrollToBottom()

    // Reset requesting status after a moment
    setTimeout(() => {
      if (connectionStatus === 'requesting') {
        setConnectionStatus('idle')
      }
    }, 3000)
  }

  const cancelRequest = () => {
    if (pendingRequestId && socket) {
      socket.emit('cancel_request', { requestId: pendingRequestId })
      setConnectionStatus('idle')
      setPendingRequestId(null)
      
      const systemMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'system',
        content: '❌ Request cancelled.',
        timestamp: new Date()
      }
      setChat(prev => [...prev, systemMessage])
      
      toast.info('Request cancelled')
    }
  }

  const requestUaePass = () => {
    if (!socket) {
      toast.error('Connection not available. Please refresh the page.')
      return
    }

    if (uaePassStatus === 'requesting') {
      toast.info('UAE Pass request already in progress')
      return
    }

    console.log('Requesting UAE Pass access...')
    setUaePassStatus('requesting')
    
    socket.emit('request_uae_pass_access', {
      service: selected?.name || selected?.id || 'visa application',
      permissions: ['identity', 'documents', 'services'],
      roomId: roomId || 'general',
      timestamp: new Date().toISOString()
    })
    
    toast.info('UAE Pass Access', {
      description: 'Requesting access to UAE government services...'
    })
  }

  // New document handling functions for DocumentManager
  const handleDocumentUpload = async (docId: string, file: File): Promise<void> => {
    const documentId = crypto.randomUUID()
    
    // Create preview URL
    const preview = URL.createObjectURL(file)
    
    // Add to uploaded documents with uploading status
    setUploadedDocuments(prev => ({
      ...prev,
      [docId]: {
        id: documentId,
        file,
        preview,
        status: 'uploading',
        progress: 0
      }
    }))

    try {
    if (!applicationId) {
      // Stage locally until application is created
        setStagedDocs(prev => ({ ...prev, [docId]: [file] }))
        
        setUploadedDocuments(prev => ({
          ...prev,
          [docId]: {
            ...prev[docId],
            status: 'uploaded',
            progress: 100
          }
        }))
      setUploaded(u => ({ ...u, [docId]: true }))
        
        toast.success('Document staged successfully')
      return
    }

      // Upload to server
    const form = new FormData()
    const uploadKey = mapDocIdToField(docId)
      form.append(uploadKey, file)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadedDocuments(prev => {
          const current = prev[docId]
          if (current && current.progress < 90) {
            return {
              ...prev,
              [docId]: {
                ...current,
                progress: current.progress + 10
              }
            }
          }
          return prev
        })
      }, 200)

      const res = await fetch(`${apiBase}/api/v1/visa/${applicationId}/documents`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: form
      })

      clearInterval(progressInterval)

      if (res.ok) {
        const data = await res.json()
        
        setUploadedDocuments(prev => ({
          ...prev,
          [docId]: {
            ...prev[docId],
            status: 'uploaded',
            progress: 100,
            extractedData: data.data?.extractedData
          }
        }))
        setUploaded(u => ({ ...u, [docId]: true }))
        
        toast.success('Document uploaded successfully')
      } else {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData?.message || 'Upload failed')
      }
    } catch (error) {
      setUploadedDocuments(prev => ({
        ...prev,
        [docId]: {
          ...prev[docId],
          status: 'error',
          progress: 0
        }
      }))
      setUploaded(u => ({ ...u, [docId]: false }))
      
      throw error
    }
  }

  const handleDocumentDelete = (docId: string) => {
    // Remove from all states
    setUploadedDocuments(prev => {
      const newState = { ...prev }
      if (newState[docId]?.preview) {
        URL.revokeObjectURL(newState[docId].preview)
      }
      delete newState[docId]
      return newState
    })
    setUploaded(u => ({ ...u, [docId]: false }))
    setStagedDocs(prev => {
      const newState = { ...prev }
      delete newState[docId]
      return newState
    })
  }

  // Build stepper data from service.process (if available)
  const serviceSteps = useMemo(() => (selected?.process || []) as Array<{ step: number; title: string; description?: string; requiredDocuments?: string[] }>, [selected])

  // Map app step -> corresponding service step index (heuristic)
  const currentServiceStepIndex = useMemo(() => {
    if (!serviceSteps.length) return -1
    // If in docs step, highlight the first process step that has requiredDocuments
    if (step === 2) {
      const idx = serviceSteps.findIndex(s => (s.requiredDocuments || []).length > 0)
      return idx >= 0 ? idx : 0
    }
    // If in review/payment, highlight last
    if (step === 3) return serviceSteps.length - 1
    // Otherwise, highlight first
    return 0
  }, [serviceSteps, step])

  // Determine if current step's requiredDocuments are satisfied
  const requiredDocsForCurrentServiceStep = useMemo(() => {
    if (currentServiceStepIndex < 0) return [] as string[]
    return (serviceSteps[currentServiceStepIndex]?.requiredDocuments || []) as string[]
  }, [serviceSteps, currentServiceStepIndex])

  const canContinueDocs = useMemo(() => {
    if (step !== 2) return true
    if (!requiredDocsForCurrentServiceStep.length) return true
    return requiredDocsForCurrentServiceStep.every(id => uploaded[id])
  }, [step, requiredDocsForCurrentServiceStep, uploaded])

  // Navigation functions — 3-step flow: Service → Info+Docs → Review/Pay
  const TAB_ORDER = ['smart-start', 'sponsor-info', 'review-submit'] as const

  const goToNextTab = () => {
    const currentIndex = TAB_ORDER.indexOf(activeTab as any)
    if (currentIndex < TAB_ORDER.length - 1) {
      const next = TAB_ORDER[currentIndex + 1]
      // Update deterministic progress when advancing
      if (next === 'sponsor-info') setProgress(20)
      if (next === 'review-submit') setProgress(80)
      setActiveTab(next)
    }
  }

  const goToPreviousTab = () => {
    const currentIndex = TAB_ORDER.indexOf(activeTab as any)
    if (currentIndex > 0) {
      setActiveTab(TAB_ORDER[currentIndex - 1])
    }
  }

  const canNavigateToNext = () => {
    switch (activeTab) {
      case 'smart-start':
        return !!selected?.id
      case 'sponsor-info':
        // Require contact info; docs upload is optional until submit
        return !!sponsorInfo.email && !!sponsorInfo.phone
      case 'review-submit':
        return false
      default:
        return false
    }
  }

  // Map requirement id to server multer field key
  function mapDocIdToField(id: string): string {
    const map: Record<string, string> = {
      'emirates-id': 'sponsor_emirates_id',
      'residency-visa': 'sponsor_visa',
      'passport': 'sponsor_passport',
      'salary-certificate': 'sponsor_salary_certificate',
      'trade-license': 'sponsor_trade_license',
      'establishment-card': 'sponsor_establishment_card',
      'spouse-passport': 'sponsored_passport_front',
      'spouse-photos': 'sponsored_photo',
      'marriage-certificate': 'marriage_certificate',
      'birth-certificate': 'birth_certificate',
      'child-passport': 'sponsored_passport_front',
      'parents-passports': 'sponsored_passport_front',
      'parents-photos': 'sponsored_photo',
    }
    return map[id] || id
  }


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`max-w-[90vw] h-[94dvh] max-h-[94dvh] flex flex-col overflow-hidden p-0 bg-gradient-to-b from-background to-background/97 border border-primary/20 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.35)] rounded-3xl ${isRTL ? 'font-tajawal' : 'font-poppins'}`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >


        <div className="flex-1 min-h-0 flex flex-col p-2 sm:p-4 lg:p-6 overflow-hidden">
          {/* Advanced Multi-Tab Interface - Mobile Optimized */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col min-h-0 flex-1">
            {/* 3-step progress stepper — premium gradient nodes + animated connectors */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-4 sm:mb-6 shrink-0"
            >
              {/* Hidden tabs list — tabs are driven by stepper only */}
              <TabsList className="hidden">
                <TabsTrigger value="smart-start" />
                <TabsTrigger value="sponsor-info" />
                <TabsTrigger value="review-submit" />
              </TabsList>

              {/* Visual stepper */}
              {(() => {
                const steps = [
                  { id: 'smart-start',   label: t('startApplication.tabs.service'),  icon: Sparkles,  step: 1 },
                  { id: 'sponsor-info',  label: t('startApplication.tabs.sponsor'),   icon: User,      step: 2 },
                  { id: 'review-submit', label: t('startApplication.tabs.submit'),    icon: Rocket,    step: 3 },
                ]
                const currentIdx = steps.findIndex(s => s.id === activeTab)
                return (
                  <div className={`flex items-center gap-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    {steps.map((s, idx) => {
                      const Icon = s.icon
                      const isActive   = s.id === activeTab
                      const isComplete = idx < currentIdx
                      const isDisabled = idx > currentIdx && !isComplete
                      return (
                        <div key={s.id} className={`flex items-center ${idx < steps.length - 1 ? 'flex-1' : ''}`}>
                          <button
                            onClick={() => !isDisabled && setActiveTab(s.id)}
                            disabled={isDisabled}
                            className={`group flex flex-col items-center gap-1.5 min-w-[64px] transition-all duration-200 disabled:cursor-not-allowed ${isRTL ? 'font-tajawal' : 'font-poppins'}`}
                          >
                            <div className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                              isComplete ? 'bg-gradient-to-br from-primary to-primary/80 shadow-[0_6px_16px_-4px_hsl(var(--primary)/0.6)]'
                              : isActive  ? 'bg-gradient-to-br from-primary to-primary/80 shadow-[0_0_0_5px_hsl(var(--primary)/0.15),0_6px_16px_-4px_hsl(var(--primary)/0.5)]'
                              : 'bg-muted/50 border-2 border-border text-muted-foreground group-hover:border-primary/30'
                            }`}>
                              {isActive && (
                                <motion.span
                                  className="absolute inset-0 rounded-full bg-primary/40"
                                  animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
                                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                                />
                              )}
                              {isComplete
                                ? <CheckCircle className="relative w-4 h-4 text-primary-foreground" strokeWidth={2.5} />
                                : <Icon className={`relative w-4 h-4 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                              }
                            </div>
                            <span className={`text-[11px] font-semibold leading-none transition-colors duration-200 ${
                              isActive ? 'text-foreground' : isComplete ? 'text-primary' : 'text-muted-foreground'
                            }`}>
                              {s.label}
                            </span>
                          </button>
                          {idx < steps.length - 1 && (
                            <div className="relative flex-1 h-[3px] mx-2 rounded-full bg-border overflow-hidden">
                              <motion.div
                                initial={false}
                                animate={{ width: idx < currentIdx ? '100%' : '0%' }}
                                transition={{ duration: 0.4, ease: 'easeOut' }}
                                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-primary/70"
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </motion.div>

            <div className={`flex-1 min-h-0 flex flex-col lg:grid gap-2 lg:gap-4 xl:gap-6 transition-all duration-300 ${
              isChatCollapsed ? 'lg:grid-cols-1' : 'lg:grid-cols-12'
            }`}>
              {/* Main Content Area */}
              <div className={`flex flex-col min-h-0 flex-1 transition-all duration-300 ${
                isChatCollapsed ? 'col-span-full' : 'lg:col-span-8'
              }`}>
                
                {/* Smart Start Tab */}
                <TabsContent value="smart-start" className="mt-0 flex flex-col min-h-0 flex-1">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key="smart-start"
                      variants={fadeInUp}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="flex flex-col min-h-0 flex-1"
                    >
                      {/* AI-Powered Service Selection */}
                      <Card className="relative bg-gradient-to-b from-background to-background/95 border-primary/15 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.5)] rounded-3xl overflow-hidden flex flex-col min-h-0 flex-1">
                        {/* Decorative ambient glow */}
                        <div className="pointer-events-none absolute -top-16 -left-16 h-48 w-48 rounded-full bg-primary/10 blur-[80px]" />

                        <CardContent className="relative flex flex-col min-h-0 flex-1 space-y-4 sm:space-y-5 p-3 sm:p-4 lg:p-6 pt-5 overflow-hidden">
                          {/* Search — premium pill with gradient icon badge */}
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="relative group"
                          >
                            <div
                              className="absolute -inset-0.5 rounded-2xl opacity-0 group-focus-within:opacity-100 blur-md transition-opacity duration-300 bg-gradient-to-r from-primary to-primary/70"
                            />


<div
  className="
    relative flex items-center gap-3
    rounded-2xl
    border border-border/60
    bg-background/70
    px-3 py-2

    ring-0
    outline-none
    shadow-none

    focus:ring-0
    focus:outline-none
    focus:shadow-none

    focus-within:ring-0
    focus-within:outline-none
    focus-within:shadow-none

    [&_*]:ring-0
    [&_*]:shadow-none
    [&_*]:outline-none
  "
>
  {/* Search Icon */}
  <div
    className={`
      flex h-10 w-10 shrink-0 items-center justify-center
      rounded-xl
      ${isRTL ? "order-2" : ""}
    `}
  >
    <Search
      className="h-5 w-5 text-primary"
      strokeWidth={2.2}
    />
  </div>

  {/* Input */}
  <Input
    value={query}
    onChange={(e) => setQuery(e.target.value)}
    placeholder={t("startApplication.serviceSelection.searchPlaceholder")}
    className={`
      flex-1
      h-10
      bg-transparent
      border-0
      px-0

      text-sm
      font-medium
      text-foreground
      placeholder:text-muted-foreground

      shadow-none
      ring-0
      outline-none

      focus:border-0
      focus:ring-0
      focus:ring-transparent
      focus:ring-offset-0
      focus:shadow-none
      focus:outline-none

      focus-visible:border-0
      focus-visible:ring-0
      focus-visible:ring-transparent
      focus-visible:ring-offset-0
      focus-visible:shadow-none
      focus-visible:outline-none

      active:ring-0
      active:shadow-none

      disabled:ring-0
      disabled:shadow-none

      ${isRTL ? "text-right font-tajawal" : "font-poppins"}
    `}
  />
</div>
                          </motion.div>
                          
                          {/* Service Grid */}
                          <motion.div
                            variants={staggerContainer}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-3.5 flex-1 overflow-y-auto pr-1 min-h-0"
                            style={{ scrollbarGutter: 'stable' }}
                          >
                            {filtered.map((service, index) => {
                              const isSelected = selected?.id === service.id
                              return (
                                <motion.div
                                  key={service.id}
                                  variants={staggerItem}
                                  transition={{ delay: index * 0.03 }}
                                  whileHover={{ y: -3, transition: { duration: 0.15 } }}
                                  whileTap={{ scale: 0.98 }}
                                  animate={isSelected ? { scale: 1.015 } : { scale: 1 }}
                                >
                                  <div
                                    onClick={() => {
                                      if (isSelected) {
                                        setSelected(null)
                                      } else {
                                        setSelected(service)
                                        setProgress(20)
                                        setTimeout(() => setActiveTab('sponsor-info'), 300)
                                      }
                                    }}
                                    className={`
                                      relative cursor-pointer rounded-2xl overflow-hidden
                                      bg-card border transition-all duration-300
                                      ${isSelected
                                        ? 'border-primary/60 shadow-[0_0_0_1px_hsl(var(--primary)/0.35),0_12px_32px_-10px_hsl(var(--primary)/0.35)]'
                                        : 'border-border/60 hover:border-primary/30 hover:shadow-[0_10px_28px_-14px_rgba(0,0,0,0.25)]'
                                      }
                                    `}
                                  >
                                    {/* Selected primary tint + glow */}
                                    {isSelected && (
                                      <>
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.07] to-transparent pointer-events-none" />
                                        <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-primary/20 blur-2xl" />
                                      </>
                                    )}

                                    {/* Left accent bar */}
                                    <motion.div
                                      initial={false}
                                      animate={{ scaleY: isSelected ? 1 : 0}}
                                      transition={{ duration: 0.25 }}
                                      className="absolute left-0 top-4 bottom-4 w-[3px] bg-gradient-to-b from-primary to-primary/60 rounded-full origin-center"
                                    />

                                    <div className="relative p-5">
                                      {/* ── Section 1: Title row ── */}
                                      <div className={`flex items-start justify-between gap-3 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                        <h3 className={`text-[14px] font-semibold leading-tight text-foreground line-clamp-1 ${isRTL ? 'font-tajawal text-right' : 'font-poppins'}`}>
                                          {service.name}
                                        </h3>

                                        <AnimatePresence mode="wait">
                                          {isSelected ? (
                                            <motion.div
                                              key="check"
                                              initial={{ scale: 0.4, opacity: 0, rotate: -20 }}
                                              animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                                              className="shrink-0 w-[24px] h-[24px] rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-[0_4px_12px_-3px_hsl(var(--primary)/0.6)]"
                                            >
                                              <CheckCircle className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={2.5} />
                                            </motion.div>
                                          ) : service.category ? (
                                            <motion.div key="badge" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                              <Badge
                                                variant="secondary"
                                                className="text-[10px] font-semibold px-2.5 py-0.5 shrink-0 bg-primary/10 text-primary border border-primary/20 rounded-full"
                                              >
                                                {service.category}
                                              </Badge>
                                            </motion.div>
                                          ) : null}
                                        </AnimatePresence>
                                      </div>

                                      {/* ── Section 2: Description ── */}
                                      <p className={`text-[12px] leading-[1.6] text-muted-foreground line-clamp-1 mb-3 ${isRTL ? 'font-tajawal text-right' : 'font-poppins'}`}>
                                        {service.description}
                                      </p>

                                      {/* ── Section 3: Metadata row ── */}
                                      <div className={`flex items-center gap-4 pt-3 border-t border-border/50 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                        <div className={`flex items-center gap-1.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/10">
                                            <Clock className="w-3 h-3 text-primary" strokeWidth={2.25} />
                                          </span>
                                          <span className={`text-[11px] font-medium text-foreground/70 truncate max-w-[90px] ${isRTL ? 'font-tajawal' : 'font-poppins'}`}>
                                            {service.processingTime || t('startApplication.serviceSelection.fastProcessing')}
                                          </span>
                                        </div>
                                        <div className={`flex items-center gap-1.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-muted">
                                            <FileCheck className="w-3 h-3 text-muted-foreground" strokeWidth={2.25} />
                                          </span>
                                          <span className={`text-[11px] text-muted-foreground ${isRTL ? 'font-tajawal' : 'font-poppins'}`}>
                                            {service.requirements?.length || 0} {t('startApplication.serviceSelection.docsRequired')}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              )
                            })}
                          </motion.div>
                          
                          {/* Auto-advance on selection — no footer needed */}
                        </CardContent>
                      </Card>
                    </motion.div>
                  </AnimatePresence>
                </TabsContent>

                {/* Sponsor Information Tab */}
                <TabsContent value="sponsor-info" className="mt-0 flex flex-col min-h-0 flex-1">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key="sponsor-info"
                      variants={fadeInUp}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="flex flex-col min-h-0 flex-1"
                    >
                      <Card className={`relative bg-gradient-to-b from-background to-background/95 border-primary/15 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.5)] flex flex-col min-h-0 flex-1 rounded-3xl overflow-hidden ${isRTL ? 'font-tajawal' : 'font-poppins'}`}>
                        {/* Decorative ambient glow */}
                        <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/10 blur-[80px]" />

                        <CardHeader className="pb-3 shrink-0 relative">
                          <CardTitle className={`flex items-center gap-3 text-base font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#a47112] to-[#c98f1f] shadow-[0_6px_16px_-4px_rgba(164,113,18,0.5)]">
                              <User className="w-4 h-4 text-white" strokeWidth={2.25} />
                            </span>
                            <span className="text-[#a47112]">{t('startApplication.sponsorInfo.title')}</span>
                            <Badge className={`rounded-full bg-[#a47112]/10 text-[#a47112] border border-[#a47112]/25 text-[10px] font-semibold uppercase tracking-wide px-2.5 py-0.5 ${isRTL ? 'mr-auto' : 'ml-auto'}`}>
                              {t('startApplication.sponsorInfo.required')}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 relative" style={{ scrollbarGutter: 'stable' }}>
                          <motion.div 
                            variants={staggerContainer}
                            initial="initial"
                            animate="animate"
                            className="space-y-6"
                          >
                            {/* Sponsor Type — premium segmented control */}
                            <motion.div variants={staggerItem} className="space-y-2.5">
                              <Label className={`text-sm font-semibold text-foreground/90 ${isRTL ? 'text-right block' : ''}`}>
                                {t('startApplication.sponsorInfo.sponsorType')}
                              </Label>
                              <div className={`relative inline-flex w-full rounded-2xl border border-border/60 bg-muted/30 backdrop-blur-sm p-1.5 gap-1 shadow-inner ${isRTL ? 'flex-row-reverse' : ''}`}>
                                {([
                                  { value: 'employee', label: t('startApplication.sponsorInfo.employee') },
                                  { value: 'investor', label: t('startApplication.sponsorInfo.investor') },
                                  { value: 'partner',  label: t('startApplication.sponsorInfo.partner') },
                                ] as const).map((type) => {
                                  const isActive = sponsorInfo.sponsorType === type.value
                                  return (
                                    <button
                                      key={type.value}
                                      type="button"
                                      onClick={() => setSponsorInfo(prev => ({ ...prev, sponsorType: type.value }))}
                                      className={`relative flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                                        isActive
                                          ? 'text-black'
                                          : 'text-muted-foreground hover:text-foreground'
                                      }`}
                                    >
                                      {isActive && (
                                        <motion.span
                                          layoutId="sponsorTypePill"
                                          className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-[0_6px_16px_-4px_rgba(0,0,0,0.25)]"
                                          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                                        />
                                      )}
                                      <span className="relative">{type.label}</span>
                                    </button>
                                  )
                                })}
                              </div>
                              <AnimatePresence mode="wait">
                                <motion.p
                                  key={sponsorInfo.sponsorType}
                                  initial={{ opacity: 0, y: -4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 4 }}
                                  transition={{ duration: 0.2 }}
                                  className={`text-xs text-muted-foreground leading-relaxed ${isRTL ? 'text-right' : ''}`}
                                >
                                  {sponsorInfo.sponsorType === 'employee' && t('startApplication.sponsorInfo.employeeDesc')}
                                  {sponsorInfo.sponsorType === 'investor' && t('startApplication.sponsorInfo.investorDesc')}
                                  {sponsorInfo.sponsorType === 'partner'  && t('startApplication.sponsorInfo.partnerDesc')}
                                </motion.p>
                              </AnimatePresence>
                            </motion.div>

                            {/* Location — premium segmented control */}
                            <motion.div variants={staggerItem} className="space-y-2.5">
                              <Label className={`text-sm font-semibold text-foreground/90 ${isRTL ? 'text-right block' : ''}`}>
                                {t('startApplication.sponsorInfo.location')}
                              </Label>
                              <div className={`relative inline-flex w-full rounded-2xl border border-border/60 bg-muted/30 backdrop-blur-sm p-1.5 gap-1 shadow-inner ${isRTL ? 'flex-row-reverse' : ''}`}>
                                {([
                                  { value: 'inside',  label: t('startApplication.sponsorInfo.insideUae') },
                                  { value: 'outside', label: t('startApplication.sponsorInfo.outsideUae') },
                                ] as const).map((loc) => {
                                  const isActive = sponsorInfo.location === loc.value
                                  return (
                                    <button
                                      key={loc.value}
                                      type="button"
                                      onClick={() => setSponsorInfo(prev => ({ ...prev, location: loc.value }))}
                                      className={`relative flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                                        isActive
                                          ? 'text-black'
                                          : 'text-muted-foreground hover:text-foreground'
                                      }`}
                                    >
                                      {isActive && (
                                        <motion.span
                                          layoutId="sponsorLocationPill"
                                          className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-[0_6px_16px_-4px_rgba(0,0,0,0.25)]"
                                          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                                        />
                                      )}
                                      <span className="relative">{loc.label}</span>
                                    </button>
                                  )
                                })}
                              </div>
                            </motion.div>

                            {/* Processing Method Selection — premium pricing cards */}
                            <motion.div variants={staggerItem} className="space-y-3">
                              <Label className={`text-sm font-semibold text-foreground/90 ${isRTL ? 'text-right block' : ''}`}>
                                {t('startApplication.sponsorInfo.processingMethod')}
                              </Label>
                              <div className="space-y-3">
                                {[
                                  { 
                                    value: 'tammat', 
                                    label: t('startApplication.sponsorInfo.tammatProcessing'), 
                                    description: t('startApplication.sponsorInfo.tammatDesc'),
                                    price: 'AED 1,089',
                                    benefits: [
                                      t('startApplication.sponsorInfo.lowerFees'), 
                                      t('startApplication.sponsorInfo.fasterResponse'), 
                                      t('startApplication.sponsorInfo.uaePassIntegration'), 
                                      t('startApplication.sponsorInfo.support247')
                                    ],
                                    recommended: true
                                  },
                                  { 
                                    value: 'amer', 
                                    label: t('startApplication.sponsorInfo.amerProcessing'), 
                                    description: t('startApplication.sponsorInfo.amerDesc'),
                                    price: 'AED 1,500',
                                    benefits: [
                                      t('startApplication.sponsorInfo.govDirect'), 
                                      t('startApplication.sponsorInfo.officialChannels'), 
                                      t('startApplication.sponsorInfo.standardProcessing')
                                    ],
                                    recommended: false
                                  }
                                ].map((method) => {
                                  const isActive = sponsorInfo.processingMethod === method.value
                                  return (
                                  <motion.div key={method.value} whileHover={{ scale: 1.008, y: -2 }} whileTap={{ scale: 0.99 }}>
                                    <Card
                                      className={`relative cursor-pointer transition-all duration-300 rounded-2xl overflow-hidden ${
                                        isActive
                                          ? 'border-primary/60 bg-gradient-to-br from-primary/[0.06] to-transparent shadow-[0_0_0_1px_hsl(var(--primary)/0.35),0_14px_36px_-14px_hsl(var(--primary)/0.4)]'
                                          : 'border-border/60 hover:border-primary/30 hover:shadow-[0_10px_28px_-16px_rgba(0,0,0,0.25)]'
                                      }`}
                                      onClick={() => setSponsorInfo(prev => ({ ...prev, processingMethod: method.value as any }))}
                                    >
                                      {isActive && (
                                        <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-primary/20 blur-2xl" />
                                      )}
                                      <CardContent className="relative p-4 md:p-5">
                                        <div className="space-y-3.5">
                                          <div className={`md:flex items-start justify-between gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                            <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                                              <div className={`shrink-0 mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                                                isActive ? 'border-primary bg-primary' : 'border-border'
                                              }`}>
                                                {isActive && <div className="h-2 w-2 rounded-full bg-primary-foreground" />}
                                              </div>
                                              <div className="space-y-1">
                                                <div className={`flex items-center gap-2 flex-wrap ${isRTL ? 'flex-row-reverse' : ''}`}>
                                                  <h3 className="font-semibold text-sm text-foreground">{method.label}</h3>
                                                  {method.recommended && (
                                                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 text-[10px] font-semibold rounded-full px-2.5">
                                                      {t('startApplication.sponsorInfo.recommended')}
                                                    </Badge>
                                                  )}
                                                </div>
                                                <p className="text-xs text-foreground/60 leading-relaxed">{method.description}</p>
                                              </div>
                                            </div>
                                            <div className={`shrink-0 mt-2 md:mt-0 ${isRTL ? 'text-left' : 'text-right'}`}>
                                              <div className="text-lg font-bold text-primary tracking-tight">{method.price}</div>
                                              <div className="text-[10px] text-foreground/50 font-medium">{t('startApplication.sponsorInfo.processingFee')}</div>
                                            </div>
                                          </div>
                                          <div className={`space-y-1.5 pl-8 ${isRTL ? 'pl-0 pr-8 text-right' : ''}`}>
                                            <p className="text-xs font-semibold text-foreground/80">{t('startApplication.sponsorInfo.benefits')}:</p>
                                            <ul className="text-xs text-foreground/60 space-y-1.5">
                                              {method.benefits.map((benefit, idx) => (
                                                <li key={idx} className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                                  <CheckCircle className="w-3 h-3 text-primary shrink-0" strokeWidth={2.5} />
                                                  {benefit}
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </motion.div>
                                  )
                                })}
                              </div>
                            </motion.div>

                            {/* Contact Information */}
                            <motion.div variants={staggerItem} className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="sponsor-email" className={`text-sm font-semibold text-foreground/90 ${isRTL ? 'text-right block' : ''}`}>
                                    {t('startApplication.sponsorInfo.emailAddress')} <span className="text-red-500">*</span>
                                  </Label>
                                  <Input
                                    id="sponsor-email"
                                    type="email"
                                    placeholder="sponsor@example.com"
                                    value={sponsorInfo.email}
                                    onChange={(e) => setSponsorInfo(prev => ({ ...prev, email: e.target.value }))}
                                    className={`bg-muted/30 border-border/60 focus:border-primary focus-visible:ring-primary/20 rounded-xl h-11 ${isRTL ? 'text-right' : ''}`}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="sponsor-phone" className={`text-sm font-semibold text-foreground/90 ${isRTL ? 'text-right block' : ''}`}>
                                    {t('startApplication.sponsorInfo.phoneNumber')} <span className="text-red-500">*</span>
                                  </Label>
                                  <Input
                                    id="sponsor-phone"
                                    type="tel"
                                    placeholder="+971 50 123 4567"
                                    value={sponsorInfo.phone}
                                    onChange={(e) => setSponsorInfo(prev => ({ ...prev, phone: e.target.value }))}
                                    className={`bg-muted/30 border-border/60 focus:border-primary focus-visible:ring-primary/20 rounded-xl h-11 ${isRTL ? 'text-right' : ''}`}
                                  />
                                </div>
                                {(sponsorInfo.sponsorType === 'investor' || sponsorInfo.sponsorType === 'partner') && (
                                  <div className="space-y-2">
                                    <Label htmlFor="sponsor-iban" className={`text-sm font-semibold text-foreground/90 ${isRTL ? 'text-right block' : ''}`}>
                                      {t('startApplication.sponsorInfo.ibanNumber')} <span className="text-amber-500 font-medium">{t('startApplication.sponsorInfo.optional')}</span>
                                    </Label>
                                    <Input
                                      id="sponsor-iban"
                                      type="text"
                                      placeholder="AE12345678901234567890"
                                      value={sponsorInfo.iban}
                                      onChange={(e) => setSponsorInfo(prev => ({ ...prev, iban: e.target.value }))}
                                      className={`bg-muted/30 border-border/60 focus:border-primary focus-visible:ring-primary/20 rounded-xl h-11 ${isRTL ? 'text-right' : ''}`}
                                    />
                                  </div>
                                )}
                              </div>
                            </motion.div>

                            {/* Document Requirements Preview */}
                            {sponsorInfo.sponsorType && (
                              <motion.div variants={staggerItem} className="space-y-2.5">
                                <Label className={`text-sm font-semibold text-foreground/90 ${isRTL ? 'text-right block' : ''}`}>
                                  {t('startApplication.sponsorInfo.docRequirementsPreview')}
                                </Label>
                                <Card className="relative overflow-hidden bg-gradient-to-br from-primary/[0.05] to-transparent border-primary/15 rounded-2xl">
                                  <CardContent className="p-4 sm:p-5">
                                    <div className={`space-y-3 ${isRTL ? 'text-right' : ''}`}>
                                      <p className="text-sm text-foreground/70">
                                        {t('startApplication.sponsorInfo.basedOnSelection')} <strong className="text-foreground font-semibold">{sponsorInfo.sponsorType}</strong>, {t('startApplication.sponsorInfo.youWillNeed')}:
                                      </p>
                                      <ul className="text-xs space-y-2 text-foreground/60">
                                        <li className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                          <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" /> {t('startApplication.sponsorInfo.studioPhoto')}
                                        </li>
                                        <li className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                          <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" /> {t('startApplication.sponsorInfo.passportCopy')}
                                        </li>
                                        <li className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                          <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" /> {t('startApplication.sponsorInfo.passportCoverPage')}
                                        </li>
                                        {sponsorInfo.sponsorType === 'employee' && (
                                          <li className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                            <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" /> {t('startApplication.sponsorInfo.mohreApproval')}
                                          </li>
                                        )}
                                        {sponsorInfo.sponsorType !== 'employee' && (
                                          <li className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                            <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" /> {t('startApplication.sponsorInfo.tradeLicenseEst')}
                                          </li>
                                        )}
                                        <li className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                          <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" /> {t('startApplication.sponsorInfo.nationalId')}
                                        </li>
                                      </ul>
                                    </div>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            )}

                            {/* ── Document Upload (merged into this step) ── */}
                            {docDefs.length > 0 && (
                              <motion.div variants={staggerItem} className="space-y-3">
                                <div className={`flex items-center gap-2.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                    <Upload className="w-3.5 h-3.5 text-primary" strokeWidth={2.25} />
                                  </span>
                                  <Label className={`text-sm font-semibold text-foreground/90 ${isRTL ? 'text-right' : ''}`}>
                                    {t('applications.requiredDocuments')}
                                  </Label>
                                </div>
                                {/* Required docs list preview */}
                                <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-2">
                                  {docDefs.filter(d => d.required).map(doc => {
                                    const isUploaded = uploadedDocuments[doc.id]?.status === 'uploaded'
                                    return (
                                    <div key={doc.id} className={`flex items-center gap-2.5 text-xs ${isRTL ? 'flex-row-reverse' : ''}`}>
                                      {isUploaded
                                        ? <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /></span>
                                        : <div className="w-5 h-5 shrink-0 rounded-full border-2 border-muted-foreground/30" />
                                      }
                                      <span className={isUploaded ? 'text-emerald-600 dark:text-emerald-400 line-through' : 'text-foreground/70 font-medium'}>
                                        {doc.label}
                                      </span>
                                    </div>
                                    )
                                  })}
                                </div>
                                {/* Actual upload UI — no nested scroll, CardContent handles it */}
                                <div className="rounded-2xl border border-border/40 overflow-hidden">
                                  <DocumentManager
                                    documents={docDefs}
                                    uploadedDocuments={uploadedDocuments}
                                    onUpload={handleDocumentUpload}
                                    onDelete={handleDocumentDelete}
                                  />
                                </div>
                              </motion.div>
                            )}

                            {/* Navigation Buttons — sticky so always visible while scrolling */}
                            <motion.div
                              variants={staggerItem}
                              className="pt-6 pb-2 space-y-3 sticky bottom-0 bg-gradient-to-t from-background via-background to-transparent border-t border-border/40 -mx-4 sm:-mx-6 px-4 sm:px-6 mt-4"
                            >
                              <motion.button
                                whileHover={{ scale: canNavigateToNext() ? 1.01 : 1 }}
                                whileTap={{ scale: canNavigateToNext() ? 0.98 : 1 }}
                                onClick={() => {
                                  setProgress(80)
                                  goToNextTab()
                                }}
                                disabled={!canNavigateToNext()}
                                className={`w-full flex items-center justify-center bg-gradient-to-r from-primary to-primary/85 text-black shadow-[0_10px_28px_-10px_hsl(var(--primary)/0.6)] disabled:opacity-40 disabled:shadow-none rounded-2xl h-12 font-semibold transition-shadow ${isRTL ? 'flex-row-reverse' : ''}`}
                              >
                                {t('common.continue')}
                                <ChevronRight className={`w-4 h-4 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
                              </motion.button>
                              <div className="flex justify-center">
                                <Button
                                  variant="ghost"
                                  onClick={goToPreviousTab}
                                  className={`text-sm text-foreground/60 hover:text-foreground rounded-full ${isRTL ? 'flex-row-reverse' : ''}`}
                                >
                                  <ChevronRight className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1 rotate-180'}`} />
                                  {t('common.back')}
                                </Button>
                              </div>
                            </motion.div>
                          </motion.div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </AnimatePresence>
                </TabsContent>
                
                {/* Live Assist Tab — kept for socket compatibility but hidden from stepper */}
                <TabsContent value="live-assist" className="mt-0 h-full">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <Card className="bg-background border-primary/30 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-[#a47112] flex items-center text-base">
                          <MessageSquare className="w-4 h-4 mr-2 text-[#a47112]" />
                          Live Assistance
                          <Badge className="ml-2 bg-primary/10 text-primary border-primary/30 text-xs">
                            {amerConnected ? 'Officer Online' : 'AI Active'}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 max-h-[24rem] overflow-y-scroll">
                        {/* Enhanced Connection Options with Status */}
                        <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                          <Button
                            onClick={() => { setChatMode('ai'); setAmerConnected(false) }}
                            className={`${chatMode === 'ai' ? 'bg-primary text-black' : 'bg-surface text-foreground border border-primary/30'} hover:bg-primary hover:text-black`}
                          >
                            <Brain className="w-3 h-3 mr-1" />
                            AI
                          </Button>
                          <Button
                            onClick={() => { setChatMode('amer'); requestAmer() }}
                              disabled={connectionStatus === 'requesting' || connectionStatus === 'pending'}
                              className={`${chatMode === 'amer' || connectionStatus === 'connected' ? 'bg-primary text-black' : 'bg-surface text-foreground border border-primary/30'} hover:bg-primary hover:text-black disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            <User className="w-3 h-3 mr-1" />
                              {connectionStatus === 'requesting' ? 'Requesting...' : 
                               connectionStatus === 'pending' ? 'Pending...' :
                               connectionStatus === 'connected' ? 'Connected' : 'Officer'}
                          </Button>
                          <Button
                            onClick={() => { setChatMode('voice'); toast('Voice call feature coming soon!') }}
                            className={`${chatMode === 'voice' ? 'bg-primary text-black' : 'bg-surface text-foreground border border-primary/30'} hover:bg-primary hover:text-black`}
                          >
                            <PhoneCall className="w-3 h-3 mr-1" />
                            Call
                          </Button>
                          </div>

                          {/* Connection Status Indicator */}
                          {connectionStatus !== 'idle' && (
                            <div className={`p-3 rounded-lg border text-sm ${
                              connectionStatus === 'connected' ? 'bg-accent/10 border-accent/30 text-green-700' :
                              connectionStatus === 'pending' ? 'bg-warning/10 border-warning/30 text-yellow-700' :
                              connectionStatus === 'requesting' ? 'bg-primary/10 border-primary/30 text-blue-700' :
                              connectionStatus === 'no_officers' ? 'bg-error/10 border-error/30 text-red-700' :
                              'bg-surface-light border-border text-foreground'
                            }`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <div className={`w-2 h-2 rounded-full ${
                                    connectionStatus === 'connected' ? 'bg-accent/100 animate-pulse' :
                                    connectionStatus === 'pending' ? 'bg-warning/100 animate-pulse' :
                                    connectionStatus === 'requesting' ? 'bg-primary/100 animate-pulse' :
                                    'bg-error/100'
                                  }`}></div>
                                  <span className="font-medium text-accent">
                                    {connectionStatus === 'connected' && officerInfo ? `Connected to ${officerInfo.name}` :
                                     connectionStatus === 'pending' ? 'Waiting for officer approval...' :
                                     connectionStatus === 'requesting' ? 'Sending request...' :
                                     connectionStatus === 'no_officers' ? 'No officers available' :
                                     'Unknown status'}
                                  </span>
                                </div>
                                {connectionStatus === 'pending' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={cancelRequest}
                                    className="text-xs h-6 px-2"
                                  >
                                    Cancel
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Live Guidance */}
                        {liveGuidance.length > 0 && (
                          <div className="bg-primary/5 border border-primary/30 rounded-lg p-4">
                            <h3 className="text-secondary font-medium mb-2">Live Guidance</h3>
                            <div className="space-y-1">
                              {liveGuidance.map((guide, idx) => (
                                <div key={idx} className="text-sm text-foreground flex items-center">
                                  <ChevronRight className="w-3 h-3 mr-1 text-primary" />
                                  {guide}
                                </div>
                      ))}
                    </div>
                    </div>
                  )}

                        <div className="space-y-3">
                          <Button
                            onClick={goToNextTab}
                            disabled={!canNavigateToNext()}
                            className="w-full bg-primary text-background hover:bg-primary/90 shadow-sm"
                          >
                            Next: Review & Submit <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                          <div className="flex justify-center">
                            <Button
                              variant="outline"
                              onClick={goToPreviousTab}
                              className="text-sm"
                            >
                              ← Back to Documents
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>

                {/* Review & Submit Tab */}
                <TabsContent value="review-submit" className="mt-0 flex flex-col min-h-0 flex-1">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col min-h-0 flex-1"
                  >
                    <Card className="bg-background border-primary/30 shadow-sm flex flex-col min-h-0 flex-1">
                      <CardHeader className="shrink-0">
                        <CardTitle className="text-[#a47112] flex items-center text-xs md:text-base">
                          <Rocket className="w-4 h-4 mr-2 text-[#a47112]" />
                          {t('startApplication.reviewSubmit.title')}
                          <Badge className="ml-2 bg-green-100 text-green-800 border-green-300 text-[10px] md:text-xs">{t('startApplication.reviewSubmit.readyToSubmit')}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 space-y-6" style={{ scrollbarGutter: 'stable' }}>
                        {/* Application Summary */}
                        <div className="bg-primary/5 border border-primary/30 rounded-lg p-4">
                          <h3 className="text-secondary font-medium mb-4 flex items-center">
                            <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                            Application Summary
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <span className="text-text-secondary text-sm">Service Selected:</span>
                              <p className="text-secondary font-medium">{selected?.name}</p>
                            </div>
                            <div className="space-y-2">
                              <span className="text-text-secondary text-sm">Sponsor Type:</span>
                              <p className="text-secondary font-medium capitalize">{sponsorInfo.sponsorType}</p>
                            </div>
                            <div className="space-y-2">
                              <span className="text-text-secondary text-sm">Contact Email:</span>
                              <p className="text-secondary font-medium">{sponsorInfo.email}</p>
                            </div>
                            <div className="space-y-2">
                              <span className="text-text-secondary text-sm">Phone Number:</span>
                              <p className="text-secondary font-medium">{sponsorInfo.phone}</p>
                            </div>
                            <div className="space-y-2">
                              <span className="text-text-secondary text-sm">Documents Uploaded:</span>
                              <p className="text-secondary font-medium">
                                {Object.values(uploadedDocuments).filter(doc => doc.status === 'uploaded').length} of {docDefs.filter(doc => doc.required).length} required
                              </p>
                            </div>
                            <div className="space-y-2">
                              <span className="text-text-secondary text-sm">Processing Time:</span>
                              <p className="text-primary font-medium">1-3 business days</p>
                            </div>
                            <div className="space-y-2">
                              <span className="text-text-secondary text-sm">Application Fee:</span>
                              <p className="text-secondary font-medium text-lg">AED {applicationFee}</p>
                            </div>
                            <div className="space-y-2">
                              <span className="text-text-secondary text-sm">Status:</span>
                              <Badge className="bg-green-100 text-green-800 border-green-300">
                                All Requirements Met
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Document Checklist */}
                        <div className="bg-muted/30 border border-border rounded-lg p-4">
                          <h3 className="text-secondary font-medium mb-3">Document Checklist</h3>
                          <div className="space-y-2">
                            {docDefs.map((doc) => {
                              const uploadedDoc = uploadedDocuments[doc.id]
                              const isUploaded = uploadedDoc?.status === 'uploaded'
                              return (
                                <div key={doc.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-b-0">
                                  <div className="flex items-center space-x-3">
                                    {isUploaded ? (
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                    ) : (
                                      <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                                    )}
                                    <span className={`text-sm ${isUploaded ? 'text-green-700' : 'text-gray-500'}`}>
                                      {doc.label}
                                    </span>
                                    {doc.required && (
                                      <Badge variant="destructive" className="text-xs">Required</Badge>
                                    )}
                                  </div>
                                  <span className={`text-xs ${isUploaded ? 'text-green-600' : 'text-gray-400'}`}>
                                    {isUploaded ? 'Uploaded' : 'Pending'}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* Enhanced Payment Section */}
                        {!paymentCompleted && (
                          <StripePaymentForm
                            amount={applicationFee}
                            currency="aed"
                            applicationId={applicationId || undefined}
                            onSuccess={(_paymentResult) => {
                              setPaymentCompleted(true)
                              setProgress(100)
                              toast.success(`Payment of AED ${applicationFee} completed successfully!`)
                            }}
                            onError={(error) => {
                              toast.error(`Payment failed: ${error}`)
                            }}
                            disabled={false}
                          />
                        )}

                        {paymentCompleted && (
                          <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
                            <div className="flex items-center text-green-700">
                              <CheckCircle className="w-4 h-4 mr-2" />
                              <span className="font-medium">Payment Completed Successfully</span>
                      </div>
                            <p className="text-sm text-accent mt-1">AED {applicationFee} processed via test payment</p>
                    </div>
                        )}

                        {/* Final Checks */}
                        <div className="space-y-3">
                          <div className="flex items-center text-secondary">
                            <CheckCircle className="w-4 h-4 mr-2 text-accent" />
                            <span className="text-sm">All required documents uploaded</span>
                  </div>
                          <div className="flex items-center text-secondary">
                            <CheckCircle className="w-4 h-4 mr-2 text-accent" />
                            <span className="text-sm">AI validation passed</span>
                          </div>
                          <div className="flex items-center text-secondary">
                            <CheckCircle className="w-4 h-4 mr-2 text-accent" />
                            <span className="text-sm">Eligibility confirmed</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Button 
                            onClick={async () => {
                        const ok = await createApplicationAndUpload();
                        if (!ok) return;
                              setProgress(100);
                              toast.success('Application submitted successfully!');
                              // Auto-close dialog after successful submission
                              setTimeout(() => {
                                onOpenChange(false);
                              }, 2000);
                            }}
                            disabled={!paymentCompleted}
                            className="w-full bg-primary text-black hover:bg-primary/90 font-medium py-3 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {paymentCompleted ? 'Submit Application' : 'Complete Payment First'}
                          </Button>
                          <div className="flex justify-center">
                            <Button
                              variant="outline"
                              onClick={goToPreviousTab}
                              className="text-sm"
                            >
                              ← {t('common.back')}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                </motion.div>
                </TabsContent>
          </div>

              {/* Enhanced AI Chat Panel - Collapsible */}
              {!isChatCollapsed && (
              <div className="lg:col-span-4 flex flex-col bg-background border border-primary/30 rounded-lg overflow-hidden shadow-sm min-h-[280px] lg:min-h-0"
              >
                <div className="p-2 sm:p-3 lg:p-4 border-b border-primary/20 bg-background">
                  {/* Chat Header with Collapse Button */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-accent font-medium flex items-center text-sm sm:text-base">
                        <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-primary" />
                        {connectionStatus === 'connected' && officerInfo ? officerInfo.name : 'Smart Assistant'}
                      </div>
                      <div className="text-xs text-text-secondary">
                        {connectionStatus === 'connected' ? 'Live Amer Officer Support' :
                         connectionStatus === 'pending' ? 'Waiting for officer...' :
                         connectionStatus === 'requesting' ? 'Requesting officer...' :
                         'AI-powered guidance & real-time support'}
                      </div>
                </div>
                    <div className="flex items-center space-x-2">
                      {/* UAE Pass Button */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={requestUaePass}
                        disabled={!user || uaePassStatus === 'requesting'}
                        className={`border-primary/30 text-xs px-2 py-1 h-7 ${
                          uaePassStatus === 'authorized' 
                            ? 'bg-accent/10 text-green-700 border-accent/40' 
                            : 'text-primary hover:bg-primary/10'
                        }`}
                        title="Access UAE Government Services"
                      >
                        <Globe className="w-3 h-3 mr-1" />
                        {uaePassStatus === 'authorized' ? 'Connected' : 
                         uaePassStatus === 'requesting' ? 'Connecting...' : 'UAE Pass'}
                        {uaePassStatus === 'requesting' && <span className="animate-pulse">...</span>}
                      </Button>
                      
                      {/* Collapse Button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsChatCollapsed(true)}
                        className="text-text-secondary hover:text-foreground hover:bg-surface h-7 w-7 p-0"
                        title="Minimize chat panel"
                      >
                        <Minimize2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
                <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto">
                      <Button
                    onClick={() => setChatMode('ai')}
                        size="sm"
                        className={`${chatMode === 'ai' ? 'bg-primary text-black' : 'bg-surface text-foreground border border-primary/30'} hover:bg-primary hover:text-black flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-3 py-1.5`}
                      >
                        <Brain className="w-3 h-3 sm:mr-1" />
                        <span className="hidden sm:inline">AI</span>
                      </Button>
                      <Button
                        onClick={() => { setChatMode('amer'); requestAmer() }}
                        size="sm"
                        className={`${chatMode === 'amer' ? 'bg-primary text-black' : 'bg-surface text-foreground border border-primary/30'} hover:bg-primary hover:text-black flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-3 py-1.5`}
                      >
                        <User className="w-3 h-3 sm:mr-1" />
                        <span className="hidden sm:inline">Officer</span>
                      </Button>
                      <Button
                        onClick={() => { setChatMode('voice'); toast('Voice call feature coming soon!') }}
                        size="sm"
                        className={`${chatMode === 'voice' ? 'bg-primary text-black' : 'bg-surface text-foreground border border-primary/30'} hover:bg-primary hover:text-black flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-3 py-1.5`}
                      >
                        <PhoneCall className="w-3 h-3 sm:mr-1" />
                        <span className="hidden sm:inline">Call</span>
                      </Button>
                </div>
              </div>

                  {/* Enhanced Status Indicators */}
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          connectionStatus === 'connected' ? 'bg-accent animate-pulse' :
                          connectionStatus === 'pending' ? 'bg-warning/100 animate-pulse' :
                          connectionStatus === 'requesting' ? 'bg-primary/100 animate-pulse' :
                          connectionStatus === 'no_officers' ? 'bg-error/100' :
                          'bg-accent animate-pulse'
                        }`}></div>
                        <span className={`${
                          connectionStatus === 'connected' ? 'text-accent' :
                          connectionStatus === 'pending' ? 'text-warning' :
                          connectionStatus === 'requesting' ? 'text-primary' :
                          connectionStatus === 'no_officers' ? 'text-error' :
                          'text-accent'
                        }`}>
                          {connectionStatus === 'connected' ? `Connected to ${officerInfo?.name || 'Officer'}` :
                           connectionStatus === 'pending' ? 'Awaiting officer...' :
                           connectionStatus === 'requesting' ? 'Requesting...' :
                           connectionStatus === 'no_officers' ? 'No officers available' :
                           chatMode === 'ai' ? 'AI Ready' : 'Ready'}
                        </span>
            </div>
                      {slaCountdown && (
                        <div className="flex items-center text-orange-300">
                          <Clock className="w-3 h-3 mr-1" />
                          Response time: {slaCountdown}
                        </div>
                      )}
                    </div>
                    <div className="text-primary">
                      {connectionStatus === 'connected' ? 'Live Support' : 'Premium Support'}
                    </div>
                  </div>
                </div>

                {/* Chat Messages */}
                <div 
                  id="chat-messages-container"
                  className="flex-1 overflow-y-auto p-2 sm:p-3 lg:p-4 space-y-2 bg-surface-light min-h-0"
                >
                  {/* Welcome Message */}
                  {getCurrentChat().length === 0 && (
                    <div className="bg-primary/5 border border-primary/30 rounded-lg p-3">
                      <div className="flex items-center mb-2">
                        <Sparkles className="w-3 h-3 text-primary mr-2" />
                        <span className="text-black font-medium text-xs">{t('startApplication.chat.assistantActive')}</span>
                      </div>  
                      <p className="text-foreground text-xs leading-relaxed">
                        {t('startApplication.chat.welcomeMessage')} {selected?.name || t('startApplication.title')}, {t('startApplication.chat.requirementsOrProcessing')}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {[
                          "What documents do I need?",
                          "How long will this take?",
                          "Am I eligible?",
                          "Connect me to an officer"
                        ].map((suggestion) => (
                          <Button
                            key={suggestion}
                            size="sm"
                            variant="outline"
                            onClick={() => setInput(suggestion)}
                            className="text-xs border-primary/30 text-foreground bg-background hover:bg-primary hover:text-black shadow-sm h-6 px-2"
                          >
                            {suggestion}
                          </Button>
                        ))}
                  </div>
                </div>
              )}

                  {/* Enhanced Chat Messages */}
                  {getCurrentChat().map((m, idx) => (
                    <React.Fragment key={`${m.id}-${idx}`}>
                      <StreamingMessage
                        type={m.type === 'bot' ? 'ai' : m.type as any}
                        content={m.content}
                        isStreaming={m.isStreaming}
                        metadata={m.metadata}
                        timestamp={m.timestamp}
                      />
                      {m.metadata?.action === 'connect_officer' && (
                        <div className="flex justify-start pl-11 -mt-2 mb-4">
                          <button
                            onClick={() => {
                              setChatMode('amer')
                              requestAmer()
                            }}
                            className="px-4 py-2 rounded-xl bg-[#0F2A44] text-white text-sm font-medium hover:bg-[#1a3a5c] transition-colors flex items-center gap-2"
                          >
                            <Users className="w-4 h-4" />
                            {t('startApplication.chat.suggestions.connectOfficer', 'Connect me to an officer')}
                          </button>
                        </div>
                      )}
                    </React.Fragment>
                  ))}

                  {/* Enhanced Typing Indicators */}
                  {isAIStreaming && <TypingIndicator sender="TAMMAT AI" />}
                  {isTyping && <TypingIndicator sender="Amer Officer" />}
            </div>

                {/* Enhanced Chat Input with Drag & Drop */}
                <div className="p-2 sm:p-3 border-t border-primary/20 bg-background flex-shrink-0">
                  {/* File Drop Zone */}
                  <div
                    className={`mb-2 border-2 border-dashed rounded-lg p-3 text-center transition-colors ${
                      isDragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setIsDragOver(true)
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault()
                      setIsDragOver(false)
                    }}
                    onDrop={handleFileDrop}
                  >
                    <Upload className="w-5 h-5 mx-auto mb-1 text-text-muted" />
                    <p className="text-xs text-text-secondary">
                      {isDragOver ? 'Drop files here' : 'Drag & drop files or images here'}
                    </p>
                  </div>

                  {/* Message Input */}
              <div className="relative">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (roomId && socket) socket.emit('typing_start', { roomId, userId: 'user' })
                        if (e.key === 'Enter') {
                          sendChat()
                          if (roomId && socket) socket.emit('typing_stop', { roomId, userId: 'user' })
                        }
                      }}
                      placeholder={!user ? "Please log in to start chatting" : "Ask about your application, requirements, or get live help..."}
                      className="bg-background border-primary/30 text-black placeholder:text-text-secondary focus:border-primary pr-20 text-xs h-8"
                      disabled={!user} // Require login
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
                      {/* File Upload Button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={!user || !roomId}
                        title="Upload file"
                      >
                        <Upload className="w-3 h-3" />
                      </Button>

                      {/* Send Button */}
                    <Button
                      onClick={() => {
                        sendChat()
                          if (roomId && socket) socket.emit('typing_stop', { roomId, userId: 'user' })
                      }}
                      size="sm"
                        className="bg-primary text-black hover:bg-primary/90 h-6 w-6 p-0"
                        disabled={!input.trim() || !user}
                    >
                        <Send className="w-3 h-3" />
                    </Button>
              </div>
                  </div>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                    multiple
                  />

                  <div className="mt-1 flex items-center justify-between text-xs text-text-secondary">
                    <span className="text-xs">
                      {!user ? 'Please log in to start chatting' : 'Powered by advanced AI • Real-time assistance'}
                    </span>
                    <div className="flex items-center space-x-1">
                      <Button size="sm" variant="ghost" className="h-5 px-1 text-xs" disabled={!user}>
                        <Camera className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-5 px-1 text-xs" disabled={!user}>
                        <Mic className="w-3 h-3" />
                      </Button>
            </div>
          </div>
        </div>
              </div>
              )}
              
              {/* Floating Chat Toggle Button */}
              {isChatCollapsed && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="fixed bottom-6 right-6 z-50"
                >
                  <Button
                    onClick={() => setIsChatCollapsed(false)}
                    className="bg-primary text-black hover:bg-primary/90 shadow-lg rounded-full w-14 h-14 p-0"
                    title="Open chat panel"
                  >
                    <MessageSquare className="w-6 h-6" />
                  </Button>
                  {connectionStatus === 'connected' && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent/100 rounded-full border-2 border-white animate-pulse"></div>
                  )}
                </motion.div>
              )}
            </div>
          </Tabs>
        </div>

      </DialogContent>
    </Dialog>
  )
}


