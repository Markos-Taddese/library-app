import { useEffect, useState, useCallback } from 'react';
import DataTable from '../components/reusable/DataTable';
import ConfirmationModal from '../components/reusable/ConfirmationModal';
import FormModal from '../components/reusable/FormModal'; 
import HistoryModal from '../components/reusable/HistoryModal';
import { useToast } from '../hooks/useToast'; 
import { 
    searchBooks, 
    deleteBookCopy, 
    updateBook, 
    addNewBook,
    getBookLoanHistory 
} from '../services/bookService'; 
const BookManagement = () => {
 const [books, setBooks] = useState([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);

 // Search States (Debounced)
 const [searchQuery, setSearchQuery] = useState('');
 const [debouncedQuery, setDebouncedQuery] = useState('');

 // Modal States
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [modalData, setModalData] = useState(null); 
 const [isFormModalOpen, setIsFormModalOpen] = useState(false);
 const [editBookData, setEditBookData] = useState(null); 
 const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
 const [currentHistory, setCurrentHistory] = useState([]);
 const [historyBookTitle, setHistoryBookTitle] = useState('');
 const [filterAvailableBook,setFilterAvailableBook]=useState(false)

 const { showToast } = useToast(); 
useEffect(() => {
 const timer = setTimeout(() => {
  setDebouncedQuery(searchQuery);
  }, 500); // Wait 500ms
    return () => clearTimeout(timer);
  }, [searchQuery]);
const loadBooks = useCallback(async (query = '') => {
  setLoading(true);
  setError(null);
  try {
    const data = await searchBooks(query || '', filterAvailableBook);
    const normalizedData = data.map(book => ({
      ...book,
       bookId: book.book_id,
       authorName: book.author_name, 
       publicationYear:book.published_year,
       copies: typeof book.copies_list === 'string' ? JSON.parse(book.copies_list) : book.copies_list,
       availableCount: Number(book.available_copies|| 0),
       totalCopies: Number(book.total_copies ||0),
       authorBookCount: Number(book.author_book_count|| 0)
        }
      ));
      setBooks(normalizedData);
    } catch (err) {
    const backendErrMsg=err.response?.data?.message;
    const displayError=backendErrMsg||"Failed to fetch catalog data."
      setError(displayError);
      showToast({ message: displayError, type: 'error' });
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterAvailableBook, showToast]);

 // Trigger load when DEBOUNCED query changes
 useEffect(() => {
 loadBooks(debouncedQuery);
 }, [debouncedQuery, loadBooks]);
const handleSearchChange = (e) => {
 setSearchQuery(e.target.value);
};
const handleAddBookClick = () => {
  setEditBookData({
isNew: true, 
title: '',
authorName: '',
publicationYear: new Date().getFullYear().toString(),
    });
    setIsFormModalOpen(true);
  };
const handleViewHistory = async (book) => {
  try {
    setLoading(true); 
    const historyData = await getBookLoanHistory(book.bookId);
    // Format data for reuse in HistoryModal
    const formattedHistory = historyData.map(loan => ({
      ...loan,
      title: `${loan.member_name} (Copy ID: ${loan.copy_id})`,
      author_name: `Member ID: ${loan.member_id}`,
      }));
      setCurrentHistory(formattedHistory);
      setHistoryBookTitle(book.title);
      setIsHistoryModalOpen(true);
    } catch (err) {
        const backendErrMsg=err.response?.data?.message;
        const displayError=backendErrMsg||'Failed to fetch book loan history.'
          showToast({ message: displayError, type: 'error' });
      console.error(err)
    } finally {
      setLoading(false);
    }
  };
// Now receives the specific copyId from the grid
const handleDeleteClick = (book, specificCopyId) => {
  let message = `Are you sure you want to delete Copy #${specificCopyId} of "${book.title}"?`;
  let title = 'Confirm Copy Deletion';
  let isDestructive = false;
  const isLastCopy = book.totalCopies <= 1;
  const isLastBookByAuthor = book.authorBookCount <= 1;
  if (isLastCopy) {
    title = 'Confirm Cascading Deletion';
    isDestructive = true;
    message = (
     <div className="flex flex-col gap-2">
      <p>
        <span className="font-bold text-red-600">WARNING: </span>
          Deleting this copy will remove the <span className="font-semibold">Book Title</span> as it is the last copy. Are you sure?
        </p>
    {/*  only shows this paragraph if the author count is <= 1 */}
        {isLastBookByAuthor && (
          <p className="font-semibold">
            This is also the last book by {book.authorName}. The Author record will be removed.
          </p>
        )}
      </div>
    );
  }
 setModalData({
    copyId: specificCopyId,
    title,
    message,
    isDestructive
  });
 setIsModalOpen(true);
};

const handleConfirmDelete = async () => {
  setIsModalOpen(false);
  setLoading(true);
  try {
    await deleteBookCopy(modalData.copyId);
    showToast({ message: `Book copy deleted successfully!`, type: 'success' });
    setError(null); 
    loadBooks(debouncedQuery); 
    } catch (err) {
 const backendErrMsg = err.response?.data?.message;
 const displayError=backendErrMsg || 'Error deleting copy.'
 showToast({ message: displayError, type: 'error' });
setError(displayError);
      setLoading(false);
    }
  };

const handleEditClick = (book) => {
  setEditBookData({
  bookId: book.bookId, 
// copyId: book.copyId,not necessary for current update system
 title: book.title,
 authorName: book.authorName,
 publicationYear: book.publicationYear 
    });
    setIsFormModalOpen(true);
  };
const handleFormSubmit = async (formData) => {
  setIsFormModalOpen(false);
  setLoading(true);
  setError(null);
// Read 'isNew' from state
const isNew = editBookData.isNew;
const bookId = formData.bookId;
try {
  if (isNew) {
    const addPayload = {
      title: formData.title,
      author: formData.authorName,
      published_year: formData.publicationYear 
       };
  await addNewBook(addPayload);
  showToast({ message: 'New Book added successfully!', type: 'success' });
   } else {
    const updatePayload = {
     title: formData.title,
      //Update uses 'author_name', Add uses 'author'. 
     //must match the backend's variable name exactly.
     author_name: formData.authorName, 
     // must match DB column name 'published_year' 
    // or the SQL UPDATE statement will fail.
     published_year: formData.publicationYear
     };
    await updateBook(bookId, updatePayload);
    showToast({ message: 'Book metadata updated successfully!', type: 'success' });
      }
      loadBooks(debouncedQuery); 
    } catch (err) {
            const action = isNew ? 'add new book' : 'update book metadata';
            const backendErrMsg = err.response?.data?.message;
            const displayError = backendErrMsg || `Failed to ${action}. Check API or data.`;
            showToast({ message: displayError, type: 'error' });
            setError(displayError);
            setLoading(false);
        }
    };

const handleQuickAddCopy = async (book) => {
    setLoading(true);
    setError(null);
    const addPayload = {
        title: book.title,
        author: book.authorName, // match backend variable 'author'
        published_year: book.publicationYear 
    };
    try {
        // Reuse the existed service
        await addNewBook(addPayload); 
        showToast({ message: `New copy of "${book.title}" added!`, type: 'success' });
        loadBooks(debouncedQuery); 
    } catch (err) {
        const backendErrMsg = err.response?.data?.message;
        setError(backendErrMsg || "Failed to add copy.");
        setLoading(false);
    }
};

//expand book copies
const renderCopiesExpansion = (book) => (
  <div className="py-4 px-4 sm:px-8 bg-gray-50/50 dark:bg-gray-800/50">
    <div className="flex justify-between items-center mb-3">
      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Inventory Units</h4>
      <button 
        onClick={(e) => { 
          e.stopPropagation(); 
          handleQuickAddCopy(book); 
        }}
        className="text-xs font-bold text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        ADD COPY
      </button>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
      {book.copies.map((copy) => {
        const isLoaned = copy.status !== 'available';
        return (
          <div 
            key={copy.copy_id} 
            className="p-2 bg-white dark:bg-gray-700 border border-zinc-200 dark:border-zinc-800 flex justify-between items-center group"
          >
            <div className="min-w-0">
              <p className="font-mono text-[11px] font-bold text-zinc-900 dark:text-zinc-100">
                #{copy.copy_id}
              </p>
              <p className={`text-[9px] uppercase font-bold leading-none mt-1 ${
                !isLoaned 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-amber-600 dark:text-amber-400 line-through'
              }`}>
                {copy.status}
              </p>
            </div>
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                handleDeleteClick(book, copy.copy_id); 
              }}
              disabled={isLoaned}
              className={`transition-opacity p-1 ${
                isLoaned 
                  ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' 
                  : 'text-gray-400 hover:text-red-600 dark:hover:text-red-400 lg:opacity-0 lg:group-hover:opacity-100'
              }`}
              title={isLoaned ? "Cannot delete loaned copy" : "Delete this copy"}
            >
              <span className="text-[12px]">✕</span>
            </button>
          </div>
        );
      })}
    </div>
  </div>
);

const columns = [
    { header: 'Title', key: 'title' },
    { header: 'Author', key: 'authorName' },
    { header: 'Year', key: 'publicationYear' },
    { 
      header: 'Available Copies', 
      key: 'availableCount',
      render: (row) => (
        <span className={`font-semibold ${row.availableCount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {row.availableCount} / {row.totalCopies}
        </span>
      )
    },
    { 
      header: 'Actions', 
      key: 'actions',
      render: (row) => (
        <div className="flex space-x-3">
          <button onClick={(e) => { e.stopPropagation(); handleViewHistory(row); }} className="text-gray-600 dark:text-gray-400 hover:text-zinc-900 dark:hover:text-white text-xs font-medium">History</button>
          <button onClick={(e) => { e.stopPropagation(); handleEditClick(row); }} className="text-gray-600 dark:text-gray-400 hover:text-zinc-900 dark:hover:text-white text-xs font-medium">Edit</button>
        </div>
      )
    },
  ];

  return (
    <div>
      <h2 className="text-3xl font-extrabold dark:text-white text-gray-900 mb-6">Book Management</h2>

{/* Search Bar always visible */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
  {/* Search input - full width on mobile, flex-1 on desktop */}
        <input
          type="text"
          placeholder="Search by Title or Author..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full sm:flex-1 p-2.5 border border-zinc-300 rounded dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-gray-600 focus:border-gray-600 transition-all text-sm"
        />
        
        <div className="flex flex-wrap items-center gap-4">
    {/* Filter checkbox - keeps label visible */}
          <label className="flex items-center space-x-2 flex-shrink-0">
            <input 
              type="checkbox" 
              checked={filterAvailableBook} 
              onChange={(e) => setFilterAvailableBook(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
            />
            <span className="text-sm font-medium dark:text-zinc-300 text-zinc-600">Available only</span>
          </label>
          
    {/* Add button - full width on mobile, auto width on desktop */}
          <button 
            onClick={handleAddBookClick}
            className="bg-gray-900 text-white dark:bg-gray-700 dark:hover:bg-gray-800 text-white px-4 py-2 rounded hover:opacity-90 w-full sm:w-auto font-medium text-xs uppercase tracking-widest transition-all"
          >
            Add New Book
          </button>
        </div>
      </div>

{error && <div className="text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 p-4 rounded-lg mb-4 font-medium">{error}</div>}

{/* Conditional Loading for Table Only */}
      {loading && books.length === 0 ? (
        <div className="text-center p-10 text-indigo-700 dark:text-indigo-400 font-medium animate-pulse">Loading Catalog...</div>
      ) : (
        <DataTable 
          data={books} 
          columns={columns} 
          title="Books"
          renderExpansion={renderCopiesExpansion} 
        />
      )}

      {modalData && (
        <ConfirmationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleConfirmDelete}
          title={modalData.title}
          message={modalData.message}
          confirmText="Yes, Delete Copy"
          isDestructive={modalData.isDestructive}
        />
      )}

      {isFormModalOpen && editBookData && (
        <FormModal
          key={editBookData.bookId || 'new'}
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          onSubmit={handleFormSubmit}
          title={editBookData.isNew ? "Add New Book" : "Edit Book Metadata"}
          initialData={editBookData}
          fields={[
// Only show bookId if NOT adding new
 !editBookData.isNew && { 
 name: 'bookId', 
label: 'Book ID (Read-only)', 
 type: 'text', 
readOnly: true 
},
{ name: 'title', label: 'Title', type: 'text', required: true },
{ name: 'authorName', label: 'Author Name', type: 'text', required: true },
{ name: 'publicationYear', label: 'Publication Year', type: 'number' },
  ].filter(Boolean)}
        />
      )}

      {/* RENDER HISTORY MODAL for Book Loans */}
      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        memberName={`Book: ${historyBookTitle}`} 
        history={currentHistory}
      />
    </div>
  );
};

export default BookManagement;