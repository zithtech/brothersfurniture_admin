import React, { useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  Phone,
  ShieldAlert,
  User,
} from 'lucide-react'
import logoImg from '../../assets/logo.png'
import { useAuth } from '../../context/AuthContext'
import type { AdminRole } from '../../types/auth'

export const RegisterView: React.FC = () => {
  const { signup, setAuthView } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<AdminRole>('viewer')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successInfo, setSuccessInfo] = useState<{ isPending: boolean; message: string } | null>(null)

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, text: '', color: 'bg-slate-200' }
    let score = 0
    if (pass.length >= 8) score += 1
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1
    if (/[0-9]/.test(pass)) score += 1
    if (/[^A-Za-z0-9]/.test(pass)) score += 1

    if (score <= 1) return { score: 1, text: 'Weak', color: 'bg-rose-500' }
    if (score === 2 || score === 3) return { score: 2, text: 'Moderate', color: 'bg-amber-500' }
    return { score: 3, text: 'Strong (Recommended)', color: 'bg-emerald-500' }
  }

  const strength = getPasswordStrength(password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!name.trim() || !email.trim() || !password) {
      setErrorMsg('Please complete all required fields.')
      return
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await signup({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role,
        password,
        inviteCode: inviteCode.trim(),
      })
      setSuccessInfo(res)
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-950 flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden select-none">
      {/* Decorative ambient glows */}
      <div className="absolute top-10 -left-40 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -right-40 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 px-4">
        <div className="inline-flex items-center justify-center p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 shadow-xl mb-3">
          <img
            src={logoImg}
            alt="Brothers Furniture"
            className="h-10 w-auto object-contain filter drop-shadow-md"
          />
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
          Staff Account Registration
        </h1>
        <p className="mt-1 text-xs text-slate-300">
          Brothers Furniture Corporate Back-Office Security
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg z-10 px-4">
        <div className="bg-white/95 backdrop-blur-xl py-7 px-6 sm:px-9 shadow-2xl rounded-2xl border border-white/20 sm:rounded-3xl">
          {successInfo ? (
            /* Success confirmation screen */
            <div className="text-center py-4 space-y-4 animate-fade-in">
              <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center bg-emerald-50 text-emerald-600 border border-emerald-200">
                {successInfo.isPending ? (
                  <Clock className="w-8 h-8 text-amber-600" />
                ) : (
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                )}
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {successInfo.isPending ? 'Access Request Submitted' : 'Registration Approved!'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  {successInfo.message}
                </p>
              </div>

              {successInfo.isPending && (
                <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl text-left text-xs text-amber-800 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                    Security Governance Policy:
                  </p>
                  <p className="text-amber-700 leading-normal">
                    To prevent unauthorized inventory or client data alteration, new accounts require active approval by a Super Administrator before login is enabled.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => setAuthView('login')}
                className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition cursor-pointer"
              >
                Return to Sign In
              </button>
            </div>
          ) : (
            /* Registration Form */
            <>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Request Admin Access</h2>
                  <p className="text-xs text-slate-500">Submit your employee credentials</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAuthView('login')}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
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
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Anand Chandran"
                      required
                      className="block w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden font-medium"
                    />
                  </div>
                </div>

                {/* Work Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Work Email *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="employee@brothersfurniture.co.in"
                      required
                      className="block w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden font-medium"
                    />
                  </div>
                </div>

                {/* Phone & Role Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Phone className="h-4 w-4" />
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98400..."
                        className="block w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Department / Role
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as AdminRole)}
                      className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden font-medium cursor-pointer"
                    >
                      <option value="viewer">Staff Viewer (Read-only)</option>
                      <option value="inventory_manager">Inventory & Products</option>
                      <option value="sales_manager">Sales & Orders CRM</option>
                      <option value="super_admin">Executive Super Admin</option>
                    </select>
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Account Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="h-4 w-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      required
                      className="block w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Password strength bar */}
                  {password && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden flex">
                        <div
                          className={`h-full transition-all duration-300 ${strength.color}`}
                          style={{ width: `${(strength.score / 3) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500">{strength.text}</span>
                    </div>
                  )}
                </div>

                {/* Company Passcode (Instant Activation) */}
                <div className="pt-1">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Company Invite / Master Passcode (Optional)
                    </label>
                    <span className="text-[10px] text-amber-600 font-medium">Instant Bypass</span>
                  </div>
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="e.g. BF-ADMIN-2026 for instant activation"
                    className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono tracking-wider focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-hidden"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Leave blank to submit request for manual Super Admin review.
                  </p>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-3 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-linear-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-md shadow-orange-500/20 transition-all cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? 'Registering Account...' : 'Submit Access Application'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
