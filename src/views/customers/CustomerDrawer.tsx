import React, { useEffect, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  Check,
  CreditCard,
  FileText,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Plus,
  Trash2,
  Users,
} from 'lucide-react'
import { Drawer } from '../../components/common/Drawer'
import { SearchableSelect, type SelectOption } from '../../components/common/SearchableSelect'
import { customerApi } from '../../services/customerApi'
import type {
  AddressType,
  CompanyCategory,
  CompanySize,
  Customer,
  CustomerAddress,
  CustomerContact,
  CustomerSource,
  CustomerStatus,
  CustomerType,
  GstType,
  PaymentTerms,
} from '../../types/customer'

interface CustomerDrawerProps {
  isOpen: boolean
  onClose: () => void
  customerToEdit?: Customer | null
  onSuccess: (savedCustomer: Customer) => void
}

const CATEGORIES: CompanyCategory[] = [
  'Corporate',
  'Interior Designer',
  'Retailer',
  'Wholesaler',
  'Distributor',
  'Dealer',
  'Manufacturer',
  'Coworking Spaces',
  'Commercial Real Estate',
  'Hospitality & Hotels',
  'Healthcare & Hospitals',
  'Educational Institutions',
  'Government & PSU',
  'Other',
]

const CATEGORY_OPTIONS: SelectOption[] = [
  { value: 'Corporate', label: 'Corporate & MNC Offices', description: 'Enterprise headquarters, corporate IT parks' },
  { value: 'Interior Designer', label: 'Interior Designers & Architects', description: 'Design studios, turnkey project consultants' },
  { value: 'Retailer', label: 'Retail Stores & Showrooms', description: 'Commercial outlets, furniture showrooms' },
  { value: 'Wholesaler', label: 'Wholesalers & Stockists', description: 'Bulk trade distributors, regional wholesalers' },
  { value: 'Distributor', label: 'National & Regional Distributors', description: 'Authorized distribution networks' },
  { value: 'Dealer', label: 'Franchise & Authorized Dealers', description: 'Showroom dealerships, partner stores' },
  { value: 'Manufacturer', label: 'OEM & Contract Manufacturers', description: 'Industrial fabrication & assembly partners' },
  { value: 'Coworking Spaces', label: 'Co-Working & Managed Spaces', description: 'Shared workspaces, flexible office suites' },
  { value: 'Commercial Real Estate', label: 'Commercial Real Estate & Builders', description: 'Developers, business park operators' },
  { value: 'Hospitality & Hotels', label: 'Hospitality, Resorts & Hotels', description: 'Boutique hotels, luxury resorts, restaurants' },
  { value: 'Healthcare & Hospitals', label: 'Healthcare & Hospitals', description: 'Hospitals, diagnostic hubs, clinics' },
  { value: 'Educational Institutions', label: 'Educational Institutions', description: 'Universities, colleges, private schools' },
  { value: 'Government & PSU', label: 'Government & PSU Enterprises', description: 'Public sector undertakings, ministries' },
  { value: 'Other', label: 'Other B2B Category', description: 'Specialized enterprise or bespoke requirement' },
]

const COMPANY_SIZES: CompanySize[] = ['Small', 'Medium', 'Large', 'Enterprise']

const COMPANY_SIZE_OPTIONS: SelectOption[] = [
  { value: 'Small', label: 'Small Business (1 - 50 Employees)', description: 'Emerging businesses, boutique studios, local setups' },
  { value: 'Medium', label: 'Medium Enterprise (51 - 250 Employees)', description: 'Growing mid-sized firms, regional branch offices' },
  { value: 'Large', label: 'Large Corporate (251 - 1,000 Employees)', description: 'Multi-floor facilities, large corporate workforce' },
  { value: 'Enterprise', label: 'Enterprise Conglomerate (1,000+ Employees)', description: 'Global multinational campuses, expansive setups' },
]

const CUSTOMER_TYPE_OPTIONS: SelectOption[] = [
  { value: 'B2B', label: 'B2B (Corporate / Institutional)', description: 'Companies, organizations, bulk institutional buyers' },
  { value: 'B2C', label: 'B2C (Retail Direct)', description: 'Direct individual or residential buyers' },
  { value: 'Institutional', label: 'Institutional / Government', description: 'Government departments, universities, hospitals' },
]

const GST_TYPE_OPTIONS: SelectOption[] = [
  { value: 'Regular', label: 'Regular Taxpayer', description: 'Standard GSTIN registered business' },
  { value: 'Composition', label: 'Composition Scheme', description: 'Small turnover composite tax filer' },
  { value: 'Unregistered', label: 'Unregistered Entity', description: 'Non-GST registered individual or small shop' },
  { value: 'Overseas', label: 'Overseas / SEZ Unit', description: 'Zero-rated export or SEZ zone client' },
]

const PAYMENT_TERMS_OPTIONS: SelectOption[] = [
  { value: 'Immediate', label: 'Immediate / Upon Order', description: '100% upfront settlement upon order confirmation' },
  { value: 'Advance 50%', label: 'Advance 50% / Balance on Dispatch', description: '50% advance with 50% before final dispatch' },
  { value: 'Net 15', label: 'Net 15 Days', description: 'Full settlement within 15 days of invoice date' },
  { value: 'Net 30', label: 'Net 30 Days (Standard B2B)', description: 'Full settlement within 30 days of invoice date' },
  { value: 'Net 60', label: 'Net 60 Days', description: 'Corporate approved 60-day billing cycle' },
]

const CUSTOMER_SOURCE_OPTIONS: SelectOption[] = [
  { value: 'Direct', label: 'Direct Sales Outreach', description: 'Direct contact by account executive' },
  { value: 'Website', label: 'Brothers Furniture Website', description: 'Inbound web inquiry or catalog submission' },
  { value: 'Referral', label: 'Client / Architect Referral', description: 'Referred by existing client or trade partner' },
  { value: 'Exhibition', label: 'Trade Exhibition / Expo', description: 'Met at furniture expo or trade fair' },
  { value: 'Cold Call', label: 'Cold Call / Field Visit', description: 'Field sales executive prospecting visit' },
  { value: 'Other', label: 'Other Source Channel', description: 'Miscellaneous or ad-hoc source' },
]

