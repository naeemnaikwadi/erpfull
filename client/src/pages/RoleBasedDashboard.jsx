import React, { useState, useEffect } from 'react';
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
  Eye,
  FileText,
  Award,
  Video,
  Target,
  MessageCircle,
  Upload,
  Star,
  Activity,
  LayoutDashboard
} from 'lucide-react';

const RoleBasedDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const role = user?.role || 'student';

  useEffect(() => {
    fetchDashboardData();
  }, [role]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch statistics based on user role
      const promises = [];
      
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      if (['admin', 'admission_officer', 'registrar'].includes(role)) {
        promises.push(fetch('/api/erp/admissions/stats/overview', { headers }).then(res => res.json()).catch(() => null));
      }
      
      if (['admin', 'fee_manager', 'accountant', 'registrar'].includes(role)) {
        promises.push(fetch('/api/erp/fees/stats/overview', { headers }).then(res => res.json()).catch(() => null));
      }
      
      if (['admin', 'hostel_manager', 'registrar'].includes(role)) {
        promises.push(fetch('/api/erp/hostels/stats/overview', { headers }).then(res => res.json()).catch(() => null));
      }
      
      if (['admin', 'exam_controller', 'registrar'].includes(role)) {
        promises.push(fetch('/api/erp/examinations/stats/overview', { headers }).then(res => res.json()).catch(() => null));
      }

      // For student and instructor roles, fetch learning-related stats
      if (['student', 'instructor'].includes(role)) {
        promises.push(fetch('/api/learning/stats', { headers }).then(res => res.json()).catch(() => null));
      }

      const results = await Promise.all(promises);
      
      // Process results based on available data
      let newStats = {};
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

      if (['student', 'instructor'].includes(role)) {
        const learningStats = results[index++];
        if (learningStats) {
          newStats.learning = {
            courses: learningStats.totalCourses || 0,
            completed: learningStats.completedCourses || 0,
            inProgress: learningStats.inProgressCourses || 0,
            assignments: learningStats.totalAssignments || 0
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

    // Learning modules for students and instructors
    if (['student', 'instructor'].includes(role)) {
      modules.push({
        title: 'My Courses',
        icon: <BookOpen className="w-8 h-8" />,
        path: role === 'student' ? '/student-courses' : '/instructor/courses',
        color: 'bg-indigo-500',
        stats: stats.learning
      });

      modules.push({
        title: 'Assignments',
        icon: <FileText className="w-8 h-8" />,
        path: '/assignments',
        color: 'bg-yellow-500',
        stats: { total: stats.learning?.assignments || 0 }
      });

      modules.push({
        title: 'Live Sessions',
        icon: <Video className="w-8 h-8" />,
        path: '/live-sessions',
        color: 'bg-red-500',
        stats: {}
      });
    }
    
    return modules;
  };

  const getRoleBasedStats = () => {
    const statsCards = [];
    
    if (['admin', 'admission_officer', 'registrar'].includes(role)) {
      statsCards.push({
        title: 'Total Admissions',
        value: stats.admissions?.total || 0,
        icon: <UserPlus className="w-6 h-6" />,
        color: 'bg-blue-500',
        subtitle: `${stats.admissions?.pending || 0} pending`
      });
    }
    
    if (['admin', 'fee_manager', 'accountant', 'registrar'].includes(role)) {
      statsCards.push({
        title: 'Fee Collection',
        value: `₹${(stats.fees?.collected || 0).toLocaleString()}`,
        icon: <DollarSign className="w-6 h-6" />,
        color: 'bg-green-500',
        subtitle: `₹${(stats.fees?.pending || 0).toLocaleString()} pending`
      });
    }
    
    if (['admin', 'hostel_manager', 'registrar'].includes(role)) {
      statsCards.push({
        title: 'Hostel Occupancy',
        value: `${stats.hostels?.occupied || 0}/${stats.hostels?.total || 0}`,
        icon: <Building className="w-6 h-6" />,
        color: 'bg-purple-500',
        subtitle: `${stats.hostels?.available || 0} available`
      });
    }
    
    if (['admin', 'exam_controller', 'registrar'].includes(role)) {
      statsCards.push({
        title: 'Examinations',
        value: stats.examinations?.total || 0,
        icon: <ClipboardList className="w-6 h-6" />,
        color: 'bg-orange-500',
        subtitle: `${stats.examinations?.upcoming || 0} upcoming`
      });
    }

    if (['student', 'instructor'].includes(role)) {
      statsCards.push({
        title: 'My Courses',
        value: stats.learning?.courses || 0,
        icon: <BookOpen className="w-6 h-6" />,
        color: 'bg-indigo-500',
        subtitle: `${stats.learning?.completed || 0} completed`
      });

      statsCards.push({
        title: 'Assignments',
        value: stats.learning?.assignments || 0,
        icon: <FileText className="w-6 h-6" />,
        color: 'bg-yellow-500',
        subtitle: `${stats.learning?.inProgress || 0} in progress`
      });
    }
    
    return statsCards;
  };

  const getRoleTitle = () => {
    switch (role) {
      case 'admin': return 'Admin Dashboard';
      case 'instructor': return 'Instructor Dashboard';
      case 'student': return 'Student Dashboard';
      case 'admission_officer': return 'Admission Officer Dashboard';
      case 'fee_manager': return 'Fee Manager Dashboard';
      case 'hostel_manager': return 'Hostel Manager Dashboard';
      case 'exam_controller': return 'Exam Controller Dashboard';
      case 'accountant': return 'Accountant Dashboard';
      case 'registrar': return 'Registrar Dashboard';
      default: return 'Dashboard';
    }
  };

  const getRoleDescription = () => {
    switch (role) {
      case 'admin': return 'Complete system administration and management';
      case 'instructor': return 'Manage courses, students, and teaching activities';
      case 'student': return 'Access your courses, assignments, and learning materials';
      case 'admission_officer': return 'Manage student admissions and applications';
      case 'fee_manager': return 'Handle fee collection and payment management';
      case 'hostel_manager': return 'Manage hostel allocations and accommodations';
      case 'exam_controller': return 'Oversee examinations and academic assessments';
      case 'accountant': return 'Financial management and accounting operations';
      case 'registrar': return 'Academic administration and student records';
      default: return 'Access your personalized dashboard';
    }
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-full ${module.color} text-white`}>
          {module.icon}
        </div>
        <Eye className="w-5 h-5 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{module.title}</h3>
      {module.stats && Object.keys(module.stats).length > 0 && (
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {getRoleTitle()}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {getRoleDescription()}
              </p>
            </div>
            <button 
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
            >
              <Activity className="w-4 h-4" />
              <span>Refresh Data</span>
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {getRoleBasedStats().map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        {/* Available Modules */}
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

export default RoleBasedDashboard;
