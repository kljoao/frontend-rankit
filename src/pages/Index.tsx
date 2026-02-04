import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading) {
      navigate(isAuthenticated ? '/dashboard' : '/login');
    }
  }, [isLoading, isAuthenticated, navigate]);

  return null;
};

export default Index;
