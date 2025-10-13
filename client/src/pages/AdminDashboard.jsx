import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import DashboardLayout from '../components/DashboardLayout';
import StatCard from '../components/StatCard';
import {
  Users,User, BookOpen, Users2, Shield, 
  TrendingUp, Calendar, Target, Video,
  Plus, Search, Edit, Trash2, Eye,
  UserPlus, Settings, Activity, Filter,
  BarChart3, PieChart, LineChart, Download,
  RefreshCw, AlertCircle, CheckCircle, XCircle, FileText
} from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [courses, setCourses] = useState([]);
  const [liveSessions, setLiveSessions] = useState([]);
  const [learningPaths, setLearningPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    dateRange: 'all'
  });
  
  // New state variables for enhanced functionality
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showClassroomModal, setShowClassroomModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showLiveSessionModal, setShowLiveSessionModal] = useState(false);
  const [showLearningPathModal, setShowLearningPathModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningTo, setAssigningTo] = useState(null);
  const [availableInstructors, setAvailableInstructors] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedInstructor, setSelectedInstructor] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');

  useEffect(() => {
    fetchDashboardData();
    fetchAvailableUsers();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch dashboard stats
      const statsResponse = await fetch('http://localhost:4000/api/admin/dashboard-stats', { headers });
      const statsData = await statsResponse.json();
      setStats(statsData);

      // Fetch users
      const usersResponse = await fetch('http://localhost:4000/api/admin/users?limit=10', { headers });
      const usersData = await usersResponse.json();
      setUsers(usersData.users || []);

      // Fetch classrooms
      const classroomsResponse = await fetch('http://localhost:4000/api/admin/classrooms?limit=10', { headers });
      const classroomsData = await classroomsResponse.json();
      setClassrooms(classroomsData.classrooms || []);

      // Fetch courses
      const coursesResponse = await fetch('http://localhost:4000/api/admin/courses?limit=10', { headers });
      const coursesData = await coursesResponse.json();
      setCourses(coursesData.courses || []);

      // Fetch live sessions
      const liveSessionsResponse = await fetch('http://localhost:4000/api/admin/live-sessions?limit=10', { headers });
      const liveSessionsData = await liveSessionsResponse.json();
      setLiveSessions(liveSessionsData.liveSessions || []);

      // Fetch learning paths
      const learningPathsResponse = await fetch('http://localhost:4000/api/admin/learning-paths?limit=10', { headers });
      const learningPathsData = await learningPathsResponse.json();
      console.log('Learning paths response:', learningPathsData);
      setLearningPaths(learningPathsData.learningPaths || []);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const handleCreateUser = async (userData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/admin/create-${createType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        setShowCreateModal(false);
        setCreateType('');
        fetchDashboardData();
        const typeName = createType === 'instructor' ? 'Instructor' : createType === 'admin' ? 'Admin' : 'Student';
        alert(`${typeName} created successfully!`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:4000/api/admin/users/${userId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          fetchDashboardData();
        }
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleEditUser = async (userId, userData) => {
    try {
      const token = localStorage.getItem('token');
              const response = await fetch(`http://localhost:4000/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        fetchDashboardData();
        setShowEditModal(false);
        setEditingItem(null);
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  // Enhanced functions for full admin functionality
  const handleCreateClassroom = async (classroomData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/admin/classrooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(classroomData)
      });

      if (response.ok) {
        fetchDashboardData();
        setShowClassroomModal(false);
        alert('Classroom created successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create classroom');
      }
    } catch (error) {
      console.error('Error creating classroom:', error);
      alert('Failed to create classroom');
    }
  };

  const handleEditClassroom = async (classroomId, classroomData) => {
    try {
      const token = localStorage.getItem('token');
              const response = await fetch(`http://localhost:4000/api/admin/classrooms/${classroomId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(classroomData)
      });

      if (response.ok) {
        fetchDashboardData();
        setShowEditModal(false);
        setEditingItem(null);
        alert('Classroom updated successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update classroom');
      }
    } catch (error) {
      console.error('Error updating classroom:', error);
      alert('Failed to update classroom');
    }
  };

  const handleDeleteClassroom = async (classroomId) => {
    if (window.confirm('Are you sure you want to delete this classroom? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:4000/api/admin/classrooms/${classroomId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          fetchDashboardData();
          alert('Classroom deleted successfully!');
        }
      } catch (error) {
        console.error('Error deleting classroom:', error);
        alert('Failed to delete classroom');
      }
    }
  };

  const handleAssignInstructor = async (classroomId, instructorId) => {
    try {
      const token = localStorage.getItem('token');
              const response = await fetch(`http://localhost:4000/api/admin/classrooms/${classroomId}/assign-instructor`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ instructorId })
      });

      if (response.ok) {
        fetchDashboardData();
        setShowAssignModal(false);
        setAssigningTo(null);
        alert('Instructor assigned successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to assign instructor');
      }
    } catch (error) {
      console.error('Error assigning instructor:', error);
      alert('Failed to assign instructor');
    }
  };

  const handleAddStudent = async (classroomId, studentId) => {
    try {
      const token = localStorage.getItem('token');
              const response = await fetch(`http://localhost:4000/api/admin/classrooms/${classroomId}/add-student`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ studentId })
      });

      if (response.ok) {
        fetchDashboardData();
        setShowAssignModal(false);
        setAssigningTo(null);
        alert('Student added successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add student');
      }
    } catch (error) {
      console.error('Error adding student:', error);
      alert('Failed to add student');
    }
  };

  const handleRemoveStudent = async (classroomId, studentId) => {
    if (window.confirm('Are you sure you want to remove this student from the classroom?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:4000/api/admin/classrooms/${classroomId}/remove-student/${studentId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          fetchDashboardData();
          alert('Student removed successfully!');
        }
      } catch (error) {
        console.error('Error removing student:', error);
        alert('Failed to remove student');
      }
    }
  };

  const handleRemoveInstructor = async (classroomId) => {
    if (window.confirm('Are you sure you want to remove the instructor from this classroom?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:4000/api/admin/classrooms/${classroomId}/remove-instructor`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          fetchDashboardData();
          alert('Instructor removed successfully!');
        }
      } catch (error) {
        console.error('Error removing instructor:', error);
        alert('Failed to remove instructor');
      }
    }
  };

  const handleCreateCourse = async (courseData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/admin/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(courseData)
      });

      if (response.ok) {
        fetchDashboardData();
        setShowCourseModal(false);
        alert('Course created successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create course');
      }
    } catch (error) {
      console.error('Error creating course:', error);
      alert('Failed to create course');
    }
  };

  const handleEditCourse = async (courseId, courseData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(courseData)
      });

      if (response.ok) {
        fetchDashboardData();
        setShowEditModal(false);
        setEditingItem(null);
        alert('Course updated successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update course');
      }
    } catch (error) {
      console.error('Error updating course:', error);
      alert('Failed to update course');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:4000/api/admin/courses/${courseId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          fetchDashboardData();
          alert('Course deleted successfully!');
        }
      } catch (error) {
        console.error('Error deleting course:', error);
        alert('Failed to delete course');
      }
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const [instructorsResponse, studentsResponse] = await Promise.all([
        fetch('http://localhost:4000/api/admin/users?role=instructor&limit=100', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:4000/api/admin/users?role=student&limit=100', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const instructorsData = await instructorsResponse.json();
      const studentsData = await studentsResponse.json();

      setAvailableInstructors(instructorsData.users || []);
      setAvailableStudents(studentsData.users || []);
    } catch (error) {
      console.error('Error fetching available users:', error);
    }
  };

  const handleCreateLiveSession = async (sessionData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/admin/live-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(sessionData)
      });

      if (response.ok) {
        fetchDashboardData();
        setShowLiveSessionModal(false);
        alert('Live session created successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create live session');
      }
    } catch (error) {
      console.error('Error creating live session:', error);
      alert('Failed to create live session');
    }
  };

  const handleCreateLearningPath = async (pathData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/admin/learning-paths', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(pathData)
      });

      if (response.ok) {
        fetchDashboardData();
        setShowLearningPathModal(false);
        alert('Learning path created successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create learning path');
      }
    } catch (error) {
      console.error('Error creating learning path:', error);
      alert('Failed to create learning path');
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4 text-red-600" />;
      case 'instructor':
        return <BookOpen className="w-4 h-4 text-blue-600" />;
      case 'student':
        return <User className="w-4 h-4 text-green-600" />;
      default:
        return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'instructor':
        return 'bg-blue-100 text-blue-800';
      case 'student':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (isActive) => {
    return isActive ? 
      <CheckCircle className="w-4 h-4 text-green-600" /> : 
      <XCircle className="w-4 h-4 text-red-600" />;
  };

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your entire learning platform
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setCreateType('instructor');
                setShowCreateModal(true);
              }}
              className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              <UserPlus size={20} />
              <span>Add Instructor</span>
            </button>
            <button
              onClick={() => {
                setCreateType('admin');
                setShowCreateModal(true);
              }}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Shield size={20} />
              <span>Add Admin</span>
            </button>
            <button
              onClick={() => {
                setCreateType('student');
                setShowCreateModal(true);
              }}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <User size={20} />
              <span>Add Student</span>
            </button>
            <button
              onClick={fetchDashboardData}
              className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <RefreshCw size={20} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUsers || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => setActiveTab('users')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View All →
              </button>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Students</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalStudents || 0}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Users2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => setActiveTab('users')}
                className="text-green-600 hover:text-green-800 text-sm font-medium"
              >
                View All →
              </button>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Instructors</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalInstructors || 0}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => setActiveTab('users')}
                className="text-purple-600 hover:text-purple-800 text-sm font-medium"
              >
                View All →
              </button>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Classrooms</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalClassrooms || 0}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Target className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => setActiveTab('classrooms')}
                className="text-orange-600 hover:text-orange-800 text-sm font-medium"
              >
                View All →
              </button>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Courses</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCourses || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => setActiveTab('courses')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View All →
              </button>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Live Sessions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalLiveSessions || 0}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Video className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => setActiveTab('live-sessions')}
                className="text-green-600 hover:text-green-800 text-sm font-medium"
              >
                View All →
              </button>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Learning Paths</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalLearningPaths || 0}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => setActiveTab('learning-paths')}
                className="text-purple-600 hover:text-purple-800 text-sm font-medium"
              >
                View All →
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: <Activity size={20} /> },
                { id: 'users', label: 'User Management', icon: <Users size={20} /> },
                { id: 'classrooms', label: 'Classrooms', icon: <Target size={20} /> },
                { id: 'courses', label: 'Courses', icon: <BookOpen size={20} /> },
                { id: 'live-sessions', label: 'Live Sessions', icon: <Video size={20} /> },
                { id: 'learning-paths', label: 'Learning Paths', icon: <TrendingUp size={20} /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Users */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Recent Users</h3>
                      <button 
                        onClick={() => setActiveTab('users')}
                        className="text-primary hover:text-primary/80 text-sm"
                      >
                        View All
                      </button>
                    </div>
                    <div className="space-y-3">
                      {users.slice(0, 5).map((user) => (
                        <div key={user._id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-600 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-semibold">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(user.role)}`}>
                            {user.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Classrooms */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Recent Classrooms</h3>
                      <button 
                        onClick={() => setActiveTab('classrooms')}
                        className="text-primary hover:text-primary/80 text-sm"
                      >
                        View All
                      </button>
                    </div>
                    <div className="space-y-3">
                      {classrooms.slice(0, 5).map((classroom) => (
                        <div key={classroom._id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-600 rounded-lg">
                          <div>
                            <p className="font-medium">{classroom.name}</p>
                            <p className="text-sm text-gray-500">
                              {classroom.instructor ? classroom.instructor.name : 'No instructor assigned'}
                            </p>
                          </div>
                          <span className="text-sm text-gray-500">
                            {classroom.students ? classroom.students.length : 0} students
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recent Courses */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Recent Courses</h3>
                    <button 
                      onClick={() => setActiveTab('courses')}
                      className="text-primary hover:text-primary/80 text-sm"
                    >
                      View All
                    </button>
                  </div>
                  <div className="space-y-3">
                    {courses.slice(0, 5).map((course) => (
                      <div key={course._id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-600 rounded-lg">
                        <div>
                          <p className="font-medium">{course.title}</p>
                          <p className="text-sm text-gray-500">
                            {course.instructor ? course.instructor.name : 'No instructor assigned'}
                          </p>
                        </div>
                        <span className="text-sm text-gray-500">
                          {course.duration || 60} min
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Live Sessions */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Recent Live Sessions</h3>
                    <button 
                      onClick={() => setActiveTab('live-sessions')}
                      className="text-primary hover:text-primary/80 text-sm"
                    >
                      View All
                    </button>
                  </div>
                  <div className="space-y-3">
                    {liveSessions.slice(0, 5).map((session) => (
                      <div key={session._id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-600 rounded-lg">
                        <div>
                          <p className="font-medium">{session.title}</p>
                          <p className="text-sm text-gray-500">
                            {session.instructor ? session.instructor.name : 'No instructor assigned'}
                          </p>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(session.scheduledDate).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Learning Paths */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Recent Learning Paths</h3>
                    <button 
                      onClick={() => setActiveTab('learning-paths')}
                      className="text-primary hover:text-primary/80 text-sm"
                    >
                      View All
                    </button>
                  </div>
                  <div className="space-y-3">
                    {learningPaths.slice(0, 5).map((path) => (
                      <div key={path._id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-600 rounded-lg">
                        <div>
                          <p className="font-medium">{path.title}</p>
                          <p className="text-sm text-gray-500">
                            {path.instructor ? path.instructor.name : 'No instructor assigned'}
                          </p>
                        </div>
                        <span className="text-sm text-gray-500">
                          {path.steps ? path.steps.length : 0} steps
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
                  <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button 
                      onClick={() => window.location.href = '/admin/groups'}
                      className="bg-white/20 hover:bg-white/30 p-3 rounded-lg transition-colors"
                    >
                      <Users className="w-6 h-6 mx-auto mb-2" />
                      <span className="text-sm">Manage Groups</span>
                    </button>
                    <button 
                      onClick={() => window.location.href = '/admin/exam-assignments'}
                      className="bg-white/20 hover:bg-white/30 p-3 rounded-lg transition-colors"
                    >
                      <FileText className="w-6 h-6 mx-auto mb-2" />
                      <span className="text-sm">Exam Assignments</span>
                    </button>
                    <button 
                      onClick={() => {
                        setCreateType('instructor');
                        setShowCreateModal(true);
                      }}
                      className="bg-white/20 hover:bg-white/30 p-3 rounded-lg transition-colors"
                    >
                      <UserPlus className="w-6 h-6 mx-auto mb-2" />
                      <span className="text-sm">Add Instructor</span>
                    </button>
                    <button 
                      onClick={() => {
                        setCreateType('student');
                        setShowCreateModal(true);
                      }}
                      className="bg-white/20 hover:bg-white/30 p-3 rounded-lg transition-colors"
                    >
                      <User className="w-6 h-6 mx-auto mb-2" />
                      <span className="text-sm">Add Student</span>
                    </button>
                    <button 
                      onClick={() => {
                        setCreateType('admin');
                        setShowCreateModal(true);
                      }}
                      className="bg-white/20 hover:bg-white/30 p-3 rounded-lg transition-colors"
                    >
                      <Shield className="w-6 h-6 mx-auto mb-2" />
                      <span className="text-sm">Add Admin</span>
                    </button>
                    <button
                      onClick={() => navigate('/admin/classrooms/create')}
                      className="bg-white/20 hover:bg-white/30 p-3 rounded-lg transition-colors"
                    >
                      <Target className="w-6 h-6 mx-auto mb-2" />
                      <span className="text-sm">Create Classroom</span>
                    </button>
                    <button
                      onClick={() => navigate('/admin/courses/create')}
                      className="bg-white/20 hover:bg-white/30 p-3 rounded-lg transition-colors"
                    >
                      <BookOpen className="w-6 h-6 mx-auto mb-2" />
                      <span className="text-sm">Add Course</span>
                    </button>
                    <button 
                      onClick={() => setShowLiveSessionModal(true)}
                      className="bg-white/20 hover:bg-white/30 p-3 rounded-lg transition-colors"
                    >
                      <Video className="w-6 h-6 mx-auto mb-2" />
                      <span className="text-sm">Add Live Session</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search users by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <select
                      value={filters.role}
                      onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">All Roles</option>
                      <option value="admin">Admin</option>
                      <option value="instructor">Instructor</option>
                      <option value="student">Student</option>
                    </select>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Users Table */}
                <div className="bg-white dark:bg-gray-700 rounded-lg shadow overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                      <thead className="bg-gray-50 dark:bg-gray-600">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                        {users.map((user) => (
                          <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center text-sm font-semibold">
                                  {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                                  <div className="text-sm text-gray-500">{user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                {getRoleIcon(user.role)}
                                <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(user.role)}`}>
                                  {user.role}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                {getStatusIcon(user.isActive)}
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {user.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button className="text-primary hover:text-primary/80 p-1 rounded hover:bg-primary/10">
                                  <Eye size={16} />
                                </button>
                                <button className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50">
                                  <Edit size={16} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteUser(user._id)}
                                  className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'classrooms' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Classroom Management</h3>
                  <button
                    onClick={() => setShowClassroomModal(true)}
                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="w-4 h-4 inline mr-2" />
                    Create Classroom
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {classrooms.map((classroom) => (
                    <div key={classroom._id} className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-shadow">
                      <h3 className="font-semibold text-lg mb-2">{classroom.name}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{classroom.description}</p>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Instructor:</span> {classroom.instructor ? classroom.instructor.name : 'Not assigned'}</p>
                        <p><span className="font-medium">Students:</span> {classroom.students ? classroom.students.length : 0}</p>
                        <p><span className="font-medium">Created:</span> {new Date(classroom.createdAt).toLocaleDateString()}</p>
                      </div>
                      
                      {/* Show students list if any */}
                      {classroom.students && classroom.students.length > 0 && (
                        <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-600 rounded">
                          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Students:</p>
                          <div className="space-y-1">
                            {classroom.students.slice(0, 3).map((student) => (
                              <div key={student._id} className="flex items-center justify-between text-xs">
                                <span className="text-gray-700 dark:text-gray-300">{student.name}</span>
                                <button
                                  onClick={() => handleRemoveStudent(classroom._id, student._id)}
                                  className="text-red-500 hover:text-red-700 text-xs"
                                  title="Remove student"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                            {classroom.students.length > 3 && (
                              <p className="text-xs text-gray-500">+{classroom.students.length - 3} more</p>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button 
                          onClick={() => {
                            setEditingItem(classroom);
                            setShowEditModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 border border-blue-600 rounded hover:bg-blue-50"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteClassroom(classroom._id)}
                          className="text-red-600 hover:text-red-800 text-sm px-2 py-1 border border-red-600 rounded hover:bg-red-50"
                        >
                          Delete
                        </button>
                        <button 
                          onClick={() => {
                            setAssigningTo({ type: 'instructor', classroom });
                            setShowAssignModal(true);
                            fetchAvailableUsers();
                          }}
                          className="text-green-600 hover:text-green-800 text-sm px-2 py-1 border border-green-600 rounded hover:bg-green-50"
                        >
                          {classroom.instructor ? 'Change Instructor' : 'Assign Instructor'}
                        </button>
                        {classroom.instructor && (
                          <button 
                            onClick={() => handleRemoveInstructor(classroom._id)}
                            className="text-orange-600 hover:text-orange-800 text-sm px-2 py-1 border border-orange-600 rounded hover:bg-orange-50"
                          >
                            Remove Instructor
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            setAssigningTo({ type: 'student', classroom });
                            setShowAssignModal(true);
                            fetchAvailableUsers();
                          }}
                          className="text-purple-600 hover:text-purple-800 text-sm px-2 py-1 border border-purple-600 rounded hover:bg-purple-50"
                        >
                          Add Student
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'courses' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Course Management</h3>
                  <button
                    onClick={() => setShowCourseModal(true)}
                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="w-4 h-4 inline mr-2" />
                    Create Course
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courses.map((course) => (
                    <div key={course._id} className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-shadow">
                      <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{course.description}</p>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Instructor:</span> {course.instructor ? course.instructor.name : 'Not assigned'}</p>
                        <p><span className="font-medium">Classroom:</span> {course.classroom ? course.classroom.name : 'Not assigned'}</p>
                        <p><span className="font-medium">Created:</span> {new Date(course.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button 
                          onClick={() => {
                            setEditingItem(course);
                            setShowEditModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 border border-blue-600 rounded hover:bg-blue-50"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteCourse(course._id)}
                          className="text-red-600 hover:text-red-800 text-sm px-2 py-1 border border-red-600 rounded hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'live-sessions' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Live Session Management</h3>
                  <button
                    onClick={() => setShowLiveSessionModal(true)}
                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="w-4 h-4 inline mr-2" />
                    Create Live Session
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {liveSessions.map((session) => (
                    <div key={session._id} className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-shadow">
                      <h3 className="font-semibold text-lg mb-2">{session.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{session.description}</p>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Instructor:</span> {session.instructor ? session.instructor.name : 'Not assigned'}</p>
                        <p><span className="font-medium">Date:</span> {new Date(session.scheduledDate).toLocaleDateString()}</p>
                        <p><span className="font-medium">Duration:</span> {session.duration} minutes</p>
                      </div>
                      <div className="mt-4 flex space-x-2">
                        <button className="text-primary hover:text-primary/80 text-sm">View Details</button>
                        <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'learning-paths' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Learning Path Management</h3>
                  <button
                    onClick={() => setShowLearningPathModal(true)}
                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="w-4 h-4 inline mr-2" />
                    Create Learning Path
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {learningPaths.map((path) => (
                    <div key={path._id} className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-shadow">
                      <h3 className="font-semibold text-lg mb-2">{path.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{path.description}</p>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Instructor:</span> {path.instructor ? path.instructor.name : 'Not assigned'}</p>
                        <p><span className="font-medium">Steps:</span> {path.steps ? path.steps.length : 0}</p>
                        <p><span className="font-medium">Created:</span> {new Date(path.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="mt-4 flex space-x-2">
                        <button className="text-primary hover:text-primary/80 text-sm">View Details</button>
                        <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              Create New {createType === 'instructor' ? 'Instructor' : createType === 'admin' ? 'Admin' : 'Student'}
            </h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              handleCreateUser({
                name: formData.get('name'),
                email: formData.get('email'),
                password: formData.get('password')
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Create {createType === 'instructor' ? 'Instructor' : createType === 'admin' ? 'Admin' : 'Student'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateType('');
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Classroom Modal */}
      {showClassroomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create New Classroom</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              handleCreateClassroom({
                name: formData.get('name'),
                description: formData.get('description'),
                capacity: parseInt(formData.get('capacity'))
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Classroom Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Capacity
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    defaultValue="30"
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Create Classroom
                </button>
                <button
                  type="button"
                  onClick={() => setShowClassroomModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create New Course</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              handleCreateCourse({
                title: formData.get('title'),
                description: formData.get('description'),
                duration: parseInt(formData.get('duration')),
                difficulty: formData.get('difficulty')
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Course Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows="3"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    name="duration"
                    defaultValue="60"
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Difficulty
                  </label>
                  <select
                    name="difficulty"
                    defaultValue="beginner"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Create Course
                </button>
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Learning Path Modal */}
      {showLearningPathModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create New Learning Path</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              handleCreateLearningPath({
                title: formData.get('title'),
                description: formData.get('description'),
                estimatedDuration: parseInt(formData.get('estimatedDuration'))
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Path Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows="3"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estimated Duration (minutes)
                  </label>
                  <input
                    type="number"
                    name="estimatedDuration"
                    defaultValue="120"
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Create Learning Path
                </button>
                <button
                  type="button"
                  onClick={() => setShowLearningPathModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Live Session Modal */}
      {showLiveSessionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create New Live Session</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              handleCreateLiveSession({
                title: formData.get('title'),
                description: formData.get('description'),
                scheduledDate: formData.get('scheduledDate'),
                duration: parseInt(formData.get('duration'))
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Session Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows="3"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Scheduled Date
                  </label>
                  <input
                    type="datetime-local"
                    name="scheduledDate"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    name="duration"
                    defaultValue="60"
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Create Session
                </button>
                <button
                  type="button"
                  onClick={() => setShowLiveSessionModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Instructor/Student Modal */}
      {showAssignModal && assigningTo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {assigningTo.type === 'instructor' ? 'Assign Instructor' : 'Add Student'} to {assigningTo.classroom.name}
            </h2>
            <div className="space-y-4">
              {assigningTo.type === 'instructor' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Select Instructor
                  </label>
                  <select
                    value={selectedInstructor}
                    onChange={(e) => setSelectedInstructor(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Choose an instructor...</option>
                    {availableInstructors.map((instructor) => (
                      <option key={instructor._id} value={instructor._id}>
                        {instructor.name} ({instructor.email})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Select Student
                  </label>
                  <select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Choose a student...</option>
                    {availableStudents.map((student) => (
                      <option key={student._id} value={student._id}>
                        {student.name} ({student.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  if (assigningTo.type === 'instructor' && selectedInstructor) {
                    handleAssignInstructor(assigningTo.classroom._id, selectedInstructor);
                  } else if (assigningTo.type === 'student' && selectedStudent) {
                    handleAddStudent(assigningTo.classroom._id, selectedStudent);
                  }
                }}
                disabled={!selectedInstructor && !selectedStudent}
                className="flex-1 bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {assigningTo.type === 'instructor' ? 'Assign Instructor' : 'Add Student'}
              </button>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setAssigningTo(null);
                  setSelectedInstructor('');
                  setSelectedStudent('');
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
