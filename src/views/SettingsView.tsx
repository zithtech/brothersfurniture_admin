import React, { useState, useEffect, useRef } from 'react'
import {
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  ExternalLink,
  Eye,
  EyeOff,
  Factory,
  FolderTree,
  Globe,
  Landmark,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  PenTool,
  Phone,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Truck,
  Upload,
} from 'lucide-react'
import { AlertBanner } from '../components/common/AlertBanner'
import { Modal } from '../components/common/Modal'
import { useAdmin } from '../context/AdminContext'
import { api } from '../services/api'
import type { CompanySettings, BankAccount } from '../types/admin'

type SettingsTab = 'all' | 'factory' | 'hotlines' | 'logistics' | 'banner' | 'banking' | 'signature'

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, setCurrentView, confirm } = useAdmin()

  const [formData, setFormData] = useState<CompanySettings>(settings)
  const [activeTab, setActiveTab] = useState<SettingsTab>('all')
  const [isSaved, setIsSaved] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [showMapPreview, setShowMapPreview] = useState(true)

  // Signature upload state
  const signatureInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingSignature, setIsUploadingSignature] = useState(false)
  const [signatureUploadError, setSignatureUploadError] = useState<string | null>(null)

  // Bank details CRUD modal state
  const [bankModalOpen, setBankModalOpen] = useState(false)
  const [editingBankIndex, setEditingBankIndex] = useState<number | null>(null)
  const [bankForm, setBankForm] = useState<BankAccount>({
    id: '',
    bankName: '',
    accountName: '',
    accountNumber: '',
    ifscCode: '',
    branch: '',
    upiId: '',
    accountType: 'Current',
    isDefault: false,
  })

  // Test calculator state for shipping thresholds
  const [testOrderValue, setTestOrderValue] = useState<number>(35000)

  // Keep form data synchronized if global settings update externally
  useEffect(() => {
    setFormData(settings)
  }, [settings])

  const bankAccounts = formData.bankAccounts || []

  const handleOpenAddBank = () => {
    setEditingBankIndex(null)
    setBankForm({
      id: `bank-${Date.now()}`,
      bankName: '',
      accountName: formData.name ? `${formData.name} Industrial Solutions` : 'Brothers Furniture Industrial Solutions',
      accountNumber: '',
      ifscCode: '',
      branch: 'Ambattur Industrial Estate Branch, Chennai',
      upiId: '',
      accountType: 'Current',
      isDefault: bankAccounts.length === 0,
    })
    setBankModalOpen(true)
  }

  const handleOpenEditBank = (index: number) => {
    setEditingBankIndex(index)
    setBankForm({ ...bankAccounts[index] })
    setBankModalOpen(true)
  }

  const handleSaveBankAccount = (e: React.FormEvent) => {
    e.preventDefault()
    if (!bankForm.bankName || !bankForm.accountNumber || !bankForm.ifscCode) return

    let updatedList = [...bankAccounts]
    if (editingBankIndex !== null) {
      updatedList[editingBankIndex] = bankForm
    } else {
      updatedList.push(bankForm)
    }

    if (bankForm.isDefault || updatedList.length === 1) {
      const activeId = bankForm.id
      updatedList = updatedList.map((b) => ({
        ...b,
        isDefault: b.id === activeId,
      }))
    }

    const updatedSettings = {
      ...formData,
      bankAccounts: updatedList,
    }
    setFormData(updatedSettings)
    updateSettings(updatedSettings)
    setBankModalOpen(false)
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2000)
  }

  const handleDeleteBankAccount = async (index: number) => {
    const target = bankAccounts[index]
    const ok = await confirm({
      title: `Delete ${target.bankName} Account?`,
      message: `Are you sure you want to remove bank account ending in ...${target.accountNumber.slice(-4)}? This account will no longer appear on generated invoices.`,
      confirmText: 'Delete Account',
      cancelText: 'Keep Account',
      variant: 'danger',
      icon: 'trash',
    })
    if (!ok) return

    let updatedList = bankAccounts.filter((_, i) => i !== index)
    if (target.isDefault && updatedList.length > 0) {
      updatedList[0].isDefault = true
    }

    const updatedSettings = {
      ...formData,
      bankAccounts: updatedList,
    }
    setFormData(updatedSettings)
    updateSettings(updatedSettings)
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2000)
  }

  const handleSetDefaultBank = (index: number) => {
    const updatedList = bankAccounts.map((b, i) => ({
      ...b,
      isDefault: i === index,
    }))
    const updatedSettings = {
      ...formData,
      bankAccounts: updatedList,
    }
    setFormData(updatedSettings)
    updateSettings(updatedSettings)
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2000)
  }

  // Signature file upload handler
  const handleSignatureFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setSignatureUploadError('Please select a valid image file (PNG, JPG, or WEBP).')
      return
    }
    try {
      setIsUploadingSignature(true)
      setSignatureUploadError(null)
      const res = await api.uploadImage(file, 'signature')
      if (res.data?.url) {
        const newFormData = { ...formData, signatureUrl: res.data.url }
        setFormData(newFormData)
        updateSettings(newFormData)
        setIsSaved(true)
        setTimeout(() => setIsSaved(false), 2500)
      }
    } catch (err: any) {
      console.error('Signature upload failed:', err)
      setSignatureUploadError(err.message || 'Signature upload failed. Please try again.')
    } finally {
      setIsUploadingSignature(false)
      if (signatureInputRef.current) signatureInputRef.current.value = ''
    }
  }

  const handleRemoveSignature = async () => {
    const ok = await confirm({
      title: 'Remove Authorized Signature?',
      message: 'Are you sure you want to remove the authorized signature from all invoices and proposals?',
      confirmText: 'Remove Signature',
      variant: 'danger',
      icon: 'trash',
    })
    if (ok) {
      const newFormData = { ...formData, signatureUrl: '' }
      setFormData(newFormData)
      updateSettings(newFormData)
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 2500)
    }
  }

  // Check if form has unsaved modifications
  const isDirty = JSON.stringify(formData) !== JSON.stringify(settings)

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateSettings(formData)
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2500)
  }

  const handleReset = async () => {
    const ok = await confirm({
      title: 'Discard Unsaved Changes?',
      message:
        'Are you sure you want to discard your unsaved modifications and revert back to current store settings?',
      confirmText: 'Discard Changes',
      cancelText: 'Keep Editing',
      variant: 'warning',
      icon: 'refresh',
    })
    if (ok) {
      setFormData(settings)
    }
  }

  // Address lines manipulation
  const handleAddAddressLine = () => {
    setFormData((prev) => ({
      ...prev,
      addressLines: [...prev.addressLines, 'Ambattur, Chennai - 600058'],
    }))
  }

  const handleRemoveAddressLine = (index: number) => {
    if (formData.addressLines.length <= 1) return
    setFormData((prev) => ({
      ...prev,
      addressLines: prev.addressLines.filter((_, i) => i !== index),
    }))
  }

  const handleAddressLineChange = (index: number, value: string) => {
    setFormData((prev) => {
      const updated = [...prev.addressLines]
      updated[index] = value
      return { ...prev, addressLines: updated }
    })
  }

  // Test delivery calculation
  const calculatedDelivery =
    testOrderValue >= formData.freeDeliveryThreshold ? 0 : formData.standardDeliveryFee

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-12">
      {/* 1. Header Strip & Quick Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-0.5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Store & Factory Settings
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
              <Factory className="w-3 h-3 text-slate-500" />
              Ambattur Plant
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-white text-slate-700 border border-slate-200 shadow-2xs">
              GSTIN: {formData.gstin}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              Free Delivery ≥ ₹{formData.freeDeliveryThreshold.toLocaleString('en-IN')}
            </span>
            {formData.isBannerActive ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-orange-50 text-orange-700 border border-orange-200/80">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                Banner Active
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200/60">
                Banner Hidden
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure Brothers Furniture legal profile, customer communication hotlines, delivery rules & storefront announcements
          </p>
        </div>

        {/* Quick Top Save Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {isDirty && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              title="Discard changes"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Discard</span>
            </button>
          )}

          <button
            onClick={handleSubmit}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-white font-semibold text-xs shadow-xs transition-all cursor-pointer ${
              isSaved
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-[#F97316] hover:bg-[#EA580C]'
            }`}
          >
            {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaved ? 'Settings Saved!' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Unsaved Changes Banner */}
      {isDirty && (
        <AlertBanner
          variant="warning"
          title="Unsaved Changes Detected"
          action={{
            label: 'Save Changes Now',
            onClick: () => {
              updateSettings(formData)
              setIsSaved(true)
              setTimeout(() => setIsSaved(false), 2500)
            },
          }}
        >
          You have pending updates to company settings, contact hotlines, or logistics rules. Remember to save your modifications before leaving this page.
        </AlertBanner>
      )}

      {/* Quick Navigation to Category & Taxonomy Governance */}
      <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50/50 border border-orange-200/90 p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <FolderTree className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
              Looking for Product Types, Categories & Subcategories?
            </h3>
            <p className="text-[11px] text-slate-600">
              Manage product types (Chairs, Tables, Workstations), category lines, direct typing subcategories, lead times & MOQs.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCurrentView('categories')}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer self-start sm:self-auto"
        >
          <span>Open Category & Taxonomy Settings</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Compact Navigation Filter Tabs */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-2 sm:p-2.5 shadow-xs flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5">
          {[
            { id: 'all', label: 'All Settings', icon: Building2 },
            { id: 'factory', label: 'Factory Plant & Profile', icon: Factory },
            { id: 'hotlines', label: 'Hotlines & WhatsApp', icon: Phone },
            { id: 'logistics', label: 'Delivery & Logistics', icon: Truck },
            { id: 'banner', label: 'Storefront Banner', icon: Globe },
            { id: 'banking', label: 'Bank Details & Invoicing', icon: Landmark },
            { id: 'signature', label: 'Authorized Signature', icon: PenTool },
          ].map((tab) => {
            const isSelected = activeTab === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SettingsTab)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-orange-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {isDirty && (
          <span className="text-[11px] font-medium text-orange-600 flex items-center gap-1 shrink-0 px-2">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            Unsaved changes
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* SECTION 1: Factory Plant & Registered Office */}
        {(activeTab === 'all' || activeTab === 'factory') && (
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200/60 flex items-center justify-center text-[#EA580C]">
                  <Factory className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Factory Plant & Registered Office</h3>
                  <p className="text-[11px] text-slate-500">
                    Ambattur manufacturing facility profile, GST compliance & registered headquarters
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 hidden sm:inline-block">
                CIN: U36100TN2020PTC135890
              </span>
            </div>

            {/* Legal Name & GSTIN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1 uppercase tracking-wider">
                  Company Legal Entity Name <span className="text-orange-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Brothers Furniture"
                  className="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-1 focus:ring-orange-500/20 transition"
                />
                <span className="text-[10.5px] text-slate-400 mt-1 block">
                  Displayed on quotation letterheads, invoices & tax receipts.
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                    GSTIN Tax Identification <span className="text-orange-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleCopy(formData.gstin, 'gstin')}
                    className="text-[10.5px] text-slate-400 hover:text-slate-700 inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedField === 'gstin' ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedField === 'gstin' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <input
                  required
                  type="text"
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                  placeholder="33AAAAA0000A1Z5"
                  className="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-1 focus:ring-orange-500/20 transition uppercase"
                />
                <span className="text-[10.5px] text-slate-400 mt-1 block">
                  State code 33 (Tamil Nadu) compliant B2B tax identifier.
                </span>
              </div>
            </div>

            {/* Factory Location Tag */}
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1 uppercase tracking-wider">
                Industrial Zone & Regional Plant Description
              </label>
              <input
                type="text"
                value={formData.factoryLocation}
                onChange={(e) => setFormData({ ...formData, factoryLocation: e.target.value })}
                placeholder="Ambattur Industrial Zone, Chennai, Tamil Nadu"
                className="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-1 focus:ring-orange-500/20 transition"
              />
            </div>

            {/* Factory Plant Address Lines */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                  Factory Works Address (Itemized Lines)
                </label>
                <button
                  type="button"
                  onClick={handleAddAddressLine}
                  className="text-[11px] text-orange-600 hover:text-orange-700 font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add Line
                </button>
              </div>

              <div className="space-y-2">
                {formData.addressLines.map((line, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-400 w-5 text-right shrink-0">
                      #{idx + 1}
                    </span>
                    <input
                      type="text"
                      value={line}
                      onChange={(e) => handleAddressLineChange(idx, e.target.value)}
                      className="flex-1 bg-slate-50/70 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-1 focus:ring-orange-500/20 transition"
                    />
                    <button
                      type="button"
                      disabled={formData.addressLines.length <= 1}
                      onClick={() => handleRemoveAddressLine(idx)}
                      className={`p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer ${
                        formData.addressLines.length <= 1 ? 'opacity-30 cursor-not-allowed' : ''
                      }`}
                      title="Remove Address Line"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Google Maps Links & Embed */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-orange-600" />
                  Google Maps Coordinates & Embed Integration
                </span>
                <button
                  type="button"
                  onClick={() => setShowMapPreview(!showMapPreview)}
                  className="text-[11px] text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 cursor-pointer"
                >
                  {showMapPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showMapPreview ? 'Hide Map Preview' : 'Show Map Preview'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                      Google Maps Direct / CID Link
                    </label>
                    <a
                      href={formData.map.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10.5px] text-orange-600 hover:text-orange-700 font-semibold inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>Open Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <input
                    type="text"
                    value={formData.map.link}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        map: { ...formData.map, link: e.target.value },
                      })
                    }
                    className="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono focus:outline-none focus:border-orange-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1 uppercase tracking-wider">
                    Google Maps iframe Embed Source URL
                  </label>
                  <input
                    type="text"
                    value={formData.map.embed}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        map: { ...formData.map, embed: e.target.value },
                      })
                    }
                    className="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono focus:outline-none focus:border-orange-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Map Preview Iframe */}
              {showMapPreview && formData.map.embed && (
                <div className="mt-2 rounded-xl overflow-hidden border border-slate-200/90 shadow-2xs h-48 bg-slate-100">
                  <iframe
                    title="Brothers Furniture Factory Map Preview"
                    src={formData.map.embed}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION 2: Communication Hotlines & WhatsApp CRM */}
        {(activeTab === 'all' || activeTab === 'hotlines') && (
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Communication Hotlines & WhatsApp CRM</h3>
                  <p className="text-[11px] text-slate-500">
                    Direct sales contacts, customer support hotlines & WhatsApp click-to-chat settings
                  </p>
                </div>
              </div>
            </div>

            {/* Hotlines */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                    Primary Sales Hotline <span className="text-orange-500">*</span>
                  </label>
                  <a
                    href={`tel:${formData.phones[0]?.tel || ''}`}
                    className="text-[10.5px] text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-0.5"
                  >
                    <Phone className="w-2.5 h-2.5" /> Call Test
                  </a>
                </div>
                <input
                  required
                  type="text"
                  value={formData.phones[0]?.display || ''}
                  onChange={(e) => {
                    const newPhones = [...formData.phones]
                    newPhones[0] = {
                      display: e.target.value,
                      tel: e.target.value.replace(/[^0-9+]/g, ''),
                    }
                    setFormData({ ...formData, phones: newPhones })
                  }}
                  placeholder="+91 97907 40027"
                  className="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-medium text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white transition"
                />
                <span className="text-[10.5px] text-slate-400 mt-1 block">
                  Prominently featured in landing page navigation header and quotation documents.
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                    Secondary Customer Support Hotline
                  </label>
                  <a
                    href={`tel:${formData.phones[1]?.tel || ''}`}
                    className="text-[10.5px] text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-0.5"
                  >
                    <Phone className="w-2.5 h-2.5" /> Call Test
                  </a>
                </div>
                <input
                  type="text"
                  value={formData.phones[1]?.display || ''}
                  onChange={(e) => {
                    const newPhones = [...formData.phones]
                    newPhones[1] = {
                      display: e.target.value,
                      tel: e.target.value.replace(/[^0-9+]/g, ''),
                    }
                    setFormData({ ...formData, phones: newPhones })
                  }}
                  placeholder="+91 97100 02498"
                  className="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-medium text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white transition"
                />
                <span className="text-[10.5px] text-slate-400 mt-1 block">
                  Factory customer assistance and installation desk dispatch.
                </span>
              </div>
            </div>

            {/* Official Email */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                  Official Corporate Inquiries Email <span className="text-orange-500">*</span>
                </label>
                <a
                  href={`mailto:${formData.email}`}
                  className="text-[10.5px] text-slate-500 hover:text-slate-800 inline-flex items-center gap-1"
                >
                  <Mail className="w-3 h-3" /> Test Email
                </a>
              </div>
              <input
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="brothersfurniture91@gmail.com"
                className="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white transition"
              />
            </div>

            {/* WhatsApp Integration Block */}
            <div className="p-3.5 rounded-xl bg-emerald-50/40 border border-emerald-200/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-900">
                    WhatsApp Business Quick-Connect
                  </span>
                </div>
                <a
                  href={`https://wa.me/${formData.whatsapp.number}?text=${encodeURIComponent(
                    formData.whatsapp.message
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Test Inbound Link</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10.5px] font-semibold text-slate-700 block mb-1 uppercase tracking-wider">
                    WhatsApp Number (Numeric)
                  </label>
                  <input
                    type="text"
                    value={formData.whatsapp.number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        whatsapp: {
                          ...formData.whatsapp,
                          number: e.target.value.replace(/[^0-9]/g, ''),
                        },
                      })
                    }
                    placeholder="919790740027"
                    className="w-full bg-white border border-emerald-200 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-emerald-500 transition"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Include country code (e.g. 91).
                  </span>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10.5px] font-semibold text-slate-700 block mb-1 uppercase tracking-wider">
                    Pre-filled Customer WhatsApp Greeting
                  </label>
                  <textarea
                    rows={2}
                    value={formData.whatsapp.message}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        whatsapp: { ...formData.whatsapp, message: e.target.value },
                      })
                    }
                    placeholder="Hi Brothers Furniture, I am interested in your furniture collections..."
                    className="w-full bg-white border border-emerald-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 resize-none transition"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: Logistics & Delivery Rules */}
        {(activeTab === 'all' || activeTab === 'logistics') && (
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200/60 flex items-center justify-center text-sky-600">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Delivery Rules & Cart Thresholds</h3>
                  <p className="text-[11px] text-slate-500">
                    Complimentary delivery minimums, shipping surcharges & Chennai zone logistics
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1 uppercase tracking-wider">
                  Free Delivery Minimum Order (₹) <span className="text-orange-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-mono text-slate-400">₹</span>
                  <input
                    required
                    type="number"
                    min="0"
                    step="500"
                    value={formData.freeDeliveryThreshold}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        freeDeliveryThreshold: Math.max(0, Number(e.target.value)),
                      })
                    }
                    className="w-full bg-slate-50/70 border border-slate-200 rounded-lg pl-7 pr-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white transition"
                  />
                </div>
                <span className="text-[10.5px] text-slate-400 mt-1 block">
                  Orders meeting or exceeding this qualify for complimentary factory delivery and installation in Chennai.
                </span>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1 uppercase tracking-wider">
                  Standard Shipping Fee (₹) <span className="text-orange-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-mono text-slate-400">₹</span>
                  <input
                    required
                    type="number"
                    min="0"
                    step="100"
                    value={formData.standardDeliveryFee}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        standardDeliveryFee: Math.max(0, Number(e.target.value)),
                      })
                    }
                    className="w-full bg-slate-50/70 border border-slate-200 rounded-lg pl-7 pr-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white transition"
                  />
                </div>
                <span className="text-[10.5px] text-slate-400 mt-1 block">
                  Applied automatically to carts and quotations below the free delivery threshold.
                </span>
              </div>
            </div>

            {/* Interactive Logistics Simulator */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <span className="text-xs font-bold text-slate-900 block">
                Live Threshold Simulator
              </span>
              <p className="text-[11px] text-slate-500">
                Test how your shipping rules apply to different client quote amounts:
              </p>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-600">Simulate Order Value:</span>
                  <div className="relative w-36">
                    <span className="absolute left-2.5 top-1.5 text-xs font-mono text-slate-400">₹</span>
                    <input
                      type="number"
                      step="5000"
                      value={testOrderValue}
                      onChange={(e) => setTestOrderValue(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-lg pl-6 pr-2 py-1 text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-slate-500">Shipping Result:</span>
                  {calculatedDelivery === 0 ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                      FREE DELIVERY (₹0)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200">
                      +₹{calculatedDelivery.toLocaleString('en-IN')} STANDARD FEE
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: Landing Page Top Banner Announcement */}
        {(activeTab === 'all' || activeTab === 'banner') && (
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200/60 flex items-center justify-center text-purple-600">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Landing Page Announcement Strip</h3>
                  <p className="text-[11px] text-slate-500">
                    High-visibility top marquee alert on the Brothers Furniture customer website
                  </p>
                </div>
              </div>

              {/* Active Toggle Switch */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <span className="text-xs font-semibold text-slate-700">
                  {formData.isBannerActive ? 'Active' : 'Disabled'}
                </span>
                <div
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      isBannerActive: !prev.isBannerActive,
                    }))
                  }
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    formData.isBannerActive ? 'bg-[#F97316]' : 'bg-slate-200'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform absolute top-0.5 ${
                      formData.isBannerActive ? 'left-[22px]' : 'left-0.5'
                    }`}
                  />
                </div>
              </label>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1 uppercase tracking-wider">
                Marquee Announcement Text
              </label>
              <input
                type="text"
                value={formData.bannerAnnouncement}
                onChange={(e) => setFormData({ ...formData, bannerAnnouncement: e.target.value })}
                placeholder="Factory direct commercial supply: Free 2D CAD floor planning with bulk orders over ₹2 Lakhs."
                className="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition"
              />
              <span className="text-[10.5px] text-slate-400 mt-1 block">
                Highlighted in the uppermost announcement ticker of the public website.
              </span>
            </div>

            {/* Live Storefront Mockup Preview */}
            <div className="space-y-1.5 pt-1">
              <span className="text-xs font-bold text-slate-900 block">
                Live Storefront Marquee Simulation:
              </span>
              <div
                className={`rounded-lg px-4 py-2 text-center text-xs font-medium transition-all ${
                  formData.isBannerActive
                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-400 border border-dashed border-slate-300'
                }`}
              >
                {formData.isBannerActive
                  ? formData.bannerAnnouncement || 'No announcement message specified'
                  : '— Banner is currently hidden from public visitors —'}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 5: Corporate Bank Accounts & Payment Details */}
        {(activeTab === 'all' || activeTab === 'banking') && (
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600 shrink-0">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">Corporate Bank Accounts &amp; Remittance Details</h3>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80">
                      {bankAccounts.length} {bankAccounts.length === 1 ? 'Account' : 'Accounts'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Official company accounts printed on Tax Invoices and Commercial Fit-Out Proposals for RTGS / NEFT transfers
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenAddBank}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors shrink-0 cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Bank Account</span>
              </button>
            </div>

            {/* Bank Accounts Grid */}
            {bankAccounts.length === 0 ? (
              <div className="p-8 text-center bg-slate-50/70 border border-dashed border-slate-200 rounded-xl space-y-2">
                <CreditCard className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">No bank accounts registered yet</p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Add your primary business current account so bank RTGS and NEFT details automatically populate on client invoices.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddBank}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition cursor-pointer mt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register First Account</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {bankAccounts.map((account, index) => (
                  <div
                    key={account.id || index}
                    className={`rounded-xl border p-4 transition-all ${
                      account.isDefault
                        ? 'bg-blue-50/30 border-blue-300 ring-1 ring-blue-300/40 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-slate-900">{account.bankName}</h4>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                            {account.accountType || 'Current'}
                          </span>
                          {account.isDefault && (
                            <span className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Default for Invoices
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{account.accountName}</p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {!account.isDefault && (
                          <button
                            type="button"
                            onClick={() => handleSetDefaultBank(index)}
                            className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition cursor-pointer"
                            title="Set as default invoice account"
                          >
                            Make Default
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenEditBank(index)}
                          className="p-1 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                          title="Edit bank account"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBankAccount(index)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete bank account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 pt-3 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                          Account Number
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono font-bold text-slate-800 text-[11.5px]">
                            {account.accountNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(account.accountNumber, `acct-${index}`)}
                            className="text-slate-400 hover:text-slate-600 cursor-pointer"
                            title="Copy Account Number"
                          >
                            {copiedField === `acct-${index}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                          IFSC Code
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono font-bold text-slate-800 text-[11.5px]">
                            {account.ifscCode}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(account.ifscCode, `ifsc-${index}`)}
                            className="text-slate-400 hover:text-slate-600 cursor-pointer"
                            title="Copy IFSC"
                          >
                            {copiedField === `ifsc-${index}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>

                      {account.branch && (
                        <div className="col-span-2">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                            Branch
                          </span>
                          <p className="text-[11px] text-slate-600 mt-0.5">{account.branch}</p>
                        </div>
                      )}

                      {account.upiId && (
                        <div className="col-span-2">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                            UPI ID / VPA
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-[11px] text-purple-700 font-semibold">
                              {account.upiId}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(account.upiId!, `upi-${index}`)}
                              className="text-slate-400 hover:text-slate-600 cursor-pointer"
                              title="Copy UPI ID"
                            >
                              {copiedField === `upi-${index}` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SECTION 6: Official Authorized Signature & Stamp */}
        {(activeTab === 'all' || activeTab === 'signature' || activeTab === 'banking') && (
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200/60 flex items-center justify-center text-orange-600 shrink-0">
                  <PenTool className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">Official Authorized Signature &amp; Stamp</h3>
                    {formData.signatureUrl ? (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Signature Active
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80">
                        No Signature Uploaded
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Official digital signature or stamp automatically embedded on official Tax Invoices above the Authorized Signatory line
                  </p>
                </div>
              </div>

              <input
                ref={signatureInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleSignatureFileUpload}
              />

              <button
                type="button"
                onClick={() => signatureInputRef.current?.click()}
                disabled={isUploadingSignature}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs shadow-xs transition-colors shrink-0 cursor-pointer self-start sm:self-auto"
              >
                {isUploadingSignature ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading Signature...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>{formData.signatureUrl ? 'Change Signature Image' : 'Upload Signature Image'}</span>
                  </>
                )}
              </button>
            </div>

            {signatureUploadError && (
              <AlertBanner
                variant="danger"
                onDismiss={() => setSignatureUploadError(null)}
              >
                {signatureUploadError}
              </AlertBanner>
            )}

            {/* Signature Preview & Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              {/* Left Column: Signatory Preview Card (5 cols) */}
              <div className="md:col-span-5 bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-3">
                <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block">
                  Invoice Live Appearance Preview
                </span>
                
                {/* Visual simulation of the official invoice signature box */}
                <div className="border border-dashed border-slate-300 rounded-lg p-4 bg-white text-right min-h-[120px] flex flex-col justify-between shadow-2xs">
                  <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                    For {formData.name || 'Brothers Furniture'}
                  </div>

                  <div className="h-14 flex items-center justify-end my-1">
                    {formData.signatureUrl ? (
                      <img
                        src={formData.signatureUrl}
                        alt="Authorized Signatory"
                        className="max-h-14 max-w-[150px] object-contain ml-auto"
                      />
                    ) : (
                      <div className="text-center w-full py-2">
                        <span className="text-[10px] text-slate-400 italic">
                          (Signature will appear here)
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="border-t border-slate-400 w-40 ml-auto mb-1"></div>
                    <div className="text-[9.5px] font-bold text-slate-900 uppercase tracking-wider">
                      Authorized Signatory
                    </div>
                  </div>
                </div>

                {formData.signatureUrl && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500">Signature Stamp Active</span>
                    <button
                      type="button"
                      onClick={handleRemoveSignature}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded transition cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column: Upload Guideline & Direct Image URL (7 cols) */}
              <div className="md:col-span-7 space-y-3">
                <div className="p-3.5 bg-blue-50/50 border border-blue-200/70 rounded-xl space-y-1.5 text-xs text-blue-900">
                  <h4 className="font-bold flex items-center gap-1.5 text-blue-950">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    Signature Image Recommendations
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-[11.5px] text-blue-800 leading-relaxed">
                    <li>Use a high-resolution PNG image with a <strong>transparent background</strong> for best results.</li>
                    <li>Both handwritten signatures or corporate seal stamps can be uploaded.</li>
                    <li>Recommended size: <strong>300 × 120 pixels</strong> (Max 2MB).</li>
                    <li>Uploaded images are securely stored in Cloudflare R2 and synced to all invoices and PDFs automatically.</li>
                  </ul>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Signature Image URL (Cloudflare R2 or External)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      placeholder="https://pub-xxxx.r2.dev/signature.png"
                      value={formData.signatureUrl || ''}
                      onChange={(e) => setFormData({ ...formData, signatureUrl: e.target.value })}
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-orange-500"
                    />
                    {formData.signatureUrl && (
                      <button
                        type="button"
                        onClick={() => handleCopy(formData.signatureUrl!, 'sig-url')}
                        className="px-2.5 py-2 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                        title="Copy Signature URL"
                      >
                        {copiedField === 'sig-url' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. Sticky Bottom Action Bar */}
        <div className="sticky bottom-4 bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-200/90 shadow-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            {isDirty ? (
              <span className="text-orange-600 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                Unsaved modifications pending
              </span>
            ) : (
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                All configurations up to date
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isDirty && (
              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Discard
              </button>
            )}

            <button
              type="submit"
              className={`px-5 py-1.5 rounded-lg text-white font-semibold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                isSaved
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-[#F97316] hover:bg-[#EA580C]'
              }`}
            >
              {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span>{isSaved ? 'Saved Successfully!' : 'Save All Configurations'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Modal for Add / Edit Bank Account */}
      <Modal
        isOpen={bankModalOpen}
        onClose={() => setBankModalOpen(false)}
        title={editingBankIndex !== null ? 'Edit Corporate Bank Account' : 'Register Corporate Bank Account'}
        subtitle="Account details will appear in the Bank Details section of all generated Tax Invoices & Proposals"
      >
        <form onSubmit={handleSaveBankAccount} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Bank Name <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="text"
                value={bankForm.bankName}
                onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                placeholder="e.g. HDFC Bank, ICICI Bank, SBI"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Account Type
              </label>
              <select
                value={bankForm.accountType || 'Current'}
                onChange={(e) => setBankForm({ ...bankForm, accountType: e.target.value as 'Current' | 'Savings' })}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 font-medium"
              >
                <option value="Current">Current Account (Corporate / Business)</option>
                <option value="Savings">Savings Account</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700 block mb-1">
              Account Holder / Beneficiary Name <span className="text-rose-500">*</span>
            </label>
            <input
              required
              type="text"
              value={bankForm.accountName}
              onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })}
              placeholder="e.g. Brothers Furniture Industrial Solutions"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Account Number <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="text"
                value={bankForm.accountNumber}
                onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                placeholder="e.g. 50200084920194"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                IFSC Code <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="text"
                value={bankForm.ifscCode}
                onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value.toUpperCase() })}
                placeholder="e.g. HDFC0001849"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 outline-none focus:border-blue-500 uppercase"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700 block mb-1">
              Branch Name &amp; Address
            </label>
            <input
              type="text"
              value={bankForm.branch || ''}
              onChange={(e) => setBankForm({ ...bankForm, branch: e.target.value })}
              placeholder="e.g. Ambattur Industrial Estate Branch, Chennai - 600058"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700 block mb-1">
              UPI ID / VPA (Optional)
            </label>
            <input
              type="text"
              value={bankForm.upiId || ''}
              onChange={(e) => setBankForm({ ...bankForm, upiId: e.target.value.toLowerCase() })}
              placeholder="e.g. brothersfurniture@hdfcbank"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-purple-700 outline-none focus:border-blue-500"
            />
          </div>

          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={bankForm.isDefault}
                onChange={(e) => setBankForm({ ...bankForm, isDefault: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <span className="text-xs font-semibold text-slate-800">
                Set as default bank account on all Tax Invoices and Proposals
              </span>
            </label>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setBankModalOpen(false)}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
            >
              {editingBankIndex !== null ? 'Save Account Changes' : 'Add Bank Account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
