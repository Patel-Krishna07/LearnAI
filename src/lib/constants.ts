import { MessageSquareText, PenSquare, BookMarked, Settings, LogOut, UserCircle, Trophy, ListChecks } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const APP_NAME = 'LearnAI';

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const MAIN_NAV_LINKS: NavLink[] = [
  { href: '/chat', label: 'Chat', icon: MessageSquareText },
  { href: '/practice', label: 'Practice', icon: PenSquare },
  { href: '/quiz', label: 'Quiz', icon: ListChecks },
  { href: '/study-guide', label: 'Study Guide', icon: BookMarked },
  { href: '/progress', label: 'Progress', icon: Trophy },
];

export const USER_NAV_LINKS = (userId: string | number): NavLink[] => [ // Example, if profile page is needed
  // { href: `/profile/${userId}`, label: 'Profile', icon: UserCircle },
  // { href: '/settings', label: 'Settings', icon: Settings },
];

export const AUTH_NAV_LINKS = [
  { href: '/login', label: 'Login' },
  { href: '/register', label: 'Register' },
];

// --- XP Points System ---
export const POINTS_PER_STUDY_GUIDE_ADD = 5;
export const POINTS_PER_TRUE_FALSE_CORRECT = 5;
export const POINTS_PER_PRACTICE_CORRECT = 8;
export const POINTS_PER_MCQ_CORRECT = 10;
export const POINTS_PER_FILL_BLANK_CORRECT = 12;
export const POINTS_PER_MATCHING_CORRECT = 15;


export interface BadgeDefinition {
  name: string;
  pointsThreshold: number;
  icon: LucideIcon; // Will be assigned in Progress page for simplicity
  description: string;
}

export const BADGE_DEFINITIONS: Omit<BadgeDefinition, 'icon'>[] = [
  { name: 'Initiate', pointsThreshold: 0, description: 'Welcome! Started your learning journey.' },
  { name: 'Explorer', pointsThreshold: 50, description: 'Ventured into new topics and practices.' },
  { name: 'Scholar', pointsThreshold: 150, description: 'Consistently learning and building knowledge.' },
  { name: 'Sage', pointsThreshold: 300, description: 'Mastered many concepts and guides.' },
];
