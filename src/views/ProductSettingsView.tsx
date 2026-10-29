import React, { useMemo, useState } from 'react'
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Edit2,
  Factory,
  Filter,
  FolderTree,
  GripVertical,
  Layers,
  Plus,
  RotateCcw,
  Ruler,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  X,
} from 'lucide-react'
import { Modal } from '../components/common/Modal'
import { useAdmin } from '../context/AdminContext'
import type {
  CategoryConfig,
  LeadTimeOption,
  ProductionSettings,
  SubCategoryConfig,
  TypeConfig,
} from '../types/admin'

const COMMON_SUBCATEGORY_PRESETS: Record<string, string[]> = {
  Chairs: ['High-Back Mesh', 'Medium-Back Task', 'Executive Leather', 'Visitor Cantilever', 'Drafting Stool', 'Café & Lounge'],
  Tables: ['Conference 6-Seater', 'Boardroom 10-Seater', 'Round Discussion', 'Height-Adjustable Standing', 'Coffee & Side'],
  Workstations: ['Linear 2-Cluster', 'Linear 4-Cluster', '120-Degree Pod', 'Single Executive Desk', 'L-Shape Manager'],
  Storage: ['Mobile Pedestal 3-Drawer', 'Tambour 2-Door', 'Steel Cupboard', 'Open Bookshelf', 'Filing Cabinet'],
  Others: ['Acoustic Screen', 'Wire Management Tray', 'Ergonomic Footrest', 'Monitor Arm'],
}

type SettingsSidebarTab =
  | 'types'
  | 'categories'
  | 'subcategories'
  | 'production'
  | 'materials'
  | 'dimensions'
  | 'commercial'

