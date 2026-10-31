import React, { useState } from 'react'
import { ToastContainer } from './components/common/Toast'
import { Header } from './components/layout/Header'
import { Sidebar } from './components/layout/Sidebar'
import { AdminProvider, useAdmin } from './context/AdminContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AdminManagementView } from './views/AdminManagementView'
import { LoginView } from './views/auth/LoginView'
import { RegisterView } from './views/auth/RegisterView'
import { ClientsView } from './views/ClientsView'
import { DashboardView } from './views/DashboardView'
import { ErgonomicChairsView } from './views/ErgonomicChairsView'
import { InvoicesView } from './views/InvoicesView'
import { LeadsView } from './views/LeadsView'
import { OrdersView } from './views/OrdersView'
import { ProductsView } from './views/ProductsView'
import { ProductSettingsView } from './views/ProductSettingsView'
import { ProposalsView } from './views/ProposalsView'
import { RecycleBinView } from './views/RecycleBinView'
import { SettingsView } from './views/SettingsView'
import { TestimonialsView } from './views/TestimonialsView'
import logoImg from './assets/logo.png'

const AdminContent: React.FC = () => {
  const { currentView } = useAdmin()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false)
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-800 flex">
      {/* Sidebar Navigation */}
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

      {/* Main Content Area (Header + View Content Body) */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onToggleMobileMenu={() => setIsMobileOpen(true)}
          onOpenAddProduct={() => setIsAddProductModalOpen(true)}
          onOpenAddLead={() => setIsAddLeadModalOpen(true)}
        />

        <main
          className={`flex-1 w-full animate-fade-in min-w-0 ${
            currentView === 'categories' || currentView === 'product-settings'
              ? 'p-0 max-w-none flex flex-col'
              : 'p-3.5 sm:p-4 lg:p-5 max-w-7xl mx-auto'
          }`}
        >
          {currentView === 'dashboard' && (
            <DashboardView
              onOpenAddProduct={() => setIsAddProductModalOpen(true)}
              onOpenAddLead={() => setIsAddLeadModalOpen(true)}
            />
          )}

          {currentView === 'products' && (
            <ProductsView
              isAddModalOpen={isAddProductModalOpen}
              setIsAddModalOpen={setIsAddProductModalOpen}
            />
          )}

          {(currentView === 'categories' || currentView === 'product-settings') && <ProductSettingsView />}
          {currentView === 'recycle-bin' && <RecycleBinView />}
          {currentView === 'ergonomic-chairs' && <ErgonomicChairsView />}

          {currentView === 'leads' && (
            <LeadsView
              isAddModalOpen={isAddLeadModalOpen}
              setIsAddModalOpen={setIsAddLeadModalOpen}
            />
          )}

          {currentView === 'orders' && <OrdersView />}
          {(currentView === 'quotations' || currentView === 'proposals') && <ProposalsView />}
          {currentView === 'invoices' && <InvoicesView />}

          {currentView === 'clients' && <ClientsView />}

          {currentView === 'testimonials' && <TestimonialsView />}

          {currentView === 'admins' && <AdminManagementView />}

          {currentView === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Global Notifications */}
      <ToastContainer />
    </div>
  )
}

const AppRoot: React.FC = () => {
  const { isAuthenticated, isLoading, authView } = useAuth()

  // Splash loading screen while verifying stored credentials
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white select-none">
        <div className="p-3 bg-white/10 rounded-2xl border border-white/15 mb-4 animate-pulse">
          <img src={logoImg} alt="Brothers Furniture" className="h-10 w-auto" />
        </div>
        <p className="text-sm font-semibold tracking-wide text-slate-300">
          Securing Administrator Session...
        </p>
        <div className="mt-3 w-6 h-6 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
      </div>
    )
  }

  // Unauthenticated guard
  if (!isAuthenticated) {
    return authView === 'login' ? <LoginView /> : <RegisterView />
  }

  // Authenticated workspace
  return <AdminContent />
}

export default function App() {
  return (
    <AuthProvider>
      <AdminProvider>
        <AppRoot />
      </AdminProvider>
    </AuthProvider>
  )
}
