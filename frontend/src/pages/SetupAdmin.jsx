import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import RecoveryModal from '../components/reusable/RecoveryModal';
const SetupAdmin = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [showModal, setShowModal] = useState(!!sessionStorage.getItem('admin_recovery_key'));
  const [recoveryKey, setRecoveryKey] = useState(sessionStorage.getItem('admin_recovery_key') || '');
  const [error, setError] = useState('');
  const navigate = useNavigate();
// Checks if setup is needed
useEffect(() => {
  const verifySetup = async () => {
    try {
      const data = await authService.checkSystemSetup();
      // Only redirect if setup is done and no key is in storage
      if (!data.needsSetup && !sessionStorage.getItem('admin_recovery_key')) {
          navigate('/login', { replace: true });
        }
      } catch (err) {
        console.error("System check failed", err);
      }
    };
    verifySetup();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data= await authService.registerFirstUser(formData);
      const key = data.recoveryKey;
     //put the key in storage, this will later hel to keep the modal open eve after refresh
      sessionStorage.setItem('admin_recovery_key', key);
      setRecoveryKey(key);
      //show modal
      setShowModal(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };
const handleRedirect = () => {
    sessionStorage.removeItem('admin_recovery_key'); //remove our key from storage after being used once for security
    setRecoveryKey('');// clear state too before navigating
    setShowModal(false);
   navigate('/login', { replace: true, state: { message: 'System is Ready. You Can log in now.' } })
  };
 

return (
    <div className="flex h-screen items-center justify-center bg-slate-50 relative">
      {/* SETUP FORM */}
      <div className="w-full max-w-md px-4">
      {/* System Branding */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900">System Setup</h1>
          <p className="text-slate-500 mt-2">Register the primary administrator to begin.</p>
        </div>
   <form onSubmit={handleSubmit} className="bg-white p-8  shadow-sm border border-slate-200 space-y-5">
    {error && (
     <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 flex items-center">
      <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1">Username</label>
        <input 
          type="text" 
          className="w-full border border-slate-300 px-4 py-2 rounded-sm bg-white text-slate-900 placeholder-slate-400 focus:bg-slate-50 focus:ring-2 focus:ring-slate-600 focus:border-slate-600 sm:text-sm outline-none transition-all duration-200"
          placeholder="Admin username" 
          onChange={(e) => setFormData({...formData, username: e.target.value})} 
          required
      />
       </div>
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
      <input 
      type="email" 
      className="w-full border border-slate-300 px-4 py-2 rounded-sm bg-white text-slate-900 placeholder-slate-400 focus:bg-slate-50 focus:ring-2 focus:ring-slate-600 focus:border-slate-600 sm:text-sm outline-none transition-all duration-200"
      placeholder="admin@library.os" 
      onChange={(e) => setFormData({...formData, email: e.target.value})} 
      required 
    />
     </div>
  <div>
    <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
    <input 
    type="password" 
    className="w-full border border-slate-300 px-4 py-2 rounded-sm bg-white text-slate-900 placeholder-slate-400 focus:bg-slate-50 focus:ring-2 focus:ring-slate-600 focus:border-slate-600 sm:text-sm outline-none transition-all duration-200"
    placeholder="••••••••" 
    onChange={(e) => setFormData({...formData, password: e.target.value})} 
    required 
    />
     </div>
<button 
      type="submit" 
      className="w-full bg-slate-900 text-white font-semibold py-3 rounded-sm hover:bg-slate-800 active:scale-[0.98] transition-all duration-200 shadow-md"
    >
      Intialize System
    </button>

      </form>
{showModal && (
      <RecoveryModal 
         recoveryKey={recoveryKey} 
            onNavigate={handleRedirect}
       />
    )}
    </div>
    </div>
  );
};

export default SetupAdmin;