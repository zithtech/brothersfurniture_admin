export type DefaultCategory =
  | 'Workstations'
  | 'Office Chairs'
  | 'Desks'
  | 'Meeting Tables'
  | 'Storage'
  | 'Lounge'

export type Category = DefaultCategory | (string & {})

export const PRODUCT_TYPES = [
  'Chairs',
  'Tables',
  'Workstations',
  'Storage',
  'Others',
] as const

export type ProductType = (typeof PRODUCT_TYPES)[number] | (string & {})

export const TYPE_CATEGORIES_MAP: Record<string, string[]> = {
  Chairs: ['Office Chairs', 'Lounge'],
  Tables: ['Meeting Tables', 'Desks'],
  Workstations: ['Workstations'],
  Storage: ['Storage'],
  Others: ['Others'],
}

export const CATEGORY_SUBCATEGORIES: Record<string, string[]> = {
  'Office Chairs': [
    'Ergonomic Chairs',
    'Executive Chairs',
    'Mesh Office Chairs',
    'Task Chairs',
    'Staff Chairs',
  ],
  'Workstations': [
    'Linear Desking',
    'Cluster Workstations',
    'L-Shape Cubicles',
    'Bench Desking',
    'Training & Study',
  ],
  'Desks': [
    'Office Desks',
    'Executive Desks',
    'Compact & Study',
    'Standing Desks',
  ],
  'Meeting Tables': [
    'Conference Tables',
    'Café Tables',
    'Cafeteria & Dining',
    'Boardroom Tables',
  ],
  'Storage': [
    'Cabinets & Cupboards',
    'Mobile Pedestals',
  ],
  'Lounge': [
    'Metro Public Seating',
    'Viva Public Seating',
    'Café Chairs',
    'Study Chairs',
  ],
}

export function inferTypeFromCategory(category?: string): string {
  if (!category) return 'Others'
  const catLower = category.toLowerCase().trim()
  if (catLower.includes('chair') || catLower === 'lounge' || catLower.includes('seating')) return 'Chairs'
  if (catLower.includes('table') || catLower.includes('desk')) return 'Tables'
  if (catLower.includes('workstation') || catLower.includes('cubicle')) return 'Workstations'
  if (catLower.includes('storage') || catLower.includes('cabinet') || catLower.includes('pedestal') || catLower.includes('locker')) return 'Storage'

  for (const [type, cats] of Object.entries(TYPE_CATEGORIES_MAP)) {
    if (cats.some((c) => c.toLowerCase() === catLower)) return type
  }
  return 'Others'
}

export const MATERIAL_PRESETS: Record<string, string[]> = {
  Chairs: [
    'Breathable High-Tensile Mesh, High-Density Moulded PU Foam, Nylon/Aluminium Base',
    'High-Density Moulded Foam, Commercial Fabric Upholstery, Chrome Base',
    'PU Leatherette, Ergonomic Foam Cushioning, Sturdy Nylon Base',
    'Moulded Polypropylene Shell, Solid Beech Wood Legs',
    'Perforated Steel Beam, Moulded Polymer Shell / Wool-Blend Upholstery',
    'Velvet Upholstery, High-Resilience Foam, Solid Hardwood Frame',
  ],
  Workstations: [
    'Engineered Wood, Powder-Coated Steel Frame, Acoustic Fabric Screen',
    'Commercial Laminate Top, Integrated Cable Raceway, Heavy Gauge Steel Pedestals',
    'Commercial Melamine Faced Board, Solid Wood Edge, Steel Leg Base',
    'Walnut laminate, powder-coated steel, acoustic fabric',
    'High-Pressure Laminate, Aluminium Partition Trims, Wire Management Spine',
  ],
  Tables: [
    'Commercial Melamine Faced Board, Solid Wood Edge, Steel Leg Base',
    'Pre-laminated Particle Board Top, Powder-Coated Square Steel Legs',
    'Oak veneer, matte lacquer, powder-coated steel structure',
    'Solid Teak / Hardwood Finish, Heavy-Duty Cast Iron Base',
    'Lacquered MDF Top, Solid Beech Wooden Understructure',
  ],
  Storage: [
    'Cold Rolled Steel, Epoxy Powder Coating, Central Lock System',
    'Prime CRCA Steel (0.8mm), 3-Point Cam Lock, Adjustable Shelves',
    'Commercial Grade Prelam Particle Board, Aluminium D-Handles',
    'Heavy Gauge Steel Body, Anti-Tilt Mechanism, Heavy-Duty Castors',
  ],
  Others: [
    'Commercial Grade Laminate & Powder-Coated Steel',
    'Engineered Wood & Metal Hardware',
  ],
}

export const COMMON_MATERIAL_TAGS = [
  'Engineered Wood',
  'Powder-Coated Steel',
  'Commercial Laminate',
  'High-Tensile Mesh',
  'Moulded PU Foam',
  'CRCA Steel',
  'Acoustic Fabric',
  'Melamine Board',
  'Solid Beech',
  'PU Leatherette',
  'Aluminium Base',
  'Tempered Glass',
]

