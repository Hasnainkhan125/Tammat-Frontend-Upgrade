"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
import { Progress } from "../../../components/ui/progress"
import { Alert, AlertDescription } from "../../../components/ui/alert"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../components/ui/dialog"
import { 
  Shield, CheckCircle, AlertTriangle, Clock, FileText, Users, Globe, Gavel, 
  RefreshCw, Download, Eye, ExternalLink, Building2, Upload, Calendar, 
  XCircle, Bell, Briefcase, Plus, Sparkles, TrendingUp, Award, Zap,
  BarChart3, Layers, Target, Star, Gem, Crown, Heart, Gift
} from 'lucide-react'
import { toast } from "sonner"
import { Layout } from "./Layout"
import { useAuth } from "@/contexts/AuthContext"
import { motion, AnimatePresence } from "framer-motion"

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'

interface UserDocument {
  _id: string
  type: string
  path: string
  uploadDate: string
  expiryDate?: string
  documentNumber?: string
  issuedBy?: string
  issuedDate?: string
  status: 'valid' | 'expiring_soon' | 'expired' | 'pending'
  notificationSent?: boolean
}

interface ComplianceData {
  complianceScore: number
  expiringDocuments: Array<{
    documentId: string
    documentType: string
    expiryDate: string
    daysRemaining: number
    status: string
  }>
  totalDocuments: number
  expiredCount: number
  expiringSoonCount: number
  business?: any
}

