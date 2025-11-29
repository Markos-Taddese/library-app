import apiClient from './apiClient';
export const getBookStats = async () => {
  try {
    const response = await apiClient.get('/books/stats');
    const backendData = response.data;
    
    return { 
        totalUniqueBooks: backendData.total_unique_books || 0,
        totalAvailableCopies: backendData.total_available_copies || 0,
    };
  } catch (error) {
    console.error('Error fetching book stats:', error);
    // Return default zeros if API fails
    return { totalUniqueBooks: 0, totalAvailableCopies: 0 };
  }
};
export const getActiveLoanCount = async () => {
  try {
    const response = await apiClient.get('/loans/active');
    const loans = response.data.active_loans || [];
    return loans.length;
  } catch (error) {
    console.error('Error fetching loan count:', error);
    return 0;
  }
};
export const getMemberCount = async () => {
  try {
    const response = await apiClient.get('/members/stats');
    return response.data.total_active_members || 0;
  } catch (error) {
    console.error('Error fetching member stats:', error);
    return 0;
  }
};
export const getOverdueMembers = async () => {
  try {
    const response = await apiClient.get('/loans/overdue/members');
    return response.data.history || [];
  } catch (error) {
    console.error('Error fetching overdue members:', error);
    return [];
  }
};
export const getOverdueLoansCount = async () => {
  try {
    const response = await apiClient.get('/loans/overdue');
    return response.data.count || 0;
  } catch (error) {
    console.error('Error fetching overdue count:', error);
    return 0;
  }
};
