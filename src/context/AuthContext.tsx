import React, { createContext, useContext, useEffect, useState } from 'react'
import { authApi, getLocalAuditLogs } from '../services/authApi'
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

const SESSION_STORAGE_KEY = 'brothersfurniture_admin_session'

interface AuthContextType {
  user: AdminUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  authView: 'login' | 'register'
  setAuthView: (view: 'login' | 'register') => void
  login: (credentials: LoginCredentials) => Promise<void>
  signup: (data: SignUpData) => Promise<{ isPending: boolean; message: string }>
  logout: () => Promise<void>
  admins: AdminUser[]
  refreshAdmins: () => Promise<void>
  inviteAdmin: (data: AdminInviteData) => Promise<AdminUser>
  updateAdminStatus: (id: string, status: AdminStatus) => Promise<AdminUser>
  updateAdminRole: (id: string, role: AdminRole) => Promise<AdminUser>
  deleteAdmin: (id: string) => Promise<void>
  auditLogs: AuditLog[]
  refreshAuditLogs: () => void
  updateProfile: (data: {
    name?: string
    phone?: string
    avatarUrl?: string
    currentPassword?: string
    newPassword?: string
  }) => Promise<AdminUser>
  hasRole: (allowedRoles: AdminRole[]) => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [authView, setAuthView] = useState<'login' | 'register'>('login')
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])

  // Load session from storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY)
      if (stored) {
        const session: AuthSession = JSON.parse(stored)
        if (session.expiresAt && Date.now() < session.expiresAt) {
          setUser(session.user)
          setToken(session.token)
        } else {
          localStorage.removeItem(SESSION_STORAGE_KEY)
        }
      }
    } catch (e) {
      console.warn('Error reading stored admin session:', e)
      localStorage.removeItem(SESSION_STORAGE_KEY)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load admins and audit logs whenever authenticated
  const refreshAdmins = async () => {
    try {
      const list = await authApi.getAdmins()
      setAdmins(list)
    } catch (err) {
      console.warn('Could not load admins list:', err)
    }
  }

  const refreshAuditLogs = () => {
    setAuditLogs(getLocalAuditLogs())
  }

  useEffect(() => {
    if (user) {
      refreshAdmins()
      refreshAuditLogs()
    }
  }, [user])

  const logout = React.useCallback(async () => {
    setUser((prevUser) => {
      if (prevUser?.email) {
        authApi.logout(prevUser.email).catch(() => {})
      }
      return null
    })
    setToken(null)
    localStorage.removeItem(SESSION_STORAGE_KEY)
    setAuthView('login')
  }, [])

  // Cross-tab synchronization & unauthorized handler
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SESSION_STORAGE_KEY) {
        if (!e.newValue) {
          setUser(null)
          setToken(null)
        } else {
          try {
            const session: AuthSession = JSON.parse(e.newValue)
            setUser(session.user)
            setToken(session.token)
          } catch {
            // ignore
          }
        }
      }
    }

    const handleUnauthorized = () => {
      logout()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('bf:auth:unauthorized', handleUnauthorized)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('bf:auth:unauthorized', handleUnauthorized)
    }
  }, [logout])

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true)
    try {
      const session = await authApi.login(credentials)
      setUser(session.user)
      setToken(session.token)
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
      await refreshAdmins()
      refreshAuditLogs()
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (data: SignUpData) => {
    const result = await authApi.register(data)
    await refreshAdmins()
    refreshAuditLogs()
    return result
  }

  const inviteAdmin = async (data: AdminInviteData) => {
    if (!user) throw new Error('Unauthenticated')
    const newAdmin = await authApi.inviteAdmin(data, user.email)
    await refreshAdmins()
    refreshAuditLogs()
    return newAdmin
  }

  const updateAdminStatus = async (id: string, status: AdminStatus) => {
    if (!user) throw new Error('Unauthenticated')
    const updated = await authApi.updateAdminStatus(id, status, user.email)
    await refreshAdmins()
    refreshAuditLogs()
    return updated
  }

  const updateAdminRole = async (id: string, role: AdminRole) => {
    if (!user) throw new Error('Unauthenticated')
    const updated = await authApi.updateAdminRole(id, role, user.email)
    await refreshAdmins()
    refreshAuditLogs()
    return updated
  }

  const deleteAdmin = async (id: string) => {
    if (!user) throw new Error('Unauthenticated')
    await authApi.deleteAdmin(id, user.email, user.id)
    await refreshAdmins()
    refreshAuditLogs()
  }

  const updateProfile = async (data: {
    name?: string
    phone?: string
    avatarUrl?: string
    currentPassword?: string
    newPassword?: string
  }) => {
    if (!user) throw new Error('Unauthenticated')
    const updated = await authApi.updateProfile(data, token || undefined, user.id)
    setUser(updated)
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY)
      if (stored) {
        const session: AuthSession = JSON.parse(stored)
        session.user = updated
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
      }
    } catch {
      // ignore
    }
    await refreshAdmins()
    refreshAuditLogs()
    return updated
  }

  const hasRole = (allowedRoles: AdminRole[]) => {
    if (!user) return false
    return allowedRoles.includes(user.role)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        authView,
        setAuthView,
        login,
        signup,
        logout,
        admins,
        refreshAdmins,
        inviteAdmin,
        updateAdminStatus,
        updateAdminRole,
        deleteAdmin,
        auditLogs,
        refreshAuditLogs,
        updateProfile,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
