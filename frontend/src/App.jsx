
import { Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import BookManagement from './pages/BookManagement';
import LoanManagement from './pages/LoanManagement';
import MemberManagement from './pages/MemberManagement';
import ProtectedRoute from './utils/ProtectedRoute';
import ForcePasswordChange  from './pages/ForcePasswordChange'
import SetupAdmin from './pages/SetupAdmin';
import Login from './pages/Login';

function App() {
  return (
    <Routes>
      <Route path="login" element={<Login />}/>
        <Route path="sign" element={<SetupAdmin />}/>
      <Route element={<ProtectedRoute/>}>
        <Route path="force-password-change" element={<ForcePasswordChange />} />
              <Route path="/" element={<MainLayout />}>
          {/* Main Navigation Areas */}
          <Route index element={<Dashboard />} />
          <Route path="books" element={<BookManagement />} />
          <Route path="loans" element={<LoanManagement />} />
          <Route path="members" element={<MemberManagement />} />
        </Route>
      </Route>

      </Routes>
  );
}

export default App;