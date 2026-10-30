import React, { useEffect, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  Shield,
  Sparkles,
  WifiOff,
} from 'lucide-react'
import logoImg from '../../assets/logo.png'
import { useAuth } from '../../context/AuthContext'
import { isNetworkAvailable } from '../../services/authApi'

export const LoginView: React.FC = () => {
  const { login, setAuthView } = useAuth()

  const [email, setEmail] = useState('brothersfurniture91@gmail.com')
  const [password, setPassword] = useState('bf@superadmin')
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      setErrorMsg((prev) => (prev?.toLowerCase().includes('network') || prev?.toLowerCase().includes('offline') ? null : prev))
    }
    const handleOffline = () => {
      setIsOffline(true)
      setErrorMsg('Network connection unavailable. Please check your internet connection and try again.')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check actual connectivity on mount
    isNetworkAvailable().then((online) => {
      if (!online) {
        setIsOffline(true)
      }
    })

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your email address and password.')
      return
    }

    setIsSubmitting(true)
    try {
      // Block authentication immediately if network connection is turned off / unavailable
      const online = await isNetworkAvailable()
      if (!online) {
        setIsOffline(true)
        setErrorMsg('Network connection unavailable. Please check your internet connection and try again.')
        return
      }

      await login({ email: email.trim(), password, rememberMe })
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to sign in. Please check your credentials.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const fillDemoAccount = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail)
    setPassword(demoPass)
    setErrorMsg(null)
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden select-none">
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 px-4">
        <div className="inline-flex items-center justify-center p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 shadow-xl mb-4">
          <img
            src={logoImg}
            alt="Brothers Furniture"
            className="h-11 w-auto object-contain filter drop-shadow-md"
          />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
          Brothers Furniture
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-300 font-medium">
          Enterprise Administration & Factory Operations Portal
        </p>
      </div>

      {/* Main Login Card */}
      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-white/95 backdrop-blur-xl py-8 px-6 sm:px-9 shadow-2xl rounded-2xl border border-white/20 sm:rounded-3xl">
          <div className="flex items-center justify-between pb-5 mb-5 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Staff Sign In</h2>
              <p className="text-xs text-slate-500 mt-0.5">Enter your credentials to access workspace</p>
            </div>
            <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
              <Lock className="w-5 h-5" />
            </div>
          </div>

          {/* Offline Warning Banner */}
          {isOffline && (
            <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl flex items-start gap-3 animate-fade-in text-amber-800">
              <WifiOff className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <div>
                <p className="text-xs font-bold">Network Connection Unavailable</p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  You are currently offline. Please reconnect to the internet to sign in.
                </p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200/80 rounded-xl flex items-start gap-3 animate-fade-in text-rose-800">
              {errorMsg.toLowerCase().includes('network') || errorMsg.toLowerCase().includes('offline') ? (
                <WifiOff className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              )}
              <p className="text-xs leading-relaxed font-medium">{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Work Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@brothersfurniture.co.in"
                  required
                  autoFocus
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all font-medium"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Password <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400">Production Auth</span>
              </div>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-orange-600 border-slate-300 rounded focus:ring-orange-500 cursor-pointer accent-orange-600"
                />
                <span className="ml-2 text-xs text-slate-600 font-medium">Keep session active (24h)</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-linear-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Authenticate & Enter</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Default Super Admin Account Card */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Default Administrator Account
              </span>
              <span className="text-[10px] text-slate-400">Click to autofill</span>
            </div>

            <button
              type="button"
              onClick={() => fillDemoAccount('brothersfurniture91@gmail.com', 'bf@superadmin')}
              className="w-full p-2.5 text-left bg-slate-50 hover:bg-orange-50/80 border border-slate-200 hover:border-orange-300 rounded-xl transition-colors cursor-pointer group flex items-center justify-between"
            >
              <div className="min-w-0 pr-2">
                <p className="text-xs font-bold text-slate-900 group-hover:text-orange-700 truncate">
                  Brothers Furniture (Super Admin)
                </p>
                <p className="text-[11px] text-slate-500 truncate">brothersfurniture91@gmail.com • 9790740027</p>
              </div>
              <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-[10px] font-bold rounded-full uppercase shrink-0">
                Super Admin
              </span>
            </button>
          </div>

          {/* Switch to Register */}
          <div className="mt-5 text-center">
            <p className="text-xs text-slate-500">
              New team member?{' '}
              <button
                type="button"
                onClick={() => setAuthView('register')}
                className="font-bold text-orange-600 hover:text-orange-700 transition cursor-pointer underline-offset-2 hover:underline"
              >
                Request Admin Access
              </button>
            </p>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Role-Based Access Control • 256-bit TLS Session Security</span>
        </div>
      </div>
    </div>
  )
}
