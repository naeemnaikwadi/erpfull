import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/authContext';

export default function AuthNavigator() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getDashboardPath = (role) => {
    switch (role) {
      case 'admin': return '/admin';
      case 'instructor': return '/instructor';
      case 'student': return '/student';
      case 'admission_officer': return '/admission-officer';
      case 'fee_manager': return '/fee-manager';
      case 'hostel_manager': return '/hostel-manager';
      case 'exam_controller': return '/exam-controller';
      case 'accountant': return '/accountant';
      case 'registrar': return '/registrar';
      default: return '/dashboard';
    }
  };

  useEffect(() => {
    if (!isLoading && user) {
      // Auto-redirect to appropriate dashboard if on landing or login page
      if (location.pathname === '/' || location.pathname === '/login') {
        const redirectPath = getDashboardPath(user.role);
        navigate(redirectPath, { replace: true });
      }
    }
  }, [user, isLoading, navigate, location.pathname]);

  return null; // This component doesn't render anything
}