const CompliancePage = () => {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [complianceData, setComplianceData] = useState<ComplianceData | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploadDocType, setUploadDocType] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadExpiryDate, setUploadExpiryDate] = useState('')
  const [uploadDocNumber, setUploadDocNumber] = useState('')

  // Business management state
  const [showBusinessDialog, setShowBusinessDialog] = useState(false)
  const [businessData, setBusinessData] = useState({
    hasCompany: false,
    companyName: '',
    establishmentType: '',
    businessActivity: '',
    tradeLicenseNumber: '',
    tradeLicenseExpiry: ''
  })

  useEffect(() => {
    loadComplianceData()
    loadUserProfile()
  }, [user])

  const loadComplianceData = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('authToken')
      const userId = (user as any)?.id || (user as any)?._id || (user as any)?.userId
      
      const response = await fetch(`${apiBase}/api/v1/user/${userId}/compliance`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setComplianceData(data)
      }
    } catch (error) {
      console.error('Error loading compliance data:', error)
      toast.error('Failed to load compliance data')
    } finally {
      setIsLoading(false)
    }
  }

  const loadUserProfile = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const userId = (user as any)?.id || (user as any)?._id || (user as any)?.userId
      
      const response = await fetch(`${apiBase}/api/v1/user/${userId}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUserProfile(data)
        
        if (data.business) {
          setBusinessData({
            hasCompany: data.business.hasCompany || false,
            companyName: data.business.companyName || '',
            establishmentType: data.business.establishmentType || '',
            businessActivity: data.business.businessActivity || '',
            tradeLicenseNumber: data.business.tradeLicense?.number || '',
            tradeLicenseExpiry: data.business.tradeLicense?.expiryDate || ''
          })
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
    }
  }

  const handleUploadDocument = async () => {
    if (!uploadFile || !uploadDocType) {
      toast.error('Please select a file and document type')
      return
    }

    try {
      setIsLoading(true)
      const token = localStorage.getItem('authToken')
      const userId = (user as any)?.id || (user as any)?._id || (user as any)?.userId
      
      const formData = new FormData()
      formData.append('document', uploadFile)
      formData.append('type', uploadDocType)
      if (uploadExpiryDate) formData.append('expiryDate', uploadExpiryDate)
      if (uploadDocNumber) formData.append('documentNumber', uploadDocNumber)
      
      const response = await fetch(`${apiBase}/api/v1/user/${userId}/documents/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      
      if (response.ok) {
        toast.success('Document uploaded successfully')
        setShowUploadDialog(false)
        setUploadFile(null)
        setUploadDocType('')
        setUploadExpiryDate('')
        setUploadDocNumber('')
        loadComplianceData()
        loadUserProfile()
      } else {
        toast.error('Failed to upload document')
      }
    } catch (error) {
      console.error('Error uploading document:', error)
      toast.error('Failed to upload document')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateBusiness = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('authToken')
      const userId = (user as any)?.id || (user as any)?._id || (user as any)?.userId
      
      const payload = {
        hasCompany: businessData.hasCompany,
        companyName: businessData.companyName,
        establishmentType: businessData.establishmentType,
        businessActivity: businessData.businessActivity,
        tradeLicense: {
          number: businessData.tradeLicenseNumber,
          expiryDate: businessData.tradeLicenseExpiry
        }
      }
      
      const response = await fetch(`${apiBase}/api/v1/user/${userId}/business`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      })
      
      if (response.ok) {
        toast.success('Business information updated successfully')
        setShowBusinessDialog(false)
        loadUserProfile()
        loadComplianceData()
      } else {
        toast.error('Failed to update business information')
      }
    } catch (error) {
      console.error('Error updating business:', error)
      toast.error('Failed to update business information')
    } finally {
      setIsLoading(false)
    }
  }

  const getDocumentStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
      case 'expiring_soon':
        return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800'
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
    }
  }

  const getDocumentStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-4 w-4" />
      case 'expiring_soon':
        return <AlertTriangle className="h-4 w-4" />
      case 'expired':
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const stats = [
    {
      title: 'Compliance Score',
      value: `${complianceData?.complianceScore || 0}%`,
      icon: Shield,
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-black dark:text-white',
      progress: complianceData?.complianceScore || 0,
    },
    {
      title: 'Valid Documents',
      value: `${(complianceData?.totalDocuments || 0) - (complianceData?.expiredCount || 0) - (complianceData?.expiringSoonCount || 0)}`,
      icon: CheckCircle,
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-black dark:text-white',
    },
    {
      title: 'Expiring Soon',
      value: `${complianceData?.expiringSoonCount || 0}`,
      icon: AlertTriangle,
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-black dark:text-white',
    },
    {
      title: 'Expired',
      value: `${complianceData?.expiredCount || 0}`,
      icon: XCircle,
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-black dark:text-white',
    },
  ]

  return (
    <Layout>
      <div className="min-h-screen bg-white dark:bg-black p-4 md:p-6 transition-colors duration-200">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-black dark:text-white">
                Compliance Dashboard
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Monitor your documents and regulatory compliance</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                onClick={loadComplianceData} 
                disabled={isLoading}
                className="border-gray-300 dark:border-gray-700 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                onClick={() => setShowUploadDialog(true)}
                className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 shadow-lg shadow-black/25 dark:shadow-white/25"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="relative overflow-hidden border border-gray-200 dark:border-gray-800 shadow-lg bg-white dark:bg-black hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.title}</p>
                        <p className="text-2xl font-bold text-black dark:text-white mt-1">{stat.value}</p>
                      </div>
                      <div className={`p-2 rounded-xl ${stat.bg}`}>
                        <stat.icon className={`h-5 w-5 ${stat.text}`} />
                      </div>
                    </div>
                    {stat.progress !== undefined && (
                      <Progress value={stat.progress} className="mt-3 h-2 bg-gray-200 dark:bg-gray-700" />
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Urgent Alerts */}
          <AnimatePresence>
            {complianceData && (complianceData.expiredCount > 0 || complianceData.expiringSoonCount > 0) && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
                  <Bell className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <AlertDescription className="text-orange-900 dark:text-orange-200">
                    <strong>Action Required:</strong> You have {complianceData.expiredCount} expired and {complianceData.expiringSoonCount} expiring documents. Please renew them to maintain compliance.
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Tabs */}
          <Tabs defaultValue="documents" className="space-y-4">
            <TabsList className="bg-gray-100 dark:bg-gray-900 p-1 rounded-2xl border border-gray-200 dark:border-gray-700 w-full flex-wrap">
              <TabsTrigger 
                value="documents" 
                className="rounded-xl flex-1 data-[state=active]:bg-white dark:data-[state=active]:bg-black data-[state=active]:text-black dark:data-[state=active]:text-white data-[state=active]:shadow-sm text-gray-600 dark:text-gray-400"
              >
                Documents
              </TabsTrigger>
              <TabsTrigger 
                value="business" 
                className="rounded-xl flex-1 data-[state=active]:bg-white dark:data-[state=active]:bg-black data-[state=active]:text-black dark:data-[state=active]:text-white data-[state=active]:shadow-sm text-gray-600 dark:text-gray-400"
              >
                Business Setup
              </TabsTrigger>
              <TabsTrigger 
                value="regulations" 
                className="rounded-xl flex-1 data-[state=active]:bg-white dark:data-[state=active]:bg-black data-[state=active]:text-black dark:data-[state=active]:text-white data-[state=active]:shadow-sm text-gray-600 dark:text-gray-400"
              >
                Regulations
              </TabsTrigger>
              <TabsTrigger 
                value="notifications" 
                className="rounded-xl flex-1 data-[state=active]:bg-white dark:data-[state=active]:bg-black data-[state=active]:text-black dark:data-[state=active]:text-white data-[state=active]:shadow-sm text-gray-600 dark:text-gray-400"
              >
                Alerts
              </TabsTrigger>
            </TabsList>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-4">
              <Card className="border border-gray-200 dark:border-gray-800 shadow-xl bg-white dark:bg-black">
                <CardHeader className="border-b border-gray-200 dark:border-gray-800">
                  <CardTitle className="flex items-center gap-2 text-black dark:text-white">
                    <FileText className="h-5 w-5 text-black dark:text-white" />
                    Document Status
                  </CardTitle>
                  <CardDescription className="text-gray-500 dark:text-gray-400">Track expiration dates and renewal requirements</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <AnimatePresence>
                      {userProfile?.documents && userProfile.documents.length > 0 ? (
                        userProfile.documents.map((doc: UserDocument, index: number) => {
                          const expiryDate = doc.expiryDate ? new Date(doc.expiryDate) : null
                          const daysRemaining = expiryDate ? Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null
                          
                          return (
                            <motion.div
                              key={doc._id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <Card className={`border-2 ${getDocumentStatusColor(doc.status)} bg-white dark:bg-black`}>
                                <CardContent className="p-4">
                                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                    <div className="flex items-start gap-3 flex-1">
                                      <div className={`p-2 rounded-xl ${getDocumentStatusColor(doc.status)}`}>
                                        {getDocumentStatusIcon(doc.status)}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <h4 className="font-semibold text-black dark:text-white capitalize">
                                            {doc.type.replace(/_/g, ' ')}
                                          </h4>
                                          <Badge className={getDocumentStatusColor(doc.status)}>
                                            {doc.status.replace('_', ' ').toUpperCase()}
                                          </Badge>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 mt-2 text-sm">
                                          {doc.documentNumber && (
                                            <div className="flex items-center gap-1">
                                              <span className="text-gray-500 dark:text-gray-400">#</span>
                                              <span className="font-medium text-black dark:text-white truncate">{doc.documentNumber}</span>
                                            </div>
                                          )}
                                          {doc.issuedBy && (
                                            <div className="flex items-center gap-1">
                                              <span className="text-gray-500 dark:text-gray-400">Issued by:</span>
                                              <span className="font-medium text-black dark:text-white truncate">{doc.issuedBy}</span>
                                            </div>
                                          )}
                                          <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                                            <span className="text-gray-500 dark:text-gray-400">Uploaded:</span>
                                            <span className="font-medium text-black dark:text-white">{new Date(doc.uploadDate).toLocaleDateString()}</span>
                                          </div>
                                          {expiryDate && (
                                            <div className="flex items-center gap-1">
                                              <Clock className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                                              <span className="text-gray-500 dark:text-gray-400">Expires:</span>
                                              <span className={`font-medium ${daysRemaining && daysRemaining < 30 ? 'text-orange-600 dark:text-orange-400' : daysRemaining && daysRemaining < 0 ? 'text-red-600 dark:text-red-400' : 'text-black dark:text-white'}`}>
                                                {expiryDate.toLocaleDateString()}
                                                {daysRemaining !== null && (
                                                  <span className="ml-1 text-xs">
                                                    ({daysRemaining < 0 ? 'Expired' : `${daysRemaining} days`})
                                                  </span>
                                                )}
                                              </span>
                                            </div>
                                          )}
                                        </div>

                                        {doc.status === 'expiring_soon' && (
                                          <Alert className="mt-3 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
                                            <AlertTriangle className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                                            <AlertDescription className="text-xs text-orange-900 dark:text-orange-200">
                                              This document will expire soon. Please renew it to avoid service interruption.
                                            </AlertDescription>
                                          </Alert>
                                        )}

                                        {doc.status === 'expired' && (
                                          <Alert className="mt-3 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                                            <XCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
                                            <AlertDescription className="text-xs text-red-900 dark:text-red-200">
                                              This document has expired. Immediate renewal required.
                                            </AlertDescription>
                                          </Alert>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex gap-2 self-start sm:self-center">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.open(`${apiBase}/${doc.path}`, '_blank')}
                                        className="border-gray-300 dark:border-gray-700 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                                      >
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const link = document.createElement('a')
                                          link.href = `${apiBase}/${doc.path}`
                                          link.download = doc.type
                                          link.click()
                                        }}
                                        className="border-gray-300 dark:border-gray-700 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                                      >
                                        <Download className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          )
                        })
                      ) : (
                        <div className="text-center py-12">
                          <div className="mx-auto w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                            <FileText className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                          </div>
                          <p className="text-gray-500 dark:text-gray-400 mb-4">No documents uploaded yet</p>
                          <Button onClick={() => setShowUploadDialog(true)} className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200">
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Your First Document
                          </Button>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Business Setup Tab */}
            <TabsContent value="business" className="space-y-4">
              <Card className="border border-gray-200 dark:border-gray-800 shadow-xl bg-white dark:bg-black">
                <CardHeader className="border-b border-gray-200 dark:border-gray-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-black dark:text-white">
                        <Building2 className="h-5 w-5 text-black dark:text-white" />
                        Business Setup in UAE
                      </CardTitle>
                      <CardDescription className="text-gray-500 dark:text-gray-400">Manage your company information and trade license</CardDescription>
                    </div>
                    <Button 
                      onClick={() => setShowBusinessDialog(true)}
                      className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 shadow-lg shadow-black/25 dark:shadow-white/25"
                    >
                      {businessData.hasCompany ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Update Info
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Setup Business
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {businessData.hasCompany ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                          <Label className="text-xs text-gray-500 dark:text-gray-400">Company Name</Label>
                          <p className="font-medium text-black dark:text-white">{businessData.companyName || 'Not set'}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                          <Label className="text-xs text-gray-500 dark:text-gray-400">Establishment Type</Label>
                          <p className="font-medium text-black dark:text-white capitalize">{businessData.establishmentType || 'Not set'}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                          <Label className="text-xs text-gray-500 dark:text-gray-400">Business Activity</Label>
                          <p className="font-medium text-black dark:text-white">{businessData.businessActivity || 'Not set'}</p>
                        </div>
                        {businessData.tradeLicenseNumber && (
                          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                            <Label className="text-xs text-gray-500 dark:text-gray-400">Trade License Number</Label>
                            <p className="font-medium text-black dark:text-white">{businessData.tradeLicenseNumber}</p>
                          </div>
                        )}
                      </div>

                      {businessData.tradeLicenseExpiry && (
                        <Alert className="border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                          <Calendar className="h-4 w-4 text-black dark:text-white" />
                          <AlertDescription className="text-black dark:text-white">
                            Trade License expires on {new Date(businessData.tradeLicenseExpiry).toLocaleDateString()}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="mx-auto w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                        <Building2 className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-black dark:text-white mb-2">Setup Your Business</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-md mx-auto">
                        Add your company information to track trade license and establishment requirements
                      </p>
                      <Button onClick={() => setShowBusinessDialog(true)} className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Business Information
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Business Setup Guide */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    title: 'Dubai Mainland',
                    icon: Globe,
                    features: [
                      'Trade in UAE market and internationally',
                      'DED (Department of Economic Development) license',
                      'Physical office space required',
                      'Local service agent may be required'
                    ],
                  },
                  {
                    title: 'Dubai Freezone',
                    icon: Zap,
                    features: [
                      '100% foreign ownership',
                      '0% corporate and personal tax',
                      '100% repatriation of capital and profits',
                      'Quick and easy setup process'
                    ],
                  }
                ].map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="border border-gray-200 dark:border-gray-800 shadow-lg bg-white dark:bg-black hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                      <div className="h-1 bg-black dark:bg-white"></div>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg text-black dark:text-white">
                          <item.icon className="h-5 w-5 text-black dark:text-white" />
                          {item.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 text-sm">
                          {item.features.map((feature, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-600 dark:text-gray-400">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* Regulations Tab */}
            <TabsContent value="regulations" className="space-y-4">
              <Card className="border border-gray-200 dark:border-gray-800 shadow-xl bg-white dark:bg-black">
                <CardHeader className="border-b border-gray-200 dark:border-gray-800">
                  <CardTitle className="flex items-center gap-2 text-black dark:text-white">
                    <Gavel className="h-5 w-5 text-black dark:text-white" />
                    UAE Immigration & Visa Regulations (2024-2025)
                  </CardTitle>
                  <CardDescription className="text-gray-500 dark:text-gray-400">Stay updated with the latest rules and requirements</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
                    <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <AlertDescription className="text-blue-900 dark:text-blue-200">
                      <strong>Latest Update:</strong> New visa categories introduced in 2024, including 5-year multi-entry tourist visa and expanded golden visa eligibility.
                    </AlertDescription>
                  </Alert>

                  <div>
                    <h4 className="font-semibold text-black dark:text-white mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-black dark:text-white" />
                      Document Validity Requirements
                    </h4>
                    <div className="grid gap-3">
                      {[
                        {
                          title: 'Emirates ID',
                          desc: 'Must be renewed before expiry. Processing time: 2-3 weeks'
                        },
                        {
                          title: 'Residence Visa',
                          desc: 'Grace period: 30 days after expiry. Late fine: AED 125 per day'
                        },
                        {
                          title: 'Trade License',
                          desc: 'Annual renewal required. Late renewal penalties apply'
                        },
                        {
                          title: 'Passport Validity',
                          desc: 'Must be valid for at least 6 months for visa applications'
                        }
                      ].map((item, index) => (
                        <motion.div
                          key={item.title}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-black hover:shadow-md transition-all"
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                              <FileText className="w-4 h-4 text-black dark:text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-black dark:text-white">{item.title}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-black dark:text-white mb-3 flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-black dark:text-white" />
                      Important Links
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { label: 'UAE Government Portal', url: 'https://u.ae/' },
                        { label: 'GDRFA Dubai', url: 'https://www.gdrfad.gov.ae' },
                        { label: 'ICP Smart Services', url: 'https://smartservices.icp.gov.ae' },
                        { label: 'MOHRE', url: 'https://www.mohre.gov.ae' }
                      ].map((link) => (
                        <Button 
                          key={link.label}
                          variant="outline" 
                          className="justify-start border-gray-300 dark:border-gray-700 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => window.open(link.url, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          {link.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-4">
              <Card className="border border-gray-200 dark:border-gray-800 shadow-xl bg-white dark:bg-black">
                <CardHeader className="border-b border-gray-200 dark:border-gray-800">
                  <CardTitle className="flex items-center gap-2 text-black dark:text-white">
                    <Bell className="h-5 w-5 text-black dark:text-white" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription className="text-gray-500 dark:text-gray-400">Manage how you receive expiry alerts</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
                    <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <AlertDescription className="text-blue-900 dark:text-blue-200">
                      We'll notify you when your documents are expiring: 30 days, 15 days, and 7 days before expiry.
                    </AlertDescription>
                  </Alert>

                  {complianceData?.expiringDocuments && complianceData.expiringDocuments.length > 0 ? (
                    <>
                      <h4 className="font-semibold text-black dark:text-white">Upcoming Renewals</h4>
                      <div className="space-y-3">
                        {complianceData.expiringDocuments.map((doc, index) => (
                          <motion.div
                            key={doc.documentId}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <div className={`p-4 rounded-xl border-2 ${doc.status === 'expired' ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20' : 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20'}`}>
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-start gap-3">
                                  {doc.status === 'expired' ? (
                                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-1 flex-shrink-0" />
                                  ) : (
                                    <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-1 flex-shrink-0" />
                                  )}
                                  <div>
                                    <p className="font-semibold text-black dark:text-white capitalize">
                                      {doc.documentType.replace(/_/g, ' ')}
                                    </p>
                                    <p className={`text-sm ${doc.status === 'expired' ? 'text-red-700 dark:text-red-400' : 'text-orange-700 dark:text-orange-400'}`}>
                                      {doc.status === 'expired' 
                                        ? `Expired ${Math.abs(doc.daysRemaining)} days ago`
                                        : `Expires in ${doc.daysRemaining} days`
                                      }
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      Expiry Date: {new Date(doc.expiryDate).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant={doc.status === 'expired' ? 'destructive' : 'default'} 
                                  className="self-start sm:self-center bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                                >
                                  Renew Now
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                        <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                      </div>
                      <p className="font-semibold text-black dark:text-white">All Documents Valid</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">No upcoming renewals required</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Upload Document Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-black dark:text-white">Upload Document</DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">Add a new document to your profile</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-black dark:text-white">Document Type</Label>
              <Select value={uploadDocType} onValueChange={setUploadDocType}>
                <SelectTrigger className="bg-white dark:bg-black border-gray-300 dark:border-gray-700 text-black dark:text-white">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700">
                  <SelectItem value="emirates_id">Emirates ID</SelectItem>
                  <SelectItem value="passport">Passport</SelectItem>
                  <SelectItem value="residence_visa">Residence Visa</SelectItem>
                  <SelectItem value="driving_license">Driving License</SelectItem>
                  <SelectItem value="trade_license">Trade License</SelectItem>
                  <SelectItem value="establishment_card">Establishment Card</SelectItem>
                  <SelectItem value="bank_statement">Bank Statement</SelectItem>
                  <SelectItem value="salary_certificate">Salary Certificate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-black dark:text-white">Document File</Label>
              <Input
                type="file"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                accept=".pdf,.jpg,.jpeg,.png"
                className="bg-white dark:bg-black border-gray-300 dark:border-gray-700 text-black dark:text-white"
              />
            </div>

            <div>
              <Label className="text-black dark:text-white">Document Number (Optional)</Label>
              <Input
                value={uploadDocNumber}
                onChange={(e) => setUploadDocNumber(e.target.value)}
                placeholder="e.g., 784-1234-5678901-2"
                className="bg-white dark:bg-black border-gray-300 dark:border-gray-700 text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600"
              />
            </div>

            <div>
              <Label className="text-black dark:text-white">Expiry Date (Optional)</Label>
              <Input
                type="date"
                value={uploadExpiryDate}
                onChange={(e) => setUploadExpiryDate(e.target.value)}
                className="bg-white dark:bg-black border-gray-300 dark:border-gray-700 text-black dark:text-white"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleUploadDocument} disabled={isLoading} className="flex-1 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200">
                {isLoading ? 'Uploading...' : 'Upload'}
              </Button>
              <Button variant="outline" onClick={() => setShowUploadDialog(false)} className="border-gray-300 dark:border-gray-700 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Business Setup Dialog */}
      <Dialog open={showBusinessDialog} onOpenChange={setShowBusinessDialog}>
        <DialogContent className="max-w-2xl bg-white dark:bg-black border border-gray-200 dark:border-gray-700 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-black dark:text-white">Business Information</DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">Manage your company and trade license details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={businessData.hasCompany}
                onChange={(e) => setBusinessData({ ...businessData, hasCompany: e.target.checked })}
                className="rounded border-gray-300 dark:border-gray-700"
              />
              <Label className="text-black dark:text-white">I have a company in UAE</Label>
            </div>

            {businessData.hasCompany && (
              <>
                <div>
                  <Label className="text-black dark:text-white">Company Name</Label>
                  <Input
                    value={businessData.companyName}
                    onChange={(e) => setBusinessData({ ...businessData, companyName: e.target.value })}
                    placeholder="Enter company name"
                    className="bg-white dark:bg-black border-gray-300 dark:border-gray-700 text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600"
                  />
                </div>

                <div>
                  <Label className="text-black dark:text-white">Establishment Type</Label>
                  <Select 
                    value={businessData.establishmentType} 
                    onValueChange={(value) => setBusinessData({ ...businessData, establishmentType: value })}
                  >
                    <SelectTrigger className="bg-white dark:bg-black border-gray-300 dark:border-gray-700 text-black dark:text-white">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700">
                      <SelectItem value="mainland">Mainland</SelectItem>
                      <SelectItem value="freezone">Freezone</SelectItem>
                      <SelectItem value="offshore">Offshore</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-black dark:text-white">Business Activity</Label>
                  <Input
                    value={businessData.businessActivity}
                    onChange={(e) => setBusinessData({ ...businessData, businessActivity: e.target.value })}
                    placeholder="e.g., Trading, Consulting, etc."
                    className="bg-white dark:bg-black border-gray-300 dark:border-gray-700 text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-black dark:text-white">Trade License Number</Label>
                    <Input
                      value={businessData.tradeLicenseNumber}
                      onChange={(e) => setBusinessData({ ...businessData, tradeLicenseNumber: e.target.value })}
                      placeholder="License number"
                      className="bg-white dark:bg-black border-gray-300 dark:border-gray-700 text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600"
                    />
                  </div>
                  <div>
                    <Label className="text-black dark:text-white">License Expiry Date</Label>
                    <Input
                      type="date"
                      value={businessData.tradeLicenseExpiry}
                      onChange={(e) => setBusinessData({ ...businessData, tradeLicenseExpiry: e.target.value })}
                      className="bg-white dark:bg-black border-gray-300 dark:border-gray-700 text-black dark:text-white"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-2">
              <Button onClick={handleUpdateBusiness} disabled={isLoading} className="flex-1 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200">
                {isLoading ? 'Saving...' : 'Save'}
              </Button>
              <Button variant="outline" onClick={() => setShowBusinessDialog(false)} className="border-gray-300 dark:border-gray-700 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  )
}

export default CompliancePage