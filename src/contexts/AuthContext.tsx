
"use client";

import type { User, LeaderboardUser, MysteryBox, MysteryBoxReward, MysteryBoxTier } from '@/lib/types';
import { BADGE_DEFINITIONS } from '@/lib/constants';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';


interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (userData: User) => void;
  logout: () => void;
  loading: boolean;
  addPoints: (pointsToAdd: number) => void;
  addMysteryBox: (box: MysteryBox) => void;
  openMysteryBox: () => MysteryBoxReward | undefined;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LEARN_AI_USER_KEY = 'learnai-user';
const LEARN_AI_LEADERBOARD_KEY = 'learnai-leaderboard-users';
const LEARN_AI_REGISTERED_USERS_KEY = 'learnai-registered-users';


// Helper function to determine badges based on points
const getEarnedBadges = (points: number): string[] => {
  return BADGE_DEFINITIONS
    .filter(badge => points >= badge.pointsThreshold)
    .map(badge => badge.name);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const updateUserInLocalStorage = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem(LEARN_AI_USER_KEY, JSON.stringify(updatedUser));

    // Update leaderboard storage as well
     try {
      const leaderboardUsersJson = localStorage.getItem(LEARN_AI_LEADERBOARD_KEY);
      let leaderboardUsers: LeaderboardUser[] = leaderboardUsersJson ? JSON.parse(leaderboardUsersJson) : [];
      
      const userIndexInLeaderboard = leaderboardUsers.findIndex(u => u.id === updatedUser.id);
      if (userIndexInLeaderboard !== -1) {
        leaderboardUsers[userIndexInLeaderboard].points = updatedUser.points;
        leaderboardUsers[userIndexInLeaderboard].badges = updatedUser.badges;
        leaderboardUsers[userIndexInLeaderboard].mysteryBoxes = updatedUser.mysteryBoxes;
      } else {
         leaderboardUsers.push({
          id: updatedUser.id,
          name: updatedUser.name || "Anonymous",
          points: updatedUser.points,
          badges: updatedUser.badges,
          mysteryBoxes: updatedUser.mysteryBoxes,
        });
      }
      localStorage.setItem(LEARN_AI_LEADERBOARD_KEY, JSON.stringify(leaderboardUsers));
    } catch (e) {
      console.error("Failed to update leaderboard:", e);
    }
  };

  useEffect(() => {
    // If Firebase is not configured, auth will be null. Fallback to local-only check.
    if (!auth) {
      const storedUserJson = localStorage.getItem(LEARN_AI_USER_KEY);
      if (storedUserJson) {
          try {
              const storedUser = JSON.parse(storedUserJson) as User;
                if (typeof storedUser.points !== 'number') storedUser.points = 0;
                if (!Array.isArray(storedUser.badges)) storedUser.badges = getEarnedBadges(storedUser.points);
                if (!Array.isArray(storedUser.mysteryBoxes)) storedUser.mysteryBoxes = [];
              setUser(storedUser);
          } catch (e) {
              console.error("Failed to parse stored user:", e);
              localStorage.removeItem(LEARN_AI_USER_KEY);
              setUser(null);
          }
      } else {
        setUser(null);
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in via Firebase
        const storedUsersJSON = localStorage.getItem(LEARN_AI_REGISTERED_USERS_KEY);
        const storedUsers: User[] = storedUsersJSON ? JSON.parse(storedUsersJSON) : [];
        let appUser = storedUsers.find(u => u.email === firebaseUser.email);
        
        if (appUser) {
          // Found user in our local storage, log them into the app context
          login(appUser);
        } else {
           // This case can happen if user signed up with Google but local storage was cleared
           // We'll create a local record for them.
           const initialPoints = 0;
           const initialBadges = getEarnedBadges(initialPoints);
           const newUser: User = {
             id: firebaseUser.uid,
             email: firebaseUser.email,
             name: firebaseUser.displayName,
             image: firebaseUser.photoURL,
             points: initialPoints,
             badges: initialBadges,
             mysteryBoxes: [],
           };
           storedUsers.push(newUser);
           localStorage.setItem(LEARN_AI_REGISTERED_USERS_KEY, JSON.stringify(storedUsers));
           // Also add to leaderboard
           const leaderboardJSON = localStorage.getItem(LEARN_AI_LEADERBOARD_KEY);
           const leaderboard: LeaderboardUser[] = leaderboardJSON ? JSON.parse(leaderboardJSON) : [];
           if (!leaderboard.find(lu => lu.id === newUser.id)) {
              leaderboard.push({ id: newUser.id, name: newUser.name || "User", points: 0, badges: [], mysteryBoxes: [] });
              localStorage.setItem(LEARN_AI_LEADERBOARD_KEY, JSON.stringify(leaderboard));
           }
           login(newUser);
        }
      } else {
        // User is signed out from Firebase's perspective, or was never signed in.
        // Check for our own localStorage-based user.
        const storedUserJson = localStorage.getItem(LEARN_AI_USER_KEY);
        if (storedUserJson) {
            try {
                const storedUser = JSON.parse(storedUserJson) as User;
                 if (typeof storedUser.points !== 'number') storedUser.points = 0;
                 if (!Array.isArray(storedUser.badges)) storedUser.badges = getEarnedBadges(storedUser.points);
                 if (!Array.isArray(storedUser.mysteryBoxes)) storedUser.mysteryBoxes = [];
                setUser(storedUser);
            } catch (e) {
                console.error("Failed to parse stored user:", e);
                localStorage.removeItem(LEARN_AI_USER_KEY);
                setUser(null);
            }
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const login = (userData: User) => {
    const userWithGamification: User = {
      ...userData,
      points: userData.points || 0,
      badges: userData.badges || getEarnedBadges(userData.points || 0),
      mysteryBoxes: userData.mysteryBoxes || [],
    };
    setUser(userWithGamification);
    localStorage.setItem(LEARN_AI_USER_KEY, JSON.stringify(userWithGamification));
  };

  const logout = () => {
    if (auth) {
      signOut(auth).catch(error => console.error("Error signing out from Firebase:", error));
    }
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
    updateUserInLocalStorage(updatedUser);
  };
  
  const addMysteryBox = (box: MysteryBox) => {
    if (!user) return;
    const updatedUser: User = {
      ...user,
      mysteryBoxes: [...(user.mysteryBoxes || []), box],
    };
    updateUserInLocalStorage(updatedUser);
  };

  const openMysteryBox = (): MysteryBoxReward | undefined => {
      if (!user || !user.mysteryBoxes || user.mysteryBoxes.length === 0) {
        return undefined;
      }
      // Reward definitions
      const rewards: Record<MysteryBoxTier, { description: string, action: () => void }[]> = {
          Common: [
              { description: '+20 XP', action: () => addPoints(20) },
              { description: 'A fun fact!', action: () => {} }, // No action, just a message
              { description: 'A small hint token', action: () => {} }, // Placeholder
          ],
          Rare: [
              { description: '+50 XP', action: () => addPoints(50) },
              { description: 'A new badge!', action: () => {} }, // Placeholder
              { description: 'A study flashcard!', action: () => {} }, // Placeholder
          ],
          Epic: [
              { description: '+100 XP', action: () => addPoints(100) },
              { description: 'Avatar customization item!', action: () => {} }, // Placeholder
              { description: 'Double XP booster (1 hr)!', action: () => {} }, // Placeholder
          ],
          Legendary: [
              { description: '+200 XP', action: () => addPoints(200) },
              { description: 'An exclusive title/badge!', action: () => {} }, // Placeholder
              { description: 'A leaderboard jump!', action: () => {} }, // Placeholder
          ],
      };

      const [openedBox, ...remainingBoxes] = user.mysteryBoxes;

      const possibleRewards = rewards[openedBox.tier];
      const selectedReward = possibleRewards[Math.floor(Math.random() * possibleRewards.length)];
      
      // Perform the reward's action (e.g., add points)
      selectedReward.action();

      // Update the user state *after* the action has modified it (e.g., points have been added)
      // We need to re-fetch the user from state to ensure we have the latest data before saving
      setUser(currentUser => {
          const userAfterReward: User = {
              ...(currentUser!),
              mysteryBoxes: remainingBoxes,
          };
          updateUserInLocalStorage(userAfterReward);
          return userAfterReward;
      });

      return {
        tier: openedBox.tier,
        description: selectedReward.description,
      };
  };
  
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, loading, addPoints, addMysteryBox, openMysteryBox }}>
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

    