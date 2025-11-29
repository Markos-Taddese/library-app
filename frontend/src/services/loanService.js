import apiClient from './apiClient';
export const getActiveLoans = async () => {
  try {
    const response = await apiClient.get('/loans/active');
    const loanArray = response.data.active_loans; 

    if (Array.isArray(loanArray)) {
        return loanArray;
    }
    return [];

  } catch (error) {
    console.error('Error fetching active loans:', error);
    throw error;
  }
};
export const getOverdueLoans = async () => {
  try {
    const response = await apiClient.get('/loans/overdue');
    const loanArray = response.data.history; 

    if (Array.isArray(loanArray)) {
        return loanArray;
    }

    // Fallback if empty or unexpected structure
    return [];

  } catch (error) {
    console.error('Error fetching overdue loans:', error);
    throw error;
  }
};
export const createLoan = async (memberId, copyId) => {
  try {
    const payload = {
      member_id: memberId,
      copy_id: copyId
    };
    const response = await apiClient.post('/loans', payload);
    return response.data;
  } catch (error) {
    console.error('Error creating loan:', error);
    throw error;
  }
};
export const returnLoan = async (loanId) => {
  try {
    const payload = { loan_id: loanId };
    const response = await apiClient.put(`/loans/return`, payload);
    return response.data;
  } catch (error) {
    console.error('Error returning loan:', error);
    throw error;
  }
};
export const renewLoan = async (loanId) => {
  try {
    const payload = { loan_id: loanId };
    const response = await apiClient.put(`/loans/renewal`, payload);
    return response.data;
  } catch (error) {
    console.error('Error renewing loan:', error);
    throw error;
  }
};
