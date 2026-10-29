import React, { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Check,
  Edit2,
  Eye,
  FolderTree,
  Grid,
  Layers,
  List,
  Package,
  Plus,
  RotateCcw,
  Ruler,
  Star,
  Trash2,
  X,
} from 'lucide-react'
import { Drawer } from '../components/common/Drawer'
import { Modal } from '../components/common/Modal'
import { ProductImageUpload, type UploadedImageItem } from '../components/products/ProductImageUpload'
import {
  SearchableSelect,
  type SelectOption,
  getInitialsForLabel,
  getBadgeColorForLabel,
} from '../components/common/SearchableSelect'
import { useAdmin } from '../context/AdminContext'
import {
  CATEGORY_SUBCATEGORIES,
  COMMON_MATERIAL_TAGS,
  DIMENSION_PRESETS,
  MATERIAL_PRESETS,
  PRODUCT_TYPES,
  TYPE_CATEGORIES_MAP,
  inferTypeFromCategory,
  type Category,
  type Product,
} from '../types/admin'

const QUICK_DIMENSION_CHIPS: Record<string, { label: string; value: string }[]> = {
  Chairs: [
    { label: '66 × 64 × 120 cm (Exec)', value: 'W 66 × D 64 × H 118–128 cm' },
    { label: '64 × 62 × 102 cm (Task)', value: 'W 64 × D 62 × H 98–108 cm' },
    { label: '62 × 58 × 80 cm (Visitor)', value: 'W 62 × D 58 × H 80 cm' },
    { label: '48 × 54 × 83 cm (Café)', value: 'W 48 × D 54 × H 83 cm' },
    { label: '180 × 65 × 80 cm (3-Seat)', value: 'W 180 × D 65 × H 80 cm' },
  ],
  Workstations: [
    { label: '120 × 60 cm (Linear)', value: 'W 120 × D 60 × H 75 cm' },
    { label: '140 × 70 cm (Exec)', value: 'W 140 × D 70 × H 75 cm' },
    { label: '160 × 75 cm (Manager)', value: 'W 160 × D 75 × H 75 cm' },
    { label: '240 × 120 cm (2-Seater)', value: 'W 240 × D 120 × H 75 cm' },
    { label: '360 × 140 cm (6-Bench)', value: 'W 360 × D 140 × H 75 cm' },
  ],
  Tables: [
    { label: '90 × 90 × 75 cm (Café)', value: 'W 90 × D 90 × H 75 cm' },
    { label: 'Dia 90 × H 75 cm (Round)', value: 'Dia 90 × H 75 cm' },
    { label: '180 × 90 × 75 cm (6-Seater)', value: 'W 180 × D 90 × H 75 cm' },
    { label: '240 × 120 × 75 cm (8-Seater)', value: 'W 240 × D 120 × H 75 cm' },
    { label: '360 × 140 × 75 cm (12-Seater)', value: 'W 360 × D 140 × H 75 cm' },
  ],
  Storage: [
    { label: '40 × 45 × 65 cm (Pedestal)', value: 'W 40 × D 45 × H 65 cm' },
    { label: '120 × 45 × 75 cm (Credenza)', value: 'W 120 × D 45 × H 75 cm' },
    { label: '90 × 45 × 120 cm (Mid-Cab)', value: 'W 90 × D 45 × H 120 cm' },
    { label: '90 × 45 × 180 cm (Tall)', value: 'W 90 × D 45 × H 180 cm' },
  ],
  Others: [
    { label: '120 × 60 × 75 cm', value: 'W 120 × D 60 × H 75 cm' },
    { label: '140 × 70 × 75 cm', value: 'W 140 × D 70 × H 75 cm' },
    { label: '80 × 50 × 75 cm', value: 'W 80 × D 50 × H 75 cm' },
  ],
}

