
"use client";

import type { User, LeaderboardUser, MysteryBox, MysteryBoxReward } from '@/lib/types';
import { BADGE_DEFINITIONS } from '@/lib/constants';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { generateMysteryBoxReward } from '@/ai/flows/generate-mystery-box-reward';


interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (userData: User) => void;
  logout: () => void;
  loading: boolean;
  addPoints: (pointsToAdd: number) => void;
  addMysteryBox: (box: MysteryBox) => void;
  openMysteryBox: () => Promise<MysteryBoxReward | undefined>;
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

  const updateUserInLocalStorage = (updatedUser: User | null) => {
    if (!updatedUser) {
        setUser(null);
        localStorage.removeItem(LEARN_AI_USER_KEY);
        // Note: We are not removing the user from the leaderboard on logout
        return;
    }

    setUser(updatedUser);
    localStorage.setItem(LEARN_AI_USER_KEY, JSON.stringify(updatedUser));

    try {
      const leaderboardUsersJson = localStorage.getItem(LEARN_AI_LEADERBOARD_KEY);
      let leaderboardUsers: LeaderboardUser[] = leaderboardUsersJson ? JSON.parse(leaderboardUsersJson) : [];
      
      const userIndexInLeaderboard = leaderboardUsers.findIndex(u => u.id === updatedUser.id);
      if (userIndexInLeaderboard !== -1) {
        leaderboardUsers[userIndexInLeaderboard].points = updatedUser.points;
        leaderboardUsers[userIndexInLeaderboard].badges = updatedUser.badges;
        leaderboardUsers[userIndexInLeaderboard].mysteryBoxes = updatedUser.mysteryBoxes;
        leaderboardUsers[userIndexInLeaderboard].title = updatedUser.title;
      } else {
         leaderboardUsers.push({
          id: updatedUser.id,
          name: updatedUser.name || "Anonymous",
          points: updatedUser.points,
          badges: updatedUser.badges,
          mysteryBoxes: updatedUser.mysteryBoxes,
          title: updatedUser.title,
        });
      }
      // Re-sort leaderboard after update
      leaderboardUsers.sort((a, b) => b.points - a.points);
      localStorage.setItem(LEARN_AI_LEADERBOARD_KEY, JSON.stringify(leaderboardUsers));
    } catch (e) {
      console.error("Failed to update leaderboard:", e);
    }
  };

  useEffect(() => {
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
        const storedUsersJSON = localStorage.getItem(LEARN_AI_REGISTERED_USERS_KEY);
        const storedUsers: User[] = storedUsersJSON ? JSON.parse(storedUsersJSON) : [];
        let appUser = storedUsers.find(u => u.email === firebaseUser.email);
        
        if (appUser) {
          login(appUser);
        } else {
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
           const leaderboardJSON = localStorage.getItem(LEARN_AI_LEADERBOARD_KEY);
           const leaderboard: LeaderboardUser[] = leaderboardJSON ? JSON.parse(leaderboardJSON) : [];
           if (!leaderboard.find(lu => lu.id === newUser.id)) {
              leaderboard.push({ id: newUser.id, name: newUser.name || "User", points: 0, badges: [], mysteryBoxes: [] });
              localStorage.setItem(LEARN_AI_LEADERBOARD_KEY, JSON.stringify(leaderboard));
           }
           login(newUser);
        }
      } else {
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

    return () => unsubscribe();
  }, []);

  const login = (userData: User) => {
    const userWithGamification: User = {
      ...userData,
      points: userData.points || 0,
      badges: userData.badges || getEarnedBadges(userData.points || 0),
      mysteryBoxes: userData.mysteryBoxes || [],
      title: userData.title,
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

  const addPoints = (pointsToAdd: number, currentUser: User): User => {
    const newPoints = (currentUser.points || 0) + pointsToAdd;
    const newBadges = getEarnedBadges(newPoints);
    return { ...currentUser, points: newPoints, badges: newBadges };
  };
  
  const addMysteryBox = (box: MysteryBox) => {
    if (!user) return;
    const updatedUser: User = {
      ...user,
      mysteryBoxes: [...(user.mysteryBoxes || []), box],
    };
    updateUserInLocalStorage(updatedUser);
  };

  const openMysteryBox = async (): Promise<MysteryBoxReward | undefined> => {
      if (!user || !user.mysteryBoxes || user.mysteryBoxes.length === 0) {
        return undefined;
      }
      
      const [openedBox, ...remainingBoxes] = user.mysteryBoxes;
      let currentUserState = { ...user, mysteryBoxes: remainingBoxes };
      let finalReward: MysteryBoxReward;
      
      const rand = Math.random() * 100;
      let chosenTier: 'Common' | 'Rare' | 'Epic' | 'Legendary';
      if (rand < 1) chosenTier = 'Legendary';
      else if (rand < 10) chosenTier = 'Epic';
      else if (rand < 40) chosenTier = 'Rare';
      else chosenTier = 'Common';

      try {
        if (chosenTier === 'Common') {
            const commonRewards = ['+20 XP', 'fun fact', 'hint token'];
            const chosen = commonRewards[Math.floor(Math.random() * commonRewards.length)];
            if (chosen === '+20 XP') {
                currentUserState = addPoints(20, currentUserState);
                finalReward = { tier: 'Common', reward: '+20 XP', message: 'A nice boost to your points!' };
            } else {
                const result = await generateMysteryBoxReward({ tier: 'Common' });
                finalReward = { tier: 'Common', reward: result.reward, message: result.message };
            }
        } else if (chosenTier === 'Rare') {
            const rareRewards = ['+50 XP', 'new badge', 'study flashcards'];
            const chosen = rareRewards[Math.floor(Math.random() * rareRewards.length)];
             if (chosen === '+50 XP') {
                currentUserState = addPoints(50, currentUserState);
                finalReward = { tier: 'Rare', reward: '+50 XP', message: 'Excellent! Keep up the great work.' };
            } else { // Placeholder for other rare rewards
                finalReward = { tier: 'Rare', reward: 'A rare study flashcard!', message: 'This looks useful for later!' };
            }
        } else if (chosenTier === 'Epic') {
            const epicRewards = ['+100 XP', 'double xp booster'];
            const chosen = epicRewards[Math.floor(Math.random() * epicRewards.length)];
            if (chosen === '+100 XP') {
                currentUserState = addPoints(100, currentUserState);
                finalReward = { tier: 'Epic', reward: '+100 XP', message: 'An epic point haul! You\'re on fire!' };
            } else { // Placeholder
                finalReward = { tier: 'Epic', reward: 'Double XP Booster (1hr)!', message: 'All points are doubled for an hour!' };
            }
        } else { // Legendary
            const legendaryRewards = ['+200 XP', 'exclusive title/badge', 'leaderboard jump'];
            const chosen = legendaryRewards[Math.floor(Math.random() * legendaryRewards.length)];
            if (chosen === '+200 XP') {
                currentUserState = addPoints(200, currentUserState);
                finalReward = { tier: 'Legendary', reward: '+200 XP', message: 'Legendary! Your knowledge is vast.' };
            } else if (chosen === 'exclusive title/badge') {
                const result = await generateMysteryBoxReward({ tier: 'Legendary' });
                currentUserState.title = result.reward;
                finalReward = { tier: 'Legendary', reward: `New Title: ${result.reward}`, message: result.message };
            } else { // Leaderboard Jump
                const leaderboardUsersJson = localStorage.getItem(LEARN_AI_LEADERBOARD_KEY);
                let leaderboardUsers: LeaderboardUser[] = leaderboardUsersJson ? JSON.parse(leaderboardUsersJson) : [];
                leaderboardUsers.sort((a, b) => b.points - a.points);
                const userIndex = leaderboardUsers.findIndex(u => u.id === currentUserState.id);

                if (userIndex > 0) {
                    const userToSwapWith = leaderboardUsers[userIndex - 1];
                    // Swap points and titles to effectively swap ranks
                    [leaderboardUsers[userIndex].points, userToSwapWith.points] = [userToSwapWith.points, leaderboardUsers[userIndex].points];
                    [leaderboardUsers[userIndex].title, userToSwapWith.title] = [userToSwapWith.title, leaderboardUsers[userIndex].title];
                    
                    // Update current user's points to reflect the jump
                    currentUserState.points = leaderboardUsers[userIndex].points;
                    
                    localStorage.setItem(LEARN_AI_LEADERBOARD_KEY, JSON.stringify(leaderboardUsers));
                    finalReward = { tier: 'Legendary', reward: 'Leaderboard Jump!', message: 'You\'ve climbed one rank higher!' };
                } else {
                     // Already rank 1, give XP instead
                    currentUserState = addPoints(200, currentUserState);
                    finalReward = { tier: 'Legendary', reward: '+200 XP', message: 'You were already at the top, so here are some points!' };
                }
            }
        }
      } catch (error) {
          console.error("Error opening mystery box, giving fallback reward", error);
          currentUserState = addPoints(20, currentUserState);
          finalReward = { tier: 'Common', reward: '+20 XP', message: 'We had a little trouble, but here are some points!' };
      }

      updateUserInLocalStorage(currentUserState);
      return finalReward;
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
