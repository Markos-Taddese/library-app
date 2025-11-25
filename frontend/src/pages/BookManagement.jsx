import { useEffect, useState } from 'react';
import DataTable from '../components/reusable/DataTable';
import ConfirmationModal from '../components/reusable/ConfirmationModal'; 
import { fetchBooks, deleteBookCopy, updateBook } from '../services/bookService';

const BookManagement = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  
  // State for Modal Management
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null); // Holds the copy to be deleted
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editBookData, setEditBookData] = useState(null);

  // Refactor fetchBooks function to use the new service
  const loadBooks = async (query = '') => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBooks(query);
      setBooks(data); 
    } catch (err) {
      setError('Failed to fetch catalog data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks(searchQuery);
  }, [searchQuery]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  const handleEditClick = (book) => {
    //  Critical: Pass the necessary data for the form, including the bookId
    setEditBookData({
      bookId: book.bookId, 
      title: book.title,
      authorName: book.authorName,
      publicationYear: book.publicationYear 
     
    });
    setIsFormModalOpen(true);
  };


  const handleDeleteClick = (book) => {
    // The plan requires a specific warning if deleting the last copy.
    let message = `Are you sure you want to delete the copy of "${book.title}"?`;
    let title = 'Confirm Copy Deletion';
    let isDestructive = false;

    if (book.totalCopies === 1) {
      //  SPECIAL WARNING: Cascading Deletion
      message = (
        <p>
          <span className="font-bold text-red-600">WARNING: </span>
          {/* Exact message required by the plan */}
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
      // Success: Clear the error and refresh the table
      setError(null); 
 
      loadBooks(searchQuery); 
    } catch (err) {
      // Handle API error during deletion
      setError('Error deleting copy. It may be currently loaned out or an API issue occurred.');
      setLoading(false);
      console.error(err);
    }
  };
  const handleFormSubmit = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      // Extract the ID and the data payload
      const { bookId, ...updatePayload } = formData;
      
      // Call the Smart Update API
      await updateBook(bookId, updatePayload); 
      
      // Success: Refresh the table data and show success message
      // just reload the data, for now
      loadBooks(searchQuery); 
      alert('Book metadata updated successfully!');
    } catch (err) {
      setError('Failed to update book metadata. Please check the data and try again.');
      console.error(err);
      setLoading(false);
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
        <span 
          className={`font-semibold ${row.availableCount > 0 ? 'text-green-600' : 'text-red-600'}`}
        >
          {row.availableCount} / {row.totalCopies}
        </span>
      )
    },
   { 
      header: 'Actions', 
      key: 'actions',
      render: (row) => (
        <div className="flex space-x-2">
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

  if (loading && books.length === 0) {
    return <div className="text-center p-10 text-indigo-700">Loading Catalog...</div>;
  }
  
  return (
    <div>
      <h2 className="text-3xl font-extrabold text-gray-900 mb-6">Catalog Management</h2>
      
      {/* Search Bar */}
      <div className="mb-6 flex space-x-4">
        <input
          type="text"
          placeholder="Search by Title or Author..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
        />
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">Add New Book/Copy</button> {/* Placeholder for next step */}
      </div>

      {error && <div className="text-red-600 bg-red-50 p-4 rounded-lg mb-4">{error}</div>}
      
      {/* Book Table */}
      <DataTable 
        data={books} 
        columns={columns} 
        title="Books"
      />
      
      {/* Confirmation Modal */}
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
          key={editBookData.bookId} 
          
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          onSubmit={handleFormSubmit}
          title="Edit Book Metadata"
          initialData={editBookData}
          fields={[

          ]}
        />
      )}
    </div>
  );
};

export default BookManagement;