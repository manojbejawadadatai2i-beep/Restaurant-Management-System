import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import type { User } from '../types/user';

interface AuthContextType {
  users: User[];
  currentUser: User | null;
  setCurrentUserById: (id: number) => void;
  isLoading: boolean;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:5001/api/users');
      setUsers(response.data);
      
      // Default to corporate_admin for demo/wide access, or preserve existing active user
      if (response.data.length > 0) {
        setCurrentUser(prev => {
          if (prev) {
            const updated = response.data.find((u: User) => u.id === prev.id);
            return updated || response.data[4]; // fallback to index 4 (corporate_admin)
          }
          return response.data[4] || response.data[0];
        });
      }
    } catch (error) {
      console.error('Error fetching mock users from backend:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const setCurrentUserById = (id: number) => {
    const user = users.find(u => u.id === id);
    if (user) {
      setCurrentUser(user);
    }
  };

  return (
    <AuthContext.Provider value={{ users, currentUser, setCurrentUserById, isLoading, refreshUsers: fetchUsers }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
