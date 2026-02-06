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
export const searchBooks = async (query,available = false) => {
  let url = `/books/search?search=${encodeURIComponent(query)}`;
  // only add 'available' parameter when checkbox is checked
  // when unchecked: don't send parameter → backend sees undefined → false
  // when checked: send 'available=true' → backend sees string "true" → truthy
  if(available) url +='&available=true';
  const response= await apiClient.get(url)
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
const history=response.data.history
//do manual array checking since extaract array function is never used here
    return Array.isArray(history)?history : [];
};