const STATUS_OPTIONS: { label: string; value: CustomerStatus; color: string }[] = [
  { label: 'Active Account', value: 'active', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { label: 'Inactive Account', value: 'inactive', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { label: 'Archived', value: 'archived', color: 'bg-slate-100 text-slate-700 border-slate-300' },
]

export const DESIGNATION_OPTIONS: SelectOption[] = [
  { value: 'Managing Director / CEO', label: 'Managing Director / CEO', description: 'Executive Leadership & Direction' },
  { value: 'Founder / Partner', label: 'Founder / Managing Partner', description: 'Business Owner & Principal' },
  { value: 'Purchase / Procurement Manager', label: 'Purchase / Procurement Manager', description: 'PO Approval & Vendor Negotiations' },
  { value: 'Head of Procurement', label: 'Head of Procurement & Sourcing', description: 'Enterprise Sourcing Lead' },
  { value: 'Project Architect', label: 'Project Architect', description: 'Floor Layouts, Architectural Specs' },
  { value: 'Interior Designer', label: 'Lead Interior Designer', description: 'Material, Finish & Color Selection' },
  { value: 'Facilities Director / Manager', label: 'Facilities Director / Manager', description: 'Office Infrastructure & Space Planning' },
  { value: 'Operations Manager', label: 'Operations Manager', description: 'Operational Setup & Daily Management' },
  { value: 'Project Manager', label: 'Project Manager / PMC', description: 'Site Delivery, Timeline Coordination' },
  { value: 'Site Supervisor / Engineer', label: 'Site Supervisor / Civil Engineer', description: 'On-site Unloading & Installation' },
  { value: 'Finance & Accounts Head', label: 'Finance & Accounts Head', description: 'Billing, Invoicing & Payment Clearance' },
  { value: 'General Manager', label: 'General Manager', description: 'Administrative & Operational Head' },
  { value: 'Sales & Commercial Lead', label: 'Sales & Commercial Lead', description: 'B2B Client Relationship' },
  { value: 'Store / Showroom Manager', label: 'Store / Showroom Manager', description: 'Branch Retail Operations' },
  { value: 'Admin Executive', label: 'Admin Executive / Office Manager', description: 'Office Administration & Coordination' },
  { value: 'Authorized Signatory', label: 'Authorized Signatory', description: 'Legal Signatory for Corporate Contracts' },
  { value: 'Representative', label: 'General Representative', description: 'Default Corporate Contact' },
]

export const DEPARTMENT_OPTIONS: SelectOption[] = [
  { value: 'Management', label: 'Executive Management', description: 'Leadership, CXOs & Partners' },
  { value: 'Procurement', label: 'Procurement & Purchasing', description: 'Vendor relations, PO issuance' },
  { value: 'Projects & Architecture', label: 'Projects & Architecture', description: 'Design specs & site PMC' },
  { value: 'Facilities & Infra', label: 'Facilities & Workplace Infra', description: 'Space management & building maintenance' },
  { value: 'Finance & Accounts', label: 'Finance & Accounts', description: 'Payments, tax invoices & accounts' },
  { value: 'Operations & Logistics', label: 'Operations & Logistics', description: 'Material receipt & warehousing' },
  { value: 'Administration', label: 'Administration', description: 'General administrative coordination' },
]

const ADDRESS_TYPES: { label: string; value: AddressType }[] = [
  { label: 'Billing Address', value: 'billing' },
  { label: 'Shipping Address', value: 'shipping' },
  { label: 'Headquarters / Corporate Office', value: 'headquarters' },
  { label: 'Warehouse / Factory Depot', value: 'warehouse' },
  { label: 'Branch / Studio', value: 'branch' },
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

export const CustomerDrawer: React.FC<CustomerDrawerProps> = ({
  isOpen,
  onClose,
  customerToEdit,
  onSuccess,
}) => {
  const isEditing = Boolean(customerToEdit)

  // Active section for navigation tab bar
  const [activeTab, setActiveTab] = useState<'A' | 'B' | 'C' | 'D' | 'E'>('A')

  // Form State
  const [companyName, setCompanyName] = useState('')
  const [companyPhone, setCompanyPhone] = useState('')
  const [companyEmail, setCompanyEmail] = useState('')
  const [gstNumber, setGstNumber] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [companySize, setCompanySize] = useState<CompanySize>('Medium')
  const [category, setCategory] = useState<CompanyCategory>('Corporate')
  const [isCustomCategory, setIsCustomCategory] = useState(false)
  const [isCustomSize, setIsCustomSize] = useState(false)
  const [status, setStatus] = useState<CustomerStatus>('active')

  // Contacts State
  const [contacts, setContacts] = useState<Array<Partial<CustomerContact>>>([
    {
      name: '',
      designation: 'General Manager',
      email: '',
      phone: '',
      isPrimary: true,
      department: 'Management',
    },
  ])

  // Addresses State
  const [addresses, setAddresses] = useState<Array<Partial<CustomerAddress>>>([
    {
      addressType: 'billing',
      isDefault: true,
      addressLine1: '',
      addressLine2: '',
      city: 'Chennai',
      state: 'Tamil Nadu',
      country: 'India',
      pinCode: '',
      mapLocation: '',
      latitude: null,
      longitude: null,
    },
  ])

  // Business Details State
  const [customerType, setCustomerType] = useState<CustomerType>('B2B')
  const [gstType, setGstType] = useState<GstType>('Regular')
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>('Net 30')
  const [creditLimit, setCreditLimit] = useState<number>(500000)
  const [internalNotes, setInternalNotes] = useState('')

  // Additional Info State
  const [customerSource, setCustomerSource] = useState<CustomerSource>('Direct')
  const [accountManager, setAccountManager] = useState('')
  const [internalRemarks, setInternalRemarks] = useState('')

  // Validation & Duplicate State
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false)

  // Populate data when opening for edit or create
  useEffect(() => {
    if (isOpen) {
      if (customerToEdit) {
        setCompanyName(customerToEdit.companyName || '')
        setCompanyPhone(customerToEdit.companyPhone || '')
        setCompanyEmail(customerToEdit.companyEmail || '')
        setGstNumber(customerToEdit.gstNumber || '')
        setWebsiteUrl(customerToEdit.websiteUrl || '')
        const editSize = customerToEdit.companySize || 'Medium'
        setCompanySize(editSize)
        setIsCustomSize(!COMPANY_SIZES.includes(editSize as any))

        const editCat = customerToEdit.category || 'Corporate'
        setCategory(editCat)
        setIsCustomCategory(!CATEGORIES.includes(editCat as any))

        setStatus(customerToEdit.status || 'active')
        setCustomerType(customerToEdit.customerType || 'B2B')
        setGstType(customerToEdit.gstType || 'Regular')
        setPaymentTerms(customerToEdit.paymentTerms || 'Net 30')
        setCreditLimit(customerToEdit.creditLimit || 0)
        setInternalNotes(customerToEdit.internalNotes || '')
        setCustomerSource(customerToEdit.customerSource || 'Direct')
        setAccountManager(customerToEdit.accountManager || '')
        setInternalRemarks(customerToEdit.internalRemarks || '')

        if (customerToEdit.contacts && customerToEdit.contacts.length > 0) {
          setContacts(customerToEdit.contacts)
        } else if (customerToEdit.primaryContact) {
          setContacts([
            {
              name: customerToEdit.primaryContact.name,
              designation: customerToEdit.primaryContact.designation || 'Representative',
              phone: customerToEdit.primaryContact.phone,
              email: customerToEdit.primaryContact.email || '',
              isPrimary: true,
            },
          ])
        } else {
          setContacts([
            {
              name: '',
              designation: 'General Manager',
              email: '',
              phone: '',
              isPrimary: true,
            },
          ])
        }

        if (customerToEdit.addresses && customerToEdit.addresses.length > 0) {
          setAddresses(customerToEdit.addresses)
        } else if (customerToEdit.primaryAddress) {
          setAddresses([
            {
              addressType: 'billing',
              isDefault: true,
              addressLine1: customerToEdit.primaryAddress.addressLine1 || '',
              city: customerToEdit.primaryAddress.city || 'Chennai',
              state: customerToEdit.primaryAddress.state || 'Tamil Nadu',
              country: customerToEdit.primaryAddress.country || 'India',
              pinCode: customerToEdit.primaryAddress.pinCode || '',
              mapLocation: customerToEdit.primaryAddress.mapLocation || '',
            },
          ])
        }
      } else {
        // Reset defaults
        setCompanyName('')
        setCompanyPhone('')
        setCompanyEmail('')
        setGstNumber('')
        setWebsiteUrl('')
        setCompanySize('Medium')
        setCategory('Corporate')
        setIsCustomCategory(false)
        setIsCustomSize(false)
        setStatus('active')
        setCustomerType('B2B')
        setGstType('Regular')
        setPaymentTerms('Net 30')
        setCreditLimit(500000)
        setInternalNotes('')
        setCustomerSource('Direct')
        setAccountManager('Admin')
        setInternalRemarks('')
        setContacts([
          {
            name: '',
            designation: 'General Manager',
            email: '',
            phone: '',
            isPrimary: true,
            department: 'Management',
          },
        ])
        setAddresses([
          {
            addressType: 'billing',
            isDefault: true,
            addressLine1: '',
            addressLine2: '',
            city: 'Chennai',
            state: 'Tamil Nadu',
            country: 'India',
            pinCode: '',
            mapLocation: '',
            latitude: null,
            longitude: null,
          },
        ])
      }
      setErrors({})
      setDuplicateWarning(null)
      setActiveTab('A')
    }
  }, [isOpen, customerToEdit])

  // Live duplicate detection debounced
  useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(async () => {
      if (gstNumber.trim().length >= 10 || companyPhone.trim().length >= 10 || (companyName.trim().length >= 4 && !isEditing)) {
        setIsCheckingDuplicate(true)
        try {
          const res = await customerApi.checkDuplicate({
            gstNumber: gstNumber.trim() || undefined,
            companyName: companyName.trim() || undefined,
            phone: companyPhone.trim() || undefined,
            excludeId: customerToEdit?.id,
          })
          if (res.hasDuplicate && res.duplicates.length > 0) {
            const dup = res.duplicates[0]
            const fieldLabel =
              dup.field === 'gstNumber' ? 'GST number' : dup.field === 'phone' ? 'Phone number' : 'Company name'
            setDuplicateWarning(
              `Notice: This ${fieldLabel} (${dup.value}) is already associated with existing customer "${dup.companyName}".`
            )
          } else {
            setDuplicateWarning(null)
          }
        } catch {
          // ignore
        } finally {
          setIsCheckingDuplicate(false)
        }
      } else {
        setDuplicateWarning(null)
      }
    }, 600)

    return () => clearTimeout(timer)
  }, [gstNumber, companyPhone, companyName, isOpen, isEditing, customerToEdit?.id])

  // Contact Handlers
  const handleAddContact = () => {
    setContacts((prev) => [
      ...prev,
      {
        name: '',
        designation: 'Representative',
        email: '',
        phone: '',
        isPrimary: prev.length === 0,
        department: '',
      },
    ])
  }

  const handleUpdateContact = (index: number, field: keyof CustomerContact, value: any) => {
    setContacts((prev) =>
      prev.map((c, i) => {
        if (i === index) {
          return { ...c, [field]: value }
        }
        if (field === 'isPrimary' && value === true) {
          return { ...c, isPrimary: false }
        }
        return c
      })
    )
  }

  const handleRemoveContact = (index: number) => {
    if (contacts.length <= 1) return
    const wasPrimary = contacts[index].isPrimary
    const updated = contacts.filter((_, i) => i !== index)
    if (wasPrimary && updated.length > 0) {
      updated[0].isPrimary = true
    }
    setContacts(updated)
  }

  // Address Handlers
  const handleAddAddress = () => {
    setAddresses((prev) => [
      ...prev,
      {
        addressType: prev.length === 1 ? 'shipping' : 'warehouse',
        isDefault: false,
        addressLine1: '',
        addressLine2: '',
        city: 'Chennai',
        state: 'Tamil Nadu',
        country: 'India',
        pinCode: '',
        mapLocation: '',
        latitude: null,
        longitude: null,
      },
    ])
  }

  const handleUpdateAddress = (index: number, field: keyof CustomerAddress, value: any) => {
    setAddresses((prev) =>
      prev.map((a, i) => {
        if (i === index) {
          return { ...a, [field]: value }
        }
        if (field === 'isDefault' && value === true) {
          return { ...a, isDefault: false }
        }
        return a
      })
    )
  }

  const handleRemoveAddress = (index: number) => {
    if (addresses.length <= 1) return
    const wasDefault = addresses[index].isDefault
    const updated = addresses.filter((_, i) => i !== index)
    if (wasDefault && updated.length > 0) {
      updated[0].isDefault = true
    }
    setAddresses(updated)
  }

  // Quick geocoding helper to populate latitude / longitude
  const handleFetchCoordinates = (index: number) => {
    const addr = addresses[index]
    const city = addr?.city || 'Chennai'
    const state = addr?.state || 'Tamil Nadu'

    // Approximate center coordinates for top Indian business hubs
    const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
      chennai: { lat: 13.0827, lng: 80.2707 },
      bengaluru: { lat: 12.9716, lng: 77.5946 },
      bangalore: { lat: 12.9716, lng: 77.5946 },
      hyderabad: { lat: 17.385, lng: 78.4867 },
      mumbai: { lat: 19.076, lng: 72.8777 },
      pune: { lat: 18.5204, lng: 73.8567 },
      coimbatore: { lat: 11.0168, lng: 76.9558 },
      delhi: { lat: 28.6139, lng: 77.209 },
      kolkata: { lat: 22.5726, lng: 88.3639 },
      ahmedabad: { lat: 23.0225, lng: 72.5714 },
      kochi: { lat: 9.9312, lng: 76.2673 },
    }

    const key = city.trim().toLowerCase()
    const coords = CITY_COORDS[key] || { lat: 13.0827, lng: 80.2707 }

    handleUpdateAddress(index, 'latitude', coords.lat)
    handleUpdateAddress(index, 'longitude', coords.lng)
    handleUpdateAddress(index, 'mapLocation', `${addr?.addressLine1 || city}, ${city}, ${state}`)
  }

  // Form Validation
  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!companyName.trim()) {
      errs.companyName = 'Company name is required.'
    }
    if (!companyPhone.trim()) {
      errs.companyPhone = 'Company phone number is required.'
    } else if (companyPhone.replace(/\D/g, '').length < 8) {
      errs.companyPhone = 'Please enter a valid phone number.'
    }

    if (gstNumber.trim() && gstNumber.trim().length !== 15) {
      errs.gstNumber = 'GSTIN should be standard 15 alphanumeric characters (e.g., 33ABCDE1234F1Z5).'
    }

    if (!category || !category.trim()) {
      errs.category = 'Company category is required.'
    }

    // Validate phone number format for contacts if entered
    contacts.forEach((c, idx) => {
      if (c.phone?.trim() && c.phone.replace(/\D/g, '').length < 8) {
        errs.contacts = `Contact #${idx + 1} (${c.name || 'Representative'}) phone number is invalid.`
      }
    })

    // Validate address
    const hasValidAddress = addresses.some((a) => a.city?.trim() && a.state?.trim())
    if (!hasValidAddress) {
      errs.addresses = 'Please enter city and state in Section C.'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) {
      // Switch to section with error
      if (errors.companyName || errors.companyPhone || errors.gstNumber || errors.category) {
        setActiveTab('A')
      } else if (errors.contacts) {
        setActiveTab('B')
      } else if (errors.addresses) {
        setActiveTab('C')
      }
      return
    }

    setIsSubmitting(true)
    try {
      // Production-ready contact normalization:
      // If user provided contact details, use them with sensible defaults.
      // If user did NOT enter any contact details, auto-fallback to primary contact from company details.
      let validContacts = contacts
        .filter((c) => c.name?.trim() || c.phone?.trim() || c.email?.trim())
        .map((c, i) => ({
          id: c.id,
          name: c.name?.trim() || `${companyName.trim() || 'Company'} Representative`,
          designation: c.designation?.trim() || 'Representative',
          email: c.email?.trim() || (i === 0 ? companyEmail.trim() || undefined : undefined),
          phone: c.phone?.trim() || companyPhone.trim(),
          isPrimary: c.isPrimary !== undefined ? Boolean(c.isPrimary) : i === 0,
          department: c.department?.trim() || 'Management',
          notes: c.notes?.trim() || undefined,
        }))

      if (validContacts.length === 0) {
        validContacts = [
          {
            id: undefined,
            name: `${companyName.trim() || 'Corporate'} Representative`,
            designation: 'Representative',
            phone: companyPhone.trim(),
            email: companyEmail.trim() || undefined,
            isPrimary: true,
            department: 'Management',
            notes: undefined,
          },
        ]
      }

      // Guarantee exactly one primary contact
      if (!validContacts.some((c) => c.isPrimary)) {
        validContacts[0].isPrimary = true
      }

      const payload = {
        companyName: companyName.trim(),
        companyPhone: companyPhone.trim(),
        companyEmail: companyEmail.trim() || undefined,
        gstNumber: gstNumber.trim().toUpperCase() || undefined,
        websiteUrl: websiteUrl.trim() || undefined,
        companySize,
        category,
        status,
        customerType,
        gstType,
        paymentTerms,
        creditLimit: Number(creditLimit) || 0,
        customerSource,
        accountManager: accountManager.trim() || undefined,
        internalNotes: internalNotes.trim() || undefined,
        internalRemarks: internalRemarks.trim() || undefined,
        contacts: validContacts,
        addresses: addresses
          .filter((a) => a.city?.trim())
          .map((a) => ({
            id: a.id,
            addressType: a.addressType || 'billing',
            isDefault: Boolean(a.isDefault),
            addressLine1: a.addressLine1?.trim() || a.city!,
            addressLine2: a.addressLine2?.trim() || undefined,
            city: a.city!.trim(),
            state: a.state!.trim(),
            country: a.country?.trim() || 'India',
            pinCode: a.pinCode?.trim() || '',
            mapLocation: a.mapLocation?.trim() || undefined,
            latitude: a.latitude !== null && a.latitude !== undefined ? Number(a.latitude) : null,
            longitude: a.longitude !== null && a.longitude !== undefined ? Number(a.longitude) : null,
            landmark: a.landmark?.trim() || undefined,
            contactPerson: a.contactPerson?.trim() || undefined,
            contactPhone: a.contactPhone?.trim() || undefined,
          })),
      }

      let saved: Customer
      if (isEditing && customerToEdit?.id) {
        saved = await customerApi.updateCustomer(customerToEdit.id, payload)
      } else {
        saved = await customerApi.createCustomer(payload)
      }

      onSuccess(saved)
      onClose()
    } catch (err: any) {
      console.error('Failed to save customer:', err)
      setErrors((prev) => ({ ...prev, submit: err.message || 'Failed to save customer' }))
    } finally {
      setIsSubmitting(false)
    }
  }

  const navTabs: { id: 'A' | 'B' | 'C' | 'D' | 'E'; label: string; icon: any; count?: number }[] = [
    { id: 'A', label: 'Company Info', icon: Building2 },
    { id: 'B', label: 'Contact Persons', icon: Users, count: contacts.length },
    { id: 'C', label: 'Address & Map', icon: MapPin, count: addresses.length },
    { id: 'D', label: 'Business & Terms', icon: CreditCard },
    { id: 'E', label: 'Additional Info', icon: FileText },
  ]

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Customer: ${customerToEdit?.companyName}` : 'Register New Corporate Customer'}
      subtitle={
        isEditing
          ? `Reference: ${customerToEdit?.customerCode} · Modify company details, representatives and facilities`
          : 'Complete B2B registration with multi-contact roles, tax profiles and address geocoding'
      }
      maxWidth="max-w-3xl lg:max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        {/* Navigation Section Pills */}
        <div className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl mb-3.5 overflow-x-auto scrollbar-none border border-slate-200/80 shrink-0">
          {navTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            const hasError =
              (tab.id === 'A' && (errors.companyName || errors.companyPhone || errors.gstNumber)) ||
              (tab.id === 'B' && errors.contacts) ||
              (tab.id === 'C' && errors.addresses)

            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-orange-600 shadow-2xs border border-orange-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-orange-500' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                      isActive ? 'bg-orange-100 text-orange-700' : 'bg-slate-200/80 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
                {hasError && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />}
              </button>
            )
          })}
        </div>

        {/* Duplicate Detection Alert Banner */}
        {duplicateWarning && (
          <div className="mb-3.5 p-3 bg-amber-50 border border-amber-200/90 rounded-xl flex items-start gap-2.5 text-amber-800 text-xs shadow-2xs animate-fade-in">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">Duplicate Warning: </span>
              {duplicateWarning}
            </div>
          </div>
        )}

        {/* Global Submit Error Banner */}
        {errors.submit && (
          <div className="mb-3.5 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errors.submit}</span>
          </div>
        )}

        {/* Form Content Sections */}
        <div className="flex-1 space-y-4">
          {/* SECTION A: Company Information */}
          {activeTab === 'A' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-black">
                      A
                    </span>
                    Company Information
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">Primary business identity, category and contact channels</p>
                </div>
                <span className="text-[11px] font-medium text-slate-400">* Required fields</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Company Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Company Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => {
                        setCompanyName(e.target.value)
                        if (errors.companyName) setErrors((prev) => ({ ...prev, companyName: '' }))
                      }}
                      placeholder="e.g. ABC Furniture Pvt Ltd"
                      className={`w-full pl-9 pr-3.5 py-2.5 bg-slate-50/60 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                        errors.companyName
                          ? 'border-rose-300 focus:ring-rose-400 text-rose-900'
                          : 'border-slate-200 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800'
                      }`}
                    />
                  </div>
                  {errors.companyName && <p className="text-xs text-rose-600 mt-1 font-medium">{errors.companyName}</p>}
                </div>

                {/* Company Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Company Phone <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="tel"
                      value={companyPhone}
                      onChange={(e) => {
                        setCompanyPhone(e.target.value)
                        if (errors.companyPhone) setErrors((prev) => ({ ...prev, companyPhone: '' }))
                      }}
                      placeholder="+91 98765 43210"
                      className={`w-full pl-9 pr-3.5 py-2.5 bg-slate-50/60 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                        errors.companyPhone
                          ? 'border-rose-300 focus:ring-rose-400 text-rose-900'
                          : 'border-slate-200 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800'
                      }`}
                    />
                  </div>
                  {errors.companyPhone && <p className="text-xs text-rose-600 mt-1 font-medium">{errors.companyPhone}</p>}
                </div>

                {/* Company Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Company Official Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="email"
                      value={companyEmail}
                      onChange={(e) => setCompanyEmail(e.target.value)}
                      placeholder="info@company.com"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* GST Number */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">GST Number (GSTIN)</label>
                    <span className="text-[10px] text-slate-400 font-medium">15 Characters</span>
                  </div>
                  <input
                    type="text"
                    value={gstNumber}
                    onChange={(e) => {
                      setGstNumber(e.target.value.toUpperCase())
                      if (errors.gstNumber) setErrors((prev) => ({ ...prev, gstNumber: '' }))
                    }}
                    placeholder="33ABCDE1234F1Z5"
                    maxLength={15}
                    className={`w-full px-3.5 py-2.5 bg-slate-50/60 border rounded-xl text-sm uppercase font-mono tracking-wider focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                      errors.gstNumber
                        ? 'border-rose-300 focus:ring-rose-400 text-rose-900'
                        : 'border-slate-200 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800'
                    }`}
                  />
                  {errors.gstNumber && <p className="text-xs text-rose-600 mt-1 font-medium">{errors.gstNumber}</p>}
                </div>

                {/* Website URL */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Website URL</label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://company.com"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Company Category */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Company Category <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !isCustomCategory
                        setIsCustomCategory(next)
                        if (next && CATEGORIES.includes(category as any)) {
                          setCategory('')
                        } else if (!next && !category) {
                          setCategory('Corporate')
                        }
                      }}
                      className="text-[11px] font-bold text-orange-600 hover:text-orange-700 cursor-pointer flex items-center gap-1"
                    >
                      {isCustomCategory ? '← Choose from Searchable List' : '✏️ Enter Manually'}
                    </button>
                  </div>

                  {isCustomCategory ? (
                    <div className="space-y-1">
                      <input
                        type="text"
                        value={category}
                        onChange={(e) => {
                          setCategory(e.target.value)
                          if (errors.category) setErrors((prev) => ({ ...prev, category: '' }))
                        }}
                        placeholder="Type category (e.g. Healthcare, Educational, Hospitality)..."
                        className="w-full px-3.5 py-2.5 bg-white border border-orange-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      />
                      <p className="text-[10px] text-slate-400">Custom business category entered manually</p>
                    </div>
                  ) : (
                    <SearchableSelect
                      value={category}
                      onChange={(val) => {
                        setCategory(val)
                        if (errors.category) setErrors((prev) => ({ ...prev, category: '' }))
                      }}
                      options={CATEGORY_OPTIONS}
                      placeholder="Search or select category..."
                      searchPlaceholder="Search category (e.g. Corporate, Interior, Retail)..."
                      allowCustom={true}
                      customOptionLabel="+ Enter Custom Category..."
                      accentColor="orange"
                      showBadge={true}
                      clearable={false}
                      onCustomSelect={(customVal) => {
                        if (customVal) {
                          setCategory(customVal)
                          if (errors.category) setErrors((prev) => ({ ...prev, category: '' }))
                        } else {
                          setIsCustomCategory(true)
                          setCategory('')
                        }
                      }}
                    />
                  )}
                  {errors.category && <p className="text-xs text-rose-600 mt-1 font-medium">{errors.category}</p>}
                </div>

                {/* Company Size */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">Company Size</label>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !isCustomSize
                        setIsCustomSize(next)
                        if (next && COMPANY_SIZES.includes(companySize as any)) {
                          setCompanySize('')
                        } else if (!next && !companySize) {
                          setCompanySize('Medium')
                        }
                      }}
                      className="text-[11px] font-bold text-orange-600 hover:text-orange-700 cursor-pointer flex items-center gap-1"
                    >
                      {isCustomSize ? '← Choose from Searchable List' : '✏️ Enter Manually'}
                    </button>
                  </div>

                  {isCustomSize ? (
                    <div className="space-y-1">
                      <input
                        type="text"
                        value={companySize}
                        onChange={(e) => setCompanySize(e.target.value)}
                        placeholder="Type size (e.g. 100-250 employees, Boutique Studio)..."
                        className="w-full px-3.5 py-2.5 bg-white border border-orange-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      />
                      <p className="text-[10px] text-slate-400">Custom company size or headcount description</p>
                    </div>
                  ) : (
                    <SearchableSelect
                      value={companySize}
                      onChange={(val) => setCompanySize(val)}
                      options={COMPANY_SIZE_OPTIONS}
                      placeholder="Search or select company size..."
                      searchPlaceholder="Search size (e.g. Small, Medium, Large)..."
                      allowCustom={true}
                      customOptionLabel="+ Enter Custom Company Size..."
                      accentColor="orange"
                      showBadge={true}
                      clearable={false}
                      onCustomSelect={(customVal) => {
                        if (customVal) {
                          setCompanySize(customVal)
                        } else {
                          setIsCustomSize(true)
                          setCompanySize('')
                        }
                      }}
                    />
                  )}
                </div>

                {/* Customer Status */}
                <div className="sm:col-span-2 pt-2">
                  <label className="block text-xs font-bold text-slate-700 mb-2">Customer Status</label>
                  <div className="grid grid-cols-3 gap-3">
                    {STATUS_OPTIONS.map((opt) => {
                      const isSelected = status === opt.value
                      return (
                        <button
                          type="button"
                          key={opt.value}
                          onClick={() => setStatus(opt.value)}
                          className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            isSelected
                              ? `${opt.color} ring-2 ring-orange-500/30 shadow-xs`
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              opt.value === 'active'
                                ? 'bg-emerald-500'
                                : opt.value === 'inactive'
                                ? 'bg-amber-500'
                                : 'bg-slate-400'
                            }`}
                          />
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION B: Contact Persons */}
          {activeTab === 'B' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-black">
                      B
                    </span>
                    Contact Person Details
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Maintain multiple company representatives with designated roles & direct channels
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddContact}
                  className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Contact
                </button>
              </div>

              {errors.contacts && (
                <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200 font-medium">
                  {errors.contacts}
                </p>
              )}

              <div className="space-y-3">
                {contacts.map((con, idx) => (
                  <div
                    key={idx}
                    className={`p-3 sm:p-3.5 rounded-xl border transition-all ${
                      con.isPrimary
                        ? 'bg-orange-50/30 border-orange-200/80 shadow-2xs'
                        : 'bg-slate-50/50 border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          {con.name?.trim() || (companyName.trim() ? `${companyName.trim()} Representative` : `Representative #${idx + 1}`)}
                        </span>
                        {con.isPrimary && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded-full">
                            ★ Primary Contact
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {!con.isPrimary && (
                          <button
                            type="button"
                            onClick={() => handleUpdateContact(idx, 'isPrimary', true)}
                            className="text-xs font-semibold text-slate-500 hover:text-orange-600 px-2 py-1 rounded-md hover:bg-white transition cursor-pointer"
                          >
                            Set as Primary
                          </button>
                        )}
                        {contacts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveContact(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Remove contact"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold text-slate-700">
                            Full Name
                          </label>
                          {con.name && (
                            <button
                              type="button"
                              onClick={() => handleUpdateContact(idx, 'name', '')}
                              className="text-[10px] text-slate-400 hover:text-rose-600 cursor-pointer font-medium"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={con.name || ''}
                          onChange={(e) => handleUpdateContact(idx, 'name', e.target.value)}
                          placeholder="e.g. Raj Kumar"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none transition-colors"
                        />
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          Leave blank to default to {companyName.trim() ? `${companyName.trim()} Representative` : 'company representative'}
                        </span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Designation / Role
                        </label>
                        <SearchableSelect
                          value={con.designation || 'Representative'}
                          onChange={(val) => handleUpdateContact(idx, 'designation', val)}
                          options={DESIGNATION_OPTIONS}
                          placeholder="Select Designation..."
                          searchPlaceholder="Search role (e.g. Purchase Manager, Architect)..."
                          allowCustom={true}
                          customOptionLabel="+ Enter Custom Designation..."
                          accentColor="orange"
                          showBadge={false}
                          clearable={false}
                          size="sm"
                          onCustomSelect={(customVal) => {
                            if (customVal) handleUpdateContact(idx, 'designation', customVal)
                          }}
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold text-slate-700">Direct Phone</label>
                          <div className="flex items-center gap-2">
                            {con.phone && (
                              <button
                                type="button"
                                onClick={() => handleUpdateContact(idx, 'phone', '')}
                                className="text-[10px] text-slate-400 hover:text-rose-600 cursor-pointer font-medium"
                              >
                                Clear
                              </button>
                            )}
                            {companyPhone && con.phone !== companyPhone && (
                              <button
                                type="button"
                                onClick={() => handleUpdateContact(idx, 'phone', companyPhone)}
                                className="text-[10px] text-orange-600 hover:text-orange-700 hover:underline cursor-pointer font-bold"
                              >
                                Copy Company Phone
                              </button>
                            )}
                          </div>
                        </div>
                        <input
                          type="tel"
                          value={con.phone || ''}
                          onChange={(e) => handleUpdateContact(idx, 'phone', e.target.value)}
                          placeholder="e.g. +91 98765 43210"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none transition-colors"
                        />
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          Auto-uses {companyPhone ? companyPhone : 'company phone'} if left blank
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold text-slate-700">Email Address</label>
                          <div className="flex items-center gap-2">
                            {con.email && (
                              <button
                                type="button"
                                onClick={() => handleUpdateContact(idx, 'email', '')}
                                className="text-[10px] text-slate-400 hover:text-rose-600 cursor-pointer font-medium"
                              >
                                Clear
                              </button>
                            )}
                            {companyEmail && con.email !== companyEmail && (
                              <button
                                type="button"
                                onClick={() => handleUpdateContact(idx, 'email', companyEmail)}
                                className="text-[10px] text-orange-600 hover:text-orange-700 hover:underline cursor-pointer font-bold"
                              >
                                Copy Company Email
                              </button>
                            )}
                          </div>
                        </div>
                        <input
                          type="email"
                          value={con.email || ''}
                          onChange={(e) => handleUpdateContact(idx, 'email', e.target.value)}
                          placeholder="e.g. raj@company.com"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none transition-colors"
                        />
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          Auto-uses {companyEmail ? companyEmail : 'company email'} if left blank
                        </span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Department</label>
                        <SearchableSelect
                          value={con.department || 'Management'}
                          onChange={(val) => handleUpdateContact(idx, 'department', val)}
                          options={DEPARTMENT_OPTIONS}
                          placeholder="Select Department..."
                          searchPlaceholder="Search department..."
                          allowCustom={true}
                          customOptionLabel="+ Enter Custom Department..."
                          accentColor="orange"
                          showBadge={false}
                          clearable={false}
                          size="sm"
                          onCustomSelect={(customVal) => {
                            if (customVal) handleUpdateContact(idx, 'department', customVal)
                          }}
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Notes / Scope (Optional)</label>
                        <input
                          type="text"
                          value={con.notes || ''}
                          onChange={(e) => handleUpdateContact(idx, 'notes', e.target.value)}
                          placeholder="e.g. PO Approver, Direct Site Contact"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION C: Company Address & Map Location */}
          {activeTab === 'C' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-black">
                      C
                    </span>
                    Company Addresses & Maps
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Maintain billing, shipping & warehouse sites with Google Maps coordinates
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddAddress}
                  className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Address
                </button>
              </div>

              {errors.addresses && (
                <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200 font-medium">
                  {errors.addresses}
                </p>
              )}

              <div className="space-y-3">
                {addresses.map((addr, idx) => (
                  <div
                    key={idx}
                    className="p-3 sm:p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/40 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        <SearchableSelect
                          value={addr.addressType || 'billing'}
                          onChange={(val) => handleUpdateAddress(idx, 'addressType', val as AddressType)}
                          options={ADDRESS_TYPES}
                          placeholder="Address Type..."
                          searchPlaceholder="Search address type..."
                          accentColor="orange"
                          showBadge={false}
                          clearable={false}
                          size="sm"
                          className="w-48 sm:w-56"
                        />
                        {addr.isDefault && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">
                            Default Site
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {!addr.isDefault && (
                          <button
                            type="button"
                            onClick={() => handleUpdateAddress(idx, 'isDefault', true)}
                            className="text-xs font-semibold text-slate-500 hover:text-emerald-600 px-2 py-1 rounded-md hover:bg-white transition cursor-pointer"
                          >
                            Set as Default
                          </button>
                        )}
                        {addresses.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveAddress(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Remove address"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Address Line 1 <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={addr.addressLine1 || ''}
                          onChange={(e) => handleUpdateAddress(idx, 'addressLine1', e.target.value)}
                          placeholder="Door No, Building, Street, Industrial Area"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none transition-colors"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Address Line 2 (Optional)</label>
                        <input
                          type="text"
                          value={addr.addressLine2 || ''}
                          onChange={(e) => handleUpdateAddress(idx, 'addressLine2', e.target.value)}
                          placeholder="Landmark, Suite, Floor, Phase"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          City <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={addr.city || ''}
                          onChange={(e) => handleUpdateAddress(idx, 'city', e.target.value)}
                          placeholder="e.g. Chennai"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          State <span className="text-rose-500">*</span>
                        </label>
                        <SearchableSelect
                          value={addr.state || 'Tamil Nadu'}
                          onChange={(val) => handleUpdateAddress(idx, 'state', val)}
                          options={INDIAN_STATES}
                          placeholder="Select State..."
                          searchPlaceholder="Search Indian state (e.g. Tamil Nadu, Maharashtra)..."
                          accentColor="orange"
                          showBadge={false}
                          clearable={false}
                          size="sm"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          PIN Code <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={addr.pinCode || ''}
                          onChange={(e) => handleUpdateAddress(idx, 'pinCode', e.target.value)}
                          placeholder="600032"
                          maxLength={6}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Country</label>
                        <input
                          type="text"
                          value={addr.country || 'India'}
                          onChange={(e) => handleUpdateAddress(idx, 'country', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none transition-colors"
                        />
                      </div>

                      {/* Map & Coordinates Sub-section */}
                      <div className="sm:col-span-2 p-3 bg-white rounded-xl border border-slate-200/90 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Navigation className="w-3.5 h-3.5 text-orange-500" />
                            Map Geocoding & Coordinates
                          </span>
                          <button
                            type="button"
                            onClick={() => handleFetchCoordinates(idx)}
                            className="text-[11px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                          >
                            <span>Auto-fill from {addr.city || 'City'}</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          <div className="sm:col-span-1">
                            <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Latitude</label>
                            <input
                              type="number"
                              step="0.0001"
                              value={addr.latitude ?? ''}
                              onChange={(e) =>
                                handleUpdateAddress(idx, 'latitude', e.target.value ? parseFloat(e.target.value) : null)
                              }
                              placeholder="13.0827"
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                            />
                          </div>

                          <div className="sm:col-span-1">
                            <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Longitude</label>
                            <input
                              type="number"
                              step="0.0001"
                              value={addr.longitude ?? ''}
                              onChange={(e) =>
                                handleUpdateAddress(idx, 'longitude', e.target.value ? parseFloat(e.target.value) : null)
                              }
                              placeholder="80.2707"
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                            />
                          </div>

                          <div className="col-span-2 sm:col-span-1 flex items-end">
                            {addr.latitude && addr.longitude ? (
                              <a
                                href={`https://www.google.com/maps?q=${addr.latitude},${addr.longitude}`}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition text-center"
                              >
                                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                                Open Map ↗
                              </a>
                            ) : (
                              <span className="text-[10px] text-slate-400 py-2">Coords help dispatch routing</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION D: Business Information */}
          {activeTab === 'D' && (
            <div className="space-y-4 animate-fade-in">
              <div className="pb-2 border-b border-slate-200/80">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-black">
                    D
                  </span>
                  Business & Commercial Terms
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure payment terms, credit limits, GST registration type and internal account notes
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Customer Type</label>
                  <SearchableSelect
                    value={customerType}
                    onChange={(val) => setCustomerType(val as CustomerType)}
                    options={CUSTOMER_TYPE_OPTIONS}
                    placeholder="Select customer type..."
                    searchPlaceholder="Search customer type..."
                    accentColor="orange"
                    showBadge={false}
                    clearable={false}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">GST Registration Type</label>
                  <SearchableSelect
                    value={gstType}
                    onChange={(val) => setGstType(val as GstType)}
                    options={GST_TYPE_OPTIONS}
                    placeholder="Select GST classification..."
                    searchPlaceholder="Search GST classification..."
                    accentColor="orange"
                    showBadge={false}
                    clearable={false}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Payment Terms</label>
                  <SearchableSelect
                    value={paymentTerms}
                    onChange={(val) => setPaymentTerms(val as PaymentTerms)}
                    options={PAYMENT_TERMS_OPTIONS}
                    placeholder="Select payment terms..."
                    searchPlaceholder="Search payment terms..."
                    allowCustom={true}
                    customOptionLabel="+ Enter Custom Payment Terms..."
                    accentColor="orange"
                    showBadge={false}
                    clearable={false}
                    onCustomSelect={(customVal) => {
                      if (customVal) setPaymentTerms(customVal as any)
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Credit Limit (₹ INR)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-sm font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      step="10000"
                      value={creditLimit}
                      onChange={(e) => setCreditLimit(parseFloat(e.target.value) || 0)}
                      placeholder="500000"
                      className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Internal Commercial Notes</label>
                  <textarea
                    rows={3}
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="Enter special pricing agreements, bulk tier agreements, or delivery requirements..."
                    className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION E: Additional Information */}
          {activeTab === 'E' && (
            <div className="space-y-4 animate-fade-in">
              <div className="pb-2 border-b border-slate-200/80">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-black">
                    E
                  </span>
                  Additional CRM Information
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">Lead origin, account manager assignment and administrative audit</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Customer Acquisition Source</label>
                  <SearchableSelect
                    value={customerSource}
                    onChange={(val) => setCustomerSource(val as CustomerSource)}
                    options={CUSTOMER_SOURCE_OPTIONS}
                    placeholder="Select acquisition channel..."
                    searchPlaceholder="Search source channel..."
                    allowCustom={true}
                    customOptionLabel="+ Enter Custom Source..."
                    accentColor="orange"
                    showBadge={false}
                    clearable={false}
                    onCustomSelect={(customVal) => {
                      if (customVal) setCustomerSource(customVal as any)
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Assigned Account Manager</label>
                  <input
                    type="text"
                    value={accountManager}
                    onChange={(e) => setAccountManager(e.target.value)}
                    placeholder="e.g. Karthik S / Sarah Jenkins"
                    className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Internal Remarks</label>
                  <textarea
                    rows={3}
                    value={internalRemarks}
                    onChange={(e) => setInternalRemarks(e.target.value)}
                    placeholder="General staff notes or historical context..."
                    className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>

                {customerToEdit && (
                  <div className="sm:col-span-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 space-y-1">
                    <p>
                      <strong>Record Created:</strong>{' '}
                      {new Date(customerToEdit.createdAt).toLocaleString('en-IN')} by {customerToEdit.createdBy}
                    </p>
                    <p>
                      <strong>Last Updated:</strong>{' '}
                      {new Date(customerToEdit.updatedAt).toLocaleString('en-IN')} by {customerToEdit.updatedBy}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Drawer Footer */}
        <div className="mt-8 pt-4 border-t border-slate-200/80 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {isCheckingDuplicate && (
              <span className="text-xs text-slate-400 flex items-center gap-1.5 animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
                Checking duplicate records...
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Record...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isEditing ? 'Save Changes' : 'Register Customer'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </Drawer>
  )
}
