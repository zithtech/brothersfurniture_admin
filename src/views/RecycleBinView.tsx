import React, { useMemo, useState } from 'react'
import {
  ArrowLeft,
  FolderTree,
  Layers,
  Package,
  RotateCcw,
  Search,
  Tag,
  Trash2,
} from 'lucide-react'
import { AlertBanner } from '../components/common/AlertBanner'
import { useAdmin } from '../context/AdminContext'

type BinTab = 'all' | 'products' | 'categories' | 'types'

export const RecycleBinView: React.FC = () => {
  const {
    deletedProducts,
    deletedCategories,
    deletedTypes,
    totalBinCount,
    restoreProduct,
    permanentlyDeleteProduct,
    restoreAllProducts,
    emptyProductBin,
    restoreCategory,
    permanentlyDeleteCategory,
    restoreType,
    permanentlyDeleteType,
    setCurrentView,
    confirm,
  } = useAdmin()

  const [activeTab, setActiveTab] = useState<BinTab>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Calculate recoverable retail inventory value
  const totalRecoverableValue = useMemo(() => {
    return deletedProducts.reduce((sum, p) => sum + (Number(p.price) || 0) * (p.stockCount || 1), 0)
  }, [deletedProducts])

  // Filtered lists
  const filteredProducts = useMemo(() => {
    return deletedProducts.filter((p) => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.type?.toLowerCase().includes(q)
      )
    })
  }, [deletedProducts, searchQuery])

  const filteredCategories = useMemo(() => {
    return deletedCategories.filter((c) => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return c.name.toLowerCase().includes(q) || c.type.toLowerCase().includes(q)
    })
  }, [deletedCategories, searchQuery])

  const filteredTypes = useMemo(() => {
    return deletedTypes.filter((t) => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return t.name.toLowerCase().includes(q)
    })
  }, [deletedTypes, searchQuery])

  const totalFilteredCount =
    (activeTab === 'all' || activeTab === 'products' ? filteredProducts.length : 0) +
    (activeTab === 'all' || activeTab === 'categories' ? filteredCategories.length : 0) +
    (activeTab === 'all' || activeTab === 'types' ? filteredTypes.length : 0)

  // Empty bin confirmation
  const handleEmptyAll = async () => {
    if (totalBinCount === 0) return
    const confirmed = await confirm({
      title: `Permanently Empty All ${totalBinCount} Item(s)?`,
      message:
        'CAUTION: This will permanently erase all deleted products, categories, and types from the system. This action CANNOT be undone.',
      confirmText: 'Empty Bin Forever',
      cancelText: 'Keep in Bin',
      variant: 'danger',
      icon: 'trash',
      badge: 'Irreversible Action',
      requireTypedConfirmation: 'EMPTY',
    })
    if (confirmed) {
      emptyProductBin()
      deletedCategories.forEach((c) => permanentlyDeleteCategory(c.id))
      deletedTypes.forEach((t) => permanentlyDeleteType(t.id))
    }
  }

  // Restore all confirmation
  const handleRestoreAll = async () => {
    if (totalBinCount === 0) return
    const confirmed = await confirm({
      title: `Restore All ${totalBinCount} Item(s)?`,
      message:
        'All archived products, categories, and types will be restored back into the active catalog and live store immediately.',
      confirmText: 'Restore All Items',
      cancelText: 'Cancel',
      variant: 'primary',
      icon: 'refresh',
    })
    if (confirmed) {
      restoreAllProducts()
      deletedCategories.forEach((c) => restoreCategory(c.id))
      deletedTypes.forEach((t) => restoreType(t.id))
    }
  }

  const formatDeletedTime = (isoString?: string) => {
    if (!isoString) return 'Recently'
    try {
      const date = new Date(isoString)
      return date.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return isoString
    }
  }

  return (
    <div className="space-y-5 pb-14 max-w-7xl mx-auto">
      {/* 1. Page Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-600 mb-1">
            <Trash2 className="w-3.5 h-3.5" />
            <span>Safety Archive & Recovery</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Recycle Bin & Archive
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Safely recover deleted products, categories, and manufacturing lines, or permanently purge them.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setCurrentView('products')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Products</span>
          </button>

          {totalBinCount > 0 && (
            <>
              <button
                type="button"
                onClick={handleRestoreAll}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl shadow-2xs transition-colors cursor-pointer"
                title="Restore all deleted items back to live inventory"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restore All</span>
              </button>

              <button
                type="button"
                onClick={handleEmptyAll}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl shadow-2xs transition-colors cursor-pointer"
                title="Permanently erase everything in the recycle bin"
              >
                <Trash2 className="w-4 h-4" />
                <span>Empty Recycle Bin</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Informative Alert Banner for Recycle Bin */}
      {totalBinCount > 0 && (
        <AlertBanner
          variant="info"
          title="Safe Storage & Recovery"
          className="shadow-2xs"
        >
          Items in the Recycle Bin remain hidden from visitors and customers on the public store. You can restore them to active status at any time, or permanently purge them when you are sure they are no longer needed.
        </AlertBanner>
      )}

      {/* 2. Top Metric KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total in Bin</span>
            <Trash2 className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalBinCount}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Archived items ready to restore</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Deleted Products</span>
            <Package className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{deletedProducts.length}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Furniture models in archive</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Recoverable Value</span>
            <Tag className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">
            ₹{totalRecoverableValue.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Estimated catalog value</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Taxonomy Items</span>
            <FolderTree className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {deletedCategories.length + deletedTypes.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Categories & Types archived</p>
        </div>
      </div>

      {/* 3. Navigation Filter Tabs & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All Items', count: totalBinCount },
              { id: 'products', label: 'Products', count: deletedProducts.length },
              { id: 'categories', label: 'Categories', count: deletedCategories.length },
              { id: 'types', label: 'Types', count: deletedTypes.length },
            ].map((tab) => {
              const isSelected = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as BinTab)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, SKU, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>
        </div>
      </div>

      {/* 4. Deleted Items Content */}
      {totalFilteredCount === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Trash2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {totalBinCount === 0 ? 'Recycle Bin is Empty' : 'No matching items found in the bin'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            {totalBinCount === 0
              ? 'When products, categories, or types are deleted, they will be archived here so you can safely restore them anytime.'
              : `No archived items match your current filter query "${searchQuery}".`}
          </p>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setCurrentView('products')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Package className="w-4 h-4" />
              <span>Browse Active Products</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* SECTION: Products in Bin */}
          {(activeTab === 'all' || activeTab === 'products') && filteredProducts.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-orange-600" />
                  <span>Deleted Products ({filteredProducts.length})</span>
                </span>
                <span className="text-[11px] text-slate-400">Click &quot;Restore&quot; to bring back to inventory</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      {/* Product Thumbnail */}
                      <div className="w-16 h-16 rounded-lg bg-slate-100 border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1580481077195-c2f82d13470f?w=200&auto=format&fit=crop&q=80'
                            }}
                          />
                        ) : (
                          <Package className="w-6 h-6 text-slate-400" />
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                            {product.sku || 'BF-PROD'}
                          </span>
                          <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded">
                            In Recycle Bin
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 truncate mt-1">
                          {product.name}
                        </h4>

                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                          <span>{product.type || 'Chairs'}</span>
                          <span>•</span>
                          <span>{product.category}</span>
                          {product.subCategory && (
                            <>
                              <span>•</span>
                              <span className="text-orange-600 font-medium">{product.subCategory}</span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-2.5 mt-2 text-xs">
                          <span className="font-bold text-slate-900">
                            ₹{Number(product.price || 0).toLocaleString('en-IN')}
                          </span>
                          <span className="text-slate-400">|</span>
                          <span className="text-slate-500 text-[11px]">
                            Qty: <strong className="text-slate-700">{product.stockCount ?? 1}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Deleted: {formatDeletedTime(product.deletedAt)}</span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => restoreProduct(product.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                          title="Restore product to active inventory"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            const ok = await confirm({
                              title: `Permanently Purge "${product.name}"?`,
                              message: 'This product will be permanently deleted from database records. This action cannot be undone.',
                              confirmText: 'Purge Forever',
                              cancelText: 'Cancel',
                              variant: 'danger',
                              icon: 'trash',
                              badge: product.sku ? `SKU: ${product.sku}` : product.category,
                            })
                            if (ok) {
                              permanentlyDeleteProduct(product.id)
                            }
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs transition-colors cursor-pointer"
                          title="Permanently erase forever"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Purge</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION: Categories in Bin */}
          {(activeTab === 'all' || activeTab === 'categories') && filteredCategories.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <FolderTree className="w-3.5 h-3.5 text-blue-600" />
                  <span>Deleted Categories ({filteredCategories.length})</span>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredCategories.map((category) => (
                  <div
                    key={category.id}
                    className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <FolderTree className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 truncate">
                            {category.name}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                            /{category.slug}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Type: <strong className="text-slate-700">{category.type}</strong> •{' '}
                          {category.subCategories?.length || 0} subcategories
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Deleted: {formatDeletedTime(category.deletedAt)}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => restoreCategory(category.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const ok = await confirm({
                              title: `Permanently Delete Category "${category.name}"?`,
                              message: 'This category configuration will be permanently purged from the recycle bin.',
                              confirmText: 'Delete Category Forever',
                              cancelText: 'Cancel',
                              variant: 'danger',
                              icon: 'trash',
                              badge: `Type: ${category.type}`,
                            })
                            if (ok) {
                              permanentlyDeleteCategory(category.id)
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Permanently Delete Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION: Types in Bin */}
          {(activeTab === 'all' || activeTab === 'types') && filteredTypes.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-600" />
                  <span>Deleted Product Types ({filteredTypes.length})</span>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredTypes.map((typeItem) => (
                  <div
                    key={typeItem.id}
                    className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {typeItem.name}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {typeItem.description || 'Top-level manufacturing line'}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Deleted: {formatDeletedTime(typeItem.deletedAt)}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => restoreType(typeItem.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const ok = await confirm({
                              title: `Permanently Delete Type "${typeItem.name}"?`,
                              message: 'This product type configuration will be permanently purged from the system.',
                              confirmText: 'Delete Type Forever',
                              cancelText: 'Cancel',
                              variant: 'danger',
                              icon: 'trash',
                            })
                            if (ok) {
                              permanentlyDeleteType(typeItem.id)
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Permanently Delete Type"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
