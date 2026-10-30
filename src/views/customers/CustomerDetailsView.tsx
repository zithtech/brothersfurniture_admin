import React, { useEffect, useState } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Calendar,
  Check,
  Clock,
  Copy,
  CreditCard,
  Edit2,
  ExternalLink,
  FileText,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  Navigation,
  Package,
  Phone,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react'
import { Modal } from '../../components/common/Modal'
import { SearchableSelect, type SelectOption } from '../../components/common/SearchableSelect'
import { useAdmin } from '../../context/AdminContext'
import { customerApi } from '../../services/customerApi'
import { DESIGNATION_OPTIONS, DEPARTMENT_OPTIONS } from './CustomerDrawer'
import type {
  AddressType,
  Customer,
  CustomerAddress,
  CustomerContact,
  CustomerStatus,
} from '../../types/customer'

const ADDRESS_TYPE_OPTIONS: SelectOption[] = [
  { value: 'billing', label: 'Billing Address', description: 'Primary invoicing and GST site' },
  { value: 'shipping', label: 'Shipping / Delivery Site', description: 'Furniture dispatch & install location' },
  { value: 'headquarters', label: 'Headquarters / Corporate Office', description: 'Main administrative corporate building' },
  { value: 'warehouse', label: 'Warehouse / Factory Depot', description: 'Receiving docks and storage site' },
  { value: 'branch', label: 'Branch / Regional Studio', description: 'Local branch or satellite unit' },
]

const INDIAN_STATES = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
]

interface CustomerDetailsViewProps {
  customerId: string
  onBack: () => void
  onEdit: (customer: Customer) => void
  onCustomerUpdated?: () => void
}

