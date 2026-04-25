import {  useState, useEffect } from 'react';
import authService from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ForcePasswordChange = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
const navigate=useNavigate()
const { user, setUser, loading } = useAuth();
useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not logged in? Go to login
        navigate('/login', { replace: true });
      } else if (!user.must_change_password) {
        // Already changed? Go to dashboard
        navigate('/', { replace: true });
      }
    }
  }, [user, loading, navigate]);
const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);
try {
    const data = await authService.changePassword({ newPassword, confirmPassword });
    // Update global AuthContext with the fresh user object from the server.
    // This ensures roles, names, and must_change_password: false are all synced
    setUser(data.user);
    // 'replace: true' prevents the user from navigating back to this form 
    // using the browser's back button.
    navigate('/', { replace: true });
} catch (err) {
    setError(err.response?.data?.message || "Update failed");
  } finally {
    setIsSubmitting(false);
  }
};
if (loading) return null;

return(
  <div className="flex h-screen items-center justify-center bg-slate-50">
    <div className="w-full max-w-md px-4">
    <div className="text-center mb-8">
      <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Secure Your Account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          This is your first login. Please set a new password to continue.
        </p>
      </div>
  <form className="bg-white p-8  shadow-sm border border-slate-200 space-y-6" onSubmit={handleSubmit}>
    {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 flex items-center">
          <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1">New Password</label>
      <input 
       type="password" 
       required
       className="w-full border border-slate-300 px-4 py-2 rounded-sm bg-white text-slate-900 placeholder-slate-400 focus:bg-slate-50 focus:ring-2 focus:ring-slate-600 focus:border-slate-600 sm:text-sm outline-none transition-all duration-200"
       placeholder="Enter New Password"
       value={newPassword}
       onChange={(e) => setNewPassword(e.target.value)}
       />
       </div>

  <div>
    <label className="block text-sm font-semibold text-slate-700 mb-1">Confirm New Password</label>
    <input 
      type="password" 
      required
      className="w-full border border-slate-300 px-4 py-2 rounded-sm bg-white text-slate-900 placeholder-slate-400 focus:bg-slate-50 focus:ring-2 focus:ring-slate-600 focus:border-slate-600 sm:text-sm outline-none transition-all duration-200"
      placeholder="Repeat new password"
      value={confirmPassword}
      onChange={(e) => setConfirmPassword(e.target.value)}
      />
       </div>
         <div>
<button
    type="submit"
    disabled={isSubmitting}
    className={`w-full flex justify-center py-3 px-4 rounded-sm shadow-md text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.98] transition duration-200 ${
      isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
    }`}>
    {isSubmitting ? 'Updating Security...' : 'Update & Enter Dashboard'}
  </button>
  </div>
      </form>
        </div>
    </div>
   );
};

export default ForcePasswordChange;