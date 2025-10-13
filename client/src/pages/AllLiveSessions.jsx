import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/authContext';
import { useNavigate } from 'react-router-dom';
import { 
  Video, 
  Calendar, 
  Clock, 
  Users, 
  Play, 
  CheckCircle, 
  AlertCircle,
  Eye,
  LogIn
} from 'lucide-react';

export default function AllLiveSessions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // Fetch courses and sessions in parallel
        const [coursesRes, sessionsRes] = await Promise.all([
          fetch(user?.role === 'instructor' 
            ? 'http://localhost:4000/api/instructor/courses'
            : 'http://localhost:4000/api/student/courses', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch('http://localhost:4000/api/live-sessions', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (coursesRes.ok) {
          const coursesData = await coursesRes.json();
          setCourses(coursesData.courses || coursesData || []);
        }

        if (sessionsRes.ok) {
          const sessionsData = await sessionsRes.json();
          console.log('Fetched live sessions for student:', sessionsData);
          setSessions(sessionsData || []);
        } else {
          const errorData = await sessionsRes.json().catch(() => ({}));
          console.error('Failed to fetch live sessions:', sessionsRes.status, errorData);
          throw new Error(`Failed to fetch live sessions: ${errorData.error || sessionsRes.statusText}`);
        }
      } catch (e) {
        console.error('Error fetching data:', e);
        setError('Failed to load live sessions. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchData();
    }
  }, [user?.role, user]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'live':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="w-4 h-4" />;
      case 'live':
        return <Play className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredSessions = sessions.filter(session => {
    if (selectedCourseId === 'all') return true;
    return (session.courseId?._id || session.courseId) === selectedCourseId;
  });

  const handleJoinSession = (session) => {
    if (session.status === 'live') {
      navigate(`/live-session/${session.roomName}`);
    } else if (session.status === 'scheduled') {
      alert('Session will be available at the scheduled time');
    }
  };

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
        <h2 className="text-xl font-semibold mb-4">Live Sessions</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        {/* Course Filter */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Filter by Course
          </label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Courses</option>
            {courses.map(course => (
              <option key={course._id} value={course._id}>
                {course.name || course.title || 'Course'}
              </option>
            ))}
          </select>
        </div>

        {/* Sessions List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {filteredSessions.length === 0 ? (
            <div className="p-8 text-center">
              <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No live sessions found
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {selectedCourseId !== 'all' 
                  ? 'No live sessions available for the selected course.' 
                  : 'No live sessions are currently available.'}
              </p>
            </div>
          ) : (
            <>
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Live Sessions ({filteredSessions.length})
                </h3>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredSessions.map(session => (
                  <div key={session._id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {session.title}
                          </h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${getStatusColor(session.status)}`}>
                            {getStatusIcon(session.status)}
                            {session.status?.charAt(0).toUpperCase() + session.status?.slice(1)}
                          </span>
                        </div>
                        
                        {session.description && (
                          <p className="text-gray-600 dark:text-gray-300 mb-3">
                            {session.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                                                     <span className="flex items-center gap-1">
                             <Calendar className="w-4 h-4" />
                             {formatDate(session.scheduledAt || session.date)}
                           </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {session.duration || 60} minutes
                          </span>
                          {session.instructor && (
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {session.instructor.name}
                            </span>
                          )}
                          {session.classroom && (
                            <span className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {session.classroom.name}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {session.status === 'live' && (
                          <button
                            onClick={() => handleJoinSession(session)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2"
                          >
                            <LogIn className="w-4 h-4" />
                            Join Now
                          </button>
                        )}
                        {session.status === 'scheduled' && (
                          <button
                            onClick={() => handleJoinSession(session)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
                          >
                            <Calendar className="w-4 h-4" />
                            Scheduled
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