export const DIMENSION_PRESETS: Record<string, { label: string; value: string }[]> = {
  Chairs: [
    { label: 'High-Back Executive (W 66 × D 64 × H 118–128 cm)', value: 'W 66 × D 64 × H 118–128 cm' },
    { label: 'Medium-Back Task (W 64 × D 62 × H 98–108 cm)', value: 'W 64 × D 62 × H 98–108 cm' },
    { label: 'Visitor / Cantilever (W 62 × D 58 × H 80 cm)', value: 'W 62 × D 58 × H 80 cm' },
    { label: 'Café / Training Chair (W 48 × D 54 × H 83 cm)', value: 'W 48 × D 54 × H 83 cm' },
    { label: 'Public Seating 3-Seater (W 180 × D 65 × H 80 cm)', value: 'W 180 × D 65 × H 80 cm' },
    { label: 'Public Seating 4-Seater (W 240 × D 65 × H 80 cm)', value: 'W 240 × D 65 × H 80 cm' },
    { label: 'Lounge Armchair (W 76 × D 80 × H 82 cm)', value: 'W 76 × D 80 × H 82 cm' },
  ],
  Workstations: [
    { label: 'Single Linear Desk (W 120 × D 60 × H 75 cm)', value: 'W 120 × D 60 × H 75 cm' },
    { label: 'Standard Executive Desk (W 140 × D 70 × H 75 cm)', value: 'W 140 × D 70 × H 75 cm' },
    { label: 'Managerial Desk (W 160 × D 75 × H 75 cm)', value: 'W 160 × D 75 × H 75 cm' },
    { label: '2-Person Linear Cluster (W 240 × D 120 × H 75 cm)', value: 'W 240 × D 120 × H 75 cm' },
    { label: '4-Person Cluster with Screen (W 240 × D 240 × H 75 cm)', value: 'W 240 × D 240 × H 75 cm' },
    { label: '6-Person Benching System (W 360 × D 140 × H 75 cm)', value: 'W 360 × D 140 × H 75 cm' },
    { label: 'L-Shape Cubicle (W 150 × D 150 × H 120 cm)', value: 'W 150 × D 150 × H 120 cm' },
  ],
  Tables: [
    { label: '4-Person Café Table (W 90 × D 90 × H 75 cm)', value: 'W 90 × D 90 × H 75 cm' },
    { label: 'Round Café Table (Dia 90 × H 75 cm)', value: 'Dia 90 × H 75 cm' },
    { label: '6-Seater Meeting Table (W 180 × D 90 × H 75 cm)', value: 'W 180 × D 90 × H 75 cm' },
    { label: '8-Seater Conference Table (W 240 × D 120 × H 75 cm)', value: 'W 240 × D 120 × H 75 cm' },
    { label: '10-Seater Boardroom Table (W 300 × D 120 × H 75 cm)', value: 'W 300 × D 120 × H 75 cm' },
    { label: '12-Seater Boardroom Table (W 360 × D 140 × H 75 cm)', value: 'W 360 × D 140 × H 75 cm' },
    { label: '14-Seater Large Boardroom (W 400 × D 120 × H 75 cm)', value: 'W 400 × D 120 × H 75 cm' },
  ],
  Storage: [
    { label: '3-Drawer Mobile Pedestal (W 40 × D 45 × H 65 cm)', value: 'W 40 × D 45 × H 65 cm' },
    { label: 'Low Credenza Cabinet (W 120 × D 45 × H 75 cm)', value: 'W 120 × D 45 × H 75 cm' },
    { label: 'Medium Storage Cabinet (W 90 × D 45 × H 120 cm)', value: 'W 90 × D 45 × H 120 cm' },
    { label: 'Full Height 4-Shelf Cupboard (W 90 × D 45 × H 180 cm)', value: 'W 90 × D 45 × H 180 cm' },
    { label: 'Metal Filing Cabinet 4-Drawer (W 47 × D 62 × H 132 cm)', value: 'W 47 × D 62 × H 132 cm' },
  ],
  Others: [
    { label: 'Standard Dimensions (W 120 × D 60 × H 75 cm)', value: 'W 120 × D 60 × H 75 cm' },
    { label: 'Compact Dimensions (W 80 × D 50 × H 75 cm)', value: 'W 80 × D 50 × H 75 cm' },
  ],
}

export interface ProductImage {
  id: string
  productId?: string
  url: string
  r2Key?: string
  sortOrder: number
  isPrimary: boolean
  createdAt?: string
}

export interface Product {
  id: string
  sku: string
  name: string
  type?: string
  category: Category
  subCategory?: string
  price: number
  oldPrice?: number
  rating: number
  image: string
  r2Key?: string
  images?: ProductImage[]
  cutout?: boolean
  description: string
  material: string
  dimensions: string
  inStock: boolean
  featured?: boolean
  isActive?: boolean // true if active/published, false if inactive/hidden
  stockCount: number
  minOrderQuantity?: number
  leadTime?: string // Production lead time (e.g. "Ready to Ship", "7-10 Days")
  updatedAt: string
}

