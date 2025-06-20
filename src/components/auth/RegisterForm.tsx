
"use client";

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RegisterSchema, type RegisterFormData } from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { User, LeaderboardUser } from '@/lib/types';
import { BADGE_DEFINITIONS } from '@/lib/constants';


// Define a type for stored users that includes the password
interface StoredRegisteredUser extends User {
  password?: string; // Password stored for login check, NOT for general use
}

const getInitialBadges = (points: number): string[] => {
  return BADGE_DEFINITIONS
    .filter(badge => points >= badge.pointsThreshold)
    .map(badge => badge.name);
};

const LEARN_AI_REGISTERED_USERS_KEY = 'learnai-registered-users';
const LEARN_AI_LEADERBOARD_KEY = 'learnai-leaderboard-users';

export function RegisterForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(data: RegisterFormData) {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      const existingRegisteredUsersJSON = localStorage.getItem(LEARN_AI_REGISTERED_USERS_KEY);
      const existingRegisteredUsers: StoredRegisteredUser[] = existingRegisteredUsersJSON ? JSON.parse(existingRegisteredUsersJSON) : [];

      if (existingRegisteredUsers.find(user => user.email === data.email)) {
        toast({
          title: 'Registration Failed',
          description: 'This email address is already registered.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
      
      const initialPoints = 0;
      const initialBadges = getInitialBadges(initialPoints);

      const newUserForRegistration: StoredRegisteredUser = {
        id: String(Date.now()),
        name: data.name,
        email: data.email,
        password: data.password, 
        points: initialPoints,
        badges: initialBadges,
      };

      existingRegisteredUsers.push(newUserForRegistration);
      localStorage.setItem(LEARN_AI_REGISTERED_USERS_KEY, JSON.stringify(existingRegisteredUsers));

      // Add to leaderboard storage
      const existingLeaderboardUsersJSON = localStorage.getItem(LEARN_AI_LEADERBOARD_KEY);
      const existingLeaderboardUsers: LeaderboardUser[] = existingLeaderboardUsersJSON ? JSON.parse(existingLeaderboardUsersJSON) : [];
      
      const newUserForLeaderboard: LeaderboardUser = {
        id: newUserForRegistration.id,
        name: newUserForRegistration.name || "Anonymous",
        points: initialPoints,
        badges: initialBadges,
      };
      existingLeaderboardUsers.push(newUserForLeaderboard);
      localStorage.setItem(LEARN_AI_LEADERBOARD_KEY, JSON.stringify(existingLeaderboardUsers));

      toast({
        title: 'Registration Successful',
        description: "You can now log in with your credentials.",
      });
      router.push('/login');
    } catch (error) {
      console.error("Error during registration:", error);
      toast({
        title: 'Registration Error',
        description: 'An unexpected error occurred during registration.',
        variant: 'destructive',
      });
    }
    
    setIsLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Your Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>
    </Form>
  );
}
