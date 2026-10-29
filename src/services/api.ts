import type {
  ClientPartner,
  CompanySettings,
  ErgonomicChairModel,
  Lead,
  LeadStatus,
  Order,
  OrderStatus,
  PaymentStatus,
  Product,
  TestimonialReview,
} from '../types/admin'

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
async function uploadRequest<T>(endpoint: string, formData: FormData): Promise<T> {
  const authHeaders = getAuthHeader()
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      ...authHeaders,
    },
    body: formData,
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


export const api = {
  // Cloudflare R2 Image Uploads
  uploadImage: (file: File, productId?: string) => {
    const formData = new FormData()
    formData.append('file', file)
    if (productId) formData.append('productId', productId)
    return uploadRequest<{
      success: boolean
      data: { url: string; key: string; size: number; mimeType: string; originalName: string }
    }>('/upload/image', formData)
  },
  uploadImages: (files: File[], productId?: string) => {
    const formData = new FormData()
    for (const f of files) {
      formData.append('images', f)
    }
    if (productId) formData.append('productId', productId)
    return uploadRequest<{
      success: boolean
      count: number
      data: Array<{ url: string; key: string; size: number; mimeType: string; originalName: string }>
    }>('/upload/images', formData)
  },
  deleteImage: (params: { key?: string; url?: string; productId?: string }) =>
    request<{ success: boolean; message: string; deletedFromR2: boolean }>('/upload/image', {
      method: 'DELETE',
      body: JSON.stringify(params),
    }),

  checkHealth: () => request<{ status: string; database: { status: string; records: Record<string, number> } }>('/health'),
  getOverview: () => request<any>('/overview'),

  // Products
  getProducts: () => request<Product[]>('/products'),
  createProduct: (product: any) => request<Product>('/products', { method: 'POST', body: JSON.stringify(product) }),
  updateProduct: (id: string, partial: Partial<Product>) =>
    request<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(partial) }),
  toggleProductStock: (id: string) => request<Product>(`/products/${id}/toggle-stock`, { method: 'PATCH' }),
  toggleProductFeatured: (id: string) => request<Product>(`/products/${id}/toggle-featured`, { method: 'PATCH' }),
  deleteProduct: (id: string) => request<{ success: boolean; id: string }>(`/products/${id}`, { method: 'DELETE' }),

  // Ergonomic Chairs
  getChairs: () => request<ErgonomicChairModel[]>('/chairs'),
  createChair: (chair: any) => request<ErgonomicChairModel>('/chairs', { method: 'POST', body: JSON.stringify(chair) }),
  updateChair: (id: string, partial: Partial<ErgonomicChairModel>) =>
    request<ErgonomicChairModel>(`/chairs/${id}`, { method: 'PUT', body: JSON.stringify(partial) }),
  toggleChairProduction: (id: string) => request<ErgonomicChairModel>(`/chairs/${id}/toggle-production`, { method: 'PATCH' }),
  deleteChair: (id: string) => request<{ success: boolean; id: string }>(`/chairs/${id}`, { method: 'DELETE' }),

  // Leads
  getLeads: () => request<Lead[]>('/leads'),
  createLead: (lead: any) => request<Lead>('/leads', { method: 'POST', body: JSON.stringify(lead) }),
  updateLead: (id: string, partial: Partial<Lead>) => request<Lead>(`/leads/${id}`, { method: 'PUT', body: JSON.stringify(partial) }),
  updateLeadStatus: (id: string, status: LeadStatus) =>
    request<Lead>(`/leads/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteLead: (id: string) => request<{ success: boolean; id: string }>(`/leads/${id}`, { method: 'DELETE' }),

  // Orders
  getOrders: () => request<Order[]>('/orders'),
  createOrder: (order: any) => request<Order>('/orders', { method: 'POST', body: JSON.stringify(order) }),
  updateOrder: (id: string, partial: Partial<Order>) =>
    request<Order>(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(partial) }),
  updateOrderStatus: (id: string, status: OrderStatus) =>
    request<Order>(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  updateOrderPayment: (id: string, paymentStatus: PaymentStatus) =>
    request<Order>(`/orders/${id}/payment`, { method: 'PATCH', body: JSON.stringify({ paymentStatus }) }),
  deleteOrder: (id: string) => request<{ success: boolean; id: string }>(`/orders/${id}`, { method: 'DELETE' }),

  // Clients
  getClients: () => request<ClientPartner[]>('/clients'),
  createClient: (client: any) => request<ClientPartner>('/clients', { method: 'POST', body: JSON.stringify(client) }),
  updateClient: (id: string, partial: Partial<ClientPartner>) =>
    request<ClientPartner>(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(partial) }),
  toggleClientFeatured: (id: string) => request<ClientPartner>(`/clients/${id}/toggle-featured`, { method: 'PATCH' }),
  deleteClient: (id: string) => request<{ success: boolean; id: string }>(`/clients/${id}`, { method: 'DELETE' }),

  // Testimonials
  getTestimonials: () => request<TestimonialReview[]>('/testimonials'),
  createTestimonial: (test: any) => request<TestimonialReview>('/testimonials', { method: 'POST', body: JSON.stringify(test) }),
  updateTestimonial: (id: string, partial: Partial<TestimonialReview>) =>
    request<TestimonialReview>(`/testimonials/${id}`, { method: 'PUT', body: JSON.stringify(partial) }),
  toggleTestimonialApproved: (id: string) =>
    request<TestimonialReview>(`/testimonials/${id}/toggle-approved`, { method: 'PATCH' }),
  toggleTestimonialFeatured: (id: string) =>
    request<TestimonialReview>(`/testimonials/${id}/toggle-featured`, { method: 'PATCH' }),
  deleteTestimonial: (id: string) => request<{ success: boolean; id: string }>(`/testimonials/${id}`, { method: 'DELETE' }),

  // Settings
  getSettings: () => request<CompanySettings>('/settings'),
  updateSettings: (settings: Partial<CompanySettings>) =>
    request<CompanySettings>('/settings', { method: 'PUT', body: JSON.stringify(settings) }),

  // Sync
  resetToDefaults: () => request<{ success: boolean; message: string }>('/sync/reset', { method: 'POST' }),
  exportDatabase: () => request<any>('/sync/export'),
}
