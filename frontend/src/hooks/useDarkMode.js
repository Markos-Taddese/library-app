import { useContext } from "react";
import { DarkModeContext } from '../context/theme'; 
export const useDarkMode = () => useContext(DarkModeContext);