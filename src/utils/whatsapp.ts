/**
 * WhatsApp Utilities for Brothers Furniture Admin
 * Handles phone normalization, international formatting, message templates, and Click-to-Chat URLs.
 */

import type { Invoice, Proposal, Order } from '../types/admin'

/**
 * Normalizes phone numbers for WhatsApp Click-to-Chat (https://wa.me/<number>).
 * Requirements:
 * - Must contain only digits (no +, spaces, hyphens, parentheses).
 * - Indian phone numbers (10 digits starting with 6, 7, 8, or 9) are prefixed with default country code '91'.
 * - Leading zeroes (e.g. 09876543210) are stripped if it resolves to a 10-digit Indian number, prefixed with '91'.
 * - Existing international prefixes (e.g. +91, +1, +971) are stripped of non-digits and preserved.
 * - Returns null if phone number cannot be resolved to a valid length (10-15 digits).
 */
export function normalizeWhatsAppPhone(
  phone?: string | null,
  defaultCountryCode: string = '91'
): string | null {
  if (!phone) return null

  // Remove all non-digits
  let digits = phone.replace(/\D/g, '')

  if (!digits) return null

  // Strip leading zero if 11 digits starting with 0 followed by 6, 7, 8, 9 (common Indian format)
  if (digits.length === 11 && digits.startsWith('0') && /^[6-9]/.test(digits.slice(1))) {
    digits = digits.slice(1)
  }

  // 10 digits Indian mobile number (starts with 6, 7, 8, 9)
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `${defaultCountryCode}${digits}`
  }

  // 12 digits starting with 91 (already formatted with Indian country code)
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits
  }

  // Any other international number between 10 and 15 digits
  if (digits.length >= 10 && digits.length <= 15) {
    return digits
  }

  return null
}

/**
 * Validates a phone number for WhatsApp readiness
 */
export function validateWhatsAppPhone(phone?: string | null): {
  isValid: boolean
  normalized: string | null
  error?: string
} {
  if (!phone || !phone.trim()) {
    return {
      isValid: false,
      normalized: null,
      error: 'Client phone number is missing.',
    }
  }

  const normalized = normalizeWhatsAppPhone(phone)
  if (!normalized) {
    return {
      isValid: false,
      normalized: null,
      error: 'Phone number is invalid. Must contain at least 10 valid digits.',
    }
  }

  return {
    isValid: true,
    normalized,
  }
}

/**
 * Formats a currency number in INR (e.g. ₹25,000)
 */
export function formatCurrencyINR(amount?: number | null): string {
  if (typeof amount !== 'number' || isNaN(amount)) return '₹0'
  return `₹${amount.toLocaleString('en-IN')}`
}

/**
 * Generates official pre-filled WhatsApp message for Invoices
 */
export function formatInvoiceWhatsAppMessage(
  invoice: Invoice,
  options?: { companyName?: string; customNote?: string }
): string {
  const customer =
    invoice.customerName ||
    invoice.companyName ||
    options?.companyName ||
    'Valued Customer'

  const lines: string[] = [
    `Hi ${customer},`,
    '',
    'Please find your invoice details below.',
    '',
    `Invoice No: ${invoice.invoiceNumber}`,
    `Amount: ${formatCurrencyINR(invoice.total)}`,
  ]

  // Add Payment status / details if partially paid or pending
  if (invoice.status === 'paid' || invoice.balanceDue === 0) {
    lines.push('Status: Fully Paid')
  } else {
    if (invoice.amountPaid && invoice.amountPaid > 0) {
      lines.push(`Paid: ${formatCurrencyINR(invoice.amountPaid)}`)
    }
    lines.push(`Balance Due: ${formatCurrencyINR(invoice.balanceDue ?? invoice.total)}`)
  }

  if (invoice.dueDate) {
    lines.push(`Due Date: ${invoice.dueDate}`)
  }

  if (invoice.pdfUrl) {
    lines.push(`Invoice PDF: ${invoice.pdfUrl}`)
  }

  if (options?.customNote && options.customNote.trim()) {
    lines.push('')
    lines.push(options.customNote.trim())
  }

  lines.push('')
  lines.push('Thank you for choosing Brothers Furniture.')

  return lines.join('\n')
}

