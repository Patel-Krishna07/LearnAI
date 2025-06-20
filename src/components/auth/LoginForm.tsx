
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

// Define a type for stored users that includes the password
interface StoredUser extends User {
  password?: string;
}

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
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check credentials against localStorage
    // IMPORTANT: This is NOT secure for production.
    try {
      const storedUsersJSON = localStorage.getItem('learnai-registered-users');
      const storedUsers: StoredUser[] = storedUsersJSON ? JSON.parse(storedUsersJSON) : [];
      
      const foundUser = storedUsers.find(user => user.email === data.email);

      if (foundUser && foundUser.password === data.password) {
        // Password matches. Prepare user data for AuthContext (without password)
        const userToLogin: User = {
          id: foundUser.id,
          email: foundUser.email,
          name: foundUser.name,
          image: foundUser.image, // if you store image during registration
        };
        login(userToLogin);
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
