
"use client";

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { auth, googleProvider } from '@/lib/firebase/config';
import { signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
  const router = useRouter();

  // The button should be disabled if Firebase is not configured.
  const isFirebaseDisabled = !auth || !googleProvider;

  const handleGoogleSignIn = async () => {
    if (isFirebaseDisabled) {
      toast({
        title: "Google Sign-In Unavailable",
        description: "This feature is not configured. Please ensure Firebase keys are set in the .env file.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // The onAuthStateChanged listener in AuthContext will handle user creation and session management.
      // This button's only responsibility is to trigger the sign-in process.
      await signInWithPopup(auth!, googleProvider!);
      
      toast({ title: "Login Successful", description: "Welcome! Redirecting you now..." });

      // Redirect after successful sign-in. The AuthContext will have updated the user state.
      const queryParams = new URLSearchParams(window.location.search);
      const redirectUrl = queryParams.get('redirect') || '/chat';
      router.push(redirectUrl);

    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      if (error.code === 'auth/popup-closed-by-user') {
        toast({
          title: "Sign-In Cancelled",
          description: "You closed the sign-in window before completing the process.",
        });
      } else {
        toast({
          title: "Google Sign-In Failed",
          description: error.message || "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    }
  };

  const buttonComponent = (
     <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isFirebaseDisabled}>
      <GoogleIcon />
      <span className="ml-2">Sign in with Google</span>
    </Button>
  );

  if (isFirebaseDisabled) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {/* A div/span wrapper is needed to show a tooltip on a disabled button */}
          <div className="w-full cursor-not-allowed" tabIndex={0}>
            {buttonComponent}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Google Sign-In is not configured.</p>
          <p className="text-xs text-muted-foreground">Please provide Firebase keys in the .env file.</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return buttonComponent;
}
