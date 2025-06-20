
"use client";

import Link from 'next/link';
import { APP_NAME, MAIN_NAV_LINKS, AUTH_NAV_LINKS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, LogOut, UserCircle, NotebookText, Feather } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function Header() {
  const { isAuthenticated, user, logout, loading } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/'); 
  };

  if (loading) {
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
            <Link
              key={link.label}
              href={link.href}
              className="transition-colors hover:text-accent text-foreground/80"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end space-x-4">
          {isAuthenticated ? (
            <>
              <span className="hidden sm:inline text-sm text-muted-foreground">Welcome, {user?.name || 'User'}</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Logout">
                    <LogOut className="h-5 w-5 text-accent" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Logout</p>
                </TooltipContent>
              </Tooltip>
            </>
          ) : (
            <nav className="hidden md:flex items-center space-x-2">
              {AUTH_NAV_LINKS.map((link) => (
                <Button key={link.label} variant={link.href === '/register' ? "default" : "outline"} asChild>
                  <Link href={link.href}>{link.label}</Link>
                </Button>
              ))}
            </nav>
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
                  <Link
                    key={link.label}
                    href={link.href}
                    className="transition-colors hover:text-accent text-lg py-2"
                  >
                    {link.label}
                  </Link>
                ))}
                <hr className="my-4" />
                {!isAuthenticated && AUTH_NAV_LINKS.map((link) => (
                  <Button key={link.label} variant="outline" asChild className="w-full text-lg py-6">
                    <Link href={link.href}>{link.label}</Link>
                  </Button>
                ))}
                 {isAuthenticated && (
                   <Button variant="outline" onClick={handleLogout} className="w-full text-lg py-6">
                     Logout
                   </Button>
                 )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
