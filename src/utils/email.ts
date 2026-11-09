/**
 * Email & Gmail Dispatch Utilities for Brothers Furniture Admin
 * Handles email validation, Gmail Web compose URLs, mailto fallbacks, and executive message templates.
 */

import type { Invoice, Proposal, Order } from '../types/admin'
import { formatCurrencyINR } from './whatsapp'

/**
 * Basic RFC 5322 compliant regex for standard email validation
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/

/**
 * Validates an email address
 */
export function validateEmail(email?: string | null): {
  isValid: boolean
  normalized: string | null
  error?: string
} {
  if (!email || !email.trim()) {
    return {
      isValid: false,
      normalized: null,
      error: 'Recipient email address is required.',
    }
  }

  const clean = email.trim().toLowerCase()
  if (!EMAIL_REGEX.test(clean)) {
    return {
      isValid: false,
      normalized: clean,
      error: 'Please enter a valid email address (e.g., client@company.com).',
    }
  }

  return {
    isValid: true,
    normalized: clean,
  }
}

/**
 * Builds a direct Gmail Web Compose URL.
 * Opens compose window in full screen with recipient, subject, and body prefilled.
 * Format: https://mail.google.com/mail/?view=cm&fs=1&to={to}&su={subject}&body={body}
 */
export function buildGmailComposeUrl(to: string, subject: string, body: string): string {
  const params = new URLSearchParams()
  params.set('view', 'cm')
  params.set('fs', '1')
  if (to.trim()) params.set('to', to.trim())
  if (subject.trim()) params.set('su', subject.trim())
  if (body.trim()) params.set('body', body.trim())

  return `https://mail.google.com/mail/?${params.toString()}`
}

/**
 * Builds a standard mailto: URL for default email clients (Outlook, Apple Mail, mobile mail apps)
 */
export function buildMailtoUrl(to: string, subject: string, body: string): string {
  const cleanTo = to.trim()
  const params = new URLSearchParams()
  if (subject.trim()) params.set('subject', subject.trim())
  if (body.trim()) params.set('body', body.trim())

  const queryString = params.toString()
  return `mailto:${cleanTo}${queryString ? `?${queryString}` : ''}`
}

/**
 * Opens Gmail compose in a new browser tab
 */
export function openGmailCompose(to: string, subject: string, body: string): void {
  const url = buildGmailComposeUrl(to, subject, body)
  window.open(url, '_blank', 'noopener,noreferrer')
}

/**
 * Opens native system mail client using mailto:
 */
export function openMailto(to: string, subject: string, body: string): void {
  const url = buildMailtoUrl(to, subject, body)
  window.location.href = url
}

export interface EmailTemplateResult {
  subject: string
  body: string
}

/**
 * Generates official email subject and executive body for Tax Invoices
 */
export function formatInvoiceEmail(
  invoice: Invoice,
  options?: { companyName?: string; customNote?: string }
): EmailTemplateResult {
  const customer =
    invoice.customerName ||
    invoice.companyName ||
    options?.companyName ||
    'Valued Client'

  const subject = `Tax Invoice ${invoice.invoiceNumber} – Brothers Furniture`

  const lines: string[] = [
    `Dear ${customer},`,
    '',
    'Greetings from Brothers Furniture (Ambattur Industrial Estate, Chennai).',
    '',
    `Please find attached the official Tax Invoice ${invoice.invoiceNumber} for your recent commercial furniture order.`,
    '',
    'INVOICE SUMMARY:',
    `• Invoice Number: ${invoice.invoiceNumber}`,
    invoice.poNumber ? `• Purchase Order (PO): ${invoice.poNumber}` : '',
    `• Total Amount: ${formatCurrencyINR(invoice.total)}`,
  ].filter(Boolean)

  if (invoice.status === 'paid' || invoice.balanceDue === 0) {
    lines.push('• Payment Status: Fully Paid (Settled)')
  } else {
    if (invoice.amountPaid && invoice.amountPaid > 0) {
      lines.push(`• Amount Paid: ${formatCurrencyINR(invoice.amountPaid)}`)
    }
    lines.push(`• Balance Due: ${formatCurrencyINR(invoice.balanceDue ?? invoice.total)}`)
    if (invoice.dueDate) {
      lines.push(`• Payment Due Date: ${invoice.dueDate}`)
    }
  }

  if (invoice.pdfUrl) {
    lines.push(`• View & Download Official Tax Invoice PDF: ${invoice.pdfUrl}`)
  }

  lines.push('')
  lines.push('BANK TRANSFER DETAILS (NEFT / RTGS):')
  lines.push('• Beneficiary: Brothers Furniture Industrial Solutions')
  lines.push('• Bank: HDFC Bank (Ambattur Industrial Estate Branch)')
  lines.push('• Account No: 50200084920194')
  lines.push('• IFSC Code: HDFC0001849')
  lines.push('• UPI ID: brothersfurniture@hdfcbank')
  lines.push('')
  lines.push('Please reply to this email with the UTR transaction reference number once the transfer is completed.')

  if (options?.customNote && options.customNote.trim()) {
    lines.push('')
    lines.push('SPECIAL NOTES:')
    lines.push(options.customNote.trim())
  }

  lines.push('')
  lines.push('Thank you for choosing Brothers Furniture.')
  lines.push('')
  lines.push('Warm regards,')
  lines.push('Brothers Furniture Industrial Solutions')
  lines.push('Plot No. 42-B, SIDCO Industrial Estate, Ambattur, Chennai – 600058')
  lines.push('Phone: +91 98400 12345 | sales@brothersfurniture.in')

  return {
    subject,
    body: lines.join('\n'),
  }
}

