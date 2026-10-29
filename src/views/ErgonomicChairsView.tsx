import React, { useState } from 'react'
import {
  AlertCircle,
  Armchair,
  Check,
  Edit2,
  Grid,
  List,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import { Drawer } from '../components/common/Drawer'
import { useAdmin } from '../context/AdminContext'
import type { ChairType, ErgonomicChairModel } from '../types/admin'

export const ErgonomicChairsView: React.FC = () => {
  const {
    chairs,
    addChair,
    updateChair,
    deleteChair,
    toggleChairProduction,
    searchQuery,
    setSearchQuery,
    confirm,
  } = useAdmin()

  const [viewMode, setViewMode] = useState<'table' | 'card'>('table')
  const [selectedType, setSelectedType] = useState<ChairType | 'all'>('all')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingChair, setEditingChair] = useState<ErgonomicChairModel | null>(null)

  // Metrics
  const highBackCount = chairs.filter((c) => c.type === 'high-back').length
  const mediumBackCount = chairs.filter((c) => c.type === 'medium-back').length
  const meshSeatCount = chairs.filter((c) => c.type === 'mesh-seat').length
  const visitorCount = chairs.filter((c) => c.type === 'visitor').length
  const inProductionCount = chairs.filter((c) => c.inProduction).length

  const handleDeleteChair = async (chair: ErgonomicChairModel) => {
    const ok = await confirm({
      title: `Delete Chair Model "${chair.name}"?`,
      message: `Are you sure you want to remove "${chair.name}"? Base price: ₹${(chair.basePrice || 0).toLocaleString('en-IN')}.`,
      confirmText: 'Delete Chair Model',
      cancelText: 'Keep Model',
      variant: 'danger',
      icon: 'trash',
      badge: `Type: ${chair.type.toUpperCase()}`,
    })
    if (ok) {
      deleteChair(chair.id)
    }
  }

  const [formData, setFormData] = useState({
    name: '',
    type: 'high-back' as ChairType,
    image: '/products/ergonomic/godrez-hb-chair.webp',
    featuresText: 'Lumbar support, Adjustable headrest, Gas lift class 4',
    inProduction: true,
    basePrice: 19500,
  })

  const chairTypeDefs: { id: ChairType; label: string; desc: string; pillClass: string }[] = [
    {
      id: 'high-back',
      label: 'High Back',
      desc: 'Full spine and neck support with adjustable headrests',
      pillClass: 'bg-orange-50 text-orange-700 border-orange-200',
    },
    {
      id: 'medium-back',
      label: 'Medium Back',
      desc: 'Everyday task seating for open workstations',
      pillClass: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    {
      id: 'mesh-seat',
      label: 'Mesh Seat',
      desc: 'Breathable seat and back for extended comfort',
      pillClass: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      id: 'visitor',
      label: 'Visitor & Cantilever',
      desc: 'Sturdy frames for meeting rooms and executive cabins',
      pillClass: 'bg-slate-100 text-slate-700 border-slate-200',
    },
  ]

  const imagePresets = [
    { label: 'Godrez HB', path: '/products/ergonomic/godrez-hb-chair.webp' },
    { label: 'Optimus Elite', path: '/products/ergonomic/optimus-elite.webp' },
    { label: 'Grandeur Brown', path: '/products/ergonomic/grandeur-hb-brown-chair.webp' },
    { label: 'Grandeur White', path: '/products/ergonomic/grandeur-hb-white-chair.webp' },
    { label: 'Haux Grey', path: '/products/ergonomic/haux-hb-grey.webp' },
    { label: 'Twister HB', path: '/products/ergonomic/twister-hb.webp' },
    { label: 'Breeze MB', path: '/products/ergonomic/breeze-hb.webp' },
    { label: 'Matrix Visitor', path: '/products/ergonomic/matrix-hb.webp' },
  ]

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      type: 'high-back',
      image: '/products/ergonomic/godrez-hb-chair.webp',
      featuresText: 'Lumbar support, Adjustable headrest, Synchro-tilt',
      inProduction: true,
      basePrice: 19500,
    })
    setIsAddModalOpen(true)
  }

  const handleOpenEdit = (c: ErgonomicChairModel) => {
    setEditingChair(c)
    setFormData({
      name: c.name,
      type: c.type,
      image: c.image,
      featuresText: c.features.join(', '),
      inProduction: c.inProduction,
      basePrice: c.basePrice || 19500,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    const features = formData.featuresText
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean)

    if (editingChair) {
      updateChair(editingChair.id, {
        name: formData.name,
        type: formData.type,
        image: formData.image,
        features,
        inProduction: formData.inProduction,
        basePrice: formData.basePrice,
      })
      setEditingChair(null)
    } else {
      addChair({
        name: formData.name,
        type: formData.type,
        image: formData.image,
        features,
        inProduction: formData.inProduction,
        basePrice: formData.basePrice,
      })
      setIsAddModalOpen(false)
    }
  }

  const filteredChairs = chairs.filter((c) => {
    const matchesType = selectedType === 'all' || c.type === selectedType
    const query = searchQuery.toLowerCase().trim()
    const matchesSearch =
      !query ||
      c.name.toLowerCase().includes(query) ||
      c.type.toLowerCase().includes(query) ||
      c.id.toLowerCase().includes(query) ||
      c.features.some((f) => f.toLowerCase().includes(query))
    return matchesType && matchesSearch
  })

  const getTypePill = (type: ChairType) => {
    switch (type) {
      case 'high-back':
        return 'bg-orange-50 text-orange-700 border-orange-200'
      case 'medium-back':
        return 'bg-sky-50 text-sky-700 border-sky-200'
      case 'mesh-seat':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'visitor':
        return 'bg-slate-100 text-slate-700 border-slate-200'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  const formatTypeName = (type: ChairType) => {
    switch (type) {
      case 'high-back':
        return 'High Back'
      case 'medium-back':
        return 'Medium Back'
      case 'mesh-seat':
        return 'Mesh Seat'
      case 'visitor':
        return 'Visitor'
      default:
        return type
    }
  }

  return (
    <div className="space-y-4">
      {/* 1. Header Strip & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-0.5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Chairs Category & Ergonomic Lines
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
              <Armchair className="w-3 h-3 text-slate-500" />
              {chairs.length} Chair Models
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-orange-50 text-orange-700 border border-orange-200/70">
              {highBackCount} High Back
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/70">
              {mediumBackCount} Medium Back
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/70">
              {meshSeatCount} Mesh Seat
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
              {visitorCount} Visitor
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
              {inProductionCount} In Active Fabrication
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Ambattur plant manufactured commercial ergonomic seating series · High back, task mesh & cantilever visitor chairs
          </p>
        </div>

        {/* Register Chair Button */}
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Chair Model</span>
        </button>
      </div>

      {/* 2. Compact Filter Pills & View Switcher */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-2.5 sm:p-3 shadow-xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Chair Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 max-w-full">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors cursor-pointer ${
                selectedType === 'all'
                  ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              All Series ({chairs.length})
            </button>
            {chairTypeDefs.map((def) => {
              const count = chairs.filter((c) => c.type === def.id).length
              const isSelected = selectedType === def.id
              return (
                <button
                  key={def.id}
                  onClick={() => setSelectedType(def.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                      : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  {def.label} ({count})
                </button>
              )
            })}
          </div>

          {/* View Mode Switcher (Table vs Card) */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
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
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {(selectedType !== 'all' || searchQuery) && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1 border-t border-slate-100 flex-wrap">
            <span className="font-medium text-[11px] text-slate-400">Filters:</span>
            {selectedType !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200 text-[11px] font-semibold">
                Series: {formatTypeName(selectedType)}
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium font-mono">
                Keyword: "{searchQuery}"
              </span>
            )}
            <button
              onClick={() => {
                setSelectedType('all')
                setSearchQuery('')
              }}
              className="text-[11px] text-orange-600 hover:text-orange-700 font-semibold cursor-pointer ml-1 inline-flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Clear filters
            </button>
          </div>
        )}
      </div>

      {/* 3. Main Data Container: Table or Card */}
      {filteredChairs.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center space-y-3 shadow-xs">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
          <h4 className="text-sm sm:text-base font-bold text-slate-900">No chair models found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No ergonomic chair models matched the current series filter or search keyword.
          </p>
          <button
            onClick={() => {
              setSelectedType('all')
              setSearchQuery('')
            }}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3 h-3" /> Reset Filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* COMPACT MINIMAL TABLE VIEW */
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3.5">Model & Identifier</th>
                  <th className="py-2.5 px-3.5">Category Series</th>
                  <th className="py-2.5 px-3.5">Ergonomic Specs & Features</th>
                  <th className="py-2.5 px-3.5">Commercial Base Price</th>
                  <th className="py-2.5 px-3.5">Production Status</th>
                  <th className="py-2.5 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredChairs.map((chair) => (
                  <tr
                    key={chair.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Model & Image */}
                    <td className="py-2 px-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200/80 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                          <img
                            src={chair.image}
                            alt={chair.name}
                            className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-200"
                            onError={(e) => {
                              ;(e.target as HTMLElement).style.opacity = '0.4'
                            }}
                          />
                        </div>
                        <div className="min-w-0 max-w-[200px]">
                          <span className="font-bold text-slate-900 text-xs sm:text-[13px] block truncate">
                            {chair.name}
                          </span>
                          <span className="font-mono text-[10.5px] text-slate-400 block truncate">
                            {chair.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category Type */}
                    <td className="py-2 px-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getTypePill(
                          chair.type
                        )}`}
                      >
                        {formatTypeName(chair.type)}
                      </span>
                    </td>

                    {/* Features Tags */}
                    <td className="py-2 px-3.5">
                      <div className="flex flex-wrap gap-1 max-w-[340px]">
                        {chair.features.slice(0, 3).map((feat, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/70"
                          >
                            {feat}
                          </span>
                        ))}
                        {chair.features.length > 3 && (
                          <span className="text-[10px] text-slate-400 font-semibold px-1 py-0.5">
                            +{chair.features.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Base Commercial Price */}
                    <td className="py-2 px-3.5 whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-900 text-xs sm:text-[13px] block">
                        ₹{(chair.basePrice || 19500).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-400 block">Ex-Factory Unit</span>
                    </td>

                    {/* Fabrication Toggle Status */}
                    <td className="py-2 px-3.5 whitespace-nowrap">
                      <button
                        onClick={() => toggleChairProduction(chair.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition cursor-pointer ${
                          chair.inProduction
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                        }`}
                        title="Click to toggle production status"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            chair.inProduction ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                        />
                        <span>{chair.inProduction ? 'In Production' : 'Paused'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-2 px-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(chair)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                          title="Edit Chair Model"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteChair(chair)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title="Delete Model"
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
              Showing <strong className="text-slate-700 font-semibold">{filteredChairs.length}</strong> of{' '}
              <strong className="text-slate-700 font-semibold">{chairs.length}</strong> ergonomic chair models
            </span>
            <span className="text-[11px] text-slate-400">
              Click status pill to toggle fabrication line availability
            </span>
          </div>
        </div>
      ) : (
        /* COMPACT CARD VIEW (CLEAN WHITE CARDS) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredChairs.map((chair) => (
            <div
              key={chair.id}
              className="bg-white rounded-xl border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all overflow-hidden flex flex-col justify-between group"
            >
              <div>
                {/* Image Frame */}
                <div className="h-44 bg-slate-50/80 p-3 flex items-center justify-center border-b border-slate-100 relative overflow-hidden">
                  <img
                    src={chair.image}
                    alt={chair.name}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      ;(e.target as HTMLElement).style.opacity = '0.5'
                    }}
                  />
                  <span
                    className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-semibold border shadow-2xs ${getTypePill(
                      chair.type
                    )}`}
                  >
                    {formatTypeName(chair.type)}
                  </span>
                  <button
                    onClick={() => toggleChairProduction(chair.id)}
                    className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-semibold border cursor-pointer ${
                      chair.inProduction
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs'
                        : 'bg-amber-50 text-amber-700 border-amber-200 shadow-2xs'
                    }`}
                    title="Toggle production"
                  >
                    {chair.inProduction ? 'In Production' : 'Paused'}
                  </button>
                </div>

                {/* Information */}
                <div className="p-3.5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs sm:text-[13px] font-bold text-slate-900 tracking-tight leading-snug">
                      {chair.name}
                    </h4>
                  </div>
                  {chair.basePrice ? (
                    <span className="text-xs font-mono font-bold text-slate-900 block">
                      Starting ₹{chair.basePrice.toLocaleString('en-IN')}
                    </span>
                  ) : null}

                  {/* Features tags */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {chair.features.map((feat, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/60"
                      >
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="p-2.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[10.5px] font-mono text-slate-400">{chair.id}</span>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => handleOpenEdit(chair)}
                    className="p-1 text-slate-400 hover:text-amber-600 rounded hover:bg-slate-100 transition cursor-pointer"
                    title="Edit Model"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteChair(chair)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition cursor-pointer"
                    title="Delete Model"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. ADD / EDIT PRODUCTION CHAIR DRAWER */}
      <Drawer
        isOpen={isAddModalOpen || editingChair !== null}
        onClose={() => {
          setIsAddModalOpen(false)
          setEditingChair(null)
        }}
        title={editingChair ? `Edit Production: ${editingChair.name}` : 'Register Production Model'}
        subtitle="Brothers Furniture Ambattur Chennai Factory Production Line"
        maxWidth="max-w-2xl sm:max-w-3xl lg:max-w-4xl xl:max-w-5xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Model Name <span className="text-orange-500">*</span>
              </label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Optimus Elite HB Chair"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Chair Category Series
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as ChairType })}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition"
              >
                <option value="high-back">High Back</option>
                <option value="medium-back">Medium Back</option>
                <option value="mesh-seat">Mesh Seat</option>
                <option value="visitor">Visitor / Cantilever</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Base Price (₹ INR)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold select-none">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  placeholder="e.g. 19500"
                  value={formData.basePrice === 0 ? '' : formData.basePrice}
                  onChange={(e) => {
                    const val = e.target.value
                    setFormData({
                      ...formData,
                      basePrice: val === '' ? ('' as any) : Number(val),
                    })
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg pl-7 pr-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition placeholder:text-slate-300"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Image Asset Path <span className="text-orange-500">*</span>
              </label>
              <input
                required
                type="text"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="/products/ergonomic/godrez-hb-chair.webp"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition"
              />
            </div>
          </div>

          {/* Quick Preset Selector */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
              Or Select Factory Image Preset
            </label>
            <div className="flex flex-wrap gap-1.5">
              {imagePresets.map((preset) => (
                <button
                  type="button"
                  key={preset.path}
                  onClick={() => setFormData({ ...formData, image: preset.path })}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer border ${
                    formData.image === preset.path
                      ? 'bg-orange-50 text-orange-700 border-orange-300 font-semibold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Ergonomic Features (Comma-separated)
            </label>
            <input
              type="text"
              value={formData.featuresText}
              onChange={(e) => setFormData({ ...formData, featuresText: e.target.value })}
              placeholder="e.g. Adjustable headrest, Synchro tilt, Lumbar support"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <span className="text-xs text-slate-700 font-medium">Currently in Factory Production Line</span>
            <input
              type="checkbox"
              checked={formData.inProduction}
              onChange={(e) => setFormData({ ...formData, inProduction: e.target.checked })}
              className="rounded accent-orange-500 w-4 h-4 cursor-pointer"
            />
          </div>

          <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs pt-3 pb-1 border-t border-slate-200 -mx-4 sm:-mx-6 px-4 sm:px-6 flex items-center justify-end gap-2.5 mt-4 z-10">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false)
                setEditingChair(null)
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
              <span>{editingChair ? 'Update Model' : 'Save Chair Model'}</span>
            </button>
          </div>
        </form>
      </Drawer>
    </div>
  )
}
