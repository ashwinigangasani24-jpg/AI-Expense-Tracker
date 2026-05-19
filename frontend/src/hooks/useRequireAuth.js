import { useAuth } from '../context/AuthContext.jsx';

export function useRequireAuth() {
  const auth = useAuth();
  return auth;
}