/**
 * Generates official email subject and executive body for Proposals
 */
export function formatProposalEmail(
  proposal: Proposal,
  options?: { companyName?: string; customNote?: string }
): EmailTemplateResult {
  const customer =
    proposal.preparedFor ||
    proposal.customerName ||
    proposal.companyName ||
    options?.companyName ||
    'Valued Client'

  const subject = `Commercial Fit-Out Proposal ${proposal.proposalNumber} – Brothers Furniture`

  const lines: string[] = [
    `Dear ${customer},`,
    '',
    'Greetings from Brothers Furniture (Ambattur Industrial Estate, Chennai).',
    '',
    'We are pleased to submit our commercial fit-out proposal for your workspace project.',
    '',
    'PROPOSAL SUMMARY:',
    `• Proposal Reference: ${proposal.proposalNumber}`,
  ]

  if (proposal.title && proposal.title.trim()) {
    lines.push(`• Project Scope: ${proposal.title.trim()}`)
  }

  lines.push(`• Total Estimated Value: ${formatCurrencyINR(proposal.total)}`)

  if (proposal.validUntil) {
    lines.push(`• Proposal Validity: Valid until ${proposal.validUntil}`)
  }

  if (proposal.items && proposal.items.length > 0) {
    const totalUnits = proposal.items.reduce((s, it) => s + (it.quantity || 1), 0)
    lines.push(`• Scope of Work: ${proposal.items.length} line item(s) (${totalUnits} total units)`)
  }

  if (proposal.pdfUrl) {
    lines.push(`• View Full Itemized Proposal PDF: ${proposal.pdfUrl}`)
  }

  lines.push('')
  lines.push('Please review the itemized proposal document using the link above for product specifications, material finishes, and CAD layout guidelines.')
  lines.push('Our executive design and project team will follow up to assist you with layout validation and customization options.')

  if (options?.customNote && options.customNote.trim()) {
    lines.push('')
    lines.push('ADDITIONAL DETAILS:')
    lines.push(options.customNote.trim())
  }

  lines.push('')
  lines.push('Thank you for considering Brothers Furniture for your commercial workspace requirements.')
  lines.push('')
  lines.push('Warm regards,')
  lines.push('Brothers Furniture Commercial Solutions')
  lines.push('Plot No. 42-B, SIDCO Industrial Estate, Ambattur, Chennai – 600058')
  lines.push('Phone: +91 98400 12345 | sales@brothersfurniture.in')

  return {
    subject,
    body: lines.join('\n'),
  }
}

/**
 * Generates official email subject and body for Quotations
 */
export function formatQuotationEmail(
  quote: Order,
  options?: { customNote?: string }
): EmailTemplateResult {
  const customer = quote.customerName || 'Valued Client'
  const subject = `Official Commercial Quotation ${quote.orderNumber} – Brothers Furniture`

  const lines: string[] = [
    `Dear ${customer},`,
    '',
    'Greetings from Brothers Furniture (Ambattur Industrial Estate, Chennai).',
    '',
    'Thank you for your interest in our commercial furniture and ergonomic seating solutions. Please find your quotation summary below:',
    '',
    'QUOTATION DETAILS:',
    `• Quotation Number: ${quote.orderNumber}`,
    `• Total Amount: ${formatCurrencyINR(quote.total)}`,
  ]

  if (quote.items && quote.items.length > 0) {
    const totalUnits = quote.items.reduce((s, it) => s + (it.quantity || 1), 0)
    lines.push(`• Line Items: ${quote.items.length} item(s) (${totalUnits} total units)`)
  }

  if (quote.deliveryAddress) {
    lines.push(`• Delivery Site: ${quote.deliveryAddress}`)
  }

  if (quote.pdfUrl) {
    lines.push(`• View Quotation PDF: ${quote.pdfUrl}`)
  }

  if (options?.customNote && options.customNote.trim()) {
    lines.push('')
    lines.push('NOTES:')
    lines.push(options.customNote.trim())
  }

  lines.push('')
  lines.push('Please feel free to connect with us if you require any adjustments to specifications or quantity pricing.')
  lines.push('')
  lines.push('Warm regards,')
  lines.push('Brothers Furniture Sales Team')
  lines.push('Ambattur Industrial Estate, Chennai – 600058')
  lines.push('Phone: +91 98400 12345 | sales@brothersfurniture.in')

  return {
    subject,
    body: lines.join('\n'),
  }
}

/**
 * Generates direct customer introduction email
 */
export function formatCustomerIntroEmail(
  customerName?: string,
  options?: { contactName?: string }
): EmailTemplateResult {
  const recipient = options?.contactName || customerName || 'Valued Client'
  const subject = 'Commercial Furniture Solutions – Brothers Furniture Chennai'

  const lines: string[] = [
    `Dear ${recipient},`,
    '',
    'Greetings from Brothers Furniture, SIDCO Industrial Estate, Ambattur, Chennai.',
    '',
    'We specialize in manufacturing commercial-grade ergonomic task seating, executive desk suites, and modular workstation systems tailored for modern workspaces.',
    '',
    'How can we assist you with your upcoming office layout or furniture requirements?',
    '',
    'We would be delighted to share our commercial product catalog or arrange a site consultation at your convenience.',
    '',
    'Warm regards,',
    'Brothers Furniture Commercial Solutions',
    'Plot No. 42-B, SIDCO Industrial Estate, Ambattur, Chennai – 600058',
    'Phone: +91 98400 12345 | sales@brothersfurniture.in',
  ]

  return {
    subject,
    body: lines.join('\n'),
  }
}

