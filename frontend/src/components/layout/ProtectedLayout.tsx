import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AppContainer from './AppContainer';

/**
 * ProtectedLayout — Layout Route for Authenticated Pages
 *
 * This component serves as a React Router v6 "layout route". It is used as
 * the `element` of a parent <Route> that wraps all protected child routes.
 *
 * How it works:
 * 1. Checks `isAuthenticated` from the AuthContext (via useAuth hook).
 * 2. If the user is NOT authenticated:
 *    - Redirects to /login using <Navigate />.
 *    - Passes the current `location` in the `state.from` prop so that
 *      after a successful login, the user can be redirected back to the
 *      page they originally tried to visit.
 *    - `replace` prevents the protected URL from appearing in browser history.
 * 3. If the user IS authenticated:
 *    - Renders <AppContainer> which provides the sidebar and navbar.
 *    - <Outlet /> renders whichever child route matched (e.g. Dashboard, Sources).
 *
 * This pattern keeps auth pages (login, signup) completely outside the
 * sidebar layout, while all app pages are consistently wrapped in it.
 */
export default function ProtectedLayout() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to='/login' state={{ from: location }} replace />;
  }

  return (
    <AppContainer>
      <Outlet />
    </AppContainer>
  );
}
