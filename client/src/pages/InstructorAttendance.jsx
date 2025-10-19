import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/authContext';
import DashboardLayout from '../components/DashboardLayout';
import {
  Calendar,
  Users,
  BookOpen,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  RefreshCw,
  Target,
  User,
  Search,
  Filter
} from 'lucide-react';
import axios from 'axios';

const InstructorAttendance = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [classrooms, setClassrooms] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [showMarkAttendance, setShowMarkAttendance] = useState(false);
  const [attendanceData, setAttendanceData] = useState({});
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');

  useEffect(() => {
    fetchInstructorData();
  }, []);

  const fetchInstructorData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch instructor's assigned classrooms and courses
      const response = await axios.get('http://localhost:4000/api/attendance/instructor/courses', { headers });
      
      if (response.data.courses) {
        setCourses(response.data.courses);
      }
      
      if (response.data.assignedClassrooms) {
        setClassrooms(response.data.assignedClassrooms);
      }
    } catch (error) {
      console.error('Error fetching instructor data:', error);
      if (error.response?.status === 404) {
        // No classrooms assigned yet
        setClassrooms([]);
        setCourses([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsForCourse = async (courseId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:4000/api/attendance/course/${courseId}/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    }
  };

  const fetchAttendanceRecords = async (courseId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:4000/api/attendance/course/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttendanceRecords(response.data.attendanceRecords || []);
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      setAttendanceRecords([]);
    }
  };

  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
    fetchStudentsForCourse(course._id);
    fetchAttendanceRecords(course._id);
  };

  const handleMarkAttendance = () => {
    if (!selectedCourse) {
      alert('Please select a course first');
      return;
    }
    setShowMarkAttendance(true);
    // Initialize attendance data for all students
    const initialAttendance = {};
    students.forEach(student => {
      initialAttendance[student._id] = 'Present';
    });
    setAttendanceData(initialAttendance);
  };

  const submitAttendance = async () => {
    try {
      const token = localStorage.getItem('token');
      const attendanceRecords = Object.entries(attendanceData).map(([studentId, status]) => ({
        studentId,
        status,
        remarks: ''
      }));

      const response = await axios.post('http://localhost:4000/api/attendance/mark', {
        courseId: selectedCourse._id,
        date: attendanceDate,
        startTime,
        endTime,
        attendanceRecords,
        semester: 'Current',
        academicYear: '2024-25'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Attendance marked successfully!');
      setShowMarkAttendance(false);
      fetchAttendanceRecords(selectedCourse._id);
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Error marking attendance: ' + (error.response?.data?.message || error.message));
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

  if (loading) {
    return (
      <DashboardLayout role="instructor">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="instructor">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Attendance Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Mark and manage student attendance for your courses
              </p>
            </div>
            <button
              onClick={fetchInstructorData}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* No Data Message */}
        {classrooms.length === 0 && courses.length === 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
                  No Classrooms or Courses Assigned
                </h3>
                <p className="text-yellow-700 dark:text-yellow-300">
                  You haven't been assigned to any classrooms yet. Please contact the admin to assign you to a classroom and create courses.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Course Selection */}
        {courses.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Select Course for Attendance
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course) => (
                <div
                  key={course._id}
                  onClick={() => handleCourseSelect(course)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedCourse?._id === course._id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{course.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Classroom: {course.classroom?.name || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Date: {new Date(course.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Course Actions */}
        {selectedCourse && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedCourse.name}
                </h2>
              </div>
              <button
                onClick={handleMarkAttendance}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Mark Attendance</span>
              </button>
            </div>

            {/* Students List */}
            {students.length > 0 && (
              <div>
                <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                  Students ({students.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {students.map((student) => (
                    <div key={student._id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <User className="w-4 h-4 text-gray-600" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{student.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{student.email}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">PRN: {student.prn || 'N/A'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mark Attendance Modal */}
        {showMarkAttendance && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">Mark Attendance</h2>
              
              {/* Date and Time Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Attendance List */}
              <div className="space-y-3 mb-6">
                {students.map((student) => (
                  <div key={student._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <User className="w-4 h-4 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{student.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{student.email}</p>
                      </div>
                    </div>
                    <select
                      value={attendanceData[student._id] || 'Present'}
                      onChange={(e) => setAttendanceData({
                        ...attendanceData,
                        [student._id]: e.target.value
                      })}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
                    >
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                      <option value="Late">Late</option>
                    </select>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={submitAttendance}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Submit Attendance
                </button>
                <button
                  onClick={() => setShowMarkAttendance(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Attendance Records */}
        {attendanceRecords.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Attendance Records
            </h2>
            <div className="space-y-3">
              {attendanceRecords.slice(0, 5).map((record) => (
                <div key={record._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(record.date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {record.classTime?.startTime} - {record.classTime?.endTime}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {record.presentCount} present, {record.absentCount} absent
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor('Present')}`}>
                      {record.attendancePercentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default InstructorAttendance;