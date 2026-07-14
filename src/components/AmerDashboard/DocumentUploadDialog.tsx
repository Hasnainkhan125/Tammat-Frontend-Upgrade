import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Upload, X, FileText, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  onUploadComplete?: () => void;
  isResultDocument?: boolean;
}

interface DocumentToUpload {
  id: string;
  file: File | null;
  name: string;
  type: string;
  uploadedByRole: string;
  }

export const DocumentUploadDialog: React.FC<DocumentUploadDialogProps> = ({
  open,
  onOpenChange,
  applicationId,
  onUploadComplete,
  isResultDocument = false
}) => {
  const [documents, setDocuments] = useState<DocumentToUpload[]>([
    { id: '1', file: null, name: '', type: 'general' , uploadedByRole: 'amer' }
  ]);
  const [uploading, setUploading] = useState(false);

  const addDocumentSlot = () => {
    setDocuments([
      ...documents,
      { id: Date.now().toString(), file: null, name: '', type: 'general' , uploadedByRole: 'amer' }
    ]);
  };

  const removeDocumentSlot = (id: string) => {
    if (documents.length > 1) {
      setDocuments(documents.filter(doc => doc.id !== id));
    }
  };

  const updateDocument = (id: string, field: 'file' | 'name' | 'type' | 'uploadedByRole', value: any) => {
    setDocuments(documents.map(doc => 
      doc.id === id ? { ...doc, [field]: value } : doc
    ));
  };

  const handleFileSelect = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (20MB for result docs, 10MB for regular)
      const maxSize = isResultDocument ? 20 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`File size must be less than ${isResultDocument ? '20MB' : '10MB'}`);
        return;
      }

      // Auto-fill name if empty
      const doc = documents.find(d => d.id === id);
      if (doc && !doc.name) {
        updateDocument(id, 'name', file.name.replace(/\.[^/.]+$/, ''));
      }
        updateDocument(id, 'uploadedByRole', 'amer');
      updateDocument(id, 'file', file);
    }
  };

  const handleUpload = async () => {
    // Validate all documents
    const validDocuments = documents.filter(doc => doc.file && doc.name.trim());
    
    if (validDocuments.length === 0) {
      toast.error('Please add at least one document with a name');
      return;
    }

    setUploading(true);

    try {
      const token = localStorage.getItem('authToken') || '';
      
      for (const doc of validDocuments) {
        const formData = new FormData();
        formData.append('file', doc.file!);
        formData.append('documentName', doc.name);
        formData.append('documentType', doc.type);
        formData.append('uploadedByRole', doc.uploadedByRole);
        
        if (isResultDocument) {
          formData.append('isResultDocument', 'true');
        }

        const endpoint = isResultDocument
          ? `/api/v1/visa/${applicationId}/result-documents`
          : `/api/v1/visa/${applicationId}/documents`;

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${endpoint}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Upload failed');
        }
      }

      toast.success(`${validDocuments.length} document(s) uploaded successfully`);
      
      // Reset form
      setDocuments([{ id: '1', file: null, name: '', type: 'general' , uploadedByRole: 'amer'}]);
      
      // Call completion callback
      if (onUploadComplete) {
        onUploadComplete();
      }
      
      onOpenChange(false);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload documents');
    } finally {
      setUploading(false);
    }
  };

  const documentTypes = isResultDocument
    ? [
        { value: 'icp_receipt', label: 'ICP Receipt' },
        { value: 'transaction_paper', label: 'Transaction Paper' },
        { value: 'visa_approval', label: 'Visa Approval' },
        { value: 'visa_result', label: 'Visa Result' },
        { value: 'other_result', label: 'Other Result Document' }
      ]
    : [
        { value: 'passport', label: 'Passport' },
        { value: 'emirates_id', label: 'Emirates ID' },
        { value: 'visa', label: 'Visa' },
        { value: 'sponsor_document', label: 'Sponsor Document' },
        { value: 'other', label: 'Other Document' }
      ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            {isResultDocument ? 'd' : 'Upload Documents'}
          </DialogTitle>
          <DialogDescription>
            {isResultDocument 
              ? 'Upload ICP receipts, transaction papers, and other result documents for this application.'
              : 'Upload required documents for this application. You can add multiple documents at once.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {documents.map((doc, index) => (
            <div key={doc.id} className="p-4 border border-border rounded-lg bg-surface-light/50">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Document {index + 1}</span>
                </div>
                {documents.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDocumentSlot(doc.id)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                {/* Document Type */}
                <div>
                  <Label className="text-xs">Document Type</Label>
                  <select
                    value={doc.type}
                    onChange={(e) => updateDocument(doc.id, 'type', e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background text-sm"
                  >
                    {documentTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Document Name */}
                <div>
                  <Label className="text-xs">Document Name *</Label>
                  <Input
                    value={doc.name}
                    onChange={(e) => updateDocument(doc.id, 'name', e.target.value)}
                    placeholder="e.g., ICP Transaction Receipt - Jan 2024"
                    className="mt-1 text-sm"
                  />
                </div>

                {/* File Upload */}
                <div>
                  <Label className="text-xs">Choose File *</Label>
                  <div className="mt-1">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileSelect(doc.id, e)}
                      className="hidden"
                      id={`file-${doc.id}`}
                    />
                    <label
                      htmlFor={`file-${doc.id}`}
                      className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                    >
                      {doc.file ? (
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          <span className="text-sm text-foreground">{doc.file.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {(doc.file.size / 1024 / 1024).toFixed(2)} MB
                          </Badge>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-text-secondary">
                          <Upload className="w-4 h-4" />
                          <span className="text-sm">Click to select file</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Add More Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={addDocumentSlot}
            className="w-full border-dashed"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Another Document
          </Button>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleUpload}
              disabled={uploading || !documents.some(d => d.file && d.name.trim())}
              className="flex-1 bg-primary hover:bg-primary/90 text-black"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload {documents.filter(d => d.file && d.name.trim()).length} Document(s)
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

