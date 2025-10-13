import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUserId, getAuthHeaders } from '../utils/auth';
import DashboardLayout from '../components/DashboardLayout';
import { BookOpen, Plus, Users, Target, Eye, ArrowRight, Trash2, Calendar } from 'lucide-react';

const InstructorClassrooms = () => {
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      const instructorId = getCurrentUserId();
      
      if (!instructorId) {
        setError('User not authenticated. Please log in again.');
        setLoading(false);
        return;
      }

      console.log('Fetching classrooms for instructor:', instructorId);

      const response = await fetch(`http://localhost:4000/api/classrooms/instructor/${instructorId}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Authentication failed. Please log in again.');
        }
        throw new Error('Failed to fetch classrooms');
      }

      const data = await response.json();

      console.log('Classrooms response:', data);
      setClassrooms(data);
    } catch (error) {
      console.error('Error fetching instructor classrooms:', error);
      setError(error.message || 'Failed to load classrooms');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClassroom = async (classroomId) => {
    try {
      setDeleting(true);
      const response = await fetch(`http://localhost:4000/api/classrooms/${classroomId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to delete classroom');
      }

      // Remove from local state
      setClassrooms(classrooms.filter(c => c._id !== classroomId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting classroom:', error);
      setError('Failed to delete classroom');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <DashboardLayout role="instructor">
        <div className="p-6 max-w-5xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading classrooms...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="instructor">
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-600" />
              Your Classrooms
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage your virtual learning spaces and create engaging courses
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/create-classroom')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-lg flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Classroom
            </button>
            <button
              onClick={() => navigate('/instructor/courses')}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-lg flex items-center gap-2"
            >
              <Target className="w-5 h-5" />
              Manage Courses
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {classrooms.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
              No classrooms created yet.
            </p>
            <button
              onClick={() => navigate('/create-classroom')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
            >
              Create Your First Classroom
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classrooms.map((classroom) => (
              <div key={classroom._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* Classroom Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {classroom.name}
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/instructor/classroom/${classroom._id}`)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="View Classroom"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(classroom._id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete Classroom"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {classroom.description || 'No description provided'}
                  </p>
                </div>

                {/* Classroom Details */}
                <div className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>Created: {formatDate(classroom.date)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Target className="w-4 h-4" />
                      <span>Course: {classroom.course || 'General'}</span>
                    </div>

                    {/* Entry Code */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-800 dark:text-blue-200 font-semibold text-sm">
                            Entry Code
                          </p>
                          <p className="text-blue-600 dark:text-blue-300 text-xs">
                            Share with students
                          </p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border border-blue-300 dark:border-blue-600">
                          <span className="font-mono text-lg font-bold text-blue-800 dark:text-blue-200">
                            {classroom.entryCode}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 text-xs">Students</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {classroom.students?.length || 0}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                          <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 text-xs">Courses</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {classroom.courses?.length || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 flex gap-2">
                    <button
                      onClick={() => navigate(`/instructor/classroom/${classroom._id}`)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Open
                    </button>
                    <button
                      onClick={() => navigate(`/instructor/classroom/${classroom._id}/courses`)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <Target className="w-4 h-4" />
                      Courses
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Delete Classroom
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete this classroom? This action cannot be undone and will remove all associated courses and student enrollments.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteClassroom(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
              )}
      </div>
    </DashboardLayout>
  );
};

export default InstructorClassrooms;
