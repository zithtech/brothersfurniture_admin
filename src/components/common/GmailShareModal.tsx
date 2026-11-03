import React, { useEffect, useState } from 'react'
import {
  Check,
  Copy,
  ExternalLink,
  FileText,
  Loader2,
  Mail,
  RefreshCw,
  Send,
  User,
  X,
} from 'lucide-react'
import { formatCurrencyINR } from '../../utils/whatsapp'
import {
  openGmailCompose,
  openMailto,
  validateEmail,
} from '../../utils/email'

export interface GmailShareModalProps {
  isOpen: boolean
  onClose: () => void
  recipientName: string
  initialEmail?: string
  initialSubject: string
  initialBody: string
  documentNumber: string
  documentType: 'invoice' | 'proposal' | 'quotation' | 'customer'
  totalAmount?: number
  pdfUrl?: string
  onGeneratePdf?: () => Promise<string | null | void>
  onSuccess?: () => void
}

export const GmailShareModal: React.FC<GmailShareModalProps> = ({
  isOpen,
  onClose,
  recipientName,
  initialEmail = '',
  initialSubject,
  initialBody,
  documentNumber,
  documentType,
  totalAmount,
  pdfUrl: initialPdfUrl,
  onGeneratePdf,
  onSuccess,
}) => {
  const [email, setEmail] = useState(initialEmail)
  const [subject, setSubject] = useState(initialSubject)
  const [body, setBody] = useState(initialBody)
  const [currentPdfUrl, setCurrentPdfUrl] = useState(initialPdfUrl)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [copiedField, setCopiedField] = useState<'content' | 'link' | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Synchronize state when modal opens or props change
  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail || '')
      setSubject(initialSubject)
      setBody(initialBody)
      setCurrentPdfUrl(initialPdfUrl)
      setValidationError(null)
      setCopiedField(null)
    }
  }, [isOpen, initialEmail, initialSubject, initialBody, initialPdfUrl])

  if (!isOpen) return null

  const emailValidation = validateEmail(email)

  // Handle on-the-fly PDF generation
  const handleGeneratePdf = async () => {
    if (!onGeneratePdf) return
    try {
      setIsGeneratingPdf(true)
      const newUrl = await onGeneratePdf()
      if (typeof newUrl === 'string' && newUrl) {
        setCurrentPdfUrl(newUrl)
        // Auto append or update the PDF link in the prefilled body if not present
        if (!body.includes(newUrl)) {
          const typeLabel =
            documentType === 'invoice'
              ? 'Official Tax Invoice PDF'
              : documentType === 'proposal'
              ? 'Itemized Proposal PDF'
              : 'Quotation PDF'
          const linkLine = `• View ${typeLabel}: ${newUrl}`

          if (body.includes(`• View ${typeLabel}:`)) {
            setBody(body.replace(new RegExp(`• View ${typeLabel}:.*`), linkLine))
          } else if (body.includes('INVOICE SUMMARY:') || body.includes('PROPOSAL SUMMARY:') || body.includes('QUOTATION DETAILS:')) {
            // Append right after summary header
            const header = body.includes('INVOICE SUMMARY:')
              ? 'INVOICE SUMMARY:'
              : body.includes('PROPOSAL SUMMARY:')
              ? 'PROPOSAL SUMMARY:'
              : 'QUOTATION DETAILS:'
            setBody(body.replace(header, `${header}\n${linkLine}`))
          } else {
            setBody(`${body}\n\n${linkLine}`)
          }
        }
      }
    } catch (err) {
      console.error('Failed to generate PDF in Gmail modal:', err)
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  // Copy to clipboard helper
  const handleCopy = async (type: 'content' | 'link', text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(type)
      setTimeout(() => setCopiedField(null), 2500)
    } catch (err) {
      console.warn('Clipboard write failed:', err)
    }
  }

  // Handle Gmail Web Compose launch
  const handleOpenGmail = () => {
    if (!emailValidation.isValid || !emailValidation.normalized) {
      setValidationError(emailValidation.error || 'Please enter a valid recipient email address.')
      return
    }

    openGmailCompose(emailValidation.normalized, subject, body)
    if (onSuccess) onSuccess()
    onClose()
  }

  // Handle Native Mail client launch (mailto fallback)
  const handleOpenDefaultMail = () => {
    if (!emailValidation.isValid || !emailValidation.normalized) {
      setValidationError(emailValidation.error || 'Please enter a valid recipient email address.')
      return
    }

    openMailto(emailValidation.normalized, subject, body)
    if (onSuccess) onSuccess()
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
            <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
              <Mail className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Send via Gmail / Email
              </h3>
              <p className="text-xs text-slate-500">
                Official document dispatch to client email
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

          {/* Recipient Email Section */}
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
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (validationError) setValidationError(null)
                }}
                placeholder="client@company.com"
                className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all focus:outline-none focus:ring-2 ${
                  validationError
                    ? 'border-rose-300 bg-rose-50/30 text-rose-900 focus:ring-rose-400'
                    : 'border-slate-200 bg-white text-slate-800 focus:border-rose-500 focus:ring-rose-500/20'
                }`}
              />
            </div>

            {validationError ? (
              <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                <span>{validationError}</span>
              </p>
            ) : emailValidation.isValid ? (
              <p className="text-[11px] font-medium text-emerald-600 mt-1 flex items-center gap-1">
                <Check className="w-3 h-3" />
                <span>Valid recipient address: {emailValidation.normalized}</span>
              </p>
            ) : (
              <p className="text-[11px] text-slate-500 mt-0.5">
                Ensure the client's official or accounts email is specified.
              </p>
            )}
          </div>

          {/* Email Subject Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Email Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject line..."
              className="w-full px-3.5 py-2 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
            />
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

          {/* Email Body Preview & Editor */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                Email Message Body
              </label>
              <button
                type="button"
                onClick={() =>
                  handleCopy('content', `Subject: ${subject}\n\n${body}`)
                }
                className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold inline-flex items-center gap-1 transition cursor-pointer"
              >
                {copiedField === 'content' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700">Copied Email!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Full Email</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              rows={9}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type message body..."
              className="w-full p-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-sans text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-y leading-relaxed font-mono sm:font-sans"
            />
            <p className="text-[11px] text-slate-400">
              Review and adapt the executive letter before opening Gmail. Gmail will open in a new tab with these exact details prefilled.
            </p>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50/80 gap-2.5">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleOpenDefaultMail}
              disabled={!emailValidation.isValid}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 hover:text-slate-900 transition cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
              title="Open using default mail client (Outlook / Apple Mail via mailto:)"
            >
              <Send className="w-3.5 h-3.5 text-slate-500" />
              <span>Default Mail App</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleOpenGmail}
            disabled={!emailValidation.isValid}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold shadow-sm hover:shadow transition inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Mail className="w-4 h-4" />
            <span>Open in Gmail</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </button>
        </div>
      </div>
    </div>
  )
}

