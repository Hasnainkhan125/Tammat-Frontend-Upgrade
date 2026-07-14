import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  Download, 
  FileText,
  Image,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

interface DocumentAttachment {
  _id?: string
  type: string
  path: string
  originalName?: string
  fileSize?: number
  mimeType?: string
  status: 'pending' | 'approved' | 'rejected' | 'requested'
  uploadedAt: string
  rejectionReason?: string
  extractedData?: any
  isRequested?: boolean
}

interface DocumentReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documents: DocumentAttachment[]
  applicationId: string
  onReview: (attachmentId: string, status: 'approved' | 'rejected', rejectionReason?: string) => Promise<void>
}

export const DocumentReviewDialog: React.FC<DocumentReviewDialogProps> = ({
  open,
  onOpenChange,
  documents,
  applicationId,
  onReview
}) => {
  const { t } = useTranslation()
  const [selectedDoc, setSelectedDoc] = useState<DocumentAttachment | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [loading, setLoading] = useState(false)

  const getDocumentIcon = (mimeType?: string) => {
    if (mimeType?.startsWith('image/')) {
      return <Image className="w-5 h-5" />
    }
    return <FileText className="w-5 h-5" />
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-200">{t('documents.approved')}</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200">{t('documents.rejected')}</Badge>
      case 'requested':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">{t('documents.requested')}</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">{t('documents.pending')}</Badge>
    }
  }

  const handleReview = async (attachmentId: string, status: 'approved' | 'rejected') => {
    if (status === 'rejected' && !rejectionReason.trim()) {
      toast.error(t('documents.provideRejectionReason'))
      return
    }

    setLoading(true)
    try  {
      await onReview(attachmentId, status, status === 'rejected' ? rejectionReason : undefined)
      setRejectionReason('')
      setSelectedDoc(null)
      toast.success(t(`documents.${status === 'approved' ? 'approved' : 'rejected'}`))
    } catch (error) {
      toast.error(t('errors.general'))
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown size'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDocumentType = (type: string): string => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{t('documents.review')} - {t('applications.applicationNumber')} {applicationId}</DialogTitle>
          <DialogDescription>
            {t('amerDashboard.reviewDocuments')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[70vh] overflow-scroll">
          {/* Document List */}
          <div className="space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium text-[#baf350]">Documents ({documents.length})</h3>
              {/* <h3 className="text-base font-medium text-accent">Documents ({documents.length})</h3> */}
            </div>

            {documents.map((doc, index) => (
              <Card 
                key={doc._id || index}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedDoc?._id === doc._id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedDoc(doc)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="text-gray-500">
                        {getDocumentIcon(doc.mimeType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-xs truncate">
                          {formatDocumentType(doc.type)}
                        </h4>
                        <p className="text-xs text-gray-500 truncate">
                          {doc.originalName?.slice(0, 20) + '...' + doc.originalName?.slice(-20) || doc.path}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatFileSize(doc.fileSize)} • {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                        {doc.rejectionReason && (
                          <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-xs">
                            <span className="font-medium text-red-800">Rejected:</span>
                            <span className="text-red-700 ml-1">{doc.rejectionReason}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(doc.status)}
                      {doc.isRequested && (
                        <Badge variant="outline" className="text-xs">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Re-upload Required
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {documents.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No documents uploaded yet</p>
              </div>
            )}
          </div>

          {/* Document Preview & Actions */}
          <div className="border-l pl-6">
            {selectedDoc ? (
              <div className="space-y-4">
                {/* Document Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center justify-between">
                      {formatDocumentType(selectedDoc.type)}
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            const url = `${apiBase}/uploads/applications/${applicationId}/${selectedDoc.path}`
                            window.open(url, '_blank')
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            const url = `${apiBase}/uploads/applications/${applicationId}/${selectedDoc.path}`
                            const link = document.createElement('a')
                            link.href = url
                            link.download = selectedDoc.originalName || selectedDoc.path
                            link.click()
                          }}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Document Preview */}
                    {/* {selectedDoc.mimeType ? (
                      <div className="mb-4">
                        <img 
                          src={`${apiBase}/uploads/applications/${applicationId}/${selectedDoc.path}`}
                          alt={selectedDoc.originalName}
                          className="max-w-full max-h-64 object-contain rounded border"
                          onError={(e) => {

                          }}
                        />
                      </div>
                    ) : (
                      <div className="mb-4 p-8 bg-gray-50 border rounded text-center">
                        <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">PDF Document</p>
                        <p className="text-xs text-gray-500">{selectedDoc.originalName}</p>
                      </div>
                  
                    )} */}

<div className="flex-1 overflow-auto">
            {selectedDoc && (
              <div className="w-full h-full flex items-center justify-center bg-surface-light rounded-lg">
                {selectedDoc.mimeType?.includes('image/') ? (
                  <img 
                    src={`${apiBase}/uploads/applications/${applicationId}/${selectedDoc.path}`}
                    alt={selectedDoc.originalName}
                    className="max-w-full max-h-[60vh] object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                      if (nextElement) {
                        nextElement.style.display = 'block';
                      }
                    }}
                  />
                ) : selectedDoc.mimeType?.includes('application/pdf') ? (
                  <iframe 
                    src={`${apiBase}/uploads/applications/${applicationId}/${selectedDoc.path}`}
                    className="w-full h-[60vh] border-0"
                    title={selectedDoc.originalName}
                  />
                ) : (
                  <div className="text-center text-text-muted">
                    <FileText className="w-16 h-16 mx-auto mb-4" />
                    <p>Preview not available for this file type</p>
                    <Button 
                      onClick={() => {
                        const url = `${apiBase}/uploads/applications/${applicationId}/${selectedDoc.path}`
                        const link = document.createElement('a')
                        link.href = url
                        link.download = selectedDoc.originalName || selectedDoc.path
                        link.click()
                      }}
                      className="mt-4"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download to view
                    </Button>
                  </div>
                )}
                <div className="hidden text-center text-text-muted">
                  <FileText className="w-16 h-16 mx-auto mb-4" />
                  <p>Unable to load preview</p>
                  <Button 
                    onClick={() => {
                      const url = `${apiBase}/uploads/applications/${applicationId}/${selectedDoc.path}`
                      const link = document.createElement('a')
                      link.href = url
                      link.download = selectedDoc.originalName || selectedDoc.path
                      link.click()
                    }}
                    className="mt-4"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download file
                  </Button>
                </div>
              </div>
            )}
          </div>

                    {/* Document Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-xs text-gray-500">File Name</Label>
                        <p className="font-medium">{selectedDoc?.originalName?.slice(0, 20) + '...' || selectedDoc.path}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">File Size</Label>
                        <p className="font-medium">{formatFileSize(selectedDoc.fileSize)}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Type</Label>
                        <p className="font-medium">{selectedDoc.mimeType}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Uploaded</Label>
                        <p className="font-medium">{new Date(selectedDoc.uploadedAt).toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Extracted Data */}
                    {selectedDoc.extractedData && (
                      <div className="mt-4">
                        <Label className="text-xs text-gray-500">Extracted Information</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                          <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                             {/* <div className="mt-1 p-3 bg-surface-light rounded-lg">
                          <pre className="text-xs text-foreground whitespace-pre-wrap"> */}
                        
                            {JSON.stringify(selectedDoc.extractedData, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Review Actions */}
                {selectedDoc.status === 'pending' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Review Document</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="rejection-reason">Rejection Reason (if rejecting)</Label>
                        <Textarea
                          id="rejection-reason"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Provide reason for rejection (required if rejecting)"
                          className="mt-1"
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleReview(selectedDoc._id!, 'approved')}
                          disabled={loading}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleReview(selectedDoc._id!, 'rejected')}
                          disabled={loading || !rejectionReason.trim()}
                          variant="destructive"
                          className="flex-1"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Already Reviewed */}
                {selectedDoc.status !== 'pending' && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        {getStatusBadge(selectedDoc.status)}
                        <p className="text-sm text-gray-600 mt-2">
                        {/* <p className="text-sm text-text-secondary mt-2"> */}

                          This document has already been reviewed
                        </p>
                        {selectedDoc.rejectionReason && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                            <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                            <p className="text-sm text-red-700">{selectedDoc.rejectionReason}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>Select a document to review</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
