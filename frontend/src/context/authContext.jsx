import { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './auth';
import authService from '../services/authService';
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // The "Pause" button

  const logout = useCallback(async () => {
try{
  await authService.logout();
} finally{
  localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setLoading(false);
}
}, []);

useEffect(() => {
   const verifySession = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        setLoading(false);
        return;
      }//if the user isn't logged in yet, stop this function from further execution
 try {
  //Get fresh data from server
  const response = await authService.getMyProfile(); 
    setUser(response);
      } catch (err) {
        console.error(err)
      } finally {
    setLoading(false);
      }
    };
verifySession();
  }, []);

  const login =async (credentials) => {

  try{  const data = await authService.login(credentials);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    const userData=data.user
    setUser(userData);
    return data; //for must change password redirect
  } catch(error){
console.error(error)
  }
  };
   useEffect(() => {
  const handleExit = () => logout();
  window.addEventListener('auth-error', handleExit);//listen to the event from interceptor
  return () => window.removeEventListener('auth-error', handleExit);//and logout
}, [logout]);

  return (
    <AuthContext.Provider value={{ user,setUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};