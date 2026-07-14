

// "use client";

// import { useState, useCallback, useMemo, useRef, useEffect, DragEvent } from 'react';
// import { AnimatePresence, motion } from 'framer-motion';
// import { useNavigate } from 'react-router-dom';
// import { useTranslation } from 'react-i18next';
// import { toast } from 'sonner';
// import {
//   X,
//   ArrowLeft,
//   ArrowRight,
//   Upload,
//   Trash2,
//   Check,
//   Clock,
//   Zap,
//   Shield,
//   CreditCard,
//   File,
//   AlertCircle,
//   Sparkles,
//   ShieldCheck,
//   CheckCircle,
//   Lock,
//   Loader2,
//   Gift,
// } from 'lucide-react';
// import { loadStripe, Stripe } from '@stripe/stripe-js';
// import {
//   Elements,
//   CardNumberElement,
//   CardExpiryElement,
//   CardCvcElement,
//   useStripe,
//   useElements,
// } from '@stripe/react-stripe-js';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Badge } from '@/components/ui/badge';
// import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
// import { Checkbox } from '@/components/ui/checkbox';
// import { Switch } from '@/components/ui/switch';
// import {
//   Sheet,
//   SheetContent,
//   SheetHeader,
//   SheetTitle,
// } from '@/components/ui/sheet';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import { cn } from '@/lib/utils';
// import type { Service, FormField } from '@/lib/services';
// import { NATIONALITIES } from '@/lib/services';
// import { useAuth } from '@/contexts/AuthContext';




// import {
//   PLANS,
//   getEffectivePlan,
//   getPerMonthAmount,
//   isEidOfferActive,
//   EID_OFFER_END,
//   type Plan,
// } from '@/lib/plans';


// const FREE_SERVICES = ['overstay-fine', 'absconding'];

// // Load Stripe outside component to avoid re-creating on every render
// const stripePromise: Promise<Stripe | null> = loadStripe(
//   import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''
// );

// interface CheckFormSheetProps {
//   service: Service;
//   isOpen: boolean;
//   onClose: () => void;
// }

// // Step IDs are conditional now — paid services get a 4th "Payment" step
// const slideVariants = {
//   initial: (dir: number) => ({ opacity: 0, x: dir > 0 ? 30 : -30 }),
//   animate: { opacity: 1, x: 0 },
//   exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -30 : 30 }),
// };

// export function CheckFormSheet({ service, isOpen, onClose }: CheckFormSheetProps) {
//   return (
//     <Elements stripe={stripePromise}>
//       <CheckFormSheetInner service={service} isOpen={isOpen} onClose={onClose} />
//     </Elements>
//   );
// }

// function CheckFormSheetInner({ service, isOpen, onClose }: CheckFormSheetProps) {
//   const { t } = useTranslation();
//   const navigate = useNavigate();
//   const { user } = useAuth();
//   const stripe = useStripe();
//   const elements = useElements();

//   const isFreeService = FREE_SERVICES.includes(service.id);

//   // Build steps dynamically based on whether the service is free
//   const STEPS = useMemo(() => {
//     const base = [
//       { id: 1, label: 'Docs' },
//       { id: 2, label: 'Speed' },
//       { id: 3, label: 'Review' },
//     ];
//     if (!isFreeService) {
//       base.push({ id: 4, label: 'Payment' });
//     }
//     return base;
//   }, [isFreeService]);

//   const TOTAL_STEPS = STEPS.length;
//   const PAYMENT_STEP = 4; // only exists when !isFreeService

//   const [currentStep, setCurrentStep] = useState(1);
//   const [direction, setDirection] = useState(1);
//   const [formData, setFormData] = useState<Record<string, unknown>>({});
//   const [files, setFiles] = useState<Record<string, File[]>>({});
//   const [fileProgress, setFileProgress] = useState<Record<string, number>>({});
//   const [speedTier, setSpeedTier] = useState<'standard' | 'fast-track'>('standard');
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [submitSuccess, setSubmitSuccess] = useState(false);
//   const [dragOver, setDragOver] = useState<string | null>(null);

//   // Payment-specific state
//   const [clientSecret, setClientSecret] = useState<string | null>(null);
//   const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
//   const [cardholderName, setCardholderName] = useState('');
//   const [paymentError, setPaymentError] = useState<string | null>(null);
//   const [isCreatingIntent, setIsCreatingIntent] = useState(false);
//   const [cardComplete, setCardComplete] = useState({
//     number: false,
//     expiry: false,
//     cvc: false,
//   });

//   const totalPrice = isFreeService
//     ? 0
//     : speedTier === 'fast-track'
//     ? service.priceFastTrack
//     : service.priceStandard;

//   const isFieldVisible = useCallback(
//     (field: FormField): boolean => {
//       if (!field.conditionalOn) return true;
//       const { field: condField, value: condValue } = field.conditionalOn;
//       return formData[condField] === condValue;
//     },
//     [formData]
//   );

//   const visibleFields = useMemo(
//     () => service.fields.filter(isFieldVisible),
//     [service.fields, isFieldVisible]
//   );

//   const updateFormData = useCallback((field: string, value: unknown) => {
//     setFormData((prev) => ({ ...prev, [field]: value }));
//   }, []);

//   const uploadFileWithProgress = useCallback((docId: string, file: File) => {
//     const fileKey = `${docId}__${file.name}`;
//     return new Promise<void>((resolve) => {
//       let pct = 0;
//       const interval = setInterval(() => {
//         pct = Math.min(pct + 20, 95);
//         setFileProgress((prev) => ({ ...prev, [fileKey]: pct }));
//         if (pct >= 95) {
//           clearInterval(interval);
//           setFileProgress((prev) => ({ ...prev, [fileKey]: 100 }));
//           resolve();
//         }
//       }, 80);
//     });
//   }, []);

//   const handleFileAdd = useCallback(
//     async (docId: string, newFiles: File[]) => {
//       const MAX_SIZE = 10 * 1024 * 1024;
//       const valid = newFiles.filter((f) => f.size <= MAX_SIZE);
//       if (valid.length < newFiles.length) {
//         toast.error('Some files exceeded 10MB and were skipped.');
//       }
//       setFiles((prev) => ({ ...prev, [docId]: [...(prev[docId] || []), ...valid] }));
//       await Promise.all(valid.map((f) => uploadFileWithProgress(docId, f)));
//     },
//     [uploadFileWithProgress]
//   );

//   const handleFileInputChange = useCallback(
//     async (docId: string, fileList: FileList | null) => {
//       if (!fileList) return;
//       await handleFileAdd(docId, Array.from(fileList));
//     },
//     [handleFileAdd]
//   );

//   const removeFile = useCallback((docId: string, index: number) => {
//     setFiles((prev) => {
//       const updated = (prev[docId] || []).filter((_, i) => i !== index);
//       return { ...prev, [docId]: updated };
//     });
//   }, []);

//   const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>, docId: string) => {
//     e.preventDefault();
//     setDragOver(docId);
//   }, []);

//   const handleDragLeave = useCallback(() => {
//     setDragOver(null);
//   }, []);

//   const handleDrop = useCallback(
//     async (e: DragEvent<HTMLDivElement>, docId: string) => {
//       e.preventDefault();
//       setDragOver(null);
//       const droppedFiles = Array.from(e.dataTransfer.files);
//       await handleFileAdd(docId, droppedFiles);
//     },
//     [handleFileAdd]
//   );

//   // ─── Payment: Create PaymentIntent when reaching payment step ──────────────
//   const createPaymentIntent = useCallback(async () => {
//     if (clientSecret) return; // already created
//     setIsCreatingIntent(true);
//     setPaymentError(null);
//     try {
//       const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
//       const token = localStorage.getItem('authToken');

//       const res = await fetch(`${apiBase}/api/v1/services/payments/create-intent`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           ...(token ? { Authorization: `Bearer ${token}` } : {}),
//         },
//         body: JSON.stringify({
//           amount: totalPrice * 100, // Stripe expects amount in fils (smallest unit)
//           currency: 'aed',
//           serviceId: service.id,
//           serviceType: service.title,
//           speedTier,
//           metadata: {
//             serviceId: service.id,
//             speedTier,
//             userId: user?.id || 'guest',
//           },
//         }),
//       });

//       if (!res.ok) throw new Error('Failed to create payment intent');
//       const data = await res.json();
//       setClientSecret(data.clientSecret);
//       setPaymentIntentId(data.paymentIntentId);
//     } catch (err) {
//       const msg = err instanceof Error ? err.message : 'Payment setup failed';
//       setPaymentError(msg);
//       toast.error(msg);
//     } finally {
//       setIsCreatingIntent(false);
//     }
//   }, [clientSecret, totalPrice, service.id, service.title, speedTier, user?.id]);

//   // Trigger PaymentIntent creation when entering payment step
//   useEffect(() => {
//     if (!isFreeService && currentStep === PAYMENT_STEP && user && !clientSecret) {
//       void createPaymentIntent();
//     }
//   }, [currentStep, isFreeService, user, clientSecret, createPaymentIntent]);

//   // ─── Payment: Confirm card + submit check ──────────────────────────────────
//   const handlePayAndSubmit = async () => {
//     if (!stripe || !elements || !clientSecret) {
//       toast.error('Payment is not ready yet. Please wait.');
//       return;
//     }

//     const cardNumberElement = elements.getElement(CardNumberElement);
//     if (!cardNumberElement) {
//       toast.error('Card details not found.');
//       return;
//     }

//     if (!cardholderName.trim()) {
//       setPaymentError('Please enter the cardholder name.');
//       return;
//     }

//     setIsSubmitting(true);
//     setPaymentError(null);

//     try {
//       // 1. Confirm card payment
//       const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
//         clientSecret,
//         {
//           payment_method: {
//             card: cardNumberElement,
//             billing_details: {
//               name: cardholderName,
//               email: user?.email,
//             },
//           },
//         }
//       );

//       if (stripeError) {
//         setPaymentError(stripeError.message || 'Payment failed');
//         toast.error(stripeError.message || 'Payment failed');
//         setIsSubmitting(false);
//         return;
//       }

//       if (paymentIntent?.status !== 'succeeded') {
//         setPaymentError('Payment did not succeed.');
//         toast.error('Payment did not succeed.');
//         setIsSubmitting(false);
//         return;
//       }

//       // 2. Submit the check with the verified paymentIntentId
//       await submitCheck(paymentIntent.id);
//     } catch (err) {
//       const msg = err instanceof Error ? err.message : 'Payment failed';
//       setPaymentError(msg);
//       toast.error(msg);
//       setIsSubmitting(false);
//     }
//   };

//   const submitCheck = async (verifiedPaymentIntentId?: string) => {
//     try {
//       const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
//       const token = localStorage.getItem('authToken');

