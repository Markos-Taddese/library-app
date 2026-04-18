import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../hooks/useToast';
import DataTable from '../components/reusable/DataTable';
import ConfirmationModal from '../components/reusable/ConfirmationModal';
import FormModal from '../components/reusable/FormModal'; 
import authService from '../services/authService';
import { useAuth } from '../hooks/useAuth';

const StaffManagement = () => {
  const { showToast } = useToast();
  const {user: currentUser} =useAuth()
  // State
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // 'active', 'inactive', or ''

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, staffMember: null, action: '' });

  // Debounce logic for search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500); 
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load Staff (The Core Fetch/Search function)
  const loadStaff = useCallback(async (query = '', status = '') => {
    setLoading(true);
    try {
      // We pass both query and status to the service
      const data = await authService.searchUser(query, status);
      
      const normalizedData = data.map(staffMember => ({
        ...staffMember,
        userId: staffMember.user_id || staffMember.id,
        displayName: staffMember.username || 'N/A',
        userRole: staffMember.role || 'staff',
        isActive: Number(staffMember.is_active) === 1,
        joinedDate: staffMember.created_at ?new Date(staffMember.created_at).toLocaleDateString() : new Date()
      }));

      setStaff(normalizedData);
    } catch (err) {
      //  Prioritize specific backend messages 
      // over generic fallback text for better debugging and UX.
      const backendErrMsg = err.response?.data?.message;
      const displayError = backendErrMsg || "Failed to fetch staff directory.";
      showToast({ message: displayError, type: 'error' });
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  //Trigger load when Debounced Query or Status Filter changes
  useEffect(() => {
    loadStaff(debouncedQuery, statusFilter);
  }, [debouncedQuery, statusFilter, loadStaff]);

  // Actions
  const handleRegister = async (formData) => {
    try {
      await authService.registertUser(formData);
      showToast({ message: 'Staff member registered successfully', type: 'success' });
      setIsFormOpen(false);
      loadStaff(debouncedQuery, statusFilter);
    } catch (err) {
        const backendErrMsg = err.response?.data?.message;
      const displayError = backendErrMsg || "Registartion Failed.";
      showToast({ message: displayError, type: 'error' });
      throw err; 
    }
  };

  const executeStatusToggle = async () => {
    const { staffMember, action } = confirmModal;
    try {
      if (action === 'deactivate') {
        await authService.deactiveUser(staffMember.userId);
        showToast({ message: `${staffMember.displayName} deactivated.`, type: 'success' });
      } else {
        await authService.reactiveUser(staffMember.userId);
        showToast({ message: `${staffMember.displayName} reactivated.`, type: 'success' });
      }
      //Clear modal data before refreshing list to make sure the UI feels responsive.
      setConfirmModal({ isOpen: false, staffMember: null, action: '' });
      loadStaff(debouncedQuery, statusFilter);
    } catch (err) {
      showToast({ message: err.response?.data?.message || 'Action failed', type: 'error' });
    }
  };

  const columns = [
    { key: 'displayName', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'userRole', header: 'Role', render: (row) => <span className="capitalize">{row.userRole}</span> },
    { 
      key: 'isActive', 
      header: 'Status', 
      render: (row) => (
        <span className={`inline-block w-[72px] text-center px-2 py-1 text-xs font-medium rounded-md border border-transparent ${
          row.isActive ? 'bg-slate-100 text-green-700 dark:bg-slate-800 dark:text-green-700 dark:border-slate-700 ' : 'bg-slate-50 text-slate-400 dark:bg-transparent dark:text-slate-600 dark:border-slate-700 '
        }`}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
{ key: 'joinedDate', header: 'Joined' },

{
    key: 'actions',
    header: 'Actions',
    render: (row) => {
const currentUserId = currentUser?.id || currentUser?.user_id;
//string comparison to see if this row belongs to the person looking at it
const isMe = String(row.userId) === String(currentUserId);
const isAdmin = currentUser?.role === 'admin';
      if (isMe && isAdmin) {
        return (
          <span className="text-slate-400 text-xs italic font-medium">
            Logged in (You)
          </span>
        );
      }

return (
  <button
  onClick={() => setConfirmModal({ 
    isOpen: true, 
    staffMember: row, 
    action: row.isActive ? 'deactivate' : 'reactivate' 
  })}
  className={`text-sm font-semibold text-slate-900 dark:text-slate-400 transition-colors ${
    row.isActive ? "hover:text-red-600 dark:hover:text-red-500" : "hover:text-emerald-600 dark:hover:text-emerald-500 "
  }`}
>
  {row.isActive ? 'Deactivate' : 'Reactivate'}
</button>
      );
    }
  }
  ];

return (
  <div>
    {/* Header*/}
    <div className="mb-6">
      <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
        Staff Management
      </h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
        System Access Control & Registry
      </p>
    </div>

  <div className="mb-6 flex flex-col sm:flex-row gap-4">
     {/* Search Bar */}
      <input 
        type="text" 
        placeholder="Search registry..." 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full sm:flex-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-600 focus:border-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
      />
      
  <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
    {/* Status Filter */}
    <select
     value={statusFilter}
     onChange={(e) => setStatusFilter(e.target.value)}
      className="p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white cursor-pointer w-full sm:w-auto"
     >
     <option value="">All Statuses</option>
     <option value="active">Active</option>
     <option value="inactive">Inactive</option>
    </select>

        {/* Add Button*/}
   <button
     onClick={() => setIsFormOpen(true)} 
    className="bg-gray-900 text-white px-4 py-3 rounded-md hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-800 font-medium w-full sm:w-auto flex-shrink-0 transition-colors"
        >
       + Add Personnel
        </button>
      </div>
    </div>

 {loading && staff.length === 0 ? (
  <div className="text-center p-10 text-black-600 dark:text-white">Loading Staff...</div>
    ) : (
      <DataTable 
        columns={columns} 
        data={staff} 
        isLoading={loading} 
        title="Staff Registry" 
      />
    )}

  <FormModal
    isOpen={isFormOpen} 
    onClose={() => setIsFormOpen(false)} 
    onSubmit={handleRegister} 
    title="Register New Personnel" 
    fields={[
      { name: 'username', label: 'Username', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'password', label: 'Temp Password', type: 'password', required: true },
      { name: 'role', label: 'Role', type: 'select', options: [{ value: 'staff', label: 'Staff' }, { value: 'member', label: 'Member' }], required: true }
      ]} 
    />

  <ConfirmationModal 
      isOpen={confirmModal.isOpen} 
      onClose={() => setConfirmModal({ isOpen: false, staffMember: null, action: '' })}
      onConfirm={executeStatusToggle}
      title={`Confirm ${confirmModal.action}`}
      message={`Are you sure you want to ${confirmModal.action} ${confirmModal.staffMember?.displayName}?`}
      confirmText="Confirm Action"
      isDestructive={confirmModal.action === 'deactivate'}
    />
  </div>
);
};

export default StaffManagement;