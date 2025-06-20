
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { Feather } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <Link href="/" className="inline-block mb-4">
             <Feather className="h-12 w-12 text-accent mx-auto" />
          </Link>
          <CardTitle className="text-3xl font-headline">Forgot Your Password?</CardTitle>
          <CardDescription>No worries! Enter your email and we&apos;ll send you a reset link.</CardDescription>
        </CardHeader>
        <CardContent>
          <ForgotPasswordForm />
        </CardContent>
        <CardFooter className="text-center block text-sm">
          <p className="text-muted-foreground">
            Remembered your password?{' '}
            <Link href="/login" passHref>
               <span className="text-primary hover:underline cursor-pointer">Login</span>
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
