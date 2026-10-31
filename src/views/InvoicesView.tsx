import React, { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  DollarSign,
  Download,
  Eye,
  FileCheck,
  FileEdit,
  FileSpreadsheet,
  Grid,
  Landmark,
  List,
  Loader2,
  MessageCircle,
  MoreVertical,
  Plus,
  Printer,
  Receipt,
  RotateCcw,
  Search,
  Send,
  Trash2,
  X,
} from 'lucide-react'
import { Modal } from '../components/common/Modal'
import { useAdmin } from '../context/AdminContext'
import type { Invoice, InvoiceItem, InvoiceStatus, PaymentMode, Product } from '../types/admin'
import logoImg from '../assets/logo.png'

export const InvoicesView: React.FC = () => {
  const {
    invoices,
    products,
    productTypes,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    recordInvoicePayment,
    generateInvoicePdf,
    settings,
    confirm,
    setCurrentView,
  } = useAdmin()

  const [viewMode, setViewMode] = useState<'table' | 'card'>('table')
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null)
  const [copiedInvId, setCopiedInvId] = useState<string | null>(null)
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null)
  const [actionMenuCoords, setActionMenuCoords] = useState<{ top: number; left: number } | null>(null)

  const activeActionInv = useMemo(
    () => invoices.find((i) => i.id === openActionMenuId),
    [invoices, openActionMenuId]
  )

  // Close 3-dot action dropdown when clicking outside, scrolling, or pressing Escape
  useEffect(() => {
    if (!openActionMenuId) return

    const handleClose = () => {
      setOpenActionMenuId(null)
      setActionMenuCoords(null)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }

    document.addEventListener('click', handleClose)
    window.addEventListener('scroll', handleClose, true)
    window.addEventListener('resize', handleClose)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('click', handleClose)
      window.removeEventListener('scroll', handleClose, true)
      window.removeEventListener('resize', handleClose)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [openActionMenuId])

  // Payment Recording Modal State
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<Invoice | null>(null)
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('neft_rtgs')
  const [paymentRef, setPaymentRef] = useState<string>('')

  // Metrics
  const totalBilled = invoices.reduce((sum, inv) => sum + inv.total, 0)
  const totalCollected = invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0)
  const totalReceivable = invoices.reduce((sum, inv) => sum + (inv.balanceDue || 0), 0)
  const paidCount = invoices.filter((i) => i.status === 'paid').length
  const advanceCount = invoices.filter((i) => i.status === 'advance_received').length
  const pendingCount = invoices.filter((i) => i.status === 'pending').length

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        (inv.proposalRef && inv.proposalRef.toLowerCase().includes(q)) ||
        inv.customerName.toLowerCase().includes(q) ||
        (inv.companyName && inv.companyName.toLowerCase().includes(q)) ||
        inv.phone.toLowerCase().includes(q) ||
        inv.email.toLowerCase().includes(q) ||
        inv.items.some((it) => it.name.toLowerCase().includes(q))
      return matchesStatus && matchesSearch
    })
  }, [invoices, statusFilter, searchQuery])

  // --- New Direct Invoice State (Empty by default) ---
  const [invoiceForm, setInvoiceForm] = useState({
    customerName: '',
    companyName: '',
    phone: '',
    email: '',
    clientGstin: '',
    billingAddress: '',
    shippingAddress: '',
    poNumber: '',
    proposalRef: '',
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
  })

  // Filter for Invoice quick-add items
  const [pickerType, setPickerType] = useState<string>('All')

  const [builderItems, setBuilderItems] = useState<InvoiceItem[]>([])

  const matchingCatalogProducts = useMemo(() => {
    return products.filter((p) => {
      const matchType =
        pickerType === 'All' ||
        (p.type && p.type.toLowerCase() === pickerType.toLowerCase()) ||
        (!p.type && pickerType.toLowerCase() === 'chairs' && p.category.toLowerCase().includes('chair')) ||
        (!p.type && pickerType.toLowerCase() === 'tables' && (p.category.toLowerCase().includes('table') || p.category.toLowerCase().includes('desk'))) ||
        (!p.type && pickerType.toLowerCase() === 'workstations' && p.category.toLowerCase().includes('workstation'))
      return matchType
    })
  }, [products, pickerType])

  const handleAddItemFromProduct = (p: Product) => {
    const qty = p.minOrderQuantity || 1
    const newItem: InvoiceItem = {
      id: `iitem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId: p.id,
      name: p.name,
      image: p.image || '/products/chairs/chair-placeholder.webp',
      hsnCode: '9403',
      quantity: qty,
      unitPrice: p.price,
      total: p.price * qty,
      material: p.material || '',
      dimensions: p.dimensions || '',
      sku: p.sku,
    }
    setBuilderItems((prev) => [...prev, newItem])
  }

  const handleUpdateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    setBuilderItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item
        const updated = { ...item, [field]: value }
        if (field === 'quantity' || field === 'unitPrice') {
          const q = Number(field === 'quantity' ? value : updated.quantity) || 0
          const p = Number(field === 'unitPrice' ? value : updated.unitPrice) || 0
          updated.total = q * p
        }
        return updated
      })
    )
  }

  // Live calculation
  const subtotal = builderItems.reduce((acc, it) => acc + (Number(it.total) || 0), 0)
  const deliveryFee = subtotal >= settings.freeDeliveryThreshold ? 0 : settings.standardDeliveryFee
  const cgstAmount = Math.round(subtotal * 0.09)
  const sgstAmount = Math.round(subtotal * 0.09)
  const taxAmount = cgstAmount + sgstAmount
  const grandTotal = subtotal + deliveryFee + taxAmount

  const handleOpenEditInvoice = (inv: Invoice) => {
    setEditingInvoiceId(inv.id)
    setInvoiceForm({
      customerName: inv.customerName || '',
      companyName: inv.companyName || '',
      phone: inv.phone || '',
      email: inv.email || '',
      clientGstin: inv.clientGstin || '',
      billingAddress: inv.billingAddress || '',
      shippingAddress: inv.shippingAddress || '',
      poNumber: inv.poNumber || '',
      proposalRef: inv.proposalRef || '',
      dueDate: inv.dueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: inv.notes || '',
    })
    setBuilderItems(Array.isArray(inv.items) ? inv.items.map((it) => ({ ...it })) : [])
    setIsCreateModalOpen(true)
  }

  const handleOpenCreateInvoice = () => {
    setEditingInvoiceId(null)
    setInvoiceForm({
      customerName: '',
      companyName: '',
      phone: '',
      email: '',
      clientGstin: '',
      billingAddress: '',
      shippingAddress: '',
      poNumber: '',
      proposalRef: '',
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: '',
    })
    setBuilderItems([])
    setIsCreateModalOpen(true)
  }

  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!invoiceForm.customerName.trim() || builderItems.length === 0) return

    if (editingInvoiceId) {
      const existingInv = invoices.find((i) => i.id === editingInvoiceId)
      const existingAmountPaid = existingInv?.amountPaid || 0
      const newBalanceDue = Math.max(0, grandTotal - existingAmountPaid)
      let newStatus: InvoiceStatus = existingInv?.status || 'pending'
      if (newBalanceDue <= 0 && grandTotal > 0) {
        newStatus = 'paid'
      } else if (existingAmountPaid > 0 && newBalanceDue > 0) {
        newStatus = 'advance_received'
      } else {
        newStatus = 'pending'
      }

      const updatePayload: Partial<Invoice> = {
        proposalRef: invoiceForm.proposalRef || undefined,
        poNumber: invoiceForm.poNumber || undefined,
        customerName: invoiceForm.customerName,
        companyName: invoiceForm.companyName.trim() ? invoiceForm.companyName : undefined,
        phone: invoiceForm.phone,
        email: invoiceForm.email,
        clientGstin: invoiceForm.clientGstin.trim() ? invoiceForm.clientGstin : undefined,
        billingAddress: invoiceForm.billingAddress,
        shippingAddress: invoiceForm.shippingAddress,
        dueDate: invoiceForm.dueDate,
        status: newStatus,
        items: builderItems,
        subtotal,
        deliveryFee,
        cgstRate: 9,
        cgstAmount,
        sgstRate: 9,
        sgstAmount,
        taxAmount,
        total: grandTotal,
        balanceDue: newBalanceDue,
        notes: invoiceForm.notes,
      }

      updateInvoice(editingInvoiceId, updatePayload)
      if (selectedInvoice?.id === editingInvoiceId) {
        setSelectedInvoice({
          ...selectedInvoice,
          ...updatePayload,
        } as Invoice)
      }
    } else {
      const newInv = await addInvoice({
        proposalRef: invoiceForm.proposalRef || undefined,
        poNumber: invoiceForm.poNumber || undefined,
        customerName: invoiceForm.customerName,
        companyName: invoiceForm.companyName.trim() ? invoiceForm.companyName : undefined,
        phone: invoiceForm.phone,
        email: invoiceForm.email,
        clientGstin: invoiceForm.clientGstin.trim() ? invoiceForm.clientGstin : undefined,
        billingAddress: invoiceForm.billingAddress,
        shippingAddress: invoiceForm.shippingAddress,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: invoiceForm.dueDate,
        status: 'pending',
        items: builderItems,
        subtotal,
        deliveryFee,
        cgstRate: 9,
        cgstAmount,
        sgstRate: 9,
        sgstAmount,
        taxAmount,
        total: grandTotal,
        amountPaid: 0,
        balanceDue: grandTotal,
        notes: invoiceForm.notes,
      })
      setSelectedInvoice(newInv)
    }

    setIsCreateModalOpen(false)
    setEditingInvoiceId(null)
    setInvoiceForm({
      customerName: '',
      companyName: '',
      phone: '',
      email: '',
      clientGstin: '',
      billingAddress: '',
      shippingAddress: '',
      poNumber: '',
      proposalRef: '',
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: '',
    })
    setBuilderItems([])
  }

  const handleDeleteInvoice = async (inv: Invoice) => {
    const ok = await confirm({
      title: `Delete Invoice #${inv.invoiceNumber}?`,
      message: `Are you sure you want to delete invoice ${inv.invoiceNumber} for ${inv.customerName}? Total: ₹${inv.total.toLocaleString('en-IN')}.`,
      confirmText: 'Delete Invoice',
      variant: 'danger',
      icon: 'trash',
      badge: inv.invoiceNumber,
    })
    if (ok) {
      deleteInvoice(inv.id)
      if (selectedInvoice?.id === inv.id) setSelectedInvoice(null)
    }
  }

  const handleOpenRecordPayment = (inv: Invoice) => {
    setPaymentModalInvoice(inv)
    setPaymentAmount(inv.balanceDue || 0)
    setPaymentMode(inv.paymentMode || 'neft_rtgs')
    setPaymentRef('')
  }

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!paymentModalInvoice || paymentAmount <= 0) return
    recordInvoicePayment(paymentModalInvoice.id, paymentAmount, paymentMode, paymentRef)
    setPaymentModalInvoice(null)
    if (selectedInvoice?.id === paymentModalInvoice.id) {
      const updated = invoices.find((i) => i.id === paymentModalInvoice.id)
      if (updated) setSelectedInvoice(updated)
    }
  }

  const copyRefToClipboard = (ref: string) => {
    navigator.clipboard.writeText(ref)
    setCopiedInvId(ref)
    setTimeout(() => setCopiedInvId(null), 2000)
  }

  // Generate & Download PDF with R2 storage
  const handleDownloadPdf = async (inv: Invoice) => {
    try {
      setDownloadingInvoiceId(inv.id)

      let targetPdfUrl = inv.pdfUrl
      if (!targetPdfUrl) {
        targetPdfUrl = (await generateInvoicePdf(inv.id, inv)) || undefined
        if (targetPdfUrl) {
          updateInvoice(inv.id, { pdfUrl: targetPdfUrl })
          if (selectedInvoice?.id === inv.id) {
            setSelectedInvoice((prev) => (prev ? { ...prev, pdfUrl: targetPdfUrl } : null))
          }
        }
      }

      // Fetch file attachment directly so it downloads to computer without blank tabs
      const downloadEndpoint = `/api/invoices/${inv.id}/download-pdf`
      const res = await fetch(downloadEndpoint)
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${inv.invoiceNumber || 'invoice'}.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      } else if (targetPdfUrl) {
        const a = document.createElement('a')
        a.href = targetPdfUrl
        a.download = `${inv.invoiceNumber || 'invoice'}.pdf`
        a.target = '_blank'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }
    } catch (err) {
      console.error('Failed to download invoice PDF:', err)
      alert('Could not download invoice PDF. Please try again.')
    } finally {
      setDownloadingInvoiceId(null)
    }
  }

  const statusConfig: Record<
    InvoiceStatus,
    { label: string; pillClass: string; badgeClass: string }
  > = {
    paid: {
      label: 'Fully Paid',
      pillClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    advance_received: {
      label: 'Advance Paid',
      pillClass: 'bg-blue-50 text-blue-700 border-blue-200',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    pending: {
      label: 'Payment Pending',
      pillClass: 'bg-amber-50 text-amber-700 border-amber-200',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    overdue: {
      label: 'Payment Overdue',
      pillClass: 'bg-rose-50 text-rose-700 border-rose-200',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    cancelled: {
      label: 'Cancelled',
      pillClass: 'bg-slate-100 text-slate-700 border-slate-200',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    },
  }

  // ----------------------------------------------------
  // SUB-RENDERERS (MODALS & DOCUMENT)
  // ----------------------------------------------------
  const renderInvoiceBuilderModal = () => (
    <Modal
      isOpen={isCreateModalOpen}
      onClose={() => {
        setIsCreateModalOpen(false)
        setEditingInvoiceId(null)
      }}
      title={
        editingInvoiceId
          ? `Edit Tax Invoice (${invoices.find((i) => i.id === editingInvoiceId)?.invoiceNumber || ''})`
          : 'Generate Official GST Tax Invoice'
      }
      subtitle={
        editingInvoiceId
          ? 'Modify line items, quantities, pricing, and client billing details'
          : 'Create an itemized tax invoice with HSN 9403, CGST/SGST calculations and product photos'
      }
      maxWidth="max-w-4xl"
    >
      <form onSubmit={handleSaveInvoice} className="space-y-4">
        <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Client & Billing Information
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Customer Name <span className="text-orange-500">*</span>
              </label>
              <input
                required
                type="text"
                value={invoiceForm.customerName}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, customerName: e.target.value })}
                placeholder="e.g. Anand Ramanathan"
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Company / Entity Name
              </label>
              <input
                type="text"
                value={invoiceForm.companyName}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, companyName: e.target.value })}
                placeholder="e.g. TechVantage Solutions"
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Client GSTIN
              </label>
              <input
                type="text"
                value={invoiceForm.clientGstin}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, clientGstin: e.target.value })}
                placeholder="33AABCT9981M1ZX"
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono uppercase text-slate-800 outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Phone Number <span className="text-orange-500">*</span>
              </label>
              <input
                required
                type="tel"
                value={invoiceForm.phone}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, phone: e.target.value })}
                placeholder="+91 98401 22849"
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={invoiceForm.email}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, email: e.target.value })}
                placeholder="procurement@techvantage.com"
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Due Date <span className="text-orange-500">*</span>
              </label>
              <input
                required
                type="date"
                value={invoiceForm.dueDate}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Billing Address (Consignee) <span className="text-orange-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={invoiceForm.billingAddress}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, billingAddress: e.target.value })}
                placeholder="Complete postal address for GST compliance..."
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-orange-500 resize-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Shipping Address (Delivery Destination)
              </label>
              <textarea
                rows={2}
                value={invoiceForm.shippingAddress}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, shippingAddress: e.target.value })}
                placeholder="Leave blank if same as billing address..."
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-orange-500 resize-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Purchase Order (PO) Number
              </label>
              <input
                type="text"
                value={invoiceForm.poNumber}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, poNumber: e.target.value })}
                placeholder="e.g. PO/2026/OCT/0491"
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Proposal Reference ID
              </label>
              <input
                type="text"
                value={invoiceForm.proposalRef}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, proposalRef: e.target.value })}
                placeholder="e.g. BF-PROP-2026-004"
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Product selector */}
        <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Itemized Line Products (HSN 9403)
            </h4>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {['All', ...productTypes].slice(0, 5).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setPickerType(t)}
                  className={`px-2 py-0.5 rounded text-[10.5px] font-medium transition cursor-pointer ${
                    pickerType.toLowerCase() === t.toLowerCase()
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value=""
              onChange={(e) => {
                const prod = products.find((p) => p.id === e.target.value)
                if (prod) handleAddItemFromProduct(prod)
              }}
              className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-orange-500 font-medium"
            >
              <option value="" disabled>
                + Click to Add Matching Catalog Product ({matchingCatalogProducts.length})
              </option>
              {matchingCatalogProducts.map((p) => (
                <option key={p.id} value={p.id} className="bg-white text-slate-800 font-normal">
                  {p.name} — ₹{p.price.toLocaleString('en-IN')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Line items */}
        {builderItems.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
            <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-700">No products added to invoice yet</p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Choose a product from the quick catalog dropdown above to add items to this invoice.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {builderItems.map((item, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center gap-3 text-xs"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-12 h-12 rounded object-cover bg-slate-50 border border-slate-200 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-slate-900 block truncate">{item.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    HSN: {item.hsnCode || '9403'} &bull; {item.sku}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleUpdateItem(idx, 'quantity', e.target.value)}
                    className="w-16 bg-white border border-slate-200 rounded px-1.5 py-1 text-center font-mono font-bold"
                  />
                  <input
                    type="number"
                    min="0"
                    value={item.unitPrice}
                    onChange={(e) => handleUpdateItem(idx, 'unitPrice', e.target.value)}
                    className="w-24 bg-white border border-slate-200 rounded px-2 py-1 text-right font-mono font-bold"
                  />
                  <span className="font-mono font-bold text-slate-900 text-xs min-w-[70px] text-right">
                    ₹{item.total.toLocaleString('en-IN')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setBuilderItems((prev) => prev.filter((_, i) => i !== idx))}
                    className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                    title="Remove item"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Totals */}
        <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between font-mono text-xs">
          <div className="space-y-0.5">
            <span>Subtotal: ₹{subtotal.toLocaleString('en-IN')}</span>
            <span className="mx-2">|</span>
            <span>CGST (9%): ₹{cgstAmount.toLocaleString('en-IN')}</span>
            <span className="mx-2">|</span>
            <span>SGST (9%): ₹{sgstAmount.toLocaleString('en-IN')}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-sans">Total Tax Invoice</span>
            <span className="text-base font-bold text-orange-400">
              ₹{grandTotal.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-200 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={() => {
              setIsCreateModalOpen(false)
              setEditingInvoiceId(null)
            }}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!invoiceForm.customerName.trim() || builderItems.length === 0}
            className={`px-4 py-1.5 rounded-lg text-white text-xs font-semibold shadow-xs transition inline-flex items-center gap-1.5 ${
              !invoiceForm.customerName.trim() || builderItems.length === 0
                ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                : 'bg-blue-600 hover:bg-blue-700 cursor-pointer active:scale-95'
            }`}
          >
            {editingInvoiceId ? <FileEdit className="w-3.5 h-3.5" /> : null}
            <span>{editingInvoiceId ? 'Save & Update Invoice' : 'Generate Tax Invoice'}</span>
          </button>
        </div>
      </form>
    </Modal>
  )

  const renderPaymentModal = () =>
    paymentModalInvoice && (
      <Modal
        isOpen={true}
        onClose={() => setPaymentModalInvoice(null)}
        title={`Record Payment for ${paymentModalInvoice.invoiceNumber}`}
        subtitle={`Total: ₹${paymentModalInvoice.total.toLocaleString('en-IN')} • Current Due: ₹${paymentModalInvoice.balanceDue.toLocaleString('en-IN')}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSavePayment} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Payment Amount (₹) <span className="text-orange-500">*</span>
            </label>
            <input
              required
              type="number"
              min="1"
              max={paymentModalInvoice.balanceDue}
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(Number(e.target.value) || 0)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Payment Mode
            </label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-orange-500"
            >
              <option value="neft_rtgs">NEFT / RTGS Bank Transfer</option>
              <option value="upi">UPI / QR Code</option>
              <option value="cheque">Cheque</option>
              <option value="card">Corporate Card</option>
              <option value="cash">Cash</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Transaction Reference / UTR Number
            </label>
            <input
              type="text"
              placeholder="e.g. UTR: HDFCR52026102400912"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setPaymentModalInvoice(null)}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              Record ₹{paymentAmount.toLocaleString('en-IN')}
            </button>
          </div>
        </form>
      </Modal>
    )

  const renderInvoiceDocument = (inv: Invoice) => {
    const bankAccounts = settings.bankAccounts || []
    const activeBank =
      bankAccounts.find((b) => b.isDefault) ||
      bankAccounts[0] || {
        bankName: 'HDFC Bank',
        accountName: 'Brothers Furniture Industrial Solutions',
        accountNumber: '50200084920194',
        ifscCode: 'HDFC0001849',
        branch: 'Ambattur Industrial Estate Branch, Chennai',
        upiId: 'brothersfurniture@hdfcbank',
        accountType: 'Current',
      }

    const companyName = settings.name || 'Brothers Furniture'
    const addressLines =
      settings.addressLines && settings.addressLines.length > 0
        ? settings.addressLines
        : [
            'Plot No. 42-B, SIDCO Industrial Estate',
            'Ambattur, Chennai – 600058, Tamil Nadu, India',
          ]
    const companyGstin = settings.gstin || '33AAAAA0000A1Z5'
    const companyEmail = settings.email || 'sales@brothersfurniture.in'
    const companyPhone =
      settings.phones && settings.phones.length > 0
        ? typeof settings.phones[0] === 'string'
          ? settings.phones[0]
          : (settings.phones[0] as any).display || (settings.phones[0] as any).tel || '+91 98400 12345'
        : '+91 98400 12345'

    const subtotal = Number(inv.subtotal) || 0
    const discountAmount = Number(inv.discountAmount) || 0
    const deliveryFee = Number(inv.deliveryFee) || 0
    const cgstAmount = Number(inv.cgstAmount) || Math.round(Math.max(0, subtotal - discountAmount) * 0.09)
    const sgstAmount = Number(inv.sgstAmount) || Math.round(Math.max(0, subtotal - discountAmount) * 0.09)
    const total = Number(inv.total) || (subtotal - discountAmount + deliveryFee + cgstAmount + sgstAmount)
    const amountPaid = Number(inv.amountPaid) || 0
    const balanceDue =
      Number(inv.balanceDue) !== undefined ? Number(inv.balanceDue) : Math.max(0, total - amountPaid)

    const items = Array.isArray(inv.items) ? inv.items : []

    const formatCurrency = (amt: number) =>
      '₹' +
      Number(amt || 0).toLocaleString('en-IN', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      })

    return (
      <div className="bg-white rounded-xl shadow-xl border border-slate-200/90 p-4 sm:p-8 md:p-12 max-w-4xl mx-auto space-y-4 sm:space-y-5 text-slate-800 print:p-0 print:border-none print:shadow-none print:max-w-none">
        {/* 1. HEADER (Left: invoice details, Right: logo) - Fully Responsive */}
        <div className="flex flex-row justify-between items-start pb-4 border-b-2 border-slate-900 gap-3 sm:gap-4">
          <div className="space-y-1 sm:space-y-1.5 flex-1 min-w-0">
            <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase leading-tight">
              INVOICE
            </h2>
            <ul className="space-y-1 sm:space-y-0.5 text-[11px] sm:text-[11.5px] text-slate-700">
              <li className="flex flex-col sm:flex-row sm:items-baseline">
                <span className="font-semibold text-slate-500 sm:min-w-[105px]">Invoice Number:</span>
                <span className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</span>
              </li>
              <li className="flex flex-col sm:flex-row sm:items-baseline">
                <span className="font-semibold text-slate-500 sm:min-w-[105px]">Invoice Date:</span>
                <span className="font-mono font-bold text-slate-900">{inv.issueDate}</span>
              </li>
              <li className="flex flex-col sm:flex-row sm:items-baseline">
                <span className="font-semibold text-slate-500 sm:min-w-[105px]">Due Date:</span>
                <span className="font-mono font-bold text-[#ea580c]">{inv.dueDate}</span>
              </li>
              {inv.proposalRef && (
                <li className="flex flex-col sm:flex-row sm:items-baseline">
                  <span className="font-semibold text-slate-500 sm:min-w-[105px]">Proposal Ref:</span>
                  <span className="font-mono font-bold text-purple-700">{inv.proposalRef}</span>
                </li>
              )}
              {inv.poNumber && (
                <li className="flex flex-col sm:flex-row sm:items-baseline">
                  <span className="font-semibold text-slate-500 sm:min-w-[105px]">Buyer PO Ref:</span>
                  <span className="font-mono font-bold text-slate-800">{inv.poNumber}</span>
                </li>
              )}
            </ul>
          </div>

          {/* Logo on Right */}
          <div className="flex items-start shrink-0 pt-0.5">
            <img
              src={logoImg}
              alt="Brothers Furniture"
              className="w-24 sm:w-36 md:w-44 max-h-[46px] sm:max-h-[65px] object-contain ml-auto"
            />
          </div>
        </div>

        {/* 2. BILLED BY & BILLED TO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
          {/* BILLED BY (SUPPLIER) */}
          <div className="bg-[#f8fafc] border border-slate-200 rounded-lg p-3 sm:p-3.5 space-y-1">
            <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-[0.8px] pb-1 mb-1.5 border-b border-dashed border-slate-300">
              BILLED BY (SUPPLIER)
            </div>
            <div className="text-[13px] font-extrabold text-slate-900">{companyName}</div>
            <div className="text-[10.5px] text-slate-600 leading-snug">{addressLines.join(', ')}</div>
            <div className="text-[10.5px] text-slate-600 pt-0.5">
              GSTIN: <span className="font-mono font-bold text-slate-900">{companyGstin}</span>
            </div>
            <div className="text-[10.5px] text-slate-600">
              State: <span className="font-mono font-bold text-slate-900">33 - Tamil Nadu</span>
            </div>
            <div className="text-[10.5px] text-slate-600">
              Phone: {companyPhone} &bull; Email: {companyEmail}
            </div>
          </div>

          {/* BILLED TO (BUYER) */}
          <div className="bg-[#f8fafc] border border-slate-200 rounded-lg p-3 sm:p-3.5 space-y-1">
            <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-[0.8px] pb-1 mb-1.5 border-b border-dashed border-slate-300">
              BILLED TO (BUYER)
            </div>
            <div className="text-[13px] font-extrabold text-slate-900">{inv.customerName}</div>
            {inv.companyName && (
              <div className="text-[11.5px] font-bold text-slate-800">{inv.companyName}</div>
            )}
            <div className="text-[10.5px] text-slate-600 leading-snug">
              {inv.billingAddress || 'Address on record'}
            </div>
            {inv.shippingAddress && inv.shippingAddress !== inv.billingAddress && (
              <div className="text-[10.5px] text-slate-600 italic pt-0.5">
                <strong>Delivery Destination:</strong> {inv.shippingAddress}
              </div>
            )}
            <div className="text-[10.5px] text-slate-600 pt-0.5">
              Phone: <span className="font-mono font-bold text-slate-900">{inv.phone}</span> &bull; Email: {inv.email}
            </div>
            {inv.clientGstin && (
              <div className="text-[10.5px] text-slate-600">
                Buyer GSTIN: <span className="font-mono font-bold text-slate-900">{inv.clientGstin}</span>
              </div>
            )}
          </div>
        </div>

        {/* 3. PRODUCTS DETAILS (TAX INVOICE SCHEDULE) */}
        <div>
          <div className="text-[11px] font-extrabold text-slate-900 uppercase tracking-[0.8px] mb-2">
            PRODUCTS DETAILS (TAX INVOICE SCHEDULE)
          </div>
          <div className="border border-slate-300 rounded-lg overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[580px]">
              <thead>
                <tr className="bg-[#0f172a] text-white text-[9.5px] font-bold uppercase tracking-[0.6px]">
                  <th className="py-2 px-2.5 text-center w-10">#</th>
                  <th className="py-2 px-2.5">Description &amp; Model</th>
                  <th className="py-2 px-2.5 text-center w-16">HSN/SAC</th>
                  <th className="py-2 px-2.5 text-center w-12">Qty</th>
                  <th className="py-2 px-2.5 text-right w-24">Unit Rate</th>
                  <th className="py-2 px-2.5 text-right w-24">Taxable</th>
                  <th className="py-2 px-2.5 text-right w-28">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400 text-xs">
                      No line items specified.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => {
                    const qty = Number(item.quantity) || 1
                    const rate = Number(item.unitPrice) || 0
                    const itemSubtotal = Number(item.total) || qty * rate
                    const withGst = itemSubtotal * 1.18
                    return (
                      <tr key={idx} className="even:bg-[#f8fafc] text-[10.5px]">
                        <td className="py-2 px-2.5 text-center font-mono text-slate-500">{idx + 1}</td>
                        <td className="py-2 px-2.5">
                          <div className="font-bold text-slate-900 text-[11px]">{item.name}</div>
                          <div className="text-[9.5px] text-slate-500 mt-0.5">
                            {item.sku && (
                              <span className="inline-block bg-slate-200 text-slate-700 font-mono text-[8.5px] font-semibold px-1 rounded mr-1">
                                {item.sku}
                              </span>
                            )}
                            {[item.material, item.dimensions].filter(Boolean).join(' • ')}
                          </div>
                        </td>
                        <td className="py-2 px-2.5 text-center font-mono text-slate-600">
                          {item.hsnCode || '9403'}
                        </td>
                        <td className="py-2 px-2.5 text-center font-mono font-bold text-slate-900">
                          {qty}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono text-slate-700">
                          {formatCurrency(rate)}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono text-slate-700">
                          {formatCurrency(itemSubtotal)}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(withGst)}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* FINANCIAL TOTALS BREAKDOWN */}
        <div className="flex justify-end my-3">
          <table className="w-full sm:w-80 border-collapse text-[10.5px]">
            <tbody>
              <tr>
                <td className="py-1 px-2 text-slate-600 text-left">Taxable Value (Subtotal):</td>
                <td className="py-1 px-2 text-right font-mono font-semibold text-slate-800">
                  {formatCurrency(subtotal)}
                </td>
              </tr>
              {discountAmount > 0 && (
                <tr>
                  <td className="py-1 px-2 text-slate-600 text-left">Commercial Discount:</td>
                  <td className="py-1 px-2 text-right font-mono font-semibold text-emerald-600">
                    -{formatCurrency(discountAmount)}
                  </td>
                </tr>
              )}
              <tr>
                <td className="py-1 px-2 text-slate-600 text-left">Central GST (CGST 9%):</td>
                <td className="py-1 px-2 text-right font-mono font-semibold text-slate-800">
                  {formatCurrency(cgstAmount)}
                </td>
              </tr>
              <tr>
                <td className="py-1 px-2 text-slate-600 text-left">State GST (SGST 9%):</td>
                <td className="py-1 px-2 text-right font-mono font-semibold text-slate-800">
                  {formatCurrency(sgstAmount)}
                </td>
              </tr>
              <tr>
                <td className="py-1 px-2 text-slate-600 text-left">Freight &amp; Assembly Fee:</td>
                <td className="py-1 px-2 text-right font-mono font-semibold text-slate-800">
                  {deliveryFee === 0 ? (
                    <span className="text-emerald-600 font-bold">FREE</span>
                  ) : (
                    formatCurrency(deliveryFee)
                  )}
                </td>
              </tr>
              <tr className="border-t-2 border-b-2 border-slate-900">
                <td className="py-2 px-2 text-slate-900 font-extrabold uppercase tracking-wide text-xs">
                  Total Amount:
                </td>
                <td className="py-2 px-2 text-right font-mono font-black text-sm text-[#ea580c]">
                  {formatCurrency(total)}
                </td>
              </tr>
              <tr>
                <td className="py-1 px-2 text-emerald-700 font-semibold text-left">Amount Paid:</td>
                <td className="py-1 px-2 text-right font-mono font-semibold text-emerald-700">
                  {formatCurrency(amountPaid)}
                </td>
              </tr>
              <tr>
                <td className="py-1 px-2 text-amber-800 font-bold text-left">Balance Due:</td>
                <td className="py-1 px-2 text-right font-mono font-extrabold text-amber-800">
                  {formatCurrency(balanceDue)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 4. BANK DETAILS & AUTHORIZED SIGNATORY */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 pt-2">
          {/* Bank Details Box (7 cols) */}
          <div className="md:col-span-7 bg-[#f8fafc] border-[1.5px] border-slate-300 rounded-lg p-3 sm:p-3.5 space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
              <span className="text-[10.5px] font-extrabold text-slate-900 uppercase tracking-[0.8px] flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-blue-600" />
                BANK DETAILS FOR PAYMENT
              </span>
              <span className="bg-[#0f172a] text-white text-[8.5px] font-bold px-1.5 py-0.5 rounded tracking-wide">
                RTGS / NEFT / IMPS
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Bank Name
                </span>
                <span className="text-[11px] font-bold text-slate-900 font-mono block">
                  {activeBank.bankName}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Account Name (Beneficiary)
                </span>
                <span className="text-[11px] font-bold text-slate-900 font-mono block">
                  {activeBank.accountName}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Account Number
                </span>
                <span className="text-[11px] font-bold text-slate-900 font-mono block">
                  {activeBank.accountNumber}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider block">
                  IFSC Code
                </span>
                <span className="text-[11px] font-bold text-slate-900 font-mono block">
                  {activeBank.ifscCode}
                </span>
              </div>
              {activeBank.branch && (
                <div className="col-span-2">
                  <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Branch
                  </span>
                  <span className="text-[10px] text-slate-700 block">{activeBank.branch}</span>
                </div>
              )}
              {activeBank.upiId && (
                <div className="col-span-2">
                  <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider block">
                    UPI ID
                  </span>
                  <span className="text-[11px] font-bold text-purple-700 font-mono block">
                    {activeBank.upiId}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Authorized Signatory (5 cols) */}
          <div className="md:col-span-5 border border-dashed border-slate-300 rounded-lg p-3 sm:p-3.5 bg-white flex flex-col justify-between text-right min-h-[110px]">
            <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
              For {companyName}
            </div>
            <div className="h-12 flex items-center justify-end my-1">
              {settings.signatureUrl ? (
                <img
                  src={settings.signatureUrl}
                  alt="Authorized Signatory"
                  className="max-h-12 max-w-[140px] object-contain ml-auto"
                />
              ) : (
                <div className="h-10"></div>
              )}
            </div>
            <div>
              <div className="border-t border-slate-400 w-40 ml-auto mb-1"></div>
              <div className="text-[9.5px] font-bold text-slate-900 uppercase tracking-wider">
                Authorized Signatory
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER / TERMS */}
        <div className="mt-4 pt-2.5 border-t border-slate-200 text-[9px] text-slate-500 text-center space-y-0.5 leading-normal">
          <p>
            <strong>Terms &amp; Conditions:</strong> 1. Payment is due strictly according to agreed credit terms. 2. Interest @ 18% p.a. will be charged on overdue payments. 3. Goods once sold and accepted at site will not be taken back. 4. Subject to Chennai Jurisdiction.
          </p>
          <p className="italic">
            Thank you for partnering with Brothers Furniture for your commercial workspace fit-outs.
          </p>
        </div>
      </div>
    )
  }

  // ----------------------------------------------------
  // FULL-PAGE VIEW FOR SELECTED TAX INVOICE (LIKE PROPOSAL)
  // ----------------------------------------------------
  if (selectedInvoice) {
    const statusInfo = statusConfig[selectedInvoice.status] || {
      label: selectedInvoice.status,
      pillClass: 'bg-slate-100 text-slate-700 border-slate-200',
    }

    return (
      <div className="space-y-4">
        {/* Dedicated Tax Invoice Top Navigation & Action Bar (Clean Neutral Theme like Proposal) */}
        <div className="bg-white text-slate-900 rounded-2xl p-3 sm:p-5 shadow-xs border border-slate-200/90 flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 print:hidden">
          {/* Left: Back button + Title & Status */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={() => setSelectedInvoice(null)}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/90 text-slate-700 hover:text-slate-900 border border-slate-200/80 transition cursor-pointer flex items-center gap-1.5 sm:gap-2 text-xs font-semibold shrink-0 active:scale-95"
              title="Return to Invoices List"
            >
              <ArrowLeft className="w-4 h-4 text-orange-600" />
              <span className="hidden xs:inline">Back to Invoices</span>
            </button>
            <div className="h-6 w-px bg-slate-200 hidden xs:block" />
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200 text-orange-800 text-xs font-mono font-bold">
                <Receipt className="w-3.5 h-3.5 text-orange-600" />
                <span>{selectedInvoice.invoiceNumber}</span>
              </span>

              <span
                className={`text-xs font-semibold rounded-lg px-2.5 py-1 border ${statusInfo.pillClass}`}
              >
                {statusInfo.label}
              </span>
            </div>
          </div>

          {/* Right: Primary Actions (Clean Neutral Theme) */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap w-full lg:w-auto">
            {/* DOWNLOAD INVOICE PDF BUTTON (R2) */}
            <button
              onClick={() => handleDownloadPdf(selectedInvoice)}
              disabled={downloadingInvoiceId === selectedInvoice.id}
              className="flex-1 sm:flex-initial justify-center px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold shadow-2xs transition inline-flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
              title="Download Tax Invoice PDF"
            >
              {downloadingInvoiceId === selectedInvoice.id ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
                  <span>Preparing PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Download<span className="hidden sm:inline"> PDF</span></span>
                </>
              )}
            </button>

            {/* PRINT TAX INVOICE BUTTON */}
            <button
              onClick={() => window.print()}
              className="flex-1 sm:flex-initial justify-center px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold border border-slate-200 transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
              title="Print Tax Invoice"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print<span className="hidden sm:inline"> Invoice</span></span>
            </button>

            {/* WHATSAPP SHARE BUTTON */}
            <a
              href={`https://wa.me/${selectedInvoice.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                `Dear ${selectedInvoice.customerName},\nBrothers Furniture official Tax Invoice *${selectedInvoice.invoiceNumber}* for *₹${selectedInvoice.total.toLocaleString(
                  'en-IN'
                )}* is attached.\n\nPaid: ₹${(selectedInvoice.amountPaid || 0).toLocaleString(
                  'en-IN'
                )}\nBalance: ₹${(selectedInvoice.balanceDue || 0).toLocaleString(
                  'en-IN'
                )}\n\nThank you for your business.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial justify-center px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold shadow-2xs transition inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Share via WhatsApp"
            >
              <Send className="w-3.5 h-3.5 text-slate-600" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

        {/* INVOICE PAPER VIEWPORT */}
        {renderInvoiceDocument(selectedInvoice)}

        {/* Modals */}
        {renderInvoiceBuilderModal()}
        {renderPaymentModal()}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 1. Header & Metrics */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-0.5">
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <h1 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-1.5 sm:gap-2">
              <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 shrink-0" />
              <span>Tax Invoices & Enterprise Billing</span>
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              <FileCheck className="w-3 h-3 text-slate-500" />
              {invoices.length} Invoices
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {paidCount} Paid
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              {advanceCount} Advance
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              {pendingCount} Pending
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official GST Tax Invoices (HSN 9403), CGST/SGST breakdowns, RTGS payment tracking, and receipt printing.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setCurrentView('proposals')}
            className="flex-1 sm:flex-initial justify-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>View Proposals</span>
          </button>
          <button
            onClick={handleOpenCreateInvoice}
            className="flex-1 sm:flex-initial justify-center inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Generate Invoice</span>
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block">
              Total Invoiced Value
            </span>
            <span className="text-lg font-bold font-mono text-slate-900 block mt-0.5">
              ₹{totalBilled.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block">
              Payments Collected
            </span>
            <span className="text-lg font-bold font-mono text-emerald-600 block mt-0.5">
              ₹{totalCollected.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block">
              Outstanding Receivable
            </span>
            <span className="text-lg font-bold font-mono text-amber-600 block mt-0.5">
              ₹{totalReceivable.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-2.5 sm:p-3 shadow-xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Status Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 max-w-full">
            {[
              { id: 'all', label: `All Invoices (${invoices.length})` },
              { id: 'paid', label: `Paid (${paidCount})` },
              { id: 'advance_received', label: `Advance (${advanceCount})` },
              { id: 'pending', label: `Pending (${pendingCount})` },
            ].map((tab) => {
              const isSelected = statusFilter === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id as any)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                      : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Search & Switcher */}
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search invoice, client, PO..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-full sm:w-56 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1 rounded-md transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`p-1 rounded-md transition-all cursor-pointer ${
                  viewMode === 'card' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Card View"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Invoices Table or Cards */}
      {filteredInvoices.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center space-y-3 shadow-xs">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
          <h4 className="text-sm sm:text-base font-bold text-slate-900">No invoices found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No tax invoice matched your active filter or search query.
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              onClick={() => {
                setStatusFilter('all')
                setSearchQuery('')
              }}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-3 h-3" /> Reset Filters
            </button>
            <button
              onClick={handleOpenCreateInvoice}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-2xs cursor-pointer inline-flex items-center gap-1.5 active:scale-95"
            >
              <Plus className="w-3 h-3" /> Create Invoice
            </button>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3.5">Invoice # & Date</th>
                  <th className="py-2.5 px-3.5">Client & Organization</th>
                  <th className="py-2.5 px-3.5">Scope & Products</th>
                  <th className="py-2.5 px-3.5">Total & Tax</th>
                  <th className="py-2.5 px-3.5">Payment & Balance</th>
                  <th className="py-2.5 px-3.5">Status</th>
                  <th className="py-2.5 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredInvoices.map((inv) => {
                  const statusInfo = statusConfig[inv.status] || {
                    label: inv.status,
                    pillClass: 'bg-slate-100 text-slate-700 border-slate-200',
                  }

                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setSelectedInvoice(inv)}
                    >
                      {/* Invoice # & Date */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900 text-xs block">
                            {inv.invoiceNumber}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              copyRefToClipboard(inv.invoiceNumber)
                            }}
                            className="text-slate-400 hover:text-slate-600 transition p-0.5 rounded cursor-pointer"
                            title="Copy Ref"
                          >
                            {copiedInvId === inv.invoiceNumber ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <span className="text-[10.5px] text-slate-400 block mt-0.5">
                          Date: {inv.issueDate}
                        </span>
                        {inv.proposalRef && (
                          <span className="text-[10px] text-purple-700 font-semibold font-mono block">
                            Ref: {inv.proposalRef}
                          </span>
                        )}
                      </td>

                      {/* Client */}
                      <td className="py-2.5 px-3.5">
                        <div className="min-w-0 max-w-[210px]">
                          <span className="font-bold text-slate-900 text-xs sm:text-[13px] block truncate">
                            {inv.customerName}
                          </span>
                          {inv.companyName && (
                            <span className="text-[11.5px] text-slate-700 font-medium block truncate flex items-center gap-1 mt-0.5">
                              <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                              {inv.companyName}
                            </span>
                          )}
                          <span className="text-[10.5px] text-slate-400 block truncate font-mono mt-0.5">
                            {inv.phone}
                          </span>
                        </div>
                      </td>

                      {/* Items with Thumbnails */}
                      <td className="py-2.5 px-3.5">
                        <div className="flex items-center gap-2 max-w-[260px]">
                          <div className="flex -space-x-2 overflow-hidden shrink-0">
                            {inv.items.slice(0, 3).map((it, idx) => (
                              <img
                                key={idx}
                                src={it.image}
                                alt={it.name}
                                className="inline-block h-8 w-8 rounded-lg ring-2 ring-white object-cover bg-slate-100"
                                onError={(e) => {
                                  ;(e.target as HTMLImageElement).src =
                                    'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&w=150&q=70'
                                }}
                              />
                            ))}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold text-slate-800 text-xs truncate block">
                              {inv.items[0]?.name}
                            </span>
                            <span className="text-[10.5px] text-slate-400 block truncate">
                              {inv.items.length} line item{inv.items.length > 1 ? 's' : ''} (HSN 9403)
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Total */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-900 text-xs sm:text-[13px] block">
                          ₹{inv.total.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          GST 18%: ₹{inv.taxAmount.toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* Balance & Paid */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap font-mono">
                        <span className="text-xs text-emerald-700 font-semibold block">
                          Paid: ₹{(inv.amountPaid || 0).toLocaleString('en-IN')}
                        </span>
                        <span
                          className={`text-xs font-bold block ${
                            inv.balanceDue > 0 ? 'text-amber-700' : 'text-slate-400'
                          }`}
                        >
                          Due: ₹{(inv.balanceDue || 0).toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <span
                          className={`text-xs font-semibold rounded-lg px-2 py-0.5 border ${statusInfo.pillClass}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Actions (3-Dot Dropdown Menu) */}
                      <td className="py-2.5 px-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block text-left">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (openActionMenuId === inv.id) {
                                setOpenActionMenuId(null)
                                setActionMenuCoords(null)
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect()
                                const menuWidth = 196
                                const menuHeight = 220
                                const spaceBelow = window.innerHeight - rect.bottom
                                const openUpward = spaceBelow < menuHeight && rect.top > menuHeight

                                const top = openUpward
                                  ? Math.max(10, rect.top - menuHeight - 4)
                                  : Math.min(window.innerHeight - menuHeight - 10, rect.bottom + 4)
                                let left = rect.right - menuWidth
                                if (left < 10) left = 10
                                if (left + menuWidth > window.innerWidth - 10) {
                                  left = window.innerWidth - menuWidth - 10
                                }

                                setActionMenuCoords({ top, left })
                                setOpenActionMenuId(inv.id)
                              }
                            }}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              openActionMenuId === inv.id
                                ? 'bg-slate-100 text-slate-900 border-slate-300'
                                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50 border-transparent hover:border-slate-200'
                            }`}
                            title="Actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* 3-Dot Action Menu Portal outside table */}
          {activeActionInv && actionMenuCoords &&
            createPortal(
              <div
                style={{
                  position: 'fixed',
                  top: `${actionMenuCoords.top}px`,
                  left: `${actionMenuCoords.left}px`,
                  width: '196px',
                  zIndex: 99999,
                }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white/98 backdrop-blur-md rounded-2xl border border-slate-200 shadow-2xl py-1.5 animate-in fade-in zoom-in-95 duration-100 divide-y divide-slate-100 select-none text-xs"
              >
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenActionMenuId(null)
                      setActionMenuCoords(null)
                      setSelectedInvoice(activeActionInv)
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-orange-500" />
                    <span>View Tax Invoice</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOpenActionMenuId(null)
                      setActionMenuCoords(null)
                      handleDownloadPdf(activeActionInv)
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    <span>Download PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOpenActionMenuId(null)
                      setActionMenuCoords(null)
                      handleOpenEditInvoice(activeActionInv)
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <FileEdit className="w-3.5 h-3.5 text-blue-600" />
                    <span>Edit Invoice</span>
                  </button>

                  {activeActionInv.balanceDue > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setOpenActionMenuId(null)
                        setActionMenuCoords(null)
                        handleOpenRecordPayment(activeActionInv)
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Record Payment</span>
                    </button>
                  )}

                  <a
                    href={`https://wa.me/${activeActionInv.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      `Greetings ${activeActionInv.customerName},\n\nBrothers Furniture official tax invoice ref *${activeActionInv.invoiceNumber}* for *₹${activeActionInv.total.toLocaleString(
                        'en-IN'
                      )}* is ready.\n\nAmount Paid: ₹${(activeActionInv.amountPaid || 0).toLocaleString(
                        'en-IN'
                      )}\nBalance Due: ₹${(activeActionInv.balanceDue || 0).toLocaleString(
                        'en-IN'
                      )}\n\nThank you for choosing Brothers Furniture.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      setOpenActionMenuId(null)
                      setActionMenuCoords(null)
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Share on WhatsApp</span>
                  </a>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenActionMenuId(null)
                      setActionMenuCoords(null)
                      handleDeleteInvoice(activeActionInv)
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Invoice</span>
                  </button>
                </div>
              </div>,
              document.body
            )}
        </div>
      ) : (
        /* CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredInvoices.map((inv) => {
            const statusInfo = statusConfig[inv.status] || {
              label: inv.status,
              pillClass: 'bg-slate-100 text-slate-700 border-slate-200',
            }

            return (
              <div
                key={inv.id}
                className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs hover:border-orange-300 hover:shadow-sm transition-all space-y-3 flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-900 text-xs">
                        {inv.invoiceNumber}
                      </span>
                      <button
                        onClick={() => copyRefToClipboard(inv.invoiceNumber)}
                        className="text-slate-400 hover:text-slate-600 transition p-0.5 rounded cursor-pointer"
                        title="Copy"
                      >
                        {copiedInvId === inv.invoiceNumber ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    <span
                      className={`text-[11px] font-semibold rounded-lg px-2 py-0.5 border ${statusInfo.pillClass}`}
                    >
                      {statusInfo.label}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      {inv.customerName} {inv.companyName ? `• ${inv.companyName}` : ''}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      Date: {inv.issueDate} &bull; Due: {inv.dueDate}
                    </p>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Invoiced Products ({inv.items.length})
                    </span>
                    <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                      {inv.items.map((it, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          <img
                            src={it.image}
                            alt={it.name}
                            className="w-7 h-7 rounded object-cover bg-white border border-slate-200 shrink-0"
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&w=150&q=70'
                            }}
                          />
                          <span className="truncate flex-1 font-medium text-slate-800">
                            {it.name}
                          </span>
                          <span className="font-mono text-slate-500 shrink-0">
                            ×{it.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between font-mono text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-sans block">
                        Total Amount
                      </span>
                      <span className="font-bold text-slate-900 block text-sm">
                        ₹{inv.total.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-sans block">
                        Balance Due
                      </span>
                      <span
                        className={`font-bold block text-sm ${
                          inv.balanceDue > 0 ? 'text-amber-600' : 'text-emerald-600'
                        }`}
                      >
                        ₹{(inv.balanceDue || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="text-xs text-orange-600 hover:text-orange-700 font-semibold inline-flex items-center gap-1 cursor-pointer transition"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                    <button
                      onClick={() => handleOpenEditInvoice(inv)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1 cursor-pointer transition"
                    >
                      <FileEdit className="w-3.5 h-3.5" /> Edit
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    {inv.balanceDue > 0 && (
                      <button
                        onClick={() => handleOpenRecordPayment(inv)}
                        className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition cursor-pointer"
                      >
                        Record Payment
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteInvoice(inv)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {/* 4. NEW TAX INVOICE GENERATOR / EDIT MODAL */}
      {renderInvoiceBuilderModal()}

      {/* 6. RECORD PAYMENT MODAL */}
      {renderPaymentModal()}
    </div>
  )
}
