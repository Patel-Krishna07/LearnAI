
"use client";

import type { User, LeaderboardUser } from '@/lib/types';
import { BADGE_DEFINITIONS } from '@/lib/constants';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (userData: User) => void;
  logout: () => void;
  loading: boolean;
  addPoints: (pointsToAdd: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LEARN_AI_USER_KEY = 'learnai-user';
const LEARN_AI_LEADERBOARD_KEY = 'learnai-leaderboard-users';

// Helper function to determine badges based on points
const getEarnedBadges = (points: number): string[] => {
  return BADGE_DEFINITIONS
    .filter(badge => points >= badge.pointsThreshold)
    .map(badge => badge.name);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUserJson = localStorage.getItem(LEARN_AI_USER_KEY);
    if (storedUserJson) {
      try {
        const storedUser = JSON.parse(storedUserJson) as User;
        // Ensure points and badges are initialized
        if (typeof storedUser.points !== 'number') {
          storedUser.points = 0;
        }
        if (!Array.isArray(storedUser.badges)) {
          storedUser.badges = getEarnedBadges(storedUser.points);
        }
        setUser(storedUser);
      } catch (e) {
        console.error("Failed to parse stored user:", e);
        localStorage.removeItem(LEARN_AI_USER_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = (userData: User) => {
    const userWithGamification: User = {
      ...userData,
      points: userData.points || 0,
      badges: userData.badges || getEarnedBadges(userData.points || 0),
    };
    setUser(userWithGamification);
    localStorage.setItem(LEARN_AI_USER_KEY, JSON.stringify(userWithGamification));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(LEARN_AI_USER_KEY);
  };

  const addPoints = (pointsToAdd: number) => {
    if (!user) return;

    const newPoints = (user.points || 0) + pointsToAdd;
    const newBadges = getEarnedBadges(newPoints);

    const updatedUser: User = {
      ...user,
      points: newPoints,
      badges: newBadges,
    };
    setUser(updatedUser);
    localStorage.setItem(LEARN_AI_USER_KEY, JSON.stringify(updatedUser));

    // Update leaderboard storage
    try {
      const leaderboardUsersJson = localStorage.getItem(LEARN_AI_LEADERBOARD_KEY);
      let leaderboardUsers: LeaderboardUser[] = leaderboardUsersJson ? JSON.parse(leaderboardUsersJson) : [];
      
      const userIndexInLeaderboard = leaderboardUsers.findIndex(u => u.id === user.id);
      if (userIndexInLeaderboard !== -1) {
        leaderboardUsers[userIndexInLeaderboard].points = newPoints;
        leaderboardUsers[userIndexInLeaderboard].badges = newBadges;
      } else {
        // This case should ideally not happen if user is added to leaderboard on registration
        leaderboardUsers.push({
          id: user.id,
          name: user.name || "Anonymous",
          points: newPoints,
          badges: newBadges,
        });
      }
      localStorage.setItem(LEARN_AI_LEADERBOARD_KEY, JSON.stringify(leaderboardUsers));
    } catch (e) {
      console.error("Failed to update leaderboard:", e);
    }
  };
  
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, loading, addPoints }}>
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
