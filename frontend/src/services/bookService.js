import apiClient from './apiClient';

/**
 * Fetches all book titles or performs a catalog search.
 * Endpoint: GET /books/all OR GET /books/search?search=query
 */
export const fetchBooks = async (query = '') => {
    const endpoint = query 
        ? `/books/search?search=${encodeURIComponent(query)}` 
        : '/books/all';
    
    const response = await apiClient.get(endpoint);
    return response.data;
};

/**
 * Deletes a specific book copy.
 * Endpoint: DELETE /books/:id (where :id is the copyId)
 */
export const deleteBookCopy = async (copyId) => {

    const response = await apiClient.delete(`/books/${copyId}`); 
    return response.data; // Confirmation message or success status
};
export const updateBook = async (bookId, data) => {
    // The 'data' object will contain title, publicationYear, and authorName.
    // The backend handles the transactional logic for authorName change.
    const response = await apiClient.put(`/books/${bookId}`, data);
    return response.data; 
};