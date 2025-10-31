import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/authContext';
import DashboardLayout from '../components/DashboardLayout';
import {
  Calendar,
  BookOpen,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import axios from 'axios';

const StudentAttendance = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  useEffect(() => {
    const fetchWithFilters = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        const params = new URLSearchParams();
        if (selectedCourse) params.append('courseId', selectedCourse);
        if (selectedSemester) params.append('semester', selectedSemester);
        if (dateFilter) {
          params.append('startDate', dateFilter);
          params.append('endDate', dateFilter);
        }
        const url = `http://localhost:4000/api/attendance/student/${user._id}${params.toString() ? `?${params.toString()}` : ''}`;
        const recordsResponse = await axios.get(url, { headers });
        setAttendanceRecords(recordsResponse.data || []);
      } catch (e) {
        // no-op
      } finally {
        setLoading(false);
      }
    };

    if (user?._id) {
      fetchWithFilters();
    }
  }, [selectedCourse, selectedSemester, dateFilter]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch student's attendance records
      const recordsResponse = await axios.get(`http://localhost:4000/api/attendance/student/${user._id}`, { headers });
      setAttendanceRecords(recordsResponse.data || []);

      // Fetch attendance summary by course
      const summaryResponse = await axios.get(`http://localhost:4000/api/attendance/student/${user._id}/summary`, { headers });
      setAttendanceSummary(summaryResponse.data || []);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Present':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Absent':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'Late':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Present':
        return 'bg-green-100 text-green-800';
      case 'Absent':
        return 'bg-red-100 text-red-800';
      case 'Late':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAttendancePercentage = (present, late, total) => {
    if (total === 0) return 0;
    return Math.round(((present + late) / total) * 100);
  };

  // Compute unique courses/semesters for dropdowns
  const uniqueCourses = Array.from(new Set(attendanceRecords.map(r => r.course?._id && r.course?.title ? JSON.stringify({id: r.course._id, title: r.course.title, code: r.course.code}) : null).filter(Boolean))).map(s => JSON.parse(s));
  const uniqueSemesters = Array.from(new Set(attendanceRecords.map(r => r.semester).filter(Boolean)));

  // Enhanced search & filter including dropdowns (client-side search by name/code remains):
  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = !searchTerm ||
      record.course?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.course?.code?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Calculate dynamic stats from filteredRecords
  const present = filteredRecords.filter(r => r.status === 'Present').length;
  const absent = filteredRecords.filter(r => r.status === 'Absent').length;
  const late = filteredRecords.filter(r => r.status === 'Late').length;
  const total = filteredRecords.length;
  const attendancePercentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

  if (loading) {
    return (
      <DashboardLayout role="student">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="student">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                My Attendance
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                View your attendance records and statistics
              </p>
            </div>
            <button
              onClick={fetchAttendanceData}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* --- Student Statistics for filtered records --- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{present}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Present</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <AlertTriangle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-yellow-600">{late}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Late</p>
          </div>
          <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-600">{absent}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Absent</p>
          </div>
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{attendancePercentage}%</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Attendance</p>
          </div>
        </div>

        {/* Attendance Summary by Course */}
        {attendanceSummary.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Attendance Summary by Course
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {attendanceSummary.map((summary) => (
                <div key={summary.course._id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{summary.course.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{summary.course.code}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Total Classes:</span>
                      <span className="font-medium">{summary.totalClasses}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Present:</span>
                      <span className="font-medium text-green-600">{summary.presentClasses}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Late:</span>
                      <span className="font-medium text-yellow-600">{summary.lateClasses}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Absent:</span>
                      <span className="font-medium text-red-600">{summary.absentClasses}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Attendance:</span>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        summary.attendancePercentage >= 75 ? 'bg-green-100 text-green-800' :
                        summary.attendancePercentage >= 50 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {summary.attendancePercentage}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by course name or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div>
              <select
                value={selectedCourse || ''}
                onChange={e => setSelectedCourse(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Courses</option>
                {uniqueCourses.map(course => (
                  <option key={course.id} value={course.id}>{course.title} ({course.code})</option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={selectedSemester || ''}
                onChange={e => setSelectedSemester(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Semesters</option>
                {uniqueSemesters.map(sem => (
                  <option key={sem} value={sem}>{sem}</option>
                ))}
              </select>
            </div>
            <div>
              <input
                type="date"
                placeholder="Filter by date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Attendance Records */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Attendance Records
            </h2>
          </div>
          
          {filteredRecords.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredRecords.map((record) => (
                <div key={record._id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(record.status)}
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(record.status)}`}>
                          {record.status}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {record.course?.title || 'Unknown Course'}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {record.course?.code || 'N/A'} • {record.instructor?.name || 'Unknown Instructor'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(record.date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {record.classTime?.startTime} - {record.classTime?.endTime}
                      </p>
                    </div>
                  </div>
                  {record.remarks && (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Remarks:</span> {record.remarks}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Attendance Records Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm || dateFilter || selectedCourse || selectedSemester
                  ? 'No records match your current filters. Try adjusting your search criteria.'
                  : 'You don\'t have any attendance records yet. Attendance will appear here once your instructors start marking it.'
                }
              </p>
            </div>
          )}
        </div>

        {/* Overall Statistics */}
        {attendanceSummary.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Overall Statistics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">
                  {attendanceSummary.reduce((sum, s) => sum + s.presentClasses, 0)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Present</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <AlertTriangle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-yellow-600">
                  {attendanceSummary.reduce((sum, s) => sum + s.lateClasses, 0)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Late</p>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-600">
                  {attendanceSummary.reduce((sum, s) => sum + s.absentClasses, 0)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Absent</p>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-600">
                  {attendanceSummary.length > 0 
                    ? Math.round(attendanceSummary.reduce((sum, s) => sum + s.attendancePercentage, 0) / attendanceSummary.length)
                    : 0}%
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Average</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentAttendance;