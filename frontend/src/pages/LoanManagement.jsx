import{ useEffect, useState, useCallback } from 'react';
import DataTable from '../components/reusable/DataTable';
import ConfirmationModal from '../components/reusable/ConfirmationModal';
import FormModal from '../components/reusable/FormModal';
import { useToast } from '../hooks/useToast'; 
import { getActiveLoans, returnLoan, renewLoan, createLoan,getOverdueLoans } from '../services/loanService';

const loanFields = [
  { name: 'memberId', label: 'Member ID', type: 'text', required: true, placeholder: 'e.g. 1' },
  { name: 'copyId', label: 'Book Copy ID', type: 'text', required: true, placeholder: 'e.g. 5' }
];

// --- MAIN COMPONENT ---
const LoanManagement = () => {
  const [activeLoans, setActiveLoans] = useState([]);
  const [overdueLoans, setOverdueLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('active');
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null); 

  const { showToast } = useToast();


  const fetchActiveLoans = useCallback(async (isSilent=false) => {
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
      if(!isSilent){
  setError('Failed to fetch active loans. Check API connection.');
      showToast({ message: 'Failed to fetch active loans.', type: 'error' });
      console.error('Error fetching active loans:', err);
      }
      throw err
    
    } finally {
      setLoading(false);
    }
  }, [showToast]);
  //  Fetch Overdue Loans
  const fetchOverdueLoans = useCallback(async (isSilent=false) => {
     setLoading(true);
    setError(null);
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
 if(!isSilent)   {
      console.error('Error fetching overdue loans:', err);
    showToast({ message: 'Failed to fetch overdue loans.', type: 'error' });
    setError('Error fetching overdue loans')}
    throw err
  }
  finally{
    setLoading(false)
  }
}, [showToast]);

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'active') {
     fetchActiveLoans().catch(() => {});
    } else if (activeTab === 'overdue') {
      fetchOverdueLoans().catch(()=>{});
    }
  }, [activeTab, fetchActiveLoans, fetchOverdueLoans]);
  const handleCreateLoanSubmit = async (formData) => {
    setIsFormModalOpen(false);
    setLoading(true);
    try {
        await createLoan(formData.memberId, formData.copyId);
        showToast({ message: 'Loan created successfully!', type: 'success' });
        setError(null);
    try {
      await fetchActiveLoans(true); 
    } catch (fetchErr) {
      // This catch runs only if fetchActiveLoans throws (it will, even in silent mode)
      setError("Loan created successfully, but failed to refresh the list. Please reload.");
      showToast({ message: "Refresh failed. Data might be stale.", type: 'warning' });
      console.error(fetchErr)
    }
    
    } catch (err) {
        const msg = err.response?.data?.message || 'Failed to create loan. Check IDs.';
        showToast({ message: msg, type: 'error' });
        setError(msg);
       }
    finally{
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
    try{  // Refresh the appropriate list based on current tab
    if (activeTab === 'active') {
      await fetchActiveLoans(true);
    } else {
      await fetchOverdueLoans(true); 
    }}
    catch (fetchErr) {
      // If we are here, the RETURN worked, but the REFRESH failed.
      setError("Action succeeded, but failed to refresh the list. Please reload.");
      showToast({ message: "Refresh failed. Data might be stale.", type: 'warning' });
       console.error(fetchErr)
    }
  } catch (actionErr) {
    //  This only runs if the RETURN/RENEW itself failed
    setError(`Loan ${action} failed. Check status or API.`); 
    showToast({ message: `Loan ${action} failed.`, type: 'error' });
    console.error(actionErr)
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
          <span className={`font-medium ${isOverdue ? 'text-red-600 font-bold ' : 'text-gray-900 dark:text-gray-300'}`}>
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
                disabled={new Date(row.rawDueDate) < new Date()}
  title={new Date(row.rawDueDate) < new Date() ? "Cannot renew - overdue" : "Renew Loan"}
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
              disabled={row.daysOverdue > 0} // disable renew if too overdue
              title={row.daysOverdue > 0 ? "Cannot renew - overdue" : "Renew Loan"}
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
            onClick={() => setIsFormModalOpen(true)}
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

      <FormModal
  isOpen={isFormModalOpen}
  onClose={() => setIsFormModalOpen(false)}
  onSubmit={handleCreateLoanSubmit}
  title="Borrow Book"
  fields={loanFields}
/>
    </div>
  );
};

export default LoanManagement;
