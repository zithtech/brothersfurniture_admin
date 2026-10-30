import type {
  Customer,
  CustomerAddress,
  CustomerContact,
  CustomerDuplicateCheckResult,
  CustomerFilterParams,
  CustomerNote,
  CustomerPaginationResponse,
  CustomerStats,
  CustomerStatus,
} from '../types/customer'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function getAuthHeader(): Record<string, string> {
  try {
    const raw = localStorage.getItem('brothersfurniture_admin_session')
    if (raw) {
      const session = JSON.parse(raw)
      if (session?.token) {
        return { Authorization: `Bearer ${session.token}` }
      }
    }
  } catch {
    // ignore
  }
  return {}
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const authHeaders = getAuthHeader()
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...(options?.headers || {}),
    },
    ...options,
  })

  if (!res.ok) {
    if (res.status === 401) {
      window.dispatchEvent(new CustomEvent('bf:auth:unauthorized'))
    }
    const errorBody = await res.json().catch(() => ({}))
    throw new Error(errorBody.error || `HTTP error ${res.status}: ${res.statusText}`)
  }

  return res.json()
}

export const customerApi = {
  // 1. List customers with pagination and filtering
  getCustomers: (params?: CustomerFilterParams): Promise<CustomerPaginationResponse> => {
    const query = new URLSearchParams()
    if (params) {
      if (params.search) query.append('search', params.search)
      if (params.status && params.status !== 'all') query.append('status', params.status)
      if (params.category && params.category !== 'All') query.append('category', params.category)
      if (params.companySize && params.companySize !== 'All') query.append('companySize', params.companySize)
      if (params.city && params.city !== 'All') query.append('city', params.city)
      if (params.state && params.state !== 'All') query.append('state', params.state)
      if (params.sortBy) query.append('sortBy', params.sortBy)
      if (params.sortOrder) query.append('sortOrder', params.sortOrder)
      if (params.page) query.append('page', String(params.page))
      if (params.limit) query.append('limit', String(params.limit))
    }
    const queryString = query.toString() ? `?${query.toString()}` : ''
    return request<CustomerPaginationResponse>(`/customers${queryString}`)
  },

  // 2. Summary stats for metrics cards
  getStats: (): Promise<CustomerStats> => {
    return request<CustomerStats>('/customers/stats')
  },

  // 3. Single customer profile with contacts, addresses, notes, activity logs, orders
  getCustomerById: (id: string): Promise<Customer> => {
    return request<Customer>(`/customers/${id}`)
  },

  // 4. Create new customer with contacts & addresses
  createCustomer: (data: Partial<Customer> & { contacts?: Partial<CustomerContact>[]; addresses?: Partial<CustomerAddress>[] }): Promise<Customer> => {
    return request<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // 5. Update existing customer basic & business details
  updateCustomer: (
    id: string,
    partial: Partial<Customer> & { contacts?: Partial<CustomerContact>[]; addresses?: Partial<CustomerAddress>[] }
  ): Promise<Customer> => {
    return request<Customer>(`/customers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(partial),
    })
  },

  // 6. Update customer status
  updateStatus: (id: string, status: CustomerStatus, updatedBy = 'Admin'): Promise<Customer> => {
    return request<Customer>(`/customers/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, updatedBy }),
    })
  },

  // 7. Soft delete (archive) or permanent delete
  deleteCustomer: (id: string, permanent = false): Promise<{ success: boolean; id: string }> => {
    return request<{ success: boolean; id: string }>(`/customers/${id}${permanent ? '?permanent=true' : ''}`, {
      method: 'DELETE',
    })
  },

  // 8. Contact management
  addContact: (customerId: string, contact: Partial<CustomerContact>): Promise<CustomerContact> => {
    return request<CustomerContact>(`/customers/${customerId}/contacts`, {
      method: 'POST',
      body: JSON.stringify(contact),
    })
  },
  updateContact: (customerId: string, contactId: string, contact: Partial<CustomerContact>): Promise<CustomerContact> => {
    return request<CustomerContact>(`/customers/${customerId}/contacts/${contactId}`, {
      method: 'PATCH',
      body: JSON.stringify(contact),
    })
  },
  deleteContact: (customerId: string, contactId: string): Promise<{ success: boolean }> => {
    return request<{ success: boolean }>(`/customers/${customerId}/contacts/${contactId}`, {
      method: 'DELETE',
    })
  },

  // 9. Address management
  addAddress: (customerId: string, address: Partial<CustomerAddress>): Promise<CustomerAddress> => {
    return request<CustomerAddress>(`/customers/${customerId}/addresses`, {
      method: 'POST',
      body: JSON.stringify(address),
    })
  },
  updateAddress: (customerId: string, addressId: string, address: Partial<CustomerAddress>): Promise<CustomerAddress> => {
    return request<CustomerAddress>(`/customers/${customerId}/addresses/${addressId}`, {
      method: 'PATCH',
      body: JSON.stringify(address),
    })
  },
  deleteAddress: (customerId: string, addressId: string): Promise<{ success: boolean }> => {
    return request<{ success: boolean }>(`/customers/${customerId}/addresses/${addressId}`, {
      method: 'DELETE',
    })
  },

  // 10. Notes
  addNote: (customerId: string, note: { note: string; category?: string; authorName?: string }): Promise<CustomerNote> => {
    return request<CustomerNote>(`/customers/${customerId}/notes`, {
      method: 'POST',
      body: JSON.stringify(note),
    })
  },

  // 11. Activity logs
  getActivityLogs: (customerId: string): Promise<any[]> => {
    return request<any[]>(`/customers/${customerId}/activity`)
  },

  // 12. Check duplicate
  checkDuplicate: (params: {
    gstNumber?: string
    companyName?: string
    phone?: string
    excludeId?: string
  }): Promise<CustomerDuplicateCheckResult> => {
    return request<CustomerDuplicateCheckResult>('/customers/check-duplicate', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  },

  // 13. Export CSV URL
  getExportUrl: (params?: { status?: string; category?: string }): string => {
    const query = new URLSearchParams()
    if (params?.status) query.append('status', params.status)
    if (params?.category) query.append('category', params.category)
    return `${API_BASE_URL}/customers/export?${query.toString()}`
  },

  // 14. Bulk import
  importCustomers: (customers: any[]): Promise<{ success: boolean; importedCount: number; skippedCount: number; skipped: any[] }> => {
    return request<{ success: boolean; importedCount: number; skippedCount: number; skipped: any[] }>('/customers/import', {
      method: 'POST',
      body: JSON.stringify({ customers }),
    })
  },
}
