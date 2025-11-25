import  {   useState, useCallback, useContext } from 'react';
import { ToastContext } from './toast';
// The duration for how long the toast should stay visible
const TOAST_DURATION = 3500; 
export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null); 
  const showToast = useCallback(({ message, type = 'success' }) => {
    // Clear any existing toast timer to prevent multiple toasts stacking or conflicting
    setToast(null); 
    setToast({ message, type });

    // Auto-hide the toast after the duration
    const timer = setTimeout(() => {
      setToast(null);
    }, TOAST_DURATION);

    // Cleanup function ensures the timer is cleared if a new toast comes in
    return () => clearTimeout(timer);
  }, []);

  const value = { toast, showToast, hideToast: () => setToast(null) };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Render the ToastRenderer outside the main app flow */}
      <ToastRenderer /> 
    </ToastContext.Provider>
  );
};


const ToastRenderer = () => {
  const { toast, hideToast } = useContext(ToastContext);

  if (!toast) return null;

  // Determine styles based on toast type
  const style = toast.type === 'error'
    ? "bg-red-600 border-red-700" // Red for errors
    : "bg-green-600 border-green-700"; // Green for success
    
  // Determine icon based on toast type
  const Icon = toast.type === 'error' 
    ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> // Exclamation
    : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>; // Checkmark

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] flex items-center w-full max-w-sm p-4 space-x-3 text-white rounded-lg shadow-lg transition-all duration-300 transform translate-y-0"
      role="alert"
      style={{
        opacity: toast ? 1 : 0,
      }}
    >
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${style}`}>
        {Icon}
      </div>
      <div className="flex-1 text-sm  font-semibold">
        {toast.message}
      </div>
      <button
        type="button"
        className="ml-auto -mx-1.5 -my-1.5 bg-transparent text-white hover:text-gray-200 rounded-lg p-1.5 hover:bg-white/10 inline-flex items-center justify-center h-8 w-8"
        onClick={hideToast}
      >
        <span className="sr-only">Close</span>
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  );
};