export interface SubCategoryConfig {
  id: string
  name: string
  slug: string
  description?: string
  isActive: boolean
  leadTime?: string
  minOrderQuantity?: number
  sortOrder?: number
}

export interface CategoryConfig {
  id: string
  name: string
  slug: string
  type: string // parent type: Chairs, Tables, Workstations, Storage, Others
  description?: string
  isActive: boolean
  leadTime?: string
  minOrderQuantity?: number
  sortOrder?: number
  subCategories: SubCategoryConfig[]
}

export interface TypeConfig {
  id: string
  name: string
  slug: string
  description?: string
  isActive: boolean
  sortOrder?: number
}

export interface LeadTimeOption {
  id: string
  label: string
  days: string
  badgeColor: string
  description: string
}

export interface ProductionSettings {
  lowStockThreshold: number
  defaultGstPercent: number
  displayPricesWithTax: boolean
  factoryWorkingDays: string
  qualityCertifications: string[]
  leadTimeOptions: LeadTimeOption[]
  materialPresets: Record<string, string[]>
  dimensionPresets: Record<string, { label: string; value: string }[]>
}

export interface CatalogTaxonomyData {
  types: TypeConfig[]
  categories: CategoryConfig[]
  productionSettings: ProductionSettings
}

export type ChairType = 'high-back' | 'medium-back' | 'mesh-seat' | 'visitor'

export interface ErgonomicChairModel {
  id: string
  name: string
  type: ChairType
  image: string
  features: string[]
  inProduction: boolean
  basePrice?: number
}

export type LeadStatus = 'new' | 'contacted' | 'quoted' | 'site-visit' | 'won' | 'lost'
export type LeadPriority = 'urgent' | 'high' | 'medium' | 'low'
export type InquiryType = 'General inquiry' | 'Office fit-out / bulk quote' | 'Space planning' | 'Delivery & returns'

export interface Lead {
  id: string
  name: string
  phone: string
  email: string
  subject: InquiryType
  message: string
  status: LeadStatus
  priority: LeadPriority
  estimatedValue?: number
  notes?: string
  createdAt: string
  lastContactedAt?: string
}

export type OrderStatus = 'pending' | 'in_production' | 'ready_for_dispatch' | 'dispatched' | 'delivered' | 'cancelled'
export type PaymentStatus = 'paid' | 'advance_received' | 'pending'

export interface OrderItem {
  productId: string
  name: string
  quantity: number
  unitPrice: number
  category: Category
}

export interface Order {
  id: string
  orderNumber: string
  customerName: string
  companyName?: string
  phone: string
  email: string
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  total: number
  status: OrderStatus
  paymentStatus: PaymentStatus
  deliveryAddress: string
  createdAt: string
  targetDeliveryDate?: string
  notes?: string
}

export interface ClientPartner {
  id: string
  name: string
  logo: string
  sector: string
  featured: boolean
}

export interface TestimonialReview {
  id: string
  name: string
  role: string
  company: string
  quote: string
  rating: number
  approved: boolean
  featured: boolean
  createdAt: string
}

export interface CompanySettings {
  name: string
  addressLines: string[]
  phones: { display: string; tel: string }[]
  email: string
  whatsapp: {
    number: string
    message: string
  }
  map: {
    embed: string
    link: string
  }
  gstin: string
  factoryLocation: string
  freeDeliveryThreshold: number
  standardDeliveryFee: number
  bannerAnnouncement: string
  isBannerActive: boolean
}

export type AdminView = 
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'product-settings'
  | 'recycle-bin'
  | 'ergonomic-chairs'
  | 'leads'
  | 'orders'
  | 'quotations'
  | 'clients'
  | 'testimonials'
  | 'settings'
  | 'admins'

export interface DeletedProduct extends Product {
  deletedAt: string
  deletedBy?: string
}

export interface DeletedCategory extends CategoryConfig {
  deletedAt: string
  deletedBy?: string
}

export interface DeletedType extends TypeConfig {
  deletedAt: string
  deletedBy?: string
}

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message: string
  duration?: number
  action?: ToastAction
}

export interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  /** Backwards compatibility alias for confirmText */
  confirmLabel?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info' | 'primary' | 'success'
  /** Backwards compatibility alias for variant */
  type?: 'danger' | 'warning' | 'info' | 'primary' | 'success'
  icon?: 'trash' | 'alert' | 'help' | 'info' | 'check' | 'archive' | 'refresh' | 'user-minus'
  badge?: string
  details?: string | string[]
  requireTypedConfirmation?: string
}


export interface AlertOptions {
  title: string
  message: string
  confirmText?: string
  variant?: 'warning' | 'error' | 'info' | 'success'
  icon?: 'alert' | 'info' | 'check' | 'shield' | 'x-circle'
  details?: string | string[]
}

