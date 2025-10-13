import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/authContext';
import QuizSection from '../components/QuizSection';

export default function AllQuizzes() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedClassroomId, setSelectedClassroomId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        let url = '';
        if (user?.role === 'instructor') {
          url = 'http://localhost:4000/api/instructor/courses';
        } else {
          // For students, use a more reliable approach
          url = 'http://localhost:4000/api/student/courses';
        }
        
        const res = await fetch(url, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        
        if (!res.ok) {
          throw new Error('Failed to fetch courses');
        }
        
        const data = await res.json();
        const list = data.courses || data || [];
        setCourses(list);
        
        if (list.length > 0) {
          setSelectedCourseId(list[0]._id);
          setSelectedClassroomId(list[0].classroom?._id || list[0].classroom);
        }
      } catch (e) {
        console.error('Error fetching courses:', e);
        setError('Failed to load courses. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchCourses();
    }
  }, [user?.role, user]);

  useEffect(() => {
    const course = courses.find(c => c._id === selectedCourseId);
    if (course) setSelectedClassroomId(course.classroom?._id || course.classroom);
  }, [selectedCourseId, courses]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-4">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">Quizzes</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        {courses.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg font-medium">No courses available</p>
              <p className="text-sm">You need to be enrolled in courses to view quizzes.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Course
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {courses.map(c => (
                  <option key={c._id} value={c._id}>
                    {c.name || c.title || 'Course'}
                  </option>
                ))}
              </select>
            </div>
            
            {selectedCourseId && selectedClassroomId ? (
              <QuizSection courseId={selectedCourseId} classroomId={selectedClassroomId} />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Please select a course to view quizzes.</p>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}





