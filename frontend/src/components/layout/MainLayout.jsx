import { Outlet, NavLink } from 'react-router-dom';
const navItems = [
  { name: 'Dashboard', path: '/' },
  { name: 'Book Management', path: '/book' },
  { name: 'Loan Management', path: '/loans' },
  { name: 'Member Management', path: '/members' },
];

const MainLayout = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white shadow-lg p-4 border-r border-gray-200">
        <h1 className="text-2xl font-bold text-gray-700 mb-6">LMS Admin</h1>
        <nav>
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `block px-4 py-2 rounded-lg text-sm font-medium transition-colors mb-2
                ${isActive
                  ? 'bg-gray-500 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
                }`
              }
              end={item.path === '/'} // Use 'end' for exact match on the root route
            >
              {item.name}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Outlet renders the specific module component (Dashboard, Catalog, etc.) */}
        <Outlet />
      </main>

    </div>
  );
};

export default MainLayout;