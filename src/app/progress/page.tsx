
"use client";

import { useState, useEffect, useRef } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Award, BarChart3, Brain, Compass, Diamond, GraduationCap, ShieldCheck, Sparkles, Star, Trophy, Zap, ListChecks, ToggleRight, Link2, PenLine, Timer, CheckCircle2, XCircle, Gift, TrendingUp, Lightbulb } from 'lucide-react';
import type { User, LeaderboardUser, BadgeDefinition as BadgeDefinitionType } from '@/lib/types';
import {
  BADGE_DEFINITIONS,
  POINTS_FOR_MCQ_CORRECT,
  POINTS_FOR_TRUE_FALSE_CORRECT,
  POINTS_FOR_MATCHING_CORRECT,
  POINTS_FOR_FILL_BLANK_CORRECT,
  POINTS_FOR_TIMED_CORRECT,
} from '@/lib/constants';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { LucideIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateMcq, type GenerateMcqOutput } from '@/ai/flows/generate-mcq-flow';
import { generateTrueFalse, type GenerateTrueFalseOutput } from '@/ai/flows/generate-true-false-flow';
import { generateMatchingPairs, type GenerateMatchingPairsOutput } from '@/ai/flows/generate-matching-pairs-flow';
import { generateFillBlank, type GenerateFillBlankOutput } from '@/ai/flows/generate-fill-blank-flow';
import { generateTimedQuestion, type GenerateTimedQuestionOutput } from '@/ai/flows/generate-timed-question-flow';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { shuffle } from 'lodash';


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
  const { isAuthenticated, user, loading: authLoading, addPoints } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  // --- States for Interactive Challenges ---

  const [mcqState, setMcqState] = useState<{ topic: string; isLoading: boolean; data: GenerateMcqOutput | null; selectedAnswerIndex: number | null }>({ topic: '', isLoading: false, data: null, selectedAnswerIndex: null });
  const [trueFalseState, setTrueFalseState] = useState<{ topic: string; isLoading: boolean; data: GenerateTrueFalseOutput | null; selectedAnswer: boolean | null }>({ topic: '', isLoading: false, data: null, selectedAnswer: null });
  const [matchingState, setMatchingState] = useState<{ topic: string; isLoading: boolean; data: GenerateMatchingPairsOutput | null; shuffledDefs: { definition: string; originalIndex: number }[]; selectedTermIndex: number | null; matches: (number | null)[]; isFinished: boolean; }>({ topic: '', isLoading: false, data: null, shuffledDefs: [], selectedTermIndex: null, matches: [], isFinished: false });
  const [fillBlankState, setFillBlankState] = useState<{ topic: string; isLoading: boolean; data: GenerateFillBlankOutput | null; userAnswer: string; isSubmitted: boolean; }>({ topic: '', isLoading: false, data: null, userAnswer: '', isSubmitted: false });
  const [timedState, setTimedState] = useState<{ topic: string; isLoading: boolean; data: GenerateTimedQuestionOutput | null; userAnswer: string; timer: number; isComplete: boolean; }>({ topic: '', isLoading: false, data: null, userAnswer: '', timer: 20, isComplete: false });
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // --- General Setup ---

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

  // --- Timer Logic ---
  useEffect(() => {
    if (timedState.data && timedState.timer > 0 && !timedState.isComplete) {
      timerIntervalRef.current = setInterval(() => setTimedState(prev => ({ ...prev, timer: prev.timer - 1 })), 1000);
    } else if (timedState.timer === 0 && !timedState.isComplete) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setTimedState(prev => ({ ...prev, isComplete: true }));
      toast({ title: "Time's up!", description: "You ran out of time.", variant: 'destructive' });
    }
    return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
  }, [timedState.data, timedState.timer, timedState.isComplete, toast]);


  // --- Handlers for Challenges ---

  const handleGenerateMcq = async () => {
    if (!mcqState.topic.trim()) { toast({ title: "Topic is required", variant: "destructive" }); return; }
    setMcqState(prev => ({ ...prev, isLoading: true, data: null, selectedAnswerIndex: null }));
    try {
      const result = await generateMcq({ topic: mcqState.topic });
      setMcqState(prev => ({ ...prev, data: result, isLoading: false }));
    } catch (error) {
      console.error('Error generating MCQ:', error);
      toast({ title: 'Error', description: 'Failed to generate a question.', variant: 'destructive' });
      setMcqState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleSelectAnswer = (selectedIndex: number) => {
    if (mcqState.selectedAnswerIndex !== null || !mcqState.data) return;
    setMcqState(prev => ({ ...prev, selectedAnswerIndex: selectedIndex }));
    const isCorrect = selectedIndex === mcqState.data.correctAnswerIndex;
    if (isCorrect) {
      addPoints(POINTS_FOR_MCQ_CORRECT);
      toast({ title: 'Correct!', description: `You earned ${POINTS_FOR_MCQ_CORRECT} XP points!` });
    } else {
      toast({ title: 'Not quite', description: 'Try another question!', variant: 'destructive' });
    }
  };

  const handleGenerateTrueFalse = async () => {
    if (!trueFalseState.topic.trim()) { toast({ title: "Topic is required", variant: "destructive" }); return; }
    setTrueFalseState({ ...trueFalseState, isLoading: true, data: null, selectedAnswer: null });
    try {
      const result = await generateTrueFalse({ topic: trueFalseState.topic });
      setTrueFalseState(prev => ({ ...prev, data: result, isLoading: false }));
    } catch (error) {
      console.error('Error generating True/False:', error);
      toast({ title: 'Error', description: 'Failed to generate a statement.', variant: 'destructive' });
      setTrueFalseState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleSelectTrueFalse = (answer: boolean) => {
    if (trueFalseState.selectedAnswer !== null || !trueFalseState.data) return;
    setTrueFalseState(prev => ({ ...prev, selectedAnswer: answer }));
    if (answer === trueFalseState.data.isTrue) {
      addPoints(POINTS_FOR_TRUE_FALSE_CORRECT);
      toast({ title: 'Correct!', description: `+${POINTS_FOR_TRUE_FALSE_CORRECT} XP!` });
    } else {
      toast({ title: 'Incorrect!', variant: 'destructive' });
    }
  };

  const handleGenerateMatchingPairs = async () => {
    if (!matchingState.topic.trim()) { toast({ title: "Topic is required", variant: "destructive" }); return; }
    setMatchingState(prev => ({ ...prev, isLoading: true, data: null, selectedTermIndex: null, matches: [], isFinished: false }));
    try {
      const result = await generateMatchingPairs({ topic: matchingState.topic, numPairs: 4 });
      const shuffled = shuffle(result.pairs.map((p, i) => ({ definition: p.definition, originalIndex: i })));
      setMatchingState(prev => ({ ...prev, data: result, shuffledDefs: shuffled, matches: new Array(result.pairs.length).fill(null), isLoading: false }));
    } catch (error) {
      console.error('Error generating matching pairs:', error);
      toast({ title: 'Error', description: 'Failed to generate a matching game.', variant: 'destructive' });
      setMatchingState(prev => ({...prev, isLoading: false }));
    }
  };

  const handleSelectTerm = (termIndex: number) => {
    if (matchingState.isFinished || matchingState.matches[termIndex] !== null) return;
    setMatchingState(prev => ({ ...prev, selectedTermIndex: termIndex }));
  };

  const handleSelectDef = (defIndex: number) => {
    if (matchingState.selectedTermIndex === null || matchingState.shuffledDefs.some((d, i) => i === defIndex && matchingState.matches.includes(d.originalIndex))) return;
    const newMatches = [...matchingState.matches];
    newMatches[matchingState.selectedTermIndex] = matchingState.shuffledDefs[defIndex].originalIndex;
    setMatchingState(prev => ({ ...prev, matches: newMatches, selectedTermIndex: null }));
  };
  
  const handleCheckMatches = () => {
    const correctCount = matchingState.matches.filter((m, i) => m === i).length;
    if (correctCount === matchingState.data?.pairs.length) {
      addPoints(POINTS_FOR_MATCHING_CORRECT);
      toast({ title: 'Perfect Match!', description: `You earned ${POINTS_FOR_MATCHING_CORRECT} XP!` });
    } else {
      toast({ title: 'Some are incorrect', description: `You correctly matched ${correctCount} out of ${matchingState.data?.pairs.length}.`, variant: 'destructive'});
    }
    setMatchingState(prev => ({ ...prev, isFinished: true }));
  };

  const handleGenerateFillBlank = async () => {
      if (!fillBlankState.topic.trim()) { toast({ title: "Topic is required", variant: "destructive" }); return; }
      setFillBlankState({ topic: fillBlankState.topic, isLoading: true, data: null, userAnswer: '', isSubmitted: false });
      try {
        const result = await generateFillBlank({ topic: fillBlankState.topic });
        setFillBlankState(prev => ({ ...prev, data: result, isLoading: false }));
      } catch (error) {
        console.error('Error generating fill in the blank:', error);
        toast({ title: 'Error', description: 'Failed to generate a question.', variant: 'destructive' });
        setFillBlankState(prev => ({ ...prev, isLoading: false }));
      }
  };
  
  const handleCheckFillBlank = () => {
    if (!fillBlankState.data) return;
    setFillBlankState(prev => ({ ...prev, isSubmitted: true }));
    if (fillBlankState.userAnswer.trim().toLowerCase() === fillBlankState.data.answer.toLowerCase()) {
      addPoints(POINTS_FOR_FILL_BLANK_CORRECT);
      toast({ title: 'Correct!', description: `+${POINTS_FOR_FILL_BLANK_CORRECT} XP!` });
    } else {
      toast({ title: 'Not quite!', description: `The correct answer was: ${fillBlankState.data.answer}`, variant: 'destructive' });
    }
  };

  const handleGenerateTimedQuestion = async () => {
    if (!timedState.topic.trim()) { toast({ title: "Topic is required", variant: "destructive" }); return; }
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setTimedState({ topic: timedState.topic, isLoading: true, data: null, userAnswer: '', timer: 20, isComplete: false });
    try {
      const result = await generateTimedQuestion({ topic: timedState.topic });
      setTimedState(prev => ({ ...prev, data: result, isLoading: false }));
    } catch (error) {
      console.error('Error generating timed question:', error);
      toast({ title: 'Error', description: 'Failed to generate a question.', variant: 'destructive' });
      setTimedState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleCheckTimedQuestion = () => {
    if (!timedState.data || timedState.isComplete) return;
    setTimedState(prev => ({...prev, isComplete: true}));
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (timedState.userAnswer.trim().toLowerCase() === timedState.data.answer.toLowerCase()) {
      addPoints(POINTS_FOR_TIMED_CORRECT);
      toast({ title: 'Correct!', description: `You answered in time! +${POINTS_FOR_TIMED_CORRECT} XP!` });
    } else {
      toast({ title: 'Incorrect!', description: `The correct answer was: ${timedState.data.answer}`, variant: 'destructive' });
    }
  };

  // --- Render Logic ---

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

        {/* Interactive Challenges Section */}
        <section className="space-y-8">
          <header className="text-center"><h2 className="text-3xl font-bold font-headline">Interactive Challenges</h2><p className="text-md text-muted-foreground">Sharpen your skills with these mini-games!</p></header>

          {/* 1. Quick Multiple Choice (MCQs) */}
          <Card className="shadow-lg"><CardHeader><CardTitle className="text-xl font-headline flex items-center gap-2"><ListChecks className="text-primary h-6 w-6" /> Quick MCQs</CardTitle><CardDescription>Test your knowledge with multiple choice questions. Earn +{POINTS_FOR_MCQ_CORRECT} XP for a right answer!</CardDescription></CardHeader><CardContent className="space-y-4">{mcqState.isLoading ? (<div className="space-y-4"><Skeleton className="h-6 w-3/4" /><div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div></div>) : mcqState.data ? (<><p className="font-semibold">{mcqState.data.question}</p><div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{mcqState.data.options.map((option, index) => { const isSelected = mcqState.selectedAnswerIndex === index; const isCorrect = mcqState.data.correctAnswerIndex === index; const hasBeenAnswered = mcqState.selectedAnswerIndex !== null; return (<Button key={index} variant="outline" onClick={() => handleSelectAnswer(index)} disabled={hasBeenAnswered} className={cn("justify-start text-left h-auto py-2", hasBeenAnswered && isCorrect && "border-green-500 bg-green-500/10 text-green-700 hover:bg-green-500/20", hasBeenAnswered && !isCorrect && isSelected && "border-red-500 bg-red-500/10 text-red-700 hover:bg-red-500/20", "disabled:opacity-100 disabled:cursor-not-allowed")}>{option}{hasBeenAnswered && isCorrect && <CheckCircle2 className="ml-auto h-5 w-5 text-green-500" />}{hasBeenAnswered && !isCorrect && isSelected && <XCircle className="ml-auto h-5 w-5 text-red-500" />}</Button>); })}</div></>) : (<div className="flex flex-col items-center justify-center text-center p-4 bg-secondary/30 rounded-md"><Lightbulb className="h-12 w-12 text-muted-foreground mb-4" /><p className="text-muted-foreground">Enter a topic below and click "Generate" to start a quiz!</p></div>)}</CardContent><CardFooter className="flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4"><Input type="text" placeholder="e.g., Solar System, World War II" value={mcqState.topic} onChange={(e) => setMcqState(prev => ({...prev, topic: e.target.value}))} onKeyDown={(e) => e.key === 'Enter' && handleGenerateMcq()} disabled={mcqState.isLoading} className="flex-grow" /><Button onClick={handleGenerateMcq} disabled={mcqState.isLoading} className="w-full sm:w-auto">{mcqState.isLoading ? 'Generating...' : 'Generate New MCQ'}</Button></CardFooter></Card>

          {/* 2. True/False Challenges */}
          <Card className="shadow-lg"><CardHeader><CardTitle className="text-xl font-headline flex items-center gap-2"><ToggleRight className="text-primary h-6 w-6" /> True/False Challenges</CardTitle><CardDescription>Quick decision-making for warmups. Earn +{POINTS_FOR_TRUE_FALSE_CORRECT} XP for correct answers.</CardDescription></CardHeader><CardContent className="space-y-4">{trueFalseState.isLoading ? (<div className="space-y-2"><Skeleton className="h-6 w-full" /><Skeleton className="h-10 w-full" /></div>) : trueFalseState.data ? (<div className="space-y-3"><p className="font-semibold">{trueFalseState.data.statement}</p><div className="flex gap-2 justify-center">{[true, false].map(val => { const isSelected = trueFalseState.selectedAnswer === val; const isCorrect = trueFalseState.data?.isTrue === val; const hasBeenAnswered = trueFalseState.selectedAnswer !== null; return (<Button key={String(val)} onClick={() => handleSelectTrueFalse(val)} disabled={hasBeenAnswered} className={cn("w-24", hasBeenAnswered && isCorrect && "border-green-500 bg-green-500/10 text-green-700", hasBeenAnswered && !isCorrect && isSelected && "border-red-500 bg-red-500/10 text-red-700", "disabled:opacity-100 disabled:cursor-not-allowed")}>{val ? "True" : "False"}{hasBeenAnswered && isCorrect && <CheckCircle2 className="ml-auto h-5 w-5" />}{hasBeenAnswered && !isCorrect && isSelected && <XCircle className="ml-auto h-5 w-5" />}</Button>) })}</div></div>) : (<div className="flex flex-col items-center justify-center text-center p-4 bg-secondary/30 rounded-md"><Lightbulb className="h-12 w-12 text-muted-foreground mb-4" /><p className="text-muted-foreground">Enter a topic to generate a True/False question.</p></div>)}</CardContent><CardFooter className="flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4"><Input type="text" placeholder="e.g., Biology, History" value={trueFalseState.topic} onChange={(e) => setTrueFalseState(prev => ({...prev, topic: e.target.value}))} onKeyDown={(e) => e.key === 'Enter' && handleGenerateTrueFalse()} disabled={trueFalseState.isLoading} className="flex-grow"/><Button onClick={handleGenerateTrueFalse} disabled={trueFalseState.isLoading} className="w-full sm:w-auto">{trueFalseState.isLoading ? 'Generating...' : 'New True/False'}</Button></CardFooter></Card>

          {/* 3. Match the Pairs */}
          <Card className="shadow-lg"><CardHeader><CardTitle className="text-xl font-headline flex items-center gap-2"><Link2 className="text-primary h-6 w-6" /> Match the Pairs</CardTitle><CardDescription>Connect terms to their meanings. Earn +{POINTS_FOR_MATCHING_CORRECT} XP for a full correct match.</CardDescription></CardHeader><CardContent className="space-y-4">{matchingState.isLoading ? (<div className="grid grid-cols-2 gap-4">{[...Array(4)].map((_, i) => (<React.Fragment key={i}><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></React.Fragment>))}</div>) : matchingState.data ? (<div className="grid grid-cols-2 gap-x-4 gap-y-2">{matchingState.data.pairs.map((pair, termIdx) => { const isTermSelected = matchingState.selectedTermIndex === termIdx; const matchedDefIndex = matchingState.shuffledDefs.findIndex(d => d.originalIndex === matchingState.matches[termIdx]); const isCorrect = matchingState.isFinished && matchingState.matches[termIdx] === termIdx; return (<React.Fragment key={termIdx}><Button variant={isTermSelected ? 'default' : 'outline'} onClick={() => handleSelectTerm(termIdx)} disabled={matchingState.isFinished || matchingState.matches[termIdx] !== null} className={cn("h-auto text-left justify-start p-2", matchingState.isFinished && (isCorrect ? "border-green-500" : "border-red-500"))}>{pair.term}</Button><Button variant="outline" onClick={() => handleSelectDef(termIdx)} disabled={matchingState.isFinished || matchingState.selectedTermIndex === null || matchingState.matches.includes(matchingState.shuffledDefs[termIdx].originalIndex)} className={cn("h-auto text-left justify-start p-2", matchedDefIndex !== -1 && "bg-secondary", matchingState.isFinished && matchingState.data.pairs[matchedDefIndex]?.term === matchingState.shuffledDefs[termIdx].definition ? "border-green-500" : "")}>{matchingState.shuffledDefs[termIdx].definition}</Button></React.Fragment>)})}{matchingState.matches.every(m => m !== null) && !matchingState.isFinished && <Button onClick={handleCheckMatches} className="col-span-2">Check Answers</Button>}</div>) : (<div className="flex flex-col items-center justify-center text-center p-4 bg-secondary/30 rounded-md"><Lightbulb className="h-12 w-12 text-muted-foreground mb-4" /><p className="text-muted-foreground">Enter a topic to generate a matching game.</p></div>)}</CardContent><CardFooter className="flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4"><Input type="text" placeholder="e.g., Chemistry Symbols, Capitals" value={matchingState.topic} onChange={(e) => setMatchingState(prev => ({...prev, topic: e.target.value}))} disabled={matchingState.isLoading} className="flex-grow"/><Button onClick={handleGenerateMatchingPairs} disabled={matchingState.isLoading} className="w-full sm:w-auto">{matchingState.isLoading ? 'Generating...' : 'New Matching Game'}</Button></CardFooter></Card>

          {/* 4. "Fill in the Blank" Mini-Quizzes */}
          <Card className="shadow-lg"><CardHeader><CardTitle className="text-xl font-headline flex items-center gap-2"><PenLine className="text-primary h-6 w-6" /> Fill in the Blank</CardTitle><CardDescription>Type a word or number. Earn +{POINTS_FOR_FILL_BLANK_CORRECT} for each correct blank.</CardDescription></CardHeader><CardContent className="space-y-4">{fillBlankState.isLoading ? (<div className="space-y-2"><Skeleton className="h-6 w-full" /><Skeleton className="h-10 w-1/2" /></div>) : fillBlankState.data ? (<div className="space-y-3"><div className="flex flex-wrap items-center gap-2 text-md">{(fillBlankState.data.question.split('[BLANK]')).map((part, i, arr) => (<React.Fragment key={i}><span>{part}</span>{i < arr.length - 1 && <Input type="text" placeholder="Your answer" value={fillBlankState.userAnswer} onChange={e => setFillBlankState(prev => ({...prev, userAnswer: e.target.value}))} onKeyDown={(e) => e.key === 'Enter' && handleCheckFillBlank()} disabled={fillBlankState.isSubmitted} className={cn("w-36 h-8", fillBlankState.isSubmitted && (fillBlankState.userAnswer.trim().toLowerCase() === fillBlankState.data.answer.toLowerCase() ? "border-green-500" : "border-red-500"))}/>}</React.Fragment>))}</div>{fillBlankState.isSubmitted && fillBlankState.userAnswer.trim().toLowerCase() !== fillBlankState.data.answer.toLowerCase() && <p className="text-sm text-red-500">Correct answer: <strong>{fillBlankState.data.answer}</strong></p>}<Button onClick={handleCheckFillBlank} disabled={fillBlankState.isSubmitted}>Check Answer</Button></div>) : (<div className="flex flex-col items-center justify-center text-center p-4 bg-secondary/30 rounded-md"><Lightbulb className="h-12 w-12 text-muted-foreground mb-4" /><p className="text-muted-foreground">Enter a topic to generate a fill-in-the-blank question.</p></div>)}</CardContent><CardFooter className="flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4"><Input type="text" placeholder="e.g., Human Anatomy" value={fillBlankState.topic} onChange={(e) => setFillBlankState(prev => ({...prev, topic: e.target.value}))} disabled={fillBlankState.isLoading} className="flex-grow"/><Button onClick={handleGenerateFillBlank} disabled={fillBlankState.isLoading} className="w-full sm:w-auto">{fillBlankState.isLoading ? 'Generating...' : 'New Fill-in-Blank'}</Button></CardFooter></Card>

          {/* 5. Timed Brain Boosters */}
          <Card className="shadow-lg"><CardHeader><CardTitle className="text-xl font-headline flex items-center gap-2"><Timer className="text-primary h-6 w-6" /> Timed Brain Boosters</CardTitle><CardDescription>Answer quickly! Earn +{POINTS_FOR_TIMED_CORRECT} XP for correct answer within time.</CardDescription></CardHeader><CardContent className="space-y-4">{timedState.isLoading ? (<div className="space-y-2"><Skeleton className="h-6 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-6 w-24" /></div>) : timedState.data ? (<div className="space-y-4"><p className="font-semibold">{timedState.data.question}</p><Input type="text" placeholder="Your answer" value={timedState.userAnswer} onChange={e => setTimedState(prev => ({...prev, userAnswer: e.target.value}))} onKeyDown={e => e.key === 'Enter' && handleCheckTimedQuestion()} disabled={timedState.isComplete} className={cn(timedState.isComplete && (timedState.userAnswer.trim().toLowerCase() === timedState.data.answer.toLowerCase() ? 'border-green-500' : 'border-red-500'))}/><div className={cn("text-lg font-bold", timedState.timer <= 5 ? "text-destructive" : "text-muted-foreground")}>Time left: {timedState.timer}s</div>{timedState.isComplete && <Button onClick={handleGenerateTimedQuestion}>Play Again</Button>}</div>) : (<div className="flex flex-col items-center justify-center text-center p-4 bg-secondary/30 rounded-md"><Lightbulb className="h-12 w-12 text-muted-foreground mb-4" /><p className="text-muted-foreground">Enter a topic to start a timed challenge.</p></div>)}</CardContent><CardFooter className="flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4"><Input type="text" placeholder="e.g., Quick Math" value={timedState.topic} onChange={(e) => setTimedState(prev => ({...prev, topic: e.target.value}))} disabled={timedState.isLoading || (!!timedState.data && !timedState.isComplete)} className="flex-grow"/><Button onClick={handleGenerateTimedQuestion} disabled={timedState.isLoading || (!!timedState.data && !timedState.isComplete)} className="w-full sm:w-auto">{timedState.isLoading ? 'Generating...' : 'Start Timed Challenge'}</Button></CardFooter></Card>

        </section>
      </div>
    </AppShell>
  );
}
