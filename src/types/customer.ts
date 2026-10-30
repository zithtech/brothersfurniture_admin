export type CustomerStatus = 'active' | 'inactive' | 'archived'

export type DefaultCompanySize = 'Small' | 'Medium' | 'Large' | 'Enterprise'
export type CompanySize = DefaultCompanySize | (string & {})

export type DefaultCompanyCategory =
  | 'Manufacturer'
  | 'Retailer'
  | 'Wholesaler'
  | 'Distributor'
  | 'Dealer'
  | 'Corporate'
  | 'Interior Designer'
  | 'Other'
export type CompanyCategory = DefaultCompanyCategory | (string & {})

export type CustomerType = 'B2B' | 'B2C' | 'Institutional'

export type GstType = 'Regular' | 'Composition' | 'Unregistered' | 'Overseas'

export type PaymentTerms =
  | 'Immediate'
  | 'Advance 50%'
  | 'Net 15'
  | 'Net 30'
  | 'Net 60'

export type CustomerSource =
  | 'Website'
  | 'Referral'
  | 'Direct'
  | 'Exhibition'
  | 'Cold Call'
  | 'Other'

export type AddressType =
  | 'billing'
  | 'shipping'
  | 'headquarters'
  | 'warehouse'
  | 'branch'

export interface CustomerContact {
  id?: string
  customerId?: string
  name: string
  designation: string
  email?: string
  phone: string
  isPrimary: boolean
  department?: string
  notes?: string
  createdAt?: string
  updatedAt?: string
}

export interface CustomerAddress {
  id?: string
  customerId?: string
  addressType: AddressType
  isDefault: boolean
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  country: string
  pinCode: string
  mapLocation?: string
  latitude?: number | null
  longitude?: number | null
  landmark?: string
  contactPerson?: string
  contactPhone?: string
  createdAt?: string
  updatedAt?: string
}

export interface CustomerNote {
  id: string
  customerId: string
  note: string
  category: 'General' | 'Meeting' | 'Call' | 'Pricing' | 'Requirement'
  authorName: string
  createdAt: string
}

export interface CustomerActivityLog {
  id: string
  customerId: string
  action: string
  description: string
  actorName: string
  metadata?: Record<string, any>
  createdAt: string
}

export interface CustomerPrimaryContactSummary {
  name: string
  designation?: string
  phone: string
  email?: string
}

export interface CustomerPrimaryAddressSummary {
  city: string
  state: string
  country?: string
  pinCode?: string
  addressLine1?: string
  mapLocation?: string
}

export interface Customer {
  id: string
  customerCode: string
  companyName: string
  companyPhone: string
  companyEmail?: string
  gstNumber?: string
  websiteUrl?: string
  companySize: CompanySize
  category: CompanyCategory
  status: CustomerStatus
  customerType: CustomerType
  gstType: GstType
  paymentTerms: PaymentTerms
  creditLimit: number
  customerSource: CustomerSource
  accountManager?: string
  internalNotes?: string
  internalRemarks?: string
  createdBy: string
  updatedBy: string
  createdAt: string
  updatedAt: string
  deletedAt?: string | null

  primaryContact?: CustomerPrimaryContactSummary
  primaryAddress?: CustomerPrimaryAddressSummary

  contacts?: CustomerContact[]
  addresses?: CustomerAddress[]
  notes?: CustomerNote[]
  activityLogs?: CustomerActivityLog[]
  orders?: any[]
}

export interface CustomerStats {
  total: number
  active: number
  inactive: number
  archived: number
  byCategory?: Record<string, number>
}

export interface CustomerFilterParams {
  search?: string
  status?: string
  category?: string
  companySize?: string
  city?: string
  state?: string
  sortBy?: 'created_at' | 'company_name' | 'customer_code' | 'category' | 'status'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface CustomerPaginationResponse {
  items: Customer[]
  total: number
  page: number
  limit: number
  totalPages: number
  stats: CustomerStats
}

export interface CustomerDuplicateCheckResult {
  hasDuplicate: boolean
  duplicates: Array<{
    field: 'gstNumber' | 'companyName' | 'phone'
    value: string
    customerId: string
    companyName: string
  }>
}
