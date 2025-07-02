
"use client";

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Award, BarChart3, Brain, Compass, Diamond, GraduationCap, ShieldCheck, Sparkles, Star, Trophy, Zap, Gift, TrendingUp } from 'lucide-react';
import type { User, LeaderboardUser, BadgeDefinition as BadgeDefinitionType } from '@/lib/types';
import { BADGE_DEFINITIONS } from '@/lib/constants';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

// Map badge names to Lucide icons
const badgeIcons: { [key: string]: LucideIcon } = {
  'Initiate': Sparkles,
  'Explorer': Compass,
  'Scholar': GraduationCap,
  'Sage': Brain,
  'Achiever': Award,
  'Master': Diamond,
};

const LEARN_AI_LEADERBOARD_KEY = 'learnai-leaderboard-users';

export default function ProgressPage() {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  const currentXP = user?.points || 0;
  const nextLevelXP = BADGE_DEFINITIONS.find(b => b.pointsThreshold > currentXP)?.pointsThreshold || (currentXP > 0 ? currentXP + 100 : 100);
  const progressPercentage = Math.min((currentXP / nextLevelXP) * 100, 100);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login?redirect=/progress');
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      const storedLeaderboardJson = localStorage.getItem(LEARN_AI_LEADERBOARD_KEY);
      if (storedLeaderboardJson) {
        try {
          const parsedLeaderboard = JSON.parse(storedLeaderboardJson) as LeaderboardUser[];
          parsedLeaderboard.sort((a, b) => (b.points || 0) - (a.points || 0));
          setLeaderboard(parsedLeaderboard);
        } catch (e) {
          console.error("Failed to parse leaderboard data:", e);
          setLeaderboard([]);
        }
      }
      setPageLoading(false);
    }
  }, [isAuthenticated, user]);


  if (authLoading || (pageLoading && isAuthenticated)) {
    return <AppShell><div className="flex items-center justify-center h-[calc(100vh-150px)]"><Sparkles className="h-12 w-12 text-accent animate-spin" /><p className="ml-4 text-xl text-muted-foreground">Loading your progress...</p></div></AppShell>;
  }
  if (!isAuthenticated || !user) {
    return <AppShell><div className="flex items-center justify-center h-[calc(100vh-150px)]"><p className="text-xl text-muted-foreground">Please log in to view your progress.</p></div></AppShell>;
  }

  const userBadgesWithDetails: BadgeDefinitionType[] = BADGE_DEFINITIONS.filter(def => user.badges.includes(def.name)).map(def => ({ ...def, icon: badgeIcons[def.name] || ShieldCheck }));

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center">
          <Trophy className="h-16 w-16 text-accent mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-2 font-headline">Your Learning Progress</h1>
          <p className="text-lg text-muted-foreground">Track your points, badges, and see how you stack up!</p>
        </header>

        <Card className="shadow-lg"><CardHeader><CardTitle className="text-2xl font-headline flex items-center gap-2"><Zap className="text-primary h-6 w-6" /> Your Stats</CardTitle></CardHeader><CardContent className="space-y-6"><div className="flex items-center justify-between p-4 bg-secondary rounded-lg shadow"><span className="text-lg font-medium text-secondary-foreground">Total XP Points</span><span className="text-3xl font-bold text-primary">{user.points}</span></div><div><h3 className="text-lg font-semibold mb-3 text-primary">Your Badges ({userBadgesWithDetails.length})</h3>{userBadgesWithDetails.length > 0 ? (<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">{userBadgesWithDetails.map((badge) => { const IconComponent = badge.icon; return (<Card key={badge.name} className="flex flex-col items-center p-4 text-center bg-background shadow-md hover:shadow-lg transition-shadow border-t-4 border-accent"><IconComponent className="h-10 w-10 text-accent mb-2" /><p className="font-semibold text-sm">{badge.name}</p><p className="text-xs text-muted-foreground">{badge.description}</p></Card>); })}</div>) : (<p className="text-muted-foreground">No badges earned yet. Keep learning to earn your first badge!</p>)}</div></CardContent></Card>
        <Card className="shadow-lg"><CardHeader><CardTitle className="text-xl font-headline flex items-center gap-2"><TrendingUp className="text-primary h-6 w-6" /> Progress to Next Milestone</CardTitle></CardHeader><CardContent className="space-y-3"><Progress value={progressPercentage} className="h-3" /><div className="flex justify-between text-sm text-muted-foreground"><span>Current XP: {currentXP}</span><span>Next Milestone at: {nextLevelXP} XP</span></div><p className="text-xs text-center text-muted-foreground italic">Keep learning to unlock more badges and climb the leaderboard!</p></CardContent></Card>
        <Card className="shadow-lg"><CardHeader><CardTitle className="text-xl font-headline flex items-center gap-2"><Gift className="text-primary h-6 w-6" /> Mystery Box</CardTitle></CardHeader><CardContent><div className="flex flex-col items-center text-center p-4 bg-secondary/50 rounded-md"><Gift className="h-12 w-12 text-accent mb-3" /><p className="font-semibold">Answer 3 practice questions in a row correctly to unlock a Mystery Box!</p><p className="text-sm text-muted-foreground mt-1">(Feature coming soon)</p><Button disabled className="mt-4">Check Streak (Coming Soon)</Button></div></CardContent></Card>
        <Card className="shadow-lg"><CardHeader><CardTitle className="text-2xl font-headline flex items-center gap-2"><BarChart3 className="text-primary h-6 w-6" /> Classroom Leaderboard</CardTitle><CardDescription>See who's leading the learning charge! (Based on users in this browser)</CardDescription></CardHeader><CardContent>{leaderboard.length > 0 ? (<ScrollArea className="h-[300px]"><Table><TableHeader><TableRow><TableHead className="w-[50px]">Rank</TableHead><TableHead>Name</TableHead><TableHead className="text-right">Points</TableHead><TableHead className="text-center">Badges</TableHead></TableRow></TableHeader><TableBody>{leaderboard.map((lbUser, index) => (<TableRow key={lbUser.id} className={lbUser.id === user.id ? 'bg-accent/20' : ''}><TableCell className="font-medium">{index + 1}</TableCell><TableCell>{lbUser.name}</TableCell><TableCell className="text-right font-semibold">{lbUser.points}</TableCell><TableCell className="text-center"><div className="flex justify-center items-center gap-1">{(lbUser.badges || []).slice(0,3).map(badgeName => { const BadgeIcon = badgeIcons[badgeName] || Star; return <BadgeIcon key={badgeName} className="h-4 w-4 text-muted-foreground" title={badgeName}/>; })}{ (lbUser.badges || []).length > 3 && <span className="text-xs text-muted-foreground ml-1">+{ (lbUser.badges || []).length - 3}</span>}</div></TableCell></TableRow>))}</TableBody></Table></ScrollArea>) : (<p className="text-muted-foreground text-center py-8">No leaderboard data yet. Be the first to set the pace!</p>)}</CardContent><CardFooter><p className="text-xs text-muted-foreground">Leaderboard data is stored locally in your browser.</p></CardFooter></Card>
      </div>
    </AppShell>
  );
}
