
"use client";

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { StudyGuideItem } from '@/components/study-guide/StudyGuideItem';
import type { StudyGuideEntry as StudyGuideEntryType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { BookMarked, PlusCircle, Trash2, NotebookText, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';


export default function StudyGuidePage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [studyGuideEntries, setStudyGuideEntries] = useState<StudyGuideEntryType[]>([]);
  const [isLoading, setIsLoading] = useState(true); // For loading entries
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/study-guide');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      // Load study guide entries from localStorage (or API in a real app)
      const loadedEntries = JSON.parse(localStorage.getItem('studyGuideEntries') || '[]');
      // Sort by newest first
      loadedEntries.sort((a: StudyGuideEntryType, b: StudyGuideEntryType) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setStudyGuideEntries(loadedEntries);
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const handleDeleteEntry = (id: string) => {
    const updatedEntries = studyGuideEntries.filter(entry => entry.id !== id);
    setStudyGuideEntries(updatedEntries);
    localStorage.setItem('studyGuideEntries', JSON.stringify(updatedEntries));
    toast({ title: 'Entry Deleted', description: 'The study guide entry has been removed.' });
  };

  const handleClearAllEntries = () => {
    setStudyGuideEntries([]);
    localStorage.removeItem('studyGuideEntries');
    toast({ title: 'Study Guide Cleared', description: 'All entries have been removed.' });
  };

  if (authLoading || isLoading && isAuthenticated) { // Show loading if auth is pending or if entries are loading and user is authenticated
    return (
      <AppShell>
        <div className="flex items-center justify-center h-[calc(100vh-150px)]">
          <Sparkles className="h-12 w-12 text-accent animate-spin" /> 
          <p className="ml-4 text-xl text-muted-foreground">Loading your study guide...</p>
        </div>
      </AppShell>
    );
  }
  
  if (!isAuthenticated) {
     return (
      <AppShell>
        <div className="flex items-center justify-center h-[calc(100vh-150px)]">
           <p className="text-xl text-muted-foreground">Please log in to view your study guide.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 text-center">
          <NotebookText className="h-16 w-16 text-accent mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-2 font-headline">My Study Guide</h1>
          <p className="text-lg text-muted-foreground">
            Your personal collection of important questions and AI-generated summaries.
          </p>
        </header>

        {studyGuideEntries.length > 0 && (
          <div className="mb-6 flex justify-end">
            <AlertDialog>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" /> Clear All Entries
                    </Button>
                  </AlertDialogTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Clear all study guide entries</p>
                </TooltipContent>
              </Tooltip>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete all your study guide entries.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAllEntries}>
                    Yes, delete all
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {isLoading && (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="p-4 border rounded-lg shadow animate-pulse">
                <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
                <div className="h-12 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        )}
        
        {!isLoading && studyGuideEntries.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <BookMarked className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
            <h2 className="text-2xl font-semibold mb-3 font-headline">Your Study Guide is Empty</h2>
            <p className="text-muted-foreground mb-6">
              Add questions and summaries from your chat sessions to build your personalized study guide.
            </p>
            <Button asChild>
              <a href="/chat">
                <PlusCircle className="mr-2 h-5 w-5" /> Start Chatting & Saving
              </a>
            </Button>
          </div>
        )}

        {!isLoading && studyGuideEntries.length > 0 && (
          <div className="space-y-6">
            {studyGuideEntries.map((entry) => (
              <StudyGuideItem
                key={entry.id}
                entry={entry}
                onDelete={handleDeleteEntry}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
