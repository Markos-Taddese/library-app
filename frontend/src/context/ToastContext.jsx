import { useState, useCallback, useContext } from 'react';
import { ToastContext } from './toast';

const TOAST_DURATION = 3500; 

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null); 
  const showToast = useCallback(({ message, type = 'success' }) => {
    setToast(null); 
    setToast({ message, type });

    const timer = setTimeout(() => {
      setToast(null);
    }, TOAST_DURATION);

    return () => clearTimeout(timer);
  }, []);

  const value = { toast, showToast, hideToast: () => setToast(null) };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastRenderer /> 
    </ToastContext.Provider>
  );
};

const ToastRenderer = () => {
  const { toast, hideToast } = useContext(ToastContext);

  if (!toast) return null;

  // Determine styles based on toast type
  const getToastStyles = () => {
    if (toast.type === 'error') {
      return {
        container: "bg-red-100 border-red-400 dark:bg-red-600 dark:border-red-700", // Light red bg for light mode, dark red for dark mode
        icon: "bg-red-600 text-white", // Icon background stays red with white icon
        text: "text-red-800 dark:text-white" // Dark red text for light mode, white for dark mode
      };
    } else {
      return {
        container: "bg-green-100 border-green-400 dark:bg-green-600 dark:border-green-700", // Light green bg for light mode, dark green for dark mode
        icon: "bg-green-600 text-white", // Icon background stays green with white icon
        text: "text-green-800 dark:text-white" // Dark green text for light mode, white for dark mode
      };
    }
  };

  const styles = getToastStyles();
  
  // Determine icon based on toast type
  const Icon = toast.type === 'error' 
    ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>;

  return (
    <div
      className={`fixed bottom-4 right-4 z-[9999] flex items-center w-full max-w-sm p-4 space-x-3 rounded-lg shadow-lg transition-all duration-300 transform translate-y-0 border ${styles.container}`}
      role="alert"
      style={{
        opacity: toast ? 1 : 0,
      }}
    >
      {/* Icon container - separate styling */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${styles.icon}`}>
        {Icon}
      </div>
      
      {/* Text container - separate styling */}
      <div className={`flex-1 text-sm font-semibold ${styles.text}`}>
        {toast.message}
      </div>
      
      {/* Close button */}
      <button
        type="button"
        className="ml-auto -mx-1.5 -my-1.5 bg-transparent text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white rounded-lg p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 inline-flex items-center justify-center h-8 w-8 transition-colors"
        onClick={hideToast}
      >
        <span className="sr-only">Close</span>
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};