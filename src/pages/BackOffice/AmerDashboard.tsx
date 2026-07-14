import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, FileText, Clock, CheckCircle, XCircle, AlertTriangle, Eye,
  UserCheck, FileCheck, Clock3, Shield, Bell, Lock, MoreHorizontal,
  BarChart3, Upload, AlertCircle, Key, Gavel, Send, Activity, Menu,
  Filter as FilterIcon, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeSelector } from '@/components/ui/ThemeSelector';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
 
 
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useAmerDashboard, type AmerApplication } from '@/hooks/useAmerDashboard';
import { getSocket } from '@/lib/socket'
import { DocumentUploadDialog } from '@/components/AmerDashboard/DocumentUploadDialog';
import { ApplicationDetailsDrawer } from '@/components/AmerDashboard/ApplicationDetailsDrawer';
import { DocumentReviewDialog } from '@/components/AmerDashboard/DocumentReviewDialog';
import ChecksReviewPanel from '@/components/AmerDashboard/ChecksReviewPanel';
import { cn } from '@/lib/utils';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import PackageApplicationsAdmin from './Packageapplicationsadmin';

const apiBase = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:5001'

const AmerDashboard: React.FC = () => {
  const { user, loading: authLoading, checkRole } = useAuth();
  const { t } = useTranslation();
  const {
    applications,
    filteredApplications,
    stats,
    loading,
    fetchAllApplications,
    updateApplicationStatus,
    addFraudAlert,
    issuePenalty,
    requestAdditionalDocuments,
    filterApplications,
    fetchStats
  } = useAmerDashboard();

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  // const [dateFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Advanced features state
  const [selectedApplication, setSelectedApplication] = useState<AmerApplication | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [statusUpdateData, setStatusUpdateData] = useState<{
    applicationId: string;
    currentStatus: string;
    newStatus: string;
    note: string;
  } | null>(null);
  
  // Drawer states
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [showApplicationDetails, setShowApplicationDetails] = useState(false);
  const [showDocumentReview, setShowDocumentReview] = useState(false);
  const [showResultDocumentUpload, setShowResultDocumentUpload] = useState(false);
  // OTP modal state
  const [showOtpDialog, setShowOtpDialog] = useState(false)
  const [otpMinutes, setOtpMinutes] = useState<number>(2)
  const [otpPhone, setOtpPhone] = useState<string>('')
  const [otpCode, setOtpCode] = useState<string>('')
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null)
  const [otpCountdown, setOtpCountdown] = useState<string>('')
  const [otpLoading, setOtpLoading] = useState<boolean>(false)
  
  

  // Mobile navigation
  const [activeTab, setActiveTab] = useState('applications');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [fraudAlerts, setFraudAlerts] = useState<any[]>([]);
  const [penalties, setPenalties] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  // const [socketReady] = useState(false)
  // Conversations state
  const [rooms, setRooms] = useState<Array<{ roomId: string; userName?: string; service?: string; unread: number }>>([])
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null)
  const [messagesByRoom, setMessagesByRoom] = useState<Record<string, any[]>>({})
  const [typingByRoom, setTypingByRoom] = useState<Record<string, boolean>>({})
  const [chatInput, setChatInput] = useState('')
  const chatEndRef = useRef<HTMLDivElement | null>(null)
  // Track message ids we've already rendered per session to prevent duplicates across close events
  const seenMessageIdsRef = useRef<Set<string>>(new Set())
  // console.log(fraudAlerts, penalties,applications,stats);
  // Check if user has Amer role
  useEffect(() => {
    const checkAmerRole = async () => {
      if (user && !authLoading) {
        const hasRole = await checkRole('amer');
        if (!hasRole) {
          // Redirect or show error
          console.error('Access denied: Amer role required');
        }
      }
    };

    checkAmerRole();
  }, [user]);

  // Socket events for invites and chat
  useEffect(() => {
    if (!user || user.role !== 'amer') return
    const socket = getSocket()
    
    // Register as Amer officer
    socket.emit('register_amer', {
      name: (user as any).firstName ? `${(user as any).firstName} ${(user as any).lastName}` : 'Amer Officer',
      userId: user.id,
      userData: {
        name: (user as any).firstName ? `${(user as any).firstName} ${(user as any).lastName}` : 'Amer Officer',
        email: user.email,
        role: 'amer'
      }
    })
    
    const onInvite = (payload: any) => {
      console.log('Received Amer invite:', payload)
      setInvites((prev) => [payload, ...prev])
      // Also surface invite as a pending room entry
      setRooms(prev => prev.find(r => r.roomId === payload.roomId) ? prev : [{ roomId: payload.roomId, userName: payload.userName, service: payload.service, unread: 0 }, ...prev])
    }
    
    const onOfficerRequest = (payload: any) => {
      console.log('Received officer request:', payload)
      setInvites((prev) => [{
        roomId: payload.requestId,
        userName: payload.userInfo?.userName || 'User',
        service: payload.userInfo?.service || 'General',
        requestId: payload.requestId,
        userInfo: payload.userInfo
      }, ...prev])
    }
    
    socket.on('amer_invite', onInvite)
    socket.on('officer_request', onOfficerRequest)
    
    // Handle chat session started
    const onChatSessionStarted = (payload: any) => {
      console.log('Chat session started:', payload)
      const { chatId, userService, userName } = payload
      setCurrentRoomId(chatId)
      setRooms(prev => prev.find(r => r.roomId === chatId) ? prev : [{ 
        roomId: chatId, 
        userName: userName || 'User', 
        service: userService || 'General', 
        unread: 0 
      }, ...prev])
    }
    
    socket.on('chat_session_started', onChatSessionStarted)
    
    // Room events
    const onAmerConnected = (payload: any) => {
      const { roomId } = payload || {}
      if (!roomId) return
      // Use invite meta if present
      const meta = invites.find(i => i.roomId === roomId)
      setRooms((prev) => {
        if (prev.find(r => r.roomId === roomId)) return prev
        return [{ roomId, userName: meta?.userName, service: meta?.service, unread: 0 }, ...prev]
      })
      setCurrentRoomId((curr) => curr || roomId)
    }
    const onNewMessage = (msg: any) => {
      console.log('AmerDashboard received new message:', msg)
      console.log('Current room ID:', currentRoomId)
      console.log('Message metadata:', msg.metadata)
      
      const { roomId, chatId } = msg.metadata || {}
      const effectiveRoomId = roomId || chatId || msg.chatId || currentRoomId
      
      console.log('Effective room ID determined:', effectiveRoomId)
      
      if (!effectiveRoomId) {
        console.warn('No room ID found for message, skipping')
        return
      }
      
      // Strong de-dupe using a Set to handle near-simultaneous events
      if (msg?.id && seenMessageIdsRef.current.has(msg.id)) {
        console.log('Message already seen, skipping:', msg.id)
        return
      }
      if (msg?.id) seenMessageIdsRef.current.add(msg.id)
      
      // Don't add messages that we just sent (they're already in the UI)
      const isOwnMessage = msg.sender === 'amer' && msg.timestamp && 
        (Date.now() - new Date(msg.timestamp).getTime() < 1000)
      
      if (!isOwnMessage) {
        console.log('Adding message to room:', effectiveRoomId)
        setMessagesByRoom(prev => ({
          ...prev,
          [effectiveRoomId]: [...(prev[effectiveRoomId] || []), msg]
        }))
      }
      
      setRooms(prev => prev.map(r => r.roomId === effectiveRoomId && effectiveRoomId !== currentRoomId ? { ...r, unread: r.unread + 1 } : r))
      
      // Auto-scroll
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
    const onUserTyping = (payload: any) => {
      const { roomId, isTyping } = payload
      if (!roomId) return
      setTypingByRoom(prev => ({ ...prev, [roomId]: !!isTyping }))
    }
    // The server already emits a 'new_message' for files. We listen only to that to avoid duplicates.
    const onFileComplete = (_msg: any) => {}
    const onRoomSnapshot = (payload: any) => {
      if (!payload?.roomId) return
      setMessagesByRoom(prev => ({ ...prev, [payload.roomId]: payload.messages || [] }))
      setRooms(prev => prev.find(r => r.roomId === payload.roomId) ? prev : [{ roomId: payload.roomId, unread: 0 }, ...prev])
      setCurrentRoomId(curr => curr || payload.roomId)
    }
    socket.on('amer_connected', onAmerConnected)
    socket.on('new_message', onNewMessage)
    socket.on('user_typing', onUserTyping)
    socket.on('file_upload_complete', onFileComplete)
    socket.on('room_snapshot', onRoomSnapshot)
    return () => {
      socket.off('amer_invite', onInvite)
      socket.off('officer_request', onOfficerRequest)
      socket.off('chat_session_started', onChatSessionStarted)
      socket.off('amer_connected', onAmerConnected)
      socket.off('new_message', onNewMessage)
      socket.off('user_typing', onUserTyping)
      socket.off('file_upload_complete', onFileComplete)
      socket.off('room_snapshot', onRoomSnapshot)
    }
  }, [user, currentRoomId])

  // Load data
  useEffect(() => {
    if (user && user.role === 'amer') {
      loadDashboardData();
    }
  }, [user]);
  console.log('invites', invites)

  const loadDashboardData = async () => {
    try {
      await fetchAllApplications();
      await fetchStats();
      setFraudAlerts(applications.filter(application => application.status === 'fraud_detected'));
      setPenalties(applications.filter(application => application.status === 'penalty_issued'));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };
  // Filter applications
  useEffect(() => {
    filterApplications({
      status: statusFilter,
      searchQuery
    });
  }, [applications, statusFilter, searchQuery]);

  // OTP countdown effect
  useEffect(() => {
    if (!otpExpiresAt) { setOtpCountdown(''); return }
    const update = () => {
      const left = Math.max(0, otpExpiresAt - Date.now())
      const m = Math.floor(left/60000)
      const s = Math.floor((left%60000)/1000)
      setOtpCountdown(`${m}:${s.toString().padStart(2,'0')}`)
      if (left <= 0) {
        setOtpExpiresAt(null)
      }
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [otpExpiresAt])

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: 'bg-surface text-foreground', icon: FileText },
      submitted: { color: 'bg-primary/20 text-blue-800', icon: Clock },
      under_review: { color: 'bg-warning/20 text-yellow-800', icon: Clock3 },
      docs_required: { color: 'bg-secondary/20 text-orange-800', icon: AlertTriangle },
      approved: { color: 'bg-accent/20 text-green-800', icon: CheckCircle },
      rejected: { color: 'bg-error/20 text-red-800', icon: XCircle },
      closed: { color: 'bg-surface text-foreground', icon: FileText },
      fraud_detected: { color: 'bg-error/20 text-red-800', icon: AlertCircle },
      penalty_issued: { color: 'bg-secondary/20 text-orange-800', icon: Gavel }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} border-0 text-xs`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    );
  };

  const handleStatusUpdateOriginal = async (applicationId: string, status: string, note?: string) => {
    try {
      await updateApplicationStatus(applicationId, status, note);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDocumentUpload = (applicationId: string) => {
    const app = applications.find(a => a._id === applicationId)
    if (app) setSelectedApplication(app)
    setShowDocumentUpload(true);
  };

  const handleFraudCheck = async (applicationId: string) => {
    try {
      await addFraudAlert(applicationId, 'document_verification', 'medium', 'Document verification required');
    } catch (error) {
      console.error('Error adding fraud alert:', error);
    }
  };

  const handleAttachmentReview = async (attachmentId: string, status: 'approved' | 'rejected', rejectionReason?: string) => {
    try {
      if (!selectedApplication) return
      
      const token = localStorage.getItem('authToken') || ''
      const res = await fetch(`${apiBase}/api/v1/visa/${selectedApplication._id}/attachments/${attachmentId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, rejectionReason })
      })
      if (!res.ok) throw new Error('Review failed')
      toast.success(`Document ${status} successfully`)
      await fetchAllApplications()
    } catch (e) {
      toast.error('Failed to review document')
      throw e
    }
  }

  const handleDocumentReview = (applicationId: string) => {
    const app = applications.find(a => a._id === applicationId)
    if (app) {
      setSelectedApplication(app)
      setShowDocumentReview(true)
    }
  }

  const toggleRowExpansion = (applicationId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(applicationId)) {
        newSet.delete(applicationId)
      } else {
        newSet.add(applicationId)
      }
      return newSet
    })
  }

  const handleStatusUpdateClick = (applicationId: string, currentStatus: string) => {
    setStatusUpdateData({
      applicationId,
      currentStatus,
      newStatus: currentStatus,
      note: ''
    })
    setShowStatusDialog(true)
  }

  const handleStatusUpdateDialog = async (applicationId: string, status: string, note?: string) => {
    try {
      await updateApplicationStatus(applicationId, status, note);
      setShowStatusDialog(false);
      setStatusUpdateData(null);
      toast.success('Application status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update application status');
    }
  }

  const handleResultDocumentUpload = (applicationId: string) => {
    const app = applications.find(a => a._id === applicationId)
    if (app) {
      setSelectedApplication(app)
      setShowResultDocumentUpload(true)
    }
  }

  const handleSetGovStage = async (applicationId: string, stage: string) => {
    try {
      const token = localStorage.getItem('authToken') || ''
      const res = await fetch(`${apiBase}/api/v1/visa/${applicationId}/set-stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ stage })
      })
      if (!res.ok) throw new Error('Stage update failed')
      toast.success(`Stage set to ${stage}`)
      await fetchAllApplications()
    } catch (e) {
      toast.error('Failed to update stage')
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleIssuePenalty = async (applicationId: string) => {
    try {
      await issuePenalty(applicationId, 'late_submission', 500, 'Application submitted after deadline');
    } catch (error) {
      console.error('Error issuing penalty:', error);
    }
  };

  const handleRequestOTP = async (applicationId: string) => {
    try {
      const app = applications.find(a => a._id === applicationId)
      setSelectedApplication(app || null)
      setOtpPhone(app?.sponsor?.phoneNumber || '')
      setOtpMinutes(2)
      setOtpCode('')
      setOtpExpiresAt(null)
      setShowOtpDialog(true)
    } catch (error) {
      console.error('Error preparing OTP modal:', error);
    }
  };

  const handleDocumentsUploaded = (documents: any[]) => {
    console.log('Documents uploaded:', documents);
    // Refresh application data
    loadDashboardData();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-surface-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'amer') {
    return (
      <div className="min-h-screen bg-surface-light flex items-center justify-center">
        <div className="text-center">
          <Lock className="w-16 h-16 text-error mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Access Denied</h2>
          <p className="text-text-secondary">You don't have permission to access this dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      {/* Mobile Header */}
      <div className="lg:hidden bg-surface border-b border-border sticky top-0 z-30 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            {/* <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 rounded-lg hover:bg-primary/10"
            >
              <Menu className="w-5 h-5 text-primary" />
            </button> */}
            {/* <div>
              <h1 className="md:text-lg text-base font-semibold text-primary">{t('amerDashboard.title')}</h1>
              <p className="md:text-xs text-xs text-text-muted">{t('amerDashboard.officerPortal')}</p>
            </div> */}
          </div>
          
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            {/* Language selector (mobile) */}
            {/* <LanguageSelector compact /> */}
            {/* Theme selector (mobile) */}
            {/* <ThemeSelector compact /> */}
            <Button variant="ghost" size="icon" className="relative hover:bg-primary/10">
              <Bell className="w-4 h-4 text-primary" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-warning text-foreground">
                {fraudAlerts&&fraudAlerts?.filter(alert => alert.status === 'open').length + penalties.filter(penalty => penalty.status === 'pending').length}
              </Badge>
            </Button>
            <Avatar className="w-8 h-8 bg-primary/10 border border-border">
              <AvatarImage src={(user as any).avatar} />
              <AvatarFallback className="text-primary">{(user as any).firstName?.[0]}{(user as any).lastName?.[0]}</AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Mobile Tab Navigation */}
        <div className="px-4 pb-4">
          <div className="flex space-x-1 rtl:space-x-reverse bg-surface border border-border p-1 rounded-lg shadow-sm">
            {[
              { id: 'applications', label: t('amerDashboard.applications'), icon: FileText },
              { id: 'fraud', label: t('amerDashboard.fraud'), icon: Shield },
              { id: 'penalties', label: t('amerDashboard.penalties'), icon: Gavel },
              { id: 'otp', label: t('amerDashboard.otp'), icon: Key },
              { id: 'stats', label: t('amerDashboard.stats'), icon: BarChart3 },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 flex items-center justify-center space-x-2 rtl:space-x-reverse py-2 px-3 rounded-md text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-foreground hover:text-foreground hover:bg-primary/10'
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>


      {/* Desktop Header */}
      <div className="hidden lg:block bg-surface border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">{t('amerDashboard.title')}</h1>
              <p className="text-text-secondary">{t('amerDashboard.subtitle')}</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Language selector (desktop) */}
              <LanguageSwitcher />
              {/* Theme selector (desktop) */}
              <ThemeSelector compact />
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-4 h-4" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-warning text-foreground">
                  {fraudAlerts&&fraudAlerts?.filter(alert => alert.status === 'open').length + penalties.filter(penalty => penalty.status === 'pending').length}
                </Badge>
              </Button>
              <Badge variant="outline" className="border-border text-primary">
                <UserCheck className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                {t('amerDashboard.officerPortal')}
              </Badge>
              <Avatar>
                <AvatarImage src={(user as any).avatar} />
                <AvatarFallback>{(user as any).firstName?.[0]}{(user as any).lastName?.[0]}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        {/* Quick Actions Header */}
        {/* <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="bg-background border border-primary/30 shadow-sm">
            <CardContent className="p-4 lg:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div>
                  <h2 className="text-lg lg:text-xl font-semibold text-warning mb-2">Quick Actions</h2>
                  <p className="text-text-secondary text-sm lg:text-base">Manage applications efficiently</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="text-xs lg:text-sm border-primary/30 text-foreground hover:bg-primary hover:text-black">
                    <Shield className="w-4 h-4 mr-2" />
                    Fraud Scan
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs lg:text-sm border-primary/30 text-foreground hover:bg-primary hover:text-black">
                    <Gavel className="w-4 h-4 mr-2" />
                    Issue Penalty
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs lg:text-sm border-primary/30 text-foreground hover:bg-primary hover:text-black">
                    <Key className="w-4 h-4 mr-2" />
                    OTP Verification
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs lg:text-sm border-primary/30 text-foreground hover:bg-primary hover:text-black">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Documents
                  </Button>
                  {invites.length > 0 && (
                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-black text-xs lg:text-sm">
                      New Invites: {invites.length}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div> */}


        {/* Statistics Cards - Mobile First */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-6"
        >
          <Card className="bg-background border border-primary/30 shadow-sm">
            <CardContent className="p-3 lg:p-6">
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/30">
                  <Users className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
                </div>
                <div>
                  <div className="text-lg lg:text-2xl font-bold text-text">{applications.length}</div>
                  <div className="text-xs lg:text-sm text-text-secondary">Total</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background border border-primary/30 shadow-sm">
            <CardContent className="p-3 lg:p-6">
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="w-8 h-8 lg:w-10 lg:h-10 
                 rounded-lg flex items-center justify-center border border-primary/30">
                  <Clock className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
                </div>
                <div>
                  <div className="text-lg lg:text-2xl font-bold text-text">{(stats as any)?.byStatus?.find?.((x: any) => x._id==='submitted')?.count || 0}</div>
                  <div className="text-xs lg:text-sm text-text-secondary">Submitted</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background border border-primary/30 shadow-sm">
            <CardContent className="p-3 lg:p-6">
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/30">
                  <Clock3 className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
                </div>
                <div>
                  <div className="text-lg lg:text-2xl font-bold text-text">{(stats as any)?.byStatus?.find?.((x: any) => x._id==='under_review')?.count || 0}</div>
                  <div className="text-xs lg:text-sm text-text-secondary">Review</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background border border-primary/30 shadow-sm">
            <CardContent className="p-3 lg:p-6">
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-accent/10 rounded-lg flex items-center justify-center border border-accent/30">
                  <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5 text-accent" />
                </div>
                <div>
                  <div className="text-lg lg:text-2xl font-bold text-text">{(stats as any)?.byStatus?.find?.((x: any) => x._id==='approved')?.count || 0}</div>
                  <div className="text-xs lg:text-sm text-text-secondary">Approved</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>



        {/* Fraud Detection Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="border-l-4 border-l-[#e7b555] bg-background shadow-sm">
            <CardContent className="p-4 lg:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex items-center space-x-3 lg:space-x-4">
                  <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/30">
                    <Shield className="h-5 w-5 lg:h-6 lg:w-6" />
                  </div>
                  <div>
                    <h3 className="text-base lg:text-lg font-semibold text-caption">Security Monitor</h3>
                    <p className="text-sm text-foreground">
                      {fraudAlerts?.filter(alert => alert.status === 'open').length} active alerts • 
                      {penalties?.filter(penalty => penalty.status === 'pending').length} pending penalties
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 lg:gap-3">
                  <Button size="sm" className="bg-primary hover:bg-primary/90 text-text text-xs lg:text-sm">
                    <Activity className="w-4 h-4 mr-2" />
                    View Alerts
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs lg:text-sm border-primary/30 text-foreground hover:bg-primary hover:text-black" onClick={loadDashboardData}>
                    <Clock3 className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content - Mobile Tabs */}
        <div className="lg:hidden">
          {/* Applications Tab */}
          {activeTab === 'applications' && (
            <div className="space-y-4">
              {/* Search and Filters */}
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Search applications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <FilterIcon className="w-4 h-4" />
                  </Button>
                </div>

                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-3 p-3 bg-surface-light rounded-lg"
                  >
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="under_review">Under Review</SelectItem>
                        <SelectItem value="docs_required">Documents Required</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </motion.div>
                )}
              </div>


              {/* Applications List */}
              <div className="space-y-3">
                        {filteredApplications.map((application) => {
                  const isExpanded = expandedRows.has(application._id)
                  return (
                    <Card key={application._id} className={`bg-background border transition-all duration-200 ${
                      isExpanded ? 'border-primary shadow-md' : 'border-primary/20 hover:border-primary/40'
                    }`}>
                      <CardContent className="p-0">
                        <div className="space-y-0">
                          {/* Main Row - Clickable */}
                          <div 
                            className="flex items-start justify-between cursor-pointer p-4 hover:bg-primary/5 transition-colors"
                            onClick={() => toggleRowExpansion(application._id)}
                          >
                          <div className="flex-1">
                              <div className="flex items-center gap-2">
                            <h3 className="font-medium text-foreground">
                              {application.sponsor.firstName} {application.sponsor.lastName}
                            </h3>
                                <Badge variant="outline" className="text-[10px]">
                              {application.applicationType.replace('_', ' ')}
                                </Badge>
                              </div>
                              <p className="text-sm text-text-secondary">{application.sponsor.email}</p>
                              <p className="text-xs text-text-muted">
                                {new Date(application.metadata.submittedAt||'').toLocaleDateString()}
                            </p>
                          </div>
                            <div className="flex items-center gap-2">
                          {getStatusBadge(application.status)}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleStatusUpdateClick(application._id, application.status)
                                }}
                                className="text-xs px-2 py-1"
                                title="Update Status"
                              >
                                <AlertCircle className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs px-2 py-1"
                                title={isExpanded ? 'Collapse' : 'Expand'}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                        </div>

                          {/* Expanded Content */}
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="border-t border-border/50 bg-surface-light/50"
                            >
                              <div className="p-4 space-y-4">
                                {/* Quick Stats */}
                                <div className="grid grid-cols-3 gap-3 text-xs">
                                  <div className="flex flex-col items-center p-2 bg-background rounded-md border border-border/50">
                                    <FileCheck className="w-4 h-4 text-primary mb-1" />
                                    <span className="font-medium text-foreground">{application.attachments.length}</span>
                                    <span className="text-text-muted">Documents</span>
                                  </div>
                                  <div className="flex flex-col items-center p-2 bg-background rounded-md border border-border/50">
                                    <Clock className="w-4 h-4 text-primary mb-1" />
                                    <span className="font-medium text-foreground">
                              {new Date(application.metadata.submittedAt||'').toLocaleDateString()}
                            </span>
                                    <span className="text-text-muted">Submitted</span>
                                  </div>
                                  <div className="flex flex-col items-center p-2 bg-background rounded-md border border-border/50">
                                    <Users className="w-4 h-4 text-primary mb-1" />
                                    <span className="font-medium text-foreground capitalize">{application.applicationType.replace('_', ' ')}</span>
                                    <span className="text-text-muted">Type</span>
                                  </div>
                          </div>
                          
                                {/* Document Preview */}
                          {application.attachments.length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                                      <FileText className="w-4 h-4" />
                                      Uploaded Documents
                                    </h4>
                            <div className="flex flex-wrap gap-1">
                                      {application.attachments.map((doc: any, idx: number) => (
                                        <Badge key={idx} variant="secondary" className="text-[9px] px-2 py-1">
                                          {doc.type?.replace(/_/g, ' ') || 'Document'}
                                </Badge>
                              ))}
                            </div>
                        </div>
                                )}

                                {/* Action Buttons */}
                                <div className="space-y-2">
                                  <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                                      className="text-xs hover:bg-primary hover:text-black"
                                      onClick={(e) => {
                                        e.stopPropagation()
                              setSelectedApplication(application);
                              setShowApplicationDetails(true);
                            }}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            {t('amerDashboard.viewDetails')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                                      className="text-xs hover:bg-primary hover:text-black"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDocumentUpload(application._id)
                                      }}
                          >
                            <Upload className="w-3 h-3 mr-1" />
                                      Upload Docs
                                    </Button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <Button
                                      variant="default"
                                      size="sm"
                                      className="text-xs bg-primary hover:bg-primary/90 text-black"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleResultDocumentUpload(application._id)
                                      }}
                                    >
                                      <FileText className="w-3 h-3 mr-1" />
                                      Upload Result
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                                      className="text-xs hover:bg-primary hover:text-black"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDocumentReview(application._id)
                                      }}
                            disabled={!application.attachments?.length}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Review ({application.attachments?.length || 0})
                          </Button>
                        </div>
                                </div>
                              </div>
                            </motion.div>
                          )}

                      </div>
                    </CardContent>
                  </Card>
                  )
                })}

                {filteredApplications.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-text-secondary">No applications found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Other tabs content would go here */}
          {activeTab !== 'applications' && (
            <div className="text-center py-12">
              <p className="text-text-secondary">This tab is under development</p>
            </div>
          )}
        </div>

        {/* Desktop Content */}
        <div className="hidden lg:block">
          <Tabs defaultValue="applications" className="w-full">
            <TabsList className="grid w-full grid-cols-7 bg-background border border-primary/30 p-1 rounded-lg shadow-sm mb-8">
              <TabsTrigger value="applications" className="data-[state=active]:bg-primary data-[state=active]:text-black rounded-md">Applications</TabsTrigger>
              <TabsTrigger value="package-applications" className="data-[state=active]:bg-primary data-[state=active]:text-black rounded-md">Package Applications</TabsTrigger>
              
              <TabsTrigger value="checks" className="data-[state=active]:bg-primary data-[state=active]:text-black rounded-md">Status Checks</TabsTrigger>
              <TabsTrigger value="fraud" className="data-[state=active]:bg-primary data-[state=active]:text-black rounded-md">Fraud</TabsTrigger>
              <TabsTrigger value="penalties" className="data-[state=active]:bg-primary data-[state=active]:text-black rounded-md">Penalties</TabsTrigger>
              <TabsTrigger value="otp" className="data-[state=active]:bg-primary data-[state=active]:text-black rounded-md">OTP</TabsTrigger>
              <TabsTrigger value="statistics" className="data-[state=active]:bg-primary data-[state=active]:text-black rounded-md">Statistics</TabsTrigger>
              <TabsTrigger value="conversations" className="data-[state=active]:bg-primary data-[state=active]:text-black rounded-md">Chat</TabsTrigger>
            </TabsList>
            <TabsContent value="package-applications" className="space-y-6">
              <PackageApplicationsAdmin />
            </TabsContent>
            <TabsContent value="conversations" className="space-y-6">
              {invites.length > 0 && (
                <Card className="bg-primary/5 border border-primary/30 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-black">
                        <strong>{invites[0].userName || 'User'}</strong> requests assistance • Service: {invites[0].service || 'N/A'}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-primary hover:bg-primary/90 text-black"
                          onClick={() => {
                            const inv = invites[0]
                            const socket = getSocket()
                            // Use the new officer_accept_request format
                            socket.emit('officer_accept_request', { requestId: inv.requestId || inv.roomId })
                            setInvites(prev => prev.slice(1))
                            // Optimistically open room
                            setRooms(prev => prev.find(r => r.roomId === inv.roomId) ? prev : [{ roomId: inv.roomId, userName: inv.userName, service: inv.service, unread: 0 }, ...prev])
                            setCurrentRoomId(inv.roomId)
                          }}
                        >
                          Accept & Join
                        </Button>
                        <Button size="sm" variant="outline" className="border-primary/30 text-foreground hover:bg-primary hover:text-black" onClick={() => setInvites(prev => prev.slice(1))}>Dismiss</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              <Card className="bg-background border border-primary/30 shadow-sm">
                <CardContent className="p-0">
                  <div className="grid grid-cols-12 h-[70vh]">
                    {/* Rooms list */}
                    <div className="col-span-4 border-r border-border p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-accent">Active Rooms</h3>
                        <Badge variant="outline" className="text-xs">{rooms.length}</Badge>
                      </div>
                      <div className="space-y-2 overflow-y-auto h-[calc(70vh-56px)] pr-1">
                        {rooms.map((room) => (
                          <button
                            key={room.roomId}
                            onClick={() => {
                              setCurrentRoomId(room.roomId)
                              setRooms(prev => prev.map(r => r.roomId === room.roomId ? { ...r, unread: 0 } : r))
                              const socket = getSocket()
                              const officerId = (user as any)?.id || (user as any)?._id || (user as any)?.userId
                              socket.emit('join_chat_room', { roomId: room.roomId, userId: officerId, officerId })
                            }}
                            className={`w-full text-left p-3 rounded-lg border ${currentRoomId === room.roomId ? 'border-primary bg-primary/10' : 'border-border hover:bg-surface-light'}`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-medium text-foreground">{room.userName || 'User'}</div>
                                <div className="text-xs text-text-secondary truncate">{room.service || 'General'}</div>
                              </div>
                              {room.unread > 0 && (
                                <Badge className="text-[10px] h-5">{room.unread}</Badge>
                              )}
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px]">{room.roomId}</Badge>
                            </div>
                          </button>
                        ))}
                        {rooms.length === 0 && (
                          <div className="text-sm text-text-secondary">No active rooms. Accept an invite to start.</div>
                        )}
                      </div>
                    </div>
                    {/* Chat panel */}
                    <div className="col-span-8 flex flex-col">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                        <div>
                          <div className="text-sm font-semibold text-foreground">{rooms.find(r => r.roomId === currentRoomId)?.userName || 'Select a room'}</div>
                          <div className="text-xs text-text-secondary">{rooms.find(r => r.roomId === currentRoomId)?.service || ''}</div>
                        </div>
                        {currentRoomId && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => {
                              const socket = getSocket()
                              const officerId = (user as any)?.id || (user as any)?._id || (user as any)?.userId
                              socket.emit('leave_chat_room', { roomId: currentRoomId, userId: officerId })
                              setRooms(prev => prev.filter(r => r.roomId !== currentRoomId))
                              setCurrentRoomId(null)
                            }}>Leave</Button>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-surface-light max-h-[calc(70vh-12rem)]">
                        {(messagesByRoom[currentRoomId || ''] || []).map((m, idx) => {
                          const mine = ((user as any)?.id || (user as any)?._id || (user as any)?.userId) === m.sender
                          return (
                            <div key={`${m.id || 'm'}-${idx}`} className={`max-w-[75%] ${mine ? 'ml-auto' : ''}`}>
                              <div className={`rounded-2xl px-3 py-2 text-sm ${m.type === 'system' ? 'bg-warning/10 text-yellow-800 border border-warning/30' : mine ? 'bg-primary text-white' : 'bg-background border border-border'}`}>
                                {m.type === 'file' ? (
                                  <>
                                  <img src={apiBase+m.metadata?.fileUrl} alt={m.metadata?.fileName || 'File'} className="w-10 h-10 object-cover sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-24 lg:h-24" />
                                  <a href={apiBase+m.metadata?.fileUrl} target="_blank" className="underline">
                                    {m.metadata?.fileName || 'File'}
                                  </a>
                                  </>
                                ) : (
                                  <span>{m.content}</span>
                                )}
                              </div>
                              <div className="text-[10px] text-text-muted mt-1">{new Date(m.timestamp).toLocaleTimeString()}</div>
                            </div>
                          )
                        })}
                        {typingByRoom[currentRoomId || ''] && (
                          <div className="text-xs text-text-secondary">Typing…</div>
                        )}
                        <div ref={chatEndRef} />
                      </div>
                      <div className="p-3 border-t border-border">
                        <div
                          onDragOver={(e) => { e.preventDefault() }}
                          onDrop={async (e) => {
                            e.preventDefault()
                            if (!currentRoomId) return
                            const file = e.dataTransfer.files?.[0]
                            if (!file) return
                            const token = localStorage.getItem('authToken') || ''
                            // Upload via HTTP, then broadcast via WS so both ends have a stable URL
                            const form = new FormData()
                            form.append('file', file)
                            form.append('roomId', currentRoomId)
                            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/chat/upload?roomId=${currentRoomId}`, {
                              method: 'POST',
                              headers: { Authorization: `Bearer ${token}` },
                              body: form
                            })
                            if (!res.ok) return
                            const data = await res.json()
                            const { fileUrl, fileName } = data.data || {}
                            const socket = getSocket()
                            const officerId = (user as any)?.id || (user as any)?._id || (user as any)?.userId
                            socket.emit('file_upload_start', { roomId: currentRoomId, userId: officerId, fileName: file.name, fileSize: file.size })
                            socket.emit('file_upload_complete', { roomId: currentRoomId, userId: officerId, fileUrl, fileName: fileName || file.name, fileSize: file.size })
                          }}
                          className="mb-2 p-2 rounded-lg border border-dashed border-border text-xs text-text-secondary hover:border-gray-400"
                        >
                          Drag & drop to share a document in this room
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`flex-1 flex items-center gap-2 border rounded-full px-3 py-2 ${currentRoomId ? 'bg-background' : 'bg-surface'}`}>
                            <button
                              className="text-text-secondary hover:text-foreground disabled:opacity-50"
                              disabled={!currentRoomId}
                              onClick={() => {
                                const el = document.createElement('input')
                                el.type = 'file'
                                el.onchange = async (e: any) => {
                                  const file = e.target.files?.[0]
                                  if (!file || !currentRoomId) return
                                  const token = localStorage.getItem('authToken') || ''
                                  const form = new FormData()
                                  form.append('file', file)
                                  form.append('roomId', currentRoomId)
                                  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/chat/upload?roomId=${currentRoomId}`, {
                                    method: 'POST',
                                    headers: { Authorization: `Bearer ${token}` },
                                    body: form
                                  })
                                  if (!res.ok) return
                                  const data = await res.json()
                                  const { fileUrl, fileName } = data.data || {}
                                  const socket = getSocket()
                                  const officerId = (user as any)?.id || (user as any)?._id || (user as any)?.userId
                                  socket.emit('file_upload_start', { roomId: currentRoomId, userId: officerId, fileName: file.name, fileSize: file.size })
                                  socket.emit('file_upload_complete', { roomId: currentRoomId, userId: officerId, fileUrl, fileName: fileName || file.name, fileSize: file.size })
                                }
                                el.click()
                              }}
                              title="Attach file"
                            >
                              <Upload className="w-4 h-4" />
                            </button>
                            <Input
                              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                              placeholder={currentRoomId ? 'Type a message…' : 'Select a room to start chatting'}
                              value={chatInput}
                              onChange={(e) => {
                                setChatInput(e.target.value)
                                if (currentRoomId) {
                                  const socket = getSocket()
                                  const officerId = (user as any)?.id || (user as any)?._id || (user as any)?.userId
                                  socket.emit('typing_start', { roomId: currentRoomId, userId: officerId })
                                }
                              }}
                              onBlur={() => {
                                if (currentRoomId) {
                                  const socket = getSocket()
                                  const officerId = (user as any)?.id || (user as any)?._id || (user as any)?.userId
                                  socket.emit('typing_stop', { roomId: currentRoomId, userId: officerId })
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault()
                                  if (!chatInput.trim() || !currentRoomId) return
                                  const socket = getSocket()
                                  
                                  console.log('Officer sending message:', chatInput.trim(), 'to room:', currentRoomId)
                                  console.log('Socket connected:', socket.connected)
                                  
                                  // Add message to local chat immediately for UI feedback
                                  const officerMessage = {
                                    id: Date.now().toString(),
                                    type: 'amer',
                                    content: chatInput.trim(),
                                    sender: 'amer',
                                    timestamp: new Date().toISOString(),
                                    metadata: { roomId: currentRoomId }
                                  }
                                  
                                  setMessagesByRoom(prev => ({
                                    ...prev,
                                    [currentRoomId]: [...(prev[currentRoomId] || []), officerMessage]
                                  }))
                                  
                                  // Use the new chat_message format
                                  socket.emit('chat_message', { 
                                    message: chatInput.trim(), 
                                    chatId: currentRoomId, 
                                    type: 'text' 
                                  })
                                  setChatInput('')
                                  
                                  // Auto-scroll
                                  setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
                                }
                              }}
                              disabled={!currentRoomId}
                            />
                          </div>
                          <Button
                            onClick={() => {
                              if (!chatInput.trim() || !currentRoomId) return
                              const socket = getSocket()
                              
                              console.log('Officer sending message (button):', chatInput.trim(), 'to room:', currentRoomId)
                              console.log('Socket connected:', socket.connected)
                              
                              // Add message to local chat immediately for UI feedback
                              const officerMessage = {
                                id: Date.now().toString(),
                                type: 'amer',
                                content: chatInput.trim(),
                                sender: 'amer',
                                timestamp: new Date().toISOString(),
                                metadata: { roomId: currentRoomId }
                              }
                              
                              setMessagesByRoom(prev => ({
                                ...prev,
                                [currentRoomId]: [...(prev[currentRoomId] || []), officerMessage]
                              }))
                              
                              // Use the new chat_message format
                              socket.emit('chat_message', { 
                                message: chatInput.trim(), 
                                chatId: currentRoomId, 
                                type: 'text' 
                              })
                              setChatInput('')
                              
                              // Auto-scroll
                              setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
                            }}
                            disabled={!currentRoomId}
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="applications" className="space-y-6">
              {/* Live Invites */}
              {invites.length > 0 && (
                <Card className="bg-primary/10 border border-primary/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-blue-900">
                        <strong>{invites[0].userName || 'User'}</strong> requests assistance • Service: {invites[0].service || 'N/A'}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-primary hover:bg-blue-700 text-white"
                          onClick={() => {
                            const socket = getSocket()
                            socket.emit('amer_accept_invite', { roomId: invites[0].roomId })
                            setInvites(prev => prev.slice(1))
                            toast('Joined conversation', { description: `Room ${invites[0].roomId}` })
                          }}
                        >
                          Accept & Join
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setInvites(prev => prev.slice(1))}>Dismiss</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              {/* Desktop Applications Table */}
              <Card className="bg-background">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Visa Applications ({filteredApplications.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 font-medium text-foreground">Applicant</th>
                          <th className="text-left py-3 px-4 font-medium text-foreground">Type</th>
                          <th className="text-left py-3 px-4 font-medium text-foreground">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-foreground">Documents</th>
                          <th className="text-left py-3 px-4 font-medium text-foreground">Submitted</th>
                          <th className="text-left py-3 px-4 font-medium text-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredApplications.map((application) => {
                          const isExpanded = expandedRows.has(application._id)
                          return (
                          <React.Fragment key={application._id}>
                          <tr
                            className="border-b border-gray-100 hover:bg-surface-light cursor-pointer transition-colors"
                            onClick={() => toggleRowExpansion(application._id)}
                          >
                            <td className="py-4 px-4">
                              <div>
                                <div className="font-medium text-foreground">
                                  {application.sponsor.firstName} {application.sponsor.lastName}
                                </div>
                                <div className="text-sm text-text-secondary">{application.sponsor.email}</div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="capitalize text-foreground">
                                {application.applicationType.replace('_', ' ')}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              {getStatusBadge(application.status)}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <FileCheck className="w-4 h-4 text-text-secondary" />
                                <span className="text-sm text-foreground">
                                  {application.attachments.length} docs
                                </span>
                                {application.attachments.length > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    Ready for Review
                                  </Badge>
                                )}
                              </div>
                              {/* Preview of document types */}
                              {application.attachments.length > 0 && (
                                <div className="mt-1">
                                  <div className="flex flex-wrap gap-1">
                                    {application.attachments.slice(0, 3).map((doc: any, idx: number) => (
                                      <Badge key={idx} variant="secondary" className="text-[10px] text-text-secondary px-1">
                                        {doc.type?.replace(/_/g, ' ') || 'Document'}
                                      </Badge>
                                    ))}
                                    {application.attachments.length > 3 && (
                                      <Badge variant="secondary" className="text-[10px] text-text-secondary px-1">
                                        +{application.attachments.length - 3} more
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-sm text-foreground">{application.metadata.submittedAt ? new Date(application.metadata.submittedAt).toLocaleDateString() : '-'}</div>
                            </td>
                            <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                              <div className="flex gap-2 items-center">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleStatusUpdateClick(application._id, application.status)}
                                  title="Update Status"
                                >
                                  <AlertCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleResultDocumentUpload(application._id)}
                                  className="bg-primary/10 hover:bg-primary hover:text-black"
                                  title="Upload Result"
                                >
                                  <FileText className="w-4 h-4" />
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => {
                                      setSelectedApplication(application);
                                      setShowApplicationDetails(true);
                                    }}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      {t('amerDashboard.viewDetails')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDocumentUpload(application._id)}>
                                      <Upload className="mr-2 h-4 w-4" />
                                      {t('amerDashboard.uploadDocuments')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDocumentReview(application._id)} disabled={!application.attachments?.length}>
                                      <FileCheck className="mr-2 h-4 w-4" />
                                      {t('amerDashboard.reviewDocuments')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleRequestOTP(application._id)}>
                                      <Key className="mr-2 h-4 w-4" />
                                      {t('amerDashboard.requestOTP')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleFraudCheck(application._id)}>
                                      <Shield className="mr-2 h-4 w-4" />
                                      {t('amerDashboard.fraudCheck')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleSetGovStage(application._id, 'mohre_pending')}>
                                      <Shield className="mr-2 h-4 w-4" /> MOHRE Pending
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleSetGovStage(application._id, 'gdrfa_pending')}>
                                      <Shield className="mr-2 h-4 w-4" /> GDRFA Pending
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleSetGovStage(application._id, 'icp_pending')}>
                                      <Shield className="mr-2 h-4 w-4" /> ICP Pending
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="ml-2"
                                  title={isExpanded ? 'Collapse' : 'Expand'}
                                >
                                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </Button>
                              </div>
                            </td>
                          </tr>
                          
                          {/* Expanded Row Details */}
                          {isExpanded && (
                            <tr className="bg-surface-light/50">
                              <td colSpan={6} className="p-0">
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="p-6"
                                >
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Application Details */}
                                    <div className="space-y-4">
                                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-primary" />
                                        Application Details
                                      </h4>
                                      <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                          <span className="text-text-secondary">Application ID:</span>
                                          <span className="font-medium">{application._id.slice(-8)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-text-secondary">Type:</span>
                                          <span className="font-medium capitalize">{application.applicationType.replace(/_/g, ' ')}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-text-secondary">Status:</span>
                                          <div>{getStatusBadge(application.status)}</div>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-text-secondary">Submitted:</span>
                                          <span className="font-medium">
                                            {application.metadata.submittedAt 
                                              ? new Date(application.metadata.submittedAt).toLocaleString()
                                              : 'Not submitted'}
                                          </span>
                                        </div>
                                        {(application.metadata as any).govStage && (
                                          <div className="flex justify-between">
                                            <span className="text-text-secondary">Gov Stage:</span>
                                            <Badge variant="outline">{(application.metadata as any).govStage}</Badge>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Documents */}
                                    <div className="space-y-4">
                                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                                        <FileCheck className="w-4 h-4 text-primary" />
                                        Documents ({application.attachments.length})
                                      </h4>
                                      {application.attachments.length > 0 ? (
                                        <div className="space-y-2">
                                          {application.attachments.slice(0, 5).map((doc: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between p-2 bg-background rounded border border-border/50">
                                              <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-primary" />
                                                <span className="text-xs">{doc.type?.replace(/_/g, ' ') || 'Document'}</span>
                                              </div>
                                              <Badge variant={doc.status === 'approved' ? 'default' : 'secondary'} className="text-xs">
                                                {doc.status || 'pending'}
                                              </Badge>
                                            </div>
                                          ))}
                                          {application.attachments.length > 5 && (
                                            <p className="text-xs text-text-muted text-center">
                                              +{application.attachments.length - 5} more documents
                                            </p>
                                          )}
                                        </div>
                                      ) : (
                                        <p className="text-sm text-text-secondary">No documents uploaded yet</p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Quick Actions */}
                                  <div className="mt-6 pt-4 border-t border-border/50">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedApplication(application);
                                          setShowApplicationDetails(true);
                                        }}
                                        className="hover:bg-primary hover:text-black"
                                      >
                                        <Eye className="w-4 h-4 mr-2" />
                                        View Full Details
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDocumentUpload(application._id);
                                        }}
                                        className="hover:bg-primary hover:text-black"
                                      >
                                        <Upload className="w-4 h-4 mr-2" />
                                        Upload Docs
                                      </Button>
                                      <Button
                                        variant="default"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleResultDocumentUpload(application._id);
                                        }}
                                        className="bg-primary hover:bg-primary/90 text-black"
                                      >
                                        <FileText className="w-4 h-4 mr-2" />
                                        Upload Result
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDocumentReview(application._id);
                                        }}
                                        disabled={!application.attachments?.length}
                                        className="hover:bg-primary hover:text-black"
                                      >
                                        <FileCheck className="w-4 h-4 mr-2" />
                                        Review ({application.attachments?.length || 0})
                                      </Button>
                                    </div>
                                  </div>
                                </motion.div>
                              </td>
                            </tr>
                          )}
                          </React.Fragment>
                        )}
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Other tabs would be implemented similarly */}
            <TabsContent value="fraud" className="space-y-6">
              <div className="text-center py-12">
                <p className="text-text-secondary">Fraud Detection panel under development</p>
              </div>
            </TabsContent>

            <TabsContent value="penalties" className="space-y-6">
              <div className="text-center py-12">
                <p className="text-text-secondary">Penalty Management panel under development</p>
              </div>
            </TabsContent>

            <TabsContent value="otp" className="space-y-6">
              <Card className="bg-background">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-text-secondary">Send and verify OTP with custom expiry</div>
                      <div className="text-xs text-text-secondary">Use the Actions menu on any application to request OTP</div>
                    </div>
                    <Button onClick={() => selectedApplication ? handleRequestOTP((selectedApplication as any)?._id) : undefined} disabled={!selectedApplication}>Request OTP for selected</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="checks" className="space-y-6">
              <ChecksReviewPanel />
            </TabsContent>

            <TabsContent value="statistics" className="space-y-6">
              <div className="text-center py-12">
                <p className="text-text-secondary">Statistics dashboard under development</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Document Upload Dialog */}
      <DocumentUploadDialog
        open={showDocumentUpload}
        onOpenChange={setShowDocumentUpload}
        applicationId={(selectedApplication as any)?._id || (selectedApplication as any)?.id || ''}
        onUploadComplete={() => {
          handleDocumentsUploaded([]);
          fetchAllApplications();
        }}
        isResultDocument={false}
      />

      <ApplicationDetailsDrawer
        isOpen={showApplicationDetails}
        onClose={() => setShowApplicationDetails(false)}
        application={selectedApplication}
        onStatusUpdate={handleStatusUpdateOriginal}
        onDocumentUpload={handleDocumentUpload}
        onRequestDocuments={async (id, requested, note) => {
          await requestAdditionalDocuments(id, requested, note)
          // Ensure list refresh to reflect status change
          await fetchAllApplications()
        }}
      />

      {/* OTP Request & Verify Dialog */}
      <Dialog open={showOtpDialog} onOpenChange={setShowOtpDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request OTP</DialogTitle>
            <DialogDescription>
              Send a one-time code to the applicant and verify within the selected time.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {[2,3,5].map(m => (
                <Button key={m} variant={otpMinutes===m? 'default':'outline'} onClick={() => setOtpMinutes(m)}>{m} min</Button>
              ))}
            </div>
            <div>
              <Label className="text-xs">Applicant Phone</Label>
              <Input value={otpPhone} onChange={(e)=>setOtpPhone(e.target.value)} placeholder="e.g. +9715xxxxxxxx" />
            </div>
            {!otpExpiresAt && (
              <Button disabled={!otpPhone || otpLoading} onClick={async ()=>{
                try {
                  setOtpLoading(true)
                  const token = localStorage.getItem('authToken') || ''
                  await fetch(`${apiBase}/api/v1/auth/otp/request`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ phoneNumber: otpPhone, expiresInMinutes: otpMinutes })
                  })
                  const expire = Date.now() + otpMinutes*60*1000
                  setOtpExpiresAt(expire)
                  toast.success('OTP sent to applicant')
                } catch (e) {
                  console.error(e)
                  toast.error('Failed to send OTP')
                } finally { setOtpLoading(false) }
              }} className="w-full">Send OTP</Button>
            )}
            {otpExpiresAt && (
              <div className="space-y-2">
                <div className="text-xs text-text-secondary">Expires in {otpCountdown}</div>
                <Input 
                  maxLength={6} 
                  value={otpCode} 
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))} 
                  placeholder={t('otp.enterCode')}
                  className="text-center text-lg font-mono tracking-widest bg-background border-border text-foreground focus:border-primary"
                />
                <div className="flex gap-2">
                  <Button className="flex-1" disabled={otpCode.length!==6 || otpLoading} onClick={async ()=>{
                    try {
                      setOtpLoading(true)
                      const token = localStorage.getItem('authToken') || ''
                      const res = await fetch(`${apiBase}/api/v1/auth/otp/verify`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ phoneNumber: otpPhone, code: otpCode })
                      })
                      const data = await res.json()
                      if (res.ok && (data?.success || data?.status==='success')) {
                        toast.success('OTP verified')
                        setShowOtpDialog(false)
                      } else {
                        toast.error(data?.message || 'Invalid code')
                      }
                    } catch (e) {
                      console.error(e)
                      toast.error('Verification failed')
                    } finally { setOtpLoading(false) }
                  }}>Verify</Button>
                  <Button variant="outline" onClick={()=>{ setOtpExpiresAt(null); setOtpCode('') }}>Resend</Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Review Dialog */}
      <DocumentReviewDialog
        open={showDocumentReview}
        onOpenChange={setShowDocumentReview}
        documents={(selectedApplication?.attachments || []).map((att: any) => ({
          ...att,
          status: att.status || 'pending'
        }))}
        applicationId={selectedApplication?._id || ''}
        onReview={handleAttachmentReview}
      />

      {/* Status Update Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Application Status</DialogTitle>
            <DialogDescription>
              Change the status of this application and add a note if needed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Current Status</Label>
              <div className="mt-1">
                {statusUpdateData && getStatusBadge(statusUpdateData.currentStatus)}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">New Status</Label>
              <Select 
                value={statusUpdateData?.newStatus || ''} 
                onValueChange={(value) => setStatusUpdateData(prev => prev ? {...prev, newStatus: value} : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="docs_required">Documents Required</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">Note (Optional)</Label>
              <Input
                placeholder="Add a note about this status change..."
                value={statusUpdateData?.note || ''}
                onChange={(e) => setStatusUpdateData(prev => prev ? {...prev, note: e.target.value} : null)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  if (statusUpdateData) {
                    handleStatusUpdateDialog(statusUpdateData.applicationId, statusUpdateData.newStatus, statusUpdateData.note)
                  }
                }}
                className="flex-1"
              >
                Update Status
              </Button>
              <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Result Document Upload Dialog */}
      <DocumentUploadDialog
        open={showResultDocumentUpload}
        onOpenChange={setShowResultDocumentUpload}
        applicationId={(selectedApplication as any)?._id || (selectedApplication as any)?.id || ''}
        onUploadComplete={() => {
          fetchAllApplications();
        }}
        isResultDocument={true}
      />
    </div>
  );
};

export default AmerDashboard;
