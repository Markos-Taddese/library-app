import { useEffect, useState } from 'react';
import StatCard from '../components/reusable/StatCard';
import { 
  getBookStats, 
  getActiveLoanCount, 
  getMemberCount,
  getOverdueMembers,
   getOverdueLoansCount 
} from '../services/dashboardService';
import { useToast } from '../hooks/useToast'; 

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUniqueBooks: 0,
    totalAvailableCopies: 0,
    activeLoans: 0,
    totalActiveMembers: 0,
    overdueLoansCount: 0
  });
  const [overdueMembers, setOverdueMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchAllStats = async () => {
      setLoading(true);
      try {
        const [bookData, loanCount, memberCount, overdueData, overdueLoansCount] = await Promise.all([ 
          getBookStats(),
          getActiveLoanCount(),
          getMemberCount(),
          getOverdueMembers(),
          getOverdueLoansCount() 
        ]);

        setStats({
          totalUniqueBooks: bookData.totalUniqueBooks || 0,
          totalAvailableCopies: bookData.totalAvailableCopies || 0,
          activeLoans: loanCount,
          overdueLoansCount: overdueLoansCount,
          totalActiveMembers: memberCount, 
        });
        setOverdueMembers(overdueData);
      } catch (err) {
        showToast({ message: 'Failed to load dashboard data.', type: 'error' });
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllStats();
  }, [showToast]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto mb-4"></div>
          <p className="text-indigo-600 dark:text-indigo-400 font-medium">Loading Dashboard Overview...</p>
        </div>
      </div>
    );
  }
 
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="mb-10">
        <h2 className="text-4xl font-semibold text-gray-900 dark:text-white border-b pb-2 border-indigo-100 dark:border-gray-700">
          Library Status Overview
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
          Real-time operational metrics for proactive management.
        </p>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
        
        {/* Books */}
        <StatCard 
          title="Unique Books" 
          value={stats.totalUniqueBooks} 
          colorClass="border-blue-500" 
        />
        <StatCard 
          title="Available Copies" 
          value={stats.totalAvailableCopies} 
          colorClass="border-green-600"
        />
        
        {/* Members */}
        <StatCard 
          title="Active Members" 
          value={stats.totalActiveMembers} 
          colorClass="border-indigo-500"
        />
        
        {/* Loans */}
        <StatCard 
          title="Active Loans" 
          value={stats.activeLoans} 
          colorClass="border-yellow-600"
          badge={stats.overdueLoansCount > 0 ? {
            count: stats.overdueLoansCount,
            color: 'red',
            text: 'overdue'
          } : null}
        />

        {/* Overdue Count - Highlighted StatCard */}
        <StatCard 
          title="Overdue Members" 
          value={overdueMembers.length} 
          colorClass={overdueMembers.length > 0 ? "border-red-600 ring-4 ring-red-100 dark:ring-red-900" : "border-gray-300 dark:border-gray-600"} 
        />
      </div>

      {/* Dedicated Section for Overdue Action List */}
      <div className="mt-12 bg-white dark:bg-gray-800 shadow-xl rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
        
        {/* Section Header */}
        <div 
          className={`p-6 border-b ${
            overdueMembers.length > 0 
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200' 
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200'
          }`}>
          <h3 className="text-2xl font-bold"> 
            {overdueMembers.length > 0 
              ? `⚠️ ${overdueMembers.length} Members Require Follow-up` 
              : 'No Overdue Members.'}
          </h3>
        </div>

        {/* Table */}
        {overdueMembers.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Member Name</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Phone Number</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Overdue Count</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-red-100 dark:divide-red-900/30">
                {overdueMembers.map((member) => (
                  <tr key={member.member_id} className="hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">{member.members}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{member.phone_number || 'No phone'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{member.email || 'No email'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-md font-extrabold text-red-700 dark:text-red-400">{member.overdues}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Empty State */}
        {overdueMembers.length === 0 && (
          <div className="p-10 text-center bg-white dark:bg-gray-800">
            <p className="text-xl text-green-600 dark:text-green-400 font-semibold mb-2">Success!</p>
            <p className="text-gray-600 dark:text-gray-400">The system indicates all borrowed items are accounted for and not past their due date.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;