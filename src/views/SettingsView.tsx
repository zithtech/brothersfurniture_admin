import React, { useState, useEffect } from 'react'
import {
  ArrowRight,
  Building2,
  Check,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Factory,
  FolderTree,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Truck,
} from 'lucide-react'
import { AlertBanner } from '../components/common/AlertBanner'
import { useAdmin } from '../context/AdminContext'
import type { CompanySettings } from '../types/admin'

type SettingsTab = 'all' | 'factory' | 'hotlines' | 'logistics' | 'banner'

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, setCurrentView, confirm } = useAdmin()

  const [formData, setFormData] = useState<CompanySettings>(settings)
  const [activeTab, setActiveTab] = useState<SettingsTab>('all')
  const [isSaved, setIsSaved] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [showMapPreview, setShowMapPreview] = useState(true)

  // Test calculator state for shipping thresholds
  const [testOrderValue, setTestOrderValue] = useState<number>(35000)

  // Keep form data synchronized if global settings update externally
  useEffect(() => {
    setFormData(settings)
  }, [settings])

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
    </div>
  )
}
