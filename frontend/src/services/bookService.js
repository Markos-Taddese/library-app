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
export const getBooks = async () => {
  const response = await apiClient.get('/books/all');
  return extractBookArray(response);
};

export const searchBooks = async (query) => {
  const response = await apiClient.get(`/books/search?search=${encodeURIComponent(query)}`);
  return extractBookArray(response);
};

export const deleteBookCopy = async (copyId) => {
    const response = await apiClient.delete(`/books/${copyId}`); 
    return response.data;
};
export const updateBook = async (bookId, data) => {
    const response = await apiClient.put(`/books/${bookId}`, data);
    return response.data; 
};

export const addNewBook = async (data) => {
    const response = await apiClient.post('/books', data);
    return response.data;
};
export const getBookLoanHistory = async (bookId) => {
const response = await apiClient.get(`/loans/history/book/${bookId}`);
    return response.data.history || [];
};
