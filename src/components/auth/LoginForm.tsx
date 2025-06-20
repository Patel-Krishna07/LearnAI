
"use client";

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { LoginSchema, type LoginFormData } from '@/lib/schemas';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { User } from '@/lib/types';
import { BADGE_DEFINITIONS } from '@/lib/constants';

// Define a type for stored users that includes the password
interface StoredRegisteredUser extends User {
  password?: string;
}

const LEARN_AI_REGISTERED_USERS_KEY = 'learnai-registered-users';

const getInitialBadges = (points: number): string[] => {
  return BADGE_DEFINITIONS
    .filter(badge => points >= badge.pointsThreshold)
    .map(badge => badge.name);
};

export function LoginForm() {
  const { login } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: LoginFormData) {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      const storedUsersJSON = localStorage.getItem(LEARN_AI_REGISTERED_USERS_KEY);
      const storedUsers: StoredRegisteredUser[] = storedUsersJSON ? JSON.parse(storedUsersJSON) : [];
      
      const foundUser = storedUsers.find(user => user.email === data.email);

      if (foundUser && foundUser.password === data.password) {
        const points = typeof foundUser.points === 'number' ? foundUser.points : 0;
        const badges = Array.isArray(foundUser.badges) ? foundUser.badges : getInitialBadges(points);

        const userToLogin: User = {
          id: foundUser.id,
          email: foundUser.email,
          name: foundUser.name,
          image: foundUser.image, 
          points: points,
          badges: badges,
        };
        login(userToLogin); // AuthContext login will handle setting its own state
        toast({ title: 'Login Successful', description: 'Welcome back!' });
        
        const queryParams = new URLSearchParams(window.location.search);
        const redirectUrl = queryParams.get('redirect') || '/chat';
        router.push(redirectUrl);

      } else {
        toast({
          title: 'Login Failed',
          description: 'Invalid email or password.',
          variant: 'destructive',
        });
      }
    } catch (error) {
        console.error("Error during login:", error);
        toast({
          title: 'Login Error',
          description: 'An unexpected error occurred during login.',
          variant: 'destructive',
        });
    }
    
    setIsLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </Button>
      </form>
    </Form>
  );
}
