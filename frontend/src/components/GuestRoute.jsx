import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function GuestRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}
