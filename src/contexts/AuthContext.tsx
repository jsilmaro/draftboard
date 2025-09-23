import React from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  email: string;
  type: 'brand' | 'creator' | 'admin';
  companyName?: string;
  userName?: string;
  fullName?: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User, token: string) => void;
  googleLogin: (googleUserData: User, token: string) => void;
  adminLogin: (userData: User, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const navigate = useNavigate();

  React.useEffect(() => {
    // Check for stored token on app load
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        // Error parsing stored user data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
    // Set loading to false after initial check
    setIsLoading(false);
  }, []);

  const login = (userData: User, token: string) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Redirect based on user type
    if (userData.type === 'brand') {
      navigate('/brand/dashboard');
    } else if (userData.type === 'creator') {
      navigate('/creator/dashboard');
    } else if (userData.type === 'admin') {
      navigate('/admin/dashboard');
    }
  };

  const googleLogin = (googleUserData: User, token: string) => {
    // For Google login, we need to handle the user data differently
    // The backend will return the proper user structure
    setUser(googleUserData);
    setIsAuthenticated(true);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(googleUserData));
    
    // Redirect based on user type
    if (googleUserData.type === 'brand') {
      navigate('/brand/dashboard');
    } else if (googleUserData.type === 'creator') {
      navigate('/creator/dashboard');
    } else if (googleUserData.type === 'admin') {
      navigate('/admin');
    }
  };

  const adminLogin = (userData: User, token: string) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Admin users go directly to admin dashboard
    navigate('/admin/dashboard');
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const value = {
    user,
    login,
    googleLogin,
    adminLogin,
    logout,
    isAuthenticated,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 