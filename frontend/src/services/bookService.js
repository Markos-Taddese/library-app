import apiClient from './apiClient';
const extractBookArray = (response) => {
    if (response.data && Array.isArray(response.data.books)) {
        return response.data.books;
    }
    // Fallback: sometimes backend might return the array directly in data
    if (Array.isArray(response.data)) {
        return response.data;
    }
    return [];
};

/**
 * Fetches all book titles/copies.
 * Endpoint: GET /books/all
 */
export const getBooks = async () => {
  const response = await apiClient.get('/books/all');
  return extractBookArray(response);
};

/**
 * Performs a book search.
 * Endpoint: GET /books/search?search=query
 */
export const searchBooks = async (query) => {
  const response = await apiClient.get(`/books/search?search=${encodeURIComponent(query)}`);
  return extractBookArray(response);
};

/**
 * Deletes a specific book copy.
 * Endpoint: DELETE /books/:id
 */
export const deleteBookCopy = async (copyId) => {
    const response = await apiClient.delete(`/books/${copyId}`); 
    return response.data;
};

/**
 * Updates a book's metadata.
 * Endpoint: PUT /books/:id
 */
export const updateBook = async (bookId, data) => {
    const response = await apiClient.put(`/books/${bookId}`, data);
    return response.data; 
};

/**
 * Adds a new book.
 * Endpoint: POST /books
 */
export const addNewBook = async (data) => {
    const response = await apiClient.post('/books', data);
    return response.data;
};