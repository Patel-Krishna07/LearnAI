
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { Feather } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <Link href="/" className="inline-block mb-4">
            <Feather className="h-12 w-12 text-accent mx-auto" />
          </Link>
          <CardTitle className="text-3xl font-headline">Join {APP_NAME} Today</CardTitle>
          <CardDescription>Create your account to start learning smarter.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RegisterForm />
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or sign up with
              </span>
            </div>
          </div>
          <GoogleSignInButton />
        </CardContent>
        <CardFooter className="text-center block text-sm">
          <p className="text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" passHref>
              <span className="text-primary hover:underline cursor-pointer">Login</span>
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
