import { Outlet, NavLink } from 'react-router-dom';
import { useState } from 'react';
import DarkModeToggle from '../reusable/DarkModeToggle'; 
import { useAuth } from '../../hooks/useAuth'; // Import useAuth to get user data

const navItems = [
  { name: 'Dashboard', path: '/' },
  { name: 'Book Management', path: '/books' },
  { name: 'Loan Management', path: '/loans' },
  { name: 'Member Management', path: '/members' },
  { name: 'Staff Management', path: '/staff' },
];
const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
const filteredNavItems = navItems.filter(item => {
  if (item.path === '/staff') {
    if(user.role==='admin'){
      return true;
      }else{
        return false
      }
    }
 return true;
 });
return(
  <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-900 transition-colors duration-300">
    {/* Mobile Overlay */}
    {sidebarOpen && (
      <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
      onClick={() => setSidebarOpen(false)}
        />
      )}
      
    {/* Sidebar Navigation */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 bg-gray-900 dark:bg-gray-800 p-2 flex flex-col
        border-r border-gray-300 dark:border-gray-800
        transform transition-transform duration-100 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
  <div className="flex items-center justify-between mb-4 ">
    <h1 className="text-lg font-bold text-white dark:text-white">LMS Admin</h1>
  <button
     onClick={() => setSidebarOpen(false)}
     className="lg:hidden text-gray-400 hover:text-white">✕
          </button>
        </div>
        
  <nav className="flex-1 overflow-y-auto">
    {filteredNavItems.map((item) => (
      <NavLink
        key={item.name} 
        to={item.path}
        className={({ isActive }) =>
          `block px-3 py-2 text-sm font-medium border-l-2 mb-1 
            ${isActive
                  ? 'bg-gray-800 text-white border-white dark:bg-gray-700 '
                  : 'text-gray-400 border-transparent hover:bg-gray-800 hover:text-white dark:hover:bg-gray-700 '
    }`
  }
  end={item.path === '/'}
  onClick={() => setSidebarOpen(false)}
>
  {item.name}
</NavLink>
))}
    </nav>
{/* Sidebar Footer Area */}
<div className="pt-2 border-t border-gray-700">
  <div className="px-2 mb-2">
      <DarkModeToggle />
        </div>

{/* profile Badge */}
{user && (
  <NavLink
   to="/profile"
   onClick={() => setSidebarOpen(false)}
  className={({ isActive }) =>
      `flex items-start gap-2 p-2 
        ${isActive ? 'bg-gray-800 dark:bg-gray-700 border-l-2' : 'hover:bg-gray-800 dark:hover:bg-gray-700'}`
       }
    >
  <div className="h-10 w-10 rounded-md  bg-gray-500 flex items-center justify-center text-white font-bold">
    {(user.username || user.name).charAt(0)}
    </div>

  <div className="flex flex-col overflow-hidden">
    <p className="text-sm font-medium text-white leading-tight ">
      {user.username || user.name}
        </p>
     <p className="text-xs text-gray-400 leading-tight capitalize">
       {user.role}
        </p>
         </div>
            </NavLink>
          )}
        </div>
   </aside>

      {/* Main Content Area */}
<main className="flex-1 p-4 overflow-y-auto">
  {/* Mobile Header */}
  <div className="lg:hidden mb-2 flex items-center justify-between">
    <button 
       onClick={() => setSidebarOpen(true)}
        className="h-10 w-10 text-gray-950 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-800"
          >
            ☰
        </button>
  <h2 className="text-base font-bold text-gray-950 dark:text-white">Library Management System</h2>
  <div className="w-10 h-10 flex items-center justify-center">
    <DarkModeToggle />
      </div>
        </div>
           <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;