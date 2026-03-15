import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import { setOnUnauthorized } from '@/api/axios';
import type { User } from '@/api/auth';

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider — Central Authentication State Manager
 *
 * Wraps the entire app and provides authentication state to all components
 * via React Context (consumed through the useAuth() hook).
 *
 * Responsibilities:
 *
 * 1. STATE INITIALIZATION
 *    - On first render, hydrates `user` and `token` from localStorage.
 *    - This ensures the user stays logged in across page refreshes.
 *
 * 2. LOGIN
 *    - Saves the JWT token and user object to both React state and localStorage.
 *    - After calling `login()`, all subsequent API requests through the axios
 *      instance will automatically include the Bearer token (via the request
 *      interceptor in api/axios.ts).
 *
 * 3. LOGOUT
 *    - Clears token and user from React state and localStorage.
 *    - Wrapped in useCallback to maintain a stable reference, which is
 *      important because it's registered as the 401 handler in axios.
 *
 * 4. AUTOMATIC LOGOUT ON 401
 *    - On mount, registers the `logout` function with the axios response
 *      interceptor via `setOnUnauthorized()`. If any API call returns a
 *      401 (Unauthorized) — e.g. expired token — the user is automatically
 *      logged out and the ProtectedLayout will redirect them to /login.
 *
 * 5. CONTEXT VALUE
 *    - `isAuthenticated` is derived from the presence of both token AND user.
 *    - Provides: user, token, isAuthenticated, login(), logout()
 */
export function AuthProvider({ children }: AuthProviderProps) {
  // Hydrate initial state from localStorage so auth persists across refreshes
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token');
  });

  /**
   * Logout — clears all auth state and localStorage.
   * Memoized with useCallback so the reference stays stable for the
   * axios 401 interceptor registration below.
   */
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  /**
   * Register the logout function as the 401 handler in the axios instance.
   * This bridges React state (AuthProvider) with the axios module:
   * when axios receives a 401 response, it calls this logout function,
   * which clears auth state and causes ProtectedLayout to redirect to /login.
   */
  useEffect(() => {
    setOnUnauthorized(logout);
  }, [logout]);

  /**
   * Login — stores token and user in both React state and localStorage.
   * The axios request interceptor reads the token from localStorage,
   * so all subsequent API calls will include "Authorization: Bearer <token>".
   */
  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const value = {
    user,
    token,
    // Both token and user must exist for the user to be considered authenticated
    isAuthenticated: !!token && !!user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
