import { Navigate } from 'react-router-dom';

/**
 * PrivateRoute Component
 * Protects routes that require authentication
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - The component to render if authorized
 * @param {boolean} props.requireAdmin - Whether the route requires admin privileges
 * @returns {React.ReactNode} The protected component or a redirect to login/dashboard
 */
const PrivateRoute = ({ children, requireAdmin = false }) => {
  // Check for authentication token in localStorage or sessionStorage
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  // Get user data to check admin status
  const userDataString = sessionStorage.getItem('userData') || '{}';
  let userData = {};

  try {
    userData = JSON.parse(userDataString);
  } catch (error) {
    console.error('Failed to parse userData:', error);
  }

  // If no token, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If route requires admin but user is not admin, redirect to dashboard
  if (requireAdmin && !userData.isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // User is authenticated and authorized, render the protected component
  return children;
};

export default PrivateRoute;
