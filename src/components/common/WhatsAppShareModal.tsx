import React, { useEffect, useState } from 'react'
import {
  Check,
  Copy,
  ExternalLink,
  FileText,
  Loader2,
  MessageCircle,
  Phone,
  RefreshCw,
  Send,
  User,
  X,
} from 'lucide-react'
import {
  formatCurrencyINR,
  getWhatsAppClickToChatUrl,
  normalizeWhatsAppPhone,
  validateWhatsAppPhone,
} from '../../utils/whatsapp'

export interface WhatsAppShareModalProps {
  isOpen: boolean
  onClose: () => void
  recipientName: string
  initialPhone?: string
  initialMessage: string
  documentNumber: string
  documentType: 'invoice' | 'proposal' | 'quotation' | 'customer'
  totalAmount?: number
  pdfUrl?: string
  onGeneratePdf?: () => Promise<string | null | void>
  onSuccess?: () => void
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  isOpen,
  onClose,
  recipientName,
  initialPhone = '',
  initialMessage,
  documentNumber,
  documentType,
  totalAmount,
  pdfUrl: initialPdfUrl,
  onGeneratePdf,
  onSuccess,
}) => {
  const [phone, setPhone] = useState(initialPhone)
  const [message, setMessage] = useState(initialMessage)
  const [currentPdfUrl, setCurrentPdfUrl] = useState(initialPdfUrl)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [copiedField, setCopiedField] = useState<'message' | 'link' | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Synchronize state when modal opens or props change
  useEffect(() => {
    if (isOpen) {
      setPhone(initialPhone || '')
      setMessage(initialMessage)
      setCurrentPdfUrl(initialPdfUrl)
      setValidationError(null)
      setCopiedField(null)
    }
  }, [isOpen, initialPhone, initialMessage, initialPdfUrl])

  if (!isOpen) return null

  // Validate phone live
  const normalizedPhone = normalizeWhatsAppPhone(phone)
  const phoneValidation = validateWhatsAppPhone(phone)

  // Handle PDF Generation inside modal
  const handleGeneratePdf = async () => {
    if (!onGeneratePdf) return
    try {
      setIsGeneratingPdf(true)
      const newUrl = await onGeneratePdf()
      if (typeof newUrl === 'string' && newUrl) {
        setCurrentPdfUrl(newUrl)
        // Auto append or update the PDF link in the prefilled message if not already present
        if (!message.includes(newUrl)) {
          const typeLabel =
            documentType === 'invoice'
              ? 'Invoice'
              : documentType === 'proposal'
              ? 'Proposal'
              : 'Quotation'
          const linkLine = `${typeLabel} PDF: ${newUrl}`

          if (message.includes(`${typeLabel} PDF:`)) {
            setMessage(
              message.replace(new RegExp(`${typeLabel} PDF:.*`), linkLine)
            )
          } else {
            // Insert right before "Thank you"
            if (message.includes('Thank you for choosing')) {
              setMessage(
                message.replace(
                  'Thank you for choosing',
                  `${linkLine}\n\nThank you for choosing`
                )
              )
            } else {
              setMessage(`${message}\n\n${linkLine}`)
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to generate PDF in share modal:', err)
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  // Copy to clipboard helper
  const handleCopy = async (type: 'message' | 'link', text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(type)
      setTimeout(() => setCopiedField(null), 2500)
    } catch (err) {
      console.warn('Clipboard write failed:', err)
    }
  }

  // Handle WhatsApp Launch
  const handleSend = () => {
    if (!phoneValidation.isValid || !normalizedPhone) {
      setValidationError(phoneValidation.error || 'Please enter a valid phone number.')
      return
    }

    const shareUrl = getWhatsAppClickToChatUrl(normalizedPhone, message)
    window.open(shareUrl, '_blank', 'noopener,noreferrer')

    if (onSuccess) {
      onSuccess()
    }
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
              <MessageCircle className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Share via WhatsApp
              </h3>
              <p className="text-xs text-slate-500">
                Official document dispatch to registered client chat
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Document Summary Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-orange-100 text-orange-700">
                <FileText className="w-4 h-4" />
              </span>
              <div>
                <span className="font-bold text-slate-900 font-mono">
                  {documentNumber}
                </span>
                <span className="text-slate-400 mx-1.5">•</span>
                <span className="text-slate-600 font-medium capitalize">
                  {documentType}
                </span>
              </div>
            </div>

            {totalAmount !== undefined && (
              <div className="font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200/60 shadow-2xs">
                {formatCurrencyINR(totalAmount)}
              </div>
            )}
          </div>

          {/* Client Recipient & Phone Number Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>Recipient Client</span>
              </label>
              <span className="text-[11px] font-semibold text-slate-600 truncate max-w-[200px]">
                {recipientName || 'Direct Client'}
              </span>
            </div>

            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value)
                  if (validationError) setValidationError(null)
                }}
                placeholder="+91 98765 43210"
                className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all focus:outline-none focus:ring-2 ${
                  validationError
                    ? 'border-rose-300 bg-rose-50/30 text-rose-900 focus:ring-rose-400'
                    : 'border-slate-200 bg-white text-slate-800 focus:border-emerald-500 focus:ring-emerald-500/20'
                }`}
              />
            </div>

            {validationError ? (
              <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                <span>{validationError}</span>
              </p>
            ) : normalizedPhone ? (
              <p className="text-[11px] font-medium text-emerald-600 mt-1 flex items-center gap-1">
                <Check className="w-3 h-3" />
                <span>Verified WhatsApp format: +{normalizedPhone}</span>
              </p>
            ) : (
              <p className="text-[11px] text-slate-500 mt-0.5">
                Standard 10-digit Indian numbers will auto-prefix with +91 country code.
              </p>
            )}
          </div>

          {/* PDF Status and One-Click Generator */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  currentPdfUrl ? 'bg-emerald-500 ring-2 ring-emerald-200' : 'bg-amber-500 ring-2 ring-amber-200'
                }`}
              />
              <span className="text-xs font-semibold text-slate-700">
                {currentPdfUrl ? 'Document PDF link is attached' : 'PDF link not generated yet'}
              </span>
            </div>

            {currentPdfUrl ? (
              <button
                type="button"
                onClick={() => handleCopy('link', currentPdfUrl)}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-semibold transition cursor-pointer inline-flex items-center gap-1 active:scale-95"
                title="Copy PDF download URL to clipboard"
              >
                {copiedField === 'link' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700">Copied Link!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-slate-500" />
                    <span>Copy PDF Link</span>
                  </>
                )}
              </button>
            ) : onGeneratePdf ? (
              <button
                type="button"
                onClick={handleGeneratePdf}
                disabled={isGeneratingPdf}
                className="px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-[11px] font-semibold shadow-2xs transition cursor-pointer inline-flex items-center gap-1 disabled:opacity-60"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Rendering PDF...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3" />
                    <span>Generate PDF Link</span>
                  </>
                )}
              </button>
            ) : null}
          </div>

          {/* Message Preview & Editor */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                Prefilled Message Preview &amp; Notes
              </label>
              <button
                type="button"
                onClick={() => handleCopy('message', message)}
                className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold inline-flex items-center gap-1 transition cursor-pointer"
              >
                {copiedField === 'message' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              rows={8}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type message to prefill in WhatsApp..."
              className="w-full p-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-sans text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-y leading-relaxed"
            />
            <p className="text-[11px] text-slate-400">
              You can adjust or add personal notes before dispatching. WhatsApp opens with this exact message prefilled in the client's chat.
            </p>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50/80 gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSend}
            disabled={!normalizedPhone}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold shadow-sm hover:shadow transition inline-flex items-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Open in WhatsApp</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </button>
        </div>
      </div>
    </div>
  )
}