export const CustomerDetailsView: React.FC<CustomerDetailsViewProps> = ({
  customerId,
  onBack,
  onEdit,
  onCustomerUpdated,
}) => {
  const { addToast, confirm } = useAdmin()

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'contacts' | 'addresses' | 'orders' | 'activity'>('overview')
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Modals for adding contacts / addresses / notes directly from details page
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<CustomerContact | null>(null)
  const [contactForm, setContactForm] = useState({
    name: '',
    designation: '',
    phone: '',
    email: '',
    isPrimary: false,
    department: '',
  })

  const [isAddAddressModalOpen, setIsAddAddressModalOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null)
  const [addressForm, setAddressForm] = useState({
    addressType: 'billing' as AddressType,
    isDefault: false,
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: 'India',
    pinCode: '',
    mapLocation: '',
    latitude: '',
    longitude: '',
  })

  const [newNoteText, setNewNoteText] = useState('')
  const [newNoteCategory, setNewNoteCategory] = useState<'General' | 'Meeting' | 'Call' | 'Pricing' | 'Requirement'>('General')
  const [isSubmittingNote, setIsSubmittingNote] = useState(false)

  // Fetch full details
  const fetchCustomerDetails = async () => {
    setIsLoading(true)
    try {
      const data = await customerApi.getCustomerById(customerId)
      setCustomer(data)
    } catch (err: any) {
      addToast('error', 'Error Loading Customer', err.message || 'Could not fetch customer details.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomerDetails()
  }, [customerId])

  // Copy helper with visual checkmark feedback
  const handleCopy = (text: string, label: string) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedField(label)
    addToast('success', 'Copied to Clipboard', `${label}: "${text}" copied.`)
    setTimeout(() => {
      setCopiedField(null)
    }, 2000)
  }

  // WhatsApp quick launcher
  const getWhatsAppUrl = (phone: string) => {
    const digits = phone.replace(/\D/g, '')
    const cleanNumber = digits.length === 10 ? `91${digits}` : digits
    return `https://wa.me/${cleanNumber}`
  }

  // Status Change Handler
  const handleStatusChange = async (newStatus: CustomerStatus) => {
    if (!customer) return
    const ok = await confirm({
      title: `Change Status to "${newStatus.toUpperCase()}"?`,
      message: `Are you sure you want to change the status of "${customer.companyName}" to ${newStatus}?`,
      confirmText: `Set as ${newStatus}`,
      variant: newStatus === 'active' ? 'success' : newStatus === 'archived' ? 'warning' : 'info',
    })
    if (!ok) return

    try {
      const updated = await customerApi.updateStatus(customer.id, newStatus)
      setCustomer((prev) => (prev ? { ...prev, status: updated.status } : null))
      addToast('success', 'Status Updated', `Customer is now marked as ${newStatus}.`)
      onCustomerUpdated?.()
      fetchCustomerDetails()
    } catch (err: any) {
      addToast('error', 'Failed to Update Status', err.message)
    }
  }

  // Delete / Archive Customer
  const handleDeleteCustomer = async () => {
    if (!customer) return
    const ok = await confirm({
      title: `Archive Customer "${customer.companyName}"?`,
      message: `This will move "${customer.companyName}" (${customer.customerCode}) to the archive. All historical contacts, orders and activity will be retained.`,
      confirmText: 'Archive Customer',
      variant: 'danger',
      icon: 'archive',
    })
    if (!ok) return

    try {
      await customerApi.deleteCustomer(customer.id)
      addToast('warning', 'Customer Archived', `"${customer.companyName}" has been moved to archive.`)
      onCustomerUpdated?.()
      onBack()
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message)
    }
  }

  // Contact Operations
  const handleOpenAddContact = () => {
    setEditingContact(null)
    setContactForm({
      name: '',
      designation: 'Commercial Manager',
      phone: '',
      email: '',
      isPrimary: (customer?.contacts?.length || 0) === 0,
      department: 'Procurement',
    })
    setIsAddContactModalOpen(true)
  }

  const handleOpenEditContact = (c: CustomerContact) => {
    setEditingContact(c)
    setContactForm({
      name: c.name,
      designation: c.designation,
      phone: c.phone,
      email: c.email || '',
      isPrimary: c.isPrimary,
      department: c.department || '',
    })
    setIsAddContactModalOpen(true)
  }

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customer) return

    const cleanName = contactForm.name.trim() || `${customer.companyName} Representative`
    const cleanPhone = contactForm.phone.trim() || customer.companyPhone
    const cleanDesignation = contactForm.designation?.trim() || 'Representative'

    try {
      const payload = {
        ...contactForm,
        name: cleanName,
        phone: cleanPhone,
        designation: cleanDesignation,
      }
      if (editingContact && editingContact.id) {
        await customerApi.updateContact(customer.id, editingContact.id, payload)
        addToast('success', 'Contact Updated', `Contact "${cleanName}" updated.`)
      } else {
        await customerApi.addContact(customer.id, payload)
        addToast('success', 'Contact Added', `Representative "${cleanName}" registered.`)
      }
      setIsAddContactModalOpen(false)
      fetchCustomerDetails()
    } catch (err: any) {
      addToast('error', 'Save Contact Failed', err.message)
    }
  }

  const handleDeleteContact = async (contact: CustomerContact) => {
    if (!customer || !contact.id) return
    const ok = await confirm({
      title: `Remove Contact "${contact.name}"?`,
      message: `Are you sure you want to remove ${contact.name} (${contact.designation}) from this company?`,
      confirmText: 'Remove Contact',
      variant: 'danger',
      icon: 'trash',
    })
    if (!ok) return

    try {
      await customerApi.deleteContact(customer.id, contact.id)
      addToast('info', 'Contact Removed', `Contact has been removed.`)
      fetchCustomerDetails()
    } catch (err: any) {
      addToast('error', 'Delete Contact Failed', err.message)
    }
  }

  // Address Operations
  const handleOpenAddAddress = () => {
    setEditingAddress(null)
    setAddressForm({
      addressType: 'billing',
      isDefault: (customer?.addresses?.length || 0) === 0,
      addressLine1: '',
      addressLine2: '',
      city: 'Chennai',
      state: 'Tamil Nadu',
      country: 'India',
      pinCode: '',
      mapLocation: '',
      latitude: '',
      longitude: '',
    })
    setIsAddAddressModalOpen(true)
  }

  const handleOpenEditAddress = (a: CustomerAddress) => {
    setEditingAddress(a)
    setAddressForm({
      addressType: a.addressType,
      isDefault: a.isDefault,
      addressLine1: a.addressLine1,
      addressLine2: a.addressLine2 || '',
      city: a.city,
      state: a.state,
      country: a.country || 'India',
      pinCode: a.pinCode || '',
      mapLocation: a.mapLocation || '',
      latitude: a.latitude ? String(a.latitude) : '',
      longitude: a.longitude ? String(a.longitude) : '',
    })
    setIsAddAddressModalOpen(true)
  }

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customer || !addressForm.city.trim() || !addressForm.state.trim()) return

    try {
      const payload = {
        ...addressForm,
        latitude: addressForm.latitude ? parseFloat(addressForm.latitude) : null,
        longitude: addressForm.longitude ? parseFloat(addressForm.longitude) : null,
      }

      if (editingAddress && editingAddress.id) {
        await customerApi.updateAddress(customer.id, editingAddress.id, payload)
        addToast('success', 'Address Updated', 'Facility address details saved.')
      } else {
        await customerApi.addAddress(customer.id, payload)
        addToast('success', 'Address Added', 'New facility address linked.')
      }
      setIsAddAddressModalOpen(false)
      fetchCustomerDetails()
    } catch (err: any) {
      addToast('error', 'Save Address Failed', err.message)
    }
  }

  const handleDeleteAddress = async (address: CustomerAddress) => {
    if (!customer || !address.id) return
    const ok = await confirm({
      title: 'Remove Address Facility?',
      message: `Are you sure you want to remove the ${address.addressType} address at ${address.city}, ${address.state}?`,
      confirmText: 'Remove Address',
      variant: 'danger',
      icon: 'trash',
    })
    if (!ok) return

    try {
      await customerApi.deleteAddress(customer.id, address.id)
      addToast('info', 'Address Removed', 'Address record removed.')
      fetchCustomerDetails()
    } catch (err: any) {
      addToast('error', 'Delete Address Failed', err.message)
    }
  }

  // Note Submission
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customer || !newNoteText.trim()) return

    setIsSubmittingNote(true)
    try {
      await customerApi.addNote(customer.id, {
        note: newNoteText.trim(),
        category: newNoteCategory,
      })
      setNewNoteText('')
      addToast('success', 'Note Added', 'Internal note logged to timeline.')
      fetchCustomerDetails()
    } catch (err: any) {
      addToast('error', 'Note Failed', err.message)
    } finally {
      setIsSubmittingNote(false)
    }
  }

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-3 border-orange-500/20 border-t-orange-600 rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-500 tracking-wide uppercase">
          Loading Luxury Corporate Profile...
        </p>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="py-20 text-center space-y-4 max-w-md mx-auto">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shadow-xs">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-black text-slate-900 tracking-tight">Customer Record Not Found</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          The requested corporate account could not be found or may have been archived.
        </p>
        <button
          onClick={onBack}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-sm transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Customer Directory
        </button>
      </div>
    )
  }

  const primaryContact = customer.contacts?.find((c) => c.isPrimary) || customer.contacts?.[0]
  const primaryAddress = customer.addresses?.find((a) => a.isDefault) || customer.addresses?.[0]

  // Monogram initials
  const initials = customer.companyName
    .replace(/[^\w\s]/gi, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('') || 'BF'

  return (
    <div className="space-y-3.5 animate-fade-in pb-10">
      {/* 1. COMPACT EXECUTIVE HEADER */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-4.5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          {/* Left: Monogram, Identity, Code & Status */}
          <div className="flex items-start gap-3 sm:gap-3.5 min-w-0">
            <button
              onClick={onBack}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 shadow-2xs transition-all shrink-0 cursor-pointer mt-0.5"
              title="Return to Customer Directory"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {/* Luxury Company Monogram */}
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-linear-to-br from-amber-500 via-orange-500 to-amber-700 text-white font-black text-base sm:text-lg flex items-center justify-center shrink-0 shadow-xs ring-2 ring-orange-500/10">
              {initials}
            </div>

            <div className="min-w-0 flex-1">
              {/* Category & Code Breadcrumb */}
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-orange-50 text-orange-700 border border-orange-200/60">
                  {customer.customerCode}
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200/60">
                  {customer.category}
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                  {customer.companySize} Scale
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200/60">
                  {customer.customerType}
                </span>
              </div>

              {/* Company Legal Title */}
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-snug truncate">
                {customer.companyName}
              </h1>

              {/* Sub-meta details: Creation date & website */}
              <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-slate-500 mt-0.5 font-medium">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  Client since {new Date(customer.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                </span>
                {customer.websiteUrl && (
                  <>
                    <span className="text-slate-300">·</span>
                    <a
                      href={customer.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-orange-600 hover:text-orange-700 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Globe className="w-3 h-3" />
                      {customer.websiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Status Switcher & Executive Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
            {/* Quick Status Pill with Indicator */}
            <div className="relative">
              <select
                value={customer.status}
                onChange={(e) => handleStatusChange(e.target.value as CustomerStatus)}
                className={`pl-6 pr-6 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer focus:outline-none appearance-none shadow-2xs ${
                  customer.status === 'active'
                    ? 'bg-emerald-50/80 text-emerald-800 border-emerald-200 hover:bg-emerald-100/60'
                    : customer.status === 'inactive'
                    ? 'bg-amber-50/80 text-amber-800 border-amber-200 hover:bg-amber-100/60'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/60'
                }`}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
              <span
                className={`w-1.5 h-1.5 rounded-full absolute left-2.5 top-3 pointer-events-none ${
                  customer.status === 'active'
                    ? 'bg-emerald-500 animate-pulse'
                    : customer.status === 'inactive'
                    ? 'bg-amber-500'
                    : 'bg-slate-400'
                }`}
              />
              <span className="absolute right-2 top-2.5 text-[9px] pointer-events-none text-slate-400">
                ▼
              </span>
            </div>

            {/* Direct Communication: Call Company */}
            {customer.companyPhone && (
              <a
                href={`tel:${customer.companyPhone}`}
                className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                title={`Call ${customer.companyPhone}`}
              >
                <Phone className="w-3 h-3 text-orange-500" />
                <span className="hidden sm:inline">Call</span>
              </a>
            )}

            {/* Direct Communication: Email Company */}
            {customer.companyEmail && (
              <a
                href={`mailto:${customer.companyEmail}`}
                className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                title={`Email ${customer.companyEmail}`}
              >
                <Mail className="w-3 h-3 text-orange-500" />
                <span className="hidden sm:inline">Email</span>
              </a>
            )}

            {/* Edit Profile Action */}
            <button
              onClick={() => onEdit(customer)}
              className="px-3 py-1.5 bg-linear-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <Edit2 className="w-3 h-3" />
              <span>Edit</span>
            </button>

            {/* Archive / Delete Action */}
            <button
              onClick={handleDeleteCustomer}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/90 rounded-xl transition cursor-pointer shadow-2xs"
              title="Archive this customer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 2. COMPACT EXECUTIVE METRIC RIBBON */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 pt-3 mt-3 border-t border-slate-100">
          {/* Stat 1: Commercial Credit Facility */}
          <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-200/70 space-y-0.5">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-bold text-[10px] uppercase tracking-wider text-slate-500">Credit Facility</span>
              <CreditCard className="w-3.5 h-3.5 text-orange-500" />
            </div>
            <div className="text-base font-black text-slate-900 tracking-tight">
              ₹{Number(customer.creditLimit || 0).toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
              <span className="px-1 py-0.1 rounded bg-amber-50 text-amber-700 font-bold text-[9px] border border-amber-200/60">
                {customer.paymentTerms || 'Net 30'}
              </span>
              <span>Terms</span>
            </div>
          </div>

          {/* Stat 2: Tax Identity (GSTIN) */}
          <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-200/70 space-y-0.5">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-bold text-[10px] uppercase tracking-wider text-slate-500">GST Registration</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs sm:text-sm font-mono font-black text-slate-900 tracking-wide truncate">
                {customer.gstNumber || 'Unregistered'}
              </span>
              {customer.gstNumber && (
                <button
                  type="button"
                  onClick={() => handleCopy(customer.gstNumber || '', 'GSTIN')}
                  className="p-0.5 hover:bg-slate-200/60 rounded text-slate-400 hover:text-slate-700 transition cursor-pointer"
                  title="Copy GSTIN"
                >
                  {copiedField === 'GSTIN' ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              )}
            </div>
            <div className="text-[10px] text-slate-500 font-medium truncate">
              Type: <span className="font-bold text-slate-700">{customer.gstType}</span>
            </div>
          </div>

          {/* Stat 3: Primary Hub & Facilities */}
          <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-200/70 space-y-0.5">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-bold text-[10px] uppercase tracking-wider text-slate-500">Primary Hub</span>
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <div className="text-xs sm:text-sm font-black text-slate-900 truncate">
              {primaryAddress ? `${primaryAddress.city}, ${primaryAddress.state}` : 'Chennai, Tamil Nadu'}
            </div>
            <div className="text-[10px] text-slate-500 font-medium flex items-center justify-between">
              <span>{customer.addresses?.length || 0} Facilities</span>
              <button
                type="button"
                onClick={() => setActiveTab('addresses')}
                className="text-orange-600 hover:underline font-bold text-[9px]"
              >
                Sites →
              </button>
            </div>
          </div>

          {/* Stat 4: Primary Account Representative */}
          <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-200/70 space-y-0.5">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-bold text-[10px] uppercase tracking-wider text-slate-500">Representative</span>
              <Users className="w-3.5 h-3.5 text-orange-500" />
            </div>
            <div className="text-xs sm:text-sm font-black text-slate-900 truncate">
              {primaryContact ? primaryContact.name : `${customer.companyName} Rep`}
            </div>
            <div className="flex items-center justify-between gap-1 text-[10px] text-slate-500 font-medium">
              <span className="truncate max-w-[100px]">{primaryContact?.designation || 'Representative'}</span>
              {primaryContact?.phone && (
                <div className="flex items-center gap-1">
                  <a
                    href={`tel:${primaryContact.phone}`}
                    className="p-0.5 text-slate-400 hover:text-orange-600 hover:bg-slate-200/60 rounded"
                    title="Call"
                  >
                    <Phone className="w-2.5 h-2.5" />
                  </a>
                  <a
                    href={getWhatsAppUrl(primaryContact.phone)}
                    target="_blank"
                    rel="noreferrer"
                    className="p-0.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-200/60 rounded"
                    title="WhatsApp"
                  >
                    <MessageCircle className="w-2.5 h-2.5" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. COMPACT SEGMENTED TAB BAR */}
      <div className="bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 flex items-center gap-1 overflow-x-auto scrollbar-none shadow-2xs">
        {[
          { id: 'overview', label: 'Overview', icon: Building2 },
          { id: 'contacts', label: 'Contacts', icon: Users, count: customer.contacts?.length },
          { id: 'addresses', label: 'Sites & Facilities', icon: MapPin, count: customer.addresses?.length },
          { id: 'orders', label: 'Order History', icon: Package, count: customer.orders?.length },
          { id: 'activity', label: 'Activity & Notes', icon: MessageSquare, count: customer.notes?.length },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-white text-orange-600 shadow-2xs border border-orange-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-orange-500' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold ${
                    isActive ? 'bg-orange-100 text-orange-700' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* 4. TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 animate-fade-in">
          {/* Left Column: Corporate Identity & Details */}
          <div className="lg:col-span-2 space-y-3.5">
            {/* Corporate Profile Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center text-[10px] font-black">
                    A
                  </span>
                  Corporate Identity & Registration Details
                </h3>
                <span className="text-[10px] font-medium text-slate-400">Verified B2B Account</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Official Company Phone */}
                <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/60 space-y-0.5">
                  <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">
                    Company Phone Line
                  </span>
                  <div className="flex items-center justify-between">
                    <a
                      href={`tel:${customer.companyPhone}`}
                      className="font-bold text-slate-900 text-xs sm:text-sm hover:text-orange-600 flex items-center gap-1.5 transition"
                    >
                      <Phone className="w-3 h-3 text-orange-500" />
                      <span>{customer.companyPhone}</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopy(customer.companyPhone, 'Phone')}
                      className="p-0.5 hover:bg-slate-200/60 rounded text-slate-400 hover:text-slate-700 transition"
                      title="Copy phone"
                    >
                      {copiedField === 'Phone' ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Official Company Email */}
                <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/60 space-y-0.5">
                  <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">
                    Official Corporate Email
                  </span>
                  <div className="flex items-center justify-between">
                    {customer.companyEmail ? (
                      <a
                        href={`mailto:${customer.companyEmail}`}
                        className="font-bold text-slate-900 text-xs sm:text-sm hover:text-orange-600 flex items-center gap-1.5 transition truncate max-w-[200px]"
                      >
                        <Mail className="w-3 h-3 text-orange-500 shrink-0" />
                        <span className="truncate">{customer.companyEmail}</span>
                      </a>
                    ) : (
                      <span className="text-slate-400 text-xs italic">No official email provided</span>
                    )}
                    {customer.companyEmail && (
                      <button
                        type="button"
                        onClick={() => handleCopy(customer.companyEmail || '', 'Email')}
                        className="p-0.5 hover:bg-slate-200/60 rounded text-slate-400 hover:text-slate-700 transition"
                        title="Copy email"
                      >
                        {copiedField === 'Email' ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* GST Number */}
                <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/60 space-y-0.5">
                  <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">
                    GSTIN / Tax ID
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="font-bold font-mono text-slate-900 text-xs sm:text-sm">
                      {customer.gstNumber || 'Unregistered'}
                    </span>
                    {customer.gstNumber && (
                      <button
                        type="button"
                        onClick={() => handleCopy(customer.gstNumber || '', 'GSTIN')}
                        className="p-0.5 hover:bg-slate-200/60 rounded text-slate-400 hover:text-slate-700 transition"
                        title="Copy GSTIN"
                      >
                        {copiedField === 'GSTIN' ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Commercial Terms & Credit */}
                <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/60 space-y-0.5">
                  <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">
                    Commercial Terms
                  </span>
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-bold text-slate-900">{customer.paymentTerms}</span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      Limit: ₹{Number(customer.creditLimit || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Category & Industry */}
                <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/60 space-y-0.5">
                  <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">
                    Category & Vertical
                  </span>
                  <span className="font-bold text-slate-900 text-xs sm:text-sm block">{customer.category}</span>
                </div>

                {/* Website */}
                <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/60 space-y-0.5">
                  <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">
                    Web Domain
                  </span>
                  {customer.websiteUrl ? (
                    <a
                      href={customer.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-orange-600 hover:underline flex items-center gap-1.5 text-xs sm:text-sm truncate"
                    >
                      <Globe className="w-3 h-3 text-orange-500 shrink-0" />
                      <span className="truncate">{customer.websiteUrl.replace(/^https?:\/\//, '')}</span>
                      <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-slate-400 text-xs italic">No website specified</span>
                  )}
                </div>
              </div>

              {/* Special Agreements & Internal Notes Banner */}
              {customer.internalNotes && (
                <div className="pt-1">
                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70 space-y-0.5">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      Commercial Pricing Agreements & Special Contract Terms
                    </span>
                    <p className="text-xs text-amber-800 leading-relaxed font-medium">
                      {customer.internalNotes}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Primary Delivery Facility Snapshot */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-orange-500" />
                  Primary Facility & Dispatch Location
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('addresses')}
                  className="text-[11px] font-bold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer"
                >
                  All Facilities ({customer.addresses?.length || 0}) →
                </button>
              </div>

              {primaryAddress ? (
                <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700">
                        {primaryAddress.addressType}
                      </span>
                      {primaryAddress.isDefault && (
                        <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-emerald-100 text-emerald-700">
                          Primary Dispatch Hub
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-slate-900 text-xs sm:text-sm">{primaryAddress.addressLine1}</p>
                    {primaryAddress.addressLine2 && (
                      <p className="text-xs text-slate-600 font-medium">{primaryAddress.addressLine2}</p>
                    )}
                    <p className="text-xs text-slate-600 font-semibold">
                      {primaryAddress.city}, {primaryAddress.state} — PIN {primaryAddress.pinCode},{' '}
                      {primaryAddress.country}
                    </p>
                  </div>

                  {primaryAddress.latitude && primaryAddress.longitude && (
                    <a
                      href={`https://www.google.com/maps?q=${primaryAddress.latitude},${primaryAddress.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 rounded-lg border border-slate-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition shrink-0"
                    >
                      <Navigation className="w-3 h-3 text-rose-500" />
                      <span>Open in Maps ↗</span>
                    </a>
                  )}
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-slate-400 italic">
                  No facility address added yet. Click "Sites & Facilities" tab to add one.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Account Management & Key Rep */}
          <div className="space-y-3.5">
            {/* Primary Representative Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-orange-500" />
                  Key Representative
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('contacts')}
                  className="text-[11px] font-bold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer"
                >
                  Manage ({customer.contacts?.length || 0}) →
                </button>
              </div>

              {primaryContact ? (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-700 font-black flex items-center justify-center text-xs shadow-2xs">
                      {primaryContact.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                        {primaryContact.name}
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-orange-100 text-orange-700">
                          Primary
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">{primaryContact.designation}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                      <span className="text-slate-500 font-medium">Direct Phone:</span>
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`tel:${primaryContact.phone}`}
                          className="font-bold text-slate-900 hover:text-orange-600 flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3 text-orange-500" />
                          <span>{primaryContact.phone}</span>
                        </a>
                        <a
                          href={getWhatsAppUrl(primaryContact.phone)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-0.5 hover:bg-slate-200 text-emerald-600 rounded"
                          title="WhatsApp"
                        >
                          <MessageCircle className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    {primaryContact.email && (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                        <span className="text-slate-500 font-medium">Email:</span>
                        <a
                          href={`mailto:${primaryContact.email}`}
                          className="font-bold text-slate-900 hover:text-orange-600 truncate max-w-[170px]"
                        >
                          {primaryContact.email}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic py-3 text-center">
                  No contact person recorded yet.
                </div>
              )}
            </div>

            {/* Account Management & CRM Audit Info */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-2.5">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
                Account Management & Audit
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Assigned Manager:</span>
                  <span className="font-bold text-slate-900">{customer.accountManager || 'Admin Team'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Lead Source:</span>
                  <span className="font-bold text-slate-900">{customer.customerSource}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Registered On:</span>
                  <span className="font-bold text-slate-900">
                    {new Date(customer.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Last Profile Update:</span>
                  <span className="font-bold text-slate-900">
                    {new Date(customer.updatedAt || customer.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Direct Quick Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleOpenAddContact}
                  className="p-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  + Contact
                </button>
                <button
                  type="button"
                  onClick={handleOpenAddAddress}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  + Facility
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB 2: CONTACTS */}
      {activeTab === 'contacts' && (
        <div className="space-y-3.5 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900">Authorized Company Representatives</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Designated corporate contacts for purchase orders, site access, billing and managerial signoffs
              </p>
            </div>
            <button
              onClick={handleOpenAddContact}
              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Representative</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {customer.contacts?.map((con) => (
              <div
                key={con.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  con.isPrimary
                    ? 'bg-orange-50/30 border-orange-200/90 shadow-2xs'
                    : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shadow-2xs ${
                        con.isPrimary ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {con.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                        {con.name}
                        {con.isPrimary && (
                          <span className="px-1.5 py-0.2 bg-orange-100 text-orange-700 text-[9px] font-bold rounded-full">
                            ★ Primary
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-semibold">{con.designation}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => handleOpenEditContact(con)}
                      className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded transition cursor-pointer"
                      title="Edit contact"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    {customer.contacts && customer.contacts.length > 1 && (
                      <button
                        onClick={() => handleDeleteContact(con)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                        title="Delete contact"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                  {/* Phone + Call & WhatsApp action triggers */}
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50/80">
                    <a
                      href={`tel:${con.phone}`}
                      className="flex items-center gap-1.5 text-slate-800 hover:text-orange-600 font-bold"
                    >
                      <Phone className="w-3 h-3 text-orange-500" />
                      <span>{con.phone}</span>
                    </a>
                    <a
                      href={getWhatsAppUrl(con.phone)}
                      target="_blank"
                      rel="noreferrer"
                      className="p-0.5 text-emerald-600 hover:bg-emerald-50 rounded"
                      title="WhatsApp Message"
                    >
                      <MessageCircle className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Email */}
                  {con.email && (
                    <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50/80">
                      <a
                        href={`mailto:${con.email}`}
                        className="flex items-center gap-1.5 text-slate-800 hover:text-orange-600 font-bold truncate max-w-[200px]"
                      >
                        <Mail className="w-3 h-3 text-orange-500 shrink-0" />
                        <span className="truncate">{con.email}</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopy(con.email || '', 'Email')}
                        className="p-0.5 text-slate-400 hover:text-slate-700"
                        title="Copy"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Department & Notes */}
                  {con.department && (
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                      <span>Department:</span>
                      <span className="font-bold text-slate-800">{con.department}</span>
                    </div>
                  )}
                  {con.notes && (
                    <div className="text-[10px] text-slate-500 bg-slate-50 p-1.5 rounded italic">
                      "{con.notes}"
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. TAB 3: ADDRESSES */}
      {activeTab === 'addresses' && (
        <div className="space-y-3.5 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900">Facilities, Depots & Delivery Sites</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Multi-site facility directory with geocoding, delivery landmarks and route access
              </p>
            </div>
            <button
              onClick={handleOpenAddAddress}
              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Facility Address</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {customer.addresses?.map((addr) => (
              <div
                key={addr.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  addr.isDefault
                    ? 'bg-orange-50/20 border-orange-200/90 shadow-2xs'
                    : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                      {addr.addressType} Site
                    </span>
                    {addr.isDefault && (
                      <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-emerald-100 text-emerald-700">
                        Default Invoicing
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => handleOpenEditAddress(addr)}
                      className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded transition cursor-pointer"
                      title="Edit facility address"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    {customer.addresses && customer.addresses.length > 1 && (
                      <button
                        onClick={() => handleDeleteAddress(addr)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                        title="Delete address"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-0.5 text-xs text-slate-700">
                  <p className="font-black text-slate-900 text-xs sm:text-sm">{addr.addressLine1}</p>
                  {addr.addressLine2 && <p className="text-slate-600 font-medium">{addr.addressLine2}</p>}
                  <p className="font-semibold text-slate-800">
                    {addr.city}, {addr.state} — <span className="font-mono">{addr.pinCode}</span>
                  </p>
                  <p className="text-slate-500 font-medium">{addr.country}</p>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[10px] font-mono text-slate-400">
                    {addr.latitude && addr.longitude ? `${addr.latitude}, ${addr.longitude}` : 'Manual Geocode'}
                  </div>

                  {addr.latitude && addr.longitude && (
                    <a
                      href={`https://www.google.com/maps?q=${addr.latitude},${addr.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Navigation className="w-2.5 h-2.5 text-rose-500" />
                      <span>Google Maps ↗</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. TAB 4: ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-3.5 animate-fade-in">
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900">Commercial Purchase Orders & Invoicing</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Historical transaction history matched to {customer.companyName} across back-office operations
            </p>
          </div>

          {customer.orders && customer.orders.length > 0 ? (
            <div className="space-y-2">
              {customer.orders.map((ord: any) => (
                <div
                  key={ord.id}
                  className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-xs sm:text-sm text-slate-900">{ord.orderNumber}</span>
                      <span className="px-2 py-0.2 rounded-full text-[9.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {ord.status}
                      </span>
                      <span className="px-2 py-0.2 rounded-full text-[9.5px] font-bold bg-blue-50 text-blue-700">
                        {ord.paymentStatus}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      Executed on {new Date(ord.createdAt).toLocaleDateString('en-IN')} · {ord.items?.length || 0} line items
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-sm sm:text-base font-black text-slate-900 block">
                      ₹{Number(ord.total || 0).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Invoice Total</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 bg-white rounded-2xl border border-slate-200 text-center space-y-2.5">
              <Package className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs sm:text-sm font-bold text-slate-700">No Purchase Orders Recorded Yet</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Orders placed using this company phone, email or registered code will automatically populate here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 8. TAB 5: ACTIVITY & NOTES */}
      {activeTab === 'activity' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 animate-fade-in">
          {/* Left Column: Internal CRM Notes */}
          <div className="space-y-3">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-orange-500" />
              Internal Customer Notes & Logs
            </h3>

            {/* Note input box */}
            <form
              onSubmit={handleAddNote}
              className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5"
            >
              <textarea
                rows={2}
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Log internal note, meeting minutes, price agreements, or executive follow-up..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
              />

              <div className="flex items-center justify-between">
                <select
                  value={newNoteCategory}
                  onChange={(e) => setNewNoteCategory(e.target.value as any)}
                  className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="General">General Note</option>
                  <option value="Meeting">Meeting Minutes</option>
                  <option value="Call">Call Log</option>
                  <option value="Pricing">Special Pricing</option>
                  <option value="Requirement">Site Requirement</option>
                </select>

                <button
                  type="submit"
                  disabled={isSubmittingNote || !newNoteText.trim()}
                  className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3 h-3" />
                  Save Note
                </button>
              </div>
            </form>

            {/* Notes List */}
            <div className="space-y-2">
              {customer.notes && customer.notes.length > 0 ? (
                customer.notes.map((n) => (
                  <div
                    key={n.id}
                    className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-1.5 py-0.2 bg-orange-50 text-orange-700 text-[9.5px] font-bold rounded-md border border-orange-200/60">
                        {n.category}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(n.createdAt).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-900 leading-relaxed font-medium">{n.note}</p>
                    <span className="text-[9.5px] text-slate-400 block pt-1 border-t border-slate-100">
                      Logged by: <strong className="text-slate-700">{n.authorName}</strong>
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic text-center py-4">No internal notes logged yet.</p>
              )}
            </div>
          </div>

          {/* Right Column: Audit Timeline */}
          <div className="space-y-3">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-orange-500" />
              Audit Trail & Timeline
            </h3>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
              <div className="relative pl-5 space-y-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {customer.activityLogs && customer.activityLogs.length > 0 ? (
                  customer.activityLogs.map((log) => (
                    <div key={log.id} className="relative space-y-0.5 text-xs">
                      <span className="absolute -left-[23px] top-1 w-2 h-2 rounded-full bg-orange-500 ring-4 ring-white" />
                      <p className="font-bold text-slate-900">{log.description}</p>
                      <div className="flex items-center gap-2 text-[9.5px] text-slate-400 font-medium">
                        <span>By {log.actorName}</span>
                        <span>·</span>
                        <span>{new Date(log.createdAt).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No activity recorded.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT CONTACT */}
      <Modal
        isOpen={isAddContactModalOpen}
        onClose={() => setIsAddContactModalOpen(false)}
        title={editingContact ? 'Edit Contact Person' : 'Add Corporate Representative'}
        subtitle={`Associate an authorized contact person with ${customer.companyName}`}
      >
        <form onSubmit={handleSaveContact} className="space-y-3 text-slate-900">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                Contact Full Name <span className="text-rose-500">*</span>
              </label>
              {contactForm.name && (
                <button
                  type="button"
                  onClick={() => setContactForm((prev) => ({ ...prev, name: '' }))}
                  className="text-[10px] text-slate-400 hover:text-rose-600 cursor-pointer font-medium"
                >
                  Clear
                </button>
              )}
            </div>
            <input
              type="text"
              value={contactForm.name}
              onChange={(e) => setContactForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Raj Kumar"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none transition-colors"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Leave blank to default to {customer.companyName ? `${customer.companyName} Representative` : 'company representative'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Designation / Role
              </label>
              <SearchableSelect
                value={contactForm.designation || 'Representative'}
                onChange={(val) => setContactForm((prev) => ({ ...prev, designation: val }))}
                options={DESIGNATION_OPTIONS}
                placeholder="Select Designation..."
                searchPlaceholder="Search role..."
                allowCustom={true}
                customOptionLabel="+ Enter Custom Designation..."
                accentColor="orange"
                showBadge={false}
                clearable={false}
                onCustomSelect={(customVal) => {
                  if (customVal) setContactForm((prev) => ({ ...prev, designation: customVal }))
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
              <SearchableSelect
                value={contactForm.department || 'Management'}
                onChange={(val) => setContactForm((prev) => ({ ...prev, department: val }))}
                options={DEPARTMENT_OPTIONS}
                placeholder="Select Department..."
                searchPlaceholder="Search department..."
                allowCustom={true}
                customOptionLabel="+ Enter Custom Department..."
                accentColor="orange"
                showBadge={false}
                clearable={false}
                onCustomSelect={(customVal) => {
                  if (customVal) setContactForm((prev) => ({ ...prev, department: customVal }))
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Direct Phone</label>
                <div className="flex items-center gap-2">
                  {contactForm.phone && (
                    <button
                      type="button"
                      onClick={() => setContactForm((prev) => ({ ...prev, phone: '' }))}
                      className="text-[10px] text-slate-400 hover:text-rose-600 cursor-pointer font-medium"
                    >
                      Clear
                    </button>
                  )}
                  {customer.companyPhone && contactForm.phone !== customer.companyPhone && (
                    <button
                      type="button"
                      onClick={() => setContactForm((prev) => ({ ...prev, phone: customer.companyPhone }))}
                      className="text-[10px] text-orange-600 hover:text-orange-700 hover:underline cursor-pointer font-bold"
                    >
                      Copy Company Phone
                    </button>
                  )}
                </div>
              </div>
              <input
                type="tel"
                value={contactForm.phone}
                onChange={(e) => setContactForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="e.g. +91 98765 43210"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none transition-colors"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Auto-uses {customer.companyPhone ? customer.companyPhone : 'company phone'} if left blank
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Email Address</label>
                <div className="flex items-center gap-2">
                  {contactForm.email && (
                    <button
                      type="button"
                      onClick={() => setContactForm((prev) => ({ ...prev, email: '' }))}
                      className="text-[10px] text-slate-400 hover:text-rose-600 cursor-pointer font-medium"
                    >
                      Clear
                    </button>
                  )}
                  {customer.companyEmail && contactForm.email !== customer.companyEmail && (
                    <button
                      type="button"
                      onClick={() => setContactForm((prev) => ({ ...prev, email: customer.companyEmail || '' }))}
                      className="text-[10px] text-orange-600 hover:text-orange-700 hover:underline cursor-pointer font-bold"
                    >
                      Copy Company Email
                    </button>
                  )}
                </div>
              </div>
              <input
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="e.g. representative@company.com"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none transition-colors"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Auto-uses {customer.companyEmail ? customer.companyEmail : 'company email'} if left blank
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isPrimaryContact"
              checked={contactForm.isPrimary}
              onChange={(e) => setContactForm((prev) => ({ ...prev, isPrimary: e.target.checked }))}
              className="w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500"
            />
            <label htmlFor="isPrimaryContact" className="text-xs font-bold text-slate-700 cursor-pointer">
              Set as primary contact for this company
            </label>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsAddContactModalOpen(false)}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold shadow-2xs cursor-pointer"
            >
              {editingContact ? 'Update Contact' : 'Save Representative'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ADD / EDIT ADDRESS */}
      <Modal
        isOpen={isAddAddressModalOpen}
        onClose={() => setIsAddAddressModalOpen(false)}
        title={editingAddress ? 'Edit Facility Address' : 'Add Facility Address'}
        subtitle={`Add a site or delivery depot for ${customer.companyName}`}
      >
        <form onSubmit={handleSaveAddress} className="space-y-3 text-slate-900">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Address Type</label>
              <SearchableSelect
                value={addressForm.addressType}
                onChange={(val) => setAddressForm((prev) => ({ ...prev, addressType: val as any }))}
                options={ADDRESS_TYPE_OPTIONS}
                placeholder="Address Type..."
                searchPlaceholder="Search type..."
                accentColor="orange"
                showBadge={false}
                clearable={false}
              />
            </div>

            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id="isDefaultAddr"
                checked={addressForm.isDefault}
                onChange={(e) => setAddressForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
                className="w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500"
              />
              <label htmlFor="isDefaultAddr" className="text-xs font-bold text-slate-700 cursor-pointer">
                Set as default site
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Address Line 1 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={addressForm.addressLine1}
              onChange={(e) => setAddressForm((prev) => ({ ...prev, addressLine1: e.target.value }))}
              placeholder="Door No, Building, Street, Industrial Area"
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Address Line 2 (Optional)</label>
            <input
              type="text"
              value={addressForm.addressLine2}
              onChange={(e) => setAddressForm((prev) => ({ ...prev, addressLine2: e.target.value }))}
              placeholder="Suite, Floor, Landmark, Phase"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                City <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={addressForm.city}
                onChange={(e) => setAddressForm((prev) => ({ ...prev, city: e.target.value }))}
                placeholder="e.g. Chennai"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                State <span className="text-rose-500">*</span>
              </label>
              <SearchableSelect
                value={addressForm.state || 'Tamil Nadu'}
                onChange={(val) => setAddressForm((prev) => ({ ...prev, state: val }))}
                options={INDIAN_STATES}
                placeholder="Select State..."
                searchPlaceholder="Search Indian state..."
                accentColor="orange"
                showBadge={false}
                clearable={false}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">PIN Code</label>
              <input
                type="text"
                value={addressForm.pinCode}
                onChange={(e) => setAddressForm((prev) => ({ ...prev, pinCode: e.target.value }))}
                placeholder="600032"
                maxLength={6}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Country</label>
              <input
                type="text"
                value={addressForm.country}
                onChange={(e) => setAddressForm((prev) => ({ ...prev, country: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsAddAddressModalOpen(false)}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold shadow-2xs cursor-pointer"
            >
              {editingAddress ? 'Update Facility' : 'Save Facility'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
