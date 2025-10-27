import { useEffect } from 'react';
import { useAuth } from '../context/authContext';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import AnimatedBackground from './AnimatedBackground';

export default function ProtectedRoute({ role }) {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && (!user || (role && user.role !== role))) {
      // Store the current location before redirecting
      localStorage.setItem('redirectAfterLogin', location.pathname);
      navigate('/login');
    }
  }, [user, role, navigate, location, isLoading]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <AnimatedBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center animate-fade-in">
            <div className="animate-spin-smooth rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">SkillSync</h2>
            <p className="text-gray-600 dark:text-gray-400">Verifying access...</p>
          </div>
        </div>
      </AnimatedBackground>
    );
  }

  return user ? <Outlet /> : null;
}