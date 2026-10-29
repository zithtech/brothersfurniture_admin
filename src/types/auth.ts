export type AdminRole = 'super_admin' | 'inventory_manager' | 'sales_manager' | 'viewer'

export type AdminStatus = 'active' | 'suspended' | 'pending_approval'

export interface AdminUser {
  id: string
  email: string
  name: string
  role: AdminRole
  status: AdminStatus
  phone?: string
  avatarUrl?: string
  lastLoginAt?: string
  createdAt: string
  notes?: string
}

export interface AuthSession {
  token: string
  refreshToken?: string
  user: AdminUser
  expiresAt: number
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface SignUpData {
  name: string
  email: string
  password: string
  role?: AdminRole
  phone?: string
  inviteCode?: string
}

export interface AdminInviteData {
  name: string
  email: string
  role: AdminRole
  phone?: string
  tempPassword?: string
  notes?: string
}

export interface AuditLog {
  id: string
  adminEmail: string
  action: string
  entityType?: string
  entityId?: string
  details?: string
  timestamp: string
}