export const ProductSettingsView: React.FC = () => {
  const {
    products,
    types,
    categoryConfigs,
    productionSettings,
    setCurrentView,
    addType,
    updateType,
    deleteType,
    toggleTypeActive,
    addCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryActive,
    addSubCategory,
    updateSubCategory,
    deleteSubCategory,
    toggleSubCategoryActive,
    updateProductionSettings,
    resetTaxonomyToDefaults,
    totalBinCount,
    addToast,
    confirm,
  } = useAdmin()

  // Sidebar navigation state
  const [activeSidebarTab, setActiveSidebarTab] = useState<SettingsSidebarTab>('categories')

  // Filters & search
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'hidden'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilterDrawer, setShowFilterDrawer] = useState(false)

  // Expandable category rows
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})

  // Inline subcategory input per category
  const [inlineSubInputs, setInlineSubInputs] = useState<Record<string, string>>({})
  const [inlineCatName, setInlineCatName] = useState('')
  const [inlineTypeName, setInlineTypeName] = useState('')

  // Dynamic Inline Editing State
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null)
  const [editTypeForm, setEditTypeForm] = useState({ name: '', description: '' })

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editCategoryForm, setEditCategoryForm] = useState({
    name: '',
    type: 'Chairs',
    description: '',
    leadTime: '7–12 Days',
    minOrderQuantity: 1,
  })

  const [editingSubId, setEditingSubId] = useState<string | null>(null)
  const [editSubForm, setEditSubForm] = useState({
    name: '',
    categoryId: '',
    description: '',
    leadTime: '7–12 Days',
    minOrderQuantity: 1,
  })

  const [editingLeadTimeId, setEditingLeadTimeId] = useState<string | null>(null)
  const [editLeadTimeForm, setEditLeadTimeForm] = useState({
    label: '',
    days: '',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    description: '',
  })

  const [editingMaterialTag, setEditingMaterialTag] = useState<string | null>(null)
  const [editMaterialText, setEditMaterialText] = useState('')

  const [editingDimIdx, setEditingDimIdx] = useState<number | null>(null)
  const [editDimLabel, setEditDimLabel] = useState('')
  const [editDimValue, setEditDimValue] = useState('')

  const [editingCert, setEditingCert] = useState<string | null>(null)
  const [editCertText, setEditCertText] = useState('')

  // Material & dimension selection state
  const [selectedMaterialType, setSelectedMaterialType] = useState('Chairs')
  const [newMaterialTag, setNewMaterialTag] = useState('')
  const [selectedDimType, setSelectedDimType] = useState('Chairs')
  const [newDimLabel, setNewDimLabel] = useState('')
  const [newDimValue, setNewDimValue] = useState('')

  // Quality certifications
  const [newCert, setNewCert] = useState('')

  // Commercial form state
  const [commercialForm, setCommercialForm] = useState<Partial<ProductionSettings>>({
    lowStockThreshold: productionSettings.lowStockThreshold || 5,
    defaultGstPercent: productionSettings.defaultGstPercent || 18,
    displayPricesWithTax: productionSettings.displayPricesWithTax || false,
    factoryWorkingDays: productionSettings.factoryWorkingDays || 'Monday to Saturday (09:00 - 18:30)',
  })

  // Modal states
  const [typeModal, setTypeModal] = useState<{ isOpen: boolean; mode: 'add' | 'edit'; target?: TypeConfig }>({
    isOpen: false,
    mode: 'add',
  })
  const [typeName, setTypeName] = useState('')
  const [typeDesc, setTypeDesc] = useState('')

  const [categoryModal, setCategoryModal] = useState<{
    isOpen: boolean
    mode: 'add' | 'edit'
    target?: CategoryConfig
    defaultType?: string
  }>({ isOpen: false, mode: 'add' })
  const [catName, setCatName] = useState('')
  const [catType, setCatType] = useState('Chairs')
  const [catDesc, setCatDesc] = useState('')
  const [catLeadTime, setCatLeadTime] = useState('7–12 Days')
  const [catMoq, setCatMoq] = useState<number>(1)

  const [subCategoryModal, setSubCategoryModal] = useState<{
    isOpen: boolean
    mode: 'add' | 'edit'
    categoryId?: string
    target?: SubCategoryConfig
  }>({ isOpen: false, mode: 'add' })
  const [subName, setSubName] = useState('')
  const [subDesc, setSubDesc] = useState('')
  const [subLeadTime, setSubLeadTime] = useState('7–12 Days')
  const [subMoq, setSubMoq] = useState<number>(1)

  const [isAddLeadTimeOpen, setIsAddLeadTimeOpen] = useState(false)
  const [newLeadLabel, setNewLeadLabel] = useState('')
  const [newLeadDays, setNewLeadDays] = useState('')
  const [newLeadDesc, setNewLeadDesc] = useState('')
  const [newLeadColor, setNewLeadColor] = useState('bg-blue-50 text-blue-700 border-blue-200')

  // Total counts
  const totalSubCount = useMemo(() => {
    return categoryConfigs.reduce((acc, c) => acc + (c.subCategories?.length || 0), 0)
  }, [categoryConfigs])

  const totalProducts = products.length

  // Helper product counters
  const getProductCountForType = (tName: string) => {
    return products.filter((p) => p.type?.toLowerCase() === tName.toLowerCase()).length
  }

  const getProductCountForCat = (catName: string) => {
    return products.filter((p) => p.category?.toLowerCase() === catName.toLowerCase()).length
  }

  // Toggle Category accordion
  const toggleCategoryExpand = (id: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  // Filtered lists for each tab
  const filteredTypes = useMemo(() => {
    return types
      .filter((t) => {
        if (statusFilter === 'active') return t.isActive
        if (statusFilter === 'hidden') return !t.isActive
        return true
      })
      .filter((t) => {
        if (!searchQuery.trim()) return true
        const q = searchQuery.toLowerCase()
        return t.name.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q)
      })
  }, [types, statusFilter, searchQuery])

  const filteredCategories = useMemo(() => {
    return categoryConfigs
      .filter((c) => {
        if (typeFilter !== 'all' && c.type.toLowerCase() !== typeFilter.toLowerCase()) return false
        if (statusFilter === 'active') return c.isActive
        if (statusFilter === 'hidden') return !c.isActive
        return true
      })
      .filter((c) => {
        if (!searchQuery.trim()) return true
        const q = searchQuery.toLowerCase()
        return (
          c.name.toLowerCase().includes(q) ||
          (c.description || '').toLowerCase().includes(q) ||
          c.subCategories.some((s) => s.name.toLowerCase().includes(q))
        )
      })
  }, [categoryConfigs, typeFilter, statusFilter, searchQuery])

  const allSubcategories = useMemo(() => {
    const list: Array<{ sub: SubCategoryConfig; category: CategoryConfig }> = []
    categoryConfigs.forEach((cat) => {
      cat.subCategories.forEach((sub) => {
        list.push({ sub, category: cat })
      })
    })
    return list
  }, [categoryConfigs])

  const filteredSubcategories = useMemo(() => {
    return allSubcategories
      .filter(({ sub, category }) => {
        if (typeFilter !== 'all' && category.type.toLowerCase() !== typeFilter.toLowerCase()) return false
        if (statusFilter === 'active') return sub.isActive
        if (statusFilter === 'hidden') return !sub.isActive
        return true
      })
      .filter(({ sub, category }) => {
        if (!searchQuery.trim()) return true
        const q = searchQuery.toLowerCase()
        return (
          sub.name.toLowerCase().includes(q) ||
          category.name.toLowerCase().includes(q) ||
          (sub.description || '').toLowerCase().includes(q)
        )
      })
  }, [allSubcategories, typeFilter, statusFilter, searchQuery])

  // Current tab metadata and stats calculation
  const tabStats = useMemo(() => {
    if (activeSidebarTab === 'types') {
      const total = types.length
      const active = types.filter((t) => t.isActive).length
      const hidden = total - active
      const pct = total > 0 ? Math.round((active / total) * 100) : 100
      return {
        title: 'Product Types',
        subtitle: 'Core manufacturing groups and top-level furniture lines',
        total,
        active,
        hidden,
        percent: pct,
        extraLabel: `Total Products: ${totalProducts}`,
      }
    }
    if (activeSidebarTab === 'categories') {
      const total = categoryConfigs.length
      const active = categoryConfigs.filter((c) => c.isActive).length
      const hidden = total - active
      const pct = total > 0 ? Math.round((active / total) * 100) : 100
      return {
        title: 'Categories',
        subtitle: 'Taxonomy classifications and product catalog groupings',
        total,
        active,
        hidden,
        percent: pct,
        extraLabel: `Subcategories: ${totalSubCount}`,
      }
    }
    if (activeSidebarTab === 'subcategories') {
      const total = allSubcategories.length
      const active = allSubcategories.filter((s) => s.sub.isActive).length
      const hidden = total - active
      const pct = total > 0 ? Math.round((active / total) * 100) : 100
      return {
        title: 'Subcategories',
        subtitle: 'Specialized specifications, models, and product variants',
        total,
        active,
        hidden,
        percent: pct,
        extraLabel: `Parent Categories: ${categoryConfigs.length}`,
      }
    }
    if (activeSidebarTab === 'production') {
      const total = productionSettings.leadTimeOptions.length
      return {
        title: 'Lead Times & Production',
        subtitle: 'Factory fabrication schedules and delivery windows',
        total,
        active: total,
        hidden: 0,
        percent: 100,
        extraLabel: `Quality Certifications: ${(productionSettings.qualityCertifications || []).length}`,
      }
    }
    if (activeSidebarTab === 'materials') {
      const allPresets = Object.values(productionSettings.materialPresets || {}).flat()
      return {
        title: 'Materials & Finishes',
        subtitle: 'Approved upholstery, fabrics, leathers, and metal coatings',
        total: allPresets.length,
        active: allPresets.length,
        hidden: 0,
        percent: 100,
        extraLabel: `Active Types: ${types.length}`,
      }
    }
    if (activeSidebarTab === 'dimensions') {
      const allDims = Object.values(productionSettings.dimensionPresets || {}).flat()
      return {
        title: 'Dimensions & Specs',
        subtitle: 'Standardized ergonomic sizing specifications and presets',
        total: allDims.length,
        active: allDims.length,
        hidden: 0,
        percent: 100,
        extraLabel: `Specification Profiles: ${Object.keys(productionSettings.dimensionPresets || {}).length}`,
      }
    }
    return {
      title: 'Commercial & Taxes',
      subtitle: 'Tax rates, safety stock thresholds, and factory hours',
      total: 4,
      active: 4,
      hidden: 0,
      percent: 100,
      extraLabel: `GST: ${commercialForm.defaultGstPercent}%`,
    }
  }, [
    activeSidebarTab,
    types,
    categoryConfigs,
    allSubcategories,
    productionSettings,
    totalProducts,
    totalSubCount,
    commercialForm.defaultGstPercent,
  ])

  // Sequence reordering handlers
  const handleMoveType = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1
    if (targetIdx < 0 || targetIdx >= types.length) return
    const current = types[index]
    const target = types[targetIdx]
    updateType(current.id, current.name)
    updateType(target.id, target.name)
    addToast('info', 'Sequence Updated', `Updated sequence for "${current.name}".`)
  }

  const handleMoveCategory = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1
    if (targetIdx < 0 || targetIdx >= filteredCategories.length) return
    const current = filteredCategories[index]
    const target = filteredCategories[targetIdx]
    updateCategory(current.id, { sortOrder: target.sortOrder ?? targetIdx + 1 })
    updateCategory(target.id, { sortOrder: current.sortOrder ?? index + 1 })
    addToast('info', 'Sequence Updated', `Updated sequence for "${current.name}".`)
  }

  // Dynamic Inline Edit Handlers: Types
  const startEditingType = (t: TypeConfig) => {
    setEditingTypeId(t.id)
    setEditTypeForm({ name: t.name, description: t.description || '' })
  }
  const cancelEditingType = () => setEditingTypeId(null)
  const saveEditingType = (id: string) => {
    const trimmed = editTypeForm.name.trim()
    if (!trimmed) {
      addToast('warning', 'Type Name Required', 'Please enter a name for the product type.')
      return
    }
    updateType(id, trimmed, editTypeForm.description.trim())
    setEditingTypeId(null)
  }

  // Dynamic Inline Edit Handlers: Categories
  const startEditingCategory = (c: CategoryConfig) => {
    setEditingCategoryId(c.id)
    setEditCategoryForm({
      name: c.name,
      type: c.type,
      description: c.description || '',
      leadTime: c.leadTime || '7–12 Days',
      minOrderQuantity: c.minOrderQuantity || 1,
    })
  }
  const cancelEditingCategory = () => setEditingCategoryId(null)
  const saveEditingCategory = (id: string) => {
    const trimmed = editCategoryForm.name.trim()
    if (!trimmed) {
      addToast('warning', 'Category Name Required', 'Please enter a name for the category.')
      return
    }
    updateCategory(id, {
      name: trimmed,
      type: editCategoryForm.type,
      description: editCategoryForm.description.trim(),
      leadTime: editCategoryForm.leadTime,
      minOrderQuantity: Number(editCategoryForm.minOrderQuantity) || 1,
    })
    setEditingCategoryId(null)
  }

  // Dynamic Inline Edit Handlers: Subcategories
  const startEditingSub = (categoryId: string, s: SubCategoryConfig) => {
    setEditingSubId(s.id)
    setEditSubForm({
      name: s.name,
      categoryId,
      description: s.description || '',
      leadTime: s.leadTime || '7–12 Days',
      minOrderQuantity: s.minOrderQuantity || 1,
    })
  }
  const cancelEditingSub = () => setEditingSubId(null)
  const saveEditingSub = (origCategoryId: string, subId: string) => {
    const trimmed = editSubForm.name.trim()
    if (!trimmed) {
      addToast('warning', 'Subcategory Name Required', 'Please enter a name for the subcategory.')
      return
    }
    if (editSubForm.categoryId === origCategoryId) {
      updateSubCategory(origCategoryId, subId, {
        name: trimmed,
        description: editSubForm.description.trim(),
        leadTime: editSubForm.leadTime,
        minOrderQuantity: Number(editSubForm.minOrderQuantity) || 1,
      })
    } else {
      addSubCategory(
        editSubForm.categoryId,
        trimmed,
        editSubForm.description.trim(),
        editSubForm.leadTime,
        Number(editSubForm.minOrderQuantity) || 1
      )
      deleteSubCategory(origCategoryId, subId)
      addToast('success', 'Subcategory Reassigned', `"${trimmed}" moved to target category.`)
    }
    setEditingSubId(null)
  }

  // Dynamic Inline Edit Handlers: Lead Times
  const startEditingLeadTime = (opt: LeadTimeOption) => {
    setEditingLeadTimeId(opt.id)
    setEditLeadTimeForm({
      label: opt.label,
      days: opt.days,
      badgeColor: opt.badgeColor,
      description: opt.description,
    })
  }
  const cancelEditingLeadTime = () => setEditingLeadTimeId(null)
  const saveEditingLeadTime = (id: string) => {
    if (!editLeadTimeForm.label.trim() || !editLeadTimeForm.days.trim()) {
      addToast('warning', 'Missing Details', 'Both schedule label and manufacturing days are required.')
      return
    }
    const updatedOptions = productionSettings.leadTimeOptions.map((opt) =>
      opt.id === id
        ? {
            ...opt,
            label: editLeadTimeForm.label.trim(),
            days: editLeadTimeForm.days.trim(),
            badgeColor: editLeadTimeForm.badgeColor,
            description: editLeadTimeForm.description.trim() || `${editLeadTimeForm.days.trim()} manufacturing window.`,
          }
        : opt
    )
    updateProductionSettings({ leadTimeOptions: updatedOptions })
    setEditingLeadTimeId(null)
    addToast('success', 'Lead Time Updated', `"${editLeadTimeForm.label.trim()}" schedule saved.`)
  }

  // Dynamic Inline Edit Handlers: Materials
  const startEditingMaterial = (tag: string) => {
    setEditingMaterialTag(tag)
    setEditMaterialText(tag)
  }
  const cancelEditingMaterial = () => setEditingMaterialTag(null)
  const saveEditingMaterial = (oldTag: string) => {
    const trimmed = editMaterialText.trim()
    if (!trimmed) return
    const currentList = productionSettings.materialPresets[selectedMaterialType] || []
    updateProductionSettings({
      materialPresets: {
        ...productionSettings.materialPresets,
        [selectedMaterialType]: currentList.map((t) => (t === oldTag ? trimmed : t)),
      },
    })
    setEditingMaterialTag(null)
    addToast('success', 'Finish Updated', `Option renamed to "${trimmed}".`)
  }

  // Dynamic Inline Edit Handlers: Dimensions
  const startEditingDimension = (idx: number, preset: { label: string; value: string }) => {
    setEditingDimIdx(idx)
    setEditDimLabel(preset.label)
    setEditDimValue(preset.value)
  }
  const cancelEditingDimension = () => setEditingDimIdx(null)
  const saveEditingDimension = (idx: number) => {
    const labelTrimmed = editDimLabel.trim()
    const valTrimmed = editDimValue.trim()
    if (!labelTrimmed || !valTrimmed) return
    const currentList = productionSettings.dimensionPresets[selectedDimType] || []
    updateProductionSettings({
      dimensionPresets: {
        ...productionSettings.dimensionPresets,
        [selectedDimType]: currentList.map((p, i) => (i === idx ? { label: labelTrimmed, value: valTrimmed } : p)),
      },
    })
    setEditingDimIdx(null)
    addToast('success', 'Dimension Updated', `Preset "${labelTrimmed}" saved.`)
  }

  // Dynamic Inline Edit Handlers: Certifications
  const startEditingCert = (cert: string) => {
    setEditingCert(cert)
    setEditCertText(cert)
  }
  const cancelEditingCert = () => setEditingCert(null)
  const saveEditingCert = (origCert: string) => {
    const trimmed = editCertText.trim()
    if (!trimmed) return
    const currentList = productionSettings.qualityCertifications || []
    updateProductionSettings({
      qualityCertifications: currentList.map((c) => (c === origCert ? trimmed : c)),
    })
    setEditingCert(null)
    addToast('success', 'Certification Updated', `Standard updated to "${trimmed}".`)
  }

  // Type modal & inline handlers
  const handleOpenAddType = () => {
    setTypeName('')
    setTypeDesc('')
    setTypeModal({ isOpen: true, mode: 'add' })
  }

  const handleSaveType = (e: React.FormEvent) => {
    e.preventDefault()
    if (!typeName.trim()) return
    addType(typeName.trim(), typeDesc.trim())
    setTypeModal({ isOpen: false, mode: 'add' })
  }

  const handleDeleteType = async (t: TypeConfig) => {
    const ok = await confirm({
      title: `Delete Product Type "${t.name}"?`,
      message: `Are you sure you want to delete this product type? Associated categories may be affected.`,
      confirmText: 'Delete Type',
      cancelText: 'Cancel',
      variant: 'danger',
      icon: 'trash',
    })
    if (ok) {
      deleteType(t.id)
    }
  }

  const handleInlineAddType = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = inlineTypeName.trim()
    if (!trimmed) return
    addType(trimmed)
    setInlineTypeName('')
  }

  // Category modal & inline handlers
  const handleOpenAddCategory = (defaultTypeStr?: string) => {
    setCatName('')
    setCatType(defaultTypeStr || (typeFilter !== 'all' ? typeFilter : types[0]?.name || 'Chairs'))
    setCatDesc('')
    setCatLeadTime('7–12 Days')
    setCatMoq(1)
    setCategoryModal({
      isOpen: true,
      mode: 'add',
      defaultType: defaultTypeStr || (typeFilter !== 'all' ? typeFilter : types[0]?.name || 'Chairs'),
    })
  }

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault()
    if (!catName.trim()) return
    addCategory(catType, catName.trim(), catDesc.trim(), catLeadTime, Number(catMoq) || 1)
    setCategoryModal({ isOpen: false, mode: 'add' })
  }

  const handleDeleteCategory = async (c: CategoryConfig) => {
    const ok = await confirm({
      title: `Delete Category "${c.name}"?`,
      message: `Are you sure you want to delete "${c.name}"? It will be moved to the Recycle Bin.`,
      confirmText: 'Move to Bin',
      cancelText: 'Cancel',
      variant: 'danger',
      icon: 'archive',
    })
    if (ok) {
      deleteCategory(c.id)
    }
  }

  const handleInlineAddCategory = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = inlineCatName.trim()
    if (!trimmed) return
    const activeT = typeFilter !== 'all' ? typeFilter : types[0]?.name || 'Chairs'
    addCategory(activeT, trimmed, undefined, '7–12 Days', 1)
    setInlineCatName('')
    const newId = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    setExpandedCategories((prev) => ({ ...prev, [newId]: true }))
  }

  // SubCategory modal & inline handlers
  const handleOpenAddSubCategory = (categoryId: string) => {
    setSubName('')
    setSubDesc('')
    const parent = categoryConfigs.find((c) => c.id === categoryId)
    setSubLeadTime(parent?.leadTime || '7–12 Days')
    setSubMoq(parent?.minOrderQuantity || 1)
    setSubCategoryModal({ isOpen: true, mode: 'add', categoryId })
  }

  const handleSaveSubCategory = (e: React.FormEvent) => {
    e.preventDefault()
    if (!subName.trim() || !subCategoryModal.categoryId) return
    addSubCategory(
      subCategoryModal.categoryId,
      subName.trim(),
      subDesc.trim(),
      subLeadTime,
      Number(subMoq) || 1
    )
    setSubCategoryModal({ isOpen: false, mode: 'add' })
  }

  const handleDeleteSubCategory = async (categoryId: string, s: SubCategoryConfig) => {
    const ok = await confirm({
      title: `Delete Subcategory "${s.name}"?`,
      message: `Are you sure you want to delete this subcategory?`,
      confirmText: 'Delete Subcategory',
      cancelText: 'Cancel',
      variant: 'danger',
      icon: 'trash',
    })
    if (ok) {
      deleteSubCategory(categoryId, s.id)
    }
  }

  const handleInlineAddSubCategory = (e: React.FormEvent, categoryId: string) => {
    e.preventDefault()
    const raw = inlineSubInputs[categoryId]?.trim()
    if (!raw) return
    const names = raw.split(',').map((s) => s.trim()).filter(Boolean)
    names.forEach((name) => {
      addSubCategory(categoryId, name)
    })
    setInlineSubInputs((prev) => ({ ...prev, [categoryId]: '' }))
    setExpandedCategories((prev) => ({ ...prev, [categoryId]: true }))
  }

  const handleAddPresetSubCategory = (categoryId: string, presetName: string) => {
    addSubCategory(categoryId, presetName)
    setExpandedCategories((prev) => ({ ...prev, [categoryId]: true }))
  }

  // Material Presets
  const handleAddMaterialTag = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newMaterialTag.trim()
    if (!trimmed) return
    const currentList = productionSettings.materialPresets[selectedMaterialType] || []
    if (currentList.includes(trimmed)) {
      addToast('warning', 'Preset Exists', `"${trimmed}" is already saved for ${selectedMaterialType}.`)
      return
    }
    updateProductionSettings({
      materialPresets: {
        ...productionSettings.materialPresets,
        [selectedMaterialType]: [...currentList, trimmed],
      },
    })
    setNewMaterialTag('')
    addToast('success', 'Material Tag Added', `"${trimmed}" added to ${selectedMaterialType}.`)
  }

  const handleRemoveMaterialTag = (tName: string, tag: string) => {
    const currentList = productionSettings.materialPresets[tName] || []
    updateProductionSettings({
      materialPresets: {
        ...productionSettings.materialPresets,
        [tName]: currentList.filter((t) => t !== tag),
      },
    })
    addToast('info', 'Tag Removed', `Tag removed from ${tName}.`)
  }

  // Dimension Presets
  const handleAddDimensionPreset = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDimLabel.trim() || !newDimValue.trim()) return
    const currentList = productionSettings.dimensionPresets[selectedDimType] || []
    updateProductionSettings({
      dimensionPresets: {
        ...productionSettings.dimensionPresets,
        [selectedDimType]: [
          ...currentList,
          { label: newDimLabel.trim(), value: newDimValue.trim() },
        ],
      },
    })
    setNewDimLabel('')
    setNewDimValue('')
    addToast('success', 'Dimension Added', 'New standard sizing option available.')
  }

  const handleRemoveDimensionPreset = (tName: string, idx: number) => {
    const currentList = productionSettings.dimensionPresets[tName] || []
    updateProductionSettings({
      dimensionPresets: {
        ...productionSettings.dimensionPresets,
        [tName]: currentList.filter((_, i) => i !== idx),
      },
    })
    addToast('info', 'Dimension Removed', 'Option removed.')
  }

  // Lead Times
  const handleAddLeadTime = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLeadLabel.trim() || !newLeadDays.trim()) return
    const id = newLeadLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const newOption: LeadTimeOption = {
      id,
      label: newLeadLabel.trim(),
      days: newLeadDays.trim(),
      badgeColor: newLeadColor,
      description: newLeadDesc.trim() || `${newLeadDays} manufacturing window.`,
    }
    updateProductionSettings({
      leadTimeOptions: [...productionSettings.leadTimeOptions, newOption],
    })
    setIsAddLeadTimeOpen(false)
    setNewLeadLabel('')
    setNewLeadDays('')
    setNewLeadDesc('')
    addToast('success', 'Lead Time Added', `"${newLeadLabel}" configured.`)
  }

  const handleRemoveLeadTime = async (id: string) => {
    if (productionSettings.leadTimeOptions.length <= 1) {
      addToast('error', 'Cannot Delete', 'At least one lead time schedule must remain.')
      return
    }
    const ok = await confirm({
      title: 'Remove Lead Time Option?',
      message: 'Are you sure you want to delete this manufacturing schedule option?',
      confirmText: 'Remove Option',
      cancelText: 'Cancel',
      variant: 'danger',
      icon: 'trash',
    })
    if (ok) {
      updateProductionSettings({
        leadTimeOptions: productionSettings.leadTimeOptions.filter((o) => o.id !== id),
      })
      addToast('info', 'Lead Time Removed', 'Option removed from catalog configuration.')
    }
  }

  // Quality Certifications
  const handleAddCertification = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCert.trim()) return
    const currentList = productionSettings.qualityCertifications || []
    if (currentList.includes(newCert.trim())) return
    updateProductionSettings({
      qualityCertifications: [...currentList, newCert.trim()],
    })
    setNewCert('')
    addToast('success', 'Certification Added', 'Standard added to factory quality assurance.')
  }

  const handleRemoveCertification = (cert: string) => {
    updateProductionSettings({
      qualityCertifications: (productionSettings.qualityCertifications || []).filter((c) => c !== cert),
    })
    addToast('info', 'Certification Removed', 'Badge removed.')
  }

  // Commercial form submit
  const handleSaveCommercialSettings = (e: React.FormEvent) => {
    e.preventDefault()
    updateProductionSettings(commercialForm)
    addToast('success', 'Commercial Rules Saved', 'Factory & commercial settings updated successfully.')
  }

  const handleResetDefaults = async () => {
    const ok = await confirm({
      title: 'Reset Catalog Taxonomy to Defaults?',
      message: 'This will restore all default product types, categories, subcategories, and lead time options. Proceed?',
      confirmText: 'Reset Everything',
      cancelText: 'Cancel',
      variant: 'danger',
      icon: 'refresh',
    })
    if (ok) {
      resetTaxonomyToDefaults()
      addToast('success', 'Catalog Restored', 'Taxonomy returned to standard factory defaults.')
    }
  }

  return (
    <>
      {/* Full-Screen Master-Detail Layout with Full Size Sidenavbar */}
      <div className="flex-1 w-full min-h-[calc(100vh-65px)] bg-white flex flex-col lg:flex-row border-t border-slate-200/80">
        {/* Left Full-Size Sidenavbar Pane */}
        <aside className="w-full lg:w-72 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 bg-white flex flex-col justify-between self-stretch">
          <div className="flex flex-col">
            {/* Sidebar Branding Card (Matching Reference Screenshot) */}
            <div className="p-4 sm:p-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#F4F0FF] border border-[#E9E2FE] flex items-center justify-center text-[#7C3AED] shadow-2xs shrink-0">
                  <Settings className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[15px] font-bold text-slate-900 leading-tight">Settings</div>
                  <div className="text-xs font-medium text-slate-400 truncate mt-0.5">Catalog Configuration</div>
                </div>
              </div>
            </div>

            {/* Sidebar Menu Group: CONFIGURATION */}
            <div className="py-3">
              <div className="px-5 pt-1 pb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Configuration
              </div>

              {/* Navigation list */}
              <nav className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible no-scrollbar pb-2 lg:pb-0 gap-1 lg:gap-1 px-3 lg:px-0 relative" aria-label="Configuration Settings">
                {/* 1. Product Types */}
                <div className="relative shrink-0">
                  {activeSidebarTab === 'types' && (
                    <span
                      className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 w-1.25 h-6 bg-blue-600 rounded-r-md"
                      aria-hidden="true"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveSidebarTab('types')}
                    className={`flex items-center gap-2.5 lg:gap-3 px-3.5 lg:px-3 py-2 lg:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer group whitespace-nowrap lg:whitespace-normal w-auto lg:w-[calc(100%-1.5rem)] lg:mx-3 ${
                      activeSidebarTab === 'types'
                        ? 'bg-blue-50/80 text-blue-600 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/80'
                    }`}
                  >
                    <Layers
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        activeSidebarTab === 'types' ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    <span className="truncate">Product Types</span>
                    <span
                      className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                        activeSidebarTab === 'types'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200/70'
                      }`}
                    >
                      {types.length}
                    </span>
                  </button>
                </div>

                {/* 2. Categories */}
                <div className="relative shrink-0">
                  {activeSidebarTab === 'categories' && (
                    <span
                      className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 w-1.25 h-6 bg-blue-600 rounded-r-md"
                      aria-hidden="true"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveSidebarTab('categories')}
                    className={`flex items-center gap-2.5 lg:gap-3 px-3.5 lg:px-3 py-2 lg:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer group whitespace-nowrap lg:whitespace-normal w-auto lg:w-[calc(100%-1.5rem)] lg:mx-3 ${
                      activeSidebarTab === 'categories'
                        ? 'bg-blue-50/80 text-blue-600 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/80'
                    }`}
                  >
                    <FolderTree
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        activeSidebarTab === 'categories' ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    <span className="truncate">Categories</span>
                    <span
                      className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                        activeSidebarTab === 'categories'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200/70'
                      }`}
                    >
                      {categoryConfigs.length}
                    </span>
                  </button>
                </div>

                {/* 3. Subcategories */}
                <div className="relative shrink-0">
                  {activeSidebarTab === 'subcategories' && (
                    <span
                      className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 w-1.25 h-6 bg-blue-600 rounded-r-md"
                      aria-hidden="true"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveSidebarTab('subcategories')}
                    className={`flex items-center gap-2.5 lg:gap-3 px-3.5 lg:px-3 py-2 lg:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer group whitespace-nowrap lg:whitespace-normal w-auto lg:w-[calc(100%-1.5rem)] lg:mx-3 ${
                      activeSidebarTab === 'subcategories'
                        ? 'bg-blue-50/80 text-blue-600 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/80'
                    }`}
                  >
                    <Tag
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        activeSidebarTab === 'subcategories' ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    <span className="truncate">Subcategories</span>
                    <span
                      className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                        activeSidebarTab === 'subcategories'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200/70'
                      }`}
                    >
                      {totalSubCount}
                    </span>
                  </button>
                </div>

                {/* 4. Production & Lead Times */}
                <div className="relative shrink-0">
                  {activeSidebarTab === 'production' && (
                    <span
                      className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 w-1.25 h-6 bg-blue-600 rounded-r-md"
                      aria-hidden="true"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveSidebarTab('production')}
                    className={`flex items-center gap-2.5 lg:gap-3 px-3.5 lg:px-3 py-2 lg:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer group whitespace-nowrap lg:whitespace-normal w-auto lg:w-[calc(100%-1.5rem)] lg:mx-3 ${
                      activeSidebarTab === 'production'
                        ? 'bg-blue-50/80 text-blue-600 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/80'
                    }`}
                  >
                    <Clock
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        activeSidebarTab === 'production' ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    <span className="truncate">Lead Times & Schedules</span>
                    <span
                      className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                        activeSidebarTab === 'production'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200/70'
                      }`}
                    >
                      {productionSettings.leadTimeOptions.length}
                    </span>
                  </button>
                </div>

                {/* 5. Materials & Finishes */}
                <div className="relative shrink-0">
                  {activeSidebarTab === 'materials' && (
                    <span
                      className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 w-1.25 h-6 bg-blue-600 rounded-r-md"
                      aria-hidden="true"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveSidebarTab('materials')}
                    className={`flex items-center gap-2.5 lg:gap-3 px-3.5 lg:px-3 py-2 lg:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer group whitespace-nowrap lg:whitespace-normal w-auto lg:w-[calc(100%-1.5rem)] lg:mx-3 ${
                      activeSidebarTab === 'materials'
                        ? 'bg-blue-50/80 text-blue-600 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/80'
                    }`}
                  >
                    <Sparkles
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        activeSidebarTab === 'materials' ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    <span className="truncate">Materials & Finishes</span>
                  </button>
                </div>

                {/* 6. Dimensions & Specs */}
                <div className="relative shrink-0">
                  {activeSidebarTab === 'dimensions' && (
                    <span
                      className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 w-1.25 h-6 bg-blue-600 rounded-r-md"
                      aria-hidden="true"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveSidebarTab('dimensions')}
                    className={`flex items-center gap-2.5 lg:gap-3 px-3.5 lg:px-3 py-2 lg:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer group whitespace-nowrap lg:whitespace-normal w-auto lg:w-[calc(100%-1.5rem)] lg:mx-3 ${
                      activeSidebarTab === 'dimensions'
                        ? 'bg-blue-50/80 text-blue-600 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/80'
                    }`}
                  >
                    <Ruler
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        activeSidebarTab === 'dimensions' ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    <span className="truncate">Dimensions & Specs</span>
                  </button>
                </div>

                {/* 7. Commercial & Taxes */}
                <div className="relative shrink-0">
                  {activeSidebarTab === 'commercial' && (
                    <span
                      className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 w-1.25 h-6 bg-blue-600 rounded-r-md"
                      aria-hidden="true"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveSidebarTab('commercial')}
                    className={`flex items-center gap-2.5 lg:gap-3 px-3.5 lg:px-3 py-2 lg:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer group whitespace-nowrap lg:whitespace-normal w-auto lg:w-[calc(100%-1.5rem)] lg:mx-3 ${
                      activeSidebarTab === 'commercial'
                        ? 'bg-blue-50/80 text-blue-600 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/80'
                    }`}
                  >
                    <Factory
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        activeSidebarTab === 'commercial' ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    <span className="truncate">Commercial & Taxes</span>
                  </button>
                </div>
              </nav>
            </div>
          </div>

          {/* Quick Actions & Status at bottom of sidebar */}
          <div className="p-4 border-t border-slate-100 mt-auto bg-slate-50/30">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2.5 px-1">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Catalog Active
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Taxonomy</span>
            </div>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer border border-transparent hover:border-rose-200"
              title="Reset all settings to initial defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Factory Defaults</span>
            </button>
          </div>
        </aside>

        {/* Right Main Content Workspace Pane */}
        <div className="flex-1 min-w-0 bg-white flex flex-col">
          {/* 1. Header Bar: Title | Subtitle + Action buttons */}
          <div className="p-5 sm:p-6 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-wrap items-baseline gap-2.5">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                {tabStats.title}
              </h2>
              <span className="text-slate-300 font-light hidden sm:inline">|</span>
              <span className="text-xs text-slate-500">
                {tabStats.subtitle}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => addToast('info', 'Synced', 'Catalog taxonomy is synchronized.')}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="Refresh state"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Contextual Add Buttons */}
              {activeSidebarTab === 'types' && (
                <button
                  type="button"
                  onClick={handleOpenAddType}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product Type</span>
                </button>
              )}

              {activeSidebarTab === 'categories' && (
                <button
                  type="button"
                  onClick={() => handleOpenAddCategory()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Category</span>
                </button>
              )}

              {activeSidebarTab === 'subcategories' && (
                <button
                  type="button"
                  onClick={() => {
                    const firstCat = categoryConfigs[0]?.id
                    if (firstCat) handleOpenAddSubCategory(firstCat)
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Subcategory</span>
                </button>
              )}

              {activeSidebarTab === 'production' && (
                <button
                  type="button"
                  onClick={() => setIsAddLeadTimeOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Lead Time</span>
                </button>
              )}

              <span className="w-px h-5 bg-slate-200 hidden sm:inline-block mx-0.5" />

              <button
                type="button"
                onClick={() => setCurrentView('recycle-bin')}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 rounded-xl shadow-2xs transition-colors cursor-pointer"
                title="View Deleted Items in Recycle Bin"
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Recycle Bin</span>
                {totalBinCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                    {totalBinCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setCurrentView('products')}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                title="Back to Products"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            </div>
          </div>

          {/* 2. Status & Progress Banner (Matching the Reference Screenshot) */}
          <div className="px-5 sm:px-6 py-4 bg-slate-50/50 border-b border-slate-200/80 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span className="font-bold text-slate-900">{tabStats.title}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                  Active
                </span>
              </div>

              {/* Inline Stats Metric Text */}
              <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                <span>
                  Total: <strong className="text-slate-800 font-bold">{tabStats.total}</strong>
                </span>
                <span>
                  Active: <strong className="text-emerald-700 font-bold">{tabStats.active}</strong>
                </span>
                <span>
                  Hidden: <strong className="text-slate-600 font-bold">{tabStats.hidden}</strong>
                </span>
                {tabStats.extraLabel && (
                  <span className="hidden sm:inline border-l border-slate-200 pl-4 text-slate-500">
                    {tabStats.extraLabel}
                  </span>
                )}
              </div>
            </div>

            {/* Sleek Progress Bar with percentage */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-slate-200/70 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${tabStats.percent}%` }}
                />
              </div>
              <span className="text-[11px] font-bold text-slate-600 shrink-0">
                {tabStats.percent}%
              </span>
            </div>
          </div>

          {/* 3. Toolbar: Filters & Search */}
          <div className="px-5 sm:px-6 py-3.5 border-b border-slate-200/80 flex flex-wrap items-center gap-3">
            {/* Filter Drawer Toggle */}
            <button
              type="button"
              onClick={() => setShowFilterDrawer(!showFilterDrawer)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                showFilterDrawer || typeFilter !== 'all'
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters ({typeFilter !== 'all' ? 1 : 0})</span>
            </button>

            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={`Search ${tabStats.title.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Segmented Status Pills (All, Active, Hidden) */}
            <div className="flex items-center gap-1 ml-auto bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All <span className="text-[10px] opacity-75">{tabStats.total}</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  statusFilter === 'active'
                    ? 'bg-white text-emerald-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active <span className="text-[10px] opacity-75">{tabStats.active}</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('hidden')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  statusFilter === 'hidden'
                    ? 'bg-white text-slate-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Hidden <span className="text-[10px] opacity-75">{tabStats.hidden}</span>
              </button>
            </div>
          </div>

          {/* Collapsible Type Filter Pill Bar (for Categories & Subcategories) */}
          {(showFilterDrawer || (activeSidebarTab === 'categories' || activeSidebarTab === 'subcategories' || activeSidebarTab === 'materials' || activeSidebarTab === 'dimensions')) && (
            <div className="px-5 sm:px-6 py-2.5 bg-slate-50/60 border-b border-slate-200/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                Type:
              </span>
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg shrink-0 transition-colors cursor-pointer ${
                  typeFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                All Types
              </button>
              {types.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTypeFilter(t.name)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg shrink-0 transition-colors cursor-pointer ${
                    typeFilter.toLowerCase() === t.name.toLowerCase()
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}

          {/* ========================================================= */}
          {/* 4. WORKSPACE TAB VIEWS                                     */}
          {/* ========================================================= */}

          {/* --- TAB 1: PRODUCT TYPES --- */}
          {activeSidebarTab === 'types' && (
            <div>
              {/* Quick Inline Adder */}
              <div className="p-4 bg-blue-50/40 border-b border-slate-200">
                <form onSubmit={handleInlineAddType} className="flex items-center gap-2 max-w-xl">
                  <input
                    type="text"
                    placeholder="Quick add new product type (e.g. Lounge, Outdoor, Reception)..."
                    value={inlineTypeName}
                    onChange={(e) => setInlineTypeName(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  />
                  <button
                    type="submit"
                    disabled={!inlineTypeName.trim()}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    + Add Type
                  </button>
                </form>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4 w-28 text-center">Sequence</th>
                      <th className="py-3 px-4">Identity & Display Label</th>
                      <th className="py-3 px-4">Context & Rules</th>
                      <th className="py-3 px-4 w-28 text-center">Visibility</th>
                      <th className="py-3 px-4 w-28 text-right">Management</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredTypes.map((t, idx) => {
                      const pCount = getProductCountForType(t.name)
                      const catCount = categoryConfigs.filter((c) => c.type.toLowerCase() === t.name.toLowerCase()).length
                      const isEditing = editingTypeId === t.id

                      if (isEditing) {
                        return (
                          <tr key={t.id} className="bg-blue-50/70 border-y-2 border-blue-400 transition-colors">
                            <td className="py-3.5 px-4 text-center">
                              <span className="text-[11px] font-bold text-blue-600 bg-blue-100/80 px-2 py-0.5 rounded-md">
                                Editing #{idx + 1}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="space-y-1">
                                <input
                                  type="text"
                                  value={editTypeForm.name}
                                  onChange={(e) => setEditTypeForm({ ...editTypeForm, name: e.target.value })}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveEditingType(t.id)
                                    if (e.key === 'Escape') cancelEditingType()
                                  }}
                                  placeholder="Type Name (e.g. Chairs)"
                                  autoFocus
                                  className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-900 bg-white border border-blue-300 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                                <div className="text-[10px] text-slate-400">
                                  Slug: {editTypeForm.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <input
                                type="text"
                                value={editTypeForm.description}
                                onChange={(e) => setEditTypeForm({ ...editTypeForm, description: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEditingType(t.id)
                                  if (e.key === 'Escape') cancelEditingType()
                                }}
                                placeholder="Brief description / manufacturing scope..."
                                className="w-full px-2.5 py-1.5 text-xs text-slate-700 bg-white border border-slate-300 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              />
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="text-[11px] font-semibold text-slate-500">
                                {t.isActive ? 'Active' : 'Hidden'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => saveEditingType(t.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                                  title="Save changes (Enter)"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Save</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEditingType}
                                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                                  title="Cancel (Esc)"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      }

                      return (
                        <tr key={t.id} className="hover:bg-slate-50/70 transition-colors group">
                          {/* Sequence */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex items-center gap-1.5 text-slate-400">
                              <GripVertical className="w-3.5 h-3.5 text-slate-300" />
                              <span className="font-bold text-slate-700">{idx + 1}</span>
                              <div className="flex flex-col -space-y-1">
                                <button
                                  type="button"
                                  onClick={() => handleMoveType(idx, 'up')}
                                  disabled={idx === 0}
                                  className="text-slate-300 hover:text-slate-600 disabled:opacity-20 cursor-pointer"
                                >
                                  <ChevronUp className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveType(idx, 'down')}
                                  disabled={idx === filteredTypes.length - 1}
                                  className="text-slate-300 hover:text-slate-600 disabled:opacity-20 cursor-pointer"
                                >
                                  <ChevronDown className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </td>

                          {/* Identity & Display Label */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
                                <Layers className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 text-sm leading-tight">
                                  {t.name}
                                </div>
                                <div className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 mt-0.5">
                                  <span>•</span>
                                  <span>{t.slug || t.name.toLowerCase()}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Context & Rules */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                                  {catCount} Categories
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium text-[11px]">
                                  {pCount} Products Live
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 truncate max-w-md">
                                {t.description || 'No specialized context defined.'}
                              </p>
                            </div>
                          </td>

                          {/* Visibility Toggle */}
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => toggleTypeActive(t.id)}
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                t.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                              }`}
                              title={t.isActive ? 'Active (Click to Hide)' : 'Hidden (Click to Activate)'}
                            >
                              <span
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  t.isActive ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </td>

                          {/* Management */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => startEditingType(t)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Inline Edit Type"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteType(t)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Type"
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
            </div>
          )}

          {/* --- TAB 2: CATEGORIES (With Expandable Subcategories) --- */}
          {activeSidebarTab === 'categories' && (
            <div>
              {/* Quick Inline Adder */}
              <div className="p-4 bg-blue-50/40 border-b border-slate-200">
                <form onSubmit={handleInlineAddCategory} className="flex items-center gap-2 max-w-xl">
                  <input
                    type="text"
                    placeholder={`Quick add new category under ${typeFilter !== 'all' ? typeFilter : 'all types'}...`}
                    value={inlineCatName}
                    onChange={(e) => setInlineCatName(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  />
                  <button
                    type="submit"
                    disabled={!inlineCatName.trim()}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    + Add Category
                  </button>
                </form>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4 w-28 text-center">Sequence</th>
                      <th className="py-3 px-4">Identity & Display Label</th>
                      <th className="py-3 px-4">Context & Rules</th>
                      <th className="py-3 px-4 w-28 text-center">Visibility</th>
                      <th className="py-3 px-4 w-32 text-right">Management</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredCategories.map((c, idx) => {
                      const isExpanded = !!expandedCategories[c.id]
                      const pCount = getProductCountForCat(c.name)
                      const presets = COMMON_SUBCATEGORY_PRESETS[c.type] || []

                      return (
                        <React.Fragment key={c.id}>
                          {editingCategoryId === c.id ? (
                            <tr className="bg-blue-50/70 border-y-2 border-blue-400 transition-colors">
                              <td className="py-3.5 px-4 text-center">
                                <span className="text-[11px] font-bold text-blue-600 bg-blue-100/80 px-2 py-0.5 rounded-md">
                                  Editing #{idx + 1}
                                </span>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="space-y-1.5">
                                  <input
                                    type="text"
                                    value={editCategoryForm.name}
                                    onChange={(e) => setEditCategoryForm({ ...editCategoryForm, name: e.target.value })}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') saveEditingCategory(c.id)
                                      if (e.key === 'Escape') cancelEditingCategory()
                                    }}
                                    placeholder="Category Name"
                                    autoFocus
                                    className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-900 bg-white border border-blue-300 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                  />
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-slate-500 font-semibold">Type:</span>
                                    <select
                                      value={editCategoryForm.type}
                                      onChange={(e) => setEditCategoryForm({ ...editCategoryForm, type: e.target.value })}
                                      className="px-2 py-0.5 text-xs bg-white border border-slate-300 rounded-md font-medium text-slate-700 focus:outline-none"
                                    >
                                      {types.map((t) => (
                                        <option key={t.id} value={t.name}>
                                          {t.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="space-y-1.5">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] text-slate-500 font-semibold">Lead:</span>
                                      <select
                                        value={editCategoryForm.leadTime}
                                        onChange={(e) => setEditCategoryForm({ ...editCategoryForm, leadTime: e.target.value })}
                                        className="px-2 py-0.5 text-xs bg-white border border-slate-300 rounded-md font-medium text-slate-700 focus:outline-none"
                                      >
                                        {productionSettings.leadTimeOptions.map((opt) => (
                                          <option key={opt.id} value={opt.label}>
                                            {opt.label} ({opt.days})
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] text-slate-500 font-semibold">MOQ:</span>
                                      <input
                                        type="number"
                                        min={1}
                                        value={editCategoryForm.minOrderQuantity}
                                        onChange={(e) =>
                                          setEditCategoryForm({
                                            ...editCategoryForm,
                                            minOrderQuantity: Number(e.target.value) || 1,
                                          })
                                        }
                                        className="w-14 px-1.5 py-0.5 text-xs bg-white border border-slate-300 rounded-md text-center font-medium"
                                      />
                                    </div>
                                  </div>
                                  <input
                                    type="text"
                                    value={editCategoryForm.description}
                                    onChange={(e) => setEditCategoryForm({ ...editCategoryForm, description: e.target.value })}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') saveEditingCategory(c.id)
                                      if (e.key === 'Escape') cancelEditingCategory()
                                    }}
                                    placeholder="Category description..."
                                    className="w-full px-2.5 py-1 text-xs text-slate-700 bg-white border border-slate-300 rounded-lg shadow-2xs focus:outline-none"
                                  />
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <span className="text-[11px] font-semibold text-slate-500">
                                  {c.isActive ? 'Active' : 'Hidden'}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => saveEditingCategory(c.id)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                                    title="Save changes (Enter)"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Save</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelEditingCategory}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                                    title="Cancel (Esc)"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            <tr className="hover:bg-slate-50/70 transition-colors group">
                              {/* Sequence */}
                              <td className="py-3.5 px-4 text-center">
                                <div className="inline-flex items-center gap-1.5 text-slate-400">
                                  <GripVertical className="w-3.5 h-3.5 text-slate-300" />
                                  <span className="font-bold text-slate-700">{idx + 1}</span>
                                  <div className="flex flex-col -space-y-1">
                                    <button
                                      type="button"
                                      onClick={() => handleMoveCategory(idx, 'up')}
                                      disabled={idx === 0}
                                      className="text-slate-300 hover:text-slate-600 disabled:opacity-20 cursor-pointer"
                                    >
                                      <ChevronUp className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleMoveCategory(idx, 'down')}
                                      disabled={idx === filteredCategories.length - 1}
                                      className="text-slate-300 hover:text-slate-600 disabled:opacity-20 cursor-pointer"
                                    >
                                      <ChevronDown className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </td>

                              {/* Identity & Display Label */}
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
                                    <FolderTree className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900 text-sm leading-tight flex items-center gap-2">
                                      <span>{c.name}</span>
                                      {c.subCategories.length > 0 && (
                                        <span
                                          onClick={() => toggleCategoryExpand(c.id)}
                                          className="text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                                        >
                                          {c.subCategories.length} subs
                                        </span>
                                      )}
                                    </div>
                                    <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400 mt-0.5">
                                      <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">
                                        {c.type}
                                      </span>
                                      <span>•</span>
                                      <span>{pCount} Products</span>
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Context & Rules */}
                              <td className="py-3.5 px-4">
                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    {c.leadTime && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-medium text-[11px] border border-amber-200/60">
                                        <Clock className="w-3 h-3" />
                                        <span>{c.leadTime}</span>
                                      </span>
                                    )}
                                    {c.minOrderQuantity && c.minOrderQuantity > 1 && (
                                      <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-medium text-[11px]">
                                        MOQ: {c.minOrderQuantity}
                                      </span>
                                    )}
                                    <span className="text-[11px] text-slate-400">
                                      {c.subCategories.length} specification models
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 truncate max-w-md">
                                    {c.description || 'Standard catalog category grouping.'}
                                  </p>
                                </div>
                              </td>

                              {/* Visibility Toggle */}
                              <td className="py-3.5 px-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => toggleCategoryActive(c.id)}
                                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                    c.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                                  }`}
                                  title={c.isActive ? 'Active (Click to Hide)' : 'Hidden (Click to Activate)'}
                                >
                                  <span
                                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                      c.isActive ? 'translate-x-4' : 'translate-x-0'
                                    }`}
                                  />
                                </button>
                              </td>

                              {/* Management */}
                              <td className="py-3.5 px-4 text-right">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => toggleCategoryExpand(c.id)}
                                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                      isExpanded ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                                    }`}
                                    title={isExpanded ? 'Collapse subcategories' : 'Expand subcategories'}
                                  >
                                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => startEditingCategory(c)}
                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                    title="Inline Edit Category"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCategory(c)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                    title="Delete Category"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )}

                          {/* Expanded Nested Subcategories Section */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={5} className="bg-slate-50/80 p-4 pl-12 border-b border-slate-200">
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                      <Tag className="w-3.5 h-3.5 text-blue-600" />
                                      <span>Subcategories under {c.name}</span>
                                      <span className="text-slate-400 font-normal">
                                        ({c.subCategories.length})
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenAddSubCategory(c.id)}
                                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                                    >
                                      + Add with Modal
                                    </button>
                                  </div>

                                  {/* Subcategory List */}
                                  {c.subCategories.length === 0 ? (
                                    <div className="p-3 bg-white rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
                                      No subcategories defined for {c.name}. Type below to add specifications!
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                      {c.subCategories.map((s, sIdx) => {
                                        const isSubEditing = editingSubId === s.id
                                        if (isSubEditing) {
                                          return (
                                            <div
                                              key={s.id}
                                              className="p-2.5 bg-blue-50/90 rounded-xl border-2 border-blue-400 shadow-2xs space-y-2"
                                            >
                                              <div className="flex items-center justify-between gap-1">
                                                <span className="text-[10px] font-bold text-blue-600">Editing #{sIdx + 1}</span>
                                                <div className="flex items-center gap-1">
                                                  <button
                                                    type="button"
                                                    onClick={() => saveEditingSub(c.id, s.id)}
                                                    className="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold cursor-pointer"
                                                    title="Save changes"
                                                  >
                                                    <Check className="w-3 h-3" />
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={cancelEditingSub}
                                                    className="p-1 bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 rounded-md text-xs cursor-pointer"
                                                    title="Cancel"
                                                  >
                                                    <X className="w-3 h-3" />
                                                  </button>
                                                </div>
                                              </div>
                                              <input
                                                type="text"
                                                value={editSubForm.name}
                                                onChange={(e) => setEditSubForm({ ...editSubForm, name: e.target.value })}
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter') saveEditingSub(c.id, s.id)
                                                  if (e.key === 'Escape') cancelEditingSub()
                                                }}
                                                placeholder="Subcategory Name"
                                                autoFocus
                                                className="w-full px-2 py-1 text-xs font-bold text-slate-900 bg-white border border-blue-300 rounded-md focus:outline-none"
                                              />
                                              <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] text-slate-500 font-medium">Lead:</span>
                                                <select
                                                  value={editSubForm.leadTime}
                                                  onChange={(e) => setEditSubForm({ ...editSubForm, leadTime: e.target.value })}
                                                  className="flex-1 px-1.5 py-0.5 text-[11px] bg-white border border-slate-300 rounded-md font-medium text-slate-700"
                                                >
                                                  {productionSettings.leadTimeOptions.map((opt) => (
                                                    <option key={opt.id} value={opt.label}>
                                                      {opt.label} ({opt.days})
                                                    </option>
                                                  ))}
                                                </select>
                                              </div>
                                            </div>
                                          )
                                        }

                                        return (
                                          <div
                                            key={s.id}
                                            className="p-2.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-2"
                                          >
                                            <div className="min-w-0 flex items-center gap-2">
                                              <span className="text-[10px] font-bold text-slate-400 shrink-0">
                                                #{sIdx + 1}
                                              </span>
                                              <div className="truncate">
                                                <div className="text-xs font-bold text-slate-800 truncate">
                                                  {s.name}
                                                </div>
                                                <div className="text-[10px] text-slate-400 truncate">
                                                  {s.leadTime || c.leadTime || '7–12 Days'}
                                                </div>
                                              </div>
                                            </div>

                                            <div className="flex items-center gap-1 shrink-0">
                                              {/* Visibility Toggle */}
                                              <button
                                                type="button"
                                                onClick={() => toggleSubCategoryActive(c.id, s.id)}
                                                className={`w-2.5 h-2.5 rounded-full cursor-pointer ${
                                                  s.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                                                }`}
                                                title={s.isActive ? 'Active (Click to Hide)' : 'Hidden (Click to Activate)'}
                                              />
                                              <button
                                                type="button"
                                                onClick={() => startEditingSub(c.id, s)}
                                                className="p-1 text-slate-400 hover:text-blue-600 rounded cursor-pointer"
                                                title="Inline Edit Subcategory"
                                              >
                                                <Edit2 className="w-3 h-3" />
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => handleDeleteSubCategory(c.id, s)}
                                                className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                                title="Delete Subcategory"
                                              >
                                                <Trash2 className="w-3 h-3" />
                                              </button>
                                            </div>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  )}

                                  {/* Inline Quick Add Subcategory Input */}
                                  <form
                                    onSubmit={(e) => handleInlineAddSubCategory(e, c.id)}
                                    className="flex items-center gap-2"
                                  >
                                    <input
                                      type="text"
                                      placeholder="Type new subcategory (or separate multiple with commas)..."
                                      value={inlineSubInputs[c.id] || ''}
                                      onChange={(e) =>
                                        setInlineSubInputs((prev) => ({
                                          ...prev,
                                          [c.id]: e.target.value,
                                        }))
                                      }
                                      className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                    <button
                                      type="submit"
                                      disabled={!inlineSubInputs[c.id]?.trim()}
                                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                                    >
                                      + Add
                                    </button>
                                  </form>

                                  {/* Quick Preset Badges */}
                                  {presets.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                        Presets:
                                      </span>
                                      {presets.map((preset) => {
                                        const alreadyHas = c.subCategories.some(
                                          (s) => s.name.toLowerCase() === preset.toLowerCase()
                                        )
                                        if (alreadyHas) return null
                                        return (
                                          <button
                                            key={preset}
                                            type="button"
                                            onClick={() => handleAddPresetSubCategory(c.id, preset)}
                                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-colors cursor-pointer"
                                          >
                                            + {preset}
                                          </button>
                                        )
                                      })}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* --- TAB 3: FLAT SUBCATEGORIES TABLE --- */}
          {activeSidebarTab === 'subcategories' && (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4 w-28 text-center">Sequence</th>
                      <th className="py-3 px-4">Identity & Display Label</th>
                      <th className="py-3 px-4">Parent Category & Rules</th>
                      <th className="py-3 px-4 w-28 text-center">Visibility</th>
                      <th className="py-3 px-4 w-28 text-right">Management</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredSubcategories.map(({ sub, category }, idx) => {
                      const isEditing = editingSubId === sub.id

                      if (isEditing) {
                        return (
                          <tr key={`${category.id}-${sub.id}`} className="bg-blue-50/70 border-y-2 border-blue-400 transition-colors">
                            <td className="py-3.5 px-4 text-center">
                              <span className="text-[11px] font-bold text-blue-600 bg-blue-100/80 px-2 py-0.5 rounded-md">
                                Editing #{idx + 1}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="space-y-1">
                                <input
                                  type="text"
                                  value={editSubForm.name}
                                  onChange={(e) => setEditSubForm({ ...editSubForm, name: e.target.value })}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveEditingSub(category.id, sub.id)
                                    if (e.key === 'Escape') cancelEditingSub()
                                  }}
                                  placeholder="Subcategory Name"
                                  autoFocus
                                  className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-900 bg-white border border-blue-300 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                                <div className="text-[10px] text-slate-400">
                                  Slug: {editSubForm.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="space-y-1.5">
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-slate-500 font-semibold">Category:</span>
                                    <select
                                      value={editSubForm.categoryId}
                                      onChange={(e) => setEditSubForm({ ...editSubForm, categoryId: e.target.value })}
                                      className="px-2 py-0.5 text-xs bg-white border border-slate-300 rounded-md font-medium text-slate-700 focus:outline-none"
                                    >
                                      {categoryConfigs.map((c) => (
                                        <option key={c.id} value={c.id}>
                                          {c.name} ({c.type})
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-slate-500 font-semibold">Lead:</span>
                                    <select
                                      value={editSubForm.leadTime}
                                      onChange={(e) => setEditSubForm({ ...editSubForm, leadTime: e.target.value })}
                                      className="px-2 py-0.5 text-xs bg-white border border-slate-300 rounded-md font-medium text-slate-700 focus:outline-none"
                                    >
                                      {productionSettings.leadTimeOptions.map((opt) => (
                                        <option key={opt.id} value={opt.label}>
                                          {opt.label} ({opt.days})
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                                <input
                                  type="text"
                                  value={editSubForm.description}
                                  onChange={(e) => setEditSubForm({ ...editSubForm, description: e.target.value })}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveEditingSub(category.id, sub.id)
                                    if (e.key === 'Escape') cancelEditingSub()
                                  }}
                                  placeholder="Specialized specification variant description..."
                                  className="w-full px-2.5 py-1 text-xs text-slate-700 bg-white border border-slate-300 rounded-lg shadow-2xs focus:outline-none"
                                />
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="text-[11px] font-semibold text-slate-500">
                                {sub.isActive ? 'Active' : 'Hidden'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => saveEditingSub(category.id, sub.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                                  title="Save changes (Enter)"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Save</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEditingSub}
                                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                                  title="Cancel (Esc)"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      }

                      return (
                        <tr key={`${category.id}-${sub.id}`} className="hover:bg-slate-50/70 transition-colors group">
                          {/* Sequence */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex items-center gap-1 text-slate-400">
                              <GripVertical className="w-3.5 h-3.5 text-slate-300" />
                              <span className="font-bold text-slate-700">{idx + 1}</span>
                            </div>
                          </td>

                          {/* Identity */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs shrink-0">
                                <Tag className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 text-sm leading-tight">
                                  {sub.name}
                                </div>
                                <div className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 mt-0.5">
                                  <span>•</span>
                                  <span>{sub.slug || sub.name.toLowerCase()}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Context & Parent */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold text-[11px]">
                                  {category.name} ({category.type})
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-medium text-[11px]">
                                  {sub.leadTime || category.leadTime || '7–12 Days'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 truncate max-w-md">
                                {sub.description || 'Specialized specification variant.'}
                              </p>
                            </div>
                          </td>

                          {/* Visibility */}
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => toggleSubCategoryActive(category.id, sub.id)}
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                sub.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                              }`}
                              title={sub.isActive ? 'Active (Click to Hide)' : 'Hidden (Click to Activate)'}
                            >
                              <span
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  sub.isActive ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </td>

                          {/* Management */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => startEditingSub(category.id, sub)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Inline Edit Subcategory"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSubCategory(category.id, sub)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Subcategory"
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
            </div>
          )}

          {/* --- TAB 4: PRODUCTION & LEAD TIMES --- */}
          {activeSidebarTab === 'production' && (
            <div className="p-5 sm:p-6 space-y-6">
              {/* Lead Time Schedules Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>Manufacturing Lead Time Standards</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddLeadTimeOpen(true)}
                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    + Add Schedule
                  </button>
                </div>

                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-2.5 px-4 w-24 text-center">Sequence</th>
                      <th className="py-2.5 px-4">Identity & Label</th>
                      <th className="py-2.5 px-4">Standard Window</th>
                      <th className="py-2.5 px-4">Description</th>
                      <th className="py-2.5 px-4 w-24 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {productionSettings.leadTimeOptions.map((opt, idx) => {
                      const isEditing = editingLeadTimeId === opt.id

                      if (isEditing) {
                        return (
                          <tr key={opt.id} className="bg-blue-50/70 border-y-2 border-blue-400 transition-colors">
                            <td className="py-3 px-4 text-center font-bold text-blue-600">
                              Editing #{idx + 1}
                            </td>
                            <td className="py-3 px-4">
                              <input
                                type="text"
                                value={editLeadTimeForm.label}
                                onChange={(e) => setEditLeadTimeForm({ ...editLeadTimeForm, label: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEditingLeadTime(opt.id)
                                  if (e.key === 'Escape') cancelEditingLeadTime()
                                }}
                                placeholder="Schedule Label (e.g. Standard)"
                                autoFocus
                                className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-900 bg-white border border-blue-300 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <div className="space-y-1.5">
                                <input
                                  type="text"
                                  value={editLeadTimeForm.days}
                                  onChange={(e) => setEditLeadTimeForm({ ...editLeadTimeForm, days: e.target.value })}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveEditingLeadTime(opt.id)
                                    if (e.key === 'Escape') cancelEditingLeadTime()
                                  }}
                                  placeholder="Days (e.g. 7–12 Days)"
                                  className="w-full px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-md focus:outline-none"
                                />
                                <select
                                  value={editLeadTimeForm.badgeColor}
                                  onChange={(e) => setEditLeadTimeForm({ ...editLeadTimeForm, badgeColor: e.target.value })}
                                  className="w-full px-2 py-0.5 text-[11px] bg-white border border-slate-300 rounded-md font-medium text-slate-700"
                                >
                                  <option value="bg-blue-50 text-blue-700 border-blue-200">Blue Badge</option>
                                  <option value="bg-emerald-50 text-emerald-700 border-emerald-200">Emerald Badge</option>
                                  <option value="bg-amber-50 text-amber-700 border-amber-200">Amber Badge</option>
                                  <option value="bg-purple-50 text-purple-700 border-purple-200">Purple Badge</option>
                                  <option value="bg-rose-50 text-rose-700 border-rose-200">Rose Badge</option>
                                </select>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <input
                                type="text"
                                value={editLeadTimeForm.description}
                                onChange={(e) => setEditLeadTimeForm({ ...editLeadTimeForm, description: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEditingLeadTime(opt.id)
                                  if (e.key === 'Escape') cancelEditingLeadTime()
                                }}
                                placeholder="Schedule description..."
                                className="w-full px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-md focus:outline-none"
                              />
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => saveEditingLeadTime(opt.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                                  title="Save changes (Enter)"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Save</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEditingLeadTime}
                                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                                  title="Cancel (Esc)"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      }

                      return (
                        <tr key={opt.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 text-center font-bold text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-800">{opt.label}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${opt.badgeColor}`}>
                              {opt.days}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {opt.description}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => startEditingLeadTime(opt)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Inline Edit Schedule"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveLeadTime(opt.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Remove Schedule"
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

              {/* Quality Certifications Card */}
              <div className="border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Quality Certifications & Factory Compliance
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Certifications that appear on manufactured products, quotation specs, and customer documentation.
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  {(productionSettings.qualityCertifications || []).map((cert) => {
                    const isEditing = editingCert === cert
                    if (isEditing) {
                      return (
                        <span
                          key={cert}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-800 border-2 border-blue-400 shadow-2xs"
                        >
                          <input
                            type="text"
                            value={editCertText}
                            onChange={(e) => setEditCertText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEditingCert(cert)
                              if (e.key === 'Escape') cancelEditingCert()
                            }}
                            autoFocus
                            className="px-2 py-0.5 text-xs bg-white border border-blue-300 rounded focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => saveEditingCert(cert)}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded cursor-pointer"
                            title="Save"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditingCert}
                            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded cursor-pointer"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      )
                    }

                    return (
                      <span
                        key={cert}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 group"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{cert}</span>
                        <button
                          type="button"
                          onClick={() => startEditingCert(cert)}
                          className="text-emerald-600 hover:text-blue-700 cursor-pointer ml-1"
                          title="Inline Edit Certification"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveCertification(cert)}
                          className="text-emerald-500 hover:text-rose-600 cursor-pointer"
                          title="Remove Certification"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )
                  })}
                </div>

                <form onSubmit={handleAddCertification} className="flex items-center gap-2 max-w-md pt-2">
                  <input
                    type="text"
                    placeholder="e.g. ISO 14001, FSC Certified, AIOTA..."
                    value={newCert}
                    onChange={(e) => setNewCert(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={!newCert.trim()}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    + Add Cert
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* --- TAB 5: MATERIALS & FINISHES --- */}
          {activeSidebarTab === 'materials' && (
            <div className="p-5 sm:p-6 space-y-5">
              {/* Type Switcher Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {types.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedMaterialType(t.name)}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      selectedMaterialType.toLowerCase() === t.name.toLowerCase()
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>

              {/* Material Chips List */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Saved Material Presets for {selectedMaterialType}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {(productionSettings.materialPresets[selectedMaterialType] || []).length} Presets
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(productionSettings.materialPresets[selectedMaterialType] || []).map((tag) => {
                    const isEditing = editingMaterialTag === tag
                    if (isEditing) {
                      return (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium bg-blue-50 border-2 border-blue-400 shadow-2xs"
                        >
                          <input
                            type="text"
                            value={editMaterialText}
                            onChange={(e) => setEditMaterialText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEditingMaterial(tag)
                              if (e.key === 'Escape') cancelEditingMaterial()
                            }}
                            autoFocus
                            className="px-2 py-0.5 text-xs bg-white border border-blue-300 rounded focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => saveEditingMaterial(tag)}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded cursor-pointer"
                            title="Save"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditingMaterial}
                            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded cursor-pointer"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      )
                    }

                    return (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white border border-slate-200 shadow-2xs text-slate-800 group"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => startEditingMaterial(tag)}
                          className="text-slate-400 hover:text-blue-600 cursor-pointer ml-0.5"
                          title="Inline Edit Preset"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveMaterialTag(selectedMaterialType, tag)}
                          className="text-slate-400 hover:text-rose-600 cursor-pointer"
                          title="Remove Preset"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    )
                  })}
                </div>

                {/* Add Material Input */}
                <form onSubmit={handleAddMaterialTag} className="flex items-center gap-2 max-w-lg pt-2">
                  <input
                    type="text"
                    placeholder={`Add new finish for ${selectedMaterialType}...`}
                    value={newMaterialTag}
                    onChange={(e) => setNewMaterialTag(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!newMaterialTag.trim()}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    + Add Preset
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* --- TAB 6: DIMENSIONS & SPECS --- */}
          {activeSidebarTab === 'dimensions' && (
            <div className="p-5 sm:p-6 space-y-5">
              {/* Type Switcher Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {types.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedDimType(t.name)}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      selectedDimType.toLowerCase() === t.name.toLowerCase()
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>

              {/* Dimension Presets Grid */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Standard Dimension Presets for {selectedDimType}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {(productionSettings.dimensionPresets[selectedDimType] || []).length} Options
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(productionSettings.dimensionPresets[selectedDimType] || []).map((preset, idx) => {
                    const isEditing = editingDimIdx === idx
                    if (isEditing) {
                      return (
                        <div
                          key={`${preset.label}-${idx}`}
                          className="p-3 bg-blue-50/80 rounded-xl border-2 border-blue-400 shadow-2xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-blue-600">Editing Option #{idx + 1}</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => saveEditingDimension(idx)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold cursor-pointer"
                                title="Save (Enter)"
                              >
                                <Check className="w-3 h-3" />
                                <span>Save</span>
                              </button>
                              <button
                                type="button"
                                onClick={cancelEditingDimension}
                                className="p-1 bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 rounded text-xs cursor-pointer"
                                title="Cancel (Esc)"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <input
                            type="text"
                            value={editDimLabel}
                            onChange={(e) => setEditDimLabel(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEditingDimension(idx)
                              if (e.key === 'Escape') cancelEditingDimension()
                            }}
                            placeholder="Preset Label"
                            autoFocus
                            className="w-full px-2 py-1 text-xs font-bold text-slate-900 bg-white border border-blue-300 rounded focus:outline-none"
                          />
                          <input
                            type="text"
                            value={editDimValue}
                            onChange={(e) => setEditDimValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEditingDimension(idx)
                              if (e.key === 'Escape') cancelEditingDimension()
                            }}
                            placeholder="Dimensions (e.g. W650 x D650 x H1180 mm)"
                            className="w-full px-2 py-1 text-xs font-mono text-slate-700 bg-white border border-slate-300 rounded focus:outline-none"
                          />
                        </div>
                      )
                    }

                    return (
                      <div
                        key={`${preset.label}-${idx}`}
                        className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-2 group"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900">{preset.label}</div>
                          <div className="text-[11px] font-mono text-slate-500 mt-0.5">{preset.value}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => startEditingDimension(idx, preset)}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded cursor-pointer"
                            title="Inline Edit Preset"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveDimensionPreset(selectedDimType, idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                            title="Remove Preset"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Add Dimension Form */}
                <form onSubmit={handleAddDimensionPreset} className="flex flex-wrap items-center gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Label (e.g. Executive High-Back)"
                    value={newDimLabel}
                    onChange={(e) => setNewDimLabel(e.target.value)}
                    className="flex-1 min-w-[160px] px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Dimensions (e.g. W650 x D650 x H1180 mm)"
                    value={newDimValue}
                    onChange={(e) => setNewDimValue(e.target.value)}
                    className="flex-1 min-w-[200px] px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!newDimLabel.trim() || !newDimValue.trim()}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    + Add Preset
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* --- TAB 7: COMMERCIAL & TAXES --- */}
          {activeSidebarTab === 'commercial' && (
            <div className="p-5 sm:p-6 max-w-2xl">
              <form onSubmit={handleSaveCommercialSettings} className="space-y-5">
                <div className="space-y-4">
                  {/* GST */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Standard Commercial GST Rate (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={commercialForm.defaultGstPercent || 18}
                      onChange={(e) =>
                        setCommercialForm((prev) => ({
                          ...prev,
                          defaultGstPercent: Number(e.target.value),
                        }))
                      }
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Applied to commercial quotations and pro-forma invoice calculations (Standard 18% HSN 9403).
                    </p>
                  </div>

                  {/* Low Stock Alert */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Factory Safety Stock Alert Threshold
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={commercialForm.lowStockThreshold || 5}
                      onChange={(e) =>
                        setCommercialForm((prev) => ({
                          ...prev,
                          lowStockThreshold: Number(e.target.value),
                        }))
                      }
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      When inventory falls to this count or below, products trigger factory reorder warnings.
                    </p>
                  </div>

                  {/* Factory Hours */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Factory Production Operating Hours
                    </label>
                    <input
                      type="text"
                      value={commercialForm.factoryWorkingDays || ''}
                      onChange={(e) =>
                        setCommercialForm((prev) => ({
                          ...prev,
                          factoryWorkingDays: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  {/* Display Prices Inclusive of GST */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-800">Display Prices Inclusive of GST</div>
                      <div className="text-[11px] text-slate-500">
                        If enabled, retail prices displayed on public storefront already include the 18% GST tax.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setCommercialForm((prev) => ({
                          ...prev,
                          displayPricesWithTax: !prev.displayPricesWithTax,
                        }))
                      }
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        commercialForm.displayPricesWithTax ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          commercialForm.displayPricesWithTax ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Commercial Settings</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 5. MODAL DIALOGS                                          */}
      {/* ========================================================= */}

      {/* Modal: Add/Edit Type */}
      <Modal
        isOpen={typeModal.isOpen}
        onClose={() => setTypeModal({ isOpen: false, mode: 'add' })}
        title={typeModal.mode === 'add' ? 'Create Product Type' : 'Edit Product Type'}
        subtitle="Product Types represent major manufacturing groups (e.g. Chairs, Tables, Workstations, Storage)"
      >
        <form onSubmit={handleSaveType} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Type Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Soft Seating, Acoustic Pods, Lounge..."
              value={typeName}
              onChange={(e) => setTypeName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description / Internal Notes
            </label>
            <textarea
              rows={3}
              placeholder="Primary use, manufacturing line, and scope..."
              value={typeDesc}
              onChange={(e) => setTypeDesc(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setTypeModal({ isOpen: false, mode: 'add' })}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
            >
              {typeModal.mode === 'add' ? 'Create Type' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add/Edit Category */}
      <Modal
        isOpen={categoryModal.isOpen}
        onClose={() => setCategoryModal({ isOpen: false, mode: 'add' })}
        title={categoryModal.mode === 'add' ? 'Create Product Category' : 'Edit Category'}
        subtitle="Group products logically within their parent manufacturing line"
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Parent Product Type <span className="text-rose-500">*</span>
            </label>
            <select
              value={catType}
              onChange={(e) => setCatType(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
            >
              {types.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Category Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ergonomic Task Chairs, Conference Tables..."
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Default Lead Time
              </label>
              <select
                value={catLeadTime}
                onChange={(e) => setCatLeadTime(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {productionSettings.leadTimeOptions.map((opt) => (
                  <option key={opt.id} value={opt.days}>
                    {opt.days} ({opt.label})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Default Minimum Order (MOQ)
              </label>
              <input
                type="number"
                min={1}
                value={catMoq}
                onChange={(e) => setCatMoq(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description / Specifications
            </label>
            <textarea
              rows={2}
              placeholder="Scope, warranty details, or factory build standards..."
              value={catDesc}
              onChange={(e) => setCatDesc(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setCategoryModal({ isOpen: false, mode: 'add' })}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
            >
              {categoryModal.mode === 'add' ? 'Create Category' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add/Edit SubCategory */}
      <Modal
        isOpen={subCategoryModal.isOpen}
        onClose={() => setSubCategoryModal({ isOpen: false, mode: 'add' })}
        title={subCategoryModal.mode === 'add' ? 'Create Subcategory' : 'Edit Subcategory'}
        subtitle="Specialized specifications, model series, and variations"
      >
        <form onSubmit={handleSaveSubCategory} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Subcategory Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. High-Back Mesh, 4-Cluster Pod, Mobile Pedestal..."
              value={subName}
              onChange={(e) => setSubName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Lead Time Override
              </label>
              <select
                value={subLeadTime}
                onChange={(e) => setSubLeadTime(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {productionSettings.leadTimeOptions.map((opt) => (
                  <option key={opt.id} value={opt.days}>
                    {opt.days} ({opt.label})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Minimum Order Quantity (MOQ)
              </label>
              <input
                type="number"
                min={1}
                value={subMoq}
                onChange={(e) => setSubMoq(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description / Notes
            </label>
            <textarea
              rows={2}
              placeholder="Component specifications, material choices, or notes..."
              value={subDesc}
              onChange={(e) => setSubDesc(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setSubCategoryModal({ isOpen: false, mode: 'add' })}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
            >
              {subCategoryModal.mode === 'add' ? 'Create Subcategory' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Lead Time */}
      <Modal
        isOpen={isAddLeadTimeOpen}
        onClose={() => setIsAddLeadTimeOpen(false)}
        title="Create Manufacturing Lead Time Standard"
        subtitle="Configures standard delivery and fabrication windows across the catalog"
      >
        <form onSubmit={handleAddLeadTime} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Schedule Label <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Express Dispatch, Custom Fabrication..."
              value={newLeadLabel}
              onChange={(e) => setNewLeadLabel(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Duration Window <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 24–48 Hours, 10–14 Days, 3 Weeks..."
              value={newLeadDays}
              onChange={(e) => setNewLeadDays(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Badge Color Accent
            </label>
            <select
              value={newLeadColor}
              onChange={(e) => setNewLeadColor(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="bg-emerald-50 text-emerald-700 border-emerald-200">
                Green (In-Stock / Ready)
              </option>
              <option value="bg-blue-50 text-blue-700 border-blue-200">
                Blue (Standard Production)
              </option>
              <option value="bg-purple-50 text-purple-700 border-purple-200">
                Purple (Made to Order)
              </option>
              <option value="bg-amber-50 text-amber-700 border-amber-200">
                Amber (Custom Project)
              </option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Customer-Facing Description
            </label>
            <input
              type="text"
              placeholder="e.g. Standard dispatch for warehouse-stocked executive models."
              value={newLeadDesc}
              onChange={(e) => setNewLeadDesc(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsAddLeadTimeOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
            >
              Add Schedule
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
