
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from '@/components/auth/LoginForm';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { Feather } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <Link href="/" className="inline-block mb-4">
            <Feather className="h-12 w-12 text-accent mx-auto" />
          </Link>
          <CardTitle className="text-3xl font-headline">Welcome Back to {APP_NAME}</CardTitle>
          <CardDescription>Sign in to continue your learning journey.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <LoginForm />
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <GoogleSignInButton />
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-sm">
          <Link href="/forgot-password" passHref>
            <span className="text-primary hover:underline cursor-pointer">Forgot password?</span>
          </Link>
          <p className="text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/register" passHref>
              <span className="text-primary hover:underline cursor-pointer">Register</span>
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
