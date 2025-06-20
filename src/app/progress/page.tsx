
"use client";

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Award, BarChart3, Brain, Compass, Diamond, GraduationCap, ShieldCheck, Sparkles, Star, Trophy, Zap, ListChecks, ToggleRight, Link2, PenLine, Timer, CheckCircle2, XCircle, Gift, TrendingUp } from 'lucide-react';
import type { User, LeaderboardUser, BadgeDefinition as BadgeDefinitionType } from '@/lib/types';
import { BADGE_DEFINITIONS } from '@/lib/constants';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { LucideIcon } from 'lucide-react';

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

  // Placeholder for progress bar data
  const currentXP = user?.points || 0;
  const nextLevelXP = BADGE_DEFINITIONS.find(b => b.pointsThreshold > currentXP)?.pointsThreshold || (currentXP > 0 ? currentXP + 100 : 100);
  const progressPercentage = Math.min((currentXP / nextLevelXP) * 100, 100);


  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/progress');
    }
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
    return (
      <AppShell>
        <div className="flex items-center justify-center h-[calc(100vh-150px)]">
          <Sparkles className="h-12 w-12 text-accent animate-spin" />
          <p className="ml-4 text-xl text-muted-foreground">Loading your progress...</p>
        </div>
      </AppShell>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-[calc(100vh-150px)]">
          <p className="text-xl text-muted-foreground">Please log in to view your progress.</p>
        </div>
      </AppShell>
    );
  }

  const userBadgesWithDetails: BadgeDefinitionType[] = BADGE_DEFINITIONS
    .filter(def => user.badges.includes(def.name))
    .map(def => ({
        ...def,
        icon: badgeIcons[def.name] || ShieldCheck
    }));

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center">
          <Trophy className="h-16 w-16 text-accent mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-2 font-headline">Your Learning Progress</h1>
          <p className="text-lg text-muted-foreground">
            Track your points, badges, and see how you stack up!
          </p>
        </header>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-headline flex items-center gap-2">
              <Zap className="text-primary h-6 w-6" /> Your Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-secondary rounded-lg shadow">
              <span className="text-lg font-medium text-secondary-foreground">Total XP Points</span>
              <span className="text-3xl font-bold text-primary">{user.points}</span>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3 text-primary">Your Badges ({userBadgesWithDetails.length})</h3>
              {userBadgesWithDetails.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {userBadgesWithDetails.map((badge) => {
                    const IconComponent = badge.icon;
                    return (
                      <Card key={badge.name} className="flex flex-col items-center p-4 text-center bg-background shadow-md hover:shadow-lg transition-shadow border-t-4 border-accent">
                        <IconComponent className="h-10 w-10 text-accent mb-2" />
                        <p className="font-semibold text-sm">{badge.name}</p>
                        <p className="text-xs text-muted-foreground">{badge.description}</p>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground">No badges earned yet. Keep learning to earn your first badge!</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-headline flex items-center gap-2">
              <TrendingUp className="text-primary h-6 w-6" /> Progress to Next Milestone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={progressPercentage} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Current XP: {currentXP}</span>
              <span>Next Milestone at: {nextLevelXP} XP</span>
            </div>
            <p className="text-xs text-center text-muted-foreground italic">Keep learning to unlock more badges and climb the leaderboard!</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-headline flex items-center gap-2">
              <Gift className="text-primary h-6 w-6" /> Mystery Box
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center text-center p-4 bg-secondary/50 rounded-md">
              <Gift className="h-12 w-12 text-accent mb-3" />
              <p className="font-semibold">Answer 3 practice questions in a row correctly to unlock a Mystery Box!</p>
              <p className="text-sm text-muted-foreground mt-1">(Feature coming soon)</p>
              <Button disabled className="mt-4">Check Streak (Coming Soon)</Button>
            </div>
          </CardContent>
        </Card>


        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-headline flex items-center gap-2">
              <BarChart3 className="text-primary h-6 w-6" /> Classroom Leaderboard
            </CardTitle>
            <CardDescription>See who's leading the learning charge! (Based on users in this browser)</CardDescription>
          </CardHeader>
          <CardContent>
            {leaderboard.length > 0 ? (
              <ScrollArea className="h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Rank</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Points</TableHead>
                      <TableHead className="text-center">Badges</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard.map((lbUser, index) => (
                      <TableRow key={lbUser.id} className={lbUser.id === user.id ? 'bg-accent/20' : ''}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>{lbUser.name}</TableCell>
                        <TableCell className="text-right font-semibold">{lbUser.points}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center items-center gap-1">
                            {(lbUser.badges || []).slice(0,3).map(badgeName => {
                                const BadgeIcon = badgeIcons[badgeName] || Star;
                                return <BadgeIcon key={badgeName} className="h-4 w-4 text-muted-foreground" title={badgeName}/>;
                            })}
                            {(lbUser.badges || []).length > 3 && <span className="text-xs text-muted-foreground ml-1">+{ (lbUser.badges || []).length - 3}</span>}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No leaderboard data yet. Be the first to set the pace!
              </p>
            )}
          </CardContent>
           <CardFooter>
            <p className="text-xs text-muted-foreground">Leaderboard data is stored locally in your browser.</p>
          </CardFooter>
        </Card>

        {/* Interactive Challenges Section */}
        <section className="space-y-8">
          <header className="text-center">
            <h2 className="text-3xl font-bold font-headline">Interactive Challenges</h2>
            <p className="text-md text-muted-foreground">Sharpen your skills with these mini-games!</p>
          </header>

          {/* 1. Quick Multiple Choice (MCQs) */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-headline flex items-center gap-2">
                <ListChecks className="text-primary h-6 w-6" /> Quick MCQs
              </CardTitle>
              <CardDescription>Test your knowledge with multiple choice questions. Earn +10 XP for right answer!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="font-semibold">What is the powerhouse of the cell?</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button variant="outline">a) Nucleus</Button>
                <Button variant="outline">b) Ribosome</Button>
                <Button variant="outline" className="border-green-500 text-green-600 hover:bg-green-50">c) Mitochondria <CheckCircle2 className="ml-2 h-4 w-4 text-green-500"/></Button>
                <Button variant="outline">d) Cell wall</Button>
              </div>
              <p className="text-sm text-muted-foreground italic">Static example. Full interactivity & XP to be added.</p>
            </CardContent>
            <CardFooter>
                <Button disabled>Generate New MCQ (Coming Soon)</Button>
            </CardFooter>
          </Card>

          {/* 2. True/False Challenges */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-headline flex items-center gap-2">
                <ToggleRight className="text-primary h-6 w-6" /> True/False Challenges
              </CardTitle>
              <CardDescription>Quick decision-making for warmups. Earn +5 XP for correct answers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-md">
                  <p>The Sun is a planet.</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">True</Button>
                    <Button variant="destructive" size="sm" className="bg-red-500 hover:bg-red-600"><XCircle className="mr-1 h-4 w-4"/> False</Button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-md">
                  <p>Water boils at 100°C at sea level.</p>
                  <div className="flex gap-2">
                    <Button variant="default" size="sm" className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="mr-1 h-4 w-4"/> True</Button>
                    <Button variant="outline" size="sm">False</Button>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground italic">Static example. Full interactivity & XP to be added.</p>
            </CardContent>
             <CardFooter>
                <Button disabled>New True/False (Coming Soon)</Button>
            </CardFooter>
          </Card>

          {/* 3. Match the Pairs */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-headline flex items-center gap-2">
                <Link2 className="text-primary h-6 w-6" /> Match the Pairs
              </CardTitle>
              <CardDescription>Connect terms to their meanings. Earn +15 XP for a full correct match.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="font-semibold">Match the following terms:</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div className="p-2 border rounded-md bg-background"><strong>Term:</strong> Photosynthesis</div>
                <div className="p-2 border rounded-md bg-background"><strong>Meaning:</strong> Plant energy process</div>
                <div className="p-2 border rounded-md bg-background"><strong>Term:</strong> Mitochondria</div>
                <div className="p-2 border rounded-md bg-background"><strong>Meaning:</strong> Powerhouse of the cell</div>
                <div className="p-2 border rounded-md bg-background"><strong>Term:</strong> H₂O</div>
                <div className="p-2 border rounded-md bg-background"><strong>Meaning:</strong> Water</div>
                <div className="p-2 border rounded-md bg-background"><strong>Term:</strong> DNA</div>
                <div className="p-2 border rounded-md bg-background"><strong>Meaning:</strong> Genetic material</div>
              </div>
              <p className="text-sm text-muted-foreground italic">Static example. Draggable matching UI & XP to be added.</p>
            </CardContent>
            <CardFooter>
                <Button disabled>New Matching Game (Coming Soon)</Button>
            </CardFooter>
          </Card>

          {/* 4. "Fill in the Blank" Mini-Quizzes */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-headline flex items-center gap-2">
                <PenLine className="text-primary h-6 w-6" /> Fill in the Blank
              </CardTitle>
              <CardDescription>Type a word or number. Earn +8 XP for each correct blank.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span>5 + 7 = </span> <Input type="text" placeholder="Your answer" className="w-24 h-8" />
                </div>
                <div className="flex items-center gap-2">
                  <span>The capital of France is </span> <Input type="text" placeholder="Your answer" className="w-36 h-8" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground italic">Static example. Input validation, AI flexible matching & XP to be added.</p>
            </CardContent>
            <CardFooter>
                <Button disabled>New Fill-in-Blank (Coming Soon)</Button>
            </CardFooter>
          </Card>

          {/* 5. Timed Brain Boosters */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-headline flex items-center gap-2">
                <Timer className="text-primary h-6 w-6" /> Timed Brain Boosters
              </CardTitle>
              <CardDescription>Answer quickly! Earn +12 XP for correct answer within time.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="font-semibold">You have 20 seconds to answer: What is 3³?</p>
              <Input type="text" placeholder="Your answer" className="h-10"/>
              <div className="text-lg font-bold text-destructive">Time left: 15s</div>
              <p className="text-sm text-muted-foreground italic">Static example. Timer functionality, answer checking & XP to be added.</p>
            </CardContent>
            <CardFooter>
                <Button disabled>Start Timed Challenge (Coming Soon)</Button>
            </CardFooter>
          </Card>

        </section>
      </div>
    </AppShell>
  );
}

