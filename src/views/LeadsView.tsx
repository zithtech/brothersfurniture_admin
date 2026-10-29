import React, { useState } from 'react'
import {
  AlertCircle,
  Check,
  Edit2,
  Eye,
  FileText,
  Kanban,
  List,
  Phone,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { Modal } from '../components/common/Modal'
import { useAdmin } from '../context/AdminContext'
import type { InquiryType, Lead, LeadPriority, LeadStatus } from '../types/admin'

interface LeadsViewProps {
  isAddModalOpen: boolean
  setIsAddModalOpen: (open: boolean) => void
}

export const LeadsView: React.FC<LeadsViewProps> = ({
  isAddModalOpen,
  setIsAddModalOpen,
}) => {
  const {
    leads,
    addLead,
    updateLeadStatus,
    updateLead,
    deleteLead,
    searchQuery,
    setSearchQuery,
    addOrder,
    setCurrentView,
    confirm,
  } = useAdmin()

  const [activeTab, setActiveTab] = useState<'table' | 'kanban'>('table')
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<LeadStatus | 'all'>('all')
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [viewingLead, setViewingLead] = useState<Lead | null>(null)
  const [selectedLeadNotes, setSelectedLeadNotes] = useState<Lead | null>(null)
  const [notesDraft, setNotesDraft] = useState('')

  // Quick stats
  const newLeadsCount = leads.filter((l) => l.status === 'new').length
  const wonLeadsCount = leads.filter((l) => l.status === 'won').length

  // Form State
  const initialFormData = {
    name: '',
    phone: '',
    email: '',
    subject: 'Office fit-out / bulk quote' as InquiryType,
    message: '',
    priority: 'high' as LeadPriority,
    status: 'new' as LeadStatus,
    estimatedValue: 250000,
    notes: '',
  }

  const [formData, setFormData] = useState(initialFormData)

  const handleOpenAdd = () => {
    setFormData(initialFormData)
    setIsAddModalOpen(true)
  }

  const handleOpenEdit = (l: Lead) => {
    setEditingLead(l)
    setFormData({
      name: l.name,
      phone: l.phone,
      email: l.email,
      subject: l.subject,
      message: l.message,
      priority: l.priority,
      status: l.status,
      estimatedValue: l.estimatedValue || 0,
      notes: l.notes || '',
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    if (editingLead) {
      updateLead(editingLead.id, formData)
      setEditingLead(null)
    } else {
      addLead(formData)
      setIsAddModalOpen(false)
    }
  }

  const handleSaveNotes = () => {
    if (selectedLeadNotes) {
      updateLead(selectedLeadNotes.id, { notes: notesDraft })
      setSelectedLeadNotes(null)
    }
  }

  const handleConvertToOrder = async (l: Lead) => {
    const ok = await confirm({
      title: `Convert Lead from "${l.name}" to Formal Order?`,
      message: `Convert this inquiry into an active B2B order/quote? Estimated value: ₹${(l.estimatedValue || 250000).toLocaleString('en-IN')}. The lead status will be updated to 'Won'.`,
      confirmText: 'Convert to Order',
      cancelText: 'Cancel',
      variant: 'primary',
      icon: 'check',
      badge: `Inquiry: ${l.subject}`,
    })
    if (ok) {
      addOrder({
        customerName: l.name,
        companyName: l.name + ' Commercial',
        phone: l.phone,
        email: l.email,
        items: [
          {
            productId: 'orbit-workstation',
            name: 'Modular Workstation Fit-Out Package',
            quantity: 1,
            unitPrice: l.estimatedValue || 250000,
            category: 'Workstations',
          },
        ],
        subtotal: l.estimatedValue || 250000,
        deliveryFee: 0,
        total: l.estimatedValue || 250000,
        status: 'pending',
        paymentStatus: 'pending',
        deliveryAddress: 'Chennai Project Site',
        notes: `Converted from Website Inquiry #${l.id}: ${l.message}`,
      })
      updateLeadStatus(l.id, 'won')
      setCurrentView('orders')
    }
  }

  const handleDeleteLead = async (lead: Lead) => {
    const ok = await confirm({
      title: `Delete Inquiry from "${lead.name}"?`,
      message: `Are you sure you want to remove this inquiry? Contact: ${lead.phone || lead.email || 'N/A'}.`,
      confirmText: 'Delete Inquiry',
      cancelText: 'Keep Inquiry',
      variant: 'danger',
      icon: 'trash',
      badge: `Priority: ${lead.priority.toUpperCase()}`,
    })
    if (ok) {
      deleteLead(lead.id)
    }
  }

  const statuses: { id: LeadStatus; label: string; color: string; pillClass: string }[] = [
    { id: 'new', label: 'New Inquiry', color: '#F59E0B', pillClass: 'bg-amber-50 text-amber-700 border-amber-200/80' },
    { id: 'contacted', label: 'Contacted', color: '#0284C7', pillClass: 'bg-sky-50 text-sky-700 border-sky-200/80' },
    { id: 'quoted', label: 'Quote Sent', color: '#8B5CF6', pillClass: 'bg-purple-50 text-purple-700 border-purple-200/80' },
    { id: 'site-visit', label: 'Site Visit / CAD', color: '#3B82F6', pillClass: 'bg-blue-50 text-blue-700 border-blue-200/80' },
    { id: 'won', label: 'Deal Won', color: '#10B981', pillClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80' },
    { id: 'lost', label: 'Closed / Lost', color: '#EF4444', pillClass: 'bg-rose-50 text-rose-700 border-rose-200/80' },
  ]

  const priorityBadges: Record<LeadPriority, string> = {
    urgent: 'bg-rose-50 text-rose-700 border-rose-200/80',
    high: 'bg-amber-50 text-amber-700 border-amber-200/80',
    medium: 'bg-blue-50 text-blue-700 border-blue-200/80',
    low: 'bg-slate-100 text-slate-600 border-slate-200/80',
  }

  const filteredLeads = leads.filter((l) => {
    const matchesStatus = selectedStatusFilter === 'all' || l.status === selectedStatusFilter
    const q = searchQuery.toLowerCase().trim()
    const matchesQuery =
      !q ||
      l.name.toLowerCase().includes(q) ||
      l.phone.toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q) ||
      l.subject.toLowerCase().includes(q) ||
      l.message.toLowerCase().includes(q)

    return matchesStatus && matchesQuery
  })

  return (
    <div className="space-y-4">
      {/* 1. Header Strip & Quick Pipeline Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-0.5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Customer Enquiries
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
              {leads.length} Total Leads
            </span>
            {newLeadsCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/70">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                {newLeadsCount} Action Needed
              </span>
            )}
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
              {wonLeadsCount} Deals Won
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Website contact requests, corporate office fit-out inquiries & commercial CRM pipeline
          </p>
        </div>

        {/* Record Offline Lead Button */}
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Record Lead</span>
        </button>
      </div>

      {/* 2. Compact Status Filter Tabs & View Controls */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-2.5 sm:p-3 shadow-xs space-y-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          {/* Status Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 max-w-full">
            <button
              onClick={() => setSelectedStatusFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                selectedStatusFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              All Stages ({leads.length})
            </button>
            {statuses.map((st) => {
              const count = leads.filter((l) => l.status === st.id).length
              const isSelected = selectedStatusFilter === st.id
              return (
                <button
                  key={st.id}
                  onClick={() => setSelectedStatusFilter(st.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                      : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: isSelected ? '#FFFFFF' : st.color }}
                  />
                  <span>{st.label}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* View Switcher (Table vs Kanban) */}
          <div className="flex items-center gap-2 shrink-0 self-end lg:self-auto">
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
              <button
                onClick={() => setActiveTab('table')}
                className={`p-1 rounded-md transition-all cursor-pointer ${
                  activeTab === 'table'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setActiveTab('kanban')}
                className={`p-1 rounded-md transition-all cursor-pointer ${
                  activeTab === 'kanban'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Kanban Board View"
              >
                <Kanban className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {(selectedStatusFilter !== 'all' || searchQuery) && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1 border-t border-slate-100 flex-wrap">
            <span className="font-medium text-[11px] text-slate-400">Filters:</span>
            {selectedStatusFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200 text-[11px] font-semibold">
                Stage: {statuses.find((s) => s.id === selectedStatusFilter)?.label}
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium font-mono">
                Keyword: "{searchQuery}"
              </span>
            )}
            <button
              onClick={() => {
                setSelectedStatusFilter('all')
                setSearchQuery('')
              }}
              className="text-[11px] text-orange-600 hover:text-orange-700 font-semibold cursor-pointer ml-1 inline-flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Clear filters
            </button>
          </div>
        )}
      </div>

      {/* 3. Main Data Container: Compact Table or Kanban */}
      {filteredLeads.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center space-y-3 shadow-xs">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
          <h4 className="text-sm sm:text-base font-bold text-slate-900">No enquiries found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No inquiries matched the current pipeline filter or search keywords.
          </p>
          <button
            onClick={() => {
              setSelectedStatusFilter('all')
              setSearchQuery('')
            }}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3 h-3" /> Reset Filters
          </button>
        </div>
      ) : activeTab === 'table' ? (
        /* COMPACT MINIMAL TABLE VIEW */
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3.5">Customer & Contact</th>
                  <th className="py-2.5 px-3.5">Inquiry Type</th>
                  <th className="py-2.5 px-3.5">Requirement Details</th>
                  <th className="py-2.5 px-3.5">Pipeline Stage</th>
                  <th className="py-2.5 px-3.5 text-center">Priority</th>
                  <th className="py-2.5 px-3.5">Est. Value</th>
                  <th className="py-2.5 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredLeads.map((lead) => {
                  const statusInfo = statuses.find((s) => s.id === lead.status)
                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Customer Contact */}
                      <td className="py-2 px-3.5">
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 text-xs sm:text-[13px] block truncate">
                            {lead.name}
                          </span>
                          <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                            {lead.phone}
                          </span>
                          {lead.email ? (
                            <span className="text-[10.5px] text-slate-400 block truncate">
                              {lead.email}
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Inquiry Type */}
                      <td className="py-2 px-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/70">
                          {lead.subject}
                        </span>
                      </td>

                      {/* Requirement Details */}
                      <td className="py-2 px-3.5">
                        <div className="max-w-xs space-y-1">
                          <p className="text-slate-600 text-[11.5px] line-clamp-2 leading-relaxed">
                            {lead.message}
                          </p>
                          {lead.notes ? (
                            <span className="inline-flex items-center gap-1 text-[10.5px] text-amber-700 bg-amber-50/80 px-1.5 py-0.5 rounded border border-amber-200/60 font-medium">
                              📝 {lead.notes}
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Pipeline Stage Select */}
                      <td className="py-2 px-3.5 whitespace-nowrap">
                        <select
                          value={lead.status}
                          onChange={(e) => updateLeadStatus(lead.id, e.target.value as LeadStatus)}
                          className={`text-xs font-semibold rounded-lg px-2 py-1 border transition-colors cursor-pointer outline-none focus:ring-1 focus:ring-orange-500 ${
                            statusInfo?.pillClass || 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          {statuses.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Priority */}
                      <td className="py-2 px-3.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            priorityBadges[lead.priority] || 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {lead.priority}
                        </span>
                      </td>

                      {/* Est. Value */}
                      <td className="py-2 px-3.5 whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-900 text-xs sm:text-[13px]">
                          {lead.estimatedValue ? `₹${lead.estimatedValue.toLocaleString('en-IN')}` : '—'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-2 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* View Details Action */}
                          <button
                            onClick={() => setViewingLead(lead)}
                            className="p-1.5 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors cursor-pointer inline-flex items-center"
                            title="View Full Enquiry Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* WhatsApp Action */}
                          <a
                            href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                              `Hi ${lead.name}, regarding your inquiry with Brothers Furniture regarding ${lead.subject}...`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                            title="Reply on WhatsApp"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </a>

                          {/* Notes */}
                          <button
                            onClick={() => {
                              setSelectedLeadNotes(lead)
                              setNotesDraft(lead.notes || '')
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                            title="Notes"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          {/* Convert to Order */}
                          <button
                            onClick={() => handleConvertToOrder(lead)}
                            className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                            title="Convert to B2B Order"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(lead)}
                            className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors cursor-pointer"
                            title="Edit Inquiry"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteLead(lead)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            title="Delete Inquiry"
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
          <div className="px-3.5 py-2.5 bg-slate-50/70 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing <strong className="text-slate-700 font-semibold">{filteredLeads.length}</strong> of{' '}
              <strong className="text-slate-700 font-semibold">{leads.length}</strong> active enquiries
            </span>
            <span className="text-[11px] text-slate-400">
              Direct WhatsApp link opens verified chat with customer
            </span>
          </div>
        </div>
      ) : (
        /* KANBAN BOARD VIEW (CLEAN WHITE THEME) */
        <div className="flex gap-3 overflow-x-auto pb-4 items-start min-h-[500px]">
          {statuses.map((st) => {
            const columnLeads = filteredLeads.filter((l) => l.status === st.id)
            return (
              <div
                key={st.id}
                className="w-76 shrink-0 bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 space-y-2.5"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-1 pb-1 border-b border-slate-200/70">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: st.color }} />
                    <span className="text-xs font-bold text-slate-800 tracking-tight">{st.label}</span>
                  </div>
                  <span className="text-[10.5px] font-mono px-2 py-0.2 rounded-full bg-white text-slate-600 border border-slate-200 shadow-2xs font-semibold">
                    {columnLeads.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="space-y-2">
                  {columnLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="p-3 rounded-lg bg-white border border-slate-200/80 hover:border-slate-300 hover:shadow-xs transition space-y-2 shadow-2xs group"
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 tracking-tight truncate">
                            {lead.name}
                          </h4>
                          <span className="text-[10.5px] text-slate-400 block truncate">
                            {lead.subject}
                          </span>
                        </div>
                        <span
                          className={`text-[9.5px] font-bold uppercase px-1.5 py-0.2 rounded border ${
                            priorityBadges[lead.priority]
                          }`}
                        >
                          {lead.priority}
                        </span>
                      </div>

                      <p className="text-[11.5px] text-slate-600 line-clamp-2 leading-relaxed">
                        {lead.message}
                      </p>

                      {lead.estimatedValue ? (
                        <div className="text-xs font-mono font-bold text-slate-900">
                          Est: ₹{lead.estimatedValue.toLocaleString('en-IN')}
                        </div>
                      ) : null}

                      {/* Quick Contact Bar */}
                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-[11px]">
                        <a
                          href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                            `Hi ${lead.name}, thank you for contacting Brothers Furniture regarding ${lead.subject}...`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-semibold"
                        >
                          <Send className="w-3 h-3" /> WhatsApp
                        </a>
                        <a
                          href={`tel:${lead.phone.replace(/[^0-9]/g, '')}`}
                          className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
                        >
                          <Phone className="w-3 h-3" /> Call
                        </a>
                      </div>

                      {/* Stage Dropdown & Actions */}
                      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                        <select
                          value={lead.status}
                          onChange={(e) => updateLeadStatus(lead.id, e.target.value as LeadStatus)}
                          className="bg-slate-50 text-slate-700 text-[10.5px] font-medium rounded-md px-1.5 py-0.5 border border-slate-200 outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                        >
                          {statuses.map((s) => (
                            <option key={s.id} value={s.id}>
                              → {s.label}
                            </option>
                          ))}
                        </select>

                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => setViewingLead(lead)}
                            className="p-1 text-slate-500 hover:text-orange-600 rounded hover:bg-orange-50 cursor-pointer"
                            title="View Full Enquiry Details"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedLeadNotes(lead)
                              setNotesDraft(lead.notes || '')
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 cursor-pointer"
                            title="Notes"
                          >
                            <FileText className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleConvertToOrder(lead)}
                            className="p-1 text-amber-600 hover:text-amber-700 rounded hover:bg-amber-50 cursor-pointer"
                            title="Convert to Order"
                          >
                            <Sparkles className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(lead)}
                            className="p-1 text-slate-400 hover:text-orange-600 rounded hover:bg-orange-50 cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {columnLeads.length === 0 && (
                    <div className="p-4 text-center text-[11px] text-slate-400 border border-dashed border-slate-200 rounded-lg bg-white/50">
                      No leads in this stage
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 4. Notes Modal (Clean Light Theme) */}
      {selectedLeadNotes && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedLeadNotes(null)}
          title={`Follow-up Notes: ${selectedLeadNotes.name}`}
          subtitle="Internal site visit logs and CAD layout notes"
        >
          <div className="space-y-4">
            <textarea
              rows={5}
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              placeholder="Record details of phone call, customer requirements, floor plan handover, and visit schedules..."
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition resize-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSelectedLeadNotes(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                className="px-4 py-1.5 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                Save Note
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 5. View Enquiry Details Modal */}
      {viewingLead && (
        <Modal
          isOpen={true}
          onClose={() => setViewingLead(null)}
          title={`Enquiry: ${viewingLead.name}`}
          subtitle="Brothers Furniture Direct Commercial & Workspace Inquiry"
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs text-slate-700">
            {/* Header / Badges */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 p-4 rounded-xl border border-slate-200/80 gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-slate-900">{viewingLead.name}</h3>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-200/70 text-slate-700">
                    {viewingLead.subject}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                    priorityBadges[viewingLead.priority] || 'bg-slate-100 text-slate-600'
                  }`}>
                    {viewingLead.priority}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block mt-1">
                  Received on {new Date(viewingLead.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at {new Date(viewingLead.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Status Selector */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Pipeline Stage</label>
                <select
                  value={viewingLead.status}
                  onChange={(e) => {
                    const nextSt = e.target.value as LeadStatus
                    updateLeadStatus(viewingLead.id, nextSt)
                    setViewingLead({ ...viewingLead, status: nextSt })
                  }}
                  className={`text-xs font-semibold rounded-lg px-2.5 py-1 border transition-colors cursor-pointer outline-none focus:ring-1 focus:ring-orange-500 ${
                    statuses.find(s => s.id === viewingLead.status)?.pillClass || 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {statuses.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Contact Details Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customer Contact</span>
                <p className="font-bold text-slate-900 text-sm">{viewingLead.name}</p>
                <div className="flex items-center gap-2 pt-0.5">
                  <a
                    href={`tel:${viewingLead.phone.replace(/[^0-9]/g, '')}`}
                    className="text-orange-600 hover:underline font-mono font-semibold"
                  >
                    📞 {viewingLead.phone}
                  </a>
                  <a
                    href={`https://wa.me/${viewingLead.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      `Hi ${viewingLead.name}, regarding your inquiry with Brothers Furniture regarding ${viewingLead.subject}...`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition"
                  >
                    WhatsApp
                  </a>
                </div>
                {viewingLead.email && (
                  <p className="text-slate-600">
                    Email:{' '}
                    <a href={`mailto:${viewingLead.email}`} className="text-slate-800 hover:underline font-medium">
                      {viewingLead.email}
                    </a>
                  </p>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pipeline Overview</span>
                <p className="text-slate-600">
                  Estimated Value:{' '}
                  <strong className="text-slate-900 font-mono text-sm">
                    {viewingLead.estimatedValue ? `₹${viewingLead.estimatedValue.toLocaleString('en-IN')}` : 'To Be Estimated'}
                  </strong>
                </p>
                {viewingLead.lastContactedAt && (
                  <p className="text-[11px] text-slate-500">
                    Last Contacted: {new Date(viewingLead.lastContactedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                )}
              </div>
            </div>

            {/* Requirement / Message (Full, untruncated) */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Requirement Description & Project Scope
              </span>
              <p className="text-slate-800 text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap">
                {viewingLead.message || 'No additional requirement message provided.'}
              </p>
            </div>

            {/* Internal Admin Notes */}
            <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-2">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                Internal Sales & Engineering Notes
              </span>
              {viewingLead.notes ? (
                <p className="text-amber-900 leading-relaxed font-medium">{viewingLead.notes}</p>
              ) : (
                <p className="text-amber-700 italic text-[11px]">No internal notes recorded yet.</p>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const lead = viewingLead
                    setViewingLead(null)
                    handleConvertToOrder(lead)
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs transition cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Convert to Factory Order
                </button>
                <button
                  onClick={() => {
                    const lead = viewingLead
                    setViewingLead(null)
                    handleOpenEdit(lead)
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit Enquiry
                </button>
              </div>

              <button
                onClick={() => setViewingLead(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 6. Add / Edit Lead Modal (Clean Light Theme) */}
      <Modal
        isOpen={isAddModalOpen || editingLead !== null}
        onClose={() => {
          setIsAddModalOpen(false)
          setEditingLead(null)
        }}
        title={editingLead ? `Edit Inquiry from ${editingLead.name}` : 'Record Customer Enquiry'}
        subtitle="Manage website submissions and offline commercial enquiries"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Customer / Contact Name <span className="text-orange-500">*</span>
              </label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Suresh Narayanan"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Phone Number <span className="text-orange-500">*</span>
              </label>
              <input
                required
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98401 22849"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="suresh@company.com"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Inquiry Type</label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value as InquiryType })}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition"
              >
                <option value="General inquiry">General inquiry</option>
                <option value="Office fit-out / bulk quote">Office fit-out / bulk quote</option>
                <option value="Space planning">Space planning</option>
                <option value="Delivery & returns">Delivery & returns</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Pipeline Stage</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as LeadStatus })}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition"
              >
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Lead Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as LeadPriority })}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition"
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Estimated Value (₹)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold select-none">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  placeholder="Optional (e.g. 50000)"
                  value={formData.estimatedValue === 0 || formData.estimatedValue === undefined ? '' : formData.estimatedValue}
                  onChange={(e) => {
                    const val = e.target.value
                    setFormData({
                      ...formData,
                      estimatedValue: val === '' ? (undefined as any) : Number(val),
                    })
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg pl-7 pr-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition placeholder:text-slate-300"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Requirements / Message <span className="text-orange-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="e.g. Needs 60 workstations and 80 ergonomic chairs for Ambattur office fit-out..."
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Internal Notes</label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Met on site, CAD drawing received"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false)
                setEditingLead(null)
              }}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{editingLead ? 'Update Enquiry' : 'Save Enquiry'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
