import DataTable from './DataTable';

const HistoryModal = ({ isOpen, onClose, memberName, history }) => {
  if (!isOpen) return null;

  const columns = [
    { header: 'Book Title', key: 'title' },
    { header: 'Author', key: 'author_name' },
    { 
      header: 'Loan Date', 
      key: 'loan_date', 
      render: (row) => new Date(row.loan_date).toLocaleDateString() 
    },
    { 
      header: 'Return Date', 
      key: 'return_date',
      render: (row) => row.return_date ? new Date(row.return_date).toLocaleDateString() : 'Not Returned'
    },
    { 
        header: 'Status', 
        key: 'status',
        render: (row) => (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
              row.return_date 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
            }`}>
                {row.return_date ? 'Returned' : 'Active'}
            </span>
        )
    }
  ];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Loan History: {memberName}</h3>
            <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
        
        {history.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No loan history found for this member.</p>
        ) : (
            <DataTable 
                data={history} 
                columns={columns} 
                title="Loans"
            />
        )}
        
        <div className="mt-6 flex justify-end">
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-indigo-600 dark:bg-indigo-700 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-800 transition-colors duration-150"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;