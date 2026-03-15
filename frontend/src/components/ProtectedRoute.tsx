import type { JSX } from "react";
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

/**
 * ProtectedRoute — Wrapper Component for Individual Route Protection
 *
 * Use this to protect a single route by wrapping its element:
 *   <ProtectedRoute><SomePage /></ProtectedRoute>
 *
 * How it works:
 * - Uses the useAuth() hook to check authentication state from AuthContext
 *   (instead of reading localStorage directly, keeping a single source of truth).
 * - If NOT authenticated: redirects to /login with the current location saved
 *   in `state.from`, so the login page can redirect back after successful login.
 * - If authenticated: renders the children as-is.
 *
 * Note: For the main app routes, ProtectedLayout (layout route) is used instead.
 * This component is available for cases where you need to protect an individual
 * route without the full AppContainer layout.
 */
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
	const { isAuthenticated } = useAuth();
  const location = useLocation();

	if (!isAuthenticated) {
    return <Navigate to='/login' state={{ from: location }} replace />;
  }

	return children;
};

export default ProtectedRoute;
