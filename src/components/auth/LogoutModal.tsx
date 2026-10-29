import React, { useState } from 'react'
import { LogOut, ShieldAlert } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Modal } from '../common/Modal'

interface LogoutModalProps {
  isOpen: boolean
  onClose: () => void
}

export const LogoutModal: React.FC<LogoutModalProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      onClose()
    } finally {
      setIsLoggingOut(false)
    }
  }

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Sign Out"
      subtitle="Terminate your active administrator session"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* User preview card */}
        {user && (
          <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-xl flex items-center gap-3">
            <img
              src={user.avatarUrl || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=160&q=80'}
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-200"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
              <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
              <span className="inline-block mt-0.5 px-2 py-0.5 bg-orange-100 text-orange-800 text-[10px] font-semibold rounded-full uppercase tracking-wider">
                {user.role.replace('_', ' ')}
              </span>
            </div>
          </div>
        )}

        {/* Informative notice */}
        <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Logging out invalidates your access tokens, closes cross-tab synchronization, and purges all cached operational state from this machine.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoggingOut}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            Stay Signed In
          </button>

          <button
            type="button"
            onClick={handleConfirmLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-60"
          >
            {isLoggingOut ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Terminating...</span>
              </>
            ) : (
              <>
                <LogOut className="w-3.5 h-3.5" />
                <span>Confirm Sign Out</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}
