
import { Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import BookManagement from './pages/BookManagement';
import LoanManagement from './pages/LoanManagement';
import MemberManagement from './pages/MemberManagement';

function App() {
  return (
    <Routes>
        <Route path="/" element={<MainLayout />}>
          {/* Main Navigation Areas */}
          <Route index element={<Dashboard />} />
          <Route path="books" element={<BookManagement />} />
          <Route path="loans" element={<LoanManagement />} />
          <Route path="members" element={<MemberManagement />} />
        </Route>
      </Routes>
  );
}

export default App;