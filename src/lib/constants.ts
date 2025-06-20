import { MessageSquareText, PenSquare, BookMarked, Settings, LogOut, UserCircle } from 'lucide-react';
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
  { href: '/study-guide', label: 'Study Guide', icon: BookMarked },
];

export const USER_NAV_LINKS = (userId: string | number): NavLink[] => [ // Example, if profile page is needed
  // { href: `/profile/${userId}`, label: 'Profile', icon: UserCircle },
  // { href: '/settings', label: 'Settings', icon: Settings },
];

export const AUTH_NAV_LINKS = [
  { href: '/login', label: 'Login' },
  { href: '/register', label: 'Register' },
];
