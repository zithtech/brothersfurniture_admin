import React, { useRef, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
} from 'lucide-react'
import { Modal } from '../../components/common/Modal'
import { customerApi } from '../../services/customerApi'

interface CustomerImportModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (count: number) => void
}

export const CustomerImportModal: React.FC<CustomerImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [parsedRows, setParsedRows] = useState<any[]>([])
  const [fileName, setFileName] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [resultMsg, setResultMsg] = useState<{ imported: number; skipped: number } | null>(null)

  const handleDownloadSampleCsv = () => {
    const csvHeader =
      'Company Name,Phone,Email,GSTIN,Category,Size,Contact Name,Contact Phone,Contact Email,Address Line 1,City,State,PIN Code\n'
    const sample1 =
      '"Metro Furnishing Studios","+91 98401 23456","orders@metrofurnishing.in","33AAACM1234K1Z2","Retailer","Medium","Ramesh Varma","+91 98401 23456","ramesh@metrofurnishing.in","14 Anna Salai","Chennai","Tamil Nadu","600002"\n'
    const sample2 =
      '"Apex Workspaces","+91 98802 34567","procure@apexworkspaces.com","29AAAAA1111A1Z1","Corporate","Large","Deepak Shenoy","+91 98802 34567","deepak@apexworkspaces.com","Indiranagar 100ft Road","Bengaluru","Karnataka","560038"\n'

    const blob = new Blob([csvHeader + sample1 + sample2], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'brothers_furniture_customers_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setErrorMsg('')
    setResultMsg(null)

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0)
        if (lines.length <= 1) {
          setErrorMsg('CSV file is empty or contains only header row.')
          return
        }

        const rows: any[] = []
        // Simple CSV parse supporting quotes
        for (let i = 1; i < lines.length; i++) {
          const raw = lines[i]
          const tokens: string[] = []
          let inQuote = false
          let cur = ''
          for (let j = 0; j < raw.length; j++) {
            const char = raw[j]
            if (char === '"') {
              inQuote = !inQuote
            } else if (char === ',' && !inQuote) {
              tokens.push(cur.trim())
              cur = ''
            } else {
              cur += char
            }
          }
          tokens.push(cur.trim())

          if (tokens[0]) {
            rows.push({
              companyName: tokens[0]?.replace(/^"|"$/g, ''),
              companyPhone: tokens[1]?.replace(/^"|"$/g, ''),
              companyEmail: tokens[2]?.replace(/^"|"$/g, '') || undefined,
              gstNumber: tokens[3]?.replace(/^"|"$/g, '') || undefined,
              category: tokens[4]?.replace(/^"|"$/g, '') || 'Corporate',
              companySize: tokens[5]?.replace(/^"|"$/g, '') || 'Medium',
              contactName: tokens[6]?.replace(/^"|"$/g, '') || undefined,
              contactPhone: tokens[7]?.replace(/^"|"$/g, '') || undefined,
              contactEmail: tokens[8]?.replace(/^"|"$/g, '') || undefined,
              addressLine1: tokens[9]?.replace(/^"|"$/g, '') || undefined,
              city: tokens[10]?.replace(/^"|"$/g, '') || 'Chennai',
              state: tokens[11]?.replace(/^"|"$/g, '') || 'Tamil Nadu',
              pinCode: tokens[12]?.replace(/^"|"$/g, '') || '',
            })
          }
        }

        setParsedRows(rows)
      } catch (err: any) {
        setErrorMsg('Error parsing file: ' + err.message)
      }
    }
    reader.readAsText(file)
  }

  const handleStartImport = async () => {
    if (parsedRows.length === 0) return
    setIsImporting(true)
    setErrorMsg('')

    try {
      const res = await customerApi.importCustomers(parsedRows)
      setResultMsg({ imported: res.importedCount, skipped: res.skippedCount })
      onSuccess(res.importedCount)
    } catch (err: any) {
      setErrorMsg(err.message || 'Import failed.')
    } finally {
      setIsImporting(false)
    }
  }

  const handleReset = () => {
    setParsedRows([])
    setFileName('')
    setErrorMsg('')
    setResultMsg(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bulk Customer Import"
      subtitle="Import multiple customer accounts, contacts and delivery sites from CSV/Excel"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-5">
        {/* Step 1: Download Template */}
        <div className="p-4 bg-orange-50/60 border border-orange-200/80 rounded-2xl flex items-center justify-between">
          <div>
            <h5 className="text-xs font-bold text-orange-950 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-orange-600" />
              Need the template format?
            </h5>
            <p className="text-[11px] text-orange-800/80 mt-0.5">
              Download our ready-made CSV template with sample data columns
            </p>
          </div>
          <button
            type="button"
            onClick={handleDownloadSampleCsv}
            className="px-3.5 py-1.5 bg-white border border-orange-300 text-orange-700 hover:bg-orange-100 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download Sample CSV
          </button>
        </div>

        {/* Step 2: Upload Area */}
        {parsedRows.length === 0 && !resultMsg ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-orange-500 bg-slate-50 hover:bg-orange-50/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center transition cursor-pointer group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-orange-500 group-hover:scale-110 flex items-center justify-center shadow-xs mb-3 transition">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">Click or drag & drop CSV file to upload</p>
            <p className="text-xs text-slate-500 mt-1">Supports standard CSV format with headers</p>
          </div>
        ) : null}

        {/* Success Result Banner */}
        {resultMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-900 text-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Import Completed Successfully!</p>
              <p className="mt-1">
                Successfully registered <strong>{resultMsg.imported}</strong> new customer accounts.{' '}
                {resultMsg.skipped > 0 && `(Skipped ${resultMsg.skipped} rows with duplicates or missing names)`}
              </p>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Preview Table */}
        {parsedRows.length > 0 && !resultMsg && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                Ready to Import: {parsedRows.length} customer records ({fileName})
              </span>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-slate-500 hover:text-rose-600 font-semibold cursor-pointer"
              >
                Change File
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl max-h-56 overflow-y-auto scrollbar-thin">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100/80 sticky top-0 border-b border-slate-200 text-slate-700">
                  <tr>
                    <th className="p-2.5 font-bold">#</th>
                    <th className="p-2.5 font-bold">Company Name</th>
                    <th className="p-2.5 font-bold">Phone</th>
                    <th className="p-2.5 font-bold">GSTIN</th>
                    <th className="p-2.5 font-bold">Category</th>
                    <th className="p-2.5 font-bold">City</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedRows.slice(0, 50).map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-2 text-slate-400 font-mono">{i + 1}</td>
                      <td className="p-2 font-semibold text-slate-800">{r.companyName}</td>
                      <td className="p-2 text-slate-600">{r.companyPhone}</td>
                      <td className="p-2 font-mono text-[11px] text-slate-600">{r.gstNumber || '—'}</td>
                      <td className="p-2 text-slate-600">{r.category}</td>
                      <td className="p-2 text-slate-600">{r.city}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsedRows.length > 50 && (
              <p className="text-[11px] text-slate-400 text-center">
                Showing first 50 rows of {parsedRows.length} items
              </p>
            )}
          </div>
        )}

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            {resultMsg ? 'Close' : 'Cancel'}
          </button>
          {parsedRows.length > 0 && !resultMsg && (
            <button
              type="button"
              onClick={handleStartImport}
              disabled={isImporting}
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Importing {parsedRows.length} records...</span>
                </>
              ) : (
                <span>Confirm & Import {parsedRows.length} Customers</span>
              )}
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}
