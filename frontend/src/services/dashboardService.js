import apiClient from './apiClient';
export const getBookStats = async () => {
  try {
    const response = await apiClient.get('/books/stats');
    const backendData = response.data;
   return { 
        totalUniqueBooks: backendData.total_unique_books ,
        totalAvailableCopies: backendData.total_available_copies ,
    };
  } catch (error) {
    console.error('Error fetching book stats:', error);
    return null; //return null instead of fallback '0' to handel error propery
  }
};
export const getActiveLoanCount = async () => {
  try {
    const response = await apiClient.get('/loans/active');
    return response.data.active_loans.length ;// relying on backend data entirely and remove the fallback
  } catch (error) {
    console.error('Error fetching loan count:', error);
    return null;
  }
};
export const getMemberCount = async () => {
  try {
    const response = await apiClient.get('/members/stats');
    return response.data.total_active_members;
  } catch (error) {
    console.error('Error fetching member stats:', error);
    return null;
  }
};
export const getOverdueMembers = async () => {
  try {
    const response = await apiClient.get('/loans/overdue/members');
    return response.data.history;
    
  } catch (error) {
    console.error('Error fetching overdue members:', error);
    //retrun null instead of empty array to handle error properly 
    //instead of showing a success even when erro happens
    return null; 
  }
};
export const getOverdueLoansCount = async () => {
  try {
    const response = await apiClient.get('/loans/overdue');
    return response.data.count;
  } catch (error) {
    console.error('Error fetching overdue count:', error);
    return null;
  }
};
