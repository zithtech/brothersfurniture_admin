import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  initialChairs,
  initialClients,
  initialLeads,
  initialOrders,
  initialProducts,
  initialSettings,
  initialTestimonials,
} from '../data/initialData'
import { DEFAULT_CATALOG_TAXONOMY } from '../data/taxonomyDefaults'
import { api } from '../services/api'
import type {
  AdminView,
  CatalogTaxonomyData,
  Category,
  CategoryConfig,
  ClientPartner,
  CompanySettings,
  DeletedCategory,
  DeletedProduct,
  DeletedType,
  ErgonomicChairModel,
  Invoice,
  InvoiceStatus,
  Lead,
  LeadStatus,
  Order,
  OrderStatus,
  PaymentMode,
  PaymentStatus,
  Product,
  ProductionSettings,
  Proposal,
  ProposalStatus,
  SubCategoryConfig,
  TestimonialReview,
  ToastAction,
  ToastMessage,
  TypeConfig,
  ConfirmOptions,
  AlertOptions,
} from '../types/admin'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { AlertDialog } from '../components/common/AlertDialog'

interface AdminContextType {
  currentView: AdminView
  setCurrentView: (view: AdminView) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  categories: Category[]
  productTypes: string[]
  typeCategoriesMap: Record<string, string[]>
  categorySubcategoriesMap: Record<string, string[]>
  materialPresetsMap: Record<string, string[]>
  dimensionPresetsMap: Record<string, { label: string; value: string }[]>
  isBackendConnected: boolean
  isSyncing: boolean
  refreshFromBackend: () => Promise<void>

  // Products
  products: Product[]
  addProduct: (product: Omit<Product, 'id' | 'sku' | 'updatedAt'>) => void
  updateProduct: (id: string, product: Partial<Product>) => void
  deleteProduct: (id: string) => void
  toggleProductStock: (id: string) => void
  toggleProductFeatured: (id: string) => void
  toggleProductActive: (id: string) => void

  // Recycle Bin & Archive
  deletedProducts: DeletedProduct[]
  deletedCategories: DeletedCategory[]
  deletedTypes: DeletedType[]
  totalBinCount: number
  restoreProduct: (id: string) => Promise<void>
  permanentlyDeleteProduct: (id: string) => Promise<void>
  restoreAllProducts: () => Promise<void>
  emptyProductBin: () => Promise<void>
  restoreCategory: (id: string) => void
  permanentlyDeleteCategory: (id: string) => void
  restoreType: (id: string) => void
  permanentlyDeleteType: (id: string) => void

  // Catalog Taxonomy & Production Settings
  taxonomy: CatalogTaxonomyData
  types: TypeConfig[]
  categoryConfigs: CategoryConfig[]
  productionSettings: ProductionSettings
  addType: (name: string, description?: string) => void
  updateType: (id: string, name: string, description?: string) => void
  deleteType: (id: string) => { success: boolean; message?: string }
  toggleTypeActive: (id: string) => void
  addCategory: (type: string, name: string, description?: string, leadTime?: string, moq?: number) => void
  updateCategory: (id: string, partial: Partial<CategoryConfig>) => void
  deleteCategory: (id: string) => { success: boolean; message?: string }
  toggleCategoryActive: (id: string) => void
  addSubCategory: (categoryId: string, name: string, description?: string, leadTime?: string, moq?: number) => void
  updateSubCategory: (categoryId: string, subId: string, partial: Partial<SubCategoryConfig>) => void
  deleteSubCategory: (categoryId: string, subId: string) => { success: boolean; message?: string }
  toggleSubCategoryActive: (categoryId: string, subId: string) => void
  updateProductionSettings: (partial: Partial<ProductionSettings>) => void
  resetTaxonomyToDefaults: () => void

  // Ergonomic Chairs
  chairs: ErgonomicChairModel[]
  addChair: (chair: Omit<ErgonomicChairModel, 'id'>) => void
  updateChair: (id: string, chair: Partial<ErgonomicChairModel>) => void
  deleteChair: (id: string) => void
  toggleChairProduction: (id: string) => void

  // Leads
  leads: Lead[]
  addLead: (lead: Omit<Lead, 'id' | 'createdAt'>) => void
  updateLeadStatus: (id: string, status: LeadStatus) => void
  updateLead: (id: string, lead: Partial<Lead>) => void
  deleteLead: (id: string) => void

  // Orders
  orders: Order[]
  addOrder: (order: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>) => void
  updateOrderStatus: (id: string, status: OrderStatus) => void
  updateOrderPayment: (id: string, paymentStatus: PaymentStatus) => void
  deleteOrder: (id: string) => void

  // Commercial Proposals
  proposals: Proposal[]
  addProposal: (proposal: Omit<Proposal, 'id' | 'proposalNumber' | 'createdAt'>) => Promise<Proposal>
  updateProposal: (id: string, partial: Partial<Proposal>) => void
  deleteProposal: (id: string) => void
  updateProposalStatus: (id: string, status: ProposalStatus) => void
  convertProposalToInvoice: (proposalId: string) => Invoice | null
  generateProposalPdf: (id: string, fallback?: Proposal) => Promise<string | null>

  // Invoices & Billing
  invoices: Invoice[]
  addInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>) => Promise<Invoice>
  updateInvoice: (id: string, partial: Partial<Invoice>) => void
  deleteInvoice: (id: string) => void
  recordInvoicePayment: (id: string, amount: number, mode?: PaymentMode, ref?: string) => void
  generateInvoicePdf: (id: string, fallback?: Invoice) => Promise<string | null>

  // Clients
  clients: ClientPartner[]
  addClient: (client: Omit<ClientPartner, 'id'>) => void
  updateClient: (id: string, client: Partial<ClientPartner>) => void
  deleteClient: (id: string) => void
  toggleClientFeatured: (id: string) => void

  // Testimonials
  testimonials: TestimonialReview[]
  addTestimonial: (test: Omit<TestimonialReview, 'id' | 'createdAt'>) => void
  updateTestimonial: (id: string, test: Partial<TestimonialReview>) => void
  deleteTestimonial: (id: string) => void

  // Settings
  settings: CompanySettings
  updateSettings: (settings: Partial<CompanySettings>) => void

  // Dialogs & Alerts
  confirm: (options: ConfirmOptions) => Promise<boolean>
  alertModal: (options: AlertOptions) => Promise<void>

  // Toasts
  toasts: ToastMessage[]
  addToast: (
    type: 'success' | 'error' | 'info' | 'warning',
    title: string,
    message: string,
    options?: { duration?: number; action?: ToastAction }
  ) => void
  removeToast: (id: string) => void

  // Backup & Code generation
  resetToDefaults: () => void
  exportStateJson: () => string
  importStateJson: (jsonString: string) => boolean
  generateLandingAppCode: () => { productsCode: string; companyCode: string }
}

const STORAGE_KEY_PREFIX = 'brothersfurniture_admin_'

