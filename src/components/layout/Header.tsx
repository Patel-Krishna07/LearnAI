
"use client";

import Link from 'next/link';
import { APP_NAME, MAIN_NAV_LINKS, AUTH_NAV_LINKS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, LogOut, UserCircle, NotebookText, Feather, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


export function Header() {
  const { isAuthenticated, user, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push('/'); 
  };

  if (loading && !isAuthenticated) { // Show simpler loading if not yet authenticated
    return (
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
          <div className="flex items-center gap-2 animate-pulse">
             <div className="w-8 h-8 rounded-full bg-muted"></div>
             <div className="h-6 w-24 rounded bg-muted"></div>
          </div>
          <div className="w-20 h-8 rounded bg-muted animate-pulse"></div>
        </div>
      </header>
    );
  }


  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Feather className="h-6 w-6 text-accent" />
          <span className="font-bold font-headline sm:inline-block text-xl">{APP_NAME}</span>
        </Link>
        
        <nav className="hidden md:flex flex-1 items-center space-x-6 text-sm font-medium">
          {MAIN_NAV_LINKS.map((link) => (
             (isAuthenticated || (link.href !== '/progress' && link.href !== '/study-guide' && link.href !== '/practice' && link.href !== '/chat' && link.href !== '/quiz')) && // Show all links if authenticated, else limited links
            <Link
              key={link.label}
              href={link.href}
              className={cn(
                "transition-colors hover:text-accent",
                pathname === link.href ? "text-accent font-semibold" : "text-foreground/80"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end space-x-2 sm:space-x-4">
          {isAuthenticated && user && (
             <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 sm:gap-2 px-2 py-1 rounded-md bg-accent/10 text-accent text-xs sm:text-sm font-medium cursor-default">
                  <Star className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>{user.points} pts</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Your current points</p>
              </TooltipContent>
            </Tooltip>
          )}
          {isAuthenticated ? (
            <>
              <span className="hidden sm:inline text-sm text-muted-foreground">Welcome, {user?.name || 'User'}</span>
              <AlertDialog>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Logout">
                        <LogOut className="h-5 w-5 text-accent" />
                      </Button>
                    </AlertDialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Logout</p>
                  </TooltipContent>
                </Tooltip>
                 <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You will need to log in again to access your personalized content.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            !loading && ( // Only show auth links if not loading
              <nav className="hidden md:flex items-center space-x-2">
                {AUTH_NAV_LINKS.map((link) => (
                  <Button key={link.label} variant={link.href === '/register' ? "default" : "outline"} asChild>
                    <Link href={link.href}>{link.label}</Link>
                  </Button>
                ))}
              </nav>
            )
          )}
          <Sheet>
            <Tooltip>
              <TooltipTrigger asChild>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                    <Menu className="h-5 w-5 text-accent" />
                  </Button>
                </SheetTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Open Menu</p>
              </TooltipContent>
            </Tooltip>
            <SheetContent side="right">
              <Link href="/" className="mb-6 flex items-center space-x-2">
                 <Feather className="h-6 w-6 text-accent" />
                <span className="font-bold font-headline sm:inline-block text-xl">{APP_NAME}</span>
              </Link>
              <div className="flex flex-col space-y-3">
                {MAIN_NAV_LINKS.map((link) => (
                   (isAuthenticated || (link.href !== '/progress' && link.href !== '/study-guide' && link.href !== '/practice' && link.href !== '/chat' && link.href !== '/quiz')) &&
                  <Link
                    key={link.label}
                    href={link.href}
                    className={cn(
                      "transition-colors hover:text-accent text-lg py-2",
                      pathname === link.href ? "text-accent font-semibold" : "text-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                <hr className="my-4" />
                {!isAuthenticated && !loading && AUTH_NAV_LINKS.map((link) => (
                  <Button key={link.label} variant="outline" asChild className="w-full text-lg py-6">
                    <Link href={link.href}>{link.label}</Link>
                  </Button>
                ))}
                 {isAuthenticated && (
                   <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="w-full text-lg py-6">
                          Logout
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
                          <AlertDialogDescription>
                            You will need to log in again to access your personalized content.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                 )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
