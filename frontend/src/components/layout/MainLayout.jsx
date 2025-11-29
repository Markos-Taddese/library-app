import { Outlet, NavLink } from 'react-router-dom';
import { useState } from 'react';
import DarkModeToggle from '../reusable/DarkModeToggle'; 

const navItems = [
  { name: 'Dashboard', path: '/' },
  { name: 'Book Management', path: '/book' },
  { name: 'Loan Management', path: '/loans' },
  { name: 'Member Management', path: '/members' },
];

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      
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
        w-64 bg-gray-900 dark:bg-gray-800 shadow-lg p-4 
        border-r border-gray-200 dark:border-gray-700
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white dark:text-gray-200">LMS Admin</h1>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        <nav>
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `block px-4 py-3 rounded-lg text-sm font-medium transition-colors mb-2
                ${isActive
                  ? 'bg-white text-dark shadow-md'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white dark:text-gray-400 dark:hover:bg-gray-600'
                }`
              }
              end={item.path === '/'}
              onClick={() => setSidebarOpen(false)}
            >
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Dark Mode Toggle in Sidebar */}
        <div className="mt-8 pt-6 border-t border-gray-700 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400 dark:text-gray-500">
              Dark Mode
            </span>
            <DarkModeToggle />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
        {/* Mobile Header */}
        <div className="lg:hidden mb-4 flex items-center justify-between">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            ☰
          </button>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Library Managment System</h2>
          <DarkModeToggle />
        </div>

        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;