import apiClient from './apiClient';
export const getBookStats = async () => {
  try {
    const response = await apiClient.get('/books/stats');
    return response.data; // Expected: { totalUniqueBooks: N, totalAvailableCopies: N }
  } catch (error) {
    console.error('Error fetching book stats:', error);
    throw error;
  }
};

 // The plan uses GET /loans/active, but member count is needed too.
export const getLoanAndMemberStats = async () => {
  try {
  const loansResponse = await apiClient.get('/loans/active');
  const activeLoans = loansResponse.data.length;   
    const membersResponse = await apiClient.get('/members/stats');
    const totalActiveMembers = membersResponse.data.totalActiveMembers; 

    return { activeLoans, totalActiveMembers };
  } catch (error) {
    console.error('Error fetching loan and member stats:', error);
    throw error;
  }
};