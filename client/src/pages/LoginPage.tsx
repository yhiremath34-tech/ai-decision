import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Open access mode: redirect immediately to dashboard
    navigate('/dashboard', { replace: true });
  }, [navigate]);

  return null;
};
