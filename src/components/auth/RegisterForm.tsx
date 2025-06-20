
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
import type { User } from '@/lib/types';

// Define a type for stored users that includes the password
interface StoredUser extends User {
  password?: string; // Password stored for login check, NOT for general use
}

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
    // Simulate API call for registration
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real app, you would call your backend API here to create the user.
    // For this prototype, we'll use localStorage.
    // IMPORTANT: Storing passwords in localStorage is NOT secure for production.
    try {
      const existingUsersJSON = localStorage.getItem('learnai-registered-users');
      const existingUsers: StoredUser[] = existingUsersJSON ? JSON.parse(existingUsersJSON) : [];

      if (existingUsers.find(user => user.email === data.email)) {
        toast({
          title: 'Registration Failed',
          description: 'This email address is already registered.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      const newUser: StoredUser = {
        id: String(Date.now()), // Simple ID generation
        name: data.name,
        email: data.email,
        password: data.password, // Storing password for login check (unsafe for production)
      };

      existingUsers.push(newUser);
      localStorage.setItem('learnai-registered-users', JSON.stringify(existingUsers));

      toast({
        title: 'Registration Successful',
        description: "You can now log in with your credentials.",
      });
      router.push('/login'); // Redirect to login page
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
