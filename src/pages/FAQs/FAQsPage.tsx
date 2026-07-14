"use client"

import React, { useState, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import SEO from '@/components/SEO/SEO'
import { 
  Search,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  FileText,
  Shield,
  Clock,
  CreditCard,
  User,
  Building2,
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Info,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ThemeContext } from '@/contexts/ThemeContext'

// Theme hook
const useTheme = () => {
  const context = useContext(ThemeContext)
  
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  tags: string[]
  helpful?: boolean
}

const FAQ_CATEGORIES = [
  { id: 'general', name: 'General', icon: HelpCircle, count: 8 },
  { id: 'visa', name: 'Visa Services', icon: FileText, count: 12 },
  { id: 'documents', name: 'Documents', icon: Shield, count: 6 },
  { id: 'timeline', name: 'Timeline & Processing', icon: Clock, count: 5 },
  { id: 'payment', name: 'Payment & Fees', icon: CreditCard, count: 4 },
  { id: 'support', name: 'Support', icon: MessageCircle, count: 3 }
]

const FAQS: FAQ[] = [
  // General FAQs
  {
    id: 'what-is-tammat',
    question: 'What is Tammat and how does it work?',
    answer: 'Tammat is a modern visa and residency services platform that simplifies the UAE visa application process. We use AI-powered technology to guide you through each step, verify your documents, and connect you with expert Amer officers for personalized assistance.',
    category: 'general',
    tags: ['platform', 'ai', 'visa', 'uae']
  },
  {
    id: 'success-rate',
    question: 'What is your success rate for visa applications?',
    answer: 'We maintain a 98% success rate for visa applications. Our AI-powered system ensures all documents are properly verified before submission, and our expert team provides guidance throughout the process.',
    category: 'general',
    tags: ['success', 'rate', 'statistics']
  },
  {
    id: 'security',
    question: 'Is my personal information secure?',
    answer: 'Yes, we use bank-level encryption and security measures to protect your personal information. All data is stored securely and only shared with authorized government agencies as required for visa processing.',
    category: 'general',
    tags: ['security', 'privacy', 'data']
  },
  {
    id: 'support-hours',
    question: 'What are your customer support hours?',
    answer: 'Our customer support is available 24/7 through our AI assistant and live chat. For complex queries, our human support team is available Monday to Friday, 9 AM to 6 PM UAE time.',
    category: 'general',
    tags: ['support', 'hours', 'contact']
  },
  {
    id: 'mobile-app',
    question: 'Do you have a mobile app?',
    answer: 'Yes, we have a mobile app available for both iOS and Android. You can download it from the App Store or Google Play Store to manage your applications on the go.',
    category: 'general',
    tags: ['mobile', 'app', 'ios', 'android']
  },
  {
    id: 'refund-policy',
    question: 'What is your refund policy?',
    answer: 'We offer a full refund if your application is rejected due to our error. However, government fees are non-refundable. Please refer to our terms and conditions for complete details.',
    category: 'general',
    tags: ['refund', 'policy', 'money']
  },
  {
    id: 'multiple-applications',
    question: 'Can I apply for multiple visas at once?',
    answer: 'Yes, you can apply for multiple visa types simultaneously. Our platform allows you to manage multiple applications from a single dashboard.',
    category: 'general',
    tags: ['multiple', 'applications', 'dashboard']
  },
  {
    id: 'language-support',
    question: 'What languages do you support?',
    answer: 'Our platform supports English and Arabic. Our AI assistant can communicate in both languages, and our support team is fluent in both.',
    category: 'general',
    tags: ['language', 'english', 'arabic']
  },

  // Visa Services FAQs
  {
    id: 'visa-types',
    question: 'What types of visas do you handle?',
    answer: 'We handle all types of UAE visas including family visas (spouse, children), residence visas, entry permits, Emirates ID applications, and visa renewals. We also assist with business visas and investor visas.',
    category: 'visa',
    tags: ['visa', 'types', 'family', 'residence']
  },
  {
    id: 'processing-time',
    question: 'How long does visa processing take?',
    answer: 'Processing times vary by visa type: Family visas (2-4 weeks), Residence visas (3-6 weeks), Entry permits (1-2 weeks), Emirates ID (1-2 weeks), and Visa renewals (1-2 weeks).',
    category: 'visa',
    tags: ['processing', 'time', 'duration']
  },
  {
    id: 'visa-requirements',
    question: 'What are the general requirements for visa applications?',
    answer: 'Requirements vary by visa type but generally include: valid passport, recent photographs, medical certificate, salary certificate (for family visas), trade license (for business visas), and Emirates ID.',
    category: 'visa',
    tags: ['requirements', 'documents', 'passport']
  },
  {
    id: 'visa-extension',
    question: 'Can I extend my visa through Tammat?',
    answer: 'Yes, we can help you extend your existing visa. We handle all types of visa extensions and can guide you through the renewal process.',
    category: 'visa',
    tags: ['extension', 'renewal', 'visa']
  },
  {
    id: 'visa-status',
    question: 'How can I check my visa application status?',
    answer: 'You can check your application status through your Tammat dashboard, our mobile app, or by contacting our support team. We also send regular updates via email and SMS.',
    category: 'visa',
    tags: ['status', 'tracking', 'updates']
  },
  {
    id: 'visa-rejection',
    question: 'What happens if my visa is rejected?',
    answer: 'If your visa is rejected, we will analyze the reason and help you reapply with the necessary corrections. We provide detailed feedback and guidance for successful reapplication.',
    category: 'visa',
    tags: ['rejection', 'reapply', 'feedback']
  },

  // Documents FAQs
  {
    id: 'document-verification',
    question: 'How does document verification work?',
    answer: 'Our AI system automatically verifies all uploaded documents for completeness, clarity, and compliance with UAE requirements. Documents are checked against official guidelines before submission.',
    category: 'documents',
    tags: ['verification', 'ai', 'compliance']
  },
  {
    id: 'document-formats',
    question: 'What document formats do you accept?',
    answer: 'We accept PDF, JPG, JPEG, and PNG formats. Documents should be clear, legible, and in high resolution. Maximum file size is 10MB per document.',
    category: 'documents',
    tags: ['formats', 'pdf', 'image', 'size']
  },
  {
    id: 'translation-required',
    question: 'Do I need to translate my documents?',
    answer: 'Documents in English or Arabic are accepted as-is. Documents in other languages must be translated to English or Arabic by a certified translator.',
    category: 'documents',
    tags: ['translation', 'language', 'certified']
  },
  {
    id: 'document-upload',
    question: 'How do I upload my documents?',
    answer: 'You can upload documents through our web platform or mobile app. Simply drag and drop files or click to browse. Our system will guide you through the required documents for your specific visa type.',
    category: 'documents',
    tags: ['upload', 'drag', 'drop', 'mobile']
  },
  {
    id: 'document-security',
    question: 'Are my documents secure after upload?',
    answer: 'Yes, all uploaded documents are encrypted and stored securely. They are only accessible to authorized personnel and government agencies as required for processing.',
    category: 'documents',
    tags: ['security', 'encryption', 'storage']
  },
  {
    id: 'missing-documents',
    question: 'What if I\'m missing some documents?',
    answer: 'Our system will identify missing documents and provide you with a checklist. You can upload them later, but processing will only begin once all required documents are submitted.',
    category: 'documents',
    tags: ['missing', 'checklist', 'requirements']
  },

  // Timeline & Processing FAQs
  {
    id: 'urgent-processing',
    question: 'Do you offer urgent processing?',
    answer: 'Yes, we offer expedited processing for urgent cases. Additional fees apply, and processing time depends on the visa type and current government processing times.',
    category: 'timeline',
    tags: ['urgent', 'expedited', 'fees']
  },
  {
    id: 'tracking-updates',
    question: 'How often will I receive updates?',
    answer: 'You will receive updates at each major milestone: document verification, submission to authorities, under review, and final decision. We also provide real-time status updates through our platform.',
    category: 'timeline',
    tags: ['updates', 'milestones', 'tracking']
  },
  {
    id: 'delays',
    question: 'What causes delays in processing?',
    answer: 'Common causes include incomplete documentation, government processing backlogs, additional verification requirements, or missing information. We work to minimize delays through our AI verification system.',
    category: 'timeline',
    tags: ['delays', 'backlogs', 'verification']
  },
  {
    id: 'holiday-impact',
    question: 'Do holidays affect processing times?',
    answer: 'Yes, UAE public holidays and weekends can extend processing times as government offices are closed. We factor this into our estimated timelines and keep you informed of any delays.',
    category: 'timeline',
    tags: ['holidays', 'weekends', 'government']
  },
  {
    id: 'processing-stages',
    question: 'What are the different processing stages?',
    answer: 'The stages are: Document verification, Application submission, Government review, Additional requirements (if needed), Final decision, and Visa issuance (if approved).',
    category: 'timeline',
    tags: ['stages', 'process', 'government']
  },

  // Payment & Fees FAQs
  {
    id: 'payment-methods',
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, American Express), bank transfers, and digital wallets like Apple Pay and Google Pay. All payments are processed securely.',
    category: 'payment',
    tags: ['payment', 'cards', 'digital', 'wallets']
  },
  {
    id: 'fee-breakdown',
    question: 'What fees are included in the total cost?',
    answer: 'Our fees include service charges, government fees, and processing costs. We provide a detailed breakdown before you confirm payment, with no hidden charges.',
    category: 'payment',
    tags: ['fees', 'breakdown', 'transparent']
  },
  {
    id: 'refund-process',
    question: 'How long does the refund process take?',
    answer: 'Refunds are processed within 5-7 business days after approval. Government fees are non-refundable, but our service fees are fully refundable if the application is rejected due to our error.',
    category: 'payment',
    tags: ['refund', 'process', 'timeline']
  },
  {
    id: 'installment-payment',
    question: 'Do you offer installment payments?',
    answer: 'Yes, we offer flexible payment plans for certain visa types. You can pay in installments with a small processing fee. Contact our support team for more information.',
    category: 'payment',
    tags: ['installments', 'payment', 'plans']
  },

  // Support FAQs
  {
    id: 'contact-support',
    question: 'How can I contact customer support?',
    answer: 'You can contact us through live chat on our website, email at support@tammat.com, phone at +971 4 XXX XXXX, or through our mobile app. Our AI assistant is available 24/7.',
    category: 'support',
    tags: ['contact', 'support', 'chat', 'phone']
  },
  {
    id: 'ai-assistant',
    question: 'How does the AI assistant work?',
    answer: 'Our AI assistant can answer common questions, guide you through the application process, check document requirements, and provide real-time updates. It learns from your interactions to provide better assistance.',
    category: 'support',
    tags: ['ai', 'assistant', 'chatbot', 'help']
  },
  {
    id: 'escalation',
    question: 'When will my query be escalated to a human?',
    answer: 'Complex queries, technical issues, or requests that the AI cannot handle are automatically escalated to our human support team. You can also request human assistance at any time.',
    category: 'support',
    tags: ['escalation', 'human', 'support', 'complex']
  }
]

