import { useState , useEffect} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import authService from '../services/authService';
import { useToast } from '../hooks/useToast'; 
const Login = () => {
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  useEffect(() => {
    //if a user is already logged in,dont let them back in the login page or stay there
    if (!loading && user) {
      if (user.must_change_password) {
        navigate('/force-password-change', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [user, loading, navigate]);
  useEffect(() => {
    // Catch the message passed from navigation state
    console.log("Location State:", location.state);
    if (location.state?.message) {
      showToast({ message: location.state.message, type: 'success' });
    //Clear the state so the toast doesn't pop up again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location, showToast]);
  
useEffect(() => {
    const checkIfSetupNeeded = async () => {
      try {
        // Redirect to setup (/sign) if no admin account exists yet.
        const data = await authService.checkSystemSetup();
        //use our "needsSetup" flag from backend
        if (data.needsSetup) {
          navigate('/sign'); 
        }
      } catch (err) {
        console.error("Check setup failed", err);
      }
    };
    checkIfSetupNeeded();
  }, [navigate]);
if (loading) return null
 const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const credentials = { username,  password };
    const data = await login(credentials); 
    //use the data coming from authprovider
    // New users are forced to change passwords before accessing the dashboard.
    if (data.user?.must_change_password) {
      navigate('/force-password-change');
    } else {
      // if must_change_password is false redirect user to dashbord
      navigate('/'); 
    }
  } catch (err) {
    setError(err.response?.data?.message || 'Failed to log in , Invalid credntials!');
    console.error("Login failed:", err);
  }
};
return (
  <div className="flex h-screen items-center justify-center bg-slate-50">
    <div className="w-full max-w-md px-4">
      {/* System Branding */}
    <div className="text-center mb-8">
      <h1 className="text-3xl font-extrabold text-slate-900">LMS</h1>
      <p className="text-slate-500 mt-2">Authorized Personnel & Members Only</p>
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
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>  

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
        <input 
            type="password" 
            className="w-full border border-slate-300 px-4 py-2 rounded-sm bg-white text-slate-900 placeholder-slate-400 focus:bg-slate-50 focus:ring-2 focus:ring-slate-600 focus:border-slate-600 sm:text-sm outline-none transition-all duration-200"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

<button 
    type="submit" 
      className="w-full bg-slate-900 text-white font-semibold py-3 rounded-sm hover:bg-slate-800 active:scale-[0.98] transition-all duration-200 shadow-md">
    Sign In to Dashboard
    </button>
    </form>
    <p className="text-center text-slate-400 text-xs mt-8">
  &copy; {new Date().getFullYear()} Library Management System. All rights reserved.
</p>
  </div>
    </div>
  );
};

export default Login;