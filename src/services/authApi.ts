import type {
  AdminInviteData,
  AdminRole,
  AdminStatus,
  AdminUser,
  AuditLog,
  AuthSession,
  LoginCredentials,
  SignUpData,
} from '../types/auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const ADMINS_STORAGE_KEY = 'brothersfurniture_admin_users'
const AUDIT_STORAGE_KEY = 'brothersfurniture_admin_audit_logs'

const DEFAULT_ADMINS: (AdminUser & { password: string })[] = [
  {
    id: 'admin-brothers-super',
    email: 'brothersfurniture91@gmail.com',
    name: 'Brothers Furniture (Super Admin)',
    role: 'super_admin',
    status: 'active',
    phone: '9790740027',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=160&q=80',
    lastLoginAt: new Date().toISOString(),
    createdAt: '2026-01-01T08:00:00Z',
    notes: 'Primary executive administrator for Brothers Furniture.',
    password: 'bf@superadmin',
  },
  {
    id: 'admin-karthi-zithimi',
    email: 'karthi@zithimi.com',
    name: 'Karthikeyan',
    role: 'super_admin',
    status: 'active',
    phone: '9043522612',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=160&q=80',
    lastLoginAt: new Date().toISOString(),
    createdAt: '2026-01-01T08:00:00Z',
    notes: 'Super Administrator.',
    password: 'karthi123@zithtech',
  },
]

// Helper to get local admins
function getLocalAdmins(): (AdminUser & { password: string })[] {
  let list: (AdminUser & { password: string })[] = []
  try {
    const raw = localStorage.getItem(ADMINS_STORAGE_KEY)
    if (raw) {
      list = JSON.parse(raw)
    }
  } catch {
    // fallback
  }

  // Purge deprecated demo accounts
  const deprecatedEmails = [
    'admin@brothersfurniture.co.in',
    'karthi@zithmi.com',
    'inventory@brothersfurniture.co.in',
    'sales@brothersfurniture.co.in',
    'anita.patel@brothersfurniture.co.in',
  ]
  list = list.filter((a) => !deprecatedEmails.includes(a.email.toLowerCase()))

  // Ensure mandatory default admin exists
  for (const def of DEFAULT_ADMINS) {
    const idx = list.findIndex((a) => a.email.toLowerCase() === def.email.toLowerCase())
    if (idx === -1) {
      list.unshift(def)
    } else {
      list[idx] = {
        ...list[idx],
        password: def.password,
        role: def.role,
        status: def.status,
      }
    }
  }

  localStorage.setItem(ADMINS_STORAGE_KEY, JSON.stringify(list))
  return list
}

function saveLocalAdmins(admins: (AdminUser & { password: string })[]) {
  localStorage.setItem(ADMINS_STORAGE_KEY, JSON.stringify(admins))
}

export function getLocalAuditLogs(): AuditLog[] {
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // fallback
  }
  const initialLogs: AuditLog[] = [
    {
      id: 'log-1',
      adminEmail: 'admin@brothersfurniture.co.in',
      action: 'SYSTEM_BOOTSTRAP',
      details: 'Super administrator initialized security policy and team matrix.',
      timestamp: '2026-10-20T10:00:00Z',
    },
    {
      id: 'log-2',
      adminEmail: 'anita.patel@brothersfurniture.co.in',
      action: 'ACCESS_REQUESTED',
      details: 'New user registered and submitted pending access application.',
      timestamp: '2026-10-22T08:00:00Z',
    },
  ]
  localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(initialLogs))
  return initialLogs
}

export function recordAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>) {
  const logs = getLocalAuditLogs()
  const newLog: AuditLog = {
    ...log,
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
  }
  localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify([newLog, ...logs].slice(0, 100)))
}

function generateMockToken(user: AdminUser): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = btoa(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 3600, // 24 hours
    })
  )
  const signature = btoa(`bf_sig_${user.id}_${Date.now()}`)
  return `${header}.${payload}.${signature}`
}

