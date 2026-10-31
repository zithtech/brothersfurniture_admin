import React, { useRef, useState } from 'react'
import {
  AlertCircle,
  Camera,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Link,
  Lock,
  Mail,
  Phone,
  Shield,
  Trash2,
  Upload,
  User,
} from 'lucide-react'
import { Modal } from '../common/Modal'
import { useAdmin } from '../../context/AdminContext'
import { useAuth } from '../../context/AuthContext'

interface ProfileEditModalProps {
  isOpen: boolean
  onClose: () => void
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile } = useAuth()
  const { addToast } = useAdmin()

  const [name, setName] = useState(user?.name || '')
  const [nameError, setNameError] = useState<string | null>(null)
  const [phone, setPhone] = useState(user?.phone || '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [customUrl, setCustomUrl] = useState('')

  // Password fields
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateName = (value: string): string | null => {
    const trimmed = value.trim()
    if (!trimmed) return 'Full legal name cannot be empty.'

    if (/\d/.test(trimmed)) {
      return 'Full legal name cannot contain numbers. Only alphabetic characters are allowed.'
    }

    if (!/^[a-zA-Z\s.'-]+$/.test(trimmed)) {
      return 'Full legal name can only contain letters, spaces, hyphens, and apostrophes.'
    }

    if (trimmed.length < 2) {
      return 'Full legal name must be at least 2 characters.'
    }

    return null
  }

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      [
        'Backspace',
        'Delete',
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'Tab',
        'Enter',
        'Home',
        'End',
      ].includes(e.key) ||
      e.ctrlKey ||
      e.metaKey
    ) {
      return
    }

    if (/\d/.test(e.key)) {
      e.preventDefault()
      setNameError('Numbers are not allowed in full legal name. Please enter alphabetic characters only.')
      return
    }
  }

  const handleNamePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text')
    if (/\d/.test(pasted)) {
      e.preventDefault()
      const sanitized = pasted.replace(/\d/g, '')
      const input = e.currentTarget
      const start = input.selectionStart || 0
      const end = input.selectionEnd || 0
      const newName = name.slice(0, start) + sanitized + name.slice(end)
      setName(newName)
      setNameError('Numbers are not allowed in full legal name. Only alphabetic characters are accepted.')
    }
  }

  const handleNameChange = (val: string) => {
    const hasDigits = /\d/.test(val)
    const sanitized = val.replace(/\d/g, '')
    setName(sanitized)

    if (hasDigits) {
      setNameError('Full legal name cannot contain numbers. Only alphabetic characters are allowed.')
      return
    }

    if (sanitized.trim()) {
      if (!/^[a-zA-Z\s.'-]+$/.test(sanitized)) {
        setNameError('Full legal name can only contain letters, spaces, hyphens, and apostrophes.')
        return
      }
      setNameError(null)
      if (errorMsg?.toLowerCase().includes('name')) {
        setErrorMsg(null)
      }
    } else {
      setNameError(null)
    }
  }

  // Reset state when modal opens
  React.useEffect(() => {
    if (user && isOpen) {
      setName(user.name || '')
      setNameError(null)
      setPhone(user.phone || '')
      setAvatarUrl(user.avatarUrl || '')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setIsChangingPassword(false)
      setErrorMsg(null)
      setShowUrlInput(false)
    }
  }, [user, isOpen])

  // Handle local image file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, WEBP).')
      return
    }

    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size should be less than 5MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result)
        setErrorMsg(null)
      }
    }
    reader.readAsDataURL(file)
  }

  // Handle custom URL submit
  const handleApplyUrl = () => {
    if (!customUrl.trim()) return
    setAvatarUrl(customUrl.trim())
    setShowUrlInput(false)
    setCustomUrl('')
  }

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!name.trim()) {
      setErrorMsg('Full legal name cannot be empty.')
      setNameError('Full legal name cannot be empty.')
      return
    }

    const nError = validateName(name)
    if (nError) {
      setErrorMsg(nError)
      setNameError(nError)
      return
    }

    if (phone.trim()) {
      if (/[a-zA-Z]/.test(phone.trim())) {
        setErrorMsg('Alphabetic characters are not allowed in phone number.')
        return
      }
      const phoneDigits = phone.trim().replace(/\D/g, '')
      if (phoneDigits.length > 15) {
        setErrorMsg('Phone number cannot exceed the allowed length of 15 digits.')
        return
      }
      if (phoneDigits.length < 10) {
        setErrorMsg('Phone number must be at least 10 digits.')
        return
      }
    }

    if (isChangingPassword) {
      if (!currentPassword) {
        setErrorMsg('Please enter your current password.')
        return
      }
      if (newPassword.length < 6) {
        setErrorMsg('New password must be at least 6 characters long.')
        return
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('New passwords do not match.')
        return
      }
    }

    setIsSubmitting(true)
    try {
      await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        avatarUrl,
        ...(isChangingPassword ? { currentPassword, newPassword } : {}),
      })

      addToast('success', 'Profile Updated', 'Your profile details and photo have been saved.')
      onClose()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Administrator Profile"
      subtitle="Update your profile photo, contact details, and account security"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5 select-none">
        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="font-medium">{errorMsg}</p>
          </div>
        )}

        {/* Profile Photo Upload Section */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
          {/* Avatar with hover camera trigger */}
          <div className="relative group shrink-0">
            <img
              src={
                avatarUrl ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'Admin')}`
              }
              alt={name}
              className="w-20 h-20 rounded-full object-cover ring-4 ring-white shadow-md border border-slate-200"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-slate-900/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer"
              title="Click to upload new photo"
            >
              <Camera className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-semibold">Change</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Photo Actions */}
          <div className="flex-1 text-center sm:text-left min-w-0">
            <p className="text-xs font-bold text-slate-900">Profile Photo</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              PNG, JPG, or WEBP up to 5MB. Visible across administrative logs.
            </p>

            <div className="mt-2.5 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>Upload Photo</span>
              </button>

              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 rounded-xl text-xs font-medium shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
                title="Paste Image URL"
              >
                <Link className="w-3.5 h-3.5 text-slate-400" />
                <span>URL</span>
              </button>

              {avatarUrl && (
                <button
                  type="button"
                  onClick={() =>
                    setAvatarUrl(
                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'Admin')}`
                    )
                  }
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                  title="Reset to Initials Avatar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Custom URL Input Bar */}
            {showUrlInput && (
              <div className="mt-2.5 flex items-center gap-1.5 animate-fade-in">
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="flex-1 px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Personal Details Fields */}
        <div className="space-y-3.5">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Legal Name *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                onKeyDown={handleNameKeyDown}
                onPaste={handleNamePaste}
                onBlur={() => {
                  if (name.trim()) setNameError(validateName(name))
                }}
                placeholder="e.g. Karthikeyan"
                required
                aria-invalid={!!nameError}
                className={`w-full pl-9 pr-3 py-2 bg-slate-50 border rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 outline-hidden transition-colors ${
                  nameError
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20 text-rose-900'
                    : 'border-slate-200 focus:border-orange-500 focus:ring-orange-500/20 text-slate-900'
                }`}
              />
            </div>
            {nameError && (
              <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{nameError}</span>
              </p>
            )}
          </div>

          {/* Email (Read-Only) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">Work Email Address</label>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Verified & Locked
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full pl-9 pr-3 py-2 bg-slate-100/80 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Mobile Phone & Role Scope */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Phone
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => {
                    const sanitized = e.target.value.replace(/[a-zA-Z]/g, '').replace(/[^\d+\s\-()]/g, '')
                    setPhone(sanitized)
                    if (/[a-zA-Z]/.test(e.target.value)) {
                      setErrorMsg('Alphabetic characters are not allowed in phone number.')
                    } else if (errorMsg?.includes('Alphabetic')) {
                      setErrorMsg(null)
                    }
                  }}
                  onKeyDown={(e) => {
                    if (
                      ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key) ||
                      e.ctrlKey ||
                      e.metaKey
                    ) {
                      return
                    }
                    if (/[a-zA-Z]/.test(e.key) || !/[\d+\s\-()]/.test(e.key)) {
                      e.preventDefault()
                      setErrorMsg('Alphabetic characters are not allowed. Please enter numeric digits only.')
                    }
                  }}
                  placeholder="9790740027"
                  maxLength={25}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Operational Role
              </label>
              <div className="px-3 py-2 bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-bold text-purple-700 flex items-center gap-1.5 h-[38px]">
                <Shield className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span className="uppercase tracking-wider truncate">
                  {user?.role ? user.role.replace('_', ' ') : 'SUPER ADMIN'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Password Change Accordion */}
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setIsChangingPassword(!isChangingPassword)}
            className="flex items-center justify-between w-full py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-slate-500" />
              <span>Change Security Password</span>
            </span>
            <span className="text-[11px] text-orange-600 font-bold">
              {isChangingPassword ? 'Cancel' : 'Change Password'}
            </span>
          </button>

          {isChangingPassword && (
            <div className="mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-fade-in">
              {/* Current Password */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Current Password *
                </label>
                <div className="relative">
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-orange-500 outline-hidden"
                  />
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  New Password (Minimum 6 characters) *
                </label>
                <div className="relative">
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-orange-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-orange-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPasswords ? 'Hide passwords' : 'Show passwords'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-linear-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}