const AdminContext = createContext<AdminContextType | null>(null)

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<AdminView>('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [isBackendConnected, setIsBackendConnected] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  // Load from localStorage or fallback
  const loadStored = <T,>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(STORAGE_KEY_PREFIX + key)
      return item ? JSON.parse(item) : defaultValue
    } catch (e) {
      console.warn(`Error reading ${key} from localStorage`, e)
      return defaultValue
    }
  }

  const [products, setProducts] = useState<Product[]>(() => {
    const loaded = loadStored<Product[]>('products', initialProducts)
    return loaded.map((p) => {
      const initMatch = initialProducts.find((ip) => ip.id === p.id)
      return {
        ...p,
        type: p.type || initMatch?.type || 'Chairs',
        subCategory: p.subCategory || initMatch?.subCategory || '',
      }
    })
  })
  const [chairs, setChairs] = useState<ErgonomicChairModel[]>(() => loadStored('chairs', initialChairs))
  const [leads, setLeads] = useState<Lead[]>(() => loadStored('leads', initialLeads))
  const [orders, setOrders] = useState<Order[]>(() => loadStored('orders', initialOrders))
  const [proposals, setProposals] = useState<Proposal[]>(() => loadStored<Proposal[]>('proposals', []))
  const [invoices, setInvoices] = useState<Invoice[]>(() => loadStored<Invoice[]>('invoices', []))
  const [clients, setClients] = useState<ClientPartner[]>(() => loadStored('clients', initialClients))
  const [testimonials, setTestimonials] = useState<TestimonialReview[]>(() => loadStored('testimonials', initialTestimonials))
  const [settings, setSettings] = useState<CompanySettings>(() => loadStored('settings', initialSettings))
  const [taxonomy, setTaxonomy] = useState<CatalogTaxonomyData>(() =>
    loadStored('catalog_taxonomy', DEFAULT_CATALOG_TAXONOMY)
  )

  // Recycle Bin / Archive States
  const [deletedProducts, setDeletedProducts] = useState<DeletedProduct[]>(() =>
    loadStored('bin_products', [])
  )
  const [deletedCategories, setDeletedCategories] = useState<DeletedCategory[]>(() =>
    loadStored('bin_categories', [])
  )
  const [deletedTypes, setDeletedTypes] = useState<DeletedType[]>(() =>
    loadStored('bin_types', [])
  )

  const totalBinCount = deletedProducts.length + deletedCategories.length + deletedTypes.length

  const productTypes = React.useMemo(() => {
    const list = taxonomy.types.filter((t) => t.isActive).map((t) => t.name)
    return list.length > 0 ? list : ['Chairs', 'Tables', 'Workstations', 'Storage', 'Others']
  }, [taxonomy.types])

  const typeCategoriesMap = React.useMemo(() => {
    const map: Record<string, string[]> = {}
    taxonomy.types.forEach((t) => {
      map[t.name] = taxonomy.categories
        .filter((c) => c.type.toLowerCase() === t.name.toLowerCase() && c.isActive)
        .map((c) => c.name)
    })
    return map
  }, [taxonomy.types, taxonomy.categories])

  const categorySubcategoriesMap = React.useMemo(() => {
    const map: Record<string, string[]> = {}
    taxonomy.categories.forEach((c) => {
      map[c.name] = c.subCategories.filter((s) => s.isActive).map((s) => s.name)
    })
    return map
  }, [taxonomy.categories])

  const materialPresetsMap = React.useMemo(() => {
    return taxonomy.productionSettings?.materialPresets || {}
  }, [taxonomy.productionSettings])

  const dimensionPresetsMap = React.useMemo(() => {
    return taxonomy.productionSettings?.dimensionPresets || {}
  }, [taxonomy.productionSettings])

  const categories = React.useMemo(() => {
    const fromConfigs = taxonomy.categories.filter((c) => c.isActive).map((c) => c.name)
    const fromProducts = products.map((p) => p.category).filter(Boolean)
    return Array.from(new Set([...fromConfigs, ...fromProducts]))
  }, [taxonomy.categories, products])

  // Modal Dialogs (Promise-based Confirm & Alert)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    options: ConfirmOptions | null
    resolve: (value: boolean) => void
  } | null>(null)

  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean
    options: AlertOptions | null
    resolve: () => void
  } | null>(null)

  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setConfirmDialog({
        isOpen: true,
        options,
        resolve: (val: boolean) => {
          setConfirmDialog(null)
          resolve(val)
        },
      })
    })
  }

  const alertModal = (options: AlertOptions): Promise<void> => {
    return new Promise<void>((resolve) => {
      setAlertDialog({
        isOpen: true,
        options,
        resolve: () => {
          setAlertDialog(null)
          resolve()
        },
      })
    })
  }

  const addToast = (
    type: 'success' | 'error' | 'info' | 'warning',
    title: string,
    message: string,
    options?: { duration?: number; action?: ToastAction }
  ) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6)
    const newToast: ToastMessage = {
      id,
      type,
      title,
      message,
      duration: options?.duration || 4500,
      action: options?.action,
    }
    setToasts((prev) => [...prev, newToast])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  // Load from Backend API
  const refreshFromBackend = async () => {
    setIsSyncing(true)
    try {
      await api.checkHealth()
      const [prods, chrs, lds, ords, cls, tests, setts, props, invs] = await Promise.all([
        api.getProducts(),
        api.getChairs(),
        api.getLeads(),
        api.getOrders(),
        api.getClients(),
        api.getTestimonials(),
        api.getSettings(),
        api.getProposals().catch(() => []),
        api.getInvoices().catch(() => []),
      ])
      // Filter out products currently in Recycle Bin to prevent reviving deleted items
      const binProds: DeletedProduct[] = loadStored('bin_products', [])
      const deletedIds = new Set(binProds.map((p) => p.id))
      setProducts(prods.filter((p) => !deletedIds.has(p.id)))
      setChairs(chrs)
      setLeads(lds)
      setOrders(ords)
      setClients(cls)
      setTestimonials(tests)
      setSettings(setts)
      if (Array.isArray(props) && props.length > 0) setProposals(props)
      if (Array.isArray(invs) && invs.length > 0) setInvoices(invs)
      setIsBackendConnected(true)
    } catch (e) {
      console.warn('Backend server currently offline, running in offline localStorage mode.', e)
      setIsBackendConnected(false)
    } finally {
      setIsSyncing(false)
    }
  }

  useEffect(() => {
    refreshFromBackend()

    // Real-time synchronization via Server-Sent Events (SSE)
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
    let eventSource: EventSource | null = null

    try {
      eventSource = new EventSource(`${apiBase}/sync/events`)
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data)
          if (payload.type === 'connected') return

          if (payload.entity === 'orders' && payload.action === 'create') {
            const ord = payload.data
            addToast(
              'success',
              '🎉 New Order Received!',
              ord?.orderNumber
                ? `${ord.orderNumber} placed by ${ord.customerName || 'Customer'} (₹${Number(ord.total || 0).toLocaleString('en-IN')})`
                : 'A new factory order has arrived from the website.'
            )
          } else if (payload.entity === 'leads' && payload.action === 'create') {
            const ld = payload.data
            addToast(
              'info',
              '📩 New Customer Inquiry!',
              ld?.name ? `Inquiry from ${ld.name} (${ld.subject || 'Website'})` : 'A new inquiry has been submitted.'
            )
          }

          refreshFromBackend()
        } catch {
          // ignore heartbeats
        }
      }
    } catch (err) {
      console.warn('Could not connect to SSE in admin:', err)
    }

    return () => {
      if (eventSource) eventSource.close()
    }
  }, [])

  // Local persistence cache
  useEffect(() => { localStorage.setItem(STORAGE_KEY_PREFIX + 'products', JSON.stringify(products)) }, [products])
  useEffect(() => { localStorage.setItem(STORAGE_KEY_PREFIX + 'chairs', JSON.stringify(chairs)) }, [chairs])
  useEffect(() => { localStorage.setItem(STORAGE_KEY_PREFIX + 'leads', JSON.stringify(leads)) }, [leads])
  useEffect(() => { localStorage.setItem(STORAGE_KEY_PREFIX + 'orders', JSON.stringify(orders)) }, [orders])
  useEffect(() => { localStorage.setItem(STORAGE_KEY_PREFIX + 'proposals', JSON.stringify(proposals)) }, [proposals])
  useEffect(() => { localStorage.setItem(STORAGE_KEY_PREFIX + 'invoices', JSON.stringify(invoices)) }, [invoices])
  useEffect(() => { localStorage.setItem(STORAGE_KEY_PREFIX + 'clients', JSON.stringify(clients)) }, [clients])
  useEffect(() => { localStorage.setItem(STORAGE_KEY_PREFIX + 'testimonials', JSON.stringify(testimonials)) }, [testimonials])
  useEffect(() => { localStorage.setItem(STORAGE_KEY_PREFIX + 'settings', JSON.stringify(settings)) }, [settings])
  useEffect(() => { localStorage.setItem(STORAGE_KEY_PREFIX + 'catalog_taxonomy', JSON.stringify(taxonomy)) }, [taxonomy])
  useEffect(() => { localStorage.setItem(STORAGE_KEY_PREFIX + 'bin_products', JSON.stringify(deletedProducts)) }, [deletedProducts])
  useEffect(() => { localStorage.setItem(STORAGE_KEY_PREFIX + 'bin_categories', JSON.stringify(deletedCategories)) }, [deletedCategories])
  useEffect(() => { localStorage.setItem(STORAGE_KEY_PREFIX + 'bin_types', JSON.stringify(deletedTypes)) }, [deletedTypes])

  // Product Operations
  const addProduct = async (p: Omit<Product, 'id' | 'sku' | 'updatedAt'>) => {
    const id = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `prod-${Date.now()}`
    const categoryPrefix = (p.category || 'PR').replace(/[^a-zA-Z0-9]/g, '').substring(0, 2).toUpperCase() || 'PR'
    const sku = `BF-${categoryPrefix}-${Math.floor(100 + Math.random() * 900)}`
    const newProduct: Product = {
      ...p,
      id,
      sku,
      updatedAt: new Date().toISOString(),
    }
    setProducts((prev) => [newProduct, ...prev])
    addToast('success', 'Product Added', `"${p.name}" has been published to inventory.`)

    if (isBackendConnected) {
      try {
        await api.createProduct(newProduct)
      } catch (err: any) {
        console.error('Failed to sync product with backend:', err)
      }
    }
  }

  const updateProduct = async (id: string, partial: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, ...partial, updatedAt: new Date().toISOString() } : item
      )
    )
    addToast('info', 'Product Updated', `Item specifications have been updated.`)

    if (isBackendConnected) {
      try {
        await api.updateProduct(id, partial)
      } catch (err: any) {
        console.error('Failed to sync product update with backend:', err)
      }
    }
  }

  const deleteProduct = async (id: string) => {
    const target = products.find((p) => p.id === id)
    if (!target) return
    const deletedItem: DeletedProduct = {
      ...target,
      deletedAt: new Date().toISOString(),
    }
    setDeletedProducts((prev) => [deletedItem, ...prev.filter((p) => p.id !== id)])
    setProducts((prev) => prev.filter((p) => p.id !== id))
    addToast(
      'warning',
      'Moved to Recycle Bin',
      `"${target.name}" moved to the Recycle Bin. You can restore it anytime.`,
      {
        duration: 6000,
        action: {
          label: 'Undo',
          onClick: () => restoreProduct(target.id),
        },
      }
    )

    if (isBackendConnected) {
      try {
        await api.deleteProduct(id)
      } catch (err: any) {
        console.error('Failed to delete product from backend:', err)
      }
    }
  }

  const restoreProduct = async (id: string) => {
    const target = deletedProducts.find((p) => p.id === id)
    if (!target) return
    const { deletedAt: _d, deletedBy: _b, ...cleanProduct } = target
    const restored: Product = {
      ...cleanProduct,
      updatedAt: new Date().toISOString(),
    }
    setProducts((prev) => [restored, ...prev.filter((p) => p.id !== id)])
    setDeletedProducts((prev) => prev.filter((p) => p.id !== id))
    addToast('success', 'Product Restored', `"${target.name}" is back in active inventory.`)

    if (isBackendConnected) {
      try {
        await api.createProduct(restored)
      } catch (err: any) {
        console.error('Failed to restore product on backend:', err)
      }
    }
  }

  const permanentlyDeleteProduct = async (id: string) => {
    const target = deletedProducts.find((p) => p.id === id)
    setDeletedProducts((prev) => prev.filter((p) => p.id !== id))
    addToast('info', 'Permanently Deleted', `"${target?.name || id}" permanently purged.`)

    if (isBackendConnected) {
      try {
        await api.deleteProduct(id)
      } catch {
        // already deleted on backend
      }
    }
  }

  const restoreAllProducts = async () => {
    if (deletedProducts.length === 0) return
    const count = deletedProducts.length
    const restoredList: Product[] = deletedProducts.map(({ deletedAt: _d, deletedBy: _b, ...rest }) => ({
      ...rest,
      updatedAt: new Date().toISOString(),
    }))
    setProducts((prev) => [...restoredList, ...prev])
    setDeletedProducts([])
    addToast('success', 'All Products Restored', `${count} products restored to active inventory.`)

    if (isBackendConnected) {
      for (const p of restoredList) {
        try {
          await api.createProduct(p)
        } catch (err) {
          console.error('Failed to restore product on backend:', err)
        }
      }
    }
  }

  const emptyProductBin = async () => {
    const count = deletedProducts.length
    const idsToPurge = deletedProducts.map((p) => p.id)
    setDeletedProducts([])
    localStorage.setItem(STORAGE_KEY_PREFIX + 'bin_products', JSON.stringify([]))
    addToast('info', 'Recycle Bin Emptied', `${count} products permanently purged from bin.`)

    if (isBackendConnected) {
      for (const id of idsToPurge) {
        try {
          await api.deleteProduct(id)
        } catch {
          // ignore
        }
      }
    }
  }

  const toggleProductStock = async (id: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const nextStock = !p.inStock
          addToast(
            nextStock ? 'success' : 'warning',
            nextStock ? 'Marked In Stock' : 'Marked Out of Stock',
            `"${p.name}" is now ${nextStock ? 'available for purchase' : 'listed as out of stock'}.`
          )
          return {
            ...p,
            inStock: nextStock,
            stockCount: nextStock && p.stockCount === 0 ? 10 : !nextStock ? 0 : p.stockCount,
            updatedAt: new Date().toISOString(),
          }
        }
        return p
      })
    )

    if (isBackendConnected) {
      try {
        await api.toggleProductStock(id)
      } catch (err: any) {
        console.error('Failed to toggle product stock on backend:', err)
      }
    }
  }

  const toggleProductFeatured = async (id: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const next = !p.featured
          addToast('info', next ? 'Featured on Homepage' : 'Removed from Featured', `"${p.name}" showcase status updated.`)
          return { ...p, featured: next, updatedAt: new Date().toISOString() }
        }
        return p
      })
    )

    if (isBackendConnected) {
      try {
        await api.toggleProductFeatured(id)
      } catch (err: any) {
        console.error('Failed to toggle featured product on backend:', err)
      }
    }
  }

  const toggleProductActive = async (id: string) => {
    let nextActive = false
    let targetName = id
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          nextActive = p.isActive === false ? true : false
          targetName = p.name
          return { ...p, isActive: nextActive, updatedAt: new Date().toISOString() }
        }
        return p
      })
    )
    addToast(
      nextActive ? 'success' : 'warning',
      nextActive ? 'Product Activated' : 'Product Deactivated',
      `"${targetName}" is now ${nextActive ? 'live on the website' : 'hidden from customers'}.`
    )

    if (isBackendConnected) {
      try {
        await api.updateProduct(id, { isActive: nextActive })
      } catch (err: any) {
        console.error('Failed to update product active state on backend:', err)
      }
    }
  }

  // Catalog Taxonomy & Category Operations
  const addType = (name: string, description?: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const id = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    if (taxonomy.types.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())) {
      addToast('warning', 'Type Already Exists', `Product type "${trimmed}" is already present.`)
      return
    }
    const newType: TypeConfig = {
      id,
      name: trimmed,
      slug: id,
      description: description || `${trimmed} category group for commercial fit-outs.`,
      isActive: true,
      sortOrder: taxonomy.types.length + 1,
    }
    setTaxonomy((prev) => ({
      ...prev,
      types: [...prev.types, newType],
    }))
    addToast('success', 'Type Created', `Furniture group "${trimmed}" is now available.`)
  }

  const updateType = (id: string, name: string, description?: string) => {
    const trimmed = name.trim()
    const target = taxonomy.types.find((t) => t.id === id)
    if (!target || !trimmed) return
    const oldName = target.name

    setTaxonomy((prev) => ({
      ...prev,
      types: prev.types.map((t) => (t.id === id ? { ...t, name: trimmed, description: description ?? t.description } : t)),
      categories: prev.categories.map((c) => (c.type === oldName ? { ...c, type: trimmed } : c)),
    }))

    // Cascade to products
    setProducts((prev) =>
      prev.map((p) => (p.type === oldName ? { ...p, type: trimmed, updatedAt: new Date().toISOString() } : p))
    )

    addToast('info', 'Type Updated', `Type "${trimmed}" updated and cascaded across categories.`)
  }

  const deleteType = (id: string): { success: boolean; message?: string } => {
    const target = taxonomy.types.find((t) => t.id === id)
    if (!target) return { success: false, message: 'Type not found.' }

    // Count products under this type
    const productCount = products.filter((p) => p.type?.toLowerCase() === target.name.toLowerCase()).length
    if (productCount > 0) {
      addToast(
        'error',
        'Cannot Delete Type',
        `Cannot delete "${target.name}" because ${productCount} active products are currently assigned to it.`
      )
      return {
        success: false,
        message: `Cannot delete "${target.name}" because ${productCount} products belong to this type. Reassign or remove those products first.`,
      }
    }

    const deletedItem: DeletedType = {
      ...target,
      deletedAt: new Date().toISOString(),
    }
    setDeletedTypes((prev) => [deletedItem, ...prev.filter((t) => t.id !== id)])

    setTaxonomy((prev) => ({
      ...prev,
      types: prev.types.filter((t) => t.id !== id),
      categories: prev.categories.filter((c) => c.type !== target.name),
    }))
    addToast('warning', 'Type Moved to Bin', `"${target.name}" moved to the Recycle Bin. You can restore it anytime.`)
    return { success: true }
  }

  const restoreType = (id: string) => {
    const target = deletedTypes.find((t) => t.id === id)
    if (!target) return
    const { deletedAt: _d, deletedBy: _b, ...cleanType } = target
    setTaxonomy((prev) => ({
      ...prev,
      types: [...prev.types, cleanType],
    }))
    setDeletedTypes((prev) => prev.filter((t) => t.id !== id))
    addToast('success', 'Type Restored', `"${target.name}" restored to taxonomy.`)
  }

  const permanentlyDeleteType = (id: string) => {
    const target = deletedTypes.find((t) => t.id === id)
    setDeletedTypes((prev) => prev.filter((t) => t.id !== id))
    addToast('info', 'Type Permanently Purged', `"${target?.name || id}" permanently removed.`)
  }

  const toggleTypeActive = (id: string) => {
    setTaxonomy((prev) => ({
      ...prev,
      types: prev.types.map((t) => (t.id === id ? { ...t, isActive: !t.isActive } : t)),
    }))
  }

  const addCategory = (type: string, name: string, description?: string, leadTime?: string, moq?: number) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const id = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    if (taxonomy.categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      addToast('warning', 'Category Exists', `Category "${trimmed}" already exists.`)
      return
    }
    const newCategory: CategoryConfig = {
      id,
      name: trimmed,
      slug: id,
      type,
      description: description || `${trimmed} commercial line.`,
      isActive: true,
      leadTime: leadTime || '7–12 Days',
      minOrderQuantity: moq || 1,
      sortOrder: taxonomy.categories.length + 1,
      subCategories: [],
    }
    setTaxonomy((prev) => ({
      ...prev,
      categories: [...prev.categories, newCategory],
    }))
    addToast('success', 'Category Created', `"${trimmed}" added under "${type}".`)
  }

  const updateCategory = (id: string, partial: Partial<CategoryConfig>) => {
    const target = taxonomy.categories.find((c) => c.id === id)
    if (!target) return
    const oldName = target.name
    const newName = partial.name ? partial.name.trim() : oldName

    setTaxonomy((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => (c.id === id ? { ...c, ...partial, name: newName } : c)),
    }))

    if (newName !== oldName) {
      setProducts((prev) =>
        prev.map((p) => (p.category === oldName ? { ...p, category: newName, updatedAt: new Date().toISOString() } : p))
      )
    }

    addToast('info', 'Category Updated', `"${newName}" configuration saved.`)
  }

  const deleteCategory = (id: string): { success: boolean; message?: string } => {
    const target = taxonomy.categories.find((c) => c.id === id)
    if (!target) return { success: false, message: 'Category not found.' }

    const count = products.filter((p) => p.category?.toLowerCase() === target.name.toLowerCase()).length
    if (count > 0) {
      addToast(
        'error',
        'Cannot Delete Category',
        `"${target.name}" contains ${count} products. Reassign or delete those products before removing this category.`
      )
      return {
        success: false,
        message: `"${target.name}" contains ${count} products. Please reassign those products first.`,
      }
    }

    const deletedCat: DeletedCategory = {
      ...target,
      deletedAt: new Date().toISOString(),
    }
    setDeletedCategories((prev) => [deletedCat, ...prev.filter((c) => c.id !== id)])

    setTaxonomy((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.id !== id),
    }))
    addToast('warning', 'Category Moved to Bin', `Category "${target.name}" moved to Recycle Bin. You can restore it anytime.`)
    return { success: true }
  }

  const restoreCategory = (id: string) => {
    const target = deletedCategories.find((c) => c.id === id)
    if (!target) return
    const { deletedAt: _d, deletedBy: _b, ...cleanCategory } = target
    setTaxonomy((prev) => ({
      ...prev,
      categories: [...prev.categories, cleanCategory],
    }))
    setDeletedCategories((prev) => prev.filter((c) => c.id !== id))
    addToast('success', 'Category Restored', `"${target.name}" restored to catalog.`)
  }

  const permanentlyDeleteCategory = (id: string) => {
    const target = deletedCategories.find((c) => c.id === id)
    setDeletedCategories((prev) => prev.filter((c) => c.id !== id))
    addToast('info', 'Category Permanently Purged', `"${target?.name || id}" permanently removed.`)
  }

  const toggleCategoryActive = (id: string) => {
    setTaxonomy((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => {
        if (c.id === id) {
          const next = !c.isActive
          addToast('info', next ? 'Category Enabled' : 'Category Disabled', `"${c.name}" visibility updated.`)
          return { ...c, isActive: next }
        }
        return c
      }),
    }))
  }

  const addSubCategory = (categoryId: string, name: string, description?: string, leadTime?: string, moq?: number) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const id = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-')

    setTaxonomy((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => {
        if (c.id === categoryId) {
          if (c.subCategories.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
            addToast('warning', 'Subcategory Exists', `"${trimmed}" is already under ${c.name}.`)
            return c
          }
          const newSub: SubCategoryConfig = {
            id: `${c.id}-${id}`,
            name: trimmed,
            slug: id,
            description: description || `${trimmed} specification under ${c.name}`,
            isActive: true,
            leadTime: leadTime || c.leadTime || '7–12 Days',
            minOrderQuantity: moq || c.minOrderQuantity || 1,
            sortOrder: c.subCategories.length + 1,
          }
          addToast('success', 'Subcategory Added', `"${trimmed}" added to ${c.name}.`)
          return { ...c, subCategories: [...c.subCategories, newSub] }
        }
        return c
      }),
    }))
  }

  const updateSubCategory = (categoryId: string, subId: string, partial: Partial<SubCategoryConfig>) => {
    setTaxonomy((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => {
        if (c.id === categoryId) {
          const targetSub = c.subCategories.find((s) => s.id === subId)
          const oldName = targetSub?.name
          const newName = partial.name ? partial.name.trim() : oldName

          if (oldName && newName && oldName !== newName) {
            setProducts((prodPrev) =>
              prodPrev.map((p) =>
                p.category === c.name && p.subCategory === oldName
                  ? { ...p, subCategory: newName, updatedAt: new Date().toISOString() }
                  : p
              )
            )
          }

          return {
            ...c,
            subCategories: c.subCategories.map((s) => (s.id === subId ? { ...s, ...partial, name: newName || s.name } : s)),
          }
        }
        return c
      }),
    }))
    addToast('info', 'Subcategory Updated', 'Changes saved.')
  }

  const deleteSubCategory = (categoryId: string, subId: string): { success: boolean; message?: string } => {
    const parent = taxonomy.categories.find((c) => c.id === categoryId)
    const target = parent?.subCategories.find((s) => s.id === subId)
    if (!target) return { success: false, message: 'Subcategory not found.' }

    const count = products.filter(
      (p) => p.category?.toLowerCase() === parent?.name.toLowerCase() && p.subCategory?.toLowerCase() === target.name.toLowerCase()
    ).length

    if (count > 0) {
      addToast(
        'error',
        'Cannot Delete Subcategory',
        `"${target.name}" is used by ${count} products. Reassign them first.`
      )
      return {
        success: false,
        message: `"${target.name}" is assigned to ${count} products. Reassign them before deleting.`,
      }
    }

    setTaxonomy((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.id === categoryId ? { ...c, subCategories: c.subCategories.filter((s) => s.id !== subId) } : c
      ),
    }))
    addToast('warning', 'Subcategory Removed', `"${target.name}" deleted.`)
    return { success: true }
  }

  const toggleSubCategoryActive = (categoryId: string, subId: string) => {
    setTaxonomy((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.id === categoryId
          ? {
              ...c,
              subCategories: c.subCategories.map((s) => (s.id === subId ? { ...s, isActive: !s.isActive } : s)),
            }
          : c
      ),
    }))
  }

  const updateProductionSettings = (partial: Partial<ProductionSettings>) => {
    setTaxonomy((prev) => ({
      ...prev,
      productionSettings: {
        ...prev.productionSettings,
        ...partial,
      },
    }))
    addToast('success', 'Production Settings Saved', 'Manufacturing parameters and presets updated.')
  }

  const resetTaxonomyToDefaults = () => {
    setTaxonomy(DEFAULT_CATALOG_TAXONOMY)
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'catalog_taxonomy')
    addToast('info', 'Taxonomy Reset', 'Categories, types, and production settings restored to factory defaults.')
  }

  // Ergonomic Chairs Operations
  const addChair = async (c: Omit<ErgonomicChairModel, 'id'>) => {
    const id = c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `chair-${Date.now()}`
    const newChair: ErgonomicChairModel = { ...c, id }
    setChairs((prev) => [newChair, ...prev])
    addToast('success', 'Chair Added', `"${c.name}" added to manufactured models.`)

    if (isBackendConnected) {
      try {
        await api.createChair(newChair)
      } catch (err: any) {
        console.error('Failed to sync chair with backend:', err)
      }
    }
  }

  const updateChair = async (id: string, partial: Partial<ErgonomicChairModel>) => {
    setChairs((prev) => prev.map((c) => (c.id === id ? { ...c, ...partial } : c)))
    addToast('info', 'Chair Model Updated', 'Chair specifications updated.')

    if (isBackendConnected) {
      try {
        await api.updateChair(id, partial)
      } catch (err: any) {
        console.error('Failed to update chair on backend:', err)
      }
    }
  }

  const deleteChair = async (id: string) => {
    setChairs((prev) => prev.filter((c) => c.id !== id))
    addToast('warning', 'Model Removed', 'Chair model removed from catalogue.')

    if (isBackendConnected) {
      try {
        await api.deleteChair(id)
      } catch (err: any) {
        console.error('Failed to delete chair on backend:', err)
      }
    }
  }

  const toggleChairProduction = async (id: string) => {
    setChairs((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const next = !c.inProduction
          addToast(
            next ? 'success' : 'warning',
            next ? 'Active in Factory' : 'Paused Production',
            `"${c.name}" production status updated.`
          )
          return { ...c, inProduction: next }
        }
        return c
      })
    )

    if (isBackendConnected) {
      try {
        await api.toggleChairProduction(id)
      } catch (err: any) {
        console.error('Failed to toggle chair production on backend:', err)
      }
    }
  }

  // Leads Operations
  const addLead = async (l: Omit<Lead, 'id' | 'createdAt'>) => {
    const newLead: Lead = {
      ...l,
      id: `lead-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    setLeads((prev) => [newLead, ...prev])
    addToast('success', 'New Lead Recorded', `Inquiry from "${l.name}" registered.`)

    if (isBackendConnected) {
      try {
        await api.createLead(newLead)
      } catch (err: any) {
        console.error('Failed to sync lead with backend:', err)
      }
    }
  }

  const updateLeadStatus = async (id: string, status: LeadStatus) => {
    setLeads((prev) =>
      prev.map((lead) => {
        if (lead.id === id) {
          return {
            ...lead,
            status,
            lastContactedAt: new Date().toISOString(),
          }
        }
        return lead
      })
    )
    addToast('info', 'Lead Pipeline Updated', `Lead moved to ${status.toUpperCase().replace('-', ' ')}.`)

    if (isBackendConnected) {
      try {
        await api.updateLeadStatus(id, status)
      } catch (err: any) {
        console.error('Failed to update lead status on backend:', err)
      }
    }
  }

  const updateLead = async (id: string, partial: Partial<Lead>) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...partial } : l)))
    addToast('info', 'Lead Updated', 'Notes and details updated.')

    if (isBackendConnected) {
      try {
        await api.updateLead(id, partial)
      } catch (err: any) {
        console.error('Failed to update lead on backend:', err)
      }
    }
  }

  const deleteLead = async (id: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== id))
    addToast('warning', 'Lead Deleted', 'Lead removed from CRM database.')

    if (isBackendConnected) {
      try {
        await api.deleteLead(id)
      } catch (err: any) {
        console.error('Failed to delete lead from backend:', err)
      }
    }
  }

  // Orders Operations
  const addOrder = async (o: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>) => {
    const nextNum = Math.floor(8400 + orders.length + 1)
    const newOrder: Order = {
      ...o,
      id: `ord-${nextNum}`,
      orderNumber: `BF-2026-${nextNum}`,
      createdAt: new Date().toISOString(),
    }
    setOrders((prev) => [newOrder, ...prev])
    addToast('success', 'Order / Quote Created', `Quotation ${newOrder.orderNumber} generated.`)

    if (isBackendConnected) {
      try {
        await api.createOrder(newOrder)
      } catch (err: any) {
        console.error('Failed to sync order with backend:', err)
      }
    }
  }

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === id ? { ...ord, status } : ord))
    )
    addToast('info', 'Order Status Updated', `Order set to ${status.replace(/_/g, ' ').toUpperCase()}.`)

    if (isBackendConnected) {
      try {
        await api.updateOrderStatus(id, status)
      } catch (err: any) {
        console.error('Failed to update order status on backend:', err)
      }
    }
  }

  const updateOrderPayment = async (id: string, paymentStatus: PaymentStatus) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === id ? { ...ord, paymentStatus } : ord))
    )
    addToast('success', 'Payment Status Updated', `Payment updated to ${paymentStatus.replace(/_/g, ' ').toUpperCase()}.`)

    if (isBackendConnected) {
      try {
        await api.updateOrderPayment(id, paymentStatus)
      } catch (err: any) {
        console.error('Failed to update order payment on backend:', err)
      }
    }
  }

  const deleteOrder = async (id: string) => {
    setOrders((prev) => prev.filter((ord) => ord.id !== id))
    addToast('warning', 'Order Removed', 'Order removed from management log.')

    if (isBackendConnected) {
      try {
        await api.deleteOrder(id)
      } catch (err: any) {
        console.error('Failed to delete order from backend:', err)
      }
    }
  }

  // Commercial Proposal Operations
  const addProposal = async (p: Omit<Proposal, 'id' | 'proposalNumber' | 'createdAt'>): Promise<Proposal> => {
    const year = new Date().getFullYear()
    const prefix = `BF-PROP-${year}-`
    let maxNum = 0
    for (const prop of proposals) {
      if (prop.proposalNumber && prop.proposalNumber.startsWith(prefix)) {
        const num = parseInt(prop.proposalNumber.replace(prefix, ''), 10)
        if (!isNaN(num) && num > maxNum) {
          maxNum = num
        }
      }
    }
    const nextPropNum = String(Math.max(maxNum + 1, proposals.length + 1)).padStart(4, '0')
    const newProposal: Proposal = {
      ...p,
      id: `prop-${Date.now()}`,
      proposalNumber: `${prefix}${nextPropNum}`,
      createdAt: new Date().toISOString(),
    }
    setProposals((prev) => [newProposal, ...prev])

    if (isBackendConnected) {
      try {
        const saved = await api.createProposal(newProposal)
        if (saved) {
          const merged = { ...newProposal, ...saved }
          setProposals((prev) =>
            prev.map((item) => (item.id === newProposal.id ? merged : item))
          )
          addToast('success', 'Proposal Created', `Commercial Proposal ${merged.proposalNumber} generated.`)
          return merged
        }
      } catch (err) {
        console.error('Failed to sync proposal to backend:', err)
      }
    }
    addToast('success', 'Proposal Created', `Commercial Proposal ${newProposal.proposalNumber} generated.`)
    return newProposal
  }

  const updateProposal = (id: string, partial: Partial<Proposal>) => {
    setProposals((prev) =>
      prev.map((prop) =>
        prop.id === id ? { ...prop, ...partial, updatedAt: new Date().toISOString() } : prop
      )
    )
    addToast('info', 'Proposal Updated', 'Commercial proposal updated.')

    if (isBackendConnected) {
      api.updateProposal(id, partial).catch((err) => console.error('Failed to update proposal on backend:', err))
    }
  }

  const deleteProposal = (id: string) => {
    setProposals((prev) => prev.filter((prop) => prop.id !== id))
    addToast('warning', 'Proposal Deleted', 'Proposal has been removed.')

    if (isBackendConnected) {
      api.deleteProposal(id).catch((err) => console.error('Failed to delete proposal on backend:', err))
    }
  }

  const updateProposalStatus = (id: string, status: ProposalStatus) => {
    setProposals((prev) =>
      prev.map((prop) =>
        prop.id === id ? { ...prop, status, updatedAt: new Date().toISOString() } : prop
      )
    )
    addToast('info', 'Proposal Status Updated', `Status marked as ${status.replace(/_/g, ' ').toUpperCase()}.`)

    if (isBackendConnected) {
      api.updateProposalStatus(id, status).catch((err) => console.error('Failed to update proposal status on backend:', err))
    }
  }

  const generateProposalPdf = async (id: string, fallback?: Proposal): Promise<string | null> => {
    try {
      addToast('info', 'Generating Proposal PDF...', 'Puppeteer is rendering executive document and uploading to Cloudflare R2.')
      const res = await api.generateProposalPdf(id, fallback)
      if (res && res.pdfUrl) {
        setProposals((prev) =>
          prev.map((prop) =>
            prop.id === id ? { ...prop, pdfUrl: res.pdfUrl, r2Key: res.r2Key, updatedAt: new Date().toISOString() } : prop
          )
        )
        addToast('success', 'Stored in Cloudflare R2', 'Proposal PDF successfully uploaded and hosted on Cloudflare R2.')
        return res.pdfUrl
      }
      return null
    } catch (err: any) {
      console.error('Failed to generate PDF in R2:', err)
      addToast('error', 'PDF Generation Failed', err.message || 'Could not generate or store PDF in Cloudflare R2.')
      return null
    }
  }

  const convertProposalToInvoice = (proposalId: string): Invoice | null => {
    const proposal = proposals.find((p) => p.id === proposalId)
    if (!proposal) return null

    const nextInvNum = String(invoices.length + 1).padStart(3, '0')
    const invoiceNumber = `BF-INV-2026-${nextInvNum}`

    // Calculate CGST and SGST (9% each = 18% total)
    const taxableSubtotal = Math.max(0, proposal.subtotal - (proposal.discountAmount || 0))
    const cgstAmount = Math.round(taxableSubtotal * 0.09)
    const sgstAmount = Math.round(taxableSubtotal * 0.09)
    const totalTax = cgstAmount + sgstAmount
    const grandTotal = taxableSubtotal + proposal.deliveryFee + totalTax

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      proposalRef: proposal.proposalNumber,
      customerName: proposal.customerName,
      companyName: proposal.companyName,
      phone: proposal.phone,
      email: proposal.email,
      clientGstin: proposal.clientGstin,
      billingAddress: proposal.deliveryAddress,
      shippingAddress: proposal.deliveryAddress,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'pending',
      items: proposal.items.map((it, idx) => ({
        id: `iitem-${Date.now()}-${idx}`,
        productId: it.productId,
        name: it.name,
        image: it.image,
        hsnCode: '9403',
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        material: it.material,
        dimensions: it.dimensions,
        sku: it.sku,
        total: it.total,
      })),
      subtotal: proposal.subtotal,
      discountAmount: proposal.discountAmount || 0,
      deliveryFee: proposal.deliveryFee,
      cgstRate: 9,
      cgstAmount,
      sgstRate: 9,
      sgstAmount,
      taxAmount: totalTax,
      total: grandTotal,
      amountPaid: 0,
      balanceDue: grandTotal,
      notes: `Generated from Commercial Proposal ${proposal.proposalNumber}. ${proposal.notes || ''}`,
      createdAt: new Date().toISOString(),
    }

    setInvoices((prev) => [newInvoice, ...prev])
    updateProposal(proposalId, { status: 'converted', convertedInvoiceId: newInvoice.id })
    addToast('success', 'Tax Invoice Generated', `Invoice ${invoiceNumber} created from Proposal ${proposal.proposalNumber}.`)

    if (isBackendConnected) {
      api.convertProposalToInvoice(proposalId).catch((err) => {
        // Fallback: create invoice directly if convert endpoint didn't find proposal in db yet
        console.warn('Convert endpoint error, syncing direct invoice:', err)
        api.createInvoice(newInvoice).catch(() => {})
      })
    }
    return newInvoice
  }

  // Invoices & Billing Operations
  const addInvoice = async (inv: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>): Promise<Invoice> => {
    const nextInvNum = String(invoices.length + 1).padStart(3, '0')
    const newInvoice: Invoice = {
      ...inv,
      id: `inv-${Date.now()}`,
      invoiceNumber: `BF-INV-2026-${nextInvNum}`,
      createdAt: new Date().toISOString(),
    }
    setInvoices((prev) => [newInvoice, ...prev])

    if (isBackendConnected) {
      try {
        const saved = await api.createInvoice(newInvoice)
        if (saved) {
          const merged = { ...newInvoice, ...saved }
          setInvoices((prev) =>
            prev.map((item) => (item.id === newInvoice.id ? merged : item))
          )
          addToast('success', 'Invoice Generated', `Tax Invoice ${merged.invoiceNumber} created.`)
          return merged
        }
      } catch (err) {
        console.error('Failed to sync invoice to backend:', err)
      }
    }
    addToast('success', 'Invoice Generated', `Tax Invoice ${newInvoice.invoiceNumber} created.`)
    return newInvoice
  }

  const updateInvoice = (id: string, partial: Partial<Invoice>) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, ...partial } : inv))
    )
    addToast('info', 'Invoice Updated', 'Invoice details have been updated.')

    if (isBackendConnected) {
      api.updateInvoice(id, partial).catch((err) => console.error('Failed to update invoice on backend:', err))
    }
  }

  const deleteInvoice = (id: string) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== id))
    addToast('warning', 'Invoice Removed', 'Invoice deleted.')

    if (isBackendConnected) {
      api.deleteInvoice(id).catch((err) => console.error('Failed to delete invoice on backend:', err))
    }
  }

  const generateInvoicePdf = async (id: string, fallback?: Invoice): Promise<string | null> => {
    try {
      addToast('info', 'Generating Invoice PDF...', 'Puppeteer is rendering tax invoice and uploading to Cloudflare R2.')
      const res = await api.generateInvoicePdf(id, fallback)
      if (res && res.pdfUrl) {
        setInvoices((prev) =>
          prev.map((inv) =>
            inv.id === id ? { ...inv, pdfUrl: res.pdfUrl, r2Key: res.r2Key } : inv
          )
        )
        addToast('success', 'Stored in Cloudflare R2', 'Invoice PDF successfully uploaded and hosted on Cloudflare R2.')
        return res.pdfUrl
      }
      return null
    } catch (err: any) {
      console.error('Failed to generate invoice PDF in R2:', err)
      addToast('error', 'PDF Generation Failed', err.message || 'Could not generate or store PDF in Cloudflare R2.')
      return null
    }
  }

  const recordInvoicePayment = (id: string, amount: number, mode: PaymentMode = 'neft_rtgs', ref?: string) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== id) return inv
        const newPaid = Math.min(inv.total, (inv.amountPaid || 0) + amount)
        const balance = Math.max(0, inv.total - newPaid)
        const newStatus: InvoiceStatus = balance === 0 ? 'paid' : newPaid > 0 ? 'advance_received' : 'pending'
        return {
          ...inv,
          amountPaid: newPaid,
          balanceDue: balance,
          status: newStatus,
          paymentMode: mode,
          paymentRef: ref || inv.paymentRef,
          paidAt: new Date().toISOString(),
        }
      })
    )
    addToast('success', 'Payment Recorded', `₹${amount.toLocaleString('en-IN')} payment recorded successfully.`)

    if (isBackendConnected) {
      api.recordInvoicePayment(id, {
        amount,
        paymentMode: mode,
        transactionReference: ref,
      }).catch((err) => console.error('Failed to record payment on backend:', err))
    }
  }

  // Clients Operations
  const addClient = async (c: Omit<ClientPartner, 'id'>) => {
    const id = c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `client-${Date.now()}`
    const newClient: ClientPartner = { ...c, id }
    setClients((prev) => [...prev, newClient])
    addToast('success', 'Client Added', `"${c.name}" added to corporate partners.`)

    if (isBackendConnected) {
      try {
        await api.createClient(newClient)
      } catch (err: any) {
        console.error('Failed to sync client with backend:', err)
      }
    }
  }

  const updateClient = async (id: string, partial: Partial<ClientPartner>) => {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...partial } : c)))
    addToast('info', 'Client Updated', 'Partner profile saved.')

    if (isBackendConnected) {
      try {
        await api.updateClient(id, partial)
      } catch (err: any) {
        console.error('Failed to update client on backend:', err)
      }
    }
  }

  const deleteClient = async (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id))
    addToast('warning', 'Client Removed', 'Partner removed from portfolio.')

    if (isBackendConnected) {
      try {
        await api.deleteClient(id)
      } catch (err: any) {
        console.error('Failed to delete client on backend:', err)
      }
    }
  }

  const toggleClientFeatured = async (id: string) => {
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, featured: !c.featured } : c))
    )

    if (isBackendConnected) {
      try {
        await api.toggleClientFeatured(id)
      } catch (err: any) {
        console.error('Failed to toggle client featured on backend:', err)
      }
    }
  }

  // Testimonials Operations
  const addTestimonial = async (t: Omit<TestimonialReview, 'id' | 'createdAt'>) => {
    const newTest: TestimonialReview = {
      ...t,
      id: `test-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    }
    setTestimonials((prev) => [newTest, ...prev])
    addToast('success', 'Testimonial Added', `Review from "${t.name}" saved.`)

    if (isBackendConnected) {
      try {
        await api.createTestimonial(newTest)
      } catch (err: any) {
        console.error('Failed to sync testimonial with backend:', err)
      }
    }
  }

  const updateTestimonial = async (id: string, partial: Partial<TestimonialReview>) => {
    setTestimonials((prev) => prev.map((t) => (t.id === id ? { ...t, ...partial } : t)))
    addToast('info', 'Testimonial Updated', 'Review updated.')

    if (isBackendConnected) {
      try {
        await api.updateTestimonial(id, partial)
      } catch (err: any) {
        console.error('Failed to update testimonial on backend:', err)
      }
    }
  }

  const deleteTestimonial = async (id: string) => {
    setTestimonials((prev) => prev.filter((t) => t.id !== id))
    addToast('warning', 'Testimonial Removed', 'Review deleted.')

    if (isBackendConnected) {
      try {
        await api.deleteTestimonial(id)
      } catch (err: any) {
        console.error('Failed to delete testimonial on backend:', err)
      }
    }
  }

  // Settings
  const updateSettings = async (partial: Partial<CompanySettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }))
    addToast('success', 'Settings Saved', 'Factory & store profile updated successfully.')

    if (isBackendConnected) {
      try {
        await api.updateSettings(partial)
      } catch (err: any) {
        console.error('Failed to sync settings on backend:', err)
      }
    }
  }

  // Reset
  const resetToDefaults = async () => {
    if (isBackendConnected) {
      try {
        await api.resetToDefaults()
        await refreshFromBackend()
        addToast('info', 'Reset Database', 'PostgreSQL database restored to factory seed defaults.')
        return
      } catch (err) {
        console.error('Failed to reset backend database:', err)
      }
    }
    setProducts(initialProducts)
    setChairs(initialChairs)
    setLeads(initialLeads)
    setOrders(initialOrders)
    setClients(initialClients)
    setTestimonials(initialTestimonials)
    setSettings(initialSettings)
    localStorage.clear()
    addToast('info', 'Reset to Factory Defaults', 'All sample products, leads and settings restored.')
  }

  const exportStateJson = () => {
    const fullState = {
      exportedAt: new Date().toISOString(),
      products,
      chairs,
      leads,
      orders,
      clients,
      testimonials,
      settings,
    }
    return JSON.stringify(fullState, null, 2)
  }

  const importStateJson = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString)
      if (data.products && Array.isArray(data.products)) setProducts(data.products)
      if (data.chairs && Array.isArray(data.chairs)) setChairs(data.chairs)
      if (data.leads && Array.isArray(data.leads)) setLeads(data.leads)
      if (data.orders && Array.isArray(data.orders)) setOrders(data.orders)
      if (data.clients && Array.isArray(data.clients)) setClients(data.clients)
      if (data.testimonials && Array.isArray(data.testimonials)) setTestimonials(data.testimonials)
      if (data.settings) setSettings(data.settings)
      addToast('success', 'Backup Imported', 'Data restored from JSON successfully.')
      return true
    } catch {
      addToast('error', 'Import Failed', 'Invalid JSON backup format provided.')
      return false
    }
  }

  const generateLandingAppCode = () => {
    // Generate clean TypeScript representation for brothersfurniture_UI/src/data/products.ts
    const productsExport = `import type { Category, Product } from '../types'\n\nexport const products: Product[] = ${JSON.stringify(
      products.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: p.price,
        ...(p.oldPrice ? { oldPrice: p.oldPrice } : {}),
        rating: p.rating,
        image: p.image,
        ...(p.cutout ? { cutout: p.cutout } : {}),
        description: p.description,
        material: p.material,
        dimensions: p.dimensions,
        inStock: p.inStock,
        ...(p.featured ? { featured: p.featured } : {}),
      })),
      null,
      2
    )}\n`

    const companyExport = `export const company = ${JSON.stringify(
      {
        name: settings.name,
        addressLines: settings.addressLines,
        phones: settings.phones,
        email: settings.email,
        whatsapp: settings.whatsapp,
        map: settings.map,
      },
      null,
      2
    )}\n`

    return { productsCode: productsExport, companyCode: companyExport }
  }

  return (
    <AdminContext.Provider
      value={{
        currentView,
        setCurrentView,
        searchQuery,
        setSearchQuery,
        categories,
        isBackendConnected,
        isSyncing,
        refreshFromBackend,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductStock,
        toggleProductFeatured,
        toggleProductActive,
        deletedProducts,
        deletedCategories,
        deletedTypes,
        totalBinCount,
        restoreProduct,
        permanentlyDeleteProduct,
        restoreAllProducts,
        emptyProductBin,
        restoreCategory,
        permanentlyDeleteCategory,
        restoreType,
        permanentlyDeleteType,
        productTypes,
        typeCategoriesMap,
        categorySubcategoriesMap,
        materialPresetsMap,
        dimensionPresetsMap,
        taxonomy,
        types: taxonomy.types,
        categoryConfigs: taxonomy.categories,
        productionSettings: taxonomy.productionSettings,
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
        chairs,
        addChair,
        updateChair,
        deleteChair,
        toggleChairProduction,
        leads,
        addLead,
        updateLeadStatus,
        updateLead,
        deleteLead,
        orders,
        addOrder,
        updateOrderStatus,
        updateOrderPayment,
        deleteOrder,
        proposals,
        addProposal,
        updateProposal,
        deleteProposal,
        updateProposalStatus,
        convertProposalToInvoice,
        generateProposalPdf,
        invoices,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        recordInvoicePayment,
        generateInvoicePdf,
        clients,
        addClient,
        updateClient,
        deleteClient,
        toggleClientFeatured,
        testimonials,
        addTestimonial,
        updateTestimonial,
        deleteTestimonial,
        settings,
        updateSettings,
        confirm,
        alertModal,
        toasts,
        addToast,
        removeToast,
        resetToDefaults,
        exportStateJson,
        importStateJson,
        generateLandingAppCode,
      }}
    >
      {children}
      <ConfirmDialog
        isOpen={Boolean(confirmDialog?.isOpen)}
        options={confirmDialog?.options || null}
        onConfirm={() => confirmDialog?.resolve(true)}
        onCancel={() => confirmDialog?.resolve(false)}
      />
      <AlertDialog
        isOpen={Boolean(alertDialog?.isOpen)}
        options={alertDialog?.options || null}
        onClose={() => alertDialog?.resolve()}
      />
    </AdminContext.Provider>
  )
}

export const useAdmin = () => {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider')
  }
  return context
}