export const authApi = {
  // Login
  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const emailNorm = credentials.email.trim().toLowerCase()

    // 1. Attempt backend API first
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      })
      if (res.ok) {
        const data = await res.json()
        recordAuditLog({
          adminEmail: data.user.email,
          action: 'ADMIN_LOGIN',
          details: `Logged in via backend API from ${navigator.userAgent.slice(0, 50)}`,
        })
        return data
      }
    } catch {
      // Backend auth endpoint offline / not deployed yet; proceed to robust local simulation
    }

    // 2. Local resilient fallback
    const admins = getLocalAdmins()
    const target = admins.find((a) => a.email.toLowerCase() === emailNorm)

    if (!target) {
      throw new Error('No administrator account found with this email address.')
    }

    if (target.password !== credentials.password) {
      throw new Error('Invalid password. Please double-check your credentials.')
    }

    if (target.status === 'suspended') {
      throw new Error('This administrator account has been suspended by a Super Admin. Please contact executive management.')
    }

    if (target.status === 'pending_approval') {
      throw new Error('Your registration is pending approval by a Super Admin. You will be notified once activated.')
    }

    // Update last login
    const updatedAdmins = admins.map((a) =>
      a.id === target.id ? { ...a, lastLoginAt: new Date().toISOString() } : a
    )
    saveLocalAdmins(updatedAdmins)

    const cleanUser: AdminUser = {
      id: target.id,
      email: target.email,
      name: target.name,
      role: target.role,
      status: target.status,
      phone: target.phone,
      avatarUrl: target.avatarUrl,
      lastLoginAt: new Date().toISOString(),
      createdAt: target.createdAt,
      notes: target.notes,
    }

    const token = generateMockToken(cleanUser)
    const session: AuthSession = {
      token,
      user: cleanUser,
      expiresAt: Date.now() + 24 * 3600 * 1000,
    }

    recordAuditLog({
      adminEmail: cleanUser.email,
      action: 'ADMIN_LOGIN',
      details: `Successful sign-in. Role: ${cleanUser.role}`,
    })

    return session
  },

  // Signup / Request Access
  async register(data: SignUpData): Promise<{ user: AdminUser; isPending: boolean; message: string }> {
    const emailNorm = data.email.trim().toLowerCase()

    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        return await res.json()
      }
    } catch {
      // Backend fallback
    }

    const admins = getLocalAdmins()
    if (admins.some((a) => a.email.toLowerCase() === emailNorm)) {
      throw new Error('An account with this email address already exists.')
    }

    // Auto-approve if master passcode matches or if it's the very first user
    const MASTER_PASSCODE = 'BF-ADMIN-2026'
    const isFirstUser = admins.length === 0
    const isInstantApproved = isFirstUser || data.inviteCode?.trim().toUpperCase() === MASTER_PASSCODE

    const newAdmin: AdminUser & { password: string } = {
      id: `admin-${Date.now()}`,
      email: emailNorm,
      name: data.name.trim(),
      role: isFirstUser ? 'super_admin' : data.role || 'viewer',
      status: isInstantApproved ? 'active' : 'pending_approval',
      phone: data.phone,
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name)}`,
      createdAt: new Date().toISOString(),
      notes: isInstantApproved ? 'Activated via Master Passcode' : 'Self-registered; awaiting Super Admin review',
      password: data.password,
    }

    saveLocalAdmins([...admins, newAdmin])

    recordAuditLog({
      adminEmail: newAdmin.email,
      action: isInstantApproved ? 'ADMIN_REGISTERED_ACTIVE' : 'ACCESS_REQUEST_SUBMITTED',
      details: isInstantApproved
        ? 'Account instantly activated with Master Passcode'
        : 'Access application submitted with status: pending_approval',
    })

    return {
      user: {
        id: newAdmin.id,
        email: newAdmin.email,
        name: newAdmin.name,
        role: newAdmin.role,
        status: newAdmin.status,
        phone: newAdmin.phone,
        avatarUrl: newAdmin.avatarUrl,
        createdAt: newAdmin.createdAt,
        notes: newAdmin.notes,
      },
      isPending: !isInstantApproved,
      message: isInstantApproved
        ? 'Account successfully created and activated! You can now log in.'
        : 'Your access request has been submitted to executive administrators for approval.',
    }
  },

  // Logout
  async logout(userEmail?: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    } catch {
      // Ignore network errors on logout
    }

    if (userEmail) {
      recordAuditLog({
        adminEmail: userEmail,
        action: 'ADMIN_LOGOUT',
        details: 'Active admin session terminated cleanly.',
      })
    }
  },

  // Get Admin Team Members
  async getAdmins(): Promise<AdminUser[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/admins`)
      if (res.ok) {
        return await res.json()
      }
    } catch {
      // Backend fallback
    }

    const admins = getLocalAdmins()
    return admins.map(({ password: _, ...rest }) => rest)
  },

  // Invite / Create Admin directly
  async inviteAdmin(data: AdminInviteData, creatorEmail: string): Promise<AdminUser> {
    const emailNorm = data.email.trim().toLowerCase()

    try {
      const res = await fetch(`${API_BASE_URL}/auth/admins/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        return await res.json()
      }
    } catch {
      // Fallback
    }

    const admins = getLocalAdmins()
    if (admins.some((a) => a.email.toLowerCase() === emailNorm)) {
      throw new Error('An administrator with this email already exists.')
    }

    const tempPassword = data.tempPassword || 'Brothers@2026'

    const newAdmin: AdminUser & { password: string } = {
      id: `admin-${Date.now()}`,
      email: emailNorm,
      name: data.name.trim(),
      role: data.role,
      status: 'active',
      phone: data.phone,
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name)}`,
      createdAt: new Date().toISOString(),
      notes: data.notes || `Invited by ${creatorEmail}`,
      password: tempPassword,
    }

    saveLocalAdmins([...admins, newAdmin])

    recordAuditLog({
      adminEmail: creatorEmail,
      action: 'ADMIN_INVITED',
      details: `Created new admin ${newAdmin.name} (${newAdmin.email}) with role: ${newAdmin.role}`,
    })

    const { password: _, ...clean } = newAdmin
    return clean
  },

  // Update Status (approve, suspend, activate)
  async updateAdminStatus(id: string, status: AdminStatus, operatorEmail: string): Promise<AdminUser> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/admins/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        return await res.json()
      }
    } catch {
      // Fallback
    }

    const admins = getLocalAdmins()
    const target = admins.find((a) => a.id === id)
    if (!target) throw new Error('Admin user not found')

    target.status = status
    saveLocalAdmins(admins)

    recordAuditLog({
      adminEmail: operatorEmail,
      action: 'STATUS_CHANGED',
      details: `Changed status of ${target.name} to ${status.toUpperCase()}`,
    })

    const { password: _, ...clean } = target
    return clean
  },

  // Update Role
  async updateAdminRole(id: string, role: AdminRole, operatorEmail: string): Promise<AdminUser> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/admins/${id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      if (res.ok) {
        return await res.json()
      }
    } catch {
      // Fallback
    }

    const admins = getLocalAdmins()
    const target = admins.find((a) => a.id === id)
    if (!target) throw new Error('Admin user not found')

    // Safety: ensure at least one active super_admin remains
    if (target.role === 'super_admin' && role !== 'super_admin') {
      const superAdmins = admins.filter((a) => a.role === 'super_admin' && a.status === 'active')
      if (superAdmins.length <= 1) {
        throw new Error('Cannot change role: the system must have at least one active Super Administrator.')
      }
    }

    target.role = role
    saveLocalAdmins(admins)

    recordAuditLog({
      adminEmail: operatorEmail,
      action: 'ROLE_CHANGED',
      details: `Updated role of ${target.name} to ${role}`,
    })

    const { password: _, ...clean } = target
    return clean
  },

  // Delete Admin
  async deleteAdmin(id: string, operatorEmail: string, currentUserId: string): Promise<void> {
    if (id === currentUserId) {
      throw new Error('You cannot delete your own active administrator account.')
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/admins/${id}`, { method: 'DELETE' })
      if (res.ok) return
    } catch {
      // Fallback
    }

    const admins = getLocalAdmins()
    const target = admins.find((a) => a.id === id)
    if (!target) throw new Error('Admin user not found')

    if (target.role === 'super_admin') {
      const superAdmins = admins.filter((a) => a.role === 'super_admin')
      if (superAdmins.length <= 1) {
        throw new Error('Cannot delete the last remaining Super Administrator account.')
      }
    }

    const filtered = admins.filter((a) => a.id !== id)
    saveLocalAdmins(filtered)

    recordAuditLog({
      adminEmail: operatorEmail,
      action: 'ADMIN_DELETED',
      details: `Removed admin user ${target.name} (${target.email})`,
    })
  },

  // Update Profile & Photo
  async updateProfile(
    data: {
      name?: string
      phone?: string
      avatarUrl?: string
      currentPassword?: string
      newPassword?: string
    },
    token?: string,
    currentUserId?: string
  ): Promise<AdminUser> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        return await res.json()
      }
      const err = await res.json().catch(() => ({}))
      if (err.error) throw new Error(err.error)
    } catch (e: any) {
      if (e.message && !e.message.includes('Failed to fetch') && !e.message.includes('NetworkError')) {
        throw e
      }
      // Fallback to local storage if offline
    }

    const admins = getLocalAdmins()
    const target = admins.find((a) => a.id === currentUserId)
    if (!target) throw new Error('User not found')

    if (data.newPassword) {
      if (!data.currentPassword) {
        throw new Error('Current password is required to change password.')
      }
      if (target.password !== data.currentPassword) {
        throw new Error('Incorrect current password.')
      }
      target.password = data.newPassword
    }

    if (data.name) target.name = data.name.trim()
    if (data.phone !== undefined) target.phone = data.phone.trim()
    if (data.avatarUrl !== undefined) target.avatarUrl = data.avatarUrl

    saveLocalAdmins(admins)

    recordAuditLog({
      adminEmail: target.email,
      action: 'PROFILE_UPDATED',
      details: `Updated personal profile & avatar for ${target.name}`,
    })

    const { password: _, ...clean } = target
    return clean
  },
}
