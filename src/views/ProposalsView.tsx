import React, { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  FileEdit,
  FileSpreadsheet,
  FileText,
  Grid,
  Layers,
  List,
  Loader2,
  MapPin,
  MessageCircle,
  MoreVertical,
  Package,
  Phone,
  Plus,
  Printer,
  Receipt,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  Trash2,
  User,
} from 'lucide-react'
import { Drawer } from '../components/common/Drawer'
import { SearchableSelect } from '../components/common/SearchableSelect'
import { StatusDropdown } from '../components/common/StatusDropdown'
import { useAdmin } from '../context/AdminContext'
import type { Product, Proposal, ProposalItem, ProposalStatus } from '../types/admin'

export const ProposalsView: React.FC = () => {
  const {
    proposals,
    products,
    chairs,
    productTypes,
    typeCategoriesMap,
    categorySubcategoriesMap,
    addProposal,
    updateProposal,
    deleteProposal,
    updateProposalStatus,
    convertProposalToInvoice,
    generateProposalPdf,
    settings,
    confirm,
    setCurrentView,
  } = useAdmin()

  // View state
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table')
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingProposalId, setEditingProposalId] = useState<string | null>(null)
  const [copiedPropId, setCopiedPropId] = useState<string | null>(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null)
  const [actionMenuCoords, setActionMenuCoords] = useState<{ top: number; left: number } | null>(null)

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

  // Auto-generate official PDF in background if opening proposal without pdfUrl
  useEffect(() => {
    if (selectedProposal && !selectedProposal.pdfUrl && !isGeneratingPdf) {
      handleGenerateR2Pdf(selectedProposal)
    }
  }, [selectedProposal?.id])

  const handleGenerateR2Pdf = async (prop: Proposal) => {
    setIsGeneratingPdf(true)
    try {
      const url = await generateProposalPdf(prop.id, prop)
      if (url) {
        setSelectedProposal((prev) => (prev && prev.id === prop.id ? { ...prev, pdfUrl: url } : prev))
      }
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const handleDownloadPdf = async (prop: Proposal) => {
    setIsGeneratingPdf(true)
    try {
      let url = prop.pdfUrl
      if (!url) {
        const generated = await generateProposalPdf(prop.id, prop)
        if (generated) {
          url = generated
          setSelectedProposal((prev) => (prev && prev.id === prop.id ? { ...prev, pdfUrl: generated } : prev))
        }
      }

      const fileName = `${prop.proposalNumber || 'proposal'}.pdf`
      let downloaded = false

      // 1. Fetch blob from R2/PDF URL directly (creates local blob URL so browser downloads file directly)
      if (url) {
        try {
          const res = await fetch(url)
          if (res.ok) {
            const blob = await res.blob()
            const blobUrl = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = blobUrl
            link.download = fileName
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000)
            downloaded = true
          }
        } catch (e) {
          console.warn('Direct blob fetch failed, falling back to backend download...', e)
        }
      }

      // 2. Fetch from backend download endpoint
      if (!downloaded) {
        const backendBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
        const downloadApiUrl = `${backendBase}/proposals/${prop.id}/download-pdf`
        try {
          const res = await fetch(downloadApiUrl)
          if (res.ok) {
            const blob = await res.blob()
            const blobUrl = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = blobUrl
            link.download = fileName
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000)
            downloaded = true
          }
        } catch (e) {
          console.error('Backend endpoint download failed, triggering fallback...', e)
        }
      }

      // 3. Fallback: invisible iframe trigger with Content-Disposition: attachment (never opens new tab)
      if (!downloaded) {
        const backendBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
        const iframe = document.createElement('iframe')
        iframe.style.display = 'none'
        iframe.src = `${backendBase}/proposals/${prop.id}/download-pdf`
        document.body.appendChild(iframe)
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe)
          }
        }, 30000)
      }
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  // Metrics
  const totalProposalValue = proposals.reduce((sum, p) => sum + p.total, 0)
  const approvedCount = proposals.filter((p) => p.status === 'approved' || p.status === 'converted').length
  const sentCount = proposals.filter((p) => p.status === 'sent' || p.status === 'under_review').length
  const draftCount = proposals.filter((p) => p.status === 'draft').length

  // Filtered proposals
  const filteredProposals = useMemo(() => {
    return proposals.filter((p) => {
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        p.proposalNumber.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        (p.preparedFor && p.preparedFor.toLowerCase().includes(q)) ||
        (p.customerName && p.customerName.toLowerCase().includes(q)) ||
        (p.companyName && p.companyName.toLowerCase().includes(q)) ||
        (p.clientPhone && p.clientPhone.toLowerCase().includes(q)) ||
        (p.phone && p.phone.toLowerCase().includes(q)) ||
        (p.clientAddress && p.clientAddress.toLowerCase().includes(q)) ||
        (p.deliveryAddress && p.deliveryAddress.toLowerCase().includes(q)) ||
        p.items.some((it) => it.name.toLowerCase().includes(q) || it.category.toLowerCase().includes(q))
      return matchesStatus && matchesSearch
    })
  }, [proposals, statusFilter, searchQuery])

  // --- Dynamic Proposal Builder Form State ---
  const [clientForm, setClientForm] = useState<{
    title: string
    preparedFor: string
    phone: string
    address: string
    targetDeliveryDate: string
    validUntil: string
    discountPercent: number
    projectScope: string
    notes: string
    status: ProposalStatus
  }>({
    title: '',
    preparedFor: '',
    phone: '',
    address: '',
    targetDeliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    discountPercent: 0,
    projectScope: '',
    notes: '',
    status: 'draft',
  })

  // Selected filters for the item picker
  const [pickerType, setPickerType] = useState<string>('All')
  const [pickerCategory, setPickerCategory] = useState<string>('All')
  const [pickerSubCategory, setPickerSubCategory] = useState<string>('All')
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [showAllCatalogInProducts, setShowAllCatalogInProducts] = useState(false)

  // Draft items in the proposal builder (empty by default, dynamically added)
  const [builderItems, setBuilderItems] = useState<ProposalItem[]>([])
  const [lastAddedAlert, setLastAddedAlert] = useState<{ name: string; qty: number } | null>(null)

  // Map chair models to catalog products using standard chair types
  const CHAIR_TYPE_SUBCAT_MAP: Record<string, string> = {
    'high-back': 'Ergonomic Chairs',
    'medium-back': 'Task Chairs',
    'mesh-seat': 'Mesh Office Chairs',
    visitor: 'Staff Chairs',
  }

  // Unified Catalog (Products + Ergonomic Chairs)
  const allCatalogProducts = useMemo<Product[]>(() => {
    const chairProducts: Product[] = (chairs || []).map((c) => ({
      id: `chair-${c.id}`,
      sku: `BF-ERGO-${c.id.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase()}`,
      name: c.name,
      type: 'Chairs',
      category: 'Office Chairs',
      subCategory: CHAIR_TYPE_SUBCAT_MAP[c.type] || 'Ergonomic Chairs',
      price: c.basePrice || 18500,
      image: c.image || '/products/chairs/chair-placeholder.webp',
      description: c.features?.join(' • ') || 'Commercial ergonomic task chair with posture adjustment.',
      material: 'High-density foam, breathable mesh, alloy star base',
      dimensions: 'W 65 × D 65 × H 115–125 cm',
      inStock: c.inProduction !== false,
      featured: false,
      stockCount: 50,
      minOrderQuantity: 1,
      rating: 4.8,
      updatedAt: '2026-10-20T00:00:00Z',
    }))

    const catalog = [...products]
    for (const cp of chairProducts) {
      if (!catalog.some((item) => item.id === cp.id || item.name.toLowerCase() === cp.name.toLowerCase())) {
        catalog.push(cp)
      }
    }
    return catalog
  }, [products, chairs])

  // Filtered available categories dynamically based on pickerType
  const availableCategories = useMemo(() => {
    if (pickerType === 'All') {
      return Array.from(new Set(allCatalogProducts.map((p) => p.category).filter(Boolean)))
    }
    const taxonomyCats = typeCategoriesMap[pickerType] || []
    const catalogCats = allCatalogProducts
      .filter((p) => (p.type || '').toLowerCase() === pickerType.toLowerCase())
      .map((p) => p.category)
      .filter(Boolean)
    return Array.from(new Set([...taxonomyCats, ...catalogCats]))
  }, [pickerType, allCatalogProducts, typeCategoriesMap])

  // Filtered available sub-categories dynamically based on pickerCategory & pickerType
  const availableSubCategories = useMemo(() => {
    if (pickerCategory === 'All') {
      const pool = pickerType === 'All'
        ? allCatalogProducts
        : allCatalogProducts.filter((p) => (p.type || '').toLowerCase() === pickerType.toLowerCase())
      return Array.from(new Set(pool.map((p) => p.subCategory).filter(Boolean) as string[]))
    }
    const taxonomySubs = categorySubcategoriesMap[pickerCategory] || []
    const catalogSubs = allCatalogProducts
      .filter((p) => (p.category || '').toLowerCase() === pickerCategory.toLowerCase() && p.subCategory)
      .map((p) => p.subCategory as string)
    return Array.from(new Set([...taxonomySubs, ...catalogSubs]))
  }, [pickerType, pickerCategory, allCatalogProducts, categorySubcategoriesMap])

  // Dynamic filter matching Type, Category, Sub-Category
  const matchingCatalogProducts = useMemo(() => {
    return allCatalogProducts.filter((p) => {
      // 1. Type Match
      if (pickerType !== 'All') {
        const matchesType = (p.type || '').toLowerCase() === pickerType.toLowerCase()
        const isCatInType = (typeCategoriesMap[pickerType] || [])
          .some((cat) => cat.toLowerCase() === (p.category || '').toLowerCase())
        if (!matchesType && !isCatInType) return false
      }

      // 2. Category Match
      if (pickerCategory !== 'All') {
        if ((p.category || '').toLowerCase() !== pickerCategory.toLowerCase()) return false
      }

      // 3. Sub-Category Match
      if (pickerSubCategory !== 'All') {
        if ((p.subCategory || '').toLowerCase() !== pickerSubCategory.toLowerCase()) return false
      }

      return true
    })
  }, [allCatalogProducts, pickerType, pickerCategory, pickerSubCategory, typeCategoriesMap])

  // Memoized SearchableSelect Options
  const typeSelectOptions = useMemo(() => {
    return [
      { value: 'All', label: `All Types (${productTypes.length})` },
      ...productTypes.map((t) => ({ value: t, label: t })),
    ]
  }, [productTypes])

  const categorySelectOptions = useMemo(() => {
    return [
      { value: 'All', label: `All Categories (${availableCategories.length})` },
      ...availableCategories.map((c) => ({ value: c, label: c })),
    ]
  }, [availableCategories])

  const subCategorySelectOptions = useMemo(() => {
    return [
      { value: 'All', label: `All Sub-Categories (${availableSubCategories.length})` },
      ...availableSubCategories.map((s) => ({ value: s, label: s })),
    ]
  }, [availableSubCategories])

  const currentProductList = useMemo(() => {
    return showAllCatalogInProducts ? allCatalogProducts : matchingCatalogProducts
  }, [showAllCatalogInProducts, allCatalogProducts, matchingCatalogProducts])

  const productSelectOptions = useMemo(() => {
    const allIds = currentProductList.map((p) => p.id)
    const isAllSelected = allIds.length > 0 && allIds.every((id) => selectedProductIds.includes(id))

    return [
      {
        value: '__all__',
        label: `★ All Products (${currentProductList.length})`,
        description: isAllSelected
          ? `All ${currentProductList.length} products currently chosen`
          : `Click to choose all ${currentProductList.length} products at once`,
        badgeColor: 'bg-orange-600 text-white',
        initials: 'ALL',
      },
      ...currentProductList.map((p) => ({
        value: p.id,
        label: p.name,
        description: `₹${p.price.toLocaleString('en-IN')} • ${p.subCategory || p.category}`,
      })),
    ]
  }, [currentProductList, selectedProductIds])

  // Auto-fill logic: Auto-adds directly into proposal with default quantity = 1
  const handleAddProductToBuilder = (prod: Product) => {
    setBuilderItems((prev) => {
      const existingIdx = prev.findIndex((item) => item.productId === prod.id || item.name.toLowerCase() === prod.name.toLowerCase())
      if (existingIdx >= 0) {
        const copy = [...prev]
        const current = copy[existingIdx]
        const nextQty = (current.quantity || 1) + 1
        const unitPrice = current.unitPrice || 0
        const dPct = current.discountPercent || 0
        const gross = nextQty * unitPrice
        const dAmt = Math.round((gross * dPct) / 100)
        copy[existingIdx] = {
          ...current,
          quantity: nextQty,
          discountPercent: dPct,
          discountAmount: dAmt,
          total: Math.max(0, gross - dAmt),
        }
        setLastAddedAlert({ name: prod.name, qty: nextQty })
        return copy
      }

      // DEFAULT QUANTITY IS STRICTLY ONE (1)
      const newItem: ProposalItem = {
        id: `draft-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        productId: prod.id,
        name: prod.name,
        image: prod.image || (prod.images && prod.images[0]?.url) || '/products/chairs/chair-placeholder.webp',
        images: prod.images && prod.images.length > 0 ? prod.images.map((img) => img.url) : (prod.image ? [prod.image] : []),
        type: prod.type || 'Chairs',
        category: prod.category,
        subCategory: prod.subCategory || '',
        quantity: 1, // STRICTLY DEFAULT QUANTITY 1
        unitPrice: prod.price,
        discountPercent: 0,
        discountAmount: 0,
        total: prod.price * 1,
        material: prod.material || 'Commercial grade alloy & engineered materials',
        dimensions: prod.dimensions || 'Standard commercial dimensions',
        sku: prod.sku,
        notes: prod.description ? prod.description.substring(0, 80) + '...' : '',
      }
      setLastAddedAlert({ name: prod.name, qty: 1 })
      return [...prev, newItem]
    })
  }

  // Batch add selected products with default quantity = 1 each
  const handleAddSelectedProducts = () => {
    if (selectedProductIds.length === 0) return
    const prodsToAdd = allCatalogProducts.filter((p) => selectedProductIds.includes(p.id))
    if (prodsToAdd.length === 0) return

    prodsToAdd.forEach((prod) => handleAddProductToBuilder(prod))
    setLastAddedAlert({
      name: prodsToAdd.length === 1 ? prodsToAdd[0].name : `${prodsToAdd.length} products`,
      qty: prodsToAdd.length,
    })
    setSelectedProductIds([])
  }

  const handleUpdateItemProperty = (
    index: number,
    field: keyof ProposalItem,
    value: any
  ) => {
    setBuilderItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item
        const updated = { ...item, [field]: value }
        if (field === 'quantity' || field === 'unitPrice' || field === 'discountPercent') {
          const q = Number(field === 'quantity' ? value : updated.quantity) || 0
          const p = Number(field === 'unitPrice' ? value : updated.unitPrice) || 0
          const dPct = Math.max(0, Math.min(100, Number(field === 'discountPercent' ? value : updated.discountPercent) || 0))
          const gross = q * p
          const dAmt = Math.round((gross * dPct) / 100)
          updated.quantity = q
          updated.unitPrice = p
          updated.discountPercent = dPct
          updated.discountAmount = dAmt
          updated.total = Math.max(0, gross - dAmt)
        }
        return updated
      })
    )
  }

  const handleRemoveBuilderItem = (index: number) => {
    setBuilderItems((prev) => prev.filter((_, i) => i !== index))
  }

  // Builder Calculations
  const builderGrossSubtotal = builderItems.reduce((acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0)
  const builderRowDiscounts = builderItems.reduce((acc, it) => acc + (Number(it.discountAmount) || 0), 0)
  const builderSubtotalAfterRowDiscounts = Math.max(0, builderGrossSubtotal - builderRowDiscounts)
  const additionalDiscountAmount = Math.round((builderSubtotalAfterRowDiscounts * (Number(clientForm.discountPercent) || 0)) / 100)
  const totalDiscountAmount = builderRowDiscounts + additionalDiscountAmount
  const taxableAmount = Math.max(0, builderSubtotalAfterRowDiscounts - additionalDiscountAmount)
  const builderDeliveryFee = taxableAmount >= settings.freeDeliveryThreshold ? 0 : settings.standardDeliveryFee
  const taxAmount = Math.round(taxableAmount * 0.18) // 18% GST
  const builderGrandTotal = taxableAmount + builderDeliveryFee + taxAmount

  const handleOpenEditProposal = (prop: Proposal) => {
    setEditingProposalId(prop.id)
    setClientForm({
      title: prop.title || '',
      preparedFor: prop.preparedFor || prop.customerName || '',
      phone: prop.clientPhone || prop.phone || '',
      address: prop.clientAddress || prop.deliveryAddress || '',
      targetDeliveryDate: prop.targetDeliveryDate || new Date().toISOString().split('T')[0],
      validUntil: prop.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      discountPercent: Number(prop.discountPercent) || 0,
      projectScope: prop.projectScope || '',
      notes: prop.notes || '',
      status: prop.status || 'draft',
    })
    setBuilderItems(Array.isArray(prop.items) ? prop.items.map((it) => ({ ...it })) : [])
    setIsCreateModalOpen(true)
  }

  const handleOpenCreateProposal = () => {
    setEditingProposalId(null)
    setClientForm({
      title: '',
      preparedFor: '',
      phone: '',
      address: '',
      targetDeliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      discountPercent: 0,
      projectScope: '',
      notes: '',
      status: 'draft',
    })
    setBuilderItems([])
    setIsCreateModalOpen(true)
  }

  // Submit Proposal (Create or Update)
  const handleSaveProposal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (builderItems.length === 0) return

    const proposalTitle = clientForm.title.trim() || 'Commercial Fit-Out Scope'
    const preparedFor = clientForm.preparedFor.trim() || proposalTitle
    const clientPhone = clientForm.phone.trim()
    const clientAddress = clientForm.address.trim() || 'Direct Site Delivery (Chennai)'

    if (editingProposalId) {
      const updatePayload: Partial<Proposal> = {
        title: proposalTitle,
        preparedFor,
        customerName: preparedFor,
        phone: clientPhone,
        clientPhone,
        deliveryAddress: clientAddress,
        clientAddress,
        targetDeliveryDate: clientForm.targetDeliveryDate,
        validUntil: clientForm.validUntil,
        status: clientForm.status || 'draft',
        items: builderItems,
        subtotal: builderGrossSubtotal,
        discountPercent: Number(clientForm.discountPercent) || 0,
        discountAmount: totalDiscountAmount,
        deliveryFee: builderDeliveryFee,
        taxRate: 18,
        taxAmount,
        total: builderGrandTotal,
        notes: clientForm.notes,
        projectScope: clientForm.projectScope,
      }
      updateProposal(editingProposalId, updatePayload)
      if (selectedProposal?.id === editingProposalId) {
        setSelectedProposal((prev) => (prev ? { ...prev, ...updatePayload } : null))
      }
      setIsCreateModalOpen(false)
      setEditingProposalId(null)
      return
    }

    const newProposal = await addProposal({
      title: proposalTitle,
      preparedFor: preparedFor,
      customerName: preparedFor,
      companyName: undefined,
      phone: clientPhone,
      clientPhone: clientPhone,
      email: '',
      clientGstin: undefined,
      deliveryAddress: clientAddress,
      clientAddress: clientAddress,
      targetDeliveryDate: clientForm.targetDeliveryDate,
      validUntil: clientForm.validUntil,
      status: clientForm.status || 'draft',
      items: builderItems,
      subtotal: builderGrossSubtotal,
      discountPercent: Number(clientForm.discountPercent) || 0,
      discountAmount: totalDiscountAmount,
      deliveryFee: builderDeliveryFee,
      taxRate: 18,
      taxAmount,
      total: builderGrandTotal,
      notes: clientForm.notes,
      projectScope: clientForm.projectScope,
      termsAndConditions: [
        '50% advance on PO confirmation; 50% prior to dispatch from Ambattur factory.',
        'Prices inclusive of delivery, on-site assembly and 3D CAD space validation in Chennai.',
        'Includes 5-year comprehensive manufacturer warranty on metal frames and mechanisms.',
        'Validity: 30 days from proposal date.',
      ],
    })

    setIsCreateModalOpen(false)
    setClientForm({
      title: '',
      preparedFor: '',
      phone: '',
      address: '',
      targetDeliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      discountPercent: 0,
      projectScope: '',
      notes: '',
      status: 'draft',
    })
    setBuilderItems([])
    setSelectedProposal(newProposal)
  }

  const handleDeleteProposal = async (prop: Proposal) => {
    const ok = await confirm({
      title: `Delete Proposal #${prop.proposalNumber}?`,
      message: `Are you sure you want to delete "${prop.title}" for ${prop.customerName}? Value: ₹${prop.total.toLocaleString('en-IN')}.`,
      confirmText: 'Delete Proposal',
      variant: 'danger',
      icon: 'trash',
      badge: prop.proposalNumber,
    })
    if (ok) {
      deleteProposal(prop.id)
      if (selectedProposal?.id === prop.id) setSelectedProposal(null)
    }
  }

  const handleConvertProposal = (proposal: Proposal) => {
    const invoice = convertProposalToInvoice(proposal.id)
    if (invoice) {
      setSelectedProposal(null)
      setCurrentView('invoices')
    }
  }

  const copyRefToClipboard = (ref: string) => {
    navigator.clipboard.writeText(ref)
    setCopiedPropId(ref)
    setTimeout(() => setCopiedPropId(null), 2000)
  }


  if (selectedProposal) {
    return (
      <div className="space-y-4">
        {/* Dedicated PDF Top Navigation & Action Bar (Clean White Theme & Fully Responsive) */}
        <div className="bg-white text-slate-900 rounded-2xl p-3 sm:p-5 shadow-xs border border-slate-200/90 flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 print:hidden">
          {/* Left: Back button + Title & Status */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={() => setSelectedProposal(null)}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/90 text-slate-700 hover:text-slate-900 border border-slate-200/80 transition cursor-pointer flex items-center gap-1.5 sm:gap-2 text-xs font-semibold shrink-0 active:scale-95"
              title="Return to Proposals List"
            >
              <ArrowLeft className="w-4 h-4 text-orange-600" />
              <span className="hidden xs:inline">Back</span>
            </button>
            <div className="h-6 w-px bg-slate-200 hidden xs:block" />
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono font-bold">
                <FileText className="w-3.5 h-3.5 text-rose-600" />
                <span>{selectedProposal.proposalNumber}</span>
              </span>

              {/* Enhanced Status Selector */}
              <StatusDropdown
                value={selectedProposal.status}
                size="sm"
                onChange={(newStatus) => {
                  updateProposalStatus(selectedProposal.id, newStatus)
                  setSelectedProposal((prev) => (prev ? { ...prev, status: newStatus } : null))
                }}
              />
            </div>
          </div>

          {/* Right: Primary Actions (Fully Responsive Toolbar) */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap w-full lg:w-auto">
            {/* DOWNLOAD PDF BUTTON */}
            <button
              onClick={() => handleDownloadPdf(selectedProposal)}
              disabled={isGeneratingPdf}
              className="flex-1 sm:flex-initial justify-center px-3 sm:px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-60 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold shadow-2xs transition inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Download official PDF to device"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
                  <span>Preparing...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Download<span className="hidden sm:inline"> PDF</span></span>
                </>
              )}
            </button>

            {/* Convert to Invoice Button */}
            {selectedProposal.status !== 'converted' ? (
              <button
                onClick={() => handleConvertProposal(selectedProposal)}
                className="flex-1 sm:flex-initial justify-center px-3 sm:px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold shadow-2xs transition inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Receipt className="w-3.5 h-3.5 text-slate-600" />
                <span>Convert<span className="hidden sm:inline"> to Invoice</span></span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setSelectedProposal(null)
                  setCurrentView('invoices')
                }}
                className="flex-1 sm:flex-initial justify-center px-3 sm:px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-600" />
                <span>View Invoice</span>
              </button>
            )}

            {/* Print / Save PDF Button */}
            <button
              onClick={() => window.print()}
              className="flex-1 sm:flex-initial justify-center px-3 sm:px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold border border-slate-200 transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
              title="Print Document"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print</span>
            </button>

            {/* WhatsApp Share */}
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `Brothers Furniture (Ambattur Industrial Estate) Commercial Fit-out Proposal Ref *${selectedProposal.proposalNumber}* for *₹${selectedProposal.total.toLocaleString(
                  'en-IN'
                )}*.\n\nProject Scope: ${selectedProposal.title}\nLine Items: ${selectedProposal.items.length} products (${selectedProposal.items.reduce((s, i) => s + i.quantity, 0)} units).\n\nValidity: ${selectedProposal.validUntil}${selectedProposal.pdfUrl ? `\n\nView Proposal PDF: ${selectedProposal.pdfUrl}` : ''}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial justify-center px-3 sm:px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold shadow-2xs transition inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Share via WhatsApp"
            >
              <Send className="w-3.5 h-3.5 text-slate-600" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

        {/* PDF VIEWPORT CONTAINER (WHITE THEME - EXACT PDF FEEL) */}
        {selectedProposal.pdfUrl ? (
          /* EXACT NATIVE BROWSER PDF VIEWER EMBED IN CLEAN WHITE FRAME */
          <div className="w-full rounded-2xl overflow-hidden shadow-xs border border-slate-200 bg-white">
            <iframe
              src={`${selectedProposal.pdfUrl}#toolbar=1&navpanes=0`}
              title={`Proposal ${selectedProposal.proposalNumber}`}
              className="w-full h-[88vh] min-h-[780px] border-0 bg-white"
            />
          </div>
        ) : isGeneratingPdf ? (
          <div className="w-full rounded-2xl bg-white border border-slate-200 p-12 flex flex-col items-center justify-center text-center shadow-xs min-h-[600px]">
            <Loader2 className="w-10 h-10 text-orange-600 animate-spin mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-1">Loading Official Proposal PDF...</h3>
            <p className="text-slate-500 text-xs max-w-md">
              Compiling pixel-perfect A4 document with high-resolution specifications and chair imagery...
            </p>
          </div>
        ) : (
          <div className="w-full rounded-2xl bg-white border border-slate-200 p-8 sm:p-14 flex flex-col items-center justify-center text-center shadow-xs min-h-[580px]">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 mb-4">
              <FileText className="w-8 h-8 text-orange-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Official Fit-Out Proposal PDF</h3>
            <p className="text-slate-500 text-xs sm:text-sm max-w-lg mb-6 leading-relaxed">
              Click below to stream the official commercial proposal document directly.
            </p>
            <button
              onClick={() => handleGenerateR2Pdf(selectedProposal)}
              disabled={isGeneratingPdf}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600 disabled:opacity-60 text-white font-bold text-sm shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Load Proposal PDF</span>
            </button>
          </div>
        )}
      </div>
    )
  }

  const activeActionProp = proposals.find((p) => p.id === openActionMenuId)

  return (
    <div className="space-y-4">
      {/* 1. Top Header & Metrics Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-0.5">
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <h1 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-1.5 sm:gap-2">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 shrink-0" />
              <span>Commercial Proposals & Estimates</span>
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              <FileSpreadsheet className="w-3 h-3 text-slate-500" />
              {proposals.length} Proposals
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {approvedCount} Approved
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
              {sentCount} Active
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold bg-orange-50 text-orange-800 border border-orange-200 shadow-2xs">
              ₹{(totalProposalValue / 100000).toFixed(1)}L Pipeline
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Craft attractive B2B office fit-out proposals with rich product images, tiered categories, and 1-click tax invoice conversion.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setCurrentView('invoices')}
            className="flex-1 sm:flex-initial justify-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5 text-slate-500" />
            <span>View Invoices</span>
          </button>
          <button
            onClick={handleOpenCreateProposal}
            className="flex-1 sm:flex-initial justify-center inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Draft Proposal</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Bar & View Switcher */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-2.5 sm:p-3 shadow-xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 max-w-full">
            {[
              { id: 'all', label: `All Proposals (${proposals.length})` },
              { id: 'sent', label: `Sent (${proposals.filter((p) => p.status === 'sent').length})` },
              { id: 'approved', label: `Approved (${proposals.filter((p) => p.status === 'approved').length})` },
              { id: 'converted', label: `Converted (${proposals.filter((p) => p.status === 'converted').length})` },
              { id: 'draft', label: `Drafts (${draftCount})` },
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

          {/* Search & View Switcher */}
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search proposal, client, item..."
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

      {/* 3. Proposals Table or Cards */}
      {filteredProposals.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center space-y-3 shadow-xs">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
          <h4 className="text-sm sm:text-base font-bold text-slate-900">No proposals found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No proposal matched your criteria. You can clear filters or draft a brand new commercial proposal.
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
              onClick={handleOpenCreateProposal}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-2xs cursor-pointer inline-flex items-center gap-1.5 active:scale-95"
            >
              <Plus className="w-3 h-3" /> Draft Commercial Proposal
            </button>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW WITH PRODUCT THUMBNAILS */
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3.5">Proposal Ref & Date</th>
                  <th className="py-2.5 px-3.5">Project Scope Title</th>
                  <th className="py-2.5 px-3.5">Proposal For / Client Details</th>
                  <th className="py-2.5 px-3.5">Visual Scope & Products</th>
                  <th className="py-2.5 px-3.5">Commercial Value</th>
                  <th className="py-2.5 px-3.5">Proposal Status</th>
                  <th className="py-2.5 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredProposals.map((prop) => {
                  const totalUnits = prop.items.reduce((sum, it) => sum + it.quantity, 0)

                  return (
                    <tr
                      key={prop.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setSelectedProposal(prop)}
                    >
                      {/* Ref & Date */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900 text-xs block">
                            {prop.proposalNumber}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              copyRefToClipboard(prop.proposalNumber)
                            }}
                            className="text-slate-400 hover:text-slate-600 transition p-0.5 rounded cursor-pointer"
                            title="Copy Ref"
                          >
                            {copiedPropId === prop.proposalNumber ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <span className="text-[10.5px] text-slate-400 block mt-0.5">
                          Issued: {prop.createdAt.split('T')[0]}
                        </span>
                        <span className="text-[10px] text-blue-600 font-medium block">
                          Valid: {prop.validUntil}
                        </span>
                      </td>

                      {/* Project Scope Info */}
                      <td className="py-2.5 px-3.5">
                        <div className="min-w-0 max-w-[240px]">
                          <span className="font-bold text-slate-900 text-xs sm:text-[13px] block truncate">
                            {prop.title || 'Commercial Fit-Out Scope'}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium block truncate mt-0.5">
                            {prop.items.length} product specification{prop.items.length === 1 ? '' : 's'} ({totalUnits} units)
                          </span>
                          <span className="text-[10.5px] text-blue-600 block truncate font-mono mt-0.5">
                            Handover: {prop.targetDeliveryDate || 'Within 14 business days'}
                          </span>
                        </div>
                      </td>

                      {/* Proposal For / Client Details */}
                      <td className="py-2.5 px-3.5">
                        <div className="min-w-0 max-w-[220px]">
                          <span className="font-bold text-slate-900 text-xs block truncate flex items-center gap-1">
                            <User className="w-3 h-3 text-orange-500 shrink-0" />
                            <span className="truncate">{prop.preparedFor || prop.customerName || 'Direct Client'}</span>
                          </span>
                          {(prop.clientPhone || prop.phone) ? (
                            <span className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5 truncate font-mono">
                              <Phone className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                              <span className="truncate">{prop.clientPhone || prop.phone}</span>
                            </span>
                          ) : null}
                          {(prop.clientAddress || prop.deliveryAddress) ? (
                            <span className="text-[10.5px] text-slate-500 flex items-center gap-1 mt-0.5 truncate" title={prop.clientAddress || prop.deliveryAddress}>
                              <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                              <span className="truncate">{prop.clientAddress || prop.deliveryAddress}</span>
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Line Items with Visual Thumbnails */}
                      <td className="py-2.5 px-3.5">
                        <div className="flex items-center gap-2 max-w-[320px]">
                          {/* Image stack preview */}
                          <div className="flex -space-x-2 overflow-hidden shrink-0">
                            {prop.items.slice(0, 3).map((it, idx) => (
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
                              {prop.items[0]?.name}
                              {prop.items.length > 1 && ` + ${prop.items.length - 1} more`}
                            </span>
                            <span className="text-[10.5px] text-slate-500 block truncate">
                              {totalUnits} units • {prop.items.map((i) => i.category).slice(0, 2).join(', ')}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Commercial Value */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-900 text-xs sm:text-[13px] block">
                          ₹{prop.total.toLocaleString('en-IN')}
                        </span>
                        {prop.discountAmount ? (
                          <span className="text-[10px] text-emerald-600 font-medium block">
                            Includes ₹{prop.discountAmount.toLocaleString('en-IN')} fit-out discount
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 block">
                            Standard Ambattur direct rate
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <StatusDropdown
                          value={prop.status}
                          size="sm"
                          align="right"
                          onChange={(newStatus) => updateProposalStatus(prop.id, newStatus)}
                        />
                      </td>

                      {/* Actions (3-Dot Dropdown Menu) */}
                      <td className="py-2.5 px-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block text-left">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (openActionMenuId === prop.id) {
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
                                setOpenActionMenuId(prop.id)
                              }
                            }}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              openActionMenuId === prop.id
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
          {activeActionProp && actionMenuCoords &&
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
                      handleOpenEditProposal(activeActionProp)
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <FileEdit className="w-3.5 h-3.5 text-slate-500" />
                    <span>Edit Proposal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOpenActionMenuId(null)
                      setActionMenuCoords(null)
                      setSelectedProposal(activeActionProp)
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-orange-500" />
                    <span>View Proposal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOpenActionMenuId(null)
                      setActionMenuCoords(null)
                      handleDownloadPdf(activeActionProp)
                    }}
                    disabled={isGeneratingPdf}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Download PDF</span>
                  </button>
                </div>

                <div className="py-1">
                  {activeActionProp.status !== 'converted' && (
                    <button
                      type="button"
                      onClick={() => {
                        setOpenActionMenuId(null)
                        setActionMenuCoords(null)
                        handleConvertProposal(activeActionProp)
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Receipt className="w-3.5 h-3.5 text-purple-600" />
                      <span>Convert to Invoice</span>
                    </button>
                  )}

                  <a
                    href={`https://wa.me/${(activeActionProp.clientPhone || activeActionProp.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      `Greetings ${activeActionProp.preparedFor || activeActionProp.customerName},\n\nBrothers Furniture (Ambattur Industrial Estate) has prepared your commercial fit-out proposal ref *${activeActionProp.proposalNumber}* for *₹${activeActionProp.total.toLocaleString(
                        'en-IN'
                      )}*.\n\nItems included:\n${activeActionProp.items
                        .map((it) => `• ${it.name} (Qty: ${it.quantity})`)
                        .join('\n')}\n\nOur executive will coordinate with you for layout validation.`
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
                    <span>Share via WhatsApp</span>
                  </a>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenActionMenuId(null)
                      setActionMenuCoords(null)
                      handleDeleteProposal(activeActionProp)
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>Delete Proposal</span>
                  </button>
                </div>
              </div>,
              document.body
            )}
        </div>
      ) : (
        /* CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredProposals.map((prop) => {
            return (
              <div
                key={prop.id}
                className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs hover:border-orange-300 hover:shadow-sm transition-all space-y-3 flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-900 text-xs">
                        {prop.proposalNumber}
                      </span>
                      <button
                        onClick={() => copyRefToClipboard(prop.proposalNumber)}
                        className="text-slate-400 hover:text-slate-600 transition p-0.5 rounded cursor-pointer"
                        title="Copy Ref"
                      >
                        {copiedPropId === prop.proposalNumber ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    <div onClick={(e) => e.stopPropagation()}>
                      <StatusDropdown
                        value={prop.status}
                        size="sm"
                        align="right"
                        onChange={(newStatus) => updateProposalStatus(prop.id, newStatus)}
                      />
                    </div>
                  </div>

                  {/* Title & Client */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-orange-600 transition">
                      {prop.title}
                    </h3>
                    <div className="mt-1 space-y-0.5 text-xs text-slate-600">
                      <p className="font-semibold text-slate-800 truncate flex items-center gap-1">
                        <User className="w-3 h-3 text-orange-500 shrink-0" />
                        <span>For: {prop.preparedFor || prop.customerName || 'Direct Client'}</span>
                      </p>
                      {(prop.clientPhone || prop.phone) ? (
                        <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{prop.clientPhone || prop.phone}</span>
                        </p>
                      ) : null}
                      {(prop.clientAddress || prop.deliveryAddress) ? (
                        <p className="text-[11px] text-slate-500 truncate flex items-center gap-1" title={prop.clientAddress || prop.deliveryAddress}>
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{prop.clientAddress || prop.deliveryAddress}</span>
                        </p>
                      ) : null}
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium mt-1 truncate flex items-center gap-1">
                      <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                      Scope: {prop.items.length} items &bull; Valid: {prop.validUntil}
                    </p>
                  </div>

                  {/* Visual Products Strip with Product Images */}
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/80 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Scope ({prop.items.length} Products)
                    </span>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {prop.items.map((it, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          <img
                            src={it.image}
                            alt={it.name}
                            className="w-8 h-8 rounded-md object-cover bg-white border border-slate-200 shrink-0"
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&w=150&q=70'
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <span className="font-medium text-slate-800 truncate block">
                              {it.name}
                            </span>
                            <span className="text-[10.5px] text-slate-400 block">
                              Qty: <strong>{it.quantity}</strong> • ₹{it.unitPrice.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Commercial Value */}
                  <div className="pt-1 flex items-center justify-between border-t border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                        Net Commercial Quote
                      </span>
                      <span className="font-mono font-bold text-base text-slate-900 block text-orange-600">
                        ₹{prop.total.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <span className="text-[11px] text-blue-600 font-mono font-medium">
                      Valid: {prop.validUntil}
                    </span>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedProposal(prop)}
                      className="text-xs text-orange-600 hover:text-orange-700 font-semibold inline-flex items-center gap-1 cursor-pointer transition"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                    <button
                      onClick={() => handleOpenEditProposal(prop)}
                      className="text-xs text-slate-600 hover:text-slate-900 font-semibold inline-flex items-center gap-1 cursor-pointer transition"
                      title="Edit Proposal"
                    >
                      <FileEdit className="w-3.5 h-3.5 text-slate-500" /> Edit
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    {prop.status !== 'converted' && (
                      <button
                        onClick={() => handleConvertProposal(prop)}
                        className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-md transition-colors cursor-pointer text-[11px] font-semibold inline-flex items-center gap-1"
                        title="Convert to Tax Invoice"
                      >
                        <Receipt className="w-3 h-3" /> Convert
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteProposal(prop)}
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

      {/* 4. DRAFT PROPOSAL SLIDE-OVER DRAWER (WITH RICH PRODUCT SELECTOR) */}
      <Drawer
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          setEditingProposalId(null)
        }}
        title={editingProposalId ? `Edit Proposal (${proposals.find(p => p.id === editingProposalId)?.proposalNumber || ''})` : "Draft Commercial Fit-Out Proposal"}
        subtitle={editingProposalId ? "Update line items, pricing, client details and terms for this commercial proposal" : "Build an itemized enterprise furniture proposal with rich images and automatic product auto-fill"}
        maxWidth="max-w-2xl sm:max-w-3xl lg:max-w-4xl xl:max-w-5xl"
      >
        <form onSubmit={handleSaveProposal} className="space-y-4">
          {/* Proposal Specification Header */}
          <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-orange-500" />
              Commercial Fit-Out Proposal Specifications
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Proposal Title / Project Scope <span className="text-orange-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={clientForm.title}
                  onChange={(e) => setClientForm({ ...clientForm, title: e.target.value })}
                  placeholder="e.g. Executive Workstations & Ergonomic Seating Scope"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Proposal Validity Date
                </label>
                <input
                  type="date"
                  value={clientForm.validUntil}
                  onChange={(e) => setClientForm({ ...clientForm, validUntil: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Initial Status
                </label>
                <StatusDropdown
                  value={clientForm.status}
                  size="sm"
                  onChange={(newStatus) => setClientForm({ ...clientForm, status: newStatus })}
                />
              </div>
            </div>
          </div>

          {/* Proposal For Details (Client Name, Phone Number, Address) */}
          <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-orange-500" />
                Proposal For Details
              </h4>
              <span className="text-[10px] text-slate-400 font-medium">Customer / Client Information</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Prepared For / Client <span className="text-orange-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={clientForm.preparedFor}
                  onChange={(e) => setClientForm({ ...clientForm, preparedFor: e.target.value })}
                  placeholder="e.g. Acme Tech Solutions / Rajesh Kumar"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Number
                </label>
                <input
                  type="tel"
                  value={clientForm.phone}
                  onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Address
                </label>
                <textarea
                  rows={2}
                  value={clientForm.address}
                  onChange={(e) => setClientForm({ ...clientForm, address: e.target.value })}
                  placeholder="e.g. 4th Floor, Phase 2, TIDEL Park, Rajiv Gandhi Salai, Taramani, Chennai, Tamil Nadu 600113"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition resize-none"
                />
              </div>
            </div>
          </div>

          {/* PRODUCT PICKER BAR (TYPE > CATEGORY > SUB-CATEGORY > CHOOSE PRODUCT + ADD BUTTON) */}
          <div className="p-3.5 bg-gradient-to-r from-orange-50/80 to-amber-50/50 rounded-xl border border-orange-200/80 space-y-3 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-orange-600" />
                  Product Catalog Selector
                </h4>
                <p className="text-[11px] text-slate-600">
                  Select <strong>Type</strong> &rarr; <strong>Category</strong> &rarr; <strong>Sub-category</strong> &rarr; <strong>Choose Product</strong>, then click <strong>Add</strong>.
                </p>
              </div>
              {matchingCatalogProducts.length === 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setPickerType('All')
                    setPickerCategory('All')
                    setPickerSubCategory('All')
                    setSelectedProductIds([])
                  }}
                  className="text-[11px] font-bold text-orange-600 hover:text-orange-700 underline cursor-pointer shrink-0"
                >
                  Reset Filters
                </button>
              )}
            </div>

            {/* Tier 1: 3 Cascaded Taxonomy Filters (Type -> Category -> Sub-Category) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 1. Type */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  1. Product Type
                </label>
                <SearchableSelect
                  value={pickerType}
                  onChange={(val) => {
                    setPickerType(val)
                    setPickerCategory('All')
                    setPickerSubCategory('All')
                    setSelectedProductIds([])
                  }}
                  options={typeSelectOptions}
                  clearable={false}
                  placeholder="Select Type..."
                  searchPlaceholder="Search product type..."
                  accentColor="orange"
                />
              </div>

              {/* 2. Category */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  2. Category
                </label>
                <SearchableSelect
                  value={pickerCategory}
                  onChange={(val) => {
                    setPickerCategory(val)
                    setPickerSubCategory('All')
                    setSelectedProductIds([])
                  }}
                  options={categorySelectOptions}
                  clearable={false}
                  placeholder="Select Category..."
                  searchPlaceholder="Search category..."
                  accentColor="orange"
                />
              </div>

              {/* 3. Sub-Category */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  3. Sub-Category
                </label>
                <SearchableSelect
                  value={pickerSubCategory}
                  onChange={(val) => {
                    setPickerSubCategory(val)
                    setSelectedProductIds([])
                  }}
                  options={subCategorySelectOptions}
                  clearable={false}
                  placeholder="Select Sub-Category..."
                  searchPlaceholder="Search sub-category..."
                  accentColor="orange"
                />
              </div>
            </div>

            {/* Tier 2: Dedicated Hero Card for Choose Products */}
            <div className="p-3 bg-white/95 rounded-xl border border-orange-200/90 shadow-2xs space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11.5px] font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#EA580C] text-white font-bold text-[10px] flex items-center justify-center shadow-2xs">
                      4
                    </span>
                    Choose Products
                  </span>
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                    {currentProductList.length} products available
                  </span>
                  {selectedProductIds.length > 0 && (
                    <span className="text-[10.5px] font-bold text-orange-800 bg-orange-100 px-2.5 py-0.5 rounded-full border border-orange-300 animate-fadeIn">
                      {selectedProductIds.length} selected
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      const allIds = currentProductList.map((p) => p.id)
                      const isAllSelected = allIds.length > 0 && allIds.every((id) => selectedProductIds.includes(id))
                      setSelectedProductIds(isAllSelected ? [] : allIds)
                    }}
                    className="font-bold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    {selectedProductIds.length > 0 &&
                    currentProductList.length > 0 &&
                    currentProductList.every((p) => selectedProductIds.includes(p.id)) ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 text-orange-600" />
                        <span>Deselect All</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 text-orange-600 stroke-[3]" />
                        <span>Select All ({currentProductList.length})</span>
                      </>
                    )}
                  </button>

                  {(pickerType !== 'All' || pickerCategory !== 'All' || pickerSubCategory !== 'All') && (
                    <>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setShowAllCatalogInProducts(!showAllCatalogInProducts)}
                        className={`font-semibold cursor-pointer text-[10.5px] px-2 py-0.5 rounded transition ${
                          showAllCatalogInProducts
                            ? 'bg-orange-50 text-orange-700 font-bold border border-orange-200'
                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                        }`}
                        title="Toggle view between filtered subset and full catalog"
                      >
                        {showAllCatalogInProducts ? 'Showing All Catalog' : 'View All Catalog'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Full-width Searchable Dropdown & Add Button */}
              <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                <div className="flex-1 min-w-0">
                  <SearchableSelect
                    isMulti={true}
                    multiValue={selectedProductIds}
                    onMultiChange={setSelectedProductIds}
                    options={productSelectOptions}
                    clearable={true}
                    placeholder={
                      currentProductList.length > 0
                        ? `Search and select products (${currentProductList.length} available)...`
                        : 'No products available'
                    }
                    searchPlaceholder="Type product name, category, or SKU..."
                    footerCountLabel="products"
                    accentColor="orange"
                    disabled={currentProductList.length === 0}
                  />
                </div>

                <button
                  type="button"
                  disabled={selectedProductIds.length === 0}
                  onClick={handleAddSelectedProducts}
                  className="h-[40px] px-5 bg-gradient-to-r from-[#EA580C] to-[#C2410C] hover:from-[#C2410C] hover:to-[#9A3412] text-white text-xs font-bold rounded-xl shadow-xs transition disabled:bg-slate-200 disabled:text-slate-400 disabled:from-slate-200 disabled:to-slate-200 disabled:cursor-not-allowed cursor-pointer shrink-0 inline-flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>
                    Add to Proposal {selectedProductIds.length > 0 ? `(${selectedProductIds.length})` : ''}
                  </span>
                </button>
              </div>
            </div>

            {/* Instant feedback strip */}
            {lastAddedAlert && (
              <div className="pt-1 border-t border-orange-200/60 flex items-center justify-between">
                <div className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[11px] font-medium flex items-center gap-1.5 animate-fadeIn">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>
                    Added <strong>{lastAddedAlert.name}</strong> (Qty: {lastAddedAlert.qty}) to proposal scope items below!
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* PROPOSAL ITEMS TABLE / BUILDER LIST (WITH PRODUCT IMAGES) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-orange-500" />
                Quoted Scope Items ({builderItems.length})
              </h4>
              <span className="text-[11px] text-slate-500">
                Product images, dimensions & materials auto-filled
              </span>
            </div>

            {builderItems.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                <Package className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">No products added to proposal yet</p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Use the product catalog selector above (Type &rarr; Category &rarr; Sub-category) to choose products. Their image, price, quantity, and specs will auto-fill here.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {builderItems.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs hover:border-slate-300 transition-all space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      {/* Product Image Thumbnail */}
                      <div className="relative shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-cover bg-slate-50 border border-slate-200"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&w=150&q=70'
                          }}
                        />
                        <span className="absolute -top-1.5 -left-1.5 bg-slate-900 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center font-mono">
                          {idx + 1}
                        </span>
                      </div>

                      {/* Item Name & Specs (Editable) */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleUpdateItemProperty(idx, 'name', e.target.value)}
                            className="font-bold text-slate-900 text-xs sm:text-[13px] bg-transparent border-b border-transparent hover:border-slate-300 focus:border-orange-500 outline-none w-full sm:w-auto"
                            placeholder="Product Name"
                          />
                          {item.sku && (
                            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                              {item.sku}
                            </span>
                          )}
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-orange-50 text-orange-700">
                            {item.type || 'Chairs'} &bull; {item.category}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-500">
                          <input
                            type="text"
                            value={item.material || ''}
                            onChange={(e) => handleUpdateItemProperty(idx, 'material', e.target.value)}
                            placeholder="Material specs"
                            className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-[11px] text-slate-700 outline-none focus:border-orange-500"
                          />
                          <input
                            type="text"
                            value={item.dimensions || ''}
                            onChange={(e) => handleUpdateItemProperty(idx, 'dimensions', e.target.value)}
                            placeholder="Dimensions (e.g. W 120 × D 60 cm)"
                            className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-[11px] text-slate-700 outline-none focus:border-orange-500"
                          />
                        </div>
                      </div>

                      {/* Qty, Unit Price, Disc (%) & Line Total */}
                      <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center flex-wrap">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">
                            Qty
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItemProperty(idx, 'quantity', e.target.value)}
                            className="w-14 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-center text-slate-800 outline-none focus:border-orange-500"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">
                            Unit Rate (₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => handleUpdateItemProperty(idx, 'unitPrice', e.target.value)}
                            className="w-22 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-right text-slate-800 outline-none focus:border-orange-500"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-emerald-600 block mb-0.5 text-center">
                            Disc (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discountPercent || ''}
                            placeholder="0"
                            onChange={(e) => handleUpdateItemProperty(idx, 'discountPercent', e.target.value)}
                            className="w-14 bg-white border border-emerald-300 rounded-lg px-1.5 py-1 text-xs font-mono font-bold text-center text-emerald-700 outline-none focus:border-emerald-500 placeholder:text-slate-300"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-slate-400 block mb-0.5 text-right">
                            Line Total (₹)
                          </label>
                          <div className="text-right pt-0.5 min-w-[80px]">
                            <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 block">
                              ₹{item.total.toLocaleString('en-IN')}
                            </span>
                            {(item.discountAmount || 0) > 0 && (
                              <span className="text-[9.5px] font-medium text-slate-400 block">
                                <span className="line-through">₹{(item.quantity * item.unitPrice).toLocaleString('en-IN')}</span>{' '}
                                <span className="text-emerald-600 font-bold">(-₹{item.discountAmount?.toLocaleString('en-IN')})</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveBuilderItem(idx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition cursor-pointer hover:bg-rose-50"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Handover Timeline & Commercial Discount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Target Handover / Manufacturing Lead Time
              </label>
              <input
                type="date"
                value={clientForm.targetDeliveryDate}
                onChange={(e) => setClientForm({ ...clientForm, targetDeliveryDate: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Commercial Fit-Out Discount (%)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={clientForm.discountPercent}
                onChange={(e) => setClientForm({ ...clientForm, discountPercent: Number(e.target.value) || 0 })}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Commercial Calculation Summary Bar */}
          <div className="p-3.5 bg-slate-900 text-white rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono text-xs shadow-md">
            <div className="space-y-1">
              <div className="flex items-center gap-3 text-slate-300 flex-wrap">
                <span>Subtotal: <strong>₹{builderGrossSubtotal.toLocaleString('en-IN')}</strong></span>
                {totalDiscountAmount > 0 && (
                  <span className="text-emerald-400 font-semibold">
                    Discount: -₹{totalDiscountAmount.toLocaleString('en-IN')}
                    {builderRowDiscounts > 0 && (clientForm.discountPercent || 0) > 0
                      ? ` (Rows: -₹${builderRowDiscounts.toLocaleString('en-IN')} + ${clientForm.discountPercent}%)`
                      : builderRowDiscounts > 0
                        ? ` (Row Discounts)`
                        : ` (${clientForm.discountPercent}%)`}
                  </span>
                )}
                <span>GST (18%): <strong>₹{taxAmount.toLocaleString('en-IN')}</strong></span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Ambattur Plant Freight: {builderDeliveryFee === 0 ? 'FREE DELIVERY IN CHENNAI' : `₹${builderDeliveryFee}`}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-sans">
                Commercial Net Total (INR)
              </span>
              <span className="text-lg sm:text-xl font-bold text-orange-400">
                ₹{builderGrandTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Sticky Drawer Footer Actions */}
          <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs pt-3 pb-1 border-t border-slate-200/90 flex justify-end gap-2.5 z-20">
            <button
              type="button"
              onClick={() => {
                setIsCreateModalOpen(false)
                setEditingProposalId(null)
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={builderItems.length === 0}
              className={`px-5 py-2 rounded-xl text-white text-xs font-bold shadow-xs transition inline-flex items-center gap-2 ${
                builderItems.length === 0
                  ? 'bg-slate-200 cursor-not-allowed text-slate-400'
                  : 'bg-blue-600 hover:bg-blue-700 cursor-pointer active:scale-95'
              }`}
            >
              {editingProposalId ? <FileEdit className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              <span>
                {editingProposalId
                  ? 'Save & Update Proposal'
                  : `Generate Commercial Proposal ${builderItems.length > 0 ? `(${builderItems.length} items)` : ''}`}
              </span>
            </button>
          </div>
        </form>
      </Drawer>
    </div>
  )
}
