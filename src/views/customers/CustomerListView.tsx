import React, { useEffect, useState } from 'react'
import {
  Archive,
  ArrowUpDown,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit2,
  Eye,
  Filter,
  Grid,
  List,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react'
import { useAdmin } from '../../context/AdminContext'
import { SearchableSelect, type SelectOption } from '../../components/common/SearchableSelect'
import { customerApi } from '../../services/customerApi'
import type {
  CompanyCategory,
  CompanySize,
  Customer,
  CustomerFilterParams,
  CustomerStats,
  CustomerStatus,
} from '../../types/customer'

interface CustomerListViewProps {
  onSelectCustomer: (customer: Customer) => void
  onAddCustomer: () => void
  onEditCustomer: (customer: Customer) => void
  onOpenImport: () => void
  refreshTrigger?: number
}

const CATEGORIES: ('All' | CompanyCategory)[] = [
  'All',
  'Manufacturer',
  'Retailer',
  'Wholesaler',
  'Distributor',
  'Dealer',
  'Corporate',
  'Interior Designer',
  'Other',
]

const COMPANY_SIZES: ('All' | CompanySize)[] = ['All', 'Small', 'Medium', 'Large', 'Enterprise']

export const CustomerListView: React.FC<CustomerListViewProps> = ({
  onSelectCustomer,
  onAddCustomer,
  onEditCustomer,
  onOpenImport,
  refreshTrigger,
}) => {
  const { addToast, confirm } = useAdmin()

  // View state
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card')

  // Search & Filters
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedSize, setSelectedSize] = useState<string>('All')
  const [sortBy, setSortBy] = useState<'created_at' | 'company_name' | 'customer_code' | 'category' | 'status'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Pagination
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(12)

  // Data
  const [customers, setCustomers] = useState<Customer[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState<CustomerStats>({ total: 0, active: 0, inactive: 0, archived: 0 })
  const [isLoading, setIsLoading] = useState(true)

  const availableCategories = React.useMemo(() => {
    const customCats = customers.map((c) => c.category).filter(Boolean)
    return Array.from(new Set([...CATEGORIES, ...customCats]))
  }, [customers])

  const availableSizes = React.useMemo(() => {
    const customSizes = customers.map((c) => c.companySize).filter(Boolean)
    return Array.from(new Set([...COMPANY_SIZES, ...customSizes]))
  }, [customers])

  const categoryFilterOptions: SelectOption[] = React.useMemo(() => {
    return availableCategories.map((c) => ({
      value: c,
      label: c === 'All' ? 'All Categories' : c,
    }))
  }, [availableCategories])

  const sizeFilterOptions: SelectOption[] = React.useMemo(() => {
    return availableSizes.map((sz) => ({
      value: sz,
      label: sz === 'All' ? 'All Sizes' : sz,
    }))
  }, [availableSizes])

  const statusFilterOptions: SelectOption[] = React.useMemo(
    () => [
      { value: 'all', label: 'All Statuses' },
      { value: 'active', label: 'Active Accounts' },
      { value: 'inactive', label: 'Inactive Accounts' },
      { value: 'archived', label: 'Archived Accounts' },
    ],
    []
  )

  const sortFilterOptions: SelectOption[] = React.useMemo(
    () => [
      { value: 'created_at', label: 'Newest First' },
      { value: 'company_name', label: 'Company Name (A-Z)' },
      { value: 'customer_code', label: 'Customer ID' },
      { value: 'category', label: 'Category' },
    ],
    []
  )

  // Load customers
  const loadCustomers = async () => {
    setIsLoading(true)
    try {
      const params: CustomerFilterParams = {
        search: search.trim() || undefined,
        status: selectedStatus,
        category: selectedCategory,
        companySize: selectedSize,
        sortBy,
        sortOrder,
        page,
        limit,
      }
      const data = await customerApi.getCustomers(params)
      setCustomers(data.items)
      setTotalCount(data.total)
      setTotalPages(data.totalPages)
      if (data.stats) {
        setStats(data.stats)
      }
    } catch (err: any) {
      console.error('Failed to load customers:', err)
      addToast('error', 'Failed to load customers', err.message || 'Network error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [search, selectedStatus, selectedCategory, selectedSize, sortBy, sortOrder, page, limit, refreshTrigger])

  // Reset pagination when filter changes
  useEffect(() => {
    setPage(1)
  }, [search, selectedStatus, selectedCategory, selectedSize])

  // Status toggle handler
  const handleToggleStatus = async (customer: Customer, newStatus: CustomerStatus) => {
    try {
      await customerApi.updateStatus(customer.id, newStatus)
      addToast('success', 'Status Updated', `"${customer.companyName}" marked as ${newStatus}.`)
      loadCustomers()
    } catch (err: any) {
      addToast('error', 'Status Change Failed', err.message)
    }
  }

  // Soft delete / archive handler
  const handleDeleteCustomer = async (customer: Customer) => {
    const ok = await confirm({
      title: `Archive Customer "${customer.companyName}"?`,
      message: `Move "${customer.companyName}" (${customer.customerCode}) to archive? You can restore it anytime.`,
      confirmText: 'Archive Customer',
      variant: 'danger',
      icon: 'archive',
    })
    if (!ok) return

    try {
      await customerApi.deleteCustomer(customer.id)
      addToast('warning', 'Customer Archived', `"${customer.companyName}" archived.`)
      loadCustomers()
    } catch (err: any) {
      addToast('error', 'Archive Failed', err.message)
    }
  }

  // Export CSV handler
  const handleExportCsv = () => {
    const exportUrl = customerApi.getExportUrl({
      status: selectedStatus,
      category: selectedCategory,
    })
    window.open(exportUrl, '_blank')
    addToast('info', 'Export Started', 'Customer directory CSV is downloading...')
  }

  const hasActiveFilters =
    search.trim() !== '' ||
    selectedStatus !== 'all' ||
    selectedCategory !== 'All' ||
    selectedSize !== 'All'

  const clearFilters = () => {
    setSearch('')
    setSelectedStatus('all')
    setSelectedCategory('All')
    setSelectedSize('All')
  }

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-[11px] font-bold text-orange-600 uppercase tracking-widest">
              Commercial Directory
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            Customer Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Centralized B2B directory, multiple contact persons, GST accounts and map facilities
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadCustomers}
            className="p-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/90 rounded-lg shadow-2xs transition cursor-pointer"
            title="Refresh Directory"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-orange-500' : ''}`} />
          </button>

          <button
            onClick={onOpenImport}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <Upload className="w-3 h-3 text-slate-500" />
            <span>Import</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <Download className="w-3 h-3 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onAddCustomer}
            className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Total Customers */}
        <div
          onClick={() => setSelectedStatus('all')}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            selectedStatus === 'all'
              ? 'bg-orange-50/50 border-orange-300 ring-2 ring-orange-500/20 shadow-2xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Customers</span>
            <span className="p-1.5 rounded-lg bg-orange-50 text-orange-600">
              <Users className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{stats.total}</span>
            <span className="text-[11px] font-bold text-slate-400">Accounts</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Full commercial directory</p>
        </div>

        {/* Active Customers */}
        <div
          onClick={() => setSelectedStatus('active')}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            selectedStatus === 'active'
              ? 'bg-emerald-50/50 border-emerald-300 ring-2 ring-emerald-500/20 shadow-2xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Active Accounts</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-emerald-700 tracking-tight">{stats.active}</span>
            <span className="text-[11px] font-bold text-emerald-600">
              {stats.total > 0 ? `${Math.round((stats.active / stats.total) * 100)}%` : '0%'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Ready for quotations & orders</p>
        </div>

        {/* Inactive Customers */}
        <div
          onClick={() => setSelectedStatus('inactive')}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            selectedStatus === 'inactive'
              ? 'bg-amber-50/50 border-amber-300 ring-2 ring-amber-500/20 shadow-2xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Inactive Accounts</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Building2 className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-amber-700 tracking-tight">{stats.inactive}</span>
            <span className="text-[11px] font-bold text-amber-600">Dormant</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Pending terms renegotiation</p>
        </div>

        {/* Archived Customers */}
        <div
          onClick={() => setSelectedStatus('archived')}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            selectedStatus === 'archived'
              ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-500/20 shadow-2xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Archived Records</span>
            <span className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
              <Archive className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-slate-700 tracking-tight">{stats.archived}</span>
            <span className="text-[11px] font-bold text-slate-400">Historical</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Soft deleted records</p>
        </div>
      </div>

      {/* Search, Filter Bar and View Mode Switcher */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs space-y-2.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by company name, GSTIN, phone, email, representative, or city..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Controls: View Toggle & Sort */}
          <div className="flex items-center gap-2 shrink-0">
            {/* View Mode Toggle */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('card')}
                className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === 'card'
                    ? 'bg-white text-orange-600 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Grid Card View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-orange-600 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Dropdowns Row */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <Filter className="w-3.5 h-3.5 text-orange-500" />
            <span>Filters:</span>
          </div>

          {/* Category Filter */}
          <SearchableSelect
            value={selectedCategory}
            onChange={(val) => setSelectedCategory(val)}
            options={categoryFilterOptions}
            placeholder="Category..."
            searchPlaceholder="Search category..."
            clearable={false}
            size="sm"
            accentColor="orange"
            showBadge={false}
            className="w-44 sm:w-52"
          />

          {/* Company Size Filter */}
          <SearchableSelect
            value={selectedSize}
            onChange={(val) => setSelectedSize(val)}
            options={sizeFilterOptions}
            placeholder="Size..."
            searchPlaceholder="Search size..."
            clearable={false}
            size="sm"
            accentColor="orange"
            showBadge={false}
            className="w-36 sm:w-44"
          />

          {/* Status Filter */}
          <SearchableSelect
            value={selectedStatus}
            onChange={(val) => setSelectedStatus(val)}
            options={statusFilterOptions}
            placeholder="Status..."
            searchPlaceholder="Search status..."
            clearable={false}
            size="sm"
            accentColor="orange"
            showBadge={false}
            className="w-36 sm:w-44"
          />

          {/* Sort By Dropdown */}
          <div className="ml-auto flex items-center gap-2">
            <SearchableSelect
              value={sortBy}
              onChange={(val) => setSortBy(val as any)}
              options={sortFilterOptions}
              placeholder="Sort by..."
              searchPlaceholder="Sort..."
              clearable={false}
              size="sm"
              accentColor="orange"
              showBadge={false}
              className="w-40 sm:w-48"
            />

            {/* Sort Order Direction Toggle */}
            <button
              onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 transition cursor-pointer"
              title={sortOrder === 'asc' ? 'Ascending Order' : 'Descending Order'}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer pl-1"
            >
              <X className="w-3 h-3" />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Content: Cards or Table */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="p-5 bg-white rounded-2xl border border-slate-200 animate-pulse space-y-3">
              <div className="h-5 bg-slate-200 rounded-lg w-3/4" />
              <div className="h-4 bg-slate-100 rounded-lg w-1/2" />
              <div className="h-16 bg-slate-50 rounded-xl" />
              <div className="h-8 bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : customers.length === 0 ? (
        <div className="py-16 bg-white rounded-2xl border border-slate-200/90 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 mx-auto flex items-center justify-center">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No Customers Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {hasActiveFilters
                ? 'No customer records match your filter criteria. Try adjusting or clearing search filters.'
                : 'Your customer directory is currently empty. Register your first customer account.'}
            </p>
          </div>
          {hasActiveFilters ? (
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
            >
              Clear Filters
            </button>
          ) : (
            <button
              onClick={onAddCustomer}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add First Customer
            </button>
          )}
        </div>
      ) : viewMode === 'card' ? (
        /* CARD GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((c) => {
            const contact = c.primaryContact
            const address = c.primaryAddress

            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-orange-300 hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden group"
              >
                {/* Card Header */}
                <div className="p-4 pb-3 border-b border-slate-100 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-slate-400 group-hover:text-orange-600 transition-colors">
                          {c.customerCode}
                        </span>
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            c.status === 'active'
                              ? 'bg-emerald-500'
                              : c.status === 'inactive'
                              ? 'bg-amber-500'
                              : 'bg-slate-400'
                          }`}
                        />
                      </div>
                      <h3
                        onClick={() => onSelectCustomer(c)}
                        className="text-sm sm:text-base font-bold text-slate-900 hover:text-orange-600 transition truncate cursor-pointer mt-0.5"
                        title={c.companyName}
                      >
                        {c.companyName}
                      </h3>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        c.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : c.status === 'inactive'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-300'
                      }`}
                    >
                      {c.status === 'active' ? 'Active' : c.status === 'inactive' ? 'Inactive' : 'Archived'}
                    </span>
                  </div>

                  {/* Badges: Category & Size */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium">
                      {c.category}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-500 font-medium">{c.companySize}</span>
                    {c.gstNumber && (
                      <>
                        <span className="text-slate-300">·</span>
                        <span className="font-mono text-[10px] text-slate-500">{c.gstNumber}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Card Body: Primary Contact & Address */}
                <div className="p-4 space-y-3 flex-1 text-xs">
                  {/* Primary Representative */}
                  <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {contact?.name ? contact.name.substring(0, 2).toUpperCase() : 'CP'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-800 truncate">
                        {contact?.name || 'No Primary Contact'}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {contact?.designation || c.companyPhone}
                      </p>
                    </div>
                    {contact?.phone && (
                      <a
                        href={`tel:${contact.phone}`}
                        className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-white rounded-lg transition"
                        title={`Call ${contact.phone}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  {/* Primary Address */}
                  <div className="flex items-start gap-2 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span className="text-[11px] truncate">
                      {address ? `${address.city}, ${address.state}` : 'Location unassigned'}
                    </span>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="px-4 py-3 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectCustomer(c)}
                    className="flex-1 py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>View Details</span>
                  </button>

                  <button
                    onClick={() => onEditCustomer(c)}
                    className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition cursor-pointer"
                    title="Edit Customer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteCustomer(c)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                    title="Archive Customer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[11px] font-bold">
                <tr>
                  <th className="p-3.5">Customer Code</th>
                  <th className="p-3.5">Company Name</th>
                  <th className="p-3.5">Category & Size</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Primary Contact</th>
                  <th className="p-3.5">Location</th>
                  <th className="p-3.5">GSTIN</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5 font-mono font-bold text-orange-600">{c.customerCode}</td>
                    <td className="p-3.5">
                      <button
                        onClick={() => onSelectCustomer(c)}
                        className="font-bold text-slate-900 hover:text-orange-600 text-left cursor-pointer"
                      >
                        {c.companyName}
                      </button>
                      <p className="text-[11px] text-slate-400">{c.companyPhone}</p>
                    </td>
                    <td className="p-3.5">
                      <span className="font-semibold text-slate-800">{c.category}</span>
                      <p className="text-[11px] text-slate-400">{c.companySize}</p>
                    </td>
                    <td className="p-3.5">
                      <select
                        value={c.status}
                        onChange={(e) => handleToggleStatus(c, e.target.value as CustomerStatus)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer focus:outline-none transition ${
                          c.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : c.status === 'inactive'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="archived">Archived</option>
                      </select>
                    </td>
                    <td className="p-3.5">
                      <p className="font-semibold text-slate-800">{c.primaryContact?.name || '—'}</p>
                      <p className="text-[11px] text-slate-400">{c.primaryContact?.phone || ''}</p>
                    </td>
                    <td className="p-3.5">
                      <p className="font-medium text-slate-800">{c.primaryAddress?.city || '—'}</p>
                      <p className="text-[11px] text-slate-400">{c.primaryAddress?.state || ''}</p>
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-600">{c.gstNumber || '—'}</td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onSelectCustomer(c)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEditCustomer(c)}
                          className="p-1.5 text-slate-400 hover:text-orange-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(c)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                          title="Archive"
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
        </div>
      )}

      {/* Server-Side Pagination Footer */}
      {totalCount > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500">
            Showing <span className="font-bold text-slate-800">{(page - 1) * limit + 1}</span> to{' '}
            <span className="font-bold text-slate-800">{Math.min(page * limit, totalCount)}</span> of{' '}
            <span className="font-bold text-slate-800">{totalCount}</span> customer accounts
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px]">Rows per page:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value))
                  setPage(1)
                }}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
              >
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 font-bold text-slate-700">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
