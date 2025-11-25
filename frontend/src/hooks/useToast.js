import { useContext } from 'react';
import { ToastContext } from '../context/toast';
export const useToast = () => useContext(ToastContext);