const FAQsPage: React.FC = () => {
  const { theme } = useTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, boolean>>({})

  const filteredFAQs = FAQS.filter(faq => {
    const matchesSearch = !searchQuery || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const toggleFAQ = (faqId: string) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId)
  }

  const toggleHelpful = (faqId: string) => {
    setHelpfulVotes(prev => ({
      ...prev,
      [faqId]: !prev[faqId]
    }))
  }

  const getCategoryIcon = (categoryId: string) => {
    const category = FAQ_CATEGORIES.find(cat => cat.id === categoryId)
    return category?.icon || HelpCircle
  }

  return (
    <>
      <SEO
        title="FAQs - Frequently Asked Questions | Tammat Visa Services"
        description="Find answers to common questions about UAE visa services, requirements, processing times, and application procedures. Get expert help for all your visa queries."
        keywords="UAE visa FAQs, visa questions, Dubai visa help, visa application process, visa requirements FAQ"
        canonicalUrl="/faqs"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "name": "UAE Visa Services FAQs"
        }}
      />
      <div className="min-h-screen" style={{ backgroundColor: theme.background, color: theme.text }}>
        {/* Hero Section */}
      <div className="relative py-24 md:py-28 overflow-hidden" style={{ backgroundColor: theme.surface }}>
        {/* Ambient glow blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-32 left-1/4 h-96 w-96 rounded-full blur-[110px]"
            style={{ backgroundColor: theme.primary + '25' }}
          />
          <div
            className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full blur-[100px]"
            style={{ backgroundColor: theme.primary + '15' }}
          />
        </div>

        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
            alt="Modern office workspace"
            className="w-full h-full object-cover opacity-[0.06]"
          />
          <div 
            className="absolute inset-0"
            style={{ backgroundColor: theme.surface + '95' }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 backdrop-blur-xl"
              style={{
                backgroundColor: theme.primary + '12',
                border: `1px solid ${theme.primary}30`,
              }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: theme.primary }} />
              <span className="text-xs font-semibold tracking-wide" style={{ color: theme.primary }}>
                Help Center
              </span>
            </motion.div>

            <motion.div 
              className="w-20 h-20 rounded-2xl mx-auto mb-8 flex items-center justify-center relative"
              style={{ backgroundColor: theme.primary + '18', boxShadow: `0 16px 40px -14px ${theme.primary}50` }}
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div
                className="absolute inset-0 rounded-2xl blur-xl opacity-60"
                style={{ backgroundColor: theme.primary + '30' }}
              />
              <HelpCircle className="w-10 h-10 relative" style={{ color: theme.primary }} />
            </motion.div>
            
            <h1 
              className="text-5xl md:text-6xl font-bold mb-6 tracking-tight"
              style={{ color: theme.text }}
            >
              Frequently Asked
              <br />
              <span style={{ color: theme.primary }}>Questions</span>
            </h1>
            
            <p 
              className="text-xl max-w-3xl mx-auto mb-10 leading-relaxed"
              style={{ color: theme.textSecondary }}
            >
              Find answers to common questions about our visa services, application process, and platform features.
            </p>

            {/* Search Bar */}
            <motion.div 
              className="max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div
                className="relative rounded-2xl transition-shadow duration-300"
                style={{ boxShadow: `0 12px 40px -12px ${theme.primary}25` }}
              >
                <Search 
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 z-10"
                  style={{ color: theme.primary }}
                />
                <Input
                  type="text"
                  placeholder="Search FAQs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-4 text-lg rounded-2xl backdrop-blur-xl focus-visible:ring-2 transition-all"
                  style={{ 
                    backgroundColor: theme.inputBackground,
                    border: `2px solid ${theme.inputBorder}`,
                    color: theme.text,
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Categories */}
      <div className="py-16" style={{ backgroundColor: theme.background }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-12"
          >
            <h2 
              className="text-3xl md:text-4xl font-bold mb-4 tracking-tight"
              style={{ color: theme.text }}
            >
              Browse by Category
            </h2>
            <p 
              className="text-lg"
              style={{ color: theme.textSecondary }}
            >
              Find answers organized by topic
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <motion.button
              onClick={() => setSelectedCategory('all')}
              className={cn(
                "relative p-5 rounded-2xl text-center transition-all duration-300 overflow-hidden",
                selectedCategory === 'all' ? "shadow-lg" : "hover:shadow-md"
              )}
              style={{
                backgroundColor: selectedCategory === 'all' ? theme.primary : theme.surface,
                color: selectedCategory === 'all' ? theme.buttonText : theme.text,
                border: `2px solid ${selectedCategory === 'all' ? theme.primary : theme.border}`,
                boxShadow: selectedCategory === 'all' ? `0 12px 30px -10px ${theme.primary}60` : undefined,
              }}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <HelpCircle className="w-6 h-6 mx-auto mb-2" />
              <div className="text-sm font-semibold">All</div>
              <div className="text-xs opacity-75 tabular-nums">{FAQS.length}</div>
            </motion.button>

            {FAQ_CATEGORIES.map((category, index) => {
              const Icon = category.icon
              const isSelected = selectedCategory === category.id
              
              return (
                <motion.button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    "relative p-5 rounded-2xl text-center transition-all duration-300 overflow-hidden",
                    isSelected ? "shadow-lg" : "hover:shadow-md"
                  )}
                  style={{
                    backgroundColor: isSelected ? theme.primary : theme.surface,
                    color: isSelected ? theme.buttonText : theme.text,
                    border: `2px solid ${isSelected ? theme.primary : theme.border}`,
                    boxShadow: isSelected ? `0 12px 30px -10px ${theme.primary}60` : undefined,
                  }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Icon className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-sm font-semibold">{category.name}</div>
                  <div className="text-xs opacity-75 tabular-nums">{category.count}</div>
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Visual Features Section */}
      <div className="py-16 relative overflow-hidden" style={{ backgroundColor: theme.background }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-16"
          >
            <h2 
              className="text-3xl md:text-4xl font-bold mb-6 tracking-tight"
              style={{ color: theme.text }}
            >
              Why Choose Tammat?
            </h2>
            <p 
              className="text-xl max-w-3xl mx-auto leading-relaxed"
              style={{ color: theme.textSecondary }}
            >
              Experience the future of visa services with our AI-powered platform
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -6 }}
              transition={{ delay: 0.4 }}
              className="group relative overflow-hidden rounded-3xl"
              style={{ boxShadow: `0 16px 40px -18px ${theme.primary}40` }}
            >
              <img
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="AI-powered document verification"
                className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div 
                className="absolute inset-0 p-6 flex flex-col justify-end"
                style={{ 
                  background: `linear-gradient(transparent, ${theme.background}95)`
                }}
              >
                <div
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl mb-3 backdrop-blur-md"
                  style={{ backgroundColor: theme.primary + '25', border: `1px solid ${theme.primary}40` }}
                >
                  <Sparkles className="w-5 h-5" style={{ color: theme.primary }} />
                </div>
                <h3 
                  className="text-xl font-bold mb-2"
                  style={{ color: theme.text }}
                >
                  AI Document Verification
                </h3>
                <p 
                  className="text-sm"
                  style={{ color: theme.textSecondary }}
                >
                  Smart verification ensures 98% success rate
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -6 }}
              transition={{ delay: 0.5 }}
              className="group relative overflow-hidden rounded-3xl"
              style={{ boxShadow: `0 16px 40px -18px ${theme.primary}40` }}
            >
              <img
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Real-time tracking dashboard"
                className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div 
                className="absolute inset-0 p-6 flex flex-col justify-end"
                style={{ 
                  background: `linear-gradient(transparent, ${theme.background}95)`
                }}
              >
                <div
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl mb-3 backdrop-blur-md"
                  style={{ backgroundColor: theme.primary + '25', border: `1px solid ${theme.primary}40` }}
                >
                  <Clock className="w-5 h-5" style={{ color: theme.primary }} />
                </div>
                <h3 
                  className="text-xl font-bold mb-2"
                  style={{ color: theme.text }}
                >
                  Real-time Tracking
                </h3>
                <p 
                  className="text-sm"
                  style={{ color: theme.textSecondary }}
                >
                  Monitor your application progress 24/7
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -6 }}
              transition={{ delay: 0.6 }}
              className="group relative overflow-hidden rounded-3xl"
              style={{ boxShadow: `0 16px 40px -18px ${theme.primary}40` }}
            >
              <img
                src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Expert support team"
                className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div 
                className="absolute inset-0 p-6 flex flex-col justify-end"
                style={{ 
                  background: `linear-gradient(transparent, ${theme.background}95)`
                }}
              >
                <div
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl mb-3 backdrop-blur-md"
                  style={{ backgroundColor: theme.primary + '25', border: `1px solid ${theme.primary}40` }}
                >
                  <User className="w-5 h-5" style={{ color: theme.primary }} />
                </div>
                <h3 
                  className="text-xl font-bold mb-2"
                  style={{ color: theme.text }}
                >
                  Expert Support
                </h3>
                <p 
                  className="text-sm"
                  style={{ color: theme.textSecondary }}
                >
                  Dedicated Amer officers for personalized help
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* FAQs List */}
      <div className="py-16" style={{ backgroundColor: theme.surface }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <h2 
              className="text-2xl font-bold mb-2 tracking-tight"
              style={{ color: theme.text }}
            >
              {selectedCategory === 'all' ? 'All Questions' : FAQ_CATEGORIES.find(c => c.id === selectedCategory)?.name + ' Questions'}
            </h2>
            <p 
              className="text-lg"
              style={{ color: theme.textSecondary }}
            >
              {filteredFAQs.length} question{filteredFAQs.length !== 1 ? 's' : ''} found
            </p>
          </motion.div>

          <div className="space-y-4">
            <AnimatePresence>
              {filteredFAQs.map((faq, index) => {
                const isExpanded = expandedFAQ === faq.id
                const isHelpful = helpfulVotes[faq.id]
                const Icon = getCategoryIcon(faq.category)
                
                return (
                  <motion.div
                    key={faq.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="overflow-hidden"
                  >
                    <Card 
                      className={cn(
                        "transition-all duration-300 rounded-3xl",
                        isExpanded ? "shadow-xl" : "hover:shadow-lg"
                      )}
                      style={{ 
                        backgroundColor: theme.background,
                        border: `1px solid ${isExpanded ? theme.primary + '40' : theme.border}`,
                        boxShadow: isExpanded ? `0 20px 50px -20px ${theme.primary}35` : undefined,
                      }}
                    >
                      <CardHeader 
                        className="cursor-pointer"
                        onClick={() => toggleFAQ(faq.id)}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 min-w-0">
                            <div
                              className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform duration-300"
                              style={{
                                backgroundColor: theme.primary + (isExpanded ? '30' : '15'),
                                boxShadow: isExpanded ? `0 8px 20px -8px ${theme.primary}50` : undefined,
                              }}
                            >
                              <Icon className="w-5 h-5" style={{ color: theme.primary }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle 
                                className="text-lg font-semibold mb-2 leading-snug"
                                style={{ color: theme.text }}
                              >
                                {faq.question}
                              </CardTitle>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge 
                                  variant="outline"
                                  className="text-xs font-medium rounded-full"
                                  style={{ 
                                    backgroundColor: theme.primary + '10',
                                    border: `1px solid ${theme.primary}30`,
                                    color: theme.primary
                                  }}
                                >
                                  {FAQ_CATEGORIES.find(c => c.id === faq.category)?.name}
                                </Badge>
                                <div className="hidden sm:flex gap-1">
                                  {faq.tags.slice(0, 3).map(tag => (
                                    <span 
                                      key={tag}
                                      className="text-xs px-2 py-1 rounded-full"
                                      style={{ 
                                        backgroundColor: theme.surface,
                                        color: theme.textSecondary
                                      }}
                                    >
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                          <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                            className="flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: isExpanded ? theme.primary + '15' : 'transparent' }}
                          >
                            <ChevronDown 
                              className="w-5 h-5"
                              style={{ color: isExpanded ? theme.primary : theme.textSecondary }}
                            />
                          </motion.div>
                        </div>
                      </CardHeader>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <CardContent 
                              className="pt-0"
                              style={{ borderTop: `1px solid ${theme.border}` }}
                            >
                              <p 
                                className="text-base leading-relaxed mb-6 pt-5"
                                style={{ color: theme.textSecondary }}
                              >
                                {faq.answer}
                              </p>
                              
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-4">
                                  <span 
                                    className="text-sm font-medium"
                                    style={{ color: theme.textSecondary }}
                                  >
                                    Was this helpful?
                                  </span>
                                  <motion.button
                                    onClick={() => toggleHelpful(faq.id)}
                                    className={cn(
                                      "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300",
                                      isHelpful ? "shadow-md" : "hover:shadow-sm"
                                    )}
                                    style={{
                                      backgroundColor: isHelpful ? theme.success + '15' : theme.surface,
                                      border: `1px solid ${isHelpful ? theme.success : theme.border}`,
                                      color: isHelpful ? theme.success : theme.textSecondary
                                    }}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    <span className="text-sm font-medium">
                                      {isHelpful ? 'Yes' : 'Yes'}
                                    </span>
                                  </motion.button>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs rounded-full"
                                    style={{
                                      backgroundColor: theme.surface,
                                      border: `1px solid ${theme.border}`,
                                      color: theme.textSecondary
                                    }}
                                  >
                                    <MessageCircle className="w-4 h-4 mr-1" />
                                    Contact Support
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {filteredFAQs.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div
                className="inline-flex h-16 w-16 items-center justify-center rounded-2xl mb-4"
                style={{ backgroundColor: theme.primary + '10' }}
              >
                <AlertCircle 
                  className="w-8 h-8"
                  style={{ color: theme.primary }}
                />
              </div>
              <h3 
                className="text-xl font-semibold mb-2"
                style={{ color: theme.text }}
              >
                No FAQs found
              </h3>
              <p 
                className="text-lg mb-6"
                style={{ color: theme.textSecondary }}
              >
                Try adjusting your search terms or browse different categories
              </p>
              <Button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('all')
                }}
                className="rounded-full"
                style={{
                  backgroundColor: theme.primary,
                  color: theme.buttonText,
                  boxShadow: `0 10px 30px -10px ${theme.primary}60`,
                }}
              >
                Clear Filters
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Contact Support Section */}
      <div className="py-20 relative overflow-hidden" style={{ backgroundColor: theme.background }}>
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute top-0 left-1/3 h-80 w-80 rounded-full blur-[110px]"
            style={{ backgroundColor: theme.primary + '15' }}
          />
        </div>

        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80"
            alt="Customer support team"
            className="w-full h-full object-cover opacity-[0.04]"
          />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div 
              className="w-20 h-20 rounded-2xl mx-auto mb-8 flex items-center justify-center relative"
              style={{ backgroundColor: theme.primary + '18', boxShadow: `0 16px 40px -14px ${theme.primary}50` }}
            >
              <div
                className="absolute inset-0 rounded-2xl blur-xl opacity-60"
                style={{ backgroundColor: theme.primary + '30' }}
              />
              <MessageCircle className="w-10 h-10 relative" style={{ color: theme.primary }} />
            </div>
            
            <h2 
              className="text-3xl md:text-4xl font-bold mb-6 tracking-tight"
              style={{ color: theme.text }}
            >
              Still have questions?
            </h2>
            
            <p 
              className="text-xl mb-10 max-w-2xl mx-auto leading-relaxed"
              style={{ color: theme.textSecondary }}
            >
              Our support team is here to help you with any questions or concerns you may have.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div
                whileHover={{ scale: 1.03, y: -4 }}
                className="p-7 rounded-3xl relative overflow-hidden text-center"
                style={{ 
                  backgroundColor: theme.surface,
                  border: `1px solid ${theme.border}`,
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <div
                  className="inline-flex h-14 w-14 items-center justify-center rounded-2xl mb-4"
                  style={{ backgroundColor: theme.primary + '15' }}
                >
                  <Phone 
                    className="w-7 h-7"
                    style={{ color: theme.primary }}
                  />
                </div>
                <h3 
                  className="text-lg font-semibold mb-2"
                  style={{ color: theme.text }}
                >
                  Call Us
                </h3>
                <p 
                  className="text-sm mb-5"
                  style={{ color: theme.textSecondary }}
                >
                  +971 4 XXX XXXX
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full w-full"
                  style={{
                    backgroundColor: theme.primary + '10',
                    border: `1px solid ${theme.primary}`,
                    color: theme.primary
                  }}
                >
                  Call Now
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.03, y: -4 }}
                className="p-7 rounded-3xl relative overflow-hidden text-center"
                style={{ 
                  backgroundColor: theme.surface,
                  border: `1px solid ${theme.border}`,
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <div
                  className="inline-flex h-14 w-14 items-center justify-center rounded-2xl mb-4"
                  style={{ backgroundColor: theme.primary + '15' }}
                >
                  <Mail 
                    className="w-7 h-7"
                    style={{ color: theme.primary }}
                  />
                </div>
                <h3 
                  className="text-lg font-semibold mb-2"
                  style={{ color: theme.text }}
                >
                  Email Us
                </h3>
                <p 
                  className="text-sm mb-5"
                  style={{ color: theme.textSecondary }}
                >
                  support@tammat.com
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full w-full"
                  style={{
                    backgroundColor: theme.primary + '10',
                    border: `1px solid ${theme.primary}`,
                    color: theme.primary
                  }}
                >
                  Send Email
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.03, y: -4 }}
                className="p-7 rounded-3xl relative overflow-hidden text-center"
                style={{ 
                  backgroundColor: theme.surface,
                  border: `1px solid ${theme.border}`,
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <div
                  className="inline-flex h-14 w-14 items-center justify-center rounded-2xl mb-4"
                  style={{ backgroundColor: theme.primary + '15' }}
                >
                  <MessageCircle 
                    className="w-7 h-7"
                    style={{ color: theme.primary }}
                  />
                </div>
                <h3 
                  className="text-lg font-semibold mb-2"
                  style={{ color: theme.text }}
                >
                  Live Chat
                </h3>
                <p 
                  className="text-sm mb-5"
                  style={{ color: theme.textSecondary }}
                >
                  Available 24/7
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full w-full"
                  style={{
                    backgroundColor: theme.primary + '10',
                    border: `1px solid ${theme.primary}`,
                    color: theme.primary
                  }}
                >
                  Start Chat
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
    </>
  )
}

export default FAQsPage