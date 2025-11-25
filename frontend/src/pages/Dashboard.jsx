import { useEffect, useState } from 'react';
import StatCard from '../components/reusable/StatCard';
import { getBookStats, getLoanAndMemberStats } from '../services/dashboardService';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUniqueBooks: 0,
    totalAvailableCopies: 0,
    activeLoans: 0,
    totalActiveMembers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllStats = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch both sets of data concurrently for efficiency
        const [bookData, loanMemberData] = await Promise.all([
          getBookStats(),
          getLoanAndMemberStats(),
        ]);

        setStats({
          totalUniqueBooks: bookData.totalUniqueBooks,
          totalAvailableCopies: bookData.totalAvailableCopies,
          activeLoans: loanMemberData.activeLoans,
          totalActiveMembers: loanMemberData.totalActiveMembers,
        });
      } catch (err) {
        setError('Failed to load dashboard data. Check API connection.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllStats();
  }, []);

  if (loading) {
    return (
      <div className="text-center p-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
        <p className="mt-3 text-indigo-700">Loading Dashboard Data...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600 bg-red-50 p-4 rounded-lg">{error}</div>;
  }
  
  // Renders the Dashboard View
  return (
    <div>
      <h2 className="text-3xl font-extrabold text-gray-900 mb-8">Library Status Overview</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Unique Books" 
          value={stats.totalUniqueBooks} 
          colorClass="bg-blue-100" 
        />
        <StatCard 
          title="Available Copies" 
          value={stats.totalAvailableCopies} 
          colorClass="bg-green-100" 
        />
        <StatCard 
          title="Active Loans" 
          value={stats.activeLoans} 
          colorClass="bg-yellow-100" 
        />
        <StatCard 
          title="Active Members" 
          value={stats.totalActiveMembers} 
          colorClass="bg-purple-100" 
        />
      </div>
      
      <p className="mt-8 text-gray-500 text-sm">
        Data refreshed from API endpoints: /books/stats, /loans/active, and /members/stats.
      </p>
    </div>
  );
};

export default Dashboard;