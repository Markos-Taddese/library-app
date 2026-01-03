import { useEffect, useState, useCallback } from 'react';
import DataTable from '../components/reusable/DataTable';
import ConfirmationModal from '../components/reusable/ConfirmationModal';
import FormModal from '../components/reusable/FormModal'; 
import HistoryModal from '../components/reusable/HistoryModal';
import { useToast } from '../hooks/useToast'; 

import { 
    getBooks, 
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
 //  Use searchBooks if query exists, otherwise getBooks
 const data = query 
 ? await searchBooks(query) 
: await getBooks();
const normalizedData = data.map(book => ({
 ...book,
 bookId: book.book_id || book.bookId,
 authorName: book.author_name || book.authorName || book.author, 
publicationYear: book.publication_year || book.publicationYear || book.published_year,
 copyId: book.sample_copy_id || book.copy_id || book.copyId, // 
 availableCount: Number(book.available_copies || book.availableCount || 0),
 totalCopies: Number(book.total_copies || book.totalCopies || 1)
}));

setBooks(normalizedData);
 } catch (err) {
setError('Failed to fetch catalog data. Check API connection.');
 showToast({ message: 'Failed to fetch catalog data.', type: 'error' });
console.error(err);
} finally {
 setLoading(false);
}
 }, [showToast]);

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
          showToast({ message: 'Failed to fetch book loan history.', type: 'error' });
          console.error(err)
      } finally {
          setLoading(false);
      }
  };
 const handleDeleteClick = (book) => {
 let message = `Are you sure you want to delete the copy of "${book.title}"?`;
 let title = 'Confirm Copy Deletion';
 let isDestructive = false;

 if (book.totalCopies <= 1) { 
 message = (
 <p>
 <span className="font-bold text-red-600">WARNING: </span>
 Deleting this copy will also permanently remove the <span className="font-semibold">Book Title</span> and <span className="font-semibold">Author records</span> as it is the last copy. Are you sure?
 </p>
 );
 title = 'Confirm Cascading Deletion';
 isDestructive = true;
 }

 setModalData({
 copyId: book.copyId,
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
 const errMsg = err.response?.data?.message || 'Error deleting copy.';
 showToast({ message: errMsg, type: 'error' });
setError(errMsg);
setLoading(false);
 }
 };

 const handleEditClick = (book) => {
 setEditBookData({
 bookId: book.bookId, 
 copyId: book.copyId, 
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
 const errMsg = err.response?.data?.message || `Failed to ${action}. Check API or data.`;
showToast({ message: errMsg, type: 'error' });
 setError(errMsg);
 setLoading(false);
 console.error(err);
 }
 };

 const columns = [
{ header: 'Title', key: 'title' },
{ header: 'Author', key: 'authorName' },
{ header: 'Year', key: 'publicationYear' },
 { 
 header: 'Available Copies', 
 key: 'availableCount',
 render: (row) => (
 <span className={`font-semibold ${row.availableCount > 0 ? 'text-green-600' : 'text-red-600'}`}>
 {row.availableCount} / {row.totalCopies}
 </span>
 )
 },
 { 
header: 'Actions', 
 key: 'actions',
render: (row) => (
 <div className="flex space-x-2">
            {/* History Button */}
            <button 
                onClick={() => handleViewHistory(row)} 
                className="text-green-600 hover:text-green-900 text-xs font-medium"
                title="View Loan History"
            >
                History
            </button>
<button 
 onClick={() => handleEditClick(row)}
 className="text-indigo-600 hover:text-indigo-900 text-xs font-medium"
 >
 View/Edit
 </button>
 <button 
onClick={() => handleDeleteClick(row)} 
className="text-red-600 hover:text-red-900 text-xs font-medium"
 disabled={row.availableCount === 0} 
 title={row.availableCount === 0 ? "Cannot delete loaned copy" : "Delete Copy"}
>
 Delete Copy
 </button>
 </div>
)
},
];

 return (
<div>
 <h2 className="text-3xl font-extrabold dark:text-white text-gray-900 mb-6">Book Management</h2>

 {/* Search Bar always visible */}
 <div className="mb-6 flex space-x-4">
<input
 type="text"
 placeholder="Search by Title or Author..."
 value={searchQuery}
onChange={handleSearchChange}
 className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
/>
 <button 
 onClick={handleAddBookClick}
 className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
 >
 Add New Book
 </button> 
 </div>

 {error && <div className="text-red-600 bg-red-50 p-4 rounded-lg mb-4">{error}</div>}

{/* Conditional Loading for Table Only */}
{loading && books.length === 0 ? (
 <div className="text-center p-10 text-indigo-700">Loading Catalog...</div>
 ) : (
<DataTable 
 data={books} 
 columns={columns} 
 title="Books"
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