//       const fd = new FormData();
//       fd.append('serviceId', service.id);
//       fd.append('serviceType', service.title);
//       fd.append('identifiers', JSON.stringify(formData));
//       fd.append('speedTier', speedTier);

//       if (verifiedPaymentIntentId) {
//         fd.append('paymentIntentId', verifiedPaymentIntentId);
//       }

//       Object.values(files).flat().forEach((file) => {
//         fd.append('documents', file);
//       });

//       const res = await fetch(`${apiBase}/api/v1/checks`, {
//         method: 'POST',
//         headers: token ? { Authorization: `Bearer ${token}` } : {},
//         body: fd,
//       });

//       if (!res.ok) throw new Error('Submit failed');

//       setSubmitSuccess(true);
//       toast.success(t('checks.successTitle'));
//       setTimeout(() => handleClose(), 2500);
//     } catch {
//       toast.error(t('checks.errorSubmit'));
//       setIsSubmitting(false);
//     }
//   };

//   // For free services — submit directly from Review step
//   const handleFreeSubmit = async () => {
//     setIsSubmitting(true);
//     await submitCheck();
//   };

//   const handleClose = () => {
//     setCurrentStep(1);
//     setDirection(1);
//     setFormData({});
//     setFiles({});
//     setFileProgress({});
//     setSpeedTier('standard');
//     setIsSubmitting(false);
//     setSubmitSuccess(false);
//     setDragOver(null);
//     setClientSecret(null);
//     setPaymentIntentId(null);
//     setCardholderName('');
//     setPaymentError(null);
//     setCardComplete({ number: false, expiry: false, cvc: false });
//     onClose();
//   };

//   const goNext = () => {
//     if (currentStep < TOTAL_STEPS) {
//       setDirection(1);
//       setCurrentStep((prev) => prev + 1);
//     }
//   };

//   const goBack = () => {
//     if (currentStep > 1) {
//       setDirection(-1);
//       setCurrentStep((prev) => prev - 1);
//     }
//   };

//   const fileProgressKey = (docId: string, file: File) => `${docId}__${file.name}`;

//   // Card element styling (matches Tailwind theme variables)
//   const cardElementOptions = {
//     style: {
//       base: {
//         fontSize: '15px',
//         color: 'hsl(var(--foreground))',
//         fontFamily: 'inherit',
//         '::placeholder': {
//           color: 'hsl(var(--muted-foreground))',
//         },
//         iconColor: 'hsl(var(--primary))',
//       },
//       invalid: {
//         color: 'hsl(var(--destructive))',
//         iconColor: 'hsl(var(--destructive))',
//       },
//     },
//   };

//   const allCardFieldsComplete =
//     cardComplete.number && cardComplete.expiry && cardComplete.cvc && cardholderName.trim().length > 0;

//   return (
//     <Sheet open={isOpen} onOpenChange={handleClose}>
//       <SheetContent
//         side="right"
//         className="w-full sm:max-w-xl p-0 flex flex-col bg-background overflow-hidden"
//       >
//         {/* Header */}
//         <SheetHeader className="px-6 py-4 border-b border-border bg-card shrink-0">
//           <div className="flex items-center gap-4">
//             <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-muted shrink-0">
//               <img
//                 src={service.image}
//                 alt={service.title}
//                 width={48}
//                 height={48}
//                 className="object-cover w-full h-full"
//               />
//             </div>
//             <div className="flex-1 min-w-0">
//               <SheetTitle className="text-base leading-tight truncate">{service.title}</SheetTitle>
//               <p className="text-xs text-muted-foreground mt-0.5">
//                 {t('checks.via')} {service.authority}
//               </p>
//             </div>
//             {isFreeService && (
//               <Badge className="bg-green-500/15 text-green-600 border-green-500/30 shrink-0">
//                 {t('checks.step3.freeService')}
//               </Badge>
//             )}
//             <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full shrink-0">
//               <X className="h-5 w-5" />
//             </Button>
//           </div>
//         </SheetHeader>

//         {/* Step Indicator */}
//         <div className="px-6 py-3 border-b border-border bg-muted/30 shrink-0">
//           <div className="w-full h-1 bg-border rounded-full mb-3 overflow-hidden">
//             <motion.div
//               className="h-full bg-primary rounded-full"
//               animate={{ width: `${((currentStep - 1) / (TOTAL_STEPS - 1)) * 100}%` }}
//               transition={{ duration: 0.3 }}
//             />
//           </div>
//           <div className="flex items-center justify-between">
//             {STEPS.map((step, index) => (
//               <div key={step.id} className="flex items-center">
//                 <div className="flex flex-col items-center">
//                   <div
//                     className={cn(
//                       'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all duration-200',
//                       currentStep === step.id
//                         ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
//                         : currentStep > step.id
//                         ? 'bg-green-500 text-white'
//                         : 'bg-muted text-muted-foreground'
//                     )}
//                   >
//                     {currentStep > step.id ? <Check className="h-3.5 w-3.5" /> : step.id}
//                   </div>
//                   <span
//                     className={cn(
//                       'text-[10px] mt-1 hidden sm:block font-medium transition-colors',
//                       currentStep === step.id ? 'text-primary' : 'text-muted-foreground'
//                     )}
//                   >
//                     {step.label}
//                   </span>
//                 </div>
//                 {index < STEPS.length - 1 && (
//                   <div
//                     className={cn(
//                       'h-px w-8 sm:w-14 mx-2 transition-colors duration-300',
//                       currentStep > step.id ? 'bg-green-500' : 'bg-border'
//                     )}
//                   />
//                 )}
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Scrollable Content */}
//         <div className="flex-1 overflow-y-auto">
//           <AnimatePresence mode="wait" custom={direction}>
//             <motion.div
//               key={currentStep}
//               custom={direction}
//               variants={slideVariants}
//               initial="initial"
//               animate="animate"
//               exit="exit"
//               transition={{ duration: 0.25, ease: 'easeInOut' }}
//               className="px-6 py-6"
//             >
//               {/* ── Step 1: Documents ── */}
//               {currentStep === 1 && (
//                 <div className="space-y-6">
//                   <div>
//                     <h3 className="text-lg font-semibold mb-1">{t('checks.step2.title')}</h3>
//                     <p className="text-sm text-muted-foreground">{t('checks.step2.subtitle')}</p>
//                   </div>

//                   <div className="space-y-5">
//                     {service.documents.map((doc) => {
//                       const docFiles = files[doc.id] || [];
//                       const isDragging = dragOver === doc.id;

//                       return (
//                         <div key={doc.id} className="space-y-2">
//                           <Label className="flex items-center gap-1 text-sm font-medium">
//                             {doc.label}
//                             {doc.required && <span className="text-destructive">*</span>}
//                           </Label>

//                           <div
//                             className={cn(
//                               'relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200',
//                               isDragging
//                                 ? 'border-primary bg-primary/10 scale-[1.01]'
//                                 : docFiles.length > 0
//                                 ? 'border-green-500 bg-green-500/5'
//                                 : 'border-border hover:border-primary/60 hover:bg-primary/5'
//                             )}
//                             onClick={() => document.getElementById(`file-${doc.id}`)?.click()}
//                             onDragOver={(e) => handleDragOver(e, doc.id)}
//                             onDragLeave={handleDragLeave}
//                             onDrop={(e) => handleDrop(e, doc.id)}
//                           >
//                             <input
//                               id={`file-${doc.id}`}
//                               type="file"
//                               accept="image/*,application/pdf,.heic"
//                               multiple={doc.multiple ?? true}
//                               className="hidden"
//                               onChange={(e) => handleFileInputChange(doc.id, e.target.files)}
//                             />
//                             <Upload
//                               className={cn(
//                                 'h-7 w-7 mx-auto mb-2 transition-colors',
//                                 docFiles.length > 0 ? 'text-green-500' : 'text-muted-foreground'
//                               )}
//                             />
//                             <p className="text-sm font-medium">
//                               {docFiles.length > 0
//                                 ? `${docFiles.length} ${t('checks.files')}`
//                                 : t('checks.step2.dragDrop')}
//                             </p>
//                             {doc.helpText && (
//                               <p className="text-xs text-muted-foreground mt-1">{doc.helpText}</p>
//                             )}
//                           </div>

//                           {docFiles.length > 0 && (
//                             <div className="space-y-2">
//                               {docFiles.map((file, index) => {
//                                 const key = fileProgressKey(doc.id, file);
//                                 const progress = fileProgress[key] ?? 100;
//                                 const isUploading = progress < 100;

//                                 return (
//                                   <motion.div
//                                     key={`${file.name}-${index}`}
//                                     initial={{ opacity: 0, y: -4 }}
//                                     animate={{ opacity: 1, y: 0 }}
//                                     className="rounded-lg border border-border bg-muted/40 overflow-hidden"
//                                   >
//                                     <div className="flex items-center gap-3 px-3 py-2.5">
//                                       <File className="h-4 w-4 text-primary shrink-0" />
//                                       <div className="flex-1 min-w-0">
//                                         <p className="text-sm truncate font-medium">{file.name}</p>
//                                         <p className="text-xs text-muted-foreground">
//                                           {isUploading
//                                             ? `${t('checks.step2.uploading')} ${progress}%`
//                                             : `${(file.size / 1024 / 1024).toFixed(2)} MB — ${t('checks.step2.uploaded')}`}
//                                         </p>
//                                       </div>
//                                       {!isUploading && (
//                                         <Button
//                                           variant="ghost"
//                                           size="icon"
//                                           className="h-7 w-7 shrink-0"
//                                           onClick={(e) => {
//                                             e.stopPropagation();
//                                             removeFile(doc.id, index);
//                                           }}
//                                         >
//                                           <Trash2 className="h-3.5 w-3.5 text-destructive" />
//                                           <span className="sr-only">{t('checks.remove')}</span>
//                                         </Button>
//                                       )}
//                                     </div>
//                                     {isUploading && (
//                                       <div className="h-0.5 bg-border">
//                                         <motion.div
//                                           className="h-full bg-primary"
//                                           animate={{ width: `${progress}%` }}
//                                           transition={{ duration: 0.1 }}
//                                         />
//                                       </div>
//                                     )}
//                                   </motion.div>
//                                 );
//                               })}
//                             </div>
//                           )}
//                         </div>
//                       );
//                     })}
//                   </div>
//                 </div>
//               )}

//               {/* ── Step 2: Speed ── */}
//               {currentStep === 2 && (
//                 <div className="space-y-6">
//                   <div>
//                     <h3 className="text-lg font-semibold mb-1">{t('checks.step3.title')}</h3>
//                     <p className="text-sm text-muted-foreground">{t('checks.step3.subtitle')}</p>
//                   </div>

