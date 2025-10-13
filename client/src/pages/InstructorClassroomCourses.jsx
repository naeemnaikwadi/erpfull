import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCurrentUserId, getAuthHeaders } from '../utils/auth';
import DashboardLayout from '../components/DashboardLayout';
import { Plus, BookOpen, Users, Eye, Edit, Trash2, Calendar } from 'lucide-react';

const InstructorClassroomCourses = () => {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const [classroom, setClassroom] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClassroom();
    fetchCourses();
  }, [classroomId]);

  const fetchClassroom = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/classrooms/${classroomId}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setClassroom(data);
      } else {
        throw new Error('Failed to fetch classroom');
      }
    } catch (error) {
      console.error('Error fetching classroom:', error);
      setError('Failed to load classroom');
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/courses/classroom/${classroomId}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      } else {
        throw new Error('Failed to fetch courses');
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        const response = await fetch(`http://localhost:4000/api/courses/${courseId}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });

        if (response.ok) {
          setCourses(prev => prev.filter(c => c._id !== courseId));
        } else {
          throw new Error('Failed to delete course');
        }
      } catch (error) {
        console.error('Delete failed:', error);
        alert('Failed to delete course');
      }
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
            <div className="text-lg">Loading courses...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="instructor">
      <div className="px-4 py-6 bg-[#f6f8fb] dark:bg-gray-900 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {classroom?.name} - Courses
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Manage and organize courses for this classroom
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/create-course/${classroomId}`)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create New Course
              </button>
              <button
                onClick={() => navigate('/instructor/classrooms')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2"
              >
                <BookOpen className="w-5 h-5" />
                Back to Classrooms
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl">
              {error}
            </div>
          )}

          {/* Classroom Info Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden mb-6">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Classroom Overview
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                {classroom?.description || 'No description available'}
              </p>
            </div>
            <div className="p-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600">{classroom?.name}</div>
                  <div className="text-sm text-blue-600/80">Classroom Name</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">{classroom?.students?.length || 0}</div>
                  <div className="text-sm text-green-600/80">Total Students</div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                  <BookOpen className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-600">{courses.length}</div>
                  <div className="text-sm text-purple-600/80">Total Courses</div>
                </div>
              </div>
            </div>
          </div>

          {/* Courses Section */}
          {courses.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No courses created for this classroom yet.
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Start building your curriculum by creating the first course.
              </p>
              <button
                onClick={() => navigate(`/create-course/${classroomId}`)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto"
              >
                <Plus className="w-5 h-5" />
                Create Your First Course
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div key={course._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Course Header */}
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {course.name}
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/course/${course._id}`)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="View Course"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/edit-course/${course._id}`)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit Course"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(course._id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete Course"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {course.description || 'No description available'}
                    </p>
                  </div>

                  {/* Course Details */}
                  <div className="p-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>Created: {formatDate(course.date)}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 flex gap-2">
                      <button
                        onClick={() => navigate(`/course/${course._id}`)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Course
                      </button>
                      <button
                        onClick={() => navigate(`/edit-course/${course._id}`)}
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
    );
};

export default InstructorClassroomCourses;
