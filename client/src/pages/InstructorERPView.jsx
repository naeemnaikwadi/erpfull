import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/authContext';
import DashboardLayout from '../components/DashboardLayout';
import {
  UserPlus,
  DollarSign,
  Building,
  ClipboardList,
  Eye,
  Download,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Users,
  BarChart3,
  TrendingUp,
  BookOpen,
  Award
} from 'lucide-react';

const InstructorERPView = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalFees: 0,
    collectedFees: 0,
    pendingFees: 0,
    upcomingExams: 0,
    completedExams: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchInstructorData();
  }, []);

  const fetchInstructorData = async () => {
    try {
      setLoading(true);
      
      // Fetch statistics
      const [admissionsRes, feesRes, examsRes] = await Promise.all([
        fetch('/api/erp/admissions/stats/overview'),
        fetch('/api/erp/fees/stats/overview'),
        fetch('/api/erp/examinations/stats/overview')
      ]);

      const [admissionsData, feesData, examsData] = await Promise.all([
        admissionsRes.json(),
        feesRes.json(),
        examsRes.json()
      ]);

      setStats({
        totalStudents: admissionsData.totalAdmissions || 0,
        totalFees: feesData.totalFees?.totalAmount || 0,
        collectedFees: feesData.totalFees?.paidAmount || 0,
        pendingFees: feesData.totalFees?.pendingAmount || 0,
        upcomingExams: examsData.upcomingExams || 0,
        completedExams: examsData.statusBreakdown?.find(s => s._id === 'Completed')?.count || 0
      });

      // Mock recent activities
      setRecentActivities([
        {
          id: 1,
          type: 'admission',
          description: 'New student admission approved',
          timestamp: '2 hours ago',
          icon: <UserPlus className="w-4 h-4" />
        },
        {
          id: 2,
          type: 'fee',
          description: 'Fee payment received from student',
          timestamp: '4 hours ago',
          icon: <DollarSign className="w-4 h-4" />
        },
        {
          id: 3,
          type: 'exam',
          description: 'Examination results published',
          timestamp: '1 day ago',
          icon: <ClipboardList className="w-4 h-4" />
        }
      ]);
    } catch (error) {
      console.error('Error fetching instructor data:', error);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Instructor ERP Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Overview of student management and academic activities
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Students"
            value={stats.totalStudents}
            icon={<Users className="w-6 h-6" />}
            color="bg-blue-500"
            subtitle="Active students"
          />
          <StatCard
            title="Fee Collection"
            value={`₹${stats.collectedFees.toLocaleString()}`}
            icon={<DollarSign className="w-6 h-6" />}
            color="bg-green-500"
            subtitle={`₹${stats.pendingFees.toLocaleString()} pending`}
          />
          <StatCard
            title="Upcoming Exams"
            value={stats.upcomingExams}
            icon={<Calendar className="w-6 h-6" />}
            color="bg-orange-500"
            subtitle="Scheduled examinations"
          />
          <StatCard
            title="Completed Exams"
            value={stats.completedExams}
            icon={<CheckCircle className="w-6 h-6" />}
            color="bg-purple-500"
            subtitle="Exams conducted"
          />
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
                { id: 'students', label: 'Students', icon: <Users className="w-4 h-4" /> },
                { id: 'fees', label: 'Fees', icon: <DollarSign className="w-4 h-4" /> },
                { id: 'examinations', label: 'Examinations', icon: <ClipboardList className="w-4 h-4" /> },
                { id: 'reports', label: 'Reports', icon: <FileText className="w-4 h-4" /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Academic Overview
                </h2>
                
                {/* Charts Placeholder */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Student Enrollment Trend
                    </h3>
                    <div className="h-64 flex items-center justify-center">
                      <div className="text-center">
                        <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 dark:text-gray-400">Chart will be displayed here</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Fee Collection Status
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Collected</span>
                        <span className="font-semibold text-green-600">
                          ₹{stats.collectedFees.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${(stats.collectedFees / stats.totalFees) * 100}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Pending</span>
                        <span className="font-semibold text-red-600">
                          ₹{stats.pendingFees.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activities */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Recent Activities
                  </h3>
                  <div className="space-y-4">
                    {recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-full">
                          {activity.icon}
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
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'students' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Student Management
                  </h2>
                  <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2">
                    <Download className="w-4 h-4" />
                    <span>Export Data</span>
                  </button>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Student management features will be available here</p>
                    <p className="text-sm text-gray-400 mt-2">View student profiles, academic progress, and performance metrics</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'fees' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Fee Management
                  </h2>
                  <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2">
                    <Download className="w-4 h-4" />
                    <span>Generate Report</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
                    <DollarSign className="w-12 h-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Total Collection</h3>
                    <p className="text-2xl font-bold text-green-600">₹{stats.collectedFees.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
                    <Clock className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Pending</h3>
                    <p className="text-2xl font-bold text-yellow-600">₹{stats.pendingFees.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
                    <TrendingUp className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Collection Rate</h3>
                    <p className="text-2xl font-bold text-blue-600">
                      {((stats.collectedFees / stats.totalFees) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'examinations' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Examination Management
                  </h2>
                  <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Schedule Exam</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
                    <Calendar className="w-12 h-12 text-orange-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Upcoming Exams</h3>
                    <p className="text-2xl font-bold text-orange-600">{stats.upcomingExams}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Completed</h3>
                    <p className="text-2xl font-bold text-green-600">{stats.completedExams}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Reports & Analytics
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
                    <FileText className="w-8 h-8 text-primary-600 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Student Report</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Generate comprehensive student performance reports</p>
                    <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm">
                      Generate
                    </button>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
                    <DollarSign className="w-8 h-8 text-green-600 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Fee Report</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Financial reports and fee collection analytics</p>
                    <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm">
                      Generate
                    </button>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
                    <Award className="w-8 h-8 text-purple-600 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Academic Report</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Examination results and academic performance</p>
                    <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm">
                      Generate
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InstructorERPView;
