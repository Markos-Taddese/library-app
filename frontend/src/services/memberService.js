import apiClient from './apiClient'; 

const extractMemberArray = (response) => {
    if (response.data && Array.isArray(response.data.members)) {
        return response.data.members;
    }
    return [];
};

export const getMembers = async () => {
  const response = await apiClient.get('/members/all');
  return extractMemberArray(response);
};

export const searchMembers = async (query) => {
  const response = await apiClient.get(`/members/search?search=${encodeURIComponent(query)}`);
  return extractMemberArray(response);
};

export const deactivateMember = async (memberId) => {
  const response = await apiClient.delete(`/members/${memberId}`);
  return response.data;
};

export const updateMember = async (memberId, data) => {
    const response = await apiClient.put(`/members/${memberId}`, data);
    return response.data;
};

export const addMember = async (data) => {
    const response = await apiClient.post('/members', data); 
    return response.data;
};