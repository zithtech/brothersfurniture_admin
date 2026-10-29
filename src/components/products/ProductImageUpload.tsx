import React, { useState, useRef } from 'react'
import {
  Upload,
  X,
  Star,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
  Link as LinkIcon,
} from 'lucide-react'
import { api } from '../../services/api'

export interface UploadedImageItem {
  id: string
  url: string
  r2Key?: string
  isPrimary: boolean
  sortOrder: number
  isUploading?: boolean
  error?: string
  originalName?: string
}

interface ProductImageUploadProps {
  productId?: string
  images: UploadedImageItem[]
  onChange: (images: UploadedImageItem[]) => void
  disabled?: boolean
  maxImages?: number
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE_MB = 10
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

const PRESETS = [
  { label: 'Workstation Linear', url: '/products/workstations/orbit-workstation.webp' },
  { label: 'Cubicle 4-Way', url: '/products/workstations/quad-cubicle.webp' },
  { label: 'Executive High-Back', url: '/products/ergonomic/mystic-hb.webp' },
  { label: 'Mesh Task Chair', url: '/products/ergonomic/mystic-mesh.webp' },
  { label: 'Conference Table', url: '/products/meeting-tables/boardroom-table.webp' },
  { label: 'Mobile Pedestal', url: '/products/storage/mobile-pedestal.webp' },
]

export const ProductImageUpload: React.FC<ProductImageUploadProps> = ({
  productId,
  images,
  onChange,
  disabled = false,
  maxImages = 10,
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploadingAny, setIsUploadingAny] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const replaceInputRef = useRef<HTMLInputElement>(null)
  const [replacingImageId, setReplacingImageId] = useState<string | null>(null)

  // Clear error message after 6 seconds
  const setError = (msg: string) => {
    setErrorMessage(msg)
    setTimeout(() => setErrorMessage(null), 6000)
  }

  // Validate a single file
  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `"${file.name}" has invalid format. Only JPEG, PNG, and WebP are allowed.`
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `"${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB size limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`
    }
    return null
  }

  // Handle uploading one or more files to Cloudflare R2
  const handleUploadFiles = async (files: File[]) => {
    if (disabled || files.length === 0) return

    if (images.length + files.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed per product. You can add ${Math.max(0, maxImages - images.length)} more.`)
      return
    }

    // Validate all files
    for (const f of files) {
      const err = validateFile(f)
      if (err) {
        setError(err)
        return
      }
    }

    setErrorMessage(null)
    setIsUploadingAny(true)

    // Create temporary optimistic items with loading states
    const tempItems: UploadedImageItem[] = files.map((f, idx) => ({
      id: 'temp-' + Date.now() + '-' + idx,
      url: URL.createObjectURL(f),
      isPrimary: images.length === 0 && idx === 0,
      sortOrder: images.length + idx,
      isUploading: true,
      originalName: f.name,
    }))

    const nextImages = [...images, ...tempItems]
    onChange(nextImages)

    try {
      if (files.length === 1) {
        // Single file upload
        const res = await api.uploadImage(files[0], productId)
        if (res.success && res.data) {
          const finalItem: UploadedImageItem = {
            id: 'img-' + Date.now(),
            url: res.data.url,
            r2Key: res.data.key,
            isPrimary: images.length === 0,
            sortOrder: images.length,
            isUploading: false,
            originalName: res.data.originalName,
          }
          onChange([...images, finalItem])
        }
      } else {
        // Multi-file batch upload
        const res = await api.uploadImages(files, productId)
        if (res.success && res.data) {
          const uploadedItems: UploadedImageItem[] = res.data.map((item, idx) => ({
            id: 'img-' + Date.now() + '-' + idx,
            url: item.url,
            r2Key: item.key,
            isPrimary: images.length === 0 && idx === 0,
            sortOrder: images.length + idx,
            isUploading: false,
            originalName: item.originalName,
          }))
          onChange([...images, ...uploadedItems])
        }
      }
    } catch (err: any) {
      console.error('Upload failed:', err)
      setError(err.message || 'Image upload to Cloudflare R2 failed. Please check connection and retry.')
      // Remove temporary items on failure
      onChange(images)
    } finally {
      setIsUploadingAny(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Handle replacing a specific image
  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !replacingImageId) return

    const err = validateFile(file)
    if (err) {
      setError(err)
      return
    }

    setErrorMessage(null)
    setIsUploadingAny(true)

    const targetIdx = images.findIndex((img) => img.id === replacingImageId)
    if (targetIdx === -1) {
      setIsUploadingAny(false)
      return
    }

    const oldItem = images[targetIdx]
    const updated = [...images]
    updated[targetIdx] = { ...oldItem, isUploading: true }
    onChange(updated)

    try {
      const res = await api.uploadImage(file, productId)
      if (res.success && res.data) {
        // Attempt to cleanup old R2 object if it had a key
        if (oldItem.r2Key) {
          api.deleteImage({ key: oldItem.r2Key, productId }).catch((delErr) => {
            console.warn('Failed to cleanup replaced image in R2:', delErr)
          })
        }

        const replacedItem: UploadedImageItem = {
          ...oldItem,
          url: res.data.url,
          r2Key: res.data.key,
          isUploading: false,
          originalName: res.data.originalName,
        }
        updated[targetIdx] = replacedItem
        onChange(updated)
      }
    } catch (error: any) {
      console.error('Replace failed:', error)
      setError(error.message || 'Failed to replace image')
      updated[targetIdx] = { ...oldItem, isUploading: false }
      onChange(updated)
    } finally {
      setIsUploadingAny(false)
      setReplacingImageId(null)
      if (replaceInputRef.current) {
        replaceInputRef.current.value = ''
      }
    }
  }

  // Set an image as primary hero image
  const setPrimary = (id: string) => {
    const updated = images.map((img) => ({
      ...img,
      isPrimary: img.id === id,
    }))
    // Move primary image to first position in array
    const primaryItem = updated.find((img) => img.isPrimary)
    const rest = updated.filter((img) => !img.isPrimary)
    const reordered = primaryItem ? [primaryItem, ...rest] : updated
    const final = reordered.map((img, idx) => ({ ...img, sortOrder: idx }))
    onChange(final)
  }

  // Remove image
  const removeImage = (id: string) => {
    const target = images.find((img) => img.id === id)
    if (!target) return

    // If deleting from R2
    if (target.r2Key) {
      api.deleteImage({ key: target.r2Key, productId }).catch((err) => {
        console.warn('Background delete from R2 note:', err)
      })
    }

    const filtered = images.filter((img) => img.id !== id)
    // If the removed image was primary, set the new first image as primary
    if (target.isPrimary && filtered.length > 0) {
      filtered[0].isPrimary = true
    }
    const final = filtered.map((img, idx) => ({ ...img, sortOrder: idx }))
    onChange(final)
  }

  // Move image left (earlier in order)
  const moveImage = (index: number, direction: 'left' | 'right') => {
    const newIdx = direction === 'left' ? index - 1 : index + 1
    if (newIdx < 0 || newIdx >= images.length) return

    const copy = [...images]
    const temp = copy[index]
    copy[index] = copy[newIdx]
    copy[newIdx] = temp

    // Reassign sort orders
    const final = copy.map((img, idx) => ({ ...img, sortOrder: idx }))
    onChange(final)
  }

  // Add custom URL / Preset
  const handleAddUrl = (url: string) => {
    const trimmed = url.trim()
    if (!trimmed) return

    const newItem: UploadedImageItem = {
      id: 'img-' + Date.now(),
      url: trimmed,
      isPrimary: images.length === 0,
      sortOrder: images.length,
    }
    onChange([...images, newItem])
    setUrlInput('')
    setShowUrlInput(false)
  }

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (disabled) return

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files)
      handleUploadFiles(filesArray)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <span>Product Images & Media</span>
          <span className="text-[11px] font-normal text-slate-400">
            ({images.length}/{maxImages})
          </span>
          {images.length === 0 && <span className="text-orange-500">*</span>}
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 transition cursor-pointer"
          >
            <LinkIcon className="w-3 h-3" />
            <span>{showUrlInput ? 'Hide URL input' : 'Paste Image URL'}</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-xs animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span className="flex-1">{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-rose-700 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* URL Input Bar */}
      {showUrlInput && (
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
          <input
            type="text"
            placeholder="Paste public image URL (e.g. https://... or /products/...)"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="flex-1 bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-orange-500"
          />
          <button
            type="button"
            onClick={() => handleAddUrl(urlInput)}
            disabled={!urlInput.trim()}
            className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-md text-xs font-semibold transition cursor-pointer"
          >
            Add Image
          </button>
        </div>
      )}

      {/* Drag & Drop Upload Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!disabled && !isUploadingAny && fileInputRef.current) {
            fileInputRef.current.click()
          }
        }}
        className={`relative border-2 border-dashed rounded-xl p-4 sm:p-5 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-orange-500 bg-orange-50/70 scale-[0.99]'
            : 'border-slate-200/90 hover:border-orange-400 bg-slate-50/60 hover:bg-orange-50/20'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={disabled || isUploadingAny}
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleUploadFiles(Array.from(e.target.files))
            }
          }}
        />

        <div className="flex flex-col items-center justify-center gap-2">
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
              isDragging ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-600'
            }`}
          >
            {isUploadingAny ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-800">
              {isUploadingAny ? (
                <span className="text-orange-600 font-medium">
                  Uploading files to Cloudflare R2...
                </span>
              ) : (
                <>
                  <span className="text-orange-600 hover:underline">Click to browse</span> or drag and drop images here
                </>
              )}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              JPEG, PNG, or WebP • Up to {MAX_FILE_SIZE_MB}MB each • High-res transparent cutouts recommended
            </p>
          </div>
        </div>
      </div>

      {/* Hidden input for replace action */}
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleReplaceFile}
      />

      {/* Image Gallery Thumbnails Grid */}
      {images.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium px-0.5">
            <span>Uploaded Images ({images.length})</span>
            <span className="text-slate-400">First image or starred item serves as primary hero shot</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((item, index) => {
              const isPrimary = item.isPrimary || (index === 0 && !images.some((i) => i.isPrimary))

              return (
                <div
                  key={item.id}
                  className={`group relative rounded-xl border overflow-hidden bg-white shadow-2xs transition-all duration-200 flex flex-col ${
                    isPrimary
                      ? 'border-orange-500 ring-2 ring-orange-500/20 shadow-xs'
                      : 'border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  {/* Primary Badge */}
                  {isPrimary && (
                    <div className="absolute top-2 left-2 z-10 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                      <Star className="w-3 h-3 fill-white" />
                      <span>Primary</span>
                    </div>
                  )}

                  {/* Image Preview Box */}
                  <div className="relative aspect-square w-full bg-slate-50 flex items-center justify-center p-2 overflow-hidden">
                    {item.isUploading ? (
                      <div className="flex flex-col items-center gap-1.5 text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                        <span className="text-[10px]">Uploading...</span>
                      </div>
                    ) : item.url ? (
                      <img
                        src={item.url}
                        alt={item.originalName || `Product image ${index + 1}`}
                        className="max-h-full max-w-full object-contain mix-blend-multiply transition-transform duration-200 group-hover:scale-105"
                        onError={(e) => {
                          // Fallback icon on broken URL
                          (e.target as HTMLElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-300" />
                    )}

                    {/* Overlay Actions on Hover */}
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                      {/* Set Primary Button */}
                      {!isPrimary && (
                        <button
                          type="button"
                          onClick={() => setPrimary(item.id)}
                          title="Set as Primary Image"
                          className="p-1.5 bg-white/90 hover:bg-white text-slate-700 hover:text-orange-600 rounded-lg shadow-xs transition cursor-pointer"
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Replace Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setReplacingImageId(item.id)
                          replaceInputRef.current?.click()
                        }}
                        title="Replace this image"
                        className="p-1.5 bg-white/90 hover:bg-white text-slate-700 hover:text-blue-600 rounded-lg shadow-xs transition cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeImage(item.id)}
                        title="Remove image"
                        className="p-1.5 bg-white/90 hover:bg-white text-slate-700 hover:text-rose-600 rounded-lg shadow-xs transition cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Card Footer with Reorder Arrows */}
                  <div className="p-1.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="truncate max-w-[80px] text-[10px] text-slate-400">
                      {item.r2Key ? 'Cloudflare R2' : 'External'}
                    </span>
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveImage(index, 'left')}
                        title="Move left"
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 transition cursor-pointer"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={index === images.length - 1}
                        onClick={() => moveImage(index, 'right')}
                        title="Move right"
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 transition cursor-pointer"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick Presets */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[11px] text-slate-400">Sample Presets:</span>
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => handleAddUrl(preset.url)}
            className="text-[10.5px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200/80 transition cursor-pointer"
          >
            + {preset.label}
          </button>
        ))}
      </div>
    </div>
  )
}
