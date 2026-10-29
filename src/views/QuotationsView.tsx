import React, { useState } from 'react'
import {
  AlertCircle,
  Building2,
  Calendar,
  Check,
  Copy,
  FileText,
  Grid,
  List,
  MessageCircle,
  Plus,
  Printer,
  RotateCcw,
  Send,
  Trash2,
  X,
} from 'lucide-react'
import { Modal } from '../components/common/Modal'
import { useAdmin } from '../context/AdminContext'
import type { Category, Order, OrderItem, OrderStatus, PaymentStatus } from '../types/admin'

interface NewQuoteItem {
  productId: string
  name: string
  quantity: number
  unitPrice: number
  category: Category
}

export const QuotationsView: React.FC = () => {
  const {
    orders,
    products,
    addOrder,
    updateOrderStatus,
    updateOrderPayment,
    deleteOrder,
    settings,
    searchQuery,
    setSearchQuery,
    confirm,
  } = useAdmin()

  const [viewMode, setViewMode] = useState<'table' | 'card'>('table')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [copiedQuoteId, setCopiedQuoteId] = useState<string | null>(null)

  // Metrics
  const totalQuoteValue = orders.reduce((sum, o) => sum + o.total, 0)
  const pendingCount = orders.filter((o) => o.status === 'pending').length
  const inProductionCount = orders.filter((o) => o.status === 'in_production').length
  const readyDispatchCount = orders.filter((o) => o.status === 'ready_for_dispatch').length
  const completedCount = orders.filter((o) => o.status === 'delivered').length

  const handleDeleteQuote = async (order: Order) => {
    const ok = await confirm({
      title: `Delete Quotation #${order.orderNumber}?`,
      message: `Are you sure you want to delete quotation #${order.orderNumber} for "${order.customerName}" (${order.companyName || 'Brothers Furniture B2B'})? Total: ₹${order.total.toLocaleString('en-IN')}.`,
      confirmText: 'Delete Quotation',
      cancelText: 'Keep Quotation',
      variant: 'danger',
      icon: 'trash',
      badge: `Quote #${order.orderNumber}`,
    })
    if (ok) {
      deleteOrder(order.id)
    }
  }

  // Dynamic Quote Builder Form state
  const [clientForm, setClientForm] = useState({
    customerName: '',
    companyName: '',
    phone: '',
    email: '',
    deliveryAddress: 'Floor 3, Prince Info Park, Ambattur Industrial Estate, Chennai',
    targetDeliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: 'Commercial office fit-out. Factory assembly and 5-year structural warranty included.',
  })

  const [quoteItems, setQuoteItems] = useState<NewQuoteItem[]>([
    {
      productId: products[0]?.id || 'prod-1',
      name: products[0]?.name || 'Executive Ergonomic Chair',
      quantity: 10,
      unitPrice: products[0]?.price || 14500,
      category: products[0]?.category || 'Office Chairs',
    },
  ])

  const handleAddItemRow = () => {
    const defaultProduct = products[quoteItems.length % products.length] || products[0]
    setQuoteItems((prev) => [
      ...prev,
      {
        productId: defaultProduct?.id || `custom-${Date.now()}`,
        name: defaultProduct?.name || 'Modular Workstation Unit',
        quantity: 4,
        unitPrice: defaultProduct?.price || 18500,
        category: defaultProduct?.category || 'Workstations',
      },
    ])
  }

  const handleRemoveItemRow = (index: number) => {
    if (quoteItems.length <= 1) return
    setQuoteItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleProductSelectChange = (index: number, productId: string) => {
    const selectedProd = products.find((p) => p.id === productId)
    if (!selectedProd) return

    setQuoteItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              productId: selectedProd.id,
              name: selectedProd.name,
              unitPrice: selectedProd.price,
              category: selectedProd.category,
            }
          : item
      )
    )
  }

  const handleItemPropertyChange = (
    index: number,
    field: 'name' | 'quantity' | 'unitPrice',
    value: string | number
  ) => {
    setQuoteItems((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          return {
            ...item,
            [field]: value,
          }
        }
        return item
      })
    )
  }

  // Calculate live totals for the draft modal
  const modalSubtotal = quoteItems.reduce((acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0)
  const modalDeliveryFee = modalSubtotal >= settings.freeDeliveryThreshold ? 0 : settings.standardDeliveryFee
  const modalGrandTotal = modalSubtotal + modalDeliveryFee

  const handleCreateQuotation = (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientForm.customerName.trim() || quoteItems.length === 0) return

    const finalItems: OrderItem[] = quoteItems.map((it) => ({
      productId: it.productId,
      name: it.name,
      quantity: Number(it.quantity) || 1,
      unitPrice: Number(it.unitPrice) || 0,
      category: it.category,
    }))

    addOrder({
      customerName: clientForm.customerName,
      companyName: clientForm.companyName.trim() ? clientForm.companyName : undefined,
      phone: clientForm.phone,
      email: clientForm.email,
      items: finalItems,
      subtotal: modalSubtotal,
      deliveryFee: modalDeliveryFee,
      total: modalGrandTotal,
      status: 'pending',
      paymentStatus: 'pending',
      deliveryAddress: clientForm.deliveryAddress,
      targetDeliveryDate: clientForm.targetDeliveryDate,
      notes: clientForm.notes,
    })

    // Reset and close
    setIsCreateModalOpen(false)
    setClientForm({
      customerName: '',
      companyName: '',
      phone: '',
      email: '',
      deliveryAddress: 'Floor 3, Prince Info Park, Ambattur Industrial Estate, Chennai',
      targetDeliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: 'Commercial office fit-out. Factory assembly and 5-year structural warranty included.',
    })
    setQuoteItems([
      {
        productId: products[0]?.id || 'prod-1',
        name: products[0]?.name || 'Executive Ergonomic Chair',
        quantity: 10,
        unitPrice: products[0]?.price || 14500,
        category: products[0]?.category || 'Office Chairs',
      },
    ])
  }

  const copyRefToClipboard = (orderNumber: string) => {
    navigator.clipboard.writeText(orderNumber)
    setCopiedQuoteId(orderNumber)
    setTimeout(() => setCopiedQuoteId(null), 2000)
  }

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter
    const q = searchQuery.toLowerCase().trim()
    const matchesSearch =
      !q ||
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      (o.companyName && o.companyName.toLowerCase().includes(q)) ||
      o.phone.toLowerCase().includes(q) ||
      o.email.toLowerCase().includes(q) ||
      o.deliveryAddress.toLowerCase().includes(q) ||
      o.items.some((it) => it.name.toLowerCase().includes(q) || it.category.toLowerCase().includes(q))
    return matchesStatus && matchesSearch
  })

  const statusConfig: Record<
    OrderStatus,
    { label: string; pillClass: string; badgeClass: string }
  > = {
    pending: {
      label: 'Pending Review',
      pillClass: 'bg-amber-50 text-amber-700 border-amber-200/90',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    in_production: {
      label: 'In Fabrication',
      pillClass: 'bg-sky-50 text-sky-700 border-sky-200/90',
      badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    ready_for_dispatch: {
      label: 'Ready Dispatch',
      pillClass: 'bg-purple-50 text-purple-700 border-purple-200/90',
      badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    dispatched: {
      label: 'Out for Install',
      pillClass: 'bg-blue-50 text-blue-700 border-blue-200/90',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    delivered: {
      label: 'Completed',
      pillClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/90',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    cancelled: {
      label: 'Cancelled',
      pillClass: 'bg-rose-50 text-rose-700 border-rose-200/90',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    },
  }

  const paymentConfig: Record<
    PaymentStatus,
    { label: string; pillClass: string }
  > = {
    paid: { label: 'Fully Paid', pillClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    advance_received: { label: 'Advance Paid', pillClass: 'bg-blue-50 text-blue-700 border-blue-200' },
    pending: { label: 'Payment Pending', pillClass: 'bg-amber-50 text-amber-700 border-amber-200' },
  }

  return (
    <div className="space-y-4">
      {/* 1. Header Strip & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-0.5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Commercial Quotations
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
              <FileText className="w-3 h-3 text-slate-500" />
              {orders.length} Quotes
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/70">
              {pendingCount} Pending Review
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/70">
              {inProductionCount} In Fabrication
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/70">
              {readyDispatchCount} Ready Dispatch
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-white text-slate-700 border border-slate-200 shadow-2xs">
              ₹{(totalQuoteValue / 100000).toFixed(1)}L Total Pipeline
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            B2B corporate estimates, itemized pro-forma invoices & procurement quotes from Ambattur factory
          </p>
        </div>

        {/* Generate Quote Button */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Draft Commercial Quote</span>
        </button>
      </div>

      {/* 2. Compact Filter Tabs & View Switcher */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-2.5 sm:p-3 shadow-xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 max-w-full">
            {[
              { id: 'all', label: `All Quotes (${orders.length})` },
              { id: 'pending', label: `Pending (${pendingCount})` },
              { id: 'in_production', label: `Fabrication (${inProductionCount})` },
              { id: 'ready_for_dispatch', label: `Ready Dispatch (${readyDispatchCount})` },
              { id: 'delivered', label: `Completed (${completedCount})` },
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

          {/* View Mode Switcher (Table vs Cards) */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1 rounded-md transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`p-1 rounded-md transition-all cursor-pointer ${
                  viewMode === 'card'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Card View"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {(statusFilter !== 'all' || searchQuery) && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1 border-t border-slate-100 flex-wrap">
            <span className="font-medium text-[11px] text-slate-400">Filters:</span>
            {statusFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200 text-[11px] font-semibold">
                Status: {statusConfig[statusFilter]?.label || statusFilter}
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium font-mono">
                Keyword: "{searchQuery}"
              </span>
            )}
            <button
              onClick={() => {
                setStatusFilter('all')
                setSearchQuery('')
              }}
              className="text-[11px] text-orange-600 hover:text-orange-700 font-semibold cursor-pointer ml-1 inline-flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Clear filters
            </button>
          </div>
        )}
      </div>

      {/* 3. Main Quotations Data Container: Table or Cards */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center space-y-3 shadow-xs">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
          <h4 className="text-sm sm:text-base font-bold text-slate-900">No commercial quotations found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No quotations matched the active status filter or search query. Click below to reset filters or generate a new draft.
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
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-[#F97316] text-white text-xs font-semibold hover:bg-[#EA580C] shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-3 h-3" /> Create Quote
            </button>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* COMPACT MINIMAL TABLE VIEW */
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[960px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3.5">Quote Ref & Date</th>
                  <th className="py-2.5 px-3.5">Client & Company</th>
                  <th className="py-2.5 px-3.5">Scope & Line Items</th>
                  <th className="py-2.5 px-3.5">Commercial Value</th>
                  <th className="py-2.5 px-3.5">Fabrication Status</th>
                  <th className="py-2.5 px-3.5">Payment</th>
                  <th className="py-2.5 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredOrders.map((order) => {
                  const statusInfo = statusConfig[order.status] || {
                    label: order.status,
                    pillClass: 'bg-slate-100 text-slate-700 border-slate-200',
                    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
                  }
                  const paymentInfo = paymentConfig[order.paymentStatus] || {
                    label: order.paymentStatus,
                    pillClass: 'bg-slate-100 text-slate-700 border-slate-200',
                  }

                  const totalUnits = order.items.reduce((sum, item) => sum + item.quantity, 0)

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Quote Ref ID & Date */}
                      <td className="py-2 px-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900 text-xs block">
                            {order.orderNumber}
                          </span>
                          <button
                            onClick={() => copyRefToClipboard(order.orderNumber)}
                            className="text-slate-400 hover:text-slate-600 transition p-0.5 rounded cursor-pointer"
                            title="Copy Quote Reference"
                          >
                            {copiedQuoteId === order.orderNumber ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <span className="text-[10.5px] text-slate-400 block mt-0.5">
                          {order.createdAt.split('T')[0]}
                        </span>
                      </td>

                      {/* Client Name & Corporate info */}
                      <td className="py-2 px-3.5">
                        <div className="min-w-0 max-w-[210px]">
                          <span className="font-bold text-slate-900 text-xs sm:text-[13px] block truncate">
                            {order.customerName}
                          </span>
                          {order.companyName ? (
                            <span className="text-[11px] text-slate-600 font-medium block truncate">
                              {order.companyName}
                            </span>
                          ) : (
                            <span className="text-[10.5px] text-slate-400 italic block">
                              Direct Procurement
                            </span>
                          )}
                          <span className="text-[10.5px] text-slate-400 block truncate font-mono">
                            {order.phone}
                          </span>
                        </div>
                      </td>

                      {/* Line Items summary */}
                      <td className="py-2 px-3.5">
                        <div className="max-w-[240px] space-y-0.5">
                          {order.items.slice(0, 2).map((it, idx) => (
                            <div key={idx} className="text-[11.5px] text-slate-700 flex justify-between gap-1.5">
                              <span className="truncate">{it.name}</span>
                              <span className="font-mono text-slate-400 font-semibold shrink-0">
                                ×{it.quantity}
                              </span>
                            </div>
                          ))}
                          {order.items.length > 2 && (
                            <span className="text-[10px] text-orange-600 font-semibold block">
                              +{order.items.length - 2} more item{order.items.length - 2 > 1 ? 's' : ''} ({totalUnits} units total)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Commercial Value */}
                      <td className="py-2 px-3.5 whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-900 text-xs sm:text-[13px] block">
                          ₹{order.total.toLocaleString('en-IN')}
                        </span>
                        {order.deliveryFee === 0 ? (
                          <span className="text-[10px] text-emerald-600 font-medium block">
                            Free Ambattur Delivery
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 block">
                            +₹{order.deliveryFee} shipping
                          </span>
                        )}
                      </td>

                      {/* Fabrication Status Dropdown */}
                      <td className="py-2 px-3.5 whitespace-nowrap">
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                          className={`text-xs font-semibold rounded-lg px-2 py-1 border transition-colors cursor-pointer outline-none focus:ring-1 focus:ring-orange-500 ${
                            statusInfo.pillClass
                          }`}
                        >
                          <option value="pending">Pending Review</option>
                          <option value="in_production">In Fabrication</option>
                          <option value="ready_for_dispatch">Ready Dispatch</option>
                          <option value="dispatched">Out for Install</option>
                          <option value="delivered">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>

                      {/* Payment Status Dropdown */}
                      <td className="py-2 px-3.5 whitespace-nowrap">
                        <select
                          value={order.paymentStatus}
                          onChange={(e) => updateOrderPayment(order.id, e.target.value as PaymentStatus)}
                          className={`text-xs font-medium rounded-lg px-2 py-1 border transition-colors cursor-pointer outline-none focus:ring-1 focus:ring-orange-500 ${
                            paymentInfo.pillClass
                          }`}
                        >
                          <option value="paid">Fully Paid</option>
                          <option value="advance_received">Advance Paid</option>
                          <option value="pending">Payment Pending</option>
                        </select>
                      </td>

                      {/* Quick Actions */}
                      <td className="py-2 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* Print / View Pro-Forma Invoice */}
                          <button
                            onClick={() => setSelectedInvoiceOrder(order)}
                            className="p-1.5 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors cursor-pointer inline-flex items-center gap-1"
                            title="View & Print Official Quotation"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          {/* Share on WhatsApp */}
                          <a
                            href={`https://wa.me/${order.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                              `Hello ${order.customerName},\n\nGreetings from Brothers Furniture (Ambattur Industrial Estate).\nPlease find commercial quotation ref *${order.orderNumber}* for *₹${order.total.toLocaleString(
                                'en-IN'
                              )}*.\n\nItems Quoted:\n${order.items
                                .map((it) => `• ${it.name} (Qty: ${it.quantity})`)
                                .join('\n')}\n\nDelivery Site: ${order.deliveryAddress}\n\nOur sales representative will connect with you shortly for specifications review.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer inline-flex items-center"
                            title="Share Quote on WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>

                          {/* Delete Quote */}
                          <button
                            onClick={() => handleDeleteQuote(order)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            title="Delete Quotation"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="px-3.5 py-2.5 bg-slate-50/70 border-t border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-xs text-slate-500">
            <span>
              Showing <strong className="text-slate-700 font-semibold">{filteredOrders.length}</strong> of{' '}
              <strong className="text-slate-700 font-semibold">{orders.length}</strong> commercial quotations
            </span>
            <span className="text-[11px] text-slate-400">
              Click the document icon to view and print formal pro-forma invoices with GSTIN
            </span>
          </div>
        </div>
      ) : (
        /* COMPACT CARD VIEW (CLEAN WHITE CARDS) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredOrders.map((order) => {
            const statusInfo = statusConfig[order.status] || {
              label: order.status,
              pillClass: 'bg-slate-100 text-slate-700 border-slate-200',
              badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
            }

            return (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all space-y-3 flex flex-col justify-between group"
              >
                <div className="space-y-2.5">
                  {/* Top Bar: Quote #, Copy & Status dropdown */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-900 text-xs">
                        {order.orderNumber}
                      </span>
                      <button
                        onClick={() => copyRefToClipboard(order.orderNumber)}
                        className="text-slate-400 hover:text-slate-600 transition p-0.5 rounded cursor-pointer"
                        title="Copy Ref"
                      >
                        {copiedQuoteId === order.orderNumber ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                      className={`text-[11px] font-semibold rounded-lg px-2 py-0.5 border transition-colors cursor-pointer outline-none focus:ring-1 focus:ring-orange-500 ${
                        statusInfo.pillClass
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_production">In Fabrication</option>
                      <option value="ready_for_dispatch">Ready Dispatch</option>
                      <option value="dispatched">Out for Install</option>
                      <option value="delivered">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  {/* Client Info Box */}
                  <div className="p-2.5 rounded-lg bg-slate-50/80 border border-slate-200/60 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs truncate">
                        {order.customerName}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {order.createdAt.split('T')[0]}
                      </span>
                    </div>
                    {order.companyName ? (
                      <span className="text-[11px] text-slate-700 font-medium block truncate flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                        {order.companyName}
                      </span>
                    ) : null}
                    <div className="flex items-center justify-between text-[10.5px] text-slate-400 pt-0.5">
                      <span className="font-mono truncate">{order.phone}</span>
                      {order.targetDeliveryDate && (
                        <span className="text-orange-700 font-medium inline-flex items-center gap-0.5">
                          <Calendar className="w-2.5 h-2.5" />
                          {order.targetDeliveryDate}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Scope / Items list */}
                  <div className="space-y-1">
                    <span className="text-[10.5px] text-slate-400 font-semibold uppercase tracking-wider block">
                      Quoted Scope ({order.items.length} line items)
                    </span>
                    <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs text-slate-700">
                          <span className="truncate pr-2">{it.name}</span>
                          <span className="font-mono text-slate-500 font-semibold shrink-0">
                            {it.quantity} × ₹{it.unitPrice.toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total Value & Payment */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                        Commercial Total
                      </span>
                      <span className="font-mono font-bold text-sm text-slate-900 block">
                        ₹{order.total.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <select
                      value={order.paymentStatus}
                      onChange={(e) => updateOrderPayment(order.id, e.target.value as PaymentStatus)}
                      className={`text-[10.5px] font-medium rounded-lg px-2 py-0.5 border transition-colors cursor-pointer outline-none focus:ring-1 focus:ring-orange-500 ${
                        paymentConfig[order.paymentStatus]?.pillClass || 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <option value="paid">Fully Paid</option>
                      <option value="advance_received">Advance Paid</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    onClick={() => setSelectedInvoiceOrder(order)}
                    className="text-xs text-[#EA580C] hover:text-[#C2410C] font-semibold inline-flex items-center gap-1 cursor-pointer transition"
                  >
                    <FileText className="w-3.5 h-3.5" /> View Pro-Forma
                  </button>

                  <div className="flex items-center gap-1">
                    <a
                      href={`https://wa.me/${order.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                        `Hello ${order.customerName},\nBrothers Furniture quotation ref: *${order.orderNumber}* for *₹${order.total.toLocaleString(
                          'en-IN'
                        )}* is ready for your review.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                      title="Share Quote on WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => handleDeleteQuote(order)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                      title="Delete Quotation"
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

      {/* 4. Dynamic Multi-Item Commercial Quotation Builder Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Draft Commercial Quotation"
        subtitle="Generate itemized B2B office fit-out proposal from Brothers Furniture factory"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateQuotation} className="space-y-4">
          {/* Client Details Section */}
          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Client & Enterprise Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Customer / Contact Person <span className="text-orange-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={clientForm.customerName}
                  onChange={(e) => setClientForm({ ...clientForm, customerName: e.target.value })}
                  placeholder="e.g. Ramesh Krishnan"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Company / Corporate Entity
                </label>
                <input
                  type="text"
                  value={clientForm.companyName}
                  onChange={(e) => setClientForm({ ...clientForm, companyName: e.target.value })}
                  placeholder="e.g. TechVantage Infrastructure Pvt Ltd"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Phone Number <span className="text-orange-500">*</span>
                </label>
                <input
                  required
                  type="tel"
                  value={clientForm.phone}
                  onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                  placeholder="+91 97907 40027"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Official Email Address
                </label>
                <input
                  type="email"
                  value={clientForm.email}
                  onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                  placeholder="procurement@techvantage.com"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition"
                />
              </div>
            </div>
          </div>

          {/* Itemized Lines Builder Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Itemized Scope & Products ({quoteItems.length})
              </h4>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="text-[11px] text-orange-600 hover:text-orange-700 font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Add Line Item
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {quoteItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg border border-slate-200 bg-white grid grid-cols-12 gap-2 items-center text-xs"
                >
                  {/* Catalog Selector */}
                  <div className="col-span-12 sm:col-span-5">
                    <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">
                      Select Catalog Item / Custom
                    </label>
                    <select
                      value={item.productId}
                      onChange={(e) => handleProductSelectChange(idx, e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-800 outline-none focus:border-orange-500"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (₹{p.price.toLocaleString('en-IN')})
                        </option>
                      ))}
                      <option value={`custom-${idx}`}>Custom Item / Fit-out Spec</option>
                    </select>
                  </div>

                  {/* Item Name (Editable) */}
                  <div className="col-span-12 sm:col-span-3">
                    <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">
                      Description / Model
                    </label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleItemPropertyChange(idx, 'name', e.target.value)}
                      placeholder="Item name"
                      className="w-full bg-white border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-800 outline-none focus:border-orange-500"
                    />
                  </div>

                  {/* Quantity */}
                  <div className="col-span-4 sm:col-span-1">
                    <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">
                      Qty
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemPropertyChange(idx, 'quantity', e.target.value === '' ? ('' as any) : Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-md px-1.5 py-1 text-xs font-mono text-center text-slate-800 outline-none focus:border-orange-500"
                    />
                  </div>

                  {/* Unit Price */}
                  <div className="col-span-6 sm:col-span-2">
                    <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">
                      Unit (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) => handleItemPropertyChange(idx, 'unitPrice', e.target.value === '' ? ('' as any) : Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-md px-2 py-1 text-xs font-mono text-slate-800 outline-none focus:border-orange-500"
                    />
                  </div>

                  {/* Remove row */}
                  <div className="col-span-2 sm:col-span-1 flex justify-center pt-3 sm:pt-0">
                    <button
                      type="button"
                      disabled={quoteItems.length <= 1}
                      onClick={() => handleRemoveItemRow(idx)}
                      className={`p-1 rounded text-slate-400 hover:text-rose-600 transition ${
                        quoteItems.length <= 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:bg-rose-50'
                      }`}
                      title="Remove Item"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Site & Target Handover Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Project Site / Delivery Address
              </label>
              <input
                type="text"
                value={clientForm.deliveryAddress}
                onChange={(e) => setClientForm({ ...clientForm, deliveryAddress: e.target.value })}
                placeholder="e.g. Prince Info Park, Ambattur, Chennai"
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-orange-500 transition"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Target Handover Date
              </label>
              <input
                type="date"
                value={clientForm.targetDeliveryDate}
                onChange={(e) => setClientForm({ ...clientForm, targetDeliveryDate: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-orange-500 transition"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 block mb-1">
              Production Specifications & Commercial Terms
            </label>
            <input
              type="text"
              value={clientForm.notes}
              onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
              placeholder="e.g. 5-year warranty, navy fabric acoustic dividers, delivery included"
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-orange-500 transition"
            />
          </div>

          {/* Totals Preview Bar */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between font-mono text-xs">
            <div className="text-slate-600">
              <span>Items Total: <strong>₹{modalSubtotal.toLocaleString('en-IN')}</strong></span>
              <span className="mx-2 text-slate-300">|</span>
              <span className="text-emerald-700">Delivery & Assembly: {modalDeliveryFee === 0 ? 'FREE' : `₹${modalDeliveryFee}`}</span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Grand Total</span>
              <span className="text-base font-bold text-orange-600">
                ₹{modalGrandTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-2 border-t border-slate-200 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-semibold shadow-xs transition cursor-pointer inline-flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Generate Commercial Quote</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* 5. Official B2B Pro-Forma Invoice & Quotation Print Modal */}
      {selectedInvoiceOrder && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedInvoiceOrder(null)}
          title={`Commercial Quotation: ${selectedInvoiceOrder.orderNumber}`}
          subtitle="Brothers Furniture Factory Commercial Documentation & Tax Invoice"
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4 bg-white p-5 sm:p-6 rounded-xl border border-slate-200 text-slate-800">
            {/* Header Letterhead */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b-2 border-slate-900 gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  BROTHERS FURNITURE
                </h2>
                <p className="text-xs font-bold text-[#EA580C] uppercase tracking-wider mt-0.5">
                  Commercial Office Furniture Manufacturers & Turnkey Fit-Outs
                </p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-sm leading-relaxed">
                  {settings.addressLines.join(', ')}
                </p>
                <div className="flex items-center gap-3 text-[11px] text-slate-600 font-mono mt-1">
                  <span>GSTIN: <strong>{settings.gstin}</strong></span>
                  <span>•</span>
                  <span>Ph: <strong>{settings.phones[0]?.display || '+91 97907 40027'}</strong></span>
                </div>
              </div>

              <div className="text-left sm:text-right font-mono text-xs bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-lg sm:rounded-none w-full sm:w-auto border sm:border-0 border-slate-200">
                <span className="text-xs uppercase font-bold text-slate-400 block tracking-widest">
                  PRO-FORMA INVOICE
                </span>
                <span className="text-base font-bold text-slate-900 block mt-0.5">
                  {selectedInvoiceOrder.orderNumber}
                </span>
                <span className="text-slate-500 block text-[11px] mt-0.5">
                  Date: {selectedInvoiceOrder.createdAt.split('T')[0]}
                </span>
                <span className="text-slate-400 block text-[10.5px]">
                  Validity: 30 Calendar Days
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold border mt-2 ${
                    paymentConfig[selectedInvoiceOrder.paymentStatus]?.pillClass || 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {paymentConfig[selectedInvoiceOrder.paymentStatus]?.label || selectedInvoiceOrder.paymentStatus}
                </span>
              </div>
            </div>

            {/* Bill To & Project Site Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Bill To / Client Partner
                </span>
                <span className="font-bold text-slate-900 block text-sm">
                  {selectedInvoiceOrder.customerName}
                </span>
                {selectedInvoiceOrder.companyName ? (
                  <span className="text-slate-700 font-semibold block text-xs">
                    {selectedInvoiceOrder.companyName}
                  </span>
                ) : null}
                <div className="text-slate-500 text-[11.5px] space-y-0.5 pt-0.5 font-mono">
                  <p>{selectedInvoiceOrder.phone}</p>
                  {selectedInvoiceOrder.email && <p>{selectedInvoiceOrder.email}</p>}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Installation / Handover Site
                </span>
                <p className="text-slate-800 leading-relaxed font-medium text-xs">
                  {selectedInvoiceOrder.deliveryAddress}
                </p>
                <div className="pt-1 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Target Handover:</span>
                  <span className="font-semibold text-orange-700 font-mono">
                    {selectedInvoiceOrder.targetDeliveryDate || 'Within 10 business days'}
                  </span>
                </div>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10.5px] font-semibold">
                  <tr>
                    <th className="p-2.5 text-center w-12">#</th>
                    <th className="p-2.5">Scope & Description</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-right">Unit Rate (₹)</th>
                    <th className="p-2.5 text-right">Line Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedInvoiceOrder.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-2.5 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="p-2.5">
                        <span className="font-semibold text-slate-900 block">{item.name}</span>
                        <span className="text-[10.5px] text-slate-400 block">{item.category} • BIFMA Compliant</span>
                      </td>
                      <td className="p-2.5 text-center font-mono font-medium text-slate-700">{item.quantity}</td>
                      <td className="p-2.5 text-right font-mono text-slate-600">
                        ₹{item.unitPrice.toLocaleString('en-IN')}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                        ₹{(item.quantity * item.unitPrice).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculation Totals */}
            <div className="flex flex-col items-end gap-1 font-mono text-xs pt-1">
              <div className="flex justify-between w-72 text-slate-600">
                <span>Subtotal (Net Ex-Factory):</span>
                <span>₹{selectedInvoiceOrder.subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between w-72 text-slate-600">
                <span>Factory Assembly & Freight:</span>
                <span className="text-emerald-700 font-semibold">
                  {selectedInvoiceOrder.deliveryFee === 0 ? 'FREE (Ambattur Zone)' : `₹${selectedInvoiceOrder.deliveryFee}`}
                </span>
              </div>
              <div className="flex justify-between w-72 text-sm font-bold text-slate-900 border-t-2 border-slate-900 pt-2 mt-1">
                <span>Grand Total (INR):</span>
                <span className="text-[#EA580C] font-extrabold text-base">
                  ₹{selectedInvoiceOrder.total.toLocaleString('en-IN')}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-sans">
                GST (18%) and transit insurance included in above commercial proposal.
              </span>
            </div>

            {/* Bank RTGS Details & Commercial Terms */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 text-[11px] text-slate-600">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 space-y-0.5">
                <span className="font-bold text-slate-900 block text-[10.5px] uppercase tracking-wider">
                  Official Bank Details for RTGS / NEFT:
                </span>
                <p>Account Name: <strong>Brothers Furniture Industrial Solutions</strong></p>
                <p>Bank: <strong>HDFC Bank, Ambattur Industrial Estate Branch</strong></p>
                <p className="font-mono">A/C No: <strong>50200084920194</strong> | IFSC: <strong>HDFC0001849</strong></p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 space-y-0.5">
                <span className="font-bold text-slate-900 block text-[10.5px] uppercase tracking-wider">
                  Terms & Commercial Warranty:
                </span>
                <p>• 50% advance with Purchase Order; 50% prior to dispatch.</p>
                <p>• Includes 5-year structural warranty from Ambattur factory.</p>
                <p>• Free CAD 3D layout simulation and site installation included.</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2 border-t border-slate-200">
              <a
                href={`https://wa.me/${selectedInvoiceOrder.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  `Dear ${selectedInvoiceOrder.customerName},\nBrothers Furniture official quotation ref *${selectedInvoiceOrder.orderNumber}* for *₹${selectedInvoiceOrder.total.toLocaleString(
                    'en-IN'
                  )}* is attached.\n\nThank you for choosing Brothers Furniture Ambattur Plant.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Dispatch to WhatsApp
              </a>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Invoice
                </button>
                <button
                  onClick={() => setSelectedInvoiceOrder(null)}
                  className="px-4 py-1.5 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
