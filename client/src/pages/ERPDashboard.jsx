import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/authContext';
import DashboardLayout from '../components/DashboardLayout';
import {
  UserPlus,
  DollarSign,
  Building,
  ClipboardList,
  BarChart3,
  TrendingUp,
  Users,
  BookOpen,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye
} from 'lucide-react';

const ERPDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    admissions: { total: 0, pending: 0, approved: 0 },
    fees: { total: 0, collected: 0, pending: 0 },
    hostels: { total: 0, occupied: 0, available: 0 },
    examinations: { total: 0, upcoming: 0, completed: 0 }
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const role = user?.role || 'student';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch statistics based on user role
      const promises = [];
      
      if (['admin', 'admission_officer', 'registrar'].includes(role)) {
        promises.push(API.get('/erp/admissions/stats/overview').then(r => r.data));
      }

      if (['admin', 'fee_manager', 'accountant', 'registrar'].includes(role)) {
        promises.push(API.get('/erp/fees/stats/overview').then(r => r.data));
      }

      if (['admin', 'hostel_manager', 'registrar'].includes(role)) {
        promises.push(API.get('/erp/hostels/stats/overview').then(r => r.data));
      }

      if (['admin', 'exam_controller', 'registrar'].includes(role)) {
        promises.push(API.get('/erp/examinations/stats/overview').then(r => r.data));
      }

      const results = await Promise.all(promises);
      
      // Process results based on available data
      let newStats = { ...stats };
      let index = 0;
      
      if (['admin', 'admission_officer', 'registrar'].includes(role)) {
        const admissionStats = results[index++];
        if (admissionStats) {
          newStats.admissions = {
            total: admissionStats.totalAdmissions || 0,
            pending: admissionStats.statusBreakdown?.find(s => s._id === 'Pending')?.count || 0,
            approved: admissionStats.statusBreakdown?.find(s => s._id === 'Approved')?.count || 0
          };
        }
      }
      
      if (['admin', 'fee_manager', 'accountant', 'registrar'].includes(role)) {
        const feeStats = results[index++];
        if (feeStats) {
          newStats.fees = {
            total: feeStats.totalFees?.totalAmount || 0,
            collected: feeStats.totalFees?.paidAmount || 0,
            pending: feeStats.totalFees?.pendingAmount || 0
          };
        }
      }
      
      if (['admin', 'hostel_manager', 'registrar'].includes(role)) {
        const hostelStats = results[index++];
        if (hostelStats) {
          newStats.hostels = {
            total: hostelStats.totalCapacity || 0,
            occupied: hostelStats.totalOccupancy || 0,
            available: hostelStats.totalAvailable || 0
          };
        }
      }
      
      if (['admin', 'exam_controller', 'registrar'].includes(role)) {
        const examStats = results[index++];
        if (examStats) {
          newStats.examinations = {
            total: examStats.totalExaminations || 0,
            upcoming: examStats.upcomingExams || 0,
            completed: examStats.statusBreakdown?.find(s => s._id === 'Completed')?.count || 0
          };
        }
      }
      
      setStats(newStats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBasedModules = () => {
    const modules = [];
    
    if (['admin', 'admission_officer', 'registrar'].includes(role)) {
      modules.push({
        title: 'Admissions',
        icon: <UserPlus className="w-8 h-8" />,
        path: '/erp/admissions',
        color: 'bg-blue-500',
        stats: stats.admissions
      });
    }
    
    if (['admin', 'fee_manager', 'accountant', 'registrar'].includes(role)) {
      modules.push({
        title: 'Fee Management',
        icon: <DollarSign className="w-8 h-8" />,
        path: '/erp/fees',
        color: 'bg-green-500',
        stats: stats.fees
      });
    }
    
    if (['admin', 'hostel_manager', 'registrar'].includes(role)) {
      modules.push({
        title: 'Hostel Management',
        icon: <Building className="w-8 h-8" />,
        path: '/erp/hostels',
        color: 'bg-purple-500',
        stats: stats.hostels
      });
    }
    
    if (['admin', 'exam_controller', 'registrar'].includes(role)) {
      modules.push({
        title: 'Examinations',
        icon: <ClipboardList className="w-8 h-8" />,
        path: '/erp/examinations',
        color: 'bg-orange-500',
        stats: stats.examinations
      });
    }
    
    return modules;
  };

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${color} text-white`}>
          {icon}
        </div>
      </div>
    </div>
  );

  const ModuleCard = ({ module }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => window.location.href = module.path}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-full ${module.color} text-white`}>
          {module.icon}
        </div>
        <Eye className="w-5 h-5 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{module.title}</h3>
      {module.stats && (
        <div className="space-y-1">
          {Object.entries(module.stats).map(([key, value]) => (
            <div key={key} className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400 capitalize">{key}:</span>
              <span className="font-medium text-gray-900 dark:text-white">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <DashboardLayout role={role}>
      <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          ERP Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome to the Integrated Student Management System
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {['admin', 'admission_officer', 'registrar'].includes(role) && (
          <StatCard
            title="Total Admissions"
            value={stats.admissions.total}
            icon={<UserPlus className="w-6 h-6" />}
            color="bg-blue-500"
            subtitle={`${stats.admissions.pending} pending`}
          />
        )}
        
        {['admin', 'fee_manager', 'accountant', 'registrar'].includes(role) && (
          <StatCard
            title="Fee Collection"
            value={`₹${stats.fees.collected.toLocaleString()}`}
            icon={<DollarSign className="w-6 h-6" />}
            color="bg-green-500"
            subtitle={`₹${stats.fees.pending.toLocaleString()} pending`}
          />
        )}
        
        {['admin', 'hostel_manager', 'registrar'].includes(role) && (
          <StatCard
            title="Hostel Occupancy"
            value={`${stats.hostels.occupied}/${stats.hostels.total}`}
            icon={<Building className="w-6 h-6" />}
            color="bg-purple-500"
            subtitle={`${stats.hostels.available} available`}
          />
        )}
        
        {['admin', 'exam_controller', 'registrar'].includes(role) && (
          <StatCard
            title="Examinations"
            value={stats.examinations.total}
            icon={<ClipboardList className="w-6 h-6" />}
            color="bg-orange-500"
            subtitle={`${stats.examinations.upcoming} upcoming`}
          />
        )}
      </div>

      {/* ERP Modules */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Available Modules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {getRoleBasedModules().map((module, index) => (
            <ModuleCard key={index} module={module} />
          ))}
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Recent Activities
        </h2>
        <div className="space-y-4">
          {recentActivities.length > 0 ? (
            recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {activity.timestamp}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No recent activities</p>
            </div>
          )}
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
};

export default ERPDashboard;
