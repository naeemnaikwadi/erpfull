import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import DashboardLayout from '../components/DashboardLayout';
import {
  BookOpen, Users, Target, Calendar, Clock, Edit, Trash2, Plus,
  Eye, UserPlus, UserMinus, GraduationCap, Video, TrendingUp,
  Search, Filter, SortAsc, SortDesc, ArrowLeft, Settings,
  BarChart3, FileText, PlayCircle, CheckCircle, XCircle
} from 'lucide-react';

const AdminClassroomDetail = () => {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [classroom, setClassroom] = useState(null);
  const [courses, setCourses] = useState([]);
  const [liveSessions, setLiveSessions] = useState([]);
  const [learningPaths, setLearningPaths] = useState([]);
  const [students, setStudents] = useState([]);
  const [instructor, setInstructor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');

  useEffect(() => {
    fetchClassroomData();
  }, [classroomId]);

  const fetchClassroomData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const [classroomRes, coursesRes, liveSessionsRes, learningPathsRes] = await Promise.all([
        fetch(`/api/admin/classrooms/${classroomId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`/api/admin/courses?classroom=${classroomId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`/api/admin/live-sessions?classroom=${classroomId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`/api/admin/learning-paths?classroom=${classroomId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (classroomRes.ok) {
        const classroomData = await classroomRes.json();
        setClassroom(classroomData);
        setStudents(classroomData.students || []);
        setInstructor(classroomData.instructor);
      }

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        setCourses(coursesData.courses || []);
      }

      if (liveSessionsRes.ok) {
        const liveSessionsData = await liveSessionsRes.json();
        setLiveSessions(liveSessionsData.liveSessions || []);
      }

      if (learningPathsRes.ok) {
        const learningPathsData = await learningPathsRes.json();
        setLearningPaths(learningPathsData.learningPaths || []);
      }
    } catch (error) {
      setError('Failed to fetch classroom data');
    } finally {
      setLoading(false);
    }
  };

  // Custom confirmation dialog
  const showConfirmation = (message, action) => {
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setShowConfirmDialog(true);
  };

  const handleConfirm = () => {
    if (confirmAction) {
      confirmAction();
    }
    setShowConfirmDialog(false);
  };

  const handleCancel = () => {
    setShowConfirmDialog(false);
  };

  const handleRemoveStudent = async (studentId) => {
    showConfirmation('Are you sure you want to remove this student from the classroom?', async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/admin/classrooms/${classroomId}/remove-student/${studentId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          setStudents(students.filter(s => s._id !== studentId));
          setSuccess('Student removed successfully');
          setTimeout(() => setSuccess(''), 3000);
        } else {
          const error = await response.json();
          setError(error.error || 'Failed to remove student');
        }
      } catch (error) {
        setError('Failed to remove student');
      }
    });
  };

  const handleRemoveInstructor = async () => {
    showConfirmation('Are you sure you want to remove the instructor from this classroom?', async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/admin/classrooms/${classroomId}/remove-instructor`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          setInstructor(null);
          setSuccess('Instructor removed successfully');
          setTimeout(() => setSuccess(''), 3000);
        } else {
          const error = await response.json();
          setError(error.error || 'Failed to remove instructor');
        }
      } catch (error) {
        setError('Failed to remove instructor');
      }
    });
  };

  const handleDeleteCourse = async (courseId) => {
    showConfirmation('Are you sure you want to delete this course?', async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/admin/courses/${courseId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          setCourses(courses.filter(c => c._id !== courseId));
          setSuccess('Course deleted successfully');
          setTimeout(() => setSuccess(''), 3000);
        } else {
          const error = await response.json();
          setError(error.error || 'Failed to delete course');
        }
      } catch (error) {
        setError('Failed to delete course');
      }
    });
  };

  const handleDeleteLiveSession = async (sessionId) => {
    showConfirmation('Are you sure you want to delete this live session?', async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/admin/live-sessions/${sessionId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          setLiveSessions(liveSessions.filter(s => s._id !== sessionId));
          setSuccess('Live session deleted successfully');
          setTimeout(() => setSuccess(''), 3000);
        } else {
          const error = await response.json();
          setError(error.error || 'Failed to delete live session');
        }
      } catch (error) {
        setError('Failed to delete live session');
      }
    });
  };

  const handleDeleteLearningPath = async (pathId) => {
    showConfirmation('Are you sure you want to delete this learning path?', async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/admin/learning-paths/${pathId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          setLearningPaths(learningPaths.filter(p => p._id !== pathId));
          setSuccess('Learning path deleted successfully');
          setTimeout(() => setSuccess(''), 3000);
        } else {
          const error = await response.json();
          setError(error.error || 'Failed to delete learning path');
        }
      } catch (error) {
        setError('Failed to delete learning path');
      }
    });
  };

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading classroom details...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !classroom) {
    return (
      <DashboardLayout role="admin">
        <div className="p-6 max-w-4xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="px-4 py-6 bg-[#f6f8fb] dark:bg-gray-900 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-3 items-center">
              <button
                onClick={() => navigate('/admin/classrooms')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Classrooms
              </button>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {classroom?.name} - Classroom Details
              </h1>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/admin/classrooms/${classroomId}/edit`)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit Classroom
              </button>
              <button
                onClick={() => navigate(`/admin/classrooms/${classroomId}/assign`)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Manage Users
              </button>
            </div>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              {success}
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Classroom Overview Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden mb-6">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Classroom Overview
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                {classroom?.description || 'No description provided'}
              </p>
            </div>
            <div className="p-6">
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600">{courses.length}</div>
                  <div className="text-sm text-blue-600/80">Total Courses</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">{students.length}</div>
                  <div className="text-sm text-green-600/80">Total Students</div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                  <Video className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-600">{liveSessions.length}</div>
                  <div className="text-sm text-purple-600/80">Live Sessions</div>
                </div>
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                  <TrendingUp className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-orange-600">{learningPaths.length}</div>
                  <div className="text-sm text-orange-600/80">Learning Paths</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md mb-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex space-x-8 px-6">
                {[
                  { id: 'overview', label: 'Overview', icon: BarChart3 },
                  { id: 'courses', label: 'Courses', icon: BookOpen },
                  { id: 'students', label: 'Students', icon: Users },
                  { id: 'live-sessions', label: 'Live Sessions', icon: Video },
                  { id: 'learning-paths', label: 'Learning Paths', icon: TrendingUp }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Instructor Information */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-blue-600" />
                      Instructor Information
                    </h3>
                    {instructor ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{instructor.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{instructor.email}</p>
                        </div>
                        <button
                          onClick={handleRemoveInstructor}
                          className="text-red-600 hover:text-red-800 text-sm px-3 py-1 border border-red-600 rounded hover:bg-red-50"
                        >
                          Remove Instructor
                        </button>
                      </div>
                    ) : (
                      <p className="text-gray-500">No instructor assigned</p>
                    )}
                  </div>

                  {/* Quick Stats */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <h4 className="font-semibold mb-2">Recent Activity</h4>
                      <div className="space-y-2 text-sm">
                        <p>• {courses.length} courses available</p>
                        <p>• {liveSessions.length} live sessions scheduled</p>
                        <p>• {learningPaths.length} learning paths created</p>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <h4 className="font-semibold mb-2">Classroom Details</h4>
                      <div className="space-y-2 text-sm">
                        <p>• Capacity: {classroom?.capacity || 30} students</p>
                        <p>• Created: {new Date(classroom?.createdAt).toLocaleDateString()}</p>
                        <p>• Entry Code: {classroom?.entryCode}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Courses Tab */}
              {activeTab === 'courses' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Courses in this Classroom</h3>
                    <button
                      onClick={() => navigate(`/admin/courses/create?classroom=${classroomId}`)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Course
                    </button>
                  </div>
                  
                  {courses.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p>No courses available in this classroom</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {courses.map((course) => (
                        <div key={course._id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg">{course.name}</h4>
                              <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                                {course.description}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>Duration: {course.duration || 'N/A'}</span>
                                <span>Level: {course.level || 'N/A'}</span>
                                <span>Created: {new Date(course.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => navigate(`/admin/courses/${course._id}/edit`)}
                                className="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50"
                                title="Edit Course"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCourse(course._id)}
                                className="text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-50"
                                title="Delete Course"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Students Tab */}
              {activeTab === 'students' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Students in this Classroom</h3>
                    <button
                      onClick={() => navigate(`/admin/classrooms/${classroomId}/add-students`)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Add Students
                    </button>
                  </div>
                  
                  {students.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p>No students enrolled in this classroom</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {students.map((student) => (
                        <div key={student._id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-semibold">
                                  {student.name?.charAt(0)?.toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <h4 className="font-semibold">{student.name}</h4>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">{student.email}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveStudent(student._id)}
                              className="text-red-600 hover:text-red-800 text-sm px-3 py-1 border border-red-600 rounded hover:bg-red-50"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Live Sessions Tab */}
              {activeTab === 'live-sessions' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Live Sessions in this Classroom</h3>
                    <button
                      onClick={() => navigate(`/admin/live-sessions/create?classroom=${classroomId}`)}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Live Session
                    </button>
                  </div>
                  
                  {liveSessions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Video className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p>No live sessions scheduled in this classroom</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {liveSessions.map((session) => (
                        <div key={session._id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg">{session.title}</h4>
                              <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                                {session.description}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>Date: {new Date(session.scheduledDate).toLocaleDateString()}</span>
                                <span>Time: {session.duration || 'N/A'}</span>
                                <span>Status: {session.status || 'Scheduled'}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => navigate(`/admin/live-sessions/${session._id}/edit`)}
                                className="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50"
                                title="Edit Session"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteLiveSession(session._id)}
                                className="text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-50"
                                title="Delete Session"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Learning Paths Tab */}
              {activeTab === 'learning-paths' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Learning Paths in this Classroom</h3>
                    <button
                      onClick={() => navigate(`/admin/learning-paths/create?classroom=${classroomId}`)}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Learning Path
                    </button>
                  </div>
                  
                  {learningPaths.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p>No learning paths created in this classroom</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {learningPaths.map((path) => (
                        <div key={path._id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg">{path.title}</h4>
                              <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                                {path.description}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>Steps: {path.steps?.length || 0}</span>
                                <span>Difficulty: {path.difficulty || 'N/A'}</span>
                                <span>Created: {new Date(path.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => navigate(`/admin/learning-paths/${path._id}/edit`)}
                                className="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50"
                                title="Edit Learning Path"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteLearningPath(path._id)}
                                className="text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-50"
                                title="Delete Learning Path"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Confirm Action
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {confirmMessage}
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminClassroomDetail;
