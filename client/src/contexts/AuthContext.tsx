import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id?: number;
  username: string;
  email?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo credentials for testing without backend
const DEMO_CREDENTIALS = {
  username: 'admin',
  password: 'admin123',
};

// Storage key for persisting demo session
const DEMO_SESSION_KEY = 'secbank_demo_session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      // First check for demo session in localStorage
      const demoSession = localStorage.getItem(DEMO_SESSION_KEY);
      if (demoSession) {
        try {
          const savedUser = JSON.parse(demoSession);
          setUser(savedUser);
          setIsDemoMode(true);
          setIsLoading(false);
          return;
        } catch {
          localStorage.removeItem(DEMO_SESSION_KEY);
        }
      }

      // Try to connect to backend API
      try {
        const response = await fetch('/api/trpc/auth.me');
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            if (data.result?.data) {
              setUser(data.result.data);
              setIsLoading(false);
              return;
            }
          }
        }
      } catch (err) {
        console.log('Backend not available, using demo mode');
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    // First try to connect to backend
    try {
      const response = await fetch('/api/trpc/auth.login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const contentType = response.headers.get('content-type');
      
      // If we get JSON response, backend is available
      if (contentType && contentType.includes('application/json')) {
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Login failed');
        }

        const data = await response.json();
        if (data.result?.data?.user) {
          setUser(data.result.data.user);
          setIsDemoMode(false);
          setIsLoading(false);
          return;
        }
      }
      
      // If we get HTML (no backend), fall through to demo mode
      console.log('Backend not available, using demo mode authentication');
    } catch (err) {
      // Network error or backend not available, try demo mode
      console.log('Backend connection failed, using demo mode');
    }

    // Demo mode authentication
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
    
    if (username === DEMO_CREDENTIALS.username && password === DEMO_CREDENTIALS.password) {
      const demoUser: User = {
        id: 1,
        username: username,
        email: 'admin@secbank.com',
        role: 'Administrator',
      };
      setUser(demoUser);
      setIsDemoMode(true);
      // Persist demo session
      localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(demoUser));
    } else {
      const errorMsg = 'Invalid credentials. Use demo credentials: admin / admin123';
      setError(errorMsg);
      setIsLoading(false);
      throw new Error(errorMsg);
    }
    
    setIsLoading(false);
  };

  const logout = async () => {
    setIsLoading(true);
    
    // Clear demo session
    localStorage.removeItem(DEMO_SESSION_KEY);
    
    // Try to logout from backend if available
    if (!isDemoMode) {
      try {
        await fetch('/api/trpc/auth.logout', {
          method: 'POST',
        });
      } catch (err) {
        console.error('Backend logout failed:', err);
      }
    }
    
    setUser(null);
    setIsDemoMode(false);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        error,
        isDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
