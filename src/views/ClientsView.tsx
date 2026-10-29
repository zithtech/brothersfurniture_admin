import React, { useState } from 'react'
import {
  AlertCircle,
  Building2,
  Check,
  Edit2,
  Grid,
  List,
  Plus,
  RotateCcw,
  Star,
  Trash2,
} from 'lucide-react'
import { Modal } from '../components/common/Modal'
import { useAdmin } from '../context/AdminContext'
import type { ClientPartner } from '../types/admin'

export const ClientsView: React.FC = () => {
  const {
    clients,
    addClient,
    updateClient,
    deleteClient,
    toggleClientFeatured,
    searchQuery,
    setSearchQuery,
    confirm,
  } = useAdmin()

  const [viewMode, setViewMode] = useState<'card' | 'table'>('card')
  const [selectedSector, setSelectedSector] = useState<string>('All')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<ClientPartner | null>(null)

  // Metrics
  const featuredCount = clients.filter((c) => c.featured).length
  const uniqueSectors = [...new Set(clients.map((c) => c.sector))].sort()
  const sectors = ['All', ...uniqueSectors]

  const handleDeleteClient = async (client: ClientPartner) => {
    const ok = await confirm({
      title: `Delete Client Partner "${client.name}"?`,
      message: `Are you sure you want to remove "${client.name}" from client and corporate portfolio? Sector: ${client.sector}.`,
      confirmText: 'Delete Client Partner',
      cancelText: 'Keep Partner',
      variant: 'danger',
      icon: 'trash',
      badge: `Sector: ${client.sector}`,
    })
    if (ok) {
      deleteClient(client.id)
    }
  }

  const [formData, setFormData] = useState({
    name: '',
    logo: '/clients/pvr-cinemas.webp',
    sector: 'Technology',
    featured: true,
  })

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      logo: '/clients/pvr-cinemas.webp',
      sector: 'Technology',
      featured: true,
    })
    setIsAddModalOpen(true)
  }

  const handleOpenEdit = (c: ClientPartner) => {
    setEditingClient(c)
    setFormData({
      name: c.name,
      logo: c.logo,
      sector: c.sector,
      featured: c.featured,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    if (editingClient) {
      updateClient(editingClient.id, formData)
      setEditingClient(null)
    } else {
      addClient(formData)
      setIsAddModalOpen(false)
    }
  }

  const filteredClients = clients.filter((c) => {
    const matchesSector = selectedSector === 'All' || c.sector === selectedSector
    const q = searchQuery.toLowerCase().trim()
    const matchesSearch =
      !q || c.name.toLowerCase().includes(q) || c.sector.toLowerCase().includes(q)
    return matchesSector && matchesSearch
  })

  const logoPresets = [
    { label: 'PVR Cinemas', path: '/clients/pvr-cinemas.webp' },
    { label: 'Indian Bank', path: '/clients/indian-bank.webp' },
    { label: 'Billroth Hospital', path: '/clients/billroth-hospital.webp' },
    { label: 'Nibav Lifts', path: '/clients/nibav-lifts.webp' },
    { label: 'Merit Software', path: '/clients/merit-software.webp' },
  ]

  return (
    <div className="space-y-4">
      {/* 1. Header Strip & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-0.5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Corporate Clients
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
              <Building2 className="w-3 h-3 text-slate-500" />
              {clients.length} Enterprise Clients
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/70">
              {featuredCount} Featured on Marquee
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/70">
              {uniqueSectors.length} Sectors
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            B2B enterprise partners & brands showcased on the Brothers Furniture landing page marquee
          </p>
        </div>

        {/* Add Corporate Client Button */}
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Corporate Client</span>
        </button>
      </div>

      {/* 2. Compact Sector Filter Tabs & View Switcher */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-2.5 sm:p-3 shadow-xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Sector Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 max-w-full">
            {sectors.map((sec) => {
              const count = sec === 'All' ? clients.length : clients.filter((c) => c.sector === sec).length
              const isSelected = selectedSector === sec
              return (
                <button
                  key={sec}
                  onClick={() => setSelectedSector(sec)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                      : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  {sec} ({count})
                </button>
              )
            })}
          </div>

          {/* View Switcher (Cards vs Table) */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
              <button
                onClick={() => setViewMode('card')}
                className={`p-1 rounded-md transition-all cursor-pointer ${
                  viewMode === 'card'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Card View"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1 rounded-md transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {(selectedSector !== 'All' || searchQuery) && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1 border-t border-slate-100 flex-wrap">
            <span className="font-medium text-[11px] text-slate-400">Filters:</span>
            {selectedSector !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200 text-[11px] font-semibold">
                Sector: {selectedSector}
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium font-mono">
                Keyword: "{searchQuery}"
              </span>
            )}
            <button
              onClick={() => {
                setSelectedSector('All')
                setSearchQuery('')
              }}
              className="text-[11px] text-orange-600 hover:text-orange-700 font-semibold cursor-pointer ml-1 inline-flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Clear filters
            </button>
          </div>
        )}
      </div>

      {/* 3. Main Data Container: Cards or Table */}
      {filteredClients.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center space-y-3 shadow-xs">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
          <h4 className="text-sm sm:text-base font-bold text-slate-900">No clients found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No corporate clients matched the current sector or search keyword.
          </p>
          <button
            onClick={() => {
              setSelectedSector('All')
              setSearchQuery('')
            }}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3 h-3" /> Reset Filters
          </button>
        </div>
      ) : viewMode === 'card' ? (
        /* COMPACT CARD VIEW (CLEAN WHITE CARDS) */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Logo Frame */}
                <div className="h-24 rounded-lg bg-slate-50 p-2.5 flex items-center justify-center border border-slate-100 relative overflow-hidden">
                  <img
                    src={client.logo}
                    alt={client.name}
                    className="max-h-full max-w-full object-contain filter contrast-125 group-hover:scale-105 transition-transform duration-200"
                    onError={(e) => {
                      ;(e.target as HTMLElement).style.opacity = '0.4'
                    }}
                  />
                  <button
                    onClick={() => toggleClientFeatured(client.id)}
                    className={`absolute top-1.5 right-1.5 p-1 rounded-md transition cursor-pointer ${
                      client.featured
                        ? 'text-amber-500 bg-amber-50 shadow-2xs'
                        : 'text-slate-300 hover:text-slate-500 hover:bg-white'
                    }`}
                    title={client.featured ? 'Featured on Marquee' : 'Not featured'}
                  >
                    <Star className={`w-3.5 h-3.5 ${client.featured ? 'fill-amber-500' : ''}`} />
                  </button>
                </div>

                {/* Info */}
                <div className="pt-2.5 space-y-1">
                  <h4
                    className="text-xs sm:text-[13px] font-bold text-slate-900 tracking-tight leading-tight truncate"
                    title={client.name}
                  >
                    {client.name}
                  </h4>
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10.5px] font-medium bg-slate-100 text-slate-600 border border-slate-200/60">
                    {client.sector}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span className="text-[10px] font-mono text-slate-400">{client.id}</span>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => handleOpenEdit(client)}
                    className="p-1 text-slate-400 hover:text-amber-600 rounded hover:bg-amber-50 transition cursor-pointer"
                    title="Edit Partner"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteClient(client)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition cursor-pointer"
                    title="Delete Partner"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* COMPACT MINIMAL TABLE VIEW */
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3.5">Company & Brand</th>
                  <th className="py-2.5 px-3.5">Industry Sector</th>
                  <th className="py-2.5 px-3.5">Marquee Status</th>
                  <th className="py-2.5 px-3.5">Client ID</th>
                  <th className="py-2.5 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredClients.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Company & Logo */}
                    <td className="py-2 px-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-7 rounded bg-slate-50 border border-slate-200/80 p-0.5 flex items-center justify-center shrink-0 overflow-hidden">
                          <img
                            src={client.logo}
                            alt={client.name}
                            className="max-h-full max-w-full object-contain"
                            onError={(e) => {
                              ;(e.target as HTMLElement).style.opacity = '0.4'
                            }}
                          />
                        </div>
                        <span className="font-bold text-slate-900 text-xs sm:text-[13px] truncate">
                          {client.name}
                        </span>
                      </div>
                    </td>

                    {/* Sector */}
                    <td className="py-2 px-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/70">
                        {client.sector}
                      </span>
                    </td>

                    {/* Marquee Featured */}
                    <td className="py-2 px-3.5 whitespace-nowrap">
                      <button
                        onClick={() => toggleClientFeatured(client.id)}
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border cursor-pointer transition ${
                          client.featured
                            ? 'bg-amber-50 text-amber-700 border-amber-200/80 hover:bg-amber-100'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                        title="Click to toggle landing marquee visibility"
                      >
                        <Star className={`w-3 h-3 ${client.featured ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
                        <span>{client.featured ? 'Active Marquee' : 'Hidden'}</span>
                      </button>
                    </td>

                    {/* ID */}
                    <td className="py-2 px-3.5 whitespace-nowrap font-mono text-[11px] text-slate-400">
                      {client.id}
                    </td>

                    {/* Actions */}
                    <td className="py-2 px-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(client)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 rounded-md hover:bg-amber-50 transition cursor-pointer"
                          title="Edit Partner"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClient(client)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition cursor-pointer"
                          title="Delete Partner"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="px-3.5 py-2.5 bg-slate-50/70 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing <strong className="text-slate-700 font-semibold">{filteredClients.length}</strong> of{' '}
              <strong className="text-slate-700 font-semibold">{clients.length}</strong> corporate partners
            </span>
            <span className="text-[11px] text-slate-400">
              Active marquee partners scroll across the landing page header showcase
            </span>
          </div>
        </div>
      )}

      {/* 4. Add / Edit Client Partner Modal (Clean Light Theme) */}
      <Modal
        isOpen={isAddModalOpen || editingClient !== null}
        onClose={() => {
          setIsAddModalOpen(false)
          setEditingClient(null)
        }}
        title={editingClient ? `Edit ${editingClient.name}` : 'Add Corporate Client Partner'}
        subtitle="Appears in Landing Page Client Marquee"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Company / Brand Name <span className="text-orange-500">*</span>
            </label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Cognizant Technologies"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Industry Sector
              </label>
              <input
                required
                type="text"
                value={formData.sector}
                onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                placeholder="e.g. Technology, Healthcare, Banking"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Logo Asset Path <span className="text-orange-500">*</span>
              </label>
              <input
                required
                type="text"
                value={formData.logo}
                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                placeholder="/clients/pvr-cinemas.webp"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition"
              />
            </div>
          </div>

          {/* Quick presets */}
          <div>
            <span className="text-[11px] text-slate-500 block mb-1 font-medium">Select Existing Logo Asset:</span>
            <div className="flex flex-wrap gap-1.5">
              {logoPresets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setFormData({ ...formData, logo: preset.path, name: preset.label })}
                  className="text-[10.5px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200/80 transition cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <span className="text-xs text-slate-700 font-medium">Show in Landing Page Marquee</span>
            <input
              type="checkbox"
              checked={formData.featured}
              onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
              className="rounded accent-orange-500 w-4 h-4 cursor-pointer"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false)
                setEditingClient(null)
              }}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{editingClient ? 'Save Partner' : 'Add Partner'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
