import{ useEffect, useState, useCallback } from 'react';
import DataTable from '../components/reusable/DataTable';
import ConfirmationModal from '../components/reusable/ConfirmationModal';
import { useToast } from '../hooks/useToast'; 
import { getActiveLoans, returnLoan, renewLoan, createLoan,getOverdueLoans } from '../services/loanService';

const CreateLoanModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({ memberId: '', copyId: '' });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm p-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Borrow Book</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Member ID</label>
            <input 
              type="text" required 
              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              value={formData.memberId} 
              onChange={e => setFormData({...formData, memberId: e.target.value})} 
              placeholder="e.g. 1"
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Book Copy ID</label>
            <input 
              type="text" required 
              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              value={formData.copyId} 
              onChange={e => setFormData({...formData, copyId: e.target.value})} 
              placeholder="e.g. 5"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-150"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 transition-colors duration-150"
            >
              Confirm Loan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
const LoanManagement = () => {
  const [activeLoans, setActiveLoans] = useState([]);
  const [overdueLoans, setOverdueLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('active');
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null); 

  const { showToast } = useToast();


  const fetchActiveLoans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getActiveLoans();
      
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
  //  Fetch Overdue Loans
  const fetchOverdueLoans = useCallback(async () => {
  try {
    const data = await getOverdueLoans();
    
    const normalizedData = data.map(loan => ({
      ...loan,
      loanId: loan.loan_id,
      memberName: loan.member_name,
      bookTitle: loan.title,
      authorName: loan.author_name,
      dueDate: new Date(loan.due_date).toLocaleDateString(),
      daysOverdue: loan.days_overdue,
      rawDueDate: loan.due_date
    }));
    setOverdueLoans(normalizedData);
  } catch (err) {
    console.error('Error fetching overdue loans:', err);
    showToast({ message: 'Failed to fetch overdue loans.', type: 'error' });
  }
}, [showToast]);
useEffect(() => {
  fetchActiveLoans();
  fetchOverdueLoans(); 
}, [fetchActiveLoans, fetchOverdueLoans]);
  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'active') {
      fetchActiveLoans();
    } else if (activeTab === 'overdue') {
      fetchOverdueLoans();
    }
  }, [activeTab, fetchActiveLoans, fetchOverdueLoans]);
  const handleCreateLoanSubmit = async (formData) => {
    setIsCreateModalOpen(false);
    setLoading(true);
    try {
        await createLoan(formData.memberId, formData.copyId);
        showToast({ message: 'Loan created successfully!', type: 'success' });
        fetchActiveLoans(); // Refresh active loans
    } catch (err) {
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
    // Refresh the appropriate list based on current tab
    if (activeTab === 'active') {
      await fetchActiveLoans();
    } else {
      await fetchOverdueLoans(); 
    }
  } catch (err) {
    const msg = err.response?.data?.message || `Loan ${action} failed. Check status or API.`;
    setError(msg); 
    showToast({ message: msg, type: 'error' });
  } finally { //ensures loading always stops
    setLoading(false);
  }
};

  // Table Columns for Active Loans
  const activeColumns = [
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

  //Table Columns for Overdue Loans
  const overdueColumns = [
    { header: 'Loan ID', key: 'loanId' },
    { header: 'Member', key: 'memberName' },
    { header: 'Title', key: 'bookTitle' },
    { header: 'Author', key: 'authorName' },
    { header: 'Due Date', key: 'dueDate' },
    { 
      header: 'Days Overdue', 
      key: 'daysOverdue',
      render: (row) => (
        <span className="font-bold text-red-600">
          {row.daysOverdue} days
        </span>
      )
    },
    { 
      header: 'Actions', 
      key: 'actions',
      render: (row) => (
        <div className="flex space-x-2">
            <button 
              onClick={() => handleActionClick(row, 'return')}
              className="px-3 py-1 bg-red-600 text-white rounded-md text-xs font-medium hover:bg-red-700 transition"
            >
              Return
            </button>
            <button 
              onClick={() => handleActionClick(row, 'renew')}
              className="px-3 py-1 bg-orange-600 text-white rounded-md text-xs font-medium hover:bg-orange-700 transition"
              disabled={row.daysOverdue > 30} // disable renew if too overdue
              title={row.daysOverdue > 30 ? "Cannot renew - too overdue" : "Renew Loan"}
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
        <h2 className="text-3xl font-extrabold dark:text-white text-gray-900">Loan Management</h2>
        <div className="flex space-x-4">
          {/* Tab Navigation */}
          <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 rounded-md transition ${
                activeTab === 'active' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Active Loans ({activeLoans.length})
            </button>
            <button 
              onClick={() => setActiveTab('overdue')}
              className={`px-4 py-2 rounded-md transition ${
                activeTab === 'overdue' 
                  ? 'bg-white text-red-600 shadow-sm' 
                  : 'text-gray-600 hover:text-red-600'
              }`}
            >
              Overdue Loans ({overdueLoans.length})
            </button>
          </div>
          
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 shadow-md transition"
          >
            + Borrow Book
          </button>
        </div>
      </div>

      {error && <div className="text-red-600 bg-red-100 p-4 rounded-lg mb-4 border border-red-200">{error}</div>}

      {loading ? (
        <div className="text-center p-10 text-indigo-700">Loading {activeTab === 'active' ? 'Active' : 'Overdue'} Loans...</div>
      ) : (
        <>
          {activeTab === 'active' && (
            <DataTable 
              data={activeLoans} 
              columns={activeColumns} 
              title={`Current Active Loans (${activeLoans.length})`}
            />
          )}
          
          {activeTab === 'overdue' && (
            <DataTable 
              data={overdueLoans} 
              columns={overdueColumns} 
              title={`Overdue Loans - Requires Attention (${overdueLoans.length})`}
            />
          )}
        </>
      )}
      
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

      <CreateLoanModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateLoanSubmit}
      />
    </div>
  );
};

export default LoanManagement;
