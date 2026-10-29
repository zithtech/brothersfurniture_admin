import React, { useState } from 'react'
import {
  CheckCircle,
  Clock,
  History,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  UserX,
} from 'lucide-react'
import { Modal } from '../components/common/Modal'
import { useAdmin } from '../context/AdminContext'
import { useAuth } from '../context/AuthContext'
import type { AdminRole, AdminStatus, AdminUser } from '../types/auth'

export const AdminManagementView: React.FC = () => {
  const {
    user: currentUser,
    admins,
    inviteAdmin,
    updateAdminStatus,
    updateAdminRole,
    deleteAdmin,
    auditLogs,
    hasRole,
  } = useAuth()
  const { addToast, confirm } = useAdmin()

  const isSuperAdmin = hasRole(['super_admin'])

  const [activeTab, setActiveTab] = useState<'matrix' | 'audit'>('matrix')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Modals
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitePhone, setInvitePhone] = useState('')
  const [inviteRole, setInviteRole] = useState<AdminRole>('viewer')
  const [inviteTempPass, setInviteTempPass] = useState('Brothers@2026')
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false)

  // Role Edit Modal
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null)
  const [selectedNewRole, setSelectedNewRole] = useState<AdminRole>('viewer')

  // Metrics
  const totalAdmins = admins.length
  const activeCount = admins.filter((a) => a.status === 'active').length
  const pendingCount = admins.filter((a) => a.status === 'pending_approval').length
  const superCount = admins.filter((a) => a.role === 'super_admin').length

  // Filtered admins
  const filteredAdmins = admins.filter((admin) => {
    const matchesSearch =
      admin.name.toLowerCase().includes(search.toLowerCase()) ||
      admin.email.toLowerCase().includes(search.toLowerCase())

    const matchesRole = roleFilter === 'all' || admin.role === roleFilter
    const matchesStatus = statusFilter === 'all' || admin.status === statusFilter

    return matchesSearch && matchesRole && matchesStatus
  })

  // Handlers
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteName.trim() || !inviteEmail.trim()) {
      addToast('error', 'Incomplete Form', 'Please enter admin full name and email address.')
      return
    }

    setIsSubmittingInvite(true)
    try {
      await inviteAdmin({
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        phone: invitePhone.trim(),
        role: inviteRole,
        tempPassword: inviteTempPass,
      })
      addToast('success', 'Admin Invited', `Successfully added ${inviteName} as ${inviteRole.replace('_', ' ')}.`)
      setIsInviteOpen(false)
      setInviteName('')
      setInviteEmail('')
      setInvitePhone('')
      setInviteRole('viewer')
      setInviteTempPass('Brothers@2026')
    } catch (err: any) {
      addToast('error', 'Invitation Failed', err.message || 'Could not create administrator.')
    } finally {
      setIsSubmittingInvite(false)
    }
  }

  const handleStatusChange = async (admin: AdminUser, newStatus: AdminStatus) => {
    if (!isSuperAdmin) {
      addToast('warning', 'Restricted Action', 'Only Super Administrators can modify account status.')
      return
    }

    try {
      await updateAdminStatus(admin.id, newStatus)
      const actionName =
        newStatus === 'active'
          ? 'Activated & Approved'
          : newStatus === 'suspended'
          ? 'Suspended'
          : 'Status Updated'
      addToast('success', 'Status Updated', `${admin.name} is now ${actionName}.`)
    } catch (err: any) {
      addToast('error', 'Update Failed', err.message || 'Could not update status.')
    }
  }

  const handleRoleSave = async () => {
    if (!editingAdmin) return
    try {
      await updateAdminRole(editingAdmin.id, selectedNewRole)
      addToast('success', 'Role Updated', `Changed role of ${editingAdmin.name} to ${selectedNewRole.replace('_', ' ')}.`)
      setEditingAdmin(null)
    } catch (err: any) {
      addToast('error', 'Update Failed', err.message || 'Could not update role.')
    }
  }

  const handleDelete = async (admin: AdminUser) => {
    if (!isSuperAdmin) {
      addToast('warning', 'Restricted Action', 'Only Super Administrators can remove accounts.')
      return
    }

    const ok = await confirm({
      title: `Permanently Delete Administrator "${admin.name}"?`,
      message: `Are you sure you want to remove ${admin.name} (${admin.email})? This user will immediately lose all administrative portal access.`,
      confirmText: 'Delete Administrator',
      cancelText: 'Keep Account',
      variant: 'danger',
      icon: 'user-minus',
      badge: `Role: ${admin.role.toUpperCase()}`,
    })

    if (ok) {
      try {
        await deleteAdmin(admin.id)
        addToast('warning', 'Admin Removed', `Removed ${admin.name} from admin portal.`)
      } catch (err: any) {
        addToast('error', 'Deletion Prevented', err.message || 'Could not remove administrator.')
      }
    }
  }

  return (
    <div className="space-y-5 animate-fade-in pb-12 select-none">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Admin Team & Access Governance</h1>
            <span className="px-2.5 py-0.5 bg-orange-100 text-orange-800 text-[11px] font-bold rounded-full uppercase tracking-wider">
              RBAC v2.4
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage authenticated administrators, approve employee access requests, and enforce role privileges.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Selector */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-semibold">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'matrix' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Team Matrix</span>
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'audit' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit Log ({auditLogs.length})</span>
            </button>
          </div>

          {/* Add Admin Button */}
          {isSuperAdmin && (
            <button
              onClick={() => setIsInviteOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-linear-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 rounded-xl shadow-xs transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Invite Admin</span>
            </button>
          )}
        </div>
      </div>

      {/* Non-SuperAdmin notice */}
      {!isSuperAdmin && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-xs text-amber-800">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            You are signed in as an <strong>{currentUser?.role.replace('_', ' ')}</strong>. You have read-only visibility into team administration. Only <strong>Super Administrators</strong> can approve accounts or change roles.
          </span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Administrators</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalAdmins}</p>
          </div>
          <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Staff</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{activeCount}</p>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className={`p-4 rounded-xl border shadow-xs flex items-center justify-between ${
          pendingCount > 0 ? 'bg-amber-50/60 border-amber-300' : 'bg-white border-slate-200'
        }`}>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Pending Approvals</p>
            <p className={`text-2xl font-black mt-1 ${pendingCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {pendingCount}
            </p>
          </div>
          <div className={`p-2.5 rounded-xl ${pendingCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Super Admins</p>
            <p className="text-2xl font-black text-purple-600 mt-1">{superCount}</p>
          </div>
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {activeTab === 'matrix' ? (
        /* Team Matrix Table Tab */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Table Search & Filters bar */}
          <div className="p-3.5 sm:p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search admins by name, email..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-hidden cursor-pointer"
              >
                <option value="all">All Roles</option>
                <option value="super_admin">Super Admin</option>
                <option value="inventory_manager">Inventory Manager</option>
                <option value="sales_manager">Sales Manager</option>
                <option value="viewer">Viewer</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-hidden cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Administrator</th>
                  <th className="py-3 px-4">Role & Scope</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Last Activity</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAdmins.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                      No administrator accounts match the current filter.
                    </td>
                  </tr>
                ) : (
                  filteredAdmins.map((admin) => {
                    const isSelf = currentUser?.id === admin.id

                    return (
                      <tr key={admin.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Administrator Name & Avatar */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={admin.avatarUrl || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=160&q=80'}
                              alt={admin.name}
                              className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 flex items-center gap-1.5 truncate">
                                {admin.name}
                                {isSelf && (
                                  <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 text-[10px] font-semibold rounded">
                                    You
                                  </span>
                                )}
                              </p>
                              <p className="text-[11px] text-slate-500 truncate">{admin.email}</p>
                              {admin.phone && (
                                <p className="text-[10px] text-slate-400">{admin.phone}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {admin.role === 'super_admin' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200/80 rounded-lg font-bold">
                              <Shield className="w-3 h-3 text-purple-600" />
                              Super Admin
                            </span>
                          )}
                          {admin.role === 'inventory_manager' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200/80 rounded-lg font-bold">
                              Inventory Manager
                            </span>
                          )}
                          {admin.role === 'sales_manager' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-lg font-bold">
                              Sales CRM Lead
                            </span>
                          )}
                          {admin.role === 'viewer' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-semibold">
                              Staff Viewer
                            </span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {admin.status === 'active' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-semibold text-[11px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          )}
                          {admin.status === 'pending_approval' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-semibold text-[11px]">
                              <Clock className="w-3 h-3 text-amber-500" />
                              Pending Approval
                            </span>
                          )}
                          {admin.status === 'suspended' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full font-semibold text-[11px]">
                              <UserX className="w-3 h-3 text-rose-500" />
                              Suspended
                            </span>
                          )}
                        </td>

                        {/* Last Activity */}
                        <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                          {admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleString() : 'Never logged in'}
                        </td>

                        {/* Joined Date */}
                        <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                          {new Date(admin.createdAt).toLocaleDateString()}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Fast Approval Action */}
                            {admin.status === 'pending_approval' && isSuperAdmin && (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(admin, 'active')}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition shadow-xs cursor-pointer flex items-center gap-1"
                                title="Approve & Activate Account"
                              >
                                <CheckCircle className="w-3 h-3" />
                                <span>Approve</span>
                              </button>
                            )}

                            {/* Suspend / Reactivate */}
                            {admin.status === 'active' && isSuperAdmin && !isSelf && (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(admin, 'suspended')}
                                className="px-2 py-1 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition cursor-pointer font-medium"
                                title="Suspend Account"
                              >
                                Suspend
                              </button>
                            )}

                            {admin.status === 'suspended' && isSuperAdmin && (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(admin, 'active')}
                                className="px-2 py-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer font-medium"
                                title="Reactivate Account"
                              >
                                Reactivate
                              </button>
                            )}

                            {/* Edit Role */}
                            {isSuperAdmin && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingAdmin(admin)
                                  setSelectedNewRole(admin.role)
                                }}
                                className="px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer font-medium"
                                title="Edit Role & Permissions"
                              >
                                Role
                              </button>
                            )}

                            {/* Delete Account */}
                            {isSuperAdmin && !isSelf && (
                              <button
                                type="button"
                                onClick={() => handleDelete(admin)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Delete Administrator"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Audit Log Tab */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900">Security & Administrative Audit Trail</h3>
              <p className="text-xs text-slate-500">Immutable chronological record of logins and role modifications</p>
            </div>
            <span className="text-xs font-mono bg-slate-200 px-2 py-0.5 rounded text-slate-700">
              Retention: 90 Days
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {auditLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-medium">No audit events recorded yet.</div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-slate-50/50 transition-colors flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-800 text-[10px] font-mono font-bold rounded">
                        {log.action}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{log.adminEmail}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-normal">{log.details}</p>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono whitespace-nowrap shrink-0">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Invite Admin Modal */}
      <Modal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        title="Invite New Administrator"
        subtitle="Provision employee access with designated operational scope"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleInviteSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Legal Full Name *</label>
            <input
              type="text"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="e.g. Ramesh Varma"
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Company Work Email *</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="ramesh@brothersfurniture.co.in"
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Contact</label>
              <input
                type="tel"
                value={invitePhone}
                onChange={(e) => setInvitePhone(e.target.value)}
                placeholder="+91 98400..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Role *</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as AdminRole)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden font-medium cursor-pointer"
              >
                <option value="viewer">Staff Viewer</option>
                <option value="inventory_manager">Inventory Manager</option>
                <option value="sales_manager">Sales CRM Lead</option>
                <option value="super_admin">Super Administrator</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Temporary Initial Password</label>
            <input
              type="text"
              value={inviteTempPass}
              onChange={(e) => setInviteTempPass(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden"
            />
            <p className="text-[10px] text-slate-400 mt-1">Employee will be required to change password on first login.</p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsInviteOpen(false)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingInvite}
              className="px-4 py-2 text-xs font-bold text-white bg-linear-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 rounded-xl shadow-xs cursor-pointer disabled:opacity-60"
            >
              {isSubmittingInvite ? 'Inviting...' : 'Create Administrator'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Role Change Modal */}
      <Modal
        isOpen={!!editingAdmin}
        onClose={() => setEditingAdmin(null)}
        title="Modify Administrator Role"
        subtitle={editingAdmin ? `Update operational permissions for ${editingAdmin.name}` : ''}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Select Target Role</label>
            <div className="space-y-2">
              {[
                {
                  id: 'super_admin',
                  name: 'Super Administrator',
                  desc: 'Full access to all systems, settings, data exports, and team management.',
                },
                {
                  id: 'inventory_manager',
                  name: 'Inventory Manager',
                  desc: 'Manage chair models, catalog products, categories, and customer reviews.',
                },
                {
                  id: 'sales_manager',
                  name: 'Sales Manager',
                  desc: 'Manage orders, commercial quotations, inquiries, and corporate clients.',
                },
                {
                  id: 'viewer',
                  name: 'Staff Viewer',
                  desc: 'Read-only access across dashboard analytics and records.',
                },
              ].map((roleOption) => (
                <label
                  key={roleOption.id}
                  className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                    selectedNewRole === roleOption.id
                      ? 'bg-orange-50/70 border-orange-300 ring-1 ring-orange-400/30'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="role-select"
                    checked={selectedNewRole === roleOption.id}
                    onChange={() => setSelectedNewRole(roleOption.id as AdminRole)}
                    className="mt-1 text-orange-600 focus:ring-orange-500 cursor-pointer accent-orange-600"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900">{roleOption.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{roleOption.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditingAdmin(null)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRoleSave}
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs cursor-pointer"
            >
              Confirm Role Change
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
