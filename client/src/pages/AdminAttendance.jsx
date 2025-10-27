import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/authContext';
import DashboardLayout from '../components/DashboardLayout';
import SkeletonLoader from '../components/SkeletonLoader';
import {
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  BarChart3,
  Filter,
  RefreshCw,
  Download,
  Eye,
  AlertCircle,
  BookOpen,
  User,
  Building
} from 'lucide-react';
import axios from 'axios';

const AdminAttendance = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [stats, setStats] = useState({
    overallStats: {
      totalClasses: 0,
      averageAttendance: 0,
      totalPresent: 0,
      totalAbsent: 0,
      totalLate: 0
    },
    courseStats: []
  });
  const [filters, setFilters] = useState({
    courseId: '',
    instructorId: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 10
  });
  const [totalPages, setTotalPages] = useState(1);
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchAttendanceRecords();
    fetchCourses();
    fetchInstructors();
  }, []);

  useEffect(() => {
    fetchAttendanceRecords();
  }, [filters]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await axios.get(`http://localhost:4000/api/attendance/admin/stats?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filters.courseId) params.append('courseId', filters.courseId);
      if (filters.instructorId) params.append('instructorId', filters.instructorId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      params.append('page', filters.page);
      params.append('limit', filters.limit);

      const response = await axios.get(`http://localhost:4000/api/attendance/admin/all?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttendanceRecords(response.data.attendanceRecords);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching attendance records:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:4000/api/courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourses(response.data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
    }
  };

  const fetchInstructors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:4000/api/users?role=instructor', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInstructors(response.data || []);
    } catch (error) {
      console.error('Error fetching instructors:', error);
      setInstructors([]);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleExport = async (format = 'xlsx') => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filters.courseId) params.append('courseId', filters.courseId);
      if (filters.instructorId) params.append('instructorId', filters.instructorId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      params.append('format', format);

      const response = await axios.get(`http://localhost:4000/api/attendance/admin/export?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_export.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting attendance data:', error);
      alert('Error exporting data: ' + (error.response?.data?.message || error.message));
    }
  };

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
        <div className={`p-2 rounded-full ${color} text-white`}>
          {icon}
        </div>
      </div>
    </div>
  );

  const CourseStatCard = ({ course }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{course.course.title}</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">{course.course.code}</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {course.averageAttendance?.toFixed(1) || 0}%
          </div>
        </div>
      </div>
      
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Classes:</span>
          <span className="font-medium">{course.totalClasses}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-green-600 dark:text-green-400">Present:</span>
          <span className="font-medium">{course.totalPresent}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-red-600 dark:text-red-400">Absent:</span>
          <span className="font-medium">{course.totalAbsent}</span>
        </div>
      </div>
      
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
        <div
          className={`h-1.5 rounded-full transition-all duration-300 ${
            course.averageAttendance >= 80 ? 'bg-green-500' :
            course.averageAttendance >= 60 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${course.averageAttendance || 0}%` }}
        ></div>
      </div>
    </div>
  );

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Attendance Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Monitor and manage attendance across all courses and instructors
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleExport('xlsx')}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export Excel</span>
              </button>
              <button
                onClick={fetchStats}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Overall Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatCard
            title="Total Classes"
            value={stats.overallStats.totalClasses}
            icon={<Calendar className="w-5 h-5" />}
            color="bg-blue-500"
            subtitle="All courses"
          />
          <StatCard
            title="Average Attendance"
            value={`${stats.overallStats.averageAttendance?.toFixed(1) || 0}%`}
            icon={<TrendingUp className="w-5 h-5" />}
            color="bg-green-500"
            subtitle="Overall average"
          />
          <StatCard
            title="Total Present"
            value={stats.overallStats.totalPresent}
            icon={<CheckCircle className="w-5 h-5" />}
            color="bg-green-500"
            subtitle="Students present"
          />
          <StatCard
            title="Total Absent"
            value={stats.overallStats.totalAbsent}
            icon={<XCircle className="w-5 h-5" />}
            color="bg-red-500"
            subtitle="Students absent"
          />
          <StatCard
            title="Total Late"
            value={stats.overallStats.totalLate}
            icon={<Clock className="w-5 h-5" />}
            color="bg-yellow-500"
            subtitle="Students late"
          />
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {[
              { id: 'overview', label: 'Course Overview', icon: <BarChart3 className="w-4 h-4" /> },
              { id: 'records', label: 'Attendance Records', icon: <Calendar className="w-4 h-4" /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Course Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                [...Array(6)].map((_, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  </div>
                ))
              ) : stats.courseStats.length > 0 ? (
                stats.courseStats.map((course, index) => (
                  <CourseStatCard key={index} course={course} />
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No attendance data found</p>
                  <p className="text-sm">Attendance statistics will appear here once instructors start marking attendance</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Attendance Records Tab */}
        {activeTab === 'records' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Course</label>
                  <select
                    value={filters.courseId}
                    onChange={(e) => handleFilterChange('courseId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">All Courses</option>
                    {courses.map(course => (
                      <option key={course._id} value={course._id}>
                        {course.title} ({course.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Instructor</label>
                  <select
                    value={filters.instructorId}
                    onChange={(e) => handleFilterChange('instructorId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">All Instructors</option>
                    {instructors.map(instructor => (
                      <option key={instructor._id} value={instructor._id}>
                        {instructor.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Attendance Records Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Attendance Records
                </h2>
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, index) => (
                      <div key={index} className="grid grid-cols-7 gap-4 animate-pulse">
                        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : attendanceRecords.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Course
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Instructor
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Time
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Present
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Absent
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Late
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Attendance %
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {attendanceRecords.map(record => (
                            <tr key={record._id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {new Date(record.date).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                <div>
                                  <div className="font-medium">{record.course.title}</div>
                                  <div className="text-gray-500 dark:text-gray-400">{record.course.code}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {record.instructor.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {record.classTime.startTime} - {record.classTime.endTime}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                <span className="text-green-600 dark:text-green-400 font-medium">
                                  {record.presentCount}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                <span className="text-red-600 dark:text-red-400 font-medium">
                                  {record.absentCount}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                                  {record.lateCount}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                <span className={`font-medium ${
                                  record.attendancePercentage >= 80 ? 'text-green-600 dark:text-green-400' :
                                  record.attendancePercentage >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                                  'text-red-600 dark:text-red-400'
                                }`}>
                                  {record.attendancePercentage}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex justify-center items-center space-x-2 mt-6">
                        <button
                          onClick={() => handlePageChange(filters.page - 1)}
                          disabled={filters.page === 1}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          Previous
                        </button>
                        <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                          Page {filters.page} of {totalPages}
                        </span>
                        <button
                          onClick={() => handlePageChange(filters.page + 1)}
                          disabled={filters.page === totalPages}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No attendance records found</p>
                    <p className="text-sm">Try adjusting your filters or check back later</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminAttendance;
