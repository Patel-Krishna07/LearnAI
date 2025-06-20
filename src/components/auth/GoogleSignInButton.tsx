"use client";

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// Replace with actual Google logo SVG or an icon from lucide-react if available
const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
    <path fill="#EA4335" d="M24 9.5c3.9 0 6.9 1.6 9.1 3.7l6.8-6.8C35.9 2.5 30.4 0 24 0 14.9 0 7.3 5.4 3 13l7.6 5.9C12.8 13.1 18 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.2 24.5c0-1.6-.1-3.2-.4-4.7H24v9h12.5c-.5 2.9-2.2 5.4-4.6 7.1l7.6 5.9c4.4-4.1 7-10.1 7-17.3z"/>
    <path fill="#FBBC05" d="M10.6 28.9c-.7-2.1-1-4.4-1-6.9s.3-4.8 1-6.9l-7.6-6C1.6 12.9 0 18.2 0 24s1.6 11.1 4.4 15.6l6.2-5.7z"/>
    <path fill="#34A853" d="M24 48c6.5 0 12-2.1 16-5.7l-7.6-5.9c-2.1 1.4-4.9 2.3-7.9 2.3-6.1 0-11.2-3.6-13.1-8.6l-7.6 5.9C7.3 42.6 14.9 48 24 48z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
);


export function GoogleSignInButton() {
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    // Placeholder for Google Sign-In logic
    // In a real app, this would involve Firebase or another OAuth provider
    toast({
      title: "Google Sign-In",
      description: "Google Sign-In is not implemented yet.",
      variant: "default",
    });
  };

  return (
    <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
      <GoogleIcon />
      <span className="ml-2">Sign in with Google</span>
    </Button>
  );
}
