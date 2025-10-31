import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [classrooms, setClassrooms] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [showMarkAttendance, setShowMarkAttendance] = useState(false);
  const [attendanceData, setAttendanceData] = useState({});
  const [remarksData, setRemarksData] = useState({});
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [showUpdateAttendance, setShowUpdateAttendance] = useState(false);
  const [updateAttendanceId, setUpdateAttendanceId] = useState(null);
  const [updateAttendanceData, setUpdateAttendanceData] = useState({});
  const [updateRemarksData, setUpdateRemarksData] = useState({});
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

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
      
      // API can return either an array of courses or an object with courses and assignedClassrooms
      if (Array.isArray(response.data)) {
        setCourses(response.data);
      } else {
        if (response.data.courses) {
          setCourses(response.data.courses);
        }
        if (response.data.assignedClassrooms) {
          setClassrooms(response.data.assignedClassrooms);
        }
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setClassrooms([]);
        setCourses([]);
      } else {
        console.error('Error fetching instructor data:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const exportCourseAttendance = async () => {
    if (!selectedCourse) return;
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (dateFilter) {
        params.append('startDate', dateFilter);
        params.append('endDate', dateFilter);
      }
      const url = `http://localhost:4000/api/attendance/instructor/export/course/${selectedCourse._id}?${params.toString()}`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `attendance_${selectedCourse.title || selectedCourse.name}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      alert('Failed to export attendance: ' + (e.response?.data?.message || e.message));
    }
  };

  const lockAttendance = async (attendanceId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:4000/api/attendance/lock/${attendanceId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAttendanceRecords(selectedCourse._id);
    } catch (e) {
      alert('Failed to lock attendance: ' + (e.response?.data?.message || e.message));
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

  const fetchAttendanceRecords = async (courseId, nextPage = page, nextLimit = limit) => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      params.append('page', nextPage);
      params.append('limit', nextLimit);
      const response = await axios.get(`http://localhost:4000/api/attendance/course/${courseId}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttendanceRecords(response.data.attendanceRecords || response.data || []);
      if (response.data?.totalPages) setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      setAttendanceRecords([]);
    }
  };

  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
    setPage(1);
    fetchStudentsForCourse(course._id);
    fetchAttendanceRecords(course._id, 1, limit);
  };

  const handleMarkAttendance = () => {
    if (!selectedCourse) {
      alert('Please select a course first');
      return;
    }
    setShowMarkAttendance(true);
    const initialAttendance = {};
    const initialRemarks = {};
    students.forEach(student => {
      initialAttendance[student._id] = 'Present';
      initialRemarks[student._id] = '';
    });
    setAttendanceData(initialAttendance);
    setRemarksData(initialRemarks);
  };

  const submitAttendance = async () => {
    try {
      const token = localStorage.getItem('token');
      const attendanceRecords = Object.entries(attendanceData).map(([studentId, status]) => ({
        studentId,
        status,
        remarks: remarksData[studentId] || ''
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

  const openUpdateModal = (record) => {
    setUpdateAttendanceId(record._id);
    const attData = {};
    const remData = {};
    (record.attendanceRecords || []).forEach(srec => {
      attData[srec.student._id] = srec.status;
      remData[srec.student._id] = srec.remarks || '';
    });
    setUpdateAttendanceData(attData);
    setUpdateRemarksData(remData);
    setShowUpdateAttendance(true);
  };

  const submitUpdateAttendance = async () => {
    try {
      const token = localStorage.getItem('token');
      const attendanceRecords = Object.entries(updateAttendanceData).map(([studentId, status]) => ({
        studentId,
        status,
        remarks: updateRemarksData[studentId] || ''
      }));
      await axios.put(`http://localhost:4000/api/attendance/update/${updateAttendanceId}`, {
        attendanceRecords
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Attendance updated successfully!');
      setShowUpdateAttendance(false);
      fetchAttendanceRecords(selectedCourse._id);
    } catch (error) {
      alert('Error updating attendance: ' + (error.response?.data?.message || error.message));
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
                      <h3 className="font-semibold text-gray-900 dark:text-white">{course.title || course.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Classroom: {course.classroom?.name || 'N/A'}
                      </p>
                      {course.date && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Date: {new Date(course.date).toLocaleDateString()}
                        </p>
                      )}
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
                  {selectedCourse.title || selectedCourse.name}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={exportCourseAttendance}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  <span>Export</span>
                </button>
                <button
                  onClick={handleMarkAttendance}
                  disabled={students.length === 0}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${students.length === 0 ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Mark Attendance</span>
                </button>
              </div>
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
            {students.length === 0 && (
              <div className="p-4 mt-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <div>
                    <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">No students enrolled</h3>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">Enroll students into this course to enable marking attendance.</p>
                    <div className="mt-2">
                      <button
                        onClick={() => {
                          const cid = selectedCourse.classroom?._id || selectedCourse.classroom;
                          if (cid) navigate(`/instructor/classroom/${cid}/courses`);
                        }}
                        className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Manage Enrollments
                      </button>
                    </div>
                  </div>
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
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-gray-600 dark:text-gray-300">Quick set:</span>
                <button onClick={() => {
                  const next = {};
                  students.forEach(s => next[s._id] = 'Present');
                  setAttendanceData(next);
                }} className="px-2 py-1 text-sm bg-green-600 text-white rounded">All Present</button>
                <button onClick={() => {
                  const next = {};
                  students.forEach(s => next[s._id] = 'Absent');
                  setAttendanceData(next);
                }} className="px-2 py-1 text-sm bg-red-600 text-white rounded">All Absent</button>
                <button onClick={() => {
                  const next = {};
                  students.forEach(s => next[s._id] = 'Late');
                  setAttendanceData(next);
                }} className="px-2 py-1 text-sm bg-yellow-600 text-white rounded">All Late</button>
              </div>
              
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
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center gap-2 text-sm">
                        <label className="inline-flex items-center gap-1">
                          <input type="radio" name={`mark-${student._id}`} value="Present" checked={(attendanceData[student._id] || 'Present') === 'Present'} onChange={() => setAttendanceData({ ...attendanceData, [student._id]: 'Present' })} />
                          <span>Present</span>
                        </label>
                        <label className="inline-flex items-center gap-1">
                          <input type="radio" name={`mark-${student._id}`} value="Absent" checked={attendanceData[student._id] === 'Absent'} onChange={() => setAttendanceData({ ...attendanceData, [student._id]: 'Absent' })} />
                          <span>Absent</span>
                        </label>
                        <label className="inline-flex items-center gap-1">
                          <input type="radio" name={`mark-${student._id}`} value="Late" checked={attendanceData[student._id] === 'Late'} onChange={() => setAttendanceData({ ...attendanceData, [student._id]: 'Late' })} />
                          <span>Late</span>
                        </label>
                      </div>
                      <input 
                        type="text"
                        placeholder="Remarks"
                        value={remarksData[student._id] || ''}
                        onChange={(e) => setRemarksData({
                          ...remarksData,
                          [student._id]: e.target.value
                        })}
                        className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white w-40"
                      />
                    </div>
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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Attendance Records
              </h2>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                {dateFilter && (
                  <button
                    onClick={() => setDateFilter('')}
                    className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-3">
              {attendanceRecords
                // Optionally filter by date
                .filter(r => !dateFilter || new Date(r.date).toISOString().split('T')[0] === dateFilter)
                .map((record) => (
                <div key={record._id} className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg mb-3">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{new Date(record.date).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{record.classTime?.startTime} - {record.classTime?.endTime}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-2 md:mt-0">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{record.presentCount} present, {record.absentCount} absent</span>
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor('Present')}`}>{record.attendancePercentage}%</span>
                    {!record.isLocked && (
                      <>
                        <button
                          onClick={() => openUpdateModal(record)}
                          className="ml-2 bg-yellow-500 text-white px-3 py-1 rounded-lg hover:bg-yellow-600"
                        >Edit</button>
                        <button
                          onClick={() => lockAttendance(record._id)}
                          className="ml-2 bg-gray-700 text-white px-3 py-1 rounded-lg hover:bg-gray-800"
                        >Lock</button>
                      </>
                    )}
                    {record.isLocked && (
                      <span className="ml-2 px-3 py-1 bg-gray-400 text-white rounded-lg">Locked</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-4">
                <button
                  onClick={() => {
                    if (page > 1 && selectedCourse) {
                      const newPage = page - 1;
                      setPage(newPage);
                      fetchAttendanceRecords(selectedCourse._id, newPage, limit);
                    }
                  }}
                  disabled={page === 1}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-300">Page {page} of {totalPages}</span>
                <button
                  onClick={() => {
                    if (page < totalPages && selectedCourse) {
                      const newPage = page + 1;
                      setPage(newPage);
                      fetchAttendanceRecords(selectedCourse._id, newPage, limit);
                    }
                  }}
                  disabled={page === totalPages}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* Update Attendance Modal */}
        {showUpdateAttendance && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">Edit Attendance</h2>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-gray-600 dark:text-gray-300">Quick set:</span>
                <button onClick={() => {
                  const next = {};
                  students.forEach(s => next[s._id] = 'Present');
                  setUpdateAttendanceData(next);
                }} className="px-2 py-1 text-sm bg-green-600 text-white rounded">All Present</button>
                <button onClick={() => {
                  const next = {};
                  students.forEach(s => next[s._id] = 'Absent');
                  setUpdateAttendanceData(next);
                }} className="px-2 py-1 text-sm bg-red-600 text-white rounded">All Absent</button>
                <button onClick={() => {
                  const next = {};
                  students.forEach(s => next[s._id] = 'Late');
                  setUpdateAttendanceData(next);
                }} className="px-2 py-1 text-sm bg-yellow-600 text-white rounded">All Late</button>
              </div>
              <div className="space-y-3 mb-6">
                {students.map(student => (
                  <div key={student._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <User className="w-4 h-4 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{student.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{student.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center gap-2 text-sm">
                        <label className="inline-flex items-center gap-1">
                          <input type="radio" name={`edit-${student._id}`} value="Present" checked={(updateAttendanceData[student._id] || 'Present') === 'Present'} onChange={() => setUpdateAttendanceData({ ...updateAttendanceData, [student._id]: 'Present' })} />
                          <span>Present</span>
                        </label>
                        <label className="inline-flex items-center gap-1">
                          <input type="radio" name={`edit-${student._id}`} value="Absent" checked={updateAttendanceData[student._id] === 'Absent'} onChange={() => setUpdateAttendanceData({ ...updateAttendanceData, [student._id]: 'Absent' })} />
                          <span>Absent</span>
                        </label>
                        <label className="inline-flex items-center gap-1">
                          <input type="radio" name={`edit-${student._id}`} value="Late" checked={updateAttendanceData[student._id] === 'Late'} onChange={() => setUpdateAttendanceData({ ...updateAttendanceData, [student._id]: 'Late' })} />
                          <span>Late</span>
                        </label>
                      </div>
                      <input 
                        type="text"
                        placeholder="Remarks"
                        value={updateRemarksData[student._id] || ''}
                        onChange={e => setUpdateRemarksData({
                          ...updateRemarksData,
                          [student._id]: e.target.value
                        })}
                        className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white w-40"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={submitUpdateAttendance}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Update
                </button>
                <button
                  onClick={() => setShowUpdateAttendance(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default InstructorAttendance;