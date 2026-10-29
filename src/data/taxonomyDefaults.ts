import type {
  CategoryConfig,
  CatalogTaxonomyData,
  LeadTimeOption,
  ProductionSettings,
  TypeConfig,
} from '../types/admin'
import {
  CATEGORY_SUBCATEGORIES,
  DIMENSION_PRESETS,
  MATERIAL_PRESETS,
  PRODUCT_TYPES,
  TYPE_CATEGORIES_MAP,
} from '../types/admin'

export const DEFAULT_LEAD_TIMES: LeadTimeOption[] = [
  {
    id: 'ready-to-ship',
    label: 'Ready to Ship',
    days: '1–2 Days',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'Pre-assembled in factory warehouse, ready for same-week dispatch.',
  },
  {
    id: 'express-assembly',
    label: 'Express Assembly',
    days: '3–5 Days',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'Components in stock, quick assembly and quality assurance pass.',
  },
  {
    id: 'made-to-order',
    label: 'Made to Order',
    days: '7–12 Days',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    description: 'Custom laminates, fabrics or finishes fabricated per order specification.',
  },
  {
    id: 'bulk-fitout',
    label: 'Turnkey Commercial Fit-Out',
    days: '3–4 Weeks',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    description: 'Large-scale corporate layout, customized raceways, modular workstations.',
  },
]

export const DEFAULT_PRODUCTION_SETTINGS: ProductionSettings = {
  lowStockThreshold: 5,
  defaultGstPercent: 18,
  displayPricesWithTax: false,
  factoryWorkingDays: 'Monday to Saturday (09:00 - 18:30)',
  qualityCertifications: [
    'BIFMA X5.1 Commercial Grade Standard',
    'GreenGuard Gold Indoor Air Quality',
    'ISO 9001:2015 Quality Management',
    'FSC Certified Commercial Timber & Panels',
    'SEFA Laboratory Furniture Compliance',
  ],
  leadTimeOptions: DEFAULT_LEAD_TIMES,
  materialPresets: MATERIAL_PRESETS,
  dimensionPresets: DIMENSION_PRESETS,
}

const DEFAULT_TYPE_DESCRIPTIONS: Record<string, string> = {
  Chairs: 'Ergonomic task chairs, executive seating, mesh conference chairs and lounge public seating.',
  Tables: 'Conference boardroom tables, executive desks, café dining tables and meeting desks.',
  Workstations: 'Linear clusters, L-shape executive cubicles, acoustic screen modular benches.',
  Storage: 'Mobile 3-drawer pedestals, credenza sideboards, filing cupboards and metal lockers.',
  Others: 'Acoustic privacy pods, reception counters, accessories and space planning modules.',
}

export const DEFAULT_TYPES: TypeConfig[] = (PRODUCT_TYPES as readonly string[]).map((name, index) => ({
  id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  name,
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  description: DEFAULT_TYPE_DESCRIPTIONS[name] || `${name} line for commercial office interiors.`,
  isActive: true,
  sortOrder: index + 1,
}))

export const DEFAULT_CATEGORIES: CategoryConfig[] = Object.entries(TYPE_CATEGORIES_MAP).flatMap(
  ([typeName, cats]) =>
    cats.map((catName, index) => {
      const subNames = CATEGORY_SUBCATEGORIES[catName] || []
      const subCategories = subNames.map((sName, sIdx) => ({
        id: `${catName}-${sName}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: sName,
        slug: sName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: `${sName} specifications under ${catName}`,
        isActive: true,
        leadTime: typeName === 'Chairs' ? '3–5 Days' : '7–12 Days',
        minOrderQuantity: catName === 'Workstations' ? 2 : 1,
        sortOrder: sIdx + 1,
      }))

      return {
        id: catName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: catName,
        slug: catName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        type: typeName,
        description: `Commercial grade ${catName.toLowerCase()} engineered for modern corporate workspaces.`,
        isActive: true,
        leadTime: typeName === 'Chairs' ? '3–5 Days' : '7–12 Days',
        minOrderQuantity: catName === 'Workstations' ? 2 : 1,
        sortOrder: index + 1,
        subCategories,
      }
    })
)

export const DEFAULT_CATALOG_TAXONOMY: CatalogTaxonomyData = {
  types: DEFAULT_TYPES,
  categories: DEFAULT_CATEGORIES,
  productionSettings: DEFAULT_PRODUCTION_SETTINGS,
}
