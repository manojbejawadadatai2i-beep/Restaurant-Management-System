import React, { createContext, useState, useEffect } from 'react';
import axios from '../utils/axios';
import type { User } from '../types';

interface AuthContextType {
  users: User[];
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  loginGoogle: (idToken: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  refreshUsers: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('currentUser');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data);
      
      // Synchronize currentUser from latest database records if it exists
      setCurrentUser(prev => {
        if (prev) {
          const updated = response.data.find((u: User) => u.id === prev.id);
          if (updated) {
            const merged = {
              ...updated,
              requires_password_change: prev.requires_password_change ?? updated.requires_password_change,
              is_new_user: prev.is_new_user ?? updated.is_new_user,
            };
            localStorage.setItem('currentUser', JSON.stringify(merged));
            return merged;
          }
        }
        return prev;
      });
    } catch (error) {
      console.error('Error fetching users from backend:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await axios.post('/login', { email, password });
    const { access_token, user } = response.data;
    const authenticatedUser: User = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      assigned_store_id: user.assigned_store_id,
      store_name: user.store_name,
      assigned_district_id: user.assigned_district_id,
      district_name: user.district_name,
      assigned_region_id: user.assigned_region_id,
      region_name: user.region_name,
      token: access_token,
      requires_password_change: user.requires_password_change,
      is_new_user: user.is_new_user,
    };
    setCurrentUser(authenticatedUser);
    localStorage.setItem('currentUser', JSON.stringify(authenticatedUser));
  };

  const loginGoogle = async (idToken: string) => {
    const response = await axios.post('/login/google', { id_token: idToken });
    const { access_token, user } = response.data;
    const authenticatedUser: User = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      assigned_store_id: user.assigned_store_id,
      store_name: user.store_name,
      assigned_district_id: user.assigned_district_id,
      district_name: user.district_name,
      assigned_region_id: user.assigned_region_id,
      region_name: user.region_name,
      token: access_token,
      requires_password_change: user.requires_password_change,
      is_new_user: user.is_new_user,
    };
    setCurrentUser(authenticatedUser);
    localStorage.setItem('currentUser', JSON.stringify(authenticatedUser));
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  return (
    <AuthContext.Provider value={{ users, currentUser, login, loginGoogle, logout, isLoading, refreshUsers: fetchUsers }}>
      {children}
    </AuthContext.Provider>
  );
};
