import React, { useState } from 'react'
import {
  AlertCircle,
  Check,
  Copy,
  Eye,
  FileText,
  Grid,
  List,
  MessageCircle,
  Plus,
  Printer,
  RotateCcw,
  ShoppingCart,
  Trash2,
  X,
} from 'lucide-react'
import { Modal } from '../components/common/Modal'
import { useAdmin } from '../context/AdminContext'
import type { Category, Order, OrderItem, OrderStatus, PaymentStatus } from '../types/admin'

interface NewOrderItem {
  productId: string
  name: string
  quantity: number
  unitPrice: number
  category: Category
}

export const OrdersView: React.FC = () => {
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
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null)

  // Metrics
  const pendingCount = orders.filter((o) => o.status === 'pending').length
  const inProductionCount = orders.filter((o) => o.status === 'in_production').length
  const readyDispatchCount = orders.filter((o) => o.status === 'ready_for_dispatch').length
  const completedCount = orders.filter((o) => o.status === 'delivered').length

  const handleDeleteOrder = async (order: Order) => {
    const ok = await confirm({
      title: `Delete Order #${order.orderNumber}?`,
      message: `Are you sure you want to permanently delete order #${order.orderNumber} for "${order.customerName}" (${order.companyName || 'Brothers Furniture B2B'})? Total: ₹${order.total.toLocaleString('en-IN')}.`,
      confirmText: 'Delete Order',
      cancelText: 'Keep Order',
      variant: 'danger',
      icon: 'trash',
      badge: `Order #${order.orderNumber}`,
    })
    if (ok) {
      deleteOrder(order.id)
    }
  }

  // Order Form State
  const [clientForm, setClientForm] = useState({
    customerName: '',
    companyName: '',
    phone: '',
    email: '',
    deliveryAddress: 'Floor 3, Prince Info Park, Ambattur Industrial Estate, Chennai',
    targetDeliveryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: 'Commercial office fit-out. Installation and delivery included.',
  })

  const [orderItems, setOrderItems] = useState<NewOrderItem[]>([
    {
      productId: products[0]?.id || 'prod-1',
      name: products[0]?.name || 'Modular Workstation Set',
      quantity: 6,
      unitPrice: products[0]?.price || 24000,
      category: products[0]?.category || 'Workstations',
    },
  ])

  const handleAddItemRow = () => {
    const defaultProduct = products[orderItems.length % products.length] || products[0]
    setOrderItems((prev) => [
      ...prev,
      {
        productId: defaultProduct?.id || `custom-${Date.now()}`,
        name: defaultProduct?.name || 'Ergonomic Task Chair',
        quantity: 4,
        unitPrice: defaultProduct?.price || 12500,
        category: defaultProduct?.category || 'Office Chairs',
      },
    ])
  }

  const handleRemoveItemRow = (index: number) => {
    if (orderItems.length <= 1) return
    setOrderItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleProductSelectChange = (index: number, productId: string) => {
    const selectedProd = products.find((p) => p.id === productId)
    if (!selectedProd) return

    setOrderItems((prev) =>
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
    setOrderItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    )
  }

  const modalSubtotal = orderItems.reduce(
    (acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
    0
  )
  const modalDeliveryFee = modalSubtotal >= settings.freeDeliveryThreshold ? 0 : settings.standardDeliveryFee
  const modalGrandTotal = modalSubtotal + modalDeliveryFee

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientForm.customerName.trim() || orderItems.length === 0) return

    const finalItems: OrderItem[] = orderItems.map((it) => ({
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

    setIsCreateModalOpen(false)
    setClientForm({
      customerName: '',
      companyName: '',
      phone: '',
      email: '',
      deliveryAddress: 'Floor 3, Prince Info Park, Ambattur Industrial Estate, Chennai',
      targetDeliveryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: 'Commercial office fit-out. Installation and delivery included.',
    })
  }

  const copyRefToClipboard = (orderNumber: string) => {
    navigator.clipboard.writeText(orderNumber)
    setCopiedOrderId(orderNumber)
    setTimeout(() => setCopiedOrderId(null), 2000)
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
      o.deliveryAddress.toLowerCase().includes(q) ||
      o.items.some((it) => it.name.toLowerCase().includes(q) || it.category.toLowerCase().includes(q))
    return matchesStatus && matchesSearch
  })

  const statusConfig: Record<
    OrderStatus,
    { label: string; pillClass: string }
  > = {
    pending: { label: 'Pending Review', pillClass: 'bg-amber-50 text-amber-700 border-amber-200/90' },
    in_production: { label: 'In Fabrication', pillClass: 'bg-sky-50 text-sky-700 border-sky-200/90' },
    ready_for_dispatch: { label: 'Ready Dispatch', pillClass: 'bg-purple-50 text-purple-700 border-purple-200/90' },
    dispatched: { label: 'Out for Install', pillClass: 'bg-blue-50 text-blue-700 border-blue-200/90' },
    delivered: { label: 'Completed', pillClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/90' },
    cancelled: { label: 'Cancelled', pillClass: 'bg-rose-50 text-rose-700 border-rose-200/90' },
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
              Factory Orders
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
              <ShoppingCart className="w-3 h-3 text-slate-500" />
              {orders.length} Orders
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/70">
              {pendingCount} Pending
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/70">
              {inProductionCount} In Fabrication
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/70">
              {readyDispatchCount} Ready Dispatch
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Ambattur plant fabrication tracking, dispatch schedules & official delivery notes
          </p>
        </div>

        {/* Generate Order Button */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Factory Order</span>
        </button>
      </div>

      {/* 2. Compact Filter Tabs & View Switcher */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-2.5 sm:p-3 shadow-xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 max-w-full">
            {[
              { id: 'all', label: `All Orders (${orders.length})` },
              { id: 'pending', label: `Pending (${pendingCount})` },
              { id: 'in_production', label: `In Fabrication (${inProductionCount})` },
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

          {/* View Mode Switcher */}
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

        {/* Active Filters */}
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

      {/* 3. Orders Content */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center space-y-3 shadow-xs">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
          <h4 className="text-sm sm:text-base font-bold text-slate-900">No factory orders found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No orders matched the active filter or search keywords.
          </p>
          <button
            onClick={() => {
              setStatusFilter('all')
              setSearchQuery('')
            }}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3 h-3" /> Reset Filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[960px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3.5">Order Ref & Date</th>
                  <th className="py-2.5 px-3.5">Client & Company</th>
                  <th className="py-2.5 px-3.5">Scope & Line Items</th>
                  <th className="py-2.5 px-3.5">Total (INR)</th>
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
                  }
                  const paymentInfo = paymentConfig[order.paymentStatus] || {
                    label: order.paymentStatus,
                    pillClass: 'bg-slate-100 text-slate-700 border-slate-200',
                  }
                  const totalUnits = order.items.reduce((s, it) => s + it.quantity, 0)

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors group">
                      {/* Order Ref */}
                      <td className="py-2 px-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900 text-xs block">
                            {order.orderNumber}
                          </span>
                          <button
                            onClick={() => copyRefToClipboard(order.orderNumber)}
                            className="text-slate-400 hover:text-slate-600 transition p-0.5 rounded cursor-pointer"
                            title="Copy Order ID"
                          >
                            {copiedOrderId === order.orderNumber ? (
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

                      {/* Client */}
                      <td className="py-2 px-3.5">
                        <div className="min-w-0 max-w-[210px]">
                          <span className="font-bold text-slate-900 text-xs sm:text-[13px] block truncate">
                            {order.customerName}
                          </span>
                          {order.companyName ? (
                            <span className="text-[11px] text-slate-600 font-medium block truncate">
                              {order.companyName}
                            </span>
                          ) : null}
                          <span className="text-[10.5px] text-slate-400 block truncate font-mono">
                            {order.phone}
                          </span>
                        </div>
                      </td>

                      {/* Line Items */}
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
                              +{order.items.length - 2} more ({totalUnits} total units)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Amount */}
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

                      {/* Status */}
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

                      {/* Payment */}
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

                      {/* Actions */}
                      <td className="py-2 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingOrder(order)}
                            className="p-1.5 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors cursor-pointer inline-flex items-center"
                            title="View Full Order Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setSelectedInvoiceOrder(order)}
                            className="p-1.5 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors cursor-pointer inline-flex items-center gap-1"
                            title="View & Print Pro-Forma Invoice"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          <a
                            href={`https://wa.me/${order.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                              `Hello ${order.customerName},\nRegarding your Brothers Furniture Order #${order.orderNumber} for ₹${order.total.toLocaleString(
                                'en-IN'
                              )}.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer inline-flex items-center"
                            title="Share on WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>

                          <button
                            onClick={() => handleDeleteOrder(order)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            title="Delete Order"
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

          <div className="px-3.5 py-2.5 bg-slate-50/70 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing <strong className="text-slate-700 font-semibold">{filteredOrders.length}</strong> of{' '}
              <strong className="text-slate-700 font-semibold">{orders.length}</strong> factory orders
            </span>
          </div>
        </div>
      ) : (
        /* CARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredOrders.map((order) => {
            const statusInfo = statusConfig[order.status] || {
              label: order.status,
              pillClass: 'bg-slate-100 text-slate-700 border-slate-200',
            }

            return (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all space-y-3 flex flex-col justify-between group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      {order.orderNumber}
                    </span>
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

                  <div className="p-2.5 rounded-lg bg-slate-50/80 border border-slate-200/60 space-y-0.5">
                    <span className="font-bold text-slate-900 text-xs block">
                      {order.customerName}
                    </span>
                    {order.companyName && (
                      <span className="text-[11px] text-slate-700 font-medium block">
                        {order.companyName}
                      </span>
                    )}
                    <span className="text-[10.5px] text-slate-400 block font-mono">
                      {order.phone}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10.5px] text-slate-400 font-semibold uppercase tracking-wider block">
                      Scope ({order.items.length} items)
                    </span>
                    <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs text-slate-700">
                          <span className="truncate pr-2">{it.name}</span>
                          <span className="font-mono text-slate-500 font-semibold shrink-0">
                            {it.quantity} units
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                        Total
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

                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => setViewingOrder(order)}
                      className="text-xs text-slate-700 hover:text-[#EA580C] font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Details
                    </button>
                    <button
                      onClick={() => setSelectedInvoiceOrder(order)}
                      className="text-xs text-[#EA580C] hover:text-[#C2410C] font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" /> Pro-Forma
                    </button>
                  </div>
                  <button
                    onClick={() => handleDeleteOrder(order)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 4. Create Order Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Draft Factory Production Order"
        subtitle="Schedule fabrication order at Ambattur Plant"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Customer Name <span className="text-orange-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={clientForm.customerName}
                  onChange={(e) => setClientForm({ ...clientForm, customerName: e.target.value })}
                  placeholder="e.g. Ramesh Krishnan"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Company</label>
                <input
                  type="text"
                  value={clientForm.companyName}
                  onChange={(e) => setClientForm({ ...clientForm, companyName: e.target.value })}
                  placeholder="e.g. TechVantage Infrastructure"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500"
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
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Email</label>
                <input
                  type="email"
                  value={clientForm.email}
                  onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                  placeholder="client@company.com"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Order Scope ({orderItems.length})
              </h4>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="text-[11px] text-orange-600 hover:text-orange-700 font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Add Item
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {orderItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg border border-slate-200 bg-white grid grid-cols-12 gap-2 items-center text-xs"
                >
                  <div className="col-span-12 sm:col-span-5">
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
                      <option value={`custom-${idx}`}>Custom Order Item</option>
                    </select>
                  </div>

                  <div className="col-span-12 sm:col-span-3">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleItemPropertyChange(idx, 'name', e.target.value)}
                      placeholder="Item name"
                      className="w-full bg-white border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-800 outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="col-span-4 sm:col-span-1">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemPropertyChange(idx, 'quantity', e.target.value === '' ? ('' as any) : Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-md px-1.5 py-1 text-xs font-mono text-center text-slate-800 outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-2">
                    <input
                      type="number"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) => handleItemPropertyChange(idx, 'unitPrice', e.target.value === '' ? ('' as any) : Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-md px-2 py-1 text-xs font-mono text-slate-800 outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1 flex justify-center">
                    <button
                      type="button"
                      disabled={orderItems.length <= 1}
                      onClick={() => handleRemoveItemRow(idx)}
                      className={`p-1 rounded text-slate-400 hover:text-rose-600 transition ${
                        orderItems.length <= 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:bg-rose-50'
                      }`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">Delivery Site</label>
              <input
                type="text"
                value={clientForm.deliveryAddress}
                onChange={(e) => setClientForm({ ...clientForm, deliveryAddress: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">Target Date</label>
              <input
                type="date"
                value={clientForm.targetDeliveryDate}
                onChange={(e) => setClientForm({ ...clientForm, targetDeliveryDate: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between font-mono text-xs">
            <span className="text-slate-600">Total: ₹{modalGrandTotal.toLocaleString('en-IN')}</span>
          </div>

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
              className="px-4 py-1.5 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              Record Factory Order
            </button>
          </div>
        </form>
      </Modal>

      {/* 5. View Order Details Modal */}
      {viewingOrder && (
        <Modal
          isOpen={true}
          onClose={() => setViewingOrder(null)}
          title={`Order Details: ${viewingOrder.orderNumber}`}
          subtitle="Brothers Furniture Factory Fabrication & Customer Specifications"
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4 text-xs text-slate-700">
            {/* Top Stat Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 p-4 rounded-xl border border-slate-200/80 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-bold text-slate-900">{viewingOrder.orderNumber}</span>
                  <button
                    onClick={() => copyRefToClipboard(viewingOrder.orderNumber)}
                    className="text-slate-400 hover:text-slate-600 transition p-0.5 rounded cursor-pointer"
                    title="Copy Order ID"
                  >
                    {copiedOrderId === viewingOrder.orderNumber ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Ordered on {new Date(viewingOrder.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>

              {/* Status and Payment controls */}
              <div className="flex flex-wrap items-center gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Status</label>
                  <select
                    value={viewingOrder.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as OrderStatus
                      updateOrderStatus(viewingOrder.id, newStatus)
                      setViewingOrder({ ...viewingOrder, status: newStatus })
                    }}
                    className={`text-xs font-semibold rounded-lg px-2.5 py-1 border transition-colors cursor-pointer outline-none focus:ring-1 focus:ring-orange-500 ${
                      statusConfig[viewingOrder.status]?.pillClass || 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <option value="pending">Pending Review</option>
                    <option value="in_production">In Fabrication</option>
                    <option value="ready_for_dispatch">Ready Dispatch</option>
                    <option value="dispatched">Out for Install</option>
                    <option value="delivered">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Payment</label>
                  <select
                    value={viewingOrder.paymentStatus}
                    onChange={(e) => {
                      const newPay = e.target.value as PaymentStatus
                      updateOrderPayment(viewingOrder.id, newPay)
                      setViewingOrder({ ...viewingOrder, paymentStatus: newPay })
                    }}
                    className={`text-xs font-semibold rounded-lg px-2.5 py-1 border transition-colors cursor-pointer outline-none focus:ring-1 focus:ring-orange-500 ${
                      paymentConfig[viewingOrder.paymentStatus]?.pillClass || 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <option value="paid">Fully Paid</option>
                    <option value="advance_received">Advance Paid</option>
                    <option value="pending">Payment Pending</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Client & Delivery Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customer Details</span>
                <span className="font-bold text-slate-900 block text-sm">{viewingOrder.customerName}</span>
                {viewingOrder.companyName && (
                  <span className="text-slate-700 font-medium block">{viewingOrder.companyName}</span>
                )}
                <div className="flex items-center gap-3 pt-1">
                  <a href={`tel:${viewingOrder.phone}`} className="text-orange-600 hover:underline font-mono text-xs">
                    {viewingOrder.phone}
                  </a>
                  {viewingOrder.email && (
                    <a href={`mailto:${viewingOrder.email}`} className="text-slate-500 hover:underline text-xs truncate">
                      {viewingOrder.email}
                    </a>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Delivery Destination</span>
                <p className="text-slate-800 leading-relaxed font-medium">{viewingOrder.deliveryAddress}</p>
                {viewingOrder.targetDeliveryDate && (
                  <p className="text-xs text-slate-500 pt-1">
                    Target Delivery Date: <strong className="text-slate-800">{viewingOrder.targetDeliveryDate}</strong>
                  </p>
                )}
              </div>
            </div>

            {/* Notes if available */}
            {viewingOrder.notes && (
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block mb-0.5">Commercial & Site Notes</span>
                <p className="text-amber-900 leading-relaxed">{viewingOrder.notes}</p>
              </div>
            )}

            {/* Line Items Table */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Line Items ({viewingOrder.items.length})</span>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10.5px] font-semibold">
                    <tr>
                      <th className="p-2.5">Item Description</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Unit Price</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewingOrder.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="p-2.5 font-semibold text-slate-900">{it.name}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded-md text-[10.5px] font-medium bg-slate-100 text-slate-600">
                            {it.category}
                          </span>
                        </td>
                        <td className="p-2.5 text-center font-mono font-semibold">{it.quantity}</td>
                        <td className="p-2.5 text-right font-mono">₹{it.unitPrice.toLocaleString('en-IN')}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                          ₹{(it.quantity * it.unitPrice).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="flex flex-col items-end gap-1 font-mono text-xs pt-1">
              <div className="flex justify-between w-64 text-slate-600">
                <span>Subtotal:</span>
                <span>₹{viewingOrder.subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between w-64 text-slate-600">
                <span>Delivery & Assembly:</span>
                <span>{viewingOrder.deliveryFee === 0 ? 'Free Delivery' : `₹${viewingOrder.deliveryFee.toLocaleString('en-IN')}`}</span>
              </div>
              <div className="flex justify-between w-64 text-sm font-bold text-slate-900 border-t border-slate-200 pt-1.5 mt-0.5">
                <span>Total Amount:</span>
                <span className="text-[#EA580C] text-base font-extrabold">₹{viewingOrder.total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Bottom Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const ord = viewingOrder
                    setViewingOrder(null)
                    setSelectedInvoiceOrder(ord)
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer inline-flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-orange-600" /> View Pro-Forma Sheet
                </button>
                <a
                  href={`https://wa.me/${viewingOrder.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Hello ${viewingOrder.customerName}, your Brothers Furniture Order #${viewingOrder.orderNumber} is currently ${viewingOrder.status.replace(/_/g, ' ').toUpperCase()}. Total: ₹${viewingOrder.total.toLocaleString('en-IN')}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-semibold transition cursor-pointer inline-flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp Update
                </a>
              </div>

              <button
                onClick={() => setViewingOrder(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 6. Invoice Modal */}
      {selectedInvoiceOrder && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedInvoiceOrder(null)}
          title={`Order Documentation: ${selectedInvoiceOrder.orderNumber}`}
          subtitle="Brothers Furniture Factory Fabrication Order"
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4 bg-white p-5 sm:p-6 rounded-xl border border-slate-200 text-slate-800">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b-2 border-slate-900 gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  BROTHERS FURNITURE
                </h2>
                <p className="text-xs font-bold text-[#EA580C] uppercase tracking-wider mt-0.5">
                  Factory Order & Fabrication Ticket
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

              <div className="text-left sm:text-right font-mono text-xs">
                <span className="text-base font-bold text-slate-900 block">
                  {selectedInvoiceOrder.orderNumber}
                </span>
                <span className="text-slate-500 block text-[11px] mt-0.5">
                  Date: {selectedInvoiceOrder.createdAt.split('T')[0]}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Client Partner
                </span>
                <span className="font-bold text-slate-900 block text-sm">
                  {selectedInvoiceOrder.customerName}
                </span>
                {selectedInvoiceOrder.companyName && (
                  <span className="text-slate-700 font-semibold block text-xs">
                    {selectedInvoiceOrder.companyName}
                  </span>
                )}
                <p className="text-slate-500 font-mono">{selectedInvoiceOrder.phone}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Delivery Site
                </span>
                <p className="text-slate-800 leading-relaxed font-medium text-xs">
                  {selectedInvoiceOrder.deliveryAddress}
                </p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10.5px] font-semibold">
                  <tr>
                    <th className="p-2.5">Scope & Description</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-right">Unit Rate (₹)</th>
                    <th className="p-2.5 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedInvoiceOrder.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-semibold text-slate-900">{item.name}</td>
                      <td className="p-2.5 text-center font-mono">{item.quantity}</td>
                      <td className="p-2.5 text-right font-mono">₹{item.unitPrice.toLocaleString('en-IN')}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                        ₹{(item.quantity * item.unitPrice).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col items-end gap-1 font-mono text-xs pt-1">
              <div className="flex justify-between w-64 text-sm font-bold text-slate-900 border-t-2 border-slate-900 pt-2">
                <span>Total Amount:</span>
                <span className="text-[#EA580C] font-extrabold text-base">
                  ₹{selectedInvoiceOrder.total.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-200">
              <button
                onClick={() => window.print()}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer inline-flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Print Order Sheet
              </button>
              <button
                onClick={() => setSelectedInvoiceOrder(null)}
                className="px-4 py-1.5 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
