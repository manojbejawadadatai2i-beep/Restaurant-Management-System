import React, { createContext, useState, useEffect } from 'react';
import axios from '../utils/axios';
import type { User } from '../types';

interface AuthContextType {
  users: User[];
  currentUser: User | null;
  setCurrentUserById: (id: number) => void;
  isLoading: boolean;
  refreshUsers: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
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

