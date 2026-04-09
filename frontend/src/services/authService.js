import axios from 'axios';
import apiClient from './apiClient';
const baseURL = import.meta.env.VITE_API_BASE_URL;
const authService = {
  registerFirstUser : async (credentials) => {
    const response = await apiClient.post('/auth/sign/admin', credentials);
    return response.data;
  },

  registertUser : async (credentials) => {
    const response = await apiClient.post('/auth/sign/user', credentials);
    return response.data;
  },
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('refreshToken');

  if(refreshToken){
await apiClient.post('/auth/logout', { tokenToDelete: refreshToken });  }
     },
refreshToken: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }
try{    
   //if apiclient was used, the failure of getting the refreshtoken itself(401) would call the apiclient again and create infinte loop
   //using raw axios instead would prevent that 
    const response = await axios.post(`${baseURL}/auth/refresh-token`, { token: refreshToken });
    const { accessToken, newRefreshToken } = response.data;
    
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
     }
    if(newRefreshToken){
      localStorage.setItem('refreshToken', newRefreshToken);
    }
    return accessToken;}catch (error) {
    // If the refresh call fails (401), we clear everything
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    throw error; // Let the interceptor catch this to trigger logout
  }
  }, 
  changePassword : async (credentials) => {
    const response = await apiClient.put('/auth/update/password', credentials);
    return response.data;
},
 profileUpdate : async (data) => {
    const response = await apiClient.put(`/auth/update`, data);
    return response.data;
},
  getMyProfile: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
searchUser: async (query, status = '') => {
  // first start with the base search query, just like searchBooks
  let url = `/auth/search?search=${encodeURIComponent(query)}`;
  // then if a status is selected ('active' or 'inactive'), append it to the URL
  if (status) {
    url += `&status=${status}`;
  }
  const response = await apiClient.get(url);
  return response.data.users || [];
},
deactiveUser: async(userId)=>{
  const response=await apiClient.get(`/auth/deactivate/${userId}`)
  return response.data
},
reactiveUser: async(userId)=>{
  const response=await apiClient.get(`/auth/reactive/${userId}`)
  return response.data
},
  };
export default authService;