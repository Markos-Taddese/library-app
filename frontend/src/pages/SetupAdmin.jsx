import { useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const SetupAdmin = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
useEffect(() => {
  const verifySetup = async () => {
    const data = await authService.checkSystemSetup();
    // If system is already set up, don't let them stay here!
    if (!data.needsSetup) {
      navigate('/login', { replace: true });
    }
  };
  verifySetup();
}, [navigate]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
    // Creates the primary Admin account. This endpoint would be 
    // locked by the backend after the first successful call.
      await authService.registerFirstUser(formData);
      // Pass success message via router state to be picked up by 
      // the Toast listener in Login.jsx.
      navigate('/login', { replace: true, state: { message: 'Admin created! Please log in.' } });
    } catch (err) {
      // Fallback to a generic message if the server couldn't provide a specific one.
      setError(err.response?.data?.message || 'Initialization failed');
    }
  };
return (
  <div className="flex h-screen items-center justify-center bg-slate-50">
    <div className="w-full max-w-md px-4">
      {/* System Branding */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900">System Setup</h1>
          <p className="text-slate-500 mt-2">Register the primary administrator to begin.</p>
        </div>
  <form onSubmit={handleSubmit} className="bg-white p-8 shadow-sm border border-slate-200 space-y-6">
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
         </div>
      </div>
  );
};

export default SetupAdmin;