//                   {isFreeService ? (
//                     <div className="rounded-xl border-2 border-green-500 bg-green-500/8 p-6 text-center space-y-2">
//                       <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-green-500/15">
//                         <Check className="h-6 w-6 text-green-600" />
//                       </div>
//                       <h4 className="font-semibold text-green-700 dark:text-green-400">
//                         {t('checks.step3.freeService')}
//                       </h4>
//                       <p className="text-sm text-muted-foreground">{t('checks.step3.freeDesc')}</p>
//                     </div>
//                   ) : (
//                     <RadioGroup
//                       value={speedTier}
//                       onValueChange={(v) => {
//                         setSpeedTier(v as 'standard' | 'fast-track');
//                         // Reset payment intent if speed changes (price changes)
//                         setClientSecret(null);
//                         setPaymentIntentId(null);
//                       }}
//                       className="space-y-3"
//                     >
//                       <label
//                         className={cn(
//                           'flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all',
//                           speedTier === 'standard'
//                             ? 'border-primary bg-primary/5'
//                             : 'border-border hover:border-primary/50'
//                         )}
//                       >
//                         <RadioGroupItem value="standard" className="mt-1" />
//                         <div className="flex-1">
//                           <div className="flex items-center gap-2">
//                             <Clock className="h-4 w-4 text-muted-foreground" />
//                             <span className="font-semibold">{t('checks.step3.standard')}</span>
//                           </div>
//                           <p className="text-sm text-muted-foreground mt-1">{t('checks.standard.time')}</p>
//                         </div>
//                         <div className="text-right shrink-0">
//                           <p className="text-xl font-bold">AED {service.priceStandard}</p>
//                         </div>
//                       </label>

//                       <label
//                         className={cn(
//                           'flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all relative overflow-hidden',
//                           speedTier === 'fast-track'
//                             ? 'border-amber-500 bg-amber-500/8'
//                             : 'border-border hover:border-amber-500/50'
//                         )}
//                       >
//                         <RadioGroupItem value="fast-track" className="mt-1" />
//                         <div className="flex-1">
//                           <div className="flex items-center gap-2 flex-wrap">
//                             <Zap className="h-4 w-4 text-amber-500" />
//                             <span className="font-semibold">{t('checks.step3.fastTrack')}</span>
//                             <Badge
//                               variant="secondary"
//                               className="bg-amber-500/15 text-amber-700 dark:text-amber-400 text-xs border-0"
//                             >
//                               Priority
//                             </Badge>
//                           </div>
//                           <p className="text-sm text-muted-foreground mt-1">{t('checks.fastTrack.time')}</p>
//                         </div>
//                         <div className="text-right shrink-0">
//                           <p className="text-xl font-bold">AED {service.priceFastTrack}</p>
//                         </div>
//                       </label>
//                     </RadioGroup>
//                   )}

//                   <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-amber-500/10 border border-primary/20">
//                     <div className="flex items-center gap-3">
//                       <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
//                         <Sparkles className="h-4 w-4 text-amber-600" />
//                       </div>
//                       <div className="flex-1 min-w-0">
//                         <p className="font-semibold text-sm">{t('checks.step3.bundleTitle')}</p>
//                         <p className="text-xs text-muted-foreground">{t('checks.step3.bundleDesc')}</p>
//                       </div>
//                       <Button variant="outline" size="sm" className="rounded-full shrink-0 text-xs">
//                         Bundle
//                       </Button>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {/* ── Step 3: Review ── */}
//               {currentStep === 3 && (
//                 <div className="space-y-6">
//                   {submitSuccess ? (
//                     <motion.div
//                       initial={{ opacity: 0, scale: 0.95 }}
//                       animate={{ opacity: 1, scale: 1 }}
//                       className="flex flex-col items-center justify-center py-12 text-center space-y-4"
//                     >
//                       <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/15">
//                         <CheckCircle className="h-10 w-10 text-green-500" />
//                       </div>
//                       <h3 className="text-2xl font-bold">{t('checks.successTitle')}</h3>
//                       <p className="text-muted-foreground max-w-xs">{t('checks.successDesc')}</p>
//                       <Button onClick={handleClose} className="mt-2 rounded-full px-8">
//                         {t('common.close')}
//                       </Button>
//                     </motion.div>
//                   ) : (
//                     <>
//                       <div>
//                         <h3 className="text-lg font-semibold mb-1">{t('checks.step4.title')}</h3>
//                         <p className="text-sm text-muted-foreground">{t('checks.step4.subtitle')}</p>
//                       </div>

//                       <div className="rounded-xl border border-border overflow-hidden">
//                         <div className="p-4 bg-muted/40 flex items-center gap-3">
//                           <div className="h-11 w-11 rounded-lg overflow-hidden shrink-0">
//                             <img
//                               src={service.image}
//                               alt={service.title}
//                               width={44}
//                               height={44}
//                               className="object-cover w-full h-full"
//                             />
//                           </div>
//                           <div className="min-w-0">
//                             <p className="font-semibold truncate">{service.title}</p>
//                             <p className="text-xs text-muted-foreground">
//                               {t('checks.authority')}: {service.authority}
//                             </p>
//                           </div>
//                         </div>

//                         <div className="p-4 space-y-2.5 divide-y divide-border/60">
//                           {Object.entries(formData).slice(0, 4).map(([key, value]) => (
//                             <div key={key} className="flex justify-between text-sm pt-2 first:pt-0">
//                               <span className="text-muted-foreground capitalize">
//                                 {key.replace(/([A-Z])/g, ' $1').trim()}
//                               </span>
//                               <span className="font-medium text-right max-w-[55%] truncate">
//                                 {typeof value === 'boolean'
//                                   ? value
//                                     ? 'Yes'
//                                     : 'No'
//                                   : typeof value === 'object' && value !== null
//                                   ? JSON.stringify(value)
//                                   : String(value).slice(-8)}
//                               </span>
//                             </div>
//                           ))}
//                           <div className="flex justify-between text-sm pt-2">
//                             <span className="text-muted-foreground">{t('checks.step4.documents')}</span>
//                             <span className="font-medium">
//                               {Object.values(files).flat().length} {t('checks.files')}
//                             </span>
//                           </div>
//                           {!isFreeService && (
//                             <div className="flex justify-between text-sm pt-2">
//                               <span className="text-muted-foreground">Speed</span>
//                               <Badge variant="outline" className="text-xs">
//                                 {speedTier === 'fast-track'
//                                   ? t('checks.step3.fastTrack')
//                                   : t('checks.step3.standard')}
//                               </Badge>
//                             </div>
//                           )}
//                         </div>

//                         <div className="p-4 border-t border-border bg-muted/30 flex justify-between items-center">
//                           <span className="text-sm text-muted-foreground">{t('checks.step4.total')}</span>
//                           {isFreeService ? (
//                             <Badge className="bg-green-500/15 text-green-600 border-green-500/30 text-base px-3 py-1">
//                               {t('checks.step4.free')}
//                             </Badge>
//                           ) : (
//                             <span className="text-2xl font-bold">AED {totalPrice}</span>
//                           )}
//                         </div>
//                       </div>

//                       {!user ? (
//                         <div className="rounded-xl border border-border bg-card p-6 text-center space-y-4">
//                           <ShieldCheck className="h-10 w-10 mx-auto text-primary" />
//                           <div>
//                             <h3 className="font-semibold">{t('checks.loginRequired')}</h3>
//                             <p className="text-sm text-muted-foreground mt-1">{t('checks.loginDesc')}</p>
//                           </div>
//                           <div className="flex gap-3 justify-center flex-wrap">
//                             <Button onClick={() => navigate('/auth')} className="rounded-full px-6">
//                               {t('checks.signIn')}
//                             </Button>
//                             <Button
//                               variant="outline"
//                               onClick={() => navigate('/auth?tab=signup')}
//                               className="rounded-full px-6"
//                             >
//                               {t('checks.createAccount')}
//                             </Button>
//                           </div>
//                         </div>
//                       ) : (
//                         <div className="space-y-2">
//                           <div className="flex items-center gap-2 text-sm text-muted-foreground">
//                             <Shield className="h-4 w-4 text-green-500 shrink-0" />
//                             <span>Submitted to ICP-authorized typing centre</span>
//                           </div>
//                           <div className="flex items-center gap-2 text-sm text-muted-foreground">
//                             <CreditCard className="h-4 w-4 text-primary shrink-0" />
//                             <span>Stripe secure payment</span>
//                           </div>
//                           <div className="flex items-center gap-2 text-sm text-muted-foreground">
//                             <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
//                             <span>Results delivered to dashboard, email &amp; WhatsApp</span>
//                           </div>
//                         </div>
//                       )}
//                     </>
//                   )}
//                 </div>
//               )}

//               {/* ── Step 4: Payment (only for paid services) ── */}
//               {currentStep === 4 && !isFreeService && (
//                 <div className="space-y-6">
//                   {submitSuccess ? (
//                     <motion.div
//                       initial={{ opacity: 0, scale: 0.95 }}
//                       animate={{ opacity: 1, scale: 1 }}
//                       className="flex flex-col items-center justify-center py-12 text-center space-y-4"
//                     >
//                       <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/15">
//                         <CheckCircle className="h-10 w-10 text-green-500" />
//                       </div>
//                       <h3 className="text-2xl font-bold">{t('checks.successTitle')}</h3>
//                       <p className="text-muted-foreground max-w-xs">{t('checks.successDesc')}</p>
//                       <Button onClick={handleClose} className="mt-2 rounded-full px-8">
//                         {t('common.close')}
//                       </Button>
//                     </motion.div>
//                   ) : (
//                     <>
//                       <div>
//                         <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
//                           <Lock className="h-5 w-5 text-primary" />
//                           Secure Payment
//                         </h3>
//                         <p className="text-sm text-muted-foreground">
//                           Enter your card details to complete the purchase. Encrypted via Stripe.
//                         </p>
//                       </div>

//                       {/* Amount summary card */}
//                       <div className="rounded-xl border border-border bg-gradient-to-br from-primary/5 to-transparent p-4 flex items-center justify-between">
//                         <div>
//                           <p className="text-xs text-muted-foreground">Amount to charge</p>
//                           <p className="text-2xl font-bold mt-0.5">AED {totalPrice}</p>
//                         </div>
//                         <Badge variant="outline" className="text-xs">
//                           {speedTier === 'fast-track' ? 'Fast-Track' : 'Standard'}
//                         </Badge>
//                       </div>

//                       {/* Loading state while creating PaymentIntent */}
//                       {isCreatingIntent && (
//                         <div className="flex items-center justify-center py-8 gap-3 text-muted-foreground">
//                           <Loader2 className="h-5 w-5 animate-spin" />
//                           <span className="text-sm">Setting up secure payment…</span>
//                         </div>
//                       )}

//                       {/* Card form */}
//                       {!isCreatingIntent && clientSecret && (
//                         <div className="space-y-4">
//                           {/* Cardholder name */}
//                           <div className="space-y-2">
//                             <Label htmlFor="cardholder-name" className="text-sm font-medium">
//                               Cardholder Name
//                             </Label>
//                             <Input
//                               id="cardholder-name"
//                               type="text"
//                               placeholder="Name as shown on card"
//                               value={cardholderName}
//                               onChange={(e) => setCardholderName(e.target.value)}
//                               className="h-11"
//                               autoComplete="cc-name"
//                             />
//                           </div>

//                           {/* Card number */}
//                           <div className="space-y-2">
//                             <Label className="text-sm font-medium">Card Number</Label>
//                             <div className="flex items-center h-11 px-3 rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring transition-shadow">
//                               <CreditCard className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
//                               <div className="flex-1">
//                                 <CardNumberElement
//                                   options={{
//                                     ...cardElementOptions,
//                                     showIcon: false,
//                                     placeholder: '1234 1234 1234 1234',
//                                   }}
//                                   onChange={(e) =>
//                                     setCardComplete((prev) => ({ ...prev, number: e.complete }))
//                                   }
//                                 />
//                               </div>
//                             </div>
//                           </div>

//                           {/* Expiry + CVC */}
//                           <div className="grid grid-cols-2 gap-3">
//                             <div className="space-y-2">
//                               <Label className="text-sm font-medium">Expiry</Label>
//                               <div className="flex items-center h-11 px-3 rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring transition-shadow">
//                                 <div className="flex-1">
//                                   <CardExpiryElement
//                                     options={{ ...cardElementOptions, placeholder: 'MM / YY' }}
//                                     onChange={(e) =>
//                                       setCardComplete((prev) => ({ ...prev, expiry: e.complete }))
//                                     }
//                                   />
//                                 </div>
//                               </div>
//                             </div>
//                             <div className="space-y-2">
//                               <Label className="text-sm font-medium">CVC</Label>
//                               <div className="flex items-center h-11 px-3 rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring transition-shadow">
//                                 <div className="flex-1">
//                                   <CardCvcElement
//                                     options={{ ...cardElementOptions, placeholder: 'CVC' }}
//                                     onChange={(e) =>
//                                       setCardComplete((prev) => ({ ...prev, cvc: e.complete }))
//                                     }
//                                   />
//                                 </div>
//                               </div>
//                             </div>
//                           </div>

//                           {/* Payment error */}
//                           {paymentError && (
//                             <motion.div
//                               initial={{ opacity: 0, y: -4 }}
//                               animate={{ opacity: 1, y: 0 }}
//                               className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30"
//                             >
//                               <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
//                               <p className="text-sm text-destructive">{paymentError}</p>
//                             </motion.div>
//                           )}

//                           {/* Trust footer */}
//                           <div className="flex items-center justify-center gap-4 pt-2 text-xs text-muted-foreground">
//                             <div className="flex items-center gap-1.5">
//                               <Lock className="h-3 w-3" />
//                               <span>SSL Encrypted</span>
//                             </div>
//                             <div className="h-3 w-px bg-border" />
//                             <div className="flex items-center gap-1.5">
//                               <Shield className="h-3 w-3" />
//                               <span>PCI-DSS</span>
//                             </div>
//                             <div className="h-3 w-px bg-border" />
//                             <span>Powered by Stripe</span>
//                           </div>
//                         </div>
//                       )}

//                       {/* Error retrieving PaymentIntent */}
//                       {!isCreatingIntent && !clientSecret && paymentError && (
//                         <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center space-y-3">
//                           <AlertCircle className="h-8 w-8 mx-auto text-destructive" />
//                           <p className="text-sm">{paymentError}</p>
//                           <Button variant="outline" size="sm" onClick={createPaymentIntent}>
//                             Retry
//                           </Button>
//                         </div>
//                       )}
//                     </>
//                   )}
//                 </div>
//               )}
//             </motion.div>
//           </AnimatePresence>
//         </div>

//         {/* Footer */}
//         {!submitSuccess && (
//           <div className="px-6 py-4 border-t border-border bg-card shrink-0">
//             <div className="flex items-center justify-between gap-3">
//               {currentStep > 1 ? (
//                 <Button variant="outline" onClick={goBack} className="gap-2" disabled={isSubmitting}>
//                   <ArrowLeft className="h-4 w-4" />
//                   {t('checks.back')}
//                 </Button>
//               ) : (
//                 <div />
//               )}

//               {/* Step 1 & 2 — simple "Continue" */}
//               {currentStep < 3 && (
//                 <Button onClick={goNext} className="gap-2 min-w-[120px]">
//                   {t('checks.continue')}
//                   <ArrowRight className="h-4 w-4" />
//                 </Button>
//               )}

//               {/* Step 3 (Review) — different action depending on free vs paid + auth */}
//               {currentStep === 3 && (
//                 <>
//                   {!user ? (
//                     <Button disabled className="gap-2 min-w-[160px] opacity-50">
//                       {isFreeService
//                         ? t('checks.step4.submitFree')
//                         : t('checks.step4.submitPay', { amount: totalPrice })}
//                     </Button>
//                   ) : isFreeService ? (
//                     <Button
//                       onClick={handleFreeSubmit}
//                       disabled={isSubmitting}
//                       className="gap-2 min-w-[160px] bg-gradient-to-r from-primary to-primary/80"
//                     >
//                       {isSubmitting ? (
//                         <motion.span
//                           animate={{ opacity: [1, 0.4, 1] }}
//                           transition={{ repeat: Infinity, duration: 1 }}
//                         >
//                           {t('checks.step4.submitting')}
//                         </motion.span>
//                       ) : (
//                         <>
//                           {t('checks.step4.submitFree')}
//                           <ArrowRight className="h-4 w-4" />
//                         </>
//                       )}
//                     </Button>
//                   ) : (
//                     /* Paid + authenticated — proceed to Payment step */
//                     <Button onClick={goNext} className="gap-2 min-w-[160px]">
//                       Continue to Payment
//                       <ArrowRight className="h-4 w-4" />
//                     </Button>
//                   )}
//                 </>
//               )}

//               {/* Step 4 (Payment) — pay & submit */}
//               {currentStep === 4 && !isFreeService && (
//                 <>
//                 <Button
//                   onClick={handlePayAndSubmit}
//                   disabled={
//                     isSubmitting ||
//                     isCreatingIntent ||
//                     !stripe ||
//                     !clientSecret ||
//                     !allCardFieldsComplete
//                   }
//                   className="gap-2 min-w-[180px] bg-gradient-to-r from-primary to-primary/80"
//                   >
//                   {isSubmitting ? (
//                     <>
//                       <Loader2 className="h-4 w-4 animate-spin" />
//                       <span>Processing…</span>
//                     </>
//                   ) : (
//                     <>
//                       <Lock className="h-4 w-4" />
//                       Pay AED {totalPrice}
//                     </>
//                   )}
//                 </Button>
             
//                   </>
//               )}
//             </div>
           
//           </div>
//         )}
//            <div className="overflow-y-auto max-h-[200px]"
//             >

//             <SubscriptionPage />
//             </div>
//       </SheetContent>
     
//     </Sheet>
//   );
// }

// // ─── Form Field Renderer (unchanged from your original) ────────────────────────
// // Keeping the FormFieldRenderer in case you re-enable Step 1 (Identifiers) later

