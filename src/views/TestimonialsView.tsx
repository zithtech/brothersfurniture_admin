import React, { useState } from 'react'
import {
  AlertCircle,
  Check,
  Edit2,
  Grid,
  List,
  Plus,
  Quote,
  RotateCcw,
  Star,
  ThumbsUp,
  Trash2,
} from 'lucide-react'
import { Modal } from '../components/common/Modal'
import { useAdmin } from '../context/AdminContext'
import type { TestimonialReview } from '../types/admin'

export const TestimonialsView: React.FC = () => {
  const {
    testimonials,
    addTestimonial,
    updateTestimonial,
    deleteTestimonial,
    searchQuery,
    setSearchQuery,
    confirm,
  } = useAdmin()

  const [viewMode, setViewMode] = useState<'card' | 'table'>('table')
  const [ratingFilter, setRatingFilter] = useState<'all' | '5' | '4' | 'approved' | 'pending'>('all')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingTestimonial, setEditingTestimonial] = useState<TestimonialReview | null>(null)

  // Metrics
  const avgRating = (
    testimonials.reduce((sum, t) => sum + (t.rating || 5), 0) / (testimonials.length || 1)
  ).toFixed(1)
  const approvedCount = testimonials.filter((t) => t.approved).length
  const featuredCount = testimonials.filter((t) => t.featured).length

  const handleDeleteReview = async (review: TestimonialReview) => {
    const ok = await confirm({
      title: `Delete Review from "${review.name}"?`,
      message: `Are you sure you want to delete this testimonial from ${review.company || 'Client'} (${review.rating} Stars)?`,
      confirmText: 'Delete Review',
      cancelText: 'Keep Review',
      variant: 'danger',
      icon: 'trash',
      badge: `${review.rating} ★ Rating`,
    })
    if (ok) {
      deleteTestimonial(review.id)
    }
  }

  const [formData, setFormData] = useState({
    name: '',
    role: 'Operations Director',
    company: 'Tech Solutions Chennai',
    quote: '',
    rating: 5,
    approved: true,
    featured: true,
  })

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      role: 'Facilities Manager',
      company: 'Omni Tech Park',
      quote: 'Exceptional craftsmanship and swift installation for our 80-seat workstation setup.',
      rating: 5,
      approved: true,
      featured: true,
    })
    setIsAddModalOpen(true)
  }

  const handleOpenEdit = (t: TestimonialReview) => {
    setEditingTestimonial(t)
    setFormData({
      name: t.name,
      role: t.role,
      company: t.company,
      quote: t.quote,
      rating: t.rating,
      approved: t.approved,
      featured: t.featured,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.quote.trim()) return

    if (editingTestimonial) {
      updateTestimonial(editingTestimonial.id, formData)
      setEditingTestimonial(null)
    } else {
      addTestimonial(formData)
      setIsAddModalOpen(false)
    }
  }

  const filteredTestimonials = testimonials.filter((t) => {
    const matchesFilter =
      ratingFilter === 'all'
        ? true
        : ratingFilter === '5'
        ? t.rating === 5
        : ratingFilter === '4'
        ? t.rating === 4
        : ratingFilter === 'approved'
        ? t.approved
        : !t.approved

    const q = searchQuery.toLowerCase().trim()
    const matchesSearch =
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.company.toLowerCase().includes(q) ||
      t.role.toLowerCase().includes(q) ||
      t.quote.toLowerCase().includes(q)

    return matchesFilter && matchesSearch
  })

  return (
    <div className="space-y-4">
      {/* 1. Header Strip & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-0.5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Customer Reviews
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/70">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
              {avgRating} / 5.0 Rating
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
              {testimonials.length} Total Reviews
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
              {approvedCount} Approved
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/70">
              {featuredCount} Featured on Home
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified corporate client ratings & testimonials published on the Brothers Furniture landing app
          </p>
        </div>

        {/* Add Review Button */}
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Review</span>
        </button>
      </div>

      {/* 2. Compact Filter Tabs & View Switcher */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-2.5 sm:p-3 shadow-xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Quick Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 max-w-full">
            {[
              { id: 'all', label: `All (${testimonials.length})` },
              { id: 'approved', label: `Approved (${approvedCount})` },
              { id: '5', label: '★ 5 Stars' },
              { id: '4', label: '★ 4 Stars' },
              { id: 'pending', label: `Pending (${testimonials.length - approvedCount})` },
            ].map((tab) => {
              const isSelected = ratingFilter === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setRatingFilter(tab.id as any)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                      : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* View Mode Switcher (Table vs Cards) */}
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

        {/* Active Search & Filters Chip */}
        {(ratingFilter !== 'all' || searchQuery) && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1 border-t border-slate-100 flex-wrap">
            <span className="font-medium text-[11px] text-slate-400">Filters:</span>
            {ratingFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200 text-[11px] font-semibold">
                Filter: {ratingFilter}
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium font-mono">
                Keyword: "{searchQuery}"
              </span>
            )}
            <button
              onClick={() => {
                setRatingFilter('all')
                setSearchQuery('')
              }}
              className="text-[11px] text-orange-600 hover:text-orange-700 font-semibold cursor-pointer ml-1 inline-flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Clear filters
            </button>
          </div>
        )}
      </div>

      {/* 3. Main Data Container: Table or Cards */}
      {filteredTestimonials.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center space-y-3 shadow-xs">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
          <h4 className="text-sm sm:text-base font-bold text-slate-900">No reviews found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No reviews matched the current filter criteria or search keyword.
          </p>
          <button
            onClick={() => {
              setRatingFilter('all')
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
            <table className="w-full text-left border-collapse min-w-[860px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3.5">Client & Company</th>
                  <th className="py-2.5 px-3.5">Rating</th>
                  <th className="py-2.5 px-3.5">Review / Testimonial</th>
                  <th className="py-2.5 px-3.5">Status</th>
                  <th className="py-2.5 px-3.5 text-center">Featured</th>
                  <th className="py-2.5 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredTestimonials.map((review) => (
                  <tr
                    key={review.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Client & Company */}
                    <td className="py-2 px-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-orange-100 text-[#EA580C] font-bold text-xs flex items-center justify-center shrink-0">
                          {review.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 text-xs sm:text-[13px] block truncate">
                            {review.name}
                          </span>
                          <span className="text-[11px] text-slate-500 block truncate">
                            {review.role} · <strong className="text-slate-700 font-medium">{review.company}</strong>
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Star Rating */}
                    <td className="py-2 px-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                            }`}
                          />
                        ))}
                        <span className="text-[11px] font-mono font-bold text-slate-700 ml-1">
                          {review.rating}.0
                        </span>
                      </div>
                    </td>

                    {/* Review Quote */}
                    <td className="py-2 px-3.5">
                      <p className="text-slate-600 text-[11.5px] line-clamp-2 max-w-md italic leading-relaxed">
                        "{review.quote}"
                      </p>
                    </td>

                    {/* Approval Status Toggle */}
                    <td className="py-2 px-3.5 whitespace-nowrap">
                      <button
                        onClick={() => updateTestimonial(review.id, { approved: !review.approved })}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                          review.approved
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                        title="Click to toggle live approval"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            review.approved ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        <span>{review.approved ? 'Approved' : 'Pending'}</span>
                      </button>
                    </td>

                    {/* Featured Toggle */}
                    <td className="py-2 px-3.5 text-center whitespace-nowrap">
                      <button
                        onClick={() => updateTestimonial(review.id, { featured: !review.featured })}
                        className={`p-1 rounded-md transition-colors cursor-pointer inline-flex items-center justify-center ${
                          review.featured
                            ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
                            : 'text-slate-300 hover:text-slate-400 hover:bg-slate-100'
                        }`}
                        title={review.featured ? 'Featured on landing page' : 'Not featured'}
                      >
                        <Star className={`w-3.5 h-3.5 ${review.featured ? 'fill-amber-400' : ''}`} />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-2 px-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => updateTestimonial(review.id, { approved: !review.approved })}
                          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                            review.approved
                              ? 'text-emerald-600 hover:bg-emerald-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-slate-100'
                          }`}
                          title="Toggle Approval"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(review)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 rounded-md hover:bg-amber-50 transition-colors cursor-pointer"
                          title="Edit Review"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteReview(review)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Review"
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
              Showing <strong className="text-slate-700 font-semibold">{filteredTestimonials.length}</strong> of{' '}
              <strong className="text-slate-700 font-semibold">{testimonials.length}</strong> client reviews
            </span>
            <span className="text-[11px] text-slate-400">
              Approved reviews are synced to live landing page carousel
            </span>
          </div>
        </div>
      ) : (
        /* COMPACT CARD VIEW (CLEAN WHITE CARDS) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredTestimonials.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all space-y-3 flex flex-col justify-between group"
            >
              <div className="space-y-2.5">
                {/* Rating & Badges */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                        }`}
                      />
                    ))}
                    <span className="text-xs font-mono font-bold text-slate-800 ml-1">
                      {review.rating}.0
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateTestimonial(review.id, { approved: !review.approved })}
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border cursor-pointer ${
                        review.approved
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {review.approved ? 'Approved' : 'Pending'}
                    </button>
                    {review.featured && (
                      <span className="p-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Quote */}
                <div className="relative pl-5 text-slate-700 text-xs sm:text-[12.5px] leading-relaxed italic">
                  <Quote className="w-3.5 h-3.5 text-orange-400 absolute left-0 top-0.5" />
                  "{review.quote}"
                </div>
              </div>

              {/* Author Info & Actions */}
              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-orange-100 text-[#EA580C] font-bold text-xs flex items-center justify-center shrink-0">
                    {review.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 tracking-tight truncate">
                      {review.name}
                    </h4>
                    <p className="text-[10.5px] text-slate-500 truncate">
                      {review.role} · <strong className="text-slate-700 font-medium">{review.company}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    onClick={() => updateTestimonial(review.id, { approved: !review.approved })}
                    className={`p-1 rounded transition-colors cursor-pointer ${
                      review.approved
                        ? 'text-emerald-600 hover:bg-emerald-50'
                        : 'text-slate-400 hover:text-emerald-600 hover:bg-slate-100'
                    }`}
                    title="Toggle Approval"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(review)}
                    className="p-1 text-slate-400 hover:text-amber-600 rounded hover:bg-amber-50 transition-colors cursor-pointer"
                    title="Edit Review"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteReview(review)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete Review"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Add / Edit Review Modal (Clean Light Theme) */}
      <Modal
        isOpen={isAddModalOpen || editingTestimonial !== null}
        onClose={() => {
          setIsAddModalOpen(false)
          setEditingTestimonial(null)
        }}
        title={editingTestimonial ? `Edit Review: ${editingTestimonial.name}` : 'Add Client Review'}
        subtitle="Customer reviews shown on landing homepage"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Client Full Name <span className="text-orange-500">*</span>
              </label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Anand Ramanathan"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Company / Organization <span className="text-orange-500">*</span>
              </label>
              <input
                required
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="e.g. TechVantage Solutions"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Client Role / Designation
              </label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="e.g. VP Workplace Experience"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Star Rating (1-5)</label>
              <select
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition"
              >
                <option value={5}>5 Stars (Exceptional)</option>
                <option value={4}>4 Stars (Very Good)</option>
                <option value={3}>3 Stars (Average)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Client Testimonial Quote <span className="text-orange-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={formData.quote}
              onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
              placeholder="Detailed customer feedback regarding workstation quality, delivery speed, and CAD planning..."
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={formData.approved}
                onChange={(e) => setFormData({ ...formData, approved: e.target.checked })}
                className="rounded accent-orange-500 w-4 h-4 cursor-pointer"
              />
              <span>Approved for Website</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="rounded accent-orange-500 w-4 h-4 cursor-pointer"
              />
              <span>Featured on Homepage</span>
            </label>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false)
                setEditingTestimonial(null)
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
              <span>{editingTestimonial ? 'Update Review' : 'Save Review'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