/**
 * Generates official pre-filled WhatsApp message for Proposals
 */
export function formatProposalWhatsAppMessage(
  proposal: Proposal,
  options?: { companyName?: string; customNote?: string }
): string {
  const customer =
    proposal.preparedFor ||
    proposal.customerName ||
    proposal.companyName ||
    options?.companyName ||
    'Valued Client'

  const lines: string[] = [
    `Hi ${customer},`,
    '',
    'Please find your proposal details below.',
    '',
    `Proposal No: ${proposal.proposalNumber}`,
  ]

  if (proposal.title && proposal.title.trim()) {
    lines.push(`Project Scope: ${proposal.title.trim()}`)
  }

  lines.push(`Amount: ${formatCurrencyINR(proposal.total)}`)

  if (proposal.validUntil) {
    lines.push(`Validity: Valid until ${proposal.validUntil}`)
  }

  if (proposal.pdfUrl) {
    lines.push(`Proposal PDF: ${proposal.pdfUrl}`)
  }

  if (options?.customNote && options.customNote.trim()) {
    lines.push('')
    lines.push(options.customNote.trim())
  }

  lines.push('')
  lines.push('Thank you for choosing Brothers Furniture.')

  return lines.join('\n')
}

/**
 * Generates official pre-filled WhatsApp message for Quotations (Estimates/Orders)
 */
export function formatQuotationWhatsAppMessage(
  quote: Order,
  options?: { customNote?: string }
): string {
  const customer = quote.customerName || 'Valued Customer'

  const lines: string[] = [
    `Hi ${customer},`,
    '',
    'Please find your quotation details below.',
    '',
    `Quotation No: ${quote.orderNumber}`,
    `Amount: ${formatCurrencyINR(quote.total)}`,
  ]

  if (quote.items && quote.items.length > 0) {
    const totalUnits = quote.items.reduce((s, it) => s + (it.quantity || 1), 0)
    lines.push(`Items Quoted: ${quote.items.length} product(s) (${totalUnits} total units)`)
  }

  if (quote.pdfUrl) {
    lines.push(`Quotation PDF: ${quote.pdfUrl}`)
  }

  if (options?.customNote && options.customNote.trim()) {
    lines.push('')
    lines.push(options.customNote.trim())
  }

  lines.push('')
  lines.push('Thank you for choosing Brothers Furniture.')

  return lines.join('\n')
}

/**
 * Generates pre-filled greeting message for direct Customer chat
 */
export function formatCustomerGreetingMessage(customerName?: string): string {
  const name = customerName?.trim() || 'Valued Customer'
  return [
    `Hi ${name},`,
    '',
    'Greetings from Brothers Furniture (Ambattur Industrial Estate, Chennai).',
    '',
    'How can we assist you with your commercial furniture requirements today?',
  ].join('\n')
}

/**
 * Builds standard WhatsApp Click-to-Chat URL
 * Format: https://wa.me/<number>?text=<encoded_text>
 */
export function getWhatsAppClickToChatUrl(phone: string, message: string): string {
  const cleanNumber = phone.replace(/\D/g, '')
  const encodedText = encodeURIComponent(message)
  return `https://wa.me/${cleanNumber}?text=${encodedText}`
}

/**
 * Directly opens WhatsApp chat in a new browser tab with phone validation.
 * Returns true if successful, false if phone is invalid.
 */
export function openWhatsAppChat(
  phone: string | null | undefined,
  message: string,
  onError?: (err: string) => void
): boolean {
  const validation = validateWhatsAppPhone(phone)
  if (!validation.isValid || !validation.normalized) {
    if (onError) {
      onError(validation.error || 'Invalid phone number.')
    }
    return false
  }

  const url = getWhatsAppClickToChatUrl(validation.normalized, message)
  window.open(url, '_blank', 'noopener,noreferrer')
  return true
}