// function FormFieldRenderer({
//   field,
//   value,
//   onChange,
// }: {
//   field: FormField;
//   value: unknown;
//   onChange: (value: unknown) => void;
// }) {
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   switch (field.type) {
//     case 'text':
//     case 'passport':
//     case 'uid':
//       return (
//         <div className="space-y-2">
//           <Label htmlFor={field.id} className="flex items-center gap-1">
//             {field.label}
//             {field.required && <span className="text-destructive">*</span>}
//           </Label>
//           <Input
//             id={field.id}
//             type="text"
//             placeholder={field.placeholder}
//             value={(value as string) || ''}
//             onChange={(e) =>
//               onChange(field.type === 'text' ? e.target.value : e.target.value.toUpperCase())
//             }
//             className={cn(
//               'h-11',
//               (field.type === 'passport' || field.type === 'uid') && 'font-mono tracking-wider'
//             )}
//           />
//           {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
//         </div>
//       );

//     case 'emirates-id':
//       return (
//         <div className="space-y-2">
//           <Label htmlFor={field.id} className="flex items-center gap-1">
//             {field.label}
//             {field.required && <span className="text-destructive">*</span>}
//           </Label>
//           <Input
//             id={field.id}
//             type="text"
//             placeholder={field.placeholder || '784-XXXX-XXXXXXX-X'}
//             value={(value as string) || ''}
//             onChange={(e) => {
//               let v = e.target.value.replace(/\D/g, '').slice(0, 15);
//               if (v.length > 3) v = v.slice(0, 3) + '-' + v.slice(3);
//               if (v.length > 8) v = v.slice(0, 8) + '-' + v.slice(8);
//               if (v.length > 16) v = v.slice(0, 16) + '-' + v.slice(16);
//               onChange(v);
//             }}
//             className="h-11 font-mono tracking-wider"
//           />
//           {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
//         </div>
//       );

//     case 'phone':
//       return (
//         <div className="space-y-2">
//           <Label htmlFor={field.id} className="flex items-center gap-1">
//             {field.label}
//             {field.required && <span className="text-destructive">*</span>}
//           </Label>
//           <div className="flex gap-2">
//             <Select defaultValue="+971">
//               <SelectTrigger className="w-24 h-11 shrink-0">
//                 <SelectValue />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="+971">+971</SelectItem>
//                 <SelectItem value="+966">+966</SelectItem>
//                 <SelectItem value="+91">+91</SelectItem>
//                 <SelectItem value="+92">+92</SelectItem>
//                 <SelectItem value="+1">+1</SelectItem>
//                 <SelectItem value="+44">+44</SelectItem>
//               </SelectContent>
//             </Select>
//             <Input
//               id={field.id}
//               type="tel"
//               placeholder="50 XXX XXXX"
//               value={(value as string) || ''}
//               onChange={(e) => onChange(e.target.value)}
//               className="h-11 flex-1"
//             />
//           </div>
//           {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
//         </div>
//       );

//     case 'date':
//       return (
//         <div className="space-y-2">
//           <Label htmlFor={field.id} className="flex items-center gap-1">
//             {field.label}
//             {field.required && <span className="text-destructive">*</span>}
//           </Label>
//           <div className="flex gap-2">
//             <Select onValueChange={(day) => onChange({ ...((value as Record<string, string>) || {}), day })}>
//               <SelectTrigger className="flex-1 h-11">
//                 <SelectValue placeholder="Day" />
//               </SelectTrigger>
//               <SelectContent>
//                 {Array.from({ length: 31 }, (_, i) => (
//                   <SelectItem key={i + 1} value={String(i + 1).padStart(2, '0')}>
//                     {i + 1}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//             <Select
//               onValueChange={(month) => onChange({ ...((value as Record<string, string>) || {}), month })}
//             >
//               <SelectTrigger className="flex-1 h-11">
//                 <SelectValue placeholder="Month" />
//               </SelectTrigger>
//               <SelectContent>
//                 {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(
//                   (m, i) => (
//                     <SelectItem key={m} value={String(i + 1).padStart(2, '0')}>
//                       {m}
//                     </SelectItem>
//                   )
//                 )}
//               </SelectContent>
//             </Select>
//             <Select onValueChange={(year) => onChange({ ...((value as Record<string, string>) || {}), year })}>
//               <SelectTrigger className="flex-1 h-11">
//                 <SelectValue placeholder="Year" />
//               </SelectTrigger>
//               <SelectContent>
//                 {Array.from({ length: 80 }, (_, i) => (
//                   <SelectItem key={i} value={String(2024 - i)}>
//                     {2024 - i}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>
//         </div>
//       );

//     case 'nationality':
//       return (
//         <div className="space-y-2">
//           <Label className="flex items-center gap-1">
//             {field.label}
//             {field.required && <span className="text-destructive">*</span>}
//           </Label>
//           <Select onValueChange={onChange} value={value as string}>
//             <SelectTrigger className="h-11">
//               <SelectValue placeholder="Select nationality" />
//             </SelectTrigger>
//             <SelectContent>
//               {NATIONALITIES.map((nat) => (
//                 <SelectItem key={nat.value} value={nat.value}>
//                   {nat.label}
//                 </SelectItem>
//               ))}
//             </SelectContent>
//           </Select>
//         </div>
//       );

//     case 'radio':
//       return (
//         <div className="space-y-3">
//           <Label className="flex items-center gap-1">
//             {field.label}
//             {field.required && <span className="text-destructive">*</span>}
//           </Label>
//           <RadioGroup value={value as string} onValueChange={onChange} className="flex flex-wrap gap-2">
//             {field.options?.map((option) => (
//               <label
//                 key={option.value}
//                 className={cn(
//                   'flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors text-sm',
//                   value === option.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
//                 )}
//               >
//                 <RadioGroupItem value={option.value} />
//                 <span className="font-medium">{option.label}</span>
//               </label>
//             ))}
//           </RadioGroup>
//           {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
//         </div>
//       );

//     case 'toggle':
//       return (
//         <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
//           <div>
//             <Label htmlFor={field.id} className="flex items-center gap-1 cursor-pointer">
//               {field.label}
//               {field.required && <span className="text-destructive">*</span>}
//             </Label>
//             {field.helpText && <p className="text-xs text-muted-foreground mt-0.5">{field.helpText}</p>}
//           </div>
//           <Switch id={field.id} checked={Boolean(value)} onCheckedChange={onChange} />
//         </div>
//       );

//     case 'checkbox-group':
//       return (
//         <div className="space-y-3">
//           <Label className="flex items-center gap-1">
//             {field.label}
//             {field.required && <span className="text-destructive">*</span>}
//           </Label>
//           <div className="grid grid-cols-2 gap-2">
//             {field.options?.map((option) => {
//               const selected = Array.isArray(value) && value.includes(option.value);
//               return (
//                 <label
//                   key={option.value}
//                   className={cn(
//                     'flex items-center gap-2 px-3 py-3 rounded-lg border cursor-pointer transition-colors text-sm',
//                     selected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
//                   )}
//                 >
//                   <Checkbox
//                     checked={selected}
//                     onCheckedChange={(checked) => {
//                       const current = Array.isArray(value) ? value : [];
//                       onChange(
//                         checked ? [...current, option.value] : current.filter((v: string) => v !== option.value)
//                       );
//                     }}
//                   />
//                   <span className="font-medium">{option.label}</span>
//                 </label>
//               );
//             })}
//           </div>
//           {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
//         </div>
//       );

//     case 'file':
//     case 'multi-file':
//       return (
//         <div className="space-y-2">
//           <Label className="flex items-center gap-1">
//             {field.label}
//             {field.required && <span className="text-destructive">*</span>}
//           </Label>
//           <div
//             className="border-2 border-dashed rounded-xl p-5 text-center cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-colors"
//             onClick={() => fileInputRef.current?.click()}
//           >
//             <input
//               ref={fileInputRef}
//               type="file"
//               accept="image/*,application/pdf,.heic"
//               multiple={field.type === 'multi-file'}
//               className="hidden"
//               onChange={(e) => {
//                 if (!e.target.files) return;
//                 const arr = Array.from(e.target.files);
//                 const current = Array.isArray(value) ? (value as File[]) : [];
//                 onChange([...current, ...arr]);
//               }}
//             />
//             <Upload className="h-6 w-6 mx-auto mb-1.5 text-muted-foreground" />
//             <p className="text-sm text-muted-foreground">Click to upload</p>
//           </div>
//           {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
//         </div>
//       );

//     default:
//       return null;
//   }
// }



// // ═══════════════════════════════════════════════════════════════════════════
// // MAIN
// // ═══════════════════════════════════════════════════════════════════════════

// export function SubscriptionPage() {
//   return (
//     <Elements stripe={stripePromise}>
//       <SubscriptionPageInner />
//     </Elements>
//   );
// }

// function SubscriptionPageInner() {
//   const { user } = useAuth();
//   const stripe = useStripe();
//   const elements = useElements();

//   const [selectedPlan, setSelectedPlan] = useState<Plan>(PLANS[1]); // yearly default
//   const [step, setStep] = useState<'select' | 'payment'>('select');
//   const [cardholderName, setCardholderName] = useState('');
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [paymentError, setPaymentError] = useState<string | null>(null);
//   const [success, setSuccess] = useState(false);
//   const [cardComplete, setCardComplete] = useState({ number: false, expiry: false, cvc: false });
//   const [currentSub, setCurrentSub] = useState<any>(null);
//   const [loadingCurrent, setLoadingCurrent] = useState(true);
//   const eidActive = isEidOfferActive();

//   // Fetch current sub
//   useEffect(() => {
//     if (!user) {
//       setLoadingCurrent(false);
//       return;
//     }
//     (async () => {
//       try {
//         const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
//         const token = localStorage.getItem('authToken');
//         const res = await fetch(`${apiBase}/api/v1/services/payments/subscriptions/current`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         const data = await res.json();
//         if (data.success && data.subscription) setCurrentSub(data.subscription);
//       } finally {
//         setLoadingCurrent(false);
//       }
//     })();
//   }, [user]);

//   const effectivePlan = getEffectivePlan(selectedPlan);

//   const handleSubscribe = async () => {
//     if (!stripe || !elements) return;
//     if (!cardholderName.trim()) {
//       setPaymentError('Please enter cardholder name');
//       return;
//     }
//     const cardNumberEl = elements.getElement(CardNumberElement);
//     if (!cardNumberEl) return;

//     setIsProcessing(true);
//     setPaymentError(null);

//     try {
//       // 1. Create PaymentMethod
//       const { paymentMethod, error: pmError } = await stripe.createPaymentMethod({
//         type: 'card',
//         card: cardNumberEl,
//         billing_details: { name: cardholderName, email: user?.email },
//       });
//       if (pmError) {
//         setPaymentError(pmError.message || 'Card error');
//         setIsProcessing(false);
//         return;
//       }

//       // 2. Create subscription on backend
//       const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
//       const token = localStorage.getItem('authToken');
//       const res = await fetch(`${apiBase}/api/v1/services/payments/subscriptions`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({
//           lookupKey: effectivePlan.lookupKey,
//           paymentMethodId: paymentMethod.id,
//         }),
//       });
//       const data = await res.json();

//       if (!data.success) {
//         setPaymentError(data.message || 'Subscription failed');
//         setIsProcessing(false);
//         return;
//       }

//       // 3. Confirm if 3DS required
//       if (data.clientSecret) {
//         const { error: confirmError } = await stripe.confirmCardPayment(data.clientSecret);
//         if (confirmError) {
//           setPaymentError(confirmError.message || 'Payment confirmation failed');
//           setIsProcessing(false);
//           return;
//         }
//       }

//       setSuccess(true);
//       toast.success('You are now subscribed!');
//     } catch (err) {
//       const msg = err instanceof Error ? err.message : 'Something went wrong';
//       setPaymentError(msg);
//       toast.error(msg);
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   const cardElementOptions = {
//     style: {
//       base: {
//         fontSize: '15px',
//         color: 'hsl(var(--foreground))',
//         fontFamily: 'inherit',
//         '::placeholder': { color: 'hsl(var(--muted-foreground))' },
//         iconColor: 'hsl(var(--primary))',
//       },
//       invalid: { color: 'hsl(var(--destructive))', iconColor: 'hsl(var(--destructive))' },
//     },
//   };

//   const allFieldsValid =
//     cardComplete.number && cardComplete.expiry && cardComplete.cvc && cardholderName.trim().length > 0;

//   // ─── SUCCESS ───
//   if (success) {
//     return (
//       <div className="max-w-2xl mx-auto p-8">
//         <motion.div
//           initial={{ opacity: 0, scale: 0.95 }}
//           animate={{ opacity: 1, scale: 1 }}
//           className="flex flex-col items-center justify-center py-16 text-center space-y-4"
//         >
//           <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/15">
//             <Check className="h-10 w-10 text-green-500" />
//           </div>
//           <h2 className="text-3xl font-bold">You're subscribed!</h2>
//           <p className="text-muted-foreground max-w-md">
//             Welcome to Tammat {selectedPlan.label}. You can manage your subscription anytime from your dashboard.
//           </p>
//           <Button
//             onClick={() => (window.location.href = '/customer-dashboard')}
//             className="rounded-full px-8 mt-4"
//           >
//             Go to Dashboard
//           </Button>
//         </motion.div>
//       </div>
//     );
//   }

//   // ─── ALREADY SUBSCRIBED ───
//   if (loadingCurrent) {
//     return (
//       <div className="flex items-center justify-center py-24 text-muted-foreground gap-2">
//         <Loader2 className="h-5 w-5 animate-spin" />
//         <span>Loading…</span>
//       </div>
//     );
//   }

//   if (currentSub && (currentSub.status === 'active' || currentSub.status === 'trialing')) {
//     return <ManageSubscriptionView subscription={currentSub} />;
//   }

//   // ─── PLAN SELECTION ───
//   if (step === 'select') {
//     return (
//       <div className="max-w-5xl mx-auto p-6 space-y-8">
//         <div className="text-center space-y-2">
//           <h1 className="text-3xl md:text-4xl font-bold">Tammat Membership</h1>
//           <p className="text-muted-foreground">
//             Unlimited document checks. Cancel anytime.
//           </p>
//         </div>

//         {/* Eid offer banner */}
//         {eidActive && (
//           <motion.div
//             initial={{ opacity: 0, y: -8 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="rounded-2xl border-2 border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-emerald-500/10 p-4 flex items-center gap-3"
//           >
//             <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
//               <Gift className="h-5 w-5 text-amber-600" />
//             </div>
//             <div className="flex-1 min-w-0">
//               <p className="font-semibold text-sm">Eid special — save up to AED 50</p>
//               <p className="text-xs text-muted-foreground">
//                 Limited time. Offer ends{' '}
//                 {EID_OFFER_END.toLocaleDateString('en-GB', {
//                   day: 'numeric',
//                   month: 'long',
//                   year: 'numeric',
//                 })}
//               </p>
//             </div>
//             <Badge className="bg-amber-500 text-white border-0 shrink-0 hidden sm:flex">
//               Eid Offer
//             </Badge>
//           </motion.div>
//         )}

//         {/* Plan cards */}
//         <div className="grid md:grid-cols-3 gap-4">
//           {PLANS.map((plan) => {
//             const eff = getEffectivePlan(plan);
//             const perMonth = getPerMonthAmount(plan);
//             const isSelected = selectedPlan.id === plan.id;

//             return (
//               <button
//                 key={plan.id}
//                 onClick={() => setSelectedPlan(plan)}
//                 className={cn(
//                   'relative rounded-2xl border-2 p-6 text-left transition-all',
//                   isSelected
//                     ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
//                     : 'border-border hover:border-primary/50'
//                 )}
//               >
//                 {plan.popular && (
//                   <div className="absolute -top-3 left-1/2 -translate-x-1/2">
//                     <Badge className="bg-amber-500 text-white border-0 gap-1">
//                       <Sparkles className="h-3 w-3" />
//                       Most Popular
//                     </Badge>
//                   </div>
//                 )}

//                 <div className="space-y-3">
//                   <h3 className="text-xl font-bold">{plan.label}</h3>

//                   <div>
//                     <div className="flex items-baseline gap-2 flex-wrap">
//                       <span className="text-3xl font-bold">AED {eff.amount}</span>
//                       <span className="text-muted-foreground text-sm">/{plan.intervalLabel}</span>
//                     </div>

//                     {eff.isOffer && (
//                       <div className="flex items-center gap-2 mt-1">
//                         <span className="text-sm text-muted-foreground line-through">
//                           AED {eff.regularAmount}
//                         </span>
//                         <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs">
//                           Save AED {eff.savings}
//                         </Badge>
//                       </div>
//                     )}

//                     {plan.interval !== 'month' && (
//                       <p className="text-xs text-muted-foreground mt-1">
//                         Just AED {perMonth}/month
//                       </p>
//                     )}
//                   </div>

//                   <div className="pt-3 border-t border-border space-y-2">
//                     <div className="flex items-start gap-2 text-sm">
//                       <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
//                       <span>All document checks included</span>
//                     </div>
//                     <div className="flex items-start gap-2 text-sm">
//                       <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
//                       <span>Fast-track service</span>
//                     </div>
//                     <div className="flex items-start gap-2 text-sm">
//                       <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
//                       <span>WhatsApp + email alerts</span>
//                     </div>
//                     <div className="flex items-start gap-2 text-sm">
//                       <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
//                       <span>Cancel anytime</span>
//                     </div>
//                   </div>
//                 </div>

//                 {isSelected && (
//                   <div className="absolute top-4 right-4 flex h-6 w-6 items-center justify-center rounded-full bg-primary">
//                     <Check className="h-3.5 w-3.5 text-primary-foreground" />
//                   </div>
//                 )}
//               </button>
//             );
//           })}
//         </div>

//         <div className="flex justify-center">
//           <Button
//             size="lg"
//             onClick={() => setStep('payment')}
//             className="rounded-full px-8 min-w-[220px] gap-2"
//           >
//             Continue — AED {effectivePlan.amount}
//             <Lock className="h-4 w-4" />
//           </Button>
//         </div>

//         <p className="text-center text-xs text-muted-foreground">
//           You can cancel anytime from your dashboard. No questions asked.
//         </p>
//       </div>
//     );
//   }

//   // ─── PAYMENT FORM ───
//   return (
//     <div className="max-w-xl mx-auto p-6 space-y-6">
//       <button
//         onClick={() => setStep('select')}
//         className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
//       >
//         <ArrowLeft className="h-3.5 w-3.5" />
//         Change plan
//       </button>

//       <div>
//         <h2 className="text-2xl font-bold flex items-center gap-2">
//           <Lock className="h-5 w-5 text-primary" />
//           Complete subscription
//         </h2>
//         <p className="text-muted-foreground mt-1 text-sm">
//           You'll be charged AED {effectivePlan.amount} now, then every {selectedPlan.intervalLabel}.
//         </p>
//       </div>

//       {/* Plan summary */}
//       <div className="rounded-xl border border-border bg-gradient-to-br from-primary/5 to-transparent p-4">
//         <div className="flex items-center justify-between">
//           <div>
//             <p className="font-semibold">Tammat {selectedPlan.label}</p>
//             <p className="text-xs text-muted-foreground">
//               Billed every {selectedPlan.intervalLabel}
//             </p>
//           </div>
//           <div className="text-right">
//             <p className="text-2xl font-bold">AED {effectivePlan.amount}</p>
//             {effectivePlan.isOffer && (
//               <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs mt-1">
//                 Eid offer
//               </Badge>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Card form */}
//       <div className="space-y-4">
//         <div className="space-y-2">
//           <Label htmlFor="card-name">Cardholder Name</Label>
//           <Input
//             id="card-name"
//             value={cardholderName}
//             onChange={(e) => setCardholderName(e.target.value)}
//             placeholder="Name on card"
//             className="h-11"
//             autoComplete="cc-name"
//           />
//         </div>

//         <div className="space-y-2">
//           <Label>Card Number</Label>
//           <div className="flex items-center h-11 px-3 rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring transition-shadow">
//             <CreditCard className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
//             <div className="flex-1">
//               <CardNumberElement
//                 options={{ ...cardElementOptions, showIcon: false, placeholder: '1234 1234 1234 1234' }}
//                 onChange={(e) => setCardComplete((p) => ({ ...p, number: e.complete }))}
//               />
//             </div>
//           </div>
//         </div>

//         <div className="grid grid-cols-2 gap-3">
//           <div className="space-y-2">
//             <Label>Expiry</Label>
//             <div className="flex items-center h-11 px-3 rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring transition-shadow">
//               <div className="flex-1">
//                 <CardExpiryElement
//                   options={{ ...cardElementOptions, placeholder: 'MM / YY' }}
//                   onChange={(e) => setCardComplete((p) => ({ ...p, expiry: e.complete }))}
//                 />
//               </div>
//             </div>
//           </div>
//           <div className="space-y-2">
//             <Label>CVC</Label>
//             <div className="flex items-center h-11 px-3 rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring transition-shadow">
//               <div className="flex-1">
//                 <CardCvcElement
//                   options={{ ...cardElementOptions, placeholder: 'CVC' }}
//                   onChange={(e) => setCardComplete((p) => ({ ...p, cvc: e.complete }))}
//                 />
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       <AnimatePresence>
//         {paymentError && (
//           <motion.div
//             initial={{ opacity: 0, y: -4 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0 }}
//             className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive"
//           >
//             {paymentError}
//           </motion.div>
//         )}
//       </AnimatePresence>

//       <p className="text-xs text-muted-foreground">
//         By subscribing, you agree to be charged AED {effectivePlan.amount} every {selectedPlan.intervalLabel} until you cancel.
//       </p>

//       <Button
//         onClick={handleSubscribe}
//         disabled={!stripe || isProcessing || !allFieldsValid}
//         size="lg"
//         className="w-full gap-2 bg-gradient-to-r from-primary to-primary/80"
//       >
//         {isProcessing ? (
//           <>
//             <Loader2 className="h-4 w-4 animate-spin" />
//             Processing…
//           </>
//         ) : (
//           <>
//             <Lock className="h-4 w-4" />
//             Subscribe — AED {effectivePlan.amount}
//           </>
//         )}
//       </Button>

//       <div className="flex items-center justify-center gap-3 pt-2 text-xs text-muted-foreground">
//         <div className="flex items-center gap-1.5">
//           <Lock className="h-3 w-3" />
//           SSL
//         </div>
//         <div className="h-3 w-px bg-border" />
//         <div className="flex items-center gap-1.5">
//           <Shield className="h-3 w-3" />
//           PCI-DSS
//         </div>
//         <div className="h-3 w-px bg-border" />
//         <span>Powered by Stripe</span>
//       </div>
//     </div>
//   );
// }

// // ═══════════════════════════════════════════════════════════════════════════
// // MANAGE EXISTING SUBSCRIPTION
// // ═══════════════════════════════════════════════════════════════════════════

// function ManageSubscriptionView({ subscription }: { subscription: any }) {
//   const [isCanceling, setIsCanceling] = useState(false);
//   const [showConfirm, setShowConfirm] = useState(false);

//   const handleCancel = async () => {
//     setIsCanceling(true);
//     try {
//       const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
//       const token = localStorage.getItem('authToken');
//       const res = await fetch(`${apiBase}/api/v1/services/payments/subscriptions/cancel`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({ immediately: false }),
//       });
//       const data = await res.json();
//       if (data.success) {
//         toast.success('Subscription will end at period end');
//         setTimeout(() => window.location.reload(), 1000);
//       } else {
//         toast.error(data.message || 'Cancellation failed');
//       }
//     } catch {
//       toast.error('Cancellation failed');
//     } finally {
//       setIsCanceling(false);
//     }
//   };

//   const intervalLabel =
//     subscription.intervalCount === 2 && subscription.interval === 'year'
//       ? '2 years'
//       : subscription.interval;

//   return (
//     <div className="max-w-2xl mx-auto p-6 space-y-6">
//       <div>
//         <h2 className="text-2xl font-bold">Your Subscription</h2>
//         <p className="text-muted-foreground mt-1">Manage your Tammat plan</p>
//       </div>

//       <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
//         <div className="flex items-center justify-between">
//           <div>
//             <p className="text-sm text-muted-foreground">Current plan</p>
//             <p className="text-2xl font-bold mt-0.5">{subscription.productName}</p>
//           </div>
//           {subscription.cancelAtPeriodEnd ? (
//             <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30">
//               Canceling
//             </Badge>
//           ) : (
//             <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30">
//               Active
//             </Badge>
//           )}
//         </div>

//         <div className="pt-4 border-t border-border space-y-2 text-sm">
//           <div className="flex justify-between">
//             <span className="text-muted-foreground">Amount</span>
//             <span className="font-medium">
//               AED {(subscription.amount / 100).toFixed(0)} / {intervalLabel}
//             </span>
//           </div>
//           <div className="flex justify-between">
//             <span className="text-muted-foreground">
//               {subscription.cancelAtPeriodEnd ? 'Ends on' : 'Renews on'}
//             </span>
//             <span className="font-medium">
//               {new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString('en-GB', {
//                 day: 'numeric',
//                 month: 'long',
//                 year: 'numeric',
//               })}
//             </span>
//           </div>
//         </div>

//         <div className="flex flex-wrap gap-3 pt-2">
//           {subscription.latestInvoicePdf && (
//             <Button variant="outline" asChild>
//               <a href={subscription.latestInvoicePdf} target="_blank" rel="noopener noreferrer">
//                 Download Latest Invoice
//               </a>
//             </Button>
//           )}
//           {!subscription.cancelAtPeriodEnd && (
//             <>
//               {showConfirm ? (
//                 <>
//                   <Button
//                     variant="destructive"
//                     onClick={handleCancel}
//                     disabled={isCanceling}
//                   >
//                     {isCanceling ? (
//                       <>
//                         <Loader2 className="h-4 w-4 animate-spin mr-2" />
//                         Canceling…
//                       </>
//                     ) : (
//                       'Yes, cancel'
//                     )}
//                   </Button>
//                   <Button variant="outline" onClick={() => setShowConfirm(false)}>
//                     Keep subscription
//                   </Button>
//                 </>
//               ) : (
//                 <Button
//                   variant="outline"
//                   onClick={() => setShowConfirm(true)}
//                   className="text-destructive hover:text-destructive"
//                 >
//                   Cancel Plan
//                 </Button>
//               )}
//             </>
//           )}
//         </div>

//         {subscription.cancelAtPeriodEnd && (
//           <p className="text-sm text-muted-foreground pt-2">
//             Your subscription will remain active until{' '}
//             {new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString('en-GB')}, after which it will not renew.
//           </p>
//         )}
//       </div>
//     </div>
//   );
// }

"use client";

import { useState, useCallback, useMemo, useRef, DragEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  X,
  ArrowLeft,
  ArrowRight,
  Upload,
  Trash2,
  Check,
  Clock,
  Zap,
  Shield,
  CreditCard,
  File,
  AlertCircle,
  ShieldCheck,
  CheckCircle,
  Crown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { Service, FormField } from '@/lib/services';
import { NATIONALITIES } from '@/lib/services';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { SubscriptionUpsellCard } from './SubscriptionUpsellCard';

const FREE_SERVICES = ['overstay-fine', 'absconding'];

interface CheckFormSheetProps {
  service: Service;
  isOpen: boolean;
  onClose: () => void;
}

// Always 3 steps now — Docs / Speed / Review. Payment happens via /subscribe page.
const STEPS = [
  { id: 1, label: 'Docs' },
  { id: 2, label: 'Speed' },
  { id: 3, label: 'Review' },
];

const slideVariants = {
  initial: (dir: number) => ({ opacity: 0, x: dir > 0 ? 30 : -30 }),
  animate: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -30 : 30 }),
};

export function CheckFormSheet({ service, isOpen, onClose }: CheckFormSheetProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, fetchTrial } = useAuth();
  const { isActive: hasActiveSubscription, subscription, loading: loadingSub } = useSubscription();

  const isFreeService = FREE_SERVICES.includes(service.id);

  // Can the user actually submit this check?
  // - Free service → always yes
  // - Paid service → only if subscribed
  const canSubmit = isFreeService || hasActiveSubscription || user?.trialUsed === false;

  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [files, setFiles] = useState<Record<string, File[]>>({});
  const [fileProgress, setFileProgress] = useState<Record<string, number>>({});
  const [speedTier, setSpeedTier] = useState<'standard' | 'fast-track'>('standard');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const totalPrice = isFreeService
    ? 0
    : speedTier === 'fast-track'
    ? service.priceFastTrack
    : service.priceStandard;

  const isFieldVisible = useCallback(
    (field: FormField): boolean => {
      if (!field.conditionalOn) return true;
      const { field: condField, value: condValue } = field.conditionalOn;
      return formData[condField] === condValue;
    },
    [formData]
  );

// const visibleFields = useMemo(
//   () => service.fields.filter(isFieldVisible),
//   [service.fields, isFieldVisible]
// );

  const updateFormData = useCallback((field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const uploadFileWithProgress = useCallback((docId: string, file: File) => {
    const fileKey = `${docId}__${file.name}`;
    return new Promise<void>((resolve) => {
      let pct = 0;
      const interval = setInterval(() => {
        pct = Math.min(pct + 20, 95);
        setFileProgress((prev) => ({ ...prev, [fileKey]: pct }));
        if (pct >= 95) {
          clearInterval(interval);
          setFileProgress((prev) => ({ ...prev, [fileKey]: 100 }));
          resolve();
        }
      }, 80);
    });
  }, []);

  const handleFileAdd = useCallback(
    async (docId: string, newFiles: File[]) => {
      const MAX_SIZE = 10 * 1024 * 1024;
      const valid = newFiles.filter((f) => f.size <= MAX_SIZE);
      if (valid.length < newFiles.length) {
        toast.error('Some files exceeded 10MB and were skipped.');
      }
      setFiles((prev) => ({ ...prev, [docId]: [...(prev[docId] || []), ...valid] }));
      await Promise.all(valid.map((f) => uploadFileWithProgress(docId, f)));
    },
    [uploadFileWithProgress]
  );

  const handleFileInputChange = useCallback(
    async (docId: string, fileList: FileList | null) => {
      if (!fileList) return;
      await handleFileAdd(docId, Array.from(fileList));
    },
    [handleFileAdd]
  );

  const removeFile = useCallback((docId: string, index: number) => {
    setFiles((prev) => {
      const updated = (prev[docId] || []).filter((_, i) => i !== index);
      return { ...prev, [docId]: updated };
    });
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>, docId: string) => {
    e.preventDefault();
    setDragOver(docId);
  }, []);

  const handleDragLeave = useCallback(() => setDragOver(null), []);

  const handleDrop = useCallback(
    async (e: DragEvent<HTMLDivElement>, docId: string) => {
      e.preventDefault();
      setDragOver(null);
      const droppedFiles = Array.from(e.dataTransfer.files);
      await handleFileAdd(docId, droppedFiles);
    },
    [handleFileAdd]
  );

  const submitCheck = async () => {
    setIsSubmitting(true);
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
      const token = localStorage.getItem('authToken');

      const fd = new FormData();
      fd.append('serviceId', service.id);
      fd.append('serviceType', service.title);
      fd.append('identifiers', JSON.stringify(formData));
      fd.append('speedTier', speedTier);

      Object.values(files).flat().forEach((file) => fd.append('documents', file));

      const res = await fetch(`${apiBase}/api/v1/checks`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (!res.ok) throw new Error('Submit failed');

      setSubmitSuccess(true);
      await fetchTrial();
      toast.success(t('checks.successTitle'));
      
      setTimeout(() => handleClose(), 2500);
    } catch {
      toast.error(t('checks.errorSubmit'));
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setDirection(1);
    setFormData({});
    setFiles({});
    setFileProgress({});
    setSpeedTier('standard');
    setIsSubmitting(false);
    setSubmitSuccess(false);
    setDragOver(null);
    onClose();
  };

  const goNext = () => {
    if (currentStep < STEPS.length) {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
    }
  };

  const fileProgressKey = (docId: string, file: File) => `${docId}__${file.name}`;

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl p-0 flex flex-col bg-background overflow-hidden"
      >
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-muted shrink-0">
              <img
                src={service.image}
                alt={service.title}
                width={48}
                height={48}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-base leading-tight truncate">{service.title}</SheetTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('checks.via')} {service.authority}
              </p>
            </div>

            {hasActiveSubscription ? (
              <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 shrink-0 gap-1">
                <Crown className="h-3 w-3" />
                Member
              </Badge>
            ) : isFreeService ? (
              <Badge className="bg-green-500/15 text-green-600 border-green-500/30 shrink-0">
                {t('checks.step3.freeService')}
              </Badge>
            ) : null}

            <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full shrink-0">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </SheetHeader>

        {/* Step Indicator */}
        <div className="px-6 py-3 border-b border-border bg-muted/30 shrink-0">
          <div className="w-full h-1 bg-border rounded-full mb-3 overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all duration-200',
                      currentStep === step.id
                        ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                        : currentStep > step.id
                        ? 'bg-green-500 text-white'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {currentStep > step.id ? <Check className="h-3.5 w-3.5" /> : step.id}
                  </div>
                  <span
                    className={cn(
                      'text-[10px] mt-1 hidden sm:block font-medium transition-colors',
                      currentStep === step.id ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'h-px w-8 sm:w-14 mx-2 transition-colors duration-300',
                      currentStep > step.id ? 'bg-green-500' : 'bg-border'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="px-6 py-6"
            >
              {/* ── Step 1: Documents ── */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{t('checks.step2.title')}</h3>
                    <p className="text-sm text-muted-foreground">{t('checks.step2.subtitle')}</p>
                  </div>

                  <div className="space-y-5">
                    {service.documents.map((doc) => {
                      const docFiles = files[doc.id] || [];
                      const isDragging = dragOver === doc.id;

                      return (
                        <div key={doc.id} className="space-y-2">
                          <Label className="flex items-center gap-1 text-sm font-medium">
                            {doc.label}
                            {doc.required && <span className="text-destructive">*</span>}
                          </Label>

                          <div
                            className={cn(
                              'relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200',
                              isDragging
                                ? 'border-primary bg-primary/10 scale-[1.01]'
                                : docFiles.length > 0
                                ? 'border-green-500 bg-green-500/5'
                                : 'border-border hover:border-primary/60 hover:bg-primary/5'
                            )}
                            onClick={() => document.getElementById(`file-${doc.id}`)?.click()}
                            onDragOver={(e) => handleDragOver(e, doc.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, doc.id)}
                          >
                            <input
                              id={`file-${doc.id}`}
                              type="file"
                              accept="image/*,application/pdf,.heic"
                              multiple={doc.multiple ?? true}
                              className="hidden"
                              onChange={(e) => handleFileInputChange(doc.id, e.target.files)}
                            />
                            <Upload
                              className={cn(
                                'h-7 w-7 mx-auto mb-2 transition-colors',
                                docFiles.length > 0 ? 'text-green-500' : 'text-muted-foreground'
                              )}
                            />
                            <p className="text-sm font-medium">
                              {docFiles.length > 0
                                ? `${docFiles.length} ${t('checks.files')}`
                                : t('checks.step2.dragDrop')}
                            </p>
                            {doc.helpText && (
                              <p className="text-xs text-muted-foreground mt-1">{doc.helpText}</p>
                            )}
                          </div>

                          {docFiles.length > 0 && (
                            <div className="space-y-2">
                              {docFiles.map((file, index) => {
                                const key = fileProgressKey(doc.id, file);
                                const progress = fileProgress[key] ?? 100;
                                const isUploading = progress < 100;

                                return (
                                  <motion.div
                                    key={`${file.name}-${index}`}
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="rounded-lg border border-border bg-muted/40 overflow-hidden"
                                  >
                                    <div className="flex items-center gap-3 px-3 py-2.5">
                                      <File className="h-4 w-4 text-primary shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm truncate font-medium">{file.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {isUploading
                                            ? `${t('checks.step2.uploading')} ${progress}%`
                                            : `${(file.size / 1024 / 1024).toFixed(2)} MB — ${t('checks.step2.uploaded')}`}
                                        </p>
                                      </div>
                                      {!isUploading && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 shrink-0"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            removeFile(doc.id, index);
                                          }}
                                        >
                                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                        </Button>
                                      )}
                                    </div>
                                    {isUploading && (
                                      <div className="h-0.5 bg-border">
                                        <motion.div
                                          className="h-full bg-primary"
                                          animate={{ width: `${progress}%` }}
                                          transition={{ duration: 0.1 }}
                                        />
                                      </div>
                                    )}
                                  </motion.div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Step 2: Speed ── */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{t('checks.step3.title')}</h3>
                    <p className="text-sm text-muted-foreground">{t('checks.step3.subtitle')}</p>
                  </div>

                  {isFreeService ? (
                    <div className="rounded-xl border-2 border-green-500 bg-green-500/8 p-6 text-center space-y-2">
                      <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-green-500/15">
                        <Check className="h-6 w-6 text-green-600" />
                      </div>
                      <h4 className="font-semibold text-green-700 dark:text-green-400">
                        {t('checks.step3.freeService')}
                      </h4>
                      <p className="text-sm text-muted-foreground">{t('checks.step3.freeDesc')}</p>
                    </div>
                  ) : (
                    <RadioGroup
                      value={speedTier}
                      onValueChange={(v) => setSpeedTier(v as 'standard' | 'fast-track')}
                      className="space-y-3"
                    >
                      <label
                        className={cn(
                          'flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all',
                          speedTier === 'standard'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        <RadioGroupItem value="standard" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">{t('checks.step3.standard')}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{t('checks.standard.time')}</p>
                        </div>
                        {hasActiveSubscription ? (
                          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 gap-1 shrink-0">
                            <Crown className="h-3 w-3" />
                            Included
                          </Badge>
                        ) : (
                          <p className="text-xl font-bold shrink-0">AED {service.priceStandard}</p>
                        )}
                      </label>

                      <label
                        className={cn(
                          'flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all',
                          speedTier === 'fast-track'
                            ? 'border-amber-500 bg-amber-500/8'
                            : 'border-border hover:border-amber-500/50'
                        )}
                      >
                        <RadioGroupItem value="fast-track" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Zap className="h-4 w-4 text-amber-500" />
                            <span className="font-semibold">{t('checks.step3.fastTrack')}</span>
                            {!hasActiveSubscription && (
                              <Badge
                                variant="secondary"
                                className="bg-amber-500/15 text-amber-700 dark:text-amber-400 text-xs border-0"
                              >
                                Priority
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{t('checks.fastTrack.time')}</p>
                        </div>
                        {hasActiveSubscription ? (
                          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 gap-1 shrink-0">
                            <Crown className="h-3 w-3" />
                            Included
                          </Badge>
                        ) : (
                          <p className="text-xl font-bold shrink-0">AED {service.priceFastTrack}</p>
                        )}
                      </label>
                    </RadioGroup>
                  )}

                  {/* Subscription upsell — only for logged-in non-subscribers on paid services */}
                  {user && !isFreeService && !hasActiveSubscription && !loadingSub && (
                    <SubscriptionUpsellCard
                      currentCheckPrice={totalPrice}
                      serviceTitle={service.title}
                    />
                  )}
                </div>
              )}

              {/* ── Step 3: Review ── */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  {submitSuccess ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center py-12 text-center space-y-4"
                    >
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/15">
                        <CheckCircle className="h-10 w-10 text-green-500" />
                      </div>
                      <h3 className="text-2xl font-bold">{t('checks.successTitle')}</h3>
                      <p className="text-muted-foreground max-w-xs">{t('checks.successDesc')}</p>
                      <Button onClick={handleClose} className="mt-2 rounded-full px-8">
                        {t('common.close')}
                      </Button>
                    </motion.div>
                  ) : (
                    <>
                      <div>
                        <h3 className="text-lg font-semibold mb-1">{t('checks.step4.title')}</h3>
                        <p className="text-sm text-muted-foreground">{t('checks.step4.subtitle')}</p>
                      </div>

                      {/* Member banner */}
                      {hasActiveSubscription && subscription && (
                        <div className="rounded-xl border-2 border-amber-500/40 bg-gradient-to-r from-amber-500/10 to-amber-500/5 p-3 flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
                            <Crown className="h-4 w-4 text-amber-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold">{subscription.productName} Member</p>
                            <p className="text-xs text-muted-foreground">
                              This check is included in your subscription
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="rounded-xl border border-border overflow-hidden">
                        <div className="p-4 bg-muted/40 flex items-center gap-3">
                          <div className="h-11 w-11 rounded-lg overflow-hidden shrink-0">
                            <img
                              src={service.image}
                              alt={service.title}
                              width={44}
                              height={44}
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold truncate">{service.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {t('checks.authority')}: {service.authority}
                            </p>
                          </div>
                        </div>

                        <div className="p-4 space-y-2.5 divide-y divide-border/60">
                          {Object.entries(formData).slice(0, 4).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-sm pt-2 first:pt-0">
                              <span className="text-muted-foreground capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                              <span className="font-medium text-right max-w-[55%] truncate">
                                {typeof value === 'boolean'
                                  ? value ? 'Yes' : 'No'
                                  : typeof value === 'object' && value !== null
                                  ? JSON.stringify(value)
                                  : String(value).slice(-8)}
                              </span>
                            </div>
                          ))}
                          <div className="flex justify-between text-sm pt-2">
                            <span className="text-muted-foreground">{t('checks.step4.documents')}</span>
                            <span className="font-medium">
                              {Object.values(files).flat().length} {t('checks.files')}
                            </span>
                          </div>
                          {!isFreeService && (
                            <div className="flex justify-between text-sm pt-2">
                              <span className="text-muted-foreground">Speed</span>
                              <Badge variant="outline" className="text-xs">
                                {speedTier === 'fast-track'
                                  ? t('checks.step3.fastTrack')
                                  : t('checks.step3.standard')}
                              </Badge>
                            </div>
                          )}
                        </div>

                        <div className="p-4 border-t border-border bg-muted/30 flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">{t('checks.step4.total')}</span>
                          {isFreeService ? (
                            <Badge className="bg-green-500/15 text-green-600 border-green-500/30 text-base px-3 py-1">
                              {t('checks.step4.free')}
                            </Badge>
                          ) : hasActiveSubscription ? (
                            <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-base px-3 py-1 gap-1">
                              <Crown className="h-3.5 w-3.5" />
                              Included
                            </Badge>
                          ) : (
                            <span className="text-2xl font-bold">AED {totalPrice}</span>
                          )}
                        </div>
                      </div>

                      {/* Auth / subscription gate */}
                      {!user ? (
                        <div className="rounded-xl border border-border bg-card p-6 text-center space-y-4">
                          <ShieldCheck className="h-10 w-10 mx-auto text-primary" />
                          <div>
                            <h3 className="font-semibold">{t('checks.loginRequired')}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{t('checks.loginDesc')}</p>
                          </div>
                          <div className="flex gap-3 justify-center flex-wrap">
                            <Button onClick={() => navigate('/auth')} className="rounded-full px-6">
                              {t('checks.signIn')}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => navigate('/auth?tab=signup')}
                              className="rounded-full px-6"
                            >
                              {t('checks.createAccount')}
                            </Button>
                          </div>
                        </div>
                      ) : !canSubmit ? (
                        // Paid service + no subscription → show full upsell card
                        <SubscriptionUpsellCard
                          currentCheckPrice={totalPrice}
                          serviceTitle={service.title}
                        />
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Shield className="h-4 w-4 text-green-500 shrink-0" />
                            <span>Submitted to ICP-authorized typing centre</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CreditCard className="h-4 w-4 text-primary shrink-0" />
                            <span>Stripe secure payment</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span>Results delivered to dashboard, email &amp; WhatsApp</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        {!submitSuccess && (
          <div className="px-6 py-4 border-t border-border bg-card shrink-0">
            <div className="flex items-center justify-between gap-3">
              {currentStep > 1 ? (
                <Button variant="outline" onClick={goBack} className="gap-2" disabled={isSubmitting}>
                  <ArrowLeft className="h-4 w-4" />
                  {t('checks.back')}
                </Button>
              ) : (
                <div />
              )}

              {/* Steps 1 & 2 — continue */}
              {currentStep < 3 && (
                <Button onClick={goNext} className="gap-2 min-w-[120px]">
                  {t('checks.continue')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}

              {/* Step 3 (Review) — submit OR redirect to subscribe */}
              {currentStep === 3 && (
                <>
                  {!user ? (
                    <Button disabled className="gap-2 min-w-[160px] opacity-50">
                      {t('checks.step4.submitFree')}
                    </Button>
                  ) : !canSubmit ? (
                    // Paid service + not subscribed → CTA goes to /subscribe
                    <Button
                      onClick={() => navigate('/subscription')}
                      className="gap-2 min-w-[180px] bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                    >
                      <Crown className="h-4 w-4" />
                      Subscribe to Submit
                    </Button>
                  ) : (
                    // Free service OR subscribed → submit directly
                    <Button
                      onClick={submitCheck}
                      disabled={isSubmitting}
                      className="gap-2 min-w-[160px] bg-gradient-to-r from-primary to-primary/80"
                    >
                      {isSubmitting ? (
                        <motion.span
                          animate={{ opacity: [1, 0.4, 1] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                        >
                          {t('checks.step4.submitting')}
                        </motion.span>
                      ) : (
                        <>
                          Submit Check
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}