// client/src/pages/InstructorDashboard.jsx

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BookOpen, Users, Star, Target, Clock, RefreshCw, TrendingUp, FileText } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import SkeletonLoader from '../components/SkeletonLoader';
import AnimatedCard from '../components/AnimatedCard';
import ScrollAnimation from '../components/ScrollAnimation';
import { AnimatedButton, AnimatedBadge, AnimatedIcon } from '../components/AnimationUtils';
import StatCard from '../components/StatCard';
import MonthlyChart from '../components/MonthlyChart';
import InstructorActionButtons from '../components/InstructorActionButtons';
import CompactLiveSessionCalendar from '../components/CompactLiveSessionCalendar';

export default function InstructorDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [learningPathStats, setLearningPathStats] = useState({
    totalPaths: 0,
    activeLearners: 0,
    averageProgress: 0
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const instructorId = (JSON.parse(localStorage.getItem('user')||'{}')._id) || localStorage.getItem('userId');
  
  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get(`http://localhost:4000/api/instructor/stats/${instructorId}`);
      setStats(res.data);
      setChartData(res.data.monthlyEnrollments || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, [instructorId]);

  const fetchLearningPathStats = useCallback(async () => {
    try {
      const res = await axios.get(`http://localhost:4000/api/learning-paths/instructor/${instructorId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const paths = res.data || [];
      setLearningPathStats({
        totalPaths: paths.length,
        activeLearners: paths.reduce((sum, path) => sum + (path.learners?.length || 0), 0),
        averageProgress: paths.length > 0 ? 
          paths.reduce((sum, path) => sum + (path.overallProgress || 0), 0) / paths.length : 0
      });
    } catch (err) {
      console.error('Error fetching learning path stats:', err);
    }
  }, [instructorId]);



  const refreshAllData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchStats(), fetchLearningPathStats()]);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchLearningPathStats()]);
      setLoading(false);
    };

    loadInitialData();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(refreshAllData, 30000);

    return () => clearInterval(interval);
  }, [fetchStats, fetchLearningPathStats]);

  if (loading) {
    return (
      <DashboardLayout role="instructor">
        <SkeletonLoader type="instructor-dashboard" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="instructor">
      <div className="px-4 py-6  min-h-screen">
        
        {/* Welcome Section with Refresh Button */}
        <section className="mb-10">
  <div className="flex flex-col sm:flex-row justify-between items-center gap-6 transition-all rounded-2xl p-6">
    
    {/* Profile & Greeting */}
    <div className="flex items-center gap-5">
      {/* Profile Avatar */}
      <div className="relative">
        {localStorage.getItem('user') && JSON.parse(localStorage.getItem('user')).avatarUrl ? (
          <img
            src={
              JSON.parse(localStorage.getItem('user')).avatarUrl?.startsWith('http')
                ? JSON.parse(localStorage.getItem('user')).avatarUrl
                : `http://localhost:4000${JSON.parse(localStorage.getItem('user')).avatarUrl}`
            }
            alt={JSON.parse(localStorage.getItem('user')).name || 'Instructor'}
            className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg ring-4 ring-purple-100 dark:ring-purple-900/40"
            onError={(e) => {
              e.target.src = '/logo192.png';
            }}
          />
        ) : (
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-2xl font-bold text-white border-4 border-white shadow-lg ring-4 ring-purple-100 dark:ring-purple-900/40">
            {localStorage.getItem('user')
              ? JSON.parse(localStorage.getItem('user')).name?.charAt(0).toUpperCase() ||
                localStorage.getItem('userName')?.charAt(0).toUpperCase() ||
                'I'
              : 'I'}
          </div>
        )}
      </div>

      {/* Welcome Text */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
          Welcome,&nbsp;
          <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            {localStorage.getItem('user')
              ? JSON.parse(localStorage.getItem('user')).name ||
                localStorage.getItem('userName') ||
                'Instructor'
              : 'Instructor'}
          </span>
          !
        </h2>
        <p className="text-gray-600 dark:text-gray-300 hidden sm:block text-base">
          Here's an overview of your teaching activities and student progress.
        </p>
      </div>
    </div>

    {/* Actions (Refresh + Export) */}
    <div className="flex flex-wrap items-center gap-3 sm:gap-4 justify-end">
      {lastUpdated && (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Last updated:&nbsp;
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {lastUpdated.toLocaleTimeString()}
          </span>
        </span>
      )}

      {/* Refresh Button */}
      <button
        onClick={refreshAllData}
        disabled={refreshing}
        className={`flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-70 text-white px-4 py-2.5 rounded-lg font-medium transition-all shadow-md hover:shadow-lg ${
          refreshing ? 'opacity-75' : ''
        }`}
      >
        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
      </button>

      {/* Export PDF Button */}
      <a
        href={`http://localhost:4000/api/instructor/stats/${instructorId}/export.pdf`}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4v16m8-8H4"
          />
        </svg>
        Export PDF
      </a>
    </div>
  </div>
</section>

{/* Overview Stats */}
<section className="mb-10">
  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 tracking-wide">
    Overview
  </h2>

  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
    <StatCard
      label="Total Courses"
      value={stats?.totalCourses || 0}
      icon={<BookOpen className="w-6 h-6" />}
      bgColor="bg-blue-50 dark:bg-blue-900"
      textColor="text-blue-800 dark:text-blue-200"
    />
    <StatCard
      label="Total Students"
      value={stats?.totalStudents || 0}
      icon={<Users className="w-6 h-6" />}
      bgColor="bg-green-50 dark:bg-green-900"
      textColor="text-green-800 dark:text-green-200"
    />
    <StatCard
      label="Average Rating"
      value={stats?.averageRating?.toFixed(1) || 0}
      icon={<Star className="w-6 h-6" />}
      bgColor="bg-yellow-50 dark:bg-yellow-900"
      textColor="text-yellow-800 dark:text-yellow-200"
      subtitle={`${stats?.totalRatings || 0} ratings`}
    />
    <StatCard
      label="Learning Paths"
      value={learningPathStats.totalPaths}
      icon={<Target className="w-6 h-6" />}
      bgColor="bg-purple-50 dark:bg-purple-900"
      textColor="text-purple-800 dark:text-purple-200"
    />
    <StatCard
      label="Active Learners"
      value={stats?.activeLearners || 0}
      icon={<Clock className="w-6 h-6" />}
      bgColor="bg-indigo-50 dark:bg-indigo-900"
      textColor="text-indigo-800 dark:text-indigo-200"
      subtitle="Last 30 days"
    />
  </div>
</section>



        {/* Learning Paths Quick Access */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-white mb-4">Learning Paths</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/create-learning-path')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  Create New Learning Path
                </button>
                <button
                  onClick={() => navigate('/learning-paths')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Target className="w-4 h-4" />
                  View All Learning Paths
                </button>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Learning Path Stats</h3>
                <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">Total Paths:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{learningPathStats.totalPaths}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">Active Learners:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{learningPathStats.activeLearners}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">Avg Progress:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{learningPathStats.averageProgress.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Chart and Mini Calendar */}
        <section className="mb-8" >
          <h2 className="text-xl font-semibold text-gray-700 dark:text-white mb-4">
            Monthly Enrollments & Live Sessions
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-2xl p-6 min-h-[350px]">
              <MonthlyChart data={chartData} />
            </div>
            <div className="bg-white  dark:bg-gray-800 shadow-md rounded-2xl overflow-y-auto p-6 min-h-[350px]">
              <CompactLiveSessionCalendar instructorId={instructorId} height={100} />
            </div>
          </div>
        </section>



        {/* Action Buttons */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InstructorActionButtons navigate={navigate} />
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Exam Management</h3>
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/instructor/exam-assignments')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Exam Assignments
                </button>
                <button
                  onClick={() => navigate('/instructor/ise-marks')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Target className="w-4 h-4" />
                  ISE Marks Entry
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
