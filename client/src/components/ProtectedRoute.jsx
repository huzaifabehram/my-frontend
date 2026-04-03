import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FullPageLoader } from './Loader';

// Protects any route that requires login
export const ProtectedRoute = () => {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  return isLoggedIn ? <Outlet /> : <Navigate to="/login" replace />;
};

// Only allows instructors
export const InstructorRoute = () => {
  const { isLoggedIn, isInstructor, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (!isInstructor) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
};

// Only allows students
export const StudentRoute = () => {
  const { isLoggedIn, isStudent, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (!isStudent) return <Navigate to="/instructor/dashboard" replace />;
  return <Outlet />;
};
