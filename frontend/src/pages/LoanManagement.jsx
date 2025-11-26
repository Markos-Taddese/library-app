 import{ useEffect, useState, useCallback } from 'react';
import DataTable from '../components/reusable/DataTable';
import ConfirmationModal from '../components/reusable/ConfirmationModal';
import { useToast } from '../hooks/useToast'; 
import { getActiveLoans, returnLoan, renewLoan, createLoan } from '../services/loanService';

// INTERNAL COMPONENT: Create Loan Modal 
const CreateLoanModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({ memberId: '', copyId: '' });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Borrow Book</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Member ID</label>
            <input 
              type="text" required 
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.memberId} 
              onChange={e => setFormData({...formData, memberId: e.target.value})} 
              placeholder="e.g. 1"
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700">Book Copy ID</label>
            <input 
              type="text" required 
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.copyId} 
              onChange={e => setFormData({...formData, copyId: e.target.value})} 
              placeholder="e.g. 5"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700 transition"
            >
              Confirm Loan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const LoanManagement = () => {
  const [activeLoans, setActiveLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null); 
  const { showToast } = useToast();

  const fetchLoans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getActiveLoans();
      
      // Normalization: Map backend snake_case to frontend camelCase
      const normalizedData = data.map(loan => ({
  ...loan,
  loanId: loan.loan_id,        
  bookTitle: loan.title,      
  memberName: loan.member_name, 
  loanDate: loan.loan_date ? new Date(loan.loan_date).toLocaleDateString() : 'N/A',
  dueDate: loan.due_date ? new Date(loan.due_date).toLocaleDateString() : 'N/A',
  rawDueDate: loan.due_date
}));

      setActiveLoans(normalizedData);
    } catch (err) {
      setError('Failed to fetch active loans. Check API connection.');
      showToast({ message: 'Failed to fetch active loans.', type: 'error' });
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);
  const handleCreateLoanSubmit = async (formData) => {
    setIsCreateModalOpen(false);
    setLoading(true);
    try {
        // Calls the service which sends { member_id, copy_id } to backend
        await createLoan(formData.memberId, formData.copyId);
        showToast({ message: 'Loan created successfully!', type: 'success' });
        fetchLoans(); // Refresh list
    } catch (err) {
        // Extract error message from backend response
        const msg = err.response?.data?.message || 'Failed to create loan. Check IDs.';
        showToast({ message: msg, type: 'error' });
        setLoading(false);
    }
  };

  const handleActionClick = (loan, action) => {
    setModalData({
      loanId: loan.loanId, 
      bookTitle: loan.bookTitle,
      action: action,
      title: action === 'return' ? 'Confirm Book Return' : 'Confirm Loan Renewal',
      message: action === 'return' 
        ? `Are you sure you want to return "${loan.bookTitle}"?`
        : `Are you sure you want to renew the loan for "${loan.bookTitle}"?`,
      confirmText: action === 'return' ? 'Process Return' : 'Renew Loan',
      isDestructive: action === 'return' 
    });
    setIsModalOpen(true);
  };

  const handleConfirmAction = async () => {
    setIsModalOpen(false);
    setLoading(true);
    
    if (!modalData) return;
    const { loanId, bookTitle, action } = modalData;

    try {
      if (action === 'return') {
        await returnLoan(loanId);
        showToast({ message: `Successfully returned: ${bookTitle}`, type: 'success' });
      } else if (action === 'renew') {
        await renewLoan(loanId);
        showToast({ message: `Successfully renewed loan for: ${bookTitle}`, type: 'success' });
      }
      
      setError(null); 
      fetchLoans(); 
    } catch (err) {
      const msg = err.response?.data?.message || `Loan ${action} failed. Check status or API.`;
      setError(msg); 
      showToast({ message: msg, type: 'error' });
      setLoading(false);
      console.error(err);
    }
  };
  
  const columns = [
    { header: 'Loan ID', key: 'loanId' },
    { header: 'Title', key: 'bookTitle' }, 
    { header: 'Member', key: 'memberName' },
    { header: 'Loan Date', key: 'loanDate' },
    { 
      header: 'Due Date', 
      key: 'dueDate', 
      render: (row) => {
        const isOverdue = new Date(row.rawDueDate) < new Date();
        return (
          <span className={`font-medium ${isOverdue ? 'text-red-600 font-bold' : 'text-gray-900'}`}>
            {row.dueDate} {isOverdue ? ' (OVERDUE)' : ''}
          </span>
        );
      }
    },
    { 
      header: 'Actions', 
      key: 'actions',
      render: (row) => (
        <div className="flex space-x-2">
            <button 
              onClick={() => handleActionClick(row, 'return')}
              className="px-3 py-1 bg-green-600 text-white rounded-md text-xs font-medium hover:bg-green-700 transition"
            >
              Return
            </button>
            <button 
              onClick={() => handleActionClick(row, 'renew')}
              className="px-3 py-1 bg-indigo-600 text-white rounded-md text-xs font-medium hover:bg-indigo-700 transition"
            >
              Renew
            </button>
        </div>
      )
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-extrabold text-gray-900">Active Loan Management</h2>
        {/* Button to open the manual borrow modal */}
        <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 shadow-md transition"
        >
            + Borrow Book
        </button>
      </div>

      {error && <div className="text-red-600 bg-red-100 p-4 rounded-lg mb-4 border border-red-200">{error}</div>}

      {loading && activeLoans.length === 0 ? (
        <div className="text-center p-10 text-indigo-700">Loading Active Loans...</div>
      ) : (
        <DataTable 
            data={activeLoans} 
            columns={columns} 
            title="Current Active Loans"
        />
      )}
      
      {/* Confirmation Modal for Return/Renew */}
      {modalData && (
        <ConfirmationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleConfirmAction}
          title={modalData.title}
          message={modalData.message}
          confirmText={modalData.confirmText}
          isDestructive={modalData.isDestructive}
        />
      )}

      {/* Create Loan Modal */}
      <CreateLoanModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateLoanSubmit}
      />
    </div>
  );
};

export default LoanManagement; 