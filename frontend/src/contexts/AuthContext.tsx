import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/authService';
import type { User, AuthResponse } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<AuthResponse>;
  register: (userData: any) => Promise<AuthResponse>;
  logout: () => void;
  updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = authService.getToken();
        if (token) {
          const userData = authService.getUser();
          if (userData) {
            setUser(userData);
            // Admin không cần xác thực email
            const isAdmin = userData.roles?.includes('Admin') || false;
            setIsEmailVerified(isAdmin || userData.emailVerified || false);
          } else {
            // Try to fetch fresh user data
            const profile = await authService.getProfile();
            if (profile) {
              setUser(profile);
              // Admin không cần xác thực email
              const isAdmin = profile.roles?.includes('Admin') || false;
              setIsEmailVerified(isAdmin || profile.emailVerified || false);
            } else {
              authService.logout();
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        authService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string, rememberMe = false): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await authService.login({ email, password, rememberMe });
      if (response.success && response.user) {
        setUser(response.user);
        // Admin không cần xác thực email
        const isAdmin = response.user.roles?.includes('Admin') || false;
        setIsEmailVerified(isAdmin || response.user.emailVerified || false);
      }
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await authService.register(userData);
      if (response.success && response.user) {
        setUser(response.user);
      }
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsEmailVerified(false);
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    // Admin không cần xác thực email
    const isAdmin = userData.roles?.includes('Admin') || false;
    setIsEmailVerified(isAdmin || userData.emailVerified || false);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isEmailVerified,
    isLoading,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
