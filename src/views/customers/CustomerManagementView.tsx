import React, { useState } from 'react'
import { CustomerDetailsView } from './CustomerDetailsView'
import { CustomerDrawer } from './CustomerDrawer'
import { CustomerImportModal } from './CustomerImportModal'
import { CustomerListView } from './CustomerListView'
import type { Customer } from '../../types/customer'
import { useAdmin } from '../../context/AdminContext'

export const CustomerManagementView: React.FC = () => {
  const { addToast } = useAdmin()

  // Selected customer for full-page details view
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null)

  // Import modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)

  // Refresh trigger counter to reload list
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleOpenAdd = () => {
    setCustomerToEdit(null)
    setIsDrawerOpen(true)
  }

  const handleOpenEdit = (customer: Customer) => {
    setCustomerToEdit(customer)
    setIsDrawerOpen(true)
  }

  const handleDrawerSuccess = (savedCustomer: Customer) => {
    addToast(
      'success',
      customerToEdit ? 'Customer Profile Updated' : 'Customer Registered',
      `"${savedCustomer.companyName}" (${savedCustomer.customerCode}) saved successfully.`
    )
    setRefreshTrigger((prev) => prev + 1)
  }

  const handleImportSuccess = (count: number) => {
    addToast('success', 'Import Completed', `${count} customers successfully added to directory.`)
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <div className="w-full">
      {selectedCustomerId ? (
        <CustomerDetailsView
          customerId={selectedCustomerId}
          onBack={() => {
            setSelectedCustomerId(null)
            setRefreshTrigger((prev) => prev + 1)
          }}
          onEdit={(customer) => handleOpenEdit(customer)}
          onCustomerUpdated={() => setRefreshTrigger((prev) => prev + 1)}
        />
      ) : (
        <CustomerListView
          onSelectCustomer={(customer) => setSelectedCustomerId(customer.id)}
          onAddCustomer={handleOpenAdd}
          onEditCustomer={handleOpenEdit}
          onOpenImport={() => setIsImportModalOpen(true)}
          refreshTrigger={refreshTrigger}
        />
      )}

      {/* Add / Edit Customer Right Drawer */}
      <CustomerDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        customerToEdit={customerToEdit}
        onSuccess={handleDrawerSuccess}
      />

      {/* Bulk CSV Import Modal */}
      <CustomerImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={handleImportSuccess}
      />
    </div>
  )
}
