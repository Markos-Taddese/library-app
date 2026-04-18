
import { Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import BookManagement from './pages/BookManagement';
import LoanManagement from './pages/LoanManagement';
import MemberManagement from './pages/MemberManagement';
import ProtectedRoute from './utils/ProtectedRoute';
import ForcePasswordChange  from './pages/ForcePasswordChange'
import SetupAdmin from './pages/SetupAdmin';
import StaffManagement from './pages/StaffManagement'
import Login from './pages/Login';
import UserProfile from './pages/UserProfile'
function App() {
  return (
    <Routes>
       
       <Route path="login" element={<Login />}/>
        
     <Route path="sign" element={<SetupAdmin />}/>
     <Route element={<ProtectedRoute />}>
  <Route path="force-password-change" element={<ForcePasswordChange />} />
  
  <Route path="/" element={<MainLayout />}>
    <Route index element={<Dashboard />} />
    <Route path="books" element={<BookManagement />} />
    <Route path="loans" element={<LoanManagement />} />
    <Route path="members" element={<MemberManagement />} />
    <Route path="profile" element={<UserProfile />} />
   {/* Only Admins can enter this nested route */}
    <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
      <Route path="staff" element={<StaffManagement />} />
    </Route>
  </Route>
</Route>

      </Routes>
  );
}

export default App;