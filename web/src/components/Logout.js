import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { clearAdminStatus } from '../utils/adminUtils';

const Logout = () => {
  const navigate = useNavigate();
  const isUserLogout = useSelector((state) => state.Login?.isUserLogout);

  useEffect(() => {
    // NEW: Clear admin status
    clearAdminStatus();

    // Clear session/local storage
    sessionStorage.clear();
    localStorage.clear();

    // Redirect to login
    navigate('/login');
  }, [navigate]);

  // If user is logged out, redirect to login
  if (isUserLogout) {
    return <Navigate to="/login" />;
  }

  return null;
};

export default Logout;