interface ProductsViewProps {
  isAddModalOpen: boolean
  setIsAddModalOpen: (open: boolean) => void
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  isAddModalOpen,
  setIsAddModalOpen,
}) => {
  const {
    products,
    categories,
    productTypes,
    typeCategoriesMap,
    categorySubcategoriesMap,
    addProduct,
    updateProduct,
    deleteProduct,
    deletedProducts,
    toggleProductStock,
    toggleProductFeatured,
    toggleProductActive,
    setCurrentView,
    searchQuery,
    setSearchQuery,
    confirm,
    alertModal,
  } = useAdmin()

  const [selectedType, setSelectedType] = useState<string | 'All'>('All')
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All')
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | 'All'>('All')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'in_stock' | 'out_of_stock'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null)

  // Quick stats
  const activeCount = products.filter((p) => p.isActive !== false).length
  const inactiveCount = products.filter((p) => p.isActive === false).length
  const inStockCount = products.filter((p) => p.inStock).length
  const outOfStockCount = products.length - inStockCount

  interface ProductFormState {
    name: string
    type: string
    category: Category
    subCategory: string
    price: number | ''
    oldPrice: number | ''
    rating: number
    image: string
    images?: UploadedImageItem[]
    cutout: boolean
    description: string
    material: string
    dimensions: string
    inStock: boolean
    featured: boolean
    isActive: boolean
    leadTime: string
    stockCount: number | ''
    minOrderQuantity: number
  }

  // Form State for Add / Edit
  const initialFormData: ProductFormState = {
    name: '',
    type: 'Chairs',
    category: 'Office Chairs' as Category,
    subCategory: 'Ergonomic Chairs',
    price: '',
    oldPrice: '',
    rating: 4.8,
    image: '',
    images: [],
    cutout: true,
    description: '',
    material: 'Breathable High-Tensile Mesh, High-Density Moulded PU Foam, Nylon/Aluminium Base',
    dimensions: 'W 66 × D 64 × H 118–128 cm',
    inStock: true,
    featured: false,
    isActive: true,
    leadTime: '3–5 Days',
    stockCount: 10,
    minOrderQuantity: 1,
  }

  const [formData, setFormData] = useState<ProductFormState>(initialFormData)
  const [isCustomType, setIsCustomType] = useState(false)
  const [isCustomCategory, setIsCustomCategory] = useState(false)
  const [isCustomSubCategory, setIsCustomSubCategory] = useState(false)

  // Dimensions builder state
  const [dimW, setDimW] = useState('66')
  const [dimD, setDimD] = useState('64')
  const [dimH, setDimH] = useState('118–128')
  const [showDimBuilder, setShowDimBuilder] = useState(false)

  const parseDimensions = (dimStr: string) => {
    if (!dimStr) return null
    const match = dimStr.match(/W\s*([0-9–-]+)\s*[×x*]\s*D\s*([0-9–-]+)\s*[×x*]\s*H\s*([0-9–-]+)/i)
    if (match) {
      return { w: match[1], d: match[2], h: match[3] }
    }
    return null
  }

  const updateDimFromParts = (w: string, d: string, h: string) => {
    setDimW(w)
    setDimD(d)
    setDimH(h)
    if (w || d || h) {
      setFormData((prev) => ({
        ...prev,
        dimensions: `W ${w || 0} × D ${d || 0} × H ${h || 0} cm`,
      }))
    }
  }

  const toggleMaterialTag = (tag: string) => {
    const current = formData.material ? formData.material.trim() : ''
    if (!current) {
      setFormData((prev) => ({ ...prev, material: tag }))
      return
    }

    const items = current
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const idx = items.findIndex((item) => item.toLowerCase() === tag.toLowerCase())
    if (idx >= 0) {
      items.splice(idx, 1)
      setFormData((prev) => ({ ...prev, material: items.join(', ') }))
    } else {
      items.push(tag)
      setFormData((prev) => ({ ...prev, material: items.join(', ') }))
    }
  }

  const isMaterialTagActive = (tag: string) => {
    if (!formData.material) return false
    return formData.material.toLowerCase().includes(tag.toLowerCase())
  }

  // Reset form when modal opens cleanly in Add mode
  useEffect(() => {
    if (isAddModalOpen && !editingProduct) {
      setIsCustomType(false)
      setIsCustomCategory(false)
      setIsCustomSubCategory(false)
      setShowDimBuilder(false)
      const parsed = parseDimensions(initialFormData.dimensions)
      if (parsed) {
        setDimW(parsed.w)
        setDimD(parsed.d)
        setDimH(parsed.h)
      }
      setFormData(initialFormData)
    }
  }, [isAddModalOpen, editingProduct])

  // Dynamically compute available categories for selected type
  const currentAvailableCategories = useMemo(() => {
    if (isCustomType) return []
    const presets = typeCategoriesMap[formData.type] || TYPE_CATEGORIES_MAP[formData.type] || []
    const fromProds = products
      .filter((p) => (p.type || inferTypeFromCategory(p.category)) === formData.type)
      .map((p) => p.category)
    const combined = Array.from(new Set([...presets, ...fromProds])).filter(Boolean)
    return combined.length > 0 ? combined : ['Others']
  }, [formData.type, isCustomType, products, typeCategoriesMap])

  // Dynamically compute available subcategories for selected category
  const currentAvailableSubCategories = useMemo(() => {
    if (isCustomCategory) return []
    const presets = categorySubcategoriesMap[formData.category] || CATEGORY_SUBCATEGORIES[formData.category] || []
    const fromProds = products
      .filter((p) => p.category === formData.category && p.subCategory)
      .map((p) => p.subCategory as string)
    const combined = Array.from(new Set([...presets, ...fromProds])).filter(Boolean)
    return combined
  }, [formData.category, isCustomCategory, products, categorySubcategoriesMap])

  // Categories available for the currently selected filter Type
  const availableCategoriesForFilter = useMemo(() => {
    if (selectedType === 'All') return categories
    const presets = typeCategoriesMap[selectedType] || TYPE_CATEGORIES_MAP[selectedType] || []
    const fromProds = products
      .filter((p) => (p.type || inferTypeFromCategory(p.category)) === selectedType)
      .map((p) => p.category)
    const combined = Array.from(new Set([...presets, ...fromProds])).filter(Boolean)
    return combined.length > 0 ? combined : ['Others']
  }, [selectedType, products, categories, typeCategoriesMap])

  // Searchable Dropdown Options for Status Filter
  const statusFilterOptions: SelectOption[] = useMemo(
    () => [
      {
        value: 'all',
        label: `All Products (${products.length})`,
        initials: 'AL',
        badgeColor: 'bg-slate-700 text-white',
        description: 'Showing full inventory catalog',
      },
      {
        value: 'active',
        label: `Active Only (${activeCount})`,
        initials: 'AC',
        badgeColor: 'bg-blue-600 text-white',
        description: 'Published and visible on storefront',
      },
      {
        value: 'inactive',
        label: `Inactive / Drafts (${inactiveCount})`,
        initials: 'IN',
        badgeColor: 'bg-slate-400 text-white',
        description: 'Hidden / unlisted products',
      },
      {
        value: 'in_stock',
        label: `In Stock (${inStockCount})`,
        initials: 'IS',
        badgeColor: 'bg-emerald-600 text-white',
        description: 'Available for immediate orders',
      },
      {
        value: 'out_of_stock',
        label: `Out of Stock (${outOfStockCount})`,
        initials: 'OS',
        badgeColor: 'bg-rose-500 text-white',
        description: 'Inventory count at 0',
      },
    ],
    [products.length, activeCount, inactiveCount, inStockCount, outOfStockCount]
  )

  // Searchable Dropdown Options for Add/Edit Product Hierarchy
  const typeOptions: SelectOption[] = useMemo(() => {
    return PRODUCT_TYPES.map((t) => ({
      value: t,
      label: t,
      initials: getInitialsForLabel(t),
      badgeColor: getBadgeColorForLabel(t),
    }))
  }, [])

  const categoryOptions: SelectOption[] = useMemo(() => {
    return currentAvailableCategories.map((c) => ({
      value: c,
      label: c,
      initials: getInitialsForLabel(c),
      badgeColor: getBadgeColorForLabel(c),
    }))
  }, [currentAvailableCategories])

  const subCategoryOptions: SelectOption[] = useMemo(() => {
    return currentAvailableSubCategories.map((sc) => ({
      value: sc,
      label: sc,
      initials: getInitialsForLabel(sc),
      badgeColor: getBadgeColorForLabel(sc),
    }))
  }, [currentAvailableSubCategories])

  // Searchable Dropdown Options for Materials Presets
  const materialOptions: SelectOption[] = useMemo(() => {
    const curType = formData.type || 'Chairs'
    const curPresets = (MATERIAL_PRESETS[curType] || MATERIAL_PRESETS['Chairs'] || []).map((preset) => ({
      value: preset,
      label: preset,
      description: `${curType} Preset Spec`,
      badgeColor: 'bg-orange-500 text-white',
      initials: getInitialsForLabel(curType),
    }))

    const otherPresets: SelectOption[] = []
    Object.entries(MATERIAL_PRESETS)
      .filter(([type]) => type !== curType)
      .forEach(([type, presets]) => {
        presets.forEach((preset) => {
          otherPresets.push({
            value: preset,
            label: preset,
            description: `${type} Preset Spec`,
            badgeColor: getBadgeColorForLabel(type),
            initials: getInitialsForLabel(type),
          })
        })
      })

    return [...curPresets, ...otherPresets]
  }, [formData.type])

  // Searchable Dropdown Options for Dimensions Presets
  const dimensionOptions: SelectOption[] = useMemo(() => {
    const curType = formData.type || 'Chairs'
    const curPresets = (DIMENSION_PRESETS[curType] || DIMENSION_PRESETS['Chairs'] || []).map((preset) => ({
      value: preset.value,
      label: preset.label,
      description: preset.value,
      badgeColor: 'bg-orange-500 text-white',
      initials: getInitialsForLabel(preset.label),
    }))

    const otherPresets: SelectOption[] = []
    Object.entries(DIMENSION_PRESETS)
      .filter(([type]) => type !== curType)
      .forEach(([type, presets]) => {
        presets.forEach((preset) => {
          otherPresets.push({
            value: preset.value,
            label: `${preset.label} (${type})`,
            description: preset.value,
            badgeColor: getBadgeColorForLabel(type),
            initials: getInitialsForLabel(type),
          })
        })
      })

    return [...curPresets, ...otherPresets]
  }, [formData.type])

  // Searchable Dropdown Options for Production Lead Time
  const leadTimeOptions: SelectOption[] = useMemo(
    () => [
      {
        value: '1–2 Days',
        label: 'Ready to Ship (1–2 Days)',
        initials: 'RS',
        badgeColor: 'bg-emerald-500 text-white',
        description: 'Fast dispatch from ready stock warehouse',
      },
      {
        value: '3–5 Days',
        label: 'Express Assembly (3–5 Days)',
        initials: 'EA',
        badgeColor: 'bg-blue-600 text-white',
        description: 'Standard quick assembly and QC dispatch',
      },
      {
        value: '7–12 Days',
        label: 'Made to Order (7–12 Days)',
        initials: 'MO',
        badgeColor: 'bg-amber-500 text-white',
        description: 'Custom upholstery, laminates and bespoke sizing',
      },
      {
        value: '3–4 Weeks',
        label: 'Turnkey Commercial Fit-Out (3–4 Weeks)',
        initials: 'CF',
        badgeColor: 'bg-purple-600 text-white',
        description: 'Enterprise office floorplates & custom engineering',
      },
    ],
    []
  )

  const handleTypeSelect = (selectedType: string) => {
    if (selectedType === '__custom__') {
      setIsCustomType(true)
      setIsCustomCategory(true)
      setIsCustomSubCategory(true)
      setFormData((prev) => ({
        ...prev,
        type: '',
        category: '',
        subCategory: '',
      }))
      return
    }

    setIsCustomType(false)
    const availableCats = TYPE_CATEGORIES_MAP[selectedType] || []
    const defaultCat = availableCats[0] || 'Others'
    const availableSubs = CATEGORY_SUBCATEGORIES[defaultCat] || []
    const defaultSub = availableSubs[0] || ''

    setIsCustomCategory(false)
    setIsCustomSubCategory(false)

    // Suggest type-appropriate dimensions and material presets
    const typeDimPresets = DIMENSION_PRESETS[selectedType] || []
    const typeMatPresets = MATERIAL_PRESETS[selectedType] || []
    const defaultDim = typeDimPresets[0]?.value || formData.dimensions
    const defaultMat = typeMatPresets[0] || formData.material
    const parsed = parseDimensions(defaultDim)
    if (parsed) {
      setDimW(parsed.w)
      setDimD(parsed.d)
      setDimH(parsed.h)
    }

    setFormData((prev) => ({
      ...prev,
      type: selectedType,
      category: defaultCat,
      subCategory: defaultSub,
      dimensions: defaultDim,
      material: defaultMat,
    }))
  }

  const handleCategorySelect = (selectedCat: string) => {
    if (selectedCat === '__custom__') {
      setIsCustomCategory(true)
      setIsCustomSubCategory(true)
      setFormData((prev) => ({
        ...prev,
        category: '',
        subCategory: '',
      }))
      return
    }

    setIsCustomCategory(false)
    const availableSubs = CATEGORY_SUBCATEGORIES[selectedCat] || []
    const defaultSub = availableSubs[0] || ''

    setIsCustomSubCategory(false)
    setFormData((prev) => ({
      ...prev,
      category: selectedCat,
      subCategory: defaultSub,
    }))
  }

  const handleSubCategorySelect = (selectedSub: string) => {
    if (selectedSub === '__custom__') {
      setIsCustomSubCategory(true)
      setFormData((prev) => ({
        ...prev,
        subCategory: '',
      }))
      return
    }

    setIsCustomSubCategory(false)
    setFormData((prev) => ({
      ...prev,
      subCategory: selectedSub,
    }))
  }

  const handleOpenAdd = () => {
    setIsCustomType(false)
    setIsCustomCategory(false)
    setIsCustomSubCategory(false)
    setShowDimBuilder(false)
    const parsed = parseDimensions(initialFormData.dimensions)
    if (parsed) {
      setDimW(parsed.w)
      setDimD(parsed.d)
      setDimH(parsed.h)
    }
    setFormData({ ...initialFormData, images: [] })
    setIsAddModalOpen(true)
  }

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p)
    const resolvedType = p.type || inferTypeFromCategory(p.category)
    const isKnownType = (PRODUCT_TYPES as readonly string[]).includes(resolvedType)
    const availableCats = TYPE_CATEGORIES_MAP[resolvedType] || []
    const isKnownCat = availableCats.includes(p.category)
    const availableSubs = CATEGORY_SUBCATEGORIES[p.category] || []
    const isKnownSub = !p.subCategory || availableSubs.includes(p.subCategory)

    setIsCustomType(!isKnownType)
    setIsCustomCategory(!isKnownCat)
    setIsCustomSubCategory(!isKnownSub)
    setShowDimBuilder(false)

    const parsed = parseDimensions(p.dimensions || '')
    if (parsed) {
      setDimW(parsed.w)
      setDimD(parsed.d)
      setDimH(parsed.h)
    } else {
      setDimW('')
      setDimD('')
      setDimH('')
    }

    const mappedImages: UploadedImageItem[] =
      p.images && p.images.length > 0
        ? p.images.map((img, idx) => ({
            id: img.id || ('img-' + idx),
            url: img.url,
            r2Key: img.r2Key,
            isPrimary: img.isPrimary ?? (idx === 0),
            sortOrder: img.sortOrder ?? idx,
          }))
        : p.image
        ? [
            {
              id: 'init-0',
              url: p.image,
              r2Key: p.r2Key,
              isPrimary: true,
              sortOrder: 0,
            },
          ]
        : []

    setFormData({
      name: p.name,
      type: resolvedType,
      category: p.category,
      subCategory: p.subCategory || (availableSubs[0] || ''),
      price: p.price,
      oldPrice: p.oldPrice || ('' as any),
      rating: p.rating,
      image: p.image,
      images: mappedImages,
      cutout: p.cutout || false,
      description: p.description || '',
      material: p.material || '',
      dimensions: p.dimensions || '',
      inStock: p.inStock,
      featured: p.featured || false,
      isActive: p.isActive !== false,
      leadTime: p.leadTime || '3–5 Days',
      stockCount: p.stockCount,
      minOrderQuantity: p.minOrderQuantity || 1,
    })
  }

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    const parsedPrice = Number(formData.price)
    if (!formData.price || isNaN(parsedPrice) || parsedPrice <= 0) {
      alertModal({
        title: 'Invalid Product Price',
        message: 'Please enter a valid price greater than ₹0 before saving.',
        variant: 'warning',
      })
      return
    }

    const finalType = formData.type.trim() || inferTypeFromCategory(formData.category)
    const finalCat = formData.category.trim() || 'Others'
    const finalSub = formData.subCategory.trim() || undefined
    const parsedOldPrice =
      formData.oldPrice !== '' && Number(formData.oldPrice) > 0
        ? Number(formData.oldPrice)
        : undefined
    const parsedStock =
      formData.stockCount !== '' && !isNaN(Number(formData.stockCount))
        ? Math.max(0, Number(formData.stockCount))
        : 0

    const primaryImg = formData.images?.find((img) => img.isPrimary) || formData.images?.[0]
    const finalImageUrl = primaryImg ? primaryImg.url : (formData.image || '')
    const finalR2Key = primaryImg ? primaryImg.r2Key : undefined

    if (!finalImageUrl) {
      alertModal({
        title: 'Product Image Required',
        message: 'Please upload at least one product image or enter an image URL.',
        variant: 'warning',
      })
      return
    }

    const productPayload = {
      ...formData,
      image: finalImageUrl,
      r2Key: finalR2Key,
      images: (formData.images && formData.images.length > 0)
        ? formData.images.map((img, idx) => ({
            id: img.id,
            url: img.url,
            r2Key: img.r2Key,
            sortOrder: img.sortOrder ?? idx,
            isPrimary: img.isPrimary ?? (idx === 0),
          }))
        : undefined,
      price: parsedPrice,
      oldPrice: parsedOldPrice,
      stockCount: parsedStock,
      type: finalType,
      category: finalCat,
      subCategory: finalSub,
      isActive: formData.isActive,
      leadTime: formData.leadTime,
    }

    if (editingProduct) {
      updateProduct(editingProduct.id, productPayload)
      setEditingProduct(null)
    } else {
      addProduct(productPayload)
      setIsAddModalOpen(false)
    }
  }

  const handleDeleteProduct = async (product: Product) => {
    const ok = await confirm({
      title: `Move "${product.name}" to Recycle Bin?`,
      message: 'This product will be archived in the Recycle Bin. You can restore it to active catalog anytime or undo directly from the notification.',
      confirmText: 'Move to Recycle Bin',
      cancelText: 'Keep Product',
      variant: 'danger',
      icon: 'archive',
      badge: product.sku ? `SKU: ${product.sku}` : product.category,
    })
    if (ok) {
      deleteProduct(product.id)
    }
  }

  // Filter products
  const filteredProducts = products.filter((p) => {
    const resolvedType = p.type || inferTypeFromCategory(p.category)
    const matchesType = selectedType === 'All' || resolvedType === selectedType
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory
    const matchesSubCategory =
      selectedSubCategory === 'All' ||
      !selectedSubCategory ||
      (p.subCategory && p.subCategory.toLowerCase() === selectedSubCategory.toLowerCase())
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? p.isActive !== false
        : statusFilter === 'inactive'
        ? p.isActive === false
        : statusFilter === 'in_stock'
        ? p.inStock
        : !p.inStock
    const query = searchQuery.toLowerCase().trim()
    const matchesSearch =
      !query ||
      p.name.toLowerCase().includes(query) ||
      p.sku.toLowerCase().includes(query) ||
      (p.type && p.type.toLowerCase().includes(query)) ||
      p.material.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query) ||
      (p.subCategory && p.subCategory.toLowerCase().includes(query))

    return matchesType && matchesCategory && matchesSubCategory && matchesStatus && matchesSearch
  })

  // Pagination for catalog
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20

  React.useEffect(() => {
    setCurrentPage(1)
  }, [selectedType, selectedCategory, selectedSubCategory, statusFilter, searchQuery])

  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )


  return (
    <div className="space-y-4">
      {/* 1. Header Strip & Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-0.5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Products Catalog
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
              {products.length} Items Total
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
              {activeCount} Active
            </span>
            {inactiveCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-300">
                {inactiveCount} Inactive (Draft)
              </span>
            )}
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/70">
              {inStockCount} In Stock
            </span>
            {outOfStockCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/70">
                {outOfStockCount} Out of Stock
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Commercial furniture catalog, inventory status & factory pricing
          </p>
        </div>

        {/* Action Buttons: Recycle Bin + Category Settings + Add Product */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setCurrentView('recycle-bin')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-rose-50 hover:border-rose-300 text-slate-700 hover:text-rose-700 font-semibold text-xs shadow-xs transition-colors cursor-pointer"
            title="View Deleted Items in Recycle Bin"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-500 hover:text-rose-600" />
            <span>Recycle Bin</span>
            {deletedProducts.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                {deletedProducts.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('categories')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs transition-colors cursor-pointer"
            title="Manage Types, Categories, Subcategories & Presets"
          >
            <FolderTree className="w-3.5 h-3.5 text-orange-600" />
            <span>Category & Taxonomy</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* 2. Compact Filters & Controls Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-2.5 sm:p-3 shadow-xs space-y-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          {/* Row 1: Type Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 max-w-full">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
              Type:
            </span>
            <button
              onClick={() => {
                setSelectedType('All')
                setSelectedCategory('All')
                setSelectedSubCategory('All')
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                selectedType === 'All'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              All Types ({products.length})
            </button>
            {productTypes.map((t) => {
              const count = products.filter(
                (p) => (p.type || inferTypeFromCategory(p.category)) === t
              ).length
              const isSelected = selectedType === t
              return (
                <button
                  key={t}
                  onClick={() => {
                    setSelectedType(t)
                    setSelectedCategory('All')
                    setSelectedSubCategory('All')
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                      : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  <span>{t}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2 shrink-0 self-end lg:self-auto">
            {/* Status & Availability Dropdown */}
            <SearchableSelect
              value={statusFilter}
              onChange={(val) => setStatusFilter(val as any)}
              options={statusFilterOptions}
              clearable={false}
              placeholder="Status..."
              searchPlaceholder="Filter status..."
              className="w-48 sm:w-52"
            />

            {/* View Switcher (Table vs Grid) */}
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
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded-md transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Grid View"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1.5 border-t border-slate-100 max-w-full">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
            Category:
          </span>
          <button
            onClick={() => {
              setSelectedCategory('All')
              setSelectedSubCategory('All')
            }}
            className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
              selectedCategory === 'All'
                ? 'bg-orange-600 text-white shadow-2xs'
                : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
            }`}
          >
            All {selectedType !== 'All' ? selectedType : 'Categories'} (
            {
              products.filter((p) =>
                selectedType === 'All'
                  ? true
                  : (p.type || inferTypeFromCategory(p.category)) === selectedType
              ).length
            }
            )
          </button>
          {availableCategoriesForFilter.map((cat) => {
            const count = products.filter((p) => {
              const matchesType =
                selectedType === 'All' ||
                (p.type || inferTypeFromCategory(p.category)) === selectedType
              return matchesType && p.category === cat
            }).length
            const isSelected = selectedCategory === cat
            return (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat)
                  setSelectedSubCategory('All')
                }}
                className={`px-3 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-orange-600 text-white font-semibold shadow-2xs'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Sub-Category Tabs */}
        {selectedCategory !== 'All' && (() => {
          const subs = Array.from(
            new Set([
              ...(CATEGORY_SUBCATEGORIES[selectedCategory] || []),
              ...products
                .filter((p) => p.category === selectedCategory && p.subCategory)
                .map((p) => p.subCategory as string),
            ])
          ).filter(Boolean)
          if (subs.length === 0) return null
          return (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-2 border-t border-slate-100 max-w-full animate-fade-in">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
                Sub-categories:
              </span>
              <button
                onClick={() => setSelectedSubCategory('All')}
                className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                  selectedSubCategory === 'All'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                }`}
              >
                All {selectedCategory.toLowerCase()} ({products.filter((p) => p.category === selectedCategory).length})
              </button>

              {subs.map((subCat) => {
                const count = products.filter(
                  (p) => p.category === selectedCategory && p.subCategory === subCat
                ).length
                const isSelected = selectedSubCategory === subCat

                return (
                  <button
                    key={subCat}
                    onClick={() => setSelectedSubCategory(subCat)}
                    className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                        : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                    }`}
                  >
                    <span>{subCat}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          )
        })()}

        {/* Active Filter Chips */}
        {(selectedType !== 'All' || selectedCategory !== 'All' || selectedSubCategory !== 'All' || statusFilter !== 'all' || searchQuery) && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1 border-t border-slate-100 flex-wrap">
            <span className="font-medium text-[11px] text-slate-400">Filters:</span>
            {selectedType !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-300 text-[11px] font-semibold">
                Type: {selectedType}
                <button
                  onClick={() => setSelectedType('All')}
                  className="hover:text-rose-600 font-bold ml-0.5 cursor-pointer"
                  title="Clear type filter"
                >
                  ×
                </button>
              </span>
            )}
            {selectedCategory !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200 text-[11px] font-semibold">
                Category: {selectedCategory}
                <button
                  onClick={() => setSelectedCategory('All')}
                  className="hover:text-rose-600 font-bold ml-0.5 cursor-pointer"
                  title="Clear category filter"
                >
                  ×
                </button>
              </span>
            )}
            {selectedSubCategory !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold">
                Sub-category: {selectedSubCategory}
                <button
                  onClick={() => setSelectedSubCategory('All')}
                  className="hover:text-amber-950 font-bold ml-0.5 cursor-pointer"
                  title="Clear subcategory filter"
                >
                  ×
                </button>
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold">
                Status:{' '}
                {statusFilter === 'active'
                  ? 'Active Only'
                  : statusFilter === 'inactive'
                  ? 'Inactive (Drafts)'
                  : statusFilter === 'in_stock'
                  ? 'In Stock'
                  : 'Out of Stock'}
                <button
                  onClick={() => setStatusFilter('all')}
                  className="hover:text-blue-900 font-bold ml-0.5 cursor-pointer"
                  title="Clear status filter"
                >
                  ×
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium font-mono">
                Keyword: "{searchQuery}"
              </span>
            )}
            <button
              onClick={() => {
                setSelectedType('All')
                setSelectedCategory('All')
                setSelectedSubCategory('All')
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

      {/* 3. Main Data Container: Compact Minimal Table or Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center space-y-3 shadow-xs">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
          <h4 className="text-sm sm:text-base font-bold text-slate-900">No products found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No items matched the current filter criteria or search keyword.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('All')
              setStatusFilter('all')
              setSearchQuery('')
            }}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3 h-3" /> Reset Filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* COMPACT MINIMAL TABLE VIEW */
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[880px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3.5">Product & SKU</th>
                  <th className="py-2.5 px-3.5">Category & Sub-Category</th>
                  <th className="py-2.5 px-3.5">Price / MSRP</th>
                  <th className="py-2.5 px-3.5">Status (Visibility)</th>
                  <th className="py-2.5 px-3.5">Stock Status</th>
                  <th className="py-2.5 px-3.5">Dimensions & Material</th>
                  <th className="py-2.5 px-3.5 text-center">Featured</th>
                  <th className="py-2.5 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {paginatedProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Product & SKU */}
                    <td className="py-2 px-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-slate-100/80 border border-slate-200/70 overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className={`w-full h-full ${
                                product.cutout ? 'object-contain mix-blend-multiply' : 'object-cover'
                              }`}
                              onError={(e) => {
                                ;(e.target as HTMLElement).style.display = 'none'
                              }}
                            />
                          ) : (
                            <Package className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0 max-w-[230px]">
                          <span
                            onClick={() => setPreviewProduct(product)}
                            className="font-bold text-slate-900 text-xs sm:text-[13px] block truncate hover:text-[#F97316] transition-colors cursor-pointer leading-tight"
                            title={product.name}
                          >
                            {product.name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                            {product.sku}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category & Sub-Category */}
                    <td className="py-2 px-3.5 whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-orange-50 text-orange-700 border border-orange-200/70">
                          {product.category}
                        </span>
                        {product.subCategory && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200/80">
                            {product.subCategory}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Price */}
                    <td className="py-2 px-3.5 whitespace-nowrap">
                      <div className="font-mono">
                        <span className="font-bold text-slate-900 text-xs sm:text-[13px]">
                          ₹{product.price.toLocaleString('en-IN')}
                        </span>
                        {product.oldPrice ? (
                          <span className="text-[10px] text-slate-400 line-through block leading-tight">
                            ₹{product.oldPrice.toLocaleString('en-IN')}
                          </span>
                        ) : null}
                      </div>
                    </td>

                    {/* Status / Visibility Inline Toggle */}
                    <td className="py-2 px-3.5 whitespace-nowrap">
                      <button
                        onClick={() => toggleProductActive(product.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                          product.isActive !== false
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                        }`}
                        title={
                          product.isActive !== false
                            ? 'Active on Storefront (Click to Hide/Deactivate)'
                            : 'Inactive / Draft (Click to Publish/Activate)'
                        }
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            product.isActive !== false ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        <span>{product.isActive !== false ? 'Active' : 'Inactive (Draft)'}</span>
                      </button>
                    </td>

                    {/* Stock Status & Inline Toggle */}
                    <td className="py-2 px-3.5 whitespace-nowrap">
                      <button
                        onClick={() => toggleProductStock(product.id)}
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                          product.inStock
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-200/80 hover:bg-rose-100'
                        }`}
                        title="Click to toggle availability"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            product.inStock ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        <span>
                          {product.inStock ? `In Stock (${product.stockCount})` : 'Out of Stock'}
                        </span>
                      </button>
                    </td>

                    {/* Dimensions & Material */}
                    <td className="py-2 px-3.5">
                      <div className="max-w-[200px]">
                        <span className="text-slate-700 text-[11.5px] block truncate font-medium">
                          {product.dimensions || 'Standard size'}
                        </span>
                        <span className="text-slate-400 text-[10.5px] block truncate mt-0.5">
                          {product.material || 'Commercial grade'}
                        </span>
                      </div>
                    </td>

                    {/* Featured */}
                    <td className="py-2 px-3.5 text-center whitespace-nowrap">
                      <button
                        onClick={() => toggleProductFeatured(product.id)}
                        className={`p-1 rounded-md transition-colors cursor-pointer inline-flex items-center justify-center ${
                          product.featured
                            ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
                            : 'text-slate-300 hover:text-slate-400 hover:bg-slate-100'
                        }`}
                        title={product.featured ? 'Featured on landing page' : 'Not featured'}
                      >
                        <Star className={`w-3.5 h-3.5 ${product.featured ? 'fill-amber-400' : ''}`} />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-2 px-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setPreviewProduct(product)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Quick Preview"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(product)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 rounded-md hover:bg-amber-50 transition-colors cursor-pointer"
                          title="Edit Item"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Move to Recycle Bin"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer Summary */}
          <div className="px-3.5 py-2.5 bg-slate-50/70 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing <strong className="text-slate-700 font-semibold">{filteredProducts.length}</strong> of{' '}
              <strong className="text-slate-700 font-semibold">{products.length}</strong> catalog items
            </span>
            <span className="text-[11px] text-slate-400">
              Click status badges to toggle live availability
            </span>
          </div>
        </div>
      ) : (
        /* GRID VIEW (CLEAN WHITE CARDS) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {paginatedProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all overflow-hidden flex flex-col justify-between group"
            >
              <div>
                {/* Product Image Box */}
                <div className="relative h-40 bg-slate-50 p-3 flex items-center justify-center border-b border-slate-100 overflow-hidden">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className={`w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 ${
                        product.cutout ? 'mix-blend-multiply' : ''
                      }`}
                    />
                  ) : (
                    <Package className="w-8 h-8 text-slate-300" />
                  )}

                  <div className="absolute top-2 left-2 flex items-center gap-1 flex-wrap max-w-[85%]">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/95 text-slate-700 border border-slate-200 shadow-2xs">
                      {product.category}
                    </span>
                    {product.subCategory && (
                      <span className="px-1.5 py-0.5 rounded-md text-[9.5px] font-bold bg-amber-500 text-white shadow-2xs">
                        {product.subCategory}
                      </span>
                    )}
                  </div>

                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleProductActive(product.id)}
                      className={`px-1.5 py-0.5 rounded-md text-[9.5px] font-bold border transition-colors cursor-pointer ${
                        product.isActive !== false
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
                      }`}
                      title={product.isActive !== false ? 'Active on store (Click to disable)' : 'Draft / Inactive (Click to publish)'}
                    >
                      {product.isActive !== false ? 'Active' : 'Draft'}
                    </button>
                    {product.featured && (
                      <span className="p-1 rounded-full bg-amber-100 text-amber-600 shadow-2xs">
                        <Star className="w-3 h-3 fill-amber-500" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="p-3.5 space-y-1.5">
                  <div className="flex items-start justify-between gap-1.5">
                    <h4
                      onClick={() => setPreviewProduct(product)}
                      className="text-xs sm:text-[13px] font-bold text-slate-900 leading-snug line-clamp-1 hover:text-[#F97316] transition-colors cursor-pointer"
                      title={product.name}
                    >
                      {product.name}
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {product.sku}
                    </span>
                  </div>

                  <p className="text-[11.5px] text-slate-500 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>

                  <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100">
                    <div>
                      <span className="text-xs sm:text-[13px] font-bold text-slate-900 font-mono">
                        ₹{product.price.toLocaleString('en-IN')}
                      </span>
                      {product.oldPrice ? (
                        <span className="text-[10px] text-slate-400 line-through ml-1.5">
                          ₹{product.oldPrice.toLocaleString('en-IN')}
                        </span>
                      ) : null}
                    </div>

                    <button
                      onClick={() => toggleProductStock(product.id)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold border cursor-pointer ${
                        product.inStock
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {product.inStock ? 'In Stock' : 'Out of Stock'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Strip */}
              <div className="p-2.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setPreviewProduct(product)}
                  className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" /> Preview
                </button>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => handleOpenEdit(product)}
                    className="p-1 text-slate-400 hover:text-amber-600 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Move to Recycle Bin"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border border-slate-200/90 rounded-xl text-xs text-slate-600 shadow-2xs">
          <div>
            Showing <span className="font-semibold text-slate-900">{(currentPage - 1) * pageSize + 1}</span> to{' '}
            <span className="font-semibold text-slate-900">{Math.min(currentPage * pageSize, filteredProducts.length)}</span> of{' '}
            <span className="font-semibold text-slate-900">{filteredProducts.length}</span> items
          </div>
          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition cursor-pointer font-medium"
            >
              Previous
            </button>
            <span className="px-2.5 py-1 text-slate-700 font-semibold tabular-nums">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition cursor-pointer font-medium"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* 4. Add / Edit Product Slide-Over Drawer */}
      <Drawer
        isOpen={isAddModalOpen || editingProduct !== null}
        onClose={() => {
          setIsAddModalOpen(false)
          setEditingProduct(null)
        }}
        title={editingProduct ? `Edit ${editingProduct.name}` : 'Add New Commercial Product'}
        subtitle="Publish to Brothers Furniture catalog & landing app"
        maxWidth="max-w-2xl sm:max-w-3xl lg:max-w-4xl xl:max-w-5xl"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          {/* Product Title */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Product Title <span className="text-orange-500">*</span>
            </label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Orbit 6-Seater Workstation, Axis Mesh Chair"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition font-medium"
            />
          </div>

          {/* 3-Tier Hierarchy: Type -> Category -> Sub-Category */}
          <div className="bg-slate-50/90 border border-slate-200/90 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Catalog Hierarchy
                </h4>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                Type → Category → Sub-Category
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* 1. PRODUCT TYPE */}
              <div className="space-y-1.5 bg-white border border-slate-200/90 rounded-xl p-3 sm:p-3.5 shadow-2xs relative focus-within:z-30 hover:z-20">
                <div className="flex items-center justify-between gap-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 min-w-0">
                    <span className="truncate">1. Type</span>
                    <span className="text-orange-500">*</span>
                    {isCustomType && (
                      <span className="text-[9.5px] px-1.5 py-0.2 rounded font-bold bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
                        Manual
                      </span>
                    )}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (isCustomType) {
                        handleTypeSelect('Chairs')
                      } else {
                        handleTypeSelect('__custom__')
                      }
                    }}
                    className="text-[10.5px] text-orange-600 hover:text-orange-700 font-semibold cursor-pointer underline hover:no-underline shrink-0"
                  >
                    {isCustomType ? '↺ Presets' : '+ Enter new'}
                  </button>
                </div>

                {isCustomType ? (
                  <input
                    required
                    type="text"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    placeholder="e.g. Chairs, Tables, Pods"
                    className="w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-amber-300 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition font-medium"
                  />
                ) : (
                  <SearchableSelect
                    value={formData.type}
                    onChange={(val) => {
                      if (val === '__custom__') {
                        handleTypeSelect('__custom__')
                      } else {
                        handleTypeSelect(val)
                      }
                    }}
                    options={typeOptions}
                    placeholder="Select Type..."
                    searchPlaceholder="Search type (e.g. Chairs, Tables)..."
                    allowCustom={true}
                    customOptionLabel="+ Enter Custom Type..."
                    onCustomSelect={(customVal) => {
                      if (customVal) {
                        setIsCustomType(true)
                        setIsCustomCategory(true)
                        setIsCustomSubCategory(true)
                        setFormData((prev) => ({
                          ...prev,
                          type: customVal,
                          category: '',
                          subCategory: '',
                        }))
                      } else {
                        handleTypeSelect('__custom__')
                      }
                    }}
                    clearable={false}
                  />
                )}
              </div>

              {/* 2. CATEGORY */}
              <div className="space-y-1.5 bg-white border border-slate-200/90 rounded-xl p-3 sm:p-3.5 shadow-2xs relative focus-within:z-30 hover:z-20">
                <div className="flex items-center justify-between gap-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 min-w-0">
                    <span className="truncate">2. Category</span>
                    <span className="text-orange-500">*</span>
                    {isCustomCategory && (
                      <span className="text-[9.5px] px-1.5 py-0.2 rounded font-bold bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
                        Manual
                      </span>
                    )}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (isCustomCategory) {
                        const defaultCat = currentAvailableCategories[0] || 'Office Chairs'
                        handleCategorySelect(defaultCat)
                      } else {
                        handleCategorySelect('__custom__')
                      }
                    }}
                    className="text-[10.5px] text-orange-600 hover:text-orange-700 font-semibold cursor-pointer underline hover:no-underline shrink-0"
                  >
                    {isCustomCategory ? '↺ Presets' : '+ Enter new'}
                  </button>
                </div>

                {isCustomCategory ? (
                  <input
                    required
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g. Office Chairs, Lounge"
                    className="w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-amber-300 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition font-medium"
                  />
                ) : (
                  <SearchableSelect
                    value={formData.category}
                    onChange={(val) => {
                      if (val === '__custom__') {
                        handleCategorySelect('__custom__')
                      } else {
                        handleCategorySelect(val)
                      }
                    }}
                    options={categoryOptions}
                    placeholder="Select Category..."
                    searchPlaceholder="Search category..."
                    allowCustom={true}
                    customOptionLabel="+ Enter Custom Category..."
                    onCustomSelect={(customVal) => {
                      if (customVal) {
                        setIsCustomCategory(true)
                        setIsCustomSubCategory(true)
                        setFormData((prev) => ({
                          ...prev,
                          category: customVal,
                          subCategory: '',
                        }))
                      } else {
                        handleCategorySelect('__custom__')
                      }
                    }}
                    clearable={false}
                  />
                )}
              </div>

              {/* 3. SUB-CATEGORY */}
              <div className="space-y-1.5 bg-white border border-slate-200/90 rounded-xl p-3 sm:p-3.5 shadow-2xs relative focus-within:z-30 hover:z-20">
                <div className="flex items-center justify-between gap-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 min-w-0">
                    <span className="truncate">3. Sub-Category</span>
                    {isCustomSubCategory && (
                      <span className="text-[9.5px] px-1.5 py-0.2 rounded font-bold bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
                        Manual
                      </span>
                    )}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (isCustomSubCategory) {
                        const defaultSub = currentAvailableSubCategories[0] || ''
                        handleSubCategorySelect(defaultSub)
                      } else {
                        handleSubCategorySelect('__custom__')
                      }
                    }}
                    className="text-[10.5px] text-orange-600 hover:text-orange-700 font-semibold cursor-pointer underline hover:no-underline shrink-0"
                  >
                    {isCustomSubCategory ? '↺ Presets' : '+ Enter new'}
                  </button>
                </div>

                {isCustomSubCategory ? (
                  <input
                    type="text"
                    value={formData.subCategory}
                    onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                    placeholder="e.g. Ergonomic Chairs, Task Chairs"
                    className="w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-amber-300 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition font-medium"
                  />
                ) : (
                  <SearchableSelect
                    value={formData.subCategory}
                    onChange={(val) => {
                      if (val === '__custom__') {
                        handleSubCategorySelect('__custom__')
                      } else {
                        handleSubCategorySelect(val)
                      }
                    }}
                    options={subCategoryOptions}
                    placeholder="Select Sub-Category..."
                    searchPlaceholder="Search sub-category..."
                    allowCustom={true}
                    customOptionLabel="+ Enter Custom Sub-Category..."
                    onCustomSelect={(customVal) => {
                      if (customVal) {
                        setIsCustomSubCategory(true)
                        setFormData((prev) => ({
                          ...prev,
                          subCategory: customVal,
                        }))
                      } else {
                        handleSubCategorySelect('__custom__')
                      }
                    }}
                    clearable={true}
                  />
                )}
              </div>
            </div>

            {/* Live Breadcrumb Path Preview */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-white/80 px-2.5 py-1.5 rounded-lg border border-slate-200/70 flex-wrap">
              <span className="text-slate-400 font-semibold">Hierarchy Path:</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-100 font-bold text-slate-700 uppercase text-[10px]">
                {formData.type || '(Type)'}
              </span>
              <span className="text-slate-300">›</span>
              <span className="px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200/60 font-semibold">
                {formData.category || '(Category)'}
              </span>
              <span className="text-slate-300">›</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/60 font-semibold">
                {formData.subCategory || '(No sub-category)'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Price (₹ INR) <span className="text-orange-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold select-none">
                  ₹
                </span>
                <input
                  required
                  type="number"
                  min="1"
                  step="any"
                  placeholder="e.g. 25000"
                  value={formData.price}
                  onChange={(e) => {
                    const val = e.target.value
                    setFormData({
                      ...formData,
                      price: val === '' ? '' : Number(val),
                    })
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg pl-7 pr-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition placeholder:text-slate-300"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                MSRP / Old Price (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold select-none">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Optional (e.g. 35000)"
                  value={formData.oldPrice}
                  onChange={(e) => {
                    const val = e.target.value
                    setFormData({
                      ...formData,
                      oldPrice: val === '' ? '' : Number(val),
                    })
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg pl-7 pr-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition placeholder:text-slate-300"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Inventory Count</label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 10"
                value={formData.stockCount}
                onChange={(e) => {
                  const val = e.target.value
                  const count = val === '' ? '' : Number(val)
                  setFormData({
                    ...formData,
                    stockCount: count,
                    inStock: count === '' ? true : Number(count) > 0,
                  })
                }}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition placeholder:text-slate-300"
              />
            </div>
          </div>

          {/* Cloudflare R2 Product Image Upload */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs">
            <ProductImageUpload
              productId={editingProduct?.id}
              images={formData.images || []}
              onChange={(imgs) => {
                const primary = imgs.find((i) => i.isPrimary) || imgs[0]
                setFormData((prev) => ({
                  ...prev,
                  images: imgs,
                  image: primary ? primary.url : '',
                }))
              }}
            />
          </div>

          {/* Specifications: Materials Used & Dimensions */}
          <div className="bg-slate-50/90 border border-slate-200/90 rounded-xl p-3.5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Specifications & Measurements
                </h4>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                Presets, Quick Chips & Custom Builder
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
              {/* 1. MATERIALS USED */}
              <div className="bg-white border border-slate-200/90 rounded-xl p-3 sm:p-3.5 shadow-2xs space-y-2.5 flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-orange-500" />
                      <span>Materials Used</span>
                    </label>
                    {formData.material && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, material: '' })}
                        className="text-[10.5px] text-slate-400 hover:text-rose-600 transition cursor-pointer flex items-center gap-0.5 font-medium"
                        title="Clear materials"
                      >
                        <X className="w-3 h-3" /> Clear
                      </button>
                    )}
                  </div>

                  {/* Material Presets Dropdown */}
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Preset Dropdown Selection (Searchable)
                    </label>
                    <SearchableSelect
                      value=""
                      onChange={(val) => {
                        if (!val) return
                        setFormData({ ...formData, material: val })
                      }}
                      options={materialOptions}
                      placeholder="📋 Choose from standard material presets..."
                      searchPlaceholder="Search materials (e.g. Mesh, Wood, Steel)..."
                      clearable={false}
                    />
                  </div>

                  {/* Editable Material Input */}
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Custom / Edited Value
                    </label>
                    <input
                      type="text"
                      value={formData.material}
                      onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                      placeholder="e.g. High-Tensile Mesh, Moulded PU Foam, Aluminium Base"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition font-medium"
                    />
                  </div>
                </div>

                {/* Quick-Pick Material Chips */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-[10.5px] font-medium text-slate-400 mb-1.5 flex items-center justify-between">
                    <span>Quick tags (click to add / remove):</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formData.material ? `${formData.material.split(',').filter(Boolean).length} tags` : 'None'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto pr-0.5">
                    {COMMON_MATERIAL_TAGS.map((tag) => {
                      const active = isMaterialTagActive(tag)
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleMaterialTag(tag)}
                          className={`text-[10.5px] px-2 py-0.5 rounded-md border transition cursor-pointer flex items-center gap-1 ${
                            active
                              ? 'bg-orange-500 text-white border-orange-600 font-semibold shadow-2xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/80'
                          }`}
                        >
                          {active ? <Check className="w-2.5 h-2.5 shrink-0" /> : <Plus className="w-2.5 h-2.5 text-slate-400 shrink-0" />}
                          <span>{tag}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* 2. DIMENSIONS */}
              <div className="bg-white border border-slate-200/90 rounded-xl p-3 sm:p-3.5 shadow-2xs space-y-2.5 flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Ruler className="w-3.5 h-3.5 text-orange-500" />
                      <span>Dimensions</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowDimBuilder(!showDimBuilder)}
                        className="text-[10.5px] text-orange-600 hover:text-orange-700 font-semibold cursor-pointer underline hover:no-underline"
                      >
                        {showDimBuilder ? 'Close W×D×H' : '✏️ W×D×H Builder'}
                      </button>
                      {formData.dimensions && (
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, dimensions: '' })
                            setDimW('')
                            setDimD('')
                            setDimH('')
                          }}
                          className="text-[10.5px] text-slate-400 hover:text-rose-600 transition cursor-pointer flex items-center gap-0.5 font-medium"
                          title="Clear dimensions"
                        >
                          <X className="w-3 h-3" /> Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Dimension Presets Dropdown */}
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Preset Dropdown Selection (Searchable)
                    </label>
                    <SearchableSelect
                      value=""
                      onChange={(val) => {
                        if (!val) return
                        setFormData({ ...formData, dimensions: val })
                        const parsed = parseDimensions(val)
                        if (parsed) {
                          setDimW(parsed.w)
                          setDimD(parsed.d)
                          setDimH(parsed.h)
                        }
                      }}
                      options={dimensionOptions}
                      placeholder="📐 Choose from standard dimension presets..."
                      searchPlaceholder="Search dimension presets (e.g. 140, Exec, Round)..."
                      clearable={false}
                    />
                  </div>

                  {/* Editable Dimensions Input */}
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Custom / Edited Value
                    </label>
                    <input
                      type="text"
                      value={formData.dimensions}
                      onChange={(e) => {
                        const val = e.target.value
                        setFormData({ ...formData, dimensions: val })
                        const parsed = parseDimensions(val)
                        if (parsed) {
                          setDimW(parsed.w)
                          setDimD(parsed.d)
                          setDimH(parsed.h)
                        }
                      }}
                      placeholder="e.g. W 140 × D 70 × H 75 cm or Dia 90 × H 75 cm"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition font-medium"
                    />
                  </div>

                  {/* Interactive Numeric W × D × H Builder */}
                  {showDimBuilder && (
                    <div className="p-2.5 bg-orange-50/60 rounded-lg border border-orange-200 space-y-1.5">
                      <div className="flex items-center justify-between text-[10.5px]">
                        <span className="font-bold text-orange-900 flex items-center gap-1">
                          <Ruler className="w-3 h-3 text-orange-600" />
                          Numeric Size Builder (in cm)
                        </span>
                        <span className="text-orange-600 font-mono text-[10px]">
                          Auto-updates text
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">Width (W)</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={dimW}
                              onChange={(e) => updateDimFromParts(e.target.value, dimD, dimH)}
                              placeholder="140"
                              className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono text-slate-800 focus:outline-none focus:border-orange-500"
                            />
                            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9.5px] text-slate-400 font-mono select-none">cm</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">Depth (D)</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={dimD}
                              onChange={(e) => updateDimFromParts(dimW, e.target.value, dimH)}
                              placeholder="70"
                              className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono text-slate-800 focus:outline-none focus:border-orange-500"
                            />
                            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9.5px] text-slate-400 font-mono select-none">cm</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">Height (H)</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={dimH}
                              onChange={(e) => updateDimFromParts(dimW, dimD, e.target.value)}
                              placeholder="75"
                              className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono text-slate-800 focus:outline-none focus:border-orange-500"
                            />
                            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9.5px] text-slate-400 font-mono select-none">cm</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick-Pick Dimension Pills */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-[10.5px] font-medium text-slate-400 mb-1.5 flex items-center justify-between">
                    <span>Popular sizes for {formData.type || 'Chairs'}:</span>
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto pr-0.5">
                    {(QUICK_DIMENSION_CHIPS[formData.type] || QUICK_DIMENSION_CHIPS['Chairs'] || []).map((chip) => {
                      const isSelected = formData.dimensions === chip.value
                      return (
                        <button
                          key={chip.value}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, dimensions: chip.value })
                            const parsed = parseDimensions(chip.value)
                            if (parsed) {
                              setDimW(parsed.w)
                              setDimD(parsed.d)
                              setDimH(parsed.h)
                            }
                          }}
                          className={`text-[10.5px] px-2 py-0.5 rounded-md border transition cursor-pointer flex items-center gap-1 ${
                            isSelected
                              ? 'bg-orange-500 text-white border-orange-600 font-semibold shadow-2xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/80'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 shrink-0" />}
                          <span>{chip.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Description / Blurb</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed description of features, acoustic screens, wire management, etc."
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition resize-none"
            />
          </div>

          {/* Active / Inactive Visibility Switch */}
          <div className="p-3.5 rounded-xl bg-orange-50/70 border border-orange-200/90 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${formData.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                <span className="text-xs font-bold text-slate-900">
                  {formData.isActive ? 'Product is Active (Published)' : 'Product is Inactive (Draft / Hidden)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {formData.isActive
                  ? 'Visible on public storefront, searchable, and available for client inquiries.'
                  : 'Hidden from public website without deleting catalog data.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                formData.isActive ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  formData.isActive ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Production Lead Time selector */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Production Lead Time (Manufacturing Schedule)
            </label>
            <SearchableSelect
              value={formData.leadTime}
              onChange={(val) => setFormData({ ...formData, leadTime: val })}
              options={leadTimeOptions}
              placeholder="Select production lead time..."
              searchPlaceholder="Search lead time schedule..."
              clearable={false}
            />
          </div>

          <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={formData.inStock}
                onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                className="rounded accent-orange-500 w-4 h-4 cursor-pointer"
              />
              <span>In Stock</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="rounded accent-orange-500 w-4 h-4 cursor-pointer"
              />
              <span>Feature on Home</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={formData.cutout}
                onChange={(e) => setFormData({ ...formData, cutout: e.target.checked })}
                className="rounded accent-orange-500 w-4 h-4 cursor-pointer"
              />
              <span>Cutout Shot</span>
            </label>
          </div>

          <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs pt-3 pb-1 border-t border-slate-200 -mx-4 sm:-mx-6 px-4 sm:px-6 flex items-center justify-end gap-2.5 mt-4 z-10">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false)
                setEditingProduct(null)
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
              <span>{editingProduct ? 'Save Changes' : 'Publish Product'}</span>
            </button>
          </div>
        </form>
      </Drawer>

      {/* 5. Product Preview Modal (Clean Light Theme) */}
      {previewProduct && (
        <Modal
          isOpen={true}
          onClose={() => setPreviewProduct(null)}
          title={previewProduct.name}
          subtitle={`${previewProduct.type || inferTypeFromCategory(previewProduct.category)} • ${previewProduct.category}${previewProduct.subCategory ? ` • ${previewProduct.subCategory}` : ''} · SKU: ${previewProduct.sku}`}
        >
          <div className="space-y-4">
            <div className="h-60 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center p-4 overflow-hidden">
              {previewProduct.image ? (
                <img
                  src={previewProduct.image}
                  alt={previewProduct.name}
                  className={`max-h-full max-w-full ${
                    previewProduct.cutout ? 'object-contain mix-blend-multiply' : 'object-cover'
                  }`}
                />
              ) : (
                <Package className="w-12 h-12 text-slate-300" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Factory Pricing</span>
                <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">
                  ₹{previewProduct.price.toLocaleString('en-IN')}
                </span>
                {previewProduct.oldPrice ? (
                  <span className="text-slate-400 text-[11px] line-through block">
                    ₹{previewProduct.oldPrice.toLocaleString('en-IN')}
                  </span>
                ) : null}
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Inventory Status</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">
                  {previewProduct.inStock
                    ? `${previewProduct.stockCount} units available`
                    : 'Currently Out of Stock'}
                </span>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <span className="text-slate-500 font-semibold text-[11px]">Commercial Description</span>
              <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                {previewProduct.description || 'No description provided.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Dimensions</span>
                <span className="text-slate-800 font-medium">{previewProduct.dimensions || 'N/A'}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Materials</span>
                <span className="text-slate-800 font-medium">{previewProduct.material || 'N/A'}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setPreviewProduct(null)}
                className="px-